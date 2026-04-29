import { useState } from 'react';
import { formatMessagePreview, getConversationKey, sortUsersByRecency } from '../lib/chat';
import '../styles/users-list.css';

const COLORS = ['#d32f2f', '#c62828', '#ad1457', '#880e4f', '#6a1b9a', '#4527a0', '#283593', '#1565c0', '#0277bd', '#006064', '#00838f', '#2e7d32', '#558b2f', '#f57f17', '#e65100', '#4e342e'];
const avatarColor = (name = '') => COLORS[(name.charCodeAt(0) || 0) % COLORS.length];

function Avatar({ name, size = 40 }) {
  return (
    <div className="wa-avatar" style={{ width: size, height: size, minWidth: size, background: avatarColor(name) }}>
      {(name?.[0] ?? '?').toUpperCase()}
    </div>
  );
}

function fmtLastTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function TypingDots() {
  return <span className="wa-typing-dots"><span /><span /><span /></span>;
}

export default function UsersList({
  users,
  groups = [],
  currentUser,
  selectedThread,
  onlineUsers,
  typingUsers,
  unreadCounts,
  lastMessages,
  onSelectUser,
  onSelectGroup,
  loading,
}) {
  const [search, setSearch] = useState('');

  const filtered = sortUsersByRecency(
    users.filter((user) => user.username.toLowerCase().includes(search.toLowerCase())),
    lastMessages
  );
  const activeKey = getConversationKey(selectedThread);

  return (
    <aside className="wa-sidebar">
      <header className="wa-sidebar-header">
        <Avatar name={currentUser?.username} size={40} />
        <div className="wa-sidebar-header-actions">
          <button type="button" className="wa-icon-btn" title="New chat" aria-label="New chat">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H5.041V11.1h8.975v1.944zm3-4H5.041V7.1h11.975v1.944z" /></svg>
          </button>
          <button type="button" className="wa-icon-btn" title="More options" aria-label="More options">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" /></svg>
          </button>
        </div>
      </header>

      <div className="wa-search-bar">
        <div className="wa-search-inner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="10.5" cy="10.5" r="7" stroke="#8696a0" strokeWidth="1.8" />
            <path d="M15.75 15.75L20 20" stroke="#8696a0" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && <button className="wa-search-clear" onClick={() => setSearch('')}>x</button>}
        </div>
      </div>

      <div className="wa-self-chip">
        <Avatar name={currentUser?.username} size={28} />
        <span className="wa-self-name">{currentUser?.username}</span>
        <span className="wa-self-tag">You</span>
      </div>

      <div className="wa-section">
        <div className="wa-section-title">Groups</div>
        {groups.length === 0 ? (
          <div className="wa-empty-groups">No groups yet.</div>
        ) : (
          groups.map((group) => {
            const key = `group:${group._id}`;
            const isActive = activeKey === key;
            const unread = unreadCounts[key] || 0;
            const lastMsg = lastMessages[key];

            return (
              <button
                key={group._id}
                type="button"
                className={`wa-user-row ${isActive ? 'active' : ''}`}
                onClick={() => onSelectGroup(group)}
              >
                <div className="wa-user-avatar-wrap">
                  <Avatar name={group.name} size={49} />
                </div>
                <div className="wa-user-row-body">
                  <div className="wa-user-row-top">
                    <span className="wa-user-row-name">{group.name}</span>
                    {lastMsg && <span className={`wa-last-time ${unread ? 'unread' : ''}`}>{fmtLastTime(lastMsg.createdAt)}</span>}
                  </div>
                  <div className="wa-user-row-bottom">
                    <span className="wa-last-msg">
                      {lastMsg ? (
                        <>{formatMessagePreview(lastMsg, currentUser._id)}</>
                      ) : (
                        <span className="wa-no-msg">{group.members?.length || 0} members</span>
                      )}
                    </span>
                    {unread > 0 && <span className="wa-unread-badge">{unread > 99 ? '99+' : unread}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="wa-list">
        {loading ? (
          [1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="wa-skeleton-row">
              <div className="wa-sk-avatar" />
              <div className="wa-sk-lines">
                <div className="wa-sk-line" style={{ width: `${50 + index * 8}%` }} />
                <div className="wa-sk-line" style={{ width: `${30 + index * 5}%`, opacity: 0.4 }} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="wa-empty-list">
            {search ? `No results for "${search}"` : 'No other users yet. Open in another tab and create a user!'}
          </div>
        ) : (
          filtered.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const key = `user:${user._id}`;
            const isActive = activeKey === key;
            const unread = unreadCounts[key] || 0;
            const lastMsg = lastMessages[key];
            const isTyping = Boolean(typingUsers[user._id]);

            return (
              <button
                key={user._id}
                type="button"
                className={`wa-user-row ${isActive ? 'active' : ''}`}
                onClick={() => onSelectUser(user)}
              >
                <div className="wa-user-avatar-wrap">
                  <Avatar name={user.username} size={49} />
                  {isOnline && <span className="wa-online-dot" />}
                </div>
                <div className="wa-user-row-body">
                  <div className="wa-user-row-top">
                    <span className="wa-user-row-name">{user.username}</span>
                    {lastMsg && <span className={`wa-last-time ${unread ? 'unread' : ''}`}>{fmtLastTime(lastMsg.createdAt)}</span>}
                  </div>
                  <div className="wa-user-row-bottom">
                    <span className="wa-last-msg">
                      {isTyping ? (
                        <span className="wa-typing-text"><TypingDots /> typing...</span>
                      ) : lastMsg ? (
                        <>{formatMessagePreview(lastMsg, currentUser._id)}</>
                      ) : (
                        <span className="wa-no-msg">{isOnline ? 'Online' : 'Offline'}</span>
                      )}
                    </span>
                    {unread > 0 && <span className="wa-unread-badge">{unread > 99 ? '99+' : unread}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
