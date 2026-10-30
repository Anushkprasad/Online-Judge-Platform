import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  BookOpen,
  Trophy,
  MessageSquare,
  Bell,
  Code,
  Menu,
  X,
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Problems', icon: Code, path: '/admin/problems' },
    { name: 'Courses', icon: BookOpen, path: '/admin/courses' },
    { name: 'Contests', icon: Trophy, path: '/admin/contests' },
    { name: 'Discussions', icon: MessageSquare, path: '/admin/discussions' },
    { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <span className="text-xl font-bold">Admin</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
