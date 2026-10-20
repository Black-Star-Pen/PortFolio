import test from "node:test";
import assert from "node:assert/strict";
import { createTurnstileVerifier, TEST_TURNSTILE_SECRET, TEST_TURNSTILE_SECRETS } from "../turnstile.js";
import { readServerConfig } from "../config.js";

const options = { secretKey: "production_placeholder", allowedHostnames: ["portfolio.example.com"] };
const success = { success: true, hostname: "portfolio.example.com", action: "contact" };

test("les jetons absents, vides ou trop longs sont refusés sans appel à Cloudflare", async () => {
  const verify = createTurnstileVerifier({ ...options, fetchImpl: async () => assert.fail("Appel inattendu") });
  for (const token of [undefined, null, "", " ", {}, [], "x".repeat(2049)]) {
    assert.deepEqual(await verify(token), { ok: false, status: 403, code: "ANTIBOT_REQUIRED" });
  }
});
test("le serveur vérifie le jeton auprès de Siteverify sans lui transmettre le formulaire", async () => {
  const verify = createTurnstileVerifier({ ...options, fetchImpl: async (url, init) => {
    assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), { secret: options.secretKey, response: "one-use-token" });
    assert.ok(init.signal instanceof AbortSignal);
    return new Response(JSON.stringify(success));
  } });
  assert.deepEqual(await verify("one-use-token"), { ok: true });
});
test("jeton expiré, rejoué, domaine différent et mauvaise action sont refusés", async () => {
  for (const body of [null, {}, { success: false, "error-codes": ["timeout-or-duplicate"] },
    { ...success, success: "true" }, { ...success, hostname: "attacker.example" },
    { ...success, action: "login" }, { success: true }]) {
    const verify = createTurnstileVerifier({ ...options,
      fetchImpl: async () => new Response(JSON.stringify(body)) });
    assert.equal((await verify("invalid-token")).ok, false);
  }
});
test("panne réseau, réponse malformée et refus HTTP ne désactivent jamais la protection", async () => {
  for (const fetchImpl of [
    async () => { throw new Error("network error"); },
    async () => new Response("not json"),
    async () => new Response("unavailable", { status: 503 }),
  ]) {
    const verify = createTurnstileVerifier({ ...options, fetchImpl });
    assert.deepEqual(await verify("token"), { ok: false, status: 503, code: "ANTIBOT_UNAVAILABLE" });
  }
});
test("les clés de test officielles sont réservées au développement", async () => {
  assert.equal(readServerConfig({}).turnstileSecretKey, TEST_TURNSTILE_SECRET);
  for (const key of ["", ...TEST_TURNSTILE_SECRETS]) {
    assert.throws(() => readServerConfig({ NODE_ENV: "production", CORS_ORIGIN: "https://portfolio.example.com",
      TURNSTILE_SECRET_KEY: key }), /TURNSTILE_SECRET_KEY/);
  }
  const config = readServerConfig({ NODE_ENV: "production", CORS_ORIGIN: "https://portfolio.example.com",
    TURNSTILE_SECRET_KEY: "production_placeholder" });
  assert.deepEqual(config.turnstileHostnames, ["portfolio.example.com"]);
  const verify = createTurnstileVerifier({ secretKey: TEST_TURNSTILE_SECRET,
    allowedHostnames: ["127.0.0.1"], fetchImpl: async () => new Response(JSON.stringify({ success: true, hostname: "localhost", action: "test" })) });
  assert.deepEqual(await verify("XXXX.DUMMY.TOKEN.XXXX"), { ok: true });
});
