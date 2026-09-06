import { NavLink } from "react-router-dom";
import "../styles/atrio-ui.css";

type SidebarProps = {
  userName?: string;
  onLogout?: () => void;
  facultyLogoSrc?: string;
};

type IconName =
  | "home"
  | "schedule"
  | "chair"
  | "calendar"
  | "book"
  | "camera"
  | "route"
  | "users"
  | "megaphone"
  | "shield"
  | "controls";

const navItems: Array<{ label: string; to: string; icon: IconName }> = [
  { label: "Inicio", to: "/", icon: "home" },
  { label: "Horarios", to: "/horarios", icon: "schedule" },
  { label: "Cátedras", to: "/catedras", icon: "chair" },
  { label: "Agenda", to: "/agenda", icon: "calendar" },
  { label: "Libros", to: "/libros", icon: "book" },
  { label: "Bitácora", to: "/bitacora", icon: "camera" },
  { label: "Rutas", to: "/rutas", icon: "route" },
  { label: "Mesas", to: "/mesas", icon: "users" },
  { label: "Mural", to: "/mural", icon: "megaphone" },
  { label: "Registro", to: "/registro", icon: "shield" },
  { label: "Control", to: "/control", icon: "controls" },
];

function NavIcon({ name }: { name: IconName }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-7h6v7"/></>,
    schedule: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h3M13 14h3M8 17h3"/></>,
    chair: <><path d="M4 20h16M5 9l7-5 7 5M7 10v7M11 10v7M15 10v7M19 10v7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></>,
    camera: <><path d="M14.5 5 13 3h-2L9.5 5H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><circle cx="12" cy="12.5" r="4"/></>,
    route: <><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    megaphone: <><path d="m3 11 15-5v12L3 13z"/><path d="M11.5 15.5 13 21H8l-1.5-6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></>,
    controls: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10M8 4v6M8 14v6M16 14v6M16 4v6"/></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function Sidebar({
  userName = "Angel",
  onLogout,
  facultyLogoSrc = "/assets/facultad-derecho-unam.png",
}: SidebarProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || "A";

  return (
    <aside className="atrio-sidebar">
      <div className="atrio-sidebar__top">
        <div className="atrio-faculty-brand">
          <img
            className="atrio-faculty-brand__logo"
            src={facultyLogoSrc}
            alt="Facultad de Derecho UNAM"
          />
          <div className="atrio-faculty-brand__copy">
            <strong>Facultad de Derecho</strong>
            <span>Universidad Nacional Autónoma de México</span>
          </div>
        </div>

        <section className="atrio-group-card" aria-label="Grupo activo">
          <div className="atrio-group-card__eyebrow">
            <span className="atrio-group-card__spark">✦</span>
            GRUPO ACTIVO
          </div>
          <div className="atrio-group-card__title">9114 · Derecho</div>
          <div className="atrio-group-card__meta">Primer semestre · Facultad</div>
        </section>

        <nav className="atrio-nav" aria-label="Navegación principal">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `atrio-nav__item ${isActive ? "is-active" : ""}`
              }
              style={{ animationDelay: `${index * 32}ms` }}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Bitácora" && <span className="atrio-nav__new">NUEVO</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <footer className="atrio-sidebar__footer">
        <div className="atrio-user-row">
          <div className="atrio-avatar">{initial}</div>
          <div className="atrio-user-row__name">{userName}</div>
          {onLogout && (
            <button type="button" className="atrio-logout" onClick={onLogout}>
              Salir
            </button>
          )}
        </div>
        <p>Comunidad académica privada · grupo 9114</p>
      </footer>
    </aside>
  );
}
