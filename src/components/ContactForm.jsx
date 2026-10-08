import { useState, useId, useRef, useEffect, useLayoutEffect } from "react";
import Weld from "./Weld";
import { API_URL } from "../utils/api";
import { useLanguage } from "../i18n/LanguageContext";

/* ===== Les listes de choix ===== */
// Une petite mallette, pour mettre en avant le choix « Recrutement »
const briefcaseIcon = (
  <svg
    className="type-option-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
  </svg>
);

// Chaque choix a une « value » : c'est elle qui est envoyée au serveur, elle ne change jamais.
// Le texte affiché, lui, dépend de la langue : il est dans src/i18n/texts.js (t.form.types, etc.),
// rangé sous la même « value ».
const requestTypes = [
  { value: "site" },
  { value: "application" },
  // variant : un style à part (bleu acier, la couleur de la fiche de poste) ; icon : l'icône affichée devant
  { value: "recrutement", variant: "steel", icon: briefcaseIcon },
  { value: "autre" },
];

// Cette liste doit rester la même que CONTRACT_TYPES dans server/validation.js : le serveur refuse
// tout contrat qui n'y est pas.
const contractTypes = [
  { value: "cdi" },
  { value: "cdd" },
  // unavailable : affiché, mais grisé et non cliquable, avec la mention « indisponible »
  { value: "freelance", unavailable: true },
];

const remoteOptions = [{ value: "site" }, { value: "hybride" }, { value: "remote" }];


const initialForm = {
  website: "", // champ piège anti-robots, toujours vide pour un humain
  type: "",
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  position: "",
  contract: "",
  remote: "",
  postalCode: "",
  city: "",
  message: "",
};

// L'ordre d'affichage des champs : sert à trouver la PREMIÈRE erreur de la page
const fieldOrder = [
  "type",
  "firstName",
  "lastName",
  "email",
  "company",
  "position",
  "contract",
  "postalCode",
  "city",
  "message",
];

// Lettres (accents compris), espaces, tirets et apostrophes : "Jean-Pierre", "D'Artagnan"
const NAME_PATTERN = /^\p{L}[\p{L}\s'’-]*$/u;

/* ===== L'email : forme stricte et détection des fautes de frappe ===== */

// Forme stricte : caractères autorisés, un seul @, et une extension d'au moins 2 lettres
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

function isEmailValid(email) {
  // ".." est interdit, et une adresse ne commence ni ne finit par un point
  return EMAIL_PATTERN.test(email) && !email.includes("..") && !email.startsWith(".") && !email.includes(".@");
}

// Les fournisseurs les plus courants, pour repérer les fautes de frappe
const COMMON_DOMAINS = [
  "gmail.com", "hotmail.fr", "hotmail.com", "outlook.fr", "outlook.com",
  "live.fr", "yahoo.fr", "yahoo.com", "orange.fr", "wanadoo.fr",
  "free.fr", "sfr.fr", "laposte.net", "icloud.com", "protonmail.com",
];

// Nombre de fautes pour passer d'un mot à l'autre : lettre ajoutée, supprimée,
// remplacée, ou deux lettres inversées (distance de Damerau-Levenshtein)
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);

      // Deux lettres inversées ("gmial" / "gmail") comptent pour une seule faute
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// "adam@hamil.fr" → "adam@hotmail.fr" ; renvoie null s'il n'y a rien à proposer
function suggestEmail(email) {
  const [local, domain] = email.toLowerCase().split("@");
  if (!local || !domain || COMMON_DOMAINS.includes(domain)) return null;

  let best = null;
  let bestDistance = Infinity;

  for (const known of COMMON_DOMAINS) {
    const distance = editDistance(domain, known);
    // Plus le nom est long, plus on tolère de fautes
    const tolerance = known.length >= 9 ? 3 : 2;
    if (distance <= tolerance && distance < bestDistance) {
      best = known;
      bestDistance = distance;
    }
  }

  return best ? `${local}@${best}` : null;
}

/* ===== La validation ===== */
// messages : les textes des erreurs dans la langue en cours (t.form.errors, voir src/i18n/texts.js)
function validate(form, cityLookup, messages) {
  const errors = {};

  if (!form.type) {
    errors.type = messages.type;
  }
  if (!NAME_PATTERN.test(form.firstName.trim())) {
    errors.firstName = messages.firstName;
  }
  if (!NAME_PATTERN.test(form.lastName.trim())) {
    errors.lastName = messages.lastName;
  }
  if (!isEmailValid(form.email)) {
    errors.email = messages.email;
  }

  // Champs supplémentaires, vérifiés uniquement pour un recrutement
  if (form.type === "recrutement") {
    if (form.company.trim().length < 2) {
      errors.company = messages.company;
    }
    if (form.position.trim().length < 2) {
      errors.position = messages.position;
    }
    if (!form.contract) {
      errors.contract = messages.contract;
    }

    // Code postal et ville, selon la réponse du service officiel
    if (!/^\d{5}$/.test(form.postalCode)) {
      errors.postalCode = messages.postalCode;
    } else if (cityLookup.status === "loading") {
      errors.postalCode = messages.postalCodeLoading;
    } else if (cityLookup.status === "notfound") {
      errors.postalCode = messages.postalCodeUnknown;
    } else if (cityLookup.status === "found" && !cityLookup.communes.includes(form.city)) {
      errors.city = messages.cityChoose;
    } else if (cityLookup.status === "error" && form.city.trim().length < 2) {
      errors.city = messages.city;
    }
  }

  if (form.message.trim().length < 20) {
    errors.message = messages.message;
  }

  return errors;
}

/* ===== L'astérisque des champs obligatoires ===== */
// aria-hidden : un lecteur d'écran ne lit pas « astérisque ». Il annonce « obligatoire » grâce à
// l'attribut aria-required posé sur le champ (ou au texte caché « obligatoire », pour un groupe de boutons).
function RequiredMark() {
  return (
    <span className="form-required" aria-hidden="true">
      *
    </span>
  );
}

/* ===== Un champ de saisie réutilisable ===== */
// Tous les champs de saisie du formulaire sont obligatoires : chacun porte l'astérisque
function TextField({ id, name, label, error, children, ...inputProps }) {
  return (
    <div className={`form-field ${error ? "has-error" : ""}`} data-field={name}>
      <label htmlFor={`${id}-${name}`}>
        {label}
        <RequiredMark />
      </label>
      <input
        id={`${id}-${name}`}
        name={name}
        aria-required="true"
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-${name}-error`}
        {...inputProps}
      />
      {error && (
        <p className="form-error" id={`${id}-${name}-error`}>
          {error}
        </p>
      )}
      {children}
    </div>
  );
}

/* ===== Un groupe de boutons à choix unique, réutilisable ===== */
// labels : le texte de chaque choix dans la langue en cours, rangé sous sa « value » (ex. : { cdi: "CDI" })
function OptionGroup({ name, legend, options, labels, value, onSelect, error, optional = false }) {
  const { t } = useLanguage();

  return (
    <fieldset className={`form-field ${error ? "has-error" : ""}`} data-field={name}>
      <legend>
        {legend}
        {optional ? (
          <span className="form-optional">{t.form.optional}</span>
        ) : (
          <>
            <RequiredMark />
            <span className="sr-only">{t.form.required}</span>
          </>
        )}
      </legend>
      <div className="type-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            // Une option ordinaire est un bouton doré (btn-primary). La variante « steel » porte à la
            // place le contour en acier bleui des boutons (btn-metal btn-metal-blue, voir le CSS, section 6).
            className={`btn btn-small type-option ${
              option.variant === "steel"
                ? "btn-metal btn-metal-blue type-option-steel"
                : "btn-primary"
            } ${option.unavailable ? "type-option-unavailable" : ""} ${
              value === option.value ? "selected" : ""
            }`}
            aria-pressed={value === option.value}
            disabled={option.unavailable}
            onClick={() => onSelect(name, option.value)}
          >
            {option.icon}
            {labels[option.value]}
            {option.unavailable && <span className="type-option-note">{t.form.unavailable}</span>}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
    </fieldset>
  );
}

/* ===== Le formulaire ===== */
function ContactForm() {
  // lang : la langue en cours ; f : les textes du formulaire dans cette langue (voir src/i18n/texts.js)
  const { lang, t } = useLanguage();
  const f = t.form;
  const id = useId();
  const orderRef = useRef(null);
  const formRef = useRef(null);
  const lookupRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [retryIn, setRetryIn] = useState(0);

  // Quand la demande est validée, le long formulaire laisse la place à un petit message : la page
  // raccourcit d'un coup. Sans rien faire, l'écran resterait où il était (tout en bas du formulaire) :
  // le message se retrouverait au-dessus, hors de vue, et on verrait le bas de la page remonter.
  // On recadre donc aussitôt l'écran sur le message, au centre.
  // useLayoutEffect passe AVANT que le navigateur affiche le changement : on ne voit pas la page sauter.
  // « instant » passe outre le défilement doux réglé dans le CSS (scroll-behavior).
  useLayoutEffect(() => {
    if (status === "success") {
      orderRef.current.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [status]);

  // Compte à rebours après un refus "trop de messages" (429)
  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = setTimeout(() => {
      if (retryIn === 1) setSubmitError("");
      setRetryIn(retryIn - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [retryIn]);

  const emailSuggestion = suggestEmail(form.email);
  const [cityLookup, setCityLookup] = useState({ status: "idle", communes: [] });
  const [orderNumber] = useState(
    () => `OF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const isRecruitment = form.type === "recrutement";

  // Interroge le service officiel des communes : geo.api.gouv.fr
  async function lookupCommunes(postalCode) {
    // Annule la recherche précédente si elle est encore en cours
    lookupRef.current?.abort();
    const controller = new AbortController();
    lookupRef.current = controller;

    setCityLookup({ status: "loading", communes: [] });

    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom&format=json`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error("Réponse invalide");

      const data = await response.json();
      const communes = data.map((commune) => commune.nom).sort((a, b) => a.localeCompare(b, "fr"));

      setCityLookup({ status: communes.length > 0 ? "found" : "notfound", communes });
      // Une seule commune : on la sélectionne automatiquement
      setForm((previous) => ({ ...previous, city: communes.length === 1 ? communes[0] : "" }));
    } catch (error) {
      // Une recherche annulée n'est pas une vraie erreur
      if (error.name === "AbortError") return;
      // Service indisponible : on laissera la saisie libre
      setCityLookup({ status: "error", communes: [] });
    }
  }

  function handleChange(event) {
    const { name } = event.target;
    let { value } = event.target;

    if (name === "postalCode") {
      // Uniquement des chiffres, 5 maximum
      value = value.replace(/\D/g, "").slice(0, 5);

      if (value.length === 5) {
        lookupCommunes(value);
      } else {
        lookupRef.current?.abort();
        setCityLookup({ status: "idle", communes: [] });
      }

      setForm((previous) => ({ ...previous, postalCode: value, city: "" }));
      setErrors((previous) => ({ ...previous, postalCode: undefined, city: undefined }));
      return;
    }

    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  function selectOption(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  // Amène le premier champ en erreur face à l'utilisateur
  function showFirstError(newErrors) {
    const firstKey = fieldOrder.find((key) => newErrors[key]);
    if (!firstKey) return;

    requestAnimationFrame(() => {
      const field = formRef.current?.querySelector(`[data-field="${firstKey}"]`);
      if (!field) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      field.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      field.querySelector("input, select, textarea, button")?.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newErrors = validate(form, cityLookup, f.errors);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showFirstError(newErrors);
      return;
    }

    // On garde le message d'erreur affiché pendant l'envoi :
    // l'effacer puis le réafficher ferait "sauter" la page
    setStatus("sending");

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // lang : la langue du site au moment de l'envoi. Elle est indiquée dans l'email reçu,
        // pour savoir dans quelle langue répondre au visiteur.
        body: JSON.stringify({ ...form, lang }),
      });
      const result = await response.json().catch(() => ({}));

      // 201 : message envoyé
      if (response.ok) {
        setSubmitError("");
        setStatus("success");
        return;
      }

      setStatus("idle");

      // Le serveur écrit ses messages en français. En anglais, f.serverErrors donne leur équivalent
      // (un par champ) ; en français, f.serverErrors vaut null et on garde les messages du serveur.
      const serverErrors = f.serverErrors;

      // 400 : le serveur a trouvé des erreurs dans les champs
      if (response.status === 400 && result.errors) {
        const fieldErrors = serverErrors
          ? Object.fromEntries(
              Object.keys(result.errors).map((field) => [field, serverErrors[field] ?? f.errors.generic])
            )
          : result.errors;

        setSubmitError("");
        setErrors(fieldErrors);
        showFirstError(fieldErrors);
        return;
      }

      // 429 (trop d'envois), 502 (Gmail indisponible) ou autre erreur
      // 429 : le serveur indique dans combien de secondes réessayer
      if (response.status === 429) {
        setRetryIn(Number(response.headers.get("Retry-After")) || 60);
      }

      if (serverErrors) {
        setSubmitError(response.status === 429 ? serverErrors.tooMany : f.errors.generic);
      } else {
        setSubmitError(result.error || f.errors.generic);
      }
    } catch {
      // Le serveur ne répond pas du tout (éteint, pas de connexion...)
      setStatus("idle");
      setSubmitError(f.errors.network);
    }
  }

  function handleReset() {
    lookupRef.current?.abort();
    setForm(initialForm);
    setErrors({});
    setSubmitError("");
    setCityLookup({ status: "idle", communes: [] });
    setStatus("idle");
  }

  // Le champ Ville change selon l'avancée de la vérification
  function renderCityField() {
    const fieldId = `${id}-city`;
    const statusId = `${fieldId}-status`;
    const errorId = `${fieldId}-error`;

    // 1. Le texte d'état, selon l'avancée de la vérification
    let statusText = null;
    if (cityLookup.status === "found" && cityLookup.communes.length > 1) {
      statusText = f.cityCount(cityLookup.communes.length);
    } else if (cityLookup.status === "error") {
      statusText = f.cityUnavailable;
    }

    // 2. On relie au champ les textes réellement affichés, pour les lecteurs d'écran
    const describedBy = [statusText && statusId, errors.city && errorId].filter(Boolean).join(" ");

    const common = {
      id: fieldId,
      name: "city",
      value: form.city,
      onChange: handleChange,
      "aria-required": true,
      "aria-invalid": Boolean(errors.city),
      "aria-describedby": describedBy || undefined,
    };

    // 3. Le champ lui-même
    let control;
    if (cityLookup.status === "found") {
      control = (
        <select {...common}>
          {cityLookup.communes.length > 1 && <option value="">{f.cityChoose}</option>}
          {cityLookup.communes.map((commune) => (
            <option key={commune} value={commune}>
              {commune}
            </option>
          ))}
        </select>
      );
    } else if (cityLookup.status === "error") {
      control = <input {...common} type="text" autoComplete="address-level2" maxLength={100} />;
    } else {
      const placeholder = cityLookup.status === "loading" ? f.citySearching : f.cityWaiting;
      control = <input {...common} type="text" placeholder={placeholder} disabled />;
    }

    return (
      <div className={`form-field ${errors.city ? "has-error" : ""}`} data-field="city">
        <label htmlFor={fieldId}>
          {f.city}
          <RequiredMark />
        </label>
        {control}
        {statusText && (
          <p className="form-status" id={statusId}>
            {statusText}
          </p>
        )}
        {errors.city && (
          <p className="form-error" id={errorId}>
            {errors.city}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="work-order" ref={orderRef}>
      {/* Le trait bleu qui balaie la feuille à son apparition (voir « ORDER » dans le CSS, section 19 bis) */}
      <span className="work-order-scan" aria-hidden="true" />

      {status === "success" && <Weld />}

      <div className="work-order-header">
        <span>{f.header}</span>
        <span>
          {f.number} {orderNumber}
        </span>
      </div>

      {status === "success" ? (
        <div className="work-order-success">
          <p className="stamp">{f.stamp}</p>
          <h3>{f.successTitle}</h3>
          <p>{f.success(form.firstName, isRecruitment)}</p>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            {f.newRequest}
          </button>
        </div>
      ) : (
        <form className="work-order-form" ref={formRef} onSubmit={handleSubmit} noValidate>
          {/* Champ piège : caché aux humains et aux lecteurs d'écran, rempli par les robots */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor={`${id}-website`}>{f.honeypot}</label>
            <input
              id={`${id}-website`}
              name="website"
              type="text"
              value={form.website}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* La légende de l'astérisque, avant les champs. aria-hidden : un lecteur d'écran n'en a pas
              besoin, il annonce déjà « obligatoire » sur chaque champ */}
          <p className="form-required-note" aria-hidden="true">
            <RequiredMark /> {f.requiredNote}
          </p>

          {/* 1. Le type de demande, en premier : il adapte la suite du formulaire */}
          <OptionGroup
            name="type"
            legend={f.type}
            options={requestTypes}
            labels={f.types}
            value={form.type}
            onSelect={selectOption}
            error={errors.type}
          />

          {/* 2. Qui êtes-vous ? */}
          <div className="form-row">
            <TextField
              id={id}
              name="firstName"
              label={f.firstName}
              type="text"
              value={form.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              maxLength={50}
              error={errors.firstName}
            />
            <TextField
              id={id}
              name="lastName"
              label={f.lastName}
              type="text"
              value={form.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              maxLength={50}
              error={errors.lastName}
            />
          </div>

          <TextField
            id={id}
            name="email"
            label={isRecruitment ? f.workEmail : f.email}
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            maxLength={254}
            error={errors.email}
          >
            {emailSuggestion && (
              <p className="form-suggestion">
                {f.didYouMean}{" "}
                <button type="button" onClick={() => selectOption("email", emailSuggestion)}>
                  {emailSuggestion}
                </button>
                {/* En français, une espace avant le point d'interrogation ; pas en anglais */}
                {lang === "fr" ? " ?" : "?"}
              </p>
            )}
          </TextField>

          {/* 3. La fiche de poste, uniquement si "Recrutement" est choisi */}
          {isRecruitment && (
            <div className="recruit-block">
              <p className="recruit-block-title">{f.jobBlock}</p>

              <div className="form-row">
                <TextField
                  id={id}
                  name="company"
                  label={f.company}
                  type="text"
                  value={form.company}
                  onChange={handleChange}
                  autoComplete="organization"
                  maxLength={100}
                  error={errors.company}
                />
                <TextField
                  id={id}
                  name="position"
                  label={f.position}
                  type="text"
                  value={form.position}
                  onChange={handleChange}
                  placeholder={f.positionPlaceholder}
                  maxLength={100}
                  error={errors.position}
                />
              </div>

              <OptionGroup
                name="contract"
                legend={f.contract}
                options={contractTypes}
                labels={f.contracts}
                value={form.contract}
                onSelect={selectOption}
                error={errors.contract}
              />

              {/* Le code postal d'abord : il remplit la liste des villes */}
              <div className="form-row">
                <TextField
                  id={id}
                  name="postalCode"
                  label={f.postalCode}
                  type="text"
                  inputMode="numeric"
                  value={form.postalCode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder={f.postalCodePlaceholder}
                  error={errors.postalCode}
                />
                {renderCityField()}
              </div>

              <OptionGroup
                name="remote"
                legend={f.remote}
                options={remoteOptions}
                labels={f.remotes}
                value={form.remote}
                onSelect={selectOption}
                optional
              />

              <p className="form-hint">{f.cvHint}</p>
            </div>
          )}

          {/* 4. Le message */}
          <div className={`form-field ${errors.message ? "has-error" : ""}`} data-field="message">
            <label htmlFor={`${id}-message`}>
              {isRecruitment ? f.jobMessage : f.message}
              <RequiredMark />
            </label>
            <textarea
              id={`${id}-message`}
              name="message"
              rows="6"
              maxLength={5000}
              value={form.message}
              onChange={handleChange}
              aria-required="true"
              placeholder={isRecruitment ? f.jobMessagePlaceholder : f.messagePlaceholder}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={`${id}-message-error`}
            ></textarea>
            {errors.message && (
              <p className="form-error" id={`${id}-message-error`}>
                {errors.message}
              </p>
            )}
          </div>

          {/* Information RGPD : dans un nouvel onglet, pour ne pas perdre la saisie */}
          <p className="form-privacy">
            {f.privacy}{" "}
            <a href="/confidentialite" target="_blank" rel="noreferrer">
              {f.privacyLink} ↗
            </a>
          </p>

          {submitError && (
            <p className="form-alert" role="alert">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-metal work-order-submit"
            disabled={status === "sending" || retryIn > 0}
          >
            {status === "sending"
              ? f.sending
              : retryIn > 0
                ? `${f.wait} ${Math.floor(retryIn / 60)}:${String(retryIn % 60).padStart(2, "0")}`
                : f.submit}
          </button>
        </form>
      )}
    </div>
  );
}

export default ContactForm;