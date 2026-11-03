---
description: Carica un reel finito nella tua area Potrai (dentro un post, pronto per il Posting) e invia i pezzi nuovi
argument-hint: "[percorso del video .mp4]"
---
Carica su Potrai il reel indicato: $ARGUMENTS (se vuoto, l'ultimo `.mp4` finale in `~/Downloads/reel/`; chiedi conferma se ce ne sono piu' di uno recenti).

1. Usa le funzioni del server MCP `potrai`. Se non e' collegato, spiega all'utente che deve accedere col suo account Potrai (`/mcp`, poi «potrai») e fermati.
2. Il post: chiedi se va in un post esistente (`i_miei_post`) o in uno nuovo (`crea_bozza_post`, tipo reel).
3. `prepara_caricamento` con post_id, nome del file e peso in byte. Manda il file con `curl -sS -X PUT -H "Content-Type: video/mp4" --data-binary @"<video>" "<indirizzo>"` senza stampare l'indirizzo.
4. `conferma_caricamento` con post_id, file e durata in secondi (`ffprobe`). Poi `trascrivi_video`, `apri_post` e segui prossimo_passo.
5. Pezzi nuovi: in `~/.fammi-un-reel/pezzi/*/ELENCO.md` quelli non segnati «inviato» vanno con `invia_pezzi` (stile, nome, descrizione, codice = testo del file); poi segnali «inviato».
6. Di' all'utente in una riga dove trova il video in Potrai.
