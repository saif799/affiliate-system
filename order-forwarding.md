# Order Forwarding — Receiver Spec

This document describes the HTTP request the Shopify affiliate app sends to **your
service** whenever a COD order is attributed to an affiliate. Build an endpoint
that accepts it.

## When it fires

For every Shopify `orders/create` that the app successfully attributes to an
affiliate (i.e. an affiliate id was found on the order), the app sends **one POST
request** to the URL configured as `ATTRIBUTION_FORWARD_URL`. Unattributed orders
are **not** forwarded.

## Transport

- **Method:** `POST`
- **Content-Type:** `application/json; charset=utf-8`
- **Body:** a single JSON object (schema below)
- **Expected response:** any `2xx` to acknowledge. Non-2xx (or timeout) is logged
  and retried **once**. Respond quickly (within a few seconds).

## Authenticity (HMAC)

If the app is configured with a shared secret (`ATTRIBUTION_FORWARD_SECRET`), each
request includes this header:

```
X-Affiliate-Hmac-Sha256: <base64 HMAC-SHA256 of the raw request body, keyed by the shared secret>
```

Verify it by computing the same HMAC over the **raw request body bytes** and
comparing (constant-time) to the header. Node example:

```js
import { createHmac, timingSafeEqual } from "node:crypto";

function isValid(rawBody, header, secret) {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const got = Buffer.from(header ?? "", "base64");
  return expected.length === got.length && timingSafeEqual(expected, got);
}
```

If no secret is configured, the header is absent.

## Idempotency

The same order may be delivered **more than once** (webhook retries, redeliveries).
**De-duplicate on `shop` + `order.id`** and treat repeats as updates, not new sales.

## Payload schema

Top level:

| Field | Type | Description |
| --- | --- | --- |
| `event` | string | Always `"order.attributed"`. |
| `sentAt` | string (ISO 8601) | When the app sent this request. |
| `shop` | string | The Shopify store domain, e.g. `acme.myshopify.com`. Use with `order.id` as the idempotency key. |
| `affiliateId` | string | The raw affiliate id captured from the affiliate link (the value of the `ref` URL param). Resolve it to an affiliate on your side. |
| `order` | object | The order details (below). |

`order`:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Shopify order id (numeric, as a string). |
| `gid` | string \| null | Shopify GraphQL id, e.g. `gid://shopify/Order/1234567890`. |
| `number` | number \| null | Sequential order number. |
| `name` | string \| null | Display name, e.g. `#1001`. |
| `createdAt` | string \| null | Order creation time (ISO 8601). |
| `currency` | string \| null | ISO currency code, e.g. `DZD`. |
| `totalPrice` | string \| null | Order total as a decimal string in `currency`. |
| `subtotalPrice` | string \| null | Items subtotal (decimal string). |
| `totalTax` | string \| null | Tax total (decimal string). |
| `totalDiscounts` | string \| null | Discounts total (decimal string). |
| `totalShipping` | string \| null | Shipping total (decimal string). |
| `financialStatus` | string \| null | e.g. `pending` (typical for COD). |
| `note` | string \| null | Order note, if any. |
| `noteAttributes` | array | Raw order custom fields: `[{ name, value }]`. Includes things EasySell stamps (e.g. `full_url`, the affiliate custom field). |
| `lineItems` | array | Ordered products (below). |
| `customer` | object | Buyer contact (below). |
| `shippingAddress` | object \| null | Delivery address (below). |

`order.lineItems[]`:

| Field | Type | Description |
| --- | --- | --- |
| `title` | string \| null | Product title. |
| `variantTitle` | string \| null | Variant title, if any. |
| `sku` | string \| null | SKU. For app-synced products this matches the Platform `sku`. |
| `quantity` | number | Quantity ordered. |
| `price` | string \| null | Unit price (decimal string, in `currency`). |
| `productId` | string \| null | Shopify product id (numeric, as string). |
| `variantId` | string \| null | Shopify variant id (numeric, as string). |

`order.customer`:

| Field | Type | Description |
| --- | --- | --- |
| `firstName` | string \| null | |
| `lastName` | string \| null | |
| `email` | string \| null | |
| `phone` | string \| null | Buyer phone (commonly the key contact for COD). |

`order.shippingAddress` (or `null`):

| Field | Type | Description |
| --- | --- | --- |
| `name` | string \| null | Recipient name. |
| `phone` | string \| null | |
| `address1` | string \| null | |
| `address2` | string \| null | |
| `city` | string \| null | |
| `province` | string \| null | State/province (wilaya). |
| `country` | string \| null | |
| `countryCode` | string \| null | ISO country code. |
| `zip` | string \| null | |

> Money values are **strings** to preserve precision. For DZD they are whole-dinar
> amounts (no decimals), but parse them as decimals to be safe. Any field may be
> `null` if the order didn't include it.

## Example

```json
{
  "event": "order.attributed",
  "sentAt": "2026-06-20T12:34:56.000Z",
  "shop": "acme.myshopify.com",
  "affiliateId": "AFF123",
  "order": {
    "id": "5123456789012",
    "gid": "gid://shopify/Order/5123456789012",
    "number": 1001,
    "name": "#1001",
    "createdAt": "2026-06-20T12:34:50-00:00",
    "currency": "DZD",
    "totalPrice": "4500",
    "subtotalPrice": "4500",
    "totalTax": "0",
    "totalDiscounts": "0",
    "totalShipping": "0",
    "financialStatus": "pending",
    "note": null,
    "noteAttributes": [
      { "name": "full_url", "value": "https://acme.myshopify.com/products/earbuds?ref=AFF123" },
      { "name": "affiliate_id", "value": "AFF123" }
    ],
    "lineItems": [
      {
        "title": "Wireless Earbuds Pro",
        "variantTitle": null,
        "sku": "EARBUDS-PRO-01",
        "quantity": 1,
        "price": "4500",
        "productId": "8123456789012",
        "variantId": "44086909468806"
      }
    ],
    "customer": {
      "firstName": "Test",
      "lastName": null,
      "email": null,
      "phone": "+213558348789"
    },
    "shippingAddress": {
      "name": "Test",
      "phone": "+213558348789",
      "address1": "Rue Didouche Mourad",
      "address2": null,
      "city": "Algiers",
      "province": "Algiers",
      "country": "Algeria",
      "countryCode": "DZ",
      "zip": null
    }
  }
}
```
