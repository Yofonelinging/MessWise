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

// ── Mock Data ──────────────────────────────────────────────
const MOCK_STATS      = { mealsServed: 1200, wasteKg: 85, wastePct: 7, avgRating: 3.8 };
const MOCK_DISH       = [{ dish:"Rice",waste:15},{dish:"Dal",waste:10},{dish:"Paneer",waste:25},{dish:"Chapati",waste:8},{dish:"Manchurian",waste:12}];
const MOCK_TREND      = [{ date:"Mon",waste:70},{date:"Tue",waste:90},{date:"Wed",waste:65},{date:"Thu",waste:85},{date:"Fri",waste:100},{date:"Sat",waste:55},{date:"Sun",waste:40}];
const MOCK_BY_MEAL    = [{ name:"Breakfast",value:20},{name:"Lunch",value:45},{name:"Dinner",value:35}];
const MOCK_RATINGS    = [{ dish:"Paneer Curry",avg:4.2,count:98},{dish:"Dal",avg:3.5,count:110},{dish:"Rice",avg:3.8,count:115},{dish:"Chapati",avg:4.0,count:102},{dish:"Manchurian",avg:2.8,count:87}];
const MOCK_PREDICTION = [{ dish:"Rice",qty:110},{dish:"Dal",qty:60},{dish:"Paneer",qty:45},{dish:"Chapati",qty:80}];
const MOCK_HISTORY    = [
  { date:"2025-06-01", mealType:"Lunch",     dish:"Paneer Curry", prepared:50, waste:12, rating:4.2 },
  { date:"2025-06-01", mealType:"Breakfast", dish:"Idli",         prepared:40, waste:5,  rating:3.9 },
  { date:"2025-06-02", mealType:"Dinner",    dish:"Fried Rice",   prepared:60, waste:18, rating:3.2 },
  { date:"2025-06-03", mealType:"Lunch",     dish:"Dal",          prepared:45, waste:8,  rating:3.5 },
  { date:"2025-06-04", mealType:"Lunch",     dish:"Rice",         prepared:80, waste:15, rating:3.8 },
];

const PIE_COLORS = ["#f59e0b","#10b981","#6366f1"];

const NAV = [
  { key:"overview",   label:"Overview",     icon:"▦"  },
  { key:"menu",       label:"Menu Mgmt",    icon:"📋" },
  { key:"waste",      label:"Waste Entry",  icon:"♻️" },
  { key:"analytics",  label:"Analytics",    icon:"📊" },
  { key:"feedback",   label:"Feedback",     icon:"⭐" },
  { key:"prediction", label:"Prediction",   icon:"🔮" },
  { key:"history",    label:"Meal History", icon:"🗂️" },
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
    <p className="text-3xl font-black text-gray-900 mt-1" style={{ letterSpacing:"-1px" }}>{value}</p>
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
  <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-bold animate-bounce
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
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
      </div>
    ) : (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Meals Served"  value={stats.mealsServed}        sub="Today total"       accent="#10b981" icon="🍽️" />
        <StatCard label="Waste Today"   value={`${stats.wasteKg} kg`}    sub="All meal types"    accent="#ef4444" icon="♻️" />
        <StatCard label="Waste %"       value={`${stats.wastePct}%`}     sub="Target < 5%"       accent="#f97316" icon="📊" />
        <StatCard label="Avg Rating"    value={`${stats.avgRating} ★`}   sub="From students"     accent="#6366f1" icon="⭐" />
      </div>
    )}
    <div className="bg-gray-900 text-white rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <span className="text-3xl shrink-0">🔄</span>
      <div>
        <p className="text-sm font-black">Data Flow: Admin → Database → Student</p>
        <p className="text-xs text-gray-400 mt-1">
          Menu posted here → Students see via <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200">GET /menu/today</code>.
          Student ratings → You see via <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200">GET /ratings</code>.
        </p>
      </div>
    </div>
  </div>
);

// ── Section: Menu Management ───────────────────────────────
const MenuManagement = ({ onToast }) => {
  const [form, setForm]     = useState({ date: todayStr(), breakfast:"", lunch:"", dinner:"" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}${API_PATHS.MENU.POST}`, {
        date:      form.date,
        breakfast: form.breakfast.split(",").map(s => s.trim()).filter(Boolean),
        lunch:     form.lunch.split(",").map(s => s.trim()).filter(Boolean),
        dinner:    form.dinner.split(",").map(s => s.trim()).filter(Boolean),
      }, { headers: { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("adminToken")}` } });
      onToast("Menu saved! Students can now see today's menu.", "success");
      setForm({ date: todayStr(), breakfast:"", lunch:"", dinner:"" });
    } catch (err) {
      onToast(err.response?.data?.message || "Failed to save menu.", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle>Menu Management</SectionTitle>
      <Card>
        <p className="text-xs text-gray-400 mb-5">
          Enter comma-separated items per meal. Students fetch this via <code className="bg-gray-100 px-1.5 rounded">GET /menu/today</code>.
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
  const [form, setForm]     = useState({ date: todayStr(), mealType:"Breakfast", dish:"", prepared:"", leftover:"" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BASE_URL}${API_PATHS.MEAL_DATA.POST}`,
        { ...form, prepared: parseFloat(form.prepared), leftover: parseFloat(form.leftover) },
        { headers: { "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("adminToken")}` } });
      onToast("Waste data saved successfully.", "success");
      setForm({ date: todayStr(), mealType:"Breakfast", dish:"", prepared:"", leftover:"" });
    } catch (err) {
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
          This feeds the Analytics charts and the Student Waste Awareness card via <code className="bg-gray-100 px-1.5 rounded">GET /analytics</code>.
        </p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={set("date")} required />
          </Field>
          <Field label="Meal Type">
            <select className={inputCls} value={form.mealType} onChange={set("mealType")}>
              {["Breakfast","Lunch","Dinner"].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Dish Name">
              <input className={inputCls} placeholder="e.g. Paneer Curry" value={form.dish} onChange={set("dish")} required />
            </Field>
          </div>
          <Field label="Qty Prepared (kg)">
            <input type="number" step="0.1" min="0" className={inputCls} placeholder="50" value={form.prepared} onChange={set("prepared")} required />
          </Field>
          <Field label="Qty Leftover (kg)">
            <input type="number" step="0.1" min="0" className={inputCls} placeholder="12" value={form.leftover} onChange={set("leftover")} required />
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
          <div className="sm:col-span-2"><SubmitBtn loading={loading}>Save Waste Data</SubmitBtn></div>
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
        {[1,2,3].map(i => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Waste by Dish (kg)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wasteByDish} barSize={30}>
              <XAxis dataKey="dish" axisLine={false} tickLine={false} tick={{ fontSize:11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11 }} />
              <Tooltip cursor={{ fill:"#f9fafb" }} />
              <Bar dataKey="waste" fill="#111827" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Waste Trend (kg/day)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={wasteTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize:11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={2.5} dot={{ fill:"#ef4444", r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Waste by Meal Type</p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={wasteByMeal} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
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
const FeedbackInsights = ({ ratings, loading }) => (
  <div className="flex flex-col gap-5">
    <SectionTitle>Student Feedback Insights</SectionTitle>
    <Card>
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Dish","Avg Rating","Stars","Responses"].map(h => (
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
            </tbody>
          </table>
        </div>
      )}
    </Card>
  </div>
);

// ── Section: Demand Prediction ─────────────────────────────
const DemandPrediction = ({ prediction, loading }) => (
  <div className="flex flex-col gap-5">
    <SectionTitle>Demand Prediction — Tomorrow's Lunch</SectionTitle>
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔮</span>
        <div>
          <p className="text-sm font-black text-gray-800">AI-Based Preparation Estimate</p>
          <p className="text-xs text-gray-400">Based on historical consumption & waste trends</p>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="flex flex-col gap-4">
          {prediction.map((item) => {
            const maxQty = Math.max(...prediction.map(p => p.qty));
            const pct    = (item.qty / maxQty) * 100;
            return (
              <div key={item.dish} className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700 w-24 shrink-0">{item.dish}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full bg-gray-900 transition-all duration-700" style={{ width:`${pct}%` }} />
                </div>
                <span className="text-sm font-black text-gray-900 w-16 text-right">{item.qty} kg</span>
              </div>
            );
          })}
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ These are estimates. Final quantities depend on confirmed headcount.
          </p>
        </div>
      )}
    </Card>
  </div>
);

// ── Section: Meal History ──────────────────────────────────
const MealHistory = ({ history, loading }) => (
  <div className="flex flex-col gap-5">
    <SectionTitle>Meal History</SectionTitle>
    <Card>
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {["Date","Meal Type","Dish","Prepared","Waste","Rating"].map(h => (
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
                        ${row.mealType==="Breakfast" ? "bg-amber-100 text-amber-700"
                        : row.mealType==="Lunch"     ? "bg-emerald-100 text-emerald-700"
                        :                              "bg-violet-100 text-violet-700"}`}>
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

// ── MAIN ───────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate    = useNavigate();
  const [tab, setTab]   = useState("overview");
  const [toast, setToast] = useState({ msg:"", type:"" });

  const [stats, setStats]         = useState(MOCK_STATS);
  const [wasteByDish, setDish]    = useState(MOCK_DISH);
  const [wasteTrend, setTrend]    = useState(MOCK_TREND);
  const [wasteByMeal, setByMeal]  = useState(MOCK_BY_MEAL);
  const [ratings, setRatings]     = useState(MOCK_RATINGS);
  const [prediction, setPred]     = useState(MOCK_PREDICTION);
  const [history, setHistory]     = useState(MOCK_HISTORY);
  const [loading, setLoading]     = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"" }), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("adminToken");
        const res   = await axios.get(`${BASE_URL}${API_PATHS.ANALYTICS.GET}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = res.data;
        if (d.stats)       setStats(d.stats);
        if (d.wasteByDish) setDish(d.wasteByDish);
        if (d.wasteTrend)  setTrend(d.wasteTrend);
        if (d.wasteByMeal) setByMeal(d.wasteByMeal);
        if (d.ratings)     setRatings(d.ratings);
        if (d.prediction)  setPred(d.prediction);
        if (d.history)     setHistory(d.history);
      } catch { /* use mock data */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const logout = () => { localStorage.removeItem("adminToken"); navigate("/admin-login"); };

  const content = {
    overview:   <Overview stats={stats} loading={loading} />,
    menu:       <MenuManagement onToast={showToast} />,
    waste:      <WasteEntry onToast={showToast} />,
    analytics:  <Analytics wasteByDish={wasteByDish} wasteTrend={wasteTrend} wasteByMeal={wasteByMeal} loading={loading} />,
    feedback:   <FeedbackInsights ratings={ratings} loading={loading} />,
    prediction: <DemandPrediction prediction={prediction} loading={loading} />,
    history:    <MealHistory history={history} loading={loading} />,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-100 flex-col py-6 px-3 gap-1 shrink-0">
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
        <header className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-base font-black text-gray-900">MessWise Admin Dashboard</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
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