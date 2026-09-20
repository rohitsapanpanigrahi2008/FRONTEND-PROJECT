import DOMPurify from 'dompurify';

/**
 * Strip every tag/attribute from a string. Used on any server- or user-derived
 * text before it is placed into the DOM (defence in depth against stored XSS).
 * Note: DOMPurify removes <script>/<style> nodes *including* their content.
 */
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

const MAX_DEPTH = 8;

/** Internal signal that a payload exceeded the structural safety envelope. */
class PayloadDepthError extends Error {
  constructor() {
    super('payload exceeded maximum nesting depth');
  }
}

function sanitizeInner<T>(value: T, depth: number): T {
  if (depth > MAX_DEPTH) throw new PayloadDepthError();
  if (typeof value === 'string') return sanitizeText(value) as T;
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInner(item, depth + 1)) as T;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[sanitizeText(k)] = sanitizeInner(v, depth + 1);
  }
  return out as T;
}

/**
 * Recursively sanitize every string inside a JSON-like structure before it
 * reaches stores/components. Payloads nested deeper than MAX_DEPTH are
 * rejected outright (returns null) rather than partially trusted.
 */
export function sanitizeDeep<T>(value: T): T {
  try {
    return sanitizeInner(value, 0);
  } catch (error) {
    if (error instanceof PayloadDepthError) return null as T;
    throw error;
  }
}
