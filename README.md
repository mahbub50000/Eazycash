# bKash Payment Gateway Integration Guide

## Overview
This guide will help you integrate bKash Payment Gateway into your Eazycash project for deposit functionality.

## Prerequisites
1. Node.js (v14 or higher)
2. npm or yarn
3. bKash merchant account (sandbox for testing)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure bKash Credentials
1. Create a bKash sandbox merchant account at [bKash Developer Portal](https://developer.bka.sh/)
2. Update `.env` file with your credentials:
   ```
   BKASH_USERNAME=your_sandbox_username
   BKASH_PASSWORD=your_sandbox_password
   BKASH_APP_KEY=your_sandbox_app_key
   BKASH_APP_SECRET=your_sandbox_app_secret
   ```

### 3. Start the Server
```bash
npm start
```

### 4. Access the Application
- Main app: http://localhost:3000
- Admin panel: http://localhost:3000/admin.html

## File Structure
```
├── server.js          # Express backend server
├── js/
│   └── bkash-payment.js  # Frontend payment handler
├── .env              # Environment variables
├── package.json      # Dependencies
└── README.md         # This guide
```

## How It Works

### 1. Payment Flow
1. User enters amount and user ID on deposit page
2. System creates bKash payment request
3. User completes payment via bKash app/website
4. System receives callback and verifies payment
5. User balance is updated

### 2. API Endpoints
- `POST /api/create-payment` - Create new payment
- `POST /api/payment-callback` - Handle payment callback
- `GET /api/transaction-status/:paymentID` - Check payment status
- `GET /api/transactions/:userId` - Get user transactions

## Testing with bKash Sandbox

### Test Credentials
- **Username**: sandbox_username
- **Password**: sandbox_password
- **App Key**: sandbox_app_key
- **App Secret**: sandbox_app_secret

### Test Cards
- **Successful Payment**: 01770618575
- **Failed Payment**: 01770618576

## Security Notes
- Never commit real credentials to version control
- Use HTTPS in production
- Implement proper validation and sanitization
- Add rate limiting for API endpoints

## Next Steps
1. Set up database for transaction storage
2. Implement user balance updates
3. Add transaction history page
4. Implement production credentials
5. Add error handling and logging
6. Set up SSL certificates for production

## Support
For issues or questions, please contact the development team.
