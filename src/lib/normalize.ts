export function normalizeText(text: string): string {
  let norm = text.toLowerCase();
  
  // Collapse 3+ repeated characters into a single one (e.g. jalllldi -> jaldi)
  norm = norm.replace(/(.)\1{2,}/g, '$1');

  // Handle specific spelling variants
  const replacements: Record<string, string> = {
    "jldi": "jaldi",
    "bhejdo": "bhej do",
    "kardo": "kar do",
    "karna h": "karna hai",
    "urgent h": "urgent hai"
  };

  for (const [key, val] of Object.entries(replacements)) {
    // Replace with word boundaries to avoid replacing inside other words
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    norm = norm.replace(regex, val);
  }

  return norm;
}
