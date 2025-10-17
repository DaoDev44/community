# API Contract Overview: Charitable Donation Matching Platform

**Date**: 2025-10-15
**Feature**: 001-lets-build-a
**API Style**: REST
**Base URL**: `/api/v1`
**Authentication**: JWT (via OAuth or email/password)

Full OpenAPI 3.0 spec will be generated from TypeScript types using `ts-json-schema-generator`.

---

## Authentication Endpoints

### POST /auth/register
Register new user (donator or recipient)
- **Body**: `{ email, password, role: 'donator' | 'recipient' }`
- **Response**: `{ user, token }`

### POST /auth/login
Login with email/password
- **Body**: `{ email, password }`
- **Response**: `{ user, token }`

### GET /auth/oauth/:provider
Initiate OAuth flow (Google, Amazon, Facebook)
- **Params**: `provider`
- **Redirects**: To OAuth provider

### GET /auth/oauth/:provider/callback
OAuth callback handler
- **Query**: `code, state`
- **Response**: `{ user, token }` + redirect to dashboard

---

## Donator Endpoints (FR-001 to FR-008)

### GET /donators/me
Get current donator profile
- **Auth**: Required (donator)
- **Response**: `DonatorProfile`

### GET /recipients
Browse recipients (with filtering)
- **Query**: `location?, needType?, verificationStatus?, page?, limit?`
- **Response**: `{ recipients: RecipientProfile[], total, page, limit }`
- **Maps to**: FR-002, FR-004

### GET /recipients/:id
Get detailed recipient profile
- **Auth**: Optional (public endpoint)
- **Response**: `RecipientProfile + needs[]`
- **Maps to**: FR-003

### POST /donations
Create donation
- **Auth**: Required (donator)
- **Body**: `{ recipientId, needIds: [{ needId, quantity }], paymentMethodId, message?, isAnonymous? }`
- **Response**: `{ donation, paymentIntent }`
- **Maps to**: FR-005

### GET /donations
Get donation history
- **Auth**: Required (donator)
- **Query**: `page?, limit?`
- **Response**: `{ donations: Donation[], total }`
- **Maps to**: FR-007

### GET /donations/:id/receipt
Download tax receipt PDF
- **Auth**: Required (donator, must own donation)
- **Response**: PDF file
- **Maps to**: FR-006

### POST /donations/:id/share
Generate social share content
- **Auth**: Required (donator, must own donation)
- **Body**: `{ platform: 'facebook' | 'twitter' | 'sms' }`
- **Response**: `{ shareUrl, message }`
- **Maps to**: FR-008

---

## Recipient Endpoints (FR-009 to FR-015)

### GET /recipients/me
Get current recipient profile
- **Auth**: Required (recipient)
- **Response**: `RecipientProfile`

### PUT /recipients/me
Update recipient profile
- **Auth**: Required (recipient)
- **Body**: `Partial<RecipientProfile>`
- **Response**: `RecipientProfile`
- **Maps to**: FR-010

### POST /recipients/me/photos
Upload profile photos
- **Auth**: Required (recipient)
- **Body**: Multipart form data (max 5 files, 5MB each)
- **Response**: `{ photoUrls: string[] }`
- **Maps to**: FR-010

### GET /needs
Get recipient's needs list
- **Auth**: Required (recipient)
- **Response**: `Need[]`

### POST /needs
Create new need
- **Auth**: Required (recipient)
- **Body**: `{ title, description, marketplaceProductId?, quantity, urgency, needType }`
- **Response**: `Need`
- **Maps to**: FR-011

### PUT /needs/:id
Update need
- **Auth**: Required (recipient, must own need)
- **Body**: `Partial<Need>`
- **Response**: `Need`

### DELETE /needs/:id
Delete need
- **Auth**: Required (recipient, must own need)
- **Response**: `204 No Content`

### POST /verification
Submit verification request
- **Auth**: Required (recipient)
- **Body**: Multipart form data (ID, documents)
- **Response**: `VerificationRequest`
- **Maps to**: FR-012

### PATCH /needs/:id/fulfill
Mark need as fulfilled
- **Auth**: Required (recipient, must own need)
- **Response**: `Need`
- **Maps to**: FR-015

### POST /recipients/me/thank-you
Send thank-you message to donator
- **Auth**: Required (recipient)
- **Body**: `{ donationId, message }`
- **Response**: `204 No Content`
- **Maps to**: FR-015

---

## Marketplace Integration Endpoints (FR-016 to FR-020)

### GET /marketplace/search
Search marketplace products
- **Query**: `q, category?, page?, limit?`
- **Response**: `{ products: MarketplaceProduct[], total }`
- **Used by**: Recipients creating needs (FR-011)

### GET /marketplace/products/:id
Get product details with real-time price
- **Params**: `id`
- **Response**: `MarketplaceProduct`
- **Maps to**: FR-019

### GET /orders/:donationId
Get order fulfillment status
- **Auth**: Required (donator or recipient, must be involved in donation)
- **Response**: `Order + items[]`
- **Maps to**: FR-020

---

## Admin Endpoints (Verification - FR-021 to FR-024)

### GET /admin/verification-requests
List pending verifications
- **Auth**: Required (admin)
- **Query**: `status?, page?, limit?`
- **Response**: `{ requests: VerificationRequest[], total }`

### GET /admin/verification-requests/:id
Get verification request details
- **Auth**: Required (admin)
- **Response**: `VerificationRequest + recipient + documents`

### PATCH /admin/verification-requests/:id
Approve/reject verification
- **Auth**: Required (admin)
- **Body**: `{ status: 'approved' | 'rejected', reviewerNotes?, rejectionReason? }`
- **Response**: `VerificationRequest`
- **Maps to**: FR-021, FR-024

### POST /admin/recipients/:id/flag
Flag recipient for fraud review
- **Auth**: Required (admin)
- **Body**: `{ reason }`
- **Response**: `RecipientProfile`
- **Maps to**: FR-023

---

## Webhooks (External Integration)

### POST /webhooks/stripe
Stripe payment confirmation webhook
- **Auth**: Stripe signature verification
- **Body**: Stripe event object
- **Triggers**: Order placement, tax receipt generation

### POST /webhooks/marketplace/:partner
Marketplace order status updates
- **Auth**: Partner-specific signature
- **Body**: Order status event
- **Triggers**: Order status updates, tracking info

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

## HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `204 No Content`: Success with no response body
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour
- **Admin**: 5000 requests/hour
- **Marketplace sync**: 8,640 requests/day (Amazon API limit)

---

## Security

- **CORS**: Configured for frontend domain only
- **CSRF**: Token-based protection for state-changing operations
- **SQL Injection**: Prevented via Prisma parameterized queries
- **XSS**: Input sanitization on all text fields
- **File Upload**: Size limits, type validation, virus scanning
- **Secrets**: Environment variables, never in code

---

## Contract Testing Strategy

1. **OpenAPI Spec Generation**: Generate from TypeScript types
2. **Contract Tests**: Supertest validates responses match schema
3. **Frontend Integration**: Generated TypeScript client from OpenAPI spec ensures type safety
4. **Versioning**: `/api/v1` prefix allows future breaking changes via `/api/v2`
