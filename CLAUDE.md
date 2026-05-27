# CLAUDE.md — AI Workflow Instructions

This file guides Claude Code on how to work within this payments test automation framework.

## Project Context

This is a **Playwright + TypeScript** test automation framework simulating a fintech payments platform.
Domain: payment processing, card tokenization, transaction management.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Playwright 1.x
- **Language**: TypeScript 5.x
- **Reporting**: Playwright HTML reporter
- **CI**: GitHub Actions

## Directory Rules

| Directory | Purpose |
|-----------|---------|
| `api-tests/tests/` | API test specs only — one file per resource |
| `api-tests/helpers/` | Reusable request builders and auth utilities |
| `ui-tests/tests/` | UI test specs — one file per user flow |
| `ui-tests/pages/` | Page Object Models — one class per page |
| `fixtures/` | Shared test data and mock response schemas |
| `utils/` | Shared utilities (reporters, formatters) |

## Coding Conventions

### Naming
- Test files: `[resource].spec.ts` (e.g., `transactions.spec.ts`)
- Page objects: `[page-name].page.ts` (e.g., `checkout.page.ts`)
- Helpers: `[service].helper.ts` (e.g., `api.helper.ts`)
- Test names: `should [expected behavior] when [condition]`

### Structure — Every test must follow AAA:
```typescript
test('should capture payment when amount is valid', async ({ request }) => {
  // Arrange
  const payload = getValidCapturePayload();

  // Act
  const response = await request.post('/v1/payments/capture', { data: payload });

  // Assert
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'captured' });
});
```

### Never Do This
- ❌ Hardcode credentials, card numbers, or tokens
- ❌ Use `test.skip()` — fix the test or delete it
- ❌ Mix API and UI logic in the same spec file
- ❌ Use `any` type — always type your payloads and responses
- ❌ Use `page.waitForTimeout()` — use `waitForResponse` or locators

### Always Do This
- ✅ Use `fixtures/test-data.ts` for test data
- ✅ Use environment variables for base URLs and tokens
- ✅ Group related tests with `test.describe()`
- ✅ Add `test.info().annotations` for test metadata

## Payment Domain Patterns

When generating tests for payment flows, follow this sequence:

1. **Tokenize** → POST `/v1/auth/tokenize` → returns `token`
2. **Authorize** → POST `/v1/payments/authorize` with `token`
3. **Capture** → POST `/v1/payments/capture` with `authorizationId`
4. **Refund** (optional) → POST `/v1/payments/refund` with `captureId`

Error scenarios to always cover:
- `card_declined` (response code 05)
- `insufficient_funds` (response code 51)
- `expired_card` (response code 54)
- `invalid_amount` (negative or zero)

## Page Object Rules

```typescript
// Good POM structure
export class CheckoutPage {
  readonly page: Page;
  // Locators as readonly properties
  readonly cardNumberInput = this.page.getByLabel('Card Number');

  constructor(page: Page) {
    this.page = page;
  }

  // Methods represent user actions
  async enterCardDetails(card: CardDetails) { ... }
  async submitPayment() { ... }
  async getConfirmationNumber(): Promise<string> { ... }
}
```

## Test Commands

```bash
npm test                  # All tests
npm run test:api          # API tests only
npm run test:ui           # UI tests only
npm run test:report       # Run + open HTML report
npx playwright test --grep "capture"   # Filter by name
```

## When I Ask You to Generate Tests

1. Check existing helpers in `api-tests/helpers/` before creating new ones
2. Use types from `fixtures/test-data.ts`
3. Follow the AAA pattern strictly
4. Cover: happy path, validation error, auth error, not found (404)
5. Never generate real card numbers — use the test cards in `fixtures/test-data.ts`
