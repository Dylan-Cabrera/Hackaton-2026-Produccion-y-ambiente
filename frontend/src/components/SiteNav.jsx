import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const linkClass = ({ isActive }) =>
  "rounded-md px-3 py-2 text-sm font-medium transition-colors " +
  (isActive ? "text-primary" : "text-muted-foreground hover:text-foreground");

export default function SiteNav() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-auto flex items-center gap-2 font-bold">
          <Sprout className="size-5 text-primary" />
          Mercado Km 0
        </Link>
        <NavLink to="/" end className={linkClass}>
          Catálogo
        </NavLink>
        <NavLink to="/mapa" className={linkClass}>
          Mapa
        </NavLink>
        <NavLink to="/necesidades" className={linkClass}>
          Necesidades
        </NavLink>
        {status === "authenticated" ? (
          <>
            {user?.role === "PRODUCER" && (
              <NavLink to="/mis-productos" className={linkClass}>
                Mis productos
              </NavLink>
            )}
            <span className="px-2 text-sm text-muted-foreground">
              {user?.businessName ?? user?.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Salir
            </Button>
          </>
        ) : (
          <>
            <NavLink to="/registro" className={linkClass}>
              Crear cuenta
            </NavLink>
            <NavLink to="/login" className={linkClass}>
              Ingresar
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
