import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// Ce processus de test utilise exclusivement des valeurs fictives.
process.env.RESEND_API_KEY = "re_test_only";
process.env.MAIL_TO = "owner@example.com";
delete process.env.MAIL_FROM;
const { sendContactEmail } = await import("../mailer.js");
const data = { type: "autre", firstName: "Élodie", lastName: "Dupont",
  email: "visitor@example.com", message: "Bonjour, ceci est un test simulé.", lang: "fr" };

test("Resend reçoit le destinataire configuré et l'adresse de réponse du visiteur", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.headers.Authorization, "Bearer re_test_only");
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ["owner@example.com"]);
    assert.equal(body.reply_to, "visitor@example.com");
    assert.equal(body.from, "Portfolio <onboarding@resend.dev>");
    assert.ok(body.subject.startsWith("[Portfolio]"));
    assert.ok(body.html.includes("&lt;script&gt;"));
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ id: "simulated" }), { status: 201 });
  });
  await sendContactEmail({ ...data, to: "attacker@example.com", from: "attacker@example.com", message: "<script>alert(1)</script>" });
  assert.equal(calls, 1);
});
test("un refus Resend remonte comme un échec", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ message: "Unauthorized" }), { status: 403 }));
  await assert.rejects(sendContactEmail(data), /403/);
});
test("une panne réseau ne produit pas de faux succès", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new Error("network unavailable"); });
  await assert.rejects(sendContactEmail(data), /network unavailable/);
});
test("le serveur refuse une configuration email incomplète", () => {
  const moduleUrl = new URL("../mailer.js", import.meta.url).href;
  for (const env of [
    { RESEND_API_KEY: "re_test" },
    { RESEND_API_KEY: "invalid", MAIL_TO: "owner@example.com" },
    { RESEND_API_KEY: "re_test", MAIL_TO: "owner@example.com", MAIL_FROM: "bad\r\nBcc: attacker@example.com" },
    { MAIL_TO: "owner@example.com" },
  ]) {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(moduleUrl)})`], {
      env, encoding: "utf8", timeout: 5000,
    });
    assert.equal(result.status, 1);
  }
});
