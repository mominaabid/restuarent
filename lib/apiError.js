/**
 * The message to show for a failed API call, from what the server actually
 * said. Order of preference:
 *   1. the screen's own wording for that code (`specific`, e.g. t.pay.errors)
 *   2. the shared wording for every code (t.apiErrors.codes)
 *   3. a plain sentence the server sent instead of a code
 *   4. what the HTTP status means (t.apiErrors.http)
 *   5. the screen's fallback
 * Codes are read from {"error": code}, DRF's {"detail": ...} and field errors
 * ({"phone": ["error.phoneRequired"]}), the same as the admin's client.ts.
 */
export function apiErrorMessage(t, body, status, specific = {}, fallback = t.apiErrors.generic) {
  const found = [];
  const collect = (value) => {
    if (typeof value === "string") {
      if (value) found.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(collect);
    } else if (value && typeof value === "object") {
      for (const key of ["error", "detail", "non_field_errors"]) if (key in value) collect(value[key]);
      for (const [key, nested] of Object.entries(value)) if (!["error", "detail", "non_field_errors"].includes(key)) collect(nested);
    }
  };
  collect(body);

  for (const code of found.filter((value) => value.startsWith("error."))) {
    const message = specific?.[code] ?? t.apiErrors.codes[code];
    if (message) return message;
  }
  const sentence = found.find((value) => !value.startsWith("error."));
  if (sentence) return sentence;
  return t.apiErrors.http[status] ?? fallback;
}

/** A fetch that never got an answer (offline, server down). */
export function networkErrorMessage(t) {
  return t.apiErrors.network;
}
