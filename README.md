# fammi-un-reel

Reel e pubblicità verticali (1080×1920) **animati e fatti interamente in codice**, in tanti stili diversi.
Scrivi a Claude Code «fammi un reel su …»: insieme scegliete idea, gancio, copione e stile, poi la tua Claude disegna le scene,
mette voce, musica e suoni e ti consegna il video.

Tutto gira sul tuo computer, con il tuo abbonamento Claude. Non serve una scheda video.

## Cosa serve

- **Claude Code** installato: [claude.com/claude-code](https://claude.com/claude-code)
- **Un abbonamento Claude** (Pro o Max) con cui accedi a Claude Code
- **Un account Potrai**: i passi per fare il reel arrivano dal server di Potrai
- **Facoltativo: una chiave [ElevenLabs](https://elevenlabs.io)** per la voce (anche la tua voce clonata). Senza chiave puoi usare una tua registrazione.
- Programmi sul computer: Node 20+, ffmpeg 7+, Python 3.11+, uv, git.
  Su Mac: `brew install git node ffmpeg uv python@3.12` (se non li hai, Claude te lo dice e ti chiede prima di installarli)
- Circa 1,5 GB liberi

## Installazione (2 minuti)

Apri Claude Code e scrivi questi due comandi, uno alla volta:

```
/plugin marketplace add GiovanniMenchinella/fammi-un-reel
```

```
/plugin install fammi-un-reel@potrai
```

Poi chiudi Claude Code e riaprilo.

Preferisci il terminale? Stessa cosa:

```sh
claude plugin marketplace add GiovanniMenchinella/fammi-un-reel
claude plugin install fammi-un-reel@potrai
```

## Collega il tuo account Potrai

Il plugin si collega da solo al server di Potrai (`https://app.potrai.com/api/mcp`). La prima volta devi solo accedere:

1. In Claude Code scrivi `/mcp`
2. Scegli quello che si chiama **potrai** (può comparire come `plugin:fammi-un-reel:potrai`) e poi **Authenticate**
3. Si apre il browser: entra col tuo account Potrai e conferma

## Primo comando

In Claude Code, in una cartella qualsiasi, scrivi:

> installa fammi-un-reel

La prima volta scarica quello che serve (10-20 minuti). Intanto ti mostra gli stili e ti chiede la chiave della voce:
viene salvata solo sul tuo computer, in `~/.fammi-un-reel/chiavi.env`, e non viene mai mostrata.

Poi chiedi il tuo reel:

> Fammi un reel in stile risografia su perché i clienti dicono «ci devo pensare».

> Fammi una pubblicità di 30 secondi in stile Swiss per il mio corso di ceramica.

Stili pronti: `risograph`, `swiss-motion`, `ink-wash`. Altri arrivano con gli aggiornamenti.

## Dove trovo il video

Nella cartella **Download → reel → nome del reel** (`~/Downloads/reel/<nome>/`).

Per mandarlo nella tua area Potrai, pronto da programmare, scrivi:

```
/fammi-un-reel:carica-su-potrai
```

Insieme al video vengono inviati i pezzi nuovi che la tua Claude ha disegnato: li valutiamo e i migliori entrano negli aggiornamenti per tutti.

## Aggiornare

```
/plugin marketplace update potrai
```

oppure dal terminale:

```sh
claude plugin marketplace update potrai
claude plugin update fammi-un-reel@potrai
```

## Licenza e crediti

Il nostro lavoro è MIT (vedi [LICENSE](LICENSE)). Parti di codice e le librerie usate hanno le loro licenze e i loro autori:
vedi [CREDITS.md](CREDITS.md) e [NOTICE](NOTICE).
