import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

/** Drives the real Upload -> Analyze flow, since the temp image store only
 * exists once a browser session has actually uploaded something. */
async function uploadAndReachInspect(page: Page): Promise<string> {
  await page.goto("/upload");
  await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
  await page.getByRole("button", { name: "Analyze Image" }).first().click();
  await page.waitForURL(/\/inspect\/[0-9a-f-]{36}$/i);
  const match = page.url().match(/\/inspect\/([0-9a-f-]{36})$/i);
  if (!match) throw new Error("Did not land on an /inspect/[id] URL");
  return match[1];
}

test.describe("Inspect page — desktop", () => {
  test("shows the correct filename, format, file size, and dimensions", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachInspect(page);

    // AnalysisView renders the mobile composition first in the DOM and the
    // desktop composition second, toggled with Tailwind's `md:` classes —
    // so at a desktop viewport the *visible* (desktop) copy is `.last()`.
    await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();
    await expect(page.getByText("test-image.png").last()).toBeVisible();
    await expect(page.getByText("PNG").last()).toBeVisible();
    await expect(page.getByText("100 × 100").last()).toBeVisible();
    // The fixture is well under 1 KB, so it renders in bytes (e.g. "70 B").
    await expect(page.getByText(/^\d+ B$/).last()).toBeVisible();
    await expect(page.getByText("Ready").last()).toBeVisible();
  });

  test("stays on step 02 INSPECT in the workflow header", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachInspect(page);

    const nav = page.getByRole("navigation", { name: "Workflow progress" });
    await expect(nav.getByText("02 INSPECT")).toBeVisible();
  });

  test("Continue to Cleanup navigates to /cleanup/[id]", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    const id = await uploadAndReachInspect(page);

    await page
      .getByRole("link", { name: "Continue to Cleanup" })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/cleanup/${id}$`));
  });

  test("Full Report navigates to /provenance/[id] with the same id", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    const id = await uploadAndReachInspect(page);

    await page.getByRole("link", { name: "Full Report" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/provenance/${id}$`));
  });

  test("does not claim C2PA or watermark detection results", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachInspect(page);

    await expect(
      page.getByText("Content Credentials (C2PA)").last(),
    ).toBeVisible();
    await expect(page.getByText("Not yet available").last()).toBeVisible();
  });
});

test.describe("Inspect page — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders with no horizontal overflow, readable stats, and accessible actions", async ({
    page,
  }) => {
    await uploadAndReachInspect(page);

    await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();

    const overflowX = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflowX).toBeLessThanOrEqual(1);

    // Here the mobile composition (first in the DOM) is the visible one.
    await expect(page.getByText("100 × 100").first()).toBeVisible();
    await expect(page.getByText("PNG").first()).toBeVisible();

    const cleanupLink = page.getByRole("link", { name: "Continue to Cleanup" });
    await expect(cleanupLink).toBeVisible();
    const box = await cleanupLink.boundingBox();
    expect(box?.width).toBeGreaterThan(300);

    await expect(page.getByRole("link", { name: "Full Report" })).toBeVisible();
  });
});
