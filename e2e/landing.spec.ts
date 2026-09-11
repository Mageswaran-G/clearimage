import { expect, test } from "@playwright/test";

test("landing page loads and shows the ClearImage wordmark", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/ClearImage/);
  await expect(
    page.getByRole("link", { name: "ClearImage" }).first(),
  ).toBeVisible();
});

test("upload route loads with the step indicator on step 1", async ({
  page,
}) => {
  await page.goto("/upload");

  await expect(page.getByRole("heading", { name: "Upload" })).toBeVisible();
});

test.describe("Landing page", () => {
  test("Upload CTA points at /upload", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Upload an Image" }).first(),
    ).toHaveAttribute("href", "/upload");
  });

  test("desktop-only section links point at /upload", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "these sections are not part of the mobile composition",
    );
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "View a sample report →" }),
    ).toHaveAttribute("href", "/upload");
    await expect(
      page.getByRole("link", { name: "Try the comparison →" }),
    ).toHaveAttribute("href", "/upload");
  });

  test("FAQ accordion opens and closes", async ({ page }) => {
    await page.goto("/");

    const first = page.getByRole("button", {
      name: "Is ClearImage really free?",
    });
    await expect(first).toHaveAttribute("aria-expanded", "true");

    const second = page.getByRole("button", {
      name: "What file types are supported?",
    });
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Landing page — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("header nav is hidden and the menu button is visible", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page
        .locator("header")
        .getByRole("link", { name: "How It Works", exact: true }),
    ).toBeHidden();
    await expect(page.getByLabel("Open menu")).toBeVisible();
  });

  test("desktop-only sections are not shown", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Every file, read in full.")).toBeHidden();
    await expect(page.getByText("Compare, then decide.")).toBeHidden();
  });

  test("mobile menu opens, lists nav links, and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Open menu").click();
    const dialog = page.getByRole("dialog", { name: "Menu" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Tools" })).toHaveAttribute(
      "href",
      "/upload",
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
