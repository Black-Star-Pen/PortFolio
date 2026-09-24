function SectionTitle({ label, title, accent, subtitle }) {
  return (
    <div className="section-title">
      <span className="section-label">{label}</span>
      <h2>
        {title}
        {accent && <em>{accent}</em>}
      </h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export default SectionTitle;