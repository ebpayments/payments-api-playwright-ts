# 💳 Payments API & UI Test Automation Framework

> **AI-first QA Engineering** — Built with Playwright + TypeScript, powered by Claude Code & GitHub Copilot

[![CI](https://github.com/ebpayments/payments-api-playwright-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/ebpayments/payments-api-playwright-ts/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.x-green)](https://playwright.dev/)
[![Stripe](https://img.shields.io/badge/Stripe-Sandbox-635bff)](https://stripe.com/docs/testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🧠 About This Framework

A production-style test automation framework simulating a **fintech payments platform**, covering:

- **API Testing** — Payment intents, charges, tokenization against real Stripe Sandbox API
- **UI Testing** — Custom checkout page with Stripe token integration
- **Database Validation** — SQLite persistence and query verification
- **AI-Assisted Development** — Claude Code + GitHub Copilot with CLAUDE.md workflow

---

## 🏗️ Project Structure

```
payments-api-playwright-ts/
│
├── api-tests/
│   ├── builders/
│   │   ├── charge.builder.ts           # Fluent request builder for charges
│   │   └── payment-intent.builder.ts   # Fluent request builder for payment intents
│   ├── readers/
│   │   ├── charge.reader.ts            # Response parser for charge objects
│   │   └── payment-intent.reader.ts    # Response parser for payment intent objects
│   ├── assertions/
│   │   └── payment.assertions.ts       # Custom assertion library with descriptive errors
│   ├── data/
│   │   ├── charges.json                # Data-driven test scenarios for charges
│   │   └── payment-intents.json        # Data-driven test scenarios for payment intents
│   ├── helpers/
│   │   └── api.helper.ts               # Base HTTP request helper with auth
│   └── tests/
│       ├── payments.spec.ts            # Payment intent tests (create, confirm, retrieve, list)
│       ├── transactions.spec.ts        # Charge tests (success, decline, retrieve, list)
│       ├── tokenization.spec.ts        # Tokenization and card brand tests
│       └── db-validation.spec.ts       # API + SQLite database validation tests
│
├── ui-tests/
│   ├── pages/
│   │   └── checkout.page.ts            # Page Object Model for checkout UI
│   ├── assertions/
│   │   └── checkout.assertions.ts      # UI-specific assertion library
│   ├── data/
│   │   └── cards.json                  # Test card scenarios (success, declined, invalid)
│   └── tests/
│       ├── checkout-happy.spec.ts      # Happy path: load, fill, submit
│       ├── checkout-validation.spec.ts # Form validation, masking, formatting
│       └── checkout-errors.spec.ts     # Decline scenarios, error states
│
├── database/
│   ├── db.helper.ts                    # SQLite CRUD wrapper
│   ├── stripe-sync.ts                  # Syncs Stripe API responses to SQLite
│   └── stripe.db                       # Local SQLite database
│
├── mock-ui/
│   ├── server.ts                       # Express.js server — serves checkout + proxies to Stripe
│   └── index.html                      # Custom checkout page with Stripe token integration
│
├── utils/
│   └── reporter.helper.ts              # Attaches request/response/DB logs to test reports
│
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions CI pipeline
│
├── CLAUDE.md                           # AI workflow instructions for Claude Code
├── playwright.config.ts                # Playwright config (api + ui-chromium projects)
├── tsconfig.json                       # TypeScript strict config
├── package.json                        # npm scripts and dependencies
└── .env.example                        # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Stripe account (free sandbox — no credit card required)

### Install

```bash
git clone https://github.com/ebpayments/payments-api-playwright-ts.git
cd payments-api-playwright-ts
npm install
npx playwright install chromium
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```
BASE_URL=https://api.stripe.com
API_TOKEN=sk_test_...
MERCHANT_ID=your_merchant_id
```

---

## 🧪 Running Tests

```bash
# All tests
npm test

# API tests only
npm run test:api

# UI tests only (requires mock server — see below)
npm run test:ui

# Database validation tests
npm run test:db

# HTML report
npm run test:report

# Allure report
npm run test:allure
```

### Running UI Tests

UI tests require the mock checkout server to be running:

```bash
# Terminal 1 — start the server
npx ts-node mock-ui/server.ts

# Terminal 2 — run UI tests
npm run test:ui

# Watch mode (visible browser)
npx playwright test ui-tests/ --headed
```

---

## 📊 Test Coverage

### API Tests — 36 tests

| Spec | Scenarios | Count |
|------|-----------|-------|
| `payments.spec.ts` | Create, confirm, retrieve, list payment intents + validation errors | 13 |
| `transactions.spec.ts` | Create charges (Visa/MC/Amex), decline scenarios, retrieve, list | 8 |
| `tokenization.spec.ts` | Card brand tokenization, decline flows, PAN security | 8 |
| `db-validation.spec.ts` | API + SQLite persistence, queries, aggregation | 7 |

### UI Tests — 15 tests

| Spec | Scenarios | Count |
|------|-----------|-------|
| `checkout-happy.spec.ts` | Page load, button enable, successful payments (data-driven) | 4 |
| `checkout-validation.spec.ts` | Incomplete card, CVV masking, formatting, PAN in DOM | 6 |
| `checkout-errors.spec.ts` | Decline messages, button re-enable, state cleanup | 5 |

**Total: 51 tests**

---

## 🏛️ Architecture & Design Patterns

| Pattern | Implementation |
|---------|---------------|
| **Builder Pattern** | `ChargeBuilder`, `PaymentIntentBuilder` — fluent API for request construction |
| **Reader Pattern** | `ChargeReader`, `PaymentIntentReader` — typed response accessors |
| **Page Object Model** | `CheckoutPage` — encapsulates UI locators and interactions |
| **Custom Assertions** | `PaymentAssertions`, `CheckoutAssertions` — descriptive, reusable checks |
| **Data-Driven Testing** | JSON files + `for...of` loops — zero-code scenario expansion |
| **AAA Structure** | Every test follows Arrange / Act / Assert |

---

## 💳 Card Scenarios

| Scenario | Stripe Token | Expected Result |
|----------|-------------|-----------------|
| Visa Success | `tok_visa` | `status: succeeded` |
| Mastercard Success | `tok_mastercard` | `status: succeeded` |
| Amex Success | `tok_amex` | `status: succeeded` |
| Generic Decline | `tok_chargeDeclined` | `code: card_declined` |
| Insufficient Funds | `tok_chargeDeclinedInsufficientFunds` | `decline_code: insufficient_funds` |
| Expired Card | `tok_chargeDeclinedExpiredCard` | `code: expired_card` |

---

## 🗄️ Database Validation

After each API call, responses are synced to SQLite and verified:

```typescript
// API call
const response = await request.post(`${BASE_URL}/charges`, { headers, form });
const body = await response.json();

// Sync to DB
sync.syncCharge(body);

// DB validation
const dbRecord = sync.getDb().getChargeById(body.id);
expect(dbRecord!.status).toBe('succeeded');
expect(dbRecord!.card_brand).toBe('visa');
```

---

## 🖥️ UI Testing — Custom Checkout Page

The UI layer tests a custom Express.js checkout page built specifically for this framework. Key features:

- **Stripe token integration** — no raw card numbers sent to server
- **Real Stripe API calls** — server proxies payments to Stripe sandbox
- **data-testid selectors** — stable, accessibility-friendly locators
- **PAN security assertion** — verifies raw card numbers never appear in DOM

```
User fills form → Stripe token set in hidden field → Server receives token → Stripe charges card
```

---

## 📈 Reporting

### Playwright HTML Report

```bash
npx playwright test --reporter=html
npx playwright show-report
```

### Allure Report

```bash
npx playwright test --reporter=allure-playwright
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

## 🤖 AI-First Workflow

| Tool | Usage |
|------|-------|
| **Claude Code** | Test scaffolding, CLAUDE.md-guided generation, code review |
| **GitHub Copilot** | Inline autocomplete for selectors, assertions, fixtures |
| **Playwright MCP** | AI-driven page discovery for selector generation |

`CLAUDE.md` contains structured instructions that guide AI tools to generate tests consistent with project conventions.

---

## 📄 License

MIT