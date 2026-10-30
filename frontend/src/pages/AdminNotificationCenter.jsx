import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

const AdminNotificationCenter = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const usersPerPage = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: usersPerPage,
      });

      const response = await fetch(`http://localhost:5000/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data);
      setTotalUsers(data.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    if (!formData.title || !formData.message) {
      setError('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          title: formData.title,
          message: formData.message,
          type: formData.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const data = await response.json();
      setSuccess(data.message);
      setFormData({ title: '', message: '', type: 'info' });
      setSelectedUsers([]);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!formData.title || !formData.message) {
      setError('Title and message are required');
      return;
    }

    if (!window.confirm('Send this notification to ALL users?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          type: formData.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send broadcast');
      }

      const data = await response.json();
      setSuccess(data.message);
      setFormData({ title: '', message: '', type: 'info' });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Notification Center</h2>
          <p className="text-gray-600 mt-2">Send notifications to users</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notification Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Compose Notification</h3>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter notification title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="6"
                  placeholder="Enter notification message"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || selectedUsers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                  <span>
                    Send to {selectedUsers.length} {selectedUsers.length === 1 ? 'user' : 'users'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={loading || !formData.title || !formData.message}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Broadcast All
                </button>
              </div>

              <p className="text-xs text-gray-600 mt-2">
                Selected: {selectedUsers.length} users | Total: {totalUsers} users
              </p>
            </form>
          </div>

          {/* Users List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Select Users</h3>

            {usersLoading ? (
              <div className="text-center py-8 text-gray-600">Loading users...</div>
            ) : (
              <>
                {/* Select All */}
                <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg mb-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({users.length})
                  </span>
                </label>

                {/* Users List */}
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {users.map((user) => (
                    <label
                      key={user._id}
                      className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700 truncate">
                        {user.username}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationCenter;
