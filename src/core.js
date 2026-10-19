/**
 * The set of HTTP methods recognised by the IANA HTTP Method Registry as of
 * its current revision. We deliberately enumerate them instead of reading a
 * file at runtime so that validation is hermetic — no I/O, no hidden state.
 *
 * Source: https://www.iana.org/assignments/http-methods/http-methods.xhtml
 */
export const ALLOWED_METHODS = Object.freeze(new Set([
  'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE',
  'PATCH'
]));

/**
 * Case-insensitive membership test against the standard method registry.
 * Exposed so callers can validate a single method without a round-trip
 * through parseAllowHeader.
 */
export function isAllowedMethod(method) {
  if (typeof method !== 'string' || method.length === 0) return false;
  return ALLOWED_METHODS.has(method.toUpperCase());
}

/**
 * Parses an HTTP `Allow` header value into the set of permitted methods.
 *
 * The Allow header (RFC 9110 §10.2.1) is a comma-separated list of HTTP
 * method names. Per the grammar it may include optional whitespace and a
 * q-parameter on each element; the q-parameter carries no useful meaning here
 * so it is stripped rather than rejected — rejecting it would make the parser
 * unusable against servers that blindly attach q-values to every comma list.
 *
 * Interpretations fixed by this implementation:
 *
 *  - Methods are normalised to UPPER CASE, because method tokens are
 *    case-sensitive per RFC 9110 §9.1 but the registry names are uppercase
 *    and everyone treats them that way. Lowercase `get` in a header is treated
 *    as `GET`.
 *  - Unknown methods are DROPPED, not rejected. A 405 response advertising a
 *    custom method like `LINK` should not make the whole header unparseable;
 *    callers who need to know about unknown methods can compare the input
 *    token count against the returned set size.
 *  - Empty elements are skipped, so `GET,,POST` yields `{GET, POST}`.
 *  - The return value is a plain `Set<string>` of uppercase method names —
 *    only methods present in ALLOWED_METHODS.
 *
 * @param {string|null|undefined} header
 * @returns {Set<string>}
 */
export function parseAllowHeader(header) {
  const result = new Set();

  if (typeof header !== 'string') {
    return result;
  }

  // The header grammar (RFC 9110 §5.5) permits optional whitespace around
  // each comma. A leading/trailing comma therefore produces an empty element;
  // we skip empties rather than erroring, because real servers emit them.
  const parts = header.split(',');

  for (const part of parts) {
    // Each element may carry a q-parameter (e.g. `GET;q=0.5`). The q-value
    // is meaningless for Allow, so we take everything before the first ';'.
    // We do NOT parse the q-value: if we did, callers might assume we
    // honoured it, which we do not.
    const noParams = part.split(';', 1)[0];
    const token = noParams.trim();

    if (token.length === 0) {
      continue;
    }

    const upper = token.toUpperCase();

    // Drop unrecognised methods rather than throwing. See JSDoc above.
    if (ALLOWED_METHODS.has(upper)) {
      result.add(upper);
    }
  }

  return result;
}
