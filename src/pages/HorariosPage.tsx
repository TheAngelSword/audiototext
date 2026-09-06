import { horarios9114 } from "../data/horarios9114";
import "../styles/atrio-ui.css";

function shortSubject(subject: string) {
  return subject.replace(" (Primer ingreso)", "");
}

export default function HorariosPage() {
  return (
    <main className="atrio-page atrio-page-enter">
      <header className="atrio-page-header">
        <div>
          <span className="atrio-kicker">GRUPO 9114 · PRIMER SEMESTRE</span>
          <h1>Horarios</h1>
          <p>Facultad de Derecho · Horario académico del grupo</p>
        </div>
      </header>

      <section className="atrio-stats" aria-label="Resumen del horario">
        <article className="atrio-stat-card">
          <span>Materias</span>
          <strong>7</strong>
          <small>Carga académica del grupo</small>
        </article>
        <article className="atrio-stat-card">
          <span>Horario general</span>
          <strong>07:00–14:00</strong>
          <small>Bloques continuos de una hora</small>
        </article>
        <article className="atrio-stat-card">
          <span>Salón principal</span>
          <strong>D-106</strong>
          <small>6 de las 7 materias</small>
        </article>
      </section>

      <section className="atrio-panel atrio-table-panel">
        <div className="atrio-panel__heading">
          <div>
            <h2>Horario del grupo</h2>
            <p>Profesores, claves, horas y salones.</p>
          </div>
          <span className="atrio-badge">9114</span>
        </div>

        <div className="atrio-schedule-table-wrap">
          <table className="atrio-schedule-table">
            <thead>
              <tr>
                <th>Asignatura</th>
                <th>Profesor(a)</th>
                <th>Clave</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Salón</th>
              </tr>
            </thead>
            <tbody>
              {horarios9114.map((item, index) => (
                <tr key={item.clave} style={{ animationDelay: `${index * 45}ms` }}>
                  <td>
                    <strong>{shortSubject(item.asignatura)}</strong>
                    <small>Primer ingreso</small>
                  </td>
                  <td>{item.grado} {item.nombre} {item.apellidos}</td>
                  <td><span className="atrio-code">{item.clave}</span></td>
                  <td>{item.inicio}</td>
                  <td>{item.fin}</td>
                  <td><span className="atrio-room">{item.salon}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="atrio-schedule-cards">
          {horarios9114.map((item, index) => (
            <article
              key={item.clave}
              className="atrio-schedule-card"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="atrio-schedule-card__time">
                <strong>{item.inicio}</strong>
                <span>—</span>
                <strong>{item.fin}</strong>
              </div>
              <div className="atrio-schedule-card__body">
                <h3>{shortSubject(item.asignatura)}</h3>
                <p>{item.grado} {item.nombre} {item.apellidos}</p>
                <div className="atrio-schedule-card__meta">
                  <span>Clave {item.clave}</span>
                  <span>Salón {item.salon}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
