import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const getDirectory = () => api.get('/auth/directory');
export const getUserDetails = (id) => api.get(`/auth/users/${id}`);
export const savePushToken = (expoPushToken) => api.put('/auth/push-token', { expoPushToken });

// Identity Recovery Endpoints
export const forgotPasswordResident = (data) => api.post('/auth/forgot-password-resident', data);
export const forgotPasswordAdmin = (data) => api.post('/auth/forgot-password-admin', data);
export const getPasswordRequests = () => api.get('/auth/password-requests');
export const approvePassword = (userId) => api.post(`/auth/approve-password/${userId}`);

// Profile Edit Requests
export const requestProfileEdit = (data) => api.post('/auth/request-profile-edit', data);
export const getProfileRequests = () => api.get('/auth/profile-requests');
export const getProfileHistory = () => api.get('/auth/profile-history');
export const approveProfileRequest = (userId, action) => api.post(`/auth/approve-profile/${userId}`, { action });

export const getNotices = () => api.get('/notices');
export const getNotice = (id) => api.get(`/notices/${id}`);
export const postNotice = (data) => api.post('/notices', data);
export const updateNotice = (id, data) => api.put(`/notices/${id}`, data);
export const deleteNotice = (id) => api.delete(`/notices/${id}`);
export const bookmarkNotice = (id) => api.post(`/notices/${id}/bookmark`);
export const getTrashNotices = () => api.get('/notices/trash');
export const restoreTrashNotice = (id) => api.put(`/notices/trash/${id}/restore`);
export const deleteTrashNotice = (id) => api.delete(`/notices/trash/${id}/permanent`);
export const acknowledgeNotice = (id) => api.post(`/notices/${id}/acknowledge`);
export const getAckList = (id) => api.get(`/notices/${id}/ack-list`);
export const castVote = (noticeId, optionId) => api.post(`/notices/${noticeId}/vote`, { optionId });
export const postComment = (noticeId, text) => api.post(`/notices/${noticeId}/comment`, { text });

// Complaint / Ticketing Features
export const getComplaints = () => api.get('/complaints');
export const postComplaint = (data) => api.post('/complaints', data);
export const updateComplaint = (id, data) => api.put(`/complaints/${id}`, data);

// Security Features
export const triggerSOS = () => api.post('/notices/sos');
export const getVisitors = () => api.get('/visitors');
export const postVisitor = (data) => api.post('/visitors', data);

// Helpline Features
export const getHelplines = () => api.get('/helplines');
export const postHelpline = (data) => api.post('/helplines', data);
export const updateHelpline = (id, data) => api.put(`/helplines/${id}`, data);
export const deleteHelpline = (id) => api.delete(`/helplines/${id}`);
export const resetHelplines = () => api.post('/helplines/reset');

export default api;