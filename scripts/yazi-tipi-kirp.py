#!/usr/bin/env python3
"""
scripts/yazi-tipi-kirp.py — Inter'i siteye gereken harflere kırpar.

    pip install fonttools brotli
    python3 scripts/yazi-tipi-kirp.py

NEDEN
Google'ın hazır alt kümeleri fazla geniş: "latin" 48 KB, "latin-ext" 85 KB.
İkisi de Türkçe bir sayfada indiriliyor (ğ, ş, İ latin-ext'te) ve yavaş
bağlantıda 130 KB'lık bu yük ilk boyamanın önüne geçiyor — ölçümde 13,9 KB'lık
stil dosyası fontların arkasında kalıp ancak 1341 ms'de tamamlanıyordu.

latin-ext'in 733 karakterinin neredeyse tamamı bize gerekmiyor; Latin
Extended-A (Türkçe + Orta Avrupa) yetiyor. Kırpınca 130 KB -> 53 KB.

ÇIKTI
public/fontlar/inter-latin.woff2 ve inter-latin-ext.woff2. Bunlara ait
@font-face kuralları src/app/globals.css içinde; unicode-range'ler
Google'ın verdiğiyle aynı, yani tarayıcı yalnızca gereken dosyayı indiriyor.

Yazı tipini değiştirirken ya da harf kümesi yetmediğinde bu betik yeniden
çalıştırılır.
"""

import os
import re
import sys
import urllib.request

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
HEDEF_KLASOR = os.path.join(KOK, "public", "fontlar")

# Dosya adındaki sürüm.
#
# Fontlar bir yıllık "immutable" başlıkla gidiyor: adres aynı kaldığı sürece
# tarayıcı dosyayı bir daha istemiyor. Bu betiği harf kümesini değiştirerek
# yeniden çalıştırırsan SÜRÜMÜ ARTIR ve aynı numarayı globals.css'teki
# @font-face kurallarına da yaz; yoksa ziyaretçilerde eski font takılı kalır.
SURUM = "v1"

# Değişken font isteniyor: tek dosya bütün ağırlıkları karşılıyor.
CSS_ADRESI = "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
# woff2 dönmesi için modern bir tarayıcı gibi görünmek gerekiyor.
TARAYICI = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

# Hangi alt kümeden hangi karakterler tutulacak.
KUMELER = {
    # Temel latin + Latin-1 (Batı Avrupa adları da bozulmasın) + noktalama.
    "latin": (
        list(range(0x20, 0x7F))
        + list(range(0xA0, 0x100))
        + [ord(c) for c in "–—‘’“”…•·™→₺€×"]
    ),
    # Latin Extended-A: Türkçe (ğ Ğ ı İ ş Ş) ve Orta Avrupa harfleri.
    "latin-ext": list(range(0x100, 0x180)),
}


def css_indir() -> str:
    istek = urllib.request.Request(CSS_ADRESI, headers={"User-Agent": TARAYICI})
    with urllib.request.urlopen(istek) as cevap:
        return cevap.read().decode("utf-8")


def alt_kume_adresleri(css: str) -> dict[str, str]:
    """CSS'teki /* latin */ yorumlarını takip ederek alt küme -> adres eşler."""
    adresler: dict[str, str] = {}
    aktif = None
    for satir in css.splitlines():
        yorum = re.match(r"\s*/\*\s*([a-z-]+)\s*\*/", satir)
        if yorum:
            aktif = yorum.group(1)
            continue
        url = re.search(r"src:\s*url\((https://[^)]+\.woff2)\)", satir)
        if url and aktif in KUMELER:
            adresler[aktif] = url.group(1)
    return adresler


def kirp(kaynak_bayt: bytes, unicodes: list[int], hedef: str) -> tuple[int, int]:
    gecici = hedef + ".kaynak"
    with open(gecici, "wb") as dosya:
        dosya.write(kaynak_bayt)

    font = TTFont(gecici)
    mevcut = set(font.getBestCmap())
    istenen = set(unicodes) & mevcut

    secenekler = Options()
    secenekler.layout_features = ["*"]  # kern, liga gibi özellikler korunsun
    secenekler.name_IDs = ["*"]
    secenekler.notdef_outline = True

    kirpici = Subsetter(options=secenekler)
    kirpici.populate(unicodes=istenen)
    kirpici.subset(font)

    font.flavor = "woff2"
    font.save(hedef)
    os.remove(gecici)
    return os.path.getsize(hedef), len(istenen)


def main() -> None:
    os.makedirs(HEDEF_KLASOR, exist_ok=True)
    adresler = alt_kume_adresleri(css_indir())

    eksik = [ad for ad in KUMELER if ad not in adresler]
    if eksik:
        sys.exit(f"Alt küme adresi bulunamadı: {', '.join(eksik)}")

    toplam_once = toplam_sonra = 0
    for ad, unicodes in KUMELER.items():
        istek = urllib.request.Request(adresler[ad], headers={"User-Agent": TARAYICI})
        with urllib.request.urlopen(istek) as cevap:
            ham = cevap.read()

        hedef = os.path.join(HEDEF_KLASOR, f"inter-{ad}-{SURUM}.woff2")
        boyut, karakter = kirp(ham, unicodes, hedef)
        toplam_once += len(ham)
        toplam_sonra += boyut
        print(f"{ad:10s} {len(ham):>7} B -> {boyut:>6} B  ({karakter} karakter)")

    print(f"{'TOPLAM':10s} {toplam_once:>7} B -> {toplam_sonra:>6} B")


if __name__ == "__main__":
    main()
