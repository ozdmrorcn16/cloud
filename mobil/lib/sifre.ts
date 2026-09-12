/**
 * Sifre kurallari - TEK YERDE.
 *
 * Hesap olusturma (`profil-olustur`) ve sifre sifirlama (`sifre-sifirla`)
 * ayni kurali uyguluyor. Iki ekranda iki ayri sabit olsaydi biri
 * degisince digeri geride kalir ve kisi hesabini acarken kabul edilen
 * sifreyi sifirlarken kabul ettiremezdi.
 */
export const EN_AZ_SIFRE = 8

/** Sifre en az uzunluk kuralini karsiliyor mu. */
export function sifreYeterliMi(sifre: string): boolean {
  return sifre.length >= EN_AZ_SIFRE
}
