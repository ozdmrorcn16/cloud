import { hataMetni } from './hata-metni'

describe('hataMetni', () => {
  it('veritabanindaki aksansiz metni duzgun Turkce ile degistirir', () => {
    expect(hataMetni({ message: 'Mekana cok uzaksin (~500 m icinde olmalisin)' })).toContain(
      'Mekana çok uzaksın'
    )
    expect(hataMetni({ message: 'Yetkisiz' })).toBe('Bu işlem için yetkin yok.')
  })

  it('degisken tasiyan mesajdaki sayiyi korur', () => {
    expect(
      hataMetni({ message: 'Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: 12 gun' })
    ).toBe('Kullanıcı adını 30 günde bir değiştirebilirsin. 12 gün kaldı.')
  })

  it('Supabase kodu varsa metinden once koda bakar', () => {
    expect(hataMetni({ code: 'otp_expired', message: 'anlamsiz' })).toContain('Kod geçersiz')
  })

  it('Ingilizce kimlik hatalarini cevirir', () => {
    expect(hataMetni({ message: 'Unable to get SMS provider' })).toContain(
      'kod gönderilemiyor'
    )
    expect(hataMetni({ message: 'Invalid login credentials' })).toContain('şifre hatalı')
  })

  it('taniamdigi INGILIZCE metni kullaniciya gostermez', () => {
    // Ham Ingilizce ekrana cikmamali; genel metin doner.
    expect(hataMetni({ message: 'Something went terribly wrong in the request' })).toBe(
      'Bir şeyler ters gitti. Biraz sonra tekrar dene.'
    )
  })

  it('tanimadigi TURKCE metni oldugu gibi gecirir', () => {
    // Bizim kendi mesajlarimizin bir kismi aksansiz; genel metinle
    // ezilmemeli.
    expect(hataMetni({ message: 'Konum izni verilmedi' })).toBe('Konum izni verilmedi')
    expect(hataMetni({ message: 'Sunucuya ulasilamadi' })).toBe('Sunucuya ulasilamadi')
  })

  it('metin yoksa genel metni doner', () => {
    expect(hataMetni(null)).toBe('Bir şeyler ters gitti. Biraz sonra tekrar dene.')
    expect(hataMetni(undefined)).toBe('Bir şeyler ters gitti. Biraz sonra tekrar dene.')
  })

  it('duz dizeyi de kabul eder', () => {
    expect(hataMetni('Profil bulunamadi')).toBe('Profil bulunamadı.')
  })
})
