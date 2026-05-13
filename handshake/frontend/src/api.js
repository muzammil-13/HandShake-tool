import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handshake endpoints
export const fetchHandshakes = async () => {
  const response = await api.get('/handshakes');
  return response.data;
};

export const fetchHandshake = async (id) => {
  const response = await api.get(`/handshakes/${id}`);
  return response.data;
};

export const createHandshake = async (data) => {
  const response = await api.post('/handshakes', data);
  return response.data;
};

export const updateHandshake = async (id, data) => {
  const response = await api.put(`/handshakes/${id}`, data);
  return response.data;
};

export const deleteHandshake = async (id) => {
  const response = await api.delete(`/handshakes/${id}`);
  return response.data;
};

// Commitment endpoints
export const fetchCommitments = async (handshakeId) => {
  const response = await api.get(`/handshakes/${handshakeId}/commitments`);
  return response.data;
};

export const createCommitment = async (handshakeId, data) => {
  const response = await api.post(`/handshakes/${handshakeId}/commitments`, data);
  return response.data;
};

export const updateCommitment = async (handshakeId, commitmentId, data) => {
  const response = await api.put(`/handshakes/${handshakeId}/commitments/${commitmentId}`, data);
  return response.data;
};

export const deleteCommitment = async (handshakeId, commitmentId) => {
  const response = await api.delete(`/handshakes/${handshakeId}/commitments/${commitmentId}`);
  return response.data;
};

export default api;
