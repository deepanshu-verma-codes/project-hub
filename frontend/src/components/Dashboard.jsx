import React, { useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';

const Dashboard = () => {
  const { dashboardStats, fetchDashboardStats, isLoading } = useBoardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (isLoading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-400">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardStats || {
    totalProjects: 0,
    totalTasks: 0,
    taskStatusDistribution: { Todo: 0, 'In Progress': 0, Review: 0, Done: 0 },
    recentProjects: []
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#fcfcfc] animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Workspace Insights</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Overview of your projects and task performance.</p>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Projects" 
            value={stats.totalProjects} 
            icon="📁" 
            color="blue"
          />
          <StatCard 
            title="Total Tasks" 
            value={stats.totalTasks} 
            icon="✅" 
            color="green"
          />
          <StatCard 
            title="Tasks Done" 
            value={stats.taskStatusDistribution.Done} 
            icon="🏆" 
            color="orange"
          />
          <StatCard 
            title="Completion Rate" 
            value={stats.totalTasks ? `${Math.round((stats.taskStatusDistribution.Done / stats.totalTasks) * 100)}%` : '0%'} 
            icon="📈" 
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Distribution */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-2">📊</span> Task Distribution
            </h3>
            <div className="space-y-6">
              <ProgressBar label="Todo" value={stats.taskStatusDistribution.Todo} max={stats.totalTasks} color="bg-gray-400" />
              <ProgressBar label="In Progress" value={stats.taskStatusDistribution['In Progress']} max={stats.totalTasks} color="bg-blue-400" />
              <ProgressBar label="Review" value={stats.taskStatusDistribution.Review} max={stats.totalTasks} color="bg-yellow-400" />
              <ProgressBar label="Done" value={stats.taskStatusDistribution.Done} max={stats.totalTasks} color="bg-green-500" />
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-2">🕒</span> Recent Projects
            </h3>
            <div className="space-y-4">
              {stats.recentProjects.length > 0 ? (
                stats.recentProjects.map((p) => (
                  <div key={p.id} className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.visibility}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 italic">No projects found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:-translate-y-1">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 ${colorMap[color] || 'bg-gray-50'}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</h4>
    </div>
  );
};

const ProgressBar = ({ label, value, max, color }) => {
  const percentage = max ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold text-gray-600">{label}</span>
        <span className="text-xs font-extrabold text-gray-900">{value} <span className="text-[10px] text-gray-400 font-medium ml-1">tasks</span></span>
      </div>
      <div className="w-full h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
