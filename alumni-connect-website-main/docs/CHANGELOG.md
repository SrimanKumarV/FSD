# Changelog

## [1.1.0] - Phase 2 Refactoring Update

### Added
- Created `ProfileContext.js` to handle user profile state separately from authentication.
- Wrote full Jest unit test suite for all backend RBAC middleware in `tests/rbac.test.js`.
- Implemented robust unit testing for the `autoAssignMentor` function in `tests/mentorshipService.test.js`.
- Configured a new `ARCHITECTURE.md` as the canonical architectural guide.

### Changed
- **Auth Flow Security:** Transitioned completely to strict `httpOnly` cookie based JWT authentication for all auth routes (`/verify-email`, `/verify-2fa`, etc).
- **Socket IO Auth:** Socket authentication in the frontend now delegates to HTTP credentials (`withCredentials: true`) rather than manually synchronizing local storage tokens.
- **Service Layers:** Extracted bulky route controller logic into dedicated service files:
  - `mentorshipService.js` handling `autoAssignMentor`
  - `jobService.js` handling internal and external remote job aggregations.
- **Context Wrappers:** Updated `App.js` to correctly provide `ProfileContext` independently across the component tree.
- Consolidated documentation by moving legacy planning files (`AGILE_DOCUMENTATION.md`, `DOCUMENTATION.md`, etc.) to the `docs/archive` folder.

### Fixed
- **API Pagination Limits:** Added a hard cap limit to `jobs`, `users`, and `forum` fetch routes to prevent unbounded limit requests (capped at 50 max items).
- **Cascade Deletions:** Added a `pre('deleteOne')` hook to `User.js` model to clean up orphaned forum posts, mentorships, applications, notifications, and messages when a user account is deleted.
- Set default `isApproved` flag to `false` for new `college` registrations to prevent unauthorized access.
