const SENSITIVE_FIELDS = [
  'password',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'authorization',
];

export function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      sanitized[key] = maskValue(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function isSensitiveField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some((sensitive) =>
    lowerFieldName.includes(sensitive.toLowerCase()),
  );
}

function maskValue(value: any): string {
  if (!value) return '***';
  if (typeof value !== 'string') return '***';
  // Completely mask with asterisks matching the original length
  return '*'.repeat(10);
}
