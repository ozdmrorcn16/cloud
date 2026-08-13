export function eFormatinaCevir(girilenNumara: string): string | null {
  const temiz = girilenNumara.replace(/[\s-]/g, '')

  if (temiz.startsWith('+90') && temiz.length === 13) {
    return temiz
  }
  if (temiz.startsWith('0') && temiz.length === 11) {
    return `+90${temiz.slice(1)}`
  }
  if (!temiz.startsWith('0') && !temiz.startsWith('+') && temiz.length === 10) {
    return `+90${temiz}`
  }
  return null
}
