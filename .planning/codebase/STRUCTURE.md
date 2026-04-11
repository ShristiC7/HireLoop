# Directory Structure

## Client (`/client`)
- `src/components`: Reusable UI elements (often shadcn/ui generated components).
- `src/pages`: Top-level route components representing full-screen views.
- `src/layouts`: Wrapper components providing shared UI (navbars, sidebars).
- `src/hooks`: Custom React hooks.
- `src/context`: React Context providers for global state (e.g., Auth, Theme).
- `src/data`: Mock data or static constants.
- `src/lib`: Utilities and helper functions (like `utils.ts` for cn/tailwind merge).
- `src/test`: Testing utilities or spec files for frontend components.

## Server (`/server`)
- `src/controllers`: Request handlers extracting data and passing to services.
- `src/routes`: Express router definitions, mapping endpoints to controllers.
- `src/services`: Business logic, database interactions, and API calls.
- `src/middleware`: Request interceptors (auth, validation, error handling).
- `src/config`: Configuration setup (DB connection variables, third-party API configurations).
- `src/utils`: Reusable helper functions.
- `src/validators`: Request payload validation rules (using Zod or express-validator).
