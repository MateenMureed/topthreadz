# API Documentation — MensWear.pk Backend

Base URL: `http://localhost:5000/api`

---

## Authentication

### POST `/auth/signup`
Register a new user account.
```json
{
  "name": "Muhammad Ali",
  "email": "ali@example.com",
  "phone": "03001234567",
  "password": "StrongPass1"
}
```

### POST `/auth/verify-otp`
Verify account with OTP.
```json
{ "email": "ali@example.com", "otp": "123456" }
```

### POST `/auth/login`
Login and receive access token. Refresh token set in HTTP-only cookie.
```json
{ "email": "ali@example.com", "password": "StrongPass1" }
```
**Response:** `{ user, accessToken }`

### POST `/auth/refresh`
Refresh access token using HTTP-only cookie.

### POST `/auth/logout`
Clear refresh token cookie.

### POST `/auth/forgot-password`
```json
{ "email": "ali@example.com" }
```

### POST `/auth/reset-password`
```json
{ "token": "uuid-token", "password": "NewStrongPass1" }
```

---

## Products (Public)

### GET `/products`
List products with filtering and pagination.

| Query Param | Description |
|------------|-------------|
| `page` | Page number (default: 1) |
| `limit` | Items per page (default: 12) |
| `category` | Filter by category |
| `minPrice` | Minimum price |
| `maxPrice` | Maximum price |
| `size` | Filter by size |
| `search` | Search by name/description |
| `sortBy` | `newest`, `price_asc`, `price_desc` |

### GET `/products/:id`
Get product by ID (includes reviews).

### GET `/products/slug/:slug`
Get product by slug.

### GET `/products/categories`
List all categories.

### GET `/products/suggestions?q=search`
Search autocomplete suggestions.

### GET `/products/:id/similar`
Get similar products (AI-based).

---

## Cart (Authenticated)

### GET `/cart`
Get current user's cart.

### POST `/cart/items`
Add item to cart.
```json
{
  "productId": "uuid",
  "quantity": 2,
  "size": "L",
  "color": "White"
}
```

### PATCH `/cart/items/:itemId`
Update cart item quantity.
```json
{ "quantity": 3 }
```

### DELETE `/cart/items/:itemId`
Remove item from cart.

### DELETE `/cart`
Clear entire cart.

---

## Orders (Authenticated)

### POST `/orders`
Create order from cart.
```json
{ "addressId": "uuid", "notes": "Please deliver after 5 PM" }
```

### GET `/orders`
List user's orders (paginated).

### GET `/orders/:id`
Get order details.

---

## Payments (Authenticated)

### POST `/payments/initiate`
Initiate payment for an order.
```json
{ "orderId": "uuid", "method": "SAFEPAY" }
```
Methods:

| Method | Use |
|--------|-----|
| `SAFEPAY` | Credit/debit card payments through Safepay hosted checkout. |
| `COD` | Cash on delivery. Payment remains pending until collected/verified. |

Safepay creates a tracker server-side and redirects the shopper to its hosted checkout. The browser return is informational only; mark payments paid only from the signed `POST /payments/webhook/safepay` webhook (`X-SFPY-SIGNATURE`).

For the Bank Alfalah APG staging Credentials Generator:

| Portal Field | Local Development Value | Production/Staging Value |
|--------------|--------------------------|--------------------------|
| Webhook URL | `http://localhost:5000/api/payments/webhook/safepay` | `https://your-domain.com/api/payments/webhook/safepay` |

After credentials are generated, copy Merchant Hash, Merchant Username, Merchant Password, Merchant ID, Store ID, KEY1, and KEY2 into backend `.env`.

### GET `/payments/verify/:orderId`
Verify payment status (server-side).

### POST `/payments/webhook/:provider`
Safepay signed webhook listener endpoint.

---

## User (Authenticated)

### GET `/users/profile`
### PATCH `/users/profile`
### GET `/users/addresses`
### POST `/users/addresses`
### PATCH `/users/addresses/:addressId`
### DELETE `/users/addresses/:addressId`

---

## Admin (Admin Only)

### GET `/admin/dashboard`
Dashboard statistics (revenue, orders, users, products).

### GET `/admin/users`
### PATCH `/admin/users/:id/role`
### POST `/admin/users/:id/unlock`

### GET `/admin/orders`
### PATCH `/admin/orders/:id/status`

### GET `/admin/payments/pending`
### POST `/admin/payments/:id/verify`
```json
{ "approved": true }
```

### GET `/admin/audit-logs`

---

## Recommendations (Authenticated)

### GET `/recommendations`
Get personalized product recommendations.

---

## Health Check

### GET `/health`
```json
{ "status": "ok", "timestamp": "2026-04-18T..." }
```
