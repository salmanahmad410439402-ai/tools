/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PDF passwords — adding and removing them
 *
 *  pdf-lib does not implement the PDF standard security handler, so the
 *  encryption work is done by @cantoo/pdf-lib (MIT), an API-compatible fork
 *  that adds it. It is imported dynamically: only the protect and unlock pages
 *  ever download it, and it is fetched when the user presses the button, not
 *  when the page loads.
 *
 *  What it does:
 *    • protect — encrypts with AES-256 (ISO 32000-2, /V 5 /R 6), the only
 *      cipher the standard still recommends, plus the five permission flags.
 *    • unlock — decrypts a file whose password the user already knows, then
 *      copies the pages into a brand-new unencrypted document so no /Encrypt
 *      entry survives anywhere in the output.
 *
 *  This is not a cracking tool and has no dictionary attack: the password must
 *  be supplied, and a wrong one fails immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ProtectOptions {
  /** Required to open the document. May be empty when an owner password is set. */
  userPassword: string;
  /** Optional: opens with full rights regardless of the permission flags. */
  ownerPassword?: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
  allowAnnotating: boolean;
}

export interface UnlockResult {
  bytes: Uint8Array;
  pages: number;
}

const AES_256_MIN_LENGTH = 1;

/**
 * Cheap structural check used to pre-warn the UI. It looks for the `/Encrypt`
 * entry in the head and tail of the file, which is where a trailer keeps it.
 * A positive answer is a hint, never a guarantee — the real check is whether
 * the document loads.
 */
export function looksEncrypted(bytes: ArrayBuffer): boolean {
  const view = new Uint8Array(bytes);
  const decoder = new TextDecoder("latin1");
  const head = decoder.decode(view.subarray(0, Math.min(view.length, 8192)));
  const tail = decoder.decode(view.subarray(Math.max(0, view.length - 16384)));
  return /\/Encrypt\b/.test(`${head}${tail}`);
}

function copyBuffer(bytes: ArrayBuffer): ArrayBuffer {
  // pdf-lib may hold on to the buffer; hand each loader a private copy.
  return bytes.slice(0);
}

/** Adds a password (AES-256) and the five permission flags to a PDF. */
export async function protectPdf(bytes: ArrayBuffer, options: ProtectOptions): Promise<Uint8Array> {
  const userPassword = options.userPassword;
  const ownerPassword = options.ownerPassword?.trim() ? options.ownerPassword : userPassword;

  if (!userPassword && !options.ownerPassword?.trim()) {
    throw new Error("Type a password first — a protected file with no password is not protected.");
  }
  if (userPassword && userPassword.length < AES_256_MIN_LENGTH) {
    throw new Error("The password must contain at least one character.");
  }
  if (userPassword && userPassword.length > 127) {
    throw new Error("PDF passwords cannot be longer than 127 characters.");
  }

  const { PDFDocument } = await import("@cantoo/pdf-lib");

  let doc;
  try {
    doc = await PDFDocument.load(copyBuffer(bytes), { updateMetadata: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/encrypted/i.test(message)) {
      throw new Error(
        "This PDF is already password-protected. Remove its password with Unlock PDF first, then protect the unlocked copy.",
      );
    }
    throw new Error("This file could not be read as a PDF, so nothing was encrypted.");
  }

  doc.encrypt({
    userPassword,
    ownerPassword,
    algorithm: "AES-256",
    permissions: {
      printing: options.allowPrinting ? "highResolution" : false,
      copying: options.allowCopying,
      modifying: options.allowModifying,
      annotating: options.allowAnnotating,
      fillingForms: options.allowAnnotating,
      documentAssembly: options.allowModifying,
      contentAccessibility: true,
    },
  });

  const saved = await doc.save({ useObjectStreams: true });
  if (!looksEncrypted(saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength) as ArrayBuffer)) {
    throw new Error("The encrypted file did not come out as expected, so nothing was written. Please try again.");
  }
  return saved;
}

/**
 * Removes the password from a PDF the user can already open.
 *
 * The decrypted document is copied page by page into a fresh PDFDocument.
 * Clearing the trailer on the loaded document is not enough: its writer still
 * emits the original `/Encrypt` dictionary, so the result would reopen with a
 * password. A new document has no security handler at all.
 */
export async function unlockPdf(bytes: ArrayBuffer, password: string): Promise<UnlockResult> {
  const { PDFDocument } = await import("@cantoo/pdf-lib");

  let source;
  try {
    source = await PDFDocument.load(copyBuffer(bytes), { password, updateMetadata: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password incorrect|incorrect password/i.test(message)) {
      throw new Error(
        "That password does not open this file. Check the capitals and any spaces — the PDF password is case-sensitive.",
      );
    }
    if (/encrypted/i.test(message)) {
      throw new Error(
        "This file is encrypted in a way the browser cannot open. Certificate-based (public-key) and some AES-256 files from Acrobat need a desktop tool.",
      );
    }
    throw new Error("This file could not be opened. It may be damaged rather than protected.");
  }

  const clean = await PDFDocument.create();
  const pages = await clean.copyPages(source, source.getPageIndices());
  for (const page of pages) clean.addPage(page);

  // The document information dictionary is itself encrypted, and the decrypt
  // loader does not expose it, so the unlocked copy starts with clean
  // properties rather than guessing. The UI says so before the button is
  // pressed — carrying a stale author field over would be worse than clearing.
  clean.setProducer("Filecraft PDF unlock");

  const saved = await clean.save({ useObjectStreams: true });
  const pageCount = clean.getPageCount();

  // Verify with plain pdf-lib: this is the same reader every other tool uses,
  // and it refuses encrypted files, so a successful load proves the output is
  // really unlocked.
  const { PDFDocument: VanillaPdf } = await import("pdf-lib");
  const check = await VanillaPdf.load(saved, { updateMetadata: false });
  if (check.getPageCount() !== pageCount) {
    throw new Error("The unlocked file did not come out as expected, so nothing was written. Please try again.");
  }

  return { bytes: saved, pages: pageCount };
}

/** A one-line summary of the permissions being applied, for the UI. */
export function describePermissions(options: ProtectOptions): string {
  if (!options.userPassword) return "Opens without a prompt, but the permission flags are set.";
  const allowed = [
    options.allowPrinting ? "print" : null,
    options.allowCopying ? "copy" : null,
    options.allowModifying ? "edit" : null,
    options.allowAnnotating ? "comment" : null,
  ].filter(Boolean) as string[];
  if (allowed.length === 4) return "Readers may print, copy, edit and comment.";
  if (!allowed.length) return "Readers may open it and nothing else.";
  return `Readers may open and ${allowed.join(", ")}.`;
}
