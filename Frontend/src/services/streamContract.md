# Stream API Contract

## Base URL

- `/api` via the shared frontend API client

## Authentication

- All stream endpoints require authentication through the shared auth/session cookie flow.

## Stream endpoints

### GET /streams

- Auth: required
- Authz: any authenticated user
- Response: `{ success, count, streams }`
- Streams returned are public and live only.

### GET /streams/my

- Auth: required
- Authz: any authenticated user
- Response: `{ success, count, streams }`
- Returns the authenticated user's streams.

### POST /streams

- Auth: required
- Authz: any authenticated user
- Body: `{ title, description?, visibility?, project? }`
- Response: `{ success, stream }`
- Notes: private streams require a valid project and project owner/co-owner access.

### GET /streams/:streamId

- Auth: required
- Authz: public streams are readable by any authenticated user; private streams require project access or admin.
- Params: `streamId`
- Response: `{ success, stream }`

### POST /streams/:streamId/join

- Auth: required
- Authz: must be allowed to access the stream and not be banned; private streams require project access.
- Params: `streamId`
- Response: `{ success, participant }`
- Socket events: `stream:participant-joined`, `stream:participants-updated`
- LiveKit effect: none directly; token is requested separately.

### POST /streams/:streamId/leave

- Auth: required
- Authz: participant or host of the stream
- Params: `streamId`
- Response: `{ success, message }`
- Socket events: `stream:participant-left`, `stream:participants-updated`, `stream:ended` for host/last-participant cleanup

### GET /streams/:streamId/participants

- Auth: required
- Authz: same as stream read access
- Params: `streamId`
- Response: `{ success, count, participants }`
- Socket events: none

### DELETE /streams/:streamId/kick/:userId

- Auth: required
- Authz: host only
- Params: `streamId`, `userId`
- Response: `{ success, message }`
- Socket events: `stream:participant-kicked`, `stream:participants-updated`
- LiveKit effect: removes the participant from LiveKit if present.

### POST /streams/:streamId/ban/:userId

- Auth: required
- Authz: host only
- Params: `streamId`, `userId`
- Body: `{ reason? }`
- Response: `{ success, message }`
- Socket events: `stream:participant-banned`, `stream:participants-updated`
- LiveKit effect: removes the participant from LiveKit and rejects pending requests.

### DELETE /streams/:streamId/ban/:userId

- Auth: required
- Authz: host only
- Params: `streamId`, `userId`
- Response: `{ success, message }`

### GET /streams/:streamId/bans

- Auth: required
- Authz: host only
- Params: `streamId`
- Response: `{ success, count, bannedUsers }`

### POST /streams/:streamId/request

- Auth: required
- Authz: joined participant, not banned, stream must be live
- Body: `{ requestType: "microphone" | "camera" | "screen-share" }`
- Response: `{ success, message, request }`
- Socket events: `stream:request-created`

### GET /streams/:streamId/requests

- Auth: required
- Authz: host only
- Params: `streamId`
- Response: `{ success, count, requests }`

### PATCH /streams/:streamId/requests/:requestId/approve

- Auth: required
- Authz: host only
- Params: `streamId`, `requestId`
- Response: `{ success, message, participant, request }`
- Socket events: `stream:request-approved`, `stream:participants-updated`
- LiveKit effect: updates participant publishing permissions in LiveKit.

### PATCH /streams/:streamId/requests/:requestId/reject

- Auth: required
- Authz: host only
- Params: `streamId`, `requestId`
- Response: `{ success, message, request }`
- Socket events: `stream:request-rejected`

### PATCH /streams/:streamId/participants/:userId/revoke-microphone

- Auth: required
- Authz: host only
- Params: `streamId`, `userId`
- Response: `{ success, message, participant }`
- Socket events: `stream:permission-revoked`, `stream:participants-updated`
- LiveKit effect: updates LiveKit participant publishing permissions.

### PATCH /streams/:streamId/participants/:userId/revoke-camera

- Auth: required
- Authz: host only
- Params: `streamId`, `userId`
- Response: `{ success, message, participant }`
- Socket events: `stream:permission-revoked`, `stream:participants-updated`
- LiveKit effect: updates LiveKit participant publishing permissions.

### PATCH /streams/:streamId/participants/:userId/revoke-screen-share

- Auth: required
- Authz: host only
- Params: `streamId`, `userId`
- Response: `{ success, message, participant }`
- Socket events: `stream:permission-revoked`, `stream:participants-updated`
- LiveKit effect: updates LiveKit participant publishing permissions.

### POST /streams/:streamId/token

- Auth: required
- Authz: must be a joined participant and allowed to access the stream
- Params: `streamId`
- Response: `{ success, token, roomName, participantRole }`
- LiveKit effect: returns a token only; no secret is exposed to the browser.

### PATCH /streams/:streamId/thumbnail

- Auth: required
- Authz: host only
- Params: `streamId`
- Body: multipart form-data with `thumbnail`
- Response: `{ success, thumbnail }`

### DELETE /streams/:streamId/thumbnail

- Auth: required
- Authz: host only
- Params: `streamId`
- Response: `{ success, message }`

### DELETE /streams/:streamId

- Auth: required
- Authz: host only
- Params: `streamId`
- Response: `{ success, message }`

## Stream report endpoints

### POST /stream-reports/:streamId

- Auth: required
- Authz: authenticated user who can access the stream and is not the host
- Body: `{ reason, details? }`
- Response: `{ success, report }`

### GET /stream-reports/admin

- Auth: required
- Authz: admin only
- Response: `{ success, count, reports }`

### PATCH /stream-reports/admin/:reportId/review

- Auth: required
- Authz: admin only
- Response: `{ success, message }`

### PATCH /stream-reports/admin/:reportId/dismiss

- Auth: required
- Authz: admin only
- Response: `{ success, message }`

## Socket.IO events

### `stream:participant-joined`

- Payload: `{ userId, role }`
- Use: add a participant to local state or update presence.

### `stream:participant-left`

- Payload: `{ userId }`
- Use: remove a participant from local state.

### `stream:participants-updated`

- Payload: array of participant objects (populated user info)
- Use: replace the participant list and recalculate viewer counts from the backend data when needed.

### `stream:participant-kicked`

- Payload: `{ userId }`
- Use: remove the kicked user from the room state.

### `stream:participant-banned`

- Payload: `{ userId }`
- Use: remove the banned user from the room state.

### `stream:request-created`

- Payload: `{ requestId, userId, requestType }`
- Use: append a pending request to the local moderation list.

### `stream:request-approved`

- Payload: `{ requestId, userId, requestType }`
- Use: update the pending request state and participant permission state.

### `stream:request-rejected`

- Payload: `{ requestId, userId, requestType }`
- Use: update or remove the pending request from local state.

### `stream:permission-revoked`

- Payload: `{ userId, permission }`
- Use: update the participant’s local permission flags.

### `stream:ended`

- Payload: `{ streamId, title, hostId, reason, endedAt }`
- Use: mark the stream as ended locally and stop room activity.

## LiveKit connection flow

1. Call `joinStream` to create/confirm the server-side participant record.
2. Call `generateStreamToken` to obtain `{ token, roomName, participantRole }`.
3. Connect to LiveKit using the returned token and room name.
4. Subscribe to remote tracks for other participants.
5. Publish local tracks only when the backend participant state says publishing is allowed.
6. Listen for permission changes from the backend via the stream permission socket events and update local publishing state accordingly.
7. Disconnect from LiveKit when leaving the room.
8. Call `leaveStream` to notify the backend that the participant has left.

## Frontend state requirements

The live room should derive its state from backend confirmation instead of assuming values.

Required state:

- `stream`
- `host`
- `project`
- `participant`
- `participantRole`
- `permissions`
- `viewerCount`
- `streamStatus`
- `thumbnail`
- `visibility`
- `pendingRequests`
- `moderationState`

## Backend compatibility notes

- The backend remains authoritative for stream status, participant role, permissions, and viewer counts.
- The frontend should not assume a viewer count or role before the backend confirms it through the relevant REST response or participant list socket update.
