import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function MandatoryTasksOverlay({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        const { data } = await api.get('/tasks/my-tasks');
        if (isMounted) {
          setTasks(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch mandatory tasks:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();
    
    return () => { isMounted = false; };
  }, [user]);

  const handleAction = async (task) => {
    if (task.actionUrl) {
      navigate(task.actionUrl);
    } else {
      // If there's no URL, just mark it as completed (e.g. an acknowledgement task)
      await markCompleted(task._id);
    }
  };

  const markCompleted = async (taskId) => {
    setCompletingId(taskId);
    try {
      await api.post(`/tasks/${taskId}/complete`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task marked as completed!');
    } catch (err) {
      toast.error('Failed to complete task');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading || tasks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(15, 23, 42, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)' }}>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative"
      >
        <div className="bg-[#1e1b4b]/90 backdrop-blur-2xl border border-indigo-500/20 rounded-[2rem] shadow-2xl overflow-hidden p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <AlertCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Action Required</h2>
            <p className="text-indigo-200 mt-2 text-sm">
              Please complete the following mandatory {tasks.length > 1 ? 'tasks' : 'task'} to continue using the platform.
            </p>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task._id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">{task.title}</h3>
                  {task.description && (
                    <p className="text-slate-400 text-sm mt-1">{task.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleAction(task)}
                  disabled={completingId === task._id}
                  className="shrink-0 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {completingId === task._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {task.actionText || 'Complete'} 
                      {task.actionUrl && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
