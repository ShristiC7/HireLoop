# HireLoop Configuration

See `config.env` for all environment setup required.

## Local Development
1. Copy `config.env` to `.env` and fill the variables
2. Run database migrations: `pnpm build && pnpm run start` in `lib/db`
3. Run backend: `cd artifacts/api-server && pnpm dev`
4. Run frontend: `cd artifacts/hireloop && pnpm dev`

## 📚 Documentation & Resources
- **[Deployment Guide (Render)](RENDER_DEPLOYMENT.md)** — Step-by-step instructions for hosting on Render.
- **[Technical Stack & Implementation](TECH_STACK_RESOURCES.md)** — A deep dive for beginners into how we built HireLoop.
