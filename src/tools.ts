import type {
  AnyRootTypes,
  Router,
  RouterRecord,
} from "@trpc/server/unstable-core-do-not-import";
import {
  type JsonSchema7ObjectType,
  type JsonSchema7StringType,
  type JsonSchema7Type,
  zodToJsonSchema,
} from "zod-to-json-schema";
import { McpMeta } from "./types.js";
import { AnyZodObject, z } from "zod";

type Tool = {
  name: string;
  description: string;
  inputSchema?: JsonSchema7Type;
  pathInRouter: string[];
};

const mergeInputs = (inputParsers: AnyZodObject[]): AnyZodObject => {
  return inputParsers.reduce((acc, inputParser) => {
    return acc.merge(inputParser);
  }, z.object({}));
};

function tRpcRouterRecordToMcpToolsList(
  routerRecord: RouterRecord,
  nameSeparator: string,
  currentPath: string[] = [],
): Tool[] {
  const tools: Tool[] = [];
  const procedures = Object.entries(routerRecord);

  for (const [name, value] of procedures) {
    if (value._def && "procedure" in value._def) {
      // @ts-expect-error The types seems to be incorrect
      const inputs = value._def.inputs as AnyZodObject[];

      const inputSchema = inputs.length >= 2 ? mergeInputs(inputs) : inputs[0];
      const meta = value._def.meta as McpMeta;
      if (!meta || !meta.mcp || !meta.mcp.enabled) {
        continue;
      }

      const pathInRouter = [...currentPath, name];

      const tool: Tool = {
        name:
          meta.mcp.name ??
          pathInRouter.reduce((acc, curr) => acc + nameSeparator + curr),
        description: meta.mcp.description ?? "",
        pathInRouter,
      };

      if (inputSchema) {
        const jsonSchema = zodToJsonSchema(inputSchema) as
          | JsonSchema7ObjectType
          | JsonSchema7StringType;

        if (jsonSchema.type === "object") {
          const { type, properties = {}, required = [] } = jsonSchema;
          // MCP apparently only support object input types rn
          tool.inputSchema = { type, properties, required };
          tools.push(tool);
        } else {
          console.error(
            "Trying to add MCP server for procedure with non-object input type",
          );
        }
      }
    } else {
      const childTools = tRpcRouterRecordToMcpToolsList(
        value as RouterRecord,
        nameSeparator,
        [...currentPath, name],
      );
      tools.push(...childTools);
    }
  }
  return tools;
}

export function tRcpRouterToMcpToolsList<
  TRoot extends AnyRootTypes,
  TRecord extends RouterRecord,
>(router: Router<TRoot, TRecord>, nameSeparator: string): Tool[] {
  return tRpcRouterRecordToMcpToolsList(router._def.record, nameSeparator);
}
