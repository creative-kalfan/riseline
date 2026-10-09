import pytest
from app.main import app
from fastapi.testclient import TestClient

def test_app_startup_import():
    """
    Regression test for application startup and dependency resolution.
    Ensures that routes utilizing File/Form (e.g. upload-csv) do not crash
    the application due to missing python-multipart.
    """
    client = TestClient(app)
    # Just importing app and initializing TestClient evaluates routes.
    # We can also make a quick request to docs to be sure.
    response = client.get("/docs")
    assert response.status_code == 200
