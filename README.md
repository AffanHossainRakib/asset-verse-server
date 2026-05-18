# AssetVerse Backend

AssetVerse backend is an Express MVC API for the B2B asset management platform. It handles authentication, asset inventory, employee affiliation, asset requests, subscriptions, and payment flow.

## Tech Stack

- Node.js
- Express
- MongoDB Atlas
- Firebase Admin
- Stripe
- CORS
- dotenv

## What This API Does

- Verifies Firebase users and protects private routes
- Manages company assets, employee affiliations, and asset requests
- Supports HR package limits and subscription upgrades
- Integrates Stripe checkout for payment and package changes

## Main Modules

- `src/controllers` for business logic
- `src/models` for MongoDB data access
- `src/routes` for API endpoints
- `src/middlewares` for auth and role checks
- `src/config` for database, Firebase Admin, and Stripe setup

## Setup

- `npm install`
- `npm run dev`

## Deployment

- Vercel-ready entrypoint is exported from `index.js`
- API routes are mounted under `/api`
- Set `MONGODB_URI`, Firebase Admin, Stripe, and client origin env values in production
