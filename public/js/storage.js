// Fortune Teller - LocalStorage Data Management
const FortuneTeller = {
    STORAGE_KEY: 'fortune_teller_posts',
    POINTS_KEY: 'fortune_teller_daily_points',

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
    }
};
