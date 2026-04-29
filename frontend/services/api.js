import axios from 'axios';
import { API_BASE_URL } from '../lib/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const usersAPI = {
  createOrFind: async (username) => (await api.post('/api/users', { username })).data,
  getAll: async () => (await api.get('/api/users')).data,
};

export const messagesAPI = {
  send: async (senderId, receiverId, text, image = null, replyTo = null) =>
    (await api.post('/api/messages', { senderId, receiverId, text, image, replyTo })).data,

  sendToGroup: async (senderId, groupId, text, image = null, replyTo = null) =>
    (await api.post('/api/messages', { senderId, groupId, text, image, replyTo })).data,

  get: async (senderId, receiverId) =>
    (await api.get(`/api/messages/${senderId}/${receiverId}`)).data,

  getGroup: async (groupId) =>
    (await api.get(`/api/messages/group/${groupId}`)).data,

  delete: async (messageId, userId) =>
    (await api.delete(`/api/messages/${messageId}`, { data: { userId } })).data,

  markRead: async (senderId, receiverId) =>
    (await api.post('/api/messages/read', { senderId, receiverId })).data,

  react: async (messageId, userId, emoji) =>
    (await api.patch(`/api/messages/${messageId}/reactions`, { userId, emoji })).data,
};

export const statusesAPI = {
  getActive: async () => (await api.get('/api/statuses')).data,
  create: async (userId, mediaUrl, caption = '') =>
    (await api.post('/api/statuses', { userId, mediaUrl, caption })).data,
  view: async (statusId, viewerId) =>
    (await api.post(`/api/statuses/${statusId}/view`, { viewerId })).data,
};

export const groupsAPI = {
  getAll: async (memberId) => (await api.get('/api/groups', { params: { memberId } })).data,
  create: async ({ name, members, admin, description = '' }) =>
    (await api.post('/api/groups', { name, members, admin, description })).data,
  updateMembers: async (groupId, add = [], remove = []) =>
    (await api.patch(`/api/groups/${groupId}/members`, { add, remove })).data,
};

export const callsAPI = {
  getAll: async (userId) => (await api.get('/api/calls', { params: { userId } })).data,
  create: async ({ initiatorId, receiverId, callType = 'audio' }) =>
    (await api.post('/api/calls', { initiatorId, receiverId, callType })).data,
  update: async (callId, status) =>
    (await api.patch(`/api/calls/${callId}`, { status })).data,
};

export default api;
