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
  name: "",
  email: "",
  company: "",
  position: "",
  contract: "",
  remote: "",
  city: "",
  postalCode: "",
  message: "",
};

// L'ordre d'affichage des champs : sert à trouver la PREMIÈRE erreur de la page
const fieldOrder = ["type", "name", "email", "company", "position", "contract", "city", "postalCode", "message"];

/* ===== La validation ===== */
function validate(form) {
  const errors = {};
  const isRecruitment = form.type === "recrutement";

  if (!form.type) {
    errors.type = "Choisissez un type de demande.";
  }
  if (form.name.trim().length < 2) {
    errors.name = "Indiquez votre nom.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Cette adresse email semble invalide.";
  }

  // Champs supplémentaires, vérifiés uniquement pour un recrutement
  if (isRecruitment) {
    if (form.company.trim().length < 2) {
      errors.company = "Indiquez le nom de l'entreprise.";
    }
    if (form.position.trim().length < 2) {
      errors.position = "Indiquez l'intitulé du poste.";
    }
    if (!form.contract) {
      errors.contract = "Choisissez un type de contrat.";
    }
    if (form.city.trim().length < 2) {
      errors.city = "Indiquez la ville du poste.";
    }
    if (!/^\d{5}$/.test(form.postalCode)) {
      errors.postalCode = "Le code postal doit contenir 5 chiffres.";
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
function OptionGroup({ name, legend, options, value, onSelect, error, optional = false }) {
  return (
    <fieldset className={`form-field ${error ? "has-error" : ""}`} data-field={name}>
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
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [orderNumber] = useState(
    () => `OF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  const isRecruitment = form.type === "recrutement";

  function handleChange(event) {
    const { name } = event.target;
    let { value } = event.target;

    // Code postal : uniquement des chiffres, 5 maximum
    if (name === "postalCode") {
      value = value.replace(/\D/g, "").slice(0, 5);
    }

    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  }

  function selectOption(name, value) {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  }

  // Amène le premier champ en erreur face à l'utilisateur
  function showFirstError(newErrors) {
    const firstKey = fieldOrder.find((key) => newErrors[key]);
    if (!firstKey) return;

    // On attend que React ait affiché les messages d'erreur
    requestAnimationFrame(() => {
      const field = formRef.current?.querySelector(`[data-field="${firstKey}"]`);
      if (!field) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      field.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      field.querySelector("input, textarea, button")?.focus({ preventScroll: true });
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newErrors = validate(form);
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
    setForm(initialForm);
    setErrors({});
    setStatus("idle");
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
            Merci {form.name}, je reviens vers vous sous 48 heures
            {isRecruitment && ", avec mon CV en pièce jointe"}.
          </p>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Nouvelle demande
          </button>
        </div>
      ) : (
        <form className="work-order-form" ref={formRef} onSubmit={handleSubmit} noValidate>
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
              name="name"
              label={isRecruitment ? "Nom du recruteur" : "Votre nom"}
              type="text"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              error={errors.name}
            />
            <TextField
              id={id}
              name="email"
              label={isRecruitment ? "Email professionnel" : "Votre email"}
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              error={errors.email}
            />
          </div>

          {/* 3. La fiche recrutement, uniquement si "Recrutement" est choisi */}
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

              <div className="form-row">
                <TextField
                  id={id}
                  name="city"
                  label="Ville"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  error={errors.city}
                />
                <TextField
                  id={id}
                  name="postalCode"
                  label="Code postal"
                  type="text"
                  inputMode="numeric"
                  value={form.postalCode}
                  onChange={handleChange}
                  autoComplete="postal-code"
                  error={errors.postalCode}
                />
              </div>

              <OptionGroup
                name="remote"
                legend="Mode de travail"
                options={remoteOptions}
                value={form.remote}
                onSelect={selectOption}
                optional
              />

              <p className="form-hint">Mon CV vous sera envoyé par email en réponse à votre message.</p>
            </div>
          )}

          {/* 4. Le message */}
          <div className={`form-field ${errors.message ? "has-error" : ""}`} data-field="message">
            <label htmlFor={`${id}-message`}>
              {isRecruitment ? "Description du poste" : "Cahier des charges"}
            </label>
            <textarea
              id={`${id}-message`}
              name="message"
              rows="6"
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
            {status === "sending" ? "Fabrication en cours..." : "Lancer la fabrication →"}
          </button>
        </form>
      )}
    </div>
  );
}

export default ContactForm;