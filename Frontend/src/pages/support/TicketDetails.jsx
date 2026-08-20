import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  getSupportTicket,
  updateTicketStatus,
} from "../../services/supportService";
import {
  deleteConversationMessage,
  editConversationMessage,
  getConversationMessages,
  sendConversationMessage,
} from "../../services/messageService";
import "./ticket-details.css";

function BackIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function InstructorIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4L2 9l10 5 10-5-10-5z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    </svg>
  );
}

function CourseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function LessonIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function PriorityIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 000 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a2 2 0 000-4V8z" />
    </svg>
  );
}

const SUPPORT_STATUS_FLOW = {
  Open: ["Claimed"],
  Claimed: ["In Progress"],
  "In Progress": ["Waiting For Student", "Resolved"],
  "Waiting For Student": ["In Progress", "Resolved"],
  Resolved: ["Closed"],
  Closed: [],
};

function getPriorityClassName(priority) {
  if (!priority) return "priority-medium";

  const normalized = String(priority).toLowerCase();

  if (normalized.includes("high")) return "priority-high";
  if (normalized.includes("low")) return "priority-low";

  return "priority-medium";
}

function getStatusClassName(status) {
  if (!status) return "status-open";

  const normalized = String(status).toLowerCase();

  if (normalized.includes("progress")) return "status-progress";
  if (normalized.includes("waiting")) return "status-waiting";
  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return "status-resolved";
  }

  return "status-open";
}

export default function TicketDetails({ notify }) {
  const { ticketId } = useParams();
  const { user, socket } = useAuth();
  const showNotify = typeof notify === "function" ? notify : () => {};

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [messageMenuId, setMessageMenuId] = useState(null);
  const [updatingMessageId, setUpdatingMessageId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDeleteId, setMessageToDeleteId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getSupportTicket(ticketId);

      setTicket(data.ticket);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTicket();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadTicket]);

  const conversationId = ticket?.conversation?._id || ticket?.conversation;

  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);
        const response = await getConversationMessages(conversationId);
        setMessages(response.messages || []);
      } catch (error) {
        console.error(error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    void loadMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return undefined;

    const handleIncomingMessage = (incomingMessage) => {
      const incomingConversationId = String(
        incomingMessage?.conversation?._id ||
          incomingMessage?.conversation ||
          "",
      );

      if (incomingConversationId !== String(conversationId)) return;

      setMessages((currentMessages) =>
        currentMessages.some((message) => message._id === incomingMessage._id)
          ? currentMessages
          : [...currentMessages, incomingMessage],
      );
    };

    socket.emit("joinConversation", String(conversationId));
    socket.on("newMessage", handleIncomingMessage);

    return () => socket.off("newMessage", handleIncomingMessage);
  }, [socket, conversationId]);

  useEffect(() => {
    if (!socket || !ticketId) return undefined;

    const handleStatusUpdate = (event) => {
      if (String(event?.ticketId) !== String(ticketId) || !event.ticket) {
        return;
      }

      setTicket(event.ticket);
    };

    socket.on("support:status-updated", handleStatusUpdate);
    return () => socket.off("support:status-updated", handleStatusUpdate);
  }, [socket, ticketId]);

  const handleStatusChange = async (nextStatus) => {
    if (!ticketId || savingStatus) return;

    try {
      setSavingStatus(true);
      const response = await updateTicketStatus(ticketId, nextStatus);
      const nextTicket = response?.ticket || null;

      setTicket(nextTicket || ticket);
      showNotify(`Ticket moved to ${nextStatus}`);
    } catch (error) {
      showNotify(
        error.response?.data?.message || "Could not update ticket status.",
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (
      !conversationId ||
      (!messageText.trim() && selectedFiles.length === 0) ||
      sendingMessage
    )
      return;

    try {
      setSendingMessage(true);
      const response = await sendConversationMessage(
        conversationId,
        messageText.trim(),
        selectedFiles,
      );
      const nextMessage = response?.message || response?.data?.message || null;

      if (nextMessage) {
        setMessages((currentMessages) => [...currentMessages, nextMessage]);
      }
      setMessageText("");
      setSelectedFiles([]);
      showNotify("Reply sent");
    } catch (error) {
      showNotify(error.response?.data?.message || "Could not send your reply.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    setSelectedFiles((currentFiles) => [...currentFiles, ...files]);
    event.target.value = "";
  };

  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleStartEdit = (message) => {
    setEditingMessageId(message._id);
    setEditingText(message.content || "");
    setMessageMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editingText.trim() || updatingMessageId) return;

    try {
      setUpdatingMessageId(messageId);
      const response = await editConversationMessage(
        messageId,
        editingText.trim(),
      );
      const updatedMessage =
        response?.message || response?.data?.message || null;

      if (updatedMessage) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message._id === messageId
              ? { ...message, ...updatedMessage }
              : message,
          ),
        );
      }

      setEditingMessageId(null);
      setEditingText("");
      showNotify("Message updated");
    } catch (error) {
      showNotify(
        error.response?.data?.message || "Could not update your message.",
      );
    } finally {
      setUpdatingMessageId(null);
    }
  };

  const openDeleteModal = (messageId) => {
    setMessageToDeleteId(messageId);
    setShowDeleteModal(true);
    setMessageMenuId(null);
  };

  const handleDeleteMessage = async (deleteForEveryone = false) => {
    if (!messageToDeleteId || updatingMessageId) return;

    try {
      setUpdatingMessageId(messageToDeleteId);
      await deleteConversationMessage(messageToDeleteId, deleteForEveryone);
      setMessages((currentMessages) =>
        currentMessages.filter((message) => message._id !== messageToDeleteId),
      );
      setShowDeleteModal(false);
      setMessageToDeleteId(null);
      showNotify(
        deleteForEveryone
          ? "Message deleted for everyone"
          : "Message deleted for you",
      );
    } catch (error) {
      showNotify(
        error.response?.data?.message || "Could not delete your message.",
      );
    } finally {
      setUpdatingMessageId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="glass-card">Loading Ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="td-page">
        <div className="td-state-card">Ticket not found.</div>
      </div>
    );
  }

  const allowedNextStatuses = SUPPORT_STATUS_FLOW[ticket.status] || [];
  const assignedInstructorId =
    ticket.assignedInstructor?._id || ticket.assignedInstructor;
  const isCurrentInstructor = Boolean(
    user?._id &&
    assignedInstructorId &&
    String(assignedInstructorId) === String(user._id),
  );
  const canManageWorkflow = user?.role === "admin" || isCurrentInstructor;
  const isTicketOwner = Boolean(
    user?._id &&
    ticket.student?._id &&
    String(ticket.student._id) === String(user._id),
  );
  const isClosed = String(ticket.status || "").toLowerCase() === "closed";
  const canReply = Boolean(
    conversationId && !isClosed && (isTicketOwner || isCurrentInstructor),
  );
  const priorityClassName = `td-badge td-badge-priority ${getPriorityClassName(ticket.priority)}`;
  const statusClassName = `td-status-pill ${getStatusClassName(ticket.status)}`;
  const statusHistory = Array.isArray(ticket.statusHistory)
    ? ticket.statusHistory
    : [];
  const messageToDelete =
    messages.find((message) => message._id === messageToDeleteId) || null;
  const isDeletingOwnMessage = Boolean(
    user?._id &&
    messageToDelete?.sender?._id &&
    String(messageToDelete.sender._id) === String(user._id),
  );

  return (
    <div className="td-page">
      {/* ── topbar ── */}
      <div className="td-topbar">
        <button className="td-btn-back" onClick={() => window.history.back()}>
          <BackIcon /> Back to Support
        </button>

        <div className="td-topbar-badges">
          <span className="td-ticket-number">
            <TicketIcon /> {ticket.ticketNumber}
          </span>
          <span className={priorityClassName}>
            <PriorityIcon /> {ticket.priority}
          </span>
          <span className={statusClassName}>
            <StatusIcon /> {ticket.status}
          </span>
        </div>
      </div>

      {/* ── hero ── */}
      <div className="td-hero">
        <h1 className="td-title">{ticket.title}</h1>
        <p className="td-desc">{ticket.description}</p>
      </div>

      {/* ── two-column body ── */}
      <div className="td-body">
        {/* ── main: description card (expandable later for replies) ── */}
        <div className="td-main">
          <div className="td-card">
            <div className="td-card-header">
              <h3 className="td-card-title">Ticket Details</h3>
            </div>

            <div className="td-detail-block">
              <div className="td-detail-label">Description</div>
              <p className="td-detail-text">{ticket.description}</p>
            </div>

            {ticket.course && (
              <div className="td-detail-block">
                <div className="td-detail-label">Course</div>
                <div className="td-detail-value">{ticket.course}</div>
              </div>
            )}

            {ticket.lesson && (
              <div className="td-detail-block">
                <div className="td-detail-label">Lesson / Module</div>
                <div className="td-detail-value">{ticket.lesson}</div>
              </div>
            )}
          </div>

          <div className="td-card td-thread-card">
            <div className="td-card-header">
              <h3 className="td-card-title">Conversation</h3>
            </div>

            {messagesLoading ? (
              <div className="td-thread-loading">Loading conversation...</div>
            ) : messages.length === 0 ? (
              <div className="td-thread-empty">
                No replies yet. Start the conversation below.
              </div>
            ) : (
              <div className="td-thread-list">
                {messages.map((message) => {
                  const senderName = message.sender?.username || "Support";
                  const senderInitial = senderName.charAt(0).toUpperCase();
                  const isCurrentUser = Boolean(
                    user?._id &&
                    message.sender?._id &&
                    String(message.sender._id) === String(user._id),
                  );

                  return (
                    <div
                      key={message._id}
                      className={`td-thread-item ${isCurrentUser ? "td-thread-item-self" : ""}`}
                    >
                      <div className="td-thread-avatar">{senderInitial}</div>
                      <div className="td-thread-bubble">
                        <div className="td-thread-meta">
                          <span className="td-thread-author">{senderName}</span>
                          <div className="td-thread-actions">
                            <span className="td-thread-time">
                              {new Date(message.createdAt).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                            <div className="td-message-menu-wrap">
                              <button
                                type="button"
                                className="td-message-menu-btn"
                                onClick={() =>
                                  setMessageMenuId((currentId) =>
                                    currentId === message._id
                                      ? null
                                      : message._id,
                                  )
                                }
                                aria-label="Message actions"
                              >
                                ⋯
                              </button>
                              {messageMenuId === message._id && (
                                <div className="td-message-menu">
                                  {isCurrentUser && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(message)}
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openDeleteModal(message._id)}
                                    disabled={updatingMessageId === message._id}
                                  >
                                    {updatingMessageId === message._id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {editingMessageId === message._id ? (
                          <div className="td-edit-message">
                            <textarea
                              className="td-edit-input"
                              rows="3"
                              value={editingText}
                              onChange={(event) =>
                                setEditingText(event.target.value)
                              }
                            />
                            <div className="td-edit-actions">
                              <button
                                type="button"
                                className="td-edit-btn td-edit-btn-save"
                                onClick={() => handleSaveEdit(message._id)}
                                disabled={updatingMessageId === message._id}
                              >
                                {updatingMessageId === message._id
                                  ? "Saving..."
                                  : "Save"}
                              </button>
                              <button
                                type="button"
                                className="td-edit-btn"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="td-thread-content">
                            {message.content}
                          </div>
                        )}
                        {message.attachments?.length > 0 && (
                          <div className="td-attachment-list">
                            {message.attachments.map((attachment) => {
                              const isImage =
                                attachment.type === "image" ||
                                attachment.mimeType?.startsWith("image/");
                              const safeName = attachment.name || "Attachment";

                              return isImage ? (
                                <button
                                  key={`${message._id}-${attachment.publicId || attachment.url}`}
                                  type="button"
                                  className="td-attachment-card td-attachment-card-button"
                                  onClick={() =>
                                    setPreviewImage(attachment.url)
                                  }
                                >
                                  <img
                                    src={attachment.url}
                                    alt={safeName}
                                    className="td-attachment-image"
                                  />
                                  <div className="td-attachment-info">
                                    <div className="td-attachment-name">
                                      {safeName}
                                    </div>
                                    <div className="td-attachment-meta">
                                      click to enlarge
                                    </div>
                                  </div>
                                </button>
                              ) : (
                                <a
                                  key={`${message._id}-${attachment.publicId || attachment.url}`}
                                  className="td-attachment-card"
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <div className="td-attachment-placeholder">
                                    <span>
                                      {safeName
                                        .split(".")
                                        .pop()
                                        ?.toUpperCase() || "FILE"}
                                    </span>
                                  </div>
                                  <div className="td-attachment-info">
                                    <div className="td-attachment-name">
                                      {safeName}
                                    </div>
                                    <div className="td-attachment-meta">
                                      click to enlarge
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {canReply ? (
              <form className="td-reply-form" onSubmit={handleSendMessage}>
                <textarea
                  className="td-reply-input"
                  rows="4"
                  placeholder="Write a reply to the student or instructor..."
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                />

                {selectedFiles.length > 0 && (
                  <div className="td-selected-files">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="td-selected-file"
                      >
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="td-reply-actions">
                  <div className="td-reply-controls">
                    <label className="td-attachment-picker">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelection}
                      />
                      <span>Add files</span>
                    </label>
                    <span className="td-reply-hint">
                      Images, PDFs, ZIP files, and code/text files are
                      supported.
                    </span>
                  </div>
                  <button
                    className="td-reply-btn"
                    type="submit"
                    disabled={sendingMessage}
                  >
                    {sendingMessage ? "Sending..." : "Send reply"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="td-reply-disabled">
                {isClosed
                  ? "This ticket is closed. Replies are no longer accepted."
                  : "Only the student or assigned instructor can reply in this thread."}
              </div>
            )}
          </div>
        </div>

        {/* ── sidebar: metadata ── */}
        <aside className="td-sidebar">
          <div className="td-card">
            <div className="td-card-header">
              <h3 className="td-card-title">Status</h3>
            </div>
            <span className={statusClassName}>{ticket.status}</span>
          </div>

          <div className="td-card">
            <div className="td-card-header">
              <h3 className="td-card-title">Workflow Timeline</h3>
            </div>

            <div className="td-workflow-current">
              <span className="td-workflow-label">Current status</span>
              <strong>{ticket.status}</strong>
            </div>

            {canManageWorkflow ? (
              allowedNextStatuses.length > 0 ? (
                <div className="td-workflow-actions">
                  {allowedNextStatuses.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      className="td-workflow-btn"
                      onClick={() => handleStatusChange(nextStatus)}
                      disabled={savingStatus}
                    >
                      {savingStatus ? "Saving..." : `Move to ${nextStatus}`}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="td-workflow-note">
                  No further transitions are available for this ticket.
                </div>
              )
            ) : (
              <div className="td-workflow-note">
                {user?.role === "instructor"
                  ? "Only the assigned instructor can advance this ticket."
                  : "Workflow actions are available for instructors and admins."}
              </div>
            )}

            <div className="td-timeline">
              {statusHistory.length === 0 ? (
                <div className="td-timeline-empty">No history yet.</div>
              ) : (
                statusHistory.map((entry, index) => {
                  const changedByName =
                    entry.changedBy?.username ||
                    entry.changedBy?.name ||
                    "System";
                  const timestamp = entry.createdAt
                    ? new Date(entry.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—";

                  return (
                    <div
                      key={`${entry.status}-${index}`}
                      className="td-timeline-item"
                    >
                      <div className="td-timeline-dot" />
                      <div className="td-timeline-content">
                        <div className="td-timeline-status">{entry.status}</div>
                        <div className="td-timeline-meta">
                          By {changedByName}
                        </div>
                        <div className="td-timeline-meta">{timestamp}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="td-card">
            <div className="td-card-header">
              <h3 className="td-card-title">Priority</h3>
            </div>
            <span className={priorityClassName}>{ticket.priority}</span>
          </div>

          <div className="td-card">
            <div className="td-card-header">
              <h3 className="td-card-title">People</h3>
            </div>

            <div className="td-people-row">
              <div className="td-people-avatar">
                {ticket.student?.username?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="td-people-info">
                <div className="td-people-role">
                  <UserIcon /> Student
                </div>
                <div className="td-people-name">
                  {ticket.student?.username || "—"}
                </div>
              </div>
            </div>

            <div className="td-people-divider" />

            <div className="td-people-row">
              <div className="td-people-avatar td-people-avatar-instructor">
                {ticket.assignedInstructor?.username
                  ?.charAt(0)
                  ?.toUpperCase() || "?"}
              </div>
              <div className="td-people-info">
                <div className="td-people-role">
                  <InstructorIcon /> Instructor
                </div>
                <div className="td-people-name">
                  {ticket.assignedInstructor?.username || "Unassigned"}
                </div>
              </div>
            </div>
          </div>

          <div className="td-card">
            <div className="td-card-header">
              <h3 className="td-card-title">Context</h3>
            </div>

            <div className="td-context-row">
              <span className="td-context-icon">
                <CourseIcon />
              </span>
              <div className="td-context-info">
                <div className="td-context-label">Course</div>
                <div className="td-context-value">{ticket.course || "—"}</div>
              </div>
            </div>

            <div className="td-context-row">
              <span className="td-context-icon">
                <LessonIcon />
              </span>
              <div className="td-context-info">
                <div className="td-context-label">Lesson</div>
                <div className="td-context-value">{ticket.lesson || "—"}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
      {previewImage && (
        <div
          className="td-lightbox-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="td-lightbox-close"
            onClick={() => setPreviewImage(null)}
            aria-label="Close preview"
          >
            ×
          </button>
          <img src={previewImage} alt="Preview" className="td-lightbox-image" />
        </div>
      )}

      {showDeleteModal && (
        <div
          className="td-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="td-modal" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-icon">🗑️</div>
            <h2 className="td-modal-title">Delete message?</h2>
            <p className="td-modal-body">
              This message will be removed from the support thread.
            </p>
            <div className="td-modal-actions">
              <button
                className="td-btn-ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              {isDeletingOwnMessage ? (
                <>
                  <button
                    className="td-btn-danger"
                    onClick={() => handleDeleteMessage(false)}
                    disabled={updatingMessageId}
                  >
                    {updatingMessageId ? "Deleting..." : "Delete for me"}
                  </button>
                  <button
                    className="td-btn-danger"
                    onClick={() => handleDeleteMessage(true)}
                    disabled={updatingMessageId}
                  >
                    {updatingMessageId ? "Deleting..." : "Delete for everyone"}
                  </button>
                </>
              ) : (
                <button
                  className="td-btn-danger"
                  onClick={() => handleDeleteMessage(false)}
                  disabled={updatingMessageId}
                >
                  {updatingMessageId ? "Deleting..." : "Delete for me"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
