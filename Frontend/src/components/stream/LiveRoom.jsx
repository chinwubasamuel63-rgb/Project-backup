import {
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Room, RoomEvent, Track } from "livekit-client";
import { AuthContext } from "../../contexts/AuthContext.js";
import * as streamService from "../../services/streamService";
import { useToast } from "../../hooks/useToast";
import AlertModal from "../ui/AlertModal";
import "./liveRoom.css";

const FALLBACK_STREAM = {
  title: "New stream",
  description: "Start a session and invite your audience.",
  status: "scheduled",
  host: { username: "Host" },
  isPrivate: false,
  viewersCount: 0,
  participantsCount: 0,
  accessMode: "public",
};

const ROOM_STATES = {
  loading: "loading",
  authorizing: "authorizing",
  connecting: "connecting",
  connected: "connected",
  reconnecting: "reconnecting",
  disconnected: "disconnected",
  ending: "ending",
  ended: "ended",
  accessDenied: "accessDenied",
  banned: "banned",
  error: "error",
};

const getCurrentUserId = (user) => user?._id || user?.id;

/* ---------------------------------- Icons ---------------------------------- */
/* Small dependency-free icon set so this drops into the project with no new
   packages required. Swap for lucide-react etc. later if you'd prefer. */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const MicIcon = ({ off }) => (
  <svg {...iconProps}>
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <path d="M12 18v4M9 22h6" />
    {off && <path d="M3 3l18 18" strokeWidth={2} />}
  </svg>
);

const CameraIcon = ({ off }) => (
  <svg {...iconProps}>
    <path d="M2 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z" />
    <path d="M15 10l6-3.5v11L15 14" />
    {off && <path d="M2 2l20 20" strokeWidth={2} />}
  </svg>
);

const ScreenShareIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="4" width="20" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
    <path d="M12 8v5M9.5 10.5 12 8l2.5 2.5" />
  </svg>
);

const LeaveIcon = () => (
  <svg {...iconProps}>
    <path d="M16 17l5-5-5-5M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </svg>
);

const ChatIcon = () => (
  <svg {...iconProps}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
  </svg>
);

const UsersIcon = () => (
  <svg {...iconProps}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BellIcon = () => (
  <svg {...iconProps}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const FlagIcon = () => (
  <svg {...iconProps}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z" />
    <path d="M4 22V15" />
  </svg>
);

const ChevronIcon = ({ direction = "right" }) => (
  <svg {...iconProps} width={16} height={16}>
    <path d={direction === "right" ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
  </svg>
);

const SendIcon = () => (
  <svg {...iconProps} width={18} height={18}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
);

/* -------------------------------- Sub-views -------------------------------- */

function ControlButton({
  active,
  danger,
  onClick,
  disabled,
  label,
  children,
  badge,
}) {
  return (
    <button
      type="button"
      className={`meetbar-btn${active ? " is-active" : ""}${danger ? " is-danger" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {children}
      {badge ? <span className="meetbar-badge">{badge}</span> : null}
    </button>
  );
}

function ParticipantTile({
  videoTrack,
  audioTrack,
  label,
  // "filmstrip" (default) = small sidebar thumbnail, fixed 160x96 box.
  // "stage" = fills the big main viewing area. These need different sizing,
  // which is why the stage view was previously rendering as a tiny floating
  // box: it was reusing the filmstrip's fixed-size classes.
  variant = "filmstrip",
}) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const isStage = variant === "stage";

  useEffect(() => {
    const el = videoRef.current;
    if (el && videoTrack) {
      videoTrack.attach(el);
      return () => videoTrack.detach(el);
    }
  }, [videoTrack]);

  useEffect(() => {
    const el = audioRef.current;
    if (el && audioTrack) {
      audioTrack.attach(el);
      return () => audioTrack.detach(el);
    }
  }, [audioTrack]);

  const displayName = label || "Participant";
  const initial = displayName.slice(0, 1).toUpperCase();

  if (isStage) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {videoTrack ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="ytstage-video"
          />
        ) : (
          <div className="ytstage-placeholder-avatar">
            <span>{initial}</span>
          </div>
        )}
        <audio ref={audioRef} autoPlay />
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            fontSize: 13,
            padding: "4px 10px",
            borderRadius: 6,
            background: "rgba(0, 0, 0, 0.6)",
            color: "#fff",
          }}
        >
          {displayName}
        </div>
      </div>
    );
  }

  return (
    <div className="filmstrip-tile">
      {videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="filmstrip-video"
        />
      ) : (
        <div className="filmstrip-avatar">
          <span>{initial}</span>
        </div>
      )}
      <audio ref={audioRef} autoPlay />
      <div className="filmstrip-name">{displayName}</div>
    </div>
  );
}

/* ---------------------------------- Main ---------------------------------- */

export default function LiveRoom() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { user, socket } = useContext(AuthContext);
  const { notify } = useToast();

  const [stream, setStream] = useState(FALLBACK_STREAM);
  const [participants, setParticipants] = useState([]);

  // LiveKit's participant.identity is the raw Mongo user ID string we set
  // when generating the token (see backend token generation) -- it was
  // never meant to be shown to anyone. This resolves it to the actual
  // username from the populated participants list fetched from the backend.
  // Falls back to a shortened id only if we genuinely don't have a match yet
  // (e.g. participants list hasn't loaded), so it's never worse than before.
  const getDisplayNameForIdentity = (identity) => {
    if (!identity) return "Participant";
    const match = participants.find((p) => p.user?._id === identity);
    if (match?.user?.username) return match.user.username;
    return `${identity.slice(0, 6)}…`;
  };
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reason, setReason] = useState("");
  const [liveRoomState, setLiveRoomState] = useState(ROOM_STATES.loading);
  const [livekitError, setLivekitError] = useState("");
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [localPermissions, setLocalPermissions] = useState({
    microphone: false,
    camera: false,
    "screen-share": false,
  });
  const [pendingPermission, setPendingPermission] = useState("");
  const [bannedUsers, setBannedUsers] = useState([]);
  const [busyAction, setBusyAction] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState("");
  const [details, setDetails] = useState("");
  const [dialog, setDialog] = useState(null);

  // ---- new UI-only state for the redesigned layout ----
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [sidePanelTab, setSidePanelTab] = useState("chat"); // chat | participants | requests

  const roomRef = useRef(null);
  const localVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const stageVideoRef = useRef(null);
  const joinAttemptedRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const backendLeaveCompletedRef = useRef(false);
  const roomListenersRef = useRef({});
  const isMountedRef = useRef(true);

  const isOwner = useMemo(() => {
    const hostId = stream?.host?._id || stream?.host?.id || stream?.hostId;
    return Boolean(
      user && hostId && String(hostId) === String(getCurrentUserId(user)),
    );
  }, [stream, user]);

  const isCurrentUserHost = useMemo(() => {
    const hostId = stream?.host?._id || stream?.host?.id || stream?.hostId;
    return Boolean(
      user && hostId && String(hostId) === String(getCurrentUserId(user)),
    );
  }, [stream, user]);

  const cleanupLiveKit = async ({ shouldLeaveBackend = false } = {}) => {
    if (cleanupInProgressRef.current) {
      return;
    }

    cleanupInProgressRef.current = true;

    const room = roomRef.current;
    const handlers = roomListenersRef.current;

    if (room) {
      Object.entries(handlers).forEach(([event, handler]) => {
        room.off(event, handler);
      });
      roomListenersRef.current = {};

      try {
        room.disconnect();
      } catch {
        // Ignore disconnect cleanup errors; UI state is already handled below.
      }
    }

    roomRef.current = null;

    if (shouldLeaveBackend && streamId && !backendLeaveCompletedRef.current) {
      try {
        await streamService.leaveStream(streamId);
        backendLeaveCompletedRef.current = true;
      } catch {
        // Ignore backend leave cleanup errors; keep the room state consistent.
      }
    }

    if (isMountedRef.current) {
      setLiveRoomState(ROOM_STATES.disconnected);
      setIsMicEnabled(false);
      setIsCameraEnabled(false);
      setIsScreenShareEnabled(false);
      setPendingPermission("");
      setBusyAction("");
      setRemoteParticipants([]);
    }

    if (room) {
      const localPublications = room.localParticipant?.trackPublications;
      if (localPublications) {
        Array.from(localPublications.values()).forEach((publication) => {
          publication?.track?.detach();
          publication?.track?.stop?.();
        });
      }
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
  };
  const cleanupLiveKitEvent = useEffectEvent(cleanupLiveKit);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      void cleanupLiveKitEvent({ shouldLeaveBackend: true });
    };
  }, []);

  const refreshStreamState = async () => {
    if (!streamId) return FALLBACK_STREAM;

    const response = await streamService.getStreamById(streamId);
    const streamData = response?.stream || response || FALLBACK_STREAM;

    setStream(streamData);

    const nextIsHost = Boolean(
      streamData?.host &&
      (streamData.host._id || streamData.host.id) === getCurrentUserId(user),
    );

    setIsHost(nextIsHost);
    return streamData;
  };
  const refreshStreamStateEvent = useEffectEvent(refreshStreamState);

  useEffect(() => {
    const loadStream = async () => {
      try {
        setLoading(true);
        setError("");
        setLivekitError("");
        setLiveRoomState(ROOM_STATES.loading);

        const streamData = await refreshStreamStateEvent();

        if (streamData?.status === "ended") {
          setLiveRoomState(ROOM_STATES.ended);
          return;
        }

        setLiveRoomState(ROOM_STATES.authorizing);
      } catch (err) {
        const status = err?.response?.status;
        const message =
          err?.response?.data?.message ||
          "Unable to load the stream right now.";

        if (
          status === 403 ||
          message.toLowerCase().includes("not authorized")
        ) {
          setLiveRoomState(ROOM_STATES.accessDenied);
          setError("You are not authorized to access this private stream.");
          return;
        }

        if (
          status === 400 &&
          message.toLowerCase().includes("invalid stream id")
        ) {
          setLiveRoomState(ROOM_STATES.error);
          setError("The stream link is invalid.");
          return;
        }

        setLiveRoomState(ROOM_STATES.error);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (streamId) {
      loadStream();
    }
  }, [streamId, user]);

  useEffect(() => {
    const loadParticipants = async () => {
      if (!streamId) return;
      try {
        const response = await streamService.getParticipants(streamId);
        setParticipants(response?.participants || []);
      } catch {
        // Skip noisy participant load errors until the UI needs a retry.
      }
    };

    const loadRequests = async () => {
      if (!streamId || !isOwner) return;
      try {
        const response = await streamService.getPendingRequests(streamId);
        setRequests(response?.requests || []);
      } catch {
        // Skip noisy request load errors until the UI needs a retry.
      }
    };

    const loadBannedUsers = async () => {
      if (!streamId || !isOwner) return;
      try {
        const response = await streamService.getBannedUsers(streamId);
        setBannedUsers(response?.bannedUsers || []);
      } catch {
        // Skip noisy banned-user load errors until the UI needs a retry.
      }
    };

    loadParticipants();
    loadRequests();
    loadBannedUsers();
  }, [streamId, isOwner]);

  useEffect(() => {
    if (!socket || !streamId) return;

    const joinRoom = () => {
      socket.emit("joinStream", streamId);
    };

    joinRoom();
    socket.on("connect", joinRoom);

    const currentUserId = user?._id || user?.id;

    const handleStreamParticipants = (payload) => {
      if (Array.isArray(payload)) {
        setParticipants(payload);
      }
    };

    const handleParticipantJoined = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) return;
      setParticipants((current) => {
        const userId = payload.userId || payload.user?._id;
        if (!userId || current.some((item) => item.user?._id === userId))
          return current;
        return [
          ...current,
          { user: { _id: userId }, role: payload.role || "viewer" },
        ];
      });
    };

    const handleParticipantLeft = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) return;
      setParticipants((current) =>
        current.filter((item) => item.user?._id !== payload.userId),
      );
    };

    const handleParticipantKicked = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) return;
      setParticipants((current) =>
        current.filter((item) => item.user?._id !== payload.userId),
      );
      if (payload?.userId && String(payload.userId) === String(currentUserId)) {
        setIsJoined(false);
        setLiveRoomState(ROOM_STATES.disconnected);
        setLivekitError("You were kicked from the stream.");
      }
    };

    const handleParticipantBanned = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) return;
      setParticipants((current) =>
        current.filter((item) => item.user?._id !== payload.userId),
      );
      if (payload?.userId && String(payload.userId) === String(currentUserId)) {
        setIsJoined(false);
        setLiveRoomState(ROOM_STATES.disconnected);
        setLivekitError("You were banned from this stream.");
      }
    };

    const handlePermissionRevoked = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) {
        return;
      }

      if (payload?.userId) {
        setParticipants((current) =>
          current.map((item) =>
            item.user?._id === payload.userId
              ? {
                  ...item,
                  permissions: {
                    ...(item.permissions || {}),
                    [payload.permission]: false,
                  },
                }
              : item,
          ),
        );
      }

      const currentUserId = user?._id || user?.id;
      if (payload?.userId && String(payload.userId) === String(currentUserId)) {
        const permissionKey =
          payload.permission === "screen-share"
            ? "screen-share"
            : payload.permission;
        setLocalPermissions((current) => ({
          ...current,
          [permissionKey]: false,
        }));
        if (payload.permission === "microphone") {
          setIsMicEnabled(false);
        }
        if (payload.permission === "camera") {
          setIsCameraEnabled(false);
        }
        if (payload.permission === "screen-share") {
          setIsScreenShareEnabled(false);
        }
      }
    };

    const handlePermissionApproved = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) return;
      if (payload?.userId && String(payload.userId) === String(currentUserId)) {
        const permissionKey =
          payload.requestType === "screen-share"
            ? "screen-share"
            : payload.requestType;
        setLocalPermissions((current) => ({
          ...current,
          [permissionKey]: true,
        }));

        if (payload.requestType === "microphone") {
          setIsMicEnabled(true);
          if (roomRef.current) {
            roomRef.current.localParticipant
              .setMicrophoneEnabled(true)
              .catch(() => {});
          }
        }

        if (payload.requestType === "camera") {
          setIsCameraEnabled(true);
          if (roomRef.current) {
            roomRef.current.localParticipant
              .setCameraEnabled(true)
              .catch(() => {});
          }
        }

        setPendingPermission("");
      }
    };

    const handlePermissionRejected = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) return;
      if (payload?.userId && String(payload.userId) === String(currentUserId)) {
        setPendingPermission("");
      }
    };

    const handleRequestCreated = (payload) => {
      if (payload?.streamId && payload.streamId !== streamId) return;
      if (!isHost) return;
      setRequests((current) => {
        const exists = current.some((item) => item._id === payload.requestId);
        if (exists) return current;
        return [
          ...current,
          {
            _id: payload.requestId,
            user: { _id: payload.userId },
            requestType: payload.requestType,
            reason: payload.requestType,
          },
        ];
      });
    };

    const handleStreamEnded = async (payload) => {
      if (payload?.streamId !== streamId) return;
      setStream((current) => ({ ...current, status: "ended" }));
      setIsJoined(false);
      setLiveRoomState(ROOM_STATES.ended);
      setLivekitError("The stream has ended.");
      notify("The stream has ended.");
      await cleanupLiveKitEvent({ shouldLeaveBackend: true });
    };

    const handleChatMessage = (payload) => {
      if (!payload || payload.streamId !== streamId) return;
      setChatMessages((current) => [
        ...current,
        {
          id: payload.id,
          text: payload.text,
          user: payload.username || "Guest",
          userId: payload.userId,
          type: "user",
        },
      ]);
    };

    socket.on("stream:participants-updated", handleStreamParticipants);
    socket.on("stream:participant-joined", handleParticipantJoined);
    socket.on("stream:participant-left", handleParticipantLeft);
    socket.on("stream:participant-kicked", handleParticipantKicked);
    socket.on("stream:participant-banned", handleParticipantBanned);
    socket.on("stream:permission-revoked", handlePermissionRevoked);
    socket.on("stream:request-created", handleRequestCreated);
    socket.on("stream:request-approved", handlePermissionApproved);
    socket.on("stream:request-rejected", handlePermissionRejected);
    socket.on("stream:ended", handleStreamEnded);
    socket.on("stream:chat-message", handleChatMessage);

    return () => {
      socket.emit("leaveStream", streamId);
      socket.off("connect", joinRoom);
      socket.off("stream:participants-updated", handleStreamParticipants);
      socket.off("stream:participant-joined", handleParticipantJoined);
      socket.off("stream:participant-left", handleParticipantLeft);
      socket.off("stream:participant-kicked", handleParticipantKicked);
      socket.off("stream:participant-banned", handleParticipantBanned);
      socket.off("stream:permission-revoked", handlePermissionRevoked);
      socket.off("stream:request-created", handleRequestCreated);
      socket.off("stream:request-approved", handlePermissionApproved);
      socket.off("stream:request-rejected", handlePermissionRejected);
      socket.off("stream:ended", handleStreamEnded);
      socket.off("stream:chat-message", handleChatMessage);
    };
  }, [socket, streamId, notify, user?._id, user?.id, isHost]);

  const connectToLiveKit = async (activeStream = null) => {
    if (!streamId || !user || joinAttemptedRef.current) return;

    const latestStream = await refreshStreamState().catch(() => null);
    const currentStream = activeStream || latestStream || stream;

    if (currentStream?.status === "ended") {
      setLiveRoomState(ROOM_STATES.ended);
      return;
    }

    if (currentStream?.status === "scheduled") {
      setLiveRoomState(ROOM_STATES.authorizing);
      setError(
        "This stream has not started yet. Please wait for the host to begin.",
      );
      setLivekitError("Stream is scheduled. Waiting for host to start.");
      return;
    }

    if (currentStream?.status !== "started") {
      setLiveRoomState(ROOM_STATES.authorizing);
      setError("This stream is not available right now.");
      setLivekitError("Stream is not in started state.");
      return;
    }

    joinAttemptedRef.current = true;
    cleanupInProgressRef.current = false;
    backendLeaveCompletedRef.current = false;
    setBusyAction("connecting");
    setLiveRoomState(ROOM_STATES.authorizing);
    setLivekitError("");

    try {
      const joinResponse = await streamService.joinStream(streamId);
      if (!joinResponse?.success && joinResponse?.message) {
        if (joinResponse.message.toLowerCase().includes("banned")) {
          setLiveRoomState(ROOM_STATES.banned);
          setError("You are banned from this stream.");
          setLivekitError("You are banned from this stream.");
          return;
        }

        throw new Error(joinResponse.message);
      }

      const tokenResponse = await streamService.generateStreamToken(streamId);
      const token = tokenResponse?.token;
      const serverUrl =
        tokenResponse?.serverUrl || import.meta.env.VITE_LIVEKIT_URL;
      const participantRecord = joinResponse?.participant;

      if (!token || !serverUrl) {
        throw new Error("LiveKit credentials are not available for this room.");
      }

      setLiveRoomState(ROOM_STATES.connecting);

      if (participantRecord) {
        const nextPermissions = {
          microphone: Boolean(
            participantRecord.microphoneEnabled ||
            participantRecord.role === "host" ||
            isCurrentUserHost,
          ),
          camera: Boolean(
            participantRecord.cameraEnabled ||
            participantRecord.role === "host" ||
            isCurrentUserHost,
          ),
          "screen-share": Boolean(
            participantRecord.screenShareEnabled ||
            participantRecord.role === "host" ||
            isCurrentUserHost,
          ),
        };
        setLocalPermissions(nextPermissions);
        setIsMicEnabled(nextPermissions.microphone);
        setIsCameraEnabled(nextPermissions.camera);
      }

      if (isCurrentUserHost) {
        setIsMicEnabled(true);
        setIsCameraEnabled(true);
        setLocalPermissions((current) => ({
          ...current,
          microphone: true,
          camera: true,
        }));
      }

      // videoCaptureDefaults caps the resolution/framerate we ever *capture*
      // from the camera; adaptiveStream + dynacast cap what we *send* based on
      // what's actually visible/subscribed. All three matter for staying
      // inside a free bandwidth tier -- 720p was overkill for filmstrip tiles
      // and was quietly multiplying everyone's downstream cost.
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 360, frameRate: 24 },
        },
      });
      roomRef.current = room;

      const handleConnected = () => {
        if (!isMountedRef.current) return;
        setBusyAction("");
        setLiveRoomState(ROOM_STATES.connected);
        setIsJoined(true);
      };

      const handleDisconnected = () => {
        if (!isMountedRef.current) return;
        setBusyAction("");
        setLiveRoomState(ROOM_STATES.disconnected);
        setIsJoined(false);
      };

      const handleReconnecting = () => {
        if (!isMountedRef.current) return;
        setBusyAction("reconnecting");
        setLiveRoomState(ROOM_STATES.reconnecting);
      };

      const handleReconnected = () => {
        if (!isMountedRef.current) return;
        setBusyAction("");
        setLiveRoomState(ROOM_STATES.connected);
      };

      const handleParticipantConnected = (participant) => {
        setRemoteParticipants((current) => {
          if (current.some((item) => item.identity === participant.identity))
            return current;
          return [
            ...current,
            {
              identity: participant.identity,
              participant,
              videoTrack: null,
              audioTrack: null,
            },
          ];
        });
      };

      const handleParticipantDisconnected = (participant) => {
        setRemoteParticipants((current) =>
          current.filter((item) => item.identity !== participant.identity),
        );
      };

      const handleTrackSubscribed = (track, publication, participant) => {
        if (!participant || !isMountedRef.current) return;
        const isVideo = track.kind === Track.Kind.Video;
        const isAudio = track.kind === Track.Kind.Audio;

        setRemoteParticipants((current) =>
          current.map((entry) => {
            if (entry.identity !== participant.identity) return entry;
            return {
              ...entry,
              participant,
              videoTrack: isVideo ? track : entry.videoTrack,
              audioTrack: isAudio ? track : entry.audioTrack,
            };
          }),
        );
      };

      const handleTrackUnsubscribed = (track, publication, participant) => {
        if (!participant || !isMountedRef.current) return;
        setRemoteParticipants((current) =>
          current.map((entry) => {
            if (entry.identity !== participant.identity) return entry;
            return {
              ...entry,
              participant,
              videoTrack:
                track.kind === Track.Kind.Video ? null : entry.videoTrack,
              audioTrack:
                track.kind === Track.Kind.Audio ? null : entry.audioTrack,
            };
          }),
        );
      };

      const handleConnectionError = (error) => {
        if (!isMountedRef.current) return;
        setLiveRoomState(ROOM_STATES.error);
        setLivekitError(error?.message || "LiveKit connection failed.");
      };

      roomListenersRef.current = {
        [RoomEvent.Connected]: handleConnected,
        [RoomEvent.Disconnected]: handleDisconnected,
        [RoomEvent.Reconnecting]: handleReconnecting,
        [RoomEvent.Reconnected]: handleReconnected,
        [RoomEvent.ParticipantConnected]: handleParticipantConnected,
        [RoomEvent.ParticipantDisconnected]: handleParticipantDisconnected,
        [RoomEvent.TrackSubscribed]: handleTrackSubscribed,
        [RoomEvent.TrackUnsubscribed]: handleTrackUnsubscribed,
        [RoomEvent.ConnectionError]: handleConnectionError,
      };

      Object.entries(roomListenersRef.current).forEach(([event, handler]) => {
        room.on(event, handler);
      });

      await room.connect(serverUrl, token);
      await room.startAudio();

      const effectiveMicPermission =
        participantRecord?.microphoneEnabled ?? isCurrentUserHost ?? true;
      const effectiveCameraPermission =
        participantRecord?.cameraEnabled ?? isCurrentUserHost ?? true;

      if (effectiveMicPermission) {
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMicEnabled(true);
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMicEnabled(false);
      }

      if (effectiveCameraPermission) {
        await room.localParticipant.setCameraEnabled(true);
        setIsCameraEnabled(true);
      } else {
        await room.localParticipant.setCameraEnabled(false);
        setIsCameraEnabled(false);
      }

      setRemoteParticipants(
        Array.from(room.remoteParticipants.values()).map((participant) => ({
          identity: participant.identity,
          participant,
          videoTrack: null,
          audioTrack: null,
        })),
      );
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to connect to LiveKit.";

      if (String(message).toLowerCase().includes("banned")) {
        setLiveRoomState(ROOM_STATES.banned);
        setError("You are banned from this stream.");
        setLivekitError("You are banned from this stream.");
        return;
      }

      if (String(message).toLowerCase().includes("not authorized")) {
        setLiveRoomState(ROOM_STATES.accessDenied);
        setError("You are not authorized to access this private stream.");
        return;
      }

      // Reset the join guard so the user can actually retry after a failure.
      // Without this, joinAttemptedRef stays true forever and connectToLiveKit()
      // silently no-ops on every future call, permanently stuck.
      joinAttemptedRef.current = false;

      if (!isMountedRef.current) return;
      setBusyAction("");
      setLiveRoomState(ROOM_STATES.error);
      setLivekitError(message);
      await cleanupLiveKit({ shouldLeaveBackend: false });
    }
  };
  const connectToLiveKitEvent = useEffectEvent(connectToLiveKit);

  useEffect(() => {
    if (!streamId || !user || !stream?._id) return;
    if (stream.status === "ended") {
      const timerId = window.setTimeout(
        () => setLiveRoomState(ROOM_STATES.ended),
        0,
      );
      return () => window.clearTimeout(timerId);
    }
    if (
      liveRoomState === ROOM_STATES.accessDenied ||
      liveRoomState === ROOM_STATES.banned ||
      liveRoomState === ROOM_STATES.ended
    ) {
      return;
    }
    if (
      liveRoomState !== ROOM_STATES.authorizing &&
      liveRoomState !== ROOM_STATES.disconnected
    ) {
      return;
    }
    if (!joinAttemptedRef.current) {
      void connectToLiveKitEvent();
    }
  }, [streamId, user, stream?._id, stream?.status, liveRoomState]);

  // Attach local camera to the big stage (instead of a small tile) so the
  // main video area behaves like a real "you are live" preview.
  useEffect(() => {
    const stageVideoElement = stageVideoRef.current;
    const room = roomRef.current;

    if (!stageVideoElement || !room || !isCameraEnabled) {
      return;
    }

    const publication = room.localParticipant.getTrackPublication(
      Track.Source.Camera,
    );
    const track = publication?.track;

    if (track?.kind === Track.Kind.Video) {
      track.attach(stageVideoElement);
      return () => track.detach(stageVideoElement);
    }
  }, [isCameraEnabled, liveRoomState]);

  useEffect(() => {
    const localVideoElement = localVideoRef.current;
    const room = roomRef.current;

    if (!localVideoElement || !room || !isCameraEnabled) {
      return;
    }

    const publication = room.localParticipant.getTrackPublication(
      Track.Source.Camera,
    );
    const track = publication?.track;

    if (track?.kind === Track.Kind.Video) {
      track.attach(localVideoElement);
      return () => track.detach(localVideoElement);
    }
  }, [isCameraEnabled, liveRoomState]);

  useEffect(() => {
    const localAudioElement = localAudioRef.current;
    const room = roomRef.current;

    if (!localAudioElement || !room || !isMicEnabled) {
      return;
    }

    const publication = room.localParticipant.getTrackPublication(
      Track.Source.Microphone,
    );
    const track = publication?.track;

    if (track?.kind === Track.Kind.Audio) {
      track.attach(localAudioElement);
      return () => track.detach(localAudioElement);
    }
  }, [isMicEnabled, liveRoomState]);

  const handleHostStartAndJoin = async () => {
    if (!streamId || busyAction || !isHost || stream?.status !== "scheduled") {
      return;
    }

    setBusyAction("starting");
    setError("");
    setLivekitError("");

    try {
      const response = await streamService.startStream(streamId);
      const startedStream = response?.stream || response;
      const refreshedStream = await refreshStreamState();
      const nextStatus =
        refreshedStream?.status || startedStream?.status || "started";

      const updatedStream = {
        ...stream,
        ...refreshedStream,
        ...startedStream,
        status: nextStatus,
      };

      setStream(updatedStream);

      if (nextStatus !== "started") {
        throw new Error("The stream could not be started.");
      }

      joinAttemptedRef.current = false;
      await connectToLiveKit(updatedStream);
      notify("The stream is live.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start the stream.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleJoin = async () => {
    if (
      !streamId ||
      busyAction ||
      isJoined ||
      liveRoomState === ROOM_STATES.accessDenied ||
      liveRoomState === ROOM_STATES.banned ||
      liveRoomState === ROOM_STATES.ended
    )
      return;

    try {
      const latestStream = await refreshStreamState();
      const currentStatus = latestStream?.status || stream?.status;

      if (isHost && currentStatus === "scheduled") {
        await handleHostStartAndJoin();
        return;
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to refresh the stream status.",
      );
      return;
    }

    setBusyAction("joining");
    try {
      joinAttemptedRef.current = false;
      await connectToLiveKit();
      notify("You joined the room.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to join the room.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleLeave = async () => {
    if (!streamId || cleanupInProgressRef.current || busyAction) return;
    setBusyAction("leaving");
    try {
      setLiveRoomState(ROOM_STATES.ending);
      await streamService.leaveStream(streamId);
      backendLeaveCompletedRef.current = true;
      setIsJoined(false);
      setLiveRoomState(ROOM_STATES.disconnected);
      notify("You left the room.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to leave the room.",
      );
    } finally {
      await cleanupLiveKit({ shouldLeaveBackend: false });
      setBusyAction("");
    }
  };

  const requestPermission = async (permissionType) => {
    if (!streamId || busyAction) return;
    setBusyAction("requesting-permission");
    try {
      setPendingPermission(permissionType);
      await streamService.requestPermission(streamId, permissionType);
      notify("Permission request sent to the host.");
    } catch (error) {
      setPendingPermission("");
      setLivekitError(
        error?.response?.data?.message || "Unable to request access.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleToggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;

    if (!isHost && !localPermissions.microphone) {
      await requestPermission("microphone");
      return;
    }

    try {
      const nextValue = !isMicEnabled;
      await room.localParticipant.setMicrophoneEnabled(nextValue);
      setIsMicEnabled(nextValue);
    } catch (error) {
      setLivekitError(error?.message || "Unable to toggle microphone.");
    }
  };

  const handleToggleCamera = async () => {
    const room = roomRef.current;
    if (!room) return;

    if (!isHost && !localPermissions.camera) {
      await requestPermission("camera");
      return;
    }

    try {
      const nextValue = !isCameraEnabled;
      await room.localParticipant.setCameraEnabled(nextValue);
      setIsCameraEnabled(nextValue);
    } catch (error) {
      setLivekitError(error?.message || "Unable to toggle camera.");
    }
  };

  const handleToggleScreenShare = async () => {
    const room = roomRef.current;
    if (!room) return;

    if (!isHost && !localPermissions["screen-share"]) {
      await requestPermission("screen-share");
      return;
    }

    try {
      const nextValue = !isScreenShareEnabled;
      await room.localParticipant.setScreenShareEnabled(nextValue);
      setIsScreenShareEnabled(nextValue);
    } catch (error) {
      setLivekitError(error?.message || "Unable to toggle screen share.");
    }
  };

  const handleStart = async () => {
    if (!streamId || busyAction) return;
    try {
      const response = await streamService.createStream({
        title: stream.title || "Untitled stream",
        description: stream.description || "Live session",
        visibility: stream.isPrivate ? "private" : "public",
      });
      const created = response?.stream || response;
      const createdId = created?._id || created?.id;

      if (!createdId) {
        throw new Error("Stream creation did not return a valid id.");
      }

      navigate(`/live/${createdId}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create a stream.");
    }
  };

  const handleEndStream = async () => {
    if (!streamId || busyAction || stream?.status === "ended") return;

    setDialog(null);
    setBusyAction("ending");
    try {
      await streamService.endStream(streamId);
      setStream((current) => ({ ...current, status: "ended" }));
      setIsJoined(false);
      setLiveRoomState(ROOM_STATES.ended);
      setLivekitError("The stream has ended.");
      notify("The stream has ended.");
      await cleanupLiveKit({ shouldLeaveBackend: false });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to end the stream.");
    } finally {
      setBusyAction("");
    }
  };

  const openEndStreamDialog = () => {
    if (!streamId || busyAction || stream?.status === "ended") return;
    setDialog({ type: "end" });
  };

  const handleKickParticipant = async (userId) => {
    if (!streamId || busyAction) return;
    setBusyAction("kicking");
    try {
      await streamService.kickParticipant(streamId, userId);
      setParticipants((current) =>
        current.filter((item) => item.user?._id !== userId),
      );
      notify("Participant kicked.");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to kick the participant.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleBanParticipant = async (userId) => {
    if (!streamId || busyAction) return;
    const reasonText = dialog?.reason || "";
    setDialog(null);
    setBusyAction("banning");
    try {
      await streamService.banParticipant(streamId, userId, reasonText);
      setParticipants((current) =>
        current.filter((item) => item.user?._id !== userId),
      );
      const participantToBan = participants.find(
        (item) => item.user?._id === userId,
      );
      setBannedUsers((current) => [
        {
          _id: `${userId}-${Date.now()}`,
          user: participantToBan?.user || { _id: userId, username: "User" },
          reason: reasonText,
        },
        ...current,
      ]);
      notify("Participant banned.");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to ban the participant.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const openBanDialog = (userId) => {
    if (!streamId || busyAction) return;
    setDialog({ type: "ban", userId, reason: "" });
  };

  const handleUnbanParticipant = async (userId) => {
    if (!streamId || busyAction) return;
    setBusyAction("unbanning");
    try {
      await streamService.unbanParticipant(streamId, userId);
      setBannedUsers((current) =>
        current.filter((entry) => entry.user?._id !== userId),
      );
      notify("Participant unbanned.");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to unban the participant.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleRevokePermission = async (permissionType, userId) => {
    if (!streamId || busyAction) return;
    setBusyAction("revoking");
    try {
      if (permissionType === "microphone") {
        await streamService.revokeMicrophone(streamId, userId);
      }
      if (permissionType === "camera") {
        await streamService.revokeCamera(streamId, userId);
      }
      if (permissionType === "screen-share") {
        await streamService.revokeScreenShare(streamId, userId);
      }
      setParticipants((current) =>
        current.map((item) =>
          item.user?._id === userId
            ? {
                ...item,
                permissions: {
                  ...(item.permissions || {}),
                  [permissionType]: false,
                },
              }
            : item,
        ),
      );
      notify("Permission revoked.");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to revoke permission.");
    } finally {
      setBusyAction("");
    }
  };

  const handleApproveRequest = async (requestId) => {
    if (!streamId || busyAction) return;
    setBusyAction("approving");
    try {
      await streamService.approveRequest(streamId, requestId);
      setRequests((current) =>
        current.filter((item) => item._id !== requestId),
      );
      notify("Permission approved.");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to approve request.");
    } finally {
      setBusyAction("");
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!streamId || busyAction) return;
    setBusyAction("rejecting");
    try {
      await streamService.rejectRequest(streamId, requestId);
      setRequests((current) =>
        current.filter((item) => item._id !== requestId),
      );
      notify("Permission request rejected.");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to reject request.");
    } finally {
      setBusyAction("");
    }
  };

  const handleReport = async () => {
    if (!streamId || !reason.trim() || reportSubmitting) return;
    setReportSubmitting(true);
    setReportStatus("");
    try {
      await streamService.createStreamReport(streamId, {
        reason: reason.trim(),
        details: details.trim(),
      });
      setReportStatus("submitted");
      setReason("");
      setDetails("");
      notify("Report submitted.");
    } catch (err) {
      setReportStatus("error");
      setError(err?.response?.data?.message || "Unable to submit report.");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSendChat = async () => {
    if (!message.trim() || !socket || !streamId) return;

    const text = message.trim();
    const currentUserId = getCurrentUserId(user);
    const localMessage = {
      id: `${currentUserId}-${Date.now()}`,
      text,
      user: user?.username || "Guest",
      userId: currentUserId,
      type: "user",
    };

    setChatMessages((current) => [...current, localMessage]);
    socket.emit("stream:chat-send", {
      streamId,
      text,
      userId: currentUserId,
      username: user?.username || "Guest",
      id: localMessage.id,
    });

    setMessage("");
  };

  const renderEmpty = (text) => (
    <div className="live-room-empty-state">{text}</div>
  );

  const viewerCount =
    stream.totalViewers ?? stream.viewersCount ?? participants.length;

  const primaryRemote =
    remoteParticipants.find((p) => p.videoTrack) || remoteParticipants[0];
  const otherRemotes = remoteParticipants.filter((p) => p !== primaryRemote);

  const showLocalAsStage = isCameraEnabled && (isHost || !primaryRemote);

  /* --------------------------------- Render -------------------------------- */

  if (
    liveRoomState === ROOM_STATES.accessDenied ||
    liveRoomState === ROOM_STATES.banned
  ) {
    return (
      <div className="live-room-shell-v2">
        <div className="live-room-empty-state" style={{ margin: 40 }}>
          {liveRoomState === ROOM_STATES.banned
            ? "You are banned from this stream."
            : "Access denied. You are not authorized to view this stream."}
          <button
            className="btn-primary"
            onClick={() => navigate("/live")}
            style={{ marginTop: 12 }}
          >
            Back to Live Rooms
          </button>
        </div>
      </div>
    );
  }

  const liveStatusLabel =
    stream?.status === "started"
      ? "LIVE"
      : stream?.status === "ended"
        ? "Ended"
        : "Scheduled";

  if (liveRoomState === ROOM_STATES.ended) {
    return (
      <div className="live-room-shell-v2">
        <div className="live-room-ended-shell">
          <div className="live-room-ended-card">
            <div className="live-room-ended-pill">Stream ended</div>
            <h2>{stream.title || "This live stream has ended"}</h2>
            <p>{stream.description || "The host has ended the broadcast."}</p>
            <div className="live-room-ended-meta">
              <span>
                Host: {stream.host?.username || stream.host?.name || "Host"}
              </span>
              <span>
                {stream.accessMode || (stream.isPrivate ? "Private" : "Public")}
              </span>
            </div>
            <div className="live-room-controls ended-actions">
              <button className="btn-primary" onClick={() => navigate("/live")}>
                Back to live rooms
              </button>
              {isHost ? (
                <button className="btn-ghost" onClick={handleStart}>
                  Create new stream
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`live-room-shell-v2${isSidePanelOpen ? "" : " panel-collapsed"}`}
    >
      {/* ---------------- Top bar ---------------- */}
      <header className="ytbar">
        <button
          className="ytbar-back"
          onClick={() => navigate("/live")}
          aria-label="Back to live rooms"
        >
          <ChevronIcon direction="left" />
        </button>
        <div className="ytbar-title">
          <h1>{stream.title || "Live room"}</h1>
          <div className="ytbar-meta">
            <span
              className={`ytbar-live-dot${stream.status === "started" ? " on" : ""}`}
            >
              {liveStatusLabel}
            </span>
            <span>{stream.host?.username || stream.host?.name || "Host"}</span>
            <span>{viewerCount} watching</span>
            <span className="ytbar-visibility">
              {stream.accessMode || (stream.isPrivate ? "Private" : "Public")}
            </span>
          </div>
        </div>
        <div className="ytbar-actions">
          <button
            className="ytbar-icon-btn"
            onClick={() => {
              setReportStatus("");
              setShowReportModal(true);
            }}
            title="Report stream"
            aria-label="Report stream"
          >
            <FlagIcon />
          </button>
          {isHost ? (
            <button
              className="btn-danger-solid"
              onClick={openEndStreamDialog}
              disabled={stream?.status === "ended" || busyAction === "ending"}
            >
              {busyAction === "ending" ? "Ending…" : "End stream"}
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="live-room-empty-state banner-msg">{error}</div>
      ) : null}
      {livekitError ? (
        <div className="live-room-empty-state banner-msg">{livekitError}</div>
      ) : null}

      {/* ---------------- Body: stage + side panel ---------------- */}
      <div className="ytbody">
        <div className="ytstage-column">
          <div className="ytstage">
            {showLocalAsStage ? (
              <video
                ref={stageVideoRef}
                autoPlay
                playsInline
                muted
                className="ytstage-video"
              />
            ) : primaryRemote?.videoTrack ? (
              <ParticipantTile
                participant={primaryRemote.participant}
                videoTrack={primaryRemote.videoTrack}
                audioTrack={primaryRemote.audioTrack}
                label={getDisplayNameForIdentity(
                  primaryRemote.participant?.identity,
                )}
                variant="stage"
              />
            ) : (
              <div className="ytstage-placeholder">
                <div className="ytstage-placeholder-avatar">
                  {(stream.host?.username || stream.host?.name || "H")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
                <h2>{stream.host?.username || stream.host?.name || "Host"}</h2>
                <p>
                  {isJoined
                    ? isHost
                      ? "You're hosting this stream"
                      : "Watching the stream"
                    : stream.status === "started"
                      ? "Join to watch"
                      : "Stream is not live yet"}
                </p>
                {!isJoined ? (
                  <button
                    className="btn-primary"
                    onClick={handleJoin}
                    disabled={
                      loading ||
                      busyAction === "joining" ||
                      busyAction === "connecting" ||
                      busyAction === "reconnecting"
                    }
                  >
                    {loading || busyAction === "connecting"
                      ? "Connecting…"
                      : busyAction === "joining"
                        ? "Joining…"
                        : isHost
                          ? "Open room"
                          : "Join room"}
                  </button>
                ) : null}
              </div>
            )}

            {/* self picture-in-picture, Meet-style, only when host is watching someone else */}
            {isJoined && isCameraEnabled && !showLocalAsStage ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="ytstage-pip"
              />
            ) : null}

            <div className="ytstage-corner-badge">
              {liveRoomState === ROOM_STATES.reconnecting
                ? "Reconnecting…"
                : null}
            </div>
          </div>

          {/* Meet-style control bar */}
          {isJoined ? (
            <div className="meetbar">
              <ControlButton
                active={isMicEnabled}
                onClick={handleToggleMic}
                label={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
                disabled={pendingPermission === "microphone"}
              >
                <MicIcon off={!isMicEnabled} />
              </ControlButton>

              <ControlButton
                active={isCameraEnabled}
                onClick={handleToggleCamera}
                label={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
                disabled={pendingPermission === "camera"}
              >
                <CameraIcon off={!isCameraEnabled} />
              </ControlButton>

              <ControlButton
                active={isScreenShareEnabled}
                onClick={handleToggleScreenShare}
                label={
                  isScreenShareEnabled ? "Stop screen share" : "Share screen"
                }
                disabled={pendingPermission === "screen-share"}
              >
                <ScreenShareIcon />
              </ControlButton>

              <div className="meetbar-divider" />

              <ControlButton
                active={isSidePanelOpen && sidePanelTab === "chat"}
                onClick={() => {
                  setSidePanelTab("chat");
                  setIsSidePanelOpen(true);
                }}
                label="Chat"
              >
                <ChatIcon />
              </ControlButton>

              <ControlButton
                active={isSidePanelOpen && sidePanelTab === "participants"}
                onClick={() => {
                  setSidePanelTab("participants");
                  setIsSidePanelOpen(true);
                }}
                label="Participants"
                badge={participants.length || null}
              >
                <UsersIcon />
              </ControlButton>

              {isHost ? (
                <ControlButton
                  active={isSidePanelOpen && sidePanelTab === "requests"}
                  onClick={() => {
                    setSidePanelTab("requests");
                    setIsSidePanelOpen(true);
                  }}
                  label="Requests"
                  badge={requests.length || null}
                >
                  <BellIcon />
                </ControlButton>
              ) : null}

              <div className="meetbar-divider" />

              <ControlButton
                danger
                onClick={handleLeave}
                disabled={busyAction === "leaving"}
                label="Leave"
              >
                <LeaveIcon />
              </ControlButton>
            </div>
          ) : (
            <div className="meetbar meetbar-idle">
              <span>
                {stream.status === "started"
                  ? "This stream is live."
                  : "This stream hasn't started."}
              </span>
            </div>
          )}

          {/* filmstrip of other participants */}
          {otherRemotes.length ? (
            <div className="filmstrip">
              {otherRemotes.map((entry) => (
                <ParticipantTile
                  key={entry.identity}
                  participant={entry.participant}
                  videoTrack={entry.videoTrack}
                  audioTrack={entry.audioTrack}
                  label={getDisplayNameForIdentity(entry.participant?.identity)}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* ---------------- Side panel ---------------- */}
        <button
          type="button"
          className="side-panel-edge-toggle"
          onClick={() => setIsSidePanelOpen((v) => !v)}
          aria-label={isSidePanelOpen ? "Collapse panel" : "Expand panel"}
        >
          <ChevronIcon direction={isSidePanelOpen ? "right" : "left"} />
        </button>

        <aside className="side-panel">
          <div className="side-panel-tabs">
            <button
              className={sidePanelTab === "chat" ? "is-active" : ""}
              onClick={() => setSidePanelTab("chat")}
            >
              Chat
            </button>
            <button
              className={sidePanelTab === "participants" ? "is-active" : ""}
              onClick={() => setSidePanelTab("participants")}
            >
              People {participants.length ? `(${participants.length})` : ""}
            </button>
            {isHost ? (
              <button
                className={sidePanelTab === "requests" ? "is-active" : ""}
                onClick={() => setSidePanelTab("requests")}
              >
                Requests {requests.length ? `(${requests.length})` : ""}
              </button>
            ) : null}
          </div>

          {sidePanelTab === "chat" ? (
            <div className="side-panel-chat">
              <div className="side-panel-chat-messages">
                {chatMessages.length ? (
                  chatMessages.map((item, index) => (
                    <div key={`${item.user}-${index}`} className="chat-bubble">
                      <span className="chat-bubble-user">{item.user}</span>
                      <span className="chat-bubble-text">{item.text}</span>
                    </div>
                  ))
                ) : (
                  <div className="chat-bubble system">
                    Say hello to the room.
                  </div>
                )}
              </div>
              <div className="side-panel-chat-input">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder="Send a message"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!message.trim()}
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          ) : null}

          {sidePanelTab === "participants" ? (
            <div className="side-panel-list">
              {isHost && bannedUsers.length ? (
                <div className="side-panel-group">
                  <div className="side-panel-group-title">Banned</div>
                  {bannedUsers.map((entry) => (
                    <div
                      key={entry._id || entry.user?._id}
                      className="side-panel-row"
                    >
                      <div>
                        <strong>
                          {entry.user?.username || entry.user?.name || "User"}
                        </strong>
                        <div className="side-panel-row-sub">
                          {entry.reason || "No reason provided"}
                        </div>
                      </div>
                      <button
                        className="btn-ghost small-btn"
                        onClick={() => handleUnbanParticipant(entry.user?._id)}
                        disabled={busyAction === "unbanning"}
                      >
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {participants.length
                ? participants.map((participant, index) => {
                    const participantId =
                      participant.user?._id || participant._id || index;
                    const roleLabel =
                      participant.role === "host"
                        ? "Host"
                        : participant.role === "speaker"
                          ? "Speaker"
                          : "Viewer";
                    const permissions = [
                      participant.microphoneEnabled ? "mic" : null,
                      participant.cameraEnabled ? "camera" : null,
                      participant.screenShareEnabled ? "screen" : null,
                    ].filter(Boolean);

                    return (
                      <div key={participantId} className="side-panel-row">
                        <div>
                          <strong>
                            {participant.user?.username ||
                              participant.user?.name ||
                              participant.username ||
                              "Participant"}
                          </strong>
                          <div className="side-panel-row-sub">
                            {roleLabel}{" "}
                            {permissions.length
                              ? `· ${permissions.join(", ")}`
                              : ""}
                          </div>
                        </div>
                        {isHost && participant.role !== "host" ? (
                          <div className="side-panel-row-actions">
                            <button
                              className="btn-ghost small-btn"
                              onClick={() =>
                                handleKickParticipant(participantId)
                              }
                              disabled={busyAction === "kicking"}
                            >
                              Kick
                            </button>
                            <button
                              className="btn-ghost small-btn"
                              onClick={() => openBanDialog(participantId)}
                              disabled={busyAction === "banning"}
                            >
                              Ban
                            </button>
                            {participant.microphoneEnabled ? (
                              <button
                                className="btn-ghost small-btn"
                                onClick={() =>
                                  handleRevokePermission(
                                    "microphone",
                                    participantId,
                                  )
                                }
                                disabled={busyAction === "revoking"}
                              >
                                Mute
                              </button>
                            ) : null}
                            {participant.cameraEnabled ? (
                              <button
                                className="btn-ghost small-btn"
                                onClick={() =>
                                  handleRevokePermission(
                                    "camera",
                                    participantId,
                                  )
                                }
                                disabled={busyAction === "revoking"}
                              >
                                Cam off
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                : renderEmpty("No participants yet")}
            </div>
          ) : null}

          {sidePanelTab === "requests" && isHost ? (
            <div className="side-panel-list">
              {requests.length
                ? requests.map((request) => (
                    <div key={request._id} className="side-panel-row">
                      <div>
                        <strong>
                          {request.user?.username ||
                            request.user?.name ||
                            "User"}
                        </strong>
                        <div className="side-panel-row-sub">
                          {request.requestType ||
                            request.reason ||
                            "Requested access"}
                        </div>
                      </div>
                      <div className="side-panel-row-actions">
                        <button
                          className="btn-primary small-btn"
                          onClick={() => handleApproveRequest(request._id)}
                          disabled={
                            busyAction === "approving" ||
                            busyAction === "rejecting"
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="btn-ghost small-btn"
                          onClick={() => handleRejectRequest(request._id)}
                          disabled={
                            busyAction === "approving" ||
                            busyAction === "rejecting"
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                : renderEmpty("No pending requests")}
            </div>
          ) : null}
        </aside>
      </div>

      {showReportModal ? (
        <div className="live-room-modal-backdrop">
          <div className="live-room-modal">
            <h3>Report this stream</h3>
            <p style={{ color: "#94a3b8" }}>
              Let the moderators know what needs attention.
            </p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe the issue"
            />
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Optional details"
            />
            <div className="live-room-controls">
              <button
                className="btn-primary"
                onClick={handleReport}
                disabled={reportSubmitting || !reason.trim()}
              >
                {reportSubmitting ? "Submitting..." : "Submit report"}
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowReportModal(false);
                  setReportStatus("");
                }}
                disabled={reportSubmitting}
              >
                Cancel
              </button>
            </div>
            {reportStatus === "error" ? (
              <p style={{ color: "#fca5a5" }}>
                Unable to submit the report right now.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <AlertModal
        message={
          dialog?.type === "end"
            ? "End the stream for everyone?"
            : dialog?.type === "ban"
              ? "Optional ban reason"
              : ""
        }
        title={dialog?.type === "ban" ? "Ban participant" : "End stream"}
        onClose={() => setDialog(null)}
        onConfirm={
          dialog?.type === "end"
            ? handleEndStream
            : dialog?.type === "ban"
              ? () => handleBanParticipant(dialog.userId)
              : undefined
        }
        confirmLabel={dialog?.type === "ban" ? "Ban participant" : "End stream"}
        inputValue={dialog?.reason || ""}
        onInputChange={
          dialog?.type === "ban"
            ? (value) => setDialog((current) => ({ ...current, reason: value }))
            : undefined
        }
        inputPlaceholder="Leave blank to use no reason"
      />
    </div>
  );
}
