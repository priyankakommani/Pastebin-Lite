# Pastebin-Lite

A lightweight, premium Pastebin-like application built with Hono, Vite, and Prisma.

## Description
Pastebin-Lite allows users to create text pastes that can be shared via a unique URL. Pastes can be configured with a **Time-to-Live (TTL)** and a **View Count Limit**. Once a constraint is met, the paste becomes unavailable (404).

## Tech Stack
- **Backend**: [Hono](https://hono.dev/) on Node.js
- **Frontend**: Vite + React + TypeScript
- **Database**: PostgreSQL (Neon) with [Prisma](https://www.prisma.io/) (SQLite used for local development)
- **Styling**: Premium Vanilla CSS with glassmorphism and animations.

## Persistence Layer
The application uses **Prisma ORM** with **PostgreSQL** (standard for Vercel/Neon deployments). For local development, it is configured with **SQLite** for ease of setup. The schema includes a `Paste` model that tracks `content`, `expiresAt`, and `remainingViews`.

## Running Locally

### Prerequisites
- Node.js (v20+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies for the entire workspace:
   ```bash
   npm install
   ```
3. Initialize the local database (SQLite):
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```
- Backend starts on `http://localhost:3000`
- Frontend starts on `http://localhost:5173` (proxies `/api` and `/p` to the backend)

## Testing
The application supports deterministic testing using the `x-test-now-ms` header when `TEST_MODE=1` is set in the environment.

To run the automated requirement verification:
```bash
npx tsx test-requirements.ts
```

## Important Design Decisions
1. **Unified Backend**: The Hono server handles both JSON API responses and HTML rendering for the `/p/:id` route, ensuring a consistent expiry/view-count logic.
2. **Glassmorphism UI**: The frontend uses a modern, dark-themed design with backdrop filters and gradients to provide a premium feel.
3. **Safe Rendering**: All content rendered in HTML is escaped to prevent XSS attacks.
4. **Proxy Setup**: Vite is configured with a server proxy to avoid CORS issues and simplify local development.
