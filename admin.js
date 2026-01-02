/**
 * 📋 اسکریپت پنل مدیریت الو ذغال
 * مدیریت کامل داده‌های JSON و تنظیمات سایت
 */

class AdminPanel {
    constructor() {
        this.data = {
            ticker: null,
            stories: null,
            vipAds: null,
            settings: null
        };
        
        this.isDirty = {
            ticker: false,
            stories: false,
            vipAds: false,
            settings: false
        };
        
        this.backups = [];
        this.lastBackupTime = null;
        
        this.init();
    }
    
    async init() {
        console.log('[Admin Panel] Initializing...');
        
        // Check if we're in admin panel
        if (!window.location.pathname.includes('admin-panel')) {
            console.log('[Admin Panel] Not in admin panel, skipping initialization');
            return;
        }
        
        // Load all data
        await this.loadAllData();
        
        // Initialize UI
        this.initUI();
        
        // Set up auto-save
        this.setupAutoSave();
        
        // Set up beforeunload warning
        this.setupBeforeUnload();
        
        // Load backups
        this.loadBackups();
        
        console.log('[Admin Panel] Initialized successfully');
    }
    
    async loadAllData() {
        try {
            // Load ticker data
            this.data.ticker = await this.fetchData('data/ticker.json');
            
            // Load stories data
            this.data.stories = await this.fetchData('data/stories.json');
            
            // Load VIP ads data
            this.data.vipAds = await this.fetchData('data/vip-ads.json');
            
            // Load settings
            this.data.settings = await this.fetchData('data/settings.json');
            
            console.log('[Admin Panel] All data loaded successfully');
            this.updateStats();
            
        } catch (error) {
            console.error('[Admin Panel] Error loading data:', error);
            this.showAlert('خطا در بارگیری داده‌ها', 'error');
            
            // Load fallback data
            this.loadFallbackData();
        }
    }
    
    async fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`[Admin Panel] Error fetching ${url}:`, error);
            throw error;
        }
    }
    
    initUI() {
        // Initialize dashboard
        this.initDashboard();
        
        // Initialize ticker editor
        this.initTickerEditor();
        
        // Initialize stories editor
        this.initStoriesEditor();
        
        // Initialize VIP ads editor
        this.initVipAdsEditor();
        
        // Initialize settings editor
        this.initSettingsEditor();
        
        // Update UI
        this.updateAllEditors();
    }
    
    initDashboard() {
        // Update stats
        this.updateStats();
        
        // Set up refresh button
        document.getElementById('refresh-all')?.addEventListener('click', () => {
            this.refreshAllData();
        });
        
        // Set up live preview update
        setInterval(() => {
            this.updateLivePreview();
        }, 5000);
        
        this.updateLivePreview();
    }
    
    initTickerEditor() {
        const container = document.getElementById('ticker-messages-container');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add existing messages
        if (this.data.ticker?.messages) {
            this.data.ticker.messages.forEach((message, index) => {
                this.addTickerMessageToUI(message, index);
            });
        }
        
        // Set up speed control
        const speedInput = document.getElementById('ticker-speed');
        if (speedInput && this.data.ticker?.speed) {
            speedInput.value = this.data.ticker.speed;
            speedInput.addEventListener('change', () => {
                this.isDirty.ticker = true;
            });
        }
        
        // Set up direction control
        const directionSelect = document.getElementById('ticker-direction');
        if (directionSelect && this.data.ticker?.direction) {
            directionSelect.value = this.data.ticker.direction || 'rtl';
            directionSelect.addEventListener('change', () => {
                this.isDirty.ticker = true;
            });
        }
        
        // Set up auto-change checkbox
        const autoChangeCheckbox = document.getElementById('ticker-auto-change');
        if (autoChangeCheckbox && this.data.ticker?.autoChange !== undefined) {
            autoChangeCheckbox.checked = this.data.ticker.autoChange;
            autoChangeCheckbox.addEventListener('change', () => {
                this.isDirty.ticker = true;
            });
        }
    }
    
    addTickerMessageToUI(message, index) {
        const container = document.getElementById('ticker-messages-container');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'form-group';
        messageDiv.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" 
                       class="form-control" 
                       value="${this.escapeHtml(message)}" 
                       data-index="${index}"
                       style="flex: 1;"
                       oninput="adminPanel.onTickerMessageChange(${index})"
                       placeholder="متن تیکر...">
                <button class="btn btn-sm btn-danger" onclick="adminPanel.removeTickerMessage(${index})">
                    ❌ حذف
                </button>
                <button class="btn btn-sm btn-info" onclick="adminPanel.moveTickerMessage(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
                    ⬆️ بالا
                </button>
                <button class="btn btn-sm btn-info" onclick="adminPanel.moveTickerMessage(${index}, 1)" ${index === this.data.ticker.messages.length - 1 ? 'disabled' : ''}>
                    ⬇️ پایین
                </button>
            </div>
        `;
        
        container.appendChild(messageDiv);
    }
    
    initStoriesEditor() {
        const container = document.getElementById('stories-container');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add existing stories
        if (this.data.stories?.stories) {
            this.data.stories.stories.forEach((story, index) => {
                this.addStoryToUI(story, index);
            });
        }
        
        // Set up max stories control
        const maxStoriesInput = document.getElementById('max-stories');
        if (maxStoriesInput && this.data.stories?.settings?.maxStories) {
            maxStoriesInput.value = this.data.stories.settings.maxStories;
            maxStoriesInput.addEventListener('change', () => {
                this.isDirty.stories = true;
            });
        }
        
        // Set up enabled checkbox
        const enabledCheckbox = document.getElementById('stories-enabled');
        if (enabledCheckbox) {
            enabledCheckbox.checked = this.data.settings?.features?.enableStories !== false;
            enabledCheckbox.addEventListener('change', () => {
                this.isDirty.settings = true;
            });
        }
    }
    
    addStoryToUI(story, index) {
        const container = document.getElementById('stories-container');
        if (!container) return;
        
        const storyDiv = document.createElement('div');
        storyDiv.className = 'admin-card';
        storyDiv.style.marginBottom = '15px';
        storyDiv.innerHTML = `
            <div class="card-title">
                استوری #${story.id || index + 1}
                <div>
                    <label class="switch">
                        <input type="checkbox" 
                               ${story.active ? 'checked' : ''}
                               onchange="adminPanel.onStoryActiveChange(${index}, this.checked)">
                        <span class="slider round"></span>
                    </label>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.removeStory(${index})">
                        ❌ حذف
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">عنوان</label>
                <input type="text" 
                       class="form-control" 
                       value="${this.escapeHtml(story.title || '')}"
                       oninput="adminPanel.onStoryFieldChange(${index}, 'title', this.value)"
                       placeholder="عنوان استوری...">
            </div>
            
            <div class="form-group">
                <label class="form-label">آدرس تصویر</label>
                <input type="text" 
                       class="form-control" 
                       value="${this.escapeHtml(story.image || '')}"
                       oninput="adminPanel.onStoryFieldChange(${index}, 'image', this.value)"
                       placeholder="https://example.com/image.jpg">
                <span class="help-text">سایز پیشنهادی: 400x600 پیکسل</span>
            </div>
            
            <div class="form-group">
                <label class="form-label">شماره تماس</label>
                <input type="tel" 
                       class="form-control" 
                       value="${this.escapeHtml(story.phone || '')}"
                       oninput="adminPanel.onStoryFieldChange(${index}, 'phone', this.value)"
                       placeholder="09123456789">
            </div>
            
            <div class="form-group">
                <label class="form-label">شماره واتساپ (بدون +)</label>
                <input type="tel" 
                       class="form-control" 
                       value="${this.escapeHtml(story.whatsapp || '')}"
                       oninput="adminPanel.onStoryFieldChange(${index}, 'whatsapp', this.value)"
                       placeholder="989123456789">
            </div>
            
            <div class="form-group">
                <label class="form-label">ترتیب نمایش</label>
                <input type="number" 
                       class="form-control" 
                       value="${story.order || index + 1}"
                       oninput="adminPanel.onStoryFieldChange(${index}, 'order', parseInt(this.value) || 1)"
                       min="1" max="20">
            </div>
            
            <div class="form-group">
                <label class="form-label">پیش‌نمایش تصویر</label>
                <div style="text-align: center; margin-top: 10px;">
                    <img src="${story.image || 'https://via.placeholder.com/100x100/333333/FFFFFF?text=تصویر'}" 
                         alt="پیش‌نمایش"
                         style="width: 100px; height: 100px; object-fit: cover; border-radius: 10px; border: 1px solid #333;"
                         onerror="this.src='https://via.placeholder.com/100x100/333333/FFFFFF?text=خطا'">
                </div>
            </div>
        `;
        
        container.appendChild(storyDiv);
    }
    
    initVipAdsEditor() {
        const container = document.getElementById('vip-ads-container');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add existing VIP ads
        if (this.data.vipAds?.ads) {
            this.data.vipAds.ads.forEach((ad, index) => {
                this.addVipAdToUI(ad, index);
            });
        }
        
        // Set up max ads control
        const maxAdsInput = document.getElementById('max-vip-ads');
        if (maxAdsInput && this.data.vipAds?.settings?.maxActiveAds) {
            maxAdsInput.value = this.data.vipAds.settings.maxActiveAds;
            maxAdsInput.addEventListener('change', () => {
                this.isDirty.vipAds = true;
            });
        }
        
        // Set up enabled checkbox
        const enabledCheckbox = document.getElementById('vip-ads-enabled');
        if (enabledCheckbox) {
            enabledCheckbox.checked = this.data.settings?.features?.enableVipAds !== false;
            enabledCheckbox.addEventListener('change', () => {
                this.isDirty.settings = true;
            });
        }
    }
    
    addVipAdToUI(ad, index) {
        const container = document.getElementById('vip-ads-container');
        if (!container) return;
        
        const adDiv = document.createElement('div');
        adDiv.className = 'admin-card';
        adDiv.style.marginBottom = '15px';
        adDiv.innerHTML = `
            <div class="card-title">
                تبلیغ VIP #${ad.id || index + 1}
                <div>
                    <label class="switch">
                        <input type="checkbox" 
                               ${ad.active ? 'checked' : ''}
                               onchange="adminPanel.onVipAdActiveChange(${index}, this.checked)">
                        <span class="slider round"></span>
                    </label>
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.removeVipAd(${index})">
                        ❌ حذف
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">عنوان تبلیغ</label>
                <input type="text" 
                       class="form-control" 
                       value="${this.escapeHtml(ad.title || '')}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'title', this.value)"
                       placeholder="عنوان تبلیغ...">
            </div>
            
            <div class="form-group">
                <label class="form-label">توضیحات</label>
                <textarea class="form-control" 
                          rows="2"
                          oninput="adminPanel.onVipAdFieldChange(${index}, 'description', this.value)"
                          placeholder="توضیحات تبلیغ...">${this.escapeHtml(ad.description || '')}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">آدرس تصویر</label>
                <input type="text" 
                       class="form-control" 
                       value="${this.escapeHtml(ad.image || '')}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'image', this.value)"
                       placeholder="https://example.com/image.jpg">
                <span class="help-text">سایز پیشنهادی: 400x300 پیکسل</span>
            </div>
            
            <div class="form-group">
                <label class="form-label">شماره تماس</label>
                <input type="tel" 
                       class="form-control" 
                       value="${this.escapeHtml(ad.phone || '')}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'phone', this.value)"
                       placeholder="09123456789">
            </div>
            
            <div class="form-group">
                <label class="form-label">شماره واتساپ (بدون +)</label>
                <input type="tel" 
                       class="form-control" 
                       value="${this.escapeHtml(ad.whatsapp || '')}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'whatsapp', this.value)"
                       placeholder="989123456789">
            </div>
            
            <div class="form-group">
                <label class="form-label">اولویت نمایش (۱ = بالاترین)</label>
                <input type="number" 
                       class="form-control" 
                       value="${ad.priority || 1}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'priority', parseInt(this.value) || 1)"
                       min="1" max="10">
            </div>
            
            <div class="form-group">
                <label class="form-label">رنگ پس‌زمینه (اختیاری)</label>
                <input type="color" 
                       class="form-control" 
                       value="${ad.backgroundColor || '#1a1a1a'}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'backgroundColor', this.value)"
                       style="height: 40px; padding: 5px;">
            </div>
            
            <div class="form-group">
                <label class="form-label">رنگ متن (اختیاری)</label>
                <input type="color" 
                       class="form-control" 
                       value="${ad.textColor || '#e2b04a'}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'textColor', this.value)"
                       style="height: 40px; padding: 5px;">
            </div>
            
            <div class="form-group">
                <label class="form-label">تاریخ انقضا</label>
                <input type="date" 
                       class="form-control" 
                       value="${ad.expiresAt ? ad.expiresAt.split('T')[0] : ''}"
                       oninput="adminPanel.onVipAdFieldChange(${index}, 'expiresAt', this.value + 'T00:00:00Z')">
            </div>
            
            <div class="form-group">
                <label class="form-label">پیش‌نمایش</label>
                <div style="text-align: center; margin-top: 10px;">
                    <img src="${ad.image || 'https://via.placeholder.com/150x100/333333/e2b04a?text=VIP'}" 
                         alt="پیش‌نمایش"
                         style="width: 150px; height: 100px; object-fit: cover; border-radius: 10px; border: 1px solid #333;"
                         onerror="this.src='https://via.placeholder.com/150x100/333333/e2b04a?text=خطا'">
                </div>
            </div>
        `;
        
        container.appendChild(adDiv);
    }
    
    initSettingsEditor() {
        // Set up basic settings
        if (this.data.settings?.app) {
            const app = this.data.settings.app;
            
            document.getElementById('site-name').value = app.name || 'الو ذغال';
            document.getElementById('site-phone').value = app.phone || '09220730628';
            document.getElementById('site-whatsapp').value = app.whatsapp || '989220730628';
            document.getElementById('site-address').value = app.location || 'ایذه، پارک لاله';
            document.getElementById('working-hours').value = app.workingHours || '۷ صبح تا ۹ شب';
        }
        
        if (this.data.settings?.prices) {
            document.getElementById('coal-price').value = this.data.settings.prices.coalPrice || 65000;
        }
        
        // Set up feature toggles
        const features = this.data.settings?.features || {};
        document.getElementById('feature-ticker').checked = features.enableTicker !== false;
        document.getElementById('feature-stories').checked = features.enableStories !== false;
        document.getElementById('feature-vip-ads').checked = features.enableVipAds !== false;
        document.getElementById('feature-gps').checked = features.enableGPS !== false;
        document.getElementById('feature-whatsapp').checked = features.enableWhatsApp !== false;
        
        // Set up backup settings
        if (this.data.settings?.admin) {
            document.getElementById('auto-backup').checked = this.data.settings.admin.autoBackup !== false;
            document.getElementById('max-backups').value = this.data.settings.admin.maxBackups || 10;
        }
        
        // Add change listeners
        const inputs = document.querySelectorAll('#settings-tab input, #settings-tab select, #settings-tab textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.isDirty.settings = true;
            });
        });
    }
    
    updateAllEditors() {
        this.initTickerEditor();
        this.initStoriesEditor();
        this.initVipAdsEditor();
        this.initSettingsEditor();
    }
    
    // Event Handlers for Ticker
    onTickerMessageChange(index) {
        const input = document.querySelector(`input[data-index="${index}"]`);
        if (input && this.data.ticker?.messages) {
            this.data.ticker.messages[index] = input.value;
            this.isDirty.ticker = true;
        }
    }
    
    removeTickerMessage(index) {
        if (this.data.ticker?.messages && confirm('آیا از حذف این پیام اطمینان دارید؟')) {
            this.data.ticker.messages.splice(index, 1);
            this.isDirty.ticker = true;
            this.initTickerEditor();
            this.showAlert('پیام با موفقیت حذف شد', 'success');
        }
    }
    
    moveTickerMessage(index, direction) {
        if (!this.data.ticker?.messages) return;
        
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < this.data.ticker.messages.length) {
            const temp = this.data.ticker.messages[index];
            this.data.ticker.messages[index] = this.data.ticker.messages[newIndex];
            this.data.ticker.messages[newIndex] = temp;
            this.isDirty.ticker = true;
            this.initTickerEditor();
        }
    }
    
    // Event Handlers for Stories
    onStoryFieldChange(index, field, value) {
        if (!this.data.stories?.stories) return;
        
        if (field === 'order') {
            this.data.stories.stories[index][field] = parseInt(value) || 1;
        } else {
            this.data.stories.stories[index][field] = value;
        }
        
        this.isDirty.stories = true;
    }
    
    onStoryActiveChange(index, active) {
        if (this.data.stories?.stories) {
            this.data.stories.stories[index].active = active;
            this.isDirty.stories = true;
        }
    }
    
    removeStory(index) {
        if (this.data.stories?.stories && confirm('آیا از حذف این استوری اطمینان دارید؟')) {
            this.data.stories.stories.splice(index, 1);
            this.isDirty.stories = true;
            this.initStoriesEditor();
            this.showAlert('استوری با موفقیت حذف شد', 'success');
        }
    }
    
    // Event Handlers for VIP Ads
    onVipAdFieldChange(index, field, value) {
        if (!this.data.vipAds?.ads) return;
        
        if (field === 'priority') {
            this.data.vipAds.ads[index][field] = parseInt(value) || 1;
        } else {
            this.data.vipAds.ads[index][field] = value;
        }
        
        this.isDirty.vipAds = true;
    }
    
    onVipAdActiveChange(index, active) {
        if (this.data.vipAds?.ads) {
            this.data.vipAds.ads[index].active = active;
            this.isDirty.vipAds = true;
        }
    }
    
    removeVipAd(index) {
        if (this.data.vipAds?.ads && confirm('آیا از حذف این تبلیغ اطمینان دارید؟')) {
            this.data.vipAds.ads.splice(index, 1);
            this.isDirty.vipAds = true;
            this.initVipAdsEditor();
            this.showAlert('تبلیغ با موفقیت حذف شد', 'success');
        }
    }
    
    // UI Actions
    addTickerMessage() {
        if (!this.data.ticker) {
            this.data.ticker = { messages: [] };
        }
        if (!this.data.ticker.messages) {
            this.data.ticker.messages = [];
        }
        
        const newMessage = "پیام جدید تیکر...";
        this.data.ticker.messages.push(newMessage);
        this.isDirty.ticker = true;
        this.initTickerEditor();
        this.showAlert('پیام جدید اضافه شد', 'success');
    }
    
    addStory() {
        if (!this.data.stories) {
            this.data.stories = { stories: [] };
        }
        if (!this.data.stories.stories) {
            this.data.stories.stories = [];
        }
        
        const newStory = {
            id: Date.now(),
            title: "استوری جدید",
            image: "https://via.placeholder.com/400x600/333333/FFFFFF?text=استوری+جدید",
            phone: "09220730628",
            whatsapp: "989220730628",
            active: true,
            order: this.data.stories.stories.length + 1,
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        this.data.stories.stories.push(newStory);
        this.isDirty.stories = true;
        this.initStoriesEditor();
        this.showAlert('استوری جدید اضافه شد', 'success');
    }
    
    addVipAd() {
        if (!this.data.vipAds) {
            this.data.vipAds = { ads: [] };
        }
        if (!this.data.vipAds.ads) {
            this.data.vipAds.ads = [];
        }
        
        const newAd = {
            id: Date.now(),
            title: "تبلیغ VIP جدید",
            description: "توضیحات تبلیغ جدید",
            image: "https://via.placeholder.com/400x300/333333/e2b04a?text=VIP+جدید",
            phone: "09220730628",
            whatsapp: "989220730628",
            active: true,
            priority: this.data.vipAds.ads.length + 1,
            backgroundColor: "#1a1a1a",
            textColor: "#e2b04a",
            createdAt: new Date().toISOString().split('T')[0],
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00Z'
        };
        
        this.data.vipAds.ads.push(newAd);
        this.isDirty.vipAds = true;
        this.initVipAdsEditor();
        this.showAlert('تبلیغ VIP جدید اضافه شد', 'success');
    }
    
    // Save Functions
    async saveTickerData() {
        if (!this.data.ticker) return;
        
        // Update timestamp
        this.data.ticker.lastUpdated = new Date().toISOString();
        
        try {
            // In a real application, you would send this to a server
            // For now, we'll simulate saving
            localStorage.setItem('aloozoghal_ticker_backup', JSON.stringify(this.data.ticker));
            
            this.isDirty.ticker = false;
            this.showAlert('تغییرات تیکر با موفقیت ذخیره شد', 'success');
            this.updateStats();
            
            // Create backup
            this.createBackup('ticker');
            
        } catch (error) {
            console.error('[Admin Panel] Error saving ticker:', error);
            this.showAlert('خطا در ذخیره‌سازی تیکر', 'error');
        }
    }
    
    async saveStoriesData() {
        if (!this.data.stories) return;
        
        try {
            localStorage.setItem('aloozoghal_stories_backup', JSON.stringify(this.data.stories));
            
            this.isDirty.stories = false;
            this.showAlert('تغییرات استوری‌ها با موفقیت ذخیره شد', 'success');
            this.updateStats();
            
            // Create backup
            this.createBackup('stories');
            
        } catch (error) {
            console.error('[Admin Panel] Error saving stories:', error);
            this.showAlert('خطا در ذخیره‌سازی استوری‌ها', 'error');
        }
    }
    
    async saveVipAdsData() {
        if (!this.data.vipAds) return;
        
        try {
            localStorage.setItem('aloozoghal_vip_ads_backup', JSON.stringify(this.data.vipAds));
            
            this.isDirty.vipAds = false;
            this.showAlert('تغییرات تبلیغات VIP با موفقیت ذخیره شد', 'success');
            this.updateStats();
            
            // Create backup
            this.createBackup('vip-ads');
            
        } catch (error) {
            console.error('[Admin Panel] Error saving VIP ads:', error);
            this.showAlert('خطا در ذخیره‌سازی تبلیغات VIP', 'error');
        }
    }
    
    async saveSettings() {
        if (!this.data.settings) return;
        
        // Update app settings
        this.data.settings.app = {
            name: document.getElementById('site-name').value,
            phone: document.getElementById('site-phone').value,
            whatsapp: document.getElementById('site-whatsapp').value,
            location: document.getElementById('site-address').value,
            workingHours: document.getElementById('working-hours').value
        };
        
        // Update prices
        this.data.settings.prices = {
            coalPrice: parseInt(document.getElementById('coal-price').value) || 65000,
            freeDeliveryMin: 2,
            deliveryFee: 0,
            currency: "تومان"
        };
        
        // Update features
        this.data.settings.features = {
            enableTicker: document.getElementById('feature-ticker').checked,
            enableStories: document.getElementById('feature-stories').checked,
            enableVipAds: document.getElementById('feature-vip-ads').checked,
            enableGPS: document.getElementById('feature-gps').checked,
            enableWhatsApp: document.getElementById('feature-whatsapp').checked,
            enableSMS: true,
            enableTelegram: false
        };
        
        // Update admin settings
        this.data.settings.admin = {
            secretCode: "علی نادریان 1362541",
            autoBackup: document.getElementById('auto-backup').checked,
            backupInterval: 3600000,
            maxBackups: parseInt(document.getElementById('max-backups').value) || 10
        };
        
        try {
            localStorage.setItem('aloozoghal_settings_backup', JSON.stringify(this.data.settings));
            
            this.isDirty.settings = false;
            this.showAlert('تنظیمات با موفقیت ذخیره شد', 'success');
            this.updateStats();
            
            // Create backup
            this.createBackup('settings');
            
        } catch (error) {
            console.error('[Admin Panel] Error saving settings:', error);
            this.showAlert('خطا در ذخیره‌سازی تنظیمات', 'error');
        }
    }
    
    // Backup Functions
    async createBackup(type = 'all') {
        const timestamp = new Date().toISOString();
        const backupId = `backup_${Date.now()}`;
        
        let backupData = {};
        
        if (type === 'all' || type === 'ticker') {
            backupData.ticker = this.data.ticker;
        }
        if (type === 'all' || type === 'stories') {
            backupData.stories = this.data.stories;
        }
        if (type === 'all' || type === 'vip-ads') {
            backupData.vipAds = this.data.vipAds;
        }
        if (type === 'all' || type === 'settings') {
            backupData.settings = this.data.settings;
        }
        
        const backup = {
            id: backupId,
            timestamp: timestamp,
            type: type,
            data: backupData
        };
        
        // Save to localStorage
        try {
            const backups = JSON.parse(localStorage.getItem('aloozoghal_backups') || '[]');
            backups.unshift(backup); // Add to beginning
            
            // Limit number of backups
            const maxBackups = this.data.settings?.admin?.maxBackups || 10;
            if (backups.length > maxBackups) {
                backups.splice(maxBackups);
            }
            
            localStorage.setItem('aloozoghal_backups', JSON.stringify(backups));
            this.backups = backups;
            
            this.lastBackupTime = timestamp;
            this.showAlert('پشتیبان با موفقیت ایجاد شد', 'success');
            this.loadBackups();
            
        } catch (error) {
            console.error('[Admin Panel] Error creating backup:', error);
            this.showAlert('خطا در ایجاد پشتیبان', 'error');
        }
    }
    
    loadBackups() {
        try {
            const backups = JSON.parse(localStorage.getItem('aloozoghal_backups') || '[]');
            this.backups = backups;
            
            const backupList = document.getElementById('backup-list');
            if (!backupList) return;
            
            backupList.innerHTML = '';
            
            if (backups.length === 0) {
                backupList.innerHTML = '<p style="color: #888; text-align: center;">هیچ پشتیبانی موجود نیست</p>';
                return;
            }
            
            backups.forEach((backup, index) => {
                const backupDate = new Date(backup.timestamp).toLocaleString('fa-IR');
                const backupItem = document.createElement('div');
                backupItem.className = 'backup-item';
                backupItem.innerHTML = `
                    <div>
                        <strong>${backup.type === 'all' ? '📦 همه داده‌ها' : 
                                   backup.type === 'ticker' ? '📢 تیکر' :
                                   backup.type === 'stories' ? '🖼️ استوری‌ها' :
                                   backup.type === 'vip-ads' ? '⭐ تبلیغات VIP' : '⚙️ تنظیمات'}</strong>
                        <div style="font-size: 12px; color: #aaa;">${backupDate}</div>
                    </div>
                    <div class="backup-actions">
                        <button class="btn btn-sm btn-info" onclick="adminPanel.restoreBackup(${index})">
                            🔄 بازیابی
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteBackup(${index})">
                            ❌ حذف
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="adminPanel.downloadBackup(${index})">
                            ⬇️ دانلود
                        </button>
                    </div>
                `;
                backupList.appendChild(backupItem);
            });
            
        } catch (error) {
            console.error('[Admin Panel] Error loading backups:', error);
        }
    }
    
    restoreBackup(index) {
        if (!confirm('آیا از بازیابی این پشتیبان اطمینان دارید؟ داده‌های فعلی از بین خواهند رفت.')) {
            return;
        }
        
        const backup = this.backups[index];
        if (!backup) {
            this.showAlert('پشتیبان یافت نشد', 'error');
            return;
        }
        
        try {
            if (backup.type === 'all' || backup.type === 'ticker') {
                this.data.ticker = backup.data.ticker;
                this.isDirty.ticker = true;
            }
            if (backup.type === 'all' || backup.type === 'stories') {
                this.data.stories = backup.data.stories;
                this.isDirty.stories = true;
            }
            if (backup.type === 'all' || backup.type === 'vip-ads') {
                this.data.vipAds = backup.data.vipAds;
                this.isDirty.vipAds = true;
            }
            if (backup.type === 'all' || backup.type === 'settings') {
                this.data.settings = backup.data.settings;
                this.isDirty.settings = true;
            }
            
            this.updateAllEditors();
            this.showAlert('پشتیبان با موفقیت بازیابی شد', 'success');
            this.updateStats();
            
        } catch (error) {
            console.error('[Admin Panel] Error restoring backup:', error);
            this.showAlert('خطا در بازیابی پشتیبان', 'error');
        }
    }
    
    deleteBackup(index) {
        if (!confirm('آیا از حذف این پشتیبان اطمینان دارید؟')) {
            return;
        }
        
        try {
            this.backups.splice(index, 1);
            localStorage.setItem('aloozoghal_backups', JSON.stringify(this.backups));
            this.loadBackups();
            this.showAlert('پشتیبان با موفقیت حذف شد', 'success');
            
        } catch (error) {
            console.error('[Admin Panel] Error deleting backup:', error);
            this.showAlert('خطا در حذف پشتیبان', 'error');
        }
    }
    
    downloadBackup(index) {
        const backup = this.backups[index];
        if (!backup) return;
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadUrl = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `aloozoghal_backup_${backup.timestamp.split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        this.showAlert('فایل پشتیبان دانلود شد', 'success');
    }
    
    exportAllData() {
        const exportData = {
            ticker: this.data.ticker,
            stories: this.data.stories,
            vipAds: this.data.vipAds,
            settings: this.data.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadUrl = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `aloozoghal_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        this.showAlert('همه داده‌ها با موفقیت export شدند', 'success');
    }
    
    importData() {
        // This would typically involve file upload
        // For simplicity, we'll use a textarea
        this.showAlert('لطفاً داده‌های JSON را در کادر زیر وارد کنید', 'info');
    }
    
    processImport() {
        const jsonInput = document.getElementById('import-json');
        if (!jsonInput || !jsonInput.value.trim()) {
            this.showAlert('لطفاً داده‌های JSON را وارد کنید', 'error');
            return;
        }
        
        try {
            const importData = JSON.parse(jsonInput.value);
            
            if (importData.type === 'ticker' && importData.data) {
                this.data.ticker = importData.data;
                this.isDirty.ticker = true;
                this.initTickerEditor();
                this.showAlert('داده‌های تیکر با موفقیت وارد شدند', 'success');
            }
            else if (importData.type === 'stories' && importData.data) {
                this.data.stories = importData.data;
                this.isDirty.stories = true;
                this.initStoriesEditor();
                this.showAlert('داده‌های استوری‌ها با موفقیت وارد شدند', 'success');
            }
            else if (importData.type === 'vip-ads' && importData.data) {
                this.data.vipAds = importData.data;
                this.isDirty.vipAds = true;
                this.initVipAdsEditor();
                this.showAlert('داده‌های تبلیغات VIP با موفقیت وارد شدند', 'success');
            }
            else if (importData.type === 'settings' && importData.data) {
                this.data.settings = importData.data;
                this.isDirty.settings = true;
                this.initSettingsEditor();
                this.showAlert('تنظیمات با موفقیت وارد شدند', 'success');
            }
            else if (importData.ticker && importData.stories && importData.vipAds && importData.settings) {
                // Full import
                this.data.ticker = importData.ticker;
                this.data.stories = importData.stories;
                this.data.vipAds = importData.vipAds;
                this.data.settings = importData.settings;
                
                this.isDirty.ticker = true;
                this.isDirty.stories = true;
                this.isDirty.vipAds = true;
                this.isDirty.settings = true;
                
                this.updateAllEditors();
                this.showAlert('همه داده‌ها با موفقیت وارد شدند', 'success');
            }
            else {
                this.showAlert('فرمت داده‌های وارد شده معتبر نیست', 'error');
            }
            
            jsonInput.value = '';
            this.updateStats();
            
        } catch (error) {
            console.error('[Admin Panel] Error processing import:', error);
            this.showAlert('خطا در پردازش داده‌های JSON', 'error');
        }
    }
    
    // Utility Functions
    updateStats() {
        // Update ticker stats
        const tickerCount = this.data.ticker?.messages?.length || 0;
        document.getElementById('stat-ticker').textContent = tickerCount;
        
        // Update stories stats
        const activeStories = this.data.stories?.stories?.filter(s => s.active).length || 0;
        document.getElementById('stat-stories').textContent = activeStories;
        
        // Update VIP ads stats
        const activeVipAds = this.data.vipAds?.ads?.filter(a => a.active).length || 0;
        document.getElementById('stat-vip-ads').textContent = activeVipAds;
        
        // Update last update time
        const lastUpdate = this.data.ticker?.lastUpdated || 
                          this.data.stories?.stories?.[0]?.createdAt || 
                          this.data.vipAds?.ads?.[0]?.createdAt;
        
        if (lastUpdate) {
            const updateTime = new Date(lastUpdate);
            const now = new Date();
            const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
            document.getElementById('stat-last-update').textContent = diffMinutes;
        }
    }
    
    updateLivePreview() {
        const preview = document.getElementById('live-preview');
        if (!preview) return;
        
        let previewHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                    <div style="color: #e2b04a; font-size: 12px; margin-bottom: 5px;">📢 تیکر فعلی</div>
                    <div style="font-size: 14px;">${this.data.ticker?.messages?.[0] || 'هیچ پیامی وجود ندارد'}</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                    <div style="color: #e2b04a; font-size: 12px; margin-bottom: 5px;">🖼️ استوری اول</div>
                    <div style="font-size: 14px;">${this.data.stories?.stories?.[0]?.title || 'هیچ استوری وجود ندارد'}</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                    <div style="color: #e2b04a; font-size: 12px; margin-bottom: 5px;">⭐ تبلیغ VIP</div>
                    <div style="font-size: 14px;">${this.data.vipAds?.ads?.[0]?.title || 'هیچ تبلیغی وجود ندارد'}</div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
                    <div style="color: #e2b04a; font-size: 12px; margin-bottom: 5px;">📞 تماس</div>
                    <div style="font-size: 14px;">${this.data.settings?.app?.phone || '09220730628'}</div>
                </div>
            </div>
        `;
        
        preview.innerHTML = previewHTML;
    }
    
    refreshAllData() {
        if (this.hasUnsavedChanges() && !confirm('تغییرات ذخیره نشده‌ای دارید. آیا می‌خواهید ادامه دهید؟')) {
            return;
        }
        
        this.loadAllData();
        this.showAlert('همه داده‌ها با موفقیت بروزرسانی شدند', 'success');
    }
    
    clearCache() {
        if (confirm('آیا از پاک کردن کش اطمینان دارید؟')) {
            localStorage.removeItem('ads_cache_ticker_data');
            localStorage.removeItem('ads_cache_stories_data');
            localStorage.removeItem('ads_cache_vip_ads_data');
            
            this.showAlert('کش با موفقیت پاک شد', 'success');
        }
    }
    
    resetSettings() {
        if (confirm('آیا می‌خواهید همه تنظیمات به حالت پیش‌فرض بازگردانده شوند؟')) {
            this.loadFallbackData();
            this.updateAllEditors();
            this.showAlert('تنظیمات به حالت پیش‌فرض بازگردانده شدند', 'success');
        }
    }
    
    previewTicker() {
        const messages = this.data.ticker?.messages || [];
        if (messages.length === 0) {
            this.showAlert('هیچ پیام تیکری برای نمایش وجود ندارد', 'info');
            return;
        }
        
        const previewWindow = window.open('', 'تیکر پیش‌نمایش', 'width=500,height=200');
        previewWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>پیش‌نمایش تیکر</title>
                <style>
                    body {
                        background: #0a0a0a;
                        color: #e2b04a;
                        font-family: 'Vazirmatn', sans-serif;
                        padding: 20px;
                        margin: 0;
                    }
                    .ticker-preview {
                        background: #000;
                        border-bottom: 2px solid #e2b04a;
                        padding: 10px 0;
                        overflow: hidden;
                        white-space: nowrap;
                    }
                    .ticker-text {
                        display: inline-block;
                        padding-right: 100%;
                        animation: marquee 25s linear infinite;
                    }
                    @keyframes marquee {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                </style>
            </head>
            <body>
                <h3>پیش‌نمایش تیکر</h3>
                <div class="ticker-preview">
                    <div class="ticker-text">${messages[0]}</div>
                </div>
                <p style="color: #888; margin-top: 20px; font-size: 12px;">
                    در حال نمایش پیام ۱ از ${messages.length} پیام
                </p>
            </body>
            </html>
        `);
    }
    
    hasUnsavedChanges() {
        return Object.values(this.isDirty).some(value => value === true);
    }
    
    setupAutoSave() {
        // Auto-save every 2 minutes if there are changes
        setInterval(() => {
            if (this.isDirty.ticker) this.saveTickerData();
            if (this.isDirty.stories) this.saveStoriesData();
            if (this.isDirty.vipAds) this.saveVipAdsData();
            if (this.isDirty.settings) this.saveSettings();
        }, 2 * 60 * 1000);
        
        // Auto-backup if enabled
        setInterval(() => {
            if (this.data.settings?.admin?.autoBackup !== false) {
                this.createBackup('all');
            }
        }, 60 * 60 * 1000); // Every hour
    }
    
    setupBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'تغییرات ذخیره نشده‌ای دارید. آیا می‌خواهید صفحه را ترک کنید؟';
                return e.returnValue;
            }
        });
    }
    
    loadFallbackData() {
        console.log('[Admin Panel] Loading fallback data...');
        
        this.data = {
            ticker: {
                messages: [
                    "🔥 الو ذغال | سفارش آنلاین ذغال مرغوب | تحویل سریع در ایذه 🔥",
                    "✨ ذغال درجه یک با کیفیت عالی | قیمت مناسب ✨"
                ],
                speed: 25,
                direction: "rtl",
                autoChange: true,
                lastUpdated: new Date().toISOString()
            },
            stories: {
                stories: [
                    {
                        id: 1,
                        title: "ذغال مرغوب",
                        image: "https://raw.githubusercontent.com/aloozoghal-hash/alozoghal/main/8f6dcedf3dc3dbaa82c0df548bd962c9.jpg",
                        phone: "09220730628",
                        whatsapp: "989220730628",
                        active: true,
                        order: 1,
                        createdAt: new Date().toISOString().split('T')[0]
                    }
                ],
                settings: {
                    maxStories: 8,
                    storyDuration: 5000,
                    showButtons: true,
                    autoPlay: true
                }
            },
            vipAds: {
                ads: [
                    {
                        id: 1,
                        title: "ذغال VIP",
                        description: "ذغال مرغوب با کیفیت عالی",
                        image: "https://raw.githubusercontent.com/aloozoghal-hash/alozoghal/main/8f6dcedf3dc3dbaa82c0df548bd962c9.jpg",
                        phone: "09220730628",
                        whatsapp: "989220730628",
                        active: true,
                        priority: 1,
                        backgroundColor: "#1a1a1a",
                        textColor: "#e2b04a",
                        createdAt: new Date().toISOString().split('T')[0],
                        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00Z'
                    }
                ],
                settings: {
                    maxActiveAds: 2,
                    rotationInterval: 30000,
                    showWhatsApp: true,
                    showPhone: true
                }
            },
            settings: {
                app: {
                    name: "الو ذغال",
                    version: "1.0.0",
                    owner: "علی نادریان",
                    phone: "09220730628",
                    whatsapp: "989220730628",
                    location: "ایذه، پارک لاله",
                    workingHours: "۷ صبح تا ۹ شب"
                },
                prices: {
                    coalPrice: 65000,
                    freeDeliveryMin: 2,
                    deliveryFee: 0,
                    currency: "تومان"
                },
                features: {
                    enableGPS: true,
                    enableWhatsApp: true,
                    enableSMS: true,
                    enableTelegram: false,
                    enableStories: true,
                    enableVipAds: true,
                    enableTicker: true
                },
                admin: {
                    secretCode: "علی نادریان 1362541",
                    autoBackup: true,
                    backupInterval: 3600000,
                    maxBackups: 10
                }
            }
        };
        
        this.isDirty = {
            ticker: true,
            stories: true,
            vipAds: true,
            settings: true
        };
    }
    
    showAlert(message, type = 'info') {
        // Hide all alerts first
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.display = 'none';
        });
        
        const alertId = `alert-${type}`;
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.textContent = message;
            alertElement.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 5000);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Public methods for global access
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Deactivate all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        // Activate selected tab button
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(button => {
            if (button.textContent.includes(
                tabName === 'dashboard' ? 'پیشخوان' :
                tabName === 'ticker' ? 'تیکر' :
                tabName === 'stories' ? 'استوری' :
                tabName === 'vip-ads' ? 'VIP' :
                tabName === 'settings' ? 'تنظیمات' : 'پشتیبان'
            )) {
                button.classList.add('active');
            }
        });
    }
}

// Initialize Admin Panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
    
    // Make switchTab available globally
    window.switchTab = function(tabName) {
        if (window.adminPanel) {
            window.adminPanel.switchTab(tabName);
        }
    };
    
    // Make other functions available globally
    window.refreshAllData = function() {
        if (window.adminPanel) {
            window.adminPanel.refreshAllData();
        }
    };
    
    window.createBackup = function() {
        if (window.adminPanel) {
            window.adminPanel.createBackup('all');
        }
    };
    
    window.clearCache = function() {
        if (window.adminPanel) {
            window.adminPanel.clearCache();
        }
    };
    
    window.exportAllData = function() {
        if (window.adminPanel) {
            window.adminPanel.exportAllData();
        }
    };
    
    window.importData = function() {
        if (window.adminPanel) {
            window.adminPanel.importData();
        }
    };
    
    window.processImport = function() {
        if (window.adminPanel) {
            window.adminPanel.processImport();
        }
    };
    
    window.addTickerMessage = function() {
        if (window.adminPanel) {
            window.adminPanel.addTickerMessage();
        }
    };
    
    window.saveTickerData = function() {
        if (window.adminPanel) {
            window.adminPanel.saveTickerData();
        }
    };
    
    window.previewTicker = function() {
        if (window.adminPanel) {
            window.adminPanel.previewTicker();
        }
    };
    
    window.addStory = function() {
        if (window.adminPanel) {
            window.adminPanel.addStory();
        }
    };
    
    window.saveStoriesData = function() {
        if (window.adminPanel) {
            window.adminPanel.saveStoriesData();
        }
    };
    
    window.addVipAd = function() {
        if (window.adminPanel) {
            window.adminPanel.addVipAd();
        }
    };
    
    window.saveVipAdsData = function() {
        if (window.adminPanel) {
            window.adminPanel.saveVipAdsData();
        }
    };
    
    window.saveSettings = function() {
        if (window.adminPanel) {
            window.adminPanel.saveSettings();
        }
    };
    
    window.resetSettings = function() {
        if (window.adminPanel) {
            window.adminPanel.resetSettings();
        }
    };
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
}
