import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for "Repair Everything" - Detailed Logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : 'NETWORK_ERROR';
    const message = error.response?.data?.message || error.message;
    console.warn(`[API ERROR] ${status}: ${message}`);
    
    if (status === 401) {
      console.warn(`[AUTH ERROR] 401 Unauthorized on ${error.config?.url}. The session will NOT be cleared automatically.`);
      // Removed automatic clearing as per user request to prevent "logout loops"
    }
    return Promise.reject(error);
  }
);

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
export const getSocieties = () => api.get('/auth/societies');

// Admin Approval Features
export const getPendingResidents = () => api.get('/auth/pending-residents');
export const approveResident = (id) => api.post(`/auth/approve-resident/${id}`);
export const rejectResident = (id) => api.post(`/auth/reject-resident/${id}`);

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

// Support Ticket Features
export const contactSupport = (message) => api.post('/developer/contact-support', { message });
export const getDevSocieties = () => api.get('/developer/societies');
export const addSociety = (data) => api.post('/developer/societies', data);
export const deleteSociety = (id) => api.delete(`/developer/societies/${id}`);
export const getSupportTickets = () => api.get('/developer/support-tickets');
export const updateTicketStatus = (id, status) => api.put(`/developer/support-tickets/${id}`, { status });
export const devSwitchContext = (role, societyName) => api.put('/developer/switch-context', { role, societyName });

export default api;