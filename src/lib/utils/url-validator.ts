const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
  /^::1$/,
  /^localhost$/i,
];

export function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
  } catch {
    return true;
  }
}

export function isValidRssUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    if (isPrivateUrl(url)) {
      return { valid: false, error: 'Private/internal URLs are not allowed' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
