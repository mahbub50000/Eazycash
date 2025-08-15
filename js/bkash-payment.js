// bKash Payment Handler
class BkashPayment {
    constructor() {
        this.paymentID = null;
        this.init();
    }

    init() {
        const form = document.getElementById('depositForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleDeposit(e));
        }
    }

    async handleDeposit(e) {
        e.preventDefault();
        
        const userId = document.getElementById('userId').value;
        const amount = document.getElementById('amount').value;
        const depositBtn = document.getElementById('depositBtn');
        
        if (!userId || !amount || amount < 10) {
            this.showStatus('Please enter valid amount (minimum 10 BDT)', 'error');
            return;
        }

        depositBtn.disabled = true;
        depositBtn.textContent = 'Processing...';

        try {
            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, amount })
            });

            const data = await response.json();
            
            if (data.paymentID) {
                this.paymentID = data.paymentID;
                this.initiateBkashPayment(data);
            } else {
                throw new Error('Failed to create payment');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showStatus('Failed to initiate payment. Please try again.', 'error');
            depositBtn.disabled = false;
            depositBtn.textContent = 'Pay with bKash';
        }
    }

    initiateBkashPayment(paymentData) {
        const config = {
            paymentID: paymentData.paymentID,
            createURL: '/api/create-payment',
            executeURL: '/api/payment-callback',
            onSuccess: (data) => {
                console.log('Payment successful:', data);
                this.showStatus('Payment successful! Your account will be credited shortly.', 'success');
                this.clearForm();
            },
            onError: (error) => {
                console.error('Payment error:', error);
                this.showStatus('Payment failed. Please try again.', 'error');
                this.resetButton();
            },
            onClose: () => {
                console.log('Payment window closed');
                this.resetButton();
            }
        };

        if (window.bKash) {
            window.bKash.init(config);
            window.bKash.reconfigure(config);
        } else {
            console.error('bKash SDK not loaded');
            this.showStatus('bKash service unavailable. Please try again later.', 'error');
            this.resetButton();
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }

    clearForm() {
        document.getElementById('depositForm').reset();
    }

    resetButton() {
        const depositBtn = document.getElementById('depositBtn');
        depositBtn.disabled = false;
        depositBtn.textContent = 'Pay with bKash';
    }

    async checkTransactionStatus(paymentID) {
        try {
            const response = await fetch(`/api/transaction-status/${paymentID}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error checking status:', error);
            return null;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BkashPayment();
});
