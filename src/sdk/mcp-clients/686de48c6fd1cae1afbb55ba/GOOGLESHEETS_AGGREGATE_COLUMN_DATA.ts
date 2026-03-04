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
 * Input parameters for aggregating column data in Google Sheets
 */
export interface AggregateColumnDataParams {
  /**
   * The unique identifier of the Google Sheets spreadsheet.
   * @example "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
   */
  spreadsheet_id: string;

  /**
   * The name of the specific sheet within the spreadsheet. Matching is case-insensitive.
   * If no exact match is found, partial matches will be attempted (e.g., 'overview' will match 'Overview 2025').
   * @example "Sheet1"
   * @example "Sales Data"
   */
  sheet_name: string;

  /**
   * The column to aggregate data from. Can be a letter (e.g., 'C', 'D') or column name from header row (e.g., 'Sales', 'Revenue').
   * @example "D"
   * @example "Sales"
   * @example "Revenue"
   */
  target_column: string;

  /**
   * The mathematical operation to perform on the target column values.
   * @example "sum"
   * @example "average"
   * @example "count"
   * @example "min"
   * @example "max"
   * @example "percentage"
   */
  operation: "sum" | "average" | "count" | "min" | "max" | "percentage";

  /**
   * The column to search in for filtering rows. Can be a letter (e.g., 'A', 'B') or column name from header row (e.g., 'Region', 'Department').
   * If not provided, all rows in the target column will be aggregated without filtering.
   * @example "A"
   * @example "Region"
   * @example "Department"
   */
  search_column?: string;

  /**
   * The exact value to search for in the search column. Case-sensitive by default.
   * If not provided (or if search_column is not provided), all rows in the target column will be aggregated without filtering.
   * @example "HSR"
   * @example "Sales"
   * @example "North Region"
   */
  search_value?: string;

  /**
   * Whether the first row contains column headers. If True, column names can be used for search_column and target_column.
   * @default true
   * @example true
   * @example false
   */
  has_header_row?: boolean;

  /**
   * Whether the search should be case-sensitive.
   * @default true
   * @example true
   * @example false
   */
  case_sensitive?: boolean;

  /**
   * For percentage operation, the total value to calculate percentage against.
   * If not provided, uses sum of all values in target column.
   * @example 10000
   * @example 50000.5
   */
  percentage_total?: number;
}

/**
 * Search details for the aggregation operation
 */
export interface SearchDetails {
  /**
   * Whether the search on search_column was performed in a case-sensitive manner.
   */
  case_sensitive: boolean;

  /**
   * The column from which values were aggregated.
   */
  target_column: string;

  /**
   * The column used to filter rows (e.g., a header name or letter reference). None if aggregating all rows.
   */
  search_column?: string;

  /**
   * The value searched for in search_column. None if aggregating all rows without filtering.
   */
  search_value?: string;

  /**
   * True if all rows were aggregated without filtering, False if filtering was applied.
   * @default false
   */
  aggregated_all_rows?: boolean;
}

/**
 * Output data from the aggregate column data operation
 */
export interface AggregateColumnData {
  /**
   * Total number of rows that matched the search condition in the search_column,
   * regardless of whether the target_column value was usable for the aggregation.
   */
  matching_rows_count: number;

  /**
   * The aggregation performed on the target_column for rows matching the search criteria.
   */
  operation: string;

  /**
   * The number of target_column values that were actually processed in the aggregation (e.g., numeric values).
   * May be less than matching_rows_count if some values are blank or non-numeric.
   */
  processed_values_count: number;

  /**
   * The numeric outcome of the aggregation. For percentage operations, this is a percentage value
   * and may exceed 100 depending on context.
   */
  result: number;

  /**
   * Details of the search/filter used to select rows prior to aggregation.
   */
  search_details: SearchDetails;

  /**
   * The numeric values from target_column that were included in the aggregation.
   * May be empty if no values were processed.
   */
  values_processed?: number[];
}

/**
 * Internal response wrapper interface from outputSchema
 */
interface AggregateColumnDataResponse {
  /**
   * Whether or not the action execution was successful or not
   */
  successful: boolean;

  /**
   * Data from the action execution
   */
  data?: AggregateColumnData;

  /**
   * Error if any occurred during the execution of the action
   */
  error?: string;
}

/**
 * Aggregates data from a Google Sheets column based on search criteria.
 * Searches for rows matching a column value and performs mathematical operations
 * (sum, average, count, min, max, percentage) on data from another column.
 *
 * @param params - The input parameters for the aggregation operation
 * @returns Promise resolving to the aggregation result data
 * @throws Error if required parameters are missing or if the tool execution fails
 *
 * @example
 * const result = await request({
 *   spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
 *   sheet_name: 'Sales Data',
 *   target_column: 'Revenue',
 *   operation: 'sum',
 *   search_column: 'Region',
 *   search_value: 'North'
 * });
 */
export async function request(params: AggregateColumnDataParams): Promise<AggregateColumnData> {
  // Validate required parameters
  if (!params.spreadsheet_id) {
    throw new Error('Missing required parameter: spreadsheet_id');
  }
  if (!params.sheet_name) {
    throw new Error('Missing required parameter: sheet_name');
  }
  if (!params.target_column) {
    throw new Error('Missing required parameter: target_column');
  }
  if (!params.operation) {
    throw new Error('Missing required parameter: operation');
  }

  // Validate operation enum
  const validOperations = ['sum', 'average', 'count', 'min', 'max', 'percentage'];
  if (!validOperations.includes(params.operation)) {
    throw new Error(
      `Invalid operation: ${params.operation}. Must be one of: ${validOperations.join(', ')}`
    );
  }

  // CRITICAL: Use MCPToolResponse and parse JSON response
  const mcpResponse = await callMCPTool<MCPToolResponse, AggregateColumnDataParams>(
    '686de48c6fd1cae1afbb55ba',
    'GOOGLESHEETS_AGGREGATE_COLUMN_DATA',
    params
  );

  if (!mcpResponse.content?.[0]?.text) {
    throw new Error('Invalid MCP response format: missing content[0].text');
  }

  let toolData: AggregateColumnDataResponse;
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