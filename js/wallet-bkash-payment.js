// Enhanced bKash Payment Integration for Wallet System
class WalletBkashPayment {
    constructor() {
        this.paymentID = null;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Wait for user data to be available
        this.waitForUserData();
        
        // Setup event listeners
        const bkashBtn = document.getElementById('bkash-pay-btn');
        if (bkashBtn) {
            bkashBtn.addEventListener('click', () => this.handleBkashPayment());
        }
    }

    waitForUserData() {
        const checkUser = () => {
            if (window.user && window.user.id) {
                this.currentUser = window.user;
                this.setupPayment();
            } else {
                setTimeout(checkUser, 100);
            }
        };
        checkUser();
    }

    setupPayment() {
        console.log('bKash payment setup for user:', this.currentUser.id);
    }

    async handleBkashPayment() {
        if (!this.currentUser) {
            this.showStatus('Please login first', 'error');
            return;
        }

        const amountInput = document.getElementById('deposit-amount');
        const referenceInput = document.getElementById('deposit-reference');
        
        const amount = parseFloat(amountInput.value);
        const reference = referenceInput.value.trim();

        if (!amount || amount < 10) {
            this.showStatus('Please enter valid amount (minimum 10 BDT)', 'error');
            return;
        }

        if (!reference) {
            this.showStatus('Please enter your bKash number or reference', 'error');
            return;
        }

        const bkashBtn = document.getElementById('bkash-pay-btn');
        bkashBtn.disabled = true;
        bkashBtn.textContent = 'Processing...';

        try {
            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount,
                    userId: this.currentUser.id,
                    reference: reference
                })
            });

            const data = await response.json();
            
            if (data.paymentID) {
                this.paymentID = data.paymentID;
                this.initiateBkashPayment(data, amount);
            } else {
                throw new Error('Failed to create payment');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showStatus('Failed to initiate payment. Please try again.', 'error');
            this.resetButton();
        }
    }

    initiateBkashPayment(paymentData, amount) {
        const config = {
            paymentID: paymentData.paymentID,
            createURL: '/api/create-payment',
            executeURL: '/api/payment-callback',
            onSuccess: (data) => {
                console.log('Payment successful:', data);
                this.handlePaymentSuccess(data, amount);
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

    async handlePaymentSuccess(data, amount) {
        try {
            // Update user deposit balance
            let depositBalance = parseFloat(localStorage.getItem('depositBalance')) || 0;
            depositBalance += amount;
            localStorage.setItem('depositBalance', depositBalance.toFixed(2));

            // Record transaction
            const transaction = {
                id: Date.now(),
                userId: this.currentUser.id,
                userName: this.currentUser.first_name + (this.currentUser.last_name ? ' ' + this.currentUser.last_name : ''),
                amount: amount,
                method: 'bkash',
                status: 'completed',
                timestamp: Date.now(),
                paymentID: this.paymentID
            };

            // Save to deposits
            const deposits = JSON.parse(localStorage.getItem('deposits') || '[]');
            deposits.push(transaction);
            localStorage.setItem('deposits', JSON.stringify(deposits));

            // Update UI
            const depositBalanceEl = document.getElementById('deposit-balance');
            if (depositBalanceEl) {
                depositBalanceEl.textContent = depositBalance.toFixed(2);
            }

            // Update deposit history
            if (typeof window.renderDepositHistory === 'function') {
                window.renderDepositHistory();
            }

            this.showStatus(`Payment successful! ${amount} BDT has been added to your deposit balance.`, 'success');
            this.clearForm();
            this.resetButton();

        } catch (error) {
            console.error('Error handling payment success:', error);
            this.showStatus('Payment processed but failed to update balance. Contact support.', 'error');
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('bkash-payment-status');
        const messageDiv = document.getElementById('bkash-status-message');
        
        if (statusDiv && messageDiv) {
            messageDiv.textContent = message;
            statusDiv.className = `status ${type}`;
            statusDiv.style.display = 'block';
            statusDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
            statusDiv.style.color = type === 'success' ? '#155724' : '#721c24';
            statusDiv.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }

    clearForm() {
        const amountInput = document.getElementById('deposit-amount');
        const referenceInput = document.getElementById('deposit-reference');
        if (amountInput) amountInput.value = '';
        if (referenceInput) referenceInput.value = '';
    }

    resetButton() {
        const bkashBtn = document.getElementById('bkash-pay-btn');
        if (bkashBtn) {
            bkashBtn.disabled = false;
            bkashBtn.textContent = 'Pay with bKash';
        }
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
    new WalletBkashPayment();
});
