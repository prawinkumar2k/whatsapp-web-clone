import { useState, useEffect, useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import { MessageBubble, MessageContextMenu } from './MessageBubble';
import { groupMessagesByDate } from '../lib/chat';
import '../styles/chat-window.css';

const COLORS = ['#d32f2f', '#c62828', '#ad1457', '#880e4f', '#6a1b9a', '#4527a0', '#283593', '#1565c0', '#0277bd', '#006064', '#00838f', '#2e7d32', '#558b2f', '#f57f17', '#e65100', '#4e342e'];
const avatarColor = (name = '') => COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

function Avatar({ name, size = 40 }) {
  return (
    <div
      className="cw-avatar"
      style={{ width: size, height: size, minWidth: size, background: avatarColor(name) }}
    >
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  );
}

function TypingDots() {
  return <span className="typing-dots"><span /><span /><span /></span>;
}

function ReplyBar({ msg, currentUserId, onCancel }) {
  const who = String(msg.senderId?._id || msg.senderId) === currentUserId ? 'You' : (msg.senderId?.username || '');

  return (
    <div className="reply-bar">
      <div className="reply-bar-left">
        <span className="reply-bar-who">{who}</span>
        {msg.image && !msg.text && <span className="reply-bar-text">Photo</span>}
        {msg.text && <span className="reply-bar-text">{msg.text.slice(0, 80)}{msg.text.length > 80 ? '...' : ''}</span>}
      </div>
      {msg.image && <img src={msg.image} className="reply-bar-thumb" alt="" />}
      <button className="reply-bar-close" onClick={onCancel}>x</button>
    </div>
  );
}

function ImagePreview({ src, onRemove }) {
  return (
    <div className="img-preview-bar">
      <img src={src} alt="preview" className="img-preview-thumb" />
      <button className="img-preview-remove" onClick={onRemove}>x</button>
      <span className="img-preview-label">Ready to send</span>
    </div>
  );
}

function Welcome() {
  return (
    <div className="cw-welcome">
      <div className="cw-welcome-inner">
        <div className="cw-welcome-img">
          <svg viewBox="0 0 220 160" width="280" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="18" width="70" height="124" rx="9" fill="#202c33" />
            <rect x="36" y="30" width="58" height="90" rx="4" fill="#0b141a" />
            <rect x="40" y="36" width="28" height="5" rx="2.5" fill="#2a3942" />
            <rect x="40" y="46" width="48" height="4" rx="2" fill="#005c4b" />
            <rect x="40" y="55" width="34" height="4" rx="2" fill="#202c33" />
            <rect x="54" y="64" width="34" height="4" rx="2" fill="#005c4b" />
            <rect x="40" y="73" width="24" height="4" rx="2" fill="#202c33" />
            <rect x="40" y="82" width="40" height="4" rx="2" fill="#005c4b" />
            <rect x="40" y="91" width="20" height="4" rx="2" fill="#202c33" />
            <rect x="57" y="128" width="16" height="3" rx="1.5" fill="#2a3942" />
            <rect x="118" y="18" width="72" height="124" rx="9" fill="#202c33" />
            <rect x="124" y="30" width="60" height="90" rx="4" fill="#0b141a" />
            <rect x="128" y="36" width="30" height="5" rx="2.5" fill="#2a3942" />
            <rect x="128" y="46" width="50" height="4" rx="2" fill="#202c33" />
            <rect x="128" y="55" width="36" height="4" rx="2" fill="#005c4b" />
            <rect x="142" y="64" width="36" height="4" rx="2" fill="#202c33" />
            <rect x="128" y="73" width="44" height="4" rx="2" fill="#005c4b" />
            <rect x="128" y="82" width="26" height="4" rx="2" fill="#202c33" />
            <rect x="128" y="91" width="38" height="4" rx="2" fill="#005c4b" />
            <rect x="145" y="128" width="16" height="3" rx="1.5" fill="#2a3942" />
          </svg>
        </div>
        <h2 className="cw-welcome-title">WhatsApp Web</h2>
        <p className="cw-welcome-sub">
          Send and receive messages without keeping your phone online.
          <br />
          Select a contact to start chatting.
        </p>
        <div className="cw-welcome-lock">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <path
              d="M10 5H9V3.5C9 1.57 7.43 0 5.5 0S2 1.57 2 3.5V5H1C.45 5 0 5.45 0 6v7c0 .55.45 1 1 1h9c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zm-4.5 5.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM7.55 5H3.45V3.5C3.45 2.37 4.37 1.45 5.5 1.45s2.05.92 2.05 2.05V5z"
              fill="#8696a0"
            />
          </svg>
          <span>Your personal messages are end-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({
  currentUser,
  selectedThread,
  messages,
  loading,
  onlineUsers,
  typingUsers,
  onSendMessage,
  onDeleteMessage,
  onReactMessage,
  onTyping,
  onStopTyping,
}) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedUser = selectedThread?.type === 'user' ? selectedThread.data : null;
  const selectedGroup = selectedThread?.type === 'group' ? selectedThread.data : null;

  useEffect(() => {
    if (!selectedThread) return;
    inputRef.current?.focus();
    setReplyTo(null);
    setImageData(null);
    setText('');
    setShowEmoji(false);
  }, [selectedThread]);

  useEffect(() => {
    if (!showEmoji) return;

    const handleClick = (event) => {
      if (!event.target.closest('.emoji-picker') && !event.target.closest('.cw-emoji-btn')) {
        setShowEmoji(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmoji]);

  useEffect(() => () => clearTimeout(typingRef.current), []);

  if (!selectedThread) return <Welcome />;

  const isPartnerTyping = selectedUser ? Boolean(typingUsers[selectedUser._id]) : false;
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;
  const rows = groupMessagesByDate(messages);
  const isSent = (message) => String(message.senderId?._id || message.senderId) === String(currentUser._id);

  const handleTextChange = (value) => {
    setText(value);
    onTyping();
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(onStopTyping, 2000);
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed && !imageData) return;

    onSendMessage(trimmed, imageData, replyTo);
    setText('');
    setImageData(null);
    setReplyTo(null);
    setShowEmoji(false);
    clearTimeout(typingRef.current);
    onStopTyping();
  };

  const handleKey = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => setImageData(readerEvent.target.result);
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const openCtx = (event, message) => setContextMenu({ x: event.clientX, y: event.clientY, msg: message });
  const closeCtx = () => setContextMenu(null);

  return (
    <div className="cw-root" onClick={() => { if (showEmoji) setShowEmoji(false); }}>
      <header className="cw-header">
        <div className="cw-header-left">
          <Avatar name={selectedUser?.username || selectedGroup?.name} size={40} />
          <div className="cw-header-info">
            <span className="cw-header-name">{selectedUser?.username || selectedGroup?.name}</span>
            <span className={`cw-header-status ${isOnline ? 'online' : ''}`}>
              {selectedGroup
                ? `${selectedGroup.members?.length || 0} members`
                : isPartnerTyping
                  ? <><TypingDots /> typing...</>
                  : isOnline
                    ? 'online'
                    : 'last seen recently'}
            </span>
          </div>
        </div>
        <div className="cw-header-actions">
          <button className="cw-icon-btn" title="Video call">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z" /></svg>
          </button>
          <button className="cw-icon-btn" title="Search">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z" /></svg>
          </button>
          <button className="cw-icon-btn" title="More options">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" /></svg>
          </button>
        </div>
      </header>

      <div className="cw-messages" onClick={closeCtx}>
        {loading ? (
          <div className="cw-center"><div className="cw-spinner" /></div>
        ) : messages.length === 0 ? (
          <div className="cw-center"><div className="cw-empty-hint">Messages are end-to-end encrypted. Say hello!</div></div>
        ) : (
          rows.map((item) => (
            item.type === 'date'
              ? <div key={item.id} className="cw-date-chip"><span>{item.label}</span></div>
              : <MessageBubble key={item.id} message={item.message} currentUserId={currentUser._id} onContextMenu={openCtx} />
          ))
        )}

        {selectedUser && isPartnerTyping && (
          <div className="cw-typing-bubble">
            <div className="cw-bubble received" style={{ minWidth: 60, maxWidth: 80 }}>
              <span className="cw-bubble-tail" aria-hidden>
                <svg viewBox="0 0 8 13" height="13" width="8">
                  <path d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z" fill="#202c33" />
                </svg>
              </span>
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {replyTo && <ReplyBar msg={replyTo} currentUserId={currentUser._id} onCancel={() => setReplyTo(null)} />}

      {imageData && <ImagePreview src={imageData} onRemove={() => setImageData(null)} />}

      {showEmoji && (
        <div className="cw-emoji-wrap" onClick={(event) => event.stopPropagation()}>
          <EmojiPicker
            onSelect={(emoji) => {
              setText((value) => value + emoji);
              inputRef.current?.focus();
            }}
            onClose={() => setShowEmoji(false)}
          />
        </div>
      )}

      <div className="cw-input-bar" onClick={(event) => event.stopPropagation()}>
        <button
          className="cw-input-icon-btn cw-emoji-btn"
          title="Emoji"
          onClick={(event) => {
            event.stopPropagation();
            setShowEmoji((value) => !value);
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>
        </button>
        <button className="cw-input-icon-btn" title="Attach image" onClick={() => fileRef.current?.click()}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" /></svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        <div className="cw-input-wrap">
          <textarea
            ref={inputRef}
            className="cw-input"
            placeholder="Type a message"
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
        </div>

        <button
          className={`cw-send-btn ${(text.trim() || imageData) ? 'active' : ''}`}
          onClick={send}
          title={text.trim() || imageData ? 'Send' : 'Voice message'}
        >
          {text.trim() || imageData ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.468 2.35 8.468 4.35v7.061c0 2.001 1.53 3.531 3.531 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z" /></svg>
          )}
        </button>
      </div>

      {contextMenu && (
        <MessageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.msg}
          isSent={isSent(contextMenu.msg)}
          onReply={setReplyTo}
          onCopy={(msg) => navigator.clipboard.writeText(msg.text)}
          onDelete={onDeleteMessage}
          onReact={onReactMessage}
          onClose={closeCtx}
        />
      )}
    </div>
  );
}
