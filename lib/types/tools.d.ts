import type { AnyRootTypes, Router, RouterRecord } from "@trpc/server/unstable-core-do-not-import";
import { type JsonSchema7Type } from "zod-to-json-schema";
type Tool = {
    name: string;
    description: string;
    inputSchema?: JsonSchema7Type;
    pathInRouter: string[];
};
export declare function tRcpRouterToMcpToolsList<TRoot extends AnyRootTypes, TRecord extends RouterRecord>(router: Router<TRoot, TRecord>, nameSeparator: string): Tool[];
export {};
//# sourceMappingURL=tools.d.ts.map