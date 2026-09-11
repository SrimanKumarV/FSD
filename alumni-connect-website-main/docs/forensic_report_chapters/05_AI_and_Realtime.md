# CHAPTER 9 — AI FEATURES (FORENSIC AUDIT)

This chapter documents the integration of Large Language Models to simulate a career mentor, analyze resumes, and conduct mock interviews.

## 9.1 AI Architecture & Orchestration
The application implements an intelligent failover mechanism in \`backend/utils/aiHelper.js\`.
1. **Primary**: Groq (\`llama3-70b-8192\`) via the \`groq-sdk\` for ultra-fast inference.
2. **Fallback**: Gemini (\`gemini-1.5-flash\`) via \`@google/genai\`. If Groq throws an error or rate limits (e.g., 429), the \`callAIWithFallback\` orchestrator automatically routes the request to Gemini.
3. **Demo Mode**: If neither API key is configured (\`!process.env.GROQ_API_KEY\` and \`!process.env.GEMINI_API_KEY\`), the route explicitly catches the error and returns a simulated/mock response (e.g., \`"I'm your AI Career Mentor! (Demo Mode)"\`) instead of crashing the process.

## 9.2 ATS Resume Parsing (Verified Implementation)
* **Endpoint**: \`POST /api/ai/analyze-resume\` (in \`backend/routes/ai.js\`)
* **Mechanism**: \`multer\` receives the file in memory. \`pdf-parse\` extracts the raw text. The text and Job Description are injected into a strict system prompt demanding JSON output.
* **Handling**: The backend strips markdown (e.g., \`\`\`json) from the LLM output using regex (\`replace(/\\`\\`\\`(json)?/g, '').trim()\`) before running \`JSON.parse()\`.
* **Security**: Enforces a strict file size limit (5MB) and mimetype checking (\`application/pdf\`).

---

# CHAPTER 10 — REAL-TIME COMMUNICATION

## 10.1 Socket.IO Architecture
* **Frontend Initialization**: \`SocketContext.js\` maintains a singleton socket connection. It listens to the \`backend-failover\` event; if the HTTP client fails over to a backup server, the socket immediately disconnects and reconnects to the new server URI dynamically.
* **Backend Implementation**: Managed in \`backend/socket/socketHandler.js\`. Handles presence (\`user:online\`, \`user:offline\`), messaging (\`send_message\`), and typing indicators.
* **Scaling (Redis Adapter)**: Configured in \`backend/server.js\` (lines 39-61). It uses \`@socket.io/redis-adapter\` to connect a \`pubClient\` and \`subClient\` to a Redis instance. This allows multiple Node.js instances to broadcast events seamlessly across the cluster. If Redis connection fails, the process catches the error but continues running without cluster mode (Graceful degradation).

\`\`\`mermaid
sequenceDiagram
    participant C1 as Client A
    participant S1 as Socket Server 1 (Primary)
    participant R as Redis
    participant S2 as Socket Server 2 (Backup)
    participant C2 as Client B
    C1->>S1: Emit 'send_message'
    S1->>R: Publish to Redis Channel
    R->>S2: Message Event
    S2->>C2: Broadcast to Client B
\`\`\`
