import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    const registrationNo = localStorage.getItem("registrationNo");
    const name = localStorage.getItem("name");

    if (token && role && username) {
      setUser({ token, role, username, registrationNo, name });
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    const res = await axios.post("https://e-campus-backend.onrender.com/api/login", {
      username,
      password,
    });

    const { token, role, username: loggedUser, registrationNo, name } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", loggedUser);
    if (registrationNo) localStorage.setItem("registrationNo", registrationNo);
    if (name) localStorage.setItem("name", name);

    setUser({ token, role, username: loggedUser, registrationNo: registrationNo || null, name: name || null });

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  // Logout function
  const logout = () => {
    localStorage.clear();
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  // Helpers: check roles
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isTeacher, isStudent }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => useContext(AuthContext);
