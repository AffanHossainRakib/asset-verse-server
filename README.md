# AssetVerse Backend

Project: AssetVerse (backend API)

## Purpose

Express API supporting the AssetVerse platform: authentication, asset inventory, employee affiliations, requests, assignments, payments, and subscription enforcement.

## Live URLs

- Backend API: [https://asset-verse-server-ten.vercel.app/](https://asset-verse-server-ten.vercel.app/)
- Frontend: [https://asset-verse-new.vercel.app/](https://asset-verse-new.vercel.app/)

## Key features

- Firebase token validation and role-based access (HR/Employee)
- MongoDB Atlas data models for assets, requests, assigned assets, packages, subscriptions, companies, and employee affiliations
- Direct assignment endpoint (HR) and safe return handling that restores asset availability
- Stripe integration for package subscriptions and payments

## Core npm packages (selected)

- express
- mongodb
- firebase-admin
- dotenv
- cors
- stripe

## Local setup

1. Install dependencies:

   cd asset-verse-server
   npm install

2. Create `.env` from example and set values (see Environment variables):

   cp .env.example .env

3. Run in development:

   npm run dev

## Environment variables (backend)

- `MONGODB_URI` — Primary MongoDB connection string (required)
- `MONGODB_URI_FALLBACK` — Optional fallback connection string for SRV DNS failures
- `MONGODB_DNS_SERVERS` — Optional comma-separated DNS servers for SRV lookups (example: `8.8.8.8,1.1.1.1`)
- `FB_SERVICE_KEY` — Base64-encoded Firebase service account JSON (decoded at runtime)
- `STRIPE_SECRET_KEY` — Stripe secret key for API calls
- `CLIENT_URL` — Frontend origin used for CORS (if unset, CORS origin defaults to allow all)
- `PORT` — Local server port (dev only)
- `NODE_ENV` — Environment mode (e.g. `development`, `production`)

## Deployment notes

- The Express `app` is exported from `index.js` so the project is Vercel friendly. Do not call `app.listen()` in production serverless functions.
- When deploying the frontend, set the frontend `VITE_API_URL` to this API origin at build-time.
