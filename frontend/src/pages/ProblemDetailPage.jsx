import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { 
  BookOpen, 
  HelpCircle, 
  Lightbulb, 
  Lock, 
  Play, 
  Send, 
  Terminal, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const ProblemDetailPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get('contest');
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'description' | 'editorial' | 'hints' | 'submissions' | 'discussions'
  const [activeTab, setActiveTab] = useState('description');
  const [activeHintIndex, setActiveHintIndex] = useState(null);
  const [discussionForm, setDiscussionForm] = useState({ title: '', content: '' });

  // Editor states
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  
  // Execution states
  const [outputLoading, setOutputLoading] = useState(false);
  const [submissionPolling, setSubmissionPolling] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [discussions, setDiscussions] = useState([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);

  const fetchProblemDetails = async () => {
    try {
      const response = await axios.get(`/problems/${slug}`);
      const data = response.data.data;
      setProblem(data);
      
      setCode(getStarterCode(language, data));
    } catch (error) {
      console.error('Failed to load problem details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!problem) return;
    setSubmissionsLoading(true);
    try {
      const response = await axios.get(`/submissions/user/${problem._id}`);
      setSubmissions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    setDiscussionsLoading(true);
    try {
      const response = await axios.get('/discussions', { params: { problem: slug } });
      setDiscussions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch discussions:', error);
    } finally {
      setDiscussionsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemDetails();
  }, [slug]);

  useEffect(() => {
    if (activeTab === 'submissions' && problem) {
      fetchSubmissions();
    }
    if (activeTab === 'discussions' && problem) {
      fetchDiscussions();
    }
  }, [activeTab, problem]);

  // Handle language switch template mapping
  useEffect(() => {
    if (problem) {
      setCode(getStarterCode(language, problem));
    }
  }, [language]);

  const getStarterCode = (lang, problemData) => {
    const template = problemData.starterTemplates?.find((t) => t.language === lang);
    if (template?.code && !isGenericStarter(template.code)) {
      return template.code;
    }

    return getDefaultStarter(lang, problemData);
  };

  const isGenericStarter = (templateCode) => {
    const executableLines = templateCode
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && !line.startsWith('//'));

    return executableLines.length === 0;
  };

  const getDefaultStarter = (lang, problemData) => {
    const title = problemData.title.toLowerCase();
    const description = problemData.description.toLowerCase();

    switch (lang) {
      case 'python':
        if (title.includes('sum') && description.includes('two integers')) {
          return `a, b = map(int, input().split())\nprint(a + b)\n`;
        }
        if (title.includes('maximum') && description.includes('three integers')) {
          return `values = list(map(int, input().split()))\nprint(max(values))\n`;
        }
        if (title.includes('palindrome')) {
          return `s = input().strip()\nprint("YES" if s == s[::-1] else "NO")\n`;
        }
        if (title.includes('factorial')) {
          return `n = int(input())\nanswer = 1\nfor value in range(2, n + 1):\n    answer *= value\nprint(answer)\n`;
        }
        return `# Read from stdin and print the answer.\n# Example:\n# a, b = map(int, input().split())\n# print(a + b)\n`;
      default:
        return `// Write your code here`;
    }
  };

  // Run Code logic (Placeholder for Phase 3 integration)
  const handleRunCode = async () => {
    if (!problem) return;
    setOutputLoading(true);
    setExecutionResult(null);
    try {
      // Direct post to backend submissions runner
      const response = await axios.post('/submissions/run', {
        problemId: problem._id,
        language,
        code,
        customInput,
      });
      setExecutionResult(response.data);
    } catch (error) {
      setExecutionResult({
        success: false,
        error: getRequestErrorMessage(error, 'Execution failed'),
      });
    } finally {
      setOutputLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem) return;
    setOutputLoading(true);
    setExecutionResult(null);
    try {
      const response = await axios.post('/submissions', {
        problemId: problem._id,
        language,
        code,
        contestId,
      });
      setOutputLoading(false);
      setSubmissionPolling(true);
      setExecutionResult({
        ...response.data,
        status: response.data.status || 'Queued',
      });

      if (response.data.submissionId) {
        await pollSubmissionStatus(response.data.submissionId);
      }
    } catch (error) {
      setExecutionResult({
        success: false,
        error: getRequestErrorMessage(error, 'Submission failed'),
      });
    } finally {
      setOutputLoading(false);
      setSubmissionPolling(false);
    }
  };

  const getRequestErrorMessage = (error, fallback) => {
    if (!error.response) {
      return 'Backend server is not reachable. Please start/restart the backend and try again.';
    }

    const data = error.response.data;
    if (typeof data === 'string') {
      return data;
    }

    return data?.message || data?.error || fallback;
  };

  const pollSubmissionStatus = async (submissionId) => {
    const terminalStatuses = new Set([
      'Accepted',
      'Wrong Answer',
      'Time Limit Exceeded',
      'Runtime Error',
      'Compilation Error',
    ]);

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 500 : 1500));
      const response = await axios.get(`/submissions/${submissionId}/status`);
      const submission = response.data.data;

      setExecutionResult({
        success: true,
        submissionId,
        status: submission.status,
        runtime: submission.runtime,
        memory: submission.memory,
        error: submission.error,
        failedTestCaseIndex: submission.failedTestCaseIndex,
      });

      if (terminalStatuses.has(submission.status)) {
        fetchProblemDetails();
        if (activeTab === 'submissions') {
          fetchSubmissions();
        }
        return;
      }
    }

    setExecutionResult((current) => ({
      ...current,
      error: 'Submission is still queued. Check the submissions tab again in a moment.',
    }));
  };

  const handleCreateDiscussion = async (event) => {
    event.preventDefault();
    if (!problem || !discussionForm.title.trim() || !discussionForm.content.trim()) return;

    try {
      await axios.post('/discussions', {
        title: discussionForm.title,
        content: discussionForm.content,
        problemId: problem._id,
        tags: [problem.category, problem.difficulty],
      });
      setDiscussionForm({ title: '', content: '' });
      fetchDiscussions();
    } catch (error) {
      console.error('Failed to create discussion:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        Loading workspace...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8 text-center text-slate-400">
        Problem not found. <Link to="/problems" className="text-blue-500 hover:underline">Go back to list</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-950">
      {/* Left Pane: Tabs and Details */}
      <div className="w-full lg:w-1/2 flex flex-col border-r border-slate-900 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-900 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('description')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'description' 
                ? 'border-blue-500 text-white bg-slate-900/60' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Description
          </button>
          <button
            onClick={() => setActiveTab('editorial')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'editorial' 
                ? 'border-blue-500 text-white bg-slate-900/60' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Editorial
            {problem.editorial === 'LOCKED' && <Lock className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={() => setActiveTab('hints')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'hints' 
                ? 'border-blue-500 text-white bg-slate-900/60' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Hints
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'submissions' 
                ? 'border-blue-500 text-white bg-slate-900/60' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Submissions
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'discussions' 
                ? 'border-blue-500 text-white bg-slate-900/60' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Discussions
          </button>
        </div>

        {/* Tab Contents Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'description' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">{problem.title}</h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    problem.difficulty === 'easy'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : problem.difficulty === 'medium'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </span>
              </div>

              {/* Problem Description */}
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>

              {/* Constraints */}
              {problem.constraints && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Constraints</h3>
                  <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap">
                    {problem.constraints}
                  </div>
                </div>
              )}

              {/* Sample Examples */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Examples</h3>
                {problem.testCases?.filter(tc => tc.isSample).map((tc, index) => (
                  <div key={index} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-400">Example {index + 1}:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <div className="text-slate-500 mb-1">Input</div>
                        <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto text-slate-300">{tc.input}</pre>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Output</div>
                        <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 overflow-x-auto text-slate-300">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'editorial' && (
            <div className="space-y-6">
              {problem.editorial === 'LOCKED' ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center max-w-md mx-auto space-y-4 my-8">
                  <div className="bg-amber-500/10 text-amber-500 p-3 rounded-full">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Editorial Locked</h3>
                  <p className="text-sm text-slate-400">
                    Solve the problem or attempt it at least <span className="text-white font-semibold">3 times</span> to unlock editorial notes and sample solutions.
                  </p>
                  <div className="text-xs text-slate-500">
                    Your Attempts: {problem.attemptsCount} / 3
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white">Editorial Solutions & Explanation</h2>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {problem.editorial}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Hints</h2>
              {problem.hints && problem.hints.length > 0 ? (
                <div className="space-y-3">
                  {problem.hints.map((hint, idx) => (
                    <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                      <button
                        onClick={() => setActiveHintIndex(activeHintIndex === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-sm font-semibold text-slate-200 hover:bg-slate-800/40 transition-colors"
                      >
                        <span>Hint {idx + 1}</span>
                        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${activeHintIndex === idx ? 'rotate-90' : ''}`} />
                      </button>
                      {activeHintIndex === idx && (
                        <div className="p-4 border-t border-slate-800/60 bg-slate-900/65 text-slate-300 text-sm leading-relaxed">
                          {hint}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No hints available for this problem.</div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Submission History</h2>
              {submissionsLoading ? (
                <div className="text-slate-500 animate-pulse">Loading submission records...</div>
              ) : submissions.length === 0 ? (
                <div className="text-sm text-slate-500">You haven't submitted any solutions for this problem yet.</div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub._id} className="bg-slate-900 border border-slate-850 rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${sub.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {sub.status}
                          </span>
                          <span className="text-xs text-slate-500">• {sub.language}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                        <div>Runtime: {sub.runtime} ms</div>
                        <div>Memory: {sub.memory} KB</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discussions' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">Problem Discussions</h2>
              <form onSubmit={handleCreateDiscussion} className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
                <input
                  value={discussionForm.title}
                  onChange={(e) => setDiscussionForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-600"
                />
                <textarea
                  value={discussionForm.content}
                  onChange={(e) => setDiscussionForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Ask a question or share an approach..."
                  className="min-h-24 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-600"
                />
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                  Start Discussion
                </button>
              </form>

              {discussionsLoading ? (
                <div className="text-sm text-slate-500">Loading discussions...</div>
              ) : discussions.length === 0 ? (
                <div className="text-sm text-slate-500">No threads for this problem yet.</div>
              ) : (
                <div className="space-y-3">
                  {discussions.map((thread) => (
                    <Link key={thread._id} to="/forum" className="block rounded-lg border border-slate-800 bg-slate-900 p-4 hover:bg-slate-800/40">
                      <div className="font-semibold text-slate-100">{thread.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{thread.comments?.length || 0} comments · {thread.likes?.length || 0} likes</div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{thread.content}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Editor & Output Panel */}
      <div className="w-full lg:w-1/2 flex flex-col overflow-hidden bg-slate-950">
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-slate-900 bg-slate-950 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-600 transition-all font-semibold"
            >
              <option value="python">Python 3</option>
            </select>
            {contestId && (
              <Link
                to={`/contests/${contestId}`}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Contest mode
              </Link>
            )}
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 min-h-[300px]">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'javascript' ? 'javascript' : 'python'}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
              fontFamily: 'Fira Code, Source Code Pro, monospace',
            }}
          />
        </div>

        {/* Console / Output Panel */}
        <div className="h-64 border-t border-slate-900 bg-slate-950 flex flex-col">
          {/* Panel Header */}
          <div className="h-10 border-b border-slate-900 flex items-center justify-between px-4 bg-slate-900/20">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Console & Run Output
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Custom Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Testcase Input</label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Paste your custom input parameters here..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-xs text-slate-300 outline-none resize-none focus:border-blue-600 placeholder:text-slate-800"
              />
            </div>

            {/* Results Logs */}
            <div className="flex flex-col gap-1.5 bg-slate-950 border border-slate-900 rounded p-3 text-xs font-mono">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Execution Status</div>
              {outputLoading ? (
                <div className="text-slate-500 animate-pulse">Running compiler operations...</div>
              ) : executionResult ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {executionResult.status === 'Accepted' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Accepted
                      </span>
                    ) : ['Queued', 'Running', 'Pending'].includes(executionResult.status) ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Terminal className="w-4 h-4" /> {executionResult.status}
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> {executionResult.status || 'Execution Error'}
                      </span>
                    )}
                    {executionResult.runtime !== undefined && (
                      <span className="text-slate-500">({executionResult.runtime} ms)</span>
                    )}
                  </div>
                  {executionResult.output && (
                    <div>
                      <div className="text-slate-600 text-[10px] uppercase">Stdout:</div>
                      <pre className="text-slate-300 bg-slate-900 p-1.5 rounded overflow-x-auto mt-0.5 max-h-24">{executionResult.output}</pre>
                    </div>
                  )}
                  {executionResult.error && (
                    <div className="text-rose-400 bg-rose-950/20 border border-rose-900/50 p-2 rounded text-xs flex gap-1.5 items-start">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="break-all">{executionResult.error}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-700">Submit your solution or run a test case to see results.</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="h-14 border-t border-slate-900 flex items-center justify-end px-4 gap-3 bg-slate-900/20">
            <button
              onClick={handleRunCode}
              disabled={outputLoading || submissionPolling}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-50 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Run Code
            </button>
            <button
              onClick={handleSubmitCode}
              disabled={outputLoading || submissionPolling}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 disabled:opacity-50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {submissionPolling ? 'Judging...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetailPage;
