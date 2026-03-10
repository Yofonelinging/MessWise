export const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    ADMIN_LOGIN: "/api/auth/admin/login",
  },
  MENU: {
    POST: "/api/menu",
    GET_TODAY: "/api/menu/today",
    GET_ALL: "/api/menu",
  },
  MEAL_DATA: {
    POST: "/api/meal-data",
  },
  MEALS: {
    GET_ALL: "/api/meals",
    GET_TODAY: "/api/meals/today",
  },
  ANALYTICS: {
    GET: "/api/analytics",
    GET_SUMMARY: "/api/analytics/summary",
  },
  RATINGS: {
    POST: "/api/rating",
    GET: "/api/ratings",
  },
  FEEDBACK: {
    POST: "/api/feedback",
    GET_ALL: "/api/feedback",
  },
  PREDICTION: {
    TOMORROW: "/api/prediction/tomorrow",
    WEEK: "/api/prediction/week",
    ATTENDANCE_POST: "/api/prediction/attendance",
    ATTENDANCE_GET: "/api/prediction/attendance",
    CALENDAR_POST: "/api/prediction/calendar",
    CALENDAR_GET: "/api/prediction/calendar",
  },
  FATIGUE: {
    SCORES: "/api/fatigue/scores",
    SUGGESTIONS: "/api/fatigue/suggestions",
  },
  NUTRITION: {
    PROFILE_GET: "/api/nutrition/profile",
    PROFILE_PUT: "/api/nutrition/profile",
    INSIGHTS: "/api/nutrition/insights",
    DISTRIBUTION: "/api/nutrition/distribution",
  },
  DECISIONS: {
    ACTIONS: "/api/decisions/actions",
  },
  GAMIFICATION: {
    PROFILE: "/api/gamification/profile",
    AWARD: "/api/gamification/award",
    LEADERBOARD: "/api/gamification/leaderboard",
    CAMPUS_STATS: "/api/gamification/campus-stats",
  },
  WASTE_INTEL: {
    CLASSIFY: "/api/waste-intel/classify",
    INSIGHTS: "/api/waste-intel/insights",
    TREND: "/api/waste-intel/trend",
  },
  SUPPLY_CHAIN: {
    FEEDBACK: "/api/supply-chain/feedback",
    INSIGHTS: "/api/supply-chain/insights",
  },
};