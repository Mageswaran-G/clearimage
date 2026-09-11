import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

/**
 * Drives the real, full workflow — Upload -> Inspect -> Cleanup -> select
 * "Select whole image" -> run the real "Blur selected area" Cleanup
 * operation -> Continue to Export — so Export always receives a genuine
 * processed Blob from the actual Cleanup pipeline, never a fabricated one.
 */
async function runFullWorkflowToExport(page: Page): Promise<string> {
  await page.goto("/upload");
  await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
  await page.getByRole("button", { name: "Analyze Image" }).first().click();
  await page.waitForURL(/\/inspect\/[0-9a-f-]{36}$/i);

  await page.getByRole("link", { name: "Continue to Cleanup" }).first().click();
  await page.waitForURL(/\/cleanup\/[0-9a-f-]{36}$/i);

  await page.getByRole("button", { name: "Select whole image" }).click();
  await page.getByRole("button", { name: "Process Image" }).click();
  await page.waitForSelector("text=Re-run Cleanup", { timeout: 5000 });

  await page.getByRole("link", { name: "Continue to Export" }).click();
  await page.waitForURL(/\/export\/[0-9a-f-]{36}$/i);

  const match = page.url().match(/\/export\/([0-9a-f-]{36})$/i);
  if (!match) throw new Error("Did not land on an /export/[id] URL");
  return match[1];
}

test.describe("Export page — desktop", () => {
  test("stays on step 04 EXPORT in the workflow header", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await runFullWorkflowToExport(page);

    const nav = page.getByRole("navigation", { name: "Workflow progress" });
    await expect(nav.getByText("04 EXPORT")).toBeVisible();
  });

  test("shows the real processed result, format, resolution, and file size", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await runFullWorkflowToExport(page);

    await expect(
      page.getByRole("heading", { name: "Your image is ready" }),
    ).toBeVisible();
    await expect(page.getByText("READY TO EXPORT")).toBeVisible();
    // The fixture is 100x100 and Blur preserves source dimensions.
    await expect(page.getByText("100 × 100")).toBeVisible();
    // Cleanup preserves the source format — the fixture is a PNG.
    await expect(page.getByText("PNG")).toBeVisible();
  });

  test("Download Image points at the real processed Blob with a safe, correctly-extensioned filename", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await runFullWorkflowToExport(page);

    const downloadLink = page.getByRole("link", { name: "Download Image" });
    const href = await downloadLink.getAttribute("href");
    const downloadName = await downloadLink.getAttribute("download");

    expect(href).toMatch(/^blob:/);
    expect(downloadName).toBe("test-image-cleaned.png");
  });

  test("clicking Download Image triggers a real download and shows completion", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await runFullWorkflowToExport(page);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download Image" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("test-image-cleaned.png");
    await expect(page.getByRole("status")).toContainText(/download started/i);
  });

  test("Process Another Image navigates to Upload and clears this image's data", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    const id = await runFullWorkflowToExport(page);

    await page.getByRole("link", { name: "Process Another Image" }).click();
    await expect(page).toHaveURL(/\/upload$/);

    // The old image's data is gone — revisiting its Export URL now shows
    // the missing-image state instead of a stale/expired result.
    await page.goto(`/export/${id}`);
    await expect(
      page.getByRole("heading", { name: "No image found" }),
    ).toBeVisible();
  });

  test("shows the No image found state for a route with no uploaded image", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await page.goto("/export/00000000-0000-0000-0000-000000000000");

    await expect(
      page.getByRole("heading", { name: "No image found" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Upload an image" }),
    ).toBeVisible();
  });
});

test.describe("Export page — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders with no horizontal overflow and a full-width usable download action", async ({
    page,
  }) => {
    await runFullWorkflowToExport(page);

    const overflowX = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflowX).toBeLessThanOrEqual(1);

    const downloadLink = page.getByRole("link", { name: "Download Image" });
    await expect(downloadLink).toBeVisible();
    const box = await downloadLink.boundingBox();
    expect(box?.width).toBeGreaterThan(300);

    await expect(
      page.getByRole("link", { name: "Process Another Image" }),
    ).toBeVisible();
  });
});
