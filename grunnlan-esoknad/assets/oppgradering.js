/* ──────────────────────────────────────────────────────────────────
   Oppgradering: tiltak, regler og byggeklosser

   Brukes både på Bolig-steget i søknaden og på forslagssiden. Søkeren
   velger ENTEN bedre tilgjengelighet ELLER mer energieffektive boliger,
   med forbedret energikarakter eller minst 30 prosent effektivisering.
   ────────────────────────────────────────────────────────────────── */

const OG_KARAKTERER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const OG_ENERGI = [
  { v: 'TAK', l: 'Etterisolering av tak og loft' }, { v: 'YTTERVEGG', l: 'Etterisolering yttervegg' },
  { v: 'GULV', l: 'Etterisolering gulv og kjeller' }, { v: 'VINDUER', l: 'Utskifting av vinduer og dører' },
  { v: 'VARMEPUMPE', l: 'Installasjon av varmepumpe' }, { v: 'SOLCELLER', l: 'Installasjon av solceller' },
  { v: 'SOLFANGERE', l: 'Installasjon av solfangere' }, { v: 'VENTILASJON', l: 'Energieffektiv ventilasjonsløsning' },
  { v: 'ANDRE', l: 'Andre tiltak' }
];
const OG_VARMEPUMPE = [
  { v: 'LUFT_LUFT', l: 'Luft-til-luft' }, { v: 'LUFT_VANN', l: 'Luft-til-vann' },
  { v: 'BERG', l: 'Bergvarmepumpe' }, { v: 'AVTREKK', l: 'Avtrekksvarmepumpe' }
];
const OG_TILGJ = [
  { v: 'TRINNFRI', l: 'Trinnfri adkomstvei' }, { v: 'INNGANGSDOR', l: 'Oppgradering av inngangsdør eller -parti' },
  { v: 'OVERBYGD', l: 'Overbygd inngangsparti med plass til vogn' }, { v: 'INNGANGSPLAN', l: 'Endret inngangsplan' },
  { v: 'TERSKELFRI', l: 'Terskelfrie døråpninger' }, { v: 'BAD', l: 'Tilgjengelig bad' }, { v: 'ANNET', l: 'Annet' }
];

/* ═══ Regler ══════════════════════════════════════════════════════ */

const ogEnergi = d => d.mal === 'ENERGI';
const ogKarakter = d => ogEnergi(d) && d.energivei === 'KARAKTER';
const ogTiltakListe = d => (d.mal === 'TILGJ' ? OG_TILGJ : OG_ENERGI);
const ogKlar = d => d.mal === 'TILGJ' || (ogEnergi(d) && !!d.energivei);
const ogAnnetKode = d => (d.mal === 'TILGJ' ? 'ANNET' : 'ANDRE');

/* Hvor mange karakterer boligen må forbedres med, ut fra karakteren før */
const ogKrav = fore => (['F', 'G'].includes(fore) ? 2 : 1);
const ogMal = fore => OG_KARAKTERER[Math.max(0, OG_KARAKTERER.indexOf(fore) - ogKrav(fore))];

/* Regelbrudd som vises med en gang (de stopper ikke «Neste steg») */
function ogKarakterAdvarsel(fore, etter) {
  if (!fore) return '';
  if (['A', 'B'].includes(fore)) return 'Bare boliger med energikarakter C eller dårligere kan få lån til oppgradering.';
  if (!etter) return '';
  const forbedring = OG_KARAKTERER.indexOf(fore) - OG_KARAKTERER.indexOf(etter);
  if (forbedring < ogKrav(fore)) return `Boliger med energikarakter ${fore} må forbedres med minst ${ogKrav(fore) === 2 ? 'to karakterer' : 'én karakter'}, til ${ogMal(fore)} eller bedre.`;
  return '';
}

/* Det som må være fylt ut for én boenhet, eller én pakke/felles valg */
function ogManglerFor(d, x) {
  const f = {};
  if (ogKarakter(d)) {
    if (!x.fore) f.fore = 'Velg energikarakter før oppgradering.';
    if (!x.etter) f.etter = 'Velg energikarakter etter oppgradering.';
  }
  const t = (x.tiltak || []).filter(k => ogTiltakListe(d).some(o => o.v === k));
  if (!t.length) f.tiltak = 'Velg minst ett tiltak.';
  if (t.includes('VARMEPUMPE') && d.mal !== 'TILGJ' && !x.varmepumpe) f.varmepumpe = 'Velg type varmepumpe.';
  if (t.includes(ogAnnetKode(d)) && V.tom(x.annet)) f.annet = 'Beskriv det andre tiltaket.';
  return f;
}

/* ═══ Byggeklosser ════════════════════════════════════════════════ */

function ogTiltakTekst(d, x) {
  const t = ogTiltakListe(d).filter(o => (x.tiltak || []).includes(o.v));
  if (!t.length) return '<span class="e-sekundaer">Ingen valgt</span>';
  return t.map(o => {
    if (o.v === 'VARMEPUMPE' && x.varmepumpe) return `${o.l} (${(OG_VARMEPUMPE.find(v => v.v === x.varmepumpe) || {}).l.toLowerCase()})`;
    if (o.v === ogAnnetKode(d) && x.annet) return `${o.l}: ${eEsc(x.annet)}`;
    return o.l;
  }).join(', ');
}

/* Avkrysning for tiltakene. Varmepumpe får type, og «Andre tiltak» /
   «Annet» får et tekstfelt, rett under valget. */
function ogTiltakVelger(d, base, { label = 'Tiltak', kompakt = false } = {}) {
  const annet = ogAnnetKode(d);
  return `<div class="og-tiltak${kompakt ? ' og-tiltak--kompakt' : ''}">${F.avkryss({
    felt: `${base}.tiltak`, label,
    valg: ogTiltakListe(d).map(o => ({
      ...o,
      under: o.v === 'VARMEPUMPE' ? F.radio({ felt: `${base}.varmepumpe`, label: 'Hvilken type varmepumpe?', valg: OG_VARMEPUMPE })
        : o.v === annet ? F.tekst({ felt: `${base}.annet`, label: o.v === 'ANNET' ? 'Beskriv tiltaket' : 'Beskriv de andre tiltakene', bredde: 'l' }) : ''
    }))
  })}</div>`;
}

function ogKarakterSelect(felt, label, verdi, { tom = '–' } = {}) {
  return `<select class="e-select og-sel" id="${F.id(felt)}" data-felt="${felt}" data-type="velg" aria-label="${label}">
    <option value="" ${verdi ? '' : 'selected'} disabled>${tom}</option>
    ${OG_KARAKTERER.map(k => `<option value="${k}" ${verdi === k ? 'selected' : ''}>${k}</option>`).join('')}</select>`;
}

const ogAdv = tekst => (tekst ? `<div class="og-adv">${E_IKON.feil}<span>${tekst}</span></div>` : '');
const ogKrevd = (vis, tekst) => (vis && tekst ? `<div class="og-adv">${E_IKON.feil}<span>${tekst}</span></div>` : '');

/* Valget øverst, likt i alle forslagene */
function ogValg(d, p) {
  const besparelse = d.besparelse;
  const forLav = !V.tom(besparelse) && V.heltall(besparelse) && eNum(besparelse) < 30;
  return `
    <h2 class="e-h2">Hva skal oppgraderingen gi?</h2>
    ${F.radio({ felt: `${p}.mal`, label: '<span class="e-sr">Hva skal oppgraderingen gi?</span>', valg: [
      { v: 'TILGJ', l: 'Bedre tilgjengelighet', hjelp: 'For eksempel trinnfri adkomstvei, terskelfrie døråpninger eller tilgjengelig bad. Husbanken vurderer om tiltakene gjør boligene mer tilgjengelige.' },
      { v: 'ENERGI', l: 'Mer energieffektive boliger', hjelp: 'Boligene må enten få bedre energikarakter, eller bli minst 30 prosent mer energieffektive.' }
    ] })}
    ${ogEnergi(d) ? F.radio({ felt: `${p}.energivei`, label: 'Hvordan skal dere vise at boligene blir mer energieffektive?', valg: [
      { v: 'KARAKTER', l: 'Med forbedret energikarakter' },
      { v: 'PROSENT', l: 'Med energieffektivisering på minst 30 prosent' }
    ] }) : ''}
    ${ogEnergi(d) && d.energivei === 'PROSENT' ? `<div class="e-felt${F.harFeil(`${p}.besparelse`) ? ' e-felt--feil' : ''}" data-feltboks="${p}.besparelse">
      <label class="e-felt__label" for="${F.id(`${p}.besparelse`)}">Hvor stor energibesparelse forventer dere?</label>
      <span class="e-felt__hjelp">Tallet står i uttalelsen fra energirådgiveren.</span>
      <div class="e-enhet"><input class="e-input e-input--xs" id="${F.id(`${p}.besparelse`)}" inputmode="numeric" data-felt="${p}.besparelse" data-type="tekst" data-levende value="${eEsc(besparelse ?? '')}"><span class="e-enhet__tekst">prosent</span></div>
      ${F.feilHtml(`${p}.besparelse`)}${forLav ? ogAdv('For å kvalifisere til dette lånet må energibesparelsen være minst 30 prosent.') : ''}
    </div>` : ''}
    ${d.mal === 'TILGJ' ? eCallout('info', '<p class="e-fet e-mb0">Dette må dere laste opp senere i søknaden</p><ul class="e-mb0"><li>Tegninger</li><li>Prosjektbeskrivelse fra utførende</li></ul>') : ''}
    ${ogKarakter(d) ? eCallout('info', `<p class="e-fet e-mb0">Slik må energikarakteren forbedres</p>
      <ul><li>Det gis bare lån til boliger som har energikarakter C eller dårligere før oppgraderingen.</li>
        <li>Boliger med C, D og E må forbedres med minst én karakter.</li><li>Boliger med F og G må forbedres med minst to karakterer.</li></ul>
      <p>Vi anbefaler å bruke en energirådgiver, så energikarakteren etter oppgraderingen blir mest mulig riktig. Kostnadene til energirådgiveren tar dere med på Økonomi-steget. Vil dere anslå selv, kan <a href="https://www.enova.no/" target="_blank" rel="noopener">Enovas veiledning (åpner i ny fane)</a> hjelpe.</p>
      <p class="e-mb0">Senere i søknaden laster dere opp tegninger, prosjektbeskrivelse og energimerke for boligene.</p>`) : ''}
    ${ogEnergi(d) && d.energivei === 'PROSENT' ? eCallout('info', `<p class="e-fet e-mb0">Dette må dere laste opp senere i søknaden</p>
      <ul><li>Tegninger og beskrivelse fra utførende</li><li>Uttalelse fra energirådgiver</li><li>Effektregnskap etter NS 3031:2025</li></ul>
      <p class="e-mb0">Kostnadene til energirådgiveren tar dere med på Økonomi-steget.</p>`) : ''}`;
}

/* Feilene for valget øverst */
function ogValgFeil(d, p) {
  const f = [];
  if (!d.mal) f.push({ nokkel: `${p}.mal`, melding: 'Du må velge hva oppgraderingen skal gi.' });
  if (ogEnergi(d) && !d.energivei) f.push({ nokkel: `${p}.energivei`, melding: 'Du må velge hvordan dere vil vise at boligene blir mer energieffektive.' });
  if (ogEnergi(d) && d.energivei === 'PROSENT') {
    if (V.tom(d.besparelse)) f.push({ nokkel: `${p}.besparelse`, melding: 'Skriv hvor stor energibesparelse dere forventer.' });
    else if (!V.heltall(d.besparelse)) f.push({ nokkel: `${p}.besparelse`, melding: 'Energibesparelsen kan bare være tall, for eksempel 35.' });
  }
  return f;
}

/* Oppgraderingspakkene: ett kort per pakke med energikarakter og tiltak */
const ogPakkeTittel = (x, j) => (x && x.navn) || `Pakke ${j + 1}`;
const ogPakkeNavn = (d, id) => { const j = (d.pakker || []).findIndex(x => x.id === Number(id)); return ogPakkeTittel(d.pakker[j], j); };
function ogPakkeKort(d, p, vis) {
  return d.pakker.map((x, j) => {
    const mm = ogManglerFor(d, x);
    const navn = eEsc(ogPakkeTittel(x, j));
    return eKort({ tittel: `${navn}<button type="button" class="e-knapp e-knapp--ikon og-pakkenavn" data-handling="ogEndrePakkenavn" data-j="${j}" title="Endre navn" aria-label="Endre navn på ${navn}">${E_IKON.blyant}</button>`, niva: 3, kropp: `
      ${ogKarakter(d) ? `<div class="e-to">
        <div class="e-felt" data-feltboks="${p}.pakker.${j}.fore"><label class="e-felt__label" for="${F.id(`${p}.pakker.${j}.fore`)}">Energikarakter før</label>${ogKarakterSelect(`${p}.pakker.${j}.fore`, `Energikarakter før for ${navn}`, x.fore)}${ogKrevd(vis, mm.fore)}</div>
        <div class="e-felt" data-feltboks="${p}.pakker.${j}.etter"><label class="e-felt__label" for="${F.id(`${p}.pakker.${j}.etter`)}">Energikarakter etter</label>${ogKarakterSelect(`${p}.pakker.${j}.etter`, `Energikarakter etter for ${navn}`, x.etter)}${ogKrevd(vis, mm.etter)}</div>
      </div>${ogAdv(ogKarakterAdvarsel(x.fore, x.etter))}` : ''}
      <div data-feltboks="${p}.pakker.${j}.tiltak">${ogTiltakVelger(d, `${p}.pakker.${j}`, { label: 'Tiltak' })}${ogKrevd(vis, mm.tiltak || mm.varmepumpe || mm.annet)}</div>`,
      bunn: d.pakker.length > 1 ? `<button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="ogSlettPakke" data-j="${j}">${E_IKON.soppel}Slett ${navn}</button>` : '' });
  }).join('');
}

/* Feilene for pakkene */
function ogPakkeFeil(d, p) {
  return (d.pakker || []).flatMap((x, j) => {
    const a = ogKarakter(d) ? ogKarakterAdvarsel(x.fore, x.etter) : '';
    return [...Object.entries(ogManglerFor(d, x)).map(([k, t]) => ({ nokkel: `${p}.pakker.${j}.${k}`, melding: `${ogPakkeTittel(x, j)}: ${t}` })),
      ...(a ? [{ nokkel: `${p}.pakker.${j}.etter`, melding: `${ogPakkeTittel(x, j)}: ${a}` }] : [])];
  });
}
