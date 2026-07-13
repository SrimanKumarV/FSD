import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Clock, 
  User, 
  Tag,
  Bookmark,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  CheckCircle,
  Lock,
  Unlock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import DefaultAvatar from '../components/DefaultAvatar';

// Define categories and postTypes outside the component
const categories = [
  { value: 'career_guidance', label: 'Career Guidance', color: 'bg-blue-100 text-blue-800' },
  { value: 'higher_studies', label: 'Higher Studies', color: 'bg-green-100 text-green-800' },
  { value: 'tech_skills', label: 'Tech Skills', color: 'bg-purple-100 text-purple-800' },
  { value: 'industry_insights', label: 'Industry Insights', color: 'bg-orange-100 text-orange-800' },
  { value: 'networking', label: 'Networking', color: 'bg-pink-100 text-pink-800' },
  { value: 'job_search', label: 'Job Search', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'personal_development', label: 'Personal Development', color: 'bg-teal-100 text-teal-800' }
];

const postTypes = [
  { value: 'question', label: 'Question', icon: '❓' },
  { value: 'discussion', label: 'Discussion', icon: '💬' },
  { value: 'success_story', label: 'Success Story', icon: '🎉' },
  { value: 'announcement', label: 'Announcement', icon: '📢' },
  { value: 'resource', label: 'Resource', icon: '📚' }
];

const Forum = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    category: '',
    postType: '',
    sort: 'latest',
    search: ''
  });

  useEffect(() => {
    if (location.state?.openPostId) {
      const fetchPost = async () => {
        try {
          const res = await api.get(`/forum/${location.state.openPostId}`);
          setSelectedPost(res.data.post);
        } catch (error) {
          toast.error('Failed to open post');
        }
      };
      fetchPost();
      // Clear state to avoid reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch all forum posts
  const { data: postsData, isLoading, error } = useQuery(
    ['forum-posts', filters],
    () => api.get('/forum', { params: filters }),
    { keepPreviousData: true, enabled: activeTab === 'all' }
  );

  // Fetch feed posts (from followed users)
  const { data: feedData, isLoading: feedLoading, error: feedError } = useQuery(
    ['forum-feed'],
    () => api.get('/forum/feed'),
    { enabled: activeTab === 'feed' }
  );

  // Create post mutation
  const createPostMutation = useMutation(
    (postData) => api.post('/forum', postData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
        queryClient.invalidateQueries(['forum-feed']);
        setShowCreateModal(false);
        toast.success('Post created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to create post');
      }
    }
  );

  // Like post mutation
  const likePostMutation = useMutation(
    (postId) => api.post(`/forum/${postId}/like`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
        queryClient.invalidateQueries(['forum-feed']);
      }
    }
  );

  // Comment mutation
  const commentMutation = useMutation(
    ({ postId, content }) => api.post(`/forum/${postId}/comments`, { content }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['forum-posts']);
        queryClient.invalidateQueries(['forum-feed']);
        if (selectedPost && selectedPost._id === data.data.post._id) {
          setSelectedPost(data.data.post);
        }
        toast.success('Comment added successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add comment');
      }
    }
  );

  // Close post mutation
  const closePostMutation = useMutation(
    (postId) => api.put(`/forum/${postId}/status`, { status: 'closed' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
        toast.success('Post closed successfully');
      }
    }
  );

  // Update post mutation
  const updatePostMutation = useMutation(
    ({ postId, postData }) => api.put(`/forum/${postId}`, postData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
        queryClient.invalidateQueries(['forum-feed']);
        setEditingPost(null);
        if (selectedPost) {
          api.get(`/forum/${selectedPost._id}`).then(res => setSelectedPost(res.data.post));
        }
        toast.success('Post updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Failed to update post');
      }
    }
  );

  // Delete post mutation
  const deletePostMutation = useMutation(
    (postId) => api.delete(`/forum/${postId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
        queryClient.invalidateQueries(['forum-feed']);
        toast.success('Post deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete post');
      }
    }
  );

  // Delete comment mutation
  const deleteCommentMutation = useMutation(
    ({ postId, commentId }) => api.delete(`/forum/${postId}/comments/${commentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
        queryClient.invalidateQueries(['forum-feed']);
        toast.success('Comment deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete comment');
      }
    }
  );

  const handleCreatePost = (postData) => {
    createPostMutation.mutate(postData);
  };

  const handleUpdatePost = (postData) => {
    updatePostMutation.mutate({ postId: editingPost._id, postData });
  };

  const handleLikePost = (postId) => {
    likePostMutation.mutate(postId);
  };

  const handleCommentPost = (postId, content) => {
    commentMutation.mutate({ postId, content });
  };

  const handleClosePost = (postId) => {
    closePostMutation.mutate(postId);
  };

  const handleDeletePost = (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleDeleteComment = (postId, commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate({ postId, commentId });
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">Error loading forum posts</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Sticky Header Container */}
      <div className="sticky top-16 z-20 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md pt-6 pb-4 mb-6 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Forum</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Connect, learn, and share with fellow alumni and students</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Post
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex space-x-1 glass-card rounded-2xl p-1.5 w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All Posts
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'feed'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              My Feed
            </button>
          </div>

          {/* Search and Filters */}
          <div className="glass-card rounded-3xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts, topics, or tags..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
            <option value="most_liked">Most Liked</option>
            <option value="most_commented">Most Commented</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Post Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Type</label>
                  <select
                    value={filters.postType}
                    onChange={(e) => setFilters({ ...filters, postType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">All Types</option>
                    {postTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 pt-4">
        {(() => {
          const currentLoading = activeTab === 'all' ? isLoading : feedLoading;
          const currentPosts = activeTab === 'all' ? postsData?.data?.posts : feedData?.data?.posts;

          if (currentLoading) {
            return (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          if (currentPosts?.length > 0) {
            return currentPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLikePost}
                onClose={handleClosePost}
                onDelete={handleDeletePost}
                onSelect={setSelectedPost}
                onEdit={setEditingPost}
                user={user}
              />
            ));
          }

          return (
            <div className="text-center py-12 glass-card rounded-3xl">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeTab === 'feed' ? 'No posts from people you follow' : 'No posts found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {activeTab === 'feed'
                  ? 'Follow people in the Network page to see their posts here!'
                  : 'Be the first to start a discussion in this category!'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Post
              </button>
            </div>
          );
        })()}
      </div>

      {/* Pagination */}
      {postsData?.data?.pagination && postsData.data.pagination.pages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              disabled={!postsData.data.pagination.hasPrev}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {postsData.data.pagination.current} of {postsData.data.pagination.pages}
            </span>
            <button
              disabled={!postsData.data.pagination.hasNext}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
          categories={categories}
          postTypes={postTypes}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <CreatePostModal
          initialData={editingPost}
          onClose={() => setEditingPost(null)}
          onSubmit={handleUpdatePost}
          categories={categories}
          postTypes={postTypes}
        />
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={handleLikePost}
          onComment={handleCommentPost}
          user={user}
          isCommenting={commentMutation.isLoading}
          onDelete={handleDeletePost}
          onClosePost={handleClosePost}
          onDeleteComment={handleDeleteComment}
          onEdit={setEditingPost}
        />
      )}
    </div>
  );
};

// Post Card Component
const PostCard = ({ post, onLike, onClose, onDelete, onSelect, user, onEdit }) => {
  const [showActions, setShowActions] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    setShowActions(false);
    const url = `${window.location.origin}/forum`; 
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: `Check out this post on Alumnex Connect: ${post.title}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    setShowActions(false);
    toast.success('Post saved successfully!');
  };

  const handleReport = (e) => {
    e.stopPropagation();
    setShowActions(false);
    toast.success('Post reported to moderators');
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  const getPostTypeIcon = (type) => {
    const postType = postTypes.find(t => t.value === type);
    return postType ? postType.icon : '💬';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
      onClick={() => onSelect(post)}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {/* Author Avatar */}
          <div className="flex-shrink-0">
            {post.author?.photo && post.author?.photo !== 'default-avatar.png' ? (
              <img loading="lazy" src={post.author.photo} alt={post.author.name} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" />
            ) : (
              <DefaultAvatar className="w-10 h-10" />
            )}
          </div>

          {/* Post Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {post.isAnonymous ? 'Anonymous' : post.author?.name}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            {post.isEdited && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-400">(edited)</span>
              </>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400">
            {post.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {post.content}
          </p>

          {/* Attachments Preview */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mb-4">
              {post.attachments[0].fileType === 'video' ? (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500">🎥 Video Attachment</span>
                </div>
              ) : (
                <img loading="lazy" 
                  src={post.attachments[0].fileUrl || post.attachments[0].url} 
                  alt={post.attachments[0].fileName || post.attachments[0].filename} 
                  className="w-full h-48 object-cover rounded-xl border border-gray-100 dark:border-gray-700" 
                />
              )}
              {post.attachments.length > 1 && (
                <p className="text-xs text-gray-500 mt-1">+{post.attachments.length - 1} more attachments</p>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
              {categories.find(c => c.value === post.category)?.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {getPostTypeIcon(post.postType)} {postTypes.find(t => t.value === post.postType)?.label}
            </span>
            {post.tags?.slice(0, 3).map((tag, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                #{tag}
              </span>
            ))}
          </div>

          {/* Post Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(post._id);
                }}
                title={post.likes?.map(l => l.name || l).join(', ') || 'Like'}
                className={`flex items-center space-x-1 hover:text-primary-600 transition-colors ${
                  post.likes?.some(like => (like._id || like) === user?.id) ? 'text-primary-600' : ''
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{post.likes?.length || 0}</span>
              </button>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>{post.comments?.length || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{post.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Actions Dropdown at Top Right */}
        <div className="relative flex-shrink-0 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
              {(String(post.author?._id || post.author) === String(user?._id || user?.id)) && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActions(false);
                      if(onEdit) onEdit(post);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Edit Post
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(post._id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete Post
                  </button>
                  {post.status === 'active' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose(post._id);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 flex items-center transition-colors"
                    >
                      <Lock className="w-4 h-4 mr-3" />
                      Close Discussion
                    </button>
                  ) : (
                    <button className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center transition-colors">
                      <Unlock className="w-4 h-4 mr-3" />
                      Reopen Discussion
                    </button>
                  )}
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                </>
              )}
              
              <button 
                onClick={handleSave}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors"
              >
                <Bookmark className="w-4 h-4 mr-3" />
                Save Post
              </button>
              <button 
                onClick={handleShare}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors"
              >
                <Share2 className="w-4 h-4 mr-3" />
                Share Link
              </button>
              {(post.author?._id !== user?._id && post.author?._id !== user?.id && post.author !== user?._id && post.author !== user?.id) && (
                <button 
                  onClick={handleReport}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center transition-colors"
                >
                  <Flag className="w-4 h-4 mr-3" />
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>

        {/* Solution Badge */}
        {post.comments?.some(comment => comment.isSolution) && (
          <div className="flex-shrink-0">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              Solved
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Create Post Modal Component
const CreatePostModal = ({ onClose, onSubmit, categories, postTypes, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || '',
    postType: initialData?.postType || '',
    tags: initialData?.tags?.join(', ') || '',
    isAnonymous: initialData?.isAnonymous || false,
    attachments: initialData?.attachments || []
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      setUploadingMedia(true);
      const res = await api.post('/upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, {
          fileUrl: res.data.url,
          fileName: res.data.fileName,
          fileType: file.type.startsWith('video/') ? 'video' : 'image'
        }]
      }));
      toast.success('Media uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    onSubmit({
      ...formData,
      tags
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{initialData ? 'Edit Post' : 'Create New Post'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter post title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Share your thoughts, questions, or experiences..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Post Type</label>
              <select
                required
                value={formData.postType}
                onChange={(e) => setFormData({ ...formData, postType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select type</option>
                {postTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter tags separated by commas..."
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add relevant tags to help others find your post</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Post anonymously
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Media Upload</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              disabled={uploadingMedia}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {uploadingMedia && <p className="text-sm text-primary-600 mt-2">Uploading media...</p>}
            
            {formData.attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {formData.attachments.map((file, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
                    {file.fileType === 'video' ? (
                      <video src={file.fileUrl || file.url} controls className="w-full h-32 object-contain" />
                    ) : (
                      <img loading="lazy" src={file.fileUrl || file.url} alt={file.fileName || file.filename} className="w-full h-32 object-contain bg-gray-100" />
                    )}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        attachments: prev.attachments.filter((_, i) => i !== idx)
                      }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadingMedia}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingMedia}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {uploadingMedia ? 'Uploading...' : (initialData ? 'Update Post' : 'Create Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Post Detail Modal Component
const PostDetailModal = ({ post, onClose, onLike, onComment, user, isCommenting, onDelete, onClosePost, onDeleteComment, onEdit }) => {
  const [newComment, setNewComment] = useState('');
  const [showActions, setShowActions] = useState(false);

  const handleShare = async () => {
    setShowActions(false);
    const url = `${window.location.origin}/forum`; 
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: `Check out this post on Alumnex Connect: ${post.title}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    }
  };

  const handleSave = () => {
    setShowActions(false);
    toast.success('Post saved successfully!');
  };

  const handleReport = () => {
    setShowActions(false);
    toast.success('Post reported to moderators');
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onComment(post._id, newComment);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">{post.title}</h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
                    {(String(post.author?._id || post.author) === String(user?._id || user?.id)) && (
                      <>
                        <button 
                          onClick={() => {
                            setShowActions(false);
                            if(onEdit) {
                              onClose();
                              onEdit(post);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-3" />
                          Edit Post
                        </button>
                        <button 
                          onClick={() => {
                            onDelete(post._id);
                            setShowActions(false);
                            onClose();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete Post
                        </button>
                        {post.status === 'active' ? (
                          <button 
                            onClick={() => {
                              onClosePost(post._id);
                              setShowActions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 flex items-center transition-colors"
                          >
                            <Lock className="w-4 h-4 mr-3" />
                            Close Discussion
                          </button>
                        ) : (
                          <button className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center transition-colors">
                            <Unlock className="w-4 h-4 mr-3" />
                            Reopen Discussion
                          </button>
                        )}
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                      </>
                    )}
                    <button 
                      onClick={handleSave}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors"
                    >
                      <Bookmark className="w-4 h-4 mr-3" />
                      Save Post
                    </button>
                    <button 
                      onClick={handleShare}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-3" />
                      Share Link
                    </button>
                    {(String(post.author?._id || post.author) !== String(user?._id || user?.id)) && (
                      <button 
                        onClick={handleReport}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center transition-colors"
                      >
                        <Flag className="w-4 h-4 mr-3" />
                        Report Post
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Post Content */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-500">
                By {post.isAnonymous ? 'Anonymous' : post.author?.name}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {/* Full Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mt-6 space-y-4">
                {post.attachments.map((file, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    {file.fileType === 'video' ? (
                      <video src={file.fileUrl || file.url} controls className="w-full max-h-[500px] bg-black" />
                    ) : (
                      <img loading="lazy" src={file.fileUrl || file.url} alt={file.fileName || file.filename} className="w-full h-auto max-h-[500px] object-contain bg-gray-50 dark:bg-gray-900" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Likes List */}
            {post.likes?.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <ThumbsUp className="w-4 h-4 text-primary-500" />
                <span className="font-medium">Liked by:</span>
                {post.likes.map((like, i) => (
                  <span key={like._id || i} className="font-medium text-gray-900 dark:text-gray-200">
                    {like.name || 'User'}{i < post.likes.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Comments ({post.comments?.length || 0})
            </h3>
            
            {post.comments?.length > 0 ? (
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {comment.author?.photo && comment.author?.photo !== 'default-avatar.png' ? (
                        <img loading="lazy" src={comment.author.photo} alt={comment.author.name} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" />
                      ) : (
                        <DefaultAvatar className="w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 group relative">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {comment.author?.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {(String(comment.author?._id || comment.author) === String(user?._id || user?.id)) && (
                            <button
                              onClick={() => onDeleteComment(post._id, comment._id)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
            )}

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="mt-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isCommenting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCommenting ? 'Posting...' : 'Add Comment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
