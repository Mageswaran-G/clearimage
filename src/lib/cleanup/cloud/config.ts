/**
 * Server-side cloud cleanup configuration, read once from environment
 * variables. Every real vendor detail (endpoint, key, provider name) lives
 * only here and in provider-registry.ts — never in the API route or the
 * Cleanup UI, so a provider swap never touches either.
 */

/** Master server-side switch. When false, the API route refuses every
 * request with PROVIDER_UNAVAILABLE before any provider is even consulted
 * — this is what makes "no request should accidentally reach a cloud
 * provider" true by construction, not just by convention. */
export function isCloudCleanupEnabled(): boolean {
  return process.env.CLOUD_CLEANUP_ENABLED === "true";
}

/** Selects which CloudCleanupProvider implementation the registry builds.
 * "none" (the default) always yields NullCloudCleanupProvider, regardless
 * of CLOUD_CLEANUP_ENABLED — a provider name must be explicitly set before
 * any real vendor code path can be reached. */
export function cloudCleanupProviderName(): string {
  return process.env.CLOUD_CLEANUP_PROVIDER ?? "none";
}

export function cloudCleanupProviderEndpoint(): string | undefined {
  return process.env.CLOUD_CLEANUP_PROVIDER_ENDPOINT;
}

export function cloudCleanupProviderApiKey(): string | undefined {
  return process.env.CLOUD_CLEANUP_PROVIDER_API_KEY;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export function cloudCleanupTimeoutMs(): number {
  const raw = Number(process.env.CLOUD_CLEANUP_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

// Deliberately independent of MAX_UPLOAD_SIZE_MB (the browser-only upload
// limit) — see src/lib/cleanup/cloud/README.md for why a cloud request
// payload must stay far smaller than the app's general upload limit.
const DEFAULT_MAX_REQUEST_MB = 8;

export function cloudCleanupMaxRequestBytes(): number {
  const raw = Number(process.env.CLOUD_CLEANUP_MAX_REQUEST_MB);
  const mb = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_REQUEST_MB;
  return mb * 1024 * 1024;
}
