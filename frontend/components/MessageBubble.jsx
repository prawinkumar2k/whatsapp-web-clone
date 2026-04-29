import { formatMessageTime, isMessageFromUser, summarizeReactions } from '../lib/chat';

function Tick({ status }) {
  if (status === 'read') {
    return (
      <svg className="cw-tick read" viewBox="0 0 18 18" width="16" height="11">
        <path d="M17.394 5.035l-.57-.444a.434.434 0 0 0-.609.076L8.897 15.071l-3.962-4.443a.434.434 0 0 0-.643-.024l-.525.525a.434.434 0 0 0-.024.643l4.48 4.966a.997.997 0 0 0 1.484.013L17.47 5.645a.434.434 0 0 0-.076-.61z" />
        <path d="M12.374 5.035l-.57-.444a.434.434 0 0 0-.609.076L4.897 12.071a.434.434 0 0 0 .075.609l.57.444a.434.434 0 0 0 .609-.076l6.299-8.004a.434.434 0 0 0-.076-.61z" />
      </svg>
    );
  }

  if (status === 'delivered') {
    return (
      <svg className="cw-tick" viewBox="0 0 18 18" width="16" height="11">
        <path d="M17.394 5.035l-.57-.444a.434.434 0 0 0-.609.076L8.897 15.071l-3.962-4.443a.434.434 0 0 0-.643-.024l-.525.525a.434.434 0 0 0-.024.643l4.48 4.966a.997.997 0 0 0 1.484.013L17.47 5.645a.434.434 0 0 0-.076-.61z" />
        <path d="M12.374 5.035l-.57-.444a.434.434 0 0 0-.609.076L4.897 12.071a.434.434 0 0 0 .075.609l.57.444a.434.434 0 0 0 .609-.076l6.299-8.004a.434.434 0 0 0-.076-.61z" />
      </svg>
    );
  }

  return (
    <svg className="cw-tick" viewBox="0 0 12 11" width="12" height="11">
      <path d="M11.1 1.1L4.5 8.3 1 4.7l-.9.9 4.4 4.5 7.5-8.1z" />
    </svg>
  );
}

export function MessageBubble({ message, currentUserId, onContextMenu }) {
  const isSent = isMessageFromUser(message, currentUserId);
  const hasReply = Boolean(message.replyTo);
  const replyWho = hasReply ? (message.replyTo?.senderId?.username || 'Someone') : '';
  const reactions = summarizeReactions(message.reactions);

  return (
    <div
      className={`cw-msg-row ${isSent ? 'sent' : 'received'}`}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(event, message);
      }}
    >
      <div className={`cw-bubble ${isSent ? 'sent' : 'received'}`}>
        <span className="cw-bubble-tail" aria-hidden>
          {isSent ? (
            <svg viewBox="0 0 8 13" height="13" width="8">
              <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" fill="#000" />
              <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" fill="#005c4b" />
            </svg>
          ) : (
            <svg viewBox="0 0 8 13" height="13" width="8">
              <path opacity=".13" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" fill="#000" />
              <path d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z" fill="#202c33" />
            </svg>
          )}
        </span>

        {hasReply && (
          <div className="bubble-reply-quote">
            <span className="bubble-reply-who">{replyWho}</span>
            {message.replyTo?.image && <span>📷 Photo</span>}
            <span className="bubble-reply-text">{message.replyTo?.text?.slice(0, 80)}</span>
          </div>
        )}

        {message.image && (
          <img
            src={message.image}
            className="bubble-image"
            alt="photo"
            onClick={() => window.open(message.image, '_blank')}
          />
        )}

        {message.text && <p className="cw-bubble-text">{message.text}</p>}

        {reactions.length > 0 && (
          <div className="cw-reaction-row">
            {reactions.map((reaction) => (
              <span key={reaction.emoji} className="cw-reaction-chip">
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </span>
            ))}
          </div>
        )}

        <div className="cw-bubble-meta">
          <span className="cw-bubble-time">{formatMessageTime(message.createdAt)}</span>
          {isSent && <Tick status={message.status || 'sent'} />}
        </div>
      </div>
    </div>
  );
}

export function MessageContextMenu({
  x,
  y,
  message,
  isSent,
  onReply,
  onCopy,
  onDelete,
  onReact,
  onClose,
}) {
  const style = {
    top: Math.min(y, window.innerHeight - 180),
    left: Math.min(x, window.innerWidth - 180),
  };

  return (
    <div className="ctx-menu" style={style}>
      <button
        onClick={() => {
          onReply(message);
          onClose();
        }}
      >
        <span>↩</span> Reply
      </button>
      {onReact && (
        <div className="ctx-menu-reactions">
          {['👍', '❤️', '😂', '😮'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(message, emoji);
                onClose();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      {message.text && (
        <button
          onClick={() => {
            onCopy(message);
            onClose();
          }}
        >
          <span>📋</span> Copy
        </button>
      )}
      {isSent && (
        <button
          className="danger"
          onClick={() => {
            onDelete(message._id);
            onClose();
          }}
        >
          <span>🗑</span> Delete
        </button>
      )}
    </div>
  );
}
