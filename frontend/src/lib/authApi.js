import { api } from './axios';

export const authApi = {
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  verifyOtp: async (payload) => {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
  },

  login: async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },

  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  admin: {
    listUsers: async () => {
      const { data } = await api.get('/auth/admin/users');
      return data?.users || [];
    },
    assignRole: async (payload) => {
      const { data } = await api.post('/auth/admin/assign-role', payload);
      return data;
    },
  },
};
