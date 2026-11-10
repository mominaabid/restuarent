/**
 * Prints one kind of 80mm slip (the paid bill, the tax invoice) and nothing
 * else on the page, on paper exactly the slip's length.
 *
 * A browser takes the paper size from the `@page` rule in force at print
 * time; without one it assumes A4 and the slip becomes a strip in the corner
 * of a full sheet (or a tiny "Save as PDF"). The length depends on the slip,
 * so it is measured here and the rule injected. globals.css (`printing-slip`)
 * removes everything else from the print layout, so nothing blank follows.
 */

const MODE = "printing-slip";
const MEASURE = "slip-measure";
const TARGET = "print-slip";
const PAGE_STYLE_ID = "slip-page-size";
const MM_PER_PX = 25.4 / 96;
// Bottom slack so the last line is never pushed onto a second page by rounding.
const BOTTOM_MM = 4;

let clearCurrent = null;

function slipLengthMm(slips) {
  const root = document.documentElement;
  root.classList.add(MEASURE);
  try {
    const px = slips.reduce((sum, slip) => sum + slip.getBoundingClientRect().height, 0);
    return Math.ceil(px * MM_PER_PX) + BOTTOM_MM;
  } finally {
    root.classList.remove(MEASURE);
  }
}

/** `selector` picks the slip(s) to print, e.g. ".bill-receipt" or ".tax-invoice". */
export function printSlip(selector) {
  clearCurrent?.();
  const slips = Array.from(document.querySelectorAll(selector));
  if (!slips.length) return;
  const root = document.documentElement;
  slips.forEach((slip) => slip.classList.add(TARGET));

  const style = document.createElement("style");
  style.id = PAGE_STYLE_ID;
  style.textContent = `@page { size: 80mm ${slipLengthMm(slips)}mm; margin: 0; }`;
  document.head.appendChild(style);
  root.classList.add(MODE);

  // Phones and Safari lay the page out for paper only after window.print()
  // returns, so the mode stays until the dialog closes (afterprint); a long
  // timer covers browsers that never fire it, and the next print clears it.
  let timer = 0;
  const clear = () => {
    root.classList.remove(MODE);
    slips.forEach((slip) => slip.classList.remove(TARGET));
    style.remove();
    window.removeEventListener("afterprint", clear);
    window.clearTimeout(timer);
    if (clearCurrent === clear) clearCurrent = null;
  };
  clearCurrent = clear;
  window.addEventListener("afterprint", clear, { once: true });
  timer = window.setTimeout(clear, 60_000);
  window.print();
}
