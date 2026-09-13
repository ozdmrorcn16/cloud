import type { HukukiMetin } from './tur'

// Ingilizce ceviri. Kaynak: tr.ts - Turkce metin esastir.
const en: HukukiMetin = {
  gizlilik: [
    {
      baslik: 'Data controller',
      paragraflar: [
        'The data controller of this app is Orçun Özdemir, a natural person. You can send your requests under the Turkish Personal Data Protection Law (KVKK) to destek@slooin.com; your request is answered within 30 days at the latest.',
      ],
    },
    {
      baslik: '1. Which of your data we process',
      paragraflar: [
        'Your e-mail address - today the PRIMARY identifier of your account. It is used when you sign up and sign in, and the verification code is sent there.',
        'Your name, username, date of birth, bio and profile photos.',
        'Your location - in three different ways: when you search for a place or add a place, your device location is sent to the server but not stored; while a check-in is active your coordinates are stored; when the check-in turns into a memory (after 1 hour or as soon as you tap "I left") the coordinates are deleted and only the place you were at remains (full details below, in section 3).',
        'The content of the messages you send and receive.',
        'Your friendship data: whom you follow, whom you exchanged chat requests with, whom you blocked.',
        "Your device's notification token, so that we can send you notifications.",
        'Reports you filed or reports filed about you.',
        'The ratings you give to places (Bad / Good / Great). Everyone sees only the totals; which rating you gave is visible only to you. Your check-in photos also appear in the photo area of that place, under the visibility rule you chose.',
      ],
    },
    {
      baslik: '2. For what purpose - and on which legal basis',
      paragraflar: [
        'KVKK article 10 requires the legal basis to be stated alongside the purpose of processing. The basis of each purpose is written separately.',
        'Setting up your account and verifying your e-mail address. Legal basis: performance of a contract (KVKK art. 5/2-c) - without an account no function of the app works.',
        'Letting you discover places and people nearby (location and check-in). Legal basis: performance of a contract (KVKK art. 5/2-c). The only thing Slooin does is let you check in to a place and see who is there; without processing location the app does not work, so location is not an "extra feature" but the service itself.',
        'Letting you message. Legal basis: performance of a contract (KVKK art. 5/2-c).',
        'Preventing and investigating abuse (harassment, fake accounts, inappropriate content) - report records, the moderation audit trail, account status records and request-cap counters. Legal basis: legitimate interest (KVKK art. 5/2-f): being able to protect users from harassment and abuse.',
        'The consent you give by tapping "Continue" when creating your account is written to the database as a record of proof: that you read the privacy notice and accepted the processing of your location data, together with the text version and the time of consent (two records: aydinlatma and konum_rizasi). This record does not replace the legal bases above - it is kept on top of them so that we can show retrospectively what was disclosed to you.',
      ],
    },
    {
      baslik: '3. Location in particular',
      paragraflar: [
        "Your device's location is used in THREE different ways; it is important not to mix them up.",
        'When searching for places: to show places nearby, your device location is SENT to the server with every place search. This location is NOT STORED - it is used only to answer that query and is not written anywhere in the database.',
        'When adding a new place: to verify that you are really near the place you want to add, your device location is sent (you must be within ~200 metres). This location is NOT STORED either - it is used only for this proximity check. The only thing stored is the location of the added place, not your location at that moment.',
        'When you check in: while the check-in is ACTIVE your coordinates are stored. But this is temporary: the check-in automatically turns into a memory after 1 HOUR (or as soon as you tap "I left"), and in that transition the coordinates are DELETED (set to null in the database) - only the place you were at remains, not the exact coordinates. Because the clean-up job runs every 10 minutes, coordinates are kept for at most about 1 hour 10 minutes.',
        'The coordinates stored while a check-in is active are shared according to the presence level you chose for the check-in (this applies to a LIVE check-in): Public - NOT everyone in the app, only those who have a live check-in at the same place at that moment or your mutual follows see it. Followers only - only your mutual follows see it. Hidden - nobody sees it; the check-in stays only in your own history.',
        'After the check-in turns into a memory (after the location is deleted), the visibility of the memory is a SEPARATE three-level setting and there is no "live at the same place" condition: Public - everyone in the app sees it (active accounts, blocking excluded). Followers only - only your mutual follows see it. Nobody - only you see it on your own profile.',
        'When you choose Hidden, your identity is visible to nobody - except moderation. But there is one exception: you are included in the public "how many people are here" counter (density) of the place you are at, REGARDLESS of your presence level. So your identity stays hidden, but the counter increases with your presence - in a quiet place, when the counter goes from 0 to 1, someone there can infer that "somebody is here".',
      ],
    },
    {
      baslik: '4. Moderation access',
      paragraflar: [
        'When you receive a report or are being reviewed on suspicion of abuse, our moderation team can read your profile, your check-ins and your message contents. This applies even if your presence level is hidden.',
        'Every moderation access is recorded: who looked at which of your records, and when, is kept in an audit trail. This trail accepts ONLY ADDITIONS - the record is created server-side, and there is no way for a moderator to delete or alter their own access record. Access is used only in the context of a report or a review, not for casual browsing. Records are kept for 2 YEARS (see section 6).',
        'On the day we wrote this line the audit trail contained no records - there has been no moderator access so far. This does not mean the mechanism is not in place; it is set up and working, it has simply not been needed yet.',
      ],
    },
    {
      baslik: '5. Transfer abroad',
      paragraflar: [
        'The servers of Supabase (database and file storage) are in Germany (eu-central-1 region). All your personal data is kept outside Turkey, within the borders of the European Union.',
        "The servers of the Expo Push API (notification delivery) are in the United States of America. When a notification is sent, your device's notification token, whom it is sent to, and the name of the person who triggered the notification pass through here (for example 'Deniz sent you a message'). The text of the message is never added to the notification, but another person's name is also personal data and is part of this transfer.",
        'The map base is provided by Apple Maps on iOS and Google Maps on Android. While the map is drawn, the coordinates of the region visible on screen go to this provider; your identity, account or check-ins do not. The web version has no real map, so this transfer does not happen there.',
        'Legal basis of the transfer: all three transfers are necessary to provide the service, so they rest on the same basis as in section 2 - performance of a contract; notification delivery additionally falls under legitimate interest.',
        'We want to say this openly: KVKK article 9 requires, besides a legal basis, a transfer mechanism for transfers abroad (an adequacy decision, standard contract, undertaking or explicit consent). The Personal Data Protection Board has no adequacy decision covering these countries and we do NOT have a signed standard contract today either. This is an open gap that must be closed before the app is opened to real users. We prefer not to present a mechanism that does not exist as if it did.',
      ],
    },
    {
      baslik: '6. Retention periods',
      paragraflar: [
        'There is more than one automatic deletion/clean-up rule in force today (not a single rule).',
        'Expired (older than 90 days) account suspension records are automatically deleted from the database every day (full deletion, not archived). There is no copy of these records kept elsewhere today.',
        'In the records kept to compute the daily cap on follow/chat requests, rows older than 2 days are automatically deleted every day.',
        'Your check-in coordinates (as described in section 3) are deleted automatically when the check-in turns into a memory.',
        'Moderation access records (see section 4) are kept for 2 YEARS. A clean-up job running every day at 04:45 deletes rows older than that. This rule is IN FORCE today.',
        'There is no complete automatic deletion today for your memories (the rest of your check-in history), your messages and reports - they are kept indefinitely. The full counterpart of the "keep only as long as necessary" principle is not yet complete.',
        'Planned (not yet implemented): deleting decided reports 1 year after the decision. There is no automatic deletion job for report records today.',
        'If you block a user: all one-to-one messages and the conversation between you, pending requests and the friendship are permanently deleted. Deletion applies on both sides and cannot be undone; unblocking does not bring the deleted messages back.',
        'If you delete your account: your profile, memories, friends and conversation list are permanently deleted. Messages you sent are not deleted but your sender identity is detached. In reports you filed the identity link is cut; in reports filed about you the identity link is NOT cut, the target identity stays in the moderation record. Your profile and check-in photos are deleted from storage.',
      ],
    },
    {
      baslik: '7. Your rights',
      paragraflar: [
        'You can freeze your account. Your data is not deleted, you become invisible; when you sign in again your account becomes active by itself.',
        'You can delete your account permanently. There is no way back; if you want to return you must create an account from scratch.',
        'You can download a copy of your data: Settings > Download my data. The file is prepared in JSON format and delivered with a link valid for 24 hours; when it expires the file becomes inaccessible and you can download again.',
        "What is NOT in the file: reports filed about you (because they carry the reporter's identity), the moderation audit trail, who blocked you, and the text of messages sent to you. For messages sent to you only with whom, how many messages and when the last one was is included - the sentences on the other side of a conversation are that person's data.",
        'YOU PROTECT THE FILE YOU DOWNLOAD. It contains everything in your account, including your location history; whoever you share it with sees all of it.',
        'How to apply: you can send your requests to destek@slooin.com; your request is answered within 30 days at the latest.',
      ],
    },
  ],
  kosullar: [
    {
      baslik: '1. Parties',
      paragraflar: [
        'The data controller and operator of this service (Slooin) is Orçun Özdemir, a natural person. This document constitutes the agreement between the operator and everyone who uses the Slooin app.',
      ],
    },
    {
      baslik: '2. Age limit',
      paragraflar: [
        'Slooin is only for users who have turned 18. A person under 18 cannot create an account. There is no restricted form of use with parental consent; Slooin addresses a single audience, adult users.',
      ],
    },
    {
      baslik: '3. Account',
      paragraflar: [
        'One person may create only one account.',
        'Your username is unique and must follow a specific format (lowercase letters, digits, dot and underscore; 3-20 characters). You can change your username once every 30 days.',
        'Keeping the password you set for your account confidential is your responsibility. You are responsible for actions taken in your account if you share your password or fail to keep it secure.',
      ],
    },
    {
      baslik: '4. Location',
      paragraflar: [
        'Slooin needs your location to work: discovering places nearby, adding a place and checking in rely on location access. A check-in is your own action - unless you want to share which place you are at, the app does not automatically show you to other users. How your location is processed and how long it is kept is explained in detail in the Privacy Policy.',
      ],
    },
    {
      baslik: '5. Prohibited behaviour',
      paragraflar: [
        "The following are prohibited while using Slooin: harassment, threats or any behaviour that disturbs another user; creating fake accounts or impersonating someone; sharing another person's location outside the app without their consent; sending bulk messages for commercial purposes (spam).",
        'If one of these behaviours is detected, the moderation sanctions in section 7 apply.',
      ],
    },
    {
      baslik: '6. Content',
      paragraflar: [
        'You own the note and photo you add to a check-in. By sharing them you grant Slooin permission to display that content inside the app (in the feed, on your profile, on the related place page). Ownership of the content stays with you.',
      ],
    },
    {
      baslik: '7. Moderation',
      paragraflar: [
        'Upon a report, your content (check-in note, photo or comment) may be hidden. In case of repeated or serious violations your account may be temporarily suspended or permanently banned. If you want to object to a moderation decision you can reach us at destek@slooin.com.',
      ],
    },
    {
      baslik: '8. Closing your account',
      paragraflar: [
        'You can freeze your account at any time: your data is not deleted, and when you sign in again your account becomes active again by itself.',
        'You can delete your account permanently. This cannot be undone; if you want to use the app again you must create an account from scratch. What is deleted and what remains (anonymised) during deletion is explained in the Privacy Policy.',
      ],
    },
    {
      baslik: '9. Limitation of liability',
      paragraflar: [
        'Slooin is a tool that makes it easier for users to share the same environment through check-ins. The operator is not responsible for the consequences of users meeting or interacting with each other.',
        'The place data in the app (name, location, type) comes from third-party sources (Foursquare and OpenStreetMap) and may be wrong. This is not an abstract disclaimer: the database contains real records where the same place appears more than once with wrong coordinates - for example there are separate records named "Galata Kulesi" in Çekmeköy, Silivri and Büyükçekmece. You should make your own assessment before treating the name, location or type of a place as correct.',
      ],
    },
    {
      baslik: '10. Changes',
      paragraflar: ['If these terms change, the change is announced inside the app.'],
    },
    {
      baslik: '11. Governing law',
      paragraflar: ['These terms are subject to the law of the Republic of Turkey.'],
    },
  ],
}

export default en
