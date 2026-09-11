import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

test.describe("Upload page — desktop", () => {
  test("choosing a valid image shows a preview with metadata and Analyze Image", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await page.goto("/upload");

    await expect(
      page.getByRole("heading", { name: "Upload an image" }),
    ).toBeVisible();

    await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);

    const analyzeButton = page
      .getByRole("button", { name: "Analyze Image" })
      .first();
    await expect(analyzeButton).toBeVisible();
    await expect(analyzeButton).toBeEnabled();

    await expect(page.getByText("test-image.png").first()).toBeVisible();
    await expect(page.getByText("100 × 100").first()).toBeVisible();
    await expect(page.getByText("PNG").first()).toBeVisible();
  });

  test("shows an inline error, not a browser alert, for an unsupported file", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await page.goto("/upload");

    await page.getByLabel("Choose an image file").setInputFiles({
      name: "unsupported.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });

    const errorBanner = page
      .getByRole("alert")
      .filter({ hasText: "Unsupported format" });
    await expect(errorBanner).toContainText(
      "Unsupported format. Please upload a JPG, PNG, or WebP image.",
    );
  });

  test("Analyze Image navigates to /inspect/[id]", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await page.goto("/upload");

    await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
    await page.getByRole("button", { name: "Analyze Image" }).first().click();

    await expect(page).toHaveURL(/\/inspect\/[0-9a-f-]{36}$/i);
  });
});

test.describe("Upload page — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("page loads with a visible Choose a file action", async ({ page }) => {
    await page.goto("/upload");

    await expect(
      page.getByRole("heading", { name: "Upload an image" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Choose a file" }),
    ).toBeVisible();
  });

  test("responsive layout stays usable end to end", async ({ page }) => {
    await page.goto("/upload");

    await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);

    // getByRole naturally resolves to the mobile button only, since the
    // desktop variant is display:none (and so excluded from the a11y tree)
    // at this viewport. getByText matches both DOM copies regardless of
    // visibility, so those checks use .last() — the mobile-rendered one.
    const analyzeButton = page.getByRole("button", { name: "Analyze Image" });
    await expect(analyzeButton).toBeVisible();
    await expect(page.getByText("test-image.png").last()).toBeVisible();

    const box = await analyzeButton.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });
});
