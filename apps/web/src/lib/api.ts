import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const api = axios.create({ baseURL });

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: { message: string; code: string } }>) => {
    const message =
      err.response?.data?.error?.message ?? err.message ?? 'Network error';
    return Promise.reject(new Error(message));
  },
);
