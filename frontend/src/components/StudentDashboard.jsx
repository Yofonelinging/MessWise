import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPath";

// ── Config ─────────────────────────────────────────────────
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];

const TYPE_CONFIG = {
  Breakfast: {
    icon: "🌅",
    time: "7:30 – 9:00 AM",
    accent: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  Lunch: {
    icon: "☀️",
    time: "12:30 – 2:00 PM",
    accent: "#059669",
    bg: "#f0fdf4",
    border: "#a7f3d0",
  },
  Dinner: {
    icon: "🌙",
    time: "7:30 – 9:00 PM",
    accent: "#4f46e5",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
};

const DEFAULT_DISHES = ["Rice", "Dal", "Paneer Curry", "Chapati"];

// ── Sub-components ─────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
    <span className="w-1 h-4 rounded-full bg-black inline-block shrink-0" />
    {children}
  </h2>
);

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => onChange(star)}
        className="text-xl leading-none transition-transform hover:scale-125 focus:outline-none"
      >
        <span style={{ color: star <= value ? "#f59e0b" : "#e5e7eb" }}>★</span>
      </button>
    ))}
  </div>
);

const GaugeBar = ({ percent, color }) => (
  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
    <div
      className="h-2.5 rounded-full transition-all duration-700"
      style={{ width: `${Math.min(percent, 100)}%`, background: color }}
    />
  </div>
);

// Skeleton loader for menu cards
const MenuSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-20 bg-gray-100 rounded-full" />
          <div className="h-3 w-16 bg-gray-100 rounded-full" />
        </div>
        <div className="border-t border-gray-100" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((j) => (
            <div key={j} className="h-4 bg-gray-100 rounded-full" style={{ width: `${60 + j * 10}%` }} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ── Dietary Preferences (Phase 3) ─────────────────────────
const DIET_OPTIONS = ["veg", "non-veg", "vegan", "jain", "eggetarian"];
const CUISINE_OPTIONS = ["north", "south", "continental", "chinese", "no-preference"];

const PreferenceSection = () => {
  const [prefs, setPrefs] = useState({
    dietaryPreference: "veg",
    cuisinePreference: ["no-preference"],
    hostel: "",
    isAthlete: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}${API_PATHS.NUTRITION.PROFILE_GET}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.user) {
          setPrefs({
            dietaryPreference: res.data.user.dietaryPreference || "veg",
            cuisinePreference: res.data.user.cuisinePreference?.length ? res.data.user.cuisinePreference : ["no-preference"],
            hostel: res.data.user.hostel || "",
            isAthlete: res.data.user.isAthlete || false,
          });
        }
      } catch { /* silent */ }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}${API_PATHS.NUTRITION.PROFILE_PUT}`,
        prefs,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const toggleCuisine = (c) => {
    setPrefs(p => {
      let list = [...p.cuisinePreference];
      if (c === "no-preference") return { ...p, cuisinePreference: ["no-preference"] };
      list = list.filter(x => x !== "no-preference");
      if (list.includes(c)) list = list.filter(x => x !== c);
      else list.push(c);
      if (list.length === 0) list = ["no-preference"];
      return { ...p, cuisinePreference: list };
    });
  };

  return (
    <section>
      <SectionTitle>My Dietary Preferences</SectionTitle>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
        <p className="text-sm text-gray-500 -mt-1">Help us plan better menus by sharing your preferences.</p>

        {/* Diet Type */}
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Diet Type</p>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setPrefs(p => ({ ...p, dietaryPreference: opt }))}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition
                  ${prefs.dietaryPreference === opt ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine */}
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Cuisine Preference (select multiple)</p>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map(opt => (
              <button key={opt} onClick={() => toggleCuisine(opt)}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition
                  ${prefs.cuisinePreference.includes(opt) ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {opt.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Hostel + Athlete */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Hostel / Block</p>
            <input
              value={prefs.hostel}
              onChange={e => setPrefs(p => ({ ...p, hostel: e.target.value }))}
              placeholder="e.g. Block A"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full">
              <input type="checkbox" checked={prefs.isAthlete}
                onChange={e => setPrefs(p => ({ ...p, isAthlete: e.target.checked }))}
                className="w-4 h-4 accent-black" />
              <span className="text-sm font-semibold text-gray-700">I am an athlete (need extra protein)</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          {saved && <span className="text-sm font-bold text-emerald-600">✓ Saved!</span>}
        </div>
      </div>
    </section>
  );
};

// ── GreenPoints (Phase 5 Gamification) ────────────────────
const LEVEL_EMOJIS = ["🌱", "🌿", "🌳", "🌲", "🌻", "🌺", "🌍", "⭐", "🚀", "💎", "∞"];

const GreenPointsSection = () => {
  const [gp, setGp] = useState(null);
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}${API_PATHS.GAMIFICATION.PROFILE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGp(res.data);
      } catch { /* silent */ }
    };
    fetchProfile();
  }, []);

  const earnPoints = async (action, points, detail) => {
    setAwarding(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}${API_PATHS.GAMIFICATION.AWARD}`,
        { action, points, detail },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      // Refresh profile
      const profileRes = await axios.get(`${BASE_URL}${API_PATHS.GAMIFICATION.PROFILE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGp(profileRes.data);
    } catch { /* silent */ }
    finally { setAwarding(false); }
  };

  if (!gp) return null;

  return (
    <section>
      <SectionTitle>GreenPoints 🌿</SectionTitle>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
        {/* Level & Progress */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl shrink-0">
            {LEVEL_EMOJIS[gp.level - 1] || "🌟"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-800">Level {gp.level}: {gp.levelName}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{gp.points} pts</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-1.5 overflow-hidden">
              <div className="h-2.5 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${gp.progressPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{gp.nextLevelAt - gp.points} pts to next level</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-amber-600">🔥 {gp.streak}</p>
            <p className="text-xs text-amber-500 font-bold">Day Streak</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-emerald-600">🌍 {gp.totalCO2Saved}</p>
            <p className="text-xs text-emerald-500 font-bold">kg CO₂ Saved</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-blue-600">🍽️ {gp.totalFoodSaved}</p>
            <p className="text-xs text-blue-500 font-bold">kg Food Saved</p>
          </div>
        </div>

        {/* Badges */}
        {gp.earnedBadges?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Badges Earned</p>
            <div className="flex flex-wrap gap-2">
              {gp.earnedBadges.map(b => (
                <span key={b.id} className="bg-gray-100 px-3 py-1.5 rounded-full text-sm font-bold text-gray-700">
                  {b.icon} {b.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Earn Points</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button onClick={() => earnPoints("clean_plate", 10, "Clean Plate Pledge")} disabled={awarding}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition disabled:opacity-50">
              🍽️ Clean Plate (+10)
            </button>
            <button onClick={() => earnPoints("low_waste", 5, "Took less, wasted none")} disabled={awarding}
              className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition disabled:opacity-50">
              ♻️ Zero Waste (+5)
            </button>
            <button onClick={() => earnPoints("feedback", 3, "Gave meal feedback")} disabled={awarding}
              className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition disabled:opacity-50">
              ⭐ Feedback (+3)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Main Dashboard ─────────────────────────────────────────
const StudentDashboard = () => {
  const navigate = useNavigate();
  const studentName = localStorage.getItem("studentName") || "Student";

  // Menu state
  const [menu, setMenu] = useState({});      // { Breakfast: [...], Lunch: [...], Dinner: [...] }
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  // Derive rating dishes from fetched menu, fallback to defaults
  const rateDishes = useMemo(() => {
    const all = [...(menu.Breakfast || []), ...(menu.Lunch || []), ...(menu.Dinner || [])];
    return all.length > 0 ? [...new Set(all)] : DEFAULT_DISHES;
  }, [menu]);

  // Ratings & feedback
  const [ratings, setRatings] = useState({});
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ratingsSubmitted, setRatingsSubmitted] = useState(false);
  const [stats, setStats] = useState({ wasteKg: 0, wastePct: 0 });
  const MAX_CHARS = 200;

  const handleSubmitRatings = async () => {
    try {
      const token = localStorage.getItem("token");
      const localDate = new Date();
      const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;

      const promises = Object.entries(ratings)
        .filter(([dish, rating]) => rating > 0)
        .map(([dish, rating]) =>
          axios.post(
            `${BASE_URL}${API_PATHS.RATINGS.POST}`,
            { dish, rating, date: today },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );

      await Promise.all(promises);
      setRatingsSubmitted(true);
      setTimeout(() => setRatingsSubmitted(false), 3000);
    } catch (err) {
      console.error("Failed to submit ratings", err);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const localDate = new Date();
      const today = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
      await axios.post(
        `${BASE_URL}${API_PATHS.FEEDBACK.POST}`,
        { text: feedback, date: today },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  const ratedCount = Object.values(ratings).filter((r) => r > 0).length;
  const averageRating = ratedCount
    ? (Object.values(ratings).filter((r) => r > 0).reduce((a, b) => a + b, 0) / ratedCount).toFixed(1)
    : null;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ── Fetch today's menu from API ──────────────────────────
  useEffect(() => {
    const fetchMenu = async () => {
      setMenuLoading(true);
      setMenuError("");
      try {
        const token = localStorage.getItem("token");

        // GET /api/meals/today  →  expects array of meal objects
        // Each meal: { _id, type: "Breakfast"|"Lunch"|"Dinner", items: string[] | string, date }
        const res = await axios.get(
          `${BASE_URL}${API_PATHS.MENU.GET_TODAY}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const meals = res.data?.meals || res.data || [];

        // Group by type
        const grouped = { Breakfast: [], Lunch: [], Dinner: [] };
        meals.forEach((meal) => {
          const type = meal.type;
          if (!grouped[type]) return;

          // items can be an array or a comma-separated string
          const items = Array.isArray(meal.items)
            ? meal.items
            : typeof meal.items === "string"
              ? meal.items.split(",").map((s) => s.trim())
              : meal.name
                ? [meal.name]
                : [];

          grouped[type] = [...grouped[type], ...items];
        });

        setMenu(grouped);
      } catch (err) {
        console.error("Menu fetch error:", err.response?.data || err.message);
        setMenuError("Could not load today's menu. Please try again later.");
      } finally {
        setMenuLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}${API_PATHS.ANALYTICS.GET_SUMMARY}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };

    fetchMenu();
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("studentName");
    navigate("/login");
  };

  return (
    <div className="min-h-screen font-sans">

      {/* ── HEADER ── */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white font-black text-xs shrink-0">
              MW
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-gray-900 leading-tight truncate">
                MessWise Student Dashboard
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
                {studentName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-gray-700">{studentName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">

        {/* ── WELCOME BANNER ── */}
        <div className="relative bg-black text-white rounded-3xl px-6 sm:px-8 py-6 overflow-hidden flex items-center justify-between">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white opacity-[0.03]" />
          <div className="absolute bottom-0 right-20 w-28 h-28 rounded-full bg-white opacity-[0.03]" />
          <div>
            <p className="text-gray-500 text-sm">Welcome back,</p>
            <h2 className="text-2xl sm:text-3xl font-black mt-0.5" style={{ letterSpacing: "-1px" }}>
              {studentName} 👋
            </h2>
            <p className="text-gray-500 text-xs mt-1.5">Here's what's on the menu today.</p>
          </div>
          <span className="text-5xl sm:text-6xl select-none hidden sm:block">🍱</span>
        </div>

        {/* ── TODAY'S MENU ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Today's Menu</SectionTitle>
            {!menuLoading && !menuError && (
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-gray-400 hover:text-black font-semibold underline underline-offset-2 transition"
              >
                Refresh
              </button>
            )}
          </div>

          {/* Loading */}
          {menuLoading && <MenuSkeleton />}

          {/* Error */}
          {!menuLoading && menuError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 flex flex-col items-center gap-3 text-center">
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-semibold text-red-600">{menuError}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Menu Cards */}
          {!menuLoading && !menuError && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MEAL_TYPES.map((type) => {
                const cfg = TYPE_CONFIG[type];
                const items = menu[type] || [];

                return (
                  <div
                    key={type}
                    className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
                    style={{ background: cfg.bg, borderColor: cfg.border }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cfg.icon}</span>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.accent }}>
                          {type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{cfg.time}</span>
                    </div>

                    <div className="border-t" style={{ borderColor: cfg.border }} />

                    {/* Items */}
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No menu posted yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.accent }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── MEAL RATING ── */}
        <section>
          <SectionTitle>Rate Today's Meal</SectionTitle>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
            <p className="text-sm text-gray-500 -mt-1">Tap the stars to rate each dish.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rateDishes.map((dish) => (
                <div
                  key={dish}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-gray-200 transition"
                >
                  <span className="text-sm font-semibold text-gray-800">{dish}</span>
                  <StarRating
                    value={ratings[dish] || 0}
                    onChange={(v) => {
                      setRatings((p) => ({ ...p, [dish]: v }));
                    }}
                  />
                </div>
              ))}
            </div>
            {averageRating && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 text-xl leading-none">★</span>
                    <div>
                      <p className="text-sm font-bold text-amber-700">Your average rating: {averageRating} / 5</p>
                      <p className="text-xs text-amber-500 mt-0.5">{ratedCount} of {rateDishes.length} dishes rated</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmitRatings}
                    disabled={ratingsSubmitted}
                    className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ratingsSubmitted ? "Saved!" : "Submit Ratings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── FEEDBACK ── */}
        <section>
          <SectionTitle>Leave Feedback</SectionTitle>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">🙏</div>
                <p className="text-base font-bold text-gray-800">Thank you for your feedback.</p>
                <p className="text-sm text-gray-400 max-w-xs">Your input helps us serve you better every day.</p>
                <button
                  onClick={() => { setFeedback(""); setSubmitted(false); }}
                  className="mt-1 text-xs font-bold text-gray-400 underline underline-offset-2 hover:text-black transition"
                >
                  Submit another response
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={feedback}
                  onChange={(e) => e.target.value.length <= MAX_CHARS && setFeedback(e.target.value)}
                  placeholder="Share your feedback about today's meal..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  autoComplete="off"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${feedback.length >= MAX_CHARS ? "text-red-400" : "text-gray-400"}`}>
                    {feedback.length} / {MAX_CHARS}
                  </span>
                  <button
                    onClick={handleSubmitFeedback}
                    disabled={!feedback.trim()}
                    className="px-5 py-2 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── DIETARY PREFERENCES ── */}
        <PreferenceSection />

        {/* ── GREENPOINTS ── */}
        <GreenPointsSection />

        {/* ── FOOD WASTE AWARENESS ── */}
        <section>
          <SectionTitle>Food Waste Awareness</SectionTitle>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗑️</span>
                  <span className="text-xs font-black uppercase tracking-widest text-red-400">Today's Food Waste</span>
                </div>
                <p className="text-4xl font-black text-red-600" style={{ letterSpacing: "-1.5px" }}>
                  {stats.wasteKg} <span className="text-lg font-semibold">kg</span>
                </p>
                <GaugeBar percent={Math.min(stats.wastePct * 2, 100)} color="#ef4444" />
                <p className="text-xs text-red-400">Monitored closely by the mess committee</p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <span className="text-xs font-black uppercase tracking-widest text-orange-400">Waste Percentage</span>
                </div>
                <p className="text-4xl font-black text-orange-500" style={{ letterSpacing: "-1.5px" }}>
                  {stats.wastePct}<span className="text-lg font-semibold">%</span>
                </p>
                <GaugeBar percent={stats.wastePct} color="#f97316" />
                <p className="text-xs text-orange-400">Target: keep below 5%</p>
              </div>
            </div>
            <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4">
              <span className="text-2xl mt-0.5 shrink-0">🌱</span>
              <div>
                <p className="text-sm font-black text-emerald-700">Help reduce food waste. Take only what you can eat.</p>
                <p className="text-sm text-emerald-600 mt-1 leading-relaxed">
                  Every plate you finish helps reduce waste, saves resources, and makes a real impact for our community and planet.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 mt-4 py-6 text-center">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} MessWise · Reducing food waste, one meal at a time 🌿</p>
      </footer>

    </div>
  );
};

export default StudentDashboard;