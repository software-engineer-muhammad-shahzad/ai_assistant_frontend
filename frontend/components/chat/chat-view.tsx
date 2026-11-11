"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { History, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listChats, saveChat, streamChat, type ChatHistoryItem } from "@/lib/api";
import type { Chat, Message, Source } from "@/lib/types";
import { uid } from "@/lib/utils";
import { ChatEmpty } from "./chat-empty";
import { ChatInput } from "./chat-input";
import { ChatSidebar } from "./chat-sidebar";
import { MessageBubble, ThinkingBubble } from "./message-bubble";

export function ChatView() {
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Message[]>([]); // messages of a not-yet-saved new chat
  const [pending, setPending] = useState(false);
  const [prefill, setPrefill] = useState<{ text: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // drawer on small screens
  const [listOpen, setListOpen] = useState(true); // chat list on large screens
  const [streaming, setStreaming] = useState(false); // answer words are arriving
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stickToBottom = useRef(true); // false once the user scrolls up to read

  const busy = pending || streaming;

  // Leaving the page stops the answer.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    let cancelled = false;
    listChats().then((c) => {
      if (cancelled) return;
      setChats(c);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeChat = chats?.find((c) => c.id === activeId) ?? null;
  const messages = activeChat ? activeChat.messages : draft;

  // Keep the newest text in view, unless the user has scrolled up to read.
  const lastLength = messages.length ? messages[messages.length - 1].content.length : 0;
  useEffect(() => {
    if (!stickToBottom.current) return;
    bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth", block: "end" });
  }, [messages.length, lastLength, pending, streaming]);

  const newChat = useCallback(() => {
    setActiveId(null);
    setDraft([]);
    setSidebarOpen(false);
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  }, []);

  async function send(text: string, attachments: string[]) {
    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      attachments: attachments.length ? attachments : undefined,
    };

    // The messages before this question (last 6; error messages are not sent)
    // so that follow-up questions work.
    const history: ChatHistoryItem[] = (activeChat ? activeChat.messages : draft)
      .filter((m) => !m.error && m.content.trim())
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    // Append the user message to the active chat (or create one).
    let chatId = activeId;
    let current: Chat;
    if (activeChat) {
      current = { ...activeChat, messages: [...activeChat.messages, userMsg], updatedAt: userMsg.createdAt };
    } else {
      chatId = uid();
      current = {
        id: chatId,
        title: text.length > 48 ? `${text.slice(0, 48)}…` : text,
        updatedAt: userMsg.createdAt,
        messages: [...draft, userMsg],
      };
      setDraft([]);
      setActiveId(chatId);
    }
    commit(current);
    stickToBottom.current = true;
    setPending(true); // "Thinking..." until the first words arrive

    const controller = new AbortController();
    abortRef.current = controller;
    const assistantId = uid();
    let answer = "";
    let sources: Source[] | undefined;
    let started = false;
    let failure: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Put the text received so far on screen.
    const show = () => {
      timer = undefined;
      showAnswer(current.id, assistantId, answer, sources);
    };

    try {
      await streamChat(text, history, controller.signal, {
        onSources: (s) => {
          sources = s.length ? s : undefined;
        },
        onToken: (piece) => {
          answer += piece;
          if (!started) {
            started = true;
            setPending(false);
            setStreaming(true);
            show();
          } else if (timer === undefined) {
            timer = setTimeout(show, 50); // update the screen about 20 times a second
          }
        },
      });
    } catch (e) {
      // Pressing Stop is not an error: keep whatever text arrived.
      if (!controller.signal.aborted) {
        failure = e instanceof Error ? e.message : "Sorry, I could not get an answer. Please try again.";
      }
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      abortRef.current = null;
    }

    const finalMessages = [...current.messages];
    if (answer) {
      finalMessages.push({
        id: assistantId,
        role: "assistant",
        content: answer,
        sources,
        createdAt: new Date().toISOString(),
      });
    }
    if (failure) {
      finalMessages.push({
        id: uid(),
        role: "assistant",
        content: failure,
        error: true,
        createdAt: new Date().toISOString(),
      });
    }
    commit({ ...current, messages: finalMessages, updatedAt: new Date().toISOString() });
    setPending(false);
    setStreaming(false);
  }

  function stop() {
    abortRef.current?.abort();
  }

  /** Add or update the assistant message that is being streamed. */
  function showAnswer(chatId: string, messageId: string, content: string, sources?: Source[]) {
    setChats((prev) =>
      (prev ?? []).map((c) => {
        if (c.id !== chatId) return c;
        const exists = c.messages.some((m) => m.id === messageId);
        return {
          ...c,
          messages: exists
            ? c.messages.map((m) => (m.id === messageId ? { ...m, content, sources } : m))
            : [
                ...c.messages,
                { id: messageId, role: "assistant", content, sources, createdAt: new Date().toISOString() },
              ],
        };
      }),
    );
  }

  function commit(chat: Chat) {
    saveChat(chat);
    setChats((prev) => {
      const rest = (prev ?? []).filter((c) => c.id !== chat.id);
      // Keep list order stable for existing chats; new chats go to the top.
      const existed = (prev ?? []).some((c) => c.id === chat.id);
      return existed
        ? (prev ?? []).map((c) => (c.id === chat.id ? chat : c))
        : [chat, ...rest];
    });
  }

  const sidebar = (
    <ChatSidebar
      chats={chats}
      loading={loading}
      activeId={activeId}
      onNew={newChat}
      onSelect={selectChat}
    />
  );

  return (
    <div className="flex h-full min-h-0">
      {/* Desktop chat list */}
      {listOpen && (
        <aside
          id="chat-list"
          className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block"
        >
          {sidebar}
        </aside>
      )}

      {/* Mobile / tablet chat list */}
      <DialogPrimitive.Root open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-border bg-surface shadow-xl lg:hidden">
            <DialogPrimitive.Title className="sr-only">Chats</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Start a new chat or open a previous one
            </DialogPrimitive.Description>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" className="absolute right-2 top-2" aria-label="Close chat list">
                <X />
              </Button>
            </DialogPrimitive.Close>
            <div className="pt-10">{sidebar}</div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <section className="flex min-w-0 flex-1 flex-col" aria-label="Conversation">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          {/* Small screens: open the chat list as a drawer */}
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <History /> Chats
          </Button>
          {/* Large screens: show / hide the chat list */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setListOpen((o) => !o)}
            aria-label={listOpen ? "Hide chat list" : "Show chat list"}
            aria-expanded={listOpen}
            aria-controls="chat-list"
            title={listOpen ? "Hide chat list" : "Show chat list"}
          >
            {listOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
          <span className="truncate text-sm text-muted-foreground">
            {activeChat?.title ?? "New chat"}
          </span>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          }}
        >
          {messages.length === 0 && !pending ? (
            <ChatEmpty onPick={(q) => setPrefill({ text: q })} />
          ) : (
            <div
              role="log"
              aria-live="polite"
              aria-label="Messages"
              className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6"
            >
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {pending && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <ChatInput disabled={busy} onSend={send} onStop={stop} prefill={prefill} />
      </section>
    </div>
  );
}
