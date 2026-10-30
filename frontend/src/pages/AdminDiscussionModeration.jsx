import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Trash2, Check, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const DiscussionModeration = () => {
  const { token } = useContext(AuthContext);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const limit = 10;

  useEffect(() => {
    fetchDiscussions();
  }, [search, flaggedOnly, currentPage]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(search && { search }),
        ...(flaggedOnly && { flagged: 'true' }),
      });

      const response = await fetch(`http://localhost:5000/api/admin/discussions?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discussions');
      }

      const data = await response.json();
      setDiscussions(data.data);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModerateDiscussion = async (discussionId, action) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/discussions/${discussionId}/moderate`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} discussion`);
      }

      if (action === 'reject') {
        setDiscussions(discussions.filter((d) => d._id !== discussionId));
      } else {
        setDiscussions(
          discussions.map((d) =>
            d._id === discussionId
              ? { ...d, isFlagged: action === 'flag' ? true : false }
              : d
          )
        );
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDiscussion = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/discussions/${discussionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete discussion');
      }

      setDiscussions(discussions.filter((d) => d._id !== discussionId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && discussions.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-gray-600">Loading discussions...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Discussion Moderation</h2>
          <p className="text-gray-600 mt-2">Review and moderate discussion posts</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search discussions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(e) => {
                  setFlaggedOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Show Flagged Only</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Discussions List */}
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div
              key={discussion._id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                discussion.isFlagged ? 'border-red-500' : 'border-green-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{discussion.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>By: {discussion.authorId?.username || 'Unknown'}</span>
                    <span>
                      {discussion.problemId && `Problem: ${discussion.problemId.title}`}
                    </span>
                    <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {discussion.isFlagged && (
                  <div className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-full">
                    <AlertCircle size={16} />
                    <span className="text-xs font-semibold">Flagged</span>
                  </div>
                )}
              </div>

              {/* Content Preview */}
              <div className="mb-4">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === discussion._id ? null : discussion._id)
                  }
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {expandedId === discussion._id ? 'Hide Content' : 'Show Content'}
                </button>
                {expandedId === discussion._id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-gray-700 text-sm">{discussion.content}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {!discussion.isFlagged ? (
                  <>
                    <button
                      onClick={() => handleModerateDiscussion(discussion._id, 'flag')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-50 rounded border border-yellow-300"
                      title="Flag for review"
                    >
                      <AlertCircle size={16} />
                      <span>Flag</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleModerateDiscussion(discussion._id, 'approve')}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded border border-green-300"
                      title="Approve discussion"
                    >
                      <Check size={16} />
                      <span>Approve</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDeleteDiscussion(discussion._id)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded border border-red-300"
                  title="Delete discussion"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          {discussions.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No discussions found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DiscussionModeration;
