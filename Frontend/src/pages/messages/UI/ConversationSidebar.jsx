import { Search, MessageSquarePlus, Users2, ChevronDown } from "lucide-react";
import { useState } from "react";

const FILTERS = [
  "All",
  "Unread",
  "Direct",
  "Projects",
  "Groups",
  "Organization",
  "Marketplace",
  "Hiring",
  "Archived",
];

const MAIN_FILTERS = ["All", "Unread", "Direct"];
const EXTRA_FILTERS = FILTERS.filter(
  (filter) => !MAIN_FILTERS.includes(filter),
);

function ConversationSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  loading,
  onCreateConversation,
  onCreateGroup,
}) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleMoreToggle = () => {
    setShowMoreFilters((current) => !current);
  };

  const handleExtraFilterClick = (filter) => {
    onFilterChange(filter);
    setShowMoreFilters(false);
  };

  return (
    <aside className="msg-sidebar">
      <div className="msg-sidebar-header">
        <div>
          <h2>Messages</h2>
        </div>
        <div className="msg-sidebar-actions">
          <button
            className="msg-icon-btn"
            type="button"
            onClick={onCreateConversation}
            aria-label="New chat"
          >
            <MessageSquarePlus size={16} />
          </button>
          <button
            className="msg-icon-btn"
            type="button"
            onClick={onCreateGroup}
            aria-label="New group"
          >
            <Users2 size={16} />
          </button>
        </div>
      </div>

      <label className="msg-search">
        <Search size={16} />
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search conversations..."
        />
      </label>

      <div className="msg-filter-list">
        {MAIN_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`msg-filter-pill ${activeFilter === filter ? "active" : ""}`}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}

        <div className="msg-filter-more">
          <button
            type="button"
            className={`msg-filter-pill msg-filter-more-btn ${showMoreFilters ? "open" : ""} ${EXTRA_FILTERS.includes(activeFilter) ? "active" : ""}`}
            onClick={handleMoreToggle}
            aria-expanded={showMoreFilters}
          >
            More
            <ChevronDown size={14} />
          </button>
          {showMoreFilters ? (
            <div className="msg-filter-more-menu">
              {EXTRA_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`msg-filter-pill msg-filter-extra ${activeFilter === filter ? "active" : ""}`}
                  onClick={() => handleExtraFilterClick(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="msg-conversation-list">
        {loading ? (
          <div className="msg-empty-state compact">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="msg-empty-state compact">No conversations yet.</div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation._id}
              type="button"
              className={`msg-conversation-card ${selectedConversationId === conversation._id ? "selected" : ""}`}
              onClick={() => onSelectConversation(conversation._id)}
            >
              <div className="msg-avatar-wrap">
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
                <span className="msg-online-dot" />
              </div>

              <div className="msg-conversation-body">
                <div className="msg-conversation-topline">
                  <span className="msg-conversation-name">
                    {conversation.name}
                  </span>
                  <span className="msg-conversation-time">
                    {conversation.timestamp}
                  </span>
                </div>
                <div className="msg-conversation-preview-row">
                  <span className="msg-conversation-preview">
                    {conversation.preview}
                  </span>
                  {conversation.unreadCount > 0 ? (
                    <span className="msg-unread-badge">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export default ConversationSidebar;
