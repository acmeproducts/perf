# Tester Merge & Validation Guide

The core-first UI work now ships as a series of small, conflict-free pull requests. This
checklist explains exactly what the solo tester needs to do (and what to escalate) using
only the GitHub web interface.

## 1. When a new PR arrives
1. Open the PR and scan the “Checks” section.
2. If a deploy preview link is provided, open it in a new tab so you can test without
   cloning the repo.
3. Locate the “How to test” block in the PR description—follow those steps verbatim.

## 2. What to do if GitHub shows “This branch has conflicts”
- **Do not click anything else.** Leave the PR open.
- Comment `@dev-team please refresh, I see conflicts`.
- Wait for the developer to push a conflict-free update. The tester should never attempt
  to resolve conflicts in the browser editor.

### FAQ: “Should I update the branch myself or start a new PR?”
- **Never update the branch yourself.** Developers handle rebases/refreshes in Codex or
  their local tooling. Just leave the conflict warning in place and comment as noted
  above.
- **Do not open a replacement PR.** Stay on the existing PR and wait for the developer to
  push an update. Creating another PR can lose review history and makes conflicts harder
  to trace.
- **If the refresh is taking too long**, follow the escalation rule in section 5 so the
  developer knows you are blocked.

## 3. Merging a clean PR
1. Confirm the checks are green and the deploy preview looks good.
2. Click **Merge pull request** → **Confirm merge**.
3. Post a short comment noting which checklist items you covered.
4. Delete the branch via the GitHub prompt (optional but encouraged).

## 4. Retesting after a refresh
- When the developer force-pushes an updated branch, GitHub marks the PR as “Changes
  have been pushed.”
- Re-run only the steps that the PR description flags as affected by the refresh.
- If the deploy preview is missing, comment immediately so the developer can re-run the
  build.

## 5. Escalation rules
- Two-hour SLA: if a PR stays in “conflicts” or “deploy failed” for more than two hours,
  page the developer via the assigned chat channel.
- Document blockers in the PR so the resolution history stays attached to the code.

Following this guide guarantees the tester never needs local git, and developers stay
accountable for shipping conflict-free, ready-to-merge work.
