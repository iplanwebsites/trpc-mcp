# tRPC <-> MCP

Serve tRPC routes via Model Context Protocol (MCP).

This lib is a fork of:
https://www.npmjs.com/package/trpc-to-openapi

## Usage

### 1. Install

```bash
npm install trpc-mcp @modelcontextprotocol/sdk
# or
yarn add trpc-mcp @modelcontextprotocol/sdk
# or
pnpm add trpc-mcp @modelcontextprotocol/sdk
```

### 2. Add to meta

```ts
import { initTRPC } from "@trpc/server";
import { type McpMeta } from "trpc-mcp";

const t = initTRPC.meta<McpMeta>().create();
```

### 3. Enable for routes

```ts
export const appRouter = t.router({
  sayHello: t.procedure
    .meta({ mcp: { enabled: true, description: 'Greet the user' } })
    .input(z.object({ name: z.string() }))
    .output(z.object({ greeting: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}!` };
    });
});
```

### 4. Serve

#### Using StdIO Transport (CLI applications)

```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "trpc-mcp";

const mcpServer = createMcpServer(
  { name: "trpc-mcp-example", version: "0.0.1" },
  appRouter
);

const transport = new StdioServerTransport();
await mcpServer.connect(transport);
```

#### Using SSE Transport (Web applications)

For web applications, you can use the provided SafeSSEServerTransport to handle Server-Sent Events (SSE) connections:

```ts
import { createMcpServer, SafeSSEServerTransport } from "trpc-mcp";
import http from "node:http";
import url from "node:url";

// Create MCP server with your router
const mcpServer = createMcpServer(
  { name: "trpc-mcp-sse-example", version: "0.0.1" },
  appRouter
);

// Initialize SSE transport
const sseTransport = new SafeSSEServerTransport();
await mcpServer.connect(sseTransport);

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Parse URL and query parameters
  const parsedUrl = url.parse(req.url || "", true);
  const sessionId = parsedUrl.query.sessionId as string;

  if (!sessionId) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing sessionId parameter" }));
    return;
  }

  // Handle SSE connection request
  if (req.method === "GET" && parsedUrl.pathname === "/sse") {
    sseTransport.handleGetRequest(req, res, sessionId);
    return;
  }

  // Handle message request
  if (req.method === "POST" && parsedUrl.pathname === "/message") {
    // Parse request body
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const jsonBody = JSON.parse(body);
        await sseTransport.handlePostMessage(req, res, sessionId, jsonBody);
      } catch (error) {
        console.error("Error processing message:", error);
        if (!res.headersSent) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request body" }));
        }
      }
    });
    return;
  }

  // Not found
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000);
```

See the full example in `src/example-sse.ts`.

## Error Handling

The SafeSSEServerTransport includes protection against the common "Cannot set headers after they are sent to the client" error by checking if headers have already been sent before attempting to write to the response.

# known issues

You may get this console error in the newer version of the inspector, but it doesn't seem to affect functionality

```
Error from MCP server: SyntaxError: Unexpected token '�', "📚 2025-05"... is not valid JSON
    at JSON.parse (<anonymous>)
```

Not all trpc routes are supported. Only the ones receiving object inputs.

# Todos

- [ ] Handle trpc routes with Non-object params (plain strings). A trategy could be to wrap them.
- [ ] Support for web transport

# Ressources:

https://www.anthropic.com/news/integrations

Cloudflare examples:
https://blog.cloudflare.com/remote-model-context-protocol-servers-mcp/

Cloudflare playground for web transport MCP:
https://playground.ai.cloudflare.com/
