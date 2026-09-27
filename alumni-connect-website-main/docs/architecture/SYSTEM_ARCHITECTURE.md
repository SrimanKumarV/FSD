# Alumnex Connect — System Architecture & High Availability (HA) Specification

## 1. System Overview

Alumnex Connect is an enterprise-grade mentorship, career, and developer momentum ecosystem. It unifies professional networking, real-time messaging, multi-platform developer tracking, AI-powered resume analysis, and behavioral habit intelligence into a single coherent web and mobile application.

```mermaid
graph TB
    subgraph Clients ["Client Layer"]
        Web["Web Application<br/>React 18 + TailwindCSS"]
        Mobile["Android Mobile APK<br/>Capacitor Native Bridge"]
    end

    subgraph Gateway ["Network & Failover Gateway"]
        Axios["API Client Interceptor<br/>Dynamic Health Discovery & Auto-Failover"]
    end

    subgraph BackendCluster ["Backend Micro-Cluster (Render.com)"]
        BackupCluster["Primary Node: alumnex-backend-backup<br/>Node.js + Express SOA"]
        SecondaryCluster["Secondary Node: alumnex-backend-9y5t<br/>Node.js + Express SOA"]
    end

    subgraph StateAndCache ["Authoritative State & Real-Time Sync"]
        Mongo[("MongoDB Atlas<br/>Mongoose Schemas & Sharded Indexes")]
        Redis[("Redis Cloud<br/>Socket.IO Cluster Adapter & Rate Limits")]
    end

    subgraph ExternalPlatforms ["External Verified Integrations"]
        GitHub["GitHub REST & GraphQL API"]
        LeetCode["LeetCode GraphQL API"]
        HackerRank["HackerRank API"]
        Codeforces["Codeforces API"]
        Duolingo["Duolingo Web API"]
    end

    subgraph AIServices ["AI Multi-Model Provider Fallback"]
        Groq["Groq Llama 3 70B<br/>(Low-latency primary)"]
        Gemini["Google Gemini 1.5 Pro<br/>(High-reliability fallback)"]
    end

    Web --> Axios
    Mobile --> Axios
    Axios --> BackupCluster
    Axios -. Failover on 502/503/Timeout .-> SecondaryCluster

    BackupCluster --> Mongo
    SecondaryCluster --> Mongo

    BackupCluster <--> Redis
    SecondaryCluster <--> Redis

    BackupCluster --> ExternalPlatforms
    SecondaryCluster --> ExternalPlatforms

    BackupCluster --> AIServices
    SecondaryCluster --> AIServices
```

---

## 2. High-Availability (HA) Failover Architecture

### Dual-Endpoint Cluster
The client-side API layer maintains active awareness of the backend cluster:
- **Primary Endpoint**: `https://alumnex-backend-backup.onrender.com/api`
- **Secondary Endpoint**: `https://alumnex-backend-9y5t.onrender.com/api`

### Client Discovery & Heartbeat Lifecycle
1. **Bootstrap Discovery**: On application boot, `discoverFastestEndpoint()` issues parallel non-blocking `GET /health` requests with a 3,500ms timeout.
2. **Instant Latch**: The fastest healthy node is dynamically latched into memory and `localStorage['alumnex_api_base_url']`.
3. **Outage Recovery**: If any active request receives HTTP `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`, or network disconnect:
   - The interceptor immediately switches endpoints.
   - The failed request is transparently re-attempted against the backup node without user disruption.
   - Cross-domain credentials (`withCredentials: true`) and Bearer JWT tokens are preserved across failover transitions.

---

## 3. Real-Time Distributed Messaging

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Student (Web)
    participant SrvA as Backend Node A
    participant Redis as Redis Pub/Sub Adapter
    participant SrvB as Backend Node B
    actor Bob as Alumni (Android APK)

    Alice->>SrvA: Socket.IO Message ("send_message")
    SrvA->>Mongo: Persist Message Record
    SrvA->>Redis: Publish to room "chat:room_123"
    Redis->>SrvB: Propagate packet to connected sockets
    SrvB->>Bob: Emit "receive_message" payload
    Bob-->>SrvB: Socket ACK ("message_read")
```

- **Socket.IO Cluster Adapter**: Enables seamless two-way real-time messaging even when clients are connected across distinct backend instances.
- **Presence & Read Receipts**: Stored in Redis memory with automatic TTL expiry to prevent stale online indicators.

---

## 4. AI Multi-Provider Fallback Architecture

```mermaid
graph LR
    Req["Resume Analysis / AI Prompt"] --> GroqCheck{"Groq API Healthy?"}
    GroqCheck -- Yes --> GroqExec["Llama-3-70b-versatile<br/>(Execution ~800ms)"]
    GroqCheck -- Rate Limit / Error --> GeminiExec["Google Gemini 1.5 Pro<br/>(Fallback Execution)"]
    GroqExec --> Output["Structured JSON Result"]
    GeminiExec --> Output
```

1. **Primary Model**: Groq `llama-3.3-70b-versatile` provides near instantaneous response times for resume parsing and skill gap extraction.
2. **Deterministic Fallback**: If Groq encounters rate limiting (`429`), timeouts, or quota exhaustion, execution seamlessly routes to Google Gemini `gemini-1.5-pro`.
3. **JSON Sanitization**: Both providers enforce strict JSON schema output with server-side validation before returning to clients.

---

## 5. Security & Defensive Engineering

- **Authentication**: Dual-mode auth supporting HTTP-Only SameSite cookies and standard `Authorization: Bearer <JWT>` headers for native mobile compatibility.
- **CSRF Protection**: Double-submit cookie verification enabled in production.
- **Data Sanitization**: `express-mongo-sanitize` strips `$` and `.` operators to eliminate NoSQL injection vectors.
- **HTTP Hardening**: Helmet sets strict Content-Security-Policy (CSP), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and Referrer Policy.
- **Rate Limiting**: Distributed IP rate-limiting via Express Rate Limit backed by Redis storage.
