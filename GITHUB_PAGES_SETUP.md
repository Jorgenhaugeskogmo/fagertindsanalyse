# 🚀 Oppsett for GitHub Pages

Følg disse trinnene for å publisere Fremtidsanalyse på GitHub Pages.

## Steg 1: Opprett GitHub Repository

1. Gå til [GitHub](https://github.com) og logg inn
2. Klikk på "+" ikonet øverst til høyre og velg "New repository"
3. Fyll ut:
   - **Repository name**: `fremtidsanalyse`
   - **Description**: "Analyse av selskapsdata fra Brønnøysundregistrene"
   - **Public** eller **Private** (GitHub Pages fungerer med begge)
   - **IKKE** initialiser med README, .gitignore eller license (vi har allerede disse)
4. Klikk "Create repository"

## Steg 2: Koble lokalt repository til GitHub

Kopier kommandoene fra "...or push an existing repository from the command line" seksjonen på GitHub.

Eller bruk disse kommandoene (erstatt `[ditt-brukernavn]` med ditt GitHub brukernavn):

```bash
cd /Users/jorgenhaugeskogmo/Desktop/THB
git remote add origin https://github.com/[ditt-brukernavn]/fremtidsanalyse.git
git branch -M main
git push -u origin main
```

## Steg 3: Aktiver GitHub Pages

1. Gå til repository på GitHub
2. Klikk på **Settings** (tannhjul-ikonet)
3. Scroll ned til **Pages** i venstre sidebar
4. Under **Source**:
   - Velg `main` branch
   - Velg `/ (root)` folder
5. Klikk **Save**

## Steg 4: Vent på deployment

- GitHub vil nå bygge og deploye siden din
- Dette tar vanligvis 1-5 minutter
- Du vil se en melding øverst: "Your site is ready to be published at..."

## Steg 5: Besøk din side

Din app vil være tilgjengelig på:
```
https://[ditt-brukernavn].github.io/fremtidsanalyse/
```

## 🔄 Oppdatere siden

Når du gjør endringer senere:

```bash
cd /Users/jorgenhaugeskogmo/Desktop/THB
git add .
git commit -m "Beskrivelse av endringer"
git push
```

GitHub Pages vil automatisk oppdatere siden din etter hver push (tar 1-5 minutter).

## 📝 Viktige notater

### Datafilene
- CSV-filene i `datainput/` mappen blir **IKKE** pushet til GitHub (de er i .gitignore)
- Dette er viktig for personvern og datasikkerhet
- Brukere må laste opp sine egne data når de bruker appen

### Custom Domain (Valgfritt)
Hvis du har et eget domene:
1. Gå til Settings → Pages
2. Under "Custom domain", skriv inn ditt domene
3. Følg instruksjonene for DNS-konfigurasjon

### HTTPS
- GitHub Pages støtter automatisk HTTPS
- Sørg for at "Enforce HTTPS" er aktivert i Settings → Pages

## 🐛 Feilsøking

### Siden lastes ikke
- Sjekk at main branch er valgt i Settings → Pages
- Sjekk at index.html er i root-mappen
- Vent noen minutter og refresh siden

### 404 Error
- Sjekk at URL-en er riktig
- Fjern eventuelle ekstra slashes i URL-en

### CSS/JS lastes ikke
- Åpne nettleserens utviklerverktøy (F12)
- Sjekk Console for feilmeldinger
- Sjekk at alle filstier er relative (ikke absolute)

## ✅ Sjekkliste før publisering

- [ ] Git repository er opprettet lokalt
- [ ] GitHub repository er opprettet
- [ ] Remote origin er satt opp
- [ ] Kode er pushet til main branch
- [ ] GitHub Pages er aktivert i Settings
- [ ] URL til siden fungerer
- [ ] Alle funksjoner fungerer som forventet

## 📱 Teste lokalt først

Før du publiserer, test appen lokalt:

```bash
cd /Users/jorgenhaugeskogmo/Desktop/THB
python3 -m http.server 8000
```

Åpne http://localhost:8000 i nettleseren og test alle funksjoner.

---

**Tips**: Bookmark GitHub Pages URL-en din og del den med andre som skal bruke appen!

