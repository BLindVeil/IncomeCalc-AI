import { callMCPTool } from '@/sdk/core/mcp-client';

/**
 * MCP Response wrapper interface - MANDATORY
 * All MCP tools return responses in this wrapped format
 */
interface MCPToolResponse {
  content: Array<{
    type: "text";
    text: string; // JSON string containing actual tool data
  }>;
}

/**
 * Input parameters for batch getting data from Google Sheets
 */
export interface BatchGetParams {
  /**
   * The unique identifier of the Google Spreadsheet from which data will be retrieved.
   * This is the ID found in the spreadsheet URL after /d/.
   * You can provide either the spreadsheet ID directly or a full Google Sheets URL (the ID will be extracted automatically).
   * @example "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
   */
  spreadsheet_id: string;

  /**
   * A list of cell ranges in A1 notation from which to retrieve data.
   * If this list is omitted, empty, or contains only empty strings, all data from the first sheet of the spreadsheet will be fetched.
   * Empty strings in the list are automatically filtered out.
   * 
   * Supported formats:
   * (1) Bare sheet name like 'Sheet1' to get all data from that sheet
   * (2) Sheet with range like 'Sheet1!A1:B2'
   * (3) Just cell reference like 'A1:B2' (uses first sheet)
   * 
   * For sheet names with spaces or special characters, enclose in single quotes (e.g., "'My Sheet'" or "'My Sheet'!A1:B2").
   * 
   * IMPORTANT: For large sheets, always use bounded ranges with explicit row limits (e.g., 'Sheet1!A1:Z10000' instead of 'Sheet1!A:Z').
   * Unbounded column ranges like 'A:Z' on sheets with >10,000 rows may cause timeouts or errors.
   * If you need all data from a large sheet, fetch in chunks of 10,000 rows at a time.
   * 
   * @example ["Sheet1", "Sheet1!A1:B2", "Sheet1!A1:Z10000", "Sheet1!1:2", "'My Sheet'!A1:Z500", "A1:B2"]
   */
  ranges?: string[];

  /**
   * How values should be rendered in the output.
   * - FORMATTED_VALUE: Values are calculated and formatted (default)
   * - UNFORMATTED_VALUE: Values are calculated but not formatted
   * - FORMULA: Values are not calculated; the formula is returned instead
   * @default "FORMATTED_VALUE"
   */
  valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";

  /**
   * How dates and times should be rendered in the output.
   * - SERIAL_NUMBER: Dates are returned as serial numbers (default)
   * - FORMATTED_STRING: Dates returned as formatted strings
   * @default "SERIAL_NUMBER"
   */
  dateTimeRenderOption?: "SERIAL_NUMBER" | "FORMATTED_STRING";

  /**
   * Whether to filter out empty strings from the ranges list
   * @default false
   */
  empty_strings_filtered?: boolean;
}

/**
 * Value range object containing data from a specific range
 */
export interface ValueRange {
  /**
   * The A1-notation of the range that the values cover, including the sheet name (e.g., 'Sheet1!A1:Z999').
   * On output, this reflects the full requested range, while the returned values omit trailing empty rows/columns.
   */
  range: string;

  /**
   * Indicates whether the values are grouped by rows or by columns.
   * The outer array of 'values' corresponds to this dimension ('ROWS' means each inner array is a row; 'COLUMNS' means each inner array is a column).
   */
  majorDimension?: string;

  /**
   * The data in the range.
   * The outer array corresponds to the major dimension (rows if majorDimension=ROWS, columns if majorDimension=COLUMNS).
   * Each inner array contains the cell values for that row or column.
   * Trailing empty rows/columns are omitted.
   * 
   * Returned value types depend on the valueRenderOption used in the request:
   * - formatted strings by default
   * - or unformatted numbers/booleans if UNFORMATTED_VALUE is used
   * 
   * Depending on the data and client, empty rows/columns may appear as empty arrays,
   * and empty cells may be omitted at the end, represented as empty strings, or as null.
   */
  values?: Array<Array<string | number | boolean | null>>;
}

/**
 * Output data from batch getting Google Sheets data
 */
export interface BatchGetData {
  /**
   * The ID of the spreadsheet from which the values were retrieved.
   */
  spreadsheetId: string;

  /**
   * An array of ValueRange objects, one for each requested range.
   * The order of items matches the order of the ranges specified in the request.
   */
  valueRanges: ValueRange[];

  /**
   * Message about any automatic modifications made to the request during execution.
   */
  composio_execution_message?: string;
}

/**
 * Internal response wrapper interface from outputSchema
 */
interface BatchGetResponse {
  /**
   * Whether or not the action execution was successful or not
   */
  successful: boolean;

  /**
   * Data from the action execution
   */
  data?: BatchGetData;

  /**
   * Error if any occurred during the execution of the action
   */
  error?: string;
}

/**
 * Batch get data from multiple ranges in a Google Spreadsheet.
 * 
 * This tool retrieves data from one or more cell ranges in a Google Sheets spreadsheet.
 * You can specify multiple ranges and control how values and dates are formatted in the output.
 * 
 * @param params - The input parameters for batch getting spreadsheet data
 * @returns Promise resolving to the batch get data containing value ranges
 * @throws Error if required parameters are missing or if the tool execution fails
 * 
 * @example
 * const result = await request({
 *   spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
 *   ranges: ['Sheet1!A1:B10', 'Sheet2!C1:D5'],
 *   valueRenderOption: 'FORMATTED_VALUE'
 * });
 */
export async function request(params: BatchGetParams): Promise<BatchGetData> {
  // Validate required parameters
  if (!params.spreadsheet_id) {
    throw new Error('Missing required parameter: spreadsheet_id');
  }

  // CRITICAL: Use MCPToolResponse and parse JSON response
  const mcpResponse = await callMCPTool<MCPToolResponse, BatchGetParams>(
    '686de48c6fd1cae1afbb55ba',
    'GOOGLESHEETS_BATCH_GET',
    params
  );

  if (!mcpResponse.content?.[0]?.text) {
    throw new Error('Invalid MCP response format: missing content[0].text');
  }

  let toolData: BatchGetResponse;
  try {
    toolData = JSON.parse(mcpResponse.content[0].text);
  } catch (parseError) {
    throw new Error(
      `Failed to parse MCP response JSON: ${
        parseError instanceof Error ? parseError.message : 'Unknown error'
      }`
    );
  }

  if (!toolData.successful) {
    throw new Error(toolData.error || 'MCP tool execution failed');
  }

  if (!toolData.data) {
    throw new Error('MCP tool returned successful response but no data');
  }

  return toolData.data;
}