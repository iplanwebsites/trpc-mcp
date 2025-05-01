import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { type Implementation } from "@modelcontextprotocol/sdk/types.js";
import type { AnyRootTypes, Router, RouterRecord } from "@trpc/server/unstable-core-do-not-import";
export declare function createMcpServer<TRoot extends AnyRootTypes, TRecord extends RouterRecord>(implementation: Implementation, // awful type naming by Anthropic
appRouter: Router<TRoot, TRecord>, options?: {
    defaultNameSeparator?: string;
}): Server;
//# sourceMappingURL=server.d.ts.map