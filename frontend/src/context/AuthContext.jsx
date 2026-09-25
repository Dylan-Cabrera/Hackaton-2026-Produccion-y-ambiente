import { createContext, useContext, useEffect, useState } from "react";
import {
  deleteAccount,
  getProfile,
  loginAccount,
  logoutAccount,
  registerAccount,
  updateAccount,
  updateProducerProfile,
} from "@/lib/api";

const AuthContext = createContext(null);

// status: "loading" (resolviendo sesión) | "authenticated" | "anonymous"
// user.role: "CONSUMER" | "PRODUCER" | "ADMIN"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    getProfile()
      .then((account) => {
        setUser(account);
        setStatus(account ? "authenticated" : "anonymous");
      })
      .catch(() => setStatus("anonymous"));
  }, []);

  async function register(data) {
    const { user: account } = await registerAccount(data);
    setUser(account);
    setStatus("authenticated");
    return account;
  }

  async function login(email, password) {
    const { user: account } = await loginAccount(email, password);
    setUser(account);
    setStatus("authenticated");
    return account;
  }

  async function logout() {
    await logoutAccount();
    setUser(null);
    setStatus("anonymous");
  }

  // Campos de cuenta (nombre, teléfono, localidad...), válidos para cualquier rol
  async function updateProfile(data) {
    const account = await updateAccount(data);
    setUser(account);
    return account;
  }

  // Campos propios del emprendimiento; solo tiene sentido para role === "PRODUCER"
  async function updateBusinessProfile(data) {
    const account = await updateProducerProfile(data);
    setUser(account);
    return account;
  }

  async function removeAccount() {
    await deleteAccount();
    setUser(null);
    setStatus("anonymous");
  }

  return (
    <AuthContext.Provider
      value={{ user, status, register, login, logout, updateProfile, updateBusinessProfile, removeAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
