import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function resolvePublicAssetUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; username: string; role: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  telegramAuth: (data: Record<string, string>) =>
    api.post('/auth/telegram', data),
};

// Tasks
export const tasksApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/tasks', { params }),
  getById: (id: string) =>
    api.get(`/tasks/${id}`),
  create: (data: {
    title: string;
    description: string;
    instructions?: string;
    pricePerExecution: number;
    totalBudget: number;
    verificationType: string;
    controlQuestion?: string;
    controlAnswer?: string;
    imageUrls?: string[];
  }) =>
    api.post('/tasks', data),
  getMy: () =>
    api.get('/tasks/my'),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tasks/${id}/status`, { status }),
  getAvailable: (params?: Record<string, string | number>) =>
    api.get('/tasks/available', { params }),
};

// Submissions
export const submissionsApi = {
  create: async (taskId: string, data: { proofFile?: File | null; answerText?: string }) => {
    let proofImageUrl: string | undefined;
    if (data.proofFile) {
      const formData = new FormData();
      formData.append('file', data.proofFile);
      const { data: up } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      proofImageUrl = typeof up?.url === 'string' ? up.url : undefined;
    }
    return api.post('/submissions', {
      taskId: Number(taskId),
      proofImageUrl,
      answerText: data.answerText || undefined,
    });
  },
  getByTask: (taskId: string) =>
    api.get(`/submissions/task/${taskId}`),
  getMy: () =>
    api.get('/submissions/my'),
  review: (id: string, data: { status: string }) =>
    api.patch(`/submissions/${id}/review`, { approved: data.status === 'approved' }),
};

// Wallet
export const walletApi = {
  getBalance: () =>
    api.get('/wallet/balance'),
  getTransactions: (params?: Record<string, string | number>) =>
    api.get('/wallet/transactions', { params }),
  withdraw: (data: { amount: number; method: string; details: string }) =>
    api.post('/wallet/withdraw', { amount: data.amount }),
};

// Payments
export const paymentsApi = {
  createPayment: (data: { amount: number }) =>
    api.post('/payments/create', data),
};

// Uploads
export const uploadsApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// User
export const userApi = {
  getProfile: () =>
    api.get('/users/me'),
  updateProfile: (data: Record<string, string>) =>
    api.patch('/users/me', data),
};

export default api;
