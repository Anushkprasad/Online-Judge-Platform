import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Trash2, Edit2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const ProblemsManagement = () => {
  const { token } = useContext(AuthContext);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    category: '',
  });
  const limit = 10;

  useEffect(() => {
    fetchProblems();
  }, [search, difficulty, currentPage]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(search && { search }),
        ...(difficulty && { difficulty }),
      });

      const response = await fetch(`http://localhost:5000/api/admin/problems?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch problems');
      }

      const data = await response.json();
      setProblems(data.data);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/problems', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create problem');
      }

      setFormData({ title: '', description: '', difficulty: 'medium', category: '' });
      setShowModal(false);
      fetchProblems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProblem = async (problemId) => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/problems/${problemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete problem');
      }

      setProblems(problems.filter((p) => p._id !== problemId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && problems.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-gray-600">Loading problems...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Problem Management</h2>
            <p className="text-gray-600 mt-2">Create and manage coding problems</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>New Problem</span>
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Problem</h3>
              <form onSubmit={handleCreateProblem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="4"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Problems Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Title
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Category
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Difficulty
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Created By
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={problem._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-900 font-medium">{problem.title}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{problem.category}</td>
                  <td className="py-4 px-6 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        problem.difficulty === 'easy'
                          ? 'bg-green-100 text-green-800'
                          : problem.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {problem.createdBy?.username || 'Unknown'}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <button
                      onClick={() => handleDeleteProblem(problem._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
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
      </div>
    </AdminLayout>
  );
};

export default ProblemsManagement;
