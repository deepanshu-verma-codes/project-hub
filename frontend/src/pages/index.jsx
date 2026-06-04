import React, { useState, useEffect } from 'react';
import TaskBoard from '../components/TaskBoard';
import Login from '../components/Login';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import { useBoardStore } from '../store/useBoardStore';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [view, setView] = useState('board');
  const { activeProject, setActiveProject } = useBoardStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar activeView={view} onViewChange={setView} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-3 flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-400 text-sm font-medium">
              <span 
                onClick={() => setActiveProject(null)}
                className="hover:text-gray-900 cursor-pointer transition-colors"
              >
                Workspace
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-bold tracking-tight">{activeProject?.name || 'Home'}</span>
            </div>
            {activeProject && (
              <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest">
                Active
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Searching for: ${e.target.search.value}`);
              }}
              className="relative group"
            >
              <input 
                name="search"
                type="text" 
                placeholder="Search everything..." 
                className="bg-gray-50 border border-transparent group-hover:border-gray-200 focus:border-blue-500 rounded-full py-1.5 px-4 text-xs w-64 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:bg-white transition-all duration-300"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
            
            <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>

            <button 
              onClick={() => {
                localStorage.removeItem('token');
                setIsLoggedIn(false);
              }}
              className="text-[10px] font-extrabold text-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden relative">
          {view === 'dashboard' ? (
            <Dashboard />
          ) : view === 'notifications' ? (
            <div className="flex flex-col items-center justify-center h-full bg-[#fcfcfc] text-center p-8">
               <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center text-3xl mb-4">🔔</div>
               <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
               <p className="text-gray-400 text-sm max-w-xs mt-2">No new updates right now. We'll let you know when something happens!</p>
            </div>
          ) : activeProject ? (
            <TaskBoard key={activeProject._id} projectId={activeProject._id} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-[#fcfcfc] space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-gray-50 transform -rotate-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-12 border-4 border-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome to ProjectHub</h3>
                <p className="text-gray-400 text-sm max-w-xs leading-relaxed">Select a project from the sidebar or create a new one to start managing your tasks.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
