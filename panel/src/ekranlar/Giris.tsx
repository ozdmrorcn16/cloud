import { useState } from 'react'
import { supabase } from '../supabase'
import { Hata, hataMetni } from '../ortak/Durum'

type Adim = 'parola' | 'kod'

/**
 * Panel girisi iki asamalidir: parola, ardindan TOTP kodu. Ikinci
 * faktor olmadan alinan oturum `aal1` seviyesindedir ve hicbir
 * moderator RPC'sini cagiramaz - bu kural veritabaninda zorlanir
 * (moderasyon.yetkili_mi), yani bu ekrani atlamak bir sey degistirmez.
 *
 * Ilk kurulumda TOTP kaydi da burada yapilir: enroll bir QR uretir,
 * moderator onu dogrulayici uygulamasina ekler ve ilk kodu girer.
 *
 * KIMLIK E-POSTADIR, telefon degil. Spec karar 56 "kendi telefon
 * numarasi" diyordu ama Supabase'in TOTP'si QR uretirken hesap adi
 * olarak e-postayi kullaniyor; telefon-only hesapta enroll
 * "AccountName must be set" ile 500 doner (auth loglarinda dogrulandi).
 */
export function Giris({ onGirildi }: { onGirildi: () => void }) {
  const [adim, setAdim] = useState<Adim>('parola')
  const [eposta, setEposta] = useState('')
  const [parola, setParola] = useState('')
  const [kod, setKod] = useState('')
  const [faktorId, setFaktorId] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  async function girisYap() {
    setHata(null)
    setCalisiyor(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: eposta.trim(),
        password: parola,
      })
      if (error) {
        setHata(error.message)
        return
      }
      await mfaDurumunuOku()
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setCalisiyor(false)
    }
  }

  async function mfaDurumunuOku() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setHata(error.message)
      return
    }

    const dogrulanmis = data?.totp?.find((f) => f.status === 'verified')
    if (dogrulanmis) {
      setFaktorId(dogrulanmis.id)
      setAdim('kod')
      return
    }

    // Ilk kurulum: yeni bir TOTP faktoru olustur ve QR goster.
    const { data: kayit, error: kayitHatasi } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    })
    if (kayitHatasi) {
      setHata(kayitHatasi.message)
      return
    }
    setFaktorId(kayit.id)
    setQr(kayit.totp.qr_code)
    setAdim('kod')
  }

  async function koduDogrula() {
    if (!faktorId) return
    setHata(null)
    setCalisiyor(true)
    try {
      const { data: meydan, error: meydanHatasi } =
        await supabase.auth.mfa.challenge({ factorId: faktorId })
      if (meydanHatasi) {
        setHata(meydanHatasi.message)
        return
      }

      const { error } = await supabase.auth.mfa.verify({
        factorId: faktorId,
        challengeId: meydan.id,
        code: kod.trim(),
      })
      if (error) {
        setHata(error.message)
        return
      }

      // Oturum artik aal2. Moderator olup olmadigini SUNUCU soyler;
      // panelin kendi karari degil.
      const { data: yetkili } = await supabase.rpc('moderator_muyum')
      if (yetkili !== true) {
        setHata('Bu hesap moderatör değil.')
        await supabase.auth.signOut()
        setAdim('parola')
        return
      }

      onGirildi()
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setCalisiyor(false)
    }
  }

  return (
    <div className="giris-sayfa">
      <div className="giris">
        <div className="marka">
          <span className="marka-isaret" aria-hidden>S</span> Slooin
        </div>
        <h1>Moderasyon paneli</h1>
        <p className="alt">
          {adim === 'parola'
            ? 'Yalnızca moderatör hesapları. Her erişim denetim izine yazılır.'
            : 'İkinci adım: doğrulayıcı uygulamandaki altı haneli kod.'}
        </p>

        {adim === 'parola' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              girisYap()
            }}
          >
            <label className="alan" htmlFor="eposta">E-posta</label>
            <input
              id="eposta"
              type="email"
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              placeholder="moderator@slooin.com"
              autoComplete="username"
              autoFocus
            />

            <label className="alan" htmlFor="parola">Parola</label>
            <input
              id="parola"
              type="password"
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              autoComplete="current-password"
            />

            <button type="submit" className="birincil genis" disabled={calisiyor}>
              {calisiyor ? 'Giriş yapılıyor…' : 'Devam et'}
            </button>
          </form>
        )}

        {adim === 'kod' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              koduDogrula()
            }}
          >
            {qr && (
              <div className="qr">
                <p>
                  Bu hesap için ilk kurulum. Kodu doğrulayıcı uygulamana
                  (Google Authenticator, 1Password…) ekle, sonra ürettiği
                  altı haneli kodu gir.
                </p>
                <img src={qr} alt="TOTP kurulum kodu" />
              </div>
            )}

            <label className="alan" htmlFor="kod">Doğrulama kodu</label>
            <input
              id="kod"
              value={kod}
              onChange={(e) => setKod(e.target.value)}
              inputMode="numeric"
              placeholder="123456"
              autoComplete="one-time-code"
              autoFocus
            />

            <button type="submit" className="birincil genis" disabled={calisiyor}>
              {calisiyor ? 'Doğrulanıyor…' : 'Giriş yap'}
            </button>
          </form>
        )}

        <Hata mesaj={hata} />
      </div>
    </div>
  )
}
