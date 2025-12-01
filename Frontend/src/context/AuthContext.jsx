import { createContext, useContext, useEffect, useState } from "react";
import {
  registerStudent as registerStudentRequest,
  registerCandidate as registerCandidateRequest,
  login as loginRequest,
  getProfile as getAuthProfile,
} from "../services/authService";
import { getProfile } from "../services/profileService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("evote_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Try to get full profile first, fallback to basic profile
        try {
          const profile = await getProfile();
          setUser(profile);
        } catch (profileError) {
          // Fallback to basic auth profile
          console.warn("Full profile not available, using basic profile", profileError);
          const basicProfile = await getAuthProfile();
          setUser(basicProfile.user);
        }
      } catch (error) {
        console.error("Unable to load profile", error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  const persistAuth = (tokenValue, profile) => {
    localStorage.setItem("evote_token", tokenValue);
    setToken(tokenValue);
    setUser(profile);
  };

  const registerStudent = async (form) => {
    const data = await registerStudentRequest(form);
    persistAuth(data.token, data.user);
    return data;
  };

  const registerCandidate = async (form) => {
    const data = await registerCandidateRequest(form);
    persistAuth(data.token, data.user);
    return data;
  };

  const login = async (credentials) => {
    const data = await loginRequest(credentials);
    persistAuth(data.token, data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("evote_token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    registerStudent,
    registerCandidate,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

