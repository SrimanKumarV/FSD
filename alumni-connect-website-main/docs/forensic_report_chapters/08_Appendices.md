# APPENDICES

## Appendix A — Environment Variable Inventory

| Variable | Location | Purpose | Required | Sensitive | Missing Behavior |
|----------|----------|---------|----------|-----------|------------------|
| MONGODB_URI | \`backend/.env\` | Database connection | Yes | Yes | Crash on boot |
| JWT_SECRET | \`backend/.env\` | Token signing | Yes | Yes | Crash on auth |
| GROQ_API_KEY | \`backend/.env\` | AI primary provider | No | Yes | Mock mode fallback |
| GEMINI_API_KEY | \`backend/.env\` | AI fallback provider| No | Yes | Mock mode fallback |
| GITHUB_TOKEN | \`backend/.env\` | Dev stats fetching | No | Yes | Falls back to REST/Scraping |
| REACT_APP_API_URL | \`frontend/.env\` | Primary Backend URL | Yes | No | API Requests fail |
| REACT_APP_BACKUP_API_URL| \`frontend/.env\` | Failover URL | Yes | No | Disables failover routing |

## Appendix B — Feature-to-Code Traceability Matrix

| Feature | Source File | Function / Route / Component | Status |
|---------|-------------|------------------------------|--------|
| Multi-URL API Failover | \`frontend/src/utils/api.js\` | \`triggerFailover()\` | VERIFIED IMPLEMENTATION |
| AI Prompt Fallback | \`backend/utils/aiHelper.js\` | \`callAIWithFallback()\` | VERIFIED IMPLEMENTATION |
| AI Resume Parser | \`backend/routes/ai.js\` | \`POST /api/ai/analyze-resume\` | VERIFIED IMPLEMENTATION |
| Mobile CSRF Bypass | \`backend/middleware/csrf.js\` | \`req.headers['x-mobile-app']\` check | VERIFIED IMPLEMENTATION |
| Capacitor Integration | \`mobile-wrapper/capacitor.config.json\` | App configuration | VERIFIED IMPLEMENTATION |
| Redis WebSocket Adapter | \`backend/server.js\` | \`io.adapter(createAdapter(...))\` | VERIFIED IMPLEMENTATION |
| GraphQL Fallback (GitHub) | \`backend/utils/devStatsFetcher.js\`| \`fetchGitHubStats()\` | VERIFIED IMPLEMENTATION |
| Rate Limiting | \`backend/server.js\` | \`rateLimit()\` | VERIFIED IMPLEMENTATION |
| Double Submit Cookie | \`backend/middleware/csrf.js\` | CSRF generation logic | VERIFIED IMPLEMENTATION |

---
**END OF FORENSIC AUDIT REPORT**
