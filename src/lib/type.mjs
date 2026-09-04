/**
 * Archivo 800's metrics, in em, measured in a browser.
 *
 * Measured, not taken from the spec. The brand package states a cap height of
 * 1760 and it is correct, but it is in the font's own units against an em the
 * site never sees; reading it as 0.88em puts the mark a fifth too large. These
 * come from `measureText` on the loaded face at weight 800.
 *
 * They live here rather than in each component because three of them need the
 * cap height and a wordmark whose parts disagree about where the caps are is a
 * wordmark whose parts do not line up. A remeasure is one edit.
 */

/** Cap height: the top of an H above the baseline. */
export const CAP = 0.68709;

/** The I's stem, its inked width. The bar that replaces the I is a fraction of it. */
export const STEM = 0.179469;

/** Half a cap: where a mark set beside capitals is centred. */
export const CAP_MID = CAP / 2;
