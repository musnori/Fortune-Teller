// Tests for Fortune Teller storage.js

// Load the FortuneTeller module
const fs = require('fs');
const path = require('path');
const storageCode = fs.readFileSync(path.join(__dirname, '../../public/js/storage.js'), 'utf8');
eval(storageCode);

describe('FortuneTeller', () => {
    beforeEach(() => {
        localStorage.clear();
        FortuneTeller.init();
    });

    // ============================================
    // Initialization and Settings Tests
    // ============================================
    describe('init', () => {
        test('initializes with default settings when no data exists', () => {
            const settings = FortuneTeller.getSettings();
            expect(settings.goalPoints).toBe(100);
            expect(settings.dailyLimit).toBe(10);
            expect(settings.pointRule).toBe('subtract');
            expect(settings.darkMode).toBe(false);
        });

        test('sets version in localStorage', () => {
            expect(localStorage.getItem(FortuneTeller.VERSION_KEY)).toBe('2');
        });

        test('preserves existing settings during init', () => {
            FortuneTeller.saveSettings({ goalPoints: 200, dailyLimit: 20 });
            FortuneTeller.init();
            const settings = FortuneTeller.getSettings();
            expect(settings.goalPoints).toBe(200);
            expect(settings.dailyLimit).toBe(20);
        });
    });

    describe('Settings Management', () => {
        test('getSettings returns default settings merged with saved settings', () => {
            FortuneTeller.saveSettings({ goalPoints: 150 });
            const settings = FortuneTeller.getSettings();
            expect(settings.goalPoints).toBe(150);
            expect(settings.dailyLimit).toBe(10); // default value
        });

        test('updateSetting updates a single setting', () => {
            FortuneTeller.updateSetting('darkMode', true);
            const settings = FortuneTeller.getSettings();
            expect(settings.darkMode).toBe(true);
        });

        test('updateSetting preserves other settings', () => {
            FortuneTeller.saveSettings({ goalPoints: 200, dailyLimit: 15 });
            FortuneTeller.updateSetting('darkMode', true);
            const settings = FortuneTeller.getSettings();
            expect(settings.goalPoints).toBe(200);
            expect(settings.dailyLimit).toBe(15);
            expect(settings.darkMode).toBe(true);
        });
    });

    // ============================================
    // CRUD Operations Tests
    // ============================================
    describe('CRUD Operations', () => {
        describe('addPost', () => {
            test('creates post with correct structure', () => {
                const post = FortuneTeller.addPost({
                    title: 'Test Task',
                    detail: 'Test Detail',
                    due: '2024-01-15',
                    point: 5,
                    object: 'Study',
                    effort: 1,
                    lucky: 0
                });

                expect(post).toMatchObject({
                    title: 'Test Task',
                    detail: 'Test Detail',
                    due: '2024-01-15',
                    point: 5,
                    object: 'Study',
                    effort: 1,
                    lucky: 0
                });
                expect(post.id).toBeDefined();
                expect(post.createdAt).toBeDefined();
            });

            test('auto-generates unique ID', () => {
                const post1 = FortuneTeller.addPost({
                    title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });
                const post2 = FortuneTeller.addPost({
                    title: 'Task 2', due: '2024-01-15', point: 3, object: 'Test', effort: 0, lucky: 1
                });

                expect(post1.id).not.toBe(post2.id);
            });

            test('parses numeric fields as integers', () => {
                const post = FortuneTeller.addPost({
                    title: 'Task', due: '2024-01-15', point: '5', object: 'Test', effort: '1', lucky: '0'
                });

                expect(post.point).toBe(5);
                expect(post.effort).toBe(1);
                expect(post.lucky).toBe(0);
            });

            test('triggers daily points recalculation', () => {
                FortuneTeller.addPost({
                    title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                const dailyPoints = FortuneTeller.getDailyPoints();
                expect(dailyPoints['2024-01-15']).toBe(5);
            });

            test('handles empty detail field', () => {
                const post = FortuneTeller.addPost({
                    title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                expect(post.detail).toBe('');
            });
        });

        describe('getPost', () => {
            test('returns post by ID', () => {
                const created = FortuneTeller.addPost({
                    title: 'Find Me', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                const found = FortuneTeller.getPost(created.id);
                expect(found.title).toBe('Find Me');
            });

            test('returns undefined for non-existent ID', () => {
                const found = FortuneTeller.getPost(99999);
                expect(found).toBeUndefined();
            });

            test('handles string ID parameter', () => {
                const created = FortuneTeller.addPost({
                    title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                const found = FortuneTeller.getPost(String(created.id));
                expect(found.title).toBe('Task');
            });
        });

        describe('updatePost', () => {
            test('updates specified fields', () => {
                const post = FortuneTeller.addPost({
                    title: 'Original', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                FortuneTeller.updatePost(post.id, { title: 'Updated', point: 10 });

                const updated = FortuneTeller.getPost(post.id);
                expect(updated.title).toBe('Updated');
                expect(updated.point).toBe(10);
            });

            test('preserves unmodified fields', () => {
                const post = FortuneTeller.addPost({
                    title: 'Original', detail: 'Keep Me', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                FortuneTeller.updatePost(post.id, { title: 'Updated' });

                const updated = FortuneTeller.getPost(post.id);
                expect(updated.detail).toBe('Keep Me');
                expect(updated.due).toBe('2024-01-15');
            });

            test('recalculates daily points when date changes', () => {
                FortuneTeller.addPost({
                    title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });
                const post2 = FortuneTeller.addPost({
                    title: 'Task 2', due: '2024-01-15', point: 3, object: 'Test', effort: 1, lucky: 0
                });

                // Move post2 to different date
                FortuneTeller.updatePost(post2.id, { due: '2024-01-16' });

                const dailyPoints = FortuneTeller.getDailyPoints();
                expect(dailyPoints['2024-01-15']).toBe(5);
                expect(dailyPoints['2024-01-16']).toBe(3);
            });

            test('handles string ID parameter', () => {
                const post = FortuneTeller.addPost({
                    title: 'Original', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                FortuneTeller.updatePost(String(post.id), { title: 'Updated' });

                const updated = FortuneTeller.getPost(post.id);
                expect(updated.title).toBe('Updated');
            });

            test('does nothing for non-existent ID', () => {
                const postsBefore = FortuneTeller.getPosts();
                FortuneTeller.updatePost(99999, { title: 'Ghost' });
                const postsAfter = FortuneTeller.getPosts();

                expect(postsAfter).toEqual(postsBefore);
            });
        });

        describe('deletePost', () => {
            test('removes post from storage', () => {
                const post = FortuneTeller.addPost({
                    title: 'Delete Me', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                FortuneTeller.deletePost(post.id);

                const found = FortuneTeller.getPost(post.id);
                expect(found).toBeUndefined();
            });

            test('recalculates daily points after deletion', () => {
                FortuneTeller.addPost({
                    title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });
                const post2 = FortuneTeller.addPost({
                    title: 'Task 2', due: '2024-01-15', point: 3, object: 'Test', effort: 1, lucky: 0
                });

                FortuneTeller.deletePost(post2.id);

                const dailyPoints = FortuneTeller.getDailyPoints();
                expect(dailyPoints['2024-01-15']).toBe(5);
            });

            test('handles string ID parameter', () => {
                const post = FortuneTeller.addPost({
                    title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                FortuneTeller.deletePost(String(post.id));

                expect(FortuneTeller.getPost(post.id)).toBeUndefined();
            });

            test('does nothing for non-existent ID', () => {
                FortuneTeller.addPost({
                    title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                const countBefore = FortuneTeller.getPosts().length;
                FortuneTeller.deletePost(99999);
                const countAfter = FortuneTeller.getPosts().length;

                expect(countAfter).toBe(countBefore);
            });
        });

        describe('getPosts', () => {
            test('returns empty array when no posts exist', () => {
                const posts = FortuneTeller.getPosts();
                expect(posts).toEqual([]);
            });

            test('returns all posts', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-16', point: 3, object: 'Test', effort: 0, lucky: 1 });

                const posts = FortuneTeller.getPosts();
                expect(posts.length).toBe(2);
            });
        });
    });

    // ============================================
    // Points Calculation Tests
    // ============================================
    describe('Points Calculation', () => {
        describe('getTotalPoints', () => {
            test('returns 0 when no posts exist', () => {
                expect(FortuneTeller.getTotalPoints()).toBe(0);
            });

            test('returns sum of all post points', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-16', point: 3, object: 'Test', effort: 0, lucky: 1 });
                FortuneTeller.addPost({ title: 'Task 3', due: '2024-01-15', point: 2, object: 'Test', effort: 1, lucky: 0 });

                expect(FortuneTeller.getTotalPoints()).toBe(10);
            });
        });

        describe('updateDailyPoints', () => {
            test('calculates correct total for a date', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-15', point: 3, object: 'Test', effort: 0, lucky: 1 });
                FortuneTeller.addPost({ title: 'Task 3', due: '2024-01-16', point: 10, object: 'Test', effort: 1, lucky: 0 });

                const dailyPoints = FortuneTeller.getDailyPoints();
                expect(dailyPoints['2024-01-15']).toBe(8);
                expect(dailyPoints['2024-01-16']).toBe(10);
            });
        });

        describe('getLast7DaysPoints', () => {
            test('returns arrays for days and points', () => {
                const result = FortuneTeller.getLast7DaysPoints();
                expect(result.days).toBeInstanceOf(Array);
                expect(result.points).toBeInstanceOf(Array);
                expect(result.days.length).toBe(7);
                expect(result.points.length).toBe(7);
            });

            test('returns 0 for days with no posts', () => {
                const result = FortuneTeller.getLast7DaysPoints();
                result.points.forEach(p => {
                    expect(p).toBe(0);
                });
            });
        });
    });

    // ============================================
    // Streak Calculation Tests
    // ============================================
    describe('Streak Calculation', () => {
        describe('getStreak', () => {
            test('returns 0 when no posts exist', () => {
                expect(FortuneTeller.getStreak()).toBe(0);
            });

            test('returns 1 when only today has a record', () => {
                setMockDate('2024-01-15T12:00:00');

                FortuneTeller.addPost({
                    title: 'Today', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                expect(FortuneTeller.getStreak()).toBe(1);
                restoreMockDate();
            });

            test('returns correct count for consecutive days', () => {
                setMockDate('2024-01-15T12:00:00');

                FortuneTeller.addPost({ title: 'Day 1', due: '2024-01-13', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Day 2', due: '2024-01-14', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Day 3', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });

                expect(FortuneTeller.getStreak()).toBe(3);
                restoreMockDate();
            });

            test('returns 0 when last record is more than 1 day ago', () => {
                setMockDate('2024-01-20T12:00:00');

                FortuneTeller.addPost({
                    title: 'Old', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                expect(FortuneTeller.getStreak()).toBe(0);
                restoreMockDate();
            });

            test('handles gap in records correctly', () => {
                setMockDate('2024-01-15T12:00:00');

                FortuneTeller.addPost({ title: 'Day 1', due: '2024-01-10', point: 5, object: 'Test', effort: 1, lucky: 0 });
                // Gap on 2024-01-11
                FortuneTeller.addPost({ title: 'Day 2', due: '2024-01-12', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Day 3', due: '2024-01-13', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Day 4', due: '2024-01-14', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Day 5', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });

                expect(FortuneTeller.getStreak()).toBe(4); // Only counts 12, 13, 14, 15
                restoreMockDate();
            });

            test('handles records starting from yesterday (no today record)', () => {
                setMockDate('2024-01-15T12:00:00');

                FortuneTeller.addPost({ title: 'Day 1', due: '2024-01-13', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Day 2', due: '2024-01-14', point: 5, object: 'Test', effort: 1, lucky: 0 });

                expect(FortuneTeller.getStreak()).toBe(2);
                restoreMockDate();
            });

            test('multiple posts on same day count as 1 day', () => {
                setMockDate('2024-01-15T12:00:00');

                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-14', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-14', point: 3, object: 'Test', effort: 0, lucky: 1 });
                FortuneTeller.addPost({ title: 'Task 3', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });

                expect(FortuneTeller.getStreak()).toBe(2);
                restoreMockDate();
            });
        });
    });

    // ============================================
    // Statistics Tests
    // ============================================
    describe('Statistics', () => {
        describe('getStats', () => {
            test('returns zeros when no posts exist', () => {
                const stats = FortuneTeller.getStats();
                expect(stats.total).toBe(0);
                expect(stats.average).toBe(0);
                expect(stats.max).toBe(0);
            });

            test('calculates correct total', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-16', point: 10, object: 'Test', effort: 1, lucky: 0 });

                const stats = FortuneTeller.getStats('all');
                expect(stats.total).toBe(15);
            });

            test('calculates correct average per day', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 6, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-16', point: 4, object: 'Test', effort: 1, lucky: 0 });

                const stats = FortuneTeller.getStats('all');
                expect(stats.average).toBe(5); // (6 + 4) / 2 days = 5
            });

            test('finds maximum daily total correctly', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-15', point: 3, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 3', due: '2024-01-16', point: 4, object: 'Test', effort: 1, lucky: 0 });

                const stats = FortuneTeller.getStats('all');
                expect(stats.max).toBe(8); // 5 + 3 on Jan 15
            });

            test('respects day limit parameter', () => {
                setMockDate('2024-01-20T12:00:00');

                FortuneTeller.addPost({ title: 'Old', due: '2024-01-10', point: 100, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Recent', due: '2024-01-19', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Today', due: '2024-01-20', point: 3, object: 'Test', effort: 1, lucky: 0 });

                const stats = FortuneTeller.getStats(7);
                expect(stats.total).toBe(8); // Only recent + today

                restoreMockDate();
            });
        });

        describe('getTodaySummary', () => {
            test('returns correct counts for today', () => {
                setMockDate('2024-01-15T12:00:00');

                FortuneTeller.addPost({ title: 'Effort 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Effort 2', due: '2024-01-15', point: 3, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Lucky', due: '2024-01-15', point: 2, object: 'Test', effort: 0, lucky: 1 });

                const summary = FortuneTeller.getTodaySummary();
                expect(summary.effortCount).toBe(2);
                expect(summary.goodThingCount).toBe(1);
                expect(summary.totalPoints).toBe(10);

                restoreMockDate();
            });
        });

        describe('getDailySummaries', () => {
            test('groups posts by date', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-15', point: 3, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 3', due: '2024-01-16', point: 10, object: 'Test', effort: 1, lucky: 0 });

                const summaries = FortuneTeller.getDailySummaries();

                expect(summaries.length).toBe(2);
                expect(summaries.find(s => s.date === '2024-01-15').total).toBe(8);
                expect(summaries.find(s => s.date === '2024-01-16').total).toBe(10);
            });

            test('sorts by date descending (newest first)', () => {
                FortuneTeller.addPost({ title: 'Old', due: '2024-01-10', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'New', due: '2024-01-20', point: 5, object: 'Test', effort: 1, lucky: 0 });

                const summaries = FortuneTeller.getDailySummaries();

                expect(summaries[0].date).toBe('2024-01-20');
                expect(summaries[1].date).toBe('2024-01-10');
            });
        });
    });

    // ============================================
    // Data Import/Export Tests
    // ============================================
    describe('Data Import/Export', () => {
        describe('exportData', () => {
            test('includes version', () => {
                const data = FortuneTeller.exportData();
                expect(data.version).toBe(FortuneTeller.CURRENT_VERSION);
            });

            test('includes exportedAt timestamp', () => {
                const data = FortuneTeller.exportData();
                expect(data.exportedAt).toBeDefined();
                expect(new Date(data.exportedAt)).toBeInstanceOf(Date);
            });

            test('includes all posts', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-16', point: 3, object: 'Test', effort: 0, lucky: 1 });

                const data = FortuneTeller.exportData();
                expect(data.posts.length).toBe(2);
            });

            test('includes dailyPoints', () => {
                FortuneTeller.addPost({ title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });

                const data = FortuneTeller.exportData();
                expect(data.dailyPoints['2024-01-15']).toBe(5);
            });

            test('includes settings', () => {
                FortuneTeller.updateSetting('goalPoints', 200);

                const data = FortuneTeller.exportData();
                expect(data.settings.goalPoints).toBe(200);
            });
        });

        describe('importData', () => {
            test('throws error for invalid data', () => {
                expect(() => FortuneTeller.importData(null)).toThrow('Invalid data format');
                expect(() => FortuneTeller.importData({})).toThrow('Invalid data format');
                expect(() => FortuneTeller.importData({ foo: 'bar' })).toThrow('Invalid data format');
            });

            test('imports posts correctly', () => {
                const importedData = {
                    posts: [
                        { id: 1, title: 'Imported', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 }
                    ]
                };

                FortuneTeller.importData(importedData);

                const posts = FortuneTeller.getPosts();
                expect(posts.length).toBe(1);
                expect(posts[0].title).toBe('Imported');
            });

            test('recalculates daily points when not provided', () => {
                const importedData = {
                    posts: [
                        { id: 1, title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 },
                        { id: 2, title: 'Task 2', due: '2024-01-15', point: 3, object: 'Test', effort: 1, lucky: 0 }
                    ]
                };

                FortuneTeller.importData(importedData);

                const dailyPoints = FortuneTeller.getDailyPoints();
                expect(dailyPoints['2024-01-15']).toBe(8);
            });

            test('imports dailyPoints when provided', () => {
                const importedData = {
                    posts: [
                        { id: 1, title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 }
                    ],
                    dailyPoints: { '2024-01-15': 5, '2024-01-16': 10 }
                };

                FortuneTeller.importData(importedData);

                const dailyPoints = FortuneTeller.getDailyPoints();
                expect(dailyPoints['2024-01-16']).toBe(10);
            });

            test('merges settings with defaults', () => {
                const importedData = {
                    posts: [],
                    settings: { goalPoints: 500 }
                };

                FortuneTeller.importData(importedData);

                const settings = FortuneTeller.getSettings();
                expect(settings.goalPoints).toBe(500);
                expect(settings.dailyLimit).toBe(10); // default
            });

            test('sets current version after import', () => {
                const importedData = {
                    version: 1,
                    posts: []
                };

                FortuneTeller.importData(importedData);

                expect(localStorage.getItem(FortuneTeller.VERSION_KEY)).toBe(String(FortuneTeller.CURRENT_VERSION));
            });

            test('round-trip export/import preserves all data', () => {
                FortuneTeller.addPost({ title: 'Task 1', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Task 2', due: '2024-01-16', point: 3, object: 'Test', effort: 0, lucky: 1 });
                FortuneTeller.updateSetting('goalPoints', 250);

                const exported = FortuneTeller.exportData();

                // Clear everything
                FortuneTeller.resetData();
                expect(FortuneTeller.getPosts().length).toBe(0);

                // Import
                FortuneTeller.importData(exported);

                expect(FortuneTeller.getPosts().length).toBe(2);
                expect(FortuneTeller.getSettings().goalPoints).toBe(250);
            });
        });

        describe('resetData', () => {
            test('clears all posts', () => {
                FortuneTeller.addPost({ title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });

                FortuneTeller.resetData();

                expect(FortuneTeller.getPosts().length).toBe(0);
            });

            test('clears daily points', () => {
                FortuneTeller.addPost({ title: 'Task', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });

                FortuneTeller.resetData();

                expect(FortuneTeller.getDailyPoints()).toEqual({});
            });

            test('resets settings to defaults', () => {
                FortuneTeller.updateSetting('goalPoints', 999);

                FortuneTeller.resetData();

                expect(FortuneTeller.getSettings().goalPoints).toBe(100);
            });

            test('reinitializes after reset', () => {
                FortuneTeller.resetData();

                // Should be able to add posts after reset
                const post = FortuneTeller.addPost({
                    title: 'After Reset', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0
                });

                expect(post.id).toBeDefined();
            });
        });
    });

    // ============================================
    // Utility Functions Tests
    // ============================================
    describe('Utility Functions', () => {
        describe('formatDate', () => {
            test('formats date correctly in Japanese style', () => {
                const formatted = FortuneTeller.formatDate('2024-01-15');
                expect(formatted).toMatch(/2024.*01.*15/);
            });
        });

        describe('getTodayString', () => {
            test('returns date in YYYY-MM-DD format', () => {
                setMockDate('2024-01-15T12:00:00');

                const today = FortuneTeller.getTodayString();
                expect(today).toBe('2024-01-15');

                restoreMockDate();
            });
        });

        describe('getPostsSortedByDate', () => {
            test('returns posts sorted by date descending', () => {
                FortuneTeller.addPost({ title: 'Old', due: '2024-01-10', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'Middle', due: '2024-01-15', point: 5, object: 'Test', effort: 1, lucky: 0 });
                FortuneTeller.addPost({ title: 'New', due: '2024-01-20', point: 5, object: 'Test', effort: 1, lucky: 0 });

                const sorted = FortuneTeller.getPostsSortedByDate();

                expect(sorted[0].title).toBe('New');
                expect(sorted[1].title).toBe('Middle');
                expect(sorted[2].title).toBe('Old');
            });
        });
    });
});
