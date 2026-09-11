import type { C2paResult } from "@/lib/provenance/types";

/**
 * Content Credentials (C2PA) inspection.
 *
 * INVESTIGATED for this phase and deliberately NOT integrated yet:
 * the current recommended browser SDK, `@contentauth/c2pa-web`, is a real,
 * actively maintained reader (the older `c2pa` package it replaces is
 * deprecated) — but it ships a WebAssembly binary, is ~19.7 MB unpacked,
 * is still pre-1.0 with a Reader/Builder API that requires manual memory
 * management (`.free()`), and its documented CDN-hosted loading path
 * (jsdelivr) is unreachable from this environment's network policy, which
 * made it impossible to verify safely and reliably within this phase.
 * Self-hosting the .wasm file from /public would avoid the CDN dependency,
 * but the package is still too heavy to add responsibly right now for a
 * capability this module can honestly report as unavailable instead.
 *
 * This function is the seam: a later phase can implement real detection
 * and verification here — extending `C2paStatus` beyond "unavailable" —
 * without any UI changes, since callers only ever render `message`.
 *
 * Never simulates or fabricates a result, and never treats the absence of
 * a check as evidence the image lacks Content Credentials.
 */
export async function inspectC2pa(): Promise<C2paResult> {
  return {
    status: "unavailable",
    message: "Not available in this version.",
  };
}
