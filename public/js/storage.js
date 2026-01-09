// Fortune Teller - LocalStorage Data Management
const FortuneTeller = {
    STORAGE_KEY: 'fortune_teller_posts',
    POINTS_KEY: 'fortune_teller_daily_points',
    SETTINGS_KEY: 'fortune_teller_settings',
    VERSION_KEY: 'fortune_teller_version',
    CURRENT_VERSION: 2,

    // Default settings
    defaultSettings: {
        goalPoints: 100,
        dailyLimit: 10,
        pointRule: 'subtract', // 'subtract' | 'add' | 'none'
        darkMode: false
    },

    // Initialize and migrate data if needed
    init() {
        const version = localStorage.getItem(this.VERSION_KEY);
        if (!version || parseInt(version) < this.CURRENT_VERSION) {
            this.migrateData();
            localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
        }
        return this;
    },

    // Migrate data from v1 to v2 (preserves all existing data)
    migrateData() {
        // Existing data is already compatible, just ensure settings exist
        if (!localStorage.getItem(this.SETTINGS_KEY)) {
            this.saveSettings(this.defaultSettings);
        }
        // Recalculate daily points from posts
        const posts = this.getPosts();
        const dates = [...new Set(posts.map(p => p.due))];
        dates.forEach(date => this.updateDailyPoints(date));
    },

    // Settings management
    getSettings() {
        const data = localStorage.getItem(this.SETTINGS_KEY);
        return data ? { ...this.defaultSettings, ...JSON.parse(data) } : { ...this.defaultSettings };
    },

    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    },

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        this.saveSettings(settings);
    },

    // Get all posts
    getPosts() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Save all posts
    savePosts(posts) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
    },

    // Add new post
    addPost(post) {
        const posts = this.getPosts();
        const newPost = {
            id: Date.now(),
            title: post.title,
            detail: post.detail || '',
            due: post.due,
            point: parseInt(post.point),
            object: post.object,
            effort: parseInt(post.effort),
            lucky: parseInt(post.lucky),
            createdAt: new Date().toISOString()
        };
        posts.push(newPost);
        this.savePosts(posts);
        this.updateDailyPoints(post.due);
        return newPost;
    },

    // Get post by ID
    getPost(id) {
        const posts = this.getPosts();
        return posts.find(p => p.id === parseInt(id));
    },

    // Update post
    updatePost(id, updates) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            const oldDue = posts[index].due;
            posts[index] = { ...posts[index], ...updates };
            this.savePosts(posts);
            this.updateDailyPoints(oldDue);
            if (updates.due && updates.due !== oldDue) {
                this.updateDailyPoints(updates.due);
            }
        }
    },

    // Delete post
    deletePost(id) {
        const posts = this.getPosts();
        const post = posts.find(p => p.id === parseInt(id));
        if (post) {
            const due = post.due;
            const filtered = posts.filter(p => p.id !== parseInt(id));
            this.savePosts(filtered);
            this.updateDailyPoints(due);
        }
    },

    // Get total points
    getTotalPoints() {
        const posts = this.getPosts();
        return posts.reduce((sum, post) => sum + post.point, 0);
    },

    // Get daily points data
    getDailyPoints() {
        const data = localStorage.getItem(this.POINTS_KEY);
        return data ? JSON.parse(data) : {};
    },

    // Save daily points
    saveDailyPoints(points) {
        localStorage.setItem(this.POINTS_KEY, JSON.stringify(points));
    },

    // Update daily points for a specific date
    updateDailyPoints(dateStr) {
        const posts = this.getPosts();
        const dailyPoints = this.getDailyPoints();

        // Calculate total for the date
        const dayPosts = posts.filter(p => p.due === dateStr);
        const total = dayPosts.reduce((sum, p) => sum + p.point, 0);

        dailyPoints[dateStr] = total;
        this.saveDailyPoints(dailyPoints);
    },

    // Get last 7 days points
    getLast7DaysPoints() {
        const dailyPoints = this.getDailyPoints();
        const posts = this.getPosts();
        const days = [];
        const points = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 7; i >= 1; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Calculate from posts if not in dailyPoints
            let dayTotal = dailyPoints[dateStr];
            if (dayTotal === undefined) {
                const dayPosts = posts.filter(p => p.due === dateStr);
                dayTotal = dayPosts.reduce((sum, p) => sum + p.point, 0);
            }

            days.push(date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }));
            points.push(dayTotal);
        }

        return { days, points };
    },

    // Get posts sorted by date (newest first)
    getPostsSortedByDate() {
        const posts = this.getPosts();
        return posts.sort((a, b) => new Date(b.due) - new Date(a.due));
    },

    // Get daily summaries
    getDailySummaries() {
        const posts = this.getPosts();
        const summaries = {};

        posts.forEach(post => {
            if (!summaries[post.due]) {
                summaries[post.due] = { date: post.due, total: 0 };
            }
            summaries[post.due].total += post.point;
        });

        return Object.values(summaries).sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // Delete daily point entry
    deleteDailyPoint(dateStr) {
        const dailyPoints = this.getDailyPoints();
        delete dailyPoints[dateStr];
        this.saveDailyPoints(dailyPoints);
    },

    // Format date for display
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
    },

    // Get today's date string
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    },

    // Get today's summary (effort count, good thing count)
    getTodaySummary() {
        const today = this.getTodayString();
        const posts = this.getPosts().filter(p => p.due === today);

        return {
            effortCount: posts.filter(p => p.effort === 1).length,
            goodThingCount: posts.filter(p => p.lucky === 1).length,
            totalPoints: posts.reduce((sum, p) => sum + p.point, 0)
        };
    },

    // Calculate streak (consecutive days with records)
    getStreak() {
        const posts = this.getPosts();
        if (posts.length === 0) return 0;

        // Get unique dates sorted in descending order
        const dates = [...new Set(posts.map(p => p.due))].sort((a, b) => new Date(b) - new Date(a));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = this.getTodayString();

        // Check if there's a record today or yesterday
        const latestDate = new Date(dates[0]);
        latestDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));

        // If latest record is more than 1 day ago, streak is broken
        if (diffDays > 1) return 0;

        let streak = 0;
        let currentDate = diffDays === 0 ? today : latestDate;

        for (const dateStr of dates) {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);

            const expectedDate = new Date(currentDate);
            expectedDate.setDate(expectedDate.getDate() - streak);
            expectedDate.setHours(0, 0, 0, 0);

            if (date.getTime() === expectedDate.getTime()) {
                streak++;
            } else if (date.getTime() < expectedDate.getTime()) {
                // Found a gap, stop counting
                break;
            }
        }

        return streak;
    },

    // Get points for a specific period
    getPointsForPeriod(days) {
        const posts = this.getPosts();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (days === 'all') {
            return posts;
        }

        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days + 1);

        return posts.filter(p => {
            const postDate = new Date(p.due);
            postDate.setHours(0, 0, 0, 0);
            return postDate >= startDate && postDate <= today;
        });
    },

    // Get statistics for a period
    getStats(days = 'all') {
        const posts = this.getPointsForPeriod(days);
        const dailyPoints = this.getDailyPoints();

        if (posts.length === 0) {
            return { total: 0, average: 0, max: 0, streak: this.getStreak() };
        }

        const dates = [...new Set(posts.map(p => p.due))];
        const dailyTotals = dates.map(date => {
            return posts.filter(p => p.due === date).reduce((sum, p) => sum + p.point, 0);
        });

        const total = dailyTotals.reduce((sum, t) => sum + t, 0);
        const average = dates.length > 0 ? Math.round(total / dates.length * 10) / 10 : 0;
        const max = Math.max(...dailyTotals, 0);

        return {
            total,
            average,
            max,
            streak: this.getStreak()
        };
    },

    // Export all data as JSON
    exportData() {
        return {
            version: this.CURRENT_VERSION,
            exportedAt: new Date().toISOString(),
            posts: this.getPosts(),
            dailyPoints: this.getDailyPoints(),
            settings: this.getSettings()
        };
    },

    // Import data from JSON
    importData(data) {
        if (!data || !data.posts) {
            throw new Error('Invalid data format');
        }

        this.savePosts(data.posts);

        if (data.dailyPoints) {
            this.saveDailyPoints(data.dailyPoints);
        } else {
            // Recalculate daily points
            const dates = [...new Set(data.posts.map(p => p.due))];
            dates.forEach(date => this.updateDailyPoints(date));
        }

        if (data.settings) {
            this.saveSettings({ ...this.defaultSettings, ...data.settings });
        }

        localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION.toString());
    },

    // Reset all data
    resetData() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.POINTS_KEY);
        localStorage.removeItem(this.SETTINGS_KEY);
        localStorage.removeItem(this.VERSION_KEY);
        this.init();
    }
};

// Initialize on load
FortuneTeller.init();
