# Data Model: Charitable Donation Matching Platform

**Date**: 2025-10-15
**Feature**: 001-lets-build-a
**Database**: PostgreSQL 15+ with Prisma ORM
**Source**: Entities extracted from spec.md Key Entities section

---

## Entity Relationship Diagram (Text)

```
User (polymorphic base)
├── Donator (extends User)
│   ├── has many → Donation
│   ├── has many → Milestone
│   └── has one → DonatorProfile
└── Recipient (extends User)
    ├── has many ← Donation
    ├── has many → Need
    ├── has many → Cause (many-to-many)
    ├── has one → RecipientProfile
    └── has one → VerificationRequest

Donation
├── belongs to → Donator
├── belongs to → Recipient
├── fulfills many → Need (many-to-many via DonationItem)
└── creates one → Order

Need
├── belongs to → Recipient
├── references → MarketplaceProduct
└── fulfilled by many → Donation (via DonationItem)

MarketplacePartner
└── provides many → MarketplaceProduct

MarketplaceProduct
├── belongs to → MarketplacePartner
└── referenced by many → Need

Order
├── created by → Donation
├── placed with → MarketplacePartner
└── contains many → OrderItem

Cause
└── associated with many → Recipient (many-to-many)
```

---

## Entities

### User (Base Table)

**Purpose**: Polymorphic base for all users (donators, recipients, admins)

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| emailVerified | BOOLEAN | DEFAULT FALSE | Email verification status |
| passwordHash | VARCHAR(255) | NULLABLE | Bcrypt hash (null for OAuth-only users) |
| role | ENUM('donator', 'recipient', 'admin') | NOT NULL | User role |
| createdAt | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| lastLoginAt | TIMESTAMP | NULLABLE | Last login timestamp |

**Validation Rules**:
- Email must be valid format (RFC 5322)
- At least one authentication method required (password or OAuth)
- Role cannot be changed after creation (immutable)

---

### OAuthAccount

**Purpose**: Stores OAuth provider credentials for social login

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | FOREIGN KEY → User.id, NOT NULL | Associated user |
| provider | ENUM('google', 'amazon', 'facebook') | NOT NULL | OAuth provider |
| providerAccountId | VARCHAR(255) | NOT NULL | Provider's user ID |
| accessToken | TEXT | NULLABLE | Encrypted access token |
| refreshToken | TEXT | NULLABLE | Encrypted refresh token |
| expiresAt | TIMESTAMP | NULLABLE | Token expiration |
| createdAt | TIMESTAMP | DEFAULT NOW() | Link creation timestamp |

**Validation Rules**:
- UNIQUE(userId, provider) - one account per provider per user
- Tokens stored encrypted at rest

---

### DonatorProfile

**Purpose**: Additional profile information for donators

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | FOREIGN KEY → User.id, UNIQUE, NOT NULL | Associated user |
| displayName | VARCHAR(100) | NULLABLE | Public display name |
| totalDonated | DECIMAL(10,2) | DEFAULT 0, CHECK >= 0 | Lifetime donation total (USD) |
| donationCount | INTEGER | DEFAULT 0, CHECK >= 0 | Number of donations made |
| recipientsHelped | INTEGER | DEFAULT 0, CHECK >= 0 | Unique recipients supported |
| preferences | JSONB | DEFAULT '{}' | User preferences (filters, notifications) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Profile creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**JSONB preferences structure**:
```json
{
  "notifications": {
    "email": true,
    "donationConfirmation": true,
    "deliveryUpdates": true
  },
  "defaultFilters": {
    "location": "US-CA",
    "needTypes": ["housing", "food"]
  }
}
```

---

### RecipientProfile

**Purpose**: Profile information for individuals or organizations receiving donations

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| userId | UUID | FOREIGN KEY → User.id, UNIQUE, NOT NULL | Associated user |
| recipientType | ENUM('individual', 'organization') | NOT NULL | Type of recipient |
| displayName | VARCHAR(100) | NOT NULL | Public name |
| story | TEXT | NOT NULL | Backstory/situation description |
| location | VARCHAR(255) | NOT NULL | City, State, Country |
| photoUrls | TEXT[] | DEFAULT '{}' | Array of S3 URLs for profile photos |
| verificationStatus | ENUM('pending', 'verified', 'rejected', 'flagged') | DEFAULT 'pending' | Current verification status |
| verificationBadge | VARCHAR(50) | NULLABLE | Verification badge type |
| deliveryAddress | JSONB | NULLABLE | Delivery address or alternative location |
| organizationTaxId | VARCHAR(50) | NULLABLE | 501c3 EIN or org tax ID |
| createdAt | TIMESTAMP | DEFAULT NOW() | Profile creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**JSONB deliveryAddress structure**:
```json
{
  "type": "standard" | "shelter" | "community_center" | "partner_location" | "general_delivery",
  "street": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip": "94102",
  "country": "US",
  "specialInstructions": "Leave at front desk",
  "contactPhone": "+1-555-123-4567"
}
```

**Validation Rules**:
- story must be 50-5000 characters
- photoUrls limited to 5 URLs max
- organizationTaxId required if recipientType is 'organization'

---

### VerificationRequest

**Purpose**: Tracks recipient verification submissions and review status

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| recipientId | UUID | FOREIGN KEY → User.id, NOT NULL | Recipient being verified |
| documentUrls | TEXT[] | NOT NULL | S3 URLs of uploaded verification docs |
| status | ENUM('submitted', 'under_review', 'approved', 'rejected', 'additional_info_required') | DEFAULT 'submitted' | Review status |
| submittedAt | TIMESTAMP | DEFAULT NOW() | Submission timestamp |
| reviewedAt | TIMESTAMP | NULLABLE | Review completion timestamp |
| reviewedBy | UUID | FOREIGN KEY → User.id, NULLABLE | Admin who reviewed |
| reviewerNotes | TEXT | NULLABLE | Internal notes from reviewer |
| rejectionReason | TEXT | NULLABLE | Reason for rejection (shown to recipient) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Request creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- documentUrls must contain at least 1 document
- rejectionReason required if status is 'rejected'
- reviewedBy and reviewedAt required if status is not 'submitted' or 'under_review'

**State Transitions**:
- submitted → under_review → (approved | rejected | additional_info_required)
- additional_info_required → submitted (resubmission)

---

### Need

**Purpose**: Items or categories of items a recipient requires

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| recipientId | UUID | FOREIGN KEY → User.id, NOT NULL | Recipient who needs this |
| title | VARCHAR(200) | NOT NULL | Brief title (e.g., "Winter coat") |
| description | TEXT | NOT NULL | Detailed description |
| marketplaceProductId | UUID | FOREIGN KEY → MarketplaceProduct.id, NULLABLE | Linked marketplace product |
| customProductDetails | JSONB | NULLABLE | For items not in marketplace |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Number needed |
| quantityFulfilled | INTEGER | DEFAULT 0, CHECK >= 0 | Number already fulfilled |
| unitPrice | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Price per unit (USD) |
| urgency | ENUM('low', 'medium', 'high', 'critical') | DEFAULT 'medium' | Urgency level |
| needType | ENUM('housing', 'food', 'medical', 'education', 'other') | NOT NULL | Category of need |
| createdAt | TIMESTAMP | DEFAULT NOW() | Need creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Computed Field**:
- `isFulfilled`: BOOLEAN (quantityFulfilled >= quantity)
- `remainingQuantity`: INTEGER (quantity - quantityFulfilled)

**Validation Rules**:
- Either marketplaceProductId OR customProductDetails must be set
- unitPrice auto-synced from marketplaceProduct if linked
- quantityFulfilled cannot exceed quantity

---

### Donation

**Purpose**: A transaction where a donator contributes funds to fulfill recipient needs

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| donatorId | UUID | FOREIGN KEY → User.id, NOT NULL | Donator making donation |
| recipientId | UUID | FOREIGN KEY → User.id, NOT NULL | Recipient receiving donation |
| totalAmount | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Total donation amount (USD) |
| paymentMethod | ENUM('credit_card', 'debit_card', 'google_pay', 'apple_pay', 'cryptocurrency') | NOT NULL | Payment method used |
| paymentIntentId | VARCHAR(255) | UNIQUE, NOT NULL | Stripe payment intent ID |
| paymentStatus | ENUM('pending', 'succeeded', 'failed', 'refunded') | DEFAULT 'pending' | Payment status |
| cryptoCurrency | VARCHAR(10) | NULLABLE | Crypto currency type (BTC, ETH, etc.) |
| cryptoAmount | DECIMAL(18,8) | NULLABLE | Amount in cryptocurrency |
| cryptoExchangeRate | DECIMAL(10,2) | NULLABLE | Exchange rate at time of donation |
| affiliateCommission | DECIMAL(10,2) | DEFAULT 0 | Platform affiliate earnings |
| taxReceiptUrl | VARCHAR(500) | NULLABLE | S3 URL of PDF tax receipt |
| message | TEXT | NULLABLE | Optional message from donator |
| isAnonymous | BOOLEAN | DEFAULT FALSE | Hide donator identity |
| fulfillmentStatus | ENUM('pending', 'order_placed', 'shipped', 'delivered', 'failed') | DEFAULT 'pending' | Order fulfillment status |
| createdAt | TIMESTAMP | DEFAULT NOW() | Donation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- totalAmount must equal sum of DonationItem quantities × unitPrice
- cryptoCurrency, cryptoAmount, cryptoExchangeRate all required if paymentMethod is 'cryptocurrency'
- taxReceiptUrl generated within 30 seconds of paymentStatus 'succeeded'

---

### DonationItem (Join Table)

**Purpose**: Links donations to specific needs they fulfill (many-to-many)

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| donationId | UUID | FOREIGN KEY → Donation.id, NOT NULL | Associated donation |
| needId | UUID | FOREIGN KEY → Need.id, NOT NULL | Need being fulfilled |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Quantity of this need fulfilled |
| unitPrice | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Price per unit at time of donation |
| createdAt | TIMESTAMP | DEFAULT NOW() | Link creation timestamp |

**Validation Rules**:
- UNIQUE(donationId, needId) - one entry per need per donation
- quantity cannot exceed Need.remainingQuantity at time of creation

---

### MarketplacePartner

**Purpose**: External online stores integrated with the platform

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Partner name (Amazon, Walmart) |
| apiEndpoint | VARCHAR(500) | NOT NULL | API base URL |
| apiKeyHash | VARCHAR(255) | NOT NULL | Encrypted API key |
| affiliateProgramId | VARCHAR(100) | NOT NULL | Affiliate program identifier |
| commissionRate | DECIMAL(5,2) | NOT NULL, CHECK 0-100 | Commission rate percentage |
| isActive | BOOLEAN | DEFAULT TRUE | Whether integration is enabled |
| apiRateLimit | INTEGER | NOT NULL | Requests per day limit |
| createdAt | TIMESTAMP | DEFAULT NOW() | Integration creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

### MarketplaceProduct

**Purpose**: Products available from marketplace partners

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| partnerId | UUID | FOREIGN KEY → MarketplacePartner.id, NOT NULL | Source marketplace |
| externalId | VARCHAR(255) | NOT NULL | Partner's product ID (ASIN for Amazon) |
| title | VARCHAR(500) | NOT NULL | Product title |
| description | TEXT | NULLABLE | Product description |
| price | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Current price (USD) |
| imageUrl | VARCHAR(500) | NULLABLE | Product image URL |
| category | VARCHAR(100) | NOT NULL | Product category |
| isAvailable | BOOLEAN | DEFAULT TRUE | In-stock status |
| affiliateUrl | VARCHAR(1000) | NOT NULL | Affiliate link for purchase |
| lastSyncedAt | TIMESTAMP | DEFAULT NOW() | Last price/availability sync |
| createdAt | TIMESTAMP | DEFAULT NOW() | Product creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- UNIQUE(partnerId, externalId) - one entry per product per partner
- lastSyncedAt must be within 5 minutes for price accuracy (background job enforces)

---

### Order

**Purpose**: Fulfillment order placed with a marketplace partner

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| donationId | UUID | FOREIGN KEY → Donation.id, UNIQUE, NOT NULL | Donation that created order |
| partnerId | UUID | FOREIGN KEY → MarketplacePartner.id, NOT NULL | Marketplace handling order |
| externalOrderId | VARCHAR(255) | NULLABLE | Partner's order ID |
| status | ENUM('pending', 'placed', 'confirmed', 'shipped', 'delivered', 'failed', 'cancelled') | DEFAULT 'pending' | Order status |
| trackingNumber | VARCHAR(100) | NULLABLE | Shipping tracking number |
| trackingUrl | VARCHAR(500) | NULLABLE | Tracking URL |
| shippingAddress | JSONB | NOT NULL | Delivery address |
| estimatedDelivery | DATE | NULLABLE | Estimated delivery date |
| actualDelivery | TIMESTAMP | NULLABLE | Actual delivery timestamp |
| totalAmount | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Order total (matches donation) |
| affiliateCommissionEarned | DECIMAL(10,2) | DEFAULT 0 | Commission earned |
| createdAt | TIMESTAMP | DEFAULT NOW() | Order creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Validation Rules**:
- externalOrderId required when status is 'placed' or later
- trackingNumber and trackingUrl required when status is 'shipped'
- actualDelivery required when status is 'delivered'

---

### OrderItem

**Purpose**: Individual items in a marketplace order

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| orderId | UUID | FOREIGN KEY → Order.id, NOT NULL | Associated order |
| productId | UUID | FOREIGN KEY → MarketplaceProduct.id, NOT NULL | Product ordered |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Quantity ordered |
| unitPrice | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Price per unit at order time |
| createdAt | TIMESTAMP | DEFAULT NOW() | Order item creation timestamp |

---

### Cause

**Purpose**: Categories or organizations that group multiple recipients

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Cause name |
| description | TEXT | NOT NULL | Cause description |
| category | VARCHAR(50) | NOT NULL | Cause category |
| imageUrl | VARCHAR(500) | NULLABLE | Cause image |
| isActive | BOOLEAN | DEFAULT TRUE | Whether cause is active |
| createdAt | TIMESTAMP | DEFAULT NOW() | Cause creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

### RecipientCause (Join Table)

**Purpose**: Many-to-many relationship between recipients and causes

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| recipientId | UUID | FOREIGN KEY → User.id, NOT NULL | Associated recipient |
| causeId | UUID | FOREIGN KEY → Cause.id, NOT NULL | Associated cause |
| createdAt | TIMESTAMP | DEFAULT NOW() | Association timestamp |

**Validation Rules**:
- PRIMARY KEY(recipientId, causeId) - one entry per pair

---

### Milestone

**Purpose**: Tracks donator milestone achievements for gamification (FR-026)

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| donatorId | UUID | FOREIGN KEY → User.id, NOT NULL | Donator who achieved milestone |
| milestoneType | VARCHAR(50) | NOT NULL | Milestone type (e.g., "first_donation", "5_donations", "10_families_helped", "100_total_donated") |
| achievedAt | TIMESTAMP | DEFAULT NOW() | Milestone achievement timestamp |
| createdAt | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Validation Rules**:
- UNIQUE(donatorId, milestoneType) - one achievement per milestone type per donator
- milestoneType must be one of: "first_donation", "5_donations", "10_donations", "25_donations", "50_donations", "100_donations", "100_total_donated", "500_total_donated", "1000_total_donated", "10_families_helped", "25_families_helped", "50_families_helped"

**Predefined Milestones**:
- **Donation Count**: 1st donation, 5 donations, 10 donations, 25 donations, 50 donations, 100 donations
- **Donation Amount**: $100 total, $500 total, $1,000 total
- **Impact**: 10 families helped, 25 families helped, 50 families helped

---

## Indexes

Performance-critical queries require indexes:

```sql
-- User lookups
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);

-- OAuth provider lookups
CREATE INDEX idx_oauth_provider_user ON "OAuthAccount"(provider, providerAccountId);

-- Recipient discovery (FR-004)
CREATE INDEX idx_recipient_verification_status ON "RecipientProfile"(verificationStatus);
CREATE INDEX idx_recipient_location ON "RecipientProfile"(location);
CREATE INDEX idx_need_type ON "Need"(needType);

-- Donation queries
CREATE INDEX idx_donation_donator ON "Donation"(donatorId, createdAt DESC);
CREATE INDEX idx_donation_recipient ON "Donation"(recipientId, createdAt DESC);
CREATE INDEX idx_donation_payment_status ON "Donation"(paymentStatus);

-- Order fulfillment
CREATE INDEX idx_order_status ON "Order"(status, createdAt);
CREATE INDEX idx_order_donation ON "Order"(donationId);

-- Marketplace product sync
CREATE INDEX idx_product_last_synced ON "MarketplaceProduct"(lastSyncedAt);
CREATE INDEX idx_product_partner_external ON "MarketplaceProduct"(partnerId, externalId);

-- Full-text search on recipient stories (PostgreSQL)
CREATE INDEX idx_recipient_story_fts ON "RecipientProfile" USING GIN(to_tsvector('english', story));

-- Milestone queries (FR-026)
CREATE INDEX idx_milestone_donator ON "Milestone"(donatorId, achievedAt DESC);
CREATE INDEX idx_milestone_type ON "Milestone"(milestoneType);
```

---

## Migration Strategy

Prisma migrations will be used for schema evolution:

1. Initial migration: Create all tables with base schema
2. Seed migration: Insert initial MarketplacePartner (Amazon), sample Causes
3. Future migrations: Add indexes, new columns, handle data migrations with up/down scripts

---

## Data Retention

- User accounts: Retained indefinitely unless user requests deletion (GDPR compliance)
- Verification documents: Encrypted at rest, deleted 90 days after verification decision
- Donations: Permanent record for tax/audit purposes (7 years minimum for 501c3 orgs)
- Tax receipts: Retained 7 years
- Marketplace product cache: Refreshed every 5 minutes, stale data purged weekly

---

## Security Considerations

- **Encryption at Rest**: Verification documents, OAuth tokens, API keys encrypted with AES-256
- **Row-Level Security**: Prisma middleware enforces users can only access their own data
- **Soft Deletes**: Users marked as deleted, not physically removed (preserves donation history integrity)
- **Audit Logging**: All verification status changes, donation transactions logged for compliance
