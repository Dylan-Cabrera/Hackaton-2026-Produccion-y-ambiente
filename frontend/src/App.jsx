import { Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import SiteNav from "@/components/SiteNav";
import { AuthProvider } from "@/context/AuthContext";
import CatalogPage from "@/pages/CatalogPage";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import MyProductsPage from "@/pages/MyProductsPage";
import MapPage from "@/pages/MapPage";
import NeedsPage from "@/pages/NeedsPage";
import NeedCreatePage from "@/pages/NeedCreatePage";
import NeedDetailPage from "@/pages/NeedDetailPage";
import ProducerDemandPage from "@/pages/ProducerDemandPage";
import ProducerProfilePage from "@/pages/ProducerProfilePage";
import AccountPage from "@/pages/AccountPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  const { pathname } = useLocation();

  return (
    <AuthProvider>
      <SiteNav />
      {/* key=pathname: si una pantalla se rompe, navegar a otra ruta resetea el boundary */}
      <ErrorBoundary key={pathname}>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mis-productos" element={<MyProductsPage />} />
          <Route path="/necesidades" element={<NeedsPage />} />
          <Route path="/necesidades/nueva" element={<NeedCreatePage />} />
          <Route path="/necesidades/:id" element={<NeedDetailPage />} />
          <Route path="/mi-demanda" element={<ProducerDemandPage />} />
          <Route path="/productores/:id" element={<ProducerProfilePage />} />
          <Route path="/cuenta" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}
