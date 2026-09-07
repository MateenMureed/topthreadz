# Email Deliverability — SPF DNS Record

Emails sent from your domain (order confirmations, password resets, support
replies) must carry an SPF record, or receiving servers (Gmail, Outlook) may
spam-bin or reject them — which also erodes the domain trust that supports
your search rankings.

## 1. Add the SPF record (DNS)

In your DNS provider (where `topthreadz.com.pk` nameservers point — Zoho/Cloudflare/GoDaddy/Hostinger etc.), add a **TXT** record:

| Field | Value |
|---|---|
| Type | TXT |
| Host / Name | `@` (root domain) |
| Value | `v=spf1 include:zoho.com include:sendgrid.net ~all` |
| TTL | 3600 (or default) |

Adjust the `include:` list to match whoever actually sends mail for you:

- **Zoho Mail** (support@topthreadz.pk mailbox): `include:zoho.com`
- **SendGrid / Mailgun / Resend** (app transactional email): `include:sendgrid.net` or your provider's include
- **Google Workspace**: `include:_spf.google.com`

> **Only one SPF record may exist** on the root domain. If a TXT starting with
> `v=spf1` already exists, merge the includes into that single record rather
> than adding a second one.

## 2. Verify propagation

```bash
nslookup -type=TXT topthreadz.com.pk
# or
dig TXT topthreadz.com.pk +short
```

The answer must show exactly one `v=spf1 ...` string.

## 3. Recommended additions

- **DKIM**: enable in your mail provider's admin console and add the DKIM
  CNAME/TXT keys it shows. SPF alone doesn't sign mail; DKIM does.
- **DMARC**: after SPF+DKIM verify, add a TXT record at `_dmarc.topthreadz.com.pk`:
  `v=DMARC1; p=quarantine; rua=mailto:support@topthreadz.pk`
  Start with `p=none` for a week to monitor, then move to `quarantine`.

---

# Analytics Setup (GA4 + Facebook Pixel)

Both trackers ship in code (`components/Analytics.tsx`) and activate
automatically when their environment variables exist — no code changes needed.

1. **GA4**: create a property at https://analytics.google.com → copy the
   Measurement ID (`G-XXXXXXXXXX`).
2. **Facebook Pixel**: create at https://business.facebook.com/events_manager
   → copy the numeric Pixel ID.
3. In Vercel (frontend project) → Settings → Environment Variables, add:

   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_FB_PIXEL_ID=1234567890
   ```

4. Redeploy. Verify with the GA Tag Assistant / Facebook Pixel Helper browser
   extensions, and real-time reports in each dashboard.

Events currently sent: GA4 `page_view` (automatic) and Facebook `PageView`
(automatic). E-commerce conversion events (add-to-cart, purchase) can be
layered on later via `gtag('event', ...)` / `fbq('track', ...)`.
