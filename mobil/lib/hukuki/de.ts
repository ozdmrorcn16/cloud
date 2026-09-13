import type { HukukiMetin } from './tur'

// Almanca ceviri. Kaynak: tr.ts - Turkce metin esastir.
const de: HukukiMetin = {
  gizlilik: [
    {
      baslik: 'Verantwortlicher',
      paragraflar: [
        'Verantwortlicher für die Daten dieser App ist Orçun Özdemir als natürliche Person. Anträge nach dem türkischen Datenschutzgesetz (KVKK) kannst du an destek@slooin.com senden; dein Antrag wird spätestens innerhalb von 30 Tagen beantwortet.',
      ],
    },
    {
      baslik: '1. Welche deiner Daten wir verarbeiten',
      paragraflar: [
        'Deine E-Mail-Adresse - heute die PRIMÄRE Kennung deines Kontos. Sie wird bei der Registrierung und Anmeldung verwendet; der Bestätigungscode wird dorthin gesendet.',
        'Dein Name, Benutzername, Geburtsdatum, deine Bio und Profilfotos.',
        'Dein Standort - auf drei verschiedene Arten: bei der Ortssuche und beim Hinzufügen eines Ortes wird der Gerätestandort an den Server gesendet, aber nicht gespeichert; während ein Check-in aktiv ist, werden deine Koordinaten gespeichert; wird der Check-in zu einer Erinnerung (nach 1 Stunde oder sobald du „Ich bin gegangen“ tippst), werden die Koordinaten gelöscht und es bleibt nur, an welchem Ort du warst (Details unten in Abschnitt 3).',
        'Der Inhalt der Nachrichten, die du sendest und empfängst.',
        'Deine Freundschaftsdaten: wem du folgst, mit wem du Chat-Anfragen ausgetauscht hast, wen du blockiert hast.',
        'Das Benachrichtigungs-Token deines Geräts, damit wir dir Benachrichtigungen senden können.',
        'Meldungen, die du erstattet hast oder die über dich erstattet wurden.',
        'Deine Bewertungen von Orten (Schlecht / Gut / Großartig). Alle sehen nur die Summen; welche Bewertung du abgegeben hast, siehst nur du. Deine Check-in-Fotos erscheinen mit der von dir gewählten Sichtbarkeitsregel auch im Fotobereich dieses Ortes.',
      ],
    },
    {
      baslik: '2. Zu welchem Zweck - und auf welcher Rechtsgrundlage',
      paragraflar: [
        'KVKK Art. 10 verlangt, dass neben dem Verarbeitungszweck auch die Rechtsgrundlage genannt wird. Die Grundlage jedes Zwecks ist einzeln aufgeführt.',
        'Einrichtung deines Kontos und Bestätigung deiner E-Mail-Adresse. Rechtsgrundlage: Vertragserfüllung (KVKK Art. 5/2-c) - ohne Konto funktioniert keine Funktion der App.',
        'Dir das Entdecken von Orten und Personen in deiner Nähe ermöglichen (Standort und Check-in). Rechtsgrundlage: Vertragserfüllung (KVKK Art. 5/2-c). Das Einzige, was Slooin tut, ist, dich an einem Ort einchecken zu lassen und dir zu zeigen, wer dort ist; ohne Standortverarbeitung funktioniert die App nicht, der Standort ist also keine „Zusatzfunktion“, sondern der Dienst selbst.',
        'Dir das Schreiben von Nachrichten ermöglichen. Rechtsgrundlage: Vertragserfüllung (KVKK Art. 5/2-c).',
        'Missbrauch (Belästigung, gefälschte Konten, unangemessene Inhalte) verhindern und untersuchen - Meldungsdatensätze, Moderations-Prüfprotokoll, Kontostatus-Datensätze und Zähler für die Anfrageobergrenze. Rechtsgrundlage: berechtigtes Interesse (KVKK Art. 5/2-f): Nutzer vor Belästigung und Missbrauch schützen zu können.',
        'Die Zustimmung, die du beim Erstellen deines Kontos mit „Weiter“ gibst, wird als Nachweis in die Datenbank geschrieben: dass du die Datenschutzhinweise gelesen und die Verarbeitung deiner Standortdaten akzeptiert hast, zusammen mit der Textversion und dem Zeitpunkt der Zustimmung (zwei Einträge: aydinlatma und konum_rizasi). Dieser Eintrag ersetzt die obigen Rechtsgrundlagen nicht - er wird zusätzlich geführt, damit wir rückwirkend zeigen können, was dir mitgeteilt wurde.',
      ],
    },
    {
      baslik: '3. Der Standort im Besonderen',
      paragraflar: [
        'Der Standort deines Geräts wird auf DREI verschiedene Arten verwendet; es ist wichtig, sie nicht zu verwechseln.',
        'Bei der Ortssuche: Damit wir Orte in deiner Nähe anzeigen können, wird der Standort deines Geräts bei jeder Ortssuche an den Server GESENDET. Dieser Standort wird NICHT GESPEICHERT - er dient nur der Beantwortung dieser einen Anfrage und wird nirgends in der Datenbank abgelegt.',
        'Beim Hinzufügen eines neuen Ortes: Um zu prüfen, dass du dem Ort, den du hinzufügen willst, wirklich nahe bist, wird der Standort deines Geräts gesendet (du musst dich innerhalb von ~200 Metern befinden). Auch dieser Standort wird NICHT GESPEICHERT - er dient nur dieser Näheprüfung. Gespeichert wird nur der Standort des hinzugefügten Ortes, nicht dein Standort in diesem Moment.',
        'Beim Check-in: Solange der Check-in AKTIV ist, werden deine Koordinaten gespeichert. Das ist aber vorübergehend: Der Check-in wird nach 1 STUNDE (oder sobald du „Ich bin gegangen“ tippst) automatisch zu einer Erinnerung, und bei diesem Übergang werden die Koordinaten GELÖSCHT (in der Datenbank auf null gesetzt) - es bleibt nur, an welchem Ort du warst, nicht die genauen Koordinaten. Da der Bereinigungslauf alle 10 Minuten läuft, werden Koordinaten höchstens etwa 1 Stunde 10 Minuten aufbewahrt.',
        'Die während eines aktiven Check-ins gespeicherten Koordinaten werden gemäß der Anwesenheitsstufe geteilt, die du für den Check-in gewählt hast (gilt für den LIVE-Check-in): Öffentlich - NICHT alle in der App, sondern nur diejenigen, die in diesem Moment am selben Ort einen Live-Check-in haben, oder deine gegenseitigen Kontakte sehen ihn. Nur Follower - nur deine gegenseitigen Kontakte sehen ihn. Verborgen - niemand sieht ihn; der Check-in bleibt nur in deinem eigenen Verlauf.',
        'Nachdem der Check-in zu einer Erinnerung geworden ist (nach dem Löschen des Standorts), ist die Sichtbarkeit der Erinnerung eine SEPARATE dreistufige Einstellung ohne die Bedingung „live am selben Ort“: Öffentlich - alle in der App sehen sie (aktive Konten, Blockierungen ausgenommen). Nur Follower - nur deine gegenseitigen Kontakte sehen sie. Niemand - nur du siehst sie in deinem eigenen Profil.',
        'Wenn du „Verborgen“ wählst, sieht niemand deine Identität - außer der Moderation. Es gibt aber eine Ausnahme: Du wirst UNABHÄNGIG von deiner Anwesenheitsstufe im öffentlichen Zähler „wie viele Personen sind hier“ (Auslastung) des Ortes mitgezählt. Deine Identität bleibt also verborgen, aber der Zähler steigt durch deine Anwesenheit - an einem ruhigen Ort kann jemand, wenn der Zähler von 0 auf 1 springt, ableiten, dass „jemand da ist“.',
      ],
    },
    {
      baslik: '4. Zugriff durch die Moderation',
      paragraflar: [
        'Wenn eine Meldung über dich eingeht oder du wegen Missbrauchsverdachts überprüft wirst, kann unser Moderationsteam dein Profil, deine Check-ins und deine Nachrichteninhalte lesen. Das gilt auch, wenn deine Anwesenheitsstufe verborgen ist.',
        'Jeder Zugriff der Moderation wird protokolliert: Wer wann welchen deiner Datensätze angesehen hat, wird in einem Prüfprotokoll festgehalten. Dieses Protokoll erlaubt NUR HINZUFÜGEN - der Eintrag wird serverseitig erzeugt, und es gibt keinen Weg, mit dem ein Moderator seinen eigenen Zugriffseintrag löschen oder ändern könnte. Der Zugriff wird nur im Zusammenhang mit einer Meldung oder Überprüfung genutzt, nicht zum beiläufigen Stöbern. Die Einträge werden 2 JAHRE aufbewahrt (siehe Abschnitt 6).',
        'Am Tag, an dem wir diese Zeile geschrieben haben, enthielt das Prüfprotokoll keine Einträge - bisher gab es keinen Moderationszugriff. Das bedeutet nicht, dass der Mechanismus nicht existiert; er ist eingerichtet und funktioniert, er musste nur noch nicht genutzt werden.',
      ],
    },
    {
      baslik: '5. Übermittlung ins Ausland',
      paragraflar: [
        'Die Server von Supabase (Datenbank und Dateispeicher) stehen in Deutschland (Region eu-central-1). Alle deine personenbezogenen Daten werden außerhalb der Türkei, innerhalb der Europäischen Union, gespeichert.',
        'Die Server der Expo Push API (Zustellung von Benachrichtigungen) stehen in den Vereinigten Staaten von Amerika. Beim Senden einer Benachrichtigung laufen das Benachrichtigungs-Token deines Geräts, die Information, an wen sie geht, und der Name der Person, die die Benachrichtigung ausgelöst hat, hier durch (zum Beispiel „Deniz hat dir eine Nachricht gesendet“). Der Text der Nachricht wird der Benachrichtigung nie beigefügt, aber auch der Name einer anderen Person ist ein personenbezogenes Datum und Teil dieser Übermittlung.',
        'Die Kartengrundlage liefert unter iOS Apple Karten, unter Android Google Maps. Beim Zeichnen der Karte gehen die Koordinaten des auf dem Bildschirm sichtbaren Ausschnitts an diesen Anbieter; deine Identität, dein Konto oder deine Check-ins nicht. Die Web-Version hat keine echte Karte, dort findet diese Übermittlung nicht statt.',
        'Rechtsgrundlage der Übermittlung: Alle drei Übermittlungen sind für die Erbringung des Dienstes notwendig, stützen sich also auf dieselbe Grundlage wie in Abschnitt 2 - die Vertragserfüllung; die Zustellung von Benachrichtigungen fällt zusätzlich unter das berechtigte Interesse.',
        'Wir wollen das offen sagen: KVKK Art. 9 verlangt für Übermittlungen ins Ausland neben der Rechtsgrundlage einen Übermittlungsmechanismus (Angemessenheitsbeschluss, Standardvertrag, Verpflichtungserklärung oder ausdrückliche Einwilligung). Die türkische Datenschutzbehörde hat keinen Angemessenheitsbeschluss für diese Länder, und auch wir haben heute KEINEN unterzeichneten Standardvertrag. Das ist eine offene Lücke, die geschlossen werden muss, bevor die App für echte Nutzer geöffnet wird. Wir ziehen es vor, einen nicht existierenden Mechanismus nicht als existent darzustellen.',
      ],
    },
    {
      baslik: '6. Aufbewahrungsfristen',
      paragraflar: [
        'Heute gelten mehrere automatische Lösch-/Bereinigungsregeln (nicht eine einzige).',
        'Abgelaufene (älter als 90 Tage) Kontosperrungs-Einträge werden jeden Tag automatisch aus der Datenbank gelöscht (vollständige Löschung, keine Archivierung). Eine anderswo gespeicherte Kopie dieser Einträge gibt es heute nicht.',
        'In den Datensätzen, die zur Berechnung der täglichen Obergrenze für Folge-/Chat-Anfragen geführt werden, werden Zeilen, die älter als 2 Tage sind, jeden Tag automatisch gelöscht.',
        'Deine Check-in-Koordinaten (wie in Abschnitt 3 beschrieben) werden automatisch gelöscht, wenn der Check-in zu einer Erinnerung wird.',
        'Moderations-Zugriffseinträge (siehe Abschnitt 4) werden 2 JAHRE aufbewahrt. Ein Bereinigungslauf, der täglich um 04:45 läuft, löscht ältere Zeilen. Diese Regel ist heute IN KRAFT.',
        'Für deine Erinnerungen (den Rest deines Check-in-Verlaufs), deine Nachrichten und Meldungen gibt es heute keine vollständige automatische Löschung - sie werden unbefristet aufbewahrt. Die vollständige Umsetzung des Grundsatzes „nur so lange wie nötig aufbewahren“ ist noch nicht abgeschlossen.',
        'Geplant (noch nicht umgesetzt): Löschung entschiedener Meldungen 1 Jahr nach der Entscheidung. Für Meldungsdatensätze gibt es heute keinen automatischen Löschlauf.',
        'Wenn du einen Nutzer blockierst: Alle Einzelnachrichten und die Unterhaltung zwischen euch, ausstehende Anfragen und die Freundschaft werden dauerhaft gelöscht. Die Löschung gilt auf beiden Seiten und kann nicht rückgängig gemacht werden; das Aufheben der Blockierung bringt die gelöschten Nachrichten nicht zurück.',
        'Wenn du dein Konto löschst: Dein Profil, deine Erinnerungen, deine Freunde und deine Unterhaltungsliste werden dauerhaft gelöscht. Von dir gesendete Nachrichten werden nicht gelöscht, aber deine Absenderidentität wird abgetrennt. Bei Meldungen, die du erstattet hast, wird die Identitätsverknüpfung gekappt; bei Meldungen über dich wird sie NICHT gekappt, die Zielidentität bleibt im Moderationsdatensatz. Deine Profil- und Check-in-Fotos werden aus dem Speicher gelöscht.',
      ],
    },
    {
      baslik: '7. Deine Rechte',
      paragraflar: [
        'Du kannst dein Konto einfrieren. Deine Daten werden nicht gelöscht, du wirst unsichtbar; wenn du dich wieder anmeldest, wird dein Konto von selbst aktiv.',
        'Du kannst dein Konto dauerhaft löschen. Es gibt keinen Weg zurück; wenn du wiederkommen willst, musst du ein Konto von Grund auf neu anlegen.',
        'Du kannst eine Kopie deiner Daten herunterladen: Einstellungen > Meine Daten herunterladen. Die Datei wird im JSON-Format erstellt und über einen 24 Stunden gültigen Link bereitgestellt; nach Ablauf ist die Datei nicht mehr erreichbar und du kannst sie erneut herunterladen.',
        'Was NICHT in der Datei ist: Meldungen über dich (weil sie die Identität des Meldenden tragen), das Moderations-Prüfprotokoll, wer dich blockiert hat und der Text der an dich gesendeten Nachrichten. Für an dich gesendete Nachrichten ist nur enthalten, mit wem, wie viele Nachrichten und wann die letzte - die Sätze auf der anderen Seite einer Unterhaltung sind die Daten dieser Person.',
        'DIE HERUNTERGELADENE DATEI SCHÜTZT DU SELBST. Sie enthält alles aus deinem Konto, einschließlich deines Standortverlaufs; wem du sie gibst, der sieht alles davon.',
        'Antragsweg: Anträge kannst du an destek@slooin.com senden; dein Antrag wird spätestens innerhalb von 30 Tagen beantwortet.',
      ],
    },
  ],
  kosullar: [
    {
      baslik: '1. Parteien',
      paragraflar: [
        'Verantwortlicher und Betreiber dieses Dienstes (Slooin) ist Orçun Özdemir als natürliche Person. Dieses Dokument ist der Vertrag zwischen dem Betreiber und allen, die die Slooin-App nutzen.',
      ],
    },
    {
      baslik: '2. Altersgrenze',
      paragraflar: [
        'Slooin ist nur für Nutzer, die das 18. Lebensjahr vollendet haben. Wer jünger als 18 ist, kann kein Konto anlegen. Eine eingeschränkte Nutzung mit Zustimmung der Eltern gibt es nicht; Slooin richtet sich an eine einzige Zielgruppe, erwachsene Nutzer.',
      ],
    },
    {
      baslik: '3. Konto',
      paragraflar: [
        'Eine Person darf nur ein Konto anlegen.',
        'Dein Benutzername ist eindeutig und muss einem bestimmten Format entsprechen (Kleinbuchstaben, Ziffern, Punkt und Unterstrich; 3-20 Zeichen). Du kannst deinen Benutzernamen alle 30 Tage ändern.',
        'Die Geheimhaltung des Passworts, das du für dein Konto festlegst, liegt in deiner Verantwortung. Für Vorgänge in deinem Konto bist du verantwortlich, wenn du dein Passwort weitergibst oder nicht sicher aufbewahrst.',
      ],
    },
    {
      baslik: '4. Standort',
      paragraflar: [
        'Damit Slooin funktioniert, ist dein Standort erforderlich: Orte in der Nähe entdecken, Orte hinzufügen und einchecken beruhen auf dem Standortzugriff. Ein Check-in ist deine eigene Handlung - solange du nicht teilen willst, an welchem Ort du bist, zeigt die App dich anderen Nutzern nicht automatisch. Wie dein Standort verarbeitet und wie lange er gespeichert wird, erklärt die Datenschutzerklärung im Detail.',
      ],
    },
    {
      baslik: '5. Verbotenes Verhalten',
      paragraflar: [
        'Bei der Nutzung von Slooin ist Folgendes verboten: Belästigung, Drohung oder jedes Verhalten, das einen anderen Nutzer stört; gefälschte Konten anlegen oder sich als jemand anderes ausgeben; den Standort einer anderen Person ohne deren Einwilligung außerhalb der App teilen; Massennachrichten zu kommerziellen Zwecken (Spam).',
        'Wird eines dieser Verhalten festgestellt, gelten die Moderationsmaßnahmen aus Abschnitt 7.',
      ],
    },
    {
      baslik: '6. Inhalte',
      paragraflar: [
        'Die Notiz und das Foto, die du einem Check-in hinzufügst, gehören dir. Indem du sie teilst, erlaubst du Slooin, diesen Inhalt innerhalb der App anzuzeigen (im Feed, in deinem Profil, auf der Seite des betreffenden Ortes). Das Eigentum am Inhalt bleibt bei dir.',
      ],
    },
    {
      baslik: '7. Moderation',
      paragraflar: [
        'Nach einer Meldung kann dein Inhalt (Check-in-Notiz, Foto oder Kommentar) ausgeblendet werden. Bei wiederholten oder schweren Verstößen kann dein Konto vorübergehend gesperrt oder dauerhaft ausgeschlossen werden. Wenn du einer Moderationsentscheidung widersprechen möchtest, erreichst du uns unter destek@slooin.com.',
      ],
    },
    {
      baslik: '8. Konto schließen',
      paragraflar: [
        'Du kannst dein Konto jederzeit einfrieren: Deine Daten werden nicht gelöscht, und wenn du dich wieder anmeldest, wird dein Konto von selbst wieder aktiv.',
        'Du kannst dein Konto dauerhaft löschen. Das kann nicht rückgängig gemacht werden; wenn du die App wieder nutzen willst, musst du ein Konto von Grund auf neu anlegen. Was bei der Löschung gelöscht wird und was (anonymisiert) bleibt, erklärt die Datenschutzerklärung.',
      ],
    },
    {
      baslik: '9. Haftungsbeschränkung',
      paragraflar: [
        'Slooin ist ein Werkzeug, das es Nutzern erleichtert, über Check-ins dieselbe Umgebung zu teilen. Für Folgen von Treffen oder Interaktionen der Nutzer untereinander ist der Betreiber nicht verantwortlich.',
        'Die Ortsdaten in der App (Name, Standort, Typ) stammen aus Drittquellen (Foursquare und OpenStreetMap) und können fehlerhaft sein. Das ist kein abstrakter Haftungsausschluss: In der Datenbank gibt es echte Einträge, in denen derselbe Ort mehrfach mit falschen Koordinaten erscheint - zum Beispiel gibt es separate Einträge namens „Galata Kulesi“ in Çekmeköy, Silivri und Büyükçekmece. Bevor du Name, Standort oder Typ eines Ortes als richtig annimmst, solltest du deine eigene Einschätzung vornehmen.',
      ],
    },
    {
      baslik: '10. Änderungen',
      paragraflar: ['Ändern sich diese Bedingungen, wird die Änderung in der App mitgeteilt.'],
    },
    {
      baslik: '11. Anwendbares Recht',
      paragraflar: ['Diese Bedingungen unterliegen dem Recht der Republik Türkei.'],
    },
  ],
}

export default de
