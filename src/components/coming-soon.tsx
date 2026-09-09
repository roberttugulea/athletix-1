export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description?: string;
}) {
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{phase.toUpperCase()}</p>
          <h1>{title}</h1>
          <p className="subtitle">
            {description ??
              "Questa sezione sarà disponibile in un prossimo incremento."}
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="empty-state">
          <span className="empty-icon">⧗</span>
          <h3>In sviluppo</h3>
          <p>
            La struttura di navigazione e i permessi sono già attivi. Il modulo{" "}
            «{title}» verrà implementato nella {phase}.
          </p>
        </div>
      </section>
    </div>
  );
}
