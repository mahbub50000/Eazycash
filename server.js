const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// bKash Configuration
const BKASH_USERNAME = process.env.BKASH_USERNAME;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD;
const BKASH_APP_KEY = process.env.BKASH_APP_KEY;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET;
const BKASH_BASE_URL = process.env.BKASH_SANDBOX === 'true' 
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

// Store for transactions (in production, use database)
let transactions = [];

// Get bKash Token
async function getBkashToken() {
    try {
        const response = await axios.post(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
            app_key: BKASH_APP_KEY,
            app_secret: BKASH_APP_SECRET
        }, {
            headers: {
                'Content-Type': 'application/json',
                'username': BKASH_USERNAME,
                'password': BKASH_PASSWORD
            }
        });
        return response.data.id_token;
    } catch (error) {
        console.error('Error getting bKash token:', error);
        throw error;
    }
}

// Create Payment
app.post('/api/create-payment', async (req, res) => {
    try {
        const { amount, userId } = req.body;
        const token = await getBkashToken();

        const paymentData = {
            mode: '0011',
            payerReference: userId || 'user123',
            callbackURL: `${req.protocol}://${req.get('host')}/api/payment-callback`,
            amount: amount,
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: `INV-${Date.now()}`
        };

        const response = await axios.post(`${BKASH_BASE_URL}/tokenized/checkout/create`, paymentData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-App-Key': BKASH_APP_KEY
            }
        });

        // Store transaction
        transactions.push({
            paymentID: response.data.paymentID,
            userId: userId,
            amount: amount,
            status: 'initiated',
            createdAt: new Date()
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Payment Callback
app.post('/api/payment-callback', async (req, res) => {
    try {
        const { paymentID, status } = req.body;

        // Find transaction
        const transaction = transactions.find(t => t.paymentID === paymentID);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (status === 'success') {
            // Execute payment
            const token = await getBkashToken();
            const executeResponse = await axios.post(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
                paymentID: paymentID
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token,
                    'X-App-Key': BKASH_APP_KEY
                }
            });

            if (executeResponse.data.transactionStatus === 'Completed') {
                transaction.status = 'completed';
                // Here you would update user balance in database
                console.log(`Payment completed: ${paymentID} for amount ${transaction.amount}`);
            }
        } else {
            transaction.status = 'failed';
        }

        res.json({ status: 'success' });
    } catch (error) {
        console.error('Error in payment callback:', error);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// Get transaction status
app.get('/api/transaction-status/:paymentID', (req, res) => {
    const transaction = transactions.find(t => t.paymentID === req.params.paymentID);
    if (transaction) {
        res.json(transaction);
    } else {
        res.status(404).json({ error: 'Transaction not found' });
    }
});

// Telegram Authentication Endpoint
app.post('/api/telegram-auth', (req, res) => {
    try {
        const { user, initData } = req.body;
        
        if (!user || !user.id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user data from Telegram' 
            });
        }

        // In production, verify initData with Telegram's secret key
        // For now, we'll trust the client-side data
        
        // Create or update user in our system
        const telegramUser = {
            id: user.id,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            username: user.username || '',
            photo_url: user.photo_url || '',
            language_code: user.language_code || 'en',
            last_login: new Date()
        };

        // Store user data (in production, use database)
        // For now, we'll just return success
        console.log('✅ Telegram user authenticated:', telegramUser);

        res.json({
            success: true,
            user: telegramUser,
            message: 'User authenticated successfully'
        });
    } catch (error) {
        console.error('❌ Telegram auth error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Authentication failed' 
        });
    }
});

// Get user transactions
app.get('/api/transactions/:userId', (req, res) => {
    const userTransactions = transactions.filter(t => t.userId === req.params.userId);
    res.json(userTransactions);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Mock users for testing:');
    console.log('1. Email: user@example.com, Password: password123');
    console.log('2. Email: demo@demo.com, Password: demo123');
});
