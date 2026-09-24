import { Route, Routes } from "react-router-dom";
import SiteNav from "@/components/SiteNav";
import CatalogPage from "@/pages/CatalogPage";
import RegisterPage from "@/pages/RegisterPage";
import MyProductsPage from "@/pages/MyProductsPage";
import MapPage from "@/pages/MapPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <>
      <SiteNav />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/mis-productos" element={<MyProductsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
