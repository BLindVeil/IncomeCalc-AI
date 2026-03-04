# Google Sheets Batch Get - Cheatsheet

## Overview

This module provides a function to batch retrieve data from multiple ranges in a Google Spreadsheet using the Google Sheets MCP tool.

## Installation/Import

```typescript
import { request as batchGetSheets } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_GET';
```

## Function Signature

```typescript
async function request(params: BatchGetParams): Promise<BatchGetData>
```

## Parameters

### `BatchGetParams`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `spreadsheet_id` | `string` | **Yes** | - | The unique identifier of the Google Spreadsheet (found in the URL after `/d/`) |
| `ranges` | `string[]` | No | - | Array of cell ranges in A1 notation to retrieve data from |
| `valueRenderOption` | `"FORMATTED_VALUE"` \| `"UNFORMATTED_VALUE"` \| `"FORMULA"` | No | `"FORMATTED_VALUE"` | How values should be rendered |
| `dateTimeRenderOption` | `"SERIAL_NUMBER"` \| `"FORMATTED_STRING"` | No | `"SERIAL_NUMBER"` | How dates/times should be rendered |
| `empty_strings_filtered` | `boolean` | No | `false` | Whether to filter empty strings from ranges |

### Range Format Examples

- `"Sheet1"` - All data from Sheet1
- `"Sheet1!A1:B2"` - Specific range in Sheet1
- `"Sheet1!A1:Z10000"` - Bounded range (recommended for large sheets)
- `"'My Sheet'!A1:B10"` - Sheet name with spaces (use single quotes)
- `"A1:B2"` - Range in first sheet

**Important**: For large sheets (>10,000 rows), always use bounded ranges with explicit row limits to avoid timeouts.

## Return Value

### `BatchGetData`

```typescript
{
  spreadsheetId: string;
  valueRanges: Array<{
    range: string;
    majorDimension?: string;
    values?: Array<Array<string | number | boolean | null>>;
  }>;
  composio_execution_message?: string;
}
```

- `spreadsheetId`: The ID of the spreadsheet
- `valueRanges`: Array of value ranges matching the requested ranges
  - `range`: The A1 notation of the range
  - `majorDimension`: "ROWS" or "COLUMNS" indicating data organization
  - `values`: 2D array of cell values
- `composio_execution_message`: Optional message about request modifications

## Usage Examples

### Example 1: Get data from multiple ranges

```typescript
import { request as batchGetSheets } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_GET';

const result = await batchGetSheets({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  ranges: ['Sheet1!A1:B10', 'Sheet2!C1:D5'],
  valueRenderOption: 'FORMATTED_VALUE'
});

console.log(result.valueRanges[0].values); // First range data
console.log(result.valueRanges[1].values); // Second range data
```

### Example 2: Get all data from a sheet with unformatted values

```typescript
import { request as batchGetSheets } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_GET';

const result = await batchGetSheets({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  ranges: ['Sheet1'],
  valueRenderOption: 'UNFORMATTED_VALUE',
  dateTimeRenderOption: 'FORMATTED_STRING'
});

// Access the data
result.valueRanges.forEach(range => {
  console.log(`Range: ${range.range}`);
  console.log(`Data:`, range.values);
});
```

### Example 3: Get formulas instead of calculated values

```typescript
import { request as batchGetSheets } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_GET';

const result = await batchGetSheets({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  ranges: ['Sheet1!A1:C10'],
  valueRenderOption: 'FORMULA'
});

// Will return formulas like "=SUM(A1:A10)" instead of calculated values
console.log(result.valueRanges[0].values);
```

### Example 4: Handle large sheets with bounded ranges

```typescript
import { request as batchGetSheets } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_GET';

// Fetch in chunks of 10,000 rows
const chunk1 = await batchGetSheets({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  ranges: ['Sheet1!A1:Z10000']
});

const chunk2 = await batchGetSheets({
  spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  ranges: ['Sheet1!A10001:Z20000']
});
```

## Error Handling

The function may throw errors in the following cases:

1. **Missing required parameter**: If `spreadsheet_id` is not provided
   ```typescript
   Error: Missing required parameter: spreadsheet_id
   ```

2. **Invalid MCP response**: If the MCP tool returns an invalid response format
   ```typescript
   Error: Invalid MCP response format: missing content[0].text
   ```

3. **JSON parsing error**: If the response cannot be parsed as JSON
   ```typescript
   Error: Failed to parse MCP response JSON: [error details]
   ```

4. **Tool execution failure**: If the Google Sheets API returns an error
   ```typescript
   Error: [error message from Google Sheets API]
   ```

5. **No data returned**: If the tool succeeds but returns no data
   ```typescript
   Error: MCP tool returned successful response but no data
   ```

### Error Handling Example

```typescript
import { request as batchGetSheets } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_GET';

try {
  const result = await batchGetSheets({
    spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    ranges: ['Sheet1!A1:B10']
  });
  
  console.log('Data retrieved successfully:', result);
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to get spreadsheet data:', error.message);
  }
}
```

## Notes

- The function works in both browser and Node.js environments
- Empty trailing rows and columns are automatically omitted from the response
- The order of `valueRanges` in the response matches the order of `ranges` in the request
- For sheets with spaces or special characters in names, wrap the name in single quotes
- Always use bounded ranges for large sheets to avoid timeouts