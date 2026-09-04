"use client";

import { useState } from "react";

const navigation = [
  "Dashboard", "Strutture", "Spazi", "Gruppi", "Atleti", "Calendario",
  "Presenze", "Gare & Eventi", "Pagamenti", "Comunicazioni", "Report", "Impostazioni",
];

const symbols: Record<string, string> = {
  Dashboard: "▦", Strutture: "⌂", Spazi: "⊞", Gruppi: "◉", Atleti: "♙",
  Calendario: "□", Presenze: "✓", "Gare & Eventi": "★", Pagamenti: "▭",
  Comunicazioni: "◌", Report: "▥", Impostazioni: "⚙",
};

function Arrow() {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="app-shell">
      {menuOpen && <button className="mobile-backdrop" aria-label="Chiudi menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="brand"><b>A</b><span>ATHLETIX</span></div>
        <div className="workspace"><i />Organizzazione sportiva <em>⌄</em></div>
        <nav aria-label="Navigazione principale">
          <p className="nav-label">GESTIONE</p>
          {navigation.slice(0, 9).map((item) => <button key={item} className={active === item ? "active" : ""} onClick={() => { setActive(item); setMenuOpen(false); }}><span className="nav-symbol">{symbols[item]}</span>{item}</button>)}
          <p className="nav-label secondary">ANALISI</p>
          {navigation.slice(9).map((item) => <button key={item} className={active === item ? "active" : ""} onClick={() => { setActive(item); setMenuOpen(false); }}><span className="nav-symbol">{symbols[item]}</span>{item}</button>)}
        </nav>
        <div className="help"><b>?</b><div><strong>Serve una mano?</strong><span>Consulta il centro assistenza</span></div></div>
        <div className="account"><span className="avatar">AM</span><div><strong>Amministratore</strong><small>Account organizzazione</small></div><b>•••</b></div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="menu-button" aria-label="Apri menu" onClick={() => setMenuOpen(true)}>☰</button>
          <span className="mobile-brand">ATHLETIX</span>
          <div className="top-actions"><button aria-label="Cerca">⌕</button><button aria-label="Notifiche">♧</button><span className="avatar">AM</span></div>
        </header>
        <div className="content">
          <div className="page-heading"><div><p className="eyebrow">PANORAMICA</p><h1>Buongiorno, Amministratore</h1><p className="subtitle">Ecco una sintesi della tua organizzazione.</p></div><button className="primary-button"><span>＋</span><span className="desktop-label">Nuova attività</span></button></div>

          <section className="summary-grid" aria-label="Riepilogo organizzazione">
            <Stat color="blue" icon="♙" label="Atleti" note="Collega i tuoi dati per iniziare" />
            <Stat color="purple" icon="◉" label="Gruppi attivi" note="Nessun gruppo configurato" />
            <Stat color="amber" icon="□" label="Attività in programma" note="Calendario da configurare" />
            <Stat color="green" icon="✓" label="Presenze registrate" note="In attesa di rilevazioni" />
          </section>

          <section className="dashboard-grid">
            <article className="panel calendar-panel">
              <div className="panel-heading"><div><h2>Prossime attività</h2><p>La pianificazione dei prossimi giorni</p></div><button className="text-button">Vai al calendario <Arrow /></button></div>
              <div className="empty-state"><span className="empty-icon">□</span><h3>Nessuna attività programmata</h3><p>Quando creerai allenamenti, eventi o gare, li troverai qui.</p><button className="outline-button">＋ Pianifica un’attività</button></div>
            </article>
            <article className="panel quick-panel">
              <div className="panel-heading"><div><h2>Azioni rapide</h2><p>Inizia a configurare ATHLETIX</p></div></div>
              <div className="quick-actions"><Quick color="blue" icon="⌂" title="Aggiungi struttura" note="Definisci sedi e impianti" /><Quick color="purple" icon="◉" title="Crea un gruppo" note="Organizza squadre e corsi" /><Quick color="amber" icon="♙" title="Invita atleti" note="Costruisci il tuo roster" /></div>
            </article>
          </section>

          <section className="panel onboarding"><div className="onboarding-copy"><span>✦</span><div><p className="eyebrow">PRIMI PASSI</p><h2>La tua organizzazione è pronta per partire</h2><p>Completa la configurazione iniziale per iniziare a gestire attività, persone e spazi in un unico posto.</p></div></div><button>Completa configurazione <Arrow /></button></section>
        </div>
      </section>
    </main>
  );
}

function Stat({ color, icon, label, note }: { color: string; icon: string; label: string; note: string }) {
  return <article className="summary-card"><span className={`summary-icon ${color}`}>{icon}<i /></span><div><p>{label}</p><strong>—</strong><small>{note}</small></div></article>;
}

function Quick({ color, icon, title, note }: { color: string; icon: string; title: string; note: string }) {
  return <button><span className={`quick-icon ${color}`}>{icon}</span><span><strong>{title}</strong><small>{note}</small></span><Arrow /></button>;
}
