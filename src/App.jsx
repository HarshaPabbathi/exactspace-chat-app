import { useState, useRef, useEffect, useLayoutEffect } from "react";
import "./App.css";

const user_list = ["Alan", "Bob", "Carol", "Dean", "Elin"];

const USER_COLORS = {
  Alan: "#4f6bed",
  Bob: "#0ea5a0",
  Carol: "#e0457b",
  Dean: "#f08c00",
  Elin: "#8b5cf6",
};

// [emoji, searchable keywords]
const EMOJIS = [
  ["😀", "grin happy smile"], ["😂", "laugh joy lol"], ["😅", "sweat nervous"], ["😉", "wink"],
  ["😍", "love heart eyes"], ["🥰", "love adore"], ["😎", "cool sunglasses"], ["🤔", "think hmm"],
  ["😢", "sad cry"], ["😭", "sob cry"], ["😡", "angry mad"], ["🤯", "mind blown"],
  ["🥳", "party celebrate"], ["😴", "sleep tired"], ["🙈", "monkey shy"], ["👀", "eyes look"],
  ["👍", "thumbs up like yes"], ["👎", "thumbs down no"], ["👏", "clap applause"], ["🙌", "praise hands"],
  ["🙏", "pray thanks please"], ["💪", "strong muscle"], ["🤝", "handshake deal"], ["👋", "wave hello bye"],
  ["✅", "check done yes"], ["❌", "cross wrong no"], ["❓", "question"], ["💡", "idea bulb"],
  ["🎉", "party popper celebrate"], ["🔥", "fire hot"], ["❤️", "heart love red"], ["💯", "hundred perfect"],
  ["✨", "sparkles magic"], ["🚀", "rocket launch"], ["⭐", "star"], ["🏆", "trophy win"],
  ["☕", "coffee tea"], ["🍕", "pizza food"], ["🍔", "burger food"], ["🎂", "cake birthday"],
  ["🐶", "dog puppy"], ["🐱", "cat kitten"], ["🦄", "unicorn"], ["🌈", "rainbow"],
  ["🌞", "sun sunny"], ["🌙", "moon night"], ["💻", "laptop code computer"], ["📱", "phone mobile"],
];

const MENTION_SPLIT = new RegExp(`(@(?:${user_list.join("|")}))\\b`, "g");

const getMention = (value, caret) => {
  const m = /(^|\s)@(\w*)$/.exec(value.slice(0, caret));
  if (!m) return null;
  return { start: caret - m[2].length - 1, query: m[2] };
};

const renderText = (text) =>
  text.split(MENTION_SPLIT).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="mention" style={{ "--m": USER_COLORS[part.slice(1)] }}>
        {part}
      </span>
    ) : (
      part
    )
  );

const randomUser = () => user_list[Math.floor(Math.random() * user_list.length)];
const formatTime = (d) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 20.5s-7.5-4.6-9.6-9.2C.9 7.9 2.7 4.5 6.1 4.5c2.2 0 3.6 1.2 5.9 3.4 2.3-2.2 3.7-3.4 5.9-3.4 3.4 0 5.2 3.4 3.7 6.8-2.1 4.6-9.6 9.2-9.6 9.2z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionDismissed, setMentionDismissed] = useState(false);

  const nextId = useRef(1);
  const threadEnd = useRef(null);
  const inputRef = useRef(null);
  const emojiRef = useRef(null);
  const pendingCaret = useRef(null);

  const mention = getMention(text, caret);
  const mentionOptions = mention
    ? user_list.filter((u) => u.toLowerCase().startsWith(mention.query.toLowerCase()))
    : [];
  const mentionOpen = !mentionDismissed && mention !== null && mentionOptions.length > 0;

  const q = emojiQuery.trim().toLowerCase();
  const emojiResults = EMOJIS.filter(([, k]) => k.includes(q));

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [text]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!emojiOpen) return;
    const close = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [emojiOpen]);

  const toggleEmoji = () => {
    setEmojiQuery("");
    setEmojiOpen((o) => !o);
  };

  const insertAtCaret = (str) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const pos = start + str.length;
    pendingCaret.current = pos;
    setText(text.slice(0, start) + str + text.slice(end));
    setCaret(pos);
    setMentionDismissed(false);
    setMentionIndex(0);
  };

  const startMention = () => {
    const pos = inputRef.current?.selectionStart ?? text.length;
    const needsSpace = pos > 0 && !/\s/.test(text[pos - 1]);
    setEmojiOpen(false);
    insertAtCaret(needsSpace ? " @" : "@");
  };

  const selectMention = (name) => {
    const before = text.slice(0, mention.start);
    const inserted = `@${name} `;
    pendingCaret.current = before.length + inserted.length;
    setText(before + inserted + text.slice(caret));
    setCaret(pendingCaret.current);
    setMentionIndex(0);
  };

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, user: randomUser(), text: trimmed, likes: 0, time: formatTime(new Date()) },
    ]);
    setText("");
    setCaret(0);
    setEmojiOpen(false);
    setMentionDismissed(false);
    inputRef.current?.focus();
  };

  const likeMessage = (id) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m)));

  const handleChange = (e) => {
    setText(e.target.value);
    setCaret(e.target.selectionStart);
    setMentionDismissed(false);
    setMentionIndex(0);
    setEmojiOpen(false);
  };

  const syncCaret = (e) => setCaret(e.target.selectionStart);

  const handleKeyDown = (e) => {
    if (mentionOpen) {
      const n = mentionOptions.length;
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => (i + 1) % n); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => (i - 1 + n) % n); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(mentionOptions[mentionIndex] ?? mentionOptions[0]);
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); setMentionDismissed(true); return; }
    }
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="page">
      <div className="chat">
        <header className="header">
          <div className="title">
            <h1>Team Chat</h1>
            <p>
              {messages.length > 0 && ` · ${messages.length} message${messages.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="members" aria-label="Members">
            {user_list.map((u) => (
              <span key={u} className="member" style={{ "--user": USER_COLORS[u] }} title={u}>
                {u[0]}
              </span>
            ))}
          </div>

          
        </header>

        

        <div className="thread" aria-live="polite">
          {messages.length === 0 ? (
            <div className="empty">
              <p className="empty-title">Start the conversation</p>
            </div>
          ) : (
            <div className="divider"><span>Today</span></div>
          )}

          {messages.map((m, i) => {
            const grouped = i > 0 && messages[i - 1].user === m.user;
            return (
              <div
                key={m.id}
                className={`message${grouped ? " grouped" : ""}`}
                style={{ "--user": USER_COLORS[m.user] }}
              >
                <div className="avatar">{m.user[0]}</div>
                <div className="bubble">
                  {!grouped && (
                    <div className="meta">
                      <span className="username">{m.user}</span>
                      <span className="time">{m.time}</span>
                    </div>
                  )}
                  <p className="content">{renderText(m.text)}</p>
                </div>
                <button
                  className={`like${m.likes > 0 ? " liked" : ""}`}
                  onClick={() => likeMessage(m.id)}
                  aria-label={`Like message from ${m.user}. ${m.likes} likes`}
                >
                  <span className="thumb-icon">👍</span>
                  <span className="count">{m.likes}</span>
                </button>
              </div>
            );
          })}
          <div ref={threadEnd} />
        </div>

        <div className="composer">
          {mentionOpen && (
            <ul className="popover mention-list" role="listbox" aria-label="Mention a user">
              <li className="pop-title" aria-hidden="true">Mention someone</li>
              {mentionOptions.map((u, i) => (
                <li
                  key={u}
                  role="option"
                  aria-selected={i === mentionIndex}
                  className={i === mentionIndex ? "active" : ""}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setMentionIndex(i)}
                  onClick={() => selectMention(u)}
                >
                  <span className="mini-avatar" style={{ "--user": USER_COLORS[u] }}>{u[0]}</span>
                  {u}
                </li>
              ))}
            </ul>
          )}

          <div className="emoji-wrap" ref={emojiRef}>
            <button
              type="button"
              className="tool"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleEmoji}
              aria-label="Add emoji"
              aria-expanded={emojiOpen}
            >
              😊
            </button>
            {emojiOpen && (
              <div className="popover emoji-panel" role="dialog" aria-label="Emoji picker">
                <label className="emoji-search">
                  <SearchIcon />
                  <input
                    type="text"
                    value={emojiQuery}
                    onChange={(e) => setEmojiQuery(e.target.value)}
                    placeholder="Search emoji, e.g. love"
                    aria-label="Search emoji"
                    autoFocus
                  />
                </label>
                <div className="emoji-grid">
                  {emojiResults.length === 0 && <p className="no-results">No emoji found</p>}
                  {emojiResults.map(([emoji, kw]) => (
                    <button
                      type="button"
                      key={emoji}
                      title={kw.split(" ")[0]}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertAtCaret(emoji)}
                      aria-label={`Insert ${kw.split(" ")[0]} emoji`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="tool at"
            onMouseDown={(e) => e.preventDefault()}
            onClick={startMention}
            aria-label="Mention someone"
          >
            @
          </button>

          <input
            ref={inputRef}
            className="message-input"
            type="text"
            value={text}
            onChange={handleChange}
            placeholder="Type a message..."
            onKeyDown={handleKeyDown}
            onKeyUp={syncCaret}
            onClick={syncCaret}
            aria-label="Message"
            autoFocus
          />
          <button className="send" onClick={sendMessage} disabled={!text.trim()} aria-label="Send">
            <span>Send</span>
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}