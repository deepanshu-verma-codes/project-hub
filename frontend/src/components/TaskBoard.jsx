import React, { useState } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { useSocket } from '../hooks/useSocket';

const COLUMNS = [
  { id: 'Todo', color: 'bg-gray-400' },
  { id: 'In Progress', color: 'bg-blue-400' },
  { id: 'Review', color: 'bg-yellow-400' },
  { id: 'Done', color: 'bg-green-500' }
];

export const TaskBoard = ({ projectId }) => {
  const { tasks, updateLocalTaskStatus, createTask, deleteTask, isLoading } = useBoardStore();
  const { isConnected } = useSocket(projectId);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [view, setView] = useState('Board');

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    updateLocalTaskStatus(taskId, targetStatus, projectId);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleAddTask = async (column) => {
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle,
      status: column,
      projectId
    });
    setNewTaskTitle('');
    setAddingToColumn(null);
  };

  const handleCopyTask = async (task) => {
    await createTask({
      title: `${task.title} (Copy)`,
      description: task.description,
      status: task.status,
      projectId
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Project link copied to clipboard!');
  };

  const handleAddSection = () => {
    alert('Custom sections feature coming soon!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-400">Loading board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      {/* Board Secondary Header */}
      <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center space-x-6">
          {['Board', 'List', 'Timeline'].map((v) => (
            <button 
              key={v}
              onClick={() => setView(v)}
              className={`text-sm pb-4 -mb-[18px] transition-all ${
                view === v 
                  ? 'font-bold border-b-2 border-gray-900 text-gray-900' 
                  : 'font-medium text-gray-400 hover:text-gray-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
              {isConnected ? 'Sync Active' : 'Offline'}
            </span>
          </div>
          <button 
            onClick={handleShare}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Share
          </button>
        </div>
      </div>

      {/* View Content */}
      {view === 'Board' ? (
        <div className="flex-1 overflow-x-auto p-8 flex space-x-8 items-start bg-[#fcfcfc]">
          {COLUMNS.map(column => (
            <div 
              key={column.id}
              className="asana-column min-h-[500px]"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between mb-4 group px-1">
                <div className="flex items-center">
                  <h2 className="font-bold text-sm text-gray-700 mr-2">{column.id}</h2>
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setAddingToColumn(column.id)} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4 min-h-[50px]">
                {tasks.filter(t => t.status === column.id).map(task => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task._id)}
                    className="asana-card group animate-in slide-in-from-top-2 duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug flex-1">{task.title}</h3>
                      <div className="hidden group-hover:flex space-x-2 ml-2">
                        <button onClick={() => handleCopyTask(task)} className="text-gray-300 hover:text-blue-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                        </button>
                        <button onClick={() => deleteTask(task._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${column.color}`}></div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{column.id}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm">D</div>
                    </div>
                  </div>
                ))}
              </div>

              {addingToColumn === column.id ? (
                <div className="mt-4 asana-card !p-3 !border-blue-400 ring-4 ring-blue-50 animate-in zoom-in-95 duration-200">
                  <input 
                    autoFocus
                    className="w-full text-sm border-none focus:outline-none p-1 font-medium placeholder:text-gray-300"
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(column.id)}
                    onBlur={() => !newTaskTitle && setAddingToColumn(null)}
                  />
                  <div className="flex justify-end mt-2">
                    <button onClick={() => handleAddTask(column.id)} className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded">Create</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setAddingToColumn(column.id)}
                  className="mt-6 flex items-center text-gray-400 hover:text-gray-700 transition-all px-2 py-1.5 hover:bg-gray-100 rounded-lg group"
                >
                  <div className="w-5 h-5 rounded-md border border-dashed border-gray-300 flex items-center justify-center mr-2 group-hover:border-gray-500 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold tracking-tight">Add task</span>
                </button>
              )}
            </div>
          ))}
          
          {/* Add Section Column */}
          <div className="asana-column !w-[220px] group opacity-30 hover:opacity-100 transition-all border-l border-dashed border-gray-200 pl-8">
            <button onClick={handleAddSection} className="flex items-center text-gray-500 font-bold text-xs p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="mr-2 text-lg">+</span> Add section
            </button>
          </div>
        </div>
      ) : view === 'List' ? (
        <div className="flex-1 overflow-y-auto p-8 bg-[#fcfcfc]">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignee</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map(task => (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">{task.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                        task.status === 'Done' ? 'bg-green-100 text-green-600' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                        task.status === 'Review' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">Deepanshu</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteTask(task._id)} className="text-gray-300 hover:text-red-500 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-400 italic">No tasks found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fcfcfc] text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Timeline View</h2>
          <p className="text-gray-400 max-w-md mx-auto">This view is currently under development. Stay tuned for advanced scheduling and dependency tracking!</p>
          <button onClick={() => setView('Board')} className="mt-8 text-blue-600 font-bold text-sm hover:underline">Back to Board</button>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
