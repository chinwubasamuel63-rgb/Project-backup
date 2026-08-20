function ConversationInfo({
  conversation,
  onClose,
  onDeleteConversation,
  deleting = false,
}) {
  if (!conversation) {
    return <aside className="msg-info-pane" />;
  }

  const isProject = conversation.type === "project";

  return (
    <aside className="msg-info-pane">
      <div className="msg-info-card">
        <div className="msg-info-header">
          <button
            type="button"
            className="msg-info-close"
            aria-label="Close chat info"
            onClick={onClose}
          >
            ×
          </button>

          <div className="msg-info-avatar">
            {conversation.avatarUrl ? (
              <img
                src={conversation.avatarUrl}
                alt={conversation.name}
                className="msg-avatar-image"
              />
            ) : (
              <div className="msg-avatar-fallback large">
                {conversation.avatarLabel}
              </div>
            )}
          </div>

          <div className="msg-info-titles">
            <h3>{conversation.name}</h3>
            <p>{isProject ? "Project workspace" : "Direct conversation"}</p>
          </div>
        </div>

        <div className="msg-info-stack">
          {isProject ? (
            <>
              <div>
                <h4>Project</h4>
                <p>{conversation.name}</p>
              </div>
              <div>
                <h4>Members</h4>
                <p>
                  {conversation.otherParticipants?.length || 0} collaborators
                </p>
              </div>
              <div>
                <h4>Recent files</h4>
                <p>Shared from this workspace</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4>Role</h4>
                <p>Developer</p>
              </div>
              <div>
                <h4>Skills</h4>
                <p>React, Node.js, Product Design</p>
              </div>
              <div>
                <h4>Shared files</h4>
                <p>Attachments appear here</p>
              </div>
            </>
          )}
        </div>

        <div className="msg-info-actions">
          <button type="button" className="msg-info-button" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="msg-delete-conversation"
            onClick={onDeleteConversation}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete chat"}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default ConversationInfo;
