// ============================================================
// Test Cards — Safe sandbox card numbers only, never real PANs
// ============================================================

export const TEST_CARDS = {
  VISA_SUCCESS: {
    number: '4111111111111111',
    expiry: '12/26',
    cvv: '123',
    holder: 'Test User',
  },
  MASTERCARD_SUCCESS: {
    number: '5500005555555559',
    expiry: '12/26',
    cvv: '456',
    holder: 'Test User',
  },
  DECLINED: {
    number: '4000000000000002',
    expiry: '12/26',
    cvv: '123',
    holder: 'Declined Card',
  },
  INSUFFICIENT_FUNDS: {
    number: '4000000000009995',
    expiry: '12/26',
    cvv: '123',
    holder: 'No Funds',
  },
  EXPIRED: {
    number: '4000000000000069',
    expiry: '01/20',
    cvv: '123',
    holder: 'Expired Card',
  },
} as const;

// ============================================================
// Payload Factories
// ============================================================

export interface TokenizePayload {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
}

export interface CapturePayload {
  authorizationId: string;
  amount: number;
  currency: string;
}

export interface RefundPayload {
  captureId: string;
  amount: number;
  reason?: string;
}

export interface TransactionFilters {
  status?: 'pending' | 'captured' | 'refunded' | 'declined';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function getTokenizePayload(card = TEST_CARDS.VISA_SUCCESS): TokenizePayload {
  return {
    cardNumber: card.number,
    expiry: card.expiry,
    cvv: card.cvv,
    cardHolder: card.holder,
  };
}

export function getValidCapturePayload(authorizationId = 'auth_test_001'): CapturePayload {
  return {
    authorizationId,
    amount: 100.00,
    currency: 'USD',
  };
}

export function getRefundPayload(captureId = 'cap_test_001', amount = 100.00): RefundPayload {
  return {
    captureId,
    amount,
    reason: 'customer_request',
  };
}
