import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

/** Drives the real Upload -> Analyze -> Continue to Cleanup flow, since the
 * temp image store only exists once a browser session has actually
 * uploaded something (a hard page.goto to /cleanup/[id] would lose it,
 * the same as a real reload would). */
async function uploadAndReachCleanup(page: Page): Promise<string> {
  await page.goto("/upload");
  await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
  await page.getByRole("button", { name: "Analyze Image" }).first().click();
  await page.waitForURL(/\/inspect\/[0-9a-f-]{36}$/i);
  await page.getByRole("link", { name: "Continue to Cleanup" }).first().click();
  await page.waitForURL(/\/cleanup\/[0-9a-f-]{36}$/i);
  const match = page.url().match(/\/cleanup\/([0-9a-f-]{36})$/i);
  if (!match) throw new Error("Did not land on a /cleanup/[id] URL");
  return match[1];
}

test.describe("Cleanup page — desktop", () => {
  test("stays on step 03 CLEAN in the workflow header", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachCleanup(page);

    const nav = page.getByRole("navigation", { name: "Workflow progress" });
    await expect(nav.getByText("03 CLEAN")).toBeVisible();
  });

  test("Process Image is disabled until a region is selected", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachCleanup(page);

    await expect(
      page.getByRole("button", { name: "Process Image" }),
    ).toBeDisabled();
  });

  test("dragging a region on the canvas and processing produces a real before/after result", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachCleanup(page);

    const stage = page.locator('[class*="bg-workspace-dark"]').first();
    const box = await stage.boundingBox();
    if (!box) throw new Error("Cleanup stage did not render");

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, {
      steps: 10,
    });
    await page.mouse.up();

    const processButton = page.getByRole("button", { name: "Process Image" });
    await expect(processButton).toBeEnabled();
    await processButton.click();

    await expect(
      page.getByRole("button", { name: "Re-run Cleanup" }),
    ).toBeVisible();
    await expect(page.getByText("ORIGINAL")).toBeVisible();
    await expect(page.getByText("CLEANED")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue to Export" }),
    ).toHaveAttribute("href", /\/export\//);
  });

  test("Select whole image gives keyboard/non-pointer users a real way to select a region", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachCleanup(page);

    await page.getByRole("button", { name: "Select whole image" }).click();
    await expect(
      page.getByRole("button", { name: "Process Image" }),
    ).toBeEnabled();
  });

  test("Reset selection returns to the unprocessed state", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachCleanup(page);

    await page.getByRole("button", { name: "Select whole image" }).click();
    await page.getByRole("button", { name: "Reset selection" }).click();

    await expect(
      page.getByRole("button", { name: "Process Image" }),
    ).toBeDisabled();
  });

  test("does not offer or claim watermark/text/logo removal", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await uploadAndReachCleanup(page);

    const removeWatermark = page.getByRole("button", {
      name: /Remove watermark/,
    });
    await expect(removeWatermark).toBeDisabled();
    await expect(removeWatermark).toContainText("SOON");
  });

  test("shows the No image found state for a route with no uploaded image", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await page.goto("/cleanup/00000000-0000-0000-0000-000000000000");

    await expect(
      page.getByRole("heading", { name: "No image found" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Upload an image" }),
    ).toBeVisible();
  });
});

test.describe("Cleanup page — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders with no horizontal overflow and a usable Process action", async ({
    page,
  }) => {
    await uploadAndReachCleanup(page);

    const overflowX = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflowX).toBeLessThanOrEqual(1);

    await expect(
      page.getByRole("button", { name: "Select whole image" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Select whole image" }).click();

    const processButton = page.getByRole("button", { name: "Process Image" });
    await expect(processButton).toBeEnabled();
    const box = await processButton.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });
});
