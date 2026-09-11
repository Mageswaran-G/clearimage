import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// @testing-library/react does not clean up automatically unless Vitest's
// globals are enabled. We keep imports explicit, so we register it here.
afterEach(cleanup);
