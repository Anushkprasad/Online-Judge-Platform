import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, GraduationCap, ChevronRight, CheckCircle2, Bookmark } from 'lucide-react';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/courses');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      await axios.post(`/courses/${courseId}/enroll`);
      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error('Failed to enroll in course:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Learning Academy</h1>
        <p className="text-slate-400">Structured interactive courses to master programming languages and algorithms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course._id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    course.difficulty === 'beginner'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : course.difficulty === 'intermediate'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {course.difficulty}
                </span>
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1.5">{course.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{course.description}</p>
              </div>

              {course.isEnrolled && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span>Progress</span>
                    <span>{course.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${course.progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium">
                {course.totalLessons} Lessons
              </span>

              {course.isEnrolled ? (
                <button
                  onClick={() => navigate(`/courses/${course._id}`)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-white bg-blue-950/40 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all"
                >
                  Continue Course
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleEnroll(course._id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all"
                >
                  Enroll Now
                  <GraduationCap className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
