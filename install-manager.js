/**
 * 📱 نصب هوشمند PWA برای الو ذغال
 * این فایل مدیریت نمایش بنر نصب و نصب اپلیکیشن را بر عهده دارد
 */

class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.isAppInstalled = false;
        this.bannerClosed = false;
        this.installBtn = null;
        this.banner = null;
        
        this.init();
    }
    
    init() {
        console.log('[PWA Manager] Initializing...');
        
        // Check if app is already installed
        this.checkInstallStatus();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check if we should show banner
        setTimeout(() => this.checkShowBanner(), 3000);
    }
    
    checkInstallStatus() {
        // Check display mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('[PWA Manager] App is running in standalone mode');
            this.isAppInstalled = true;
            localStorage.setItem('pwa_installed', 'true');
            return;
        }
        
        // Check if installed before via localStorage
        if (localStorage.getItem('pwa_installed') === 'true') {
            this.isAppInstalled = true;
            console.log('[PWA Manager] App was previously installed');
        }
        
        // Check for iOS web app mode
        if (window.navigator.standalone === true) {
            console.log('[PWA Manager] iOS standalone mode detected');
            this.isAppInstalled = true;
            localStorage.setItem('pwa_installed', 'true');
        }
    }
    
    setupEventListeners() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('[PWA Manager] beforeinstallprompt event fired');
            
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Update UI to notify the user they can install the PWA
            this.updateInstallability(true);
            
            // Show install button
            this.showInstallButton();
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('[PWA Manager] PWA was installed');
            this.isAppInstalled = true;
            localStorage.setItem('pwa_installed', 'true');
            this.hideBanner();
            this.showInstallSuccess();
        });
        
        // Check on page load if banner was closed
        if (localStorage.getItem('pwa_banner_closed') === 'true') {
            this.bannerClosed = true;
        }
    }
    
    updateInstallability(canInstall) {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            if (canInstall) {
                installBtn.style.display = 'block';
                installBtn.onclick = () => this.installApp();
            } else {
                installBtn.style.display = 'none';
            }
        }
    }
    
    showInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.innerHTML = '📱 نصب اپلیکیشن';
            installBtn.style.display = 'block';
            
            // Add pulse animation
            installBtn.style.animation = 'pulseChallenge 2s infinite';
        }
    }
    
    async installApp() {
        if (!this.deferredPrompt) {
            console.log('[PWA Manager] No install prompt available');
            this.showInstallInstructions();
            return;
        }
        
        console.log('[PWA Manager] Showing install prompt');
        
        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const choiceResult = await this.deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
            console.log('[PWA Manager] User accepted the install prompt');
            // Hide the banner
            this.hideBanner();
        } else {
            console.log('[PWA Manager] User dismissed the install prompt');
            // Don't show banner again for 7 days
            this.delayBanner(7);
        }
        
        // Clear the deferredPrompt variable
        this.deferredPrompt = null;
    }
    
    checkShowBanner() {
        // Don't show if app is already installed
        if (this.isAppInstalled) {
            console.log('[PWA Manager] App is installed, hiding banner');
            this.hideBanner();
            return;
        }
        
        // Don't show if banner was closed
        if (this.bannerClosed) {
            console.log('[PWA Manager] Banner was closed by user');
            return;
        }
        
        // Check if banner should be delayed
        const bannerDelay = localStorage.getItem('pwa_banner_delay');
        if (bannerDelay) {
            const delayDate = new Date(parseInt(bannerDelay));
            if (new Date() < delayDate) {
                console.log('[PWA Manager] Banner is delayed');
                return;
            }
        }
        
        // Show banner for mobile devices
        if (this.isMobileDevice()) {
            console.log('[PWA Manager] Showing banner for mobile device');
            this.showBanner();
        }
    }
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    showBanner() {
        const banner = document.getElementById('pwa-banner');
        if (banner) {
            banner.style.display = 'flex';
            banner.style.animation = 'slideUp 0.5s ease-out';
            
            // Auto-hide after 30 seconds
            setTimeout(() => {
                if (banner.style.display === 'flex') {
                    this.hideBanner();
                    this.delayBanner(1); // Delay for 1 day
                }
            }, 30000);
        }
    }
    
    hideBanner() {
        const banner = document.getElementById('pwa-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    }
    
    delayBanner(days) {
        const delayDate = new Date();
        delayDate.setDate(delayDate.getDate() + days);
        localStorage.setItem('pwa_banner_delay', delayDate.getTime().toString());
        console.log(`[PWA Manager] Banner delayed for ${days} days`);
    }
    
    showInstallSuccess() {
        // Show success message
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.innerHTML = `
            <strong>✅ اپلیکیشن با موفقیت نصب شد!</strong><br>
            حالا می‌توانید از اپلیکیشن الو ذغال استفاده کنید.
        `;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.left = '15px';
        alertDiv.style.right = '15px';
        alertDiv.style.zIndex = '9999';
        
        document.body.appendChild(alertDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    showInstallInstructions() {
        const instructions = `
            <div style="background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 15px; border: 2px solid var(--gold); position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; max-width: 90%; width: 400px; text-align: center;">
                <h3 style="color: var(--gold); margin-bottom: 15px;">📱 راهنمای نصب</h3>
                <p style="margin-bottom: 10px;"><strong>برای اندروید:</strong></p>
                <p style="font-size: 14px; margin-bottom: 15px;">۱. منوی مرورگر (سه نقطه) را باز کنید<br>
                ۲. گزینه "Add to Home screen" را انتخاب کنید<br>
                ۳. روی "Add" کلیک کنید</p>
                
                <p style="margin-bottom: 10px;"><strong>برای آیفون:</strong></p>
                <p style="font-size: 14px; margin-bottom: 20px;">۱. دکمه Share را بزنید<br>
                ۲. گزینه "Add to Home Screen" را انتخاب کنید<br>
                ۳. روی "Add" کلیک کنید</p>
                
                <button onclick="this.parentElement.remove()" style="background: var(--gold); color: black; border: none; padding: 10px 20px; border-radius: 10px; font-weight: bold; cursor: pointer;">
                    فهمیدم
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', instructions);
    }
    
    // Public methods
    closeBanner() {
        this.hideBanner();
        this.bannerClosed = true;
        localStorage.setItem('pwa_banner_closed', 'true');
        console.log('[PWA Manager] Banner closed by user');
    }
    
    canInstall() {
        return !!this.deferredPrompt;
    }
}

// Initialize PWA Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAInstallManager();
    
    // Make closeBanner available globally
    window.closePwaBanner = function() {
        if (window.pwaManager) {
            window.pwaManager.closeBanner();
        }
    };
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAInstallManager;
}
