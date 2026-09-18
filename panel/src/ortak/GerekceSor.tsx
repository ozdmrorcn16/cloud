import { useEffect, useRef, useState } from 'react'
import { Pencere } from './Durum'

type Props = {
  baslik: string
  aciklama?: string
  eylemEtiketi: string
  /** Yikici eylemlerde ayri bir onay adimi cikar ve dugme kirmizi olur. */
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
 * basina yeterli degil, ayrica onaylamak gerekir. Dugme de kirmizi -
 * birincil turuncuyla ayni gorunmesin, refleksle basilmasin.
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
  const alan = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    alan.current?.focus()
  }, [])

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
    <Pencere baslik={baslik} aciklama={aciklama} onKapat={calisiyor ? () => {} : onIptal}>
      <label className="alan" htmlFor="gerekce">Gerekçe · denetim izine yazılır</label>
      <textarea
        id="gerekce"
        ref={alan}
        value={gerekce}
        onChange={(e) => setGerekce(e.target.value)}
        rows={3}
        placeholder="Bu erişimin ya da işlemin sebebi"
      />
      {!gerekceYeterli && gerekce.length > 0 ? (
        <p className="ipucu hata">En az 3 karakter yaz.</p>
      ) : (
        <p className="ipucu">Gerekçe, kaydın yanında moderatör kimliğinle birlikte kalıcı olarak saklanır.</p>
      )}

      {onayGerekli && (
        <label className="onay-satiri">
          <input
            type="checkbox"
            checked={onaylandi}
            onChange={(e) => setOnaylandi(e.target.checked)}
          />
          <span>{onayMetni ?? 'Bu işlemi yapmak istediğimi onaylıyorum.'}</span>
        </label>
      )}

      <div className="pencere-dugmeler">
        <button type="button" className="hayalet" onClick={onIptal} disabled={calisiyor}>
          Vazgeç
        </button>
        <button
          type="button"
          className={onayGerekli ? 'yikici' : 'birincil'}
          onClick={gonder}
          disabled={!gonderilebilir}
        >
          {calisiyor ? 'Çalışıyor…' : eylemEtiketi}
        </button>
      </div>
    </Pencere>
  )
}
