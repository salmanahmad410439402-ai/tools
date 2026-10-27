/**
 * Cookie / analytics consent, stored locally and never transmitted.
 *
 * One record in localStorage drives three things:
 *   - whether Vercel Analytics (or a Plausible/Umami script) is allowed to load,
 *   - whether manual AdSense units may render,
 *   - and the wording of the banner that asks for the choice.
 *
 * The tools themselves are never gated: file processing runs entirely on the
 * device, so declining changes nothing about what the site can do.
 *
 * Keep CONSENT_KEY in sync with the Cookie Policy table.
 */
export const CONSENT_KEY = "filecraft-consent";
/** Fired on window after a choice is made or cleared, so open tabs stay in sync. */
export const CONSENT_EVENT = "filecraft:consent-changed";

export type ConsentChoice = "all" | "essential";

export interface ConsentRecord {
  /** True when the visitor allowed cookie-free measurement. */
  analytics: boolean;
  /** True when the visitor allowed advertising (Google AdSense). */
  ads: boolean;
  choice: ConsentChoice;
  /** ISO timestamp of the decision. */
  decidedAt: string;
}

export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.ads !== "boolean") return null;
    return {
      analytics: parsed.analytics,
      ads: parsed.ads,
      choice: parsed.choice === "all" ? "all" : "essential",
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : "",
    };
  } catch {
    // Storage blocked or corrupt: treat as "no decision yet", never throw.
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): ConsentRecord {
  const record: ConsentRecord = {
    analytics: choice === "all",
    ads: choice === "all",
    choice,
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    /* private mode: the choice simply does not persist */
  }
  announce(record);
  return record;
}

/** Used by the footer's "Cookie settings" control: forget the choice and ask again. */
export function clearConsent() {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* ignore */
  }
  announce(null);
}

function announce(record: ConsentRecord | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }));
}

/** Subscribe to choice changes, including from another tab. Returns an unsubscribe. */
export function subscribeConsent(listener: (record: ConsentRecord | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = (event: Event) => listener((event as CustomEvent<ConsentRecord | null>).detail ?? null);
  const onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY) listener(readConsent());
  };
  window.addEventListener(CONSENT_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
