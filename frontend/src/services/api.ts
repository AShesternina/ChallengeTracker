import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refresh,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  registerEmail: (email: string, password: string, timezone: string) =>
    api.post("/auth/register/email", { email, password, timezone }),
  registerPhone: (phone: string, timezone: string) =>
    api.post("/auth/register/phone", { phone, timezone }),
  verifyOtp: (phone: string, otp: string) =>
    api.post("/auth/verify/otp", { phone, otp }),
  loginEmail: (email: string, password: string) =>
    api.post("/auth/login/email", { email, password }),
};

// --- User ---
export const userApi = {
  me: () => api.get("/users/me"),
  update: (data: { timezone?: string }) => api.patch("/users/me", data),
};

// --- Daily ---
export const dailyApi = {
  today: (date?: string) =>
    api.get("/daily/today", { params: date ? { target_date: date } : {} }),
  complete: (taskId: number) => api.post(`/tasks/${taskId}/complete`),
  skip: (taskId: number) => api.post(`/tasks/${taskId}/skip`),
  reset: (taskId: number) => api.post(`/tasks/${taskId}/reset`),
};

// --- Challenges ---
export const challengesApi = {
  templates: () => api.get("/challenges/templates"),
  create: (data: unknown) => api.post("/challenges", data),
  start: (challenge_id: number, start_date: string) =>
    api.post("/challenges/start", { challenge_id, start_date }),
  my: () => api.get("/challenges/my"),
  getInstance: (instanceId: number) => api.get(`/challenges/instances/${instanceId}`),
  updateInstance: (instanceId: number, data: unknown) => api.patch(`/challenges/instances/${instanceId}`, data),
  cancel: (instanceId: number) => api.delete(`/challenges/instances/${instanceId}`),
};

// --- Reports ---
export const reportsApi = {
  daily: (date: string) => api.get(`/reports/daily/${date}`),
  monthly: (year: number, month: number) => api.get(`/reports/monthly/${year}/${month}`),
  challenge: (instanceId: number) => api.get(`/reports/challenge/${instanceId}`),
  streak: () => api.get("/reports/streak"),
};

// --- Notifications ---
export const notificationsApi = {
  vapidKey: () => api.get("/notifications/vapid-public-key"),
  subscribe: (subscription: Record<string, unknown>, userAgent: string) =>
    api.post("/notifications/subscribe", { ...subscription, user_agent: userAgent }),
  devices: () => api.get("/notifications/devices"),
  unsubscribe: (deviceId: number) => api.delete(`/notifications/devices/${deviceId}`),
};
