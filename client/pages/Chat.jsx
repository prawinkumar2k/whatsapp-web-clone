import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../lib/api';
import { usersAPI, messagesAPI, groupsAPI } from '../services/api';
import UsersList from '../components/UsersList';
import ChatWindow from '../components/ChatWindow';
import { getConversationKey } from '../lib/chat';
import '../styles/chat.css';

const updateMessageStatus = (messages, messageId, status) =>
  messages.map((message) => (message._id === messageId ? { ...message, status } : message));

export default function Chat({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const selectedThreadRef = useRef(null);
  const typingTimers = useRef({});

  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const socket = io(API_BASE_URL || undefined, { transports: ['websocket', 'polling'] });

    const handleConnect = () => socket.emit('register', user._id);
    const handleUsersOnline = (ids) => setOnlineUsers(ids);
    const handleReceiveMessage = (message) => {
      const senderId = String(message.senderId?._id || message.senderId);
      const groupId = String(message.groupId?._id || message.groupId || '');
      const currentThread = selectedThreadRef.current;
      const threadKey = groupId ? `group:${groupId}` : `user:${senderId}`;

      setLastMessages((prev) => ({ ...prev, [threadKey]: message }));

      if (currentThread && getConversationKey(currentThread) === threadKey) {
        setMessages((prev) => [...prev, message]);

        if (!groupId) {
          socket.emit('messages_read', { readerId: user._id, senderId });
        }
      } else {
        setUnreadCounts((prev) => ({ ...prev, [threadKey]: (prev[threadKey] || 0) + 1 }));

        if (!groupId && Notification.permission === 'granted' && document.hidden) {
          const senderName = message.senderId?.username || 'Someone';
          new Notification(senderName, {
            body: message.image ? 'Photo' : message.text,
            icon: '/icon.svg',
            tag: senderId,
          });
        }
      }
    };
    const handleTyping = ({ senderId }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
      clearTimeout(typingTimers.current[senderId]);
      typingTimers.current[senderId] = setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [senderId]: false }));
      }, 3000);
    };
    const handleStopTyping = ({ senderId }) => {
      clearTimeout(typingTimers.current[senderId]);
      setTypingUsers((prev) => ({ ...prev, [senderId]: false }));
    };
    const handleMessageDelivered = ({ messageId }) => {
      setMessages((prev) => updateMessageStatus(prev, messageId, 'delivered'));
    };
    const handleMessagesRead = ({ by }) => {
      setMessages((prev) =>
        prev.map((message) =>
          String(message.receiverId?._id || message.receiverId) === by
            ? { ...message, status: 'read' }
            : message
        )
      );
    };
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((message) => message._id !== messageId));
    };
    const handleMessageReacted = ({ messageId, userId, emoji }) => {
      setMessages((prev) =>
        prev.map((message) => {
          if (message._id !== messageId) return message;

          const reactions = [...(message.reactions || [])];
          const reactionIndex = reactions.findIndex((reaction) => String(reaction.userId?._id || reaction.userId) === String(userId));

          if (reactionIndex >= 0 && reactions[reactionIndex].emoji === emoji) {
            reactions.splice(reactionIndex, 1);
          } else if (reactionIndex >= 0) {
            reactions[reactionIndex] = {
              ...reactions[reactionIndex],
              emoji,
            };
          } else {
            reactions.push({ userId, emoji, createdAt: new Date().toISOString() });
          }

          return { ...message, reactions };
        })
      );
    };

    socket.on('connect', handleConnect);
    socket.on('users_online', handleUsersOnline);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reacted', handleMessageReacted);

    socketRef.current = socket;

    return () => {
      socket.off('connect', handleConnect);
      socket.off('users_online', handleUsersOnline);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reacted', handleMessageReacted);
      socket.disconnect();

      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
    };
  }, [user._id]);

  useEffect(() => {
    usersAPI
      .getAll()
      .then((allUsers) => setUsers(allUsers.filter((entry) => entry._id !== user._id)))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, [user._id]);

  useEffect(() => {
    groupsAPI
      .getAll(user._id)
      .then((allGroups) => setGroups(allGroups))
      .catch(console.error)
      .finally(() => {});
  }, [user._id]);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }

    let active = true;
    setLoadingMessages(true);

    const threadKey = getConversationKey(selectedThread);
    const promise = selectedThread.type === 'group'
      ? messagesAPI.getGroup(selectedThread.data._id)
      : messagesAPI.get(user._id, selectedThread.data._id);

    promise
      .then((items) => {
        if (!active) return;

        setMessages(items);

        if (items.length) {
          const last = items[items.length - 1];
          setLastMessages((prev) => ({ ...prev, [threadKey]: last }));
        }

        if (selectedThread.type === 'user') {
          socketRef.current?.emit('messages_read', {
            readerId: user._id,
            senderId: selectedThread.data._id,
          });
        }
        setUnreadCounts((prev) => ({ ...prev, [threadKey]: 0 }));
      })
      .catch(console.error)
      .finally(() => {
        if (active) {
          setLoadingMessages(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedThread, user._id]);

  const handleSelectUser = useCallback((nextUser) => {
    const nextThread = { type: 'user', data: nextUser };
    setSelectedThread(nextThread);
    setUnreadCounts((prev) => ({ ...prev, [getConversationKey(nextThread)]: 0 }));
  }, []);

  const handleSelectGroup = useCallback((nextGroup) => {
    const nextThread = { type: 'group', data: nextGroup };
    setSelectedThread(nextThread);
    setUnreadCounts((prev) => ({ ...prev, [getConversationKey(nextThread)]: 0 }));
  }, []);

  const handleSendMessage = useCallback(async (text, image = null, replyTo = null) => {
    if (!text.trim() && !image) return;
    if (!selectedThread) return;

    try {
      const saved = selectedThread.type === 'group'
        ? await messagesAPI.sendToGroup(user._id, selectedThread.data._id, text, image, replyTo?._id || null)
        : await messagesAPI.send(user._id, selectedThread.data._id, text, image, replyTo?._id || null);

      setMessages((prev) => [...prev, saved]);
      const threadKey = getConversationKey(selectedThread);
      setLastMessages((prev) => ({ ...prev, [threadKey]: saved }));

      socketRef.current?.emit('send_message', {
        ...saved,
        receiverId: selectedThread.type === 'user' ? selectedThread.data._id : null,
        groupId: selectedThread.type === 'group' ? selectedThread.data._id : null,
      });

      socketRef.current?.emit('stop_typing', {
        senderId: user._id,
        receiverId: selectedThread.type === 'user' ? selectedThread.data._id : null,
        groupId: selectedThread.type === 'group' ? selectedThread.data._id : null,
      });
    } catch (error) {
      console.error(error);
    }
  }, [user._id, selectedThread]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await messagesAPI.delete(messageId, user._id);
      setMessages((prev) => prev.filter((message) => message._id !== messageId));

      socketRef.current?.emit('delete_message', {
        messageId,
        senderId: user._id,
        receiverId: selectedThread?.type === 'user' ? selectedThread.data._id : null,
        groupId: selectedThread?.type === 'group' ? selectedThread.data._id : null,
      });
    } catch (error) {
      console.error(error);
    }
  }, [user._id, selectedThread]);

  const handleReactMessage = useCallback(async (message, emoji) => {
    try {
      const updated = await messagesAPI.react(message._id, user._id, emoji);
      setMessages((prev) => prev.map((entry) => (entry._id === updated._id ? updated : entry)));

      socketRef.current?.emit('message_reaction', {
        messageId: message._id,
        userId: user._id,
        emoji,
      });
    } catch (error) {
      console.error(error);
    }
  }, [user._id]);

  const handleTyping = useCallback(() => {
    if (!selectedThread || selectedThread.type !== 'user') return;
    socketRef.current?.emit('typing', { senderId: user._id, receiverId: selectedThread.data._id });
  }, [user._id, selectedThread]);

  const handleStopTyping = useCallback(() => {
    if (!selectedThread || selectedThread.type !== 'user') return;
    socketRef.current?.emit('stop_typing', { senderId: user._id, receiverId: selectedThread.data._id });
  }, [user._id, selectedThread]);

  return (
    <div className="chat-layout">
      <UsersList
        users={users}
        groups={groups}
        currentUser={user}
        selectedThread={selectedThread}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        unreadCounts={unreadCounts}
        lastMessages={lastMessages}
        onSelectUser={handleSelectUser}
        onSelectGroup={handleSelectGroup}
        loading={loadingUsers}
      />
      <ChatWindow
        currentUser={user}
        selectedThread={selectedThread}
        messages={messages}
        loading={loadingMessages}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onReactMessage={handleReactMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
}
