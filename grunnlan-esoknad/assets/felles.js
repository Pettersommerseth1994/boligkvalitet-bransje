/* ──────────────────────────────────────────────────────────────────
   Felles for alle sidene: testdata, lagring, formatering, ikoner,
   header med organisasjonsvelger, footer, varsler og dialoger.

   Ingen backend. Alt som i dagens løsning hentes fra Altinn,
   Enhetsregisteret, Matrikkelen, kundeskjemaet og signeringstjenesten,
   er oppdiktede testdata her. Navn og organisasjonsnumre er oppdiktet.
   ────────────────────────────────────────────────────────────────── */

const E_TJENESTE = 'Søknad om lån og tilskudd fra Husbanken';
const E_LAGER = 'grunnlan-esoknad-v1';
const E_BRUKER = 'Ola Nordmann';

/* ═══ Foretak ═════════════════════════════════════════════════════
   De fem første kan brukeren representere (profilmenyen). Resten
   finnes bare i «Enhetsregisteret», for oppslag på org.nr.
   ─────────────────────────────────────────────────────────────────── */

const E_FORETAK = [
  { orgnr: '912345671', navn: 'Fjordbyen Eiendom AS', orgform: 'AS', sektor: '2100', kundeType: 'UTBYGGER',
    gateadresse: 'Postboks 1234 Sentrum', postnr: '0106', poststed: 'Oslo',
    varsling: [{ email: 'post@fjordbyen.example', tlf: '' }, { email: '', tlf: '40000001' }], representerbar: true },
  { orgnr: '923456782', navn: 'Nordlys Boligutvikling AS', orgform: 'AS', sektor: '2100', kundeType: 'UTBYGGER',
    gateadresse: 'Storgata 5', postnr: '9008', poststed: 'Tromsø',
    varsling: [{ email: 'soknad@nordlys-bolig.example', tlf: '40000002' }], representerbar: true },
  { orgnr: '934567893', navn: 'Kystbygg Utvikling AS', orgform: 'AS', sektor: '2100', kundeType: 'UTBYGGER',
    gateadresse: 'Bryggen 12', postnr: '5003', poststed: 'Bergen',
    varsling: [{ email: '', tlf: '40000003' }], representerbar: true },
  { orgnr: '945678904', navn: 'Vestbygg Avdeling Sør', orgform: 'BEDR', sektor: '2100', kundeType: 'UTBYGGER',
    gateadresse: 'Havnegata 2', postnr: '4611', poststed: 'Kristiansand', hovedforetak: '956789015',
    varsling: [{ email: 'sor@vestbygg.example', tlf: '' }], representerbar: true },
  { orgnr: '967890126', navn: 'Eksempel Helseforetak SF', orgform: 'SF', sektor: '1120', kundeType: null,
    gateadresse: 'Postboks 50', postnr: '7030', poststed: 'Trondheim',
    varsling: [{ email: 'post@eksempel-hf.example', tlf: '' }], representerbar: true },

  { orgnr: '956789015', navn: 'Vestbygg AS', orgform: 'AS', sektor: '2100', kundeType: 'UTBYGGER', gateadresse: 'Havnegata 2', postnr: '4611', poststed: 'Kristiansand' },
  { orgnr: '976000001', navn: 'Tømrer Hansen AS', orgform: 'AS', sektor: '2100', kundeType: 'UTBYGGER', gateadresse: 'Verkstedveien 3', postnr: '3004', poststed: 'Drammen' },
  { orgnr: '976000002', navn: 'Elektro Berg AS', orgform: 'AS', sektor: '2100', kundeType: 'UTBYGGER', gateadresse: 'Industriveien 8', postnr: '2317', poststed: 'Hamar' },
  { orgnr: '976000003', navn: 'Tomteselskapet Nord AS', orgform: 'AS', sektor: '2100', kundeType: 'UTBYGGER', gateadresse: 'Sjøgata 1', postnr: '8006', poststed: 'Bodø' },
  { orgnr: '964000001', navn: 'Eksempel kommune', orgform: 'KOMM', sektor: '6500', kundeType: 'KOMMUNE', gateadresse: 'Rådhusplassen 1', postnr: '3000', poststed: 'Drammen' },
  { orgnr: '964000002', navn: 'Nordby kommune', orgform: 'KOMM', sektor: '6500', kundeType: 'KOMMUNE', gateadresse: 'Rådhusgata 4', postnr: '9008', poststed: 'Tromsø' },
  { orgnr: '964000003', navn: 'Eksempel kommunale eiendom KF', orgform: 'KF', sektor: '6500', kundeType: 'KOMMUNE', gateadresse: 'Rådhusplassen 1', postnr: '3000', poststed: 'Drammen' }
];

const E_KUNDETYPER = ['UTBYGGER', 'KOMMUNE', 'BORETTSLAG', 'KOMMUNEKONTROLLERT', 'FYLKESKOMMUNE'];
const E_KUNDETYPE_NAVN = { UTBYGGER: 'Eiendomsutvikler/boligutvikler', KOMMUNE: 'Kommune', BORETTSLAG: 'Borettslag', FYLKESKOMMUNE: 'Fylkeskommune', KOMMUNEKONTROLLERT: 'Kommunekontrollert' };

/* Oppslag i «Enhetsregisteret». En underenhet svarer med hovedforetaket. */
function eForetak(orgnr) {
  const nr = String(orgnr || '').replace(/[\s.-]/g, '');
  const f = E_FORETAK.find(x => x.orgnr === nr);
  if (!f) return null;
  if (f.hovedforetak) return { ...E_FORETAK.find(x => x.orgnr === f.hovedforetak) };
  return { ...f };
}
const eRepresenterbare = () => E_FORETAK.filter(f => f.representerbar);

const E_KOMMUNER = [
  ['0301', 'Oslo'], ['1103', 'Stavanger'], ['1108', 'Sandnes'], ['1506', 'Molde'], ['1508', 'Ålesund'], ['1804', 'Bodø'],
  ['3201', 'Bærum'], ['3203', 'Asker'], ['3301', 'Drammen'], ['3312', 'Lier'], ['3403', 'Hamar'], ['3405', 'Lillehammer'],
  ['3901', 'Horten'], ['3905', 'Tønsberg'], ['3907', 'Sandefjord'], ['4001', 'Porsgrunn'], ['4003', 'Skien'],
  ['4204', 'Kristiansand'], ['4601', 'Bergen'], ['5001', 'Trondheim'], ['5501', 'Tromsø'], ['5601', 'Alta']
].map(([nr, navn]) => ({ nr, navn })).sort((a, b) => a.navn.localeCompare(b.navn, 'nb'));
const eKommune = nr => E_KOMMUNER.find(k => k.nr === nr);

/* ═══ Matrikkelen ═════════════════════════════════════════════════
   Oppdiktet oppslag. Samme gårds- og bruksnummer gir alltid samme
   svar. Bruksnummer 999 gir ingen treff.
   ─────────────────────────────────────────────────────────────────── */

const E_BYGNINGSTYPER = [
  ['111', 'Enebolig', 'ENEBOLIG'], ['112', 'Enebolig med hybelleilighet, sokkelleilighet o.l.', 'ENEBOLIGMEDHYBEL'],
  ['113', 'Våningshus', 'ENEBOLIG'], ['121', 'Tomannsbolig, vertikaldelt', 'SMAHUS'], ['122', 'Tomannsbolig, horisontaldelt', 'SMAHUS'],
  ['123', 'Våningshus, tomannsbolig, vertikaldelt', 'SMAHUS'], ['124', 'Våningshus, tomannsbolig, horisontaldelt', 'SMAHUS'],
  ['131', 'Rekkehus', 'SMAHUS*'], ['133', 'Kjedehus inkl. atriumhus', 'SMAHUS*'], ['135', 'Terrassehus', 'SMAHUS*'],
  ['136', 'Andre småhus med 3 boliger eller flere', 'SMAHUS*'],
  ['141', 'Stort frittliggende boligbygg på 2 etasjer', 'BLOKK'], ['142', 'Stort frittliggende boligbygg på 3 og 4 etasjer', 'BLOKK'],
  ['143', 'Stort frittliggende boligbygg på 5 etasjer eller over', 'BLOKK'], ['144', 'Store sammenbygde boligbygg på 2 etasjer', 'BLOKK'],
  ['145', 'Store sammenbygde boligbygg på 3 og 4 etasjer', 'BLOKK'], ['146', 'Store sammenbygde boligbygg på 5 etasjer og over', 'BLOKK'],
  ['151', 'Bo- og servicesenter', 'BLOKK'], ['152', 'Studenthjem/studentboliger', 'BLOKK'], ['159', 'Annen bygning for bofellesskap', 'BLOKK'],
  ['161', 'Fritidsbygning (hytter, sommerhus o.l.)', 'BLOKK'], ['162', 'Helårsbolig benyttet som fritidsbolig', 'ENEBOLIG'],
  ['163', 'Våningshus benyttet som fritidsbolig', 'ENEBOLIG']
].map(([kode, navn, type]) => ({ kode, navn, type }));

/* Valgene i «Prosjektert bygningstype», i samme rekkefølge som i dag */
const E_PROSJEKTERT = [
  'Andre småhus med 3 boliger eller flere', 'Annen bygning for bofellesskap', 'Bo- og servicesenter', 'Enebolig',
  'Enebolig med hybelleilighet, sokkelleilighet o.l.', 'Kjedehus inkl. atriumhus', 'Rekkehus',
  'Store sammenbygde boligbygg på 2 etasjer', 'Store sammenbygde boligbygg på 3 og 4 etasjer',
  'Store sammenbygde boligbygg på 5 etasjer og over', 'Stort frittliggende boligbygg på 2 etasjer',
  'Stort frittliggende boligbygg på 3 og 4 etasjer', 'Stort frittliggende boligbygg på 5 etasjer eller over', 'Terrassehus',
  'Tomannsbolig, horisontaldelt', 'Tomannsbolig, vertikaldelt', 'Våningshus', 'Våningshus, tomannsbolig, horisontaldelt',
  'Våningshus, tomannsbolig, vertikaldelt'
];

const E_BYGNINGSTYPE_NAVN = { ENEBOLIG: 'Enebolig', ENEBOLIGMEDHYBEL: 'Enebolig med bileilighet', SMAHUS: 'Småhus', BLOKK: 'Leiligheter i blokk', OMSORGSBOLIGSYKEHJEM: 'Omsorgsboliger eller sykehjem', DUMMY: 'Ukjent' };

/* Typer som i dag er «SMAHUS*» (type avhenger av om adressen får mer enn 3
   boenheter, se S.hbType) men som merkes «(Blokk)» i nedtrekkslisten likevel. */
const E_PROSJEKTERT_BLOKK_UNNTAK = ['Andre småhus med 3 boliger eller flere'];

/* Om en «Prosjektert bygningstype» regnes som blokk (CO2_GRENSER.BOLIGBLOKK), ut fra
   samme klassifisering som Matrikkel-oppslaget i E_BYGNINGSTYPER, pluss unntakene over.
   Brukes til å vise «(Blokk)» etter navnet i nedtrekkslisten, uten å endre selve
   lagret verdi. */
const E_erProsjektertBlokk = navn => E_BYGNINGSTYPER.some(x => x.navn === navn && x.type === 'BLOKK') || E_PROSJEKTERT_BLOKK_UNNTAK.includes(navn);

const E_GATER = ['Fjellveien', 'Solbakken', 'Elvegata', 'Kirkeveien', 'Havnegata', 'Skoleveien', 'Parkveien', 'Bjørkelia', 'Granstien', 'Torggata'];

function eMatrikkel({ kommuneNr, gaardsNr, bruksNr }, nyId) {
  if (Number(bruksNr) === 999) return { fraMatrikkelen: false, finnerIkkeAdresse: true, bygg: [] };
  const gate = E_GATER[(Number(gaardsNr) * 7 + Number(bruksNr)) % E_GATER.length];
  const nr = 2 + ((Number(gaardsNr) + Number(bruksNr)) % 20) * 2;
  const adr = (bokstav, antall, bruksareal, veiNummer = nr) => ({ id: nyId(), veiNavn: gate, veiNummer, veiBokstav: bokstav, enabled: false, fraMatrikkelen: true, antallBoliger: antall, bruksareal });
  return {
    fraMatrikkelen: true, finnerIkkeAdresse: false,
    bygg: [
      { id: nyId(), navn: 'Bygg 1', fraMatrikkelen: true, bygningstypeFraMatrikkelen: '142', visForValgtTiltak: true,
        adresserFraMatrikkelen: [adr('A', 6, 68), adr('B', 6, 74)], adresser: [] },
      { id: nyId(), navn: 'Bygg 2', fraMatrikkelen: true, bygningstypeFraMatrikkelen: '131', visForValgtTiltak: true,
        adresserFraMatrikkelen: [adr('', 1, 112, nr + 2), adr('', 1, 112, nr + 4), adr('', 1, 118, nr + 6)], adresser: [] },
      { id: nyId(), navn: 'Garasje', fraMatrikkelen: true, bygningstypeFraMatrikkelen: '181', visForValgtTiltak: false,
        adresserFraMatrikkelen: [adr('', 0, 0, nr + 8)], adresser: [] }
    ]
  };
}

/* ═══ Lagring ═════════════════════════════════════════════════════ */

function eLes() {
  try { return JSON.parse(localStorage.getItem(E_LAGER)) || null; } catch { return null; }
}
function eSkriv(t) {
  try { localStorage.setItem(E_LAGER, JSON.stringify(t)); } catch { /* privat modus */ }
}
function eTilstand() {
  let t = eLes();
  if (!t || !t.soknader) {
    t = { org: E_FORETAK[0].orgnr, seq: 100, soknader: [], varsler: [] };
    if (typeof eEksempelsoknader === 'function') t.soknader = eEksempelsoknader(t);
    eSkriv(t);
  }
  if (!eRepresenterbare().some(f => f.orgnr === t.org)) t.org = E_FORETAK[0].orgnr;
  return t;
}
function eNullstill() { try { localStorage.removeItem(E_LAGER); } catch { /* */ } }
const eAktivOrg = (t = eTilstand()) => E_FORETAK.find(f => f.orgnr === t.org);
function eNyId(t) { t.seq = (t.seq || 100) + 1; return t.seq; }

/* Varsler som vises øverst på neste side, som i dagens løsning */
function eVarsle(tone, html) {
  const t = eTilstand();
  t.varsler = [...(t.varsler || []), { tone, html }];
  eSkriv(t);
}

/* ═══ Formatering ═════════════════════════════════════════════════ */

const eEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eTusen = n => (n == null || n === '' || Number.isNaN(Number(n)) ? '' : String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
const eKr = n => `${eTusen(n || 0)} kr`;
const eNum = v => { const n = Number(String(v ?? '').replace(/[\s ]/g, '')); return Number.isFinite(n) ? n : 0; };
const eOrgnr = nr => String(nr || '').replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
const eTo = n => String(n).padStart(2, '0');
const eDato = d => `${eTo(d.getDate())}.${eTo(d.getMonth() + 1)}.${d.getFullYear()}`;
const eStor = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* ═══ Ikoner ══════════════════════════════════════════════════════ */

const eSvg = (d, s = 22, w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const E_IKON = {
  pilHoyre: eSvg('<path d="M4 12h15m-6-6 6 6-6 6"/>', 20, 2),
  pilVenstre: eSvg('<path d="M20 12H5m6-6-6 6 6 6"/>', 20, 2),
  pilNed: eSvg('<path d="m5 9 7 7 7-7"/>', 20, 2.2),
  pilOpp: eSvg('<path d="m5 15 7-7 7 7"/>', 20, 2.2),
  hus: eSvg('<path d="M3.5 11 12 3.8l8.5 7.2M5.8 9.4V20h4.4v-5.5h3.6V20h4.4V9.4M16 5.5V3.5h2v3.6"/>', 20),
  personer: eSvg('<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5.5 5"/>', 26),
  hierarki: eSvg('<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>', 26),
  husStor: eSvg('<path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5M16.5 6V3.8h2V8"/>', 26),
  kroner: eSvg('<circle cx="12" cy="12" r="9"/><path d="M8.5 8v8M8.5 12l3.5-4M8.5 12l3.5 4M13.5 16v-5.2c0-.9.7-1.6 1.6-1.6h.9"/>', 26),
  binders: eSvg('<path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l8.3-8.3a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/>', 26, 1.7),
  koffert: eSvg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3 12.5h18"/>', 26),
  briller: eSvg('<circle cx="6.5" cy="14.5" r="3.5"/><circle cx="17.5" cy="14.5" r="3.5"/><path d="M10 14c1.2-.8 2.8-.8 4 0M3 14l1.5-6.5h2M21 14l-1.5-6.5h-2"/>', 26),
  info: eSvg('<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".6" fill="currentColor"/>', 22),
  varsel: eSvg('<path d="M12 3 22 20H2L12 3Z"/><path d="M12 9.5v5"/><circle cx="12" cy="17.2" r=".5" fill="currentColor"/>', 22),
  hake: eSvg('<circle cx="12" cy="12" r="9.5"/><path d="m7.5 12.5 3 3 6-6.5"/>', 22),
  stopp: eSvg('<circle cx="12" cy="12" r="9.5"/><path d="M12 7v6"/><circle cx="12" cy="16.5" r=".6" fill="currentColor"/>', 22),
  feil: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 7v6.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17" r="1.3" fill="#fff"/></svg>',
  pluss: eSvg('<path d="M12 5v14M5 12h14"/>', 20, 2.2),
  soppel: eSvg('<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 13.5h9l1-13.5M10 10v7M14 10v7"/>', 20),
  kopier: eSvg('<rect x="8" y="8" width="12" height="13" rx="1.5"/><path d="M16 8V4.5A1.5 1.5 0 0 0 14.5 3h-9A1.5 1.5 0 0 0 4 4.5v11A1.5 1.5 0 0 0 5.5 17H8"/>', 20),
  blyant: eSvg('<path d="m4 20 1-4.5L16 4.5a2.1 2.1 0 0 1 3 3L8 18.5 4 20Z"/>', 20),
  sjekk: eSvg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 20, 2.4),
  kryss: eSvg('<path d="M6 6l12 12M18 6 6 18"/>', 20, 2.2),
  fil: eSvg('<path d="M6 2.8h8l4.5 4.5V21H6V2.8ZM14 2.8V7.5h4.5"/>', 20, 1.7),
  opplasting: eSvg('<path d="M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4"/>', 20, 1.9),
  send: eSvg('<path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z"/>', 20),
  globus: eSvg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z"/>', 20, 1.7),
  person: eSvg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>', 20, 1.7),
  utlogging: eSvg('<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>', 20),
  ekstern: eSvg('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', 16, 2)
};

/* ═══ Topp og bunn ════════════════════════════════════════════════ */

function eHeader() {
  const t = eTilstand();
  const aktiv = eAktivOrg(t);
  const valg = eRepresenterbare().map(f => `
    <li><button type="button" class="e-profil__valg" data-org="${f.orgnr}" aria-current="${f.orgnr === t.org}">
      <span class="e-profil__ikon" aria-hidden="true">PRO</span>
      <span>${eEsc(f.navn)}<small>Org.nr. ${eOrgnr(f.orgnr)}</small></span>
    </button></li>`).join('');
  return `
<a class="e-skiplink" href="#hovedinnhold">Hopp til hovedinnhold</a>
<div class="e-protobar">
  <span>Klikkbar prototype av e-søknaden for bransje · testdata, ingenting sendes</span>
  <button type="button" id="e-testdata">Testdata</button>
  <button type="button" id="e-nullstill">Start på nytt</button>
</div>
<header class="e-header">
  <div class="e-header__rad">
    <a class="e-header__logo" href="index.html">
      <img src="../ds/logo/husbanken-primary.png" alt="Husbanken">
      <span class="e-header__tjeneste">${E_TJENESTE}</span>
    </a>
    <div class="e-header__hoyre">
      <button type="button" class="e-header__knapp" data-ikke-med="Nynorsk er ikke med i prototypen. Tekstene er på bokmål.">${E_IKON.globus}<span class="e-skjul-smal">Språk</span></button>
      <div class="e-profil">
        <button type="button" class="e-header__knapp e-profil__knapp" id="e-profil" aria-expanded="false" aria-controls="e-profil-meny">
          ${E_IKON.person}<span>${eEsc(E_BRUKER)}<small>${eEsc(aktiv.navn)}</small></span>
        </button>
        <div class="e-profil__meny" id="e-profil-meny" hidden>
          <h2>Representer</h2>
          <ul>${valg}</ul>
        </div>
      </div>
      <button type="button" class="e-header__knapp" data-ikke-med="Innlogging og utlogging er ikke med i prototypen. Du er logget inn som ${eEsc(E_BRUKER)}.">${E_IKON.utlogging}<span class="e-skjul-smal">Logg ut</span></button>
    </div>
  </div>
</header>`;
}

function eFooter() {
  return `
<footer class="e-footer">
  <div class="e-footer__innhold">
    <h2>Om Grunnlån</h2>
    <ul>
      <li><a href="https://husbanken.no/om-husbanken/personvern/" target="_blank" rel="noopener">Personvern</a></li>
      <li><a href="https://uustatus.no/" target="_blank" rel="noopener">Tilgjengelighetserklæring ${E_IKON.ekstern}<span class="e-sr">åpnes i nytt vindu</span></a></li>
    </ul>
    <p class="e-footer__notat">Klikkbar gjenskaping av e-søknaden for bransje, laget for designarbeid.
      Ingen innlogging, ingen backend. Svarene lagres bare i denne nettleseren.</p>
  </div>
</footer>`;
}

function eMonter() {
  const topp = document.getElementById('e-topp');
  const bunn = document.getElementById('e-bunn');
  if (topp) topp.innerHTML = eHeader();
  if (bunn) bunn.innerHTML = eFooter();

  const profil = document.getElementById('e-profil');
  const meny = document.getElementById('e-profil-meny');
  if (profil) {
    profil.addEventListener('click', e => {
      e.stopPropagation();
      const apen = profil.getAttribute('aria-expanded') === 'true';
      profil.setAttribute('aria-expanded', String(!apen));
      meny.hidden = apen;
    });
    document.addEventListener('click', e => {
      if (!meny.hidden && !e.target.closest('.e-profil')) { meny.hidden = true; profil.setAttribute('aria-expanded', 'false'); }
    });
    meny.addEventListener('click', e => {
      const k = e.target.closest('[data-org]');
      if (!k) return;
      const t = eTilstand();
      t.org = k.dataset.org;
      eSkriv(t);
      location.href = 'index.html';
    });
  }
  document.getElementById('e-nullstill')?.addEventListener('click', async () => {
    const ok = await eBekreft({ tittel: 'Starte på nytt?', tekst: 'Alle søknadene og svarene i prototypen slettes fra nettleseren, og eksempelsøknadene kommer tilbake.', bekreft: 'Start på nytt', destruktiv: true });
    if (ok) { eNullstill(); location.href = 'index.html'; }
  });
  document.getElementById('e-testdata')?.addEventListener('click', eVisTestdata);

  document.addEventListener('click', e => {
    const k = e.target.closest('[data-ikke-med]');
    if (!k) return;
    e.preventDefault();
    eBekreft({ tittel: 'Ikke med i prototypen', tekst: k.dataset.ikkeMed, bekreft: 'Lukk', avbryt: null });
  });

  /* Varsler lagt igjen av forrige side */
  const t = eTilstand();
  const main = document.querySelector('main');
  if (t.varsler && t.varsler.length && main) {
    const boks = document.createElement('div');
    boks.className = 'e-varsler';
    boks.setAttribute('role', 'status');
    boks.innerHTML = t.varsler.map(v => `${eCallout(v.tone, v.html, true)}`).join('');
    main.prepend(boks);
    boks.addEventListener('click', e => { if (e.target.closest('.e-varsler__lukk')) e.target.closest('.e-callout').remove(); });
    t.varsler = [];
    eSkriv(t);
  }
}

function eVisTestdata() {
  const rad = (nr, tekst) => `<tr><td>${eOrgnr(nr)}</td><td>${tekst}</td></tr>`;
  eBekreft({
    tittel: 'Testdata i prototypen', bekreft: 'Lukk', avbryt: null, stor: true,
    tekst: `
      <p>Alt er oppdiktet. Bytt foretak i profilmenyen øverst til høyre.</p>
      <h3 class="e-h4">Foretak du kan representere</h3>
      <ul>
        <li><b>Fjordbyen Eiendom AS</b> og <b>Nordlys Boligutvikling AS</b>: vanlige utbyggere.</li>
        <li><b>Kystbygg Utvikling AS</b>: mangler e-post i varslingsadressene, så «Opprett søknad» stopper.</li>
        <li><b>Vestbygg Avdeling Sør</b>: en underenhet, så «Ny søknad» er sperret.</li>
        <li><b>Eksempel Helseforetak SF</b>: ikke i målgruppen, så «Ny søknad» er sperret.</li>
      </ul>
      <h3 class="e-h4">Organisasjonsnumre som finnes i «Enhetsregisteret»</h3>
      <div class="e-tabell-rulle"><table class="e-tabell"><tbody>
        ${rad('976000001', 'Tømrer Hansen AS (foretak)')}${rad('976000002', 'Elektro Berg AS (foretak)')}
        ${rad('976000003', 'Tomteselskapet Nord AS (foretak)')}${rad('964000001', 'Eksempel kommune')}
        ${rad('964000002', 'Nordby kommune')}${rad('964000003', 'Eksempel kommunale eiendom KF')}
        ${rad('945678904', 'Vestbygg Avdeling Sør (underenhet, gir feil)')}
      </tbody></table></div>
      <p>Andre numre gir «Vi finner ingen foretak med dette org.nummeret.»</p>
      <h3 class="e-h4">Matrikkelen</h3>
      <p>Alle kombinasjoner av kommune, gårds- og bruksnummer gir treff med tre bygg: en boligblokk, et rekkehus og en garasje. <b>Bruksnummer 999</b> gir «Ingen treff i matrikkelen».</p>
      <h3 class="e-h4">Kundeopplysninger og signering</h3>
      <p>Kundeskjemaet og signeringstjenesten er egne løsninger. I prototypen later vi som kundeskjemaet blir fylt ut og signert når du trykker på knappen, og personene med signaturrett er oppdiktet.</p>`
  });
}

/* ═══ Byggeklosser som brukes overalt ═════════════════════════════ */

const E_TONE = {
  info: ['', E_IKON.info], advarsel: ['e-callout--advarsel', E_IKON.varsel], positiv: ['e-callout--positiv', E_IKON.hake],
  feil: ['e-callout--feil', E_IKON.stopp], noytral: ['e-callout--noytral', E_IKON.info]
};
function eCallout(tone, html, lukkbar = false, attr = '') {
  const [kl, ikon] = E_TONE[tone] || E_TONE.info;
  return `<div class="e-callout ${kl}"${attr}>${ikon}<div class="e-callout__innhold">${html}</div>${lukkbar
    ? `<button type="button" class="e-varsler__lukk" aria-label="Lukk varsel">${E_IKON.kryss}</button>` : ''}</div>`;
}

function eKort({ tittel, niva = 2, ikon = '', kropp, bunn = '', klasse = '', id = '' }) {
  return `<section class="e-kort ${klasse}"${id ? ` id="${id}"` : ''}>
    ${tittel ? `<div class="e-kort__topp">${ikon}<h${niva}>${tittel}</h${niva}></div>` : ''}
    <div class="e-kort__kropp">${kropp}</div>
    ${bunn ? `<div class="e-kort__bunn">${bunn}</div>` : ''}
  </section>`;
}

/* ═══ Dialog og spinner ═══════════════════════════════════════════ */

function eBekreft({ tittel, tekst, bekreft = 'Bekreft', avbryt = 'Avbryt', destruktiv = false, stor = false }) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.className = `e-modal${stor ? ' e-modal--stor' : ''}`;
    d.setAttribute('aria-labelledby', 'e-modal-tittel');
    const innhold = Array.isArray(tekst) ? tekst.map(t => `<p>${t}</p>`).join('') : (/^\s*</.test(tekst) ? tekst : `<p>${tekst}</p>`);
    d.innerHTML = `
      <div class="e-modal__topp"><h2 id="e-modal-tittel">${tittel}</h2>
        <button type="button" class="e-knapp e-knapp--ikon" data-svar="nei" aria-label="Lukk">${E_IKON.kryss}</button></div>
      <div class="e-modal__kropp">${innhold}</div>
      <div class="e-modal__bunn">
        <button type="button" class="e-knapp ${destruktiv ? 'e-knapp--fylt-destruktiv' : 'e-knapp--prominent'}" data-svar="ja">${bekreft}</button>
        ${avbryt ? `<button type="button" class="e-knapp" data-svar="nei">${avbryt}</button>` : ''}
      </div>`;
    document.body.appendChild(d);
    const lukk = svar => { d.close(); d.remove(); resolve(svar); };
    d.addEventListener('click', e => { const k = e.target.closest('[data-svar]'); if (k) lukk(k.dataset.svar === 'ja'); });
    d.addEventListener('cancel', e => { e.preventDefault(); lukk(false); });
    d.showModal();
  });
}

function eSpinner(tekst = 'Vennligst vent') {
  const s = document.createElement('div');
  s.className = 'e-spinner';
  s.innerHTML = `<div class="e-spinner__hjul" role="alert"><span class="e-sr">${tekst}</span></div>`;
  document.body.appendChild(s);
  return () => s.remove();
}
const eVent = ms => new Promise(r => setTimeout(r, ms));

function eFokuserH1() {
  const h1 = document.querySelector('main h1');
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
}
