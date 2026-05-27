import { test, expect } from '@playwright/test';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

test.describe('Stripe — Tokenization (Payment Methods)', () => {

  test('should create payment method with Visa token', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/payment_methods`, {
      headers,
      form: {
        type: 'card',
        'card[token]': 'tok_visa',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^pm_/);
    expect(body.type).toBe('card');
    expect(body.card.brand).toBe('visa');
    expect(body.card.last4).toBe('4242');
    // PAN must NOT be visible
    expect(JSON.stringify(body)).not.toContain('4242424242424242');
  });

  test('should create payment method with Mastercard token', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/payment_methods`, {
      headers,
      form: {
        type: 'card',
        'card[token]': 'tok_mastercard',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^pm_/);
    expect(body.card.brand).toBe('mastercard');
    expect(body.card.last4).toBe('4444');
  });

  test('should create payment method with declined card token', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/payment_methods`, {
      headers,
      form: {
        type: 'card',
        'card[token]': 'tok_chargeDeclined',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert — pm is created but will fail on charge
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^pm_/);
  });

  test('should create payment method with insufficient funds token', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/payment_methods`, {
      headers,
      form: {
        type: 'card',
        'card[token]': 'tok_chargeDeclinedInsufficientFunds',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^pm_/);
  });

  test('should create payment method with expired card token', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/payment_methods`, {
      headers,
      form: {
        type: 'card',
        'card[token]': 'tok_chargeDeclinedExpiredCard',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^pm_/);
  });

  test('should retrieve existing payment method', async ({ request }) => {
    // Arrange — create one first
    const createRes = await request.post(`${BASE_URL}/payment_methods`, {
      headers,
      form: {
        type: 'card',
        'card[token]': 'tok_visa',
      },
    });
    const created = await createRes.json();

    // Act
    const getRes = await request.get(`${BASE_URL}/payment_methods/${created.id}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Debug
    const body = await getRes.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(getRes.status()).toBe(200);
    expect(body.id).toBe(created.id);
    expect(body.card.last4).toBe('4242');
  });

  test('should return 401 with invalid API key', async ({ request }) => {
    // Act
    const response = await request.post(`${BASE_URL}/payment_methods`, {
      headers: {
        Authorization: 'Bearer sk_test_invalid',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      form: {
        type: 'card',
        'card[token]': 'tok_visa',
      },
    });

    // Assert
    expect(response.status()).toBe(401);
  });

});