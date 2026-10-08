# Admin Email Implementation Plan

Goal: Add a manually entered email to the existing administrator create-user form, using the native shared registration storage.

1. Add a targeted build-time patch and a Dockerfile deriving from the current official admin image. Add email format validation and payload serialization.
2. Update admin Compose image/build configuration and documentation. Write patch regression tests.
3. Build and deploy only the admin frontend after tests.
4. Use an independent user to verify browser creation, shared email/password login, and duplicate rejection. Commit and push scoped changes.
