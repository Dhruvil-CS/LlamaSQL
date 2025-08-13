"use client";

import { useEffect, useState } from "react";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage,
  mapChatMessagesToStoredMessages,
} from "@langchain/core/messages";
import { message } from "./actions";
import { seed } from "./database";
import {
  patientsTable,
  doctorsTable,
  admissionsTable,
  provinceNamesTable,
} from "./constants";

type Payload =
  | {
      ok: true;
      sql: string;
      rows: Array<Record<string, unknown>>;
      rowCount: number;
      scalar?: string | number | null;
    }
  | {
      ok: false;
      sql?: string;
      error: string;
    };

export default function Home() {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<BaseMessage[]>([
    new SystemMessage(`
You are an expert SQLite text-to-SQL assistant.

Rules:
1) ALWAYS call the "get_from_db" tool with a complete SQLite query.
2) Use double quotes for all identifiers: "patients", "first_name", etc.
3) Prefer SELECT queries that return exactly what the user asked for.
4) DO NOT add commentary, explanation, or markdown. The tool returns JSON; that JSON must be the final output.
5) If the user asks for the SQL itself, still call the tool with that SQL so the server can return structured JSON.

Database schema:
${patientsTable}
${doctorsTable}
${admissionsTable}
${provinceNamesTable}
`),
  ]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    seed();
  }, []);

  async function sendMessage() {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    setIsLoading(true);
    const history = [...messages, new HumanMessage(trimmed)];

    try {
      const resp = await message(mapChatMessagesToStoredMessages(history));

      // Here I am storing AI message as a string
      const text = typeof resp === "string" ? resp : JSON.stringify(resp);
      history.push(new AIMessage(text));
      setMessages(history);
    } catch (e: any) {
      const errPayload: Payload = {
        ok: false,
        error: e?.message ?? "Unexpected error",
      };
      history.push(new AIMessage(JSON.stringify(errPayload)));
      setMessages(history);
    } finally {
      setInputMessage("");
      setIsLoading(false);
    }
  }

  function renderAIMsg(raw: string) {
    let data: Payload | null = null;
    try {
      data = JSON.parse(raw) as Payload;
    } catch {
      // Not JSON; show as plain text
      return <div>{raw}</div>;
    }

    if (!data) return null;

    if (!data.ok) {
      return (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700 text-sm">
          <div className="font-semibold mb-1">Query failed</div>
          {data.sql && (
            <pre className="mb-2 rounded bg-white p-2 text-xs overflow-auto">
              {data.sql}
            </pre>
          )}
          <div>{data.error}</div>
        </div>
      );
    }

    // OK path
    return (
      <div className="space-y-3">
        {/* Executed SQL */}
        <div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Executed SQL
          </div>
          <pre className="rounded bg-white p-2 text-xs overflow-auto border border-gray-200">
            {data.sql}
          </pre>
        </div>

        {/* Scalar (e.g., COUNT(*)) */}
        {typeof data.scalar !== "undefined" && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="text-xs text-indigo-700">Result</div>
            <div className="text-3xl font-semibold text-indigo-900">
              {String(data.scalar)}
            </div>
            <div className="text-[10px] text-indigo-700/80 mt-1">
              Single-value result
            </div>
          </div>
        )}

        {/* Rows Table */}
        {Array.isArray(data.rows) && data.rows.length > 0 && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
              <div className="text-xs text-gray-600">
                {data.rowCount} {data.rowCount === 1 ? "row" : "rows"}
              </div>
            </div>
            <div className="overflow-auto max-h-[50vh]">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    {Object.keys(data.rows[0]).map((col) => (
                      <th
                        key={col}
                        className="text-left px-3 py-2 font-semibold border-b border-gray-200"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {Object.keys(data!.rows![0]).map((col) => (
                        <td
                          key={col}
                          className="px-3 py-2 border-b border-gray-100 align-top"
                        >
                          {String(
                            (row as Record<string, unknown>)[col] ?? ""
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No rows */}
        {Array.isArray(data.rows) && data.rows.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 text-gray-700 text-sm">
            No rows returned.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen justify-between">
      <header className="bg-white p-2 border-b">
        <div className="flex lg:flex-1 items-center justify-center gap-3">
          <a href="#" className="m-1.5">
            <span className="sr-only">LlamaSQL</span>
            <img className="h-8 w-auto" src="/watsonx.svg" alt="" />
          </a>
          <h1 className="text-black font-bold">LlamaSQL</h1>
        </div>
      </header>

      <div className="flex flex-col h-full overflow-y-auto p-4 gap-2">
        {messages.map((m, index) => {
          // USER messages → render on the RIGHT
          if (m instanceof HumanMessage) {
            return (
              <div
                key={m.getType() + index}
                className="col-start-6 col-end-13 p-3 rounded-lg"
              >
                <div className="flex items-center justify-start flex-row-reverse">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-400 text-white flex-shrink-0 text-sm">
                    Me
                  </div>
                  <div className="relative mr-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                    <div>{m.content as string}</div>
                  </div>
                </div>
              </div>
            );
          }

          // AI messages → render on the LEFT
          if (m instanceof AIMessage) {
            return (
              <div
                key={m.getType() + index}
                className="col-start-1 col-end-8 p-3 rounded-lg"
              >
                <div className="flex flex-row items-center">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-400 flex-shrink-0 text-sm">
                    AI
                  </div>
                  <div className="relative ml-3 text-sm bg-indigo-100 py-3 px-4 shadow rounded-xl max-w-full overflow-x-auto">
                    {renderAIMsg(m.content as string)}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      <div className="flex flex-col flex-auto justify-between bg-gray-100 p-4 border-t">
        <div className="flex flex-row items-center h-16 rounded-xl bg-white w-full px-3 gap-3">
          <input
            type="text"
            disabled={isLoading}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a question..."
            className="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 rounded-xl text-white px-4 py-2 flex-shrink-0"
          >
            <span>{isLoading ? "Running…" : "Send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
