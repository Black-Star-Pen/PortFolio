import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../app.js";
import { readServerConfig } from "../config.js";
import { isEmailValid, validateContact } from "../validation.js";
import { buildContactEmail } from "../emailTemplate.js";

const valid = {
  type: "autre", firstName: "Élodie", lastName: "D’Artagnan", email: "visitor@example.com",
  message: "Bonjour, je souhaite discuter de votre portfolio.", lang: "fr",
};
const recruitment = {
  ...valid, type: "recrutement", company: "Entreprise", position: "Développement",
  contract: "cdi", remote: "", postalCode: "75001", city: "Paris",
};
const checks = { checkMailServer: async () => true, checkCity: async () => true };

test("configuration locale restrictive par défaut", () => {
  assert.deepEqual(readServerConfig({}).allowedOrigins, ["http://localhost:5173", "http://127.0.0.1:5173"]);
});
test("configuration de production et proxys invalides refusés", () => {
  for (const env of [
    { NODE_ENV: "production" }, { TRUST_PROXY: "true" }, { TRUST_PROXY: "-1" },
    { TRUST_PROXY: "1.5" }, { PORT: "invalid" }, { PORT: "65536" },
    { CORS_ORIGIN: "*" }, { CORS_ORIGIN: "https://example.com/" },
    { CORS_ORIGIN: "https://example.com/path" }, { CORS_ORIGIN: "https://user@example.com" },
    { NODE_ENV: "production", CORS_ORIGIN: "http://example.com" },
  ]) assert.throws(() => readServerConfig(env));
  assert.equal(readServerConfig({ NODE_ENV: "production", CORS_ORIGIN: "https://example.com", TRUST_PROXY: "3",
    TURNSTILE_SECRET_KEY: "production_placeholder" }).trustProxy, 3);
});

test("corps absents, null et tableaux refusés sans erreur interne", async () => {
  for (const body of [null, undefined, [], "text", 10]) {
    const { errors } = await validateContact(body, checks);
    assert.ok(Object.keys(errors).length);
  }
});
test("les données invalides ne déclenchent aucun appel extérieur", async () => {
  const unexpected = async () => assert.fail("Appel extérieur pour une requête invalide");
  const { errors } = await validateContact({ ...recruitment, firstName: "<script>", email: "a".repeat(300) + "@example.com" }, {
    checkMailServer: unexpected, checkCity: unexpected,
  });
  assert.ok(errors.firstName);
  assert.ok(errors.email);
});
test("adresses email et longueurs de leurs composants", () => {
  assert.equal(isEmailValid("first.last+tag@example.com"), true);
  for (const email of [".a@example.com", "a..b@example.com", "a.@example.com", "a@-example.com", "a@example-.com",
    "a".repeat(65) + "@example.com", "a@" + "a".repeat(64) + ".com", "a@example.com\r\nBcc: bad@example.com"]) {
    assert.equal(isEmailValid(email), false, email);
  }
});
test("nettoyage des champs et suppression des propriétés inattendues", async () => {
  const { data, errors } = await validateContact({ ...valid, firstName: "  Élodie\t ",
    email: " Visitor@Example.com ", message: valid.message + "\r\nSuite\u0000", to: "attacker@example.com", lang: "unknown" }, checks);
  assert.deepEqual(errors, {});
  assert.equal(data.firstName, "Élodie");
  assert.equal(data.email, "visitor@example.com");
  assert.equal(data.lang, "fr");
  assert.equal(data.to, undefined);
  assert.ok(data.message.endsWith("\nSuite"));
});
test("la ville reste obligatoire si le service externe est indisponible", async () => {
  const { errors } = await validateContact({ ...recruitment, city: "" }, checks);
  assert.ok(errors.city);
});
test("les domaines sans courrier et les villes incorrectes sont refusés", async () => {
  assert.ok((await validateContact(valid, { ...checks, checkMailServer: async () => false })).errors.email);
  assert.ok((await validateContact(recruitment, { ...checks, checkCity: async () => false })).errors.city);
  assert.deepEqual((await validateContact(recruitment, checks)).errors, {});
});
test("les limites de longueur et choix sont appliqués côté serveur", async () => {
  const { errors } = await validateContact({ ...recruitment, contract: "invalid", remote: "invalid",
    message: "é".repeat(5001), company: "a".repeat(101) }, checks);
  for (const field of ["contract", "remote", "message", "company"]) assert.ok(errors[field]);
});
test("le HTML saisi est neutralisé dans les emails", () => {
  const payload = '<img src=x onerror="alert(1)"> & <script>alert(2)</script>';
  const { html, text } = buildContactEmail({ ...recruitment, company: payload, position: payload, message: payload });
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img"));
  assert.ok(text.includes(payload));
});

async function api(t, overrides = {}) {
  const sent = [];
  const app = createApp({
    allowedOrigins: ["https://portfolio.example.com"], trustProxy: 0,
    verifyChallenge: async () => ({ ok: true }),
    validate: (body) => validateContact(body, checks), sendEmail: async (data) => { sent.push(data); },
    ...overrides,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body = valid, options = {}) => fetch(`${base}/api/contact`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://portfolio.example.com" },
    body: JSON.stringify(body), ...options,
  });
  return { sent, base, post };
}
test("route de santé, en-têtes de sécurité et 404", async (t) => {
  const { base } = await api(t);
  const health = await fetch(`${base}/api/health`);
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.equal(health.headers.get("x-powered-by"), null);
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await fetch(`${base}/unknown`)).status, 404);
});
test("origine interdite bloquée avant lecture du corps", async (t) => {
  const { post, sent } = await api(t);
  const response = await post(null, { headers: { "Content-Type": "application/json", Origin: "https://attacker.example" }, body: "{" });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(sent.length, 0);
});
test("CORS expose Retry-After et autorise la prévalidation du formulaire", async (t) => {
  const { base } = await api(t);
  const response = await fetch(`${base}/api/contact`, { method: "OPTIONS", headers: {
    Origin: "https://portfolio.example.com", "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type",
  } });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "https://portfolio.example.com");
  assert.ok(response.headers.get("access-control-expose-headers").includes("Retry-After"));
});
test("JSON malformé, null et tableaux renvoient 400", async (t) => {
  const { post, sent } = await api(t);
  for (const body of ["{", "null", "[]"]) {
    const response = await post(null, { body });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
  assert.equal(sent.length, 0);
});
test("types de contenu, encodages et corps trop volumineux refusés", async (t) => {
  const { post, sent } = await api(t);
  assert.equal((await post(valid, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await post(valid, { headers: { "Content-Type": "application/json", "Content-Encoding": "gzip" } })).status, 415);
  assert.equal((await post({ ...valid, message: "x".repeat(40000) })).status, 400);
  assert.equal(sent.length, 0);
});
test("le piège anti-robots ne déclenche aucun email", async (t) => {
  const { post, sent } = await api(t);
  assert.equal((await post({ website: "https://spam.example" })).status, 201);
  assert.equal(sent.length, 0);
});
test("une requête valide produit un email, y compris avec un message Unicode long", async (t) => {
  const { post, sent } = await api(t);
  const response = await post({ ...valid, message: "界".repeat(5000) });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].message.length, 5000);
});
test("limite appliquée avant le parsing JSON, même pour les requêtes invalides", async (t) => {
  const { post, sent } = await api(t);
  for (let i = 0; i < 3; i++) assert.equal((await post(null, { body: "{" })).status, 400);
  const response = await post();
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
  assert.equal(sent.length, 0);
});
test("une erreur du fournisseur reste une erreur 502 sans exposer ses détails", async (t) => {
  const { post } = await api(t, { sendEmail: async () => { throw new Error("provider failure"); } });
  const response = await post();
  assert.equal(response.status, 502);
  assert.ok(!JSON.stringify(await response.json()).includes("provider failure"));
});

test("la protection anti-bots ne peut pas être omise lors de la création de l'API", () => {
  assert.throws(() => createApp({}), /obligatoire/);
});
test("un jeton refusé bloque validation et envoi", async (t) => {
  const { post, sent } = await api(t, {
    verifyChallenge: async () => ({ ok: false, status: 403, code: "ANTIBOT_REQUIRED" }),
    validate: async () => assert.fail("Validation appelée avant réussite anti-bots"),
  });
  const response = await post();
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "ANTIBOT_REQUIRED");
  assert.equal(sent.length, 0);
});
test("si Cloudflare est indisponible, aucun email n'est envoyé", async (t) => {
  const { post, sent } = await api(t, {
    verifyChallenge: async () => ({ ok: false, status: 503, code: "ANTIBOT_UNAVAILABLE" }),
  });
  const response = await post();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "ANTIBOT_UNAVAILABLE");
  assert.equal(sent.length, 0);
});
