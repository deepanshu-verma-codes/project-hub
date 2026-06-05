import React, { useState, useEffect } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { HiOutlineUserAdd, HiOutlineTrash, HiOutlineUsers, HiOutlineShieldCheck, HiOutlineMail } from 'react-icons/hi';

const AdminPanel = () => {
  const { users, fetchUsers, createUser, deleteUser, addNotification } = useBoardStore();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Developer' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await createUser(formData);
    setIsSubmitting(false);
    if (success) {
      addNotification('User created successfully', 'success');
      setFormData({ name: '', email: '', password: '', role: 'Developer' });
    } else {
      addNotification('Failed to create user', 'error');
    }
  };

  const handleDelete = async (userId, userEmail) => {
    if (userEmail === 'admin@yopmail.com') {
      addNotification('Cannot delete main admin', 'error');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      const success = await deleteUser(userId);
      if (success) {
        addNotification('User deleted', 'warning');
      } else {
        addNotification('Failed to delete user', 'error');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#fcfcfc] animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <HiOutlineShieldCheck className="mr-2 text-blue-600" />
            Admin Control Panel
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Manage team members and system access.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add User Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mr-3">
                <HiOutlineUserAdd className="h-4 w-4" />
              </div>
              Add New Member
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                >
                  <option value="Developer">Developer</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center mt-6"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : 'Invite Member'}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center mr-3">
                  <HiOutlineUsers className="h-4 w-4" />
                </div>
                Team Directory
              </h3>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-widest">
                {users.length} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Member</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md mr-4">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400 flex items-center mt-0.5">
                              <HiOutlineMail className="mr-1 h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                          user.role === 'Admin' ? 'bg-red-50 text-red-600' :
                          user.role === 'Manager' ? 'bg-amber-50 text-amber-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                          <span className="text-xs font-medium text-gray-600">Active</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {user.email !== 'admin@yopmail.com' && (
                          <button
                            onClick={() => handleDelete(user._id, user.email)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remove User"
                          >
                            <HiOutlineTrash className="h-5 w-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
