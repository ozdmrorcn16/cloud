"""ScrapeGraphAI + OmniRoute ornegi (2026-09-20).

LLM cagrilari yerel OmniRoute uzerinden gider (http://127.0.0.1:20128/v1,
OpenAI uyumlu); OmniRoute'ta bagli ucretsiz saglayici (Gemini vb.)
neyse onu kullanir. Kullanim:

    python araclar/scrapegraph-ornek.py https://slooin.com/ "basligi ve slogani ver"

Gereksinim: pip install --user scrapegraphai && python -m playwright
install chromium; OmniRoute ayakta (Baslangic klasorunden kendiliginden
kalkar).
"""
import json
import sys

from scrapegraphai.graphs import SmartScraperGraph

OMNIROUTE = "http://127.0.0.1:20128/v1"


def kaz(kaynak: str, istem: str, model: str = "openai/auto") -> dict:
    ayar = {
        # "openai/..." on eki langchain-openai istemcisini secer; base_url
        # ile OmniRoute'a yonlenir. Anahtar loopback'te gerekmiyor ama
        # istemci bos kabul etmiyor.
        "llm": {"model": model, "api_key": "yerel", "base_url": OMNIROUTE, "model_tokens": 8000},
        "verbose": False,
        "headless": True,
    }
    return SmartScraperGraph(prompt=istem, source=kaynak, config=ayar).run()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    print(json.dumps(kaz(sys.argv[1], sys.argv[2]), ensure_ascii=False, indent=2))
