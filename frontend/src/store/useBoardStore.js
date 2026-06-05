import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Global State Management (Zustand)
 * Optimized for Trello/Jira-style lifecycle management.
 */
export const useBoardStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  tasks: [],
  isLoading: false,
  notifications: [],
  activityLog: [],
  searchResults: { projects: [], tasks: [] },
  dashboardStats: null,
  users: [],

  setProjects: (projects) => set({ projects }),

  fetchUsers: async () => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      set({ users: data });
    } catch (error) {
      console.error('Fetch users failed', error);
    }
  },

  createUser: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      if (response.ok) {
        const newUser = await response.json();
        set((state) => ({ users: [...state.users, newUser] }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Create user failed', error);
      return false;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        set((state) => ({ users: state.users.filter((u) => u._id !== userId) }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete user failed', error);
      return false;
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      // Map backend notification to frontend activity log format
      const mappedNotifications = data.map(n => ({
        id: n._id,
        message: n.message,
        type: n.type,
        timestamp: new Date(n.createdAt)
      }));
      set({ activityLog: mappedNotifications });
    } catch (error) {
      console.error('Fetch notifications failed', error);
    }
  },

  recordActivity: (message, type = 'info') => {
    const id = Date.now();
    set((state) => ({ 
      activityLog: [{ id, message, type, timestamp: new Date() }, ...state.activityLog].slice(0, 50) 
    }));
  },
  
  performSearch: async (query) => {
    if (!query.trim()) {
      set({ searchResults: { projects: [], tasks: [] } });
      return;
    }

    set({ isLoading: true });
    try {
      // Local filtering of projects for speed
      const filteredProjects = get().projects.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
      );

      // Fetch tasks from server that match query (as we don't have all tasks loaded globally)
      const response = await fetch(`${API_URL}/tasks/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const filteredTasks = await response.json();

      set({ 
        searchResults: { projects: filteredProjects, tasks: filteredTasks },
        isLoading: false 
      });
    } catch (error) {
      console.error('Search failed', error);
      set({ isLoading: false });
    }
  },
  
  addNotification: (message, type = 'info') => {
    const id = Date.now();
    set((state) => ({ 
      notifications: [...state.notifications, { id, message, type }] 
    }));
    setTimeout(() => {
      set((state) => ({ 
        notifications: state.notifications.filter(n => n.id !== id) 
      }));
    }, 4000);
  },

  removeNotification: (id) => {
    set((state) => ({ 
      notifications: state.notifications.filter(n => n.id !== id) 
    }));
  },
  
  /**
   * Sets the active project and immediately triggers a task fetch.
   */
  setActiveProject: async (project) => {
    set({ activeProject: project, tasks: [] });
    if (project) {
      await get().fetchTasks(project._id);
    }
  },

  setTasks: (tasks) => set({ tasks }),

  fetchProjects: async () => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      set({ projects: data });
    } catch (error) {
      console.error('Fetch projects failed', error);
    }
  },

  fetchDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/analytics/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      set({ dashboardStats: data, isLoading: false });
    } catch (error) {
      console.error('Fetch dashboard stats failed', error);
      set({ isLoading: false });
    }
  },

  /**
   * Creates a new project and automatically makes it the active one.
   */
  createProject: async (projectData) => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      
      const newProject = await response.json();
      get().recordActivity(`You created a new project: "${newProject.name}"`, 'success');
      
      // Update projects list and switch to the new project immediately
      set((state) => {
        if (state.projects.find(p => p._id === newProject._id)) return state;
        return { projects: [newProject, ...state.projects] };
      });
      
      await get().setActiveProject(newProject);
      
      // Refresh stats if they exist
      if (get().dashboardStats) {
        await get().fetchDashboardStats();
      }

      return newProject;
    } catch (error) {
      console.error('Create project failed', error);
    }
  },

  updateProject: async (projectId, projectData) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) throw new Error('Failed to update project');
      
      const updatedProject = await response.json();
      get().recordActivity(`You updated project: "${updatedProject.name}"`, 'info');
      
      set((state) => ({
        projects: state.projects.map(p => p._id === projectId ? updatedProject : p),
        activeProject: state.activeProject?._id === projectId ? updatedProject : state.activeProject
      }));

      return updatedProject;
    } catch (error) {
      console.error('Update project failed', error);
    }
  },

  /**
   * Fetches tasks for a specific project.
   */
  fetchTasks: async (projectId) => {
    if (!projectId) return;
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/tasks?projectId=${projectId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      set({ tasks: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error) {
      console.error('Fetch tasks failed', error);
      set({ tasks: [], isLoading: false });
    }
  },

  createTask: async (taskData) => {
    try {
      const isFormData = taskData instanceof FormData;
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers,
        body: isFormData ? taskData : JSON.stringify(taskData)
      });
      
      if (!response.ok) throw new Error('Failed to create task');
      
      const data = await response.json();
      get().recordActivity(`You created task: "${data.title}"`, 'success');
      
      // Ensure the task belongs to the active project before adding to UI
      if (data.projectId === get().activeProject?._id) {
        set((state) => {
          if (state.tasks.find(t => t._id === data._id)) return state;
          return { tasks: [...state.tasks, data] };
        });
      }
    } catch (error) {
      console.error('Create task failed', error);
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const isFormData = taskData instanceof FormData;
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers,
        body: isFormData ? taskData : JSON.stringify(taskData)
      });
      
      if (!response.ok) throw new Error('Failed to update task');
      
      const updatedTask = await response.json();
      get().recordActivity(`You updated task: "${updatedTask.title}"`, 'info');
      
      set((state) => ({
        tasks: state.tasks.map(t => t._id === taskId ? updatedTask : t)
      }));

      return updatedTask;
    } catch (error) {
      console.error('Update task failed', error);
    }
  },

  deleteTask: async (taskId) => {
    try {
      const taskToDelete = get().tasks.find(t => t._id === taskId);
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        get().recordActivity(`You deleted task: "${taskToDelete?.title || 'Unknown Task'}"`, 'warning');
        set((state) => ({ tasks: state.tasks.filter(t => t._id !== taskId) }));
      }
    } catch (error) {
      console.error('Delete task failed', error);
    }
  },

  deleteProject: async (projectId) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete project');
      
      const projectToDelete = get().projects.find(p => p._id === projectId);
      get().recordActivity(`You deleted project: "${projectToDelete?.name || 'Unknown Project'}"`, 'warning');

      set((state) => {
        const newProjects = state.projects.filter(p => p._id !== projectId);
        const isActiveDeleted = state.activeProject?._id === projectId;
        
        return {
          projects: newProjects,
          activeProject: isActiveDeleted ? null : state.activeProject,
          tasks: isActiveDeleted ? [] : state.tasks
        };
      });

      // Refresh stats if they exist
      if (get().dashboardStats) {
        await get().fetchDashboardStats();
      }
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Delete project failed', error);
      set({ isLoading: false });
      return false;
    }
  },

  updateLocalTaskStatus: async (taskId, newStatus, projectId) => {
    const previousTasks = get().tasks;
    
    // 1. Optimistic Update
    set((state) => ({
      tasks: state.tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
    }));

    try {
      // 2. Persist
      const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus, projectId })
      });
      if (!response.ok) throw new Error('Update failed');
    } catch (error) {
      // 3. Rollback
      set({ tasks: previousTasks });
    }
  },

  onTaskUpdatedByPeer: (updatedTask) => {
    const { activeProject } = get();
    if (updatedTask.projectId === activeProject?._id) {
      set((state) => ({
        tasks: state.tasks.map(t => t._id === updatedTask._id ? updatedTask : t)
      }));
    }
  },

  onTaskCreatedByPeer: (newTask) => {
    const { activeProject } = get();
    if (newTask.projectId === activeProject?._id) {
      set((state) => {
        if (state.tasks.find(t => t._id === newTask._id)) return state;
        return { tasks: [...state.tasks, newTask] };
      });
    }
  },

  onTaskDeletedByPeer: (taskId) => {
    set((state) => ({ tasks: state.tasks.filter(t => t._id !== taskId) }));
  },

  onProjectCreatedByPeer: (newProject) => {
    set((state) => {
      if (state.projects.find(p => p._id === newProject._id)) return state;
      return { projects: [newProject, ...state.projects] };
    });
    // Refresh stats if they exist
    if (get().dashboardStats) {
      get().fetchDashboardStats();
    }
  },

  onProjectUpdatedByPeer: (updatedProject) => {
    set((state) => ({
      projects: state.projects.map(p => p._id === updatedProject._id ? updatedProject : p),
      activeProject: state.activeProject?._id === updatedProject._id ? updatedProject : state.activeProject
    }));
  },

  onProjectDeletedByPeer: (projectId) => {
    set((state) => {
      const newProjects = state.projects.filter(p => p._id !== projectId);
      const isActiveDeleted = state.activeProject?._id === projectId;
      
      return {
        projects: newProjects,
        activeProject: isActiveDeleted ? null : state.activeProject,
        tasks: isActiveDeleted ? [] : state.tasks
      };
    });
    // Refresh stats if they exist
    if (get().dashboardStats) {
      get().fetchDashboardStats();
    }
  }
}));
