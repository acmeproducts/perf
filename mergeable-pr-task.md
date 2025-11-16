# Mergeable PR Task Template

Use this checklist any time the tester asks for “a PR that is mergeable.” It is
written for Codex (the developer-of-record) and assumes the tester only has
access to the GitHub UI.

## Conflict-free PR task stack

Each request is fulfilled by running the following explicit tasks in order. Do
not skip a task; the tester is counting on the entire stack to guarantee the
branch lands without conflicts.

### Task 1 — Refresh the branch
- `git fetch origin main`
- `git rebase origin/main` (or merge if the branch is already public)
- Acceptance: `git status -sb` shows only the current branch name (no `|REBASE`).

### Task 2 — Implement and annotate
- Make the requested code/doc changes.
- Add inline inventory notes if the change touches shared chrome or modules.
- Acceptance: running `git diff` displays only the intended files.

### Task 3 — Run bundle checks
- Execute the bundle-specific smoke tests (gesture skeleton, MLPUM toggle,
  persistence flow, etc.).
- Capture the terminal output to reference in the PR body.
- Acceptance: every required command exits successfully.

### Task 4 — Verify cleanliness
- `git status -sb` must be clean (no staged-but-uncommitted files).
- `git diff --stat origin/main` should only show the files changed in Task 2.
- Acceptance: both commands confirm the branch is tidy.

### Task 5 — Commit and push
- `git commit -am "<clear summary>"`
- `git push origin <branch>`
- Acceptance: `git status -sb` reports a clean tree after the push.

### Task 6 — Draft the PR
- Title: `Core-first UI – <bundle or bug name>`
- Body:
  - Summary bullets in plain language.
  - “Testing” block listing the commands from Task 3.
  - “Merge when ready – no follow-up required.”
- Acceptance: GitHub shows “This branch has no conflicts with the base branch.”

### Task 7 — Babysit until merge
- Monitor the PR for conflicts or tester comments.
- If conflicts appear, repeat Tasks 1–6 immediately.
- Acceptance: the tester merges the PR without ever seeing a conflict banner.

1. **Sync with `main`.**
   - `git fetch origin main`
   - `git rebase origin/main` (or merge) on the feature branch.
2. **Implement the requested change.**
   - Keep the diff scoped to the files explicitly mentioned in the request.
   - Add inline notes if the change touches the similarity inventory or chrome
     modules so reviewers see the rationale immediately.
3. **Run the relevant checks.**
   - Execute the bundle-specific smoke tests (gesture skeleton, MLPUM toggle,
     persistence flow, etc.).
   - Capture terminal output for the final PR description.
4. **Verify cleanliness.**
   - `git status -sb` must be clean.
   - `git diff --stat origin/main` should only show the intended files.
5. **Commit and push.**
   - `git commit -am "<clear summary>"`
   - `git push origin <branch>`
6. **Draft the PR.**
   - Title: `Core-first UI – <bundle or bug name>`
   - Body:
     - Summary bullets in plain language.
     - “Testing” block that lists the commands you ran.
     - “Merge when ready – no follow-up required.”
7. **Babysit the PR.**
   - If GitHub flags conflicts, immediately rerun steps 1–5.
   - Reply to tester comments with status updates until they merge.

Following this template guarantees every request results in a single,
ready-to-merge PR without bouncing work back to the tester.
