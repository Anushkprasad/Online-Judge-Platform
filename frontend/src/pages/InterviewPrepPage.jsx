import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Briefcase, CheckCircle2, ClipboardList, Mic, Search, Send } from 'lucide-react';

const tabs = [
  { id: 'questions', label: 'Question Bank', icon: Briefcase },
  { id: 'aptitude', label: 'Aptitude Tests', icon: ClipboardList },
  { id: 'mock', label: 'Mock Interview', icon: Mic },
];

const InterviewPrepPage = () => {
  const [activeTab, setActiveTab] = useState('questions');
  const [company, setCompany] = useState('');
  const [type, setType] = useState('');
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [grade, setGrade] = useState(null);
  const [session, setSession] = useState(null);
  const [mockAnswer, setMockAnswer] = useState('');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const activeMockQuestion = useMemo(() => session?.questions?.[activeQuestionIndex], [session, activeQuestionIndex]);

  const fetchQuestions = useCallback(async () => {
    const params = {};
    if (company) params.company = company;
    if (type) params.type = type;
    const response = await axios.get('/interview-prep/questions', { params });
    setQuestions(response.data.data);
  }, [company, type]);

  const fetchTests = useCallback(async () => {
    const response = await axios.get('/interview-prep/aptitude-tests', { params: company ? { company } : {} });
    setTests(response.data.data);
    setSelectedTest((current) => current || response.data.data[0] || null);
  }, [company]);

  useEffect(() => {
    fetchQuestions();
    fetchTests();
  }, [fetchQuestions, fetchTests]);

  const runSearch = (event) => {
    event.preventDefault();
    fetchQuestions();
    fetchTests();
  };

  const gradeTest = async () => {
    if (!selectedTest) return;
    const orderedAnswers = selectedTest.questions.map((_, index) => answers[index]);
    const response = await axios.post(`/interview-prep/aptitude-tests/${selectedTest._id}/grade`, { answers: orderedAnswers });
    setGrade(response.data.data);
  };

  const startMock = async () => {
    const response = await axios.post('/interview-prep/mock-sessions', {
      company,
      mode: type || 'mixed',
      limit: 5,
    });
    setSession(response.data.data);
    setActiveQuestionIndex(0);
    setMockAnswer('');
  };

  const submitMockAnswer = async () => {
    if (!session || !activeMockQuestion || !mockAnswer.trim()) return;
    const response = await axios.post(`/interview-prep/mock-sessions/${session._id}/answers`, {
      questionId: activeMockQuestion._id,
      answer: mockAnswer,
      notes: activeMockQuestion.sampleAnswer,
    });
    setSession(response.data.data);
    setMockAnswer('');
    setActiveQuestionIndex((index) => Math.min(index + 1, response.data.data.questions.length - 1));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Interview Prep</h1>
        <p className="text-slate-400">Practice company-wise technical questions, HR prompts, aptitude tests, and mock rounds.</p>
      </div>

      <form onSubmit={runSearch} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 lg:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company, e.g. Google" className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-600" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-600">
          <option value="">All modes</option>
          <option value="technical">Technical</option>
          <option value="hr">HR</option>
        </select>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Apply</button>
      </form>

      <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold ${activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'questions' && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {questions.map((question) => (
            <article key={question._id} className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase text-blue-400">{question.company}</span>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">{question.type}</span>
              </div>
              <h2 className="font-bold text-white">{question.title}</h2>
              <p className="text-sm text-slate-300">{question.prompt}</p>
              <div className="text-xs text-slate-500">{question.topics?.join(' · ')}</div>
            </article>
          ))}
        </section>
      )}

      {activeTab === 'aptitude' && (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-slate-800 bg-slate-900 divide-y divide-slate-800 overflow-hidden">
            {tests.map((test) => (
              <button key={test._id} onClick={() => { setSelectedTest(test); setAnswers({}); setGrade(null); }} className={`w-full p-4 text-left ${selectedTest?._id === test._id ? 'bg-slate-800/70' : 'hover:bg-slate-800/30'}`}>
                <div className="font-semibold text-white">{test.title}</div>
                <div className="text-xs text-slate-500">{test.durationMinutes} minutes · {test.questions.length} questions</div>
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-5">
            {selectedTest ? selectedTest.questions.map((question, index) => (
              <div key={question._id || index} className="space-y-3">
                <div className="font-semibold text-white">{index + 1}. {question.question}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <button key={option} onClick={() => setAnswers((prev) => ({ ...prev, [index]: optionIndex }))} className={`rounded-lg border px-3 py-2 text-left text-sm ${answers[index] === optionIndex ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 text-slate-300 hover:border-slate-700'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )) : <div className="text-slate-500">Select an aptitude test.</div>}
            {selectedTest && <button onClick={gradeTest} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Grade Test</button>}
            {grade && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">Score: {grade.score}/{grade.total} · {grade.percentage}%</div>}
          </div>
        </section>
      )}

      {activeTab === 'mock' && (
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-5 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Mock Interview Mode</h2>
              <p className="text-sm text-slate-400">Start a focused session from the filtered question bank.</p>
            </div>
            <button onClick={startMock} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
              <Mic className="w-4 h-4" />
              Start Mock
            </button>
          </div>

          {activeMockQuestion ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="text-xs font-bold uppercase text-blue-400">Question {activeQuestionIndex + 1} of {session.questions.length}</div>
                <h3 className="mt-2 font-bold text-white">{activeMockQuestion.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{activeMockQuestion.prompt}</p>
              </div>
              <textarea value={mockAnswer} onChange={(e) => setMockAnswer(e.target.value)} placeholder="Speak or type your answer notes..." className="min-h-32 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-600" />
              <button onClick={submitMockAnswer} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                <Send className="w-4 h-4" />
                Submit Answer
              </button>
              {session.status === 'completed' && <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400"><CheckCircle2 className="w-4 h-4" />Session completed</div>}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No active mock session yet.</div>
          )}
        </section>
      )}
    </div>
  );
};

export default InterviewPrepPage;
