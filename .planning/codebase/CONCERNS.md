# Existing Concerns / Notes

- **Language Mismatch**: The client is strongly typed using TypeScript, while the server is currently loosely typed using JavaScript. This can introduce structural drift in DTOs and API payloads.
- **Server Testing**: The server currently lacks automated tests. Adding a framework like Jest or unit testing controllers/services is recommended.
- **Rate Limiting**: `express-rate-limit` is used, but ensure strict configurations exist on AI endpoints (OpenAI / Anthropic) to prevent quota abuse.
- **Concurrent DB Connections**: Using Prisma requires awareness around max database connections, especially if deployed in serverless environments.
- **Multiple Gateways**: Both Stripe and Razorpay SDKs are present. A decision should be made to streamline to one, or establish clear modular boundaries.
