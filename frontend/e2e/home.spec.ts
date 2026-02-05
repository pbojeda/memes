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

test.describe("Layout", () => {
  test("should display header with navigation", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByText("MemeStore")).toBeVisible();
    await expect(header.getByText("Home")).toBeVisible();
    await expect(header.getByText("Products")).toBeVisible();
    await expect(header.getByText("Cart")).toBeVisible();
  });

  test("should display footer with copyright", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/© \d{4} MemeStore/)).toBeVisible();
    await expect(footer.getByText("About")).toBeVisible();
    await expect(footer.getByText("Contact")).toBeVisible();
    await expect(footer.getByText("Terms")).toBeVisible();
  });
});
