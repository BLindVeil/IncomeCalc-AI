export type McpServerId = keyof typeof MCP_SERVERS;

// { "mcp-id": { id: string, name: string, url: string } }
export const MCP_SERVERS = {
  "6875e6198345ff1a8579cd8a": {
    "id": "6875e6198345ff1a8579cd8a",
    "name": "Perplexity Search",
    "url": "https://backend.composio.dev/v3/mcp/9207cb44-ab87-4f9a-8920-79c77744e294/mcp?user_id=699a7e02c62b8b13bb143e70"
  },
  "686de48c6fd1cae1afbb55ba": {
    "id": "686de48c6fd1cae1afbb55ba",
    "name": "GoogleSheets",
    "url": "https://backend.composio.dev/v3/mcp/01b46296-8ea1-4686-a211-87ba79800a99/mcp?user_id=699a7e02c62b8b13bb143e70"
  }
};