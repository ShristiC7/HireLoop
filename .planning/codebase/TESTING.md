# Testing

## Client
- **Unit/Integration Testing**: Configured using `vitest` and `@testing-library/react`. 
- **End-to-End Testing**: `@playwright/test` is available in `devDependencies` indicating E2E testing capabilities.
- **Runners**: Scripts like `npm run test` and `npm run test:watch` are configured in `client/package.json`.

## Server
- **Current State**: Test dependencies like Jest or Mocha are currently not present in the server's `package.json`. Server relies on manual API testing via Postman or frontend integration.
