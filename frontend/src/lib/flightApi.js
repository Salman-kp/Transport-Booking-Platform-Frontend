import { api } from './axios';

export const flightApi = {
  searchFlights: async (params) => {
    const { data } = await api.get('/flights/search', { params });
    return data?.data || data?.flights || [];
  },

  searchAirports: async (search) => {
    const { data } = await api.get('/flights/airports', {
      params: { search },
    });
    return data?.data || [];
  },

  getAirlines: async () => {
    const { data } = await api.get('/flights/airlines');
    return data?.data || [];
  },

  getFlightDetails: async (instanceId) => {
    const { data } = await api.get(`/flights/${instanceId}`);
    return data?.data || data;
  },

  getFares: async (instanceId) => {
    const { data } = await api.get(`/flights/${instanceId}/fares`);
    return data?.data || data?.fares || [];
  },

  getSeats: async (instanceId) => {
    const { data } = await api.get(`/flights/${instanceId}/seats`);
    return data?.data || data;
  },

  getAncillaries: async (instanceId) => {
    const { data } = await api.get(`/flights/${instanceId}/ancillaries`);
    return data?.data || [];
  },

  getFarePrediction: async (instanceId) => {
    const { data } = await api.get(`/flights/${instanceId}/fare-prediction`);
    return data;
  },

  createBooking: async (bookingData) => {
    const { data } = await api.post('/flights/bookings', bookingData);
    return data;
  },

  getBookingById: async (bookingId) => {
    const { data } = await api.get(`/flights/bookings/${bookingId}`);
    return data;
  },

  getBookingByPnr: async (pnr) => {
    const { data } = await api.get(`/flights/bookings/pnr/${pnr}`);
    return data;
  },

  confirmBooking: async (bookingId) => {
    const { data } = await api.post(`/flights/bookings/${bookingId}/confirm`);
    return data;
  },

  cancelBooking: async (bookingId, reason) => {
    const { data } = await api.post(`/flights/bookings/${bookingId}/cancel`, { reason });
    return data;
  },

  getBookingHistory: async () => {
    const { data } = await api.get('/flights/bookings/user/history');
    return data;
  },

  getETicket: async (bookingId) => {
    const { data } = await api.get(`/flights/bookings/${bookingId}/ticket`);
    return data;
  },

  getFlightStatus: async (pnr) => {
    const { data } = await api.get(`/flights/status/${pnr}`);
    return data?.data || data;
  },

  // Admin Endpoints
  admin: {
    getAllBookings: async () => {
      const { data } = await api.get('/flights/admin/bookings');
      return data?.bookings || [];
    },
    updateBookingStatus: async (bookingId, status) => {
      const { data } = await api.put(`/flights/admin/bookings/${bookingId}/status`, { status });
      return data;
    },
    createFlight: async (flightData) => {
      const { data } = await api.post('/flights/admin/flights', flightData);
      return data;
    },
    updateFlight: async (flightId, updates) => {
      const { data } = await api.put(`/flights/admin/flights/${flightId}`, updates);
      return data;
    },
    deleteFlight: async (flightId) => {
      const { data } = await api.delete(`/flights/admin/flights/${flightId}`);
      return data;
    },
    updateFares: async (instanceId, economyPrice, businessPrice) => {
      const { data } = await api.patch(`/flights/admin/flights/${instanceId}/fares`, { 
        economy_price: economyPrice, 
        business_price: businessPrice 
      });
      return data;
    },
  },
};
