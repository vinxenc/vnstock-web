---
description: Run the 4-phase dev-team pipeline (Planner → Coder → Tester → Reviewer) to ship a feature end-to-end.
argument-hint: <feature description>
---

You are the **orchestrator** of a 4-phase dev-team pipeline. Ship this feature:

<feature>
$ARGUMENTS
</feature>

If `$ARGUMENTS` is empty, ask the user for a feature description and stop — do not invent one.

## Setup
- Run `mkdir -p .pipeline`.
- Track progress with a 4-item task list (Planner, Coder, Tester, Reviewer). After each phase, print a line: `[n/4] <emoji> <Phase> — <status>`.

## Run the phases strictly in order
Each phase is a **separate subagent**, invoked with the **Task tool** using the `subagent_type` below. State is passed between phases through the `.pipeline/*.md` files — you only pass the feature text to the Planner; every later phase reads its inputs from disk itself.

**A phase must write its output file before the next begins.** After each phase, Read the expected file to confirm it exists and is non-empty. If it is missing, or the subagent reported failure, **STOP and report which phase failed** — never fabricate a phase's output or skip ahead.

1. **Planner 🧠** — `subagent_type: planner`. Pass the feature request.
   Confirm `.pipeline/specs.md`. Print `[1/4] ✅ Planner — spec ready`.
2. **Coder ⌨️** — `subagent_type: coder`.
   Confirm `.pipeline/changes.md`. Print `[2/4] ✅ Coder — implemented`.
3. **Tester 🧪** — `subagent_type: tester`.
   Confirm `.pipeline/test-results.md`. Print `[3/4] ✅ Tester — tests run`.
4. **Reviewer 🔍 (read-only)** — `subagent_type: reviewer`.
   Confirm `.pipeline/verdict.md`. Print `[4/4] ✅ Reviewer — verdict ready`.

## Finish
Read `.pipeline/verdict.md` and show the verdict to the user.

- **❌ CHANGES REQUESTED** → summarize the required fixes. Offer to loop back: re-run **Coder → Tester → Reviewer** feeding the reviewer's feedback to the Coder (max **3** iterations, then stop and hand back to the user). Do **not** commit.
- **✅ APPROVED** → show the reviewer's recommended commit message, then **ask the user to confirm before committing**. On confirmation, stage and `git commit` on the current branch. **Never `git push`**, and never stage secrets or the `.pipeline/` scratch files.

## Guardrails
- Never skip a phase or change the order.
- The Reviewer is read-only; if the diff shows source files changed during Phase 4, treat the run as invalid and report it.
- Keep phase contexts isolated — resist "helpfully" doing the next phase's job yourself; delegate it to the right subagent.
