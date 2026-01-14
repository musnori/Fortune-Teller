# Test Coverage Analysis

## Executive Summary

**Current test coverage: 0%** - The codebase has no existing tests.

This document analyzes the Fortune-Teller codebase and identifies critical areas requiring test coverage.

---

## Codebase Overview

| Component | Files | Lines of Code | Tests |
|-----------|-------|---------------|-------|
| Frontend JS | `storage.js`, `i18n.js` | ~460 lines | 0 |
| Backend Python | `app.py` | ~350 lines | 0 |
| Total | 3 main files | ~810 lines | 0 |

---

## Priority 1: Critical - Frontend Data Management (`public/js/storage.js`)

The `FortuneTeller` object is the core of the application's data layer. Testing this is the highest priority.

### 1.1 CRUD Operations (Lines 56-117)

**Functions to test:**
- `addPost(post)` - Creates new records
- `getPost(id)` - Retrieves by ID
- `updatePost(id, updates)` - Updates existing records
- `deletePost(id)` - Removes records

**Test scenarios needed:**
```javascript
// Example test cases
describe('FortuneTeller CRUD', () => {
  test('addPost creates post with correct structure and auto-generated ID')
  test('addPost triggers daily points recalculation')
  test('getPost returns null for non-existent ID')
  test('updatePost preserves unmodified fields')
  test('updatePost recalculates points when date changes')
  test('deletePost removes record and recalculates daily points')
})
```

### 1.2 Streak Calculation (Lines 229-270)

**This is the most complex logic in the codebase and most likely to contain bugs.**

**Function:** `getStreak()`

**Test scenarios needed:**
```javascript
describe('getStreak', () => {
  test('returns 0 when no posts exist')
  test('returns 1 when only today has a record')
  test('returns correct count for consecutive days')
  test('returns 0 when last record is more than 1 day ago')
  test('handles gap in records correctly')
  test('handles records starting from yesterday (no today record)')
  test('handles timezone edge cases')
})
```

### 1.3 Statistics Calculation (Lines 293-316)

**Function:** `getStats(days)`

**Test scenarios needed:**
```javascript
describe('getStats', () => {
  test('returns zeros when no posts exist')
  test('calculates correct total for period')
  test('calculates correct average per day')
  test('finds maximum daily total correctly')
  test('respects "all" period parameter')
  test('respects numeric day limits (7, 30, etc.)')
})
```

### 1.4 Data Import/Export (Lines 318-350)

**Functions:** `exportData()`, `importData(data)`

**Test scenarios needed:**
```javascript
describe('Data Import/Export', () => {
  test('exportData includes version, posts, dailyPoints, settings')
  test('importData throws error for invalid data')
  test('importData recalculates daily points when not provided')
  test('importData merges settings with defaults')
  test('round-trip export/import preserves all data')
})
```

---

## Priority 2: High - Internationalization (`public/js/i18n.js`)

### 2.1 Translation Lookup (Lines 21-43)

**Function:** `t(key, params)`

**Test scenarios needed:**
```javascript
describe('I18n.t', () => {
  test('returns nested key value (e.g., "home.title")')
  test('returns key itself when translation is missing')
  test('replaces {param} placeholders with values')
  test('leaves unmatched placeholders unchanged')
  test('handles deeply nested keys')
})
```

### 2.2 DOM Translation (Lines 46-72)

**Function:** `applyTranslations()`

**Test scenarios needed:**
```javascript
describe('applyTranslations', () => {
  test('translates elements with data-i18n attribute')
  test('sets placeholder on elements with data-i18n-placeholder')
  test('sets title on elements with data-i18n-title')
  test('handles missing translation keys gracefully')
})
```

---

## Priority 3: Medium - Flask Backend (`app.py`)

### 3.1 Database Models (Lines 39-64)

**Models:** `Post`, `Point`

**Test scenarios needed:**
```python
# Example test cases
class TestPostModel:
    def test_post_creation_with_required_fields()
    def test_post_default_values()
    def test_post_date_field_handling()

class TestPointModel:
    def test_point_creation()
    def test_point_date_uniqueness()
```

### 3.2 Route Handlers

**Critical routes to test:**

| Route | Method | Priority | Reason |
|-------|--------|----------|--------|
| `/` | POST | High | Main data entry point |
| `/update/<id>` | POST | High | Data modification |
| `/delete/<id>` | POST | High | Data deletion |
| `/pre_graph` | POST | High | File upload + ML prediction |

**Test scenarios needed:**
```python
class TestIndexRoute:
    def test_get_returns_all_posts()
    def test_post_creates_new_record()
    def test_post_updates_daily_points()
    def test_post_validates_required_fields()

class TestDeleteRoute:
    def test_delete_removes_post()
    def test_delete_nonexistent_returns_error()

class TestFileUpload:
    def test_upload_rejects_invalid_extensions()
    def test_upload_accepts_valid_image()
    def test_allowed_file_function()
```

### 3.3 File Validation (Lines 300-301)

**Function:** `allowed_file(filename)`

**Test scenarios needed:**
```python
class TestAllowedFile:
    def test_allows_png()
    def test_allows_jpg()
    def test_allows_jpeg()
    def test_allows_gif()
    def test_rejects_txt()
    def test_rejects_no_extension()
    def test_handles_multiple_dots()
```

---

## Priority 4: Low - Edge Cases and Integration

### 4.1 Date Handling Edge Cases

Test scenarios for date boundary conditions:
- Midnight transitions
- Timezone differences
- Daylight saving time changes
- Leap years

### 4.2 Data Migration (Lines 27-37 in storage.js)

**Function:** `migrateData()`

**Test scenarios:**
```javascript
describe('Data Migration', () => {
  test('migrates v1 data to v2 format')
  test('creates default settings if missing')
  test('preserves existing data during migration')
})
```

### 4.3 LocalStorage Limits

Test behavior when approaching browser storage limits.

---

## Recommended Testing Setup

### Frontend (JavaScript)

```bash
# Install dependencies
npm init -y
npm install --save-dev jest jsdom @testing-library/jest-dom

# Create jest.config.js
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['public/js/**/*.js']
};
```

### Backend (Python)

```bash
# Install dependencies
pip install pytest pytest-flask pytest-cov

# Create pytest.ini
```

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_functions = test_*
addopts = --cov=app --cov-report=html
```

---

## Suggested Test File Structure

```
Fortune-Teller/
├── tests/
│   ├── js/
│   │   ├── setup.js
│   │   ├── storage.test.js
│   │   └── i18n.test.js
│   └── python/
│       ├── conftest.py
│       ├── test_models.py
│       ├── test_routes.py
│       └── test_file_upload.py
├── jest.config.js
└── pytest.ini
```

---

## Implementation Roadmap

### Phase 1: Foundation
1. Set up Jest for frontend tests
2. Set up pytest for backend tests
3. Create test utilities and fixtures

### Phase 2: Critical Path
4. Write tests for `FortuneTeller` CRUD operations
5. Write tests for streak calculation
6. Write tests for data import/export

### Phase 3: Coverage Expansion
7. Write tests for I18n module
8. Write Flask route tests
9. Write file upload validation tests

### Phase 4: Edge Cases
10. Add date handling edge case tests
11. Add error handling tests
12. Add integration tests

---

## Risk Assessment

| Area | Risk Level | Impact if Untested |
|------|------------|-------------------|
| Streak calculation | **High** | Users see incorrect streak counts |
| Data import/export | **High** | Data loss during restore |
| CRUD operations | **High** | Core functionality breaks |
| Daily points calculation | **Medium** | Incorrect statistics |
| I18n | **Low** | UI shows wrong text |
| ML prediction | **Low** | Fortune results incorrect |

---

## Conclusion

The codebase has **zero test coverage**, making it vulnerable to regressions during any future changes. The highest priority should be testing the `FortuneTeller` object in `storage.js`, particularly:

1. **Streak calculation** - Complex date logic prone to bugs
2. **CRUD operations** - Core functionality
3. **Data import/export** - Data integrity risk

Starting with these areas will provide the highest return on testing investment.
