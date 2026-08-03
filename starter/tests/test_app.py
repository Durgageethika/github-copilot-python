import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app


def test_home_page():
    app.testing = True
    client = app.test_client()

    response = client.get("/")

    assert response.status_code == 200

def test_new_game():
    app.testing = True
    client = app.test_client()

    response = client.get("/new")

    assert response.status_code == 200
    data = response.get_json()
    assert data is not None
    assert data["difficulty"] == "medium"
    assert isinstance(data["puzzle"], list)
    assert len(data["puzzle"]) == 9
    assert all(isinstance(row, list) and len(row) == 9 for row in data["puzzle"])
    assert all(isinstance(cell, int) and 0 <= cell <= 9 for row in data["puzzle"] for cell in row)


def test_new_game_with_difficulty():
    app.testing = True
    client = app.test_client()

    response = client.get("/new?difficulty=easy")

    assert response.status_code == 200
    data = response.get_json()
    assert data is not None
    assert data["difficulty"] == "easy"
    assert isinstance(data["puzzle"], list)
    assert len(data["puzzle"]) == 9
    assert all(isinstance(row, list) and len(row) == 9 for row in data["puzzle"])


def test_index():
    app.testing = True
    client = app.test_client()

    response = client.get("/")

    assert b"Sudoku Game" in response.data