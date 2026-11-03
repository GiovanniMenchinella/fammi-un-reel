# fammi-un-reel

Reel e pubblicità verticali (1080×1920) **animati e fatti interamente in codice**, in tanti stili diversi.
Scrivi a Claude Code «fammi un reel su …»: la tua Claude scrive il copione, fa la regia, disegna le scene, mette voce, musica e suoni veri sul fotogramma giusto, controlla il risultato e ti consegna il video.

Tutto gira sul tuo computer, con il tuo abbonamento Claude. Non serve una scheda video.\nServe un account [Potrai](https://www.potrai.com): il metodo di regia, costruzione e revisione arriva dal server Potrai, un passo alla volta.

## Cosa serve

- [Claude Code](https://claude.com/claude-code)
- Node 20+, ffmpeg 7+, Python 3.11+, [uv](https://docs.astral.sh/uv/), git
  Su Mac: `brew install git node ffmpeg uv python@3.12`
- Circa 1,5 GB liberi (librerie, strumenti musicali, suoni)
- Per la voce: una chiave [ElevenLabs](https://elevenlabs.io) (puoi usare anche la tua voce clonata), oppure una tua registrazione

## Installazione

```sh
claude plugin marketplace add GiovanniMenchinella/fammi-un-reel
claude plugin install fammi-un-reel@potrai
```

Poi apri Claude Code in una cartella qualsiasi e scrivi:

> installa fammi-un-reel

La prima volta scarica le librerie e prepara tutto (10-20 minuti). Ti chiederà la chiave della voce: viene salvata solo sul tuo computer, in `~/.fammi-un-reel/chiavi.env`.

## Uso

> Fammi un reel in stile risografia su perché i clienti dicono «ci devo pensare».

> Fammi una pubblicità di 30 secondi in stile Swiss per il mio corso di ceramica.

Stili pronti (veloci): `risograph`, `swiss-motion`, `ink-wash`. Altri stili arrivano con gli aggiornamenti.

I video finiscono in `~/Downloads/reel/<nome>/`.

## Potrai

Con `/fammi-un-reel:carica-su-potrai` il video va nella tua area, pronto da programmare. Al primo uso ti chiede di accedere col tuo account. Insieme al video vengono inviati i pezzi nuovi che la tua Claude ha disegnato (codice e anteprima): li valutiamo e i migliori entrano negli aggiornamenti del plugin per tutti.

## Aggiornare

```sh
claude plugin marketplace update potrai
claude plugin update fammi-un-reel@potrai
```

## Licenza e crediti

Il nostro lavoro è MIT. Le librerie usate hanno le loro licenze: vedi [CREDITS.md](CREDITS.md).
