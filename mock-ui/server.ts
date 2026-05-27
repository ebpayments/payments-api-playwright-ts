import express from 'express';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Payment endpoint — uses Stripe tokens instead of raw card numbers
app.post('/api/pay', async (req, res) => {
  const { token, amount } = req.body;

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.API_TOKEN, { apiVersion: '2023-10-16' });

    const charge = await stripe.charges.create({
      amount: amount || 2000,
      currency: 'usd',
      source: token,
      description: 'UI test charge',
    });

    res.json({
      success: true,
      chargeId: charge.id,
      status: charge.status,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
      code: error.code,
      decline_code: error.decline_code,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Mock checkout server running at http://localhost:${PORT}`);
});

export default app;