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
The application uses **Prisma ORM** with **PostgreSQL** (standard for Vercel/Neon deployments). The schema includes a `Paste` model that tracks `content`, `expiresAt`, and `remainingViews`.

## Vercel Deployment

This project is configured for a single-repo deployment on Vercel.

1.  **Create a New Project** on Vercel and connect your GitHub repository.
2.  **Add Vercel Postgres**:
    *   In the Vercel dashboard, go to the **Storage** tab.
    *   Create a new **Postgres** database.
    *   Connect it to your project. This will automatically add the `DATABASE_URL` environment variable.
3.  **Deploy**:
    *   Vercel will detect the project structure.
    *   The `vercel.json` file handles routing:
        *   React frontend is served as static files.
        *   `/api/*` and `/p/*` routes are handled by the Hono serverless function in `api/index.ts`.

## Running Locally

### Prerequisites
- Node.js (v20+)
- A PostgreSQL database (or you can revert `prisma/schema.prisma` to `sqlite` for purely local testing).

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your environment variables in a `.env` file:
   ```text
   DATABASE_URL="your-postgres-connection-string"
   ```
3. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Start Development Servers
```bash
npm run dev
```
- Backend starts on `http://localhost:3000`
- Frontend starts on `http://localhost:5173` (proxies `/api` and `/p` to the backend)

## Important Design Decisions
1. **Serverless Ready**: The backend is adapted to run as a Vercel Serverless Function using the `hono/vercel` adapter.
2. **Unified Logic**: Both the JSON API and the HTML view share the same Prisma logic for expiry and view count enforcement.
3. **Glassmorphism UI**: High-end aesthetic using modern CSS.
4. **Safe Rendering**: Built-in HTML escaping for the paste viewer.

