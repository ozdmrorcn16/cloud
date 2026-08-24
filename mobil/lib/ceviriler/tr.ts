/**
 * Turkce metinler - KAYNAK DIL.
 *
 * Yeni bir metin once buraya yazilir, sonra `en.ts` icine cevrilir.
 * Anahtarlar ekran adiyla gruplanir; boylece bir ekran uzerinde
 * calisirken ilgili metinler bir arada durur.
 *
 * Kural (karar 74): kullaniciya gorunen her metin duzgun, aksanli
 * Turkce yazilir. ASCII kurali yalnizca kod, yorum ve commit
 * metinleri icindir.
 */
export default {
  ortak: {
    devam: 'Devam et',
    iptal: 'İptal',
    kaydet: 'Kaydet',
    tekrarDene: 'Tekrar dene',
    yukleniyor: 'Yükleniyor…',
    birSorunOldu: 'Bir sorun oluştu.',
  },

  karsilama: {
    baslikBirinci: 'Aynı yerdesiniz.',
    baslikIkinci: 'Tanışmaya ne dersin?',
    aciklama:
      'Bulunduğun yere check-in yap, tam o anda orada olan başka insanları gör. Konum paylaşımı check-in yaptığın süreyle sınırlı.',
    hesapOlustur: 'Hesap oluştur',
    hesabinVarMi: 'Hesabın var mı?',
    girisYap: 'Giriş yap',
    kucukNot: '18 yaşından büyük olman gerekiyor. Konumun kimseyle sürekli paylaşılmaz.',
  },

  kayit: {
    baslik: 'Hesabını oluştur',
    altYazi: 'Numaranı doğrulayacağız. Numaran profilinde görünmez.',
    telefonEtiket: 'Telefon numarası',
    telefonYerTutucu: '05XX XXX XX XX',
    dilEtiket: 'Uygulama dili',
    yakinda: 'yakında',
    sifreEtiket: 'Şifre',
    sifreYerTutucu: 'En az {{adet}} karakter',
    tekrarEtiket: 'Şifreyi tekrar gir',
    tekrarYerTutucu: 'Aynı şifreyi bir kez daha',
    sifrelerFarkli: 'Şifreler henüz aynı değil.',
    onayEtiket: 'Koşulları kabul ediyorum',
    onayMetni:
      'Gizlilik metnini okudum; kişisel verilerimin ve konum bilgimin orada anlatıldığı şekilde işlenmesini kabul ediyorum.',
    metniOku: 'Metni oku',
    onayNotu:
      'Konumun yalnızca check-in yaptığın süre boyunca kullanılır ve kimseyle sürekli paylaşılmaz. Bu onayı ayarlardan geri çekebilirsin.',
    gonder: 'Hesap oluştur',
    gonderiliyor: 'Gönderiliyor…',
    zatenHesap: 'Zaten hesabın var mı?',
    girisYap: 'Giriş yap',
    hataTelefon: 'Geçerli bir telefon numarası gir.',
    hataSifreKisa: 'Şifre en az {{adet}} karakter olmalı.',
    hataSifreUyusmuyor: 'Şifreler aynı değil. İkisini de kontrol et.',
    hataOnay: 'Devam etmek için koşulları kabul etmen gerekiyor.',
  },

  giris: {
    baslik: 'Tekrar hoş geldin',
    altYazi: 'Çevrende neler olduğunu görmek için giriş yap.',
    sifreYerTutucu: 'Şifre',
    gonder: 'Giriş yap',
    gonderiliyor: 'Giriş yapılıyor…',
    hesabinYokMu: 'Hesabın yok mu?',
    kayitOl: 'Kayıt ol',
    hataTelefon: 'Geçerli bir telefon numarası gir',
  },
} as const
