import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Github, Linkedin, Code2, Save, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setSkills(user.skills ? user.skills.join(', ') : '');
      setGithubUrl(user.githubUrl || '');
      setLinkedinUrl(user.linkedinUrl || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await axios.get('/submissions/my');
        setSubmissions(response.data.data || []);
      } catch (error) {
        console.error('Failed to load submission history:', error);
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const skillsArray = skills
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);

    const result = await updateProfile({
      bio,
      skills: skillsArray,
      githubUrl,
      linkedinUrl,
      profilePicture,
    });

    setLoading(false);

    if (result.success) {
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setError(result.message);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading profile information...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400">Manage your avatar, portfolio, and programming expertise details</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900/50 text-emerald-200 px-4 py-3 rounded-lg text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/50 text-red-200 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card View */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              src={profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-600/30"
            />
            <div className="absolute bottom-1 right-1 bg-blue-600 p-1.5 rounded-full text-white">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{user.username}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
          </div>

          {user.bio && (
            <p className="text-slate-300 text-sm italic py-2 border-t border-b border-slate-800/60 w-full">
              "{user.bio}"
            </p>
          )}

          <div className="flex gap-4 pt-2">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Editor Form */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Avatar Image URL</label>
                <input
                  type="text"
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  placeholder="https://cloudinary.com/... or base64"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg px-4 py-2.5 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Programming Skills</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Code2 className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Python, React, Data Structures"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell us about yourself, your coding journey, and projects..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg px-4 py-2.5 outline-none transition-all placeholder:text-slate-700 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">GitHub URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Github className="w-5 h-5" />
                  </span>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">LinkedIn URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Linkedin className="w-5 h-5" />
                  </span>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-white rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/60">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Recent Submissions</h2>
          <p className="text-sm text-slate-400">Last 10 verdicts for the demo flow</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Problem</th>
                <th className="px-6 py-3">Language</th>
                <th className="px-6 py-3">Verdict</th>
                <th className="px-6 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {submissionsLoading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading submissions...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No submissions yet.</td></tr>
              ) : submissions.map((submission) => (
                <tr key={submission._id}>
                  <td className="px-6 py-4 font-semibold text-slate-100">{submission.problemId?.title || 'Problem'}</td>
                  <td className="px-6 py-4 text-slate-300">{submission.language}</td>
                  <td className={`px-6 py-4 font-bold ${submission.verdict === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {submission.verdict}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{new Date(submission.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
