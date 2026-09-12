import api from "./axios.js";

export const sendAssistantMessage = async (message, conversationId) => {
  const response = await api.post("/assistant/chat", {
    message,
    ...(conversationId ? { conversationId } : {}),
  });

  return response.data;
};