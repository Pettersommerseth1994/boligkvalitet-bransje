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
tiltakene bransjen kan velge: oppføring, oppgradering, kjøp og ombygging.
Salg og utleie, avtale med kommunen (tilvisning, tildeling eller ingen),
annen låntaker og tilskudd til utleieboliger virker som i dag.

| Side | Innhold |
| --- | --- |
| `index.html` | Søknadsoversikten med status, «Ny søknad», og menyen på hver søknad. |
| `opprett-soknad.html` | «Opprett søknad»: tiltak, formål, avtale, låntaker og finansieringsmuligheter. |
| `soknad.html` | Veiviseren: Prosjekt → Eiendom → Bolig → Økonomi → Vedlegg → Kundeopplysninger → Oppsummering. |
| `kvittering.html` | «Søknaden er sendt til signering». |
| `klima-forslag.html` | Fem forslag til klimagassavtrykket på Bolig-steget, etter Miro-skissen. Ikke koblet til søknaden. |
| `endre-lantaker.html`, `igangsettelse.html`, `utsett-oppstart.html` | Valgene på en søknad som er innvilget. |

To eksempelsøknader ligger klare første gang: en påbegynt, som også viser
«Utsett sletting», og en innvilget, som viser igangsettelse, utsatt oppstart og
endre låntaker. «Start på nytt» henter dem tilbake.

Ikke med: kommune, fylkeskommune, kommunekontrollerte foretak og borettslag,
energitiltak, istandsetting og rentekompensasjon for skole. Det gjelder også
nynorsk, utlogging og automatisk utlogging etter 28 minutter.

## Filene

| Fil | Innhold |
| --- | --- |
| `assets/felles.js` | Testdata (foretak, kommuner, Matrikkelen), lagring, header, footer og dialoger. |
| `assets/felt.js` | Skjemamotoren: feltene, feilmeldingene og tegningen av siden. |
| `assets/soknad.js` | Søknaden: regler, beregninger, vedleggskrav og eksempelsøknadene. |
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
- **Bolig-steget** spør ikke lenger om kravene til miljøboliger og
  livsløpsboliger. I stedet spør det om totalt BTA for hele prosjektet og antatt
  kg CO₂-ekv./m² BTA for prosjektet eksklusive kjellerareal. Det gjelder
  oppføring og ombygging uten avtale med kommunen, der de gamle spørsmålene
  sto. Forklaringsboksen om kg CO₂-ekv./m² BTA er tatt bort. For ombygging og
  Livsløpsstandard spør steget også om kjelleren vil være oppvarmet, som før.
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
