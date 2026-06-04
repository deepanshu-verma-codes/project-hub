import React, { useState, useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import ProjectModal from './ProjectModal';

const Sidebar = ({ activeView, onViewChange }) => {
  const { projects, activeProject, fetchProjects, setActiveProject, createProject } = useBoardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (projectData) => {
    await createProject(projectData);
    setIsModalOpen(false);
    onViewChange('board');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      window.location.reload();
    }
  };

  return (
    <>
      <div className="w-60 bg-[#2e2e2e] h-screen flex flex-col text-[#f5f5f5] shadow-xl z-20">
        {/* Sidebar Header */}
        <div className="p-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-inner">P</div>
          <h2 className="text-lg font-bold tracking-tight text-white">ProjectHub</h2>
        </div>

        <nav className="flex-1 overflow-y-auto mt-4">
          {/* Insights Section */}
          <div className="px-6 mb-4 flex items-center justify-between group">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Insights</span>
          </div>
          <div 
            onClick={() => {
              onViewChange('dashboard');
              setActiveProject(null);
            }}
            className={`asana-sidebar-item ml-2 mb-1 ${activeView === 'dashboard' ? 'active' : 'inactive'}`}
          >
            <span className="mr-3 text-lg">📊</span> <span className="text-sm">Dashboard</span>
          </div>
          <div 
            onClick={() => {
              onViewChange('notifications');
              setActiveProject(null);
            }}
            className={`asana-sidebar-item ml-2 mb-8 ${activeView === 'notifications' ? 'active' : 'inactive'}`}
          >
            <span className="mr-3 text-lg">🔔</span> <span className="text-sm">Notifications</span>
          </div>

          {/* Projects Section */}
          <div className="px-6 mb-3 flex items-center justify-between group">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Projects</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="text-gray-500 hover:text-white transition-all transform hover:scale-110 p-1"
              title="Add Project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="space-y-0.5 px-2">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => {
                    setActiveProject(project);
                    onViewChange('board');
                  }}
                  className={`asana-sidebar-item !rounded-md ${
                    activeProject?._id === project._id && activeView === 'board'
                      ? 'active !bg-blue-600/20 !text-blue-400 !border-l-4 !border-blue-500' 
                      : 'inactive'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-3 ${activeProject?._id === project._id && activeView === 'board' ? 'bg-blue-400' : 'bg-gray-600'}`}></span>
                  <span className="truncate text-sm font-medium">{project.name}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-gray-500 italic">No projects yet</div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#3d3d3d] bg-[#2a2a2a]">
          <div className="flex items-center space-x-3 px-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 flex items-center justify-center text-xs font-extrabold text-white shadow-lg">DV</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-200">Deepanshu</p>
              <p className="text-[10px] text-gray-500 font-medium">Free Workspace</p>
            </div>
            <button 
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#3d3d3d] rounded-md text-gray-400 hover:text-red-400 transition-all"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleCreateProject} 
      />
    </>
  );
};

export default Sidebar;
