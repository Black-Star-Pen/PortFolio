function SectionTitle({ label, title, accent, subtitle }) {
  return (
    <div className="section-title">
      {/* Le libellé a deux balises : le filet (section-label) et l'onglet posé dessus (section-name) */}
      <span className="section-label">
        <span className="section-name">{label}</span>
      </span>
      <h2>
        {title}
        {accent && <em>{accent}</em>}
      </h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export default SectionTitle;
