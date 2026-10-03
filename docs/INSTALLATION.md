# YOLO × FluxQ: Installation & Environment Setup Guide

## 1. System Requirements

### Hardware:
- **Processor:** 64-bit x86_64 or ARM64 multi-core CPU (4+ physical cores recommended).
- **RAM:** 8 GB minimum (16 GB recommended for concurrent backend + frontend + simulation).
- **Storage:** 5 GB free disk space.
- **Operating Systems:** Windows 10/11, macOS (Apple Silicon or Intel), Ubuntu 22.04+ LTS.

### Software Runtimes:
- **Python:** 3.12.0 or higher.
- **Node.js:** v20.0.0 or higher (Active LTS).
- **npm:** v10.0.0 or higher.
- **Docker & Docker Compose (Optional):** Docker Desktop 4.25+ / Engine 24.0+.

---

## 2. Local Bare-Metal Setup

### Step 1: Clone Repository & Create Virtual Environment
```bash
git clone https://github.com/your-org/yolo-fluxq.git
cd yolo-fluxq

# Create and activate Python virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate
```

### Step 2: Install Backend Dependencies
```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 4: Configure Environment Variables
```bash
cp .env.example .env
```
*(Default settings configure SQLite database and local ports 8000 and 5173).*

---

## 3. Running the Application

### Option A: Local Development Mode (Two Terminals)

**Terminal 1 — Backend API Server:**
```powershell
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

**Terminal 2 — Frontend Operations Dashboard:**
```powershell
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

### Option B: Docker Compose Deployment

To build and start the fully containerized application stack:
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`

To stop:
```bash
docker-compose down
```

---

## 4. Verification & Testing

Execute the complete automated test suite:
```powershell
python -m pytest backend/tests/ tests/end_to_end/
```
Expected output: **15 passed** in under 10 seconds.
