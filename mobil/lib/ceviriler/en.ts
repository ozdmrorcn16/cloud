/**
 * English strings.
 *
 * Turkish (`tr.ts`) is the source language; this file mirrors its key
 * structure. A missing key falls back to Turkish rather than showing
 * the raw key - a half-translated screen is better than one with
 * `kayit.baslik` printed on it.
 */
export default {
  ortak: {
    devam: 'Continue',
    iptal: 'Cancel',
    kaydet: 'Save',
    tekrarDene: 'Try again',
    yukleniyor: 'Loading…',
    birSorunOldu: 'Something went wrong.',
  },

  karsilama: {
    baslikBirinci: "You're in the same place.",
    baslikIkinci: 'Why not say hello?',
    aciklama:
      'Check in where you are and see who else is there right now. Your location is only shared while you are checked in.',
    dilEtiket: 'Language',
    onayEtiket: 'I accept the terms',
    onayMetni:
      'I have read the privacy notice and agree that my personal data and location may be processed as described there.',
    metniOku: 'Read the notice',
    hesapOlustur: 'Create account',
    hesabinVarMi: 'Already have an account?',
    girisYap: 'Sign in',
    // Yol agi OpenStreetMap verisinden turetildi; ODbL atfi sart.
    haritaAtfi: 'Map data © OpenStreetMap contributors',
    kucukNot: 'You must be 18 or older. Your location is never shared continuously.',
    hataOnay: 'You need to accept the terms to continue.',
  },

  kayit: {
    baslik: 'Create your account',
    altYazi: "We'll verify your number. It stays off your profile.",
    telefonEtiket: 'Phone number',
    telefonYerTutucu: '05XX XXX XX XX',
    dilEtiket: 'App language',
    yakinda: 'soon',
    sifreEtiket: 'Password',
    sifreYerTutucu: 'At least {{adet}} characters',
    tekrarEtiket: 'Repeat password',
    tekrarYerTutucu: 'Type the same password again',
    sifrelerFarkli: "Passwords don't match yet.",
    onayEtiket: 'I accept the terms',
    onayMetni:
      'I have read the privacy notice and agree that my personal data and location may be processed as described there.',
    metniOku: 'Read the notice',
    onayNotu:
      'Your location is used only while you are checked in and is never shared continuously. You can withdraw this consent in settings.',
    gonder: 'Create account',
    gonderiliyor: 'Sending…',
    zatenHesap: 'Already have an account?',
    girisYap: 'Sign in',
    hataTelefon: 'Enter a valid phone number.',
    hataSifreKisa: 'Password must be at least {{adet}} characters.',
    hataSifreUyusmuyor: "Passwords don't match. Check both fields.",
    hataOnay: 'You need to accept the terms to continue.',
  },

  kisiler: {
    baslik: 'Find people',
    yerTutucu: 'Username or name',
    enAzIki: 'Type at least 2 characters.',
    bulunamadi: 'No one found.',
    ipucu: 'Search for someone you know by username or name.',
  },

  giris: {
    telefonYerTutucu: 'Phone number',
    sifreYerTutucu: 'Password',
    gonder: 'Log in',
    gonderiliyor: 'Logging in…',
    kayitOl: 'Create new account',
    hataTelefon: 'Enter a valid phone number.',
    hataBos: 'Enter your phone number and password.',
  },
} as const
