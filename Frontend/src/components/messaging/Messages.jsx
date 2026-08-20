import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  deleteConversation,
  deleteConversationMessage,
  editConversationMessage,
  getConversationMessages,
  getMyConversations,
  markConversationAsRead,
  sendConversationMessage,
} from "../../services/messageService";
import ConversationInfo from "../../pages/messages/UI/ConversationInfo";
import ConversationSidebar from "../../pages/messages/UI/ConversationSidebar";
import EmptyConversation from "../../pages/messages/UI/EmptyConversation";
import MessageComposer from "../../pages/messages/UI/MessageComposer";
import MessageHeader from "../../pages/messages/UI/MessageHeader";
import MessageList from "../../pages/messages/UI/MessageList";
import "./message.css";

function formatTimestamp(value) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) return "";

  const isSameDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDate(date, now)) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDate(date, yesterday)) {
    return "Yesterday";
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.floor((now - date) / msPerDay);

  if (dayDiff <= 7) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
    });
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function resolveAvatarUrl(avatar) {
  if (!avatar) return null;
  if (typeof avatar === "string" && avatar.trim()) return avatar;
  if (typeof avatar === "object") {
    return (
      avatar.url || avatar.secure_url || avatar.path || avatar.avatar || null
    );
  }
  return null;
}

function getConversationLabel(conversation, currentUserId) {
  const participants = Array.isArray(conversation?.participants)
    ? conversation.participants
    : [];
  const others = participants.filter(
    (participant) =>
      String(participant?._id || participant?.id || participant) !==
      String(currentUserId),
  );

  if (conversation?.name?.trim()) {
    return conversation.name;
  }

  if (others.length > 0) {
    return others
      .map((participant) => participant?.username || "Conversation")
      .join(", ");
  }

  return "Conversation";
}

function buildConversationPreview(conversation) {
  if (conversation?.lastMessage?.content?.trim()) {
    return conversation.lastMessage.content;
  }

  if (conversation?.lastMessage?.attachments?.length) {
    return "Shared attachment";
  }

  return "Start the conversation";
}

function normalizeConversation(conversation, currentUserId) {
  const participants = Array.isArray(conversation?.participants)
    ? conversation.participants
    : [];
  const others = participants.filter(
    (participant) =>
      String(participant?._id || participant?.id || participant) !==
      String(currentUserId),
  );

  const conversationType = String(
    conversation?.conversationType || conversation?.type || "",
  ).toLowerCase();

  let normalizedType = "direct";

  if (conversationType === "support") {
    normalizedType = "support";
  } else if (conversationType === "project") {
    normalizedType = "project";
  } else if (
    conversationType === "group" ||
    conversation?.isGroup ||
    conversation?.conversationType === "group"
  ) {
    normalizedType = "group";
  } else if (conversationType === "organization") {
    normalizedType = "organization";
  } else if (conversationType === "marketplace") {
    normalizedType = "marketplace";
  } else if (conversationType === "hiring") {
    normalizedType = "hiring";
  }

  const displayName = getConversationLabel(conversation, currentUserId);
  const avatarLabel =
    displayName
      .split(" ")
      .slice(0, 1)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "C";
  const avatarUrl = resolveAvatarUrl(
    others[0]?.avatar || others[0]?.avatarUrl || conversation.avatar,
  );

  return {
    ...conversation,
    _id: String(conversation?._id || conversation?.id || ""),
    type: normalizedType,
    name: displayName,
    participants,
    otherParticipants: others,
    preview: buildConversationPreview(conversation),
    avatarLabel,
    avatarUrl,
    timestamp: formatTimestamp(
      conversation?.lastMessage?.createdAt || conversation?.updatedAt,
    ),
    unreadCount: conversation?.unreadCount || 0,
    isMuted: false,
    isPinned: false,
  };
}

export default function Messages({ notify = () => {} }) {
  const { user, socket } = useAuth();
  const showNotify = useMemo(
    () => (typeof notify === "function" ? notify : () => {}),
    [notify],
  );

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [initialConversation, setInitialConversation] = useState(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [messageText, setMessageText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [updatingMessageId, setUpdatingMessageId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [mobileView, setMobileView] = useState("conversations");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateLayout = () => setIsMobile(window.innerWidth <= 720);
    updateLayout();
    window.addEventListener("resize", updateLayout);

    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    if (selectedConversationId) {
      const timerId = window.setTimeout(() => setMobileView("chat"), 0);
      return () => window.clearTimeout(timerId);
    } else {
      const timerId = window.setTimeout(
        () => setMobileView("conversations"),
        0,
      );
      return () => window.clearTimeout(timerId);
    }
  }, [isMobile, selectedConversationId]);

  const handleCloseConversationInfo = () => setShowConversationInfo(false);

  const loadConversations = useCallback(async () => {
    try {
      setConversationsLoading(true);
      const response = await getMyConversations();
      let nextConversations = (response?.conversations || [])
        .map((conversation) => normalizeConversation(conversation, user?._id))
        .filter(
          (conversation) =>
            [
              "direct",
              "project",
              "group",
              "organization",
              "marketplace",
              "hiring",
            ].includes(conversation.type) && conversation.type !== "support",
        );

      if (
        initialConversation &&
        !nextConversations.some(
          (conversation) => conversation._id === initialConversation._id,
        )
      ) {
        nextConversations = [initialConversation, ...nextConversations];
      }

      setConversations(nextConversations);

      if (!selectedConversationId && nextConversations.length > 0) {
        setSelectedConversationId(nextConversations[0]._id);
      }
    } catch (error) {
      console.error(error);
      showNotify("Could not load conversations.");
    } finally {
      setConversationsLoading(false);
    }
  }, [initialConversation, selectedConversationId, showNotify, user?._id]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadConversations();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadConversations]);

  useEffect(() => {
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const timerId = window.setTimeout(
        () => setSelectedConversationId(String(conversationId)),
        0,
      );
      return () => window.clearTimeout(timerId);
    }
    return undefined;
  }, [searchParams]);

  useEffect(() => {
    if (
      location.state?.createdConversation &&
      user?._id &&
      !initialConversation
    ) {
      const normalized = normalizeConversation(
        location.state.createdConversation,
        user._id,
      );
      const timerId = window.setTimeout(() => {
        setInitialConversation(normalized);
        if (!selectedConversationId) {
          setSelectedConversationId(normalized._id);
        }
      }, 0);
      return () => window.clearTimeout(timerId);
    }
    return undefined;
  }, [location.state, user?._id, initialConversation, selectedConversationId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        setMessagesLoading(true);
        const response = await getConversationMessages(selectedConversationId);
        setMessages(response?.messages || []);
        await markConversationAsRead(selectedConversationId);
      } catch (error) {
        console.error(error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    void loadMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (incomingMessage) => {
      const conversationId = String(
        incomingMessage?.conversation?._id ||
          incomingMessage?.conversation ||
          "",
      );

      if (!conversationId) return;

      if (conversationId === String(selectedConversationId)) {
        setMessages((currentMessages) => {
          if (
            currentMessages.some(
              (message) => message._id === incomingMessage._id,
            )
          ) {
            return currentMessages;
          }

          return [...currentMessages, incomingMessage];
        });
        void markConversationAsRead(conversationId);
      }

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation._id === conversationId
            ? {
                ...conversation,
                preview:
                  incomingMessage.content ||
                  (incomingMessage.attachments?.length
                    ? "Shared attachment"
                    : conversation.preview),
                timestamp: formatTimestamp(incomingMessage.createdAt),
                unreadCount:
                  conversationId === String(selectedConversationId)
                    ? 0
                    : (conversation.unreadCount || 0) + 1,
              }
            : conversation,
        ),
      );
    };

    socket.on("newMessage", handleIncomingMessage);

    return () => socket.off("newMessage", handleIncomingMessage);
  }, [socket, selectedConversationId]);

  const selectedConversation = conversations.find(
    (conversation) =>
      String(conversation._id) === String(selectedConversationId),
  );

  const filteredConversations = conversations.filter((conversation) => {
    const searchValue = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      conversation.name?.toLowerCase().includes(searchValue) ||
      conversation.preview?.toLowerCase().includes(searchValue);

    if (activeFilter === "Unread") {
      return matchesSearch && conversation.unreadCount > 0;
    }

    if (activeFilter === "Direct") {
      return matchesSearch && conversation.type === "direct";
    }

    if (activeFilter === "Projects") {
      return matchesSearch && conversation.type === "project";
    }

    if (activeFilter === "Groups") {
      return matchesSearch && conversation.type === "group";
    }

    if (activeFilter === "Organization") {
      return matchesSearch && conversation.type === "organization";
    }

    if (activeFilter === "Marketplace") {
      return matchesSearch && conversation.type === "marketplace";
    }

    if (activeFilter === "Hiring") {
      return matchesSearch && conversation.type === "hiring";
    }

    if (activeFilter === "Archived") {
      return matchesSearch && conversation.isMuted;
    }

    return matchesSearch;
  });

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (
      !selectedConversationId ||
      (!messageText.trim() && selectedFiles.length === 0) ||
      sendingMessage
    ) {
      return;
    }

    try {
      setSendingMessage(true);
      const response = await sendConversationMessage(
        selectedConversationId,
        messageText.trim(),
        selectedFiles,
      );
      const nextMessage = response?.message || response?.data?.message || null;

      if (nextMessage) {
        setMessages((currentMessages) => [...currentMessages, nextMessage]);
        setConversations((currentConversations) =>
          currentConversations.map((conversation) =>
            conversation._id === selectedConversationId
              ? {
                  ...conversation,
                  preview: nextMessage.content || "Shared attachment",
                  timestamp: formatTimestamp(nextMessage.createdAt),
                  unreadCount: 0,
                }
              : conversation,
          ),
        );
      }

      setMessageText("");
      setReplyTo(null);
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

  const handleDeleteForMe = async (message) => {
    if (!message || updatingMessageId) return;

    try {
      setUpdatingMessageId(message._id);
      await deleteConversationMessage(message._id, false);
      setMessages((currentMessages) =>
        currentMessages.filter((item) => item._id !== message._id),
      );
      showNotify("Message deleted for you");
    } catch (error) {
      showNotify(
        error.response?.data?.message || "Could not delete the message.",
      );
    } finally {
      setUpdatingMessageId(null);
    }
  };

  const handleDeleteForEveryone = async (message) => {
    if (!message || updatingMessageId) return;

    try {
      setUpdatingMessageId(message._id);
      await deleteConversationMessage(message._id, true);
      setMessages((currentMessages) =>
        currentMessages.filter((item) => item._id !== message._id),
      );
      showNotify("Message deleted for everyone");
    } catch (error) {
      showNotify(
        error.response?.data?.message || "Could not delete the message.",
      );
    } finally {
      setUpdatingMessageId(null);
    }
  };

  const handleDeleteMessage = async (deleteForEveryone = false) => {
    if (!messageToDelete || updatingMessageId) return;

    try {
      setUpdatingMessageId(messageToDelete._id);
      await deleteConversationMessage(messageToDelete._id, deleteForEveryone);
      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) => message._id !== messageToDelete._id,
        ),
      );
      setDeleteModalOpen(false);
      setMessageToDelete(null);
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

  const handleCopyMessage = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      showNotify("Message copied");
    } catch (error) {
      console.error(error);
      showNotify("Copy failed");
    }
  };

  const handleDeleteConversation = async () => {
    if (
      !selectedConversationId ||
      !selectedConversation ||
      deletingConversation
    ) {
      return;
    }

    try {
      setDeletingConversation(true);
      const response = await deleteConversation(selectedConversationId);

      setConversations((currentConversations) =>
        currentConversations.filter(
          (conversation) => conversation._id !== selectedConversationId,
        ),
      );

      if (selectedConversationId) {
        const nextConversation = conversations.find(
          (conversation) => conversation._id !== selectedConversationId,
        );

        setSelectedConversationId(nextConversation?._id || null);
      }

      setMessages([]);
      setShowConversationInfo(false);
      showNotify(response?.message || "Conversation deleted for you.");
    } catch (error) {
      showNotify(
        error.response?.data?.message || "Could not delete this conversation.",
      );
    } finally {
      setDeletingConversation(false);
    }
  };

  const handleQuickAction = (action) => {
    if (action === "code") {
      setMessageText((currentValue) => `${currentValue}\n\`\`\`\n\n\`\`\``);
      showNotify("Code block ready");
      return;
    }

    if (action === "record") {
      showNotify("Voice recording is not available in this demo.");
      return;
    }

    showNotify("That composer action is not available in this demo.");
  };

  const handleReply = (message) => {
    const quotedText = message.content?.trim() || "Shared attachment";
    setReplyTo(message);
    setMessageText(`> ${quotedText}\n\n`);
  };

  return (
    <div className="msg-page">
      <div
        className={`msg-shell ${showConversationInfo ? "" : "hide-info"} ${isMobile ? `mobile-${showConversationInfo ? "info" : mobileView}` : ""}`}
      >
        <ConversationSidebar
          conversations={filteredConversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={(conversationId) => {
            setSelectedConversationId(conversationId);
            if (isMobile) {
              setMobileView("chat");
            }
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          loading={conversationsLoading}
          onCreateConversation={() =>
            showNotify("Private chat creation is not available in this demo.")
          }
          onCreateGroup={() =>
            showNotify("Group creation is not available in this demo.")
          }
        />

        <section className="msg-main">
          {selectedConversation ? (
            <>
              <MessageHeader
                conversation={selectedConversation}
                socket={socket}
                isMobile={isMobile}
                onBackToConversations={() => setMobileView("conversations")}
                onViewConversationInfo={() => setShowConversationInfo(true)}
                onDeleteChat={handleDeleteConversation}
                onNotify={showNotify}
              />
              <MessageList
                messages={messages}
                currentUserId={user?._id}
                loading={messagesLoading}
                onStartEdit={handleStartEdit}
                onDeleteForMe={handleDeleteForMe}
                onDeleteForEveryone={handleDeleteForEveryone}
                onCopy={handleCopyMessage}
                onReply={handleReply}
                editingMessageId={editingMessageId}
                editingText={editingText}
                onEditingTextChange={setEditingText}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                updatingMessageId={updatingMessageId}
              />
              <MessageComposer
                value={messageText}
                onChange={setMessageText}
                onSend={handleSendMessage}
                sending={sendingMessage}
                selectedFiles={selectedFiles}
                onFileSelection={handleFileSelection}
                onRemoveFile={removeSelectedFile}
                onQuickAction={handleQuickAction}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            </>
          ) : (
            <EmptyConversation />
          )}
        </section>

        {showConversationInfo ? (
          <ConversationInfo
            conversation={selectedConversation}
            onClose={handleCloseConversationInfo}
            onDeleteConversation={handleDeleteConversation}
            deleting={deletingConversation}
          />
        ) : null}
      </div>

      {deleteModalOpen && messageToDelete ? (
        <div
          className="msg-modal-overlay"
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            className="msg-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Delete message?</h3>
            <p>This will remove the selected message from the conversation.</p>
            <div className="msg-modal-actions">
              <button
                className="msg-btn msg-btn-ghost"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="msg-btn msg-btn-danger"
                onClick={() => handleDeleteMessage(false)}
                disabled={updatingMessageId}
              >
                {updatingMessageId ? "Deleting..." : "Delete for me"}
              </button>
              <button
                className="msg-btn msg-btn-danger"
                onClick={() => handleDeleteMessage(true)}
                disabled={updatingMessageId}
              >
                {updatingMessageId ? "Deleting..." : "Delete for everyone"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
