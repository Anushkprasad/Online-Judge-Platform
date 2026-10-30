const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete temp file:', error);
  }
};

const cleanupDirectory = (directoryPath) => {
  try {
    if (directoryPath.startsWith(TEMP_DIR) && fs.existsSync(directoryPath)) {
      fs.rmSync(directoryPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Failed to delete temp directory:', error);
  }
};

const runCode = (language, code, input = '', timeoutMs = 5000) => {
  return new Promise((resolve) => {
    const normalizedLanguage = (language || 'python').toLowerCase();

    if (normalizedLanguage !== 'python') {
      return resolve({
        status: 'Runtime Error',
        error: 'Demo evaluator supports Python only.',
        runtime: 0,
        memory: 0,
      });
    }

    if (process.env.EVALUATOR_MODE === 'docker') {
      return runPythonInDocker({ code, input, timeoutMs }).then(resolve);
    }

    const uniqueId = createRunId();
    const filePath = path.join(TEMP_DIR, `${uniqueId}.py`);
    const startedAt = Date.now();
    let stdout = '';
    let stderr = '';
    let finished = false;

    fs.writeFileSync(filePath, code);

    const child = spawn('python', [filePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill('SIGKILL');
      cleanupFile(filePath);
      resolve({
        status: 'Time Limit Exceeded',
        error: `Execution timed out after ${timeoutMs} ms`,
        runtime: timeoutMs,
        memory: 0,
      });
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cleanupFile(filePath);
      resolve({
        status: 'Runtime Error',
        error: `Failed to start Python: ${error.message}`,
        output: stdout,
        runtime: Date.now() - startedAt,
        memory: 0,
      });
    });

    child.on('close', (exitCode) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cleanupFile(filePath);

      if (exitCode !== 0) {
        return resolve({
          status: 'Runtime Error',
          error: stderr || `Process exited with code ${exitCode}`,
          output: stdout,
          runtime: Date.now() - startedAt,
          memory: 0,
        });
      }

      resolve({
        status: 'Success',
        output: stdout,
        runtime: Date.now() - startedAt,
        memory: 0,
      });
    });

    if (input && child.stdin) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
};

const runPythonInDocker = ({ code, input = '', timeoutMs = 5000 }) => {
  return new Promise((resolve) => {
    const runId = createRunId();
    const runDirectory = path.join(TEMP_DIR, runId);
    const filePath = path.join(runDirectory, 'solution.py');
    const startedAt = Date.now();
    let stdout = '';
    let stderr = '';
    let finished = false;

    fs.mkdirSync(runDirectory, { recursive: true });
    fs.writeFileSync(filePath, code);

    const dockerArgs = [
      'run',
      '--rm',
      '--network',
      'none',
      '--cpus',
      process.env.EVALUATOR_CPU_LIMIT || '0.5',
      '--memory',
      process.env.EVALUATOR_MEMORY_LIMIT || '128m',
      '--pids-limit',
      process.env.EVALUATOR_PIDS_LIMIT || '64',
      '--read-only',
      '-i',
      '-v',
      `${runDirectory}:/workspace:ro`,
      process.env.EVALUATOR_PYTHON_IMAGE || 'python:3.12-alpine',
      'python',
      '/workspace/solution.py',
    ];

    const child = spawn('docker', dockerArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill('SIGKILL');
      cleanupDirectory(runDirectory);
      resolve({
        status: 'Time Limit Exceeded',
        error: `Execution timed out after ${timeoutMs} ms`,
        runtime: timeoutMs,
        memory: 0,
      });
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cleanupDirectory(runDirectory);
      resolve({
        status: 'Runtime Error',
        error: `Failed to start Docker evaluator: ${error.message}`,
        output: stdout,
        runtime: Date.now() - startedAt,
        memory: 0,
      });
    });

    child.on('close', (exitCode) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cleanupDirectory(runDirectory);

      if (exitCode !== 0) {
        return resolve({
          status: 'Runtime Error',
          error: stderr || `Docker evaluator exited with code ${exitCode}`,
          output: stdout,
          runtime: Date.now() - startedAt,
          memory: 0,
        });
      }

      resolve({
        status: 'Success',
        output: stdout,
        runtime: Date.now() - startedAt,
        memory: 0,
      });
    });

    if (input && child.stdin) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
};

const createRunId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

module.exports = runCode;
