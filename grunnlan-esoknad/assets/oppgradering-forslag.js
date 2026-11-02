/* ──────────────────────────────────────────────────────────────────
   Bolig-steget ved oppgradering: fem forslag uten modal

   I dag lager man først en «boligkvalitet» i en modal med poeng, og
   knytter den så til boenhetene. Her velger man i stedet hva
   oppgraderingen skal gi, slik Miro-flyten viser:

     ENTEN bedre tilgjengelighet (skjønnsmessig vurdering, tiltak fra
     en liste), ELLER mer energieffektive boliger, enten med forbedret
     energikarakter eller med minst 30 prosent energieffektivisering.

   Så kommer tabellen med boenhetene. Forslagene skiller seg i hvordan
   man fyller ut og masseredigerer energikarakter og tiltak.
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
const OG_ADR = [{ id: 'a', navn: 'Elvegata 26A' }, { id: 'b', navn: 'Elvegata 26B' }];

/* Åtte boenheter fra Matrikkelen, fire på hver adresse */
function ogRader() {
  let n = 0;
  return OG_ADR.flatMap(a => ['H01', 'H02'].flatMap((et, ei) => ['01', '02'].map((nr, ni) => ({
    id: ++n, adr: a.id, etasje: et, nr, betegnelse: `${a.id.toUpperCase()}${ei + 1}${ni + 1}`, bra: String(62 + ni * 12 + ei * 2), rom: String(2 + ni)
  }))));
}

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

const ogNavn = r => `${r.etasje}${r.nr}`;
const ogAdrNavn = id => (OG_ADR.find(a => a.id === id) || {}).navn;

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

/* Menyen bak de tre prikkene: Legg til, Dupliser, Slett */
function ogMeny(p, r, apen) {
  return `<div class="og-meny-boks">
    <button type="button" class="e-knapp e-knapp--ikon og-prikker" data-handling="ogMeny" data-p="${p}" data-id="${r.id}" aria-haspopup="menu" aria-expanded="${apen}" aria-label="Flere valg for ${ogNavn(r)}">⋯</button>
    ${apen ? `<div class="og-meny" role="menu" aria-label="Valg for ${ogNavn(r)}">
      <button type="button" role="menuitem" class="og-meny__valg" data-handling="ogLegg" data-p="${p}" data-id="${r.id}">${E_IKON.pluss}Legg til</button>
      <button type="button" role="menuitem" class="og-meny__valg" data-handling="ogDupliser" data-p="${p}" data-id="${r.id}">${E_IKON.kopier}Dupliser</button>
      <button type="button" role="menuitem" class="og-meny__valg og-meny__valg--slett" data-handling="ogSlett" data-p="${p}" data-id="${r.id}">${E_IKON.soppel}Slett</button>
    </div>` : ''}
  </div>`;
}

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

/* Rader gruppert på adresse. kolonner(r, i) gir cellene for raden. */
function ogTabell(d, p, { hode, rad, ekstraRad, velg = true, meny = true }) {
  const alle = d.rader.length && d.rader.every(r => r.valgt);
  return `<div class="e-tabell-rulle og-tabell-rulle"><table class="e-tabell og-tabell">
    <thead><tr>
      ${velg ? `<th class="og-smal"><label class="e-valg" style="padding:0"><input type="checkbox" data-handling="ogVelgAlle" data-p="${p}" ${alle ? 'checked' : ''} aria-label="Velg alle boenhetene"></label></th>` : ''}
      <th>Bolig</th><th>Betegnelse</th><th class="e-tall">BRA-i</th>${hode}${meny ? '<th class="og-smal"><span class="e-sr">Valg</span></th>' : ''}</tr></thead>
    <tbody>${OG_ADR.map(a => {
      const rader = d.rader.map((r, i) => ({ r, i })).filter(x => x.r.adr === a.id)
        .sort((x, y) => (x.r.etasje + x.r.nr).localeCompare(y.r.etasje + y.r.nr));
      if (!rader.length) return '';
      return `<tr class="og-adr"><th colspan="20">${a.navn}</th></tr>${rader.map(({ r, i }) => `
        <tr class="${r.valgt ? 'og-valgt' : ''}">
          ${velg ? `<td class="og-smal"><label class="e-valg" style="padding:0"><input type="checkbox" data-felt="${p}.rader.${i}.valgt" data-type="sjekk" ${r.valgt ? 'checked' : ''} aria-label="Velg ${ogNavn(r)}"></label></td>` : ''}
          <td>${ogNavn(r)}</td><td>${eEsc(r.betegnelse)}</td><td class="e-tall">${r.bra}</td>
          ${rad(r, i)}
          ${meny ? `<td class="og-smal">${ogMeny(p, r, d.meny === r.id)}</td>` : ''}
        </tr>${ekstraRad ? ekstraRad(r, i) : ''}`).join('')}`;
    }).join('')}</tbody></table></div>`;
}

/* Kolonnene for energikarakter, som celler med nedtrekk og advarsel */
function ogKarakterCeller(d, p, r, i, vis) {
  const m = ogManglerFor(d, r);
  return `<td>${ogKarakterSelect(`${p}.rader.${i}.fore`, `Energikarakter før for ${ogNavn(r)}`, r.fore)}${ogKrevd(vis, m.fore)}</td>
    <td>${ogKarakterSelect(`${p}.rader.${i}.etter`, `Energikarakter etter for ${ogNavn(r)}`, r.etter)}${ogKrevd(vis, m.etter)}${ogAdv(ogKarakterAdvarsel(r.fore, r.etter))}</td>`;
}

/* Feilene for en hel tabell, til feilsammendraget */
function ogRadFeil(d, p, rader = d.rader, hent = r => r) {
  return rader.flatMap(r => {
    const i = d.rader.indexOf(r);
    const m = ogManglerFor(d, hent(r));
    const adv = ogKarakter(d) ? ogKarakterAdvarsel(hent(r).fore, hent(r).etter) : '';
    return [...Object.entries(m).map(([k, t]) => ({ nokkel: `${p}.rader.${i}.${k}`, melding: `${ogNavn(r)}: ${t}` })),
      ...(adv ? [{ nokkel: `${p}.rader.${i}.etter`, melding: `${ogNavn(r)}: ${adv}` }] : [])];
  });
}
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
const ogValgte = d => d.rader.filter(r => r.valgt);

/* Kopierer utfylte felt fra et utkast til boenhetene */
function ogBruk(d, mal, rader) {
  rader.forEach(r => {
    if (mal.fore) r.fore = mal.fore;
    if (mal.etter) r.etter = mal.etter;
    if ((mal.tiltak || []).length) { r.tiltak = [...mal.tiltak]; r.varmepumpe = mal.varmepumpe; r.annet = mal.annet; }
  });
}

/* ═══ Forslag 1: Verktøylinje for valgte boenheter ════════════════ */

const OG1 = {
  navn: 'Verktøylinje for valgte',
  ide: 'Hver boenhet kan fylles ut rett i tabellen. Krysser man av flere, kommer en verktøylinje over tabellen der man setter energikarakter og tiltak for alle de valgte på én gang.',
  fordeler: ['Kjent mønster fra e-post og regneark.', 'Én boenhet og mange boenheter fylles ut på samme sted.', 'Advarslene står på raden de gjelder.'],
  ulemper: ['Tabellen blir bred med både energikarakter og tiltak.', 'Verktøylinjen kan være vanskelig å oppdage før man har krysset av noe.'],
  tegn: (d, p, vis) => {
    if (!ogKlar(d)) return '';
    const valgte = ogValgte(d);
    const m = d.masse || {};
    const verktoy = valgte.length ? `<div class="og-verktoy" role="region" aria-label="Rediger valgte boenheter">
      <span class="e-fet">${valgte.length} ${valgte.length === 1 ? 'boenhet' : 'boenheter'} valgt</span>
      ${ogKarakter(d) ? `<label class="og-verktoy__felt">Før ${ogKarakterSelect(`${p}.masse.fore`, 'Energikarakter før for valgte', m.fore)}</label>
        <label class="og-verktoy__felt">Etter ${ogKarakterSelect(`${p}.masse.etter`, 'Energikarakter etter for valgte', m.etter)}</label>` : ''}
      <button type="button" class="e-knapp e-knapp--liten" data-handling="og1Tiltak" aria-expanded="${!!d.masseTiltak}">Tiltak ${E_IKON.pilNed}</button>
      <button type="button" class="e-knapp e-knapp--liten e-knapp--prominent" data-handling="og1Bruk">Bruk på valgte</button>
      <button type="button" class="e-knapp e-knapp--liten e-knapp--subtil" data-handling="og1Fjern">Fjern valg</button>
      ${d.masseTiltak ? `<div class="og-verktoy__tiltak">${ogTiltakVelger(d, `${p}.masse`, { label: 'Tiltak for de valgte boenhetene', kompakt: true })}</div>` : ''}
    </div>` : `<p class="e-liten e-sekundaer">Kryss av flere boenheter for å fylle ut dem samtidig.</p>`;
    return `<h2 class="e-h2 e-mt">Boenhetene</h2>${verktoy}
      ${ogTabell(d, p, {
        hode: `${ogKarakter(d) ? '<th>Energikarakter før</th><th>Energikarakter etter</th>' : ''}<th>Tiltak</th>`,
        rad: (r, i) => {
          const mm = ogManglerFor(d, r);
          return `${ogKarakter(d) ? ogKarakterCeller(d, p, r, i, vis) : ''}
            <td class="og-tiltakcelle">${ogTiltakTekst(d, r)}<br><button type="button" class="e-knapp e-knapp--lenke" data-handling="og1Apne" data-id="${r.id}" aria-expanded="${d.apen === r.id}">${d.apen === r.id ? 'Lukk' : 'Endre tiltak'}</button>
              ${ogKrevd(vis, mm.tiltak || mm.varmepumpe || mm.annet)}</td>`;
        },
        ekstraRad: (r, i) => (d.apen === r.id ? `<tr class="og-utvidet"><td colspan="20">${ogTiltakVelger(d, `${p}.rader.${i}`, { label: `Tiltak for ${ogNavn(r)}` })}</td></tr>` : '')
      })}`;
  },
  valider: (d, p) => [...ogValgFeil(d, p), ...(ogKlar(d) ? ogRadFeil(d, p) : [])]
};

/* ═══ Forslag 2: Panel for valgte boenheter ═══════════════════════ */

const OG2 = {
  navn: 'Panel for valgte',
  ide: 'Tabellen viser bare hva som er valgt for hver boenhet. Man krysser av én eller flere og trykker «Rediger valgte». Da åpnes et panel fra siden med energikarakter og tiltak.',
  fordeler: ['Tabellen er rolig og lett å lese.', 'God plass til tiltakene og typen varmepumpe i panelet.', 'Samme vei for én boenhet og for mange.'],
  ulemper: ['Ett klikk mer for å endre én boenhet.', 'Panelet dekker deler av tabellen mens man redigerer.'],
  tegn: (d, p, vis) => {
    if (!ogKlar(d)) return '';
    const valgte = ogValgte(d);
    const m = d.masse || {};
    return `<h2 class="e-h2 e-mt">Boenhetene</h2>
      <div class="og-handlinger">
        <button type="button" class="e-knapp e-knapp--prominent" data-handling="og2Apne" ${valgte.length ? '' : 'disabled'}>${E_IKON.blyant}Rediger valgte${valgte.length ? ` (${valgte.length})` : ''}</button>
        <span class="e-liten e-sekundaer">${valgte.length ? '' : 'Kryss av boenhetene du vil fylle ut.'}</span>
      </div>
      ${ogTabell(d, p, {
        hode: `${ogKarakter(d) ? '<th>Før</th><th>Etter</th>' : ''}<th>Tiltak</th>`,
        rad: r => {
          const mm = ogManglerFor(d, r);
          return `${ogKarakter(d) ? `<td>${r.fore || '<span class="e-sekundaer">–</span>'}${ogKrevd(vis, mm.fore)}</td><td>${r.etter || '<span class="e-sekundaer">–</span>'}${ogKrevd(vis, mm.etter)}${ogAdv(ogKarakterAdvarsel(r.fore, r.etter))}</td>` : ''}
            <td class="og-tiltakcelle">${ogTiltakTekst(d, r)}${ogKrevd(vis, mm.tiltak || mm.varmepumpe || mm.annet)}</td>`;
        }
      })}
      ${d.panel ? `<div class="og-skygge" data-handling="og2Lukk"></div>
        <aside class="og-panel" role="dialog" aria-modal="true" aria-labelledby="og2-tittel">
          <div class="og-panel__topp"><h2 class="e-h3 e-mb0" id="og2-tittel">Rediger ${valgte.length === 1 ? ogNavn(valgte[0]) : `${valgte.length} boenheter`}</h2>
            <button type="button" class="e-knapp e-knapp--ikon" data-handling="og2Lukk" aria-label="Lukk">${E_IKON.kryss}</button></div>
          <div class="og-panel__kropp">
            <p class="e-liten e-sekundaer">${valgte.map(ogNavn).join(', ')}</p>
            ${ogKarakter(d) ? `<div class="e-to">
              <div class="e-felt"><label class="e-felt__label" for="${F.id(`${p}.masse.fore`)}">Energikarakter før</label>${ogKarakterSelect(`${p}.masse.fore`, 'Energikarakter før', m.fore, { tom: valgte.length > 1 ? 'Ikke endre' : '–' })}</div>
              <div class="e-felt"><label class="e-felt__label" for="${F.id(`${p}.masse.etter`)}">Energikarakter etter</label>${ogKarakterSelect(`${p}.masse.etter`, 'Energikarakter etter', m.etter, { tom: valgte.length > 1 ? 'Ikke endre' : '–' })}</div>
            </div>${ogAdv(ogKarakterAdvarsel(m.fore, m.etter))}` : ''}
            ${ogTiltakVelger(d, `${p}.masse`, { label: 'Tiltak' })}
          </div>
          <div class="og-panel__bunn">
            <button type="button" class="e-knapp e-knapp--prominent" data-handling="og2Lagre">Lagre for ${valgte.length === 1 ? ogNavn(valgte[0]) : `${valgte.length} boenheter`}</button>
            <button type="button" class="e-knapp" data-handling="og2Lukk">Avbryt</button>
          </div>
        </aside>` : ''}`;
  },
  valider: (d, p) => [...ogValgFeil(d, p), ...(ogKlar(d) ? ogRadFeil(d, p) : [])]
};

/* ═══ Forslag 3: Felles valg, med unntak ══════════════════════════ */

const ogEffektiv = (d, r) => (r.egne ? r : { ...r, fore: d.felles ? d.felles.fore : undefined, etter: d.felles ? d.felles.etter : undefined, tiltak: (d.felles || {}).tiltak, varmepumpe: (d.felles || {}).varmepumpe, annet: (d.felles || {}).annet });
const OG3 = {
  navn: 'Felles valg med unntak',
  ide: 'De fleste oppgraderinger er like for alle boligene. Man fyller derfor ut én gang for hele prosjektet, og tabellen viser at alle boenhetene følger det. Boenheter som er annerledes, får «Egne valg».',
  fordeler: ['Raskest når alle boligene får det samme.', 'Lite å fylle ut, men det går fortsatt an å gjøre unntak.', 'Tydelig hvilke boenheter som skiller seg ut.'],
  ulemper: ['Energikarakteren før er ofte forskjellig mellom boligene, og da blir det mange unntak.', 'To steder å se for å forstå hva som gjelder en boenhet.'],
  tegn: (d, p, vis) => {
    if (!ogKlar(d)) return '';
    d.felles = d.felles || {};
    const ff = ogManglerFor(d, d.felles);
    return `<h2 class="e-h2 e-mt">Gjelder alle boenhetene</h2>
      ${eKort({ tittel: '', kropp: `
        ${ogKarakter(d) ? `<div class="e-to">
          <div class="e-felt"><label class="e-felt__label" for="${F.id(`${p}.felles.fore`)}">Energikarakter før</label>${ogKarakterSelect(`${p}.felles.fore`, 'Energikarakter før for alle', d.felles.fore)}${ogKrevd(vis, ff.fore)}</div>
          <div class="e-felt"><label class="e-felt__label" for="${F.id(`${p}.felles.etter`)}">Energikarakter etter</label>${ogKarakterSelect(`${p}.felles.etter`, 'Energikarakter etter for alle', d.felles.etter)}${ogKrevd(vis, ff.etter)}</div>
        </div>${ogAdv(ogKarakterAdvarsel(d.felles.fore, d.felles.etter))}` : ''}
        ${ogTiltakVelger(d, `${p}.felles`, { label: 'Tiltak' })}${ogKrevd(vis, ff.tiltak || ff.varmepumpe || ff.annet)}` })}
      <h2 class="e-h2 e-mt">Boenhetene</h2>
      <p>Alle boenhetene følger valgene over. Slå på «Egne valg» for boenheter som er annerledes.</p>
      ${ogTabell(d, p, {
        velg: false,
        hode: `<th>Egne valg</th>${ogKarakter(d) ? '<th>Før</th><th>Etter</th>' : ''}<th>Tiltak</th>`,
        rad: (r, i) => {
          const e = ogEffektiv(d, r);
          const mm = r.egne ? ogManglerFor(d, r) : {};
          return `<td><label class="og-bryter"><input type="checkbox" data-felt="${p}.rader.${i}.egne" data-type="sjekk" ${r.egne ? 'checked' : ''} aria-label="Egne valg for ${ogNavn(r)}"><span class="og-bryter__spor"></span></label></td>
            ${ogKarakter(d) ? (r.egne ? ogKarakterCeller(d, p, r, i, vis) : `<td class="e-sekundaer">${e.fore || '–'}</td><td class="e-sekundaer">${e.etter || '–'}</td>`) : ''}
            <td class="og-tiltakcelle">${r.egne ? `${ogTiltakTekst(d, r)}<br><button type="button" class="e-knapp e-knapp--lenke" data-handling="og1Apne" data-id="${r.id}">${d.apen === r.id ? 'Lukk' : 'Endre tiltak'}</button>${ogKrevd(vis, mm.tiltak || mm.varmepumpe || mm.annet)}`
    : `<span class="e-sekundaer">Som for alle</span>`}</td>`;
        },
        ekstraRad: (r, i) => (r.egne && d.apen === r.id ? `<tr class="og-utvidet"><td colspan="20">${ogTiltakVelger(d, `${p}.rader.${i}`, { label: `Tiltak for ${ogNavn(r)}` })}</td></tr>` : '')
      })}`;
  },
  valider: (d, p) => {
    const f = ogValgFeil(d, p);
    if (!ogKlar(d)) return f;
    const ff = ogManglerFor(d, d.felles || {});
    Object.entries(ff).forEach(([k, t]) => f.push({ nokkel: `${p}.felles.${k}`, melding: `Gjelder alle: ${t}` }));
    if (ogKarakter(d)) { const a = ogKarakterAdvarsel((d.felles || {}).fore, (d.felles || {}).etter); if (a) f.push({ nokkel: `${p}.felles.etter`, melding: `Gjelder alle: ${a}` }); }
    return [...f, ...ogRadFeil(d, p, d.rader.filter(r => r.egne))];
  }
};

/* ═══ Forslag 4: Oppgraderingspakker rett på siden ════════════════ */

const OG4 = {
  navn: 'Oppgraderingspakker',
  ide: 'Som boligkvalitetene i dag, men uten modal og uten poeng. Man lager én eller flere oppgraderingspakker rett på siden, og velger pakke for hver boenhet i tabellen, eller for flere på én gang.',
  fordeler: ['Kjent for dem som har brukt søknaden før.', 'Passer når prosjektet har noen få typer boliger som oppgraderes ulikt.', 'Endrer man pakken, endres alle boenhetene som har den.'],
  ulemper: ['Et ekstra begrep, «pakke», å forstå.', 'Energikarakteren før hører egentlig til boligen, ikke pakken.'],
  tegn: (d, p, vis) => {
    if (!ogKlar(d)) return '';
    d.pakker = d.pakker && d.pakker.length ? d.pakker : [{ id: 1 }];
    const valgte = ogValgte(d);
    const pk = id => d.pakker.find(x => x.id === Number(id));
    return `<h2 class="e-h2 e-mt">Oppgraderingspakker</h2>
      <p>Lag én pakke for hver måte boligene skal oppgraderes på. Er alle like, holder det med én.</p>
      ${d.pakker.map((x, j) => {
        const mm = ogManglerFor(d, x);
        return eKort({ tittel: `Pakke ${j + 1}`, niva: 3, kropp: `
          ${ogKarakter(d) ? `<div class="e-to">
            <div class="e-felt"><label class="e-felt__label" for="${F.id(`${p}.pakker.${j}.fore`)}">Energikarakter før</label>${ogKarakterSelect(`${p}.pakker.${j}.fore`, 'Energikarakter før', x.fore)}${ogKrevd(vis, mm.fore)}</div>
            <div class="e-felt"><label class="e-felt__label" for="${F.id(`${p}.pakker.${j}.etter`)}">Energikarakter etter</label>${ogKarakterSelect(`${p}.pakker.${j}.etter`, 'Energikarakter etter', x.etter)}${ogKrevd(vis, mm.etter)}</div>
          </div>${ogAdv(ogKarakterAdvarsel(x.fore, x.etter))}` : ''}
          ${ogTiltakVelger(d, `${p}.pakker.${j}`, { label: 'Tiltak' })}${ogKrevd(vis, mm.tiltak || mm.varmepumpe || mm.annet)}`,
          bunn: d.pakker.length > 1 ? `<button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="og4Slett" data-j="${j}">${E_IKON.soppel}Slett pakken</button>` : '' });
      }).join('')}
      <p><button type="button" class="e-knapp" data-handling="og4Legg">${E_IKON.pluss}Legg til pakke</button></p>
      <h2 class="e-h2 e-mt">Boenhetene</h2>
      <div class="og-handlinger">
        <label class="og-verktoy__felt">Gi de valgte
          <select class="e-select og-sel og-sel--bred" data-felt="${p}.massePakke" data-type="velg" aria-label="Pakke for valgte boenheter">
            <option value="" disabled ${d.massePakke ? '' : 'selected'}>Velg pakke</option>
            ${d.pakker.map((x, j) => `<option value="${x.id}" ${String(d.massePakke) === String(x.id) ? 'selected' : ''}>Pakke ${j + 1}</option>`).join('')}
          </select></label>
        <button type="button" class="e-knapp e-knapp--liten" data-handling="og4Bruk" ${valgte.length ? '' : 'disabled'}>Bruk på valgte${valgte.length ? ` (${valgte.length})` : ''}</button>
      </div>
      ${ogTabell(d, p, {
        hode: '<th>Pakke</th><th>Hva pakken gir</th>',
        rad: (r, i) => {
          const x = pk(r.pakke);
          return `<td><select class="e-select og-sel og-sel--bred" data-felt="${p}.rader.${i}.pakke" data-type="velg" aria-label="Pakke for ${ogNavn(r)}">
              <option value="" disabled ${x ? '' : 'selected'}>Velg</option>
              ${d.pakker.map((y, j) => `<option value="${y.id}" ${x === y ? 'selected' : ''}>Pakke ${j + 1}</option>`).join('')}</select>
              ${ogKrevd(vis && !x, 'Velg pakke.')}</td>
            <td class="og-tiltakcelle">${x ? `${ogKarakter(d) && x.fore && x.etter ? `<b>${x.fore} → ${x.etter}</b> · ` : ''}${ogTiltakTekst(d, x)}` : '<span class="e-sekundaer">–</span>'}</td>`;
        }
      })}`;
  },
  valider: (d, p) => {
    const f = ogValgFeil(d, p);
    if (!ogKlar(d)) return f;
    (d.pakker || []).forEach((x, j) => {
      Object.entries(ogManglerFor(d, x)).forEach(([k, t]) => f.push({ nokkel: `${p}.pakker.${j}.${k}`, melding: `Pakke ${j + 1}: ${t}` }));
      const a = ogKarakter(d) ? ogKarakterAdvarsel(x.fore, x.etter) : '';
      if (a) f.push({ nokkel: `${p}.pakker.${j}.etter`, melding: `Pakke ${j + 1}: ${a}` });
    });
    d.rader.forEach((r, i) => { if (!(d.pakker || []).some(x => x.id === Number(r.pakke))) f.push({ nokkel: `${p}.rader.${i}.pakke`, melding: `${ogNavn(r)}: Velg pakke.` }); });
    return f;
  }
};

/* ═══ Forslag 5: Trinnvis inne i steget ═══════════════════════════ */

const OG5 = {
  navn: 'Trinnvis',
  ide: 'Tabellen fylles ut i små trinn: først hvilke boenheter som oppgraderes, så energikarakteren, så tiltakene og til slutt en oversikt. I hvert trinn kan man sette samme verdi for alle med ett klikk.',
  fordeler: ['Lite å forholde seg til om gangen.', 'Man tar stilling til én ting for alle boenhetene, som er slik tallene ofte står i dokumentasjonen.', 'Oversikten til slutt gir kontroll før man går videre.'],
  ulemper: ['Flere klikk, og man må gå tilbake for å rette.', 'Et trinn inne i et steg kan forvirre i en søknad som allerede er trinnvis.'],
  trinn: d => ['Boenheter', ...(ogKarakter(d) ? ['Energikarakter'] : []), 'Tiltak', 'Oversikt'],
  tegn: (d, p, vis) => {
    if (!ogKlar(d)) return '';
    const trinn = OG5.trinn(d);
    d.t5 = Math.min(d.t5 || 0, trinn.length - 1);
    const navn = trinn[d.t5];
    const med = d.rader.filter(r => r.med !== false);
    const nav = `<div class="e-knappegruppe e-mt">
      ${d.t5 > 0 ? `<button type="button" class="e-knapp" data-handling="og5Til" data-t="${d.t5 - 1}">${E_IKON.pilVenstre}Forrige</button>` : ''}
      ${d.t5 < trinn.length - 1 ? `<button type="button" class="e-knapp e-knapp--prominent" data-handling="og5Til" data-t="${d.t5 + 1}">Videre til ${trinn[d.t5 + 1].toLowerCase()} ${E_IKON.pilHoyre}</button>` : ''}</div>`;
    let innhold = '';
    if (navn === 'Boenheter') {
      innhold = `<p>Kryss av for boenhetene som skal oppgraderes.</p>
        ${ogTabell(d, p, { velg: false, hode: '<th>Oppgraderes</th>', rad: (r, i) => `<td><label class="e-valg" style="padding:0"><input type="checkbox" data-handling="og5Med" data-id="${r.id}" ${r.med !== false ? 'checked' : ''} aria-label="${ogNavn(r)} oppgraderes"><span>Ja</span></label></td>` })}`;
    } else if (navn === 'Energikarakter') {
      const a = d.alle5 || {};
      innhold = `<p>Sett energikarakter før og etter for hver boenhet, eller for alle på én gang.</p>
        <div class="og-verktoy"><span class="e-fet">Alle ${med.length} boenhetene</span>
          <label class="og-verktoy__felt">Før ${ogKarakterSelect(`${p}.alle5.fore`, 'Før for alle', a.fore)}</label>
          <label class="og-verktoy__felt">Etter ${ogKarakterSelect(`${p}.alle5.etter`, 'Etter for alle', a.etter)}</label>
          <button type="button" class="e-knapp e-knapp--liten e-knapp--prominent" data-handling="og5Alle">Bruk på alle</button></div>
        ${ogTabell({ ...d, rader: d.rader }, p, { velg: false, meny: false, hode: '<th>Før</th><th>Etter</th>',
          rad: (r, i) => (r.med === false ? '<td colspan="2" class="e-sekundaer">Oppgraderes ikke</td>' : ogKarakterCeller(d, p, r, i, vis)) })}`;
    } else if (navn === 'Tiltak') {
      innhold = `${F.janei({ felt: `${p}.sammeTiltak`, label: 'Får alle boenhetene de samme tiltakene?' })}
        ${d.sammeTiltak === true ? ogTiltakVelger(d, `${p}.tiltak5`, { label: 'Tiltak for alle boenhetene' }) : ''}
        ${d.sammeTiltak === false ? ogTabell(d, p, { velg: false, meny: false, hode: '<th>Tiltak</th>',
          rad: (r, i) => (r.med === false ? '<td class="e-sekundaer">Oppgraderes ikke</td>' : `<td class="og-tiltakcelle">${ogTiltakTekst(d, r)}<br><button type="button" class="e-knapp e-knapp--lenke" data-handling="og1Apne" data-id="${r.id}">${d.apen === r.id ? 'Lukk' : 'Endre tiltak'}</button></td>`),
          ekstraRad: (r, i) => (d.apen === r.id ? `<tr class="og-utvidet"><td colspan="20">${ogTiltakVelger(d, `${p}.rader.${i}`, { label: `Tiltak for ${ogNavn(r)}` })}</td></tr>` : '') }) : ''}`;
    } else {
      const eff = r => (d.sammeTiltak ? { ...r, tiltak: (d.tiltak5 || {}).tiltak, varmepumpe: (d.tiltak5 || {}).varmepumpe, annet: (d.tiltak5 || {}).annet } : r);
      innhold = `<p>Sjekk at alt stemmer. Bruk menyen med tre prikker for å legge til, duplisere eller slette en boenhet.</p>
        ${ogTabell({ ...d, rader: med }, p, { velg: false, hode: `${ogKarakter(d) ? '<th>Før</th><th>Etter</th>' : ''}<th>Tiltak</th>`,
          rad: r => {
            const e = eff(r);
            return `${ogKarakter(d) ? `<td>${r.fore || '–'}</td><td>${r.etter || '–'}${ogAdv(ogKarakterAdvarsel(r.fore, r.etter))}</td>` : ''}<td class="og-tiltakcelle">${ogTiltakTekst(d, e)}</td>`;
          } })}`;
    }
    return `<h2 class="e-h2 e-mt">Boenhetene</h2>
      <ol class="og-trinn">${trinn.map((t, j) => `<li class="${j === d.t5 ? 'er-aktiv' : j < d.t5 ? 'er-ferdig' : ''}"><button type="button" data-handling="og5Til" data-t="${j}" ${j === d.t5 ? 'aria-current="step"' : ''}><span>${j + 1}</span>${t}</button></li>`).join('')}</ol>
      <div class="og-trinnboks">${innhold}${nav}</div>`;
  },
  valider: (d, p) => {
    const f = ogValgFeil(d, p);
    if (!ogKlar(d)) return f;
    const med = d.rader.filter(r => r.med !== false);
    if (!med.length) f.push({ nokkel: `${p}-med`, melding: 'Velg minst én boenhet som skal oppgraderes.' });
    /* Energikarakteren hører til hver boenhet. Tiltakene står enten felles
       eller per boenhet, etter svaret på «Får alle de samme tiltakene?». */
    const tiltakFelt = /\.(tiltak|varmepumpe|annet)$/;
    f.push(...ogRadFeil(d, p, med).filter(x => d.sammeTiltak === false || !tiltakFelt.test(x.nokkel)));
    if (d.sammeTiltak == null) f.push({ nokkel: `${p}.sammeTiltak`, melding: 'Svar på om alle boenhetene får de samme tiltakene.' });
    if (d.sammeTiltak === true) Object.entries(ogManglerFor({ ...d, energivei: ogKarakter(d) ? 'PROSENT' : d.energivei }, d.tiltak5 || {}))
      .forEach(([k, t]) => f.push({ nokkel: `${p}.tiltak5.${k}`, melding: `Alle boenhetene: ${t}` }));
    return f;
  }
};

const OG_FORSLAG = [OG1, OG2, OG3, OG4, OG5];

/* ═══ Siden ═══════════════════════════════════════════════════════ */

const OG = { v: 0, visFeil: [false, false, false, false, false], animert: false };
const ogData = p => F.pf[p];
const ogRad = (p, id) => ogData(p).rader.find(r => r.id === Number(id));

function ogSkall() {
  const steg = S.STEG.map((s, j) => `<li class="e-stepper__steg${j < 2 ? ' er-ferdig' : ''}${j === 2 ? ' er-aktiv' : ''}">
    <span class="e-stepper__lenke"><span class="e-stepper__ikon">${E_IKON[s.ikon]}</span><span class="e-stepper__tekst" data-nr="${j + 1}">${s.tittel}</span></span></li>`).join('');
  return `<p class="e-soknadstype"><span class="e-soknadstype__navn">Elvegata borettslag</span>(Oppgradering)</p>
    <nav class="e-stepper${OG.animert ? ' e-stepper--stille' : ''}" aria-label="Steg i søknaden (eksempel)"><ol class="e-stepper__liste">${steg}</ol></nav>`;
}

function ogTegn() {
  const v = OG_FORSLAG[OG.v];
  const p = `d${OG.v + 1}`;
  const d = F.pf[p];
  const vis = OG.visFeil[OG.v];
  return `
    <h1 class="e-h1">Oppgradering på Bolig-steget</h1>
    <p class="e-ingress">Fem forslag til Bolig-steget ved oppgradering, uten modalen med boligkvaliteter. Søkeren velger først hva oppgraderingen skal gi, slik Miro-flyten viser, og fyller så ut boenhetene.</p>
    ${eCallout('noytral', `<p class="e-fet e-mb0">Felles for alle forslagene</p>
      <ul class="e-mb0"><li>Valget øverst: bedre tilgjengelighet, eller mer energieffektive boliger med forbedret energikarakter eller minst 30 prosent energieffektivisering.</li>
        <li>Energitiltakene og tilgjengelighetstiltakene fra lista erstatter kvalitetene i modalen. Varmepumpe har valg av type, og «Andre tiltak» og «Annet» har et tekstfelt.</li>
        <li>Reglene for energikarakter vises som advarsel på raden mens man fyller ut.</li>
        <li>Legg til, Dupliser og Slett ligger i menyen bak tre prikker på hver rad.</li></ul>`)}
    <div class="kf-faner" role="tablist" aria-label="Forslag">
      ${OG_FORSLAG.map((f, i) => `<button type="button" role="tab" class="kf-fane" aria-selected="${i === OG.v}" data-handling="ogVelg" data-v="${i}"><span class="kf-fane__nr">${i + 1}</span>${f.navn}</button>`).join('')}
    </div>
    <section class="kf-om" aria-labelledby="og-om-tittel">
      <h2 class="e-h3" id="og-om-tittel">Forslag ${OG.v + 1}: ${v.navn}</h2>
      <p>${v.ide}</p>
      <div class="e-to"><div><p class="e-fet e-mb0">Fordeler</p><ul class="e-mb0">${v.fordeler.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div><p class="e-fet e-mb0">Ulemper</p><ul class="e-mb0">${v.ulemper.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
    </section>
    <p class="kf-merke">Slik kan det se ut i søknaden</p>
    <div class="kf-ramme">
      ${ogSkall()}
      ${ogValg(d, p)}
      ${v.tegn(d, p, vis)}
      ${F.sammendrag()}
      <div class="e-knapper"><div class="e-knapper__nav">
        <button type="button" class="e-knapp" data-ikke-med="I forslagene går «Forrige steg» ikke noe sted.">${E_IKON.pilVenstre}Forrige steg</button>
        <button type="button" class="e-knapp e-knapp--prominent" data-handling="ogNeste">Neste steg ${E_IKON.pilHoyre}</button>
      </div><button type="button" class="e-knapp e-knapp--subtil" data-handling="ogTom">Begynn på nytt i dette forslaget</button></div>
    </div>
    <p class="e-liten e-sekundaer e-mt">Tabellen viser bare kolonnene som er viktige her. Kolonnene som finnes i dag, som antall rom og salgspris, står der fortsatt.</p>`;
}

function oppgraderingForslag() {
  eMonter();
  S.t = eTilstand();
  const m = /^#forslag-([1-5])$/.exec(location.hash);
  if (m) OG.v = Number(m[1]) - 1;
  F.pf = {};
  OG_FORSLAG.forEach((x, i) => { F.pf[`d${i + 1}`] = { rader: ogRader() }; });
  F.side = {
    tegn: ogTegn,
    valider: () => OG_FORSLAG[OG.v].valider(F.pf[`d${OG.v + 1}`], `d${OG.v + 1}`),
    vedEndring: (felt, pf) => {
      /* Bytter man mellom tilgjengelighet og energi, passer ikke tiltakene lenger */
      const b = /^(d\d)\.mal$/.exec(felt);
      if (b) { const d = pf[b[1]]; [...d.rader, d.masse || {}, d.felles || {}, ...(d.pakker || []), d.tiltak5 || {}].forEach(x => { delete x.tiltak; delete x.varmepumpe; delete x.annet; }); }
      /* Typen varmepumpe tømmes når varmepumpe ikke lenger er valgt */
      const t = /^(.*)\.tiltak$/.exec(felt);
      if (t) { const x = F.hent(t[1]); if (x && !(x.tiltak || []).includes('VARMEPUMPE')) delete x.varmepumpe; }
      if (/\.pakke$|massePakke$/.test(felt)) { const x = F.hent(felt.replace(/\.(pakke|massePakke)$/, '')); if (x && x.pakke) x.pakke = Number(x.pakke); }
    },
    handlinger: {
      ogVelg: dd => { OG.v = Number(dd.v); F.visFeil = OG.visFeil[OG.v]; history.replaceState(null, '', `#forslag-${OG.v + 1}`); },
      ogNeste: () => {
        OG.visFeil[OG.v] = true; F.visFeil = true;
        if (F.oppdaterFeil().length) { F.tegn(); F.visSammendrag(); return false; }
        eBekreft({ tittel: 'Klar for neste steg', tekst: 'Alt er fylt ut. I søknaden ville du nå gått videre til Økonomi.', bekreft: 'Lukk', avbryt: null });
        return true;
      },
      ogTom: () => { F.pf[`d${OG.v + 1}`] = { rader: ogRader() }; OG.visFeil[OG.v] = false; F.visFeil = false; },
      ogVelgAlle: dd => { const d = ogData(dd.p); const alle = d.rader.every(r => r.valgt); d.rader.forEach(r => { r.valgt = !alle; }); },
      ogMeny: dd => { const d = ogData(dd.p); d.meny = d.meny === Number(dd.id) ? null : Number(dd.id); },
      ogLegg: dd => {
        const d = ogData(dd.p); const r = ogRad(dd.p, dd.id);
        const nr = eTo(Math.max(...d.rader.filter(x => x.adr === r.adr && x.etasje === r.etasje).map(x => Number(x.nr))) + 1);
        d.rader.splice(d.rader.indexOf(r) + 1, 0, { id: Math.max(...d.rader.map(x => x.id)) + 1, adr: r.adr, etasje: r.etasje, nr, betegnelse: '', bra: '' });
        d.meny = null;
      },
      ogDupliser: dd => {
        const d = ogData(dd.p); const r = ogRad(dd.p, dd.id);
        const nr = eTo(Math.max(...d.rader.filter(x => x.adr === r.adr && x.etasje === r.etasje).map(x => Number(x.nr))) + 1);
        d.rader.splice(d.rader.indexOf(r) + 1, 0, { ...JSON.parse(JSON.stringify(r)), id: Math.max(...d.rader.map(x => x.id)) + 1, nr, valgt: false });
        d.meny = null;
      },
      ogSlett: async dd => {
        const d = ogData(dd.p); const r = ogRad(dd.p, dd.id);
        d.meny = null;
        const ok = await eBekreft({ tittel: 'Bekreft sletting', tekst: `Er du sikker på at du vil slette <b>${ogNavn(r)}</b>?`, bekreft: 'Slett', destruktiv: true });
        if (ok) d.rader = d.rader.filter(x => x !== r);
        return true;
      },
      og1Apne: dd => { const d = ogData(`d${OG.v + 1}`); d.apen = d.apen === Number(dd.id) ? null : Number(dd.id); },
      og1Tiltak: () => { const d = F.pf.d1; d.masseTiltak = !d.masseTiltak; },
      og1Bruk: () => { const d = F.pf.d1; ogBruk(d, d.masse || {}, ogValgte(d)); d.masse = {}; d.masseTiltak = false; },
      og1Fjern: () => { F.pf.d1.rader.forEach(r => { r.valgt = false; }); },
      og2Apne: () => {
        const d = F.pf.d2; const valgte = ogValgte(d);
        const en = valgte.length === 1 ? valgte[0] : null;
        d.masse = en ? { fore: en.fore, etter: en.etter, tiltak: en.tiltak ? [...en.tiltak] : undefined, varmepumpe: en.varmepumpe, annet: en.annet } : {};
        d.panel = true;
        setTimeout(() => document.querySelector('.og-panel select, .og-panel input')?.focus(), 0);
      },
      og2Lukk: () => { F.pf.d2.panel = false; },
      og2Lagre: () => { const d = F.pf.d2; ogBruk(d, d.masse || {}, ogValgte(d)); d.panel = false; d.rader.forEach(r => { r.valgt = false; }); },
      og4Legg: () => { const d = F.pf.d4; d.pakker.push({ id: Math.max(...d.pakker.map(x => x.id)) + 1 }); },
      og4Slett: dd => { const d = F.pf.d4; const [x] = d.pakker.splice(Number(dd.j), 1); d.rader.forEach(r => { if (Number(r.pakke) === x.id) delete r.pakke; }); },
      og4Bruk: () => { const d = F.pf.d4; if (!d.massePakke) return; ogValgte(d).forEach(r => { r.pakke = Number(d.massePakke); r.valgt = false; }); },
      og5Til: dd => { F.pf.d5.t5 = Number(dd.t); },
      og5Med: dd => { const r = ogRad('d5', dd.id); r.med = r.med === false; },
      og5Alle: () => { const d = F.pf.d5; const a = d.alle5 || {}; d.rader.filter(r => r.med !== false).forEach(r => { if (a.fore) r.fore = a.fore; if (a.etter) r.etter = a.etter; }); d.alle5 = {}; }
    }
  };
  F.koble(document.getElementById('side'));
  /* Menyen med tre prikker lukkes når man klikker et annet sted */
  document.addEventListener('click', e => {
    const d = F.pf[`d${OG.v + 1}`];
    if (d && d.meny && !e.target.closest('.og-meny-boks')) { d.meny = null; F.tegn(); }
  });
  document.addEventListener('keydown', e => {
    const d = F.pf[`d${OG.v + 1}`];
    if (e.key !== 'Escape' || !d) return;
    if (d.meny) { const id = d.meny; d.meny = null; F.tegn(); document.querySelector(`[data-handling="ogMeny"][data-id="${id}"]`)?.focus(); }
    if (d.panel) { d.panel = false; F.tegn(); }
  });
  F.tegn();
  OG.animert = true;
}
