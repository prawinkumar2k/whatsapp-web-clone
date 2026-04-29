import { Server } from 'socket.io';
import { Group } from '../../models/Group.js';
import { Message } from '../../models/Message.js';
import { createCallSession, updateCallSessionStatus } from '../calls/calls.service.js';
import { setUserPresence } from '../users/users.service.js';

const toId = (value) => String(value?._id || value || '');

export function attachRealtime(httpServer, corsOptions) {
  const io = new Server(httpServer, {
    cors: corsOptions,
    maxHttpBufferSize: 10e6,
  });

  const connectedUsers = new Map();
  const getSocketId = (userId) => connectedUsers.get(String(userId));
  const emitPresence = () => io.emit('users_online', Array.from(connectedUsers.keys()));

  io.on('connection', (socket) => {
    socket.on('register', async (userId) => {
      const normalizedUserId = toId(userId);
      if (!normalizedUserId) return;

      connectedUsers.set(normalizedUserId, socket.id);
      emitPresence();
      await setUserPresence(normalizedUserId, true);
    });

    socket.on('send_message', async (payload) => {
      try {
        const senderId = toId(payload.senderId);
        const receiverId = toId(payload.receiverId);
        const groupId = toId(payload.groupId);
        const messageId = toId(payload._id);

        if (groupId) {
          const group = await Group.findById(groupId).select('members');
          const recipients = group?.members?.map(toId).filter(Boolean) || [];
          const onlineRecipients = recipients
            .map((memberId) => getSocketId(memberId))
            .filter(Boolean);

          if (onlineRecipients.length > 0) {
            await Message.updateOne({ _id: messageId }, { $set: { status: 'delivered' } });
          }

          onlineRecipients.forEach((socketId) => {
            io.to(socketId).emit('receive_message', payload);
          });

          const senderSocketId = getSocketId(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_delivered', { messageId, receiverId: groupId });
          }

          return;
        }

        const receiverSocketId = getSocketId(receiverId);
        const senderSocketId = getSocketId(senderId);

        if (receiverSocketId) {
          await Message.updateOne({ _id: messageId }, { $set: { status: 'delivered' } });
          io.to(receiverSocketId).emit('receive_message', payload);

          if (senderSocketId) {
            io.to(senderSocketId).emit('message_delivered', {
              messageId,
              receiverId,
            });
          }
        }
      } catch (error) {
        console.error('Failed to forward message:', error);
      }
    });

    socket.on('typing', ({ senderId, receiverId, groupId }) => {
      if (groupId) return;
      const socketId = getSocketId(receiverId);
      if (socketId) {
        io.to(socketId).emit('user_typing', { senderId: toId(senderId) });
      }
    });

    socket.on('stop_typing', ({ senderId, receiverId, groupId }) => {
      if (groupId) return;
      const socketId = getSocketId(receiverId);
      if (socketId) {
        io.to(socketId).emit('user_stop_typing', { senderId: toId(senderId) });
      }
    });

    socket.on('messages_read', async ({ readerId, senderId, groupId }) => {
      try {
        if (groupId) return;

        await Message.updateMany(
          { senderId, receiverId: readerId, status: { $ne: 'read' } },
          { $set: { status: 'read' } }
        );

        const socketId = getSocketId(senderId);
        if (socketId) {
          io.to(socketId).emit('messages_read', { by: toId(readerId) });
        }
      } catch (error) {
        console.error('Failed to process read receipt:', error);
      }
    });

    socket.on('delete_message', async ({ messageId, senderId, receiverId, groupId }) => {
      try {
        const senderSocketId = getSocketId(senderId);

        if (groupId) {
          const group = await Group.findById(groupId).select('members');
          const recipients = group?.members?.map(toId).filter(Boolean) || [];

          recipients.forEach((memberId) => {
            const socketId = getSocketId(memberId);
            if (socketId) {
              io.to(socketId).emit('message_deleted', { messageId });
            }
          });

          if (senderSocketId) {
            io.to(senderSocketId).emit('message_deleted', { messageId });
          }
          return;
        }

        const receiverSocketId = getSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message_deleted', { messageId });
        }

        if (senderSocketId) {
          io.to(senderSocketId).emit('message_deleted', { messageId });
        }
      } catch (error) {
        console.error('Failed to broadcast message deletion:', error);
      }
    });

    socket.on('message_reaction', async ({ messageId, userId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const targets = new Set([toId(message.senderId), toId(message.receiverId)]);
        if (message.groupId) {
          const group = await Group.findById(message.groupId).select('members');
          group?.members?.forEach((memberId) => targets.add(toId(memberId)));
        }

        targets.delete(toId(userId));
        targets.forEach((targetId) => {
          const socketId = getSocketId(targetId);
          if (socketId) {
            io.to(socketId).emit('message_reacted', { messageId, userId: toId(userId), emoji });
          }
        });
      } catch (error) {
        console.error('Failed to broadcast reaction:', error);
      }
    });

    socket.on('call_request', async ({ initiatorId, receiverId, callType }) => {
      const session = await createCallSession({ initiatorId, receiverId, callType });
      const socketId = getSocketId(receiverId);
      if (socketId) {
        io.to(socketId).emit('incoming_call', session);
      }
      const initiatorSocketId = getSocketId(initiatorId);
      if (initiatorSocketId) {
        io.to(initiatorSocketId).emit('call_status', { callId: String(session._id), status: 'ringing' });
      }
    });

    socket.on('call_accept', async ({ callId, userId }) => {
      const session = await updateCallSessionStatus(callId, 'accepted');
      const socketId = getSocketId(session?.initiatorId);
      if (socketId) {
        io.to(socketId).emit('call_status', { callId: String(callId), status: 'accepted', userId: toId(userId) });
      }
    });

    socket.on('call_reject', async ({ callId, userId }) => {
      const session = await updateCallSessionStatus(callId, 'rejected');
      const socketId = getSocketId(session?.initiatorId);
      if (socketId) {
        io.to(socketId).emit('call_status', { callId: String(callId), status: 'rejected', userId: toId(userId) });
      }
    });

    socket.on('call_end', async ({ callId }) => {
      await updateCallSessionStatus(callId, 'ended');
    });

    socket.on('disconnect', async () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          await setUserPresence(userId, false);
          break;
        }
      }

      emitPresence();
    });
  });

  return io;
}
