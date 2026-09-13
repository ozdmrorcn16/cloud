import type { HukukiMetin } from './tur'

// Fransizca ceviri. Kaynak: tr.ts - Turkce metin esastir.
const fr: HukukiMetin = {
  gizlilik: [
    {
      baslik: 'Responsable du traitement',
      paragraflar: [
        "Le responsable du traitement des données de cette application est Orçun Özdemir, en tant que personne physique. Tu peux adresser tes demandes au titre de la loi turque sur la protection des données personnelles (KVKK) à destek@slooin.com ; ta demande reçoit une réponse dans un délai maximal de 30 jours.",
      ],
    },
    {
      baslik: '1. Quelles données te concernant nous traitons',
      paragraflar: [
        "Ton adresse e-mail : aujourd'hui l'identifiant PRINCIPAL de ton compte. Elle est utilisée à l'inscription et à la connexion, et le code de vérification y est envoyé.",
        'Ton nom, ton nom d\'utilisateur, ta date de naissance, ta bio et tes photos de profil.',
        "Ta position, de trois manières différentes : lors d'une recherche de lieu et de l'ajout d'un lieu, la position de l'appareil est envoyée au serveur mais n'est pas conservée ; pendant qu'un check-in est actif, tes coordonnées sont conservées ; lorsque le check-in devient un souvenir (après 1 heure ou dès que tu appuies sur « Je suis parti »), les coordonnées sont supprimées et il ne reste que le lieu où tu étais (détails ci-dessous, section 3).",
        'Le contenu des messages que tu envoies et reçois.',
        "Tes données d'amitié : qui tu suis, avec qui tu as échangé des demandes de discussion, qui tu as bloqué.",
        "Le jeton de notification de ton appareil, pour que nous puissions t'envoyer des notifications.",
        'Les signalements que tu as faits ou qui ont été faits à ton sujet.',
        "Les notes que tu attribues aux lieux (Mauvais / Bien / Génial). Tout le monde ne voit que les totaux ; la note que tu as donnée n'est visible que par toi. Tes photos de check-in apparaissent aussi dans l'espace photos de ce lieu, selon la règle de visibilité que tu as choisie.",
      ],
    },
    {
      baslik: '2. Dans quel but, et sur quelle base légale',
      paragraflar: [
        "L'article 10 de la KVKK exige que la base légale soit indiquée à côté de la finalité du traitement. La base de chaque finalité est indiquée séparément.",
        "Créer ton compte et vérifier ton adresse e-mail. Base légale : exécution d'un contrat (KVKK art. 5/2-c) ; sans compte, aucune fonction de l'application ne marche.",
        "Te permettre de découvrir les lieux et les personnes autour de toi (position et check-in). Base légale : exécution d'un contrat (KVKK art. 5/2-c). La seule chose que fait Slooin, c'est te laisser faire un check-in dans un lieu et voir qui s'y trouve ; sans traitement de la position, l'application ne fonctionne pas, la position n'est donc pas une « fonction en plus » mais le service lui-même.",
        "Te permettre d'envoyer des messages. Base légale : exécution d'un contrat (KVKK art. 5/2-c).",
        "Prévenir et examiner les abus (harcèlement, faux comptes, contenu inapproprié) : registres de signalements, journal d'audit de la modération, registres d'état de compte et compteurs de plafond de demandes. Base légale : intérêt légitime (KVKK art. 5/2-f) : pouvoir protéger les utilisateurs du harcèlement et des abus.",
        "Le consentement que tu donnes en appuyant sur « Continuer » à la création de ton compte est enregistré dans la base de données comme preuve : que tu as lu la notice de confidentialité et accepté le traitement de ta position, avec la version du texte et le moment du consentement (deux enregistrements : aydinlatma et konum_rizasi). Cet enregistrement ne remplace pas les bases légales ci-dessus ; il s'y ajoute pour pouvoir montrer rétrospectivement ce qui t'a été communiqué.",
      ],
    },
    {
      baslik: '3. La position en particulier',
      paragraflar: [
        "La position de ton appareil est utilisée de TROIS manières différentes ; il est important de ne pas les confondre.",
        "Lors de la recherche de lieux : pour t'afficher les lieux proches, la position de ton appareil est ENVOYÉE au serveur à chaque recherche. Cette position N'EST PAS CONSERVÉE : elle sert uniquement à répondre à cette requête et n'est écrite nulle part dans la base de données.",
        "Lors de l'ajout d'un nouveau lieu : pour vérifier que tu es vraiment près du lieu que tu veux ajouter, la position de ton appareil est envoyée (tu dois être à moins de ~200 mètres). Cette position N'EST PAS CONSERVÉE non plus : elle ne sert qu'à ce contrôle de proximité. La seule chose conservée est la position du lieu ajouté, pas la tienne à ce moment-là.",
        "Lors d'un check-in : tant que le check-in est ACTIF, tes coordonnées sont conservées. Mais c'est temporaire : le check-in devient automatiquement un souvenir après 1 HEURE (ou dès que tu appuies sur « Je suis parti »), et lors de cette transition les coordonnées sont SUPPRIMÉES (mises à null dans la base de données) ; il ne reste que le lieu où tu étais, pas les coordonnées exactes. Comme le nettoyage s'exécute toutes les 10 minutes, les coordonnées sont conservées au maximum environ 1 heure 10 minutes.",
        "Les coordonnées conservées pendant un check-in actif sont partagées selon le niveau de présence que tu as choisi pour le check-in (cela concerne le check-in EN DIRECT) : Public : PAS tout le monde dans l'application, seulement ceux qui ont un check-in en direct au même endroit à ce moment-là ou tes abonnements mutuels. Abonnés seulement : seuls tes abonnements mutuels le voient. Masqué : personne ne le voit ; le check-in reste uniquement dans ton propre historique.",
        "Une fois que le check-in est devenu un souvenir (après suppression de la position), la visibilité du souvenir est un réglage à trois niveaux SÉPARÉ, sans condition d'« être en direct au même endroit » : Public : tout le monde dans l'application le voit (comptes actifs, blocages exclus). Abonnés seulement : seuls tes abonnements mutuels le voient. Personne : toi seul le vois sur ton propre profil.",
        "Si tu choisis Masqué, personne ne voit ton identité, sauf la modération. Mais il y a une exception : tu es compté dans le compteur public « combien de personnes ici » (affluence) du lieu où tu es, INDÉPENDAMMENT de ton niveau de présence. Ton identité reste donc masquée, mais le compteur augmente avec ta présence : dans un lieu calme, quand le compteur passe de 0 à 1, quelqu'un sur place peut en déduire qu'« il y a quelqu'un ».",
      ],
    },
    {
      baslik: '4. Accès de la modération',
      paragraflar: [
        "Quand tu fais l'objet d'un signalement ou d'un examen pour soupçon d'abus, notre équipe de modération peut lire ton profil, tes check-ins et le contenu de tes messages. Cela vaut même si ton niveau de présence est masqué.",
        "Chaque accès de la modération est enregistré : qui a regardé quel enregistrement te concernant, et quand, est consigné dans un journal d'audit. Ce journal n'accepte QUE DES AJOUTS : l'enregistrement est créé côté serveur et il n'existe aucun moyen pour un modérateur de supprimer ou de modifier son propre enregistrement d'accès. L'accès n'est utilisé que dans le cadre d'un signalement ou d'un examen, pas pour une consultation au hasard. Les enregistrements sont conservés 2 ANS (voir section 6).",
        "Le jour où nous avons écrit cette ligne, le journal d'audit ne contenait aucun enregistrement : il n'y a eu aucun accès de modération jusqu'ici. Cela ne signifie pas que le mécanisme n'est pas en place ; il est installé et fonctionne, il n'a simplement pas encore été nécessaire.",
      ],
    },
    {
      baslik: "5. Transfert à l'étranger",
      paragraflar: [
        "Les serveurs de Supabase (base de données et stockage de fichiers) sont en Allemagne (région eu-central-1). Toutes tes données personnelles sont conservées hors de Turquie, à l'intérieur des frontières de l'Union européenne.",
        "Les serveurs de l'Expo Push API (envoi des notifications) sont aux États-Unis. Lors de l'envoi d'une notification, le jeton de notification de ton appareil, le destinataire et le nom de la personne à l'origine de la notification y transitent (par exemple « Deniz t'a envoyé un message »). Le texte du message n'est jamais ajouté à la notification, mais le nom d'une autre personne est aussi une donnée personnelle et fait partie de ce transfert.",
        "Le fond de carte est fourni par Apple Plans sur iOS et Google Maps sur Android. Pendant le tracé de la carte, les coordonnées de la région visible à l'écran vont à ce fournisseur ; ton identité, ton compte ou tes check-ins n'y vont pas. La version web n'a pas de vraie carte, ce transfert n'y a donc pas lieu.",
        "Base légale du transfert : les trois transferts sont nécessaires à la fourniture du service, ils reposent donc sur la même base qu'à la section 2, l'exécution du contrat ; l'envoi de notifications relève en outre de l'intérêt légitime.",
        "Nous voulons le dire ouvertement : l'article 9 de la KVKK exige, en plus de la base légale, un mécanisme de transfert pour les transferts à l'étranger (décision d'adéquation, contrat type, engagement ou consentement explicite). L'Autorité turque de protection des données n'a pas de décision d'adéquation couvrant ces pays et nous n'avons PAS non plus, à ce jour, de contrat type signé. C'est une lacune ouverte qui doit être comblée avant d'ouvrir l'application à de vrais utilisateurs. Nous préférons ne pas présenter comme existant un mécanisme qui n'existe pas.",
      ],
    },
    {
      baslik: '6. Durées de conservation',
      paragraflar: [
        "Plusieurs règles de suppression/nettoyage automatiques sont en vigueur aujourd'hui (pas une seule).",
        "Les enregistrements de suspension de compte expirés (de plus de 90 jours) sont supprimés automatiquement de la base de données chaque jour (suppression complète, sans archivage). Il n'existe pas aujourd'hui de copie de ces enregistrements ailleurs.",
        "Dans les enregistrements tenus pour calculer le plafond quotidien de demandes de suivi/discussion, les lignes de plus de 2 jours sont supprimées automatiquement chaque jour.",
        "Tes coordonnées de check-in (comme décrit à la section 3) sont supprimées automatiquement quand le check-in devient un souvenir.",
        "Les enregistrements d'accès de la modération (voir section 4) sont conservés 2 ANS. Une tâche de nettoyage exécutée chaque jour à 04h45 supprime les lignes plus anciennes. Cette règle est EN VIGUEUR aujourd'hui.",
        "Pour tes souvenirs (le reste de ton historique de check-ins), tes messages et les signalements, il n'existe pas aujourd'hui de suppression automatique complète : ils sont conservés sans limite de durée. La mise en œuvre complète du principe « ne conserver que le temps nécessaire » n'est pas encore achevée.",
        "Prévu (pas encore mis en œuvre) : suppression des signalements tranchés 1 an après la décision. Il n'existe pas aujourd'hui de tâche de suppression automatique pour les enregistrements de signalements.",
        "Si tu bloques un utilisateur : tous les messages individuels et la conversation entre vous, les demandes en attente et l'amitié sont supprimés définitivement. La suppression vaut des deux côtés et ne peut pas être annulée ; lever le blocage ne restaure pas les messages supprimés.",
        "Si tu supprimes ton compte : ton profil, tes souvenirs, tes amis et ta liste de conversations sont supprimés définitivement. Les messages que tu as envoyés ne sont pas supprimés mais ton identité d'expéditeur est détachée. Dans les signalements que tu as faits, le lien d'identité est coupé ; dans les signalements te concernant, le lien N'EST PAS coupé, l'identité visée reste dans l'enregistrement de modération. Tes photos de profil et de check-in sont supprimées du stockage.",
      ],
    },
    {
      baslik: '7. Tes droits',
      paragraflar: [
        "Tu peux geler ton compte. Tes données ne sont pas supprimées, tu deviens invisible ; quand tu te reconnectes, ton compte redevient actif de lui-même.",
        "Tu peux supprimer ton compte définitivement. Il n'y a pas de retour possible ; si tu veux revenir, tu dois créer un compte à partir de zéro.",
        "Tu peux télécharger une copie de tes données : Réglages > Télécharger mes données. Le fichier est préparé au format JSON et fourni via un lien valable 24 heures ; à l'expiration, le fichier devient inaccessible et tu peux le télécharger à nouveau.",
        "Ce qui N'EST PAS dans le fichier : les signalements faits à ton sujet (parce qu'ils portent l'identité du signalant), le journal d'audit de la modération, qui t'a bloqué et le texte des messages que tu as reçus. Pour les messages reçus, seuls figurent avec qui, combien de messages et la date du dernier : les phrases de l'autre côté d'une conversation sont les données de cette personne.",
        "LE FICHIER QUE TU TÉLÉCHARGES, C'EST TOI QUI LE PROTÈGES. Il contient tout ce qui se trouve dans ton compte, y compris ton historique de positions ; la personne à qui tu le donnes voit tout.",
        "Voie de recours : tu peux adresser tes demandes à destek@slooin.com ; ta demande reçoit une réponse dans un délai maximal de 30 jours.",
      ],
    },
  ],
  kosullar: [
    {
      baslik: '1. Parties',
      paragraflar: [
        "Le responsable du traitement et l'exploitant de ce service (Slooin) est Orçun Özdemir, en tant que personne physique. Ce document constitue le contrat entre l'exploitant et toute personne qui utilise l'application Slooin.",
      ],
    },
    {
      baslik: "2. Limite d'âge",
      paragraflar: [
        "Slooin est réservé aux utilisateurs ayant 18 ans révolus. Une personne de moins de 18 ans ne peut pas créer de compte. Il n'existe pas d'usage restreint avec l'accord des parents ; Slooin s'adresse à un seul public, les utilisateurs adultes.",
      ],
    },
    {
      baslik: '3. Compte',
      paragraflar: [
        "Une personne ne peut créer qu'un seul compte.",
        "Ton nom d'utilisateur est unique et doit respecter un format précis (minuscules, chiffres, point et tiret bas ; 3 à 20 caractères). Tu peux changer ton nom d'utilisateur une fois tous les 30 jours.",
        "La confidentialité du mot de passe que tu définis pour ton compte relève de ta responsabilité. Tu es responsable des actions effectuées sur ton compte si tu partages ton mot de passe ou ne le gardes pas en sécurité.",
      ],
    },
    {
      baslik: '4. Position',
      paragraflar: [
        "Pour que Slooin fonctionne, ta position est nécessaire : découvrir les lieux proches, ajouter un lieu et faire un check-in reposent sur l'accès à la position. Le check-in est ton propre geste : tant que tu ne veux pas partager dans quel lieu tu es, l'application ne te montre pas automatiquement aux autres utilisateurs. La manière dont ta position est traitée et sa durée de conservation sont expliquées en détail dans la Politique de confidentialité.",
      ],
    },
    {
      baslik: '5. Comportements interdits',
      paragraflar: [
        "En utilisant Slooin, sont interdits : le harcèlement, les menaces ou tout comportement qui gêne un autre utilisateur ; la création de faux comptes ou l'usurpation d'identité ; le partage de la position d'une autre personne hors de l'application sans son consentement ; l'envoi de messages en masse à des fins commerciales (spam).",
        "Si l'un de ces comportements est constaté, les sanctions de modération de la section 7 s'appliquent.",
      ],
    },
    {
      baslik: '6. Contenu',
      paragraflar: [
        "La note et la photo que tu ajoutes à un check-in t'appartiennent. En les partageant, tu accordes à Slooin l'autorisation d'afficher ce contenu dans l'application (dans le fil, sur ton profil, sur la page du lieu concerné). La propriété du contenu reste la tienne.",
      ],
    },
    {
      baslik: '7. Modération',
      paragraflar: [
        "À la suite d'un signalement, ton contenu (note de check-in, photo ou commentaire) peut être masqué. En cas d'infractions répétées ou graves, ton compte peut être suspendu temporairement ou banni définitivement. Si tu veux contester une décision de modération, tu peux nous joindre à destek@slooin.com.",
      ],
    },
    {
      baslik: '8. Fermeture du compte',
      paragraflar: [
        "Tu peux geler ton compte à tout moment : tes données ne sont pas supprimées, et quand tu te reconnectes, ton compte redevient actif de lui-même.",
        "Tu peux supprimer ton compte définitivement. Cette action est irréversible ; si tu veux réutiliser l'application, tu dois créer un compte à partir de zéro. Ce qui est supprimé et ce qui reste (anonymisé) lors de la suppression est expliqué dans la Politique de confidentialité.",
      ],
    },
    {
      baslik: '9. Limitation de responsabilité',
      paragraflar: [
        "Slooin est un outil qui facilite le partage d'un même environnement entre utilisateurs via les check-ins. L'exploitant n'est pas responsable des conséquences des rencontres ou des interactions entre utilisateurs.",
        "Les données de lieux de l'application (nom, position, type) proviennent de sources tierces (Foursquare et OpenStreetMap) et peuvent être erronées. Ce n'est pas une clause abstraite : la base de données contient de vrais enregistrements où le même lieu apparaît plusieurs fois avec de mauvaises coordonnées ; par exemple, il existe des enregistrements distincts nommés « Galata Kulesi » à Çekmeköy, Silivri et Büyükçekmece. Tu dois faire ta propre évaluation avant de tenir pour exacts le nom, la position ou le type d'un lieu.",
      ],
    },
    {
      baslik: '10. Modifications',
      paragraflar: ["Si ces conditions changent, la modification est annoncée dans l'application."],
    },
    {
      baslik: '11. Droit applicable',
      paragraflar: ['Ces conditions sont soumises au droit de la République de Turquie.'],
    },
  ],
}

export default fr
