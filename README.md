

#  Text-to-SQL Agent (Next.js + TypeScript + LangGraph + LLaMA-3.2 + Ollama)

A small, friendly **Text-to-SQL Agent** built using **Next.js + TypeScript + LangGraph + LLaMA-3.2 + Ollama** application that converts natural language questions into SQLite queries and returns exact, structured results.   This project demonstrates a local LLM integration (Ollama or equivalent) with a text-to-SQL assistant and an in-browser interactive UI.  

---

##  Features

- Natural language → SQLite queries using LangGraph / LangChain + Ollama (LLaMA-3.2)
- In-memory seeded SQLite database for quick demo
- Strict tool-based execution: server executes SQL and returns structured JSON (no hallucinated explanations)
- Clean, responsive UI built with Next.js + Tailwind CSS
- Nice rendering of results: scalar, rows, errors

---
## Quickstart (development)

> Requirements
> - Node.js 18+ (recommended)
> - npm / pnpm / yarn
> - [Ollama](https://ollama.ai/) or other LLM endpoint that `@langchain/ollama` can use (local Ollama is easiest for dev)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Dhruvil-CS/LlamaSQL.git
cd LlamaSQL
```

### 2. Set Up Python Environment
To run the application you need to install the necessary dependencies:
```bash
npm install
```

### 3. Install and Run Ollama (for LLaMA-3)

Make sure [Ollama](https://ollama.com/) is installed and running locally:

```bash
ollama pull llama3.2
```

Verify it:

```bash
ollama run llama3.2
```
Run Ollama instance:

```
ollama serve
```
---

## How It Works

Not an SQL expert? No worries — the assistant is powered by LLaMA 3.2, so it helps you turn natural language into correct, double-quoted SQLite queries you can run and inspect. You get guidance and the exact results, even if you don’t speak SQL fluently.

Excited to share something I’ve been building: a small but powerful **Text → SQL → Results** assistant.
So I built a tool that:
* understands plain English questions,
* converts them into valid SQLite queries, and
* executes them and returns the actual rows / scalar results — rendered as clean tables or single-value cards in the UI.

What that means in practice: you can type “Show first name, last name and gender of patients whose gender is ‘M’” and get both the exact SQL and the real result set — not an explanation, not a hallucination. The agent follows a strict tool-first pattern so the model must call the DB tool and the server returns structured JSON (rows, rowCount, scalar or error), which the frontend renders beautifully. No guesswork. No prose. Just facts.

### Tech stack
* Next.js + TypeScript (frontend + server actions)
* LangGraph / LangChain (agent orchestration) + @langchain/ollama (LLM)
* SQLite (in-memory seeded DB for the demo)
* Tailwind CSS for UI

## Demo 

Launch the app:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---
### Want to customize this project?

To customize this project for your dataset, you would want to modify the schema in ./src/app/constants.ts and include your dataset by updating the file ./src/app/database.ts
Need help? Feel free to contact me!

## License

N/A

---

## Author

**Dhruvil Kotecha**
[LinkedIn](https://www.linkedin.com/in/dhruvil-kamleshkumar-kotecha-a627a31b1/) · [GitHub](https://github.com/Dhruvil-CS)

