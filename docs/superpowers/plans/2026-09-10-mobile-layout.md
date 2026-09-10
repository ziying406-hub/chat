# Mobile Layout Implementation Plan

> **For agentic workers:** Execute inline with executing-plans, task by task. This is the user-approved first step, not a redesign of messaging services.

**Goal:** Make the existing 99chat routes usable as single-screen mobile pages while preserving desktop multi-column layouts.

**Architecture:** Keep list components mounted and use route-aware panel classes so resizing does not reset SDK/store state. Add a shared mobile back button only to headers that lack one. Use a scoped app shell, dynamic viewport height, safe-area padding and constrained chat content.

**Tech Stack:** React, React Router, Tailwind/CSS, existing Playwright and native Node assertions.

## Global Constraints

- Mobile is width <= 768px; desktop is > 768px.
- No SDK, backend, permission, login or message data model changes.
- Mobile navigation order is 通讯录 / 聊天 / 我的, shown only on root routes.
- Deterministic parent links; do not depend on browser history for deep links.
- No production deployment or OpenIM restart in this implementation turn.

## Task 1: Responsive route panels and navigation

Files: `99chat/src/components/layout/{MainLayout,MobileBackButton}.tsx`, `99chat/src/hooks/useIsMobile.ts`, `99chat/src/components/{chat/ConversationList,contact/ContactList,settings/Settings}.tsx`, settings root headers, `99chat/src/index.css`.

- [x] Write `99chat/mobile_layout_e2e.cjs`: log in to local test account through UI; assert 375/390/430/768px root list uses full width, detail hides list and bottom bar, back returns to parent, /settings remains root, desktop retains sidebar and list.
- [x] Run `cd 99chat && node mobile_layout_e2e.cjs`; observe old layout fail a geometry assertion.
- [x] Add responsive `list-panel` and `detail-panel` classes with route-root state. Desktop detail wrapper is `display:contents`; mobile is flex-column with bounded scrolling. Root list is visible on mobile only on exact root routes.
- [x] Add `useIsMobile` using `matchMedia('(max-width: 768px)')` and clean up the change listener. Settings index returns null on mobile and `<Navigate to="profile" replace />` on desktop.
- [x] Render root-only mobile nav. Add `<MobileBackButton to="/settings" />` inside existing settings headers that lack back navigation; keep other headers intact.
- [x] Run navigation assertions at all specified widths and desktop 1280px.

## Task 2: Chat dimensions and overlays

Files: `99chat/src/components/chat/{ChatView,EmojiPicker}.tsx`, `99chat/src/index.css`, `99chat/index.html`.

- [x] Extend failing browser assertions to message/card boundaries, composer controls, short viewport, emoji picker and existing modal.
- [x] Add dedicated chat header, scroll region and composer classes; constrain flex children (`min-width:0`, `min-height:0`) and message cards to container width.
- [x] Use `100dvh` app shell, safe-area padding and `interactive-widget=resizes-content`; bound overlays to viewport. Do not claim physical keyboard verification from viewport tests.
- [x] Preserve drafts, send handlers and existing permissions. Add accessible labels to back/send/image/voice controls used in tests.
- [x] Re-run browser tests; inspect mobile and desktop screenshots.

## Task 3: Verification and handoff

- [x] Run `npm run build`, existing group permissions/date/duration tests and `git diff --check`.
- [x] Verify real two-account text delivery and history after reload against local OpenIM; distinguish backend limitations from layout assertions.
- [x] Update design and verification notes with evidence and any remaining true-device limitation.
- [x] Commit only this feature's files with `git commit -m "feat: add single-screen mobile chat layout"`; do not push or deploy without a current request.
