/** Français. La langue source est le turc (`tr.ts`) ; même structure. */
export default {
  ortak: {
    devam: 'Continuer',
    iptal: 'Annuler',
    kaydet: 'Enregistrer',
    tekrarDene: 'Réessayer',
    yukleniyor: 'Chargement…',
    birSorunOldu: 'Un problème est survenu.',
  },

  karsilama: {
    baslikBirinci: 'Vous êtes au même endroit.',
    baslikIkinci: 'Et si vous disiez bonjour ?',
    aciklama:
      'Enregistre-toi là où tu es et vois qui s’y trouve en ce moment. Ta position n’est partagée que pendant ton check-in.',
    onayEtiket: 'J’accepte les conditions',
    onayMetni:
      'J’ai lu la politique de confidentialité et j’accepte que mes données personnelles et ma position soient traitées comme elle le décrit.',
    metniOku: 'Lire la politique',
    hesapOlustur: 'Créer un compte',
    hesabinVarMi: 'Tu as déjà un compte ?',
    girisYap: 'Se connecter',
    // Yol agi OpenStreetMap verisinden turetildi; ODbL atfi sart.
    haritaAtfi: 'Données cartographiques © les contributeurs OpenStreetMap',
    kucukNot: 'Tu dois avoir 18 ans ou plus. Ta position n’est jamais partagée en continu.',
    hataOnay: 'Accepte les conditions pour continuer.',
  },

  kayit: {
    baslik: 'Crée ton compte',
    altYazi: 'Nous vérifierons ton numéro. Il n’apparaît pas sur ton profil.',
    telefonEtiket: 'Numéro de téléphone',
    telefonYerTutucu: '05XX XXX XX XX',
    dilEtiket: 'Langue',
    yakinda: 'bientôt',
    sifreEtiket: 'Mot de passe',
    sifreYerTutucu: 'Au moins {{adet}} caractères',
    tekrarEtiket: 'Répète le mot de passe',
    tekrarYerTutucu: 'Saisis le même mot de passe',
    sifrelerFarkli: 'Les mots de passe ne correspondent pas encore.',
    onayEtiket: 'J’accepte les conditions',
    onayMetni:
      'J’ai lu la politique de confidentialité et j’accepte que mes données personnelles et ma position soient traitées comme elle le décrit.',
    metniOku: 'Lire la politique',
    onayNotu:
      'Ta position n’est utilisée que pendant ton check-in et n’est jamais partagée en continu. Tu peux retirer ce consentement dans les réglages.',
    gonder: 'Créer un compte',
    gonderiliyor: 'Envoi…',
    zatenHesap: 'Tu as déjà un compte ?',
    girisYap: 'Se connecter',
    hataTelefon: 'Saisis un numéro de téléphone valide.',
    hataSifreKisa: 'Le mot de passe doit contenir au moins {{adet}} caractères.',
    hataSifreUyusmuyor: 'Les mots de passe ne correspondent pas. Vérifie les deux champs.',
    hataOnay: 'Accepte les conditions pour continuer.',
  },

  kisiler: {
    baslik: 'Trouver des personnes',
    yerTutucu: 'Nom d’utilisateur ou nom',
    enAzIki: 'Saisis au moins 2 caractères.',
    bulunamadi: 'Personne trouvée.',
    ipucu: 'Cherche quelqu’un que tu connais par nom d’utilisateur ou nom.',
  },

  giris: {
    telefonYerTutucu: 'Numéro de téléphone',
    sifreYerTutucu: 'Mot de passe',
    gonder: 'Se connecter',
    gonderiliyor: 'Connexion…',
    kayitOl: 'Créer un compte',
    hataTelefon: 'Saisis un numéro de téléphone valide.',
    hataBos: 'Saisis ton numéro de téléphone et ton mot de passe.',
  },
} as const
