"use server";

import { ChatOllama } from "@langchain/ollama";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  mapStoredMessagesToChatMessages,
  StoredMessage,
} from "@langchain/core/messages";
import { execute } from "./database";
import {
  patientsTable,
  doctorsTable,
  admissionsTable,
  provinceNamesTable,
} from "./constants";

type OkPayload = {
  ok: true;
  sql: string;
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  scalar?: string | number | null;
};

type ErrPayload = {
  ok: false;
  sql?: string;
  error: string;
};

function toPayload(
  sql: string,
  raw: unknown
): OkPayload | ErrPayload {
  // database.execute() returns either an array of rows
  // or a stringified error. The following code Normalizes it.
  try {
    // Error path: execute might return a JSON string of an error
    if (typeof raw === "string") {
      try {
        const errObj = JSON.parse(raw);
        const msg = typeof errObj?.message === "string"
          ? errObj.message
          : raw;
        return { ok: false, sql, error: msg };
      } catch {
        return { ok: false, sql, error: raw };
      }
    }

    const rows = Array.isArray(raw) ? raw : [];
    const rowCount = rows.length;

    // If it's a single row with a single column, then the following exposes scaler for better visual.
    let scalar: string | number | null | undefined = undefined;
    if (rowCount === 1) {
      const cols = Object.keys(rows[0] ?? {});
      if (cols.length === 1) {
        const v = (rows[0] as Record<string, unknown>)[cols[0]];
        if (
          typeof v === "string" ||
          typeof v === "number" ||
          v === null
        ) {
          scalar = v;
        }
      }
    }

    return { ok: true, sql, rows, rowCount, ...(scalar !== undefined ? { scalar } : {}) };
  } catch (e: any) {
    return { ok: false, sql, error: e?.message ?? "Unknown error" };
  }
}

export async function message(messages: StoredMessage[]) {
  const deserialized = mapStoredMessagesToChatMessages(messages);

  const getFromDB = tool(
    async (input) => {
      if (!input?.sql) return JSON.stringify({ ok: false, error: "Missing SQL" } satisfies ErrPayload);

      // Log and execute
      console.log({ sql: input.sql });
      const raw = await execute(input.sql);
      const payload = toPayload(input.sql, raw);
      return JSON.stringify(payload);
    },
    {
      name: "get_from_db",
      description: `Run a SQL query against the SQLite database and return ONLY JSON. 

You MUST:
- Produce a complete, syntactically valid SQLite query.
- Prefer SELECT queries.
- Never explain or summarize.
- Always return the tool's JSON result directly.

Schema (quotes are important for SQLite compatibility):
${patientsTable}
${doctorsTable}
${admissionsTable}
${provinceNamesTable}
      `,
      schema: z.object({
        sql: z
          .string()
          .describe(
            'A valid SQLite query. Always double-quote identifiers (e.g., SELECT "first_name" FROM "patients").'
          ),
      }),
    }
  );

  const agent = createReactAgent({
    llm: new ChatOllama({
      model: "llama3.2",
      temperature: 0,
    }),
    tools: [getFromDB],
  });

  // The following invokes the agen
  const response = await agent.invoke({
    messages: deserialized,
  });

  // I am using the following strategy to avoid hallucinations: (Let me know your ideas :))
  // 1) If any tool result exists, return the LAST tool result JSON directly.
  // 2) Else, try to extract a SQL block from the model's final message and execute it server-side.
  // 3) Else, return a structured error.
  const msgs: any[] = (response as any)?.messages ?? [];

  // Find last tool message (most reliable)
  const lastToolMsg = [...msgs].reverse().find(
    (m) => typeof m?._getType === "function" ? m._getType() === "tool" : m?.type === "tool"
  );

  if (lastToolMsg?.content) {
    // content is the JSON string we returned from the tool
    // Return it as-is to the client
    return typeof lastToolMsg.content === "string"
      ? lastToolMsg.content
      : JSON.stringify(lastToolMsg.content);
  }

  // The following inspects last AI message for a SQL snippet
  const last = msgs[msgs.length - 1];
  const finalText: string | undefined =
    typeof last?.content === "string" ? last.content : undefined;

  if (finalText) {
    // Well, currently I am running a RegEx to identify the SQL query from the response. If you have any recommendation
    // I would love to discuss that.
    const fenceMatch = finalText.match(/```sql\s*([\s\S]*?)```/i);
    const inlineSql = fenceMatch?.[1]?.trim();

    // Or a plain SELECT/WITH statement at the start of a line
    const selectMatch =
      inlineSql ??
      finalText.match(/^\s*(SELECT|WITH)\b[\s\S]*$/i)?.[0]?.trim();

    if (selectMatch) {
      try {
        const raw = await execute(selectMatch);
        const payload = toPayload(selectMatch, raw);
        return JSON.stringify(payload);
      } catch (e: any) {
        const errPayload: ErrPayload = {
          ok: false,
          sql: selectMatch,
          error: e?.message ?? "Failed to execute SQL",
        };
        return JSON.stringify(errPayload);
      }
    }
  }

  // Nothing usable; return a clear error
  const err: ErrPayload = {
    ok: false,
    error:
      "No tool output or executable SQL was produced. Please rephrase your request.",
  };
  return JSON.stringify(err);
}
