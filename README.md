A full-stack Task Manager web application built with **FastAPI** (backend) and **plain HTML/CSS/JS** (frontend), featuring JWT authentication, SQLite database, pagination, and filtering.

**Live Demo:** `https://your-frontend.vercel.app`
**API Docs:** `https://your-backend.onrender.com/docs`

---

## 📁 Project Structure

```
task-manager/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models.py        # User & Task ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── auth.py          # JWT creation, verification, bcrypt hashing
│   │   └── routes/
│   │       ├── auth.py      # POST /register, POST /login
│   │       └── tasks.py     # CRUD /tasks endpoints
│   ├── tests/
│   │   ├── conftest.py      # Pytest fixtures
│   │   ├── test_auth.py     # Auth endpoint tests
│   │   └── test_tasks.py    # Task CRUD + isolation tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── index.html           # Redirect to login
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── script.js            # API client + all page logic
│   ├── style.css            # Dark theme UI
│   └── vercel.json          # Vercel deployment config
├── Dockerfile               # Root Dockerfile (backend)
├── render.yaml              # Render deployment config
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` inside the `backend/` folder:

```bash
cp backend/.env.example backend/.env
```

| Variable                    | Description                         | Default               |
|-----------------------------|-------------------------------------|-----------------------|
| `DATABASE_URL`              | SQLAlchemy DB connection string     | `sqlite:///./taskmanager.db` |
| `SECRET_KEY`                | JWT signing secret (min 32 chars)   | *(required)*          |
| `ALGORITHM`                 | JWT algorithm                       | `HS256`               |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes           | `30`                  |
| `ALLOWED_ORIGINS`           | Comma-separated allowed CORS origins| `http://localhost:5500,...` |

> ⚠️ **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- pip

### 1. Clone the repo

```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

### 2. Set up the backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and set a strong SECRET_KEY

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### 3. Run the frontend

You need to serve the frontend over HTTP (not `file://`). Use any static server:

```bash
cd frontend

# Option A: Python
python -m http.server 5500

# Option B: Node
npx serve .

# Option C: VS Code Live Server extension
```

Open `http://localhost:5500` in your browser.

> **Important:** If the backend is not at `http://localhost:8000`, edit the `API_BASE` constant at the top of `frontend/script.js`.

### 4. Run tests

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint    | Auth | Description          |
|--------|-------------|------|----------------------|
| POST   | `/register` | No   | Create a new account |
| POST   | `/login`    | No   | Login, receive JWT   |

**Register request body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Login request body:**
```json
{
  "username": "johndoe",
  "password": "secret123"
}
```

**Login response:**
```json
{
  "access_token": "<JWT>",
  "token_type": "bearer",
  "user": { "id": 1, "username": "johndoe", "email": "..." }
}
```

---

### Tasks

All task endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint         | Description                         |
|--------|------------------|-------------------------------------|
| POST   | `/tasks`         | Create a new task                   |
| GET    | `/tasks`         | List all tasks (with filters/paging)|
| GET    | `/tasks/{id}`    | Get a single task                   |
| PUT    | `/tasks/{id}`    | Update a task (title/desc/completed/priority) |
| DELETE | `/tasks/{id}`    | Delete a task                       |

**Query parameters for `GET /tasks`:**

| Param       | Type    | Description                         |
|-------------|---------|-------------------------------------|
| `completed` | boolean | Filter by `true` or `false`         |
| `priority`  | string  | Filter by `low`, `medium`, or `high`|
| `page`      | integer | Page number (default: 1)            |
| `per_page`  | integer | Items per page (default: 10, max: 100)|

**Create task body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "high"
}
```

**Update task body (all fields optional):**
```json
{
  "title": "Updated title",
  "completed": true,
  "priority": "low"
}
```

---

## ☁️ Deployment

### Backend → Render

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo.
4. Configure:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in the Render dashboard:
   - `SECRET_KEY` → generate a strong random string
   - `ALGORITHM` → `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES` → `30`
   - `DATABASE_URL` → `sqlite:///./taskmanager.db`
6. Click **Deploy**. Note your backend URL (e.g. `https://taskmanager-api.onrender.com`).

> The `render.yaml` file in the root can also be used for **Infrastructure as Code** deploys.

### Frontend → Vercel

1. Update `API_BASE` in `frontend/script.js` to your Render backend URL:
   ```js
   const API_BASE = 'https://taskmanager-api.onrender.com';
   ```
2. Go to [vercel.com](https://vercel.com) → **New Project**.
3. Import your GitHub repo.
4. Set **Root Directory** to `frontend`.
5. Framework preset: **Other** (static HTML).
6. Click **Deploy**.

---

## 🐳 Docker

```bash
# Build and run backend with Docker
cd task-manager
docker build -t taskmanager-api .
docker run -p 8000:8000 \
  -e SECRET_KEY=your-secret-here \
  taskmanager-api
```

---

## 🧪 Test Coverage

| Test File       | What's Tested                                     |
|-----------------|---------------------------------------------------|
| `test_auth.py`  | Registration, duplicate checks, login, bad creds  |
| `test_tasks.py` | CRUD, completion toggle, pagination, filtering, user isolation |

Run with coverage:
```bash
pip install pytest-cov
pytest tests/ -v --cov=app --cov-report=term-missing
```

---

## 🔐 Security Notes

- Passwords are hashed with **bcrypt** (passlib).
- JWTs are signed with HS256 and expire after 30 minutes.
- Users can only access **their own tasks** — enforced at the query level.
- Secrets are loaded from environment variables, never hardcoded.
- `.env` is excluded from version control via `.gitignore`.

---

## 🛠 Tech Stack

| Layer     | Technology                    |
|-----------|-------------------------------|
| Backend   | FastAPI, Python 3.11          |
| ORM       | SQLAlchemy 2.0                |
| Database  | SQLite (dev) / PostgreSQL (prod) |
| Auth      | JWT (python-jose), bcrypt (passlib) |
| Validation| Pydantic v2                   |
| Frontend  | HTML5, CSS3, Vanilla JS       |
| Tests     | Pytest, HTTPX                 |
| Deploy    | Render (backend), Vercel (frontend) |
