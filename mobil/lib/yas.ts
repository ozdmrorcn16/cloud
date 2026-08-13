export function hesaplaYas(dogumTarihi: Date, bugun: Date = new Date()): number {
  let yas = bugun.getFullYear() - dogumTarihi.getFullYear()
  const dogumGunuGecti =
    bugun.getMonth() > dogumTarihi.getMonth() ||
    (bugun.getMonth() === dogumTarihi.getMonth() && bugun.getDate() >= dogumTarihi.getDate())
  if (!dogumGunuGecti) yas -= 1
  return yas
}

export function onSekizAltindaMi(dogumTarihi: Date, bugun: Date = new Date()): boolean {
  return hesaplaYas(dogumTarihi, bugun) < 18
}
