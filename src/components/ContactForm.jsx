import { useState, useId, useRef } from "react";
import Weld from "./Weld";

/* ===== Les listes de choix ===== */
const requestTypes = [
  { value: "site", label: "Site vitrine" },
  { value: "application", label: "Application" },
  { value: "recrutement", label: "Recrutement" },
  { value: "autre", label: "Autre" },
];

const contractTypes = [
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "alternance", label: "Alternance" },
  { value: "stage", label: "Stage" },
  { value: "freelance", label: "Freelance" },
];

const remoteOptions = [
  { value: "site", label: "Sur site" },
  { value: "hybride", label: "Hybride" },
  { value: "remote", label: "Télétravail complet" },
];

const initialForm = {
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

/* ===== La validation ===== */
function validate(form, cityLookup) {
  const errors = {};

  if (!form.type) {
    errors.type = "Choisissez un type de demande.";
  }
  if (!NAME_PATTERN.test(form.firstName.trim())) {
    errors.firstName = "Indiquez votre prénom (lettres uniquement).";
  }
  if (!NAME_PATTERN.test(form.lastName.trim())) {
    errors.lastName = "Indiquez votre nom (lettres uniquement).";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Cette adresse email semble invalide.";
  }

  // Champs supplémentaires, vérifiés uniquement pour un recrutement
  if (form.type === "recrutement") {
    if (form.company.trim().length < 2) {
      errors.company = "Indiquez le nom de l'entreprise.";
    }
    if (form.position.trim().length < 2) {
      errors.position = "Indiquez l'intitulé du poste.";
    }
    if (!form.contract) {
      errors.contract = "Choisissez un type de contrat.";
    }

    // Code postal et ville, selon la réponse du service officiel
    if (!/^\d{5}$/.test(form.postalCode)) {
      errors.postalCode = "Le code postal doit contenir 5 chiffres.";
    } else if (cityLookup.status === "loading") {
      errors.postalCode =
        "Vérification du code postal en cours, patientez un instant.";
    } else if (cityLookup.status === "notfound") {
      errors.postalCode = "Ce code postal n'existe pas.";
    } else if (
      cityLookup.status === "found" &&
      !cityLookup.communes.includes(form.city)
    ) {
      errors.city = "Choisissez la commune dans la liste.";
    } else if (cityLookup.status === "error" && form.city.trim().length < 2) {
      errors.city = "Indiquez la ville du poste.";
    }
  }

  if (form.message.trim().length < 20) {
    errors.message = "Détaillez un peu votre demande (20 caractères minimum).";
  }

  return errors;
}

/* ===== Un champ de saisie réutilisable ===== */
function TextField({ id, name, label, error, ...inputProps }) {
  return (
    <div className={`form-field ${error ? "has-error" : ""}`} data-field={name}>
      <label htmlFor={`${id}-${name}`}>{label}</label>
      <input
        id={`${id}-${name}`}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-${name}-error`}
        {...inputProps}
      />
      {error && (
        <p className="form-error" id={`${id}-${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ===== Un groupe de boutons à choix unique, réutilisable ===== */
function OptionGroup({
  name,
  legend,
  options,
  value,
  onSelect,
  error,
  optional = false,
}) {
  return (
    <fieldset
      className={`form-field ${error ? "has-error" : ""}`}
      data-field={name}
    >
      <legend>
        {legend}
        {optional && <span className="form-optional"> (facultatif)</span>}
      </legend>
      <div className="type-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`type-option ${value === option.value ? "selected" : ""}`}
            aria-pressed={value === option.value}
            onClick={() => onSelect(name, option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
    </fieldset>
  );
}

/* ===== Le formulaire ===== */
function ContactForm() {
  const id = useId();
  const formRef = useRef(null);
  const lookupRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [cityLookup, setCityLookup] = useState({
    status: "idle",
    communes: [],
  });
  const [orderNumber] = useState(
    () =>
      `OF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
        { signal: controller.signal },
      );
      if (!response.ok) throw new Error("Réponse invalide");

      const data = await response.json();
      const communes = data
        .map((commune) => commune.nom)
        .sort((a, b) => a.localeCompare(b, "fr"));

      setCityLookup({
        status: communes.length > 0 ? "found" : "notfound",
        communes,
      });
      // Une seule commune : on la sélectionne automatiquement
      setForm((previous) => ({
        ...previous,
        city: communes.length === 1 ? communes[0] : "",
      }));
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
      setErrors((previous) => ({
        ...previous,
        postalCode: undefined,
        city: undefined,
      }));
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
      const field = formRef.current?.querySelector(
        `[data-field="${firstKey}"]`,
      );
      if (!field) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      field.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      field
        .querySelector("input, select, textarea, button")
        ?.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newErrors = validate(form, cityLookup);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showFirstError(newErrors);
      return;
    }

    setStatus("sending");
    // Simulation d'envoi : sera remplacé par l'appel à l'API Express
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setStatus("success");
  }

  function handleReset() {
    lookupRef.current?.abort();
    setForm(initialForm);
    setErrors({});
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
      statusText = `${cityLookup.communes.length} communes pour ce code postal.`;
    } else if (cityLookup.status === "error") {
      statusText = "Vérification indisponible : saisissez la ville.";
    }

    // 2. On relie au champ les textes réellement affichés, pour les lecteurs d'écran
    const describedBy = [statusText && statusId, errors.city && errorId]
      .filter(Boolean)
      .join(" ");

    const common = {
      id: fieldId,
      name: "city",
      value: form.city,
      onChange: handleChange,
      "aria-invalid": Boolean(errors.city),
      "aria-describedby": describedBy || undefined,
    };

    // 3. Le champ lui-même
    let control;
    if (cityLookup.status === "found") {
      control = (
        <select {...common}>
          {cityLookup.communes.length > 1 && (
            <option value="">Choisissez la commune</option>
          )}
          {cityLookup.communes.map((commune) => (
            <option key={commune} value={commune}>
              {commune}
            </option>
          ))}
        </select>
      );
    } else if (cityLookup.status === "error") {
      control = (
        <input
          {...common}
          type="text"
          autoComplete="address-level2"
          maxLength={100}
        />
      );
    } else {
      const placeholder =
        cityLookup.status === "loading"
          ? "Recherche en cours..."
          : "Saisissez d'abord le code postal";
      control = (
        <input {...common} type="text" placeholder={placeholder} disabled />
      );
    }

    return (
      <div
        className={`form-field ${errors.city ? "has-error" : ""}`}
        data-field="city"
      >
        <label htmlFor={fieldId}>Ville</label>
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
    <div className="work-order">
      {status === "success" && <Weld />}

      <div className="work-order-header">
        <span>Ordre de fabrication</span>
        <span>N° {orderNumber}</span>
      </div>

      {status === "success" ? (
        <div className="work-order-success">
          <p className="stamp">Validé</p>
          <h3>Commande bien reçue !</h3>
          <p>
            Merci {form.firstName}, je reviens vers vous sous 48 heures
            {isRecruitment && ", avec mon CV en pièce jointe"}.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
          >
            Nouvelle demande
          </button>
        </div>
      ) : (
        <form
          className="work-order-form"
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
        >
          {/* 1. Le type de demande, en premier : il adapte la suite du formulaire */}
          <OptionGroup
            name="type"
            legend="Type de demande"
            options={requestTypes}
            value={form.type}
            onSelect={selectOption}
            error={errors.type}
          />

          {/* 2. Qui êtes-vous ? */}
          <div className="form-row">
            <TextField
              id={id}
              name="firstName"
              label="Prénom"
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
              label="Nom"
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
            label={isRecruitment ? "Email professionnel" : "Email"}
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            maxLength={254}
            error={errors.email}
          />

          {/* 3. La fiche de poste, uniquement si "Recrutement" est choisi */}
          {isRecruitment && (
            <div className="recruit-block">
              <p className="recruit-block-title">Fiche de poste</p>

              <div className="form-row">
                <TextField
                  id={id}
                  name="company"
                  label="Entreprise"
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
                  label="Intitulé du poste"
                  type="text"
                  value={form.position}
                  onChange={handleChange}
                  placeholder="Ex. : Développeur full stack"
                  maxLength={100}
                  error={errors.position}
                />
              </div>

              <OptionGroup
                name="contract"
                legend="Type de contrat"
                options={contractTypes}
                value={form.contract}
                onSelect={selectOption}
                error={errors.contract}
              />

              {/* Le code postal d'abord : il remplit la liste des villes */}
              <div className="form-row">
                <TextField
                  id={id}
                  name="postalCode"
                  label="Code postal"
                  type="text"
                  inputMode="numeric"
                  value={form.postalCode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder="Ex. : 75011"
                  error={errors.postalCode}
                />
                {renderCityField()}
              </div>

              <OptionGroup
                name="remote"
                legend="Mode de travail"
                options={remoteOptions}
                value={form.remote}
                onSelect={selectOption}
                optional
              />

              <p className="form-hint">
                Mon CV vous sera envoyé par email en réponse à votre message.
              </p>
            </div>
          )}

          {/* 4. Le message */}
          <div
            className={`form-field ${errors.message ? "has-error" : ""}`}
            data-field="message"
          >
            <label htmlFor={`${id}-message`}>
              {isRecruitment ? "Description du poste" : "Cahier des charges"}
            </label>
            <textarea
              id={`${id}-message`}
              name="message"
              rows="6"
              maxLength={5000}
              value={form.message}
              onChange={handleChange}
              placeholder={
                isRecruitment
                  ? "Missions, stack technique, équipe, date de démarrage..."
                  : "Décrivez votre projet, votre besoin ou votre offre..."
              }
              aria-invalid={Boolean(errors.message)}
              aria-describedby={`${id}-message-error`}
            ></textarea>
            {errors.message && (
              <p className="form-error" id={`${id}-message-error`}>
                {errors.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary work-order-submit"
            disabled={status === "sending"}
          >
            {status === "sending"
              ? "Fabrication en cours..."
              : "Lancer la fabrication →"}
          </button>
        </form>
      )}
    </div>
  );
}

export default ContactForm;
