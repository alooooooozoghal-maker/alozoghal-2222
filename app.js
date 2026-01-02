/**
 * 📱 اسکریپت اصلی برنامه الو ذغال
 * مدیریت سفارشات و تعاملات کاربر
 */

class AloZoghalApp {
    constructor() {
        this.config = {
            coalPrice: 65000,
            currency: 'تومان',
            minOrder: 1,
            maxOrder: 20,
            deliveryFee: 0,
            freeDeliveryMin: 2,
            contactPhone: '09220730628',
            contactWhatsApp: '989220730628',
            workingHours: '۷ صبح تا ۹ شب'
        };
        
        this.currentOrder = {
            items: [
                {
                    id: 'coal',
                    name: 'ذغال کبابی مرغوب',
                    price: 65000,
                    quantity: 1,
                    image: 'https://raw.githubusercontent.com/aloozoghal-hash/alozoghal/main/8f6dcedf3dc3dbaa82c0df548bd962c9.jpg'
                }
            ],
            customer: {
                name: '',
                phone: '',
                address: '',
                deliveryTime: '۳ ساعت دیگر',
                location: null
            },
            subtotal: 0,
            total: 0,
            timestamp: null,
            orderId: null
        };
        
        this.cart = [];
        this.isOrderComplete = false;
        
        this.init();
    }
    
    init() {
        console.log('[Alo Zoghal] Initializing application...');
        
        // Load configuration
        this.loadConfig();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize cart
        this.updateCart();
        
        // Check for previous order
        this.checkPreviousOrder();
        
        // Initialize sharing
        this.initSharing();
        
        console.log('[Alo Zoghal] Application initialized successfully');
    }
    
    loadConfig() {
        // Try to load from localStorage
        try {
            const savedConfig = localStorage.getItem('alo_zoghal_config');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
            }
        } catch (error) {
            console.warn('[Alo Zoghal] Could not load config from localStorage:', error);
        }
        
        // Update UI with config values
        this.updateConfigUI();
    }
    
    updateConfigUI() {
        // Update prices in UI
        const priceElements = document.querySelectorAll('.item-price');
        priceElements.forEach(el => {
            el.textContent = `${this.config.coalPrice.toLocaleString()} ${this.config.currency}`;
        });
        
        // Update contact info
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        phoneLinks.forEach(link => {
            link.href = `tel:${this.config.contactPhone}`;
        });
        
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me/"]');
        whatsappLinks.forEach(link => {
            const match = link.href.match(/wa\.me\/(\d+)/);
            if (match) {
                link.href = link.href.replace(match[1], this.config.contactWhatsApp);
            }
        });
    }
    
    setupEventListeners() {
        // Quantity buttons
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.textContent;
                const type = 'coal'; // For now, only coal
                
                if (action === '+') {
                    this.updateQuantity(type, 1);
                } else if (action === '-') {
                    this.updateQuantity(type, -1);
                }
            });
        });
        
        // Form submission
        const orderForm = document.getElementById('form-area');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateInvoice();
            });
        }
        
        // GPS button
        const gpsBtn = document.getElementById('gpsBtn');
        if (gpsBtn) {
            gpsBtn.addEventListener('click', () => {
                this.getLocation();
            });
        }
        
        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareApp();
            });
        }
        
        // WhatsApp button
        const waLink = document.getElementById('waLink');
        if (waLink) {
            waLink.addEventListener('click', (e) => {
                this.sendToWhatsApp(e);
            });
        }
        
        // SMS button
        const smsLink = document.getElementById('smsLink');
        if (smsLink) {
            smsLink.addEventListener('click', (e) => {
                this.sendToSMS(e);
            });
        }
        
        // Telegram button
        const tgBtn = document.getElementById('tgBtn');
        if (tgBtn) {
            tgBtn.addEventListener('click', () => {
                this.sendToTelegram();
            });
        }
        
        // Edit order button
        const editBtn = document.querySelector('[onclick="editOrder()"]');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editOrder();
            });
        }
        
        // New order button
        const newOrderBtn = document.querySelector('[onclick="resetForm()"]');
        if (newOrderBtn) {
            newOrderBtn.addEventListener('click', () => {
                this.resetOrder();
            });
        }
        
        // Secret code checker
        const nameInput = document.getElementById('custName');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                this.checkSecretCode(e.target.value);
            });
        }
    }
    
    updateQuantity(type, change) {
        const item = this.currentOrder.items.find(item => item.id === type);
        if (!item) return;
        
        const newQuantity = item.quantity + change;
        if (newQuantity >= this.config.minOrder && newQuantity <= this.config.maxOrder) {
            item.quantity = newQuantity;
            
            // Update UI
            const qtyDisplay = document.getElementById(`qty-${type}`);
            if (qtyDisplay) {
                qtyDisplay.textContent = newQuantity;
            }
            
            // Update cart
            this.updateCart();
            
            // Show feedback
            this.showToast(`تعداد ${item.name} به ${newQuantity} تغییر کرد`, 'info');
        }
    }
    
    updateCart() {
        // Calculate totals
        this.currentOrder.subtotal = this.currentOrder.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Apply delivery fee logic
        const totalQuantity = this.currentOrder.items.reduce((sum, item) => sum + item.quantity, 0);
        this.currentOrder.deliveryFee = totalQuantity >= this.config.freeDeliveryMin ? 0 : this.config.deliveryFee;
        
        this.currentOrder.total = this.currentOrder.subtotal + this.currentOrder.deliveryFee;
        
        // Update cart UI if exists
        this.updateCartUI();
    }
    
    updateCartUI() {
        // This would update a cart summary UI if we had one
        // For now, just log the update
        console.log('[Alo Zoghal] Cart updated:', this.currentOrder);
    }
    
    async getLocation() {
        const gpsBtn = document.getElementById('gpsBtn');
        if (!gpsBtn) return;
        
        if (!navigator.geolocation) {
            this.showAlert('مرورگر شما از GPS پشتیبانی نمی‌کند', 'error');
            return;
        }
        
        // Update button state
        gpsBtn.disabled = true;
        gpsBtn.innerHTML = '⏳ در حال دریافت موقعیت...';
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });
            
            const { latitude, longitude, accuracy } = position.coords;
            this.currentOrder.customer.location = {
                lat: latitude,
                lng: longitude,
                accuracy: accuracy,
                url: `https://www.google.com/maps?q=${latitude},${longitude}`,
                timestamp: new Date().toISOString()
            };
            
            // Update UI
            gpsBtn.innerHTML = '✅ موقعیت ثبت شد';
            gpsBtn.classList.add('success');
            
            this.showToast('موقعیت مکانی شما با موفقیت ثبت شد', 'success');
            
            // Save to localStorage
            this.saveOrder();
            
        } catch (error) {
            console.error('[Alo Zoghal] Error getting location:', error);
            
            let errorMessage = 'خطا در دریافت موقعیت';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'دسترسی به موقعیت مکانی رد شد. لطفاً در تنظیمات مرورگر اجازه دهید.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'اطلاعات موقعیت در دسترس نیست.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'درخواست موقعیت مکانی زمان‌بر شد.';
                    break;
            }
            
            gpsBtn.innerHTML = '❌ خطا در دریافت موقعیت';
            gpsBtn.classList.add('error');
            
            this.showAlert(errorMessage, 'error');
            
            // Re-enable button after error
            setTimeout(() => {
                gpsBtn.disabled = false;
                gpsBtn.innerHTML = '📍 ثبت لوکیشن (GPS)';
                gpsBtn.classList.remove('error', 'success');
            }, 3000);
        }
    }
    
    validateForm() {
        const customer = this.currentOrder.customer;
        
        // Validate name
        if (!customer.name || customer.name.trim().length < 2) {
            this.showAlert('لطفاً نام کامل خود را وارد کنید (حداقل ۲ حرف)', 'error');
            document.getElementById('custName').focus();
            return false;
        }
        
        // Validate phone
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!customer.phone || !phoneRegex.test(customer.phone.replace(/\D/g, ''))) {
            this.showAlert('لطفاً شماره تماس معتبر وارد کنید (۱۰-۱۱ رقم)', 'error');
            document.getElementById('custPhone').focus();
            return false;
        }
        
        // Validate address
        if (!customer.address || customer.address.trim().length < 10) {
            this.showAlert('لطفاً آدرس کامل با حداقل ۱۰ کاراکتر وارد کنید', 'error');
            document.getElementById('custAddr').focus();
            return false;
        }
        
        // Validate delivery time
        if (!customer.deliveryTime) {
            customer.deliveryTime = '۳ ساعت دیگر';
        }
        
        return true;
    }
    
    generateInvoice() {
        // Get form values
        this.currentOrder.customer.name = document.getElementById('custName').value.trim();
        this.currentOrder.customer.phone = document.getElementById('custPhone').value.trim();
        this.currentOrder.customer.address = document.getElementById('custAddr').value.trim();
        this.currentOrder.customer.deliveryTime = document.getElementById('delivTime').value;
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Generate order ID
        this.currentOrder.orderId = this.generateOrderId();
        this.currentOrder.timestamp = new Date().toISOString();
        
        // Update cart totals
        this.updateCart();
        
        // Populate invoice
        this.populateInvoice();
        
        // Show invoice section
        document.getElementById('form-area').style.display = 'none';
        document.getElementById('invoice').style.display = 'block';
        
        // Scroll to invoice
        document.getElementById('invoice').scrollIntoView({ behavior: 'smooth' });
        
        // Save order
        this.saveOrder();
        
        // Show success message
        this.showToast('سفارش شما با موفقیت ثبت شد', 'success');
        
        // Mark as complete
        this.isOrderComplete = true;
    }
    
    populateInvoice() {
        // Set invoice values
        document.getElementById('inv-name').textContent = this.currentOrder.customer.name;
        document.getElementById('inv-phone').textContent = this.currentOrder.customer.phone;
        document.getElementById('inv-qty-coal').textContent = `${this.currentOrder.items[0].quantity} کیسه`;
        document.getElementById('inv-time').textContent = this.currentOrder.customer.deliveryTime;
        document.getElementById('inv-addr').textContent = this.currentOrder.customer.address;
        document.getElementById('inv-location').textContent = this.currentOrder.customer.location ? 'ثبت شده' : 'ثبت نشده';
        document.getElementById('inv-price').textContent = 
            `${this.currentOrder.total.toLocaleString()} ${this.config.currency}`;
        
        // Update WhatsApp link
        const waLink = document.getElementById('waLink');
        if (waLink) {
            const message = this.formatWhatsAppMessage();
            waLink.href = `https://wa.me/${this.config.contactWhatsApp}?text=${encodeURIComponent(message)}`;
        }
        
        // Update SMS link
        const smsLink = document.getElementById('smsLink');
        if (smsLink) {
            const message = this.formatSMSMessage();
            smsLink.href = `sms:${this.config.contactPhone}?body=${encodeURIComponent(message)}`;
        }
    }
    
    formatWhatsAppMessage() {
        const order = this.currentOrder;
        const locationText = order.customer.location ? 
            `📍 لوکیشن: ${order.customer.location.url}` : 
            '📍 لوکیشن: ثبت نشده';
        
        return `سلام الو ذغال 🔥

📦 سفارش جدید
🆔 کد سفارش: ${order.orderId}
👤 نام: ${order.customer.name}
📱 تلفن: ${order.customer.phone}

🛒 محتوای سفارش:
• ذغال کبابی: ${order.items[0].quantity} کیسه
💰 مبلغ کل: ${order.total.toLocaleString()} ${this.config.currency}

🚚 اطلاعات ارسال:
🕒 زمان تحویل: ${order.customer.deliveryTime}
🏠 آدرس: ${order.customer.address}
${locationText}

⏰ زمان ثبت: ${new Date(order.timestamp).toLocaleString('fa-IR')}

لطفاً این سفارش را تأیید کنید.`;
    }
    
    formatSMSMessage() {
        const order = this.currentOrder;
        return `سفارش الو ذغال
کد: ${order.orderId}
نام: ${order.customer.name}
تلفن: ${order.customer.phone}
ذغال: ${order.items[0].quantity} کیسه
مبلغ: ${order.total.toLocaleString()}
تحویل: ${order.customer.deliveryTime}
آدرس: ${order.customer.address}`;
    }
    
    async sendToTelegram() {
        const tgBtn = document.getElementById('tgBtn');
        if (!tgBtn) return;
        
        // Save original text
        const originalText = tgBtn.innerHTML;
        
        try {
            // Update button state
            tgBtn.disabled = true;
            tgBtn.innerHTML = '⏳ در حال ارسال...';
            
            // Format message for Telegram
            const message = this.formatTelegramMessage();
            
            // Using Google Apps Script as a bridge
            const response = await fetch('https://script.google.com/macros/s/AKfycbyLQjEqmjs5Re2m7nf3lGU_IZQU0ILuFgiJWxrEQ306AgUy1zW090quuwv1QLWVOQyV/exec', {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'send_order',
                    order: this.currentOrder,
                    message: message,
                    timestamp: new Date().toISOString()
                })
            });
            
            // Show success message
            tgBtn.innerHTML = '✅ ارسال شد';
            this.showToast('سفارش به تلگرام ارسال شد', 'success');
            
            // Log to console (in real app, this would go to server)
            console.log('[Alo Zoghal] Order sent to Telegram:', this.currentOrder);
            
        } catch (error) {
            console.error('[Alo Zoghal] Error sending to Telegram:', error);
            
            tgBtn.innerHTML = '❌ خطا در ارسال';
            this.showAlert('خطا در ارسال به تلگرام. لطفاً با واتساپ یا پیامک ارسال کنید.', 'error');
            
        } finally {
            // Reset button after 3 seconds
            setTimeout(() => {
                tgBtn.disabled = false;
                tgBtn.innerHTML = originalText;
            }, 3000);
        }
    }
    
    formatTelegramMessage() {
        const order = this.currentOrder;
        const locationText = order.customer.location ? 
            `📍 [لوکیشن](${order.customer.location.url})` : 
            '📍 لوکیشن: ثبت نشده';
        
        return `🔥 *سفارش جدید الو ذغال*

🆔 کد سفارش: \`${order.orderId}\`
👤 نام: ${order.customer.name}
📱 تلفن: \`${order.customer.phone}\`

🛒 *محتوای سفارش:*
• ذغال کبابی: ${order.items[0].quantity} کیسه
💰 مبلغ کل: *${order.total.toLocaleString()} ${this.config.currency}*

🚚 *اطلاعات ارسال:*
🕒 زمان تحویل: ${order.customer.deliveryTime}
🏠 آدرس: ${order.customer.address}
${locationText}

⏰ زمان ثبت: ${new Date(order.timestamp).toLocaleString('fa-IR')}

✅ لطفاً این سفارش را تأیید کنید.`;
    }
    
    editOrder() {
        // Hide invoice, show form
        document.getElementById('invoice').style.display = 'none';
        document.getElementById('form-area').style.display = 'block';
        
        // Scroll to form
        document.getElementById('form-area').scrollIntoView({ behavior: 'smooth' });
        
        this.showToast('می‌توانید سفارش را ویرایش کنید', 'info');
    }
    
    resetOrder() {
        if (!confirm('آیا می‌خواهید سفارش جدیدی ثبت کنید؟ سفارش فعلی حذف خواهد شد.')) {
            return;
        }
        
        // Reset form
        document.getElementById('custName').value = '';
        document.getElementById('custPhone').value = '';
        document.getElementById('custAddr').value = '';
        document.getElementById('delivTime').value = '۳ ساعت دیگر';
        
        // Reset quantities
        this.currentOrder.items[0].quantity = 1;
        document.getElementById('qty-coal').textContent = '1';
        
        // Reset location
        this.currentOrder.customer.location = null;
        const gpsBtn = document.getElementById('gpsBtn');
        if (gpsBtn) {
            gpsBtn.disabled = false;
            gpsBtn.innerHTML = '📍 ثبت لوکیشن (GPS)';
            gpsBtn.classList.remove('error', 'success');
        }
        
        // Hide invoice, show form
        document.getElementById('invoice').style.display = 'none';
        document.getElementById('form-area').style.display = 'block';
        
        // Reset order state
        this.isOrderComplete = false;
        this.currentOrder.orderId = null;
        this.currentOrder.timestamp = null;
        
        // Clear saved order
        localStorage.removeItem('alo_zoghal_current_order');
        
        this.showToast('فرم بازنشانی شد. می‌توانید سفارش جدیدی ثبت کنید.', 'success');
    }
    
    checkSecretCode(input) {
        const secretCode = "علی نادریان 1362541";
        if (input.trim() === secretCode) {
            // Show admin access
            const adminBtn = document.getElementById('secret-admin-btn');
            if (adminBtn) {
                adminBtn.style.opacity = '1';
                adminBtn.title = 'دسترسی مدیریت فعال شد';
                
                this.showToast('دسترسی مدیریت فعال شد!', 'success');
                
                // Store in session
                sessionStorage.setItem('admin_access_granted', 'true');
            }
        }
    }
    
    async shareApp() {
        const shareData = {
            title: 'الو ذغال',
            text: 'سفارش آنلاین ذغال مرغوب در ایذه - تحویل سریع',
            url: window.location.href
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                this.showToast('سایت با موفقیت به اشتراک گذاشته شد', 'success');
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                this.showToast('لینک سایت در کلیپ‌بورد کپی شد', 'success');
            }
        } catch (error) {
            console.error('[Alo Zoghal] Error sharing:', error);
            
            // Alternative fallback
            const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + '\n' + shareData.url)}`;
            window.open(shareUrl, '_blank');
        }
    }
    
    initSharing() {
        // Initialize Web Share API if available
        if (navigator.share) {
            console.log('[Alo Zoghal] Web Share API is supported');
        } else {
            console.log('[Alo Zoghal] Web Share API is not supported, using fallback');
        }
    }
    
    checkPreviousOrder() {
        try {
            const savedOrder = localStorage.getItem('alo_zoghal_current_order');
            if (savedOrder) {
                const order = JSON.parse(savedOrder);
                
                // Check if order is from today
                const orderDate = new Date(order.timestamp);
                const today = new Date();
                
                if (orderDate.toDateString() === today.toDateString()) {
                    // Offer to continue with previous order
                    if (confirm('سفارش ذخیره شده‌ای از امروز دارید. آیا می‌خواهید ادامه دهید؟')) {
                        this.loadOrder(order);
                    }
                }
            }
        } catch (error) {
            console.warn('[Alo Zoghal] Could not load previous order:', error);
        }
    }
    
    loadOrder(order) {
        // Load order data
        this.currentOrder = order;
        
        // Update form fields
        document.getElementById('custName').value = order.customer.name;
        document.getElementById('custPhone').value = order.customer.phone;
        document.getElementById('custAddr').value = order.customer.address;
        document.getElementById('delivTime').value = order.customer.deliveryTime;
        
        // Update quantities
        document.getElementById('qty-coal').textContent = order.items[0].quantity;
        
        // Update GPS button if location exists
        if (order.customer.location) {
            const gpsBtn = document.getElementById('gpsBtn');
            if (gpsBtn) {
                gpsBtn.innerHTML = '✅ موقعیت ثبت شد';
                gpsBtn.classList.add('success');
            }
        }
        
        this.showToast('سفارش قبلی بارگیری شد', 'success');
    }
    
    saveOrder() {
        try {
            localStorage.setItem('alo_zoghal_current_order', JSON.stringify(this.currentOrder));
        } catch (error) {
            console.warn('[Alo Zoghal] Could not save order to localStorage:', error);
        }
    }
    
    generateOrderId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `ORD-${timestamp}-${random}`.toUpperCase();
    }
    
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            padding: 15px 25px;
            border-radius: 10px;
            animation: slideDown 0.3s ease;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        // Add to document
        document.body.appendChild(alertDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            alertDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }, 5000);
    }
    
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            padding: 12px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            font-size: 14px;
            animation: slideUp 0.3s ease;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // Public methods for global access
    updateQty(type, change) {
        this.updateQuantity(type, change);
    }
    
    generateInvoice() {
        this.generateInvoice();
    }
    
    editOrder() {
        this.editOrder();
    }
    
    resetForm() {
        this.resetOrder();
    }
    
    sendToTelegram() {
        this.sendToTelegram();
    }
    
    sendToWhatsApp(e) {
        // Let the link handle it naturally
        return true;
    }
    
    sendToSMS(e) {
        // Let the link handle it naturally
        return true;
    }
    
    checkSecretCode() {
        const input = document.getElementById('custName')?.value;
        if (input) {
            this.checkSecretCode(input);
        }
    }
    
    getLocation() {
        this.getLocation();
    }
    
    closeStory() {
        // Close story modal
        const modal = document.getElementById('story-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    closePwaBanner() {
        // This would be handled by the PWA manager
        if (window.pwaManager) {
            window.pwaManager.closeBanner();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AloZoghalApp();
    
    // Make functions available globally
    window.updateQty = function(type, change) {
        if (window.app) {
            window.app.updateQty(type, change);
        }
    };
    
    window.generateInvoice = function() {
        if (window.app) {
            window.app.generateInvoice();
        }
    };
    
    window.editOrder = function() {
        if (window.app) {
            window.app.editOrder();
        }
    };
    
    window.resetForm = function() {
        if (window.app) {
            window.app.resetForm();
        }
    };
    
    window.sendToTelegram = function() {
        if (window.app) {
            window.app.sendToTelegram();
        }
    };
    
    window.checkSecretCode = function() {
        if (window.app) {
            window.app.checkSecretCode();
        }
    };
    
    window.getLocation = function() {
        if (window.app) {
            window.app.getLocation();
        }
    };
    
    window.closeStory = function() {
        if (window.app) {
            window.app.closeStory();
        }
    };
    
    window.closePwaBanner = function() {
        if (window.app) {
            window.app.closePwaBanner();
        }
    };
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AloZoghalApp;
}
