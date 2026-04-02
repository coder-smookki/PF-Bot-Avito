import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  const username = localStorage.getItem('admin_username');
  const password = localStorage.getItem('admin_password');
  if (username && password) {
    config.headers.Authorization =
      'Basic ' + btoa(`${username}:${password}`);
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_username');
      localStorage.removeItem('admin_password');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// Auth
export async function login(username: string, password: string) {
  localStorage.setItem('admin_username', username);
  localStorage.setItem('admin_password', password);
  const res = await client.get('/admin/stats');
  return res.data;
}

// Stats
export async function getStats() {
  const res = await client.get('/admin/stats');
  return res.data;
}

export async function getFinanceStats() {
  const res = await client.get('/admin/finance/stats');
  return res.data;
}

// Users
export async function getUsers(params?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const res = await client.get('/admin/users', { params });
  return res.data;
}

export async function banUser(id: number) {
  const res = await client.post(`/admin/users/${id}/ban`);
  return res.data;
}

export async function unbanUser(id: number) {
  const res = await client.post(`/admin/users/${id}/unban`);
  return res.data;
}

// Tasks
export async function getTasks(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const res = await client.get('/admin/tasks', { params });
  return res.data;
}

// Commission
export async function getCommission() {
  const res = await client.get('/admin/commission');
  return res.data;
}

export async function setCommission(amount: number) {
  const res = await client.post('/admin/commission', { amount });
  return res.data;
}

// Withdrawals
export async function getPendingWithdrawals() {
  const res = await client.get('/admin/withdrawals/pending');
  return res.data;
}

export async function processWithdrawal(id: number, approved: boolean) {
  const res = await client.post(`/admin/withdrawals/${id}/process`, { approved });
  return res.data;
}

// Broadcasts
export async function getBroadcasts() {
  const res = await client.get('/admin/broadcasts');
  return res.data;
}

export async function sendBroadcast(target: string, message: string) {
  const res = await client.post('/admin/broadcasts', { target, message });
  return res.data;
}

export default client;
