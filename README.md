# Cityfashion Vite Storefront

A Vite + React storefront that mirrors the Next.js UI, wired to the ecommerce API backend.

## Getting started

1. Create an `.env` file based on `.env.example`:
   - `VITE_API_URL` (defaults to `http://localhost:4000`)
2. Install dependencies and run:

```bash
npm install
npm run dev
```

## Features

- Hero carousel + curated category preview
- Product listing with search, sort, filters, and pagination
- Product detail with gallery and related items
- Local cart with checkout flow (orders require auth)
- Orders + profile pages for authenticated users

## Notes

- Login uses the backend Google OAuth redirect flow (`/auth/google/redirect` -> `/auth/google/callback`).
- Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `FRONTEND_URL` in the ecommerce API.
- If you already have a JWT, paste it into the manual token field on the login page.
# frontend
# cfmfront
