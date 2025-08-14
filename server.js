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

// Mock user database for simulation
const mockUsers = [
    {
        id: 1,
        email: 'user@example.com',
        phone: '+1234567890',
        username: 'testuser',
        password: 'password123', // In production, use hashed passwords
        first_name: 'Test',
        last_name: 'User',
        balance: 1000,
        created_at: new Date('2024-01-01')
    },
    {
        id: 2,
        email: 'demo@demo.com',
        phone: '+9876543210',
        username: 'demouser',
        password: 'demo123',
        first_name: 'Demo',
        last_name: 'Account',
        balance: 500,
        created_at: new Date('2024-01-15')
    }
];

// JWT token simulation
function generateToken(user) {
    // In production, use a proper JWT library
    return Buffer.from(JSON.stringify({
        userId: user.id,
        email: user.email,
        username: user.username,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');
}

function verifyToken(token) {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        return decoded.exp > Date.now() ? decoded : null;
    } catch {
        return null;
    }
}

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

// Authentication Endpoints
// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email and password are required' 
        });
    }
    
    // Find user by email or phone
    const user = mockUsers.find(u => 
        u.email === email || 
        u.phone === email || 
        u.username === email
    );
    
    if (!user) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
    
    // Check password (in production, compare hashed passwords)
    if (user.password !== password) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user data without password
    const { password: _, ...userData } = user;
    
    res.json({
        success: true,
        token,
        user: userData
    });
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { email, phone, first_name, last_name, username, password } = req.body;
    
    if (!email && !phone) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email or phone is required' 
        });
    }
    
    if (!password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Password is required' 
        });
    }
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => 
        u.email === email || 
        u.phone === phone || 
        u.username === username
    );
    
    if (existingUser) {
        return res.status(409).json({ 
            success: false, 
            error: 'User already exists' 
        });
    }
    
    // Create new user
    const newUser = {
        id: mockUsers.length + 1,
        email: email || null,
        phone: phone || null,
        username: username || `user${mockUsers.length + 1}`,
        password, // In production, hash the password
        first_name: first_name || 'User',
        last_name: last_name || '',
        balance: 0,
        created_at: new Date()
    };
    
    mockUsers.push(newUser);
    
    // Generate token
    const token = generateToken(newUser);
    
    // Return user data without password
    const { password: _, ...userData } = newUser;
    
    res.json({
        success: true,
        token,
        user: userData
    });
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            error: 'Email or phone is required' 
        });
    }
    
    // Find user
    const user = mockUsers.find(u => 
        u.email === email || 
        u.phone === email
    );
    
    if (!user) {
        // Don't reveal if user exists or not
        return res.json({ 
            success: true, 
            message: 'If the account exists, a reset link has been sent' 
        });
    }
    
    // In production, send actual email/SMS
    console.log(`Password reset requested for: ${email}`);
    
    res.json({ 
        success: true, 
        message: 'Reset link sent to your email/phone' 
    });
});

// Reset password endpoint
app.post('/api/auth/reset-password', (req, res) => {
    const { token, new_password } = req.body;
    
    if (!token || !new_password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Token and new password are required' 
        });
    }
    
    // In production, verify the reset token
    // For simulation, we'll just accept any token
    
    // Find a user to reset (in production, use token to identify user)
    const user = mockUsers[0]; // Just for simulation
    
    if (!user) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid reset token' 
        });
    }
    
    // Update password (in production, hash the new password)
    user.password = new_password;
    
    res.json({ 
        success: true, 
        message: 'Password reset successfully' 
    });
});

// Get current user endpoint
app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            error: 'No token provided' 
        });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid or expired token' 
        });
    }
    
    const user = mockUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
        return res.status(404).json({ 
            success: false, 
            error: 'User not found' 
        });
    }
    
    const { password: _, ...userData } = user;
    
    res.json({
        success: true,
        user: userData
    });
});

// Telegram authentication endpoint
app.post('/api/auth/telegram', (req, res) => {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;
    
    // In production, verify the Telegram hash with bot token
    // For now, we'll trust the data from Telegram Web App
    
    // Create or update user
    let user = mockUsers.find(u => u.telegram_id === id);
    
    if (!user) {
        user = {
            id: mockUsers.length + 1,
            telegram_id: id,
            first_name: first_name || 'Telegram',
            last_name: last_name || 'User',
            username: username || `telegram_${id}`,
            photo_url: photo_url,
            email: null,
            phone: null,
            password: null,
            balance: 1000, // Starting balance for new users
            created_at: new Date()
        };
        mockUsers.push(user);
    } else {
        // Update existing user with latest Telegram data
        user.first_name = first_name || user.first_name;
        user.last_name = last_name || user.last_name;
        user.username = username || user.username;
        user.photo_url = photo_url || user.photo_url;
    }
    
    const token = generateToken(user);
    const { password: _, ...userData } = user;
    
    res.json({
        success: true,
        token,
        user: userData
    });
});

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
