/**
 * 📢 سیستم مدیریت تبلیغات ساده برای الو ذغال
 * این فایل مسئول بارگیری و نمایش تبلیغات از فایل‌های JSON است
 */

class AdsManager {
    constructor() {
        this.tickerData = [];
        this.storiesData = [];
        this.vipAdsData = [];
        this.settings = {};
        
        this.currentTickerIndex = 0;
        this.currentVipAdIndex = 0;
        
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
        this.lastFetchTime = {};
        
        this.init();
    }
    
    async init() {
        console.log('[Ads Manager] Initializing...');
        
        // Load all data
        await this.loadAllData();
        
        // Initialize components
        this.initTicker();
        this.initStories();
        this.initVipAds();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
        
        // Set up error handling
        this.setupErrorHandling();
    }
    
    async loadAllData() {
        try {
            // Load ticker data
            await this.loadTickerData();
            
            // Load stories data
            await this.loadStoriesData();
            
            // Load VIP ads data
            await this.loadVipAdsData();
            
            // Load settings
            await this.loadSettings();
            
            console.log('[Ads Manager] All data loaded successfully');
        } catch (error) {
            console.error('[Ads Manager] Error loading data:', error);
            this.loadFallbackData();
        }
    }
    
    async loadTickerData() {
        const cacheKey = 'ticker_data';
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            this.tickerData = cached.data.messages || [];
            console.log('[Ads Manager] Ticker data loaded from cache');
            return;
        }
        
        // Fetch from server
        try {
            const response = await fetch('data/ticker.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.tickerData = data.messages || [];
            
            // Update cache
            this.saveToCache(cacheKey, data);
            this.lastFetchTime.ticker = Date.now();
            
            console.log('[Ads Manager] Ticker data loaded from server');
        } catch (error) {
            console.error('[Ads Manager] Error loading ticker:', error);
            throw error;
        }
    }
    
    async loadStoriesData() {
        const cacheKey = 'stories_data';
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            this.storiesData = cached.data.stories || [];
            console.log('[Ads Manager] Stories data loaded from cache');
            return;
        }
        
        // Fetch from server
        try {
            const response = await fetch('data/stories.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.storiesData = data.stories || [];
            
            // Update cache
            this.saveToCache(cacheKey, data);
            this.lastFetchTime.stories = Date.now();
            
            console.log('[Ads Manager] Stories data loaded from server');
        } catch (error) {
            console.error('[Ads Manager] Error loading stories:', error);
            throw error;
        }
    }
    
    async loadVipAdsData() {
        const cacheKey = 'vip_ads_data';
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            this.vipAdsData = cached.data.ads || [];
            console.log('[Ads Manager] VIP ads data loaded from cache');
            return;
        }
        
        // Fetch from server
        try {
            const response = await fetch('data/vip-ads.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.vipAdsData = data.ads || [];
            
            // Update cache
            this.saveToCache(cacheKey, data);
            this.lastFetchTime.vipAds = Date.now();
            
            console.log('[Ads Manager] VIP ads data loaded from server');
        } catch (error) {
            console.error('[Ads Manager] Error loading VIP ads:', error);
            throw error;
        }
    }
    
    async loadSettings() {
        try {
            const response = await fetch('data/settings.json');
            if (response.ok) {
                this.settings = await response.json();
                console.log('[Ads Manager] Settings loaded');
            }
        } catch (error) {
            console.warn('[Ads Manager] Could not load settings, using defaults');
            this.settings = {
                features: {
                    enableStories: true,
                    enableVipAds: true,
                    enableTicker: true
                }
            };
        }
    }
    
    initTicker() {
        if (!this.settings.features?.enableTicker) {
            console.log('[Ads Manager] Ticker is disabled in settings');
            return;
        }
        
        if (this.tickerData.length === 0) {
            console.warn('[Ads Manager] No ticker data available');
            return;
        }
        
        const tickerElement = document.getElementById('ticker-box');
        if (!tickerElement) {
            console.error('[Ads Manager] Ticker element not found');
            return;
        }
        
        // Initial display
        this.updateTicker();
        
        // Auto-rotate if there are multiple messages
        if (this.tickerData.length > 1) {
            setInterval(() => {
                this.currentTickerIndex = (this.currentTickerIndex + 1) % this.tickerData.length;
                this.updateTicker();
            }, 20000); // Change every 20 seconds
        }
        
        console.log('[Ads Manager] Ticker initialized');
    }
    
    updateTicker() {
        const tickerElement = document.getElementById('ticker-box');
        if (tickerElement && this.tickerData[this.currentTickerIndex]) {
            tickerElement.textContent = this.tickerData[this.currentTickerIndex];
            tickerElement.style.animation = 'none';
            setTimeout(() => {
                tickerElement.style.animation = 'marquee 25s linear infinite';
            }, 10);
        }
    }
    
    initStories() {
        if (!this.settings.features?.enableStories) {
            console.log('[Ads Manager] Stories are disabled in settings');
            return;
        }
        
        if (this.storiesData.length === 0) {
            console.warn('[Ads Manager] No stories data available');
            return;
        }
        
        const container = document.getElementById('stories-container');
        if (!container) {
            console.error('[Ads Manager] Stories container not found');
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Filter active stories and sort by order
        const activeStories = this.storiesData
            .filter(story => story.active)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .slice(0, 8); // Limit to 8 stories
        
        if (activeStories.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        // Create story elements
        activeStories.forEach(story => {
            const storyElement = this.createStoryElement(story);
            container.appendChild(storyElement);
        });
        
        console.log(`[Ads Manager] ${activeStories.length} stories loaded`);
    }
    
    createStoryElement(story) {
        const storyItem = document.createElement('div');
        storyItem.className = 'story-item';
        storyItem.setAttribute('data-story-id', story.id);
        
        storyItem.innerHTML = `
            <div class="story-ring ${story.active ? 'active' : ''}" onclick="adsManager.openStory(${story.id})">
                <img src="${story.image}" 
                     alt="${story.title || 'Story'}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/70x70/333333/FFFFFF?text=${encodeURIComponent(story.title || 'Story')}'">
            </div>
            <div class="story-title" title="${story.title}">
                ${story.title || 'استوری'}
            </div>
        `;
        
        return storyItem;
    }
    
    initVipAds() {
        if (!this.settings.features?.enableVipAds) {
            console.log('[Ads Manager] VIP ads are disabled in settings');
            return;
        }
        
        if (this.vipAdsData.length === 0) {
            console.warn('[Ads Manager] No VIP ads data available');
            return;
        }
        
        const container = document.getElementById('vip-ad-container');
        if (!container) {
            console.error('[Ads Manager] VIP ads container not found');
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Filter active ads and sort by priority
        const activeAds = this.vipAdsData
            .filter(ad => ad.active)
            .sort((a, b) => (a.priority || 0) - (b.priority || 0));
        
        if (activeAds.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        // Display first active ad
        const ad = activeAds[0];
        const adElement = this.createVipAdElement(ad);
        container.appendChild(adElement);
        
        // If there are multiple ads, rotate them
        if (activeAds.length > 1) {
            this.setupAdRotation(activeAds, container);
        }
        
        console.log(`[Ads Manager] VIP ad loaded: ${ad.title}`);
    }
    
    createVipAdElement(ad) {
        const adCard = document.createElement('div');
        adCard.className = 'vip-ad-card';
        adCard.setAttribute('data-ad-id', ad.id);
        
        // Apply custom colors if available
        if (ad.backgroundColor) {
            adCard.style.backgroundColor = ad.backgroundColor;
        }
        if (ad.textColor) {
            adCard.querySelectorAll('.vip-title, .vip-desc').forEach(el => {
                el.style.color = ad.textColor;
            });
        }
        
        adCard.innerHTML = `
            <img src="${ad.image}" 
                 class="vip-img" 
                 alt="${ad.title}"
                 loading="lazy"
                 onerror="this.src='https://via.placeholder.com/80x80/333333/e2b04a?text=${encodeURIComponent(ad.title || 'VIP')}'">
            <div class="vip-info">
                <div class="vip-title">${ad.title || 'تبلیغ ویژه'}</div>
                <div class="vip-desc">${ad.description || ''}</div>
                <div class="vip-buttons">
                    ${ad.phone ? `<a href="tel:${ad.phone}" class="btn-call-vip">📞 تماس VIP</a>` : ''}
                    ${ad.whatsapp ? `<a href="https://wa.me/${ad.whatsapp}" class="btn-call-vip" style="background: #25D366; margin-right: 10px;">💬 واتساپ</a>` : ''}
                </div>
            </div>
        `;
        
        return adCard;
    }
    
    setupAdRotation(ads, container) {
        let currentIndex = 0;
        
        setInterval(() => {
            currentIndex = (currentIndex + 1) % ads.length;
            const nextAd = ads[currentIndex];
            
            // Fade out current ad
            container.style.opacity = '0';
            container.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                // Replace with new ad
                container.innerHTML = '';
                const newAdElement = this.createVipAdElement(nextAd);
                container.appendChild(newAdElement);
                
                // Fade in new ad
                container.style.opacity = '1';
                
                console.log(`[Ads Manager] Rotated to ad: ${nextAd.title}`);
            }, 500);
        }, 30000); // Rotate every 30 seconds
    }
    
    openStory(storyId) {
        const story = this.storiesData.find(s => s.id === storyId);
        if (!story) {
            console.error(`[Ads Manager] Story ${storyId} not found`);
            return;
        }
        
        // Create story modal content
        const modal = document.getElementById('story-modal');
        const content = document.getElementById('story-content');
        const buttons = document.getElementById('story-buttons');
        
        if (!modal || !content || !buttons) {
            console.error('[Ads Manager] Story modal elements not found');
            return;
        }
        
        // Set content
        content.innerHTML = `
            <img src="${story.image}" 
                 class="story-img" 
                 alt="${story.title}"
                 onerror="this.src='https://via.placeholder.com/400x600/333333/FFFFFF?text=${encodeURIComponent(story.title || 'Story')}'">
        `;
        
        // Set buttons
        buttons.innerHTML = '';
        
        if (story.phone) {
            const callBtn = document.createElement('a');
            callBtn.href = `tel:${story.phone}`;
            callBtn.className = 'story-btn story-call-btn';
            callBtn.innerHTML = '📞 تماس';
            buttons.appendChild(callBtn);
        }
        
        if (story.whatsapp) {
            const whatsappBtn = document.createElement('a');
            whatsappBtn.href = `https://wa.me/${story.whatsapp}`;
            whatsappBtn.className = 'story-btn story-link-btn';
            whatsappBtn.innerHTML = '💬 واتساپ';
            buttons.appendChild(whatsappBtn);
        }
        
        // Show modal
        modal.style.display = 'flex';
        
        console.log(`[Ads Manager] Opened story: ${story.title}`);
    }
    
    closeStory() {
        const modal = document.getElementById('story-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    setupAutoRefresh() {
        // Refresh data every 5 minutes
        setInterval(async () => {
            console.log('[Ads Manager] Auto-refreshing data...');
            await this.loadAllData();
            this.initStories();
            this.initVipAds();
        }, 5 * 60 * 1000);
    }
    
    setupErrorHandling() {
        window.addEventListener('online', () => {
            console.log('[Ads Manager] Device is online, refreshing data...');
            this.loadAllData().then(() => {
                this.initStories();
                this.initVipAds();
                this.updateTicker();
            });
        });
        
        window.addEventListener('offline', () => {
            console.warn('[Ads Manager] Device is offline, using cached data');
        });
    }
    
    // Cache management
    saveToCache(key, data) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(`ads_cache_${key}`, JSON.stringify(cacheItem));
        } catch (error) {
            console.warn('[Ads Manager] Could not save to cache:', error);
        }
    }
    
    getFromCache(key) {
        try {
            const cached = localStorage.getItem(`ads_cache_${key}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.warn('[Ads Manager] Could not read from cache:', error);
            return null;
        }
    }
    
    clearCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('ads_cache_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('[Ads Manager] Cache cleared');
    }
    
    // Fallback data if server fails
    loadFallbackData() {
        console.log('[Ads Manager] Loading fallback data...');
        
        this.tickerData = [
            "🔥 الو ذغال | سفارش آنلاین ذغال مرغوب | تحویل سریع در ایذه 🔥",
            "✨ ذغال درجه یک با کیفیت عالی | قیمت مناسب ✨"
        ];
        
        this.storiesData = [
            {
                id: 1,
                title: "ذغال مرغوب",
                image: "https://raw.githubusercontent.com/aloozoghal-hash/alozoghal/main/8f6dcedf3dc3dbaa82c0df548bd962c9.jpg",
                phone: "09220730628",
                whatsapp: "989220730628",
                active: true,
                order: 1
            }
        ];
        
        this.vipAdsData = [
            {
                id: 1,
                title: "ذغال VIP",
                description: "ذغال مرغوب با کیفیت عالی",
                image: "https://raw.githubusercontent.com/aloozoghal-hash/alozoghal/main/8f6dcedf3dc3dbaa82c0df548bd962c9.jpg",
                phone: "09220730628",
                whatsapp: "989220730628",
                active: true,
                priority: 1
            }
        ];
        
        this.settings = {
            features: {
                enableStories: true,
                enableVipAds: true,
                enableTicker: true
            }
        };
    }
    
    // Public methods
    refreshAll() {
        console.log('[Ads Manager] Manual refresh requested');
        this.clearCache();
        this.loadAllData().then(() => {
            this.initTicker();
            this.initStories();
            this.initVipAds();
            alert('✅ تبلیغات با موفقیت بروزرسانی شدند');
        }).catch(error => {
            console.error('[Ads Manager] Refresh failed:', error);
            alert('❌ خطا در بروزرسانی تبلیغات');
        });
    }
    
    getStats() {
        return {
            ticker: {
                count: this.tickerData.length,
                lastUpdated: this.lastFetchTime.ticker || 'Never'
            },
            stories: {
                count: this.storiesData.length,
                active: this.storiesData.filter(s => s.active).length,
                lastUpdated: this.lastFetchTime.stories || 'Never'
            },
            vipAds: {
                count: this.vipAdsData.length,
                active: this.vipAdsData.filter(a => a.active).length,
                lastUpdated: this.lastFetchTime.vipAds || 'Never'
            }
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adsManager = new AdsManager();
    
    // Make closeStory available globally
    window.closeStory = function() {
        if (window.adsManager) {
            window.adsManager.closeStory();
        }
    };
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdsManager;
}
