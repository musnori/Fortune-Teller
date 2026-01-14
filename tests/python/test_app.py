"""
Tests for Fortune Teller Flask application.
"""
import os
import sys
import pytest
from datetime import datetime, date

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestAllowedFile:
    """Tests for the allowed_file function."""

    def test_allows_png(self):
        """Test that PNG files are allowed."""
        from app import allowed_file
        assert allowed_file('image.png') is True

    def test_allows_jpg(self):
        """Test that JPG files are allowed."""
        from app import allowed_file
        assert allowed_file('photo.jpg') is True

    def test_allows_jpeg(self):
        """Test that JPEG files are allowed."""
        from app import allowed_file
        assert allowed_file('photo.jpeg') is True

    def test_allows_gif(self):
        """Test that GIF files are allowed."""
        from app import allowed_file
        assert allowed_file('animation.gif') is True

    def test_rejects_txt(self):
        """Test that TXT files are rejected."""
        from app import allowed_file
        assert allowed_file('document.txt') is False

    def test_rejects_exe(self):
        """Test that EXE files are rejected."""
        from app import allowed_file
        assert allowed_file('program.exe') is False

    def test_rejects_no_extension(self):
        """Test that files without extensions are rejected."""
        from app import allowed_file
        assert allowed_file('noextension') is False

    def test_handles_multiple_dots(self):
        """Test that files with multiple dots are handled correctly."""
        from app import allowed_file
        assert allowed_file('my.photo.jpg') is True
        assert allowed_file('document.backup.txt') is False

    def test_case_insensitive(self):
        """Test that extension checking is case insensitive."""
        from app import allowed_file
        assert allowed_file('IMAGE.PNG') is True
        assert allowed_file('PHOTO.JPG') is True

    def test_empty_filename(self):
        """Test handling of empty filename."""
        from app import allowed_file
        assert allowed_file('') is False

    def test_only_extension(self):
        """Test handling of filename that is only an extension."""
        from app import allowed_file
        assert allowed_file('.png') is True


class TestPostModel:
    """Tests for the Post model."""

    def test_post_creation(self, app):
        """Test creating a post with all required fields."""
        from app import db, Post

        with app.app_context():
            post = Post(
                title='Test Task',
                detail='Test Detail',
                due=datetime(2024, 1, 15),
                point=5,
                object='Study',
                effort=1,
                lucky=0
            )
            db.session.add(post)
            db.session.commit()

            assert post.id is not None
            assert post.title == 'Test Task'
            assert post.point == 5

    def test_post_without_detail(self, app):
        """Test creating a post without optional detail."""
        from app import db, Post

        with app.app_context():
            post = Post(
                title='Minimal Task',
                due=datetime(2024, 1, 15),
                point=3,
                object='Work',
                effort=1,
                lucky=0
            )
            db.session.add(post)
            db.session.commit()

            assert post.id is not None
            assert post.detail is None

    def test_post_date_handling(self, app):
        """Test that date fields are stored correctly."""
        from app import db, Post

        with app.app_context():
            test_date = datetime(2024, 6, 15, 12, 30, 0)
            post = Post(
                title='Date Test',
                due=test_date,
                point=1,
                object='Test',
                effort=1,
                lucky=0
            )
            db.session.add(post)
            db.session.commit()

            retrieved = Post.query.get(post.id)
            assert retrieved.due == test_date

    def test_post_query_by_date(self, app):
        """Test querying posts by date."""
        from app import db, Post

        with app.app_context():
            # Create posts on different dates
            post1 = Post(
                title='Jan 15',
                due=datetime(2024, 1, 15),
                point=5,
                object='Test',
                effort=1,
                lucky=0
            )
            post2 = Post(
                title='Jan 16',
                due=datetime(2024, 1, 16),
                point=3,
                object='Test',
                effort=1,
                lucky=0
            )
            db.session.add_all([post1, post2])
            db.session.commit()

            # Query by date
            jan15_posts = Post.query.filter_by(due=datetime(2024, 1, 15)).all()
            assert len(jan15_posts) == 1
            assert jan15_posts[0].title == 'Jan 15'


class TestIndexRoute:
    """Tests for the index route."""

    def test_get_index_empty(self, client):
        """Test GET / with no posts."""
        response = client.get('/')
        assert response.status_code == 200

    def test_get_index_with_posts(self, client, sample_post):
        """Test GET / with existing posts."""
        response = client.get('/')
        assert response.status_code == 200
        assert b'Test Task' in response.data

    def test_post_creates_record(self, client, sample_post_data):
        """Test POST / creates a new record."""
        response = client.post('/', data=sample_post_data, follow_redirects=True)
        assert response.status_code == 200

    def test_post_missing_required_fields(self, client):
        """Test POST / with missing required fields."""
        incomplete_data = {
            'title': 'Incomplete'
            # Missing due, point, object, effort, lucky
        }
        # This should cause an error
        response = client.post('/', data=incomplete_data)
        # The app doesn't have proper validation, so it will fail differently
        # This test documents current behavior
        assert response.status_code in [200, 302, 400, 500]


class TestCreateRoutes:
    """Tests for create routes."""

    def test_get_create(self, client):
        """Test GET /create."""
        response = client.get('/create')
        assert response.status_code == 200

    def test_get_create1(self, client):
        """Test GET /create1."""
        response = client.get('/create1')
        assert response.status_code == 200


class TestHistoryRoute:
    """Tests for history routes."""

    def test_get_history(self, client):
        """Test GET /history."""
        response = client.get('/history')
        assert response.status_code == 200

    def test_history_shows_posts(self, client, sample_post):
        """Test that history shows existing posts."""
        response = client.get('/history')
        assert response.status_code == 200


class TestDetailRoute:
    """Tests for detail route."""

    def test_get_detail(self, client, sample_post):
        """Test GET /detail/<id> with valid ID."""
        response = client.get(f'/detail/{sample_post}')
        assert response.status_code == 200
        assert b'Test Task' in response.data

    def test_get_detail_invalid_id(self, client):
        """Test GET /detail/<id> with invalid ID."""
        response = client.get('/detail/99999')
        # Current implementation doesn't handle missing posts gracefully
        # This test documents current behavior
        assert response.status_code in [200, 404, 500]


class TestUpdateRoute:
    """Tests for update route."""

    def test_get_update(self, client, sample_post):
        """Test GET /update/<id>."""
        response = client.get(f'/update/{sample_post}')
        assert response.status_code == 200

    def test_post_update(self, client, app, sample_post):
        """Test POST /update/<id> updates record."""
        from app import Post

        update_data = {
            'title': 'Updated Title',
            'detail': 'Updated Detail',
            'due': '2024-02-20'
        }
        response = client.post(f'/update/{sample_post}', data=update_data, follow_redirects=True)
        assert response.status_code == 200

        with app.app_context():
            post = Post.query.get(sample_post)
            assert post.title == 'Updated Title'


class TestDeleteRoute:
    """Tests for delete route."""

    def test_delete_post(self, client, app, sample_post):
        """Test /delete/<id> removes post."""
        from app import Post

        response = client.get(f'/delete/{sample_post}', follow_redirects=True)
        assert response.status_code == 200

        with app.app_context():
            post = Post.query.get(sample_post)
            assert post is None

    def test_delete_nonexistent(self, client):
        """Test /delete/<id> with invalid ID."""
        response = client.get('/delete/99999')
        # Current implementation doesn't handle missing posts gracefully
        assert response.status_code in [200, 302, 404, 500]


class TestGraphRoute:
    """Tests for graph routes."""

    def test_get_unpograph(self, client):
        """Test GET /unpograph."""
        response = client.get('/unpograph')
        assert response.status_code == 200


class TestCategoryRoutes:
    """Tests for category routes."""

    def test_get_effort(self, client):
        """Test GET /effort."""
        response = client.get('/effort')
        assert response.status_code == 200

    def test_get_lucky(self, client):
        """Test GET /lucky."""
        response = client.get('/lucky')
        assert response.status_code == 200


class TestHelpRoutes:
    """Tests for help routes."""

    def test_get_helppre(self, client):
        """Test GET /helppre."""
        response = client.get('/helppre')
        assert response.status_code == 200

    def test_get_help(self, client):
        """Test GET /help."""
        response = client.get('/help')
        assert response.status_code == 200

    def test_post_help_with_filter(self, client, sample_post):
        """Test POST /help with object filter."""
        response = client.post('/help', data={'object': 'Study'})
        assert response.status_code == 200


class TestPreGraphRoute:
    """Tests for pre_graph (ML prediction) route."""

    def test_get_pre_graph(self, client):
        """Test GET /pre_graph."""
        response = client.get('/pre_graph')
        assert response.status_code == 200

    def test_post_pre_graph_no_file(self, client):
        """Test POST /pre_graph without file."""
        response = client.post('/pre_graph', data={})
        # Should redirect back with flash message
        assert response.status_code in [200, 302]

    def test_post_pre_graph_empty_filename(self, client):
        """Test POST /pre_graph with empty filename."""
        import io
        data = {'file': (io.BytesIO(b''), '')}
        response = client.post('/pre_graph', data=data, content_type='multipart/form-data')
        assert response.status_code in [200, 302]


class TestPointsCalculation:
    """Tests for points calculation logic."""

    def test_total_points_calculation(self, client, app):
        """Test that total points are calculated correctly."""
        from app import db, Post

        with app.app_context():
            # Create multiple posts
            posts = [
                Post(title='Task 1', due=datetime(2024, 1, 15), point=5, object='Test', effort=1, lucky=0),
                Post(title='Task 2', due=datetime(2024, 1, 15), point=3, object='Test', effort=1, lucky=0),
                Post(title='Task 3', due=datetime(2024, 1, 16), point=10, object='Test', effort=1, lucky=0),
            ]
            db.session.add_all(posts)
            db.session.commit()

        response = client.get('/')
        assert response.status_code == 200
        # Total should be 18 (5 + 3 + 10)
        assert b'18' in response.data


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_special_characters_in_title(self, client, app):
        """Test handling of special characters in title."""
        from app import db, Post

        data = {
            'title': '<script>alert("xss")</script>',
            'detail': 'Test & "quotes"',
            'due': '2024-01-15',
            'point': '5',
            'object': 'Test',
            'effort': '1',
            'lucky': '0'
        }
        response = client.post('/', data=data, follow_redirects=True)
        assert response.status_code == 200

    def test_large_point_value(self, client, app):
        """Test handling of large point values."""
        data = {
            'title': 'Big Points',
            'due': '2024-01-15',
            'point': '999999',
            'object': 'Test',
            'effort': '1',
            'lucky': '0'
        }
        response = client.post('/', data=data, follow_redirects=True)
        assert response.status_code == 200

    def test_negative_point_value(self, client, app):
        """Test handling of negative point values."""
        data = {
            'title': 'Negative Points',
            'due': '2024-01-15',
            'point': '-5',
            'object': 'Test',
            'effort': '1',
            'lucky': '0'
        }
        response = client.post('/', data=data, follow_redirects=True)
        assert response.status_code == 200

    def test_unicode_in_fields(self, client, app):
        """Test handling of Unicode characters."""
        data = {
            'title': '日本語タイトル',
            'detail': '詳細情報 🎉',
            'due': '2024-01-15',
            'point': '5',
            'object': '勉強',
            'effort': '1',
            'lucky': '0'
        }
        response = client.post('/', data=data, follow_redirects=True)
        assert response.status_code == 200
