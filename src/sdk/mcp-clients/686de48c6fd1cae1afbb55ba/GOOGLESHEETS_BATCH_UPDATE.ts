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
 * Input parameters for batch updating a Google Sheet
 */
export interface BatchUpdateParams {
  /**
   * The unique identifier of the Google Sheets spreadsheet to be updated. Must be an alphanumeric string 
   * (with hyphens and underscores allowed) typically 44 characters long. Can be found in the spreadsheet 
   * URL between '/d/' and '/edit'. Example: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit' 
   * has ID '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'.
   */
  spreadsheet_id: string;

  /**
   * The name of the specific sheet (tab) within the spreadsheet to update. Case-insensitive matching is 
   * supported (e.g., 'sheet1' will match 'Sheet1'). Note: Default sheet names are locale-dependent 
   * (e.g., 'Sheet1' in English, 'Foglio1' in Italian, 'Hoja 1' in Spanish, '시트1' in Korean, 'Feuille 1' in French). 
   * If you specify a common default name like 'Sheet1' and it doesn't exist, the action will automatically use 
   * the first sheet in the spreadsheet.
   */
  sheet_name: string;

  /**
   * A 2D array of cell values where each inner array represents a row. Values can be strings, numbers, 
   * booleans, or None/null for empty cells. Ensure columns are properly aligned across rows.
   */
  values: Array<Array<string | number | boolean | null>>;

  /**
   * The starting cell for the update range, specified in A1 notation (e.g., 'A1', 'B2'). The update will 
   * extend from this cell to the right and down, based on the provided values. If omitted or set to null, 
   * values are appended as new rows to the sheet. Note: No placeholder value is needed - simply omit this 
   * field or set it to null to trigger append mode.
   */
  first_cell_location?: string;

  /**
   * If set to True, the response will include the updated values in the 'spreadsheet.responses[].updatedData' 
   * field. The updatedData object contains 'range' (A1 notation), 'majorDimension' (ROWS), and 'values' 
   * (2D array of the actual cell values after the update).
   */
  includeValuesInResponse?: boolean;

  /**
   * How input data should be interpreted. 'USER_ENTERED': Values are parsed as if typed by a user 
   * (e.g., strings may become numbers/dates, formulas are calculated). 'RAW': Values are stored exactly 
   * as provided without parsing (e.g., '123' stays as string, '=SUM(A1:B1)' is not calculated).
   */
  valueInputOption?: 'RAW' | 'USER_ENTERED';
}

/**
 * Details of a single update operation within the batch
 */
export interface BatchUpdateOperationResponse {
  /**
   * The unique ID of the spreadsheet for this specific update response (typically same as the parent spreadsheetId).
   */
  spreadsheetId?: string;

  /**
   * Number of cells that were updated by this operation.
   */
  updatedCells?: number;

  /**
   * Number of columns impacted by this operation.
   */
  updatedColumns?: number;

  /**
   * Contains the updated cell values when includeValuesInResponse is True. Structure: 
   * {'range': 'Sheet1!A1:C3', 'majorDimension': 'ROWS', 'values': [['row1col1', 'row1col2'], ['row2col1', 'row2col2']]}. 
   * Will be null when includeValuesInResponse is False or not set.
   */
  updatedData?: Record<string, any> | null;

  /**
   * A1-notation range that was updated by this operation. May be null if the API did not return a specific range.
   */
  updatedRange?: string | null;

  /**
   * Number of rows impacted by this operation.
   */
  updatedRows?: number;
}

/**
 * Container for aggregated update stats and per-request update replies for the updated spreadsheet
 */
export interface SpreadsheetUpdateResult {
  /**
   * The unique ID of the Google Sheets spreadsheet affected by the batch update.
   */
  spreadsheetId?: string;

  /**
   * Aggregate total number of cells updated across all operations in the batch.
   */
  totalUpdatedCells?: number;

  /**
   * Aggregate total number of columns impacted across all operations in the batch.
   */
  totalUpdatedColumns?: number;

  /**
   * Aggregate total number of rows impacted across all operations in the batch.
   */
  totalUpdatedRows?: number;

  /**
   * Number of sheets within the spreadsheet that were affected by the batch update.
   */
  totalUpdatedSheets?: number;

  /**
   * List of individual update responses corresponding to each request in the batch.
   */
  responses?: BatchUpdateOperationResponse[];
}

/**
 * Output data from the batch update operation
 */
export interface BatchUpdateData {
  /**
   * Container for aggregated update stats and per-request update replies for the updated spreadsheet.
   */
  spreadsheet: SpreadsheetUpdateResult;

  /**
   * Optional message explaining any automatic modifications made to the request parameters.
   */
  composio_execution_message?: string;
}

/**
 * Internal response wrapper interface from outputSchema
 */
interface BatchUpdateResponseWrapper {
  /**
   * Whether or not the action execution was successful or not
   */
  successful: boolean;

  /**
   * Data from the action execution
   */
  data?: BatchUpdateData;

  /**
   * Error if any occurred during the execution of the action
   */
  error?: string;
}

/**
 * Write values to ONE range in a Google Sheet, or append as new rows if no start cell is given.
 *
 * IMPORTANT: This tool does NOT accept the Google Sheets API's native batch format.
 * - WRONG: {"data": [{"range": "Sheet1!A1", "values": [[...]]}], ...}  (Google API format)
 * - CORRECT: {"sheet_name": "Sheet1", "values": [[...]], "first_cell_location": "A1", ...}
 *
 * To update MULTIPLE ranges, make separate calls to this tool for each range.
 *
 * @param params - The input parameters for the batch update operation
 * @returns Promise resolving to the batch update result data
 * @throws Error if required parameters are missing or if the tool execution fails
 *
 * @example
 * const result = await request({
 *   spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
 *   sheet_name: 'Sheet1',
 *   values: [['Item', 'Cost'], ['Wheel', 20.5], ['Screw', 0.5]],
 *   first_cell_location: 'A1'
 * });
 */
export async function request(params: BatchUpdateParams): Promise<BatchUpdateData> {
  // Validate required parameters
  if (!params.spreadsheet_id) {
    throw new Error('Missing required parameter: spreadsheet_id');
  }
  
  if (!params.sheet_name) {
    throw new Error('Missing required parameter: sheet_name');
  }
  
  if (!params.values) {
    throw new Error('Missing required parameter: values');
  }

  // CRITICAL: Use MCPToolResponse and parse JSON response
  const mcpResponse = await callMCPTool<MCPToolResponse, BatchUpdateParams>(
    '686de48c6fd1cae1afbb55ba',
    'GOOGLESHEETS_BATCH_UPDATE',
    params
  );

  if (!mcpResponse.content?.[0]?.text) {
    throw new Error('Invalid MCP response format: missing content[0].text');
  }

  let toolData: BatchUpdateResponseWrapper;
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