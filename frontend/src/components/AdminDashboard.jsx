import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { BASE_URL, API_PATHS } from "../utils/apiPath";

// ── Helpers ────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];

const Stars = ({ rating }) => {
  const full = Math.round(rating);
  return (
    <span>
      <span className="text-amber-400">{"★".repeat(full)}</span>
      <span className="text-gray-200">{"★".repeat(5 - full)}</span>
    </span>
  );
};

// ── Initial empty state (replaced from live API) ───────────
const EMPTY_STATS = { mealsServed: 0, wasteKg: 0, wastePct: 0, avgRating: 0 };

const PIE_COLORS = ["#f59e0b", "#10b981", "#6366f1"];

const NAV = [
  { key: "overview", label: "Overview", icon: "▦" },
  { key: "menu", label: "Menu Mgmt", icon: "📋" },
  { key: "waste", label: "Waste Entry", icon: "♻️" },
  { key: "analytics", label: "Analytics", icon: "📊" },
  { key: "feedback", label: "Feedback", icon: "⭐" },
  { key: "prediction", label: "Prediction", icon: "🔮" },
  { key: "fatigue", label: "Menu Fatigue", icon: "😴" },
  { key: "nutrition", label: "Nutrition", icon: "🥗" },
  { key: "actions", label: "Actions", icon: "⚡" },
  { key: "leaderboard", label: "Leaderboard", icon: "🏆" },
  { key: "wasteintel", label: "Waste Intel", icon: "🔍" },
  { key: "supplychain", label: "Supply Chain", icon: "🚚" },
  { key: "attendance", label: "Attendance", icon: "👥" },
  { key: "calendar", label: "Calendar", icon: "📅" },
  { key: "history", label: "Meal History", icon: "🗂️" },
];

// ── Reusable UI ────────────────────────────────────────────
const SectionTitle = ({ children }) => (
  <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-5">
    <span className="w-1 h-4 rounded-full bg-black inline-block shrink-0" />
    {children}
  </h2>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>{children}</div>
);

const StatCard = ({ label, value, sub, accent, icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2" style={{ borderTop: `3px solid ${accent}` }}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-xl">{icon}</span>
    </div>
    <p className="text-3xl font-black text-gray-900 mt-1" style={{ letterSpacing: "-1px" }}>{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</label>}
    {children}
  </div>
);

const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition";

const SubmitBtn = ({ loading, children }) => (
  <button type="submit" disabled={loading}
    className="mt-2 px-6 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 self-start">
    {loading ? "Saving..." : children}
  </button>
);

const Toast = ({ msg, type }) => msg ? (
  <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-bold
    ${type === "success" ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
    {type === "success" ? "✓ " : "✗ "}{msg}
  </div>
) : null;

// ── Section: Overview ──────────────────────────────────────
const Overview = ({ stats, loading }) => (
  <div className="flex flex-col gap-6">
    <SectionTitle>Overview — Today</SectionTitle>
    {loading ? (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
      </div>
    ) : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Meals Served" value={stats.mealsServed} sub="Today total" accent="#10b981" icon="🍽️" />
        <StatCard label="Waste Today" value={`${stats.wasteKg} kg`} sub="All meal types" accent="#ef4444" icon="♻️" />
        <StatCard label="Waste %" value={`${stats.wastePct}%`} sub="Target < 5%" accent="#f97316" icon="📊" />
        <StatCard label="Avg Rating" value={`${stats.avgRating} ★`} sub="From students" accent="#6366f1" icon="⭐" />
      </div>
    )}
  </div>
);

// ── Section: Menu Management ───────────────────────────────
const MenuManagement = ({ onToast }) => {
  const [form, setForm] = useState({ date: todayStr(), breakfast: "", lunch: "", dinner: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  // ✅ Correct: posts to MENU.POST
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      console.log("Menu URL:", `${BASE_URL}${API_PATHS.MENU.POST}`);
      await axios.post(
        `${BASE_URL}${API_PATHS.MENU.POST}`,
        {
          date: form.date,
          breakfast: form.breakfast.split(",").map(s => s.trim()).filter(Boolean),
          lunch: form.lunch.split(",").map(s => s.trim()).filter(Boolean),
          dinner: form.dinner.split(",").map(s => s.trim()).filter(Boolean),
        },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      onToast("Menu saved! Students can now see today's menu.", "success");
      setForm({ date: todayStr(), breakfast: "", lunch: "", dinner: "" });
    } catch (err) {
      console.log("Menu error status:", err.response?.status);
      console.log("Menu error data:", err.response?.data);
      onToast(err.response?.data?.message || "Failed to save menu.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Menu Management</SectionTitle>
      <Card>
        <p className="text-xs text-gray-400 mb-5">
          Enter comma-separated items per meal. Students fetch this via{" "}
          <code className="bg-gray-100 px-1.5 rounded">GET /menu/today</code>.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={set("date")} required />
          </Field>
          <Field label="🌅 Breakfast (comma separated)">
            <input className={inputCls} placeholder="Idli, Sambar, Coconut Chutney" value={form.breakfast} onChange={set("breakfast")} />
          </Field>
          <Field label="☀️ Lunch (comma separated)">
            <input className={inputCls} placeholder="Rice, Dal, Paneer Curry, Chapati" value={form.lunch} onChange={set("lunch")} />
          </Field>
          <Field label="🌙 Dinner (comma separated)">
            <input className={inputCls} placeholder="Fried Rice, Manchurian" value={form.dinner} onChange={set("dinner")} />
          </Field>
          <SubmitBtn loading={loading}>Post Menu to Student Dashboard</SubmitBtn>
        </form>
      </Card>
    </div>
  );
};

// ── Section: Waste Entry ───────────────────────────────────
const WasteEntry = ({ onToast }) => {
  const [form, setForm] = useState({ date: todayStr(), mealType: "Breakfast", dish: "", prepared: "", leftover: "" });
  const [loading, setLoading] = useState(false);
  const [availableDishes, setAvailableDishes] = useState([]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.MENU.GET_ALL}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const menus = res.data.menus || [];
        const menuForDate = menus.find(m => m.date === form.date);

        if (menuForDate) {
          setAvailableDishes(menuForDate[form.mealType.toLowerCase()] || []);
        } else {
          setAvailableDishes([]);
        }
      } catch (err) {
        console.error("Failed to fetch menus for datalist", err);
        setAvailableDishes([]);
      }
    };
    fetchMenus();
  }, [form.date, form.mealType]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  // ✅ Correct: posts to MEAL_DATA.POST with debug logs
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");

      console.log("Token:", token);
      console.log("Waste URL:", `${BASE_URL}${API_PATHS.MEAL_DATA.POST}`);
      console.log("Payload:", {
        ...form,
        prepared: parseFloat(form.prepared),
        leftover: parseFloat(form.leftover),
      });

      const res = await axios.post(
        `${BASE_URL}${API_PATHS.MEAL_DATA.POST}`,
        { ...form, prepared: parseFloat(form.prepared), leftover: parseFloat(form.leftover) },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );

      console.log("Waste response:", res.data);
      onToast("Waste data saved successfully.", "success");
      setForm({ date: todayStr(), mealType: "Breakfast", dish: "", prepared: "", leftover: "" });
    } catch (err) {
      console.log("Waste error status:", err.response?.status);
      console.log("Waste error data:", err.response?.data);
      console.log("Full error:", err.message);
      onToast(err.response?.data?.message || "Failed to save waste data.", "error");
    } finally { setLoading(false); }
  };

  const wastePct = form.prepared && form.leftover
    ? ((parseFloat(form.leftover) / parseFloat(form.prepared)) * 100).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Waste Data Entry</SectionTitle>
      <Card>
        <p className="text-xs text-gray-400 mb-5">
          This feeds the Analytics charts and the Student Waste Awareness card via{" "}
          <code className="bg-gray-100 px-1.5 rounded">GET /analytics</code>.
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={set("date")} required />
          </Field>
          <Field label="Meal Type">
            <select className={inputCls} value={form.mealType} onChange={set("mealType")}>
              {["Breakfast", "Lunch", "Dinner"].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Dish Name">
              <input
                className={inputCls}
                placeholder="e.g. Paneer Curry"
                value={form.dish}
                onChange={set("dish")}
                required
                list="dish-suggestions"
              />
              <datalist id="dish-suggestions">
                {availableDishes.map((d, i) => <option key={i} value={d} />)}
              </datalist>
            </Field>
          </div>
          <Field label="Qty Prepared (kg)">
            <input type="number" step="0.1" min="0" className={inputCls} placeholder="50"
              value={form.prepared} onChange={set("prepared")} required />
          </Field>
          <Field label="Qty Leftover (kg)">
            <input type="number" step="0.1" min="0" className={inputCls} placeholder="12"
              value={form.leftover} onChange={set("leftover")} required />
          </Field>

          {wastePct !== null && (
            <div className={`sm:col-span-2 rounded-xl px-4 py-3 flex items-center gap-2 border
              ${parseFloat(wastePct) > 15 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
              <span className="text-base">{parseFloat(wastePct) > 15 ? "⚠️" : "✅"}</span>
              <p className={`text-sm font-bold ${parseFloat(wastePct) > 15 ? "text-red-600" : "text-emerald-600"}`}>
                Waste ratio: {wastePct}% of prepared quantity
              </p>
            </div>
          )}
          <div className="sm:col-span-2">
            <SubmitBtn loading={loading}>Save Waste Data</SubmitBtn>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ── Section: Analytics ─────────────────────────────────────
const Analytics = ({ wasteByDish, wasteTrend, wasteByMeal, loading }) => (
  <div className="flex flex-col gap-5">
    <SectionTitle>Waste Analytics</SectionTitle>
    {loading ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Waste by Dish (kg)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wasteByDish} barSize={30}>
              <XAxis dataKey="dish" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="waste" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Waste Trend (kg/day)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={wasteTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Waste by Meal Type</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={wasteByMeal} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {wasteByMeal.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex sm:flex-col gap-4">
              {wasteByMeal.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{item.name}: {item.value} kg</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    )}
  </div>
);

// ── Section: Feedback Insights ─────────────────────────────
const FeedbackInsights = ({ ratings, feedbacks, loading }) => (
  <div className="flex flex-col gap-5">
    <SectionTitle>Student Feedback Insights</SectionTitle>
    <Card>
      {loading ? (
        <div className="flex flex-col gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Dish", "Avg Rating", "Stars", "Responses"].map(h => (
                  <th key={h} className="pb-3 pr-6 text-xs font-black uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.dish} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 pr-6 font-semibold text-gray-800">{r.dish}</td>
                  <td className="py-3 pr-6">
                    <span className={`font-black text-lg ${r.avg >= 4 ? "text-emerald-500" : r.avg >= 3 ? "text-amber-500" : "text-red-400"}`}>
                      {r.avg.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 pr-6"><Stars rating={r.avg} /></td>
                  <td className="py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">{r.count} students</span>
                  </td>
                </tr>
              ))}
              {ratings.length === 0 && (
                <tr><td colSpan="4" className="py-4 text-center text-gray-400">No ratings yet today.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>

    <SectionTitle>Written Feedback</SectionTitle>
    <Card>
      {loading ? (
        <div className="flex flex-col gap-3 h-20 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="flex flex-col gap-3">
          {(!feedbacks || feedbacks.length === 0) ? (
            <p className="text-sm text-gray-400 text-center py-4">No written feedback yet.</p>
          ) : (
            feedbacks.map((fb, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-400">{fb.date}</span>
                </div>
                <p className="text-sm text-gray-800 mt-1">"{fb.text}"</p>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  </div>
);

// ── Section: Prediction Dashboard (Phase 1 Upgrade) ────────
const MODIFIER_LABELS = {
  weekend: { label: "Weekend", icon: "📆" },
  weather: { label: "Weather", icon: "🌦️" },
  calendar: { label: "Calendar", icon: "📅" },
  fatigue: { label: "Fatigue", icon: "😴" },
  attendance: { label: "Attendance", icon: "👥" },
};

const ModifierBadge = ({ name, value }) => {
  const m = MODIFIER_LABELS[name] || { label: name, icon: "📊" };
  const color = value < 0.9 ? "text-red-600 bg-red-50 border-red-100"
    : value > 1.05 ? "text-emerald-600 bg-emerald-50 border-emerald-100"
      : "text-gray-600 bg-gray-50 border-gray-100";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {m.icon} {m.label}: {(value * 100).toFixed(0)}%
    </span>
  );
};

const PredictionDashboard = ({ predictionData, loading }) => {
  const predictions = predictionData?.predictions || [];
  const weather = predictionData?.weather;
  const calEvent = predictionData?.calendarEvent;

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>AI Demand Prediction — Tomorrow</SectionTitle>

      {/* Context cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
          <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1">Weather</p>
          <p className="text-lg font-black text-blue-800">
            {weather ? `${weather.temperature}°C — ${weather.condition}` : "Loading..."}
          </p>
          {weather?.isRainy && <p className="text-xs text-blue-600 mt-1">🌧️ Rain expected — demand may drop ~12%</p>}
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
          <p className="text-xs font-black uppercase tracking-widest text-purple-400 mb-1">Calendar</p>
          <p className="text-lg font-black text-purple-800 capitalize">{calEvent?.eventType || "Normal Day"}</p>
          {calEvent?.description && <p className="text-xs text-purple-600 mt-1">{calEvent.description}</p>}
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200">
          <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-1">Dishes</p>
          <p className="text-lg font-black text-amber-800">{predictions.length} items</p>
          <p className="text-xs text-amber-600 mt-1">Multi-factor prediction</p>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🧠</span>
          <div>
            <p className="text-sm font-black text-gray-800">Consumption Prediction Engine</p>
            <p className="text-xs text-gray-400">Factors: historical data × weather × calendar × menu fatigue × attendance trends</p>
          </div>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : predictions.length === 0 ? (
          <p className="text-sm text-gray-400">No predictions available. Add meal history and/or set tomorrow's menu to generate forecasts.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {predictions.map((item) => {
              const maxQty = Math.max(...predictions.map(p => p.predictedQty), 1);
              const pct = (item.predictedQty / maxQty) * 100;
              return (
                <div key={`${item.dish}-${item.mealType}`} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-bold text-gray-800 w-32 shrink-0">{item.dish}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                      ${item.mealType === "Breakfast" ? "bg-amber-100 text-amber-700"
                        : item.mealType === "Lunch" ? "bg-emerald-100 text-emerald-700"
                          : "bg-violet-100 text-violet-700"}`}>
                      {item.mealType}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-3 rounded-full bg-gray-900 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-black text-gray-900 w-20 text-right">{item.predictedQty} kg</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-0 sm:ml-36">
                    {item.modifiers && Object.entries(item.modifiers).filter(([k]) => k !== "combined").map(([k, v]) => (
                      <ModifierBadge key={k} name={k} value={v} />
                    ))}
                    {item.modifiers?.combined && (
                      <span className="text-xs font-bold text-gray-500 ml-1 self-center">= ×{item.modifiers.combined}</span>
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-400 mt-2">
              ⚠️ Predictions improve as more meal data and attendance logs are added.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

// ── Section: Attendance Logging ────────────────────────────
const AttendanceSection = ({ onToast }) => {
  const [form, setForm] = useState({ date: todayStr(), mealType: "Lunch", headcount: "" });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.PREDICTION.ATTENDANCE_GET}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(res.data.logs || []);
      } catch { /* silent */ }
    };
    fetchLogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        `${BASE_URL}${API_PATHS.PREDICTION.ATTENDANCE_POST}`,
        { ...form, headcount: parseInt(form.headcount) },
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      onToast("Attendance logged!", "success");
      setLogs(prev => [res.data.entry, ...prev.filter(l => !(l.date === form.date && l.mealType === form.mealType))]);
      setForm({ date: todayStr(), mealType: "Lunch", headcount: "" });
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to log attendance.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Attendance Logging</SectionTitle>
      <Card>
        <p className="text-xs text-gray-400 mb-5">
          Log how many students ate each meal. This feeds the Prediction Engine to improve accuracy.
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={set("date")} required />
          </Field>
          <Field label="Meal Type">
            <select className={inputCls} value={form.mealType} onChange={set("mealType")}>
              {["Breakfast", "Lunch", "Dinner"].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Headcount">
            <input type="number" min="0" className={inputCls} placeholder="e.g. 350" value={form.headcount} onChange={set("headcount")} required />
          </Field>
          <div className="sm:col-span-3">
            <SubmitBtn loading={loading}>Log Attendance</SubmitBtn>
          </div>
        </form>
      </Card>

      {/* Recent logs */}
      {logs.length > 0 && (
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Recent Attendance Logs</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {["Date", "Meal Type", "Headcount", "Source"].map(h => (
                    <th key={h} className="pb-3 pr-4 text-xs font-black uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 15).map((log, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-2 pr-4 text-gray-500">{log.date}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                        ${log.mealType === "Breakfast" ? "bg-amber-100 text-amber-700"
                          : log.mealType === "Lunch" ? "bg-emerald-100 text-emerald-700"
                            : "bg-violet-100 text-violet-700"}`}>
                        {log.mealType}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-bold text-gray-800">{log.headcount}</td>
                    <td className="py-2 text-xs text-gray-400">{log.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Section: Academic Calendar ─────────────────────────────
const CalendarSection = ({ onToast }) => {
  const [form, setForm] = useState({ date: todayStr(), eventType: "normal", description: "" });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.PREDICTION.CALENDAR_GET}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(res.data.events || []);
      } catch { /* silent */ }
    };
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.post(
        `${BASE_URL}${API_PATHS.PREDICTION.CALENDAR_POST}`,
        form,
        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
      );
      onToast("Calendar event saved!", "success");
      setEvents(prev => {
        const filtered = prev.filter(ev => ev.date !== form.date);
        return [...filtered, res.data.entry].sort((a, b) => a.date.localeCompare(b.date));
      });
      setForm({ date: todayStr(), eventType: "normal", description: "" });
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save calendar event.", "error");
    } finally { setLoading(false); }
  };

  const eventColors = {
    exam_week: "bg-red-100 text-red-700 border-red-200",
    festival: "bg-purple-100 text-purple-700 border-purple-200",
    holiday: "bg-blue-100 text-blue-700 border-blue-200",
    sports_day: "bg-emerald-100 text-emerald-700 border-emerald-200",
    normal: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Academic Calendar</SectionTitle>
      <Card>
        <p className="text-xs text-gray-400 mb-5">
          Mark exam weeks, festivals, holidays, etc. The Prediction Engine uses these to adjust demand forecasts.
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={set("date")} required />
          </Field>
          <Field label="Event Type">
            <select className={inputCls} value={form.eventType} onChange={set("eventType")}>
              {["normal", "exam_week", "festival", "holiday", "sports_day"].map(o => (
                <option key={o} value={o}>{o.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </Field>
          <Field label="Description (optional)">
            <input className={inputCls} placeholder="e.g. Mid-term exams" value={form.description} onChange={set("description")} />
          </Field>
          <div className="sm:col-span-3">
            <SubmitBtn loading={loading}>Save Calendar Event</SubmitBtn>
          </div>
        </form>
      </Card>

      {events.length > 0 && (
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Upcoming Events</p>
          <div className="flex flex-col gap-2">
            {events.map((ev, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${eventColors[ev.eventType] || eventColors.normal}`}>
                <span className="text-sm font-bold w-28 shrink-0">{ev.date}</span>
                <span className="text-xs font-bold uppercase">{ev.eventType.replace(/_/g, " ")}</span>
                {ev.description && <span className="text-xs ml-auto">{ev.description}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Section: Meal History ──────────────────────────────────
const MealHistory = ({ history, loading }) => (
  <div className="flex flex-col gap-5">
    <SectionTitle>Meal History</SectionTitle>
    <Card>
      {loading ? (
        <div className="flex flex-col gap-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Date", "Meal Type", "Dish", "Prepared", "Waste", "Rating"].map(h => (
                  <th key={h} className="pb-3 pr-4 text-xs font-black uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => {
                const pct = ((row.waste / row.prepared) * 100).toFixed(0);
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 pr-4 text-gray-500 font-medium">{row.date}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                        ${row.mealType === "Breakfast" ? "bg-amber-100 text-amber-700"
                          : row.mealType === "Lunch" ? "bg-emerald-100 text-emerald-700"
                            : "bg-violet-100 text-violet-700"}`}>
                        {row.mealType}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-800">{row.dish}</td>
                    <td className="py-3 pr-4 text-gray-600">{row.prepared} kg</td>
                    <td className="py-3 pr-4">
                      <span className={`font-black ${parseInt(pct) > 20 ? "text-red-500" : "text-gray-700"}`}>
                        {row.waste} kg
                      </span>
                      <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                    </td>
                    <td className="py-3"><Stars rating={row.rating} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  </div>
);

// ── Section: Menu Fatigue (Phase 2) ─────────────────────
const FATIGUE_COLORS = {
  critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", bar: "bg-red-500", badge: "bg-red-100 text-red-700" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  healthy: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
};

const FatigueSection = () => {
  const [scores, setScores] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const headers = { Authorization: `Bearer ${token}` };
        const [scoresRes, suggestionsRes] = await Promise.all([
          axios.get(`${BASE_URL}${API_PATHS.FATIGUE.SCORES}`, { headers }),
          axios.get(`${BASE_URL}${API_PATHS.FATIGUE.SUGGESTIONS}`, { headers }),
        ]);
        setScores(scoresRes.data.scores || []);
        setSuggestions(suggestionsRes.data.suggestions || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Menu Fatigue Analysis</SectionTitle>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {[{ label: "Healthy (0–34)", status: "healthy" }, { label: "Warning (35–59)", status: "warning" }, { label: "Critical (60–100)", status: "critical" }].map(l => (
          <span key={l.status} className={`text-xs font-bold px-3 py-1 rounded-full ${FATIGUE_COLORS[l.status].badge}`}>{l.label}</span>
        ))}
      </div>

      {/* Fatigue Scores */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🧠</span>
          <div>
            <p className="text-sm font-black text-gray-800">Behavioral Fatigue Scores</p>
            <p className="text-xs text-gray-400">Composite: repeat frequency × waste trend × rating decline × high waste</p>
          </div>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : scores.length === 0 ? (
          <p className="text-sm text-gray-400">No fatigue data yet. Add menus and waste data to analyze dish fatigue patterns.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {scores.map((s) => {
              const c = FATIGUE_COLORS[s.status];
              return (
                <div key={s.dish} className={`${c.bg} ${c.border} border rounded-xl p-4`}>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-bold text-gray-800 w-32 shrink-0">{s.dish}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full ${c.bar} transition-all duration-700`} style={{ width: `${s.fatigueScore}%` }} />
                    </div>
                    <span className={`text-sm font-black w-16 text-right ${c.text}`}>{s.fatigueScore}/100</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{s.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-0 sm:ml-36 text-xs">
                    <span className="bg-white/60 px-2 py-0.5 rounded-full">🔁 Repeats: {s.repeatsIn14Days}x in 14d</span>
                    {s.avgWastePct !== null && <span className="bg-white/60 px-2 py-0.5 rounded-full">♻️ Waste: {s.avgWastePct}%</span>}
                    {s.avgRating !== null && <span className="bg-white/60 px-2 py-0.5 rounded-full">⭐ Rating: {s.avgRating}</span>}
                    <span className="bg-white/60 px-2 py-0.5 rounded-full">📊 Data: {s.dataPoints} records</span>
                  </div>
                  {/* Score breakdown */}
                  <div className="flex flex-wrap gap-1.5 ml-0 sm:ml-36 mt-1.5">
                    <span className="text-xs text-gray-500">Breakdown:</span>
                    <span className="text-xs text-gray-500">Repeat +{s.breakdown.repeat}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">Waste↑ +{s.breakdown.wasteTrend}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">Rating↓ +{s.breakdown.ratingDecline}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">High waste +{s.breakdown.highWaste}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Replacement Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">💡</span>
            <div>
              <p className="text-sm font-black text-gray-800">Replacement Suggestions</p>
              <p className="text-xs text-gray-400">Well-rated dishes that haven't been served recently</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s, i) => (
              <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">🍽️</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-800">{s.dish}</p>
                  <p className="text-xs text-emerald-600">{s.reason}</p>
                </div>
                {s.avgRating && <span className="text-sm font-black text-amber-500">{s.avgRating} ★</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ── Section: Nutrition Equity (Phase 3) ─────────────────
const SEVERITY_STYLE = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  suggestion: "bg-purple-50 border-purple-200 text-purple-800",
  important: "bg-amber-50 border-amber-200 text-amber-800",
  warning: "bg-red-50 border-red-200 text-red-800",
};

const NutritionSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.NUTRITION.INSIGHTS}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const dist = data?.distribution;
  const insights = data?.insights || [];

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Nutrition & Equity Intelligence</SectionTitle>

      {loading ? (
        <div className="flex flex-col gap-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : !dist ? (
        <Card><p className="text-sm text-gray-400">No student preference data yet.</p></Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Students" value={dist.totalStudents} sub="Registered" accent="#6366f1" icon="👥" />
            <StatCard label="Athletes" value={dist.athleteCount} sub={`${dist.athletePct}% of total`} accent="#10b981" icon="🏋️" />
            <StatCard label="Diet Types" value={dist.dietaryBreakdown.length} sub="Categories" accent="#f59e0b" icon="🌿" />
            <StatCard label="Cuisines" value={dist.cuisineBreakdown.length} sub="Preferred" accent="#ec4899" icon="🍜" />
          </div>

          {/* Dietary distribution */}
          <Card>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Dietary Distribution</p>
            <div className="flex flex-col gap-3">
              {dist.dietaryBreakdown.map(d => (
                <div key={d.name} className="flex items-center gap-4">
                  <span className="text-sm font-bold capitalize text-gray-700 w-24 shrink-0">{d.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-4 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="text-sm font-black text-gray-700 w-20 text-right">{d.count} ({d.pct}%)</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Cuisine preferences */}
          <Card>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Cuisine Preferences</p>
            <div className="flex flex-col gap-3">
              {dist.cuisineBreakdown.map(c => (
                <div key={c.name} className="flex items-center gap-4">
                  <span className="text-sm font-bold capitalize text-gray-700 w-28 shrink-0">{c.name.replace(/-/g, " ")}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-4 rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="text-sm font-black text-gray-700 w-20 text-right">{c.count} ({c.pct}%)</span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights */}
          {insights.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🧠</span>
                <div>
                  <p className="text-sm font-black text-gray-800">AI Nutrition Insights</p>
                  <p className="text-xs text-gray-400">Context-aware recommendations based on student preferences + calendar</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {insights.map((ins, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${SEVERITY_STYLE[ins.severity] || SEVERITY_STYLE.info}`}>
                    <span className="text-lg mt-0.5 shrink-0">{ins.icon}</span>
                    <p className="text-sm font-medium">{ins.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// ── Section: Autonomous Actions (Phase 4) ─────────────
const PRIORITY_STYLE = {
  critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  high: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  medium: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  low: { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

const CATEGORY_LABELS = {
  cooking: "Cooking Qty",
  portions: "Portions",
  menu: "Menu Swap",
  operations: "Operations",
  nutrition: "Nutrition",
};

const ActionsSection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.DECISIONS.ACTIONS}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchActions();
  }, []);

  const actions = data?.actions || [];
  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Autonomous Decision System</SectionTitle>

      {loading ? (
        <div className="flex flex-col gap-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-gray-900 text-white rounded-2xl p-4 text-center">
                <p className="text-3xl font-black">{summary.total}</p>
                <p className="text-xs text-gray-400">Total Actions</p>
              </div>
              {["critical", "high", "medium", "low"].map(p => (
                <div key={p} className={`${PRIORITY_STYLE[p].bg} ${PRIORITY_STYLE[p].border} border rounded-2xl p-4 text-center`}>
                  <p className="text-3xl font-black">{summary[p]}</p>
                  <p className="text-xs capitalize font-bold" style={{ opacity: 0.6 }}>{p}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions list */}
          {actions.length === 0 ? (
            <Card>
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-black text-gray-800">All Clear!</p>
                  <p className="text-xs text-gray-400">No critical actions needed. The system is operating within normal parameters.</p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {actions.map((action, i) => {
                const ps = PRIORITY_STYLE[action.priority] || PRIORITY_STYLE.low;
                return (
                  <div key={i} className={`${ps.bg} ${ps.border} border rounded-xl p-4`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5 shrink-0">{action.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ps.badge}`}>{action.priority}</span>
                          <span className="text-xs font-bold text-gray-400 uppercase">{CATEGORY_LABELS[action.category] || action.category}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800">{action.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{action.detail}</p>
                        {action.metric && (
                          <span className="inline-block text-xs bg-white/60 px-2 py-0.5 rounded-full mt-2 font-medium text-gray-600">
                            📊 {action.metric}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data?.generatedAt && (
            <p className="text-xs text-gray-400 text-right">Generated: {new Date(data.generatedAt).toLocaleString()}</p>
          )}
        </>
      )}
    </div>
  );
};

// ── Section: Leaderboard (Phase 5) ───────────────────
const RANK_COLORS = ["text-amber-500", "text-gray-400", "text-amber-700"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

const LeaderboardSection = () => {
  const [stats, setStats] = useState(null);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const headers = { Authorization: `Bearer ${token}` };
        const [statsRes, boardRes] = await Promise.all([
          axios.get(`${BASE_URL}${API_PATHS.GAMIFICATION.CAMPUS_STATS}`, { headers }),
          axios.get(`${BASE_URL}${API_PATHS.GAMIFICATION.LEADERBOARD}`, { headers }),
        ]);
        setStats(statsRes.data);
        setBoard(boardRes.data.leaderboard || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>GreenPoints Leaderboard</SectionTitle>

      {loading ? (
        <div className="flex flex-col gap-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Campus stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Players" value={stats.totalPlayers} sub="Active" accent="#6366f1" icon="🎮" />
              <StatCard label="CO₂ Saved" value={`${stats.totalCO2Saved} kg`} sub="Campus total" accent="#10b981" icon="🌍" />
              <StatCard label="Food Saved" value={`${stats.totalFoodSaved} kg`} sub="Campus total" accent="#f59e0b" icon="🍽️" />
              <StatCard label="Avg Streak" value={stats.avgStreak} sub="Days" accent="#ef4444" icon="🔥" />
            </div>
          )}

          {/* Leaderboard table */}
          <Card>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Top Students</p>
            {board.length === 0 ? (
              <p className="text-sm text-gray-400">No students have earned points yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      {["Rank", "Student", "Level", "Points", "Streak", "CO₂"].map(h => (
                        <th key={h} className="pb-3 pr-4 text-xs font-black uppercase tracking-widest text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((s) => (
                      <tr key={s.rank} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="py-3 pr-4">
                          <span className={`font-black text-lg ${RANK_COLORS[s.rank - 1] || "text-gray-500"}`}>
                            {RANK_ICONS[s.rank - 1] || `#${s.rank}`}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-bold text-gray-800">{s.name}</p>
                          {s.hostel && <p className="text-xs text-gray-400">{s.hostel}</p>}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Lv{s.level} {s.levelName}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-black text-gray-800">{s.points}</td>
                        <td className="py-3 pr-4">
                          <span className="text-amber-500 font-bold">🔥 {s.streak}d</span>
                        </td>
                        <td className="py-3 text-emerald-600 font-bold">{s.co2Saved} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

// ── Section: Waste Intelligence (Phase 6) ─────────────
const WasteIntelSection = ({ onToast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], mealType: "Lunch", dish: "", cookedExcess: 0, servedUntouched: 0, partiallyEaten: 0, spoilage: 0, notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${BASE_URL}${API_PATHS.WASTE_INTEL.INSIGHTS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClassify = async (e) => {
    e.preventDefault();
    if (!form.dish.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`${BASE_URL}${API_PATHS.WASTE_INTEL.CLASSIFY}`, form, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      onToast("Waste entry classified!");
      setForm(f => ({ ...f, dish: "", cookedExcess: 0, servedUntouched: 0, partiallyEaten: 0, spoilage: 0, notes: "" }));
      fetchData();
    } catch { onToast("Error saving", "error"); }
    finally { setSaving(false); }
  };

  const bd = data?.breakdown;
  const insights = data?.insights || [];
  const dishes = data?.dishes || [];

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Plate-Level Waste Intelligence</SectionTitle>

      {loading ? (
        <div className="flex flex-col gap-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Insights */}
          {insights.length > 0 && (
            <div className="flex flex-col gap-2">
              {insights.map((ins, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${ins.severity === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                  ins.severity === "high" ? "bg-amber-50 border-amber-200 text-amber-800" :
                    "bg-blue-50 border-blue-200 text-blue-800"
                  }`}>
                  <span className="text-lg shrink-0">{ins.icon}</span>
                  <p className="text-sm font-medium">{ins.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          {bd && bd.total > 0 && (
            <Card>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Waste Category Breakdown ({bd.total} kg total)</p>
              <div className="flex flex-col gap-3">
                {bd.categories.map(c => (
                  <div key={c.key} className="flex items-center gap-4">
                    <span className="text-lg shrink-0">{c.icon}</span>
                    <span className="text-sm font-bold text-gray-700 w-32 shrink-0">{c.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div className="h-4 rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: c.color }} />
                    </div>
                    <span className="text-sm font-black text-gray-700 w-24 text-right">{c.value} kg ({c.pct}%)</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Per-dish analysis */}
          {dishes.length > 0 && (
            <Card>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Top Waste Dishes — Root Cause</p>
              <div className="flex flex-col gap-2">
                {dishes.map(d => (
                  <div key={d.dish} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-sm font-bold text-gray-800 w-28 shrink-0">{d.dish}</span>
                    <span className="text-sm font-black text-red-600 w-16">{d.totalWaste} kg</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{d.primaryCause}</span>
                    <div className="flex-1 flex gap-1">
                      {d.categories.map(c => c.pct > 0 && (
                        <span key={c.name} className="text-xs text-gray-400">{c.name}: {c.pct}%</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Classification form */}
      <Card>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Log Waste Classification</p>
        <form onSubmit={handleClassify} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
            <select value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              {["Breakfast", "Lunch", "Dinner"].map(m => <option key={m}>{m}</option>)}
            </select>
            <input value={form.dish} onChange={e => setForm(f => ({ ...f, dish: e.target.value }))}
              placeholder="Dish name" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[["cookedExcess", "🍳 Cooked Excess (kg)"], ["servedUntouched", "🍽️ Untouched (kg)"], ["partiallyEaten", "😒 Partial (kg)"], ["spoilage", "🦠 Spoilage (kg)"]].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input type="number" min="0" step="0.1" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving || !form.dish.trim()}
            className="px-6 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 self-start">
            {saving ? "Saving..." : "Log Classification"}
          </button>
        </form>
      </Card>
    </div>
  );
};

// ── Section: Supply Chain (Phase 7) ─────────────────
const STATUS_CFG = {
  excellent: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  good: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  fair: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  poor: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
};

const SupplyChainSection = ({ onToast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    supplierName: "", category: "vegetables", item: "", qualityScore: 3, freshnessScore: 3, deliveryScore: 3,
    orderedQty: 0, receivedQty: 0, rejectedQty: 0, rejectionReason: "", date: new Date().toISOString().split("T")[0], notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${BASE_URL}${API_PATHS.SUPPLY_CHAIN.INSIGHTS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierName.trim() || !form.item.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(`${BASE_URL}${API_PATHS.SUPPLY_CHAIN.FEEDBACK}`, form, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      onToast("Supplier feedback logged!");
      setForm(f => ({ ...f, supplierName: "", item: "", orderedQty: 0, receivedQty: 0, rejectedQty: 0, rejectionReason: "", notes: "" }));
      fetchData();
    } catch { onToast("Error saving", "error"); }
    finally { setSaving(false); }
  };

  const scorecards = data?.scorecards || [];
  const insights = data?.insights || [];
  const summary = data?.summary;

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Supply Chain Feedback Loop</SectionTitle>

      {loading ? (
        <div className="flex flex-col gap-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Summary */}
          {summary && summary.totalSuppliers > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Suppliers" value={summary.totalSuppliers} sub="Tracked" accent="#6366f1" icon="🚚" />
              <StatCard label="Deliveries" value={summary.totalDeliveries} sub="Last 30 days" accent="#10b981" icon="📦" />
              <StatCard label="Avg Quality" value={`${summary.avgQuality}/5`} sub="All suppliers" accent="#f59e0b" icon="⭐" />
              <StatCard label="Rejection" value={`${summary.avgRejectionRate}%`} sub="Avg rate" accent="#ef4444" icon="❌" />
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="flex flex-col gap-2">
              {insights.map((ins, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${ins.severity === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                  ins.severity === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
                    "bg-blue-50 border-blue-200 text-blue-800"
                  }`}>
                  <span className="text-lg shrink-0">{ins.icon}</span>
                  <p className="text-sm font-medium">{ins.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Supplier scorecards */}
          {scorecards.length > 0 && (
            <Card>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Supplier Scorecards</p>
              <div className="flex flex-col gap-3">
                {scorecards.map(s => {
                  const cfg = STATUS_CFG[s.status] || STATUS_CFG.fair;
                  return (
                    <div key={s.supplier} className={`${cfg.bg} ${cfg.border} border rounded-xl p-4`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-black text-gray-800">{s.supplier}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{s.status}</span>
                        <span className="text-xs text-gray-400 ml-auto">{s.deliveries} deliveries</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <span className="bg-white/60 px-2 py-1 rounded-lg">⭐ Quality: {s.avgQuality}/5</span>
                        <span className="bg-white/60 px-2 py-1 rounded-lg">🥬 Fresh: {s.avgFreshness}/5</span>
                        <span className="bg-white/60 px-2 py-1 rounded-lg">🚚 Delivery: {s.avgDelivery}/5</span>
                        <span className="bg-white/60 px-2 py-1 rounded-lg">✅ Fulfilled: {s.fulfillmentRate}%</span>
                        <span className="bg-white/60 px-2 py-1 rounded-lg">❌ Rejection: {s.rejectionRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Delivery log form */}
      <Card>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Log Supplier Delivery</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
              placeholder="Supplier name" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              {["vegetables", "dairy", "grains", "spices", "meat", "oils", "other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
              placeholder="Item name" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["qualityScore", "Quality (1-5)"], ["freshnessScore", "Freshness (1-5)"], ["deliveryScore", "Delivery (1-5)"]].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input type="number" min="1" max="5" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 3 }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["orderedQty", "Ordered (kg)"], ["receivedQty", "Received (kg)"], ["rejectedQty", "Rejected (kg)"]].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input type="number" min="0" step="0.5" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving || !form.supplierName.trim() || !form.item.trim()}
            className="px-6 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50 self-start">
            {saving ? "Saving..." : "Log Delivery"}
          </button>
        </form>
      </Card>
    </div>
  );
};

// ── MAIN ───────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [stats, setStats] = useState(EMPTY_STATS);
  const [wasteByDish, setDish] = useState([]);
  const [wasteTrend, setTrend] = useState([]);
  const [wasteByMeal, setByMeal] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [prediction, setPred] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predictionData, setPredictionData] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.ANALYTICS.GET}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data;
        if (d.stats) setStats(d.stats);
        if (d.wasteByDish) setDish(d.wasteByDish);
        if (d.wasteTrend) setTrend(d.wasteTrend);
        if (d.wasteByMeal) setByMeal(d.wasteByMeal);
        if (d.ratings) setRatings(d.ratings);
        if (d.prediction) setPred(d.prediction);
        if (d.history) setHistory(d.history);
      } catch { /* fall back to mock data silently */ }
      finally { setLoading(false); }
    };
    load();

    // Load prediction data
    const loadPrediction = async () => {
      setPredLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.PREDICTION.TOMORROW}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPredictionData(res.data);
      } catch { /* prediction data not available yet */ }
      finally { setPredLoading(false); }
    };
    loadPrediction();

    // Load feedbacks
    const loadFeedbacks = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(`${BASE_URL}${API_PATHS.FEEDBACK.GET_ALL}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedbacks(res.data.feedbacks || []);
      } catch (err) {
        console.error("Failed to load feedbacks", err);
      }
    };
    loadFeedbacks();
  }, []);

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };

  const content = {
    overview: <Overview stats={stats} loading={loading} />,
    menu: <MenuManagement onToast={showToast} />,
    waste: <WasteEntry onToast={showToast} />,
    analytics: <Analytics wasteByDish={wasteByDish} wasteTrend={wasteTrend} wasteByMeal={wasteByMeal} loading={loading} />,
    feedback: <FeedbackInsights ratings={ratings} feedbacks={feedbacks} loading={loading} />,
    prediction: <PredictionDashboard predictionData={predictionData} loading={predLoading} />,
    attendance: <AttendanceSection onToast={showToast} />,
    calendar: <CalendarSection onToast={showToast} />,
    fatigue: <FatigueSection />,
    nutrition: <NutritionSection />,
    actions: <ActionsSection />,
    leaderboard: <LeaderboardSection />,
    wasteintel: <WasteIntelSection onToast={showToast} />,
    supplychain: <SupplyChainSection onToast={showToast} />,
    history: <MealHistory history={history} loading={loading} />,
  };

  return (
    <div className="flex min-h-screen font-sans">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex w-56 bg-white/70 backdrop-blur-md border-r border-gray-100 flex-col py-6 px-3 gap-1 shrink-0">
        <div className="px-3 mb-7 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white font-black text-xs">MW</div>
          <div>
            <p className="text-sm font-black text-gray-900 leading-tight">MessWise</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        {NAV.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
              ${tab === key ? "bg-black text-white shadow" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
            <span className="text-base w-5 text-center">{icon}</span>{label}
          </button>
        ))}
        <div className="mt-auto px-3">
          <button onClick={logout} className="w-full text-sm font-semibold text-red-400 hover:text-red-600 transition text-left py-2">
            ⎋ Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white/70 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-base font-black text-gray-900">MessWise Admin Dashboard</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-black">A</div>
              <span className="text-sm font-semibold text-gray-700">Admin</span>
            </div>
            <button onClick={logout}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition">
              Logout
            </button>
          </div>
        </header>

        {/* Mobile Nav */}
        <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-100 bg-white">
          {NAV.map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0
                ${tab === key ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8">{content[tab]}</main>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
};

export default AdminDashboard;