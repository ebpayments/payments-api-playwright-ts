# 💳 Payments API & UI Test Automation Framework

> **AI-first QA Engineering** — Built with Playwright + TypeScript, powered by Claude Code & GitHub Copilot

[![CI](https://github.com/YOUR_USERNAME/payments-api-playwright-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/payments-api-playwright-ts/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.x-green)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🧠 About This Framework

A production-style test automation framework simulating a **fintech payments platform**, covering:

- **API Testing** — Transaction processing, payment capture, tokenization, refunds
- **UI Testing** — Checkout flows, error states, responsive behavior
- **AI-Assisted Development** — Test generation and review via Claude Code + GitHub Copilot

This repo demonstrates real-world QA engineering patterns used in payment processing systems (TSYS, GlobalPay-style integrations), built with an **AI-first workflow**.

---

## 🏗️ Project Structure

```
payments-api-playwright-ts/
├── api-tests/
│   ├── tests/                  # API test specs
│   │   ├── transactions.spec.ts
│   │   ├── payments.spec.ts
│   │   └── tokenization.spec.ts
│   └── helpers/
│       ├── api.helper.ts       # Base request helper
│       └── auth.helper.ts      # Token/auth utilities
├── ui-tests/
│   ├── tests/                  # UI test specs
│   │   ├── checkout.spec.ts
│   │   └── payment-form.spec.ts
│   └── pages/                  # Page Object Models
│       ├── checkout.page.ts
│       └── payment.page.ts
├── fixtures/
│   ├── test-data.ts            # Shared test data
│   └── mock-responses.ts       # Mock API responses
├── utils/
│   └── reporter.ts             # Custom reporter
├── .github/workflows/
│   └── ci.yml                  # GitHub Actions pipeline
├── CLAUDE.md                   # AI workflow instructions
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Install

```bash
git clone https://github.com/YOUR_USERNAME/payments-api-playwright-ts.git
cd payments-api-playwright-ts
npm install
npx playwright install
```

### Environment Setup

```bash
cp .env.example .env
# Fill in your sandbox credentials
```

### Run Tests

```bash
# All tests
npm test

# API tests only
npm run test:api

# UI tests only
npm run test:ui

# With HTML report
npm run test:report
```

---

## 🤖 AI-First Workflow

This framework was built using an **AI-augmented QA engineering approach**:

| Tool | Usage |
|------|-------|
| **Claude Code** | Test scaffolding, CLAUDE.md-guided generation, code review |
| **GitHub Copilot** | Inline autocomplete for selectors, assertions, and fixtures |
| **Playwright MCP** | AI-driven page discovery for selector generation |

> `CLAUDE.md` in this repo contains structured instructions that guide Claude Code to generate tests consistent with project conventions — naming patterns, fixture usage, assertion style, and domain context.

---

## 🧪 Test Coverage

### API Tests
| Endpoint | Method | Coverage |
|----------|--------|----------|
| `/v1/transactions` | GET, POST | Happy path, pagination, filtering |
| `/v1/payments/capture` | POST | Success, partial capture, errors |
| `/v1/payments/refund` | POST | Full refund, partial, invalid amount |
| `/v1/auth/tokenize` | POST | Card tokenization, PAN masking |
| `/v1/auth/token` | POST | Auth token generation, expiry |

### UI Tests
| Flow | Coverage |
|------|----------|
| Checkout - Happy Path | Card entry, form validation, success state |
| Checkout - Error States | Declined card, network error, timeout |
| Payment Form | Field masking, expiry validation, CVV |

---

## 📊 CI/CD Pipeline

GitHub Actions runs on every push and PR:

- ✅ TypeScript compilation check
- ✅ API test suite (parallel, 4 workers)
- ✅ UI test suite (Chromium)
- ✅ HTML report artifact upload

---

## 📝 Domain Context

Tests are modeled after real payment processing patterns:

- **Authorization flow** — tokenize → authorize → capture
- **Refund flow** — capture → partial/full refund
- **Error scenarios** — declined, insufficient funds, expired card, network timeout

---

## 📄 License

MIT — free to use as a portfolio reference or framework starter.
