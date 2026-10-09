// La soudure qui fait le tour d'un encadré.
// variant : "blue" pour la version bleue (arc TIG), rien pour la version dorée.
// isDone : la soudure a déjà été faite, on affiche le cordon en place sans rejouer l'animation.
function Weld({ variant, isDone }) {
  const classes = ["weld", variant && `weld-${variant}`, isDone && "weld-done"];

  return (
    // filter(Boolean) retire les cases vides (les options non demandées) avant de coller les classes
    <div className={classes.filter(Boolean).join(" ")} aria-hidden="true">
      <span className="weld-line weld-top"></span>
      <span className="weld-line weld-right"></span>
      <span className="weld-line weld-bottom"></span>
      <span className="weld-line weld-left"></span>
      <span className="weld-spark"></span>
    </div>
  );
}

export default Weld;
