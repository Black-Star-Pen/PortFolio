import { useState, useEffect, useRef } from "react";
import timelineData from "../data/timelineData.json";

function Timeline() {
  const [progress, setProgress] = useState(0);
  const [reachedCount, setReachedCount] = useState(0);
  const bodyRef = useRef(null);

  useEffect(() => {
    function handleScroll() {
      const body = bodyRef.current;
      if (!body) return;

      const triggerLine = window.innerHeight * 0.6;
      const rect = body.getBoundingClientRect();
      const value = (triggerLine - rect.top) / rect.height;
      setProgress(Math.min(Math.max(value, 0), 1));

      const dots = body.querySelectorAll(".timeline-dot");
      const reached = [...dots].filter(
        (dot) => dot.getBoundingClientRect().top < triggerLine,
      );
      setReachedCount(reached.length);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const isWelding = progress > 0 && progress < 1;

  return (
    <div className="timeline">
      <p className="timeline-heading">
        Gamme de fabrication · Développeur Full Stack
      </p>

      <div
        className={`timeline-body ${isWelding ? "welding" : ""}`}
        ref={bodyRef}
        style={{ "--progress": progress }}
      >
        <div className="timeline-track" aria-hidden="true">
          <div className="timeline-weld"></div>
          <div className="timeline-spark"></div>
        </div>

        <ol className="timeline-list">
          {timelineData.map((step, index) => (
            <li
              key={step.id}
              className={`timeline-item ${index < reachedCount ? "reached" : ""}`}
            >
              <span className="timeline-dot" aria-hidden="true"></span>
              <div className="timeline-content">
                <div className="timeline-meta">
                  <span className="timeline-op">OP {(index + 1) * 10}</span>
                  <span className="timeline-date">{step.date}</span>
                  <span className={`timeline-type ${step.type}`}>
                    {step.type === "formation" ? "Formation" : "Expérience"}
                  </span>
                  {step.status && (
                    <span className="timeline-type timeline-status">
                      {step.status}
                    </span>
                  )}
                </div>
                <h3>{step.title}</h3>
                <p className="timeline-place">{step.place}</p>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default Timeline;
