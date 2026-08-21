import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'

// On planda (uygulama acikken) gelen bildirimin banner ve sesle
// gosterilmesi. Modul yuklenirken bir kez ayarlanir. Rozet sayisi
// senkronu bu fazda kapsam disi (shouldSetBadge: false).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Edge Function'in bildirim data'sinda tasidigi olay turleri.
type BildirimData = {
  tur?: string
  kullaniciId?: string
}

// Web'de push yok; gercek cihaz olmayan ortamda (emulator/simulator)
// jeton alinamaz. Iki fonksiyonun ortak on kosulu.
function calisabilirMi(): boolean {
  return Platform.OS !== 'web' && Device.isDevice
}

// data.tur'e gore uygulama ici rota uretir. Bilinmeyen tur ya da hic
// data tasimayan (uygulamanin Edge Function'i disindan gelen, bozuk)
// bildirim icin null doner (yonlendirme yapilmaz).
function rotaUret(data: BildirimData | undefined | null): string | null {
  if (!data) return null
  if (data.tur === 'mesaj' && data.kullaniciId) {
    return `/sohbet/${data.kullaniciId}`
  }
  if (
    data.tur === 'takip_istegi' ||
    data.tur === 'takip_kabul' ||
    data.tur === 'sohbet_istegi' ||
    data.tur === 'sohbet_kabul'
  ) {
    return '/baglar'
  }
  return null
}

// Giris sonrasi ve her acilista cagrilir. Bildirim kurulumunun hicbir
// adimi uygulamayi dusurmemeli: her sey sessizce yutulur.
//   1. web'de push yok -> sessizce don
//   2. gercek cihaz degilse (emulator/simulator) -> don
//   3. izin yoksa iste; reddedilirse -> don (kullaniciyi zorlama)
//   4. Expo push jetonunu al
//   5. jeton_kaydet RPC'siyle sunucuya yaz
export async function bildirimleriBaslat(_kullaniciId: string): Promise<void> {
  try {
    if (!calisabilirMi()) return

    const mevcut = await Notifications.getPermissionsAsync()
    let izinVar = mevcut.granted
    if (!izinVar) {
      const istek = await Notifications.requestPermissionsAsync()
      izinVar = istek.granted
    }
    if (!izinVar) return

    const jetonSonucu = await Notifications.getExpoPushTokenAsync()
    const jeton = jetonSonucu.data
    if (!jeton) return

    const platform = Platform.OS === 'ios' ? 'ios' : 'android'
    await supabase.rpc('jeton_kaydet', { p_jeton: jeton, p_platform: platform })
  } catch {
    // Bildirim kurulumu basarisizligi uygulamayi asla dusurmez.
  }
}

// Cikista cagrilir. Cihazin jetonunu alip sunucudan siler. Jeton
// alinamazsa ya da RPC patlarsa sessizce gecer; mukerrer cagri zararsiz.
export async function bildirimJetonunuSil(): Promise<void> {
  try {
    if (!calisabilirMi()) return

    const jetonSonucu = await Notifications.getExpoPushTokenAsync()
    const jeton = jetonSonucu.data
    if (!jeton) return

    await supabase.rpc('jeton_sil', { p_jeton: jeton })
  } catch {
    // Cikis akisini bildirim hatasi bloklamaz.
  }
}

// Bildirime dokununca ilgili ekrana yonlendirme. Dinleyiciyi kaldiran
// fonksiyonu dondurur (cleanup). Web'de dinleyici kurulmaz.
export function bildirimeDokunmaDinle(yonlendir: (rota: string) => void): () => void {
  if (Platform.OS === 'web') return () => {}

  const abonelik = Notifications.addNotificationResponseReceivedListener((olay) => {
    // Savunma: bozuk/eksik bildirim data'si dinleyiciyi (dolayisiyla
    // uygulamayi) dusurmemeli.
    try {
      const data = olay.notification.request.content.data as BildirimData | undefined
      const rota = rotaUret(data)
      if (rota) yonlendir(rota)
    } catch {
      // Yonlendirme hatasi yutulur.
    }
  })

  return () => abonelik.remove()
}
