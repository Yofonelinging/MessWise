import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Admin Login:", formData);

    // call admin login API here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >

        <h2 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h2>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm mb-1">Admin Email</label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
        >
          Login
        </button>

        <p className="text-sm text-center mt-4">
          Student Login?{" "}
          <span
            onClick={() => navigate("/login")}
            className="underline cursor-pointer"
          >
            Click here
          </span>
        </p>

      </form>

    </div>
  );
};

export default AdminLogin;