# ProjectHub: Planning & Design Document

## 1. Executive Summary
ProjectHub is a real-time, collaborative project management application designed to provide teams with a centralized workspace for task tracking, project insights, and seamless communication. The application is built as a Single Page Application (SPA) using a modern, decoupled architecture.

## 2. Technology Stack & Architecture

### 2.1 Core Stack (MERN+)
*   **Frontend:** React (Next.js 13+ App/Pages Router), TailwindCSS for styling.
*   **Backend:** Node.js with Express.js framework.
*   **Database:** MongoDB (via Mongoose ODM) for persistent storage.
*   **Real-time Engine:** Socket.IO integrated with a Redis adapter for scalable pub/sub messaging.

### 2.2 Global State Management
*   **Zustand:** Chosen for its lightweight, unopinionated approach to state management on the frontend. It centralizes projects, tasks, user metadata, and system notifications without the boilerplate of Redux.

## 3. Infrastructure & Deployment Strategy

The application employs a decoupled deployment model prioritizing developer velocity and edge performance:

*   **Frontend Deployment (Vercel):** The Next.js frontend is deployed on Vercel to leverage its Global Edge Network, providing optimized static asset delivery and native Next.js API routing capabilities if needed.
*   **Backend Deployment (Render):** The Express server runs as a Web Service on Render, allowing for easy environment configuration and robust continuous deployment.
*   **Database (MongoDB Atlas):** Fully managed cloud database ensuring high availability and automated backups.
*   **Message Broker (Redis/Upstash):** Handles Socket.IO clustering and room distribution, essential for horizontal scaling if the backend is scaled to multiple instances.

## 4. Frontend Design & UI/UX

### 4.1 Routing Strategy
The frontend utilizes a dynamic Next.js catch-all route (`[[...slug]].jsx`). This enables a fluid SPA experience where URL changes (e.g., `/dashboard`, `/admin`, `/project/[id]`) drive state and view updates without causing full page reloads.

### 4.2 Component Architecture
*   **Sidebar Navigation:** Centralized routing hub. Context-aware (highlights active project/view) and dynamically renders an `Admin Panel` strictly for authorized users.
*   **TaskBoard:** A kanban-style interface for task management within a specific project.
*   **Dashboard:** Provides analytical insights and data visualization for workspace performance.
*   **ToastContainer & Modals:** Provides non-intrusive, transient feedback for user actions (e.g., project creation, deletions, errors).

### 4.3 User Experience (UX) Enhancements
*   **Optimistic UI Updates:** Used in task status changes (`updateLocalTaskStatus`) to make the interface feel instantaneous before the server confirms the change.
*   **Loading States:** Explicit loading spinners and disabled buttons during destructive actions (like `deleteProject`) prevent race conditions and reassure the user.

## 5. Backend Architecture & Security

### 5.1 RESTful API Layers
The Express application is strictly structured into modular routes and controllers:
*   `authRoutes`: User login and token generation.
*   `userRoutes`: Admin-exclusive endpoints for managing the team directory.
*   `projectRoutes` & `taskRoutes`: Core CRUD operations for workspace entities.
*   `notificationRoutes`: Fetching historical activity logs.

### 5.2 Authentication & Authorization
*   **JWT (JSON Web Tokens):** Used for stateless, secure authentication. Tokens are passed via the `Authorization: Bearer <token>` header.
*   **Role-Based Access Control (RBAC):** 
    *   Specific endpoints (like `/api/users`) utilize an `adminOnly` middleware to restrict access.
    *   The frontend interprets the decoded user role to toggle UI elements (e.g., the Admin Panel tab).

### 5.3 Real-time Data Synchronization
Socket.IO is heavily integrated to ensure all connected clients see updates instantly.
*   **Connection Strategy:** Clients authenticate their socket connection using their JWT.
*   **Room Strategy:** Clients join a global `workspace` room, a private `user:[id]` room, and specific `project:[id]` rooms.
*   **Event Emitters:** When a REST API endpoint modifies a task or project, the controller emits an event (e.g., `task:created`, `task:updated`) specifically to that project's room, minimizing unnecessary network traffic to unrelated clients.

## 6. Development Workflow & CI/CD
*   **Monorepo Structure:** Both `frontend` and `backend` reside in a single repository for easier coordination.
*   **Environment Parity:** `package-lock.json` configurations have been explicitly patched to include platform-specific SWC binaries (Linux) to ensure local development environments match the Vercel/Render build environments natively.
*   **CORS Configuration:** The backend utilizes dynamic origin reflection to securely accept API and WebSocket requests from unpredictable Vercel Preview URLs alongside the primary production domain.
