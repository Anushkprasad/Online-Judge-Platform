import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { Trash2, Edit2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const CoursesManagement = () => {
  const { token } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
  });
  const limit = 10;

  useEffect(() => {
    fetchCourses();
  }, [search, currentPage]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(search && { search }),
      });

      const response = await fetch(`http://localhost:5000/api/admin/courses?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.data);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      setFormData({ title: '', description: '', category: '', difficulty: 'beginner' });
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      setCourses(courses.filter((c) => c._id !== courseId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && courses.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-gray-600">Loading courses...</div>
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
            <h2 className="text-3xl font-bold text-gray-900">Course Management</h2>
            <p className="text-gray-600 mt-2">Create and manage courses</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>New Course</span>
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Create New Course</h3>
              <form onSubmit={handleCreateCourse} className="space-y-4">
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
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
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

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Courses Table */}
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
                  Instructor
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm text-gray-900 font-medium">{course.title}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{course.category}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {course.difficulty}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {course.instructor?.username || 'Unknown'}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
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

export default CoursesManagement;
