import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineLockClosed, HiOutlineGlobeAlt } from 'react-icons/hi';

const ProjectModal = ({ isOpen, onClose, onSave, project = null }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setVisibility(project.visibility || 'private');
    } else {
      setName('');
      setDescription('');
      setVisibility('private');
    }
    setIsSaving(false);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave({ name, description, visibility });
      if (!project) {
        setName('');
        setDescription('');
        setVisibility('private');
      }
      onClose();
    } catch (error) {
      console.error('Failed to save project', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">{project ? 'Edit Project' : 'Create New Project'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled={isSaving}>
            <HiOutlineX className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
            <input 
              autoFocus
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-20 resize-none disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
            <div className="flex space-x-4">
              <label className={`flex items-center cursor-pointer group ${isSaving ? 'pointer-events-none opacity-50' : ''}`}>
                <input 
                  type="radio" 
                  name="visibility" 
                  value="private" 
                  checked={visibility === 'private'}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="hidden"
                  disabled={isSaving}
                />
                <div className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${visibility === 'private' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}>
                  <HiOutlineLockClosed className="h-4 w-4 mr-2" />
                  <span className="text-sm font-bold">Private</span>
                </div>
              </label>

              <label className={`flex items-center cursor-pointer group ${isSaving ? 'pointer-events-none opacity-50' : ''}`}>
                <input 
                  type="radio" 
                  name="visibility" 
                  value="public" 
                  checked={visibility === 'public'}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="hidden"
                  disabled={isSaving}
                />
                <div className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all ${visibility === 'public' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}>
                  <HiOutlineGlobeAlt className="h-4 w-4 mr-2" />
                  <span className="text-sm font-bold">Public</span>
                </div>
              </label>
            </div>
            <p className="mt-2 text-[10px] text-gray-400">
              {visibility === 'private' ? 'Only you and members can see this project.' : 'Anyone with access to the platform can view this project.'}
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center justify-center min-w-[120px] disabled:bg-blue-400"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
