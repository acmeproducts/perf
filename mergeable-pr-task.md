# Mergeable PR Task Template

Use this checklist any time the tester asks for “a PR that is mergeable.” It is
written for Codex (the developer-of-record) and assumes the tester only has
access to the GitHub UI.

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
