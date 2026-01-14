// Tests for Fortune Teller i18n.js

// Load the I18n module
const fs = require('fs');
const path = require('path');
const i18nCode = fs.readFileSync(path.join(__dirname, '../../public/js/i18n.js'), 'utf8');
eval(i18nCode);

describe('I18n', () => {
    beforeEach(() => {
        // Reset translations before each test
        I18n.translations = {};
        I18n.currentLocale = 'ja';

        // Clear any DOM elements
        document.body.innerHTML = '';
    });

    // ============================================
    // Translation Lookup Tests
    // ============================================
    describe('t (translation lookup)', () => {
        beforeEach(() => {
            I18n.translations = {
                home: {
                    title: 'ホーム',
                    subtitle: 'サブタイトル',
                    nested: {
                        deep: {
                            value: '深い値'
                        }
                    }
                },
                common: {
                    points: 'ポイント',
                    greeting: 'こんにちは、{name}さん！',
                    multiple: '{greeting} {name}、今日は{points}ポイントです'
                },
                simple: 'シンプルな値'
            };
        });

        test('returns translation for simple key', () => {
            expect(I18n.t('simple')).toBe('シンプルな値');
        });

        test('returns translation for nested key', () => {
            expect(I18n.t('home.title')).toBe('ホーム');
        });

        test('returns translation for deeply nested key', () => {
            expect(I18n.t('home.nested.deep.value')).toBe('深い値');
        });

        test('returns key itself when translation is missing', () => {
            suppressConsoleWarn();
            expect(I18n.t('missing.key')).toBe('missing.key');
        });

        test('returns key when intermediate path is missing', () => {
            suppressConsoleWarn();
            expect(I18n.t('nonexistent.path.key')).toBe('nonexistent.path.key');
        });

        test('replaces single parameter placeholder', () => {
            expect(I18n.t('common.greeting', { name: '太郎' })).toBe('こんにちは、太郎さん！');
        });

        test('replaces multiple parameter placeholders', () => {
            const result = I18n.t('common.multiple', {
                greeting: 'おはよう',
                name: '花子',
                points: '100'
            });
            expect(result).toBe('おはよう 花子、今日は100ポイントです');
        });

        test('leaves unmatched placeholders unchanged', () => {
            const result = I18n.t('common.greeting', {});
            expect(result).toBe('こんにちは、{name}さん！');
        });

        test('handles empty params object', () => {
            expect(I18n.t('home.title', {})).toBe('ホーム');
        });

        test('handles non-string value in translations', () => {
            I18n.translations.numberValue = 123;
            expect(I18n.t('numberValue')).toBe(123);
        });
    });

    // ============================================
    // DOM Translation Tests
    // ============================================
    describe('applyTranslations', () => {
        beforeEach(() => {
            I18n.translations = {
                test: {
                    title: 'テストタイトル',
                    placeholder: 'プレースホルダー',
                    tooltip: 'ツールチップ'
                }
            };
        });

        test('translates elements with data-i18n attribute', () => {
            document.body.innerHTML = `
                <div data-i18n="test.title">Original</div>
            `;

            I18n.applyTranslations();

            const el = document.querySelector('[data-i18n]');
            expect(el.textContent).toBe('テストタイトル');
        });

        test('translates multiple elements', () => {
            document.body.innerHTML = `
                <h1 data-i18n="test.title">Title</h1>
                <p data-i18n="test.placeholder">Placeholder</p>
            `;

            I18n.applyTranslations();

            expect(document.querySelector('h1').textContent).toBe('テストタイトル');
            expect(document.querySelector('p').textContent).toBe('プレースホルダー');
        });

        test('sets placeholder on elements with data-i18n-placeholder', () => {
            document.body.innerHTML = `
                <input data-i18n-placeholder="test.placeholder" placeholder="original">
            `;

            I18n.applyTranslations();

            const input = document.querySelector('input');
            expect(input.placeholder).toBe('プレースホルダー');
        });

        test('sets title on elements with data-i18n-title', () => {
            document.body.innerHTML = `
                <button data-i18n-title="test.tooltip" title="original">Click</button>
            `;

            I18n.applyTranslations();

            const button = document.querySelector('button');
            expect(button.title).toBe('ツールチップ');
        });

        test('handles elements with all i18n attributes', () => {
            document.body.innerHTML = `
                <input
                    data-i18n="test.title"
                    data-i18n-placeholder="test.placeholder"
                    data-i18n-title="test.tooltip"
                    value="original">
            `;

            I18n.applyTranslations();

            const input = document.querySelector('input');
            expect(input.textContent).toBe('テストタイトル');
            expect(input.placeholder).toBe('プレースホルダー');
            expect(input.title).toBe('ツールチップ');
        });

        test('handles missing translation keys gracefully', () => {
            suppressConsoleWarn();
            document.body.innerHTML = `
                <div data-i18n="missing.key">Original</div>
            `;

            I18n.applyTranslations();

            // Should not throw, content should be the key
            const el = document.querySelector('[data-i18n]');
            expect(el.textContent).toBe('missing.key');
        });

        test('does not modify elements without i18n attributes', () => {
            document.body.innerHTML = `
                <div class="no-translate">Keep Me</div>
            `;

            I18n.applyTranslations();

            expect(document.querySelector('.no-translate').textContent).toBe('Keep Me');
        });
    });

    // ============================================
    // Date Formatting Tests
    // ============================================
    describe('formatDate', () => {
        test('formats date in Japanese style (YYYY/MM/DD)', () => {
            expect(I18n.formatDate('2024-01-15')).toBe('2024/01/15');
        });

        test('pads single digit months', () => {
            expect(I18n.formatDate('2024-5-15')).toBe('2024/05/15');
        });

        test('pads single digit days', () => {
            expect(I18n.formatDate('2024-01-5')).toBe('2024/01/05');
        });

        test('handles Date object', () => {
            const date = new Date(2024, 0, 15); // January 15, 2024
            expect(I18n.formatDate(date)).toBe('2024/01/15');
        });

        test('handles end of month dates', () => {
            expect(I18n.formatDate('2024-12-31')).toBe('2024/12/31');
        });

        test('handles beginning of year', () => {
            expect(I18n.formatDate('2024-01-01')).toBe('2024/01/01');
        });
    });

    // ============================================
    // Points Formatting Tests
    // ============================================
    describe('formatPoints', () => {
        beforeEach(() => {
            I18n.translations = {
                common: {
                    points: 'ポイント'
                }
            };
        });

        test('formats points with unit', () => {
            expect(I18n.formatPoints(100)).toBe('100ポイント');
        });

        test('formats zero points', () => {
            expect(I18n.formatPoints(0)).toBe('0ポイント');
        });

        test('formats negative points', () => {
            expect(I18n.formatPoints(-5)).toBe('-5ポイント');
        });

        test('formats large numbers', () => {
            expect(I18n.formatPoints(10000)).toBe('10000ポイント');
        });
    });

    // ============================================
    // Category Name Tests
    // ============================================
    describe('getCategoryName', () => {
        beforeEach(() => {
            I18n.translations = {
                record: {
                    categories: {
                        study: '勉強',
                        work: '仕事',
                        exercise: '運動'
                    }
                }
            };
        });

        test('returns translated category name', () => {
            expect(I18n.getCategoryName('study')).toBe('勉強');
        });

        test('handles uppercase input', () => {
            expect(I18n.getCategoryName('STUDY')).toBe('勉強');
        });

        test('handles mixed case input', () => {
            expect(I18n.getCategoryName('Study')).toBe('勉強');
        });

        test('returns original key for untranslated category', () => {
            suppressConsoleWarn();
            expect(I18n.getCategoryName('unknown')).toBe('unknown');
        });
    });

    // ============================================
    // Init Tests
    // ============================================
    describe('init', () => {
        test('sets currentLocale', async () => {
            // Mock fetch to return translations
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ test: 'value' })
                })
            );

            await I18n.init('en');

            expect(I18n.currentLocale).toBe('en');
        });

        test('returns true on successful load', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ test: 'value' })
                })
            );

            const result = await I18n.init('ja');

            expect(result).toBe(true);
        });

        test('returns false on network error', async () => {
            global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
            jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = await I18n.init('ja');

            expect(result).toBe(false);
        });

        test('returns false on non-ok response', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: false,
                    status: 404
                })
            );
            jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = await I18n.init('ja');

            expect(result).toBe(false);
        });

        test('loads translations from correct path', async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({})
                })
            );

            await I18n.init('ja');

            expect(global.fetch).toHaveBeenCalledWith('i18n/ja.json');
        });

        test('applies translations after loading', async () => {
            document.body.innerHTML = '<div data-i18n="greeting">Hello</div>';

            global.fetch = jest.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ greeting: 'こんにちは' })
                })
            );

            await I18n.init('ja');

            expect(document.querySelector('[data-i18n]').textContent).toBe('こんにちは');
        });
    });
});
