import { api } from './axios';

export const busApi = {
  // ── Public Endpoints ────────────────────────────────────────────────────────

  searchBuses: async (params) => {
    const { data } = await api.get('/buses/search', { params });
    return data?.data || data?.buses || [];
  },

  getBusStops: async (search) => {
    const { data } = await api.get('/buses/bus-stops', { params: { search } });
    return data?.data || [];
  },

  getOperators: async () => {
    const { data } = await api.get('/buses/operators');
    return data?.data || [];
  },

  getBusDetails: async (instanceId) => {
    const { data } = await api.get(`/buses/${instanceId}`);
    return data?.data || data;
  },

  getFares: async (instanceId) => {
    const { data } = await api.get(`/buses/${instanceId}/fares`);
    return data?.data || data?.fares || [];
  },

  getSeats: async (instanceId) => {
    const { data } = await api.get(`/buses/${instanceId}/seats`);
    return data?.data || data;
  },

  getAmenities: async (instanceId) => {
    const { data } = await api.get(`/buses/${instanceId}/amenities`);
    return data?.data || data;
  },

  getBoardingPoints: async (instanceId) => {
    const { data } = await api.get(`/buses/${instanceId}/boarding-points`);
    return data?.data || data;
  },

  getDroppingPoints: async (instanceId) => {
    const { data } = await api.get(`/buses/${instanceId}/dropping-points`);
    return data?.data || data;
  },

  getRoute: async (instanceId) => {
    const { data } = await api.get(`/buses/${instanceId}/route`);
    return data?.data || data;
  },

  // ── Private Endpoints (Bookings) ────────────────────────────────────────────

  createBooking: async (bookingData) => {
    const { data } = await api.post('/buses/bookings', bookingData);
    return data?.data || data;
  },

  getBookingById: async (bookingId) => {
    const { data } = await api.get(`/buses/bookings/${bookingId}`);
    return data?.data || data;
  },

  getBookingByPnr: async (pnr) => {
    const { data } = await api.get(`/buses/bookings/pnr/${pnr}`);
    return data?.data || data;
  },

  confirmBooking: async (bookingId) => {
    // This initiates the payment flow and returns the Stripe client secret
    const { data } = await api.post(`/buses/bookings/${bookingId}/confirm`);
    return data?.data || data;
  },

  cancelBooking: async (bookingId, reason) => {
    const { data } = await api.post(`/buses/bookings/${bookingId}/cancel`, { reason });
    return data?.data || data;
  },

  getBookingHistory: async () => {
    const { data } = await api.get('/buses/bookings/user/history');
    return data?.data || data;
  },

  getTicket: async (bookingId) => {
    const { data } = await api.get(`/buses/bookings/${bookingId}/ticket`);
    return data?.data || data;
  },

  // ── Admin Endpoints ────────────────────────────────────────────────────────

  admin: {
    // Analytics & Bookings
    getRevenueAnalytics: async () => {
      const { data } = await api.get('/buses/admin/analytics/revenue');
      return data;
    },
    getOperatorAnalytics: async () => {
      const { data } = await api.get('/buses/admin/analytics/operators');
      return data;
    },
    getUpcomingTrips: async (limit = 100) => {
      const { data } = await api.get('/buses/admin/analytics/upcoming', { params: { limit } });
      return data;
    },
    getBookings: async (page = 1, limit = 20) => {
      const { data } = await api.get('/buses/admin/bookings', { params: { page, limit } });
      return data;
    },

    // Bus Instance Management
    deleteInstance: async (id) => {
      if (!id) throw new Error("Instance ID is required");
      console.log(`API Call: DELETE /buses/admin/instances/${id}`);
      const { data } = await api.delete(`/buses/admin/instances/${id}`);
      return data;
    },
    updateInstanceStatus: async (id, status) => {
      const { data } = await api.put(`/buses/admin/instances/${id}/status`, { status });
      return data;
    },

    // Bus Templates (Routes)
    getBuses: async () => {
      const { data } = await api.get('/buses/admin/buses');
      return data;
    },
    createBus: async (payload) => {
      const { data } = await api.post('/buses/admin/buses', payload);
      return data;
    },
    updateBus: async (id, payload) => {
      const { data } = await api.put(`/buses/admin/buses/${id}`, payload);
      return data;
    },

    // Bus Stops
    getBusStops: async () => {
      const { data } = await api.get('/buses/admin/bus-stops');
      return data;
    },
    createBusStop: async (payload) => {
      const { data } = await api.post('/buses/admin/bus-stops', payload);
      return data;
    },

    // Bus Types
    getBusTypes: async () => {
      const { data } = await api.get('/buses/admin/bus-types');
      return data;
    },
    createBusType: async (payload) => {
      const { data } = await api.post('/buses/admin/bus-types', payload);
      return data;
    },

    // Operators (Admin Management)
    getOperators: async () => {
      const { data } = await api.get('/buses/admin/operators');
      return data;
    },
    createOperator: async (payload) => {
      const { data } = await api.post('/buses/admin/operators', payload);
      return data;
    },
    approveOperator: async (id) => {
      const { data } = await api.put(`/buses/admin/operators/${id}/approve`);
      return data;
    },
    suspendOperator: async (id) => {
      const { data } = await api.put(`/buses/admin/operators/${id}/suspend`);
      return data;
    },
    updateOperatorAction: async (id, action) => {
      const { data } = await api.put(`/buses/admin/operators/${id}/${action}`);
      return data;
    },

    // Pricing Rules
    getPricingRules: async () => {
      const { data } = await api.get('/buses/admin/pricing-rules');
      return data;
    },
    createPricingRule: async (payload) => {
      const { data } = await api.post('/buses/admin/pricing-rules', payload);
      return data;
    },
    updatePricingRule: async (id, updates) => {
      const { data } = await api.put(`/buses/admin/pricing-rules/${id}`, updates);
      return data;
    },

    // Cancellation Policies
    getCancellationPolicies: async () => {
      const { data } = await api.get('/buses/admin/cancellation-policies');
      return data;
    },
    createCancellationPolicy: async (payload) => {
      const { data } = await api.post('/buses/admin/cancellation-policies', payload);
      return data;
    },
    updateCancellationPolicy: async (id, updates) => {
      const { data } = await api.put(`/buses/admin/cancellation-policies/${id}`, updates);
      return data;
    },
  },

  // ── Operator Portal Endpoints ───────────────────────────────────────────────
  // These are for authenticated operators managing their own fleet.

  operator: {
    registerOperator: async (payload) => {
      const { data } = await api.post('/buses/operators/register', payload);
      return data;
    },
    getProfile: async () => {
      const { data } = await api.get('/buses/operators/profile');
      return data?.data || data;
    },
    getInventory: async () => {
      const { data } = await api.get('/buses/operators/inventory');
      return data?.data || data;
    },
    loadInventory: async (payload) => {
      const { data } = await api.post('/buses/operators/inventory/load', payload);
      return data?.data || data;
    },
    getInventoryBookings: async (inventoryId) => {
      const { data } = await api.get(`/buses/operators/inventory/${inventoryId}/bookings`);
      return data?.data || data;
    },
    getAnalytics: async () => {
      const { data } = await api.get('/buses/operators/analytics');
      return data?.data || data;
    },
  },
};
