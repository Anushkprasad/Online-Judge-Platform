import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';

const UsersManagement = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('user');
  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [search, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(search && { search }),
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
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      setUsers(
        users.map((user) => (user._id === userId ? { ...user, role: newRole } : user))
      );
      setEditingUser(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <input
            type="text"
            placeholder="Search users by username or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Username
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Role
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Verified
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-900 font-medium">{user.username}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{user.email}</td>
                  <td className="py-4 px-6 text-sm">
                    {editingUser === user._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRoleChange(user._id, selectedRole)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.isVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(user._id);
                          setSelectedRole(user.role);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit role"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UsersManagement;
