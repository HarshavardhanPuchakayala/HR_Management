import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LuSparkles, LuSend, LuUser } from "react-icons/lu";
import { sendAssistantMessage } from "../api/assistant.js";

const Assistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    gsap.from(headerRef.current, {
      opacity: 0,
      y: 10,
      duration: 0.4,
      ease: "power2.out",
    });
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const handleChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed) return;

    setError("");

    const userMessage = { role: "user", text: trimmed };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");

    try {
      setSending(true);

      const data = await sendAssistantMessage(trimmed, conversationId);

      setConversationId(data.conversationId);

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.message },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to reach the assistant."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[820px] flex-col">
      <div ref={headerRef} className="flex items-center gap-3 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink">
          <LuSparkles className="text-white" size={18} />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Assistant</h1>
          <p className="text-sm text-slate">
            Ask about leave requests, or check yourself in or out.
          </p>
        </div>
      </div>

      {/* Solid message surface — no transparency */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl2 border border-line bg-surface shadow-soft">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas">
                <LuSparkles className="text-coral" size={20} />
              </div>
              <p className="mt-3 max-w-xs text-sm text-slate">
                Try "Show my pending leave requests" or "Check me in for
                today."
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={index}
                    className={`flex items-end gap-2.5 ${
                      isUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isUser ? "bg-ink" : "bg-coral"
                      }`}
                    >
                      {isUser ? (
                        <LuUser className="text-white" size={13} />
                      ) : (
                        <LuSparkles className="text-white" size={13} />
                      )}
                    </div>

                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "rounded-br-sm bg-ink text-white"
                          : "rounded-bl-sm bg-canvas text-ink"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-end gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral">
                    <LuSparkles className="text-white" size={13} />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-canvas px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate/50 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate/50 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate/50" />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-coral/10 px-3.5 py-2.5 text-sm text-coralDark">
              {error}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-t border-line p-4"
        >
          <input
            type="text"
            value={input}
            onChange={handleChange}
            placeholder="Type a message..."
            disabled={sending}
            className="field-input flex-1"
          />

          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral text-white
              transition-colors duration-150 hover:bg-coralDark disabled:opacity-40"
          >
            <LuSend size={17} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;