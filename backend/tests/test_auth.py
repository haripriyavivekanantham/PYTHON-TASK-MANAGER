def test_register_success(client):
    response = client.post("/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "password123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "new@example.com"
    assert "id" in data


def test_register_duplicate_username(client, registered_user):
    response = client.post("/register", json={
        "username": "testuser",
        "email": "other@example.com",
        "password": "password123",
    })
    assert response.status_code == 409


def test_register_duplicate_email(client, registered_user):
    response = client.post("/register", json={
        "username": "otheruser",
        "email": "test@example.com",
        "password": "password123",
    })
    assert response.status_code == 409


def test_register_invalid_email(client):
    response = client.post("/register", json={
        "username": "user",
        "email": "not-an-email",
        "password": "password123",
    })
    assert response.status_code == 422


def test_login_success(client, registered_user):
    response = client.post("/login", json={
        "username": "testuser",
        "password": "testpass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "testuser"


def test_login_wrong_password(client, registered_user):
    response = client.post("/login", json={
        "username": "testuser",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/login", json={
        "username": "ghost",
        "password": "password123",
    })
    assert response.status_code == 401
