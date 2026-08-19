"""YouTube'a yukleme saglayicilari."""

from __future__ import annotations

import json
from pathlib import Path

from ..arac import AracHatasi
from ..ayarlar import Ayarlar
from ..gunluk import gunlukcu
from ..modeller import Uretim

KAYIT = gunlukcu("otomasyon.yukleme")

KAPSAMLAR = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
]
TOKEN_URI = "https://oauth2.googleapis.com/token"


class Yukleyici:
    ad = "temel"

    def __init__(self, ayarlar: Ayarlar) -> None:
        self.ayarlar = ayarlar

    def hazir(self) -> bool:
        return False

    def yukle(self, uretim: Uretim) -> Uretim:
        raise NotImplementedError


class KuruYukleyici(Yukleyici):
    """Yuklemez; yalnizca ne yuklenecegini gunluge yazar (deneme modu)."""

    ad = "kuru"

    def hazir(self) -> bool:
        return True

    def yukle(self, uretim: Uretim) -> Uretim:
        senaryo = uretim.senaryo
        KAYIT.info("[KURU] Yuklenmeyecek. Dosya: %s", uretim.video_yolu)
        if senaryo:
            KAYIT.info("[KURU] Baslik: %s", senaryo.baslik)
            KAYIT.info("[KURU] Etiketler: %s", ", ".join(senaryo.etiketler))
        uretim.not_dus("kuru mod: yukleme yapilmadi")
        return uretim


def kimlik_bilgisi(ayarlar: Ayarlar):
    """Refresh token'dan (ortam degiskeni ya da konfig/token.json) kimlik uretir."""
    from google.oauth2.credentials import Credentials

    istemci_id = ayarlar.sir("yt_client_id")
    istemci_sifre = ayarlar.sir("yt_client_secret")
    yenileme = ayarlar.sir("yt_refresh_token")

    token_dosyasi = ayarlar.mutlak("konfig/token.json")
    if token_dosyasi.exists() and not (istemci_id and istemci_sifre and yenileme):
        veri = json.loads(token_dosyasi.read_text(encoding="utf-8"))
        istemci_id = istemci_id or veri.get("client_id", "")
        istemci_sifre = istemci_sifre or veri.get("client_secret", "")
        yenileme = yenileme or veri.get("refresh_token", "")

    if not (istemci_id and istemci_sifre and yenileme):
        raise AracHatasi(
            "YouTube kimlik bilgisi eksik. Once `python scripts/youtube-yetki.py` calistir "
            "ya da YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN tanimla."
        )

    return Credentials(
        token=None,
        refresh_token=yenileme,
        token_uri=TOKEN_URI,
        client_id=istemci_id,
        client_secret=istemci_sifre,
        scopes=KAPSAMLAR,
    )


class YouTubeYukleyici(Yukleyici):
    ad = "youtube"

    def hazir(self) -> bool:
        try:
            import googleapiclient  # noqa: F401
        except ImportError:
            KAYIT.warning("google-api-python-client kurulu degil")
            return False
        if self.ayarlar.sir("yt_refresh_token") and self.ayarlar.sir("yt_client_id"):
            return True
        return self.ayarlar.mutlak("konfig/token.json").exists()

    def _servis(self):
        from googleapiclient.discovery import build

        return build("youtube", "v3", credentials=kimlik_bilgisi(self.ayarlar), cache_discovery=False)

    def yukle(self, uretim: Uretim) -> Uretim:
        from googleapiclient.http import MediaFileUpload

        if not uretim.video_yolu or not Path(uretim.video_yolu).exists():
            raise AracHatasi("Yuklenecek video dosyasi yok")
        senaryo = uretim.senaryo
        if senaryo is None:
            raise AracHatasi("Senaryo yok; ust veri uretilemez")

        gizlilik = str(self.ayarlar.al("yukleme.gizlilik", "private"))
        durum: dict = {
            "privacyStatus": gizlilik,
            "selfDeclaredMadeForKids": False,
        }
        yayin = str(self.ayarlar.al("yukleme.yayin_zamani", "") or "")
        if yayin:
            durum["publishAt"] = yayin
            durum["privacyStatus"] = "private"  # planli yayin icin zorunlu

        govde = {
            "snippet": {
                "title": senaryo.baslik[:100],
                "description": senaryo.aciklama[:4900],
                "tags": senaryo.etiketler[:15],
                "categoryId": str(self.ayarlar.al("yukleme.kategori_id", "27")),
                "defaultLanguage": str(self.ayarlar.al("kanal.dil", "tr")),
                "defaultAudioLanguage": str(self.ayarlar.al("kanal.dil", "tr")),
            },
            "status": durum,
        }

        servis = self._servis()
        medya = MediaFileUpload(uretim.video_yolu, chunksize=8 * 1024 * 1024, resumable=True)
        istek = servis.videos().insert(part="snippet,status", body=govde, media_body=medya)

        yanit = None
        onceki_yuzde = -10
        while yanit is None:
            durum_bilgisi, yanit = istek.next_chunk()
            if durum_bilgisi:
                yuzde = int(durum_bilgisi.progress() * 100)
                if yuzde - onceki_yuzde >= 10:
                    KAYIT.info("Yukleniyor... %%%d", yuzde)
                    onceki_yuzde = yuzde

        video_id = yanit["id"]
        uretim.youtube_id = video_id
        uretim.youtube_url = f"https://www.youtube.com/watch?v={video_id}"
        KAYIT.info("Yuklendi: %s (gizlilik: %s)", uretim.youtube_url, durum["privacyStatus"])

        if uretim.kapak_yolu and Path(uretim.kapak_yolu).exists():
            try:
                servis.thumbnails().set(
                    videoId=video_id, media_body=MediaFileUpload(uretim.kapak_yolu)
                ).execute()
                KAYIT.info("Kapak yuklendi")
            except Exception as hata:  # dogrulanmamis kanalda kapak yetkisi olmayabilir
                KAYIT.warning("Kapak yuklenemedi: %s", hata)
                uretim.not_dus(f"kapak yuklenemedi: {hata}")

        liste_id = str(self.ayarlar.al("yukleme.oynatma_listesi_id", "") or "")
        if liste_id:
            try:
                servis.playlistItems().insert(
                    part="snippet",
                    body={
                        "snippet": {
                            "playlistId": liste_id,
                            "resourceId": {"kind": "youtube#video", "videoId": video_id},
                        }
                    },
                ).execute()
                KAYIT.info("Oynatma listesine eklendi")
            except Exception as hata:
                KAYIT.warning("Oynatma listesine eklenemedi: %s", hata)

        return uretim


SINIFLAR: dict[str, type[Yukleyici]] = {"youtube": YouTubeYukleyici, "kuru": KuruYukleyici}


def yukleyici(ayarlar: Ayarlar, kuru: bool = False) -> Yukleyici:
    if kuru:
        return KuruYukleyici(ayarlar)
    ad = str(ayarlar.al("yukleme.saglayici", "kuru"))
    sinif = SINIFLAR.get(ad, KuruYukleyici)
    aday = sinif(ayarlar)
    if not aday.hazir():
        KAYIT.warning("%s yukleyicisi hazir degil; kuru moda dusuluyor", ad)
        return KuruYukleyici(ayarlar)
    return aday
