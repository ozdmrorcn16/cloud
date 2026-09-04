/** Deutsch. Quellsprache ist Türkisch (`tr.ts`); Struktur ist identisch. */
export default {
  ortak: {
    devam: 'Weiter',
    iptal: 'Abbrechen',
    kaydet: 'Speichern',
    tekrarDene: 'Erneut versuchen',
    yukleniyor: 'Wird geladen…',
    birSorunOldu: 'Etwas ist schiefgelaufen.',
  },

  karsilama: {
    baslikBirinci: 'Ihr seid am selben Ort.',
    baslikIkinci: 'Wie wäre es mit Hallo?',
    aciklama:
      'Checke dort ein, wo du bist, und sieh, wer gerade auch da ist. Dein Standort wird nur geteilt, solange du eingecheckt bist.',
    onayEtiket: 'Ich akzeptiere die Bedingungen',
    onayMetni:
      'Ich habe die Datenschutzerklärung gelesen und stimme zu, dass meine personenbezogenen Daten und mein Standort wie dort beschrieben verarbeitet werden.',
    metniOku: 'Erklärung lesen',
    hesapOlustur: 'Konto erstellen',
    hesabinVarMi: 'Schon ein Konto?',
    girisYap: 'Anmelden',
    // Yol agi OpenStreetMap verisinden turetildi; ODbL atfi sart.
    haritaAtfi: 'Kartendaten © OpenStreetMap-Mitwirkende',
    kucukNot: 'Du musst mindestens 18 sein. Dein Standort wird nie dauerhaft geteilt.',
    hataOnay: 'Bitte akzeptiere die Bedingungen, um fortzufahren.',
  },

  kayit: {
    baslik: 'Konto erstellen',
    altYazi: 'Wir bestätigen deine Nummer. Sie erscheint nicht in deinem Profil.',
    telefonEtiket: 'Telefonnummer',
    telefonYerTutucu: '05XX XXX XX XX',
    dilEtiket: 'Sprache',
    yakinda: 'bald',
    sifreEtiket: 'Passwort',
    sifreYerTutucu: 'Mindestens {{adet}} Zeichen',
    tekrarEtiket: 'Passwort wiederholen',
    tekrarYerTutucu: 'Dasselbe Passwort noch einmal',
    sifrelerFarkli: 'Die Passwörter stimmen noch nicht überein.',
    onayEtiket: 'Ich akzeptiere die Bedingungen',
    onayMetni:
      'Ich habe die Datenschutzerklärung gelesen und stimme zu, dass meine personenbezogenen Daten und mein Standort wie dort beschrieben verarbeitet werden.',
    metniOku: 'Erklärung lesen',
    onayNotu:
      'Dein Standort wird nur genutzt, solange du eingecheckt bist, und nie dauerhaft geteilt. Du kannst diese Zustimmung in den Einstellungen widerrufen.',
    gonder: 'Konto erstellen',
    gonderiliyor: 'Wird gesendet…',
    zatenHesap: 'Schon ein Konto?',
    girisYap: 'Anmelden',
    hataTelefon: 'Gib eine gültige Telefonnummer ein.',
    hataSifreKisa: 'Das Passwort muss mindestens {{adet}} Zeichen haben.',
    hataSifreUyusmuyor: 'Die Passwörter stimmen nicht überein. Prüfe beide Felder.',
    hataOnay: 'Bitte akzeptiere die Bedingungen, um fortzufahren.',
  },

  kisiler: {
    baslik: 'Leute finden',
    yerTutucu: 'Benutzername oder Name',
    enAzIki: 'Gib mindestens 2 Zeichen ein.',
    bulunamadi: 'Niemanden gefunden.',
    ipucu: 'Suche jemanden, den du kennst, per Benutzername oder Name.',
  },

  giris: {
    telefonYerTutucu: 'Telefonnummer',
    sifreYerTutucu: 'Passwort',
    gonder: 'Anmelden',
    gonderiliyor: 'Wird angemeldet…',
    kayitOl: 'Neues Konto erstellen',
    hataTelefon: 'Gib eine gültige Telefonnummer ein.',
    hataBos: 'Gib deine Telefonnummer und dein Passwort ein.',
  },
} as const
