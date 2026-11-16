# E-søknad om lån og tilskudd for bransje, dagens løsning

Klikkbar gjenskaping av e-søknaden i Husbankens selvbetjeningsløsning
(Grunnlån e-søknad), slik en eiendomsutvikler eller boligutvikler møter den.
Den går fra søknadsoversikten etter innlogging, gjennom «Opprett søknad» og de
sju stegene, til søknaden er sendt til signering. Laget for å teste flyten fra
start til slutt og for å gjøre endringer i den.

- Ingen innlogging. Du er logget inn som en oppdiktet bruker og representerer
  et oppdiktet foretak. Bytt foretak i profilmenyen øverst til høyre.
- Ingen backend. Søknadene lagres bare i nettleseren.
- Oppslagene mot Altinn, Enhetsregisteret, Matrikkelen, kundeskjemaet og
  signeringstjenesten er erstattet med oppdiktede testdata. Knappen
  «Testdata» i stripa øverst viser hva som finnes.
- Ingen kildekode, konfigurasjon eller data er kopiert fra Husbankens repo.
  Tekstene, feltene, vilkårene, beregningene og feilmeldingene er skrevet av
  derfra. Koden og stilene er skrevet på nytt.

## Kjør lokalt

Fra rota av repoet:

```bash
python3 -m http.server 4321
```

Åpne så <http://localhost:4321/grunnlan-esoknad/>.

## Hva som er med

Kundetypen er bransje («Eiendomsutvikler/Boligutvikler»), med alle de fire
tiltakene bransjen kan velge: oppføring, oppgradering, kjøp og transformasjon.
Salg og utleie, avtale med kommunen (tilvisning, tildeling eller ingen),
annen låntaker og tilskudd til utleieboliger virker som i dag.

| Side | Innhold |
| --- | --- |
| `index.html` | Søknadsoversikten med status, «Ny søknad», og menyen på hver søknad. |
| `opprett-soknad.html` | «Opprett søknad»: tiltak, formål, avtale, låntaker og finansieringsmuligheter. |
| `soknad.html` | Veiviseren: Prosjekt → Eiendom → Bolig → Økonomi → Vedlegg → Kundeopplysninger → Oppsummering. |
| `kvittering.html` | «Søknaden er sendt til signering». |
| `klima-forslag.html` | Fem forslag til klimagassavtrykket på Bolig-steget, etter Miro-skissen. Forslag 2 er valgt og ligger nå i søknaden. |
| `oppgradering-forslag.html` | Fem forslag til Bolig-steget ved oppgradering, uten modalen med boligkvaliteter: velg tilgjengelighet eller energi først, så masseredigering av boenhetene. Forslag 4, oppgraderingspakker, er valgt og ligger nå i søknaden. |
| `endre-lantaker.html`, `igangsettelse.html`, `utsett-oppstart.html` | Valgene på en søknad som er innvilget. |
| `utbetaling.html` | Søknad om utbetaling for klimavennlig bolig, med klimagassregnskapet. Vises på en innvilget klimavennlig søknad. |
| `saksbehandler.html` | Saksbehandlers visning (prototype): klimatallene med andeler og grenseverdier, boenhetene, og fila til Elements. Vises på innsendte søknader. |

Tre eksempelsøknader ligger klare første gang: en påbegynt med
livsløpsstandard, som også viser «Utsett sletting», en påbegynt klimavennlig
med både blokk og småhus, stoppet på Bolig, der én leilighet er over
arealgrensen, og en innvilget klimavennlig, som viser
igangsettelse, utsatt oppstart og endre låntaker. «Start på nytt» henter dem
tilbake.

## Versjonene

Boksen «Versjoner» lar deg hoppe mellom versjonene. Bryteren «Vis endringene»
markerer det som er endret, og punktene i lista tar deg til riktig side, steg
og eksempelsøknad. Lista står i [`assets/versjoner.js`](assets/versjoner.js),
sammen med hvordan du legger til en ny versjon. Forslagssidene
(`klima-forslag.html` og `oppgradering-forslag.html`) er ikke med i versjonene.

| Versjon | Mappe | Hva som endret seg |
| --- | --- | --- |
| 1, 9. november 2026 | `v1/` | Klimavennlig bolig med alternativ 2 fra Miro: blokk og/eller småhus, et kort per type, grenseverdier og klimagassbudsjett. |
| 2, 16. november 2026 | denne mappa | Post-it-lappene fra Miro: transformasjon med kontakt med regionkontoret, klimaspørsmål bare for Klimavennlig bolig, småhus opptil 200 m² med «i» over grensen, andeler i oppsummeringen, søknad om utbetaling med klimagassregnskap, og saksbehandlers visning med fil til Elements. |

Hver versjon lagrer svarene sine for seg.

Ikke med: kommune, fylkeskommune, kommunekontrollerte foretak og borettslag,
energitiltak, istandsetting og rentekompensasjon for skole. Det gjelder også
nynorsk, utlogging og automatisk utlogging etter 28 minutter.

## Filene

| Fil | Innhold |
| --- | --- |
| `assets/felles.js` | Testdata (foretak, kommuner, Matrikkelen), lagring, header, footer og dialoger. |
| `assets/felt.js` | Skjemamotoren: feltene, feilmeldingene og tegningen av siden. |
| `assets/soknad.js` | Søknaden: regler, beregninger, vedleggskrav og eksempelsøknadene. |
| `assets/oppgradering.js`, `assets/oppgradering.css` | Oppgradering: tiltakene, reglene for energikarakter og oppgraderingspakkene. Brukes på Bolig-steget og på forslagssiden. |
| `assets/steg-bolig.js` | Bolig-steget. Her står også grenseverdiene for klimagassutslipp (`CO2_GRENSER`) og regelen for hvilken kategori et prosjekt får. |
| `assets/sider.js` | Sidene utenfor veiviseren. |
| `assets/wizard.js` | Veiviseren: stepper, knapperad og navigasjon. |
| `assets/steg-*.js` | Ett steg per fil, med innhold, validering og handlinger. |
| `assets/esoknad.css` | Utseendet, bygget på `../ds/colors_and_type.css`. |

## Slik endrer du et steg

Hvert steg i `assets/steg-*.js` er et objekt i `STEG` med `tegn(pf)` som lager
HTML-en, `valider(pf)` som gir feilene, og `handlinger` for knappene. Et felt
sier selv hvor svaret ligger i søknaden:

```js
F.janei({ felt: 'sentralGodkjenning', label: 'Har foretaket sentral godkjenning?' })
```

Feilene vises når brukeren har trykket «Neste steg», og «Neste steg» går
bare videre når steget er uten feil, som i dag.

## Endret fra dagens løsning

Prototypen er ikke lenger en ren kopi. Disse endringene er gjort med vilje:

- **«Velg formål»** på «Opprett søknad» når tiltaket er oppføring: Klimavennlig
  bolig eller Livsløpsstandard. Livsløpsstandard gir livsløpskolonnene i
  boligtabellen, som før fulgte svaret på Bolig-steget.
- **Transformasjon** erstatter ombygging: «Gjøre om bygg til boligformål
  (transformasjon)» og «Lån til transformasjon».
- **Bolig-steget** spør ikke lenger om kravene til miljøboliger og
  livsløpsboliger. Klimaspørsmålene gjelder bare oppføring med formålet
  Klimavennlig bolig. Livsløpsstandard og transformasjon får dem ikke.
- **Arealgrensen for småhus** er 200 m² per boenhet, som enebolig. Blokk er
  fortsatt 130 m².
  En boenhet over grensen får et «i» i Merknad-kolonnen.
- **Transformasjon** viser en boks på «Opprett søknad» som ber søkeren ta
  kontakt med regionkontoret før de søker, for et forprosjekt.
- **Oppsummeringen** viser andelen av prosjektets BTA og grenseverdien for
  hver del.
- **Søknad om utbetaling** for klimavennlig bolig krever at klimagassregnskapet
  lastes opp, og spør om det viser samme eller lavere utslipp enn søknaden.
- **Saksbehandlers visning** viser klimatallene med andeler, grenseverdier og
  status, og boenhetene med bygningstype, arealgrense og om de er med i
  låneutmålingen. Knappen «Last ned fil til Elements» gir de samme
  kolonnene som CSV.
- **Bolig-steget for Klimavennlig bolig** har i tillegg, øverst på siden:
  - En blå infoboks som sier at det må utarbeides et klimagassbudsjett etter
    NS 3720:2018. Den sier at det ved søknadstidspunktet bare er nødvendig med
    et foreløpig klimagassbudsjett som dokumentasjon, at ferdig
    klimagassregnskap må sendes inn ved søknad om utbetaling eller før
    videresalg, og at grenseverdiene for klimagassutslipp avhenger av kjeller,
    størrelse og om bygningstypen er blokk. Boksen sier også at grenseverdiene
    er 30 % lavere enn TEK for blokk, 20 % lavere for småhusprosjekt på minst
    1000 m² BTA og 10 % lavere for småhusprosjekt under 1000 m² BTA.
  - Spørsmålet «Er det blitt utarbeidet et klimagassbudsjett for prosjektet etter
    NS 3720:2018?» (Ja/Nei). Svarer man nei, vises en advarsel i samme stil som
    feilmeldingene. Advarselen stopper ikke «Neste steg», men spørsmålet må
    besvares.
  - Spørsmålet «Har prosjektet kjeller?» (Ja/Nei). Ved ja kommer «Vil kjelleren
    være oppvarmet?». Ved nei fjernes svaret om oppvarming og kjellertallet.
  - Et eget felt for antatt kg CO₂-ekv./m² BTA for kjellerarealet, som bare vises
    når prosjektet har kjeller.
- **Grenseverdiene for klimagassutslipp** er hentet fra forslaget til ny § 2-3 i
  høringsnotatet fra Kommunal- og distriktsdepartementet (sak 26/1208), i kg
  CO₂-ekv./m² BTA. Bygget og kjelleren har hver sine grenseverdier. Advarselen
  under hvert tallfelt viser grensen som gjelder, og den stopper ikke «Neste
  steg».

  | Kategori | Bygget | Oppvarmet kjeller | Uoppvarmet kjeller |
  | --- | --- | --- | --- |
  | Boligblokk | 247 | 180 | 139 |
  | Småhusprosjekt på minst 1000 m² BTA | 130 | 206 | 159 |
  | Småhusprosjekt under 1000 m² BTA | 167 | 232 | 179 |

  Prosjektet regnes som boligblokk hvis minst ett av de valgte byggene er en
  blokk, ut fra bygningstypen fra Matrikkelen eller prosjektert bygningstype.
  Rekkehus og lignende regnes som blokk når en adresse har flere enn tre
  boenheter. Ellers regnes prosjektet som småhus, og totalt BTA avgjør om det er
  under eller minst 1000 m². Grenseverdiene er foreløpige og skal oppdateres
  når de endelige verdiene er kjent. Grensen på 130 for småhus på minst 1000 m²
  stemmer ikke med «20 % lavere enn TEK», som ville gitt omtrent 149. Tallet er
  hentet fra forskriftsteksten i forslaget.
- **Klimagassbudsjett** er et nytt vedlegg, og det vises bare for Klimavennlig bolig
  når svaret på spørsmålet om klimagassbudsjett er ja.
- **Oppsummeringen**, panelet «Kvalitetskrav og boenheter», viser for Klimavennlig
  bolig: totalt BTA, antatt klimagassutslipp for prosjektet eksklusive
  kjellerareal, og svaret på «Har prosjektet kjeller?». Er svaret ja, kommer
  også svaret om oppvarming og, som siste rad, antatt klimagassutslipp for
  kjellerarealet i prosjektet. Rader uten svar vises ikke.

## Avvik fra dagens løsning

- Tilskudd til utleieboliger regnes ut med faste testsatser: 4 000 kroner per
  kvadratmeter primærareal, høyst 250 000 kroner per boenhet.
- Kundeskjemaet og signeringstjenesten er egne løsninger i dag. Her later vi
  som kundeskjemaet blir fylt ut og signert, og personene med signaturrett er
  oppdiktet. «La alle signere» på oversikten sender søknaden videre.
- Opplastede filer lagres ikke, bare navnet og størrelsen.
- «Legg til boenhet» gir neste ledige bolignummer. I dag kopieres nummeret på
  raden, som er en kjent feil.
- Tekster som ligger i Husbankens designsystem og ikke i repoet, som knappene
  i bekreftelsesdialogene og noen standard feilmeldinger, er gjettet.
