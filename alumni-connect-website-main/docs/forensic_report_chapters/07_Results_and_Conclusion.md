# CHAPTER 16 — THREAT MODEL AND SECURITY ANALYSIS

## 16.1 Residual Risks
* **Stored XSS**: If a user manages to inject script tags into a forum post and React's escaping fails, XSS is possible. Mitigated heavily by Helmet CSP preventing execution of inline scripts.
* **Account Takeover**: If the \`JWT_SECRET\` is compromised. Mitigated by the recent rotation to a 64-byte cryptographic hex string securely stored in the \`.env\` file (as verified during this audit).
* **Capacitor Token Extraction**: Tokens stored in \`localStorage\` on mobile are theoretically accessible if the device is compromised or physically accessed, but this is a standard industry tradeoff for WebViews that cannot process \`HttpOnly\` cookies across origins.

---

# CHAPTER 17 — RESULTS AND OBSERVATIONS

The system successfully aggregates data from multiple developer platforms into unified profiles, demonstrating robust concurrent I/O. The failover routing on the client side proved highly effective during simulated backend outages, seamlessly shifting the Socket.IO and Axios connections to secondary endpoints without requiring a page reload. Real-time metrics show that Redis successfully bridges Socket.IO connections across multiple backend instances.

---

# CHAPTER 18 — LIMITATIONS

* **Configuration Dependent Features**: AI functionality is purely mocked unless Groq/Gemini API keys are provided in the environment.
* **Scraping Fragility**: The developer statistics fetcher for GeeksForGeeks and CodeChef relies on Cheerio DOM parsing (\`backend/utils/devStatsFetcher.js\`), which will inherently break if those platforms change their DOM structure.
* **WebRTC Mesh Topology**: Video calling components exist but rely heavily on standard mesh topologies (P2P), which severely degrade performance with >4 participants due to bandwidth constraints.

---

# CHAPTER 19 — FUTURE ENHANCEMENTS

1. **Queue-Based Background Jobs**: Move PDF parsing and AI processing to a \`BullMQ\`/\`Redis\` worker queue rather than keeping the HTTP request open indefinitely.
2. **Distributed Tracing**: Implement Datadog or OpenTelemetry to observe failover events and Redis latencies in production.
3. **Secret Rotation Architecture**: Implement an automated 30-day rotation for JWT secrets and MongoDB credentials using AWS Secrets Manager or HashiCorp Vault.

---

# CHAPTER 20 — CONCLUSION

Alumnex Connect represents a mature, deeply defensive, and highly resilient full-stack application. By implementing layered security, automated failover mechanisms across HTTP, WebSockets, and AI providers, and delivering it via both Web and Capacitor-driven Mobile platforms, it solves the core problem of fragmented alumni networks. The source code serves as verifiable proof of advanced software engineering concepts including API load balancing, concurrent data aggregation, and strict role-based access control.

---
