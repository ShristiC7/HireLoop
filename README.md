# HireLoop Configuration

See `config.env` for all environment setup required.

## Local Development
1. Copy `config.env` to `.env` and fill the variables
2. Run database migrations: `pnpm build && pnpm run start` in `lib/db`
3. Run backend: `cd artifacts/api-server && pnpm dev`
4. Run frontend: `cd artifacts/hireloop && pnpm dev`
