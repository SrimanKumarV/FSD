import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

const StitchForum = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    api.get('/forum')
      .then(r => setPosts(r.data.posts || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Main Feed */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Community Feed</h1>
            <span className="text-xs px-3 py-1 rounded-full" style={{ background:'rgba(59,130,246,0.15)', color:'#60a5fa' }}>
              {posts.length} posts
            </span>
          </div>

          {/* Compose Box */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <textarea
                className="glass-input w-full rounded-xl p-3 resize-none text-sm h-20 text-white"
                placeholder="Share your thoughts, ask a question, or start a discussion..."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center pl-13">
              <div className="flex gap-1 ml-13">
                {['image','link','code'].map(icon => (
                  <button key={icon} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-lg" style={{ color:'rgba(241,245,249,0.50)' }}>{icon}</span>
                  </button>
                ))}
              </div>
              <button
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow:'0 4px 15px rgba(37,99,235,0.35)' }}
              >
                Post
              </button>
            </div>
          </div>

          {/* Posts */}
          {posts.length > 0 ? posts.map((post) => (
            <article key={post._id} className="glass-card rounded-2xl p-6">
              {/* Author */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.5),rgba(124,58,237,0.5))', border:'1px solid rgba(255,255,255,0.15)' }}>
                    {post.author?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{post.author?.name || 'User'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: post.author?.role === 'alumni' ? 'rgba(244,114,182,0.15)' : 'rgba(34,211,238,0.15)', color: post.author?.role === 'alumni' ? '#f472b6' : '#22d3ee' }}>
                        {post.author?.role || 'user'}
                      </span>
                      <span className="text-xs" style={{ color:'rgba(241,245,249,0.40)' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-base" style={{ color:'rgba(241,245,249,0.40)' }}>more_vert</span>
                </button>
              </div>

              {/* Content */}
              {post.title && <h3 className="font-semibold text-white mb-2">{post.title}</h3>}
              <p className="text-sm leading-relaxed" style={{ color:'rgba(241,245,249,0.78)' }}>{post.content}</p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background:'rgba(59,130,246,0.12)', color:'#60a5fa' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                <button className="flex items-center gap-1.5 text-sm hover:text-blue-400 transition-colors" style={{ color:'rgba(241,245,249,0.55)' }}>
                  <span className="material-symbols-outlined text-base">thumb_up</span>
                  <span>{post.likes?.length || 0}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm hover:text-blue-400 transition-colors" style={{ color:'rgba(241,245,249,0.55)' }}>
                  <span className="material-symbols-outlined text-base">chat_bubble_outline</span>
                  <span>{post.comments?.length || 0}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm ml-auto hover:text-blue-400 transition-colors" style={{ color:'rgba(241,245,249,0.55)' }}>
                  <span className="material-symbols-outlined text-base">share</span>
                </button>
              </div>
            </article>
          )) : (
            <div className="glass-card rounded-2xl p-12 text-center">
              <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color:'rgba(241,245,249,0.30)' }}>forum</span>
              <p className="text-white font-medium">No posts yet</p>
              <p className="text-sm mt-1" style={{ color:'rgba(241,245,249,0.45)' }}>Be the first to start a discussion!</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="xl:col-span-4 hidden xl:flex flex-col gap-5">
          {/* Trending */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-lg" style={{ color:'#60a5fa' }}>trending_up</span>
              <h2 className="font-semibold text-white">Trending Topics</h2>
            </div>
            <div className="space-y-3">
              {['#AIIntegration', '#SystemDesign', '#CareerGrowth', '#ReactJS', '#OpenSource'].map((tag, i) => (
                <div key={tag} className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                  <span className="text-sm font-medium" style={{ color:'#60a5fa' }}>{tag}</span>
                  <span className="text-xs" style={{ color:'rgba(241,245,249,0.40)' }}>{[342, 156, 289, 89, 215][i]} posts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Members */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold text-white mb-4">Who's Active</h2>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background:`linear-gradient(135deg,${['#2563eb,#7c3aed','#10b981,#0d9488','#f59e0b,#ef4444','#8b5cf6,#ec4899'][i]})` }}>
                    {['A','S','J','M'][i]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{['Alex Chen','Sonia Patel','Jay Kumar','Maria R.'][i]}</p>
                    <p className="text-xs" style={{ color:'rgba(241,245,249,0.45)' }}>{['just posted','5m ago','12m ago','1h ago'][i]}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StitchForum;
