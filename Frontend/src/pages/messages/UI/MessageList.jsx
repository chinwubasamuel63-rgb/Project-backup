import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageDay(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDate(date, today)) {
    return "Today";
  }

  if (isSameDate(date, yesterday)) {
    return "Yesterday";
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.floor((today - date) / msPerDay);

  if (dayDiff <= 7) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
    });
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function MessageBubble({
  message,
  currentUserId,
  onStartEdit,
  onCopy,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const isOwnMessage =
    String(message.sender?._id || message.sender) === String(currentUserId);
  const senderName = message.sender?.username || "Support";
  const senderInitial = senderName.charAt(0).toUpperCase();
  const hasAttachments =
    Array.isArray(message.attachments) && message.attachments.length > 0;
  const isCodeBlock = message.content?.includes("```") || false;
  const codeContent = isCodeBlock
    ? message.content.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")
    : "";

  useEffect(() => {
    if (!previewImage) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setPreviewImage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage]);

  return (
    <div className={`msg-message-row ${isOwnMessage ? "mine" : "theirs"}`}>
      {!isOwnMessage ? (
        <div className="msg-avatar-fallback small">{senderInitial}</div>
      ) : null}

      <div className={`msg-message-bubble ${isCodeBlock ? "code-block" : ""}`}>
        <div className="msg-message-meta">
          <span>{isOwnMessage ? "You" : senderName}</span>
          <span>{formatMessageTime(message.createdAt)}</span>
        </div>

        {message.isDeletedForEveryone ? (
          <div className="msg-system-pill">Message deleted</div>
        ) : (
          <>
            {message.content ? (
              isCodeBlock ? (
                <pre className="msg-message-code">
                  <code>{codeContent}</code>
                </pre>
              ) : (
                <p>{message.content}</p>
              )
            ) : null}
            {hasAttachments ? (
              <div className="msg-attachments">
                {message.attachments.map((attachment) => {
                  const isImage =
                    attachment.type === "image" ||
                    attachment.mimeType?.startsWith("image/");

                  const attachmentContent = (
                    <>
                      {isImage ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name || "Shared image"}
                          className="msg-attachment-image"
                        />
                      ) : null}
                      <span>{attachment.name || "Attachment"}</span>
                    </>
                  );

                  return isImage ? (
                    <button
                      key={attachment.publicId || attachment.url}
                      type="button"
                      className="msg-attachment-card msg-attachment-image-card"
                      onClick={() => setPreviewImage(attachment)}
                    >
                      {attachmentContent}
                    </button>
                  ) : (
                    <a
                      key={attachment.publicId || attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="msg-attachment-card"
                    >
                      {attachmentContent}
                    </a>
                  );
                })}
              </div>
            ) : null}
            <div className="msg-message-status-row">
              {message.edited ? (
                <span className="msg-edited-badge">Edited</span>
              ) : null}
              {message.reactions?.length ? (
                <span className="msg-reactions">
                  {message.reactions.join(" ")}
                </span>
              ) : null}
            </div>
          </>
        )}

        <div className="msg-message-actions">
          <div className="msg-dropdown-container">
            <button
              type="button"
              className="msg-icon-btn subtle"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="Message actions"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen ? (
              <div className="msg-dropdown msg-dropdown-right">
                <button
                  type="button"
                  className="msg-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onReply(message);
                  }}
                >
                  Reply
                </button>
                <button
                  type="button"
                  className="msg-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onCopy(message.content);
                  }}
                >
                  Copy
                </button>
                {isOwnMessage ? (
                  <>
                    <button
                      type="button"
                      className="msg-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onStartEdit(message);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="msg-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteForMe(message);
                      }}
                    >
                      Delete for me
                    </button>
                    <button
                      type="button"
                      className="msg-dropdown-item"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteForEveryone(message);
                      }}
                    >
                      Delete for everyone
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="msg-dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteForMe(message);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {previewImage
        ? createPortal(
            <div
              className="msg-lightbox-overlay"
              role="presentation"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="msg-lightbox"
                role="dialog"
                aria-modal="true"
                aria-label="Image preview"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="msg-lightbox-close"
                  onClick={() => setPreviewImage(null)}
                  aria-label="Close image preview"
                >
                  ×
                </button>
                <img
                  src={previewImage.url}
                  alt={previewImage.name || "Shared image"}
                  className="msg-lightbox-image"
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MessageList({
  messages,
  currentUserId,
  loading,
  onStartEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onCopy,
  onReply,
  editingMessageId,
  editingText,
  onEditingTextChange,
  onCancelEdit,
  onSaveEdit,
  updatingMessageId,
}) {
  // hover hint removed — no local hovered state needed
  const messagesWithSeparators = useMemo(() => {
    return messages.reduce((acc, message, index) => {
      const previous = messages[index - 1];
      const currentDay = formatMessageDay(message.createdAt);
      const previousDay = previous
        ? formatMessageDay(previous.createdAt)
        : null;

      if (currentDay !== previousDay) {
        acc.push({
          type: "separator",
          label: currentDay,
          id: `sep-${message._id}`,
        });
      }

      acc.push({ type: "message", message });
      return acc;
    }, []);
  }, [messages]);

  if (loading) {
    return <div className="msg-thread-loading">Loading messages...</div>;
  }

  if (!messages.length) {
    return (
      <div className="msg-thread-empty">
        No messages yet. Start the conversation with a thoughtful update.
      </div>
    );
  }

  return (
    <div className="msg-thread">
      {messagesWithSeparators.map((item) =>
        item.type === "separator" ? (
          <div key={item.id} className="msg-date-separator">
            {item.label}
          </div>
        ) : (
          <div key={item.message._id} className="msg-message-group">
            <div className="msg-message-wrapper">
              {editingMessageId === item.message._id ? (
                <div className="msg-edit-card">
                  <textarea
                    value={editingText}
                    onChange={(event) =>
                      onEditingTextChange(event.target.value)
                    }
                    rows={3}
                  />
                  <div className="msg-edit-actions">
                    <button
                      type="button"
                      className="msg-btn msg-btn-primary"
                      onClick={() => onSaveEdit(item.message._id)}
                    >
                      {updatingMessageId === item.message._id
                        ? "Saving..."
                        : "Save"}
                    </button>
                    <button
                      type="button"
                      className="msg-btn msg-btn-ghost"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <MessageBubble
                  message={item.message}
                  currentUserId={currentUserId}
                  onStartEdit={onStartEdit}
                  onDeleteForMe={onDeleteForMe}
                  onDeleteForEveryone={onDeleteForEveryone}
                  onCopy={onCopy}
                  onReply={onReply}
                />
              )}
              {/* hover hint removed */}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export default MessageList;
