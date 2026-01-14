"""
Pytest fixtures for Fortune Teller tests.
"""
import os
import sys
import tempfile
import pytest

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


@pytest.fixture
def app():
    """Create application for testing."""
    # Import here to avoid issues with module loading
    from app import app, db

    # Create a temporary database
    db_fd, db_path = tempfile.mkstemp()

    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'WTF_CSRF_ENABLED': False,
        'SECRET_KEY': 'test-secret-key'
    })

    with app.app_context():
        db.create_all()

    yield app

    # Cleanup
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def sample_post_data():
    """Sample post data for testing."""
    return {
        'title': 'Test Task',
        'detail': 'Test Detail',
        'due': '2024-01-15',
        'point': '5',
        'object': 'Study',
        'effort': '1',
        'lucky': '0'
    }


@pytest.fixture
def sample_post(app, sample_post_data):
    """Create a sample post in the database."""
    from app import db, Post
    from datetime import datetime

    with app.app_context():
        post = Post(
            title=sample_post_data['title'],
            detail=sample_post_data['detail'],
            due=datetime.strptime(sample_post_data['due'], '%Y-%m-%d'),
            point=int(sample_post_data['point']),
            object=sample_post_data['object'],
            effort=int(sample_post_data['effort']),
            lucky=int(sample_post_data['lucky'])
        )
        db.session.add(post)
        db.session.commit()

        # Return post ID for reference
        post_id = post.id

    return post_id
