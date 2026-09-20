import { fileURLToPath } from 'node:url';

// `new URL(...).pathname` is NOT a safe way to get a filesystem path on
// Windows — it produces "/C:/Users/..." (a leading slash before the drive
// letter), which most fs APIs will not resolve correctly. `fileURLToPath`
// is Node's actual documented way to convert a file:// URL to a real,
// platform-correct filesystem path. See PROJECT_AUDIT.md.
const here = (relative) => fileURLToPath(new URL(relative, import.meta.url));

// Public: gallery photos, event images, notice attachments — genuinely
// meant to be reachable by anyone, served via express.static in app.js.
// Unchanged location/URL shape from before this pass, so any already-
// stored `/uploads/<filename>` paths keep working with no migration.
export const publicUploadDir = here('../uploads');

// Private: admission-submitted documents and admin-uploaded "Documents"
// records. Deliberately a *sibling* of uploads/, not a subfolder of it —
// never mounted with express.static anywhere, so there is no path under
// any public URL prefix that reaches it. Only readable through the
// authenticated download endpoints in admissionController.js and
// documentController.js. See PROJECT_AUDIT.md for the full reasoning.
export const privateUploadDir = here('../private-uploads');
