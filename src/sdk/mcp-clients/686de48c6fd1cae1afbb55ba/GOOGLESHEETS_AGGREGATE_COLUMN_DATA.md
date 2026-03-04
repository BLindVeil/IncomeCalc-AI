# Google Sheets Aggregate Column Data

Aggregates data from a Google Sheets column based on search criteria. Performs mathematical operations (sum, average, count, min, max, percentage) on filtered or all rows.

## Installation/Import

```typescript
import { request as aggregateColumnData } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_AGGREGATE_COLUMN_DATA';
```

## Function Signature

```typescript
async function request(params: AggregateColumnDataParams): Promise<AggregateColumnData>
```

## Parameters

### Required Parameters

- **spreadsheet_id** (string): The unique identifier of the Google Sheets spreadsheet
  - Example: `"1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"`

- **sheet_name** (string): The name of the specific sheet within the spreadsheet (case-insensitive, supports partial matching)
  - Example: `"Sheet1"`, `"Sales Data"`

- **target_column** (string): The column to aggregate data from (letter or header name)
  - Example: `"D"`, `"Sales"`, `"Revenue"`

- **operation** (string): The mathematical operation to perform
  - Valid values: `"sum"`, `"average"`, `"count"`, `"min"`, `"max"`, `"percentage"`

### Optional Parameters

- **search_column** (string): Column to search in for filtering rows (letter or header name)
  - If not provided, all rows are aggregated
  - Example: `"A"`, `"Region"`, `"Department"`

- **search_value** (string): Exact value to search for in the search column
  - If not provided, all rows are aggregated
  - Example: `"HSR"`, `"Sales"`, `"North Region"`

- **has_header_row** (boolean): Whether the first row contains column headers
  - Default: `true`

- **case_sensitive** (boolean): Whether the search should be case-sensitive
  - Default: `true`

- **percentage_total** (number): For percentage operation, the total value to calculate against
  - If not provided, uses sum of all values in target column
  - Example: `10000`, `50000.5`

## Return Value

Returns a `Promise<AggregateColumnData>` with the following structure:

```typescript
{
  matching_rows_count: number;        // Total rows matching search criteria
  operation: string;                  // Operation performed
  processed_values_count: number;     // Number of values actually processed
  result: number;                     // Numeric result of aggregation
  search_details: {
    case_sensitive: boolean;
    target_column: string;
    search_column?: string;
    search_value?: string;
    aggregated_all_rows?: boolean;
  };
  values_processed?: number[];        // Array of values included in aggregation
}
```

## Usage Examples

### Example 1: Sum all revenue in a specific region

```typescript
const result = await aggregateColumnData({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  sheet_name: 'Sales Data',
  target_column: 'Revenue',
  operation: 'sum',
  search_column: 'Region',
  search_value: 'North',
  has_header_row: true
});

console.log(`Total revenue: ${result.result}`);
console.log(`Rows processed: ${result.processed_values_count}`);
```

### Example 2: Calculate average of all values in a column

```typescript
const result = await aggregateColumnData({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  sheet_name: 'Sheet1',
  target_column: 'D',
  operation: 'average',
  has_header_row: false
});

console.log(`Average: ${result.result}`);
```

### Example 3: Count rows matching criteria

```typescript
const result = await aggregateColumnData({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  sheet_name: 'Employee Data',
  target_column: 'Salary',
  operation: 'count',
  search_column: 'Department',
  search_value: 'Sales',
  case_sensitive: false
});

console.log(`Number of sales employees: ${result.matching_rows_count}`);
```

### Example 4: Calculate percentage

```typescript
const result = await aggregateColumnData({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  sheet_name: 'Budget',
  target_column: 'Spent',
  operation: 'percentage',
  search_column: 'Category',
  search_value: 'Marketing',
  percentage_total: 100000
});

console.log(`Marketing spent ${result.result}% of total budget`);
```

### Example 5: Find minimum/maximum values

```typescript
const maxResult = await aggregateColumnData({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  sheet_name: 'Sales Data',
  target_column: 'Revenue',
  operation: 'max',
  search_column: 'Quarter',
  search_value: 'Q1'
});

console.log(`Highest Q1 revenue: ${maxResult.result}`);
```

## Error Handling

The function throws errors in the following cases:

1. **Missing required parameters**: If `spreadsheet_id`, `sheet_name`, `target_column`, or `operation` is not provided
2. **Invalid operation**: If operation is not one of: sum, average, count, min, max, percentage
3. **Invalid MCP response**: If the response format is incorrect or missing data
4. **JSON parsing errors**: If the MCP response cannot be parsed
5. **Tool execution failure**: If the Google Sheets API returns an error

### Error Handling Example

```typescript
try {
  const result = await aggregateColumnData({
    spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheet_name: 'Sales Data',
    target_column: 'Revenue',
    operation: 'sum'
  });
  console.log('Aggregation result:', result);
} catch (error) {
  if (error instanceof Error) {
    console.error('Aggregation failed:', error.message);
  }
}
```

## Notes

- Column references can be either letters (e.g., 'A', 'B', 'C') or header names if `has_header_row` is true
- Sheet name matching is case-insensitive and supports partial matches
- If `search_column` or `search_value` is not provided, all rows in the target column are aggregated
- The `processed_values_count` may be less than `matching_rows_count` if some cells are blank or non-numeric
- For percentage operations, the result may exceed 100% depending on the context
- Case sensitivity only applies to the search operation, not to column/sheet name matching