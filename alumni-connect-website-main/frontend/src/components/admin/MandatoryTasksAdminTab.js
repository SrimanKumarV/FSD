import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, CheckCircle, Ban, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function MandatoryTasksAdminTab() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    actionText: '',
    actionUrl: '',
    targetAudience: 'all',
    isActive: true
  });

  const { data: tasks, isLoading } = useQuery(
    ['admin-tasks'],
    () => api.get('/tasks').then(res => res.data)
  );

  const createMutation = useMutation(
    (newTask) => api.post('/tasks', newTask),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tasks']);
        toast.success('Task created successfully');
        setShowModal(false);
      },
      onError: (err) => toast.error('Failed to create task')
    }
  );

  const updateMutation = useMutation(
    (updatedTask) => api.put(`/tasks/${updatedTask._id}`, updatedTask),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tasks']);
        toast.success('Task updated successfully');
        setShowModal(false);
      },
      onError: (err) => toast.error('Failed to update task')
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/tasks/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tasks']);
        toast.success('Task deleted successfully');
      },
      onError: (err) => toast.error('Failed to delete task')
    }
  );

  const toggleStatusMutation = useMutation(
    ({ id, isActive }) => api.put(`/tasks/${id}`, { isActive }),
    {
      onSuccess: () => queryClient.invalidateQueries(['admin-tasks']),
      onError: (err) => toast.error('Failed to update status')
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTask) {
      updateMutation.mutate({ ...formData, _id: editingTask._id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openNewModal = () => {
    setFormData({
      title: '',
      description: '',
      actionText: '',
      actionUrl: '',
      targetAudience: 'all',
      isActive: true
    });
    setEditingTask(null);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setFormData(task);
    setEditingTask(task);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-indigo-500" />
              Mandatory Tasks Management
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign tasks that users must complete before using the platform.</p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="p-6">
            {tasks?.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No tasks configured yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks?.map(task => (
                  <div key={task._id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-gray-900 dark:text-white">{task.title}</h4>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${task.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {task.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full capitalize">
                          {task.targetAudience}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{task.description}</p>
                      {task.actionUrl && (
                        <p className="text-xs text-indigo-500 mt-1 border border-indigo-100 inline-block px-2 py-1 rounded bg-indigo-50">Redirects to: {task.actionUrl}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatusMutation.mutate({ id: task._id, isActive: !task.isActive })}
                        className={`p-2 rounded-lg transition-colors ${task.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={task.isActive ? "Deactivate" : "Activate"}
                      >
                        {task.isActive ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this task?')) {
                            deleteMutation.mutate(task._id);
                          }
                        }}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Task Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingTask ? 'Edit Task' : 'Create Mandatory Task'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                    placeholder="e.g. Upload your Resume"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-24"
                    placeholder="Explain why this is required..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action Button Text</label>
                    <input
                      type="text"
                      value={formData.actionText}
                      onChange={e => setFormData({...formData, actionText: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                      placeholder="e.g. Upload Now"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.actionUrl}
                      onChange={e => setFormData({...formData, actionUrl: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                      placeholder="e.g. /profile"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                  >
                    <option value="all">All Users</option>
                    <option value="student">Students Only</option>
                    <option value="alumni">Alumni Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active (enforce immediately)
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-semibold"
                  >
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
