# 📊 Fremtidsanalyse

En moderne webapplikasjon for analyse av selskapsdata fra Brønnøysundregistrene. Applikasjonen gjør det enkelt å identifisere selskaper som har flyttet og analysere hvordan antall ansatte har utviklet seg over tid.

## ✨ Funksjoner

### Dataanalyse
- **Last opp CSV-filer** fra Brønnøysund (2016-2024)
- **Automatisk parsing** av selskapsdata med støtte for semikolon-separerte verdier
- **Tidslinjeanalyse** for hvert enkelt selskap
- **Adresseendringer** detekteres automatisk

### Spesialanalyser
- **Flytteanalyse**: Finn selskaper som flyttet for 8 eller 3 år siden
- **Ansattutvikling**: Se hvilke selskaper som har hatt størst endring i antall ansatte
- **Filtreringsmuligheter**: 
  - Filtrer etter flytteår
  - Vis kun vekst eller nedgang
  - Juster antall resultater (Topp 10, 25, 50 eller alle)

### Visualisering
- **Interaktive diagrammer** med Chart.js
- **Detaljerte tabeller** med sortering og filtrering
- **Tidslinje** over adresseendringer per år
- **Selskapsdetaljer** med historikk og grafer

### Eksport
- **CSV-eksport**: Last ned resultatene som semikolon-separert CSV
- **PDF-rapport**: Generer profesjonelle PDF-rapporter med statistikk og tabeller

## 🚀 Kom i gang

### Lokal kjøring

1. Klon repositoriet:
```bash
git clone https://github.com/[ditt-brukernavn]/fremtidsanalyse.git
cd fremtidsanalyse
```

2. Åpne `index.html` i en nettleser, eller start en lokal server:
```bash
# Med Python 3
python -m http.server 8000

# Med Node.js (http-server)
npx http-server -p 8000
```

3. Åpne nettleseren på `http://localhost:8000`

### GitHub Pages

Applikasjonen er klar for GitHub Pages:

1. Gå til repository Settings → Pages
2. Velg `main` branch og `/ (root)` folder
3. Klikk Save
4. Applikasjonen vil være tilgjengelig på `https://[ditt-brukernavn].github.io/fremtidsanalyse/`

## 📖 Brukerveiledning

### 1. Last opp data
- Klikk på "Velg filer" eller dra og slipp CSV-filer fra Brønnøysund
- Støtter flere filer samtidig (2016-2024)
- Filer kan fjernes individuelt før analyse

### 2. Kjør analyse
- Klikk "Kjør analyse" når alle filer er lastet opp
- Applikasjonen vil automatisk:
  - Parse alle CSV-filer
  - Bygge tidslinje for hvert selskap
  - Detektere adresseendringer
  - Beregne endringer i antall ansatte

### 3. Utforsk resultater
- **Statistikk-kort** øverst viser nøkkeltall
- **Diagrammer** visualiserer de største endringene
- **Tabell** gir detaljert oversikt
- **Tidslinje** viser aktivitet per år

### 4. Filtrer data
- Velg flytteår (alle, 8 år siden, eller 3 år siden)
- Filtrer på type endring (alle, vekst, eller nedgang)
- Juster antall resultater som vises

### 5. Eksporter rapport
- **CSV**: Last ned som regnearkfil for videre analyse
- **PDF**: Generer profesjonell rapport med statistikk og tabeller

### 6. Se selskapsdetaljer
- Klikk på en rad i tabellen
- Se fullstendig historikk med adresser og ansatte
- Interaktiv graf over ansattutvikling

## 🗂️ Dataformat

Applikasjonen støtter CSV-filer fra Brønnøysund med følgende format:

```
innf_hist;Orgnr;Navn;Forretningsadresse;Fadr postnr;Fadr poststed;Postadresse;Padr postnr;Padr poststed;Organisasjonsform;Reg. i ER;Stiftelsesdato;Antall ansatte
---------;-----------;...
H;123456789;SELSKAP AS;Gateadresse 1;1234;POSTSTED;...
```

### Viktige kolonner:
- **Orgnr**: Organisasjonsnummer (påkrevd)
- **Navn**: Selskapsnavn
- **Forretningsadresse**: Gateadresse
- **Fadr postnr**: Postnummer
- **Fadr poststed**: Poststed
- **Antall ansatte**: Antall ansatte (tall)

## 💻 Teknologi

### Frontend
- **HTML5** med semantisk markup
- **CSS3** med moderne design (Grid, Flexbox, CSS Variables)
- **Vanilla JavaScript** (ES6+)

### Biblioteker
- **Chart.js** (4.4.0) - Interaktive diagrammer
- **jsPDF** (2.5.1) - PDF-generering
- **jsPDF-AutoTable** (3.5.31) - Tabeller i PDF

### Designprinsipper
- **Responsive design** - Fungerer på desktop, tablet og mobil
- **2025 UI/UX standarder** - Moderne, minimalistisk design
- **Tilgjengelighet** - Semantisk HTML og god kontrast
- **Performance** - Optimalisert for store datasett

## 📂 Prosjektstruktur

```
fremtidsanalyse/
├── index.html              # Hovedside
├── css/
│   └── styles.css         # Styling
├── js/
│   ├── app.js             # Hovedapplikasjon
│   ├── dataProcessor.js   # Databehandling og analyse
│   ├── charts.js          # Visualisering
│   └── export.js          # Eksportfunksjonalitet
├── datainput/             # Eksempel CSV-filer (ikke inkludert i repo)
├── README.md              # Denne filen
└── .gitignore             # Git ignore-fil
```

## 🔒 Personvern og sikkerhet

- **Ingen server**: All databehandling skjer lokalt i nettleseren
- **Ingen lagring**: Data lagres ikke permanent
- **Ingen ekstern kommunikasjon**: Ingen data sendes til eksterne servere
- **100% klientsideteknologi**: Full kontroll over dine data

## 🎨 Designvalg

### Fargepalett
- **Primary**: #3b82f6 (Blå) - Handlinger og fokus
- **Success**: #10b981 (Grønn) - Vekst og positive endringer
- **Danger**: #ef4444 (Rød) - Nedgang og advarsler
- **Background**: #f8fafc (Lys grå) - Bakgrunn
- **Surface**: #ffffff (Hvit) - Kort og overflater

### Typografi
- **Font**: Inter (Google Fonts) - Moderne, lesbar sans-serif
- **Størrelse**: Responsiv skala fra 0.875rem til 2.5rem

### Layout
- **Max bredde**: 1400px for optimal lesbarhet
- **Spacing**: 8px grid system
- **Border radius**: 0.375rem til 1rem
- **Shadow**: Subtile skygger for dybde

## 🚀 Fremtidige forbedringer

- [ ] Støtte for flere dataformater (Excel, JSON)
- [ ] Sammenligning av flere selskaper
- [ ] Geografisk visualisering på kart
- [ ] Mer avanserte filtreringsmuligheter
- [ ] Lagring av favoritter/bookmarks
- [ ] Eksport til flere formater (Word, PowerPoint)
- [ ] Dark mode
- [ ] Multi-språk støtte

## 🤝 Bidrag

Bidrag er velkomne! Vennligst:
1. Fork repositoriet
2. Opprett en feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit endringene dine (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Åpne en Pull Request

## 📄 Lisens

Dette prosjektet er åpen kildekode og tilgjengelig under [MIT License](LICENSE).

## 📧 Kontakt

For spørsmål eller tilbakemeldinger, vennligst opprett en issue i GitHub-repositoriet.

---

**Fremtidsanalyse** © 2025 | Laget med ❤️ for bedre forretningsinnsikt

