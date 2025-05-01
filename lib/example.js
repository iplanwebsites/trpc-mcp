import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createMcpServer } from "./index.js";
const t = initTRPC.meta().create(); /* 👈 */
const appRouter = t.router({
    provideFeedback: t.procedure
        .meta({
        mcp: {
            enabled: true,
            name: "give_feedback",
            description: "Give feedback to the tool provider",
        },
    })
        .input(z.object({ message: z.string() }))
        .query(async ({ input }) => {
        return { status: "success" };
    }),
    userInfo: {
        get: t.procedure
            .meta({ mcp: { enabled: true } })
            .input(z.object({ name: z.string() }))
            .query(async ({ input }) => {
            return {
                name: "John Doe",
                age: 30,
                email: "johndoe@example.com",
            };
        }),
        address: {
            get: t.procedure
                .input(z.object({ city: z.string() }))
                .query(async ({ input }) => {
                return {
                    city: "New York",
                    country: "USA",
                };
            }),
        },
    },
});
const mcpServer = createMcpServer({ name: "trpc-mcp-example", version: "0.0.1" }, appRouter);
const transport = new StdioServerTransport();
await mcpServer.connect(transport);
