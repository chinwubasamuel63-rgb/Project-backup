function EmptyConversation() {
  return (
    <div className="msg-empty-state msg-empty-hero">
      <div className="msg-empty-illustration" />
      <div className="msg-empty-copy">
        <h3>Start a new conversation</h3>
        <p>
          Pick a chat from the sidebar or create a new direct message or project
          room to keep work moving.
        </p>
      </div>
    </div>
  );
}

export default EmptyConversation;
