import { createContext, useContext, useEffect, useState } from "react";
import { getProfile, loginProducer, logoutProducer, registerProducer, updateProducer } from "@/lib/api";

const AuthContext = createContext(null);

// status: "loading" (resolviendo sesión) | "authenticated" | "anonymous"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    getProfile()
      .then((producer) => {
        setUser(producer);
        setStatus(producer ? "authenticated" : "anonymous");
      })
      .catch(() => setStatus("anonymous"));
  }, []);

  async function register(data) {
    const { producer } = await registerProducer(data);
    setUser(producer);
    setStatus("authenticated");
    return producer;
  }

  async function login(email, password) {
    const { producer } = await loginProducer(email, password);
    setUser(producer);
    setStatus("authenticated");
    return producer;
  }

  async function logout() {
    await logoutProducer();
    setUser(null);
    setStatus("anonymous");
  }

  async function updateProfile(data) {
    const producer = await updateProducer(user.id, data);
    setUser(producer);
    return producer;
  }

  return (
    <AuthContext.Provider value={{ user, status, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
