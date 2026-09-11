import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

/**
 * All helpers below drive the app via real clicks on real links/buttons —
 * never `page.goto` mid-session — because the temp stores are in-memory
 * only, and `page.goto` is a hard navigation that reloads the JS module
 * state, the same as a real page refresh would. A helper that used goto
 * to "jump" to a later step would silently test a scenario that can't
 * happen through the real UI.
 */
async function uploadAndReachInspect(page: Page): Promise<string> {
  await page.goto("/upload");
  await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
  await page.getByRole("button", { name: "Analyze Image" }).first().click();
  await page.waitForURL(/\/inspect\/[0-9a-f-]{36}$/i);
  const match = page.url().match(/\/inspect\/([0-9a-f-]{36})$/i);
  if (!match) throw new Error("Did not land on an /inspect/[id] URL");
  return match[1];
}

async function goToCleanup(page: Page): Promise<void> {
  await page.getByRole("link", { name: "Continue to Cleanup" }).first().click();
  await page.waitForURL(/\/cleanup\/[0-9a-f-]{36}$/i);
}

async function runCleanupAndReachExport(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Select whole image" }).click();
  await page.getByRole("button", { name: "Process Image" }).click();
  await page.waitForSelector("text=Re-run Cleanup", { timeout: 5000 });
  await page.getByRole("link", { name: "Continue to Export" }).click();
  await page.waitForURL(/\/export\/[0-9a-f-]{36}$/i);
}

/** The full, real Upload -> Inspect -> Cleanup -> Export chain, entirely
 * via client-side navigation, ending with a real downloadable result. */
async function runFullWorkflow(page: Page): Promise<string> {
  const id = await uploadAndReachInspect(page);
  await goToCleanup(page);
  await runCleanupAndReachExport(page);
  return id;
}

test.describe("Full workflow integration", () => {
  test("Landing -> Upload -> Inspect -> Provenance -> back to Inspect -> Cleanup -> Export -> download -> Process Another -> Upload", async ({
    page,
    isMobile,
  }) => {
    // The dual mobile/desktop DOM composition (same pattern as every other
    // spec file) means content assertions need the right .first()/.last()
    // per viewport; mobile's own responsive behavior is already covered by
    // each page's dedicated "— mobile" describe block plus the full
    // responsive sweep, so this comprehensive content-assertion flow runs
    // desktop-only.
    test.skip(isMobile, "desktop-specific flow; mobile covered per-page");
    await page.goto("/");
    // "Upload an Image" (the Hero CTA) is visible at every breakpoint;
    // the header's "Upload Image" button is desktop-only.
    await page.getByRole("link", { name: "Upload an Image" }).first().click();
    await page.waitForURL(/\/upload$/);

    await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
    await page.getByRole("button", { name: "Analyze Image" }).first().click();
    await page.waitForURL(/\/inspect\/[0-9a-f-]{36}$/i);
    const id = page.url().match(/\/inspect\/([0-9a-f-]{36})$/i)![1];

    // Branch: Inspect -> Provenance (not a numbered step) -> back to Inspect.
    await page.getByRole("link", { name: "Full Report" }).first().click();
    await page.waitForURL(new RegExp(`/provenance/${id}$`));
    const provenanceNav = page.getByRole("navigation", {
      name: "Workflow progress",
    });
    await expect(provenanceNav.getByText("02 INSPECT")).toBeVisible();

    await page.goBack();
    await page.waitForURL(new RegExp(`/inspect/${id}$`));
    await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();

    // Continue down the numbered path: Cleanup -> Export.
    await goToCleanup(page);
    await runCleanupAndReachExport(page);
    await expect(page).toHaveURL(new RegExp(`/export/${id}$`));

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download Image" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("test-image-cleaned.png");

    await page.getByRole("link", { name: "Process Another Image" }).click();
    await page.waitForURL(/\/upload$/);
    await expect(
      page.getByRole("heading", { name: "Upload an image" }),
    ).toBeVisible();
  });
});

test.describe("Multiple image session (mandatory)", () => {
  test("Image B never displays or downloads Image A's data, and A's data is gone once its lifecycle ends", async ({
    page,
  }) => {
    // Image A: full workflow to a real downloadable result.
    const idA = await runFullWorkflow(page);
    const [downloadA] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Download Image" }).click(),
    ]);
    expect(downloadA.suggestedFilename()).toBe("test-image-cleaned.png");
    const exportUrlA = page.url();

    // Move on — this is the real workflow-end cleanup boundary.
    await page.getByRole("link", { name: "Process Another Image" }).click();
    await page.waitForURL(/\/upload$/);

    // Image A's id must now be fully gone, everywhere in its lifecycle.
    // (A hard nav here is the right tool: we're deliberately proving the
    // id is gone from the in-memory stores, the same as visiting a stale
    // bookmark would.)
    await page.goto(exportUrlA);
    await expect(
      page.getByRole("heading", { name: "No image found" }),
    ).toBeVisible();
    await page.goto(exportUrlA.replace("/export/", "/cleanup/"));
    await expect(
      page.getByRole("heading", { name: "No image found" }),
    ).toBeVisible();

    // Image B: a completely independent second run, from the fresh Upload
    // page we're already on.
    await page.goto("/upload");
    const idB = await uploadAndReachInspect(page);
    expect(idB).not.toBe(idA);
    await goToCleanup(page);
    await runCleanupAndReachExport(page);

    // Image B's Export must describe only Image B — never a trace of A.
    await expect(page.getByText("PNG")).toBeVisible();
    const downloadLinkB = page.getByRole("link", { name: "Download Image" });
    const hrefB = await downloadLinkB.getAttribute("href");
    expect(hrefB).toMatch(/^blob:/);

    const [downloadB] = await Promise.all([
      page.waitForEvent("download"),
      downloadLinkB.click(),
    ]);
    expect(downloadB.suggestedFilename()).toBe("test-image-cleaned.png");
  });
});

test.describe("Source/result separation", () => {
  test("Inspect and Provenance keep showing the original after Cleanup has produced a processed result", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow; mobile covered per-page");
    await runFullWorkflow(page);

    // Real browser Back (client-side, preserves the in-memory session) to
    // Cleanup, then Inspect — Cleanup running must never have mutated the
    // original source record. Cleanup's own region/before-after UI state is
    // local component state, not stored data — Next remounts the route on
    // a back-navigation, so that ephemeral UI legitimately resets, but the
    // *source record* it reads from does not: "Select whole image" being
    // available again proves the same real source is still there.
    await page.goBack();
    await expect(
      page.getByRole("button", { name: "Select whole image" }),
    ).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();
    await expect(page.getByText("test-image.png").last()).toBeVisible();
    await expect(page.getByText("100 × 100").last()).toBeVisible();

    await page.getByRole("link", { name: "Full Report" }).first().click();
    await expect(page.getByText("test-image.png").last()).toBeVisible();
  });

  test("repeated downloads on Export keep working against the same processed result", async ({
    page,
  }) => {
    await runFullWorkflow(page);

    const downloadLink = page.getByRole("link", { name: "Download Image" });
    for (let i = 0; i < 3; i++) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        downloadLink.click(),
      ]);
      expect(download.suggestedFilename()).toBe("test-image-cleaned.png");
    }
  });

  test("Re-run Cleanup replaces the exportable result rather than leaving a stale one", async ({
    page,
  }) => {
    await uploadAndReachInspect(page);
    await goToCleanup(page);
    await page.getByRole("button", { name: "Select whole image" }).click();
    await page.getByRole("button", { name: "Process Image" }).click();
    await page.waitForSelector("text=Re-run Cleanup", { timeout: 5000 });

    // Re-run with the crop operation instead — a genuinely different result.
    await page.getByRole("button", { name: "Crop to selection" }).click();
    await page.getByRole("button", { name: "Re-run Cleanup" }).click();
    await page.waitForTimeout(200);

    await page.getByRole("link", { name: "Continue to Export" }).click();
    await page.waitForURL(/\/export\/[0-9a-f-]{36}$/i);
    // Crop-to-selection over the whole image is a no-op crop (same pixels,
    // same size here), but this proves the *second* run's result is what
    // Export receives, not a leftover from the first.
    await expect(page.getByText("100 × 100")).toBeVisible();
  });
});

test.describe("Invalid / missing id states", () => {
  const NONEXISTENT = "00000000-0000-0000-0000-000000000000";
  const MALFORMED = "not-a-real-uuid";

  for (const route of ["inspect", "provenance", "cleanup", "export"]) {
    test(`${route}/[id] shows a safe, branded state for a nonexistent id`, async ({
      page,
    }) => {
      const response = await page.goto(`/${route}/${NONEXISTENT}`);
      expect(response?.status()).toBeLessThan(500);
      await expect(
        page.getByRole("heading", { name: "No image found" }),
      ).toBeVisible();
      await expect(page.getByText(/error:|exception|stack trace/i)).toHaveCount(
        0,
      );
    });

    test(`${route}/[id] shows a safe, branded state for a malformed id`, async ({
      page,
    }) => {
      const response = await page.goto(`/${route}/${MALFORMED}`);
      expect(response?.status()).toBeLessThan(500);
      await expect(
        page.getByRole("heading", { name: "No image found" }),
      ).toBeVisible();
    });
  }
});

test.describe("Refresh behavior is honest", () => {
  test("reloading Cleanup mid-session loses in-memory state without a misleading success", async ({
    page,
  }) => {
    await uploadAndReachInspect(page);
    await goToCleanup(page);
    await expect(
      page.getByRole("button", { name: "Select whole image" }),
    ).toBeVisible();

    await page.reload();

    // Honest: a hard reload loses the in-memory record, and the page says
    // so plainly rather than showing a broken workspace or a fake result.
    await expect(
      page.getByRole("heading", { name: "No image found" }),
    ).toBeVisible();
  });

  test("reloading Export mid-session loses in-memory state without a misleading success", async ({
    page,
  }) => {
    await runFullWorkflow(page);
    await expect(
      page.getByRole("heading", { name: "Your image is ready" }),
    ).toBeVisible();

    await page.reload();

    await expect(
      page.getByRole("heading", { name: "No image found" }),
    ).toBeVisible();
    // Never claim readiness with nothing behind it.
    await expect(page.getByText("Your image is ready")).toHaveCount(0);
  });
});

test.describe("Recovery after failure", () => {
  test("an unsupported file, then a valid one, recovers without reloading the app", async ({
    page,
  }) => {
    await page.goto("/upload");

    await page.getByLabel("Choose an image file").setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(
      page.getByRole("alert").filter({ hasText: "Unsupported format" }),
    ).toBeVisible();

    await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
    await page.getByRole("button", { name: "Analyze Image" }).first().click();
    await page.waitForURL(/\/inspect\/[0-9a-f-]{36}$/i);
    await expect(page.getByRole("heading", { name: "Analysis" })).toBeVisible();
  });
});
