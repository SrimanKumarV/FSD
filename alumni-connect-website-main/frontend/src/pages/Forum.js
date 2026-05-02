import React, { useState, useEffect } from 'react';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    postType: '',
    sort: 'latest',
    search: ''
  });

  // Fetch forum posts
  const { data: postsData, isLoading, error } = useQuery(
    ['forum-posts', filters],
    () => api.get('/forum', { params: filters }),
    { keepPreviousData: true }
  );

  // Create post mutation
  const createPostMutation = useMutation(
    (postData) => api.post('/forum', postData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
        setShowCreateModal(false);
        toast.success('Post created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create post');
      }
    }
  );

  // Like post mutation
  const likePostMutation = useMutation(
    (postId) => api.post(`/forum/${postId}/like`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['forum-posts']);
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

  const handleCreatePost = (postData) => {
    createPostMutation.mutate(postData);
  };

  const handleLikePost = (postId) => {
    likePostMutation.mutate(postId);
  };

  const handleClosePost = (postId) => {
    closePostMutation.mutate(postId);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
          <p className="mt-2 text-gray-600">Connect, learn, and share with fellow alumni and students</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Post
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
                  <select
                    value={filters.postType}
                    onChange={(e) => setFilters({ ...filters, postType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : postsData?.posts?.length > 0 ? (
          postsData.posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLikePost}
              onClose={handleClosePost}
              onSelect={setSelectedPost}
              user={user}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 mb-4">Be the first to start a discussion in this category!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Post
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {postsData?.pagination && postsData.pagination.pages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              disabled={!postsData.pagination.hasPrev}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {postsData.pagination.current} of {postsData.pagination.pages}
            </span>
            <button
              disabled={!postsData.pagination.hasNext}
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

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={handleLikePost}
          user={user}
        />
      )}
    </div>
  );
};

// Post Card Component
const PostCard = ({ post, onLike, onClose, onSelect, user }) => {
  const [showActions, setShowActions] = useState(false);

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
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(post)}
    >
      <div className="flex items-start space-x-4">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white font-medium">
            {post.author?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-900">
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

          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600">
            {post.title}
          </h3>

          <p className="text-gray-600 mb-3 line-clamp-2">
            {post.content}
          </p>

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
                className={`flex items-center space-x-1 hover:text-primary-600 transition-colors ${
                  post.likes?.includes(user?.id) ? 'text-primary-600' : ''
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

            {/* Actions */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  {post.author?._id === user?.id && (
                    <>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                      {post.status === 'active' ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose(post._id);
                            setShowActions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Close Post
                        </button>
                      ) : (
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Unlock className="w-4 h-4 mr-2" />
                          Reopen Post
                        </button>
                      )}
                    </>
                  )}
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmark
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
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
const CreatePostModal = ({ onClose, onSubmit, categories, postTypes }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    postType: '',
    tags: '',
    isAnonymous: false
  });

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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter post title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Share your thoughts, questions, or experiences..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
              <select
                required
                value={formData.postType}
                onChange={(e) => setFormData({ ...formData, postType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter tags separated by commas..."
            />
            <p className="mt-1 text-sm text-gray-500">Add relevant tags to help others find your post</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
              Post anonymously
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Post Detail Modal Component
const PostDetailModal = ({ post, onClose, onLike, user }) => {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = (e) => {
    e.preventDefault();
    // TODO: Implement comment functionality
    console.log('Adding comment:', newComment);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{post.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
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
            <p className="text-gray-700 leading-relaxed">{post.content}</p>
          </div>

          {/* Comments */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Comments ({post.comments?.length || 0})
            </h3>
            
            {post.comments?.length > 0 ? (
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {comment.author?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.author?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Comment
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
