# Google Sheets Batch Update - Cheatsheet

## Overview

This module provides a TypeScript interface for batch updating Google Sheets. It allows you to write values to a specific range or append new rows to a sheet.

## Installation/Import

```typescript
import { request as batchUpdateGoogleSheet } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_UPDATE';
```

## Function Signature

```typescript
async function request(params: BatchUpdateParams): Promise<BatchUpdateData>
```

## Parameters

### BatchUpdateParams

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spreadsheet_id` | `string` | ✓ | The unique identifier of the Google Sheets spreadsheet (found in the URL) |
| `sheet_name` | `string` | ✓ | The name of the specific sheet/tab to update (case-insensitive) |
| `values` | `Array<Array<string \| number \| boolean \| null>>` | ✓ | 2D array of cell values where each inner array represents a row |
| `first_cell_location` | `string` | ✗ | Starting cell in A1 notation (e.g., 'A1'). Omit to append as new rows |
| `includeValuesInResponse` | `boolean` | ✗ | If true, response includes updated values (default: false) |
| `valueInputOption` | `'RAW' \| 'USER_ENTERED'` | ✗ | How to interpret input data (default: 'USER_ENTERED') |

### Value Input Options

- **`USER_ENTERED`**: Values are parsed as if typed by a user (formulas calculated, strings converted to numbers/dates)
- **`RAW`**: Values stored exactly as provided without parsing

## Return Value

Returns a `Promise<BatchUpdateData>` containing:

```typescript
{
  spreadsheet: {
    spreadsheetId: string;
    totalUpdatedCells: number;
    totalUpdatedRows: number;
    totalUpdatedColumns: number;
    totalUpdatedSheets: number;
    responses: Array<{
      spreadsheetId: string;
      updatedCells: number;
      updatedRows: number;
      updatedColumns: number;
      updatedRange: string;
      updatedData?: Record<string, any>; // Only if includeValuesInResponse is true
    }>;
  };
  composio_execution_message?: string;
}
```

## Usage Examples

### Example 1: Update Specific Range

```typescript
import { request as batchUpdateGoogleSheet } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_UPDATE';

async function updateInventory() {
  const result = await batchUpdateGoogleSheet({
    spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheet_name: 'Inventory',
    first_cell_location: 'A1',
    values: [
      ['Item', 'Cost', 'Stocked', 'Ship Date'],
      ['Wheel', 20.5, true, '2020-06-01'],
      ['Screw', 0.5, true, '2020-06-03'],
      ['Nut', 0.25, false, '2020-06-02']
    ],
    valueInputOption: 'USER_ENTERED'
  });

  console.log(`Updated ${result.spreadsheet.totalUpdatedCells} cells`);
  console.log(`Updated range: ${result.spreadsheet.responses?.[0]?.updatedRange}`);
}
```

### Example 2: Append New Rows

```typescript
import { request as batchUpdateGoogleSheet } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_UPDATE';

async function appendSalesData() {
  const result = await batchUpdateGoogleSheet({
    spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheet_name: 'Sales',
    // Omit first_cell_location to append as new rows
    values: [
      ['2024-01-15', 'Product A', 150.00],
      ['2024-01-15', 'Product B', 200.00]
    ]
  });

  console.log(`Appended ${result.spreadsheet.totalUpdatedRows} rows`);
}
```

### Example 3: Update with Response Values

```typescript
import { request as batchUpdateGoogleSheet } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_UPDATE';

async function updateWithVerification() {
  const result = await batchUpdateGoogleSheet({
    spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheet_name: 'Budget',
    first_cell_location: 'B2',
    values: [
      ['=SUM(C2:D2)', 100, 200],
      ['=SUM(C3:D3)', 150, 250]
    ],
    includeValuesInResponse: true,
    valueInputOption: 'USER_ENTERED'
  });

  // Access the updated values
  const updatedData = result.spreadsheet.responses?.[0]?.updatedData;
  console.log('Updated values:', updatedData?.values);
}
```

### Example 4: Raw Value Input

```typescript
import { request as batchUpdateGoogleSheet } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_UPDATE';

async function updateRawValues() {
  const result = await batchUpdateGoogleSheet({
    spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    sheet_name: 'Data',
    first_cell_location: 'A1',
    values: [
      ['=SUM(A1:B1)', '123', 'true'] // Stored as literal strings
    ],
    valueInputOption: 'RAW' // Don't parse formulas or convert types
  });

  console.log('Raw values stored successfully');
}
```

## Error Handling

The function throws errors in the following cases:

1. **Missing Required Parameters**: If `spreadsheet_id`, `sheet_name`, or `values` are not provided
2. **Invalid MCP Response**: If the MCP tool returns an invalid response format
3. **JSON Parse Error**: If the response cannot be parsed as JSON
4. **Tool Execution Failure**: If the MCP tool reports unsuccessful execution
5. **Missing Data**: If the tool returns success but no data

### Error Handling Example

```typescript
import { request as batchUpdateGoogleSheet } from '@/sdk/mcp-clients/686de48c6fd1cae1afbb55ba/GOOGLESHEETS_BATCH_UPDATE';

async function safeUpdate() {
  try {
    const result = await batchUpdateGoogleSheet({
      spreadsheet_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheet_name: 'Sheet1',
      values: [['A', 'B'], ['C', 'D']]
    });
    
    console.log('Update successful:', result);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Update failed:', error.message);
      
      // Handle specific error cases
      if (error.message.includes('Missing required parameter')) {
        console.error('Please provide all required parameters');
      } else if (error.message.includes('Failed to parse')) {
        console.error('Invalid response from Google Sheets API');
      }
    }
  }
}
```

## Important Notes

1. **Single Range Updates**: This tool updates ONE range per call. To update multiple ranges, make separate calls.
2. **Append Mode**: Omit `first_cell_location` or set it to `null` to append values as new rows.
3. **Sheet Name Matching**: Sheet names are case-insensitive. Default sheet names are locale-dependent.
4. **Value Interpretation**: Use `USER_ENTERED` for smart parsing (formulas, dates) or `RAW` for literal values.
5. **Spreadsheet ID**: Found in the URL between `/d/` and `/edit`.

## Common Use Cases

- Updating inventory data
- Appending sales records
- Bulk data imports
- Automated report generation
- Form response collection
- Budget tracking updates