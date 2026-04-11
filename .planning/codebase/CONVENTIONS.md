# Conventions

- **Code Style**: ESLint configured on both client and server for linting and enforcing code standards.
- **Language**: TypeScript is strictly used on the client (`.ts`, `.tsx`); JavaScript using ES modules (`type: module`) is used on the server (`.js`).
- **Package Management**: Both applications are typically run from the root workspace using tools like `concurrently` (e.g. `npm run dev` at the root starts both dev servers).
- **Styling**: Utility-first styling via Tailwind CSS is standard on the frontend, using Radix primitives.
- **Environment Variables**: `.env` files are used for both client (`VITE_` prefixed variables) and server (`PORT`, `DATABASE_URL`, API keys).
