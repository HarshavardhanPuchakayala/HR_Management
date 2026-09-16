import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  LuSparkles,
  LuSend,
  LuUser,
  LuX,
} from "react-icons/lu";

import { sendAssistantMessage } from "../api/assistant.js";
import { prefersReducedMotion } from "../lib/Motion.js";

/**
 * Floating assistant.
 *
 * Mounted once in Layout so it is reachable from every page,
 * rather than being a destination in the sidebar.
 */
export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const panelRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Animate the assistant panel when it opens.
   */
  useEffect(() => {
    const panel = panelRef.current;

    if (!panel || !open) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(panel, {
        opacity: 1,
        y: 0,
        scale: 1,
      });
    } else {
      gsap.fromTo(
        panel,
        {
          opacity: 0,
          y: 16,
          scale: 0.96,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          ease: "power3.out",
          transformOrigin: "bottom right",
        }
      );
    }

    inputRef.current?.focus();

    /**
     * Clean up any running GSAP animation when the component
     * or effect is cleaned up.
     */
    return () => {
      gsap.killTweensOf(panel);
    };
  }, [open]);

  /**
   * Escape closes the assistant panel.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /**
   * Automatically scroll to the newest message.
   */
  useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [messages, sending, open]);

  /**
   * Send a message to the assistant API.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmed = input.trim();

    if (!trimmed || sending) {
      return;
    }

    setError("");

    // Add the user's message immediately.
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: trimmed,
      },
    ]);

    setInput("");
    setSending(true);

    try {
      const data = await sendAssistantMessage(
        trimmed,
        conversationId
      );

      setConversationId(data.conversationId);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: data.message,
        },
      ]);
    } catch (err) {
      console.error("Assistant error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Couldn't reach the assistant."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* =====================================================
          Assistant Panel
          ===================================================== */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Assistant"
          className="
            fixed bottom-24 right-6 z-40
            flex h-[32rem]
            max-h-[calc(100vh-8rem)]
            w-[22rem]
            max-w-[calc(100vw-3rem)]
            flex-col
            overflow-hidden
            rounded-xl2
            border border-line
            bg-surface
            shadow-card
          "
        >
          {/* Header */}
          <div
            className="
              flex items-center justify-between
              bg-ink
              px-4 py-3
            "
          >
            <div className="flex items-center gap-2.5">
              <div
                className="
                  flex h-7 w-7
                  items-center justify-center
                  rounded-lg
                  bg-coral
                "
              >
                <LuSparkles
                  className="text-white"
                  size={14}
                  aria-hidden="true"
                />
              </div>

              <div>
                <p
                  className="
                    font-display
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Assistant
                </p>

                <p className="text-[11px] text-white/40">
                  Leave, attendance, and more
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="
                flex h-7 w-7
                items-center justify-center
                rounded-lg
                text-white/50
                transition-colors
                hover:bg-white/10
                hover:text-white
              "
            >
              <LuX size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="
              flex-1
              overflow-y-auto
              bg-surface
              p-4
            "
          >
            {messages.length === 0 ? (
              /* Empty State */
              <div
                className="
                  flex h-full
                  flex-col
                  items-center
                  justify-center
                  px-4
                  text-center
                "
              >
                <div
                  className="
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full
                    bg-canvas
                  "
                >
                  <LuSparkles
                    className="text-coral"
                    size={17}
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-3 text-sm text-slate">
                  Try "Show my pending leave requests" or
                  "Check me in for today."
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={`
                        flex items-end gap-2
                        ${isUser ? "flex-row-reverse" : ""}
                      `}
                    >
                      {/* Avatar */}
                      <div
                        className={`
                          flex h-6 w-6
                          shrink-0
                          items-center justify-center
                          rounded-full
                          ${isUser ? "bg-ink" : "bg-coral"}
                        `}
                      >
                        {isUser ? (
                          <LuUser
                            className="text-white"
                            size={11}
                            aria-hidden="true"
                          />
                        ) : (
                          <LuSparkles
                            className="text-white"
                            size={11}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      {/* Message */}
                      <div
                        className={`
                          max-w-[78%]
                          rounded-2xl
                          px-3.5 py-2
                          text-sm
                          leading-relaxed
                          ${
                            isUser
                              ? "rounded-br-sm bg-ink text-white"
                              : "rounded-bl-sm bg-canvas text-ink"
                          }
                        `}
                      >
                        {message.text}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {sending && (
                  <div className="flex items-end gap-2">
                    <div
                      className="
                        flex h-6 w-6
                        shrink-0
                        items-center justify-center
                        rounded-full
                        bg-coral
                      "
                    >
                      <LuSparkles
                        className="text-white"
                        size={11}
                        aria-hidden="true"
                      />
                    </div>

                    <div
                      className="
                        flex items-center gap-1
                        rounded-2xl
                        rounded-bl-sm
                        bg-canvas
                        px-3.5 py-2.5
                      "
                      aria-label="Assistant is typing"
                    >
                      <span
                        className="
                          h-1.5 w-1.5
                          animate-bounce
                          rounded-full
                          bg-slate/50
                          [animation-delay:-0.2s]
                        "
                      />

                      <span
                        className="
                          h-1.5 w-1.5
                          animate-bounce
                          rounded-full
                          bg-slate/50
                          [animation-delay:-0.1s]
                        "
                      />

                      <span
                        className="
                          h-1.5 w-1.5
                          animate-bounce
                          rounded-full
                          bg-slate/50
                        "
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="
                  mt-3
                  rounded-xl
                  bg-coral/10
                  px-3 py-2
                  text-sm
                  text-coralDark
                "
              >
                {error}
              </p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="
              flex items-center gap-2
              border-t border-line
              bg-surface
              p-3
            "
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              placeholder="Ask anything..."
              disabled={sending}
              autoComplete="off"
              className="
                field-input
                flex-1
                py-2
                text-sm
              "
            />

            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="
                flex h-9 w-9
                shrink-0
                items-center justify-center
                rounded-full
                bg-coral
                text-white
                transition-colors
                hover:bg-coralDark
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <LuSend
                size={15}
                aria-hidden="true"
              />
            </button>
          </form>
        </div>
      )}

      {/* =====================================================
          Floating Launcher
          ===================================================== */}
      <button
        type="button"
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        aria-label={
          open ? "Close assistant" : "Open assistant"
        }
        aria-expanded={open}
        className="
          fixed bottom-6 right-6 z-40
          flex h-14 w-14
          items-center justify-center
          rounded-full
          bg-coral
          text-white
          shadow-card
          transition-transform
          duration-200
          hover:scale-105
          active:scale-95
        "
      >
        {open ? (
          <LuX size={22} aria-hidden="true" />
        ) : (
          <LuSparkles size={22} aria-hidden="true" />
        )}
      </button>
    </>
  );
}