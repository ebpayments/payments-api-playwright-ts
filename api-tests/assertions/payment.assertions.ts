import { expect, APIResponse } from '@playwright/test';
import { ChargeReader, ChargeErrorReader } from '../readers/charge.reader';
import { PaymentIntentReader, PaymentIntentErrorReader } from '../readers/payment-intent.reader';

export class PaymentAssertions {

  // ─── HTTP Status ─────────────────────────────────────────────

  static async assertSuccess(response: APIResponse): Promise<void> {
    expect(response.status(), `Expected 200 but got ${response.status()}`).toBe(200);
  }

  static async assertDeclined(response: APIResponse): Promise<void> {
    expect(response.status(), `Expected 402 but got ${response.status()}`).toBe(402);
  }

  static async assertBadRequest(response: APIResponse): Promise<void> {
    expect(response.status(), `Expected 400 but got ${response.status()}`).toBe(400);
  }

  static async assertUnauthorized(response: APIResponse): Promise<void> {
    expect(response.status(), `Expected 401 but got ${response.status()}`).toBe(401);
  }

  static async assertNotFound(response: APIResponse): Promise<void> {
    expect(response.status(), `Expected 404 but got ${response.status()}`).toBe(404);
  }

  // ─── Charge Assertions ───────────────────────────────────────

  static assertChargeSucceeded(reader: ChargeReader): void {
    expect(reader.getId()).toMatch(/^ch_/);
    expect(reader.getStatus()).toBe('succeeded');
    expect(reader.isPaid()).toBe(true);
    expect(reader.isCaptured()).toBe(true);
    expect(reader.isLiveMode()).toBe(false);
  }

  static assertChargeAmount(reader: ChargeReader, expectedAmount: number): void {
    expect(reader.getAmount(), `Expected amount ${expectedAmount} but got ${reader.getAmount()}`).toBe(expectedAmount);
  }

  static assertChargeCurrency(reader: ChargeReader, expectedCurrency: string): void {
    expect(reader.getCurrency()).toBe(expectedCurrency);
  }

  static assertChargeCardBrand(reader: ChargeReader, expectedBrand: string): void {
    expect(reader.getCardBrand()).toBe(expectedBrand);
  }

  static assertChargeCardLast4(reader: ChargeReader, expectedLast4: string): void {
    expect(reader.getCardLast4()).toBe(expectedLast4);
  }

  static assertChargeNotLiveMode(reader: ChargeReader): void {
    expect(reader.isLiveMode()).toBe(false);
  }

  static assertChargeRiskLevel(reader: ChargeReader, expectedLevel: string): void {
    expect(reader.getRiskLevel()).toBe(expectedLevel);
  }

  static assertChargeMetadata(reader: ChargeReader, expectedMetadata: Record<string, string>): void {
    const metadata = reader.getMetadata();
    Object.entries(expectedMetadata).forEach(([key, value]) => {
      expect(metadata[key], `Expected metadata.${key} to be ${value}`).toBe(value);
    });
  }

  static assertNoPANInResponse(body: unknown, cardNumber: string): void {
    expect(JSON.stringify(body)).not.toContain(cardNumber);
  }

  // ─── Charge Error Assertions ─────────────────────────────────

  static assertChargeDeclineCode(reader: ChargeErrorReader, expectedCode: string): void {
    expect(reader.getCode(), `Expected error code ${expectedCode} but got ${reader.getCode()}`).toBe(expectedCode);
  }

  static assertChargeDeclineReason(reader: ChargeErrorReader, expectedDeclineCode: string): void {
    expect(reader.getDeclineCode(), `Expected decline code ${expectedDeclineCode} but got ${reader.getDeclineCode()}`).toBe(expectedDeclineCode);
  }

  // ─── Payment Intent Assertions ───────────────────────────────

  static assertPaymentIntentCreated(reader: PaymentIntentReader): void {
    expect(reader.getId()).toMatch(/^pi_/);
    expect(reader.getClientSecret()).toBeTruthy();
    expect(reader.isLiveMode()).toBe(false);
  }

  static assertPaymentIntentStatus(reader: PaymentIntentReader, expectedStatus: string): void {
    expect(reader.getStatus(), `Expected status ${expectedStatus} but got ${reader.getStatus()}`).toBe(expectedStatus);
  }

  static assertPaymentIntentAmount(reader: PaymentIntentReader, expectedAmount: number): void {
    expect(reader.getAmount(), `Expected amount ${expectedAmount} but got ${reader.getAmount()}`).toBe(expectedAmount);
  }

  static assertPaymentIntentSucceeded(reader: PaymentIntentReader): void {
    expect(reader.getId()).toMatch(/^pi_/);
    expect(reader.isSucceeded()).toBe(true);
    expect(reader.getAmountReceived()).toBeGreaterThan(0);
    expect(reader.getLatestCharge()).toMatch(/^ch_/);
  }

  static assertPaymentIntentCurrency(reader: PaymentIntentReader, expectedCurrency: string): void {
    expect(reader.getCurrency()).toBe(expectedCurrency);
  }

  // ─── Payment Intent Error Assertions ─────────────────────────

  static assertMissingParam(reader: PaymentIntentErrorReader, expectedParam: string): void {
    expect(reader.getParam(), `Expected missing param ${expectedParam} but got ${reader.getParam()}`).toBe(expectedParam);
  }

  // ─── Combined Flow Assertions ─────────────────────────────────

  static assertChargeMatchesRequest(
    reader: ChargeReader,
    expectedAmount: number,
    expectedCurrency: string
  ): void {
    PaymentAssertions.assertChargeSucceeded(reader);
    PaymentAssertions.assertChargeAmount(reader, expectedAmount);
    PaymentAssertions.assertChargeCurrency(reader, expectedCurrency);
  }
}