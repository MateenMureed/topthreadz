# Vercel serverless deployment

This backend deploys from the `backend` directory. Its single Vercel function (`api/index.ts`) dispatches all existing `/api/*` endpoints to the preserved Express route modules. It does not open a port or write images/logs to disk.

## Environment variables

Set these in the Vercel project for Production, Preview (as appropriate), and Development:

- `DATABASE_URL` — Neon **pooled** PostgreSQL connection string, including `sslmode=require`.
- `JWT_SECRET` — a random secret of at least 32 characters. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are supported for existing installations.
- `FRONTEND_URL` — exact deployed frontend origin, for example `https://store.vercel.app`.
- `CORS_ORIGIN` — comma-separated allowed browser origins; normally the same as `FRONTEND_URL`.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — server-only Cloudinary credentials.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — persistent serverless rate limiting (strongly recommended in production).
- `BACKEND_PUBLIC_URL` — backend Vercel URL, required when OAuth callbacks are enabled.
- Existing optional integrations: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_REDIRECT_URI`, `SAFEPAY_ENVIRONMENT`, `SAFEPAY_API_KEY`, `SAFEPAY_WEBHOOK_SECRET`, `SAFEPAY_CURRENCY`, and commerce settings in `.env.example`.

Never put backend secrets in `NEXT_PUBLIC_*` or `VITE_*` variables. The frontend only needs `NEXT_PUBLIC_API_URL=https://your-api.vercel.app/api` (or its existing `VITE_API_URL` fallback).

## Deploy

1. In Neon, copy the pooled connection string and set it as `DATABASE_URL`; do **not** run `prisma migrate reset`.
2. Create a Cloudinary product folder through the configured credentials (uploads use `ecommerce-products`).
3. Import the repository into Vercel as two projects: frontend root `frontend`, backend root `backend`.
4. Set the backend variables above, then deploy. Set `BACKEND_PUBLIC_URL` to the resulting backend URL and redeploy if OAuth is used.
5. Set `NEXT_PUBLIC_API_URL` in the frontend project to `https://your-api.vercel.app/api`, then deploy the frontend.
6. Verify `GET https://your-api.vercel.app/api/health` returns `{ "status": "ok", "database": "connected" }`.

## Smoke test

Test an admin login/logout; a non-admin product write (must return 403); product list/details; admin product create/update/delete; image upload/replacement/deletion; cart/order/payment flows; recommendations; and `/api/health`. Cloudinary uploads return existing `data.urls` plus `data.images` with `{ url, publicId }`; the admin UI stores this metadata in `Product.imageMeta` for deletion cleanup.
