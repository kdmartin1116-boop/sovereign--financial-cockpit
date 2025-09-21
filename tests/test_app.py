import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index(client):
    """Test that the index page returns a 200 OK status code."""
    response = client.get('/')
    assert response.status_code == 200
