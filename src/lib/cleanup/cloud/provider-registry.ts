import {
  NullCloudCleanupProvider,
  type CloudCleanupProvider,
} from "@/lib/cleanup/cloud/cloud-cleanup-provider";
import { cloudCleanupProviderName } from "@/lib/cleanup/cloud/config";

/**
 * The single place that turns a provider *name* into a provider
 * *instance*. Adding a real vendor later means adding one case here (and
 * one new class next to cloud-cleanup-provider.ts) — the API route and the
 * Cleanup UI call getCloudCleanupProvider() and never construct or
 * reference a specific provider class directly.
 *
 * No real vendor case exists yet: per Phase 8's own findings, no model has
 * passed the GPU/quality benchmark, so there is nothing honest to wire up
 * yet. Every currently-recognized name still resolves to the Null
 * provider; unrecognized names also fall back to it rather than throwing,
 * so a typo'd env var fails safe (cloud cleanup reports itself
 * unavailable) instead of crashing the app.
 */
export function getCloudCleanupProvider(): CloudCleanupProvider {
  const name = cloudCleanupProviderName();

  switch (name) {
    case "none":
    default:
      return new NullCloudCleanupProvider();
  }
}
