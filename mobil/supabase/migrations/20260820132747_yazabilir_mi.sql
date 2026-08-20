-- Yazma kapisi TEK yerde. Her mesajda cagriliyor, konusma acilirken bir
-- kez degil (karar 45): bag koparsa konusma salt-okunur olur.
--
-- `bag` semasinda, `public`te DEGIL: public'teki her fonksiyonu PostgREST
-- istemciye RPC olarak sunar.
create or replace function bag.yazabilir_mi(p_hedef uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    -- 1) Engelli iliski her seyin onunde (iki yonlu).
    not gizli.engelli_mi(p_hedef)
    and (
      -- 2) Karsilikli takip. IKI YON DE ayri ayri soruluyor: kabul zaten
      --    iki satiri da yaziyor, yani tek kontrol yeterli olurdu. Ama
      --    basibos bir tek yonlu satir (eski veri, ileride bir hata) o
      --    durumda sessizce "bagli" sayilirdi. Iki yon sormak bunu veri
      --    hatasi olarak birakir, guvenlik hatasina donusturmez.
      (
        bag.takip_ediyor_mu(auth.uid(), p_hedef)
        and bag.takip_ediyor_mu(p_hedef, auth.uid())
      )
      -- 3) Ya da kabul edilmis sohbet istegi (iki yonden biri).
      or exists (
        select 1 from public.sohbet_istekleri s
        where s.durum = 'kabul'
          and (
            (s.gonderen_id = auth.uid() and s.alan_id = p_hedef)
            or (s.gonderen_id = p_hedef and s.alan_id = auth.uid())
          )
      )
    );
$$;

grant execute on function bag.yazabilir_mi(uuid) to authenticated;
