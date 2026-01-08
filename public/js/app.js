/**
 * Fortune Teller - Client-side SPA with LocalStorage
 */

const App = {
    // State
    currentPoint: 1,
    chart: null,

    // LocalStorage Keys
    STORAGE_KEYS: {
        ENTRIES: 'fortune_entries',
        DAILY: 'fortune_daily'
    },

    // Fortune Messages
    FORTUNE_MESSAGES: [
        { rank: 1, message: 'とんでもねえことがあるかも', effort: 0.4, luck: 1.6 },
        { rank: 2, message: 'マジでいいことあるぜ', effort: 0.6, luck: 1.4 },
        { rank: 3, message: 'よきかなあ', effort: 0.8, luck: 1.2 },
        { rank: 4, message: 'いいことあるかもよー', effort: 1.0, luck: 1.0 },
        { rank: 5, message: '今日もいいことあったらええなあ', effort: 1.0, luck: 1.0 },
        { rank: 6, message: '徳を積んで運をつかめ', effort: 1.2, luck: 0.8 },
        { rank: 7, message: 'プラス思考で運勢かわる！', effort: 1.4, luck: 0.6 },
        { rank: 8, message: '人間万事塞翁が馬', effort: 1.6, luck: 0.4 }
    ],

    // Initialize
    init() {
        this.setupRouter();
        this.navigate(window.location.hash || '#/');
    },

    // Router
    setupRouter() {
        window.addEventListener('hashchange', () => {
            this.navigate(window.location.hash);
        });
    },

    navigate(hash) {
        const routes = {
            '#/': 'home',
            '#/create': 'create',
            '#/create-good': 'create-good',
            '#/history': 'history',
            '#/fortune': 'fortune',
            '#/graph': 'graph',
            '#/help': 'help'
        };

        // Handle detail page
        if (hash.startsWith('#/detail/')) {
            this.renderDetail(hash.split('/')[2]);
            this.updateNav('');
            return;
        }

        const page = routes[hash] || 'home';
        this.renderPage(page);
        this.updateNav(page);
    },

    updateNav(activePage) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    },

    renderPage(page) {
        const template = document.getElementById(`${page}-template`);
        const app = document.getElementById('app');

        if (template) {
            app.innerHTML = template.innerHTML;
            this.initPage(page);
        }
    },

    initPage(page) {
        switch (page) {
            case 'home':
                this.initHome();
                break;
            case 'create':
                this.initCreateForm('effort');
                break;
            case 'create-good':
                this.initCreateForm('good');
                break;
            case 'history':
                this.initHistory();
                break;
            case 'graph':
                this.initGraph();
                break;
            case 'help':
                this.initHelp();
                break;
        }
    },

    // Home Page
    initHome() {
        const total = this.getTotalPoints();
        document.getElementById('totalPoint').textContent = total + 'P';

        const badge = document.getElementById('modeBadge');
        const icon = document.getElementById('modeIcon');
        const text = document.getElementById('modeText');

        if (total > 15) {
            badge.classList.add('lucky');
            icon.textContent = '🌟';
            text.textContent = 'ラッキーモード';
        } else {
            badge.classList.add('normal');
        }
    },

    // Create Form
    initCreateForm(type) {
        this.currentPoint = 1;
        const form = document.getElementById(type === 'effort' ? 'effortForm' : 'goodForm');
        const dateInput = form.querySelector('input[name="date"]');

        // Set today's date
        dateInput.value = new Date().toISOString().split('T')[0];

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEntry(form, type);
        });
    },

    incrementPoint() {
        this.currentPoint++;
        document.getElementById('pointDisplay').textContent = this.currentPoint;
    },

    decrementPoint() {
        if (this.currentPoint > 1) {
            this.currentPoint--;
            document.getElementById('pointDisplay').textContent = this.currentPoint;
        }
    },

    saveEntry(form, type) {
        const formData = new FormData(form);
        const entry = {
            id: Date.now(),
            title: formData.get('title'),
            detail: formData.get('detail') || '',
            category: formData.get('category'),
            date: formData.get('date'),
            point: type === 'effort' ? this.currentPoint : -1,
            type: type,
            createdAt: new Date().toISOString()
        };

        // Save to LocalStorage
        const entries = this.getEntries();
        entries.push(entry);
        localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

        // Update daily summary
        this.updateDailySummary(entry.date);

        // Navigate to home
        window.location.hash = '#/';
    },

    updateDailySummary(date) {
        const entries = this.getEntries();
        const dayEntries = entries.filter(e => e.date === date);
        const dayTotal = dayEntries.reduce((sum, e) => sum + e.point, 0);

        const daily = this.getDailySummary();
        daily[date] = dayTotal;
        localStorage.setItem(this.STORAGE_KEYS.DAILY, JSON.stringify(daily));
    },

    // History Page
    initHistory() {
        this.renderEntries();
        this.renderDaily();
    },

    renderEntries() {
        const entries = this.getEntries().sort((a, b) => new Date(b.date) - new Date(a.date));
        const container = document.getElementById('historyList');

        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8v4l3 3"/>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <p>まだ記録がありません</p>
                    <a href="#/create" class="btn btn-primary mt-md">最初の記録をつける</a>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => `
            <div class="history-card">
                <div class="history-card-header">
                    <span class="history-card-date">${this.formatDate(entry.date)}</span>
                    <span class="history-card-point ${entry.point > 0 ? 'positive' : 'negative'}">
                        ${entry.point > 0 ? '+' : ''}${entry.point}P
                    </span>
                </div>
                <h3 class="history-card-title">${this.escapeHtml(entry.title)}</h3>
                <span class="history-card-category">${entry.category}</span>
                ${entry.detail ? `<p class="history-card-detail">${this.escapeHtml(entry.detail)}</p>` : ''}
                <div class="history-card-actions">
                    <a href="#/detail/${entry.id}" class="btn btn-sm btn-outline">詳細</a>
                    <button onclick="App.deleteEntry(${entry.id})" class="btn btn-sm btn-danger">削除</button>
                </div>
            </div>
        `).join('');
    },

    renderDaily() {
        const daily = this.getDailySummary();
        const dates = Object.keys(daily).sort((a, b) => new Date(b) - new Date(a));
        const container = document.getElementById('dailyList');

        if (dates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                    <p>まだデータがありません</p>
                </div>
            `;
            return;
        }

        container.innerHTML = dates.map(date => `
            <div class="daily-summary">
                <div class="daily-summary-info">
                    <span class="daily-summary-date">${this.formatDate(date)}</span>
                    <span class="daily-summary-label">1日の合計</span>
                </div>
                <div class="daily-summary-right">
                    <span class="daily-summary-point ${daily[date] > 0 ? 'positive' : daily[date] < 0 ? 'negative' : ''}">
                        ${daily[date] > 0 ? '+' : ''}${daily[date]}P
                    </span>
                </div>
            </div>
        `).join('');
    },

    switchHistoryTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    },

    deleteEntry(id) {
        if (!confirm('本当に削除しますか？')) return;

        let entries = this.getEntries();
        const entry = entries.find(e => e.id === id);
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem(this.STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

        if (entry) {
            this.updateDailySummary(entry.date);
        }

        this.renderEntries();
        this.renderDaily();
    },

    // Detail Page
    renderDetail(id) {
        const template = document.getElementById('detail-template');
        const app = document.getElementById('app');
        app.innerHTML = template.innerHTML;

        const entry = this.getEntries().find(e => e.id === parseInt(id));
        const container = document.getElementById('detailContent');

        if (!entry) {
            container.innerHTML = '<p>記録が見つかりません</p>';
            return;
        }

        container.innerHTML = `
            <div class="detail-header">
                <span class="detail-date">${this.formatDate(entry.date)}</span>
                <span class="detail-point ${entry.point > 0 ? 'positive' : 'negative'}">
                    ${entry.point > 0 ? '+' : ''}${entry.point}P
                </span>
            </div>
            <h2 class="detail-title">${this.escapeHtml(entry.title)}</h2>
            <div class="detail-category">
                <span class="category-badge">${entry.category}</span>
            </div>
            ${entry.detail ? `
                <div class="detail-memo">
                    <label class="detail-label">メモ</label>
                    <p class="detail-text">${this.escapeHtml(entry.detail)}</p>
                </div>
            ` : ''}
            <div class="btn-group mt-xl">
                <a href="#/history" class="btn btn-secondary">戻る</a>
                <button onclick="App.deleteEntry(${entry.id}); window.location.hash='#/history';" class="btn btn-danger">削除</button>
            </div>
        `;
    },

    // Fortune Page
    getFortune() {
        const entries = this.getEntries();
        const effortCount = entries.filter(e => e.type === 'effort').length;

        // Calculate fortune based on effort
        let fortuneIndex;
        if (effortCount === 0) {
            fortuneIndex = Math.floor(Math.random() * 8);
        } else {
            // More effort = better fortune (weighted random)
            const weight = Math.min(effortCount / 10, 1);
            fortuneIndex = Math.floor(Math.random() * 4 * (1 - weight) + Math.random() * 4 * weight);
        }

        const fortune = this.FORTUNE_MESSAGES[fortuneIndex];

        document.getElementById('fortuneForm').style.display = 'none';
        document.getElementById('fortuneResult').style.display = 'block';
        document.getElementById('fortuneResult').innerHTML = `
            <div class="result-header">
                <span class="result-label">今日の運勢</span>
            </div>
            <div class="fortune-rank">第${fortune.rank}位</div>
            <div class="fortune-message">${fortune.message}</div>
            <div class="fortune-weights">
                <div class="fortune-weight">
                    <div class="fortune-weight-icon">⭐</div>
                    <div class="fortune-weight-label">頑張りの重み</div>
                    <div class="fortune-weight-value">×${fortune.effort}</div>
                </div>
                <div class="fortune-weight">
                    <div class="fortune-weight-icon">💫</div>
                    <div class="fortune-weight-label">良いことの重み</div>
                    <div class="fortune-weight-value">×${fortune.luck}</div>
                </div>
            </div>
            <div class="btn-group mt-xl">
                <a href="#/create" class="btn btn-primary btn-lg btn-block">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    頑張りを記録する
                </a>
            </div>
        `;
    },

    // Graph Page
    initGraph() {
        const data = this.getLast7DaysData();

        // Update stats
        const total = data.points.reduce((a, b) => a + b, 0);
        const avg = data.points.length ? (total / data.points.length).toFixed(1) : 0;
        const max = data.points.length ? Math.max(...data.points) : 0;

        document.getElementById('statTotal').textContent = total + 'P';
        document.getElementById('statAvg').textContent = avg + 'P';
        document.getElementById('statMax').textContent = max + 'P';

        // Create chart
        const ctx = document.getElementById('pointChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(129, 140, 248, 0.5)');
        gradient.addColorStop(1, 'rgba(129, 140, 248, 0)');

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '運ポイント',
                    data: data.points,
                    borderColor: '#818cf8',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#818cf8',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(30, 30, 40, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => context.parsed.y + 'P'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: { size: 11 },
                            callback: (value) => value + 'P'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    },

    getLast7DaysData() {
        const daily = this.getDailySummary();
        const labels = [];
        const points = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }));
            points.push(daily[dateStr] || 0);
        }

        return { labels, points };
    },

    downloadGraph() {
        const canvas = document.getElementById('pointChart');
        const link = document.createElement('a');
        link.download = 'fortune-graph.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    // Help Page
    initHelp() {
        const entries = this.getEntries();
        const titles = entries.map(e => e.title);
        const container = document.getElementById('helpTitles');

        if (titles.length === 0) {
            container.innerHTML = `
                <p class="text-center" style="opacity: 0.7;">
                    まだ記録がありません。<br>
                    頑張りを記録して、過去の自分からパワーをもらおう！
                </p>
            `;
            return;
        }

        // Shuffle and show random titles
        const shuffled = titles.sort(() => Math.random() - 0.5).slice(0, 5);
        container.innerHTML = shuffled.map((title, i) => `
            <div class="help-title-item" style="animation-delay: ${i * 0.3}s;">
                ${this.escapeHtml(title)}
            </div>
        `).join('');
    },

    // Data Helpers
    getEntries() {
        const data = localStorage.getItem(this.STORAGE_KEYS.ENTRIES);
        return data ? JSON.parse(data) : [];
    },

    getDailySummary() {
        const data = localStorage.getItem(this.STORAGE_KEYS.DAILY);
        return data ? JSON.parse(data) : {};
    },

    getTotalPoints() {
        return this.getEntries().reduce((sum, e) => sum + e.point, 0);
    },

    // Utilities
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => App.init());
