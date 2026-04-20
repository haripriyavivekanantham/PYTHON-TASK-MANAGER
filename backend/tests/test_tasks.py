def test_create_task(client, auth_headers):
    response = client.post("/tasks", json={
        "title": "Buy groceries",
        "description": "Milk, eggs, bread",
        "priority": "high",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Buy groceries"
    assert data["completed"] is False
    assert data["priority"] == "high"


def test_create_task_unauthenticated(client):
    response = client.post("/tasks", json={"title": "Test"})
    assert response.status_code == 401


def test_get_tasks(client, auth_headers):
    # Create 2 tasks
    client.post("/tasks", json={"title": "Task 1"}, headers=auth_headers)
    client.post("/tasks", json={"title": "Task 2"}, headers=auth_headers)

    response = client.get("/tasks", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["tasks"]) == 2


def test_get_tasks_filter_completed(client, auth_headers):
    # Create one completed and one pending task
    r = client.post("/tasks", json={"title": "Task A"}, headers=auth_headers)
    task_id = r.json()["id"]
    client.put(f"/tasks/{task_id}", json={"completed": True}, headers=auth_headers)
    client.post("/tasks", json={"title": "Task B"}, headers=auth_headers)

    response = client.get("/tasks?completed=true", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["tasks"][0]["completed"] is True


def test_get_tasks_pagination(client, auth_headers):
    for i in range(5):
        client.post("/tasks", json={"title": f"Task {i}"}, headers=auth_headers)

    response = client.get("/tasks?page=1&per_page=3", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["tasks"]) == 3
    assert data["page"] == 1


def test_get_single_task(client, auth_headers):
    r = client.post("/tasks", json={"title": "My Task"}, headers=auth_headers)
    task_id = r.json()["id"]

    response = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "My Task"


def test_get_nonexistent_task(client, auth_headers):
    response = client.get("/tasks/9999", headers=auth_headers)
    assert response.status_code == 404


def test_update_task(client, auth_headers):
    r = client.post("/tasks", json={"title": "Old Title"}, headers=auth_headers)
    task_id = r.json()["id"]

    response = client.put(f"/tasks/{task_id}", json={
        "title": "New Title",
        "completed": True,
    }, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "New Title"
    assert data["completed"] is True


def test_delete_task(client, auth_headers):
    r = client.post("/tasks", json={"title": "Delete Me"}, headers=auth_headers)
    task_id = r.json()["id"]

    response = client.delete(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 204

    # Verify it's gone
    response = client.get(f"/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 404


def test_user_cannot_access_others_task(client):
    # Register two users
    client.post("/register", json={
        "username": "user1", "email": "u1@test.com", "password": "pass123"
    })
    client.post("/register", json={
        "username": "user2", "email": "u2@test.com", "password": "pass123"
    })

    token1 = client.post("/login", json={"username": "user1", "password": "pass123"}).json()["access_token"]
    token2 = client.post("/login", json={"username": "user2", "password": "pass123"}).json()["access_token"]

    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User1 creates a task
    r = client.post("/tasks", json={"title": "User1 Task"}, headers=headers1)
    task_id = r.json()["id"]

    # User2 tries to access it
    response = client.get(f"/tasks/{task_id}", headers=headers2)
    assert response.status_code == 404
