import { test, expect } from '@playwright/test';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

test.describe('Stripe — Payment Intents', () => {

  test('should create a payment intent successfully', async ({ request }) => {
    // Arrange & Act
    const response = await request.post(`${BASE_URL}/payment_intents`, {
      headers,
      form: {
        amount: '2000',
        currency: 'usd',
        'payment_method_types[]': 'card',
      },
    });

    // Debug
    const body = await response.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(response.status()).toBe(200);
    expect(body.id).toMatch(/^pi_/);
    expect(body.status).toBe('requires_payment_method');
    expect(body.amount).toBe(2000);
    expect(body.currency).toBe('usd');
  });

  test('should confirm payment intent with test card', async ({ request }) => {
    // Arrange — create intent first
    const createResponse = await request.post(`${BASE_URL}/payment_intents`, {
      headers,
      form: {
        amount: '5000',
        currency: 'usd',
        'payment_method_types[]': 'card',
        payment_method: 'pm_card_visa',
        confirm: 'true',
      },
    });

    // Debug
    const body = await createResponse.json();
    console.log(JSON.stringify(body, null, 2));

    // Assert
    expect(createResponse.status()).toBe(200);
    expect(body.id).toMatch(/^pi_/);
    expect(body.status).toBe('succeeded');
    expect(body.amount).toBe(5000);
  });

  test('should retrieve existing payment intent', async ({ request }) => {
    // Arrange — create one first
    const createRes = await request.post(`${BASE_URL}/payment_intents`, {
      headers,
      form: {
        amount: '1000',
        currency: 'usd',
        'payment_method_types[]': 'card',
      },
    });
    const created = await createRes.json();

    // Act — retrieve it
    const getRes = await request.get(`${BASE_URL}/payment_intents/${created.id}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Assert
    expect(getRes.status()).toBe(200);
    const body = await getRes.json();
    expect(body.id).toBe(created.id);
    expect(body.amount).toBe(1000);
  });

  test('should return 401 with invalid API key', async ({ request }) => {
    // Act
    const response = await request.post(`${BASE_URL}/payment_intents`, {
      headers: {
        Authorization: 'Bearer sk_test_invalid_key',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      form: {
        amount: '1000',
        currency: 'usd',
        'payment_method_types[]': 'card',
      },
    });

    // Assert
    expect(response.status()).toBe(401);
  });

  test('should return 400 when amount is missing', async ({ request }) => {
    // Act
    const response = await request.post(`${BASE_URL}/payment_intents`, {
      headers,
      form: {
        currency: 'usd',
        'payment_method_types[]': 'card',
      },
    });

    // Assert
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.param).toBe('amount');
  });

  test('should list payment intents', async ({ request }) => {
    // Act
    const response = await request.get(`${BASE_URL}/payment_intents?limit=5`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Assert
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.object).toBe('list');
    expect(body.data).toBeInstanceOf(Array);
  });

});