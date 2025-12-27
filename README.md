# Konge Bingo

Bingoplader til kongens nytårstale, bygget i Next.js (app router + Tailwind). Ordene kommer fra `kongens_nytaarstale_odds_sorted.csv`, og pladerne kan genskabes via et seed.

## Sådan kører du lokalt

1. Installer afhængigheder (allerede lagt ind i repoet):
   ```bash
   npm install
   ```
2. Start dev-serveren:
   ```bash
   npm run dev
   ```
3. Åbn http://localhost:3000

## Brug af appen

- Sæt et seed (samme seed = samme plade). Du kan trykke "Nyt seed" for et tilfældigt.
- Vælg hvor mange felter der skal være fra høj og medium odds; lav fyldes automatisk op til 25 felter.
- Justér odds-grænserne for høj/medium; lav er alt over medium.
- Klik på felter for at markere dem. Rækker, kolonner eller diagonaler giver Bingo og udløser konfetti.
