export const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000";

export const API_PATHS = {
  AUTH: {
    REGISTER:    "/api/auth/register",
    LOGIN:       "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    ADMIN_LOGIN: "/api/auth/admin/login",
  },
  MENU: {
    POST:      "/api/menu",
    GET_TODAY: "/api/menu/today",
  },
  MEAL_DATA: {
    POST: "/api/meal-data",
  },
  MEALS: {
    GET_ALL:   "/api/meals",
    GET_TODAY: "/api/meals/today",
  },
  ANALYTICS: {
    GET: "/api/analytics",
  },
  RATINGS: {
    POST: "/api/rating",
    GET:  "/api/ratings",
  },
};