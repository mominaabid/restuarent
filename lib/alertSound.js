/**
 * A loud, short alert for order-status changes on the customer's phone.
 *
 * Browsers only allow audio after the user has touched the page, so
 * `unlockAlertSound()` is wired to the first tap; until then `playAlert()`
 * falls back to vibration only. Generated with Web Audio — no sound file.
 */
let context = null;

function audioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!context) context = new AudioCtor();
  return context;
}

export function unlockAlertSound() {
  try {
    const ctx = audioContext();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    // Audio unavailable — vibration and the on-screen banner still work.
  }
}

/** "ready" = three rising beeps, anything else = two beeps. */
export function playAlert(kind = "update") {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(kind === "ready" ? [250, 120, 250, 120, 400] : [200, 100, 200]);
  } catch {
    // ignore
  }
  try {
    const ctx = audioContext();
    if (!ctx || ctx.state !== "running") return;
    const notes = kind === "ready" ? [880, 1175, 1568] : [988, 1319];
    notes.forEach((frequency, index) => {
      const start = ctx.currentTime + index * 0.22;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.9, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.21);
    });
  } catch {
    // ignore
  }
}
