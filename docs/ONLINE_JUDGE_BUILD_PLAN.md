# Online Judge Build Plan

## 1. Queue And Docker Evaluation Stack

Recommended production stack:

- API: Express.js + MongoDB/Mongoose.
- Queue: Redis + BullMQ for durable submission jobs, retries, backoff, worker concurrency, and queue metrics.
- Worker: Node.js worker process that pulls BullMQ jobs and calls the evaluator.
- Evaluator isolation: Docker per submission with `--network none`, memory, CPU, PID, timeout, and read-only mounts.
- Realtime status: Socket.IO events plus polling fallback.
- Caching stretch: Redis for problem-list cache and leaderboard cache.
- Plagiarism stretch: batch export accepted submissions to MOSS or a token-similarity service.

Current implementation in this repo:

- `backend/src/services/submissionQueue.js` provides an in-process queue for local development.
- `backend/src/services/evaluationService.js` evaluates stored submissions outside the request/response path.
- `backend/src/utils/executor.js` supports local Python execution by default and Docker execution when `EVALUATOR_MODE=docker`.

Production swap:

- Replace the in-process queue adapter with BullMQ while preserving the `enqueueSubmission(submissionId)` controller contract.
- Run one or more worker processes with `SUBMISSION_WORKER_CONCURRENCY` tuned per host.
- Use a private Docker image per language and pre-pull images on worker machines.

## 2. Repo Structure

Current structure:

```text
backend/
  src/
    controllers/
    models/
    routes/
    services/
      evaluationService.js
      submissionQueue.js
    utils/
      executor.js
frontend/
  src/
    components/
    context/
    pages/
docs/
  ONLINE_JUDGE_BUILD_PLAN.md
docker-compose.yml
```

Recommended next production structure:

```text
backend/
  src/
    queue/
      bullmqSubmissionQueue.js
      worker.js
    services/
      evaluationService.js
      plagiarismService.js
      leaderboardCacheService.js
evaluator/
  images/
    python/
    cpp/
    java/
  runner/
    runSubmission.sh
infra/
  docker-compose.yml
  redis/
  monitoring/
```

## 3. Phased Build Plan

Phase 1: Auth
- Registration/login with hashed passwords and JWT refresh.
- Profile/dashboard for personal history.

Phase 2: Problems
- Admin CRUD for problems.
- Public listing, detail pages, sample tests, hidden tests.

Phase 3: Submission Flow
- Save submitted code as a `Queued` submission.
- Return `submissionId` immediately.
- Poll `/api/submissions/:id/status` until a final verdict appears.

Phase 4: Queue And Docker Evaluation
- Move judging into worker process.
- Use Redis + BullMQ for durable jobs.
- Execute each run in Docker with strict CPU, memory, PID, network, and timeout limits.

Phase 5: Leaderboard
- Global leaderboard from accepted submissions and solved counts.
- Contest leaderboard by contest score, penalty, and accepted timestamp.
- Cache leaderboard snapshots when traffic grows.

Phase 6: Stretch
- Plagiarism checks for accepted submissions.
- Redis caching for problem lists and leaderboard reads.
- Worker metrics, dead-letter queue, alerting, and admin retry controls.

## 4. Gaps And Risks

- Rate limiting alone is not enough for submission spikes; durable queueing is required in production.
- Docker must run on isolated worker hosts, not the main API host, when traffic or trust boundaries grow.
- The current local Python runner is for development only; untrusted code should use Docker mode or a dedicated sandbox.
- Hidden test cases live in the problem document today; for stricter separation, store them in a protected collection or evaluator-owned database.
- The current queue is in-memory, so queued jobs disappear if the API process restarts. BullMQ/Redis closes that gap.
- Verdict manipulation risk remains unless admin routes, database credentials, and worker credentials are separately scoped.
- Multi-language support needs language-specific images, compile steps, and per-language time/memory calibration.
