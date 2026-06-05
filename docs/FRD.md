# Functional Requirement Document (FRD)

## Project: Internal Project Management System (ProjectHub)
**Version:** 1.0.0  
**Date:** June 5, 2026

---

### 1. Introduction
ProjectHub is a real-time, collaborative project management platform designed for growing companies. It aims to solve the challenge of instantaneous state synchronization across multiple users working on the same tasks and projects.

### 2. Core Features
#### 2.1 User Authentication
- **Secure Login:** Users must authenticate using email and password.
- **JWT Authorization:** All API requests and WebSocket connections are secured via JSON Web Tokens.
- **Auto-Logout:** The system automatically logs users out if their session token expires or is invalid.

#### 2.2 Project Management
- **Workspace Dashboard:** High-level overview of project metrics and performance.
- **Project CRUD:** Authorized users can create, read, update, and delete projects.
- **Visibility Control:** Support for Public (workspace-wide) and Private (owner-only) projects.

#### 2.3 Collaborative Kanban Board
- **Real-Time Task Sync:** Instant updates when any user moves, edits, or adds a task.
- **Task Attributes:** Support for titles, descriptions, priorities (Low, Medium, High), external resource links, and image attachments.
- **Drag-and-Drop:** Intuitive interface for moving tasks between Todo, In Progress, Review, and Done columns.

#### 2.4 Notifications & Activity Log
- **Inbox:** A persistent feed of all workspace activity with timestamps.
- **Live Toasts:** Immediate UI feedback for successful actions or teammate updates.

#### 2.5 Global Search
- **Unified Search:** Search bar to locate specific projects or tasks across the entire workspace.

### 3. User Roles & Permissions
- **Admin:** Full access to manage all projects, tasks, and system settings.
- **Owner:** The user who created a project. Has full management rights over that specific project and its tasks.
- **Member:** Can view public projects and tasks. Can participate in collaborative boards but cannot delete projects they do not own.

### 4. Assumptions
- **Modern Browsers:** Users are expected to use evergreen browsers with full WebSocket support.
- **Stable Internet:** While optimistic UI handles minor drops, a stable connection is assumed for real-time consistency.
- **Low Image Payload:** Users will upload optimized images; the system handles further compression for storage efficiency.

### 5. Out-of-Scope Items
- **User Registration:** In this internal-only version, users are assumed to be pre-provisioned or managed via seed scripts.
- **Direct Messaging:** Live chat between users is not part of this MVP.
- **Time Tracking:** Granular logging of hours spent on tasks.
- **Third-Party Integrations:** No current support for Slack, GitHub, or Jira syncing.
