import { expect, test } from "@playwright/test";

test("naissance, décision, sauvegarde et exploration", async ({ page }) => {
  await page.goto("/jouer");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page).toHaveTitle(/Naître en France/);
  await expect(page.getByRole("link", { name: "Naître en France, accueil" })).toBeVisible();
  await page.getByLabel(/Graine facultative/).fill("NI-E2E-SPEC");
  await page.getByRole("button", { name: "Naître en France" }).click();
  await expect(page).toHaveURL(/\/vie$/);
  await expect(page.getByText("Voici une possibilité.")).toBeVisible();
  await page.getByRole("button", { name: /Voir la provenance/ }).click();
  await expect(page.getByText("event-fiction-001")).toBeVisible();
  await page.getByRole("button", { name: "Fermer" }).click();

  await page.getByRole("button", { name: /Prochain choix/ }).click();

  await expect(page.getByRole("dialog", { name: /Une première bifurcation/ })).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /Une première bifurcation/ })).toBeHidden();

  await page.getByRole("button", { name: /Prochain choix/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Retenir ce choix" }).click();
  await expect(page.getByText("Ce qui se construit")).toBeVisible();

  await page.goto("/chronologie");
  await expect(page.getByRole("heading", { name: "Les années une à une." })).toBeVisible();
  await expect(page.getByText("Le portail de l'école")).toBeVisible();

  await page.goto("/explorer");
  await expect(page.getByText("Comparer sans classer", { exact: true })).toBeVisible();
  await expect(page.getByText("Votre trajectoire")).toBeVisible();
});

test.describe("lecture mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("conserve les contrôles essentiels sans débordement horizontal", async ({ page }) => {
    await page.goto("/jouer");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page).toHaveTitle(/Naître en France/);
    await page.getByLabel(/Graine facultative/).fill("NI-E2E-MOBILE");
    await page.getByRole("button", { name: "Naître en France" }).click();
    await expect(page).toHaveURL(/\/vie$/);

    const softModeButton = page.getByRole("button", { name: /Mode doux/ });
    await expect(softModeButton).toBeVisible();
    await softModeButton.click();
    await expect(softModeButton).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByRole("button", { name: /Prochain choix/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
