import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Phone, Search, Video } from "lucide-react";

function MessageHeader({
  conversation,
  socket,
  isMobile = false,
  onBackToConversations,
  onViewConversationInfo,
  onDeleteChat,
  onNotify,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isConnected = Boolean(socket?.connected);
  const statusLabel = isConnected ? "Online" : "Offline";

  const handleToggleMenu = () => {
    setMenuOpen((current) => !current);
  };

  const handleViewInfo = () => {
    setMenuOpen(false);
    if (typeof onViewConversationInfo === "function") {
      onViewConversationInfo();
    }
  };

  const handleDeleteChat = () => {
    setMenuOpen(false);
    if (typeof onDeleteChat === "function") {
      onDeleteChat();
    }
  };

  const handleUnavailableAction = (label) => {
    setMenuOpen(false);
    onNotify?.(`${label} is not available in this demo.`);
  };

  return (
    <header className="msg-header">
      <div className="msg-header-user-wrap">
        {isMobile ? (
          <button
            type="button"
            className="msg-mobile-chat-btn"
            onClick={onBackToConversations}
            aria-label="Back to conversation list"
          >
            <ArrowLeft size={16} />
          </button>
        ) : null}

        <div className="msg-header-user">
          <div className="msg-avatar-wrap large">
            {conversation.avatarUrl ? (
              <img
                src={conversation.avatarUrl}
                alt={conversation.name}
                className="msg-avatar-image"
              />
            ) : (
              <div className="msg-avatar-fallback">
                {conversation.avatarLabel}
              </div>
            )}
            <span
              className={`msg-online-dot large ${isConnected ? "online" : "offline"}`}
            />
          </div>
          <div>
            <h3>{conversation.name}</h3>
            <p>
              {conversation.type === "project"
                ? "Project workspace"
                : "Active now"}{" "}
              · {statusLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="msg-header-actions">
        {isMobile ? null : (
          <>
            <button
              type="button"
              className="msg-icon-btn"
              aria-label="Search conversation"
              onClick={() =>
                onNotify?.("Conversation search is not available in this demo.")
              }
            >
              <Search size={16} />
            </button>
            <button
              type="button"
              className="msg-icon-btn"
              aria-label="Voice call"
              onClick={() =>
                onNotify?.("Voice calls are not available in this demo.")
              }
            >
              <Phone size={16} />
            </button>
            <button
              type="button"
              className="msg-icon-btn"
              aria-label="Video call"
              onClick={() =>
                onNotify?.("Video calls are not available in this demo.")
              }
            >
              <Video size={16} />
            </button>
          </>
        )}
        <div className="msg-dropdown-container">
          <button
            type="button"
            className="msg-icon-btn"
            aria-label="More options"
            onClick={handleToggleMenu}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen ? (
            <div className="msg-dropdown">
              {isMobile ? (
                <>
                  <button
                    type="button"
                    className="msg-dropdown-item"
                    onClick={() => {
                      handleUnavailableAction("Voice calls");
                    }}
                  >
                    <Phone size={14} />
                    Voice call
                  </button>
                  <button
                    type="button"
                    className="msg-dropdown-item"
                    onClick={() => {
                      handleUnavailableAction("Video calls");
                    }}
                  >
                    <Video size={14} />
                    Video call
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="msg-dropdown-item"
                onClick={handleViewInfo}
              >
                View chat info
              </button>
              <button
                type="button"
                className="msg-dropdown-item"
                onClick={handleDeleteChat}
              >
                Delete chat
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default MessageHeader;
