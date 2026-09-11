import { describe, expect, it } from "vitest";
import { inspectC2pa } from "@/lib/provenance/inspect-c2pa";

describe("inspectC2pa", () => {
  it("reports unavailable rather than simulating a detection result", async () => {
    const result = await inspectC2pa();

    expect(result.status).toBe("unavailable");
    expect(result.message).toBe("Not available in this version.");
  });

  it("never claims C2PA was detected or not detected", async () => {
    const result = await inspectC2pa();

    expect(result.message.toLowerCase()).not.toMatch(/detected/);
  });
});
