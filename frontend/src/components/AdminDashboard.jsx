import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";

// ── Mock Data ──────────────────────────────────────────────
const wasteData = [
  { day: "Mon", kg: 12 },
  { day: "Tue", kg: 18 },
  { day: "Wed", kg: 9 },
  { day: "Thu", kg: 15 },
  { day: "Fri", kg: 20 },
  { day: "Sat", kg: 7 },
  { day: "Sun", kg: 5 },
];

const mealsData = [
  { day: "Mon", breakfast: 90, lunch: 105, dinner: 88 },
  { day: "Tue", breakfast: 95, lunch: 110, dinner: 92 },
  { day: "Wed", breakfast: 88, lunch: 100, dinner: 85 },
  { day: "Thu", breakfast: 92, lunch: 108, dinner: 90 },
  { day: "Fri", breakfast: 98, lunch: 115, dinner: 95 },
  { day: "Sat", breakfast: 70, lunch: 80, dinner: 65 },
  { day: "Sun", breakfast: 60, lunch: 75, dinner: 58 },
];

const recentStudents = [
  { id: 1, name: "Arjun Sharma", email: "arjun@student.com", plan: "Monthly", status: "Active" },
  { id: 2, name: "Priya Nair",   email: "priya@student.com", plan: "Weekly",  status: "Active" },
  { id: 3, name: "Rahul Mehta",  email: "rahul@student.com", plan: "Monthly", status: "Inactive" },
  { id: 4, name: "Sneha Patel",  email: "sneha@student.com", plan: "Daily",   status: "Active" },
  { id: 5, name: "Vikram Das",   email: "vikram@student.com",plan: "Monthly", status: "Active" },
];

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent }) => (
  <div
    style={{ borderTop: `4px solid ${accent}` }}
    className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-1"
  >
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-4xl font-black text-gray-900 mt-1">{value}</span>
    {sub && <span className="text-sm text-gray-500 mt-1">{sub}</span>}
  </div>
);

// ── Sidebar Item ───────────────────────────────────────────
const SideItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
      ${active
        ? "bg-black text-white shadow"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
  >
    <span className="text-lg">{icon}</span>
    {label}
  </button>
);

// ── Main Component ─────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin-login");
  };

  const navItems = [
    { icon: "▦", label: "Dashboard" },
    { icon: "👥", label: "Students" },
    { icon: "🍽️", label: "Meals" },
    { icon: "♻️", label: "Waste" },
    { icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col py-6 px-3 gap-1 shrink-0">
        <div className="px-4 mb-8">
          <h1 className="text-xl font-black tracking-tight text-gray-900">MessWise</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
        </div>

        {navItems.map((item) => (
          <SideItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={activeTab === item.label}
            onClick={() => setActiveTab(item.label)}
          />
        ))}

        <div className="mt-auto px-4">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-500 hover:text-red-700 font-medium py-2 text-left transition"
          >
            ⎋ &nbsp;Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-auto">

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{activeTab}</h2>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
              A
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-8 flex flex-col gap-8">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <StatCard label="Total Students"  value="120"    sub="↑ 4 this week"     accent="#111" />
            <StatCard label="Meals Served"    value="105"    sub="Today"             accent="#22c55e" />
            <StatCard label="Today's Waste"   value="15 kg"  sub="↓ 3 kg vs yesterday" accent="#f97316" />
            <StatCard label="Active Plans"    value="98"     sub="Out of 120"        accent="#3b82f6" />
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Waste Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Weekly Waste (kg)
              </h3>
              <p className="text-xs text-gray-400 mb-4">Food waste per day this week</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={wasteData} barSize={28}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "#f3f4f6" }} />
                  <Bar dataKey="kg" fill="#111" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Meals Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Meals Served
              </h3>
              <p className="text-xs text-gray-400 mb-4">Breakfast / Lunch / Dinner this week</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mealsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="breakfast" stroke="#111"    strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="lunch"     stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dinner"    stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Recent Students Table ── */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Recent Students
              </h3>
              <button
                onClick={() => setActiveTab("Students")}
                className="text-xs text-gray-400 hover:text-black underline transition"
              >
                View all →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 pr-6">Name</th>
                    <th className="pb-3 pr-6">Email</th>
                    <th className="pb-3 pr-6">Plan</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="py-3 pr-6 font-medium text-gray-900">{s.name}</td>
                      <td className="py-3 pr-6 text-gray-500">{s.email}</td>
                      <td className="py-3 pr-6 text-gray-500">{s.plan}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${s.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                            }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;