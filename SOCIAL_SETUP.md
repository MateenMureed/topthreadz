# Social Publishing Setup Guide — Meta Graph API

This guide walks you through connecting Top Threadz to your Facebook Page and Instagram Business account so the admin panel can auto-post product content via the official **Meta Graph API v20.0**.

---

## Prerequisites

- A **Facebook Page** for Top Threadz (not a personal profile)
- An **Instagram Professional or Business account** connected to that Facebook Page
- A **Meta Developer App** (free — create one at [developers.facebook.com](https://developers.facebook.com))

---

## Step 1 — Create a Meta Developer App

1. Go to [https://developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click **Create App**
3. Choose app type: **Business**
4. Enter your app name (e.g. `Top Threadz Publisher`) and contact email
5. Click **Create App** → you'll land on the App Dashboard

---

## Step 2 — Add Required Products

Inside your app dashboard, find **Add a Product** and add both:

### A. Facebook Login
- Click **Set Up** next to Facebook Login
- In the settings, add your backend callback URL (not needed for server-side publishing)

### B. Instagram Graph API
- Click **Set Up** next to Instagram Graph API
- This allows posting to Instagram Business accounts

---

## Step 3 — Get Required Permissions

For the Graph API Explorer (next step), you need these permissions:
- `pages_manage_posts` — post to your Facebook Page
- `pages_read_engagement` — read page info
- `instagram_basic` — read basic IG account info
- `instagram_content_publish` — publish to Instagram

---

## Step 4 — Generate a Page Access Token

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Select your **App** from the top-right dropdown
3. Click **Generate Access Token** → log in and grant the permissions above
4. In the **User or Page** dropdown, select your **Facebook Page** (not your personal account)
5. Click **Generate Page Access Token**
6. Copy the token — this is a **short-lived token** (expires in ~1 hour)

---

## Step 5 — Extend to a Long-Lived Token (60 days)

The short-lived token expires quickly. Extend it:

```bash
GET https://graph.facebook.com/v20.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=YOUR_META_APP_ID
  &client_secret=YOUR_META_APP_SECRET
  &fb_exchange_token=YOUR_SHORT_LIVED_PAGE_ACCESS_TOKEN
```

You can run this in your browser or use [Graph API Explorer](https://developers.facebook.com/tools/explorer). The response will contain a `access_token` that lasts 60 days.

> **Note:** Long-lived tokens still expire. Set a calendar reminder to refresh before 60 days. Future versions can use a Webhook or System User token (never expires) for production.

---

## Step 6 — Find Your Page ID

```bash
GET https://graph.facebook.com/v20.0/me/accounts?access_token=YOUR_TOKEN
```

This returns all Pages you manage. The `id` field is your **Facebook Page ID**.

Alternatively:
- Go to your Facebook Page → **Settings** → **About** → **Page ID**

---

## Step 7 — Find Your Instagram Business Account ID

Your Instagram account must be a **Professional/Business** account and linked to the Facebook Page.

```bash
GET https://graph.facebook.com/v20.0/YOUR_PAGE_ID
  ?fields=instagram_business_account
  &access_token=YOUR_TOKEN
```

The response will include:
```json
{
  "instagram_business_account": { "id": "17841400000000000" },
  "id": "1234567890"
}
```

The `instagram_business_account.id` is your **Instagram Account ID**.

---

## Step 8 — Set Vercel Environment Variables

In your **backend** Vercel project → **Settings** → **Environment Variables**, add:

### Required (Facebook Auto-Posting)
| Variable | Value | Notes |
|---|---|---|
| `META_PAGE_ACCESS_TOKEN` | Your 60-day long-lived Page Access Token | **Required** for posting to Facebook |
| `META_FACEBOOK_PAGE_ID` | Your Facebook Page numeric ID | **Required** for identifying target page |

### Optional (Instagram & Token Extensions)
| Variable | Value | Notes |
|---|---|---|
| `META_INSTAGRAM_ACCOUNT_ID` | Your Instagram Business Account numeric ID | **Optional** — add whenever you are ready to publish to Instagram |
| `META_APP_ID` | Your Meta App ID (from App Dashboard) | Optional helper for app reference & token extensions |
| `META_APP_SECRET` | Your Meta App Secret | Optional helper for token extensions |
| `STORE_FRONTEND_URL` | `https://www.topthreadz.com.pk` | Defaults to frontend URL |

> ⚠️ **Security**: These must ONLY be in the backend project. Never set them as `NEXT_PUBLIC_*` variables or in the frontend project. The admin UI never receives these values — all Meta API calls happen server-side.

---

## Step 9 — Redeploy Backend

After adding the env vars, trigger a redeploy of your backend Vercel project.

Then visit `/admin/social` in the admin panel — the status banner should turn green showing:
> ✅ Meta connected — Top Threadz
> Facebook Page ID: 123456789 · Instagram: Not connected (Optional)

---

## Troubleshooting

| Error | Fix |
|---|---|
| `OAuthException: Invalid OAuth access token` | Token expired — generate and extend a new token |
| `The user must be an administrator of the page` | The token was generated for the wrong account |
| `Unsupported post request` | Check that your app has the right permissions enabled |
| `The image url is invalid` | The product image must be a public HTTPS URL (Cloudinary URLs work fine) |
| `Instagram account is not a business account` | Convert your IG account to Professional in IG settings |

---

## Token Refresh Reminder

Long-lived tokens expire after **60 days**. Before expiry:
1. Use your existing token to get a new one via the exchange endpoint (Step 5)
2. Update `META_PAGE_ACCESS_TOKEN` in Vercel
3. Redeploy backend

---

## Official Meta Documentation

- [Graph API Reference](https://developers.facebook.com/docs/graph-api/reference)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Page Photos API](https://developers.facebook.com/docs/graph-api/reference/page/photos/)
- [Long-Lived Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/)
