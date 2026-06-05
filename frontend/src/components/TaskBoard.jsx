import React, { useState } from "react";
import { useBoardStore } from "../store/useBoardStore";
import { useSocket } from "../hooks/useSocket";
import { 
  HiOutlineDuplicate, 
  HiOutlineTrash, 
  HiOutlineLink, 
  HiOutlineUpload, 
  HiOutlinePlus, 
  HiOutlinePencilAlt, 
  HiOutlineX, 
  HiOutlinePhotograph, 
  HiOutlineChevronLeft, 
  HiOutlineChevronRight,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
  HiOutlineExclamation
} from 'react-icons/hi';

const COLUMNS = [
  { id: "Todo", color: "bg-gray-400" },
  { id: "In Progress", color: "bg-blue-400" },
  { id: "Review", color: "bg-yellow-400" },
  { id: "Done", color: "bg-green-500" },
];

export const TaskBoard = ({ projectId }) => {
  const {
    tasks,
    updateLocalTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    isLoading,
    addNotification,
  } = useBoardStore();
  const { isConnected } = useSocket(projectId);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    links: [""],
    images: [],
    priority: "medium",
  });
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [view, setView] = useState("Board");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskData, setEditTaskData] = useState(null);
  const [sliderIndex, setSliderIndex] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    updateLocalTaskStatus(taskId, targetStatus, projectId);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleAddTask = async (column) => {
    if (!newTask.title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", newTask.title);
      formData.append("description", newTask.description);
      formData.append("status", column);
      formData.append("projectId", projectId);
      formData.append("priority", newTask.priority);
      formData.append(
        "links",
        JSON.stringify(newTask.links.filter((l) => l.trim()).slice(0, 10)),
      );

      // Add images as binary files to FormData
      for (let i = 0; i < newTask.images.length; i++) {
        const base64 = newTask.images[i];
        // Convert base64 to Blob
        const res = await fetch(base64);
        const blob = await res.blob();
        formData.append("images", blob, `upload_${i}.jpg`);
      }

      await createTask(formData);

      setNewTask({
        title: "",
        description: "",
        links: [""],
        images: [],
        priority: "medium",
      });
      setAddingToColumn(null);
    } catch (error) {
      console.error("Failed to add task", error);
      addNotification("Failed to create task", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editTaskData.title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", editTaskData.title);
      formData.append("description", editTaskData.description);
      formData.append("priority", editTaskData.priority);
      formData.append(
        "links",
        JSON.stringify(editTaskData.links.filter((l) => l.trim())),
      );
      formData.append(
        "existingImageUrls",
        JSON.stringify(editTaskData.imageUrls),
      );

      // Add new images
      for (let i = 0; i < newImages.length; i++) {
        const base64 = newImages[i];
        const res = await fetch(base64);
        const blob = await res.blob();
        formData.append("images", blob, `update_${i}.jpg`);
      }

      await updateTask(editTaskData._id, formData);

      addNotification("Task updated successfully!", "success");
      setIsEditingTask(false);
      setNewImages([]);
    } catch (error) {
      console.error("Failed to update task", error);
      addNotification("Failed to update task", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (newTask.images.length + files.length > 4) {
      addNotification("Maximum 4 images allowed per task", "error");
      return;
    }

    setIsProcessingImage(true);
    const newBase64Images = [];

    for (const file of files) {
      try {
        const base64 = await processImage(file);
        newBase64Images.push(base64);
      } catch (err) {
        console.error("Image processing failed", err);
        addNotification(`Failed to process ${file.name}`, "error");
      }
    }

    setNewTask((prev) => ({
      ...prev,
      images: [...prev.images, ...newBase64Images],
    }));
    setIsProcessingImage(false);
    e.target.value = ""; // Reset input
  };

  const handleEditImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const totalImages =
      editTaskData.imageUrls.length + newImages.length + files.length;

    if (totalImages > 4) {
      addNotification("Maximum 4 images allowed per task", "error");
      return;
    }

    setIsProcessingImage(true);
    const newBase64Images = [];

    for (const file of files) {
      try {
        const base64 = await processImage(file);
        newBase64Images.push(base64);
      } catch (err) {
        console.error("Image processing failed", err);
        addNotification(`Failed to process ${file.name}`, "error");
      }
    }

    setNewImages((prev) => [...prev, ...newBase64Images]);
    setIsProcessingImage(false);
    e.target.value = "";
  };

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Initial scale down if very large
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Quality adjustment loop to hit < 100KB
          let quality = 0.7;
          let base64 = canvas.toDataURL("image/jpeg", quality);

          while (base64.length > 133333 && quality > 0.1) {
            // ~100KB in base64 is ~133K chars
            quality -= 0.1;
            base64 = canvas.toDataURL("image/jpeg", quality);
          }

          if (base64.length > 150000) {
            // Still too big, resize further
            width *= 0.7;
            height *= 0.7;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            base64 = canvas.toDataURL("image/jpeg", 0.5);
          }

          resolve(base64);
        };
      };
      reader.onerror = reject;
    });
  };

  const removeImage = (index) => {
    setNewTask((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddLinkField = () => {
    if (newTask.links.length < 10) {
      setNewTask({ ...newTask, links: [...newTask.links, ""] });
    }
  };

  const handleFieldChange = (type, index, value) => {
    const updated = [...newTask[type]];
    updated[index] = value;
    setNewTask({ ...newTask, [type]: updated });
  };

  const handleCopyTask = async (task) => {
    await createTask({
      title: `${task.title} (Copy)`,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId,
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    addNotification("Project link copied to clipboard!", "success");
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
          {["Board", "List"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-sm pb-4 -mb-[18px] transition-all ${
                view === v
                  ? "font-bold border-b-2 border-gray-900 text-gray-900"
                  : "font-medium text-gray-400 hover:text-gray-800"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
            ></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
              {isConnected ? "Sync Active" : "Offline"}
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
      {view === "Board" ? (
        <div className="flex-1 overflow-x-auto p-8 flex space-x-8 items-start bg-[#fcfcfc]">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="asana-column min-h-[500px]"
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between mb-4 group px-1">
                <div className="flex items-center">
                  <h2 className="font-bold text-sm text-gray-700 mr-2">
                    {column.id}
                  </h2>
                  <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
                    {tasks.filter((t) => t.status === column.id).length}
                  </span>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setAddingToColumn(column.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 min-h-[50px]">
                {tasks
                  .filter((t) => t.status === column.id)
                  .map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      onClick={() => setSelectedTaskId(task._id)}
                      className="asana-card group animate-in slide-in-from-top-2 duration-300 !p-0 overflow-hidden flex flex-col cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all"
                    >
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span
                                className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                                  task.priority === "high"
                                    ? "bg-red-100 text-red-600"
                                    : task.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-600"
                                      : "bg-green-100 text-green-600"
                                }`}
                              >
                                {task.priority || "medium"}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h3>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex space-x-1.5 ml-2 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTask(task);
                              }}
                              className="p-1 hover:bg-blue-50 text-gray-400 hover:text-blue-500 rounded-md transition-colors"
                              title="Duplicate"
                            >
                              <HiOutlineDuplicate className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task._id);
                              }}
                              className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                              title="Delete"
                            >
                              <HiOutlineTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed font-medium">
                            {task.description}
                          </p>
                        )}

                        {/* Inline Image Gallery */}
                        {task.imageUrls && task.imageUrls.length > 0 && (
                          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 custom-scrollbar">
                            {task.imageUrls.map((url, idx) => (
                              <div
                                key={idx}
                                className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm"
                              >
                                <img
                                  src={url}
                                  alt="Attachment"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Polished Links UI */}
                        {task.links && task.links.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4 items-center">
                            {task.links.slice(0, 2).map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/link flex items-center px-2 py-1 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-lg transition-all duration-200"
                              >
                                <HiOutlineLink className="h-2.5 w-2.5 mr-1.5 text-gray-400 group-hover/link:text-blue-500" />
                                <span className="text-[9px] font-bold text-gray-500 group-hover/link:text-blue-600 truncate max-w-[80px]">
                                  {new URL(link).hostname.replace("www.", "")}
                                </span>
                              </a>
                            ))}
                            {task.links.length > 2 && (
                              <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter ml-1">
                                +{task.links.length - 2} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${column.color}`}
                              ></div>
                              <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">
                                {column.id}
                              </span>
                            </div>
                            <span className="text-[8px] text-gray-300 font-medium italic">
                              {new Date(task.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                          <div className="flex -space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                              D
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {addingToColumn === column.id ? (
                <div className="mt-4 asana-card !p-4 !border-blue-400 ring-4 ring-blue-50 animate-in zoom-in-95 duration-200 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                  <input
                    autoFocus
                    className="w-full text-sm border-none focus:outline-none font-bold placeholder:text-gray-300"
                    placeholder="Task Title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                  />
                  <textarea
                    className="w-full text-[11px] border-none focus:outline-none text-gray-500 placeholder:text-gray-300 resize-none h-12"
                    placeholder="Add description..."
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  />

                  {/* Priority Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Priority
                    </label>
                    <div className="flex space-x-2">
                      {["low", "medium", "high"].map((p) => (
                        <button
                          key={p}
                          onClick={() =>
                            setNewTask({ ...newTask, priority: p })
                          }
                          className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                            newTask.priority === p
                              ? p === "high"
                                ? "bg-red-500 text-white shadow-sm"
                                : p === "medium"
                                  ? "bg-yellow-500 text-white shadow-sm"
                                  : "bg-green-500 text-white shadow-sm"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Links Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Links ({newTask.links.length}/10)
                      </label>
                      {newTask.links.length < 10 && (
                        <button
                          onClick={handleAddLinkField}
                          className="text-blue-500 hover:text-blue-700 p-1 transition-colors"
                        >
                          <HiOutlinePlus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    {newTask.links.map((link, idx) => (
                      <input
                        key={idx}
                        className="w-full text-[10px] bg-gray-50 p-1.5 rounded border border-gray-100 focus:outline-none focus:border-blue-300 transition-colors"
                        placeholder={`Link ${idx + 1}`}
                        value={link}
                        onChange={(e) =>
                          handleFieldChange("links", idx, e.target.value)
                        }
                      />
                    ))}
                  </div>

                  {/* Dynamic Images Section - Replaced with Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Images ({newTask.images.length}/4)
                      </label>
                      {newTask.images.length < 4 && (
                        <label className="cursor-pointer text-blue-500 hover:text-blue-700 p-1 transition-colors flex items-center space-x-1">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isProcessingImage}
                          />
                          <HiOutlineUpload className={`h-4 w-4 ${isProcessingImage ? "animate-spin" : ""}`} />
                          <span className="text-[9px] font-black uppercase">
                            {isProcessingImage ? "Processing..." : "Upload"}
                          </span>
                        </label>
                      )}
                    </div>

                    {newTask.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {newTask.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 group"
                          >
                            <img
                              src={img}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <HiOutlineX className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[8px] text-gray-400 italic">
                      Max 4 images, automatically optimized to &lt; 100KB each.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 sticky bottom-0 bg-white py-2 border-t border-gray-50">
                    <button
                      onClick={() => {
                        setNewTask({
                          title: "",
                          description: "",
                          links: [""],
                          images: [""],
                        });
                        setAddingToColumn(null);
                      }}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600 px-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddTask(column.id)}
                      disabled={isSaving}
                      className="bg-blue-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center min-w-[80px] disabled:bg-blue-400"
                    >
                      {isSaving ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        "Create Task"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingToColumn(column.id)}
                  className="mt-6 flex items-center text-gray-400 hover:text-gray-700 transition-all px-2 py-1.5 hover:bg-gray-100 rounded-lg group"
                >
                  <div className="w-5 h-5 rounded-md border border-dashed border-gray-300 flex items-center justify-center mr-2 group-hover:border-gray-500 transition-colors">
                    <HiOutlinePlus className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">
                    Add task
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : view === "List" ? (
        <div className="flex-1 overflow-y-auto p-8 bg-[#fcfcfc]">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Task Name
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Created
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((task) => (
                  <tr
                    key={task._id}
                    className="hover:bg-gray-50 transition-colors group"
                    onClick={() => {
                      setSelectedTaskId(task._id);
                    }}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">
                        {task.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-600"
                            : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        {task.priority || "medium"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                          task.status === "Done"
                            ? "bg-green-100 text-green-600"
                            : task.status === "In Progress"
                              ? "bg-blue-100 text-blue-600"
                              : task.status === "Review"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-500 font-medium">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTaskId(task._id);
                            setEditTaskData({ ...task });
                            setIsEditingTask(true);
                          }}
                          className="text-gray-300 hover:text-blue-500 p-1 transition-colors"
                          title="Edit Task"
                        >
                          <HiOutlinePencilAlt className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTask(task._id)}
                          className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          title="Delete Task"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-sm text-gray-400 italic"
                    >
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fcfcfc] text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
            <HiOutlineExclamation className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            We encountered an error while loading the board. Please try again or
            return to your project workspace.
          </p>
          <div className="flex items-center gap-6 mt-8">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-md transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => setView("Board")}
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              Back to Board
            </button>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex flex-col flex-1 mr-4">
                <div className="flex items-center space-x-2 mb-1">
                  {isEditingTask ? (
                    <div className="flex space-x-2">
                      {["low", "medium", "high"].map((p) => (
                        <button
                          key={p}
                          onClick={() =>
                            setEditTaskData({ ...editTaskData, priority: p })
                          }
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${
                            editTaskData.priority === p
                              ? p === "high"
                                ? "bg-red-500 text-white shadow-sm"
                                : p === "medium"
                                  ? "bg-yellow-500 text-white shadow-sm"
                                  : "bg-green-500 text-white shadow-sm"
                              : "bg-gray-50 text-gray-400 border border-gray-100"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          selectedTask.priority === "high"
                            ? "bg-red-100 text-red-600"
                            : selectedTask.priority === "medium"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        {selectedTask.priority || "medium"} Priority
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        •
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Created{" "}
                        {new Date(selectedTask.createdAt).toLocaleDateString(
                          undefined,
                          { month: "long", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${COLUMNS.find((c) => c.id === selectedTask.status)?.color || "bg-gray-400"}`}
                  ></div>
                  {isEditingTask ? (
                    <input
                      autoFocus
                      className="text-xl font-bold text-gray-800 tracking-tight border-b-2 border-blue-500 focus:outline-none w-full bg-blue-50/30 px-2 py-1 rounded"
                      value={editTaskData.title}
                      onChange={(e) =>
                        setEditTaskData({
                          ...editTaskData,
                          title: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                      {selectedTask.title}
                    </h2>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditingTask && (
                  <button
                    onClick={() => {
                      setEditTaskData({ ...selectedTask });
                      setIsEditingTask(true);
                    }}
                    className="p-2 hover:bg-blue-50 rounded-full text-blue-500 hover:text-blue-600 transition-colors"
                    title="Edit Task"
                  >
                    <HiOutlinePencilAlt className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedTaskId(null);
                    setIsEditingTask(false);
                    setEditTaskData(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <HiOutlineX className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Image Gallery / Attachment Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                    <HiOutlinePhotograph className="h-3 w-3 mr-2" />
                    Attachments (
                    {isEditingTask
                      ? editTaskData.imageUrls.length + newImages.length
                      : selectedTask.imageUrls?.length || 0}
                    )
                  </h3>
                  {isEditingTask &&
                    editTaskData.imageUrls.length + newImages.length < 4 && (
                      <label className="cursor-pointer text-blue-500 hover:text-blue-700 transition-colors flex items-center space-x-1">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleEditImageUpload}
                          disabled={isProcessingImage}
                        />
                        <HiOutlineUpload className={`h-4 w-4 ${isProcessingImage ? "animate-spin" : ""}`} />
                        <span className="text-[9px] font-black uppercase">
                          {isProcessingImage ? "Processing..." : "Add"}
                        </span>
                      </label>
                    )}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {isEditingTask ? (
                    <>
                      {editTaskData.imageUrls.map((url, idx) => (
                        <div
                          key={`existing-${idx}`}
                          className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm group"
                        >
                          <img
                            src={url}
                            alt="Attachment"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() =>
                              setEditTaskData({
                                ...editTaskData,
                                imageUrls: editTaskData.imageUrls.filter(
                                  (_, i) => i !== idx,
                                ),
                              })
                            }
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {newImages.map((img, idx) => (
                        <div
                          key={`new-${idx}`}
                          className="relative aspect-square rounded-xl overflow-hidden border border-blue-200 shadow-sm group"
                        >
                          <img
                            src={img}
                            alt="New attachment"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase">
                            New
                          </div>
                          <button
                            onClick={() =>
                              setNewImages(
                                newImages.filter((_, i) => i !== idx),
                              )
                            }
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </>
                  ) : (
                    selectedTask.imageUrls?.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSliderIndex(idx)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-zoom-in group"
                      >
                        <img
                          src={url}
                          alt="Attachment"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <HiOutlineDocumentText className="h-3 w-3 mr-2" />
                  Description
                </h3>
                {isEditingTask ? (
                  <textarea
                    className="w-full text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium bg-blue-50/30 p-4 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[150px] resize-none"
                    value={editTaskData.description}
                    onChange={(e) =>
                      setEditTaskData({
                        ...editTaskData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Add description..."
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap font-medium bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                    {selectedTask.description || "No description provided."}
                  </p>
                )}
              </div>

              {/* Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                    <HiOutlineLink className="h-3.5 w-3.5 mr-2" />
                    Resources (
                    {isEditingTask
                      ? editTaskData.links.length
                      : selectedTask.links?.length || 0}
                    )
                  </h3>
                  {isEditingTask && (
                    <button
                      onClick={() =>
                        setEditTaskData({
                          ...editTaskData,
                          links: [...editTaskData.links, ""],
                        })
                      }
                      className="text-blue-500 hover:text-blue-700 p-1"
                    >
                      <HiOutlinePlus className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isEditingTask ? (
                  <div className="space-y-2">
                    {editTaskData.links.map((link, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          className="flex-1 text-xs bg-gray-50 p-2 rounded border border-gray-100 focus:outline-none focus:border-blue-300 transition-colors"
                          placeholder={`Link ${idx + 1}`}
                          value={link}
                          onChange={(e) => {
                            const newLinks = [...editTaskData.links];
                            newLinks[idx] = e.target.value;
                            setEditTaskData({
                              ...editTaskData,
                              links: newLinks,
                            });
                          }}
                        />
                        <button
                          onClick={() => {
                            const newLinks = editTaskData.links.filter(
                              (_, i) => i !== idx,
                            );
                            setEditTaskData({
                              ...editTaskData,
                              links: newLinks,
                            });
                          }}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : selectedTask.links && selectedTask.links.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedTask.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                      >
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-600 transition-colors">
                          <HiOutlineExternalLink className="h-5 w-5 text-blue-500 group-hover:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {new URL(link).hostname}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate font-medium">
                            Click to open resource
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    No resources linked.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end items-center space-x-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-auto">
                Task ID: {selectedTask._id}
              </span>
              {isEditingTask ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditingTask(false);
                      setEditTaskData(null);
                    }}
                    className="px-6 py-2 bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTask}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center min-w-[120px] disabled:bg-blue-400"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedTaskId(null)}
                    className="px-6 py-2 bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      deleteTask(selectedTask._id);
                      setSelectedTaskId(null);
                    }}
                    className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                  >
                    Delete Task
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Image Slider Overlay */}
      {sliderIndex !== null && selectedTask.imageUrls && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <button
            onClick={() => setSliderIndex(null)}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:rotate-90"
          >
            <HiOutlineX className="h-8 w-8" />
          </button>

          {/* Previous Button */}
          {sliderIndex > 0 && (
            <button
              onClick={() => setSliderIndex(sliderIndex - 1)}
              className="absolute left-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:-translate-x-1"
            >
              <HiOutlineChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Next Button */}
          {sliderIndex < selectedTask.imageUrls.length - 1 && (
            <button
              onClick={() => setSliderIndex(sliderIndex + 1)}
              className="absolute right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:translate-x-1"
            >
              <HiOutlineChevronRight className="h-8 w-8" />
            </button>
          )}

          <div className="w-full max-w-5xl p-4 flex flex-col items-center">
            <div className="w-full aspect-[4/3] md:aspect-video flex items-center justify-center bg-black/20 rounded-2xl overflow-hidden relative group">
              <img
                src={selectedTask.imageUrls[sliderIndex]}
                alt={`Slide ${sliderIndex}`}
                className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-500"
              />
            </div>
            <div className="mt-8 flex space-x-3">
              {selectedTask.imageUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSliderIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === sliderIndex ? "bg-white w-8" : "bg-white/20 hover:bg-white/40"}`}
                />
              ))}
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-6">
              Attachment {sliderIndex + 1} of {selectedTask.imageUrls.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;
