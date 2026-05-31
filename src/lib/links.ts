// ─────────────────────────────────────────────────────────────────────────────
// External links & sharing configuration.
//
// 👉 EDIT THESE TWO VALUES:
//   - SITE_URL: your live website address (used in share messages).
//   - BUY_ME_A_COFFEE_URL: your personal Buy Me a Coffee page.
//     Create one free at https://buymeacoffee.com and replace `yourusername`.
// ─────────────────────────────────────────────────────────────────────────────

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://fantaid.vercel.app'

export const BUY_ME_A_COFFEE_URL =
  process.env.NEXT_PUBLIC_BMC_URL || 'https://www.buymeacoffee.com/yourusername'

/** Build share-intent URLs for each platform. */
export function buildShareLinks(message: string, url: string) {
  const text = `${message} ${url}`
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
    // Instagram has no web share-intent: we fall back to the native share sheet
    // (mobile) or copy-to-clipboard, handled in the component.
  }
}
