import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  type Implementation,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  AnyProcedure,
  AnyRootTypes,
  Router,
  RouterRecord,
} from "@trpc/server/unstable-core-do-not-import";

import { tRcpRouterToMcpToolsList } from "./tools.js";

export function createMcpServer<
  TRoot extends AnyRootTypes,
  TRecord extends RouterRecord,
>(
  implementation: Implementation, // awful type naming by Anthropic
  appRouter: Router<TRoot, TRecord>,
  options?: {
    defaultNameSeparator?: string;
  },
): Server {
  const nameSeparator = options?.defaultNameSeparator ?? "__";
  const tools = tRcpRouterToMcpToolsList(appRouter, nameSeparator);
  const caller = appRouter.createCaller({});

  const server = new Server(implementation, {
    capabilities: {
      tools: {},
    },
  });

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Find tool
    const tool = tools.find((t) => t.name === name);

    if (!tool) {
      return { content: [{ type: "text", text: "Could not find tool" }] };
    }

    // Find procedure in router
    // @ts-expect-error wrangle types later
    const procedure: AnyProcedure = tool.pathInRouter.reduce(
      (acc, part) => acc?.[part],
      caller,
    );

    // @ts-expect-error wrangle types later
    return procedure(args);
  });

  return server;
}
