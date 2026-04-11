# Architecture

The app is a full-stack Monorepo separated into `client` and `server` directories.

## Top-Level Architecture
- **Client**: Single Page App built with Vite, React, and TypeScript. Uses Context API and React Query for managing state and server data caching.
- **Server**: RESTful JSON API using Node.js and Express. Implements an MVC-like pattern (Routes -> Controllers -> Services).
- **Database Layer**: Prisma ORM interacting with PostgreSQL. Includes a seeding mechanism (`prisma/seed.js`).

## Communication
- Client communicates with the Server exclusively through REST HTTP calls.
- Server acts as an intermediary, connecting to the PostgreSQL database, AI APIs, Cloudinary blob storage, and Payment gateways.
