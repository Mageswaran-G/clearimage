# Cloud cleanup architecture

This directory is the isolated boundary between ClearImage and any real
GPU/cloud inference vendor for the content-aware cleanup operations
(watermark/text/logo removal, artifact reduction). **No real vendor is
wired up yet** — see "Current status" below.

## Files

- `cloud-cleanup-provider.ts` — the `CloudCleanupProvider` interface every
  vendor implementation must satisfy, plus `NullCloudCleanupProvider`, the
  current placeholder.
- `provider-registry.ts` — `getCloudCleanupProvider()`, the single place
  that turns an env-configured provider name into an instance. Adding a
  real vendor means adding one case here and one new class — nothing else
  in the app changes.
- `config.ts` — reads every cloud-related environment variable (see
  `.env.example`).
- `errors.ts` — `CloudCleanupError` and the closed set of error codes both
  the server route and the client are allowed to see and act on.
- `validate-cloud-request.ts` — server-side re-validation of everything a
  request claims about itself (image bytes, operation, selection),
  independent of whatever the browser already checked.
- `request-cloud-cleanup.ts` — the client-side call into
  `POST /api/cleanup/process`, plus `validateCloudCleanupResult`, which
  decodes and sanity-checks a provider's response before it's allowed near
  `cleanup-result-store`/Export.

## Current status

Every cloud operation in the Cleanup catalog (`operations.ts`) is marked
`"coming-soon"`, not `"supported"`. The architecture above is real and
tested end-to-end against fake providers, but `getCloudCleanupProvider()`
always resolves to `NullCloudCleanupProvider`, which always fails with
`PROVIDER_UNAVAILABLE` — there is no path through this code that returns a
fabricated result. An operation moves to `"supported"` only as a
deliberate, reviewed edit to `operations.ts`, made after a specific
provider has passed the GPU/quality benchmark this project's Phase 8
research track is working through — never automatically from an env
variable being set.

## Request/response contract

`POST /api/cleanup/process`, `multipart/form-data`:

| Field         | Value                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `image`       | the source image file (JPEG/PNG/WebP)                                                                           |
| `operationId` | one of `remove-watermark`, `remove-text-overlay`, `remove-logo`, `reduce-artifacts`                             |
| `region`      | JSON-encoded `{x,y,width,height}`, each 0..1 — the same normalized region shape used everywhere else in Cleanup |

Success (`200`): the processed image's raw bytes as the response body,
`Content-Type` set to its real MIME type, with `X-ClearImage-Width`,
`X-ClearImage-Height`, and `X-ClearImage-Total-Ms` headers carrying
metadata. Bytes travel as the raw body rather than base64/JSON specifically
to avoid the ~33% size inflation base64 would add on top of an already
size-constrained request/response pair.

Failure (`4xx`/`5xx`): `{ "error": { "code": CloudCleanupErrorCode,
"message": string } }` — `message` is always the same safe, user-facing
text from `errors.ts`; a vendor's real error detail is logged server-side
only (see `route.ts`'s `console.error` call) and never reaches the
response body.

## Temporary data lifecycle

Upload → the route reads the multipart body into memory
(`Uint8Array`) → validation and provider processing happen entirely in
that request's process memory → the result streams back as the response
body → nothing is written to disk, a database, or any persistent store at
any point, and there is nothing to explicitly "clean up" afterward beyond
normal garbage collection once the request completes. This matches the
rest of the app's in-memory-only architecture (`temp-image-store.ts`,
`cleanup-result-store.ts`) — a cloud round trip doesn't introduce a new
kind of persistence, just a temporary trip through a server process.

Logging discipline: server logs may record a provider's name and an error
code (see `route.ts`). They must never record image bytes, base64 image
data, or full request/response bodies.

## Why a cloud request doesn't just send the original upload file

ClearImage's browser upload limit (`NEXT_PUBLIC_MAX_UPLOAD_MB`, 25MB by
default) has nothing to do with what a cloud request should send. Two
independent reasons keep cloud payloads much smaller:

1. **Model contract**: the LaMa-class model this project's Phase 8 research
   is built around takes a fixed 512×512 input — sending a 25MB original
   has no quality benefit the model can use.
2. **Deployment reality**: many serverless platforms (Vercel among them)
   cap a function's request body size well below 25MB.
   `CLOUD_CLEANUP_MAX_REQUEST_MB` (8MB by default) enforces a server-side
   ceiling independent of the upload limit. The planned future mitigation
   for this is downscaling the image client-side before sending it to this
   endpoint (plain Canvas resizing, the same tool the app already uses for
   blur/crop) instead of sending the untouched original — see the note
   below for why that isn't built yet.

**Client-side resizing is a planned future mitigation, not implemented
today.** `requestCloudCleanup()` currently sends the original, unmodified
`File` exactly as selected — no resizing happens anywhere in this code
path yet. Until it's added, the request-size ceiling is enforced two ways
in `route.ts`: an early check against the `Content-Length` header (before
the body is read into memory at all) and an exact check against the real
decoded image bytes (`validate-cloud-request.ts`, unchanged and
authoritative). A file that fits under `NEXT_PUBLIC_MAX_UPLOAD_MB` (25MB)
but exceeds `CLOUD_CLEANUP_MAX_REQUEST_MB` (8MB) is rejected with
`FILE_TOO_LARGE` today — that gap is exactly what client-side resizing is
meant to close once it's built, not something already bridged.

Neither this nor a future resizing step requires a presigned-upload/
object-storage system. If a future need genuinely requires sending a much
larger payload than client-side resizing can reasonably shrink, the
transport (how bytes reach the server) can be swapped independently of the
`CloudCleanupProvider` interface, which only ever deals in bytes already
present on the server — it has no opinion on how they got there.
