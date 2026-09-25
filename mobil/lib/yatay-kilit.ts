/**
 * YATAY KILIT (2026-09-24): ana sekmeler arasi sag/sol kaydirma
 * (`SekmeKaydirma`) ile kendi yatay hareketi olan ogeler (harita, anlik
 * seridi, fotograf serisi, mesaj satirindaki "Sil" kaydirmasi, tur
 * cipleri) cakismasin diye. Bu ogeler dokunus BASLARKEN kilidi alir,
 * dokunus bitince birakir; sekme kaydirmasi kilit aliniyken baslamaz.
 *
 * RN `onTouchStart` gesture-handler'in etkinlesmesinden ONCE gelir
 * (parmak degdigi an), yani karar zamaninda kilit dogru okunur. Iki
 * platformda ayni calisir; native kaydirma gorunumlerinin RNGH ile
 * etkilesimine guvenmekten daha ongorulebilir.
 */
let sayac = 0

export function yatayKilitliMi(): boolean {
  return sayac > 0
}

/** Yatay ogenin koku `{...yatayAlan}` ile bu olaylari tasir. */
export const yatayAlan = {
  onTouchStart: () => {
    sayac += 1
  },
  onTouchEnd: () => {
    sayac = Math.max(0, sayac - 1)
  },
  onTouchCancel: () => {
    sayac = Math.max(0, sayac - 1)
  },
}

/** Testler icin: sayaci sifirla. */
export function yatayKilidiSifirla() {
  sayac = 0
}
