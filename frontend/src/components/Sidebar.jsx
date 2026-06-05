import React, { useState, useEffect } from "react";
import { useBoardStore } from "../store/useBoardStore";
import { useSocket } from "../hooks/useSocket";
import ProjectModal from "./ProjectModal";
import {
  HiOutlineChartPie,
  HiOutlineBell,
  HiPlus,
  HiPencilAlt,
  HiTrash,
  HiOutlineLogout,
  HiOutlineShieldCheck,
} from "react-icons/hi";

const Sidebar = ({ activeView, onViewChange }) => {
  const {
    projects,
    activeProject,
    fetchProjects,
    setActiveProject,
    createProject,
    deleteProject,
    updateProject,
    addNotification,
    fetchNotifications,
  } = useBoardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    projectId: null,
    projectName: "",
  });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [user, setUser] = useState(null);

  // Initialize global socket for project-level real-time updates
  useSocket();

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleCreateProject = async (projectData) => {
    if (editingProject) {
      await updateProject(editingProject._id, projectData);
      addNotification("Project updated successfully!", "success");
    } else {
      await createProject(projectData);
    }
    setIsModalOpen(false);
    setEditingProject(null);
    onViewChange("board");
  };

  const handleDeleteProject = async () => {
    if (deleteConfirm.projectId) {
      await deleteProject(deleteConfirm.projectId);
      setDeleteConfirm({ isOpen: false, projectId: null, projectName: "" });
      if (
        activeView === "board" &&
        activeProject?._id === deleteConfirm.projectId
      ) {
        onViewChange("dashboard");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  return (
    <>
      <div className="w-60 bg-[#2e2e2e] h-screen flex flex-col text-[#f5f5f5] shadow-xl z-20">
        {/* Sidebar Header */}
        <div className="p-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-inner">
            P
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            ProjectHub
          </h2>
        </div>

        <nav className="flex-1 overflow-y-auto mt-4">
          {/* Insights Section */}
          <div className="px-6 mb-4 flex items-center justify-between group">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Insights
            </span>
          </div>
          <div
            onClick={() => {
              onViewChange("dashboard");
              setActiveProject(null);
            }}
            className={`asana-sidebar-item ml-2 mb-1 group/nav ${activeView === "dashboard" ? "active" : "inactive"}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                activeView === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-[#3d3d3d] text-gray-400 group-hover/nav:text-white"
              }`}
            >
              <HiOutlineChartPie className="text-lg" />
            </div>
            <span className="text-sm">Dashboard</span>
          </div>
          <div
            onClick={() => {
              onViewChange("notifications");
              setActiveProject(null);
              fetchNotifications();
            }}
            className={`asana-sidebar-item ml-2 mb-1 group/nav ${activeView === "notifications" ? "active" : "inactive"}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                activeView === "notifications"
                  ? "bg-blue-600 text-white"
                  : "bg-[#3d3d3d] text-gray-400 group-hover/nav:text-white"
              }`}
            >
              <HiOutlineBell className="text-lg" />
            </div>
            <span className="text-sm">Notifications</span>
          </div>

          {/* Admin Section */}
          {user?.email === "admin@yopmail.com" && (
            <div
              onClick={() => {
                onViewChange("admin");
                setActiveProject(null);
              }}
              className={`asana-sidebar-item ml-2 mb-8 group/nav ${activeView === "admin" ? "active" : "inactive"}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
                  activeView === "admin"
                    ? "bg-red-600 text-white"
                    : "bg-[#3d3d3d] text-gray-400 group-hover/nav:text-white"
                }`}
              >
                <HiOutlineShieldCheck className="text-lg" />
              </div>
              <span className="text-sm font-bold">Admin Panel</span>
            </div>
          )}

          {/* Projects Section */}
          <div className="px-6 mb-3 flex items-center justify-between group">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Projects
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="text-gray-500 hover:text-white transition-all transform hover:scale-110 p-1"
              title="Add Project"
            >
              <HiPlus className="text-base" />
            </button>
          </div>

          <div className="space-y-0.5 px-2">
            {projects.length > 0 ? (
              projects.map((project) => {
                const canManage =
                  user &&
                  (user.role === "Admin" || project.ownerId === user.id);
                return (
                  <div
                    key={project._id}
                    onClick={() => {
                      setActiveProject(project);
                      onViewChange("board");
                    }}
                    className={`asana-sidebar-item !rounded-md group/item relative ${
                      activeProject?._id === project._id &&
                      activeView === "board"
                        ? "active !bg-blue-600/20 !text-blue-400 !border-l-4 !border-blue-500"
                        : "inactive"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-3 ${activeProject?._id === project._id && activeView === "board" ? "bg-blue-400" : "bg-gray-600"}`}
                    ></span>
                    <span className="truncate text-sm font-medium flex-1">
                      {project.name}
                    </span>

                    {canManage && (
                      <div className="flex space-x-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                            setIsModalOpen(true);
                          }}
                          className="p-1 hover:text-blue-400 transition-colors"
                          title="Edit Project"
                        >
                          <HiPencilAlt className="text-sm" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({
                              isOpen: true,
                              projectId: project._id,
                              projectName: project.name,
                            });
                          }}
                          className="p-1 hover:text-red-400 transition-colors"
                          title="Delete Project"
                        >
                          <HiTrash className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-2 text-xs text-gray-500 italic">
                No projects yet
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#3d3d3d] bg-[#2a2a2a]">
          <div className="flex items-center space-x-3 px-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 flex items-center justify-center text-xs font-extrabold text-white shadow-lg">
              DV
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-200">Deepanshu</p>
              <p className="text-[10px] text-gray-500 font-medium">
                Free Workspace
              </p>
            </div>
            <button
              onClick={() => setLogoutConfirm(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#3d3d3d] rounded-md text-gray-400 hover:text-red-400 transition-all"
              title="Logout"
            >
              <HiOutlineLogout className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleCreateProject}
        project={editingProject}
      />

      {/* Logout Confirmation Modal */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] w-max max-sm rounded-2xl shadow-2xl border border-[#333] overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <HiOutlineLogout className="text-2xl text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Logout?
              </h3>
              <p className="text-gray-400 text-center text-sm leading-relaxed">
                Are you sure you want to sign out of your account?
              </p>
            </div>
            <div className="bg-[#252525] px-8 py-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 px-6 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-[#333] transition-colors border border-[#444]"
              >
                Stay
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-900/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1e1e1e] w-full max-w-md rounded-2xl shadow-2xl border border-[#333] overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <HiTrash className="text-2xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Delete Project?
              </h3>
              <p className="text-gray-400 text-center text-sm leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="text-white font-semibold">
                  "{deleteConfirm.projectName}"
                </span>
                ? This action cannot be undone and all associated tasks will be
                permanently removed.
              </p>
            </div>
            <div className="bg-[#252525] px-8 py-6 flex flex-col sm:flex-row gap-3">
              <button
                disabled={useBoardStore.getState().isLoading}
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    projectId: null,
                    projectName: "",
                  })
                }
                className="flex-1 px-6 py-2.5 rounded-xl text-sm font-bold text-gray-300 hover:bg-[#333] transition-colors border border-[#444] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                disabled={useBoardStore.getState().isLoading}
                onClick={handleDeleteProject}
                className="flex-1 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {useBoardStore.getState().isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Project"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
