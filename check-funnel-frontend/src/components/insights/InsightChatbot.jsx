import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, UserRound, X } from "lucide-react";
import { askInsightChatAI } from "../../api/ai";

const CHAT_MEMORY_LIMIT = 40;

function buildInitialMessage(context) {
  const clientName = context?.clientName || "this client";
  const platform = context?.platformLabel || context?.platform || "this platform";
  const activeTab = context?.activeTab || "this tab";
  const timeRange = context?.timeRange || "the selected range";

  return {
    role: "assistant",
    content: `Hello! You're viewing ${clientName}'s ${platform} ${activeTab} for ${timeRange}. I can use the data shown on this page to help you analyze it.`,
  };
}

function getChatMemoryKey(context) {
  const clientKey = String(context?.clientName || "client")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "client";

  return `check-funnel:insight-chat:${clientKey}`;
}

function normalizeMessages(messages = []) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => ["assistant", "user"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").trim(),
    }))
    .filter((message) => message.content);
}

function trimMessages(messages = []) {
  return normalizeMessages(messages).slice(-CHAT_MEMORY_LIMIT);
}

function readStoredMessages(memoryKey, context) {
  if (typeof window === "undefined") return [buildInitialMessage(context)];

  try {
    const storedMessages = JSON.parse(window.localStorage.getItem(memoryKey) || "[]");
    const safeMessages = trimMessages(storedMessages);
    const hasUserMessage = safeMessages.some((message) => message.role === "user");
    return hasUserMessage ? safeMessages : [buildInitialMessage(context)];
  } catch {
    return [buildInitialMessage(context)];
  }
}

function saveStoredMessages(memoryKey, messages) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(memoryKey, JSON.stringify(trimMessages(messages)));
  } catch {
    // Local storage can be unavailable in private or restricted browser modes.
  }
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf1f8] text-[#003870]">
          <Bot className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-6 ${
          isUser
            ? "rounded-br-md bg-[#003870] font-semibold text-white"
            : "rounded-bl-md bg-white text-[#424751] shadow-sm ring-1 ring-[#dce4ef]"
        }`}
      >
        {message.content}
      </div>

      {isUser && (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf1f6] text-[#424751]">
          <UserRound className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      )}
    </div>
  );
}

export default function InsightChatbot({ context, disabled = false }) {
  const memoryKey = useMemo(() => getChatMemoryKey(context), [context?.clientName]);
  const [messages, setMessages] = useState(() => readStoredMessages(memoryKey, context));
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const previousMemoryKeyRef = useRef(memoryKey);
  const skipNextSaveRef = useRef(false);

  const contextKey = useMemo(
    () => `${context?.clientName || ""}-${context?.platform || ""}-${context?.activeTab || ""}-${context?.timeRange || ""}`,
    [context?.activeTab, context?.clientName, context?.platform, context?.timeRange],
  );

  useEffect(() => {
    setMessages((prev) => {
      const hasUserMessage = prev.some((message) => message.role === "user");
      if (hasUserMessage) return prev;

      const nextInitialMessage = buildInitialMessage(context);
      return prev[0]?.content === nextInitialMessage.content ? prev : [nextInitialMessage];
    });
  }, [context, contextKey]);

  useEffect(() => {
    if (previousMemoryKeyRef.current !== memoryKey) {
      previousMemoryKeyRef.current = memoryKey;
      skipNextSaveRef.current = true;
      setMessages(readStoredMessages(memoryKey, context));
    }
  }, [context, memoryKey]);

  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    saveStoredMessages(memoryKey, messages);
  }, [memoryKey, messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isSending || disabled) return;

    const userMessage = { role: "user", content: trimmedQuestion };
    const history = trimMessages(messages);
    setMessages((prev) => trimMessages([...prev, userMessage]));
    setQuestion("");
    setIsSending(true);

    try {
      const response = await askInsightChatAI({
        question: trimmedQuestion,
        context,
        history,
      });

      setMessages((prev) => trimMessages([
        ...prev,
        {
          role: "assistant",
          content: response?.answer || response?.raw || "I could not generate an answer for this view.",
        },
      ]));
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to answer this question.";
      setMessages((prev) => trimMessages([
        ...prev,
        {
          role: "assistant",
          content: message,
        },
      ]));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`fixed bottom-1 right-5 z-[80] flex h-16 w-16 items-center justify-center rounded-full bg-[#003870] text-white shadow-[0_18px_40px_rgba(0,56,112,0.28)] transition hover:bg-[#014f99] active:scale-95 sm:bottom-2 sm:right-8 ${
          isOpen ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label={isOpen ? "Close insight chat" : "Open insight chat"}
        aria-expanded={isOpen}
      >
        <Bot className="h-7 w-7" strokeWidth={2.4} />
      </button>

      <section
        className={`fixed bottom-4 left-4 right-4 z-[79] flex h-[min(520px,calc(100vh-2rem))] flex-col overflow-hidden rounded-3xl border border-[#dce4ef] bg-[#f6f8fb] shadow-[0_24px_70px_rgba(15,23,42,0.2)] transition-all duration-300 sm:left-auto sm:right-8 sm:w-[390px] ${
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-8 opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between gap-4 bg-[#003870] px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/15">
              <Bot className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-extrabold leading-tight">Insight Chat</h3>
              <p className="mt-0.5 truncate text-xs font-bold text-white/72">
                {context?.platformLabel || context?.platform} &middot; {context?.activeTab}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/78 transition hover:bg-white/12 hover:text-white active:scale-95"
            aria-label="Close insight chat"
          >
            <X className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </div>

        <div key={contextKey} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 no-scrollbar">
          {messages.map((message, index) => (
            <ChatMessage key={`${message.role}-${index}`} message={message} />
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-sm font-bold text-[#727782]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#003870]" />
              Thinking...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#dfe6f2] bg-white px-4 py-3.5">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about this tab..."
            disabled={disabled || isSending}
            className="min-w-0 flex-1 rounded-full border-none bg-[#f6f8fb] px-4 py-3 text-sm font-semibold text-[#191c1d] outline-none ring-1 ring-[#ccd7e6] transition placeholder:text-[#727782]/60 focus:ring-2 focus:ring-[#a8c8ff] disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={disabled || isSending || !question.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#003870] text-white shadow-[0_10px_22px_rgba(0,56,112,0.22)] transition hover:bg-[#014f99] active:scale-95 disabled:cursor-not-allowed disabled:bg-[#9db1c8] disabled:opacity-70"
            aria-label="Send question"
          >
            <Send className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </form>
      </section>
    </>
  );
}
