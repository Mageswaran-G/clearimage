import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_IMAGE = path.join(__dirname, "fixtures", "test-image.png");

/** Drives Upload -> Analyze -> Full Report, the real path to Provenance. */
async function reachProvenance(page: Page): Promise<string> {
  await page.goto("/upload");
  await page.getByLabel("Choose an image file").setInputFiles(TEST_IMAGE);
  await page.getByRole("button", { name: "Analyze Image" }).first().click();
  await page.waitForURL(/\/inspect\/[0-9a-f-]{36}$/i);

  await page.getByRole("link", { name: "Full Report" }).first().click();
  await page.waitForURL(/\/provenance\/[0-9a-f-]{36}$/i);

  const match = page.url().match(/\/provenance\/([0-9a-f-]{36})$/i);
  if (!match) throw new Error("Did not land on a /provenance/[id] URL");
  return match[1];
}

test.describe("Provenance page — desktop", () => {
  test("shows filename and real File identity information", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await reachProvenance(page);

    // ProvenanceView renders the mobile composition first in the DOM and
    // the desktop composition second — the visible copy at desktop
    // viewport is `.last()`.
    await expect(
      page.getByRole("heading", { name: "Image provenance" }),
    ).toBeVisible();
    await expect(page.getByText("test-image.png").last()).toBeVisible();
    await expect(page.getByText("PNG").last()).toBeVisible();
    await expect(page.getByText("100 × 100").last()).toBeVisible();
    await expect(page.getByText(/^\d+ B$/).last()).toBeVisible();
  });

  test("reports a real metadata state, not a fabricated one", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await reachProvenance(page);

    // The fixture PNG carries no Software tag, so this must read "Not
    // detected" — never a guessed application name.
    await expect(page.getByText("Creating application").last()).toBeVisible();
    await expect(page.getByText("Not detected").last()).toBeVisible();
  });

  test("never claims a C2PA detection result", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop-specific flow");
    await reachProvenance(page);
    await expect(
      page.getByRole("heading", { name: "Image provenance" }),
    ).toBeVisible();
    await expect(
      page.getByText(/not available in this version/i).last(),
    ).toBeVisible();

    const bodyText = await page.locator("main").innerText();
    expect(bodyText).toContain("not available in this version");
    expect(bodyText.toLowerCase()).not.toMatch(
      /no content credentials (were )?detected/,
    );
    expect(bodyText.toLowerCase()).not.toMatch(/c2pa (detected|found|present)/);
  });

  test("does not expose GPS coordinates anywhere on the page", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await reachProvenance(page);
    await expect(
      page.getByRole("heading", { name: "Image provenance" }),
    ).toBeVisible();
    await expect(page.getByText("File identity").last()).toBeVisible();

    const bodyText = await page.locator("main").innerText();
    // No latitude/longitude-shaped decimal pair should ever appear.
    expect(bodyText).not.toMatch(/-?\d{1,3}\.\d{3,},\s*-?\d{1,3}\.\d{3,}/);
  });

  test("Continue to Cleanup navigates to /cleanup/[id] with the same id", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    const id = await reachProvenance(page);

    await page
      .getByRole("link", { name: "Continue to Cleanup" })
      .last()
      .click();
    await expect(page).toHaveURL(new RegExp(`/cleanup/${id}$`));
  });

  test("stays on step 02 INSPECT in the workflow header", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "desktop-specific flow");
    await reachProvenance(page);

    const nav = page.getByRole("navigation", { name: "Workflow progress" });
    await expect(nav.getByText("02 INSPECT")).toBeVisible();
  });
});

test.describe("Provenance page — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders with no horizontal overflow, readable sections, and a usable primary action", async ({
    page,
  }) => {
    await reachProvenance(page);

    await expect(
      page.getByRole("heading", { name: "Image provenance" }),
    ).toBeVisible();

    const overflowX = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflowX).toBeLessThanOrEqual(1);

    // Here the mobile composition (first in the DOM) is the visible one.
    await expect(page.getByText("File identity").first()).toBeVisible();
    await expect(page.getByText("Metadata").first()).toBeVisible();
    await expect(page.getByText("Content Credentials").first()).toBeVisible();
    await expect(page.getByText("Editing signals").first()).toBeVisible();

    const cleanupLink = page.getByRole("link", { name: "Continue to Cleanup" });
    await expect(cleanupLink).toBeVisible();
    const box = await cleanupLink.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });
});
