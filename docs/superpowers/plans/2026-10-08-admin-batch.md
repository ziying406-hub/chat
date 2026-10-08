# Admin Batch Users Implementation Plan

Goal: Add an operable administrator batch-create button backed by native registration and accurate per-row results.

1. Add a small React component with multiline TSV input, preview validation, sequential creation and non-repeatable submitted batch state. Add CSS consistent with the existing admin UI.
2. Extend existing pinned-image patch to insert the toolbar component and load assets; invoke native Chat administrator registration using existing authenticated request helper.
3. Test parsing, intra-batch duplicates and result state; build and deploy only admin with rollback image.
4. Verify independent account creation, email login, native duplicate rejection and results through ego-browser. Commit and push changes.
