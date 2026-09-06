import { Navigate, Route, Routes } from "react-router-dom";
import HorariosPage from "../pages/HorariosPage";
import BitacoraPage from "../pages/BitacoraPage";

// Integra estas rutas dentro de tu <Routes> actual.
export default function AtrioRoutesExample() {
  return (
    <Routes>
      <Route path="/horarios" element={<HorariosPage />} />
      <Route path="/bitacora" element={<BitacoraPage currentUserName="Angel" />} />

      {/* Mantiene compatibilidad con enlaces antiguos */}
      <Route path="/clases" element={<Navigate to="/horarios" replace />} />
    </Routes>
  );
}
