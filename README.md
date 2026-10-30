# ts-http-allow-header-parse

Parses an HTTP `Allow` header into the set of permitted methods, validating each token against the IANA HTTP method registry.

```js
import { parseAllowHeader, isAllowedMethod, ALLOWED_METHODS } from 'ts-http-allow-header-parse';

const allowed = parseAllowHeader('GET, POST;q=0.5, PURGE');
// allowed is a Set<string> containing { 'GET', 'POST' } — 'PURGE' is dropped

isAllowedMethod('patch'); // true
```

The `Allow` header (RFC 9110 §10.2.1) is a comma list of method tokens, but real servers attach q-parameters they do not mean and occasionally advertise custom methods the standard does not know about. This library exists to turn that messy string into a clean `Set` of the nine registry methods (`GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `CONNECT`, `OPTIONS`, `TRACE`, `PATCH`) without choking.

Two deliberate decisions, because trying to honour both readings of each would break callers:

- Unknown methods are **dropped**, not rejected. A server advertising `PURGE` should not make the whole header unparseable; the caller can detect this by comparing the token count in the input to the set size returned.
- Q-values are **stripped**, not interpreted. They carry no meaning for `Allow`; parsing them would imply we sort by them, which we do not.

The awkward edge: if a server lists only non-standard methods, the result is an empty `Set`. Distinguish that from an empty or missing header — both also yield an empty `Set` — by checking the input string first if the distinction matters to you.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

