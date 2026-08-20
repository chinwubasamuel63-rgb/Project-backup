import api from "./api";

export const getMyConversations = async () => {
  const { data } = await api.get("/messages/conversations/my");
  const payload = data?.data || data || {};

  return {
    ...data,
    conversations: payload.conversations || data?.conversations || [],
  };
};

export const createConversation = async (participantId) => {
  const { data } = await api.post("/messages/conversations", {
    participantId,
  });
  const payload = data?.data || data || {};

  return {
    ...data,
    conversation: payload.conversation || data?.conversation || null,
  };
};

export const getConversationMessages = async (conversationId) => {
  const { data } = await api.get(`/messages/conversation/${conversationId}`);
  const payload = data?.data || data || {};

  return {
    ...data,
    messages: payload.messages || data?.messages || [],
    pagination: payload.pagination || data?.pagination || null,
  };
};

export const sendConversationMessage = async (
  conversationId,
  content,
  files = [],
) => {
  const formData = new FormData();
  formData.append("conversationId", conversationId);
  formData.append("content", content);

  files.forEach((file) => {
    formData.append("attachments", file);
  });

  const { data } = await api.post("/messages/send", formData);

  const payload = data?.data || data || {};

  return {
    ...data,
    message: payload.message || data?.message || null,
  };
};

export const editConversationMessage = async (messageId, content) => {
  const { data } = await api.patch(`/messages/message/${messageId}/edit`, {
    content,
  });

  const payload = data?.data || data || {};

  return {
    ...data,
    message: payload.message || data?.message || null,
  };
};

export const deleteConversationMessage = async (
  messageId,
  deleteForEveryone = false,
) => {
  const { data } = await api.delete(`/messages/message/${messageId}`, {
    data: {
      deleteForEveryone,
    },
  });

  const payload = data?.data || data || {};

  return {
    ...data,
    message: payload.message || data?.message || null,
  };
};

export const deleteConversation = async (conversationId) => {
  const { data } = await api.patch(
    `/messages/conversation/${conversationId}/delete`,
  );

  return data;
};

export const markConversationAsRead = async (conversationId) => {
  const { data } = await api.patch(`/messages/read/${conversationId}`);
  const payload = data?.data || data || {};

  return {
    ...data,
    message: payload.message || data?.message || null,
  };
};
