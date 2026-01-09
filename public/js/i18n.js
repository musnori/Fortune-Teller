// Fortune Teller - Internationalization Module
const I18n = {
    currentLocale: 'ja',
    translations: {},

    // Initialize with translations
    async init(locale = 'ja') {
        this.currentLocale = locale;
        try {
            const response = await fetch(`i18n/${locale}.json`);
            if (!response.ok) throw new Error('Failed to load translations');
            this.translations = await response.json();
            this.applyTranslations();
            return true;
        } catch (error) {
            console.error('I18n init error:', error);
            return false;
        }
    },

    // Get translation by key (supports nested keys like "home.title")
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation missing: ${key}`);
                return key;
            }
        }

        // Replace parameters like {name} with actual values
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{(\w+)\}/g, (match, param) => {
                return params[param] !== undefined ? params[param] : match;
            });
        }

        return value;
    },

    // Apply translations to elements with data-i18n attribute
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation && typeof translation === 'string') {
                el.textContent = translation;
            }
        });

        // Handle placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation && typeof translation === 'string') {
                el.placeholder = translation;
            }
        });

        // Handle titles (tooltips)
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation && typeof translation === 'string') {
                el.title = translation;
            }
        });
    },

    // Format date in Japanese style (YYYY/MM/DD)
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    },

    // Format points with unit
    formatPoints(points) {
        return `${points}${this.t('common.points')}`;
    },

    // Get category name
    getCategoryName(categoryKey) {
        const key = `record.categories.${categoryKey.toLowerCase()}`;
        const translation = this.t(key);
        return translation !== key ? translation : categoryKey;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18n;
}
