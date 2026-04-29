const getId = (value) => String(value?._id || value || '');

export const getConversationKey = (thread) => {
  if (!thread) return '';
  return thread.type === 'group' ? `group:${getId(thread.data)}` : `user:${getId(thread.data)}`;
};

export const formatMessageTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatMessageDate = (timestamp) => {
  const current = new Date();
  const yesterday = new Date();
  yesterday.setDate(current.getDate() - 1);

  const messageDate = new Date(timestamp);

  if (messageDate.toDateString() === current.toDateString()) return 'Today';
  if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return messageDate.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
};

export const groupMessagesByDate = (messages) => {
  const items = [];
  let lastLabel = null;

  for (const message of messages) {
    const label = formatMessageDate(message.createdAt);

    if (label !== lastLabel) {
      items.push({ id: `date-${message._id}`, type: 'date', label });
      lastLabel = label;
    }

    items.push({ id: message._id, type: 'message', message });
  }

  return items;
};

export const sortUsersByRecency = (users, lastMessages) =>
  [...users].sort((left, right) => {
    const leftStamp = new Date(lastMessages[left._id]?.createdAt || 0).getTime();
    const rightStamp = new Date(lastMessages[right._id]?.createdAt || 0).getTime();

    if (leftStamp !== rightStamp) {
      return rightStamp - leftStamp;
    }

    return left.username.localeCompare(right.username);
  });

export const formatMessagePreview = (message, currentUserId) => {
  if (!message) return '';

  const isMine = getId(message.senderId) === String(currentUserId);
  const prefix = isMine ? 'You: ' : '';

  if (message.image && !message.text) {
    return `${prefix}📷 Photo`;
  }

  return `${prefix}${message.text || ''}`.trim();
};

export const isMessageFromUser = (message, userId) => getId(message.senderId) === String(userId);

export const summarizeReactions = (reactions = []) => {
  const summary = new Map();

  reactions.forEach((reaction) => {
    const emoji = reaction?.emoji;
    if (!emoji) return;

    summary.set(emoji, (summary.get(emoji) || 0) + 1);
  });

  return Array.from(summary.entries()).map(([emoji, count]) => ({ emoji, count }));
};
