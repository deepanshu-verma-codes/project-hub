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

  setProjects: (projects) => set({ projects }),
  
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
tasks: [],
dashboardStats: null,
isLoading: false,

setProjects: (projects) => set({ projects }),

fetchProjects: async () => {
  try {
    const response = await fetch(`${API_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await response.json();

    set({ projects: data });

    // Auto-select first project if nothing is selected and we are in board view
    // Note: We might want to be careful here if we are on Dashboard
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
      
      // Update projects list and switch to the new project immediately
      set((state) => ({ 
        projects: [newProject, ...state.projects]
      }));
      
      await get().setActiveProject(newProject);
      
      return newProject;
    } catch (error) {
      console.error('Create project failed', error);
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
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(taskData)
      });
      
      if (!response.ok) throw new Error('Failed to create task');
      
      const data = await response.json();
      
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

  deleteTask: async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        set((state) => ({ tasks: state.tasks.filter(t => t._id !== taskId) }));
      }
    } catch (error) {
      console.error('Delete task failed', error);
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
  }
}));
