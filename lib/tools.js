import { zodToJsonSchema, } from "zod-to-json-schema";
import { z } from "zod";
const mergeInputs = (inputParsers) => {
    return inputParsers.reduce((acc, inputParser) => {
        return acc.merge(inputParser);
    }, z.object({}));
};
function tRpcRouterRecordToMcpToolsList(routerRecord, nameSeparator, currentPath = []) {
    const tools = [];
    const procedures = Object.entries(routerRecord);
    for (const [name, value] of procedures) {
        if (value._def && "procedure" in value._def) {
            // @ts-expect-error The types seems to be incorrect
            const inputs = value._def.inputs;
            const inputSchema = inputs.length >= 2 ? mergeInputs(inputs) : inputs[0];
            const meta = value._def.meta;
            if (!meta || !meta.mcp || !meta.mcp.enabled) {
                continue;
            }
            const pathInRouter = [...currentPath, name];
            const tool = {
                name: meta.mcp.name ??
                    pathInRouter.reduce((acc, curr) => acc + nameSeparator + curr),
                description: meta.mcp.description ?? "",
                pathInRouter,
            };
            if (inputSchema) {
                const jsonSchema = zodToJsonSchema(inputSchema);
                if (jsonSchema.type === "object") {
                    const { type, properties = {}, required = [] } = jsonSchema;
                    // MCP apparently only support object input types rn
                    tool.inputSchema = { type, properties, required };
                    tools.push(tool);
                }
                else {
                    console.error("Trying to add MCP server for procedure with non-object input type");
                }
            }
        }
        else {
            const childTools = tRpcRouterRecordToMcpToolsList(value, nameSeparator, [...currentPath, name]);
            tools.push(...childTools);
        }
    }
    return tools;
}
export function tRcpRouterToMcpToolsList(router, nameSeparator) {
    return tRpcRouterRecordToMcpToolsList(router._def.record, nameSeparator);
}
