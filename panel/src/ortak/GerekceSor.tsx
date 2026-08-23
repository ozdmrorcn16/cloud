import { useState } from 'react'

type Props = {
  baslik: string
  aciklama?: string
  eylemEtiketi: string
  /** Yikici eylemlerde ayri bir onay adimi cikar. */
  onayGerekli?: boolean
  onayMetni?: string
  onIptal: () => void
  onSonuc: (gerekce: string) => Promise<void> | void
}

/**
 * Gerekce isteyen kalip. Sunucu zaten en az 3 karakter gerekce zorluyor
 * (moderasyon RPC'leri); burasi o kuralin arayuz karsiligi ve
 * moderatorun ne yaptigini bilerek yapmasini sagliyor.
 *
 * Yikici eylemlerde (askiya alma, yasaklama, gizleme, tum konusmayi
 * acma) `onayGerekli` ile ikinci bir adim eklenir: gerekce yazmak tek
 * basina yeterli degil, ayrica onaylamak gerekir.
 */
export function GerekceSor({
  baslik,
  aciklama,
  eylemEtiketi,
  onayGerekli = false,
  onayMetni,
  onIptal,
  onSonuc,
}: Props) {
  const [gerekce, setGerekce] = useState('')
  const [onaylandi, setOnaylandi] = useState(false)
  const [calisiyor, setCalisiyor] = useState(false)

  const gerekceYeterli = gerekce.trim().length >= 3
  const gonderilebilir = gerekceYeterli && (!onayGerekli || onaylandi) && !calisiyor

  async function gonder() {
    if (!gonderilebilir) return
    setCalisiyor(true)
    try {
      await onSonuc(gerekce.trim())
    } finally {
      setCalisiyor(false)
    }
  }

  return (
    <div className="kaplama">
      <div className="kutu">
        <h3>{baslik}</h3>
        {aciklama && <p className="kutu-aciklama">{aciklama}</p>}

        <label htmlFor="gerekce">Gerekçe (denetim izine yazılır)</label>
        <textarea
          id="gerekce"
          value={gerekce}
          onChange={(e) => setGerekce(e.target.value)}
          rows={3}
          placeholder="Bu erişimin ya da işlemin sebebi"
        />
        {!gerekceYeterli && gerekce.length > 0 && (
          <p className="ipucu">En az 3 karakter yaz.</p>
        )}

        {onayGerekli && (
          <label className="onay">
            <input
              type="checkbox"
              checked={onaylandi}
              onChange={(e) => setOnaylandi(e.target.checked)}
            />
            {onayMetni ?? 'Bu işlemi yapmak istediğimi onaylıyorum.'}
          </label>
        )}

        <div className="kutu-dugmeler">
          <button type="button" onClick={onIptal} disabled={calisiyor}>
            Vazgeç
          </button>
          <button
            type="button"
            className="birincil"
            onClick={gonder}
            disabled={!gonderilebilir}
          >
            {calisiyor ? 'Çalışıyor…' : eylemEtiketi}
          </button>
        </div>
      </div>
    </div>
  )
}
