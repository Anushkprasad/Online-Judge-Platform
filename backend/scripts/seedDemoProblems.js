const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Problem = require('../src/models/Problem');

dotenv.config();

const starters = {
  sumTwoNumbers: `a, b = map(int, input().split())
print(a + b)
`,
  maximumOfThree: `values = list(map(int, input().split()))
print(max(values))
`,
  palindromeString: `s = input().strip()
print("YES" if s == s[::-1] else "NO")
`,
  factorial: `n = int(input())
answer = 1
for value in range(2, n + 1):
    answer *= value
print(answer)
`,
};

const problems = [
  {
    title: 'Sum of Two Numbers',
    slug: 'sum-of-two-numbers',
    description: 'Given two integers a and b on one line, print their sum.',
    difficulty: 'easy',
    category: 'Basics',
    tags: ['Input Output', 'Math'],
    constraints: '-10^9 <= a, b <= 10^9',
    testCases: [
      { input: '2 3\n', output: '5\n', isSample: true },
      { input: '-4 10\n', output: '6\n' },
      { input: '100 250\n', output: '350\n' },
    ],
    starterTemplates: [{ language: 'python', code: starters.sumTwoNumbers }],
    editorial: 'Read two integers with map(int, input().split()) and print their sum.',
    hints: ['Use split() to separate the two numbers.'],
  },
  {
    title: 'Maximum of Three',
    slug: 'maximum-of-three',
    description: 'Given three integers, print the largest one.',
    difficulty: 'easy',
    category: 'Basics',
    tags: ['Math'],
    constraints: '-10^9 <= each number <= 10^9',
    testCases: [
      { input: '4 9 2\n', output: '9\n', isSample: true },
      { input: '-5 -1 -9\n', output: '-1\n' },
      { input: '7 7 3\n', output: '7\n' },
    ],
    starterTemplates: [{ language: 'python', code: starters.maximumOfThree }],
    editorial: 'Read the three integers and print max(values).',
    hints: ['Python has a built-in max() function.'],
  },
  {
    title: 'Palindrome String',
    slug: 'palindrome-string',
    description: 'Given a string s, print YES if it is a palindrome, otherwise print NO.',
    difficulty: 'medium',
    category: 'Strings',
    tags: ['Strings', 'Two Pointers'],
    constraints: '1 <= |s| <= 100000',
    testCases: [
      { input: 'level\n', output: 'YES\n', isSample: true },
      { input: 'coderank\n', output: 'NO\n' },
      { input: 'madam\n', output: 'YES\n' },
    ],
    starterTemplates: [{ language: 'python', code: starters.palindromeString }],
    editorial: 'Compare s with s[::-1].',
    hints: ['A reversed string in Python can be written as s[::-1].'],
  },
  {
    title: 'Factorial',
    slug: 'factorial',
    description: 'Given an integer n, print n factorial.',
    difficulty: 'medium',
    category: 'Math',
    tags: ['Loops', 'Math'],
    constraints: '0 <= n <= 12',
    testCases: [
      { input: '5\n', output: '120\n', isSample: true },
      { input: '0\n', output: '1\n' },
      { input: '7\n', output: '5040\n' },
    ],
    starterTemplates: [{ language: 'python', code: starters.factorial }],
    editorial: 'Initialize ans = 1 and multiply numbers from 2 through n.',
    hints: ['Remember that 0! is 1.'],
  },
];

const seed = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Set it in backend/.env first.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  for (const problem of problems) {
    await Problem.findOneAndUpdate(
      { slug: problem.slug },
      problem,
      { upsert: true, new: true, runValidators: true }
    );
  }

  console.log(`Seeded ${problems.length} demo problems into ${mongoose.connection.name}.`);
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(`Demo seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
