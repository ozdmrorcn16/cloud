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

/**
 * E.164 numarayi EKRANDA okunacak hale getirir:
 *   +905551234567  ->  0555 123 45 67
 *
 * Dogrulama ekraninda ham +90 bicimi gosteriliyordu; kullanici kendi
 * numarasini o bicimde tanimiyor.
 */
export function okunurBicim(eFormatli: string): string {
  const rakamlar = eFormatli.replace(/\D/g, '')
  const yerel = rakamlar.startsWith('90') ? rakamlar.slice(2) : rakamlar
  if (yerel.length !== 10) return eFormatli
  return `0${yerel.slice(0, 3)} ${yerel.slice(3, 6)} ${yerel.slice(6, 8)} ${yerel.slice(8)}`
}
