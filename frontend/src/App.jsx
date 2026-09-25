import { Route, Routes } from "react-router-dom";
import SiteNav from "@/components/SiteNav";
import { AuthProvider } from "@/context/AuthContext";
import CatalogPage from "@/pages/CatalogPage";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import MyProductsPage from "@/pages/MyProductsPage";
import MapPage from "@/pages/MapPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <SiteNav />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mis-productos" element={<MyProductsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
