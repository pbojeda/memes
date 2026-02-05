import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should display the main heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "MemeStore" })).toBeVisible();
  });

  test("should display the tagline", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("Meme Products E-commerce Platform")
    ).toBeVisible();
  });

  test("should have Get Started and Learn More buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Get Started" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Learn More" })).toBeVisible();
  });
});
