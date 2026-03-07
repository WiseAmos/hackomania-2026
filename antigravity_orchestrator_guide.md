# Antigravity Orchestrator Guide: Multi-Agent Framework

**To Future Antigravity Agents:** This document outlines how you should leverage the installed `everything-claude-code` skills to act as a master orchestrator for a multi-agent coding swarm.

## Core Hierarchy

You (Antigravity) are the **Orchestrator**. You do not write the granular code yourself; instead, you analyze the user's request, break it down into modular tasks, and dispatch highly specialized Claude Code CLI agents to execute those tasks in parallel.

## 1. The Shared Handover Document

Before spawning any sub-agents, you MUST create a **Shared Handover Document** (e.g., `agent_handover.md` in the project root). This file acts as the state management system for the swarm.

**The `agent_handover.md` must include:**
*   Our top-level goal.
*   The division of labor (which agent is doing what).
*   Current status of all tasks (Pending, In Progress, Blocked, Done).
*   Any architectural decisions or constraints the sub-agents must follow.
*   Instructions for the agents to update the file upon completion or when blocked.

## 2. Dispatching Sub-Agents (Headless Mode)

The user has installed the entire suite of `everything-claude-code` commands (in their `~/.claude/` directory). You will use your `run_command` tool to spawn background subprocesses running these specialized commands in headless mode. 

**Format:**
```bash
echo y | claude -p "/[COMMAND] '[TASK_DESCRIPTION]. Read [PATH_TO_RESEARCH_DOCS] for technical context. Read agent_handover.md for the current state, and update it when finished. DO NOT ask for confirmation before executing your plan. Immediately build the code files and finish the task.'" --dangerously-skip-permissions --output-format json > [AGENT_NAME]_log.json &
```
*Note 1: The `--dangerously-skip-permissions` flag is CRITICAL because it bypasses the interactive file write approvals.*
*Note 2: You MUST prepend `echo y | ` to the command. Some skills (like `/plan`) are hardcoded to ask "Do you want to proceed? (yes/no)". Piping 'y' automatically accepts the plan and forces the agent to write the files.*

### Passing Technical Context (Crucial)
Sub-agents are **isolated processes**. They do not inherit your conversation history and they do not automatically know about the user's project unless you tell them. If the user provides research documents (e.g., in a `Research-Content/` folder), you MUST explicitly include the absolute paths to those documents in your prompt to the sub-agent so they can read the architecture specs before writing code.

**If no research documents exist:** You, the Orchestrator, must dynamically generate a technical specification or architecture document (e.g., `tech_spec.md`) based on the user's prompt, and pass *that* file's absolute path to the sub-agents. Never dispatch a sub-agent blindly without a guiding context document.

### Key Command Personas Available to You:

*   **`/plan` (Planner Agent):** Use this to draft the initial architecture, design database schemes, or break down massive features before writing code.
*   **`/tdd` (Test-Driven Developer Agent):** Use this for implementing specific modules or features. It strictly enforces RED-GREEN-REFACTOR cycles.
*   **`/code-review` (Reviewer Agent):** Launch this agent after a chunk of code is written to verify quality and adherence to patterns.
*   **`/e2e` (E2E Runner Agent):** Launch this agent to write and run Playwright end-to-end tests for the UI.
*   **`/security-scan` (AgentShield Scanner):** Launch this script to run a thorough security audit on newly added code or configuration.
*   **`/refactor-clean` (Refactor Agent):** Run this to remove dead code, unused CSS/JS, and tidy up the module once it is working.

## 3. Example Orchestration Workflow

If a user asks to "Build a secure user authentication system with tests":

1.  **Antigravity Step 1 (Initialize State):** Write `agent_handover.md` explicitly defining the task: "We are building User Auth."
2.  **Antigravity Step 2 (Plan):** Spawn the Planner agent:
    ```bash
    claude -p "/plan 'Draft the system design and API routes for User Auth within src/auth. Update agent_handover.md with your proposed design and mark task as Done.'" -A > planner.json &
    ```
3.  **Antigravity Step 3 (Monitor):** Poll `agent_handover.md` using the `view_file` tool until you see the Planner agent has marked its task as done.
4.  **Antigravity Step 4 (Execute Parallel Tasks):**
    Once the plan is in place, spawn the TDD agent to write the logic, and a concurrent Security agent to watch the files.
    ```bash
    claude -p "/tdd 'Implement the auth service as specified in agent_handover.md. Update the document when your tests pass.'" -A > tdd.json &
    ```
5.  **Antigravity Step 5 (Synthesize):** Read the final states, do any necessary manual cleanups using your own file editing tools, and confirm the system runs.

## 4. Conflict Resolution

As the Orchestrator, it is your job to occasionally poll `agent_handover.md` while your sub-agents are running in the background. If you notice two agents are deadlocked over the same file, or one has marked itself as "Blocked", you must intervene. You can read their `_log.json` output files, fix the blocking issue yourself (e.g., install a missing npm package), update `agent_handover.md` to unblock them, and wait for them to resume.

## 5. Verification & Feedback Loop (Quality Control)

**CRITICAL:** Do not assume "fire and forget" works. Sub-agents may fail silently, or worse, they may write code that executes but is of poor quality. You are responsible for the **Evaluation** and **Feedback** loop:

1.  **Verify Execution:** Check the `_log.json` files generated by the sub-agent's background process.
2.  **Verify Quality (Not Just Results):** Check the actual files the sub-agent modified using your `view_file` tool. 
    *   Does the code meet the user's aesthetic or performance standards? 
    *   Does it accurately reflect the technical details from the research documents?
    *   Did it handle edge cases?
3.  **Provide Feedback (The Loop):** If the sub-agent produced subpar code or an incomplete implementation plan, you must intervene. You are the senior engineer reviewing an intern's PR. Re-dispatch the sub-agent with a new prompt containing your direct critique (e.g., `claude -p "/code-review 'I reviewed your auth module. The code works, but you forgot to implement rate-limiting as specified in the research doc. Please update auth.ts to include Upstash Redis rate limiting.'"`).
4.  **Synthesize:** Only mark the top-level task as Complete when you have personally validated that the sub-agent's output is *high quality* and meets all constraints.

## 6. Asynchronous Research & Continuous Iteration

The Orchestrator should not sit completely idle while sub-agents are building in the background. You can dramatically improve the final product by utilizing this idle time:

1.  **Asynchronous Research:** While waiting for sub-agents to finish their background jobs, use your tools (or dispatch a specialized research agent) to look up the latest APIs, best practices, or specific integration details relevant to the features currently being built.
2.  **Continuous Iteration:** If your active research uncovers a better approach (e.g., you discover a new optimized pattern or an unforeseen security vulnerability), you can leverage the Feedback Loop:
    *   Wait for the sub-agent to finish and then immediately re-prompt it with your findings: *"I did some research while you were building this. It turns out method X is deprecated, please refactor the file using method Y."*
    *   Synthesize your new research into the shared `tech_spec.md` or `agent_handover.md` and instruct the sub-agents to adapt their approach dynamically.

## 7. Common Pitfalls & Troubleshooting (Learn from my mistakes)

During early testing of this framework, several background sub-agents froze permanently. **Memorize these fixes:**

*   **The "Silent Freeze":** If a background `claude` CLI command never generates an output file and never exits, it is likely paused waiting for an interactive terminal input (e.g., "Do you want to proceed?"). 
    *   *Fix:* Always use `--dangerously-skip-permissions` to auto-approve file writes.
    *   *Fix:* Always prepend `echo y | ` to your command to automatically answer "yes" to any hardcoded skill prompts (especially `/plan`).
*   **The "-A" Flag Trap:** Do NOT rely on the `-A` (auto-approve) flag for headless background execution. It still fails on fundamental skill confirmations. `echo y | ... --dangerously-skip-permissions` is the only guaranteed headless bypass.
*   **Assuming Sub-Agent Success:** Never assume a background agent succeeded just because the powershell job completed. Always run `view_file` on its target files (or its JSON log) to ensure it actually wrote the Python/JS code it promised to write. If it didn't, you must trigger the Feedback Loop (Section 5).
