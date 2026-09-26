// La soudure qui fait le tour d'un encadré.
// variant : "blue" pour la version bleue (arc TIG), rien pour la version dorée.
function Weld({ variant }) {
  return (
    <div className={`weld ${variant ? `weld-${variant}` : ""}`} aria-hidden="true">
      <span className="weld-line weld-top"></span>
      <span className="weld-line weld-right"></span>
      <span className="weld-line weld-bottom"></span>
      <span className="weld-line weld-left"></span>
      <span className="weld-spark"></span>
    </div>
  );
}

export default Weld;