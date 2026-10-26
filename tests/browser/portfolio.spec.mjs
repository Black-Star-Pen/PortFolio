import { test, expect } from "@playwright/test";

const browserErrors = new WeakMap();

async function jumpTo(page, selector) {
  await page.locator(selector).first().evaluate((element) => {
    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 130, behavior: "instant" });
  });
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  // Les services sont simulés : aucun email ni appel à Cloudflare pendant ces tests.
  await page.route("**/api/health", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("https://challenges.cloudflare.com/**", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `window.turnstile = {
      render(container, options) { queueMicrotask(() => options.callback('test-token')); return 'test-widget'; },
      remove() {}, reset() {}
    };`,
  }));
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  if (await page.locator("html").evaluate((element) => element.classList.contains("lenis"))) {
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  }
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test("le formulaire ne rejoue jamais son apparition au retour, vide ou rempli", async ({ page }) => {
  const form = page.locator("#contact .work-order");
  await jumpTo(page, "#contact .work-order");
  await expect(form).toHaveClass(/reveal-over/);
  await form.evaluate((element) => {
    element.dataset.restarts = "0";
    element.addEventListener("animationstart", () => {
      element.dataset.restarts = String(Number(element.dataset.restarts) + 1);
    });
  });
  for (const filled of [false, true]) {
    if (filled) await form.locator('[name="firstName"]').fill("Camille");
    await jumpTo(page, ".blueprint");
    await expect(page.locator(".blueprint")).toHaveClass(/revealed/);
    await expect(form).toHaveClass(/reveal-over/);
    await jumpTo(page, "#contact .work-order");
    await expect(form).toHaveAttribute("data-restarts", "0");
    await expect(form).toHaveClass(/reveal-over/);
  }
  await expect(form.locator('[name="firstName"]')).toHaveValue("Camille");
});

test("les quatre côtés sont soudés et les tiroirs restent utilisables au retour", async ({ page }) => {
  await jumpTo(page, ".skill-panel");
  await expect(page.locator(".blueprint")).toHaveClass(/reveal-over/);
  const lines = page.locator(".skill-panel .weld-line");
  await expect(lines).toHaveCount(4);
  for (const line of await lines.all()) {
    await expect.poll(() => line.evaluate((element) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
      return Math.min(matrix.a, matrix.d);
    })).toBeCloseTo(1, 2);
  }
  // Compare la pointe au bout du cordon à mi-parcours sur chacun des quatre côtés.
  const gaps = await page.locator(".skill-panel .weld").evaluate(async (weld) => {
    const style = getComputedStyle(weld);
    const start = parseFloat(style.getPropertyValue("--weld-start"));
    const side = parseFloat(style.getPropertyValue("--weld-side"));
    const animations = weld.getAnimations({ subtree: true });
    animations.forEach((animation) => animation.pause());
    await Promise.all(animations.map((animation) => animation.ready));
    const gaps = [];
    for (const [index, edge] of ["top", "right", "bottom", "left"].entries()) {
      animations.forEach((animation) => {
        animation.currentTime = (start + (index + 0.5) * side) * 1000;
      });
      // WebKit applique la nouvelle position des calques composités à l'image suivante.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const line = weld.querySelector(`.weld-${edge}`).getBoundingClientRect();
      const spark = weld.querySelector(".weld-spark").getBoundingClientRect();
      const tip = [line.right, line.bottom, line.left, line.top][index];
      const point = index % 2 === 0 ? spark.x + spark.width / 2 : spark.y + spark.height / 2;
      gaps.push(Math.abs(point - tip));
    }
    return gaps;
  });
  gaps.forEach((gap, index) => expect(gap, `Côté ${index}, écarts : ${JSON.stringify(gaps)}`).toBeLessThan(4));
  const tabs = page.getByRole("tab");
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await tabs.first().click();
  await expect(page.locator(".skill-panel .weld")).toHaveClass(/weld-done/);
  await jumpTo(page, "#contact .work-order");
  await expect(page.locator(".blueprint")).not.toHaveClass(/revealed/);
  await jumpTo(page, ".skill-panel");
  await expect(page.locator(".blueprint")).toHaveClass(/reveal-over/);
  await expect(page.locator(".skill-panel .weld-spark")).toBeHidden();
});

test("l'épure reste visible après un aller-retour et une rotation en paysage", async ({ page }) => {
  const drawing = page.locator("#about .section-bg");
  await jumpTo(page, "#about");
  await expect(page.locator("#about")).toHaveClass(/seam-welded/);
  await expect.poll(() => page.locator(".epure-line").first().evaluate((element) =>
    getComputedStyle(element).strokeDashoffset)).toBe("0px");
  await jumpTo(page, "#contact .work-order");
  await expect(drawing).toHaveCSS("visibility", "hidden");
  // Avec des marges verticales calculées sur la largeur, cette zone devenait vide.
  await page.setViewportSize({ width: 2560, height: 800 });
  await jumpTo(page, "#about");
  await expect(drawing).toHaveCSS("visibility", "visible");
  await expect.poll(() => page.locator(".epure-line").first().evaluate((element) =>
    getComputedStyle(element).strokeDashoffset)).toBe("0px");
  await expect.poll(() => drawing.evaluate((element) => {
    const rect = element.querySelector("svg").getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
  })).toBe(true);
});

test("pas de débordement à 320 px, en paysage et dans le formulaire recrutement", async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (const selector of ["#about", ".skill-panel", ".project-card", "#contact .work-order"]) {
      await jumpTo(page, selector);
      if (selector !== "#about") {
        await expect(page.locator(selector === ".skill-panel" ? ".blueprint" : selector).first()).toHaveClass(/revealed/);
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
    await page.locator('#contact [data-field="type"] button').first().click();
    await expect(page.locator("#contact .recruit-block")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test("un retour rapide et un changement de page ne bloquent pas les apparitions", async ({ page }) => {
  await jumpTo(page, ".skill-panel");
  await expect(page.locator(".blueprint")).toHaveClass(/revealed/);
  await jumpTo(page, "#contact .work-order");
  await expect(page.locator(".blueprint")).not.toHaveClass(/revealed/);
  await jumpTo(page, ".skill-panel");
  await expect(page.locator(".blueprint")).toHaveClass(/reveal-over/);
  await page.locator('footer a[href="/mentions-legales"]').click();
  await expect(page.locator(".legal-content")).toHaveClass(/revealed/);
  await page.locator('footer a[href="/#contact"]').click();
  await expect(page.locator("#contact .section-title")).toHaveClass(/revealed/);
  if (await page.locator("html").evaluate((element) => element.classList.contains("lenis"))) {
    await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  }
  // Attendre que la section soit en haut de l'écran avant de poursuivre au formulaire.
  await expect.poll(() => page.locator("#contact").evaluate((element) =>
    Math.abs(element.getBoundingClientRect().top))).toBeLessThanOrEqual(100);
  await page.mouse.wheel(0, 500);
  await expect(page.locator("#contact .work-order")).toHaveClass(/revealed/);
});

test("les modales se ferment et rendent le défilement ; animations réduites respectées", async ({ page }) => {
  await jumpTo(page, ".hero");
  await page.locator(".hero button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await dialog.locator('[name="firstName"]').fill("Camille");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await expect(page.locator(".intro")).toHaveCount(0);
  await expect(page.locator(".skill-panel .weld-line").first()).toHaveCSS("animation-name", "none");
});

test("thème, langue et fiche projet restent utilisables sans perdre la saisie", async ({ page }) => {
  await jumpTo(page, "#contact .work-order");
  await expect(page.locator("#contact .work-order")).toHaveClass(/reveal-over/);
  await page.locator('#contact [name="firstName"]').fill("Camille");
  const burger = page.locator(".navbar-burger");
  const mobileMenu = await burger.isVisible();
  if (mobileMenu) await burger.click();
  await page.locator(".navbar-tool").nth(1).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator(".navbar-tool").first().click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  if (mobileMenu) await burger.click();
  await expect(page.locator('#contact [name="firstName"]')).toHaveValue("Camille");
  await jumpTo(page, ".project-card");
  await expect(page.locator(".project-card").first()).toHaveClass(/reveal-over/);
  await page.locator(".project-open").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await page.getByRole("dialog").evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
