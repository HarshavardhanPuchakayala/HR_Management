import { useState } from "react";
import { sendAssistantMessage } from "../api/assistant.js";

const Assistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed) {
      return;
    }

    setError("");

    const userMessage = { role: "user", text: trimmed };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");

    try {
      setSending(true);

      const data = await sendAssistantMessage(
        trimmed,
        conversationId
      );

      setConversationId(data.conversationId);

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.message },
      ]);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to reach the assistant."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1>Assistant</h1>

      <section>
        {messages.length === 0 ? (
          <p>Ask about leave requests or check in/out.</p>
        ) : (
          <div>
            {messages.map((message, index) => (
              <article key={index}>
                <strong>
                  {message.role === "user" ? "You" : "Assistant"}:
                </strong>
                <p>{message.text}</p>
              </article>
            ))}
          </div>
        )}

        {sending && <p>Assistant is thinking...</p>}
        {error && <p>{error}</p>}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={handleChange}
          placeholder="Type a message..."
          disabled={sending}
        />

        <button type="submit" disabled={sending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Assistant;