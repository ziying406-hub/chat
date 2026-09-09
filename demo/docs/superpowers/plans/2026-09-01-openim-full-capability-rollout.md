# OpenIM Full Capability Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose every appropriate end-user and group-management OpenIM capability through a real, testable UI in 99chat, while keeping infrastructure and destructive capabilities behind centrally controlled feature flags.

**Architecture:** Retain OpenIM as the source of truth for IM operations. Build UI flows only for user-facing SDK capabilities, with calls routed through the existing Zustand store or narrowly scoped service modules. Use one feature registry so visible UI and execution checks share the same enabled state; internal SDK, database, and low-level synchronization methods remain unexposed.

**Tech Stack:** React 19, React Router, Zustand/Immer, OpenIM WASM SDK, local OpenIM chat/server Docker services, Playwright.

## Global Constraints

- Work directly in `main`, as explicitly approved by the user on September 1, 2026.
- Preserve existing working chat, contact, and group workflows.
- Every visible action must call a real SDK or backend operation; do not ship placeholder actions or success-only toasts.
- Keep administrative and destructive capabilities off by default and controlled from one feature registry.
- Test each feature flow with a focused Playwright end-to-end test before declaring it usable.
- Do not expose SDK lifecycle, database mutation, cache injection, or other infrastructure APIs to ordinary users.

---

### Phase 1: Integrate the verified batch-message assistant

**Files:**
- Copy from verified feature branch: `src/services/batch-message.ts`, `src/components/settings/BatchMessageAssistant.tsx`, `BatchMessageCreate.tsx`, `BatchMessagePreview.tsx`
- Modify: `src/components/settings/MessagingSettings.tsx`, `src/components/layout/MainLayout.tsx`
- Test: `batch_message_create_e2e.cjs`, `batch_message_lifecycle_e2e.cjs`

- [ ] Add the verified real batch sender and local durable task history to `main`.
- [ ] Wire settings routes and replace the incorrect “群发助手 → 创建群聊” behavior.
- [ ] Run two-recipient delivery and lifecycle tests against `http://localhost:5199`.

### Phase 2: Complete message composition and media operations

**Files:**
- Modify: `src/components/chat/ChatView.tsx`, `src/store/app-store.ts`
- Create: focused Playwright tests under `e2e/`

- [ ] Add visible video and location-message entry points using supported SDK calls.
- [ ] Make file/video media histories and downloads usable from conversation settings.
- [ ] Add merged multi-message forwarding only after a real SDK-supported payload path is verified.

### Phase 3: Complete conversation-level operations

**Files:**
- Modify: `src/components/chat/ConversationList.tsx`, `ChatView.tsx`, `ConversationSettings.tsx`, `src/store/app-store.ts`
- Create: feature-flag registry and tests

- [ ] Expose message destruction, hide conversation, local/server message deletion, and robust draft state only where their SDK contracts are verified.
- [ ] Keep destructive actions behind confirmation dialogs and feature flags.

### Phase 4: Complete contact and group workflows

**Files:**
- Modify: contact, group-detail, and group-admin components plus `src/store/app-store.ts`
- Create: tests for public-group joining, complete group mute, member search, and owner/admin flows

- [ ] Add public group joining and relationship checks.
- [ ] Add whole-group mute and group-member search.
- [ ] Repair unsupported or misleading current controls before exposing them.

### Phase 5: Presence, typing state, and notifications

**Files:**
- Modify: chat views, notification settings, OpenIM service setup
- Create: tests for enabled browser notifications and status updates

- [ ] Add typing-state indicators with SDK input-state APIs.
- [ ] Finish browser notification configuration only when FCM configuration is available.
- [ ] Make permission and background behavior explicit in UI.

### Phase 6: Feature registry and administrator controls

**Files:**
- Create: `src/config/feature-flags.ts`, admin settings screen, tests

- [ ] Add central flags for advanced, destructive, and optional features.
- [ ] Ensure a disabled feature is both hidden in UI and rejected by its invocation path.
- [ ] Keep ordinary chat features enabled by default; leave high-risk controls disabled by default.

### Phase 7: Release readiness

- [ ] Run focused tests for all shipped capability groups.
- [ ] Resolve the existing main-branch TypeScript build baseline in a separate, reviewed change before production release.
- [ ] Verify feature flags and user-facing error handling in a browser.
