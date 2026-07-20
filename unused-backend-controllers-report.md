# Unused Backend Controllers Report

## Overview
This report identifies backend controllers in `Backend/controllers` that do not appear to be referenced by the current frontend code in `Frontend/src`.

The analysis is based on:
- frontend service files imported by pages/components
- frontend direct route and endpoint string searches for backend API paths
- presence of frontend modules around admin UI and mock data

> Note: If there are dynamic API calls constructed at runtime, they may not be captured by this static search.

## Backend controllers currently used by the frontend
These controllers have visible frontend usage through service wrappers or API endpoint strings:
- `authController.js`
- `projectController.js`
- `jobController.js`
- `messageController.js`
- `notificationController.js`
- `partnershipController.js`
- `product.controller.js`
- `projectActivityController.js`
- `search.controller.js`
- `streamController.js`
- `supportController.js`

## Backend controllers not referenced by the frontend
The following controllers do not have obvious frontend usage in this repository:
- `application.controller.js`
- `livekitController.js`
- `purchase.controller.js`
- `review.controller.js`
- `streamModeration.controller.js`
- `streamReport.controller.js`
- `upload.controller.js`
- `userFollow.controller.js`
- `userProfile.controller.js`
- `wallet.controller.js`
- `withdrawal.controller.js`

## Admin controllers not referenced by the frontend
The admin UI currently renders mock data and only imports `Admin.jsx`. It does not appear to send requests to admin backend routes.
These controllers are likely unused by the frontend:
- `admin/analytics.controller.js`
- `admin/audit.controller.js`
- `admin/project.admin.controller.js`
- `admin/stats.admin.controller.js`
- `admin/stream.admin.controller.js`
- `admin/support.admin.controller.js`
- `admin/user.admin.controller.js`

## Notes and suggestions
- `purchase.controller.js`, `review.controller.js`, `wallet.controller.js`, and `withdrawal.controller.js` appear to implement marketplace/payment features that are not currently wired into the frontend.
- `upload.controller.js`, `userProfile.controller.js`, and `userFollow.controller.js` likely support profile/avatar and social features that are also not used by current frontend pages.
- `streamModeration.controller.js` and `streamReport.controller.js` are admin/moderation features without frontend calls in the current app.
- `livekitController.js` is probably tied to stream token generation, but no frontend service or endpoint string for `/streams/:streamId/token` was found.

### Recommendation
If you want to keep the backend lean, consider moving unused controller logic into feature branches or removing endpoints not yet supported by the UI. If these are planned features, add corresponding frontend services and pages to make them reachable.
