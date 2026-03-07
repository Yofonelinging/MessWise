export const BASE_URL = "http://localhost:5000"; // your backend port

export const API_PATHS = {

  AUTH: {
    REGISTER:    "/api/auth/register",
    LOGIN:       "/api/auth/login",
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