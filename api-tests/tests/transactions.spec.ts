import { test, expect } from '@playwright/test';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

test.describe('Stripe — Charges (Transactions)', () => {

  test('should create a charge successfully', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/charges`, {
      headers,
      form: {
        amount: '2000',
        currency: 'usd',
        source: 'tok_visa',
        description: 'Test charge - Visa',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^ch_/);
    expect(body.status).toBe('succeeded');
    expect(body.amount).toBe(2000);
    expect(body.currency).toBe('usd');
    expect(body.paid).toBe(true);
  });

  test('should create a charge with Mastercard', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/charges`, {
      headers,
      form: {
        amount: '5000',
        currency: 'usd',
        source: 'tok_mastercard',
        description: 'Test charge - Mastercard',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^ch_/);
    expect(body.status).toBe('succeeded');
    expect(body.amount).toBe(5000);
  });

  test('should fail charge for declined card', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/charges`, {
      headers,
      form: {
        amount: '2000',
        currency: 'usd',
        source: 'tok_chargeDeclined',
        description: 'Test charge - Declined',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(402);
    expect(body.error.code).toBe('card_declined');
  });

  test('should fail charge for insufficient funds', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/charges`, {
      headers,
      form: {
        amount: '2000',
        currency: 'usd',
        source: 'tok_chargeDeclinedInsufficientFunds',
        description: 'Test charge - Insufficient funds',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(402);
    expect(body.error.code).toBe('card_declined');
    expect(body.error.decline_code).toBe('insufficient_funds');
  });

  test('should fail charge for expired card', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/charges`, {
      headers,
      form: {
        amount: '2000',
        currency: 'usd',
        source: 'tok_chargeDeclinedExpiredCard',
        description: 'Test charge - Expired card',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(402);
    expect(body.error.code).toBe('expired_card');
  });

  test('should retrieve existing charge', async ({ request }) => {
    // Arrange — create charge first
    const createRes = await request.post(`${BASE_URL}/charges`, {
      headers,
      form: {
        amount: '1500',
        currency: 'usd',
        source: 'tok_visa',
      },
    });
    const created = await createRes.json();

    // Act
    const getRes = await request.get(`${BASE_URL}/charges/${created.id}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Debug
    const body = await getRes.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(getRes.status()).toBe(200);
    expect(body.id).toBe(created.id);
    expect(body.amount).toBe(1500);
  });

  test('should list charges with limit', async ({ request }) => {
    // Act
    const response = await request.get(`${BASE_URL}/charges?limit=5`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.object).toBe('list');
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeLessThanOrEqual(5);
  });

  test('should return 401 with invalid API key', async ({ request }) => {
    // Act
    const response = await request.get(`${BASE_URL}/charges`, {
      headers: { Authorization: 'Bearer sk_test_invalid' },
    });

    // Assert
    expect(response.status()).toBe(401);
  });

});