import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TaskBoard from '../components/TaskBoard';
import Login from '../components/Login';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import ToastContainer from '../components/ToastContainer';
import { useBoardStore } from '../store/useBoardStore';
import { 
  HiOutlineCheck, 
  HiOutlineExclamation, 
  HiOutlineInformationCircle, 
  HiOutlineInbox, 
  HiOutlineSearch, 
  HiOutlineFolder, 
  HiOutlineCheckCircle, 
  HiOutlineChartPie, 
  HiOutlineFlag,
  HiOutlineLogout,
  HiChevronRight,
  HiMenu
} from 'react-icons/hi';

export default function Home() {
  const router = useRouter();
  const { slug } = router.query;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [view, setView] = useState('board');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    addNotification, 
    performSearch, 
    searchResults, 
    isLoading, 
    activityLog,
    fetchProjects
  } = useBoardStore();

  // Authentication and Hydration
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchProjects(); 
    }
    setIsHydrated(true);

    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Routing Logic: Sync View with URL
  useEffect(() => {
    if (!router.isReady || !isLoggedIn) return;

    if (!slug || slug.length === 0) {
      setView('board');
      setActiveProject(null);
    } else if (slug[0] === 'dashboard') {
      setView('dashboard');
      setActiveProject(null);
    } else if (slug[0] === 'notifications') {
      setView('notifications');
      setActiveProject(null);
    } else if (slug[0] === 'search') {
      setView('search');
      setActiveProject(null);
    } else if (slug[0] === 'project' && slug[1]) {
      const projectId = slug[1];
      const project = projects.find(p => p._id === projectId);
      if (project) {
        if (activeProject?._id !== project._id) {
          setActiveProject(project);
        }
        setView('board');
      } else if (projects.length > 0) {
        router.push('/', undefined, { shallow: true });
      }
    }
  }, [slug, router.isReady, isLoggedIn, projects.length]);

  const handleViewChange = (newView) => {
    setView(newView);
    
    if (newView === 'dashboard') router.push('/dashboard', undefined, { shallow: true });
    else if (newView === 'notifications') router.push('/notifications', undefined, { shallow: true });
    else if (newView === 'search') router.push('/search', undefined, { shallow: true });
    else if (newView === 'board') {
      if (activeProject) router.push(`/project/${activeProject._id}`, undefined, { shallow: true });
      else router.push('/', undefined, { shallow: true });
    }

    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (activeProject && router.isReady) {
      const currentPath = `/project/${activeProject._id}`;
      if (router.asPath !== currentPath) {
        router.push(currentPath, undefined, { shallow: true });
      }
    }
  }, [activeProject]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleViewChange('search');
      performSearch(searchQuery);
    }
  };

  if (!isHydrated) return null;

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-20 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-60' : 'w-0'} overflow-hidden lg:relative absolute z-30 h-full shadow-2xl lg:shadow-none`}>
        <Sidebar activeView={view} onViewChange={handleViewChange} />
      </div>
      <ToastContainer />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-8 py-3 flex justify-between items-center z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-2 text-gray-500"
            >
              <HiMenu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 text-gray-400 text-sm font-medium">
              <span 
                onClick={() => handleViewChange('board')}
                className="hover:text-gray-900 cursor-pointer transition-colors"
              >
                Workspace
              </span>
              <HiChevronRight className="h-3 w-3" />
              <span className="text-gray-900 font-bold tracking-tight">
                {activeProject?.name || (
                  view === 'search' ? 'Search Results' : 
                  view === 'dashboard' ? 'Dashboard' : 
                  view === 'notifications' ? 'Notifications' : 
                  'Home'
                )}
              </span>
            </div>
            {activeProject && (
              <div className="flex items-center space-x-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest">
                Active
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative group">
              <input 
                name="search"
                type="text" 
                placeholder="Search projects or tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-transparent group-hover:border-gray-200 focus:border-blue-500 rounded-full py-1.5 px-4 text-xs w-64 focus:outline-none focus:ring-4 focus:ring-blue-50/50 focus:bg-white transition-all duration-300"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-gray-400">
                <HiOutlineSearch className="h-4 w-4" />
              </button>
            </form>
            <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setIsLoggedIn(false);
                  router.push('/');
                }
              }}
              className="text-[10px] font-extrabold text-gray-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center"
            >
              <HiOutlineLogout className="h-4 w-4 mr-1.5" />
              Logout
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden relative">
          {view === 'dashboard' ? (
            <Dashboard />
          ) : view === 'notifications' ? (
            <div className="flex-1 h-full overflow-y-auto bg-white p-8 animate-in fade-in duration-500">
              <div className="max-w-3xl mx-auto">
                <header className="mb-12 flex items-end justify-between">
                  <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Inbox</h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">Check recent updates and project activity.</p>
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pb-1">
                    {activityLog.length} UPDATES
                  </div>
                </header>

                {activityLog.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100"></div>
                    <div className="space-y-8">
                      {activityLog.map((log, index) => {
                        const date = new Date(log.timestamp);
                        const isToday = new Date().toDateString() === date.toDateString();
                        return (
                          <div key={log.id} className="relative pl-12 group animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className={`absolute left-0 top-4 w-10 h-10 rounded-xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 group-hover:rotate-3 ${
                              log.type === 'success' ? 'bg-emerald-500' :
                              log.type === 'warning' ? 'bg-amber-500' :
                              'bg-blue-500'
                            }`}>
                              {log.type === 'success' ? (
                                <HiOutlineCheck className="w-5 h-5 text-white stroke-[3]" />
                              ) : log.type === 'warning' ? (
                                <HiOutlineExclamation className="w-5 h-5 text-white stroke-[3]" />
                              ) : (
                                <HiOutlineInformationCircle className="w-5 h-5 text-white stroke-[3]" />
                              )}
                            </div>
                            <div className="flex flex-col bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                                  log.type === 'success' ? 'text-emerald-600' :
                                  log.type === 'warning' ? 'text-amber-600' :
                                  'text-blue-600'
                                }`}>
                                  {log.type === 'success' ? 'Completed' : log.type === 'warning' ? 'Attention' : 'Update'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                  {isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 font-medium leading-relaxed group-hover:text-gray-900 transition-colors">
                                {log.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-6">
                      <HiOutlineInbox className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Your inbox is empty</h3>
                    <p className="text-gray-500 text-sm max-w-xs mt-2">When things happen in your projects, you'll see them here.</p>
                  </div>
                )}
              </div>
            </div>
          ) : view === 'search' ? (
            <div className="flex-1 overflow-y-auto bg-[#fcfcfc] p-8 animate-in fade-in duration-500">
              <div className="max-w-4xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Search Results</h1>
                    <p className="text-sm text-gray-500 font-medium">Found {searchResults.projects.length} projects and {searchResults.tasks.length} tasks for "{searchQuery}"</p>
                  </div>
                  <button 
                    onClick={() => {
                      handleViewChange('board');
                      setSearchQuery('');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                  >
                    Clear Search
                  </button>
                </header>

                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {searchResults.projects.length > 0 && (
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                          <div className="w-6 h-6 rounded bg-blue-50 text-blue-500 flex items-center justify-center mr-2">
                            <HiOutlineFolder className="h-3.5 w-3.5" />
                          </div> 
                          Projects
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {searchResults.projects.map(p => (
                            <div 
                              key={p._id} 
                              onClick={() => {
                                setActiveProject(p);
                                handleViewChange('board');
                                setSearchQuery('');
                              }}
                              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{p.name}</h4>
                                <span className="text-[9px] px-2 py-0.5 bg-gray-50 text-gray-400 rounded-full font-bold uppercase">{p.visibility}</span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{p.description || 'No description'}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {searchResults.tasks.length > 0 && (
                      <section>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                          <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-500 flex items-center justify-center mr-2">
                            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                          </div> 
                          Tasks
                        </h3>
                        <div className="space-y-3">
                          {searchResults.tasks.map(t => (
                            <div 
                              key={t._id} 
                              onClick={async () => {
                                const parent = projects.find(p => p._id === t.projectId);
                                if (parent) await setActiveProject(parent);
                                handleViewChange('board');
                                setSearchQuery('');
                              }}
                              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-4 min-w-0">
                                <div className={`w-2 h-2 rounded-full ${
                                  t.priority === 'high' ? 'bg-red-500' :
                                  t.priority === 'medium' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}></div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 truncate transition-colors">{t.title}</h4>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-[10px] text-gray-400 font-medium">in {projects.find(p => p._id === t.projectId)?.name || 'Project'}</p>
                                    <span className="text-[10px] text-gray-300">•</span>
                                    <p className="text-[10px] text-gray-400 font-medium italic">{new Date(t.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  t.priority === 'high' ? 'bg-red-50 text-red-600' :
                                  t.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                  'bg-green-50 text-green-600'
                                }`}>
                                  {t.priority || 'medium'}
                                </span>
                                <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold uppercase">{t.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeProject ? (
            <TaskBoard key={activeProject._id} projectId={activeProject._id} />
          ) : (
            <div className="flex-1 overflow-y-auto bg-[#fcfcfc] p-12 animate-in fade-in duration-700">
              <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">Workspace</span>
                  </div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
                    Good day, <span className="text-blue-600">{isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}').name : 'Friend'}</span>!
                  </h1>
                  <p className="text-gray-500 text-lg font-medium max-w-2xl">
                    Welcome back to your productivity hub. Ready to crush some goals today? Select a project or start something new.
                  </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div 
                    onClick={() => handleViewChange('dashboard')}
                    className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg shadow-blue-200">
                      <HiOutlineChartPie className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2">View Insights</h3>
                    <p className="text-gray-400 text-sm leading-relaxed font-medium">Check your workspace performance and statistics.</p>
                  </div>

                  <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-orange-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg shadow-orange-200">
                      <HiOutlineFlag className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-800 mb-2">Browse Projects</h3>
                    <p className="text-gray-400 text-sm leading-relaxed font-medium">Jump into your active projects in the sidebar.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
