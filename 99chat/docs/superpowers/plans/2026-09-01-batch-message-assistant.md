# Batch Message Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an OpenIM-backed batch-message assistant that creates durable tasks, sends one text message to each selected friend or group, records each recipient result, and supports viewing, re-sending, and deleting tasks.

**Architecture:** The existing `openim-chat` container does not implement the reference app’s `GetBatchMessageHistory`, `SendBatchMessage`, or `DeleteBatchMessages` APIs, so the 99chat frontend will provide a local, persistent task store. Sending remains real: the frontend creates a text message and calls the existing OpenIM SDK `sendMessage` once per selected conversation. A task is recorded only with each delivery outcome returned by that call.

**Tech Stack:** React 19, React Router, Zustand/Immer, OpenIM WASM client SDK, browser localStorage, Playwright.

## Global Constraints

- Preserve existing one-to-one and group chat sending flows.
- Do not label a recipient as sent unless its SDK send call resolves successfully.
- Store only text batch messages in the first version, matching the smallest useful subset.
- Keep data in `localStorage` because the current local backend returns 404 for the reference batch endpoints.
- Do not add placeholders or fake “sent” records.

---

### Task 1: Batch task domain and real per-recipient sender

**Files:**
- Create: `src/services/batch-message.ts`
- Modify: `src/store/app-store.ts`
- Test: `batch_message_send_e2e.cjs`

**Interfaces:**
- Produces `createBatchMessageTask({ content, recipientConversationIDs })`.
- Each recipient result contains its conversation ID, display name, type, status, and error string where applicable.
- Uses the current user’s existing OpenIM SDK session and the SDK’s `createTextMessage` + `sendMessage` methods.

- [ ] Write a failing Playwright test that creates a batch to two existing conversations and expects both recipient result records.
- [ ] Run the test and confirm it fails because the batch UI/API does not exist.
- [ ] Add the task model, local persistence, and the per-recipient real SDK send loop.
- [ ] Re-run the test and confirm recipient messages and task result records exist.

### Task 2: Batch assistant list and create flow

**Files:**
- Create: `src/components/settings/BatchMessageAssistant.tsx`
- Create: `src/components/settings/BatchMessageCreate.tsx`
- Modify: `src/components/layout/MainLayout.tsx`
- Modify: `src/components/settings/MessagingSettings.tsx`
- Test: `batch_message_create_e2e.cjs`

**Interfaces:**
- `/settings/messaging/batch` lists stored tasks.
- `/settings/messaging/batch/create` selects existing friends/groups and submits a real batch task.

- [ ] Write a failing Playwright test that opens 群发助手, selects two recipients, sends a unique text, and expects a task summary.
- [ ] Run the test and confirm it fails.
- [ ] Add routes, list screen, recipient picker, input validation, and submit state.
- [ ] Re-run the test and confirm it passes.

### Task 3: Task preview, resend, and deletion

**Files:**
- Create: `src/components/settings/BatchMessagePreview.tsx`
- Modify: `src/services/batch-message.ts`
- Modify: `src/components/settings/BatchMessageAssistant.tsx`
- Test: `batch_message_lifecycle_e2e.cjs`

**Interfaces:**
- `/settings/messaging/batch/:taskID` shows message, timestamp, and each recipient’s actual result.
- Resend opens the create flow with content and successfully-sent recipients preselected.
- Delete removes only selected local task records after confirmation.

- [ ] Write a failing Playwright lifecycle test for preview, resend prefill, and deletion confirmation.
- [ ] Run it and confirm it fails.
- [ ] Implement preview, resend prefill, and confirmed local task deletion.
- [ ] Re-run the lifecycle test and confirm it passes.

### Task 4: Browser verification and documentation of the backend limitation

**Files:**
- Modify: `README.md`
- Test: `batch_message_send_e2e.cjs`, `batch_message_create_e2e.cjs`, `batch_message_lifecycle_e2e.cjs`

- [ ] Run all focused batch-message tests.
- [ ] Verify the reference-like list, preview, re-send, and create screens in a browser without sending to the reference service.
- [ ] Document that task history is local until the `openim-chat` backend exposes matching batch APIs.
