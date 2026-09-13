/**
 * Sitenin YEDI DILDEKI kabuk ve sayfa metinleri (2026-09-13).
 *
 * Gizlilik ve kullanim kosullari BURADA DEGIL: onlar uygulamayla ortak
 * kaynaktan, `mobil/lib/hukuki/<dil>.ts` dosyalarindan geliyor (tek
 * kaynak, iki yuzey). Burada yalnizca kabuk (alt serit, dil secici,
 * kunye), ana sayfa, destek ve hesap silme sayfalari var.
 *
 * Kural: bir dil ancak BUTUN anahtarlari dolu oldugunda `diller.ts`
 * listesine girer; `araclar/dogrula.mjs` her dilin her sayfasinin
 * 200 dondugunu olcuyor.
 */
import type { Dil } from './diller'

export type Sss = { soru: string; cevap: string }

export type SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: string
    altSeritKosullar: string
    altSeritDestek: string
    altSeritHesapSil: string
    altSeritIletisim: string
    dilSeciciEtiket: string
    kunye: string
    sonGuncelleme: string
    /** Turkce disindaki hukuki sayfalarin basindaki not. */
    ustunlukNotu: string
    anaSayfaEtiketi: string
  }
  ana: {
    aciklama: string
    yakinda: string
    appStore: string
    googlePlay: string
    slogan1: string
    slogan2: string
    altMekan: string
    altKesfet: string
  }
  gizlilik: { baslik: string; aciklama: string }
  kosullar: { baslik: string; aciklama: string }
  destek: {
    baslik: string
    aciklama: string
    /** `{{eposta}}` yer tutucusu baglantiyla degistirilir. */
    giris: string
    sssBaslik: string
    /** `{{hesapSil}}` yer tutucusu hesap silme sayfasi baglantisi olur. */
    sss: Sss[]
    /** `{{hesapSil}}` baglantisinin metni (cumleye uyan hal). */
    hesapSilBaglanti: string
  }
  hesapSil: {
    baslik: string
    aciklama: string
    giris: string
    neSilinirBaslik: string
    silinenler: string[]
    neKalirBaslik: string
    neKalir: string
    uyari: string
    silBaslik: string
    silAciklama: string
    epostaEtiket: string
    kodEtiket: string
    kodGonder: string
    dugme: string
    /** `{{eposta}}` yer tutucusu. */
    dipnot: string
    /** Hesap silme betiginin durum metinleri (onay kodu akisi). */
    betik: {
      eksik: string
      kodEksik: string
      kontrol: string
      kodGonderildi: string
      hesapYok: string
      kodHatasi: string
      cokDeneme: string
      gonderilemedi: string
      siliniyor: string
      silinemedi: string
      silindi: string
      beklenmeyen: string
    }
  }
}

const tr: SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: 'Gizlilik',
    altSeritKosullar: 'Kullanım koşulları',
    altSeritDestek: 'Destek',
    altSeritHesapSil: 'Hesap silme',
    altSeritIletisim: 'İletişim',
    dilSeciciEtiket: 'Dil seç',
    kunye: 'Mekan verisi Foursquare ve OpenStreetMap katkıcılarından (ODbL).',
    sonGuncelleme: 'Son güncelleme',
    ustunlukNotu: 'Bu belgenin bağlayıcı metni Türkçedir; çeviri bilgilendirme amaçlıdır.',
    anaSayfaEtiketi: 'Slooin ana sayfa',
  },
  ana: {
    aciklama:
      'Slooin, aynı anda aynı yerde olan insanların birbirini fark etmesini sağlayan konum tabanlı bir tanışma uygulamasıdır.',
    yakinda: 'Yakında',
    appStore: "App Store'da",
    googlePlay: "Google Play'de",
    slogan1: 'Aynı yerdesiniz.',
    slogan2: 'Birbirinizi fark edin.',
    altMekan: 'Slooin mekan sayfası',
    altKesfet: 'Slooin check-in ekranı',
  },
  gizlilik: {
    baslik: 'Gizlilik Politikası',
    aciklama:
      "Slooin'in hangi kişisel verileri, hangi amaçla işlediğini ve ne kadar süreyle sakladığını anlatan gizlilik politikası.",
  },
  kosullar: {
    baslik: 'Kullanım Koşulları',
    aciklama:
      "Slooin'i kullanırken geçerli olan kurallar: yaş sınırı, hesap kuralları, yasak davranışlar ve sorumluluk sınırları.",
  },
  destek: {
    baslik: 'Destek',
    aciklama: 'Slooin hakkında sık sorulan sorular ve destek iletişimi.',
    giris:
      'Sorun, sorusun ya da bildirmek istediğin bir hata varsa {{eposta}} adresine yaz. Mesajlar en geç üç iş günü içinde yanıtlanır.',
    sssBaslik: 'Sık sorulan sorular',
    sss: [
      {
        soru: 'Konumum sürekli paylaşılıyor mu?',
        cevap:
          'Hayır. Konumun yalnızca sen check-in yaptığında ve seçtiğin görünürlük kademesine göre paylaşılır. Check-in\'in süresi dolduğunda konum bilgisi silinir; geriye yalnızca "şurada oldum" kaydı kalır.',
      },
      {
        soru: 'Beni kimler görebilir?',
        cevap:
          "Her check-in'de üç seçenekten birini seçersin: herkese açık (aynı mekandakiler ve arkadaşların), sadece arkadaşlarım, ya da gizli (kimse görmez).",
      },
      {
        soru: 'Birinden rahatsız oldum, ne yapabilirim?',
        cevap:
          'Kişiyi profilinden engelleyebilirsin. Engelleme çift taraflıdır ve aranızdaki konuşmayı siler; engellenen kişi bunu bir hata mesajı olarak görmez. Ayrıca kişiyi ya da tek bir mesajı şikâyet edebilirsin.',
      },
      {
        soru: 'Hesabımı nasıl silerim?',
        cevap:
          'Uygulama içinde Ayarlar › Hesabımı sil adımından, ya da uygulamayı silmiş olsan bile {{hesapSil}} silebilirsin.',
      },
      {
        soru: 'Uygulama neden benim şehrimde az mekan gösteriyor?',
        cevap:
          'Mekan verisi Foursquare ve OpenStreetMap katkıcılarından geliyor. Bir mekan eksikse uygulama içinden kendin ekleyebilirsin.',
      },
    ],
    hesapSilBaglanti: 'hesap silme sayfasından',
  },
  hesapSil: {
    baslik: 'Hesabını sil',
    aciklama: 'Slooin hesabını ve hesabına bağlı verileri kalıcı olarak silme.',
    giris:
      'Hesabını uygulama içinden Ayarlar › Hesabımı sil adımından silebilirsin. Uygulamayı telefonundan kaldırdıysan bu sayfadan da silebilirsin — uygulamayı yeniden kurman gerekmez.',
    neSilinirBaslik: 'Ne silinir?',
    silinenler: [
      'Hesabın ve profilin (adın, kullanıcı adın, biyografin, doğum tarihin)',
      'Profil fotoğrafın ve check-in fotoğrafların',
      "Bütün check-in'lerin ve anıların",
      'Arkadaşlıkların, istekler, engellemeler ve bildirim kayıtların',
    ],
    neKalirBaslik: 'Ne kalır?',
    neKalir:
      'Başkalarına gönderdiğin mesajlar ve gönderdiğin şikâyetler silinmez, anonimleşir — gönderen bilgisi kaldırılır. Mesajları silmek karşı tarafın konuşma geçmişini de silmek anlamına geleceği için bu tercih edildi.',
    uyari:
      'Silme işlemi geri alınamaz. Aynı e-posta ile yeniden kayıt olabilirsin ama eski verilerin geri gelmez. Hesabını geçici olarak kapatmak istiyorsan, uygulama içindeki hesabı dondurma seçeneğini kullan — tekrar giriş yaptığında hesabın kendiliğinden açılır.',
    silBaslik: 'Sil',
    silAciklama: "Güvenlik için e-postana 6 haneli bir onay kodu göndereceğiz; kodu giren kişi hesabı silebilir. Kod sunucuda doğrulanır; bu sayfanın hesabın üzerinde hiçbir yetkisi yoktur.",
    epostaEtiket: "E-posta",
    kodEtiket: "Onay kodu",
    kodGonder: "Onay kodu gönder",
    dugme: "Hesabımı kalıcı olarak sil",
    dipnot: "Hesabını Apple ile açtıysan ve \"e-postamı gizle\"yi seçtiysen kod, Apple'ın sana verdiği gizli adrese gider ve oradan Apple kimliğindeki asıl adresine iletilir. Sorun yaşarsan hesabını uygulama içinden (Ayarlar › Hesabımı sil, Apple ile onayla) silebilirsin ya da {{eposta}} adresine yaz.",
    betik: {
      eksik: "E-posta adresini gir.",
      kodEksik: "6 haneli kodun tamamını gir.",
      kontrol: "Onay kodu gönderiliyor…",
      kodGonderildi: "Onay kodu e-postana gönderildi. Kod 10 dakika geçerli.",
      hesapYok: "Bu adresle açılmış bir hesap bulunamadı.",
      kodHatasi: "Kod yanlış ya da süresi dolmuş. Kodu tekrar gönderip yeniden dene.",
      cokDeneme: "Çok fazla deneme yapıldığı için bu girişim engellendi. Birkaç dakika bekleyip tekrar dene.",
      gonderilemedi: "Kod şu anda gönderilemedi. Birkaç dakika sonra tekrar dene; sorun sürerse destek@slooin.com adresine yaz.",
      siliniyor: "Hesabın siliniyor…",
      silinemedi: "Hesap silinemedi. Biraz sonra tekrar dene; sorun sürerse destek@slooin.com adresine yaz.",
      silindi: "Hesabın silindi. Bu işlem geri alınamaz. Uygulama hâlâ telefonundaysa onu da kaldırabilirsin.",
      beklenmeyen: "Beklenmeyen bir yanıt alındı. destek@slooin.com adresine yaz.",
    },
  },
}

const en: SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: 'Privacy',
    altSeritKosullar: 'Terms of use',
    altSeritDestek: 'Support',
    altSeritHesapSil: 'Delete account',
    altSeritIletisim: 'Contact',
    dilSeciciEtiket: 'Choose language',
    kunye: 'Place data from Foursquare and OpenStreetMap contributors (ODbL).',
    sonGuncelleme: 'Last updated',
    ustunlukNotu: 'The binding text of this document is the Turkish version; this translation is for information only.',
    anaSayfaEtiketi: 'Slooin home',
  },
  ana: {
    aciklama:
      'Slooin is a location-based social app that lets people who are in the same place at the same time notice each other.',
    yakinda: 'Coming soon',
    appStore: 'on the App Store',
    googlePlay: 'on Google Play',
    slogan1: 'Same place.',
    slogan2: 'Notice each other.',
    altMekan: 'Slooin place page',
    altKesfet: 'Slooin check-in screen',
  },
  gizlilik: {
    baslik: 'Privacy Policy',
    aciklama: 'Which personal data Slooin processes, for what purpose, and how long it is kept.',
  },
  kosullar: {
    baslik: 'Terms of Use',
    aciklama: 'The rules that apply when using Slooin: age limit, account rules, prohibited behaviour and limitation of liability.',
  },
  destek: {
    baslik: 'Support',
    aciklama: 'Frequently asked questions about Slooin and how to reach support.',
    giris: 'If you have a problem, a question or a bug to report, write to {{eposta}}. Messages are answered within three business days at the latest.',
    sssBaslik: 'Frequently asked questions',
    sss: [
      {
        soru: 'Is my location shared all the time?',
        cevap: 'No. Your location is shared only when you check in, and according to the visibility level you choose. When the check-in expires the location is deleted; only a "I was here" record remains.',
      },
      {
        soru: 'Who can see me?',
        cevap: 'For every check-in you pick one of three options: public (people at the same place and your friends), friends only, or hidden (nobody sees it).',
      },
      {
        soru: 'Someone is bothering me, what can I do?',
        cevap: 'You can block the person from their profile. Blocking is two-way and deletes the conversation between you; the blocked person does not see this as an error message. You can also report the person or a single message.',
      },
      {
        soru: 'How do I delete my account?',
        cevap: 'In the app via Settings › Delete my account, or, even if you have uninstalled the app, from the {{hesapSil}}.',
      },
      {
        soru: 'Why does the app show few places in my city?',
        cevap: 'Place data comes from Foursquare and OpenStreetMap contributors. If a place is missing you can add it yourself inside the app.',
      },
    ],
    hesapSilBaglanti: 'account deletion page',
  },
  hesapSil: {
    baslik: 'Delete your account',
    aciklama: 'Permanently delete your Slooin account and the data attached to it.',
    giris: 'You can delete your account inside the app via Settings › Delete my account. If you have removed the app from your phone you can also delete it from this page — you do not need to reinstall the app.',
    neSilinirBaslik: 'What is deleted?',
    silinenler: [
      'Your account and profile (name, username, bio, date of birth)',
      'Your profile photo and check-in photos',
      'All your check-ins and memories',
      'Your friendships, requests, blocks and notification records',
    ],
    neKalirBaslik: 'What remains?',
    neKalir: 'Messages you sent to others and reports you filed are not deleted but anonymised — the sender information is removed. Deleting the messages would also delete the other person\'s conversation history, which is why this was chosen.',
    uyari: 'Deletion cannot be undone. You can sign up again with the same e-mail, but your old data will not come back. If you want to close your account temporarily, use the freeze account option inside the app — it reactivates by itself when you sign in again.',
    silBaslik: 'Delete',
    silAciklama: "For security we will send a 6-digit confirmation code to your e-mail; whoever enters the code can delete the account. The code is verified on the server; this page has no authority over your account.",
    epostaEtiket: "E-mail",
    kodEtiket: "Confirmation code",
    kodGonder: "Send confirmation code",
    dugme: "Delete my account permanently",
    dipnot: "If you created your account with Apple and chose \"Hide my email\", the code goes to the private address Apple gave you and is forwarded to the real address on your Apple ID. If anything goes wrong, delete your account inside the app (Settings › Delete my account, confirm with Apple) or write to {{eposta}}.",
    betik: {
      eksik: "Enter your e-mail address.",
      kodEksik: "Enter the full 6-digit code.",
      kontrol: "Sending the confirmation code…",
      kodGonderildi: "The confirmation code was sent to your e-mail. It is valid for 10 minutes.",
      hesapYok: "No account was found with this address.",
      kodHatasi: "The code is wrong or has expired. Send the code again and retry.",
      cokDeneme: "This attempt was blocked because of too many tries. Wait a few minutes and try again.",
      gonderilemedi: "The code could not be sent right now. Try again in a few minutes; if the problem persists write to destek@slooin.com.",
      siliniyor: "Deleting your account…",
      silinemedi: "The account could not be deleted. Try again later; if the problem persists write to destek@slooin.com.",
      silindi: "Your account has been deleted. This cannot be undone. If the app is still on your phone you can remove it too.",
      beklenmeyen: "An unexpected response was received. Write to destek@slooin.com.",
    },
  },
}

const de: SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: 'Datenschutz',
    altSeritKosullar: 'Nutzungsbedingungen',
    altSeritDestek: 'Support',
    altSeritHesapSil: 'Konto löschen',
    altSeritIletisim: 'Kontakt',
    dilSeciciEtiket: 'Sprache wählen',
    kunye: 'Ortsdaten von Foursquare und OpenStreetMap-Mitwirkenden (ODbL).',
    sonGuncelleme: 'Zuletzt aktualisiert',
    ustunlukNotu: 'Verbindlich ist die türkische Fassung dieses Dokuments; diese Übersetzung dient nur der Information.',
    anaSayfaEtiketi: 'Slooin Startseite',
  },
  ana: {
    aciklama: 'Slooin ist eine standortbasierte Social-App, mit der sich Menschen, die zur selben Zeit am selben Ort sind, gegenseitig bemerken.',
    yakinda: 'Demnächst',
    appStore: 'im App Store',
    googlePlay: 'bei Google Play',
    slogan1: 'Derselbe Ort.',
    slogan2: 'Bemerkt einander.',
    altMekan: 'Slooin Ortsseite',
    altKesfet: 'Slooin Check-in-Bildschirm',
  },
  gizlilik: {
    baslik: 'Datenschutzerklärung',
    aciklama: 'Welche personenbezogenen Daten Slooin zu welchem Zweck verarbeitet und wie lange sie aufbewahrt werden.',
  },
  kosullar: {
    baslik: 'Nutzungsbedingungen',
    aciklama: 'Die Regeln für die Nutzung von Slooin: Altersgrenze, Kontoregeln, verbotenes Verhalten und Haftungsbeschränkung.',
  },
  destek: {
    baslik: 'Support',
    aciklama: 'Häufig gestellte Fragen zu Slooin und Kontakt zum Support.',
    giris: 'Bei Problemen, Fragen oder einem Fehler, den du melden möchtest, schreib an {{eposta}}. Nachrichten werden spätestens innerhalb von drei Werktagen beantwortet.',
    sssBaslik: 'Häufig gestellte Fragen',
    sss: [
      { soru: 'Wird mein Standort ständig geteilt?', cevap: 'Nein. Dein Standort wird nur geteilt, wenn du eincheckst, und nur gemäß der von dir gewählten Sichtbarkeitsstufe. Läuft der Check-in ab, wird der Standort gelöscht; es bleibt nur ein „Ich war hier“-Eintrag.' },
      { soru: 'Wer kann mich sehen?', cevap: 'Bei jedem Check-in wählst du eine von drei Optionen: öffentlich (Personen am selben Ort und deine Freunde), nur Freunde oder verborgen (niemand sieht es).' },
      { soru: 'Jemand belästigt mich, was kann ich tun?', cevap: 'Du kannst die Person über ihr Profil blockieren. Die Blockierung gilt beidseitig und löscht die Unterhaltung zwischen euch; die blockierte Person sieht das nicht als Fehlermeldung. Außerdem kannst du die Person oder eine einzelne Nachricht melden.' },
      { soru: 'Wie lösche ich mein Konto?', cevap: 'In der App über Einstellungen › Mein Konto löschen oder, auch wenn du die App schon deinstalliert hast, über die {{hesapSil}}.' },
      { soru: 'Warum zeigt die App in meiner Stadt wenige Orte?', cevap: 'Die Ortsdaten stammen von Foursquare und OpenStreetMap-Mitwirkenden. Fehlt ein Ort, kannst du ihn in der App selbst hinzufügen.' },
    ],
    hesapSilBaglanti: 'Seite zur Kontolöschung',
  },
  hesapSil: {
    baslik: 'Konto löschen',
    aciklama: 'Dein Slooin-Konto und die damit verbundenen Daten dauerhaft löschen.',
    giris: 'Du kannst dein Konto in der App über Einstellungen › Mein Konto löschen löschen. Hast du die App vom Telefon entfernt, kannst du es auch über diese Seite tun — du musst die App nicht neu installieren.',
    neSilinirBaslik: 'Was wird gelöscht?',
    silinenler: [
      'Dein Konto und Profil (Name, Benutzername, Bio, Geburtsdatum)',
      'Dein Profilfoto und deine Check-in-Fotos',
      'Alle deine Check-ins und Erinnerungen',
      'Deine Freundschaften, Anfragen, Blockierungen und Benachrichtigungseinträge',
    ],
    neKalirBaslik: 'Was bleibt?',
    neKalir: 'Nachrichten, die du anderen gesendet hast, und Meldungen, die du erstattet hast, werden nicht gelöscht, sondern anonymisiert — die Absenderangabe wird entfernt. Die Nachrichten zu löschen hieße auch, den Gesprächsverlauf der anderen Person zu löschen; deshalb wurde so entschieden.',
    uyari: 'Die Löschung kann nicht rückgängig gemacht werden. Du kannst dich mit derselben E-Mail erneut registrieren, aber deine alten Daten kommen nicht zurück. Wenn du dein Konto nur vorübergehend schließen willst, nutze die Option „Konto einfrieren“ in der App — beim nächsten Anmelden wird es von selbst wieder aktiv.',
    silBaslik: 'Löschen',
    silAciklama: "Aus Sicherheitsgründen senden wir einen 6-stelligen Bestätigungscode an deine E-Mail; wer den Code eingibt, kann das Konto löschen. Der Code wird auf dem Server geprüft; diese Seite hat keinerlei Befugnis über dein Konto.",
    epostaEtiket: "E-Mail",
    kodEtiket: "Bestätigungscode",
    kodGonder: "Bestätigungscode senden",
    dugme: "Mein Konto dauerhaft löschen",
    dipnot: "Wenn du dein Konto mit Apple erstellt und „E-Mail verbergen“ gewählt hast, geht der Code an die von Apple vergebene Weiterleitungsadresse und wird an die echte Adresse deiner Apple-ID weitergeleitet. Bei Problemen lösche dein Konto in der App (Einstellungen › Mein Konto löschen, mit Apple bestätigen) oder schreib an {{eposta}}.",
    betik: {
      eksik: "Gib deine E-Mail-Adresse ein.",
      kodEksik: "Gib den vollständigen 6-stelligen Code ein.",
      kontrol: "Bestätigungscode wird gesendet…",
      kodGonderildi: "Der Bestätigungscode wurde an deine E-Mail gesendet. Er ist 10 Minuten gültig.",
      hesapYok: "Zu dieser Adresse wurde kein Konto gefunden.",
      kodHatasi: "Der Code ist falsch oder abgelaufen. Sende den Code erneut und versuche es noch einmal.",
      cokDeneme: "Dieser Versuch wurde wegen zu vieler Versuche blockiert. Warte ein paar Minuten und versuche es erneut.",
      gonderilemedi: "Der Code konnte gerade nicht gesendet werden. Versuche es in ein paar Minuten erneut; besteht das Problem weiter, schreib an destek@slooin.com.",
      siliniyor: "Dein Konto wird gelöscht…",
      silinemedi: "Das Konto konnte nicht gelöscht werden. Versuche es später erneut; besteht das Problem weiter, schreib an destek@slooin.com.",
      silindi: "Dein Konto wurde gelöscht. Das kann nicht rückgängig gemacht werden. Falls die App noch auf deinem Telefon ist, kannst du sie ebenfalls entfernen.",
      beklenmeyen: "Eine unerwartete Antwort wurde empfangen. Schreib an destek@slooin.com.",
    },
  },
}

const es: SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: 'Privacidad',
    altSeritKosullar: 'Condiciones de uso',
    altSeritDestek: 'Soporte',
    altSeritHesapSil: 'Eliminar cuenta',
    altSeritIletisim: 'Contacto',
    dilSeciciEtiket: 'Elegir idioma',
    kunye: 'Datos de lugares de Foursquare y de los colaboradores de OpenStreetMap (ODbL).',
    sonGuncelleme: 'Última actualización',
    ustunlukNotu: 'El texto vinculante de este documento es la versión en turco; esta traducción es solo informativa.',
    anaSayfaEtiketi: 'Inicio de Slooin',
  },
  ana: {
    aciklama: 'Slooin es una app social basada en la ubicación que permite que las personas que están en el mismo lugar al mismo tiempo se noten entre sí.',
    yakinda: 'Próximamente',
    appStore: 'en App Store',
    googlePlay: 'en Google Play',
    slogan1: 'Estáis en el mismo sitio.',
    slogan2: 'Notaos.',
    altMekan: 'Página de lugar de Slooin',
    altKesfet: 'Pantalla de check-in de Slooin',
  },
  gizlilik: {
    baslik: 'Política de Privacidad',
    aciklama: 'Qué datos personales trata Slooin, con qué finalidad y cuánto tiempo los conserva.',
  },
  kosullar: {
    baslik: 'Condiciones de Uso',
    aciklama: 'Las reglas que se aplican al usar Slooin: límite de edad, reglas de cuenta, conductas prohibidas y limitación de responsabilidad.',
  },
  destek: {
    baslik: 'Soporte',
    aciklama: 'Preguntas frecuentes sobre Slooin y contacto de soporte.',
    giris: 'Si tienes un problema, una pregunta o un error que notificar, escribe a {{eposta}}. Los mensajes se responden en un plazo máximo de tres días laborables.',
    sssBaslik: 'Preguntas frecuentes',
    sss: [
      { soru: '¿Mi ubicación se comparte todo el tiempo?', cevap: 'No. Tu ubicación solo se comparte cuando haces check-in y según el nivel de visibilidad que elijas. Cuando el check-in caduca, la ubicación se borra; solo queda un registro de "estuve aquí".' },
      { soru: '¿Quién puede verme?', cevap: 'En cada check-in eliges una de tres opciones: público (quienes están en el mismo lugar y tus amigos), solo amigos u oculto (nadie lo ve).' },
      { soru: 'Alguien me molesta, ¿qué puedo hacer?', cevap: 'Puedes bloquear a la persona desde su perfil. El bloqueo es bidireccional y borra la conversación entre vosotros; la persona bloqueada no lo ve como un mensaje de error. También puedes denunciar a la persona o un mensaje concreto.' },
      { soru: '¿Cómo elimino mi cuenta?', cevap: 'En la app, desde Ajustes › Eliminar mi cuenta, o, aunque hayas desinstalado la app, desde la {{hesapSil}}.' },
      { soru: '¿Por qué la app muestra pocos lugares en mi ciudad?', cevap: 'Los datos de lugares proceden de Foursquare y de los colaboradores de OpenStreetMap. Si falta un lugar, puedes añadirlo tú mismo desde la app.' },
    ],
    hesapSilBaglanti: 'página de eliminación de cuenta',
  },
  hesapSil: {
    baslik: 'Eliminar tu cuenta',
    aciklama: 'Eliminar de forma permanente tu cuenta de Slooin y los datos asociados a ella.',
    giris: 'Puedes eliminar tu cuenta desde la app en Ajustes › Eliminar mi cuenta. Si has quitado la app del teléfono, también puedes hacerlo desde esta página: no necesitas reinstalarla.',
    neSilinirBaslik: '¿Qué se elimina?',
    silinenler: [
      'Tu cuenta y tu perfil (nombre, nombre de usuario, biografía, fecha de nacimiento)',
      'Tu foto de perfil y tus fotos de check-in',
      'Todos tus check-ins y recuerdos',
      'Tus amistades, solicitudes, bloqueos y registros de notificaciones',
    ],
    neKalirBaslik: '¿Qué permanece?',
    neKalir: 'Los mensajes que enviaste a otras personas y las denuncias que presentaste no se eliminan, se anonimizan: se quita la información del remitente. Eliminar los mensajes supondría borrar también el historial de conversación de la otra persona; por eso se optó por esto.',
    uyari: 'La eliminación no se puede deshacer. Puedes registrarte de nuevo con el mismo correo, pero tus datos antiguos no volverán. Si quieres cerrar tu cuenta temporalmente, usa la opción de congelar la cuenta dentro de la app: se reactiva sola cuando vuelves a iniciar sesión.',
    silBaslik: 'Eliminar',
    silAciklama: "Por seguridad enviaremos un código de confirmación de 6 dígitos a tu correo; quien introduzca el código podrá eliminar la cuenta. El código se verifica en el servidor; esta página no tiene ninguna autoridad sobre tu cuenta.",
    epostaEtiket: "Correo electrónico",
    kodEtiket: "Código de confirmación",
    kodGonder: "Enviar código de confirmación",
    dugme: "Eliminar mi cuenta de forma permanente",
    dipnot: "Si creaste tu cuenta con Apple y elegiste \"Ocultar mi correo\", el código va a la dirección privada que te dio Apple y se reenvía al correo real de tu ID de Apple. Si algo falla, elimina tu cuenta desde la app (Ajustes › Eliminar mi cuenta, confirmar con Apple) o escribe a {{eposta}}.",
    betik: {
      eksik: "Introduce tu correo electrónico.",
      kodEksik: "Introduce el código completo de 6 dígitos.",
      kontrol: "Enviando el código de confirmación…",
      kodGonderildi: "El código de confirmación se envió a tu correo. Es válido durante 10 minutos.",
      hesapYok: "No se encontró ninguna cuenta con esta dirección.",
      kodHatasi: "El código es incorrecto o ha caducado. Envía el código de nuevo e inténtalo otra vez.",
      cokDeneme: "Este intento se bloqueó por demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
      gonderilemedi: "No se pudo enviar el código ahora. Inténtalo de nuevo en unos minutos; si el problema continúa, escribe a destek@slooin.com.",
      siliniyor: "Eliminando tu cuenta…",
      silinemedi: "No se pudo eliminar la cuenta. Inténtalo más tarde; si el problema continúa, escribe a destek@slooin.com.",
      silindi: "Tu cuenta se ha eliminado. Esto no se puede deshacer. Si la app sigue en tu teléfono, también puedes quitarla.",
      beklenmeyen: "Se recibió una respuesta inesperada. Escribe a destek@slooin.com.",
    },
  },
}

const fr: SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: 'Confidentialité',
    altSeritKosullar: "Conditions d'utilisation",
    altSeritDestek: 'Assistance',
    altSeritHesapSil: 'Supprimer le compte',
    altSeritIletisim: 'Contact',
    dilSeciciEtiket: 'Choisir la langue',
    kunye: 'Données de lieux fournies par Foursquare et les contributeurs OpenStreetMap (ODbL).',
    sonGuncelleme: 'Dernière mise à jour',
    ustunlukNotu: "Le texte faisant foi est la version turque de ce document ; cette traduction est fournie à titre d'information.",
    anaSayfaEtiketi: "Accueil Slooin",
  },
  ana: {
    aciklama: "Slooin est une application sociale basée sur la position qui permet aux personnes présentes au même endroit au même moment de se remarquer.",
    yakinda: 'Bientôt',
    appStore: "sur l'App Store",
    googlePlay: 'sur Google Play',
    slogan1: 'Même endroit.',
    slogan2: 'Remarquez-vous.',
    altMekan: 'Page de lieu Slooin',
    altKesfet: 'Écran de check-in Slooin',
  },
  gizlilik: {
    baslik: 'Politique de confidentialité',
    aciklama: 'Quelles données personnelles Slooin traite, dans quel but et pendant combien de temps elles sont conservées.',
  },
  kosullar: {
    baslik: "Conditions d'utilisation",
    aciklama: "Les règles applicables à l'utilisation de Slooin : limite d'âge, règles de compte, comportements interdits et limitation de responsabilité.",
  },
  destek: {
    baslik: 'Assistance',
    aciklama: 'Questions fréquentes sur Slooin et contact de l\'assistance.',
    giris: "Pour un problème, une question ou un bug à signaler, écris à {{eposta}}. Les messages reçoivent une réponse sous trois jours ouvrés au plus tard.",
    sssBaslik: 'Questions fréquentes',
    sss: [
      { soru: 'Ma position est-elle partagée en permanence ?', cevap: "Non. Ta position n'est partagée que lorsque tu fais un check-in, et selon le niveau de visibilité que tu choisis. À l'expiration du check-in, la position est supprimée ; il ne reste qu'un enregistrement « j'étais ici »." },
      { soru: 'Qui peut me voir ?', cevap: 'À chaque check-in tu choisis une option parmi trois : public (les personnes au même endroit et tes amis), amis seulement, ou masqué (personne ne le voit).' },
      { soru: "Quelqu'un me dérange, que puis-je faire ?", cevap: "Tu peux bloquer la personne depuis son profil. Le blocage est réciproque et supprime la conversation entre vous ; la personne bloquée ne voit pas de message d'erreur. Tu peux aussi signaler la personne ou un message précis." },
      { soru: 'Comment supprimer mon compte ?', cevap: "Dans l'application via Réglages › Supprimer mon compte, ou, même si tu as désinstallé l'application, depuis la {{hesapSil}}." },
      { soru: "Pourquoi l'application montre-t-elle peu de lieux dans ma ville ?", cevap: "Les données de lieux proviennent de Foursquare et des contributeurs OpenStreetMap. S'il manque un lieu, tu peux l'ajouter toi-même dans l'application." },
    ],
    hesapSilBaglanti: 'page de suppression du compte',
  },
  hesapSil: {
    baslik: 'Supprimer ton compte',
    aciklama: 'Supprimer définitivement ton compte Slooin et les données qui y sont rattachées.',
    giris: "Tu peux supprimer ton compte dans l'application via Réglages › Supprimer mon compte. Si tu as retiré l'application de ton téléphone, tu peux aussi le faire depuis cette page — inutile de la réinstaller.",
    neSilinirBaslik: 'Que supprime-t-on ?',
    silinenler: [
      "Ton compte et ton profil (nom, nom d'utilisateur, bio, date de naissance)",
      'Ta photo de profil et tes photos de check-in',
      'Tous tes check-ins et souvenirs',
      'Tes amitiés, demandes, blocages et enregistrements de notifications',
    ],
    neKalirBaslik: 'Que reste-t-il ?',
    neKalir: "Les messages que tu as envoyés à d'autres et les signalements que tu as faits ne sont pas supprimés mais anonymisés — l'information sur l'expéditeur est retirée. Supprimer les messages reviendrait à supprimer aussi l'historique de conversation de l'autre personne ; c'est pourquoi ce choix a été fait.",
    uyari: "La suppression est irréversible. Tu peux te réinscrire avec la même adresse e-mail, mais tes anciennes données ne reviendront pas. Si tu veux fermer ton compte temporairement, utilise l'option de gel du compte dans l'application — il se réactive de lui-même à ta prochaine connexion.",
    silBaslik: 'Supprimer',
    silAciklama: "Par sécurité, nous enverrons un code de confirmation à 6 chiffres à ton e-mail ; la personne qui saisit le code peut supprimer le compte. Le code est vérifié sur le serveur ; cette page n'a aucune autorité sur ton compte.",
    epostaEtiket: "E-mail",
    kodEtiket: "Code de confirmation",
    kodGonder: "Envoyer le code de confirmation",
    dugme: "Supprimer définitivement mon compte",
    dipnot: "Si tu as créé ton compte avec Apple en choisissant « Masquer mon adresse e-mail », le code est envoyé à l'adresse relais fournie par Apple puis transféré vers l'adresse réelle de ton identifiant Apple. En cas de problème, supprime ton compte dans l'application (Réglages › Supprimer mon compte, confirmer avec Apple) ou écris à {{eposta}}.",
    betik: {
      eksik: "Saisis ton adresse e-mail.",
      kodEksik: "Saisis le code complet à 6 chiffres.",
      kontrol: "Envoi du code de confirmation…",
      kodGonderildi: "Le code de confirmation a été envoyé à ton e-mail. Il est valable 10 minutes.",
      hesapYok: "Aucun compte trouvé avec cette adresse.",
      kodHatasi: "Le code est incorrect ou a expiré. Renvoie le code et réessaie.",
      cokDeneme: "Cette tentative a été bloquée en raison d'un trop grand nombre d'essais. Attends quelques minutes et réessaie.",
      gonderilemedi: "Le code n'a pas pu être envoyé pour le moment. Réessaie dans quelques minutes ; si le problème persiste, écris à destek@slooin.com.",
      siliniyor: "Suppression de ton compte…",
      silinemedi: "Le compte n'a pas pu être supprimé. Réessaie plus tard ; si le problème persiste, écris à destek@slooin.com.",
      silindi: "Ton compte a été supprimé. Cette action est irréversible. Si l'application est encore sur ton téléphone, tu peux aussi la retirer.",
      beklenmeyen: "Une réponse inattendue a été reçue. Écris à destek@slooin.com.",
    },
  },
}

const ru: SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: 'Конфиденциальность',
    altSeritKosullar: 'Условия использования',
    altSeritDestek: 'Поддержка',
    altSeritHesapSil: 'Удаление аккаунта',
    altSeritIletisim: 'Контакты',
    dilSeciciEtiket: 'Выбрать язык',
    kunye: 'Данные о местах — Foursquare и участники OpenStreetMap (ODbL).',
    sonGuncelleme: 'Последнее обновление',
    ustunlukNotu: 'Юридически обязательным является турецкий текст этого документа; перевод приведён только для ознакомления.',
    anaSayfaEtiketi: 'Главная Slooin',
  },
  ana: {
    aciklama: 'Slooin — социальное приложение на основе местоположения, которое помогает людям, находящимся в одном месте в одно время, заметить друг друга.',
    yakinda: 'Скоро',
    appStore: 'в App Store',
    googlePlay: 'в Google Play',
    slogan1: 'Вы в одном месте.',
    slogan2: 'Заметьте друг друга.',
    altMekan: 'Страница места в Slooin',
    altKesfet: 'Экран чек-ина в Slooin',
  },
  gizlilik: {
    baslik: 'Политика конфиденциальности',
    aciklama: 'Какие персональные данные обрабатывает Slooin, с какой целью и как долго хранит.',
  },
  kosullar: {
    baslik: 'Условия использования',
    aciklama: 'Правила использования Slooin: возрастное ограничение, правила аккаунта, запрещённое поведение и ограничение ответственности.',
  },
  destek: {
    baslik: 'Поддержка',
    aciklama: 'Часто задаваемые вопросы о Slooin и контакты поддержки.',
    giris: 'Если у вас проблема, вопрос или вы хотите сообщить об ошибке, напишите на {{eposta}}. Ответ приходит не позднее чем через три рабочих дня.',
    sssBaslik: 'Часто задаваемые вопросы',
    sss: [
      { soru: 'Моё местоположение передаётся постоянно?', cevap: 'Нет. Местоположение передаётся только когда вы делаете чек-ин, и согласно выбранному уровню видимости. Когда чек-ин истекает, местоположение удаляется; остаётся только запись «я здесь был(а)».' },
      { soru: 'Кто может меня видеть?', cevap: 'При каждом чек-ине вы выбираете один из трёх вариантов: публично (те, кто в том же месте, и ваши друзья), только друзья или скрыто (никто не видит).' },
      { soru: 'Кто-то мне досаждает, что делать?', cevap: 'Вы можете заблокировать человека в его профиле. Блокировка двусторонняя и удаляет переписку между вами; заблокированный не видит это как сообщение об ошибке. Также можно пожаловаться на человека или на отдельное сообщение.' },
      { soru: 'Как удалить аккаунт?', cevap: 'В приложении через Настройки › Удалить аккаунт или, даже если приложение уже удалено, на {{hesapSil}}.' },
      { soru: 'Почему приложение показывает мало мест в моём городе?', cevap: 'Данные о местах поступают от Foursquare и участников OpenStreetMap. Если места нет, вы можете добавить его сами в приложении.' },
    ],
    hesapSilBaglanti: 'странице удаления аккаунта',
  },
  hesapSil: {
    baslik: 'Удалить аккаунт',
    aciklama: 'Навсегда удалить аккаунт Slooin и связанные с ним данные.',
    giris: 'Удалить аккаунт можно в приложении через Настройки › Удалить аккаунт. Если приложение уже удалено с телефона, это можно сделать и на этой странице — переустанавливать приложение не нужно.',
    neSilinirBaslik: 'Что удаляется?',
    silinenler: [
      'Аккаунт и профиль (имя, имя пользователя, описание, дата рождения)',
      'Фото профиля и фотографии чек-инов',
      'Все чек-ины и воспоминания',
      'Дружбы, запросы, блокировки и записи уведомлений',
    ],
    neKalirBaslik: 'Что остаётся?',
    neKalir: 'Сообщения, отправленные другим, и поданные вами жалобы не удаляются, а обезличиваются — информация об отправителе убирается. Удаление сообщений означало бы удаление и истории переписки другого человека, поэтому выбран такой вариант.',
    uyari: 'Удаление необратимо. Вы можете снова зарегистрироваться с той же почтой, но старые данные не вернутся. Если хотите закрыть аккаунт временно, используйте заморозку аккаунта в приложении — при следующем входе он активируется сам.',
    silBaslik: 'Удалить',
    silAciklama: "Для безопасности мы отправим на вашу почту 6-значный код подтверждения; тот, кто введёт код, сможет удалить аккаунт. Код проверяется на сервере; эта страница не имеет никаких полномочий над вашим аккаунтом.",
    epostaEtiket: "Эл. почта",
    kodEtiket: "Код подтверждения",
    kodGonder: "Отправить код подтверждения",
    dugme: "Удалить мой аккаунт навсегда",
    dipnot: "Если вы создали аккаунт через Apple и выбрали «Скрыть e-mail», код придёт на выданный Apple адрес-ретранслятор и будет переслан на настоящий адрес вашего Apple ID. Если что-то не сработает, удалите аккаунт в приложении (Настройки › Удалить аккаунт, подтвердить через Apple) или напишите на {{eposta}}.",
    betik: {
      eksik: "Введите адрес электронной почты.",
      kodEksik: "Введите полный 6-значный код.",
      kontrol: "Отправляем код подтверждения…",
      kodGonderildi: "Код подтверждения отправлен на вашу почту. Он действителен 10 минут.",
      hesapYok: "Аккаунт с таким адресом не найден.",
      kodHatasi: "Код неверный или истёк. Отправьте код снова и повторите.",
      cokDeneme: "Попытка заблокирована из-за слишком большого числа попыток. Подождите несколько минут и попробуйте снова.",
      gonderilemedi: "Код сейчас не удалось отправить. Попробуйте через несколько минут; если проблема сохраняется, напишите на destek@slooin.com.",
      siliniyor: "Удаляем аккаунт…",
      silinemedi: "Не удалось удалить аккаунт. Попробуйте позже; если проблема сохраняется, напишите на destek@slooin.com.",
      silindi: "Ваш аккаунт удалён. Это необратимо. Если приложение ещё на телефоне, его тоже можно удалить.",
      beklenmeyen: "Получен неожиданный ответ. Напишите на destek@slooin.com.",
    },
  },
}

const ar: SiteSozlugu = {
  kabuk: {
    altSeritGizlilik: 'الخصوصية',
    altSeritKosullar: 'شروط الاستخدام',
    altSeritDestek: 'الدعم',
    altSeritHesapSil: 'حذف الحساب',
    altSeritIletisim: 'التواصل',
    dilSeciciEtiket: 'اختر اللغة',
    kunye: 'بيانات الأماكن من Foursquare ومساهمي OpenStreetMap (ODbL).',
    sonGuncelleme: 'آخر تحديث',
    ustunlukNotu: 'النص الملزم لهذه الوثيقة هو النسخة التركية؛ وهذه الترجمة لأغراض الاطلاع فقط.',
    anaSayfaEtiketi: 'الصفحة الرئيسية لـ Slooin',
  },
  ana: {
    aciklama: 'Slooin تطبيق اجتماعي قائم على الموقع يتيح للأشخاص الموجودين في المكان نفسه في الوقت نفسه أن يلاحظوا بعضهم بعضًا.',
    yakinda: 'قريبًا',
    appStore: 'على App Store',
    googlePlay: 'على Google Play',
    slogan1: 'أنتم في المكان نفسه.',
    slogan2: 'لاحظوا بعضكم.',
    altMekan: 'صفحة مكان في Slooin',
    altKesfet: 'شاشة تسجيل الوصول في Slooin',
  },
  gizlilik: {
    baslik: 'سياسة الخصوصية',
    aciklama: 'ما البيانات الشخصية التي يعالجها Slooin ولأي غرض وكم يحتفظ بها.',
  },
  kosullar: {
    baslik: 'شروط الاستخدام',
    aciklama: 'القواعد السارية عند استخدام Slooin: الحد الأدنى للعمر، وقواعد الحساب، والسلوك المحظور، وحدود المسؤولية.',
  },
  destek: {
    baslik: 'الدعم',
    aciklama: 'الأسئلة الشائعة حول Slooin وطرق التواصل مع الدعم.',
    giris: 'إذا كانت لديك مشكلة أو سؤال أو خطأ تريد الإبلاغ عنه فاكتب إلى {{eposta}}. يُرَدّ على الرسائل خلال ثلاثة أيام عمل على الأكثر.',
    sssBaslik: 'الأسئلة الشائعة',
    sss: [
      { soru: 'هل تتم مشاركة موقعي باستمرار؟', cevap: 'لا. يُشارَك موقعك فقط عندما تسجّل وصولك، ووفق مستوى الظهور الذي تختاره. وعند انتهاء تسجيل الوصول يُحذَف الموقع؛ ولا يبقى سوى سجل «كنت هنا».' },
      { soru: 'من يستطيع رؤيتي؟', cevap: 'في كل تسجيل وصول تختار أحد ثلاثة خيارات: عام (من في المكان نفسه وأصدقاؤك)، أو الأصدقاء فقط، أو مخفي (لا يراه أحد).' },
      { soru: 'أزعجني شخص ما، ماذا أفعل؟', cevap: 'يمكنك حظر الشخص من ملفه الشخصي. الحظر متبادل ويحذف المحادثة بينكما؛ ولا يراه المحظور كرسالة خطأ. كما يمكنك الإبلاغ عن الشخص أو عن رسالة واحدة.' },
      { soru: 'كيف أحذف حسابي؟', cevap: 'من داخل التطبيق عبر الإعدادات › حذف حسابي، أو حتى لو حذفت التطبيق من خلال {{hesapSil}}.' },
      { soru: 'لماذا يعرض التطبيق أماكن قليلة في مدينتي؟', cevap: 'تأتي بيانات الأماكن من Foursquare ومساهمي OpenStreetMap. إذا كان هناك مكان ناقص يمكنك إضافته بنفسك من داخل التطبيق.' },
    ],
    hesapSilBaglanti: 'صفحة حذف الحساب',
  },
  hesapSil: {
    baslik: 'حذف حسابك',
    aciklama: 'حذف حساب Slooin والبيانات المرتبطة به نهائيًا.',
    giris: 'يمكنك حذف حسابك من داخل التطبيق عبر الإعدادات › حذف حسابي. وإذا أزلت التطبيق من هاتفك فيمكنك الحذف من هذه الصفحة أيضًا — لا حاجة لإعادة تثبيت التطبيق.',
    neSilinirBaslik: 'ما الذي يُحذَف؟',
    silinenler: [
      'حسابك وملفك الشخصي (الاسم، اسم المستخدم، النبذة، تاريخ الميلاد)',
      'صورة ملفك الشخصي وصور تسجيلات وصولك',
      'جميع تسجيلات وصولك وذكرياتك',
      'صداقاتك وطلباتك وحظوراتك وسجلات الإشعارات',
    ],
    neKalirBaslik: 'ما الذي يبقى؟',
    neKalir: 'الرسائل التي أرسلتها للآخرين والبلاغات التي قدمتها لا تُحذَف بل تُجهَّل هويتها — تُزال بيانات المرسل. اختير هذا لأن حذف الرسائل يعني حذف سجل محادثة الطرف الآخر أيضًا.',
    uyari: 'لا يمكن التراجع عن الحذف. يمكنك التسجيل مجددًا بالبريد نفسه لكن بياناتك القديمة لن تعود. إذا أردت إغلاق حسابك مؤقتًا فاستخدم خيار تجميد الحساب داخل التطبيق — يُفعَّل تلقائيًا عند تسجيل الدخول مجددًا.',
    silBaslik: 'حذف',
    silAciklama: "لأغراض الأمان سنرسل رمز تأكيد من 6 أرقام إلى بريدك الإلكتروني؛ ومن يُدخل الرمز يمكنه حذف الحساب. يُتحقَّق من الرمز على الخادم؛ ولا تملك هذه الصفحة أي صلاحية على حسابك.",
    epostaEtiket: "البريد الإلكتروني",
    kodEtiket: "رمز التأكيد",
    kodGonder: "إرسال رمز التأكيد",
    dugme: "حذف حسابي نهائيًا",
    dipnot: "إذا أنشأت حسابك عبر Apple واخترت «إخفاء بريدي الإلكتروني»، يُرسل الرمز إلى عنوان إعادة التوجيه الذي منحته لك Apple ثم يُعاد توجيهه إلى عنوانك الحقيقي في Apple ID. إذا واجهت مشكلة فاحذف حسابك من داخل التطبيق (الإعدادات › حذف حسابي، التأكيد عبر Apple) أو اكتب إلى {{eposta}}.",
    betik: {
      eksik: "أدخل بريدك الإلكتروني.",
      kodEksik: "أدخل الرمز الكامل المكوّن من 6 أرقام.",
      kontrol: "جارٍ إرسال رمز التأكيد…",
      kodGonderildi: "أُرسل رمز التأكيد إلى بريدك الإلكتروني. وهو صالح لمدة 10 دقائق.",
      hesapYok: "لم يُعثر على حساب بهذا العنوان.",
      kodHatasi: "الرمز خاطئ أو انتهت صلاحيته. أرسل الرمز مجددًا وحاول من جديد.",
      cokDeneme: "حُظرت هذه المحاولة بسبب كثرة المحاولات. انتظر بضع دقائق ثم حاول مجددًا.",
      gonderilemedi: "تعذّر إرسال الرمز الآن. حاول بعد بضع دقائق؛ وإذا استمرت المشكلة فاكتب إلى destek@slooin.com.",
      siliniyor: "جارٍ حذف حسابك…",
      silinemedi: "تعذّر حذف الحساب. حاول لاحقًا؛ وإذا استمرت المشكلة فاكتب إلى destek@slooin.com.",
      silindi: "تم حذف حسابك. لا يمكن التراجع عن ذلك. إذا كان التطبيق لا يزال على هاتفك فيمكنك إزالته أيضًا.",
      beklenmeyen: "وردت استجابة غير متوقعة. اكتب إلى destek@slooin.com.",
    },
  },
}

export const SOZLUKLER: Record<Dil, SiteSozlugu> = { tr, en, de, es, fr, ru, ar }

export function sozluk(dil: string): SiteSozlugu {
  return SOZLUKLER[dil as Dil] ?? tr
}

/** Sagdan sola yazilan diller; `<html dir>` icin. */
export const SAGDAN_SOLA: readonly string[] = ['ar']
