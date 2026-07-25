import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { MessageSquare, ThumbsUp } from 'lucide-react';

const TechHub = () => {
  const [questions, setQuestions] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/tech-hub/questions');
      setQuestions(res.data);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tech-hub/questions', {
        title: newTitle,
        description: newDesc,
        techStack: ['General']
      });
      toast.success('Question posted');
      setNewTitle('');
      setNewDesc('');
      fetchQuestions();
    } catch (error) {
      toast.error('Failed to post question');
    }
  };

  const viewQuestion = async (id) => {
    try {
      const res = await api.get(`/tech-hub/questions/${id}`);
      setActiveQuestion(res.data);
    } catch (error) {
      toast.error('Failed to load question details');
    }
  };

  const postReply = async (e) => {
    e.preventDefault();
    if (!activeQuestion) return;
    try {
      await api.post(`/tech-hub/questions/${activeQuestion._id}/replies`, {
        content: replyContent
      });
      toast.success('Reply posted');
      setReplyContent('');
      viewQuestion(activeQuestion._id);
    } catch (error) {
      toast.error('Failed to post reply');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-800 pr-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Tech Assistance Hub</h2>
        <form onSubmit={askQuestion} className="mb-6">
          <input
            type="text"
            placeholder="Question title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            required
          />
          <textarea
            placeholder="Describe your error or issue..."
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            rows="3"
            required
          ></textarea>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors">
            Ask Question
          </button>
        </form>
        
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">Loading...</div>
          ) : questions.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">No questions yet.</div>
          ) : (
            questions.map(q => (
              <div 
                key={q._id} 
                onClick={() => viewQuestion(q._id)}
                className={`p-4 rounded shadow-sm border cursor-pointer transition-colors ${
                  activeQuestion?._id === q._id 
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800' 
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <h3 className={`font-semibold line-clamp-2 ${activeQuestion?._id === q._id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                  {q.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">By {q.author?.name}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        {activeQuestion ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{activeQuestion.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              Asked by {activeQuestion.author?.name} | {activeQuestion.views} views
            </p>
            <p className="text-gray-800 dark:text-gray-300 whitespace-pre-wrap mb-8">{activeQuestion.description}</p>
            
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{activeQuestion.replies?.length || 0} Replies</h3>
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {activeQuestion.replies?.map(reply => (
                <div key={reply._id} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{reply.author?.name}</span>
                    <button className="flex items-center text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span className="text-xs">{reply.upvotes?.length || 0}</span>
                    </button>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{reply.content}</p>
                </div>
              ))}
              {(!activeQuestion.replies || activeQuestion.replies.length === 0) && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">No replies yet. Be the first!</div>
              )}
            </div>

            <form onSubmit={postReply}>
              <textarea
                placeholder="Write your reply..."
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                className="w-full mb-2 p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows="4"
                required
              ></textarea>
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Post Reply
              </button>
            </form>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            Select a question to view discussion
          </div>
        )}
      </div>
    </div>
  );
};

export default TechHub;
