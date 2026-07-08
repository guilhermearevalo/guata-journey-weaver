/**
 * Normaliza texto do CMS: corrige mojibake (UTF-8 lido como Latin-1) e
 * caracteres problemáticos colados do Word/PDF.
 */

/** Padrão típico: dÃºvidas, AceitaÃ§Ã£o, serviÃ§os */
function looksLikeMojibake(text: string): boolean {
  return /Ã[\u0080-\u00BF]|Ã§|Ã£|Ã©|Ãº|Ã³|Ãµ|Ãª|Ã´|Ã¡|Ã|Ã‰|â€/.test(text);
}

/** UTF-8 interpretado como Latin-1 → redecodifica para UTF-8 correto */
export function fixUtf8Mojibake(text: string): string {
  if (!text || !looksLikeMojibake(text)) return text;

  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (decoded && decoded !== text && !looksLikeMojibake(decoded)) {
      return decoded;
    }
    if (decoded && decoded.length < text.length) {
      return decoded;
    }
    return text;
  } catch {
    return text;
  }
}

export function normalizeCmsText(text: string | undefined | null): string {
  if (!text) return '';

  const repaired = fixUtf8Mojibake(text);

  return repaired
    .replace(/\u201C|\u201D|\u00AB|\u00BB/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}
