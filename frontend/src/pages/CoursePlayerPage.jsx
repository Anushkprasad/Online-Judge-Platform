import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle, 
  Code2, 
  Trophy, 
  Bookmark, 
  Send,
  AlertCircle,
  FileCode,
  GraduationCap
} from 'lucide-react';

const CoursePlayerPage = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Lesson state
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  
  // Tabs: 'notes' | 'quiz' | 'assignment' | 'certificate'
  const [activeTab, setActiveTab] = useState('notes');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // Assignment state
  const [assignmentLanguage, setAssignmentLanguage] = useState('python');
  const [assignmentCode, setAssignmentCode] = useState('');
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Certificate state
  const [certificateData, setCertificateData] = useState(null);

  const fetchCourseData = async () => {
    try {
      const response = await axios.get(`/courses/${id}`);
      const data = response.data.data;
      setCourse(data);

      const progress = response.data.progress;
      if (progress) {
        setCurrentLessonIndex(progress.lastAccessedLessonIndex || 0);
        setCompletedLessons(progress.completedLessonsIndices || []);
      }
    } catch (error) {
      console.error('Failed to fetch course detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const currentLesson = course?.lessons?.[currentLessonIndex];

  // Sync assignment template code
  useEffect(() => {
    if (currentLesson?.assignment) {
      setAssignmentCode(currentLesson.assignment.templateCode || '');
    }
    // Reset states on lesson change
    setQuizAnswers({});
    setQuizResult(null);
    setAssignmentResult(null);
  }, [currentLessonIndex, course]);

  // Update progression API
  const handleMarkComplete = async (completed) => {
    try {
      const response = await axios.put(`/courses/${id}/progress`, {
        lessonIndex: currentLessonIndex,
        isCompleted: completed,
      });
      setCompletedLessons(response.data.progress.completedLessonsIndices);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  // Submit Quiz logic
  const handleSubmitQuiz = async () => {
    try {
      const answersArray = Object.keys(quizAnswers).map((k) => quizAnswers[k]);
      const response = await axios.post(`/courses/${id}/quiz`, {
        lessonIndex: currentLessonIndex,
        answers: answersArray,
      });
      setQuizResult(response.data);
      if (response.data.score >= 80) {
        handleMarkComplete(true);
      }
    } catch (error) {
      console.error('Failed to evaluate quiz:', error);
    }
  };

  // Submit Assignment code logic
  const handleSubmitAssignment = async () => {
    setAssignmentLoading(true);
    setAssignmentResult(null);
    try {
      const response = await axios.post(`/courses/${id}/assignment`, {
        lessonIndex: currentLessonIndex,
        language: assignmentLanguage,
        code: assignmentCode,
      });
      setAssignmentResult(response.data);
      if (response.data.passed) {
        handleMarkComplete(true);
      }
    } catch (error) {
      setAssignmentResult({
        success: false,
        error: error.response?.data?.message || 'Execution failed',
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Claim Certificate logic
  const handleClaimCertificate = async () => {
    try {
      const response = await axios.post(`/courses/${id}/certificate`);
      setCertificateData(response.data.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to issue certificate.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        Loading course player...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center text-slate-400">
        Course not found. <Link to="/courses" className="text-blue-500 hover:underline">Back to catalog</Link>
      </div>
    );
  }

  const isAllLessonsCompleted = completedLessons.length >= course.lessons.length;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-950">
      {/* Left Sidebar: Lessons Index */}
      <aside className="w-full lg:w-80 border-r border-slate-900 overflow-y-auto flex flex-col bg-slate-900/10">
        <div className="p-4 border-b border-slate-900">
          <h2 className="font-bold text-white text-base">{course.title}</h2>
          <p className="text-xs text-slate-400 mt-1">{completedLessons.length} of {course.lessons.length} completed</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {course.lessons.map((lesson, index) => {
            const isCurrent = index === currentLessonIndex;
            const isCompleted = completedLessons.includes(index);
            return (
              <button
                key={lesson._id}
                onClick={() => {
                  setCurrentLessonIndex(index);
                  setActiveTab('notes');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm text-left transition-all ${
                  isCurrent 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                    : 'text-slate-300 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {isCompleted ? (
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-500'}`} />
                  ) : (
                    <Play className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-slate-500'}`} />
                  )}
                  <span className="truncate font-medium">{lesson.title}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {isAllLessonsCompleted && (
          <div className="p-4 border-t border-slate-900 bg-slate-950/40">
            <button
              onClick={() => setActiveTab('certificate')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-extrabold text-xs py-3 rounded-lg shadow-lg transition-all"
            >
              <Trophy className="w-4 h-4" />
              Claim Completion Award
            </button>
          </div>
        )}
      </aside>

      {/* Right Main Panel: Player Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Workspace Toolbar */}
        <div className="flex border-b border-slate-900 bg-slate-900/30">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'notes' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Lecture & Notes
          </button>

          {currentLesson?.quiz?.length > 0 && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'quiz' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Lesson Quiz
            </button>
          )}

          {currentLesson?.assignment && (
            <button
              onClick={() => setActiveTab('assignment')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'assignment' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Hands-on Assignment
            </button>
          )}
        </div>

        {/* Dynamic Window Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'notes' && currentLesson && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">{currentLesson.title}</h1>
                <button
                  onClick={() => handleMarkComplete(!completedLessons.includes(currentLessonIndex))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    completedLessons.includes(currentLessonIndex)
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {completedLessons.includes(currentLessonIndex) ? 'Completed' : 'Mark Done'}
                </button>
              </div>

              {/* Video Player Frame */}
              {currentLesson.videoUrl && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                  <iframe
                    src={currentLesson.videoUrl}
                    title={currentLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                </div>
              )}

              {/* Markdown Notes */}
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {currentLesson.content}
              </div>

              {/* Code Examples */}
              {currentLesson.codeExamples && currentLesson.codeExamples.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white">Code Reference Examples</h3>
                  <div className="space-y-3">
                    {currentLesson.codeExamples.map((ex, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 border-b border-slate-800/80 text-xs font-bold text-slate-400 flex justify-between bg-slate-900/50">
                          <span>{ex.title}</span>
                          <span className="uppercase text-[9px]">{ex.language}</span>
                        </div>
                        <pre className="p-4 font-mono text-xs text-blue-400 bg-slate-950 overflow-x-auto whitespace-pre">{ex.code}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && currentLesson?.quiz && (
            <div className="max-w-2xl space-y-6">
              <h2 className="text-xl font-bold text-white">Lesson Evaluation Quiz</h2>
              <div className="space-y-6">
                {currentLesson.quiz.map((q, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                    <div className="text-sm font-semibold text-slate-200">{idx + 1}. {q.question}</div>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[idx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [idx]: optIdx })}
                            className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {quizResult ? (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-white">Quiz Score: {quizResult.score}%</div>
                    <div className="text-xs text-slate-400 mt-1">Passing requirement: 80% • {quizResult.correctCount} of {quizResult.totalCount} correct</div>
                  </div>
                  {quizResult.score >= 80 ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                      Passed
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
                      Try Again
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-lg transition-all"
                >
                  Grade Quiz answers
                </button>
              )}
            </div>
          )}

          {activeTab === 'assignment' && currentLesson?.assignment && (
            <div className="flex flex-col h-full gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
                <h3 className="font-bold text-white text-base">Assignment Target</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{currentLesson.assignment.question}</p>
                <div className="text-xs text-slate-500 font-medium whitespace-pre-wrap">{currentLesson.assignment.instructions}</div>
              </div>

              <div className="flex-1 min-h-[300px] border border-slate-850 rounded-xl overflow-hidden flex flex-col bg-slate-950">
                <div className="h-10 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between px-4">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" /> Workspace Code Editor
                  </span>
                  <select
                    value={assignmentLanguage}
                    onChange={(e) => setAssignmentLanguage(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] rounded px-2 py-1 outline-none"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={assignmentLanguage}
                    theme="vs-dark"
                    value={assignmentCode}
                    onChange={(val) => setAssignmentCode(val || '')}
                    options={{ fontSize: 13, minimap: { enabled: false } }}
                  />
                </div>
              </div>

              {assignmentResult && (
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    {assignmentResult.passed ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> Assignment Passed
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-4 h-4" /> Grade Rejected
                      </span>
                    )}
                  </div>
                  {assignmentResult.output && (
                    <div>
                      <div className="text-slate-500 uppercase text-[9px]">Stdout:</div>
                      <pre className="text-slate-300 p-1 mt-0.5 max-h-24 overflow-x-auto">{assignmentResult.output}</pre>
                    </div>
                  )}
                  {assignmentResult.error && (
                    <div className="text-rose-400">{assignmentResult.error}</div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitAssignment}
                  disabled={assignmentLoading}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {assignmentLoading ? 'Grading...' : 'Submit Assignment'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'certificate' && (
            <div className="flex flex-col items-center justify-center py-12 max-w-3xl mx-auto space-y-8">
              {!certificateData ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center max-w-md mx-auto space-y-4">
                  <div className="bg-amber-500/10 text-amber-500 p-4 rounded-full">
                    <Trophy className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Course Completed!</h3>
                  <p className="text-sm text-slate-400">
                    Congratulations! You have completed all lessons and graded materials in this programming track.
                  </p>
                  <button
                    onClick={handleClaimCertificate}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold px-6 py-3 rounded-lg shadow-lg transition-all text-xs"
                  >
                    <GraduationCap className="w-4 h-4 font-bold" />
                    Claim Certificate
                  </button>
                </div>
              ) : (
                <div className="w-full bg-slate-900 border border-amber-600/40 p-12 rounded-xl text-center flex flex-col items-center shadow-2xl relative overflow-hidden print:p-8">
                  {/* Decorative backgrounds */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-8 -mt-8"></div>
                  
                  <div className="border-4 border-double border-amber-500/30 p-8 w-full flex flex-col items-center">
                    <Trophy className="w-12 h-12 text-amber-500 mb-6" />
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Certificate of Completion</span>
                    <h2 className="text-3xl font-extrabold text-white mt-4 tracking-tight">CodeRank Academy</h2>
                    
                    <p className="text-slate-400 text-sm italic mt-8">This certifies that student</p>
                    <p className="text-2xl font-bold text-blue-500 underline decoration-blue-500/30 underline-offset-8 mt-2">{certificateData.issuedTo}</p>
                    
                    <p className="text-slate-400 text-sm mt-8">has successfully fulfilled all course syllabus requirements for</p>
                    <p className="text-lg font-bold text-white mt-1.5">{certificateData.courseTitle}</p>
                    
                    <div className="flex justify-between items-center w-full max-w-sm mt-12 pt-6 border-t border-slate-800/80 text-xs text-slate-500">
                      <div>
                        <div>Issued on</div>
                        <div className="text-slate-400 font-semibold">{new Date(certificateData.issuedAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div>Certificate ID</div>
                        <div className="text-slate-400 font-mono select-all">{certificateData.certificateId.slice(-12)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CoursePlayerPage;
