const {
  AptitudeTest,
  InterviewQuestion,
  MockInterviewSession,
} = require('../models/InterviewPrep');

const starterQuestions = [
  {
    company: 'Google',
    type: 'technical',
    title: 'Design a scalable autocomplete system',
    prompt: 'Walk through data structures, ranking, freshness, latency, and failure modes for search autocomplete.',
    difficulty: 'hard',
    topics: ['system design', 'tries', 'ranking'],
    sampleAnswer: 'Start with requirements, use prefix indexes plus ranking signals, cache hot prefixes, and discuss updates.',
  },
  {
    company: 'Amazon',
    type: 'hr',
    title: 'Ownership example',
    prompt: 'Tell me about a time you took ownership of an ambiguous problem.',
    difficulty: 'medium',
    topics: ['leadership principles', 'behavioral'],
    sampleAnswer: 'Use STAR: context, your decision, measurable result, and what you learned.',
  },
  {
    company: 'Microsoft',
    type: 'technical',
    title: 'Debug a slow API',
    prompt: 'An endpoint suddenly has p95 latency above 2 seconds. How would you investigate?',
    difficulty: 'medium',
    topics: ['debugging', 'observability', 'backend'],
    sampleAnswer: 'Check deploys, traces, DB timings, saturation, cache hit rates, and rollback criteria.',
  },
];

const starterTests = [
  {
    title: 'General Aptitude Sprint',
    company: '',
    durationMinutes: 20,
    questions: [
      {
        question: 'If a number increases by 20% and then decreases by 20%, what is the net change?',
        options: ['No change', '4% decrease', '4% increase', '2% decrease'],
        answerIndex: 1,
        explanation: '100 becomes 120, then 96, so the final value is 4% lower.',
      },
      {
        question: 'A train covers 180 km in 3 hours. What is its average speed?',
        options: ['45 km/h', '60 km/h', '75 km/h', '90 km/h'],
        answerIndex: 1,
        explanation: 'Average speed is distance divided by time: 180 / 3 = 60.',
      },
    ],
  },
];

const ensureStarterContent = async () => {
  const questionCount = await InterviewQuestion.countDocuments();
  if (questionCount === 0) await InterviewQuestion.insertMany(starterQuestions);

  const testCount = await AptitudeTest.countDocuments();
  if (testCount === 0) await AptitudeTest.insertMany(starterTests);
};

exports.getInterviewQuestions = async (req, res, next) => {
  try {
    await ensureStarterContent();
    const { company, type, search } = req.query;
    const query = {};

    if (company) query.company = { $regex: company, $options: 'i' };
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { prompt: { $regex: search, $options: 'i' } },
        { topics: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const questions = await InterviewQuestion.find(query).sort({ company: 1, type: 1, difficulty: 1 });
    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    next(error);
  }
};

exports.createInterviewQuestion = async (req, res, next) => {
  try {
    const question = await InterviewQuestion.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

exports.getAptitudeTests = async (req, res, next) => {
  try {
    await ensureStarterContent();
    const { company } = req.query;
    const query = company ? { company: { $regex: company, $options: 'i' } } : {};
    const tests = await AptitudeTest.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (error) {
    next(error);
  }
};

exports.createAptitudeTest = async (req, res, next) => {
  try {
    const test = await AptitudeTest.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

exports.gradeAptitudeTest = async (req, res, next) => {
  try {
    const { answers = [] } = req.body;
    const test = await AptitudeTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Aptitude test not found' });
    }

    let score = 0;
    const results = test.questions.map((question, index) => {
      const selectedIndex = answers[index];
      const isCorrect = selectedIndex === question.answerIndex;
      if (isCorrect) score += 1;
      return {
        question: question.question,
        selectedIndex,
        answerIndex: question.answerIndex,
        isCorrect,
        explanation: question.explanation,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        score,
        total: test.questions.length,
        percentage: test.questions.length ? Math.round((score / test.questions.length) * 100) : 0,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.startMockInterview = async (req, res, next) => {
  try {
    await ensureStarterContent();
    const { company, mode = 'mixed', limit = 5 } = req.body;
    const query = {};
    if (company) query.company = { $regex: company, $options: 'i' };
    if (mode !== 'mixed') query.type = mode;

    const questions = await InterviewQuestion.find(query).limit(Number(limit));
    const session = await MockInterviewSession.create({
      userId: req.user._id,
      company: company || '',
      mode,
      questions: questions.map((question) => question._id),
    });

    const populated = await session.populate('questions');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

exports.submitMockAnswer = async (req, res, next) => {
  try {
    const { questionId, answer, notes } = req.body;
    const session = await MockInterviewSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Mock interview session not found' });
    }

    const existing = session.answers.find((item) => item.questionId.equals(questionId));
    if (existing) {
      existing.answer = answer;
      existing.notes = notes || existing.notes;
    } else {
      session.answers.push({ questionId, answer, notes: notes || '' });
    }

    if (session.answers.length >= session.questions.length) {
      session.status = 'completed';
    }

    await session.save();
    const populated = await session.populate('questions answers.questionId');
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
