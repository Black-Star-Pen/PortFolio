import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ||
  (import.meta.env.DEV ? "1x00000000000000000000AA" : "");
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(fail, 15000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        scriptPromise = null;
        reject(new Error("Vérification indisponible"));
      }
      script.src = SCRIPT_URL;
      script.async = true;
      script.onerror = fail;
      script.onload = () => {
        if (!window.turnstile) return fail();
        clearTimeout(timer);
        resolve(window.turnstile);
      };
      document.head.append(script);
    });
  }
  return scriptPromise;
}

export default function TurnstileChallenge({ onTokenChange }) {
  const { lang, t } = useLanguage();
  const containerRef = useRef(null);
  const [status, setStatus] = useState(SITE_KEY ? "loading" : "error");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    let widgetId;
    let api;
    onTokenChange("");
    loadTurnstile().then((turnstile) => {
      if (cancelled) return;
      api = turnstile;
      widgetId = api.render(containerRef.current, {
        sitekey: SITE_KEY,
        action: "contact",
        language: lang,
        theme: "auto",
        size: "flexible",
        "response-field": false,
        "refresh-expired": "manual",
        callback: (token) => {
          if (cancelled) return;
          onTokenChange(token);
          setStatus("verified");
        },
        "expired-callback": () => {
          if (cancelled) return;
          onTokenChange("");
          setStatus("loading");
          api.reset(widgetId);
        },
        "error-callback": () => {
          if (cancelled) return;
          onTokenChange("");
          setStatus("error");
        },
        "timeout-callback": () => {
          if (cancelled) return;
          onTokenChange("");
          setStatus("error");
        },
      });
    }).catch(() => {
      if (!cancelled) setStatus("error");
    });
    return () => {
      cancelled = true;
      if (widgetId !== undefined) api.remove(widgetId);
    };
  }, [lang, attempt, onTokenChange]);

  return (
    <div className="form-antibot">
      <div ref={containerRef} />
      <p className="form-status" role="status">
        {status === "error" ? t.form.antibotUnavailable
          : status === "verified" ? t.form.antibotVerified : t.form.antibotLoading}
      </p>
      {status === "error" && SITE_KEY && (
        <button type="button" className="btn btn-secondary btn-small" onClick={() => {
          setStatus("loading");
          setAttempt((value) => value + 1);
        }}>{t.form.antibotRetry}</button>
      )}
    </div>
  );
}
