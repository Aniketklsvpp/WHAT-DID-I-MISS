export interface PiiItem {
  type: string;
  original: string;
  start: number;
  end: number;
}

export interface MaskResult {
  masked: string;
  items: PiiItem[];
  hasHighRisk: boolean;
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function maskPII(text: string): MaskResult {
  const items: PiiItem[] = [];
  let maskedText = text;
  let hasHighRisk = false;
  
  const replaceAndTrack = (regex: RegExp, type: string) => {
    let match;
    const currentRegex = new RegExp(regex.source, regex.flags + (regex.global ? '' : 'g'));
    while ((match = currentRegex.exec(text)) !== null) {
      if (!match[1]) continue;
      const original = match[1];
      const start = match.index + match[0].lastIndexOf(original);
      const end = start + original.length;
      
      if (type === 'CARD' && !luhnCheck(original)) continue;

      const overlap = items.some(i => (start < i.end && end > i.start));
      if (!overlap) {
        items.push({ type, original, start, end });
        if (type === 'CARD' || type === 'OTP') hasHighRisk = true;
      }
    }
  };

  // 1. Email
  replaceAndTrack(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, 'EMAIL');
  
  // 2. UPI (no dot after domain to separate from email)
  replaceAndTrack(/([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{3,64})(?!\.[a-zA-Z])/gi, 'UPI');

  // 3. Card (Must run before Aadhaar to avoid 12-digit subset matches)
  replaceAndTrack(/(?<!\d)(\d{4}[ -]?\d{4}[ -]?\d{4,5}[ -]?\d{1,6})(?!\d)/g, 'CARD');

  // 4. Aadhaar
  replaceAndTrack(/(?<!\d)(\d{4}[ -]?\d{4}[ -]?\d{4})(?!\d)/g, 'ID');

  // 5. PAN
  replaceAndTrack(/(?<![a-zA-Z])([A-Z]{5}\d{4}[A-Z])(?![a-zA-Z])/g, 'ID');

  // 6. Phone (Indian or intl)
  replaceAndTrack(/(?<!\d)((?:(?:\+|00)\d{1,3}[\s-]?)?[6-9](?:[\s-]?\d){9})(?!\d)/g, 'PHONE');

  // 7. OTP (allows "code is", "verification pin:", etc)
  replaceAndTrack(/(?:otp|code|verification|pin)\b[^0-9]{0,15}?([0-9]{4,8})(?!\d)/gi, 'OTP');
  replaceAndTrack(/(?<!\d)([0-9]{4,8})[^0-9]{0,15}?\b(?:otp|code|verification|pin)\b/gi, 'OTP');

  // 8. Account
  replaceAndTrack(/\b(?:a\/c|account|acc no|ifsc|acct)\b[^0-9]{0,10}?([0-9]{9,18})(?!\d)/gi, 'ACCOUNT');

  items.sort((a, b) => b.start - a.start);
  for (const item of items) {
    let replaceWith = `[${item.type}]`;
    if (item.type === 'PHONE' || item.type === 'CARD') {
      const last4 = item.original.replace(/\D/g, '').slice(-4);
      replaceWith = `[${item.type} ••••${last4}]`;
    }
    maskedText = maskedText.substring(0, item.start) + replaceWith + maskedText.substring(item.end);
  }

  return { masked: maskedText, items, hasHighRisk };
}
