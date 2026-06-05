# Internal Project Management System

A production-grade, real-time Internal Project Management System featuring isolated workspaces, collaborative Kanban boards, and real-time synchronization.

## 🏛️ High-Level Architecture Overview

This project implements a **Micro-monolith backend** designed to scale horizontally while ensuring state consistency across instances via a robust Pub/Sub event bus.

*   **Backend:** Node.js (Express), MongoDB (Mongoose), Socket.IO.
*   **Frontend:** React/Next.js Single Page Application, Zustand.
*   **Infrastructure:** Nginx reverse proxy, Redis Pub/Sub adapter, GitHub Actions CI/CD.

## ⚙️ System Design Trade-offs & Caching Logic

*   **Zustand over Redux/Context:** Selected for its ultra-lightweight footprint and optimized selector-based rendering. It prevents full Kanban board re-renders during high-frequency WebSocket updates.
*   **Redis Pub/Sub Layer:** As the Node application scales across multiple instances, standard WebSockets fail to broadcast to clients connected to different nodes. Redis Pub/Sub intercepts all `emit` calls and relays them across the cluster.
*   **Optimistic UI:** To provide a snappy "drag and drop" experience, task transitions immediately update local UI states (`updateLocalTaskStatus`) before receiving the `200 OK` response from the backend. Network drops automatically rollback state.

## 📡 Structured API Endpoint Map

| Method | Path | Description | Validation | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate User | `email`, `password` | `{ token, user }` |
| `GET` | `/api/projects` | Fetch assigned projects | `Bearer Token` | `Project[]` |
| `GET` | `/api/projects/:id/tasks` | Fetch project tasks | `Bearer Token` | `Task[]` |
| `PUT` | `/api/tasks/:id/status` | Update task status | `status` (Enum), `projectId` | `Task` |

## 🔌 WebSocket System Event Directory

The system leverages explicit room connections based on `projectId` to securely isolate notification streams.

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `room:join` | Client -> Server | `projectId: string` | Registers the socket into the specific project room. |
| `room:leave` | Client -> Server | `projectId: string` | Deregisters the socket from the project room. |
| `task:updated` | Server -> Client | `Task object` | Broadcasted when a task transitions states (e.g., Todo -> In Progress). Handled globally via `useSocket` and updates Zustand directly. |

## 🛠️ Local Developer Environment Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   **Node.js** (v18.x+)
*   **MongoDB** (Local instance or Atlas URI)
*   **Redis** (Local instance running on port 6379)

### 2. Environment Configuration
Create `.env` files in both the `backend/` and `frontend/` directories.

**`backend/.env`**
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/pm-system
REDIS_URI=redis://127.0.0.1:6379
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:3000
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

### 3. Database Indexing
The MongoDB schemas rely heavily on indexes for fast queries against `email`, `projectId`, and `status`. Mongoose will automatically generate these on boot in the development environment. For production, execute:
```bash
node -e "require('./backend/src/config/db')().then(() => require('mongoose').syncIndexes())"
```

### 4. Initialization Scripts
```bash
# Start Backend
cd backend
npm install
npm run dev # Runs nodemon on app.js

# Start Frontend
cd frontend
npm install
npm run dev # Runs next dev or vite
```

## 🚀 Deployment Strategy

The application is architected for automated deployment via **GitHub Actions**.

### 1. Infrastructure Setup
- **Server:** Ubuntu 22.04 VM (DigitalOcean/Hetzner).
- **Reverse Proxy:** Nginx configured to handle SSL termination and WebSocket protocol upgrades.
- **Process Manager:** PM2 for keeping the Node.js backend alive.
- **SSL:** Let's Encrypt certificates managed via `certbot`.

### 2. Deployment Steps
1. Push changes to the `main` branch.
2. GitHub Actions triggers the `Production Deployment Pipeline`.
3. Pipeline executes linting, unit testing, and frontend build.
4. On success, the pipeline connects to the VM via SSH.
5. Code is pulled, dependencies are installed, and PM2 restarts the backend cluster.
6. Nginx configuration is reloaded to ensure routing remains current.

## 🌿 Git Branching Strategy

We followed a **Feature Branching / GitHub Flow** model:
- `main`: Production-ready code only.
- `feature/*`: Granular branches for specific tasks (e.g., `feature/notifications`, `feature/routing`).
- Every Pull Request requires a successful build from the CI pipeline before merging.

## 🔗 Live Application URLs

- **Frontend:** [https://project-hub-2qorhmb8u-deepanshu-vermas-projects-fcfba96b.vercel.app/](https://project-hub-2qorhmb8u-deepanshu-vermas-projects-fcfba96b.vercel.app/)
- **Backend API:** [https://project-hub-backend-1ktv.onrender.com](https://project-hub-backend-1ktv.onrender.com)

## 🤖 AI Usage Declaration

This project leveraged AI assistants (Gemini CLI) for:
- **Boilerplate Generation:** Initializing Express routes and Mongoose models.
- **Refactoring:** Converting circular icons to rounded-rectangular SVG containers.
- **Documentation:** Drafting the formal FRD and System Design based on the implementation logic.
- **Bug Fixing:** Debugging Next.js dynamic routing syntax errors.

