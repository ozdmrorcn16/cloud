/**
 * E-posta adresi yardimcilari.
 *
 * Kayit ve giris artik telefon yerine E-POSTA ile yapiliyor
 * (kullanicinin karari 2026-09-01). Sebep tamamen pratikti: Turkiye'de
 * A2P SMS gondermek icin operatorler vergi mukellefiyeti ve KEP
 * uzerinden belge istiyor, kullanicinin sirketi yok. E-posta ucretsiz
 * ve sirket gerektirmiyor. Telefon alani `auth.users` icinde duruyor;
 * ileride SMS'e donmek bir ayar degisikligi.
 */

/**
 * Bicim kontrolu - KASITLI OLARAK DAR.
 *
 * RFC 5322'nin tamamini dogrulamaya calismiyoruz; o desen hem devasa
 * hem de pratikte yanlis pozitif uretiyor. Buradaki kural "gunluk
 * hayatta yazilan adres" olcusunde: bosluk yok, tek @, alan adinda en
 * az bir nokta ve sondaki uzanti en az iki harf.
 *
 * ASCII'ye kapali tutuluyor: uluslararasilastirilmis adresler (IDN)
 * Supabase tarafinda da sorunlu ve kullanicinin yanlislikla yazdigi
 * Turkce harf (ornegin "İsim@") sessizce gecerse dogrulama postasi hic
 * ulasmaz. Reddetmek, sessizce kaybolmaktan iyi.
 */
const DESEN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function epostaGecerliMi(deger: string): boolean {
  return DESEN.test(deger.trim())
}

/**
 * Supabase adresi kucuk harfe cevirip oyle sakliyor. Istemci de ayni
 * seyi yapmazsa "Ornek@eposta.com" ile "ornek@eposta.com" farkli
 * gorunur ve "bu adres kayitli mi" kontrolu yanlis cevap verir.
 */
export function epostaNormallestir(deger: string): string {
  return deger.trim().toLowerCase()
}
