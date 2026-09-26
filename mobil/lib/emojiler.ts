/**
 * STANDART EMOJI SETI (2026-09-26, kullanicinin istegi: "anliklarin
 * altindaki ifade setini standart emoji seti yap"). Anliga birakilan
 * tepki icin; sistem emoji fontuyla cizilir (gorsel dosya yok).
 * Kategori adlari sozlukte `emoji.<kategori>`.
 */
export type EmojiKategorisi = 'yuzler' | 'kalpler' | 'eller' | 'kutlama' | 'yemek' | 'doga' | 'aktivite' | 'seyahat'

export const EMOJI_KATEGORILERI: { slug: EmojiKategorisi; emojiler: string[] }[] = [
  {
    slug: 'yuzler',
    emojiler: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰',
      '😘', '😋', '😛', '😜', '🤪', '😎', '🤩', '🥳', '😏', '😒', '😔', '😢', '😭', '😤', '😠', '😡',
      '🤯', '😳', '🥺', '😱', '😨', '🤗', '🤔', '🫢', '🤭', '😶', '😐', '🙄', '😬', '😴', '🤤', '😮',
    ],
  },
  {
    slug: 'kalpler',
    emojiler: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  },
  {
    slug: 'eller',
    emojiler: ['👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👋', '💪', '🫶', '👀', '💯'],
  },
  {
    slug: 'kutlama',
    emojiler: ['🎉', '🎊', '🥂', '🍾', '🎂', '🎁', '🎈', '✨', '🔥', '⭐', '🌟', '💫', '🏆', '🥇', '🎶', '📸'],
  },
  {
    slug: 'yemek',
    emojiler: ['☕', '🍵', '🧋', '🍺', '🍷', '🍹', '🍕', '🍔', '🍟', '🌮', '🍣', '🍝', '🥗', '🍰', '🍩', '🍦', '🍫', '🍓'],
  },
  {
    slug: 'doga',
    emojiler: ['☀️', '🌤️', '🌧️', '⛈️', '❄️', '🌈', '🌙', '🌊', '🌸', '🌻', '🌿', '🍂', '🐶', '🐱', '🦋', '🐦'],
  },
  {
    slug: 'aktivite',
    emojiler: ['⚽', '🏀', '🎾', '🏐', '🏃', '🚴', '🏊', '🧘', '🎮', '🎬', '🎤', '🎧', '📚', '🎨', '💃', '🕺'],
  },
  {
    slug: 'seyahat',
    emojiler: ['📍', '🗺️', '✈️', '🚗', '🚲', '🚆', '⛴️', '🏖️', '🏔️', '🏙️', '🌆', '🏛️', '⛺', '🎡', '🏠', '🧳'],
  },
]
