/* ──────────────────────────────────────────────────────────────────
   «Merk som» i boenhetstabellen (oppgradering)

   Avkrysningen markerer bare rader for en handling (VF.valgt, lagres
   ikke). «Med i utmålingen» er fortsatt fo.enabled, og settes sammen
   med pakken fra «Merk som»-menyen.
   ────────────────────────────────────────────────────────────────── */

const VF = { valgt: new Set(), meny: null, under: false, navn: null };

const vfEtasjenavn = (pf, aid, etasje) => ((pf.etasjenavn || {})[`${aid}|${etasje}`]) || `Etasje ${etasje}`;

const vfAktiv = pf => S.oppgPakker(pf);
const vfNavn = fo => `${fo.etasje}${fo.bruksenhetsNr}`;

const vfUtmaling = fo => (fo.enabled
  ? '<span class="vf-status vf-status--med">Med</span>'
  : '<span class="vf-status">Ikke med</span>');

/* ═══ Celler ══════════════════════════════════════════════════════ */

function vfKolonner(pf) {
  return [
    { h: 'Boligbetegnelse', felt: 'boligbetegnelse', bredde: 's' },
    { h: '<abbr title="Bruksareal">BRA-i</abbr>', felt: 'bruksAreal', bredde: 'xs' },
    { h: 'Rom', felt: 'antallRom', bredde: 'xs' },
    S.salg(pf) && { h: 'Salgspris', felt: 'salgspris', belop: true },
    S.utleie(pf) && { h: 'Husleie', felt: 'utleiepris', belop: true }
  ].filter(Boolean);
}

function vfCelle(pf, fo, k) {
  const p = `boenheter.${B.indeks(pf, fo)}.${k.felt}`;
  const av = fo.enabled ? '' : 'disabled';
  const feilKl = F.harFeil(p) ? ' er-feil' : '';
  const inp = k.belop
    ? `<div class="e-belop">${F.belopInput({ felt: p, label: `${k.h} for ${vfNavn(fo)}` }).replace('<input', `<input ${av}`)}</div>`
    : `<input class="e-input e-input--${k.bredde}${feilKl}" id="${F.id(p)}" data-felt="${p}" data-type="tekst" value="${eEsc(fo[k.felt] ?? '')}" ${k.felt === 'boligbetegnelse' ? 'maxlength="15"' : 'inputmode="numeric"'} ${av} aria-label="${k.felt} for ${vfNavn(fo)}">`;
  return `<td data-feltboks="${p}">${inp}${fo.enabled ? F.feilHtml(p) : ''}</td>`;
}

function vfPakkeSelect(pf, fo) {
  const p = `boenheter.${B.indeks(pf, fo)}.pakke`;
  const x = pf.oppg.pakker.find(y => y.id === fo.pakke);
  return `<td data-feltboks="${p}"><div class="og-pakkecelle"><select class="e-select og-sel og-sel--bred${F.harFeil(p) ? ' er-feil' : ''}" id="${F.id(p)}" data-felt="${p}" data-type="velg" ${fo.enabled ? '' : 'disabled'} aria-label="Oppgraderingspakke for ${vfNavn(fo)}">
    <option value="" disabled ${x ? '' : 'selected'}>Velg pakke</option>
    ${pf.oppg.pakker.map((y, j) => `<option value="${y.id}" ${x === y ? 'selected' : ''}>Pakke ${j + 1}</option>`).join('')}</select></div>${fo.enabled ? F.feilHtml(p) : ''}</td>`;
}

const vfVelgBoks = fo => `<input type="checkbox" class="vf-velg" data-handling="vfVelg" data-id="${fo.id}" ${VF.valgt.has(fo.id) ? 'checked' : ''} aria-label="Marker ${vfNavn(fo)}">`;

function vfAlleBoks(rader, etikett) {
  const n = rader.filter(f => VF.valgt.has(f.id)).length;
  const tilstand = n === 0 ? '' : n === rader.length ? 'checked' : 'data-delvis="1"';
  return `<input type="checkbox" class="vf-velg" data-handling="vfVelgAlle" data-ids="${rader.map(f => f.id).join(',')}" ${tilstand} aria-label="${etikett}">`;
}

/* ═══ Adressen ════════════════════════════════════════════════════ */

function vfAdresse(pf, e, b, a) {
  const rader = S.boenheter(pf, a.id);
  const etasjer = S.sorterEtasjer(rader.map(f => f.etasje));
  const kanLegge = B.kanLeggeTil(pf, b, a);
  const tittel = `${eEsc(S.adresseTekst(a))}${etasjer.length ? `, ${etasjer.length} ${etasjer.length === 1 ? 'etasje' : 'etasjer'}` : ''}`;
  const kropp = `
    ${F.visFeil && !rader.some(r => r.enabled) ? eCallout('feil', '<p>Du må velge minst en bolig for denne adressen eller fjerne den.</p>') : ''}
    ${F.gruppefeil(`adresse-${a.id}`)}
    ${etasjer.map(et => vfEtasje(pf, a, et, kanLegge)).join('')}`;
  const nokkel = `adresse-${a.id}`;
  const apen = !F.lukket.has(nokkel);
  return `${vfMerkSom(pf, a, rader)}<div class="e-trekk e-trekk--inni vf-trekk">
    <div class="vf-trekk__rad">
      <span class="vf-boksplass">${vfAlleBoks(rader, `Marker alle på ${eEsc(S.adresseTekst(a))}`)}</span>
      <button type="button" class="e-trekk__topp" data-trekk="${eEsc(nokkel)}" aria-expanded="${apen}" aria-controls="${F.id(`t-${nokkel}`)}"><span>${tittel}</span>${E_IKON.pilNed}</button>
    </div>
    <div class="e-trekk__kropp" id="${F.id(`t-${nokkel}`)}"${apen ? '' : ' hidden'}>${kropp}</div>
  </div>`;
}

function vfMerkSom(pf, a, rader) {
  const valgte = rader.filter(f => VF.valgt.has(f.id));
  if (!valgte.length) return '';
  const apen = VF.meny === a.id;
  const valg = (hva, tekst, ekstra = '') => `<button type="button" role="menuitem" class="vf-meny__valg" data-handling="vfMerk" data-aid="${a.id}" data-hva="${hva}" ${ekstra}>${tekst}</button>`;
  return `<div class="vf-handlingslinje" role="toolbar" aria-label="Handlinger for markerte boenheter">
    <span class="vf-antall">${valgte.length} valgt</span>
    <div class="vf-meny-boks">
      <button type="button" class="vf-pille" data-handling="vfMeny" data-aid="${a.id}" aria-haspopup="menu" aria-expanded="${apen}">Merk som ${E_IKON.pilNed}</button>
      ${apen ? `<div class="vf-meny" role="menu">
        ${valg('med', 'Med i utmålingen')}
        ${valg('ut', 'Ikke med i utmålingen')}
        <div class="vf-meny__under${VF.under ? ' er-apen' : ''}">
          <button type="button" role="menuitem" class="vf-meny__valg" data-handling="vfUnder" aria-haspopup="menu" aria-expanded="${VF.under}">Tilknytt pakke<span class="vf-meny__pil" aria-hidden="true">›</span></button>
          <div class="vf-meny vf-meny--under" role="menu" aria-label="Tilknytt pakke">
            ${pf.oppg.pakker.map((x, j) => valg('pakke', `Pakke ${j + 1}`, `data-pakke="${x.id}"`)).join('')}
          </div>
        </div>
      </div>` : ''}
    </div>
    <button type="button" class="vf-pille vf-pille--lys" data-handling="vfFjernValg" data-aid="${a.id}">Fjern markering</button>
  </div>`;
}

/* ═══ Etasjen ═════════════════════════════════════════════════════ */

function vfEtasje(pf, a, etasje, kanLegge) {
  const rader = S.boenheter(pf, a.id).filter(f => f.etasje === etasje).sort((x, y) => Number(x.bruksenhetsNr) - Number(y.bruksenhetsNr));
  const kolonner = vfKolonner(pf);
  const kanRedigere = S.kanLeggeTilBoliger(pf);
  const rediger = VF.navn && VF.navn.aid === a.id && VF.navn.etasje === etasje;
  const navn = vfEtasjenavn(pf, a.id, etasje);
  const ds = `data-aid="${a.id}" data-etasje="${etasje}"`;

  const hode = `<th colspan="2" class="vf-nrhode">Bolignummer</th>
    ${kolonner.slice(0, 3).map(k => `<th>${k.h}</th>`).join('')}
    <th>Utmåling</th><th>Oppgraderingspakke</th>${kolonner.slice(3).map(k => `<th>${k.h}</th>`).join('')}`;

  const rad = fo => {
    const i = B.indeks(pf, fo);
    const radFeil = F.visFeil && fo.enabled && F.feilliste.some(x => x.nokkel.startsWith(`boenheter.${i}.`));
    const celler = `<td>${vfVelgBoks(fo)}</td><td class="vf-nr">${vfNavn(fo)}</td>
      ${kolonner.slice(0, 3).map(k => vfCelle(pf, fo, k)).join('')}
      <td>${vfUtmaling(fo)}</td>${vfPakkeSelect(pf, fo)}${kolonner.slice(3).map(k => vfCelle(pf, fo, k)).join('')}`;
    const meny = kanRedigere ? `<td class="e-tabell__handling">${radMeny(fo, kanLegge)}</td>` : '';
    return `<tr class="${fo.enabled ? '' : 'er-av'}${radFeil ? ' er-feil' : ''}${VF.valgt.has(fo.id) ? ' vf-markert' : ''}">${celler}${meny}</tr>`;
  };

  return `<div class="e-etasje">
    <div class="e-etasje__topp vf-etasjetopp">
      <div class="e-etasje__tittel">
        <span class="vf-boksplass">${vfAlleBoks(rader, `Marker alle i ${navn}`)}</span>
        ${rediger ? `<input class="e-input vf-navnefelt" id="vf-etasjenavn" maxlength="40" value="${eEsc(VF.navn.verdi)}" aria-label="Navn på etasjen">
          <button type="button" class="e-knapp e-knapp--ikon" data-handling="vfLagreNavn" title="Bekreft" aria-label="Bekreft">${E_IKON.sjekk}</button>
          <button type="button" class="e-knapp e-knapp--ikon" data-handling="vfAvbrytNavn" title="Avbryt redigering" aria-label="Avbryt redigering">${E_IKON.kryss}</button>`
    : `${eEsc(navn)}<button type="button" class="e-knapp e-knapp--ikon" data-handling="vfRedigerNavn" ${ds} title="Endre navn" aria-label="Endre navn på ${eEsc(navn)}">${E_IKON.blyant}</button>`}
      </div>
      <div class="vf-etasjeknapper">
        <button type="button" class="e-knapp e-knapp--subtil" data-handling="leggTilSammeEtasje" ${ds}>${E_IKON.pluss}Legg til</button>
        <button type="button" class="e-knapp e-knapp--subtil" data-handling="kopierEtasje" ${ds}>${E_IKON.kopier}Dupliser</button>
        <button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="slettEtasje" ${ds}>${E_IKON.soppel}Slett</button>
      </div>
    </div>
    ${rediger && VF.navn.feil ? `<div class="e-feilmelding">${E_IKON.feil}<span>${VF.navn.feil}</span></div>` : ''}
    <div class="e-tabell-rulle"><table class="e-tabell vf-tabell">
      <thead><tr>${hode}${kanRedigere ? '<th><span class="e-sr">Valg</span></th>' : ''}</tr></thead>
      <tbody>${rader.map(rad).join('')}</tbody>
    </table></div>
  </div>`;
}

/* ═══ Kobling til Bolig-steget ════════════════════════════════════ */

(() => {
  const steg = STEG.boligkvaliteter;
  const orgAdresse = adresseBlokk;
  adresseBlokk = (pf, e, b, a) => (vfAktiv(pf) ? vfAdresse(pf, e, b, a) : orgAdresse(pf, e, b, a));

  const orgTegn = steg.tegn;
  steg.tegn = pf => {
    const ider = new Set(pf.boenheter.map(f => f.id));
    VF.valgt.forEach(id => { if (!ider.has(id)) VF.valgt.delete(id); });
    return orgTegn(pf);
  };

  const lukk = () => { VF.meny = null; VF.under = false; };

  Object.assign(steg.handlinger, {
    vfVelg: d => {
      const id = Number(d.id);
      if (VF.valgt.has(id)) VF.valgt.delete(id); else VF.valgt.add(id);
    },
    vfVelgAlle: d => {
      const ids = d.ids.split(',').map(Number);
      const alle = ids.every(id => VF.valgt.has(id));
      ids.forEach(id => (alle ? VF.valgt.delete(id) : VF.valgt.add(id)));
    },
    vfFjernValg: (d, pf) => { S.boenheter(pf, Number(d.aid)).forEach(f => VF.valgt.delete(f.id)); lukk(); },
    vfMeny: d => { const aid = Number(d.aid); const varApen = VF.meny === aid; lukk(); if (!varApen) VF.meny = aid; },
    vfUnder: () => { VF.under = !VF.under; },
    vfRedigerNavn: (d, pf) => { VF.navn = { aid: Number(d.aid), etasje: d.etasje, verdi: vfEtasjenavn(pf, Number(d.aid), d.etasje), feil: '' }; setTimeout(() => { const el = document.getElementById('vf-etasjenavn'); if (el) el.select(); }); },
    vfAvbrytNavn: () => { VF.navn = null; },
    vfLagreNavn: (d, pf) => {
      const n = VF.navn;
      n.verdi = document.getElementById('vf-etasjenavn').value.trim();
      if (!n.verdi) { n.feil = 'Du må skrive navn på etasjen.'; return true; }
      pf.etasjenavn = { ...(pf.etasjenavn || {}), [`${n.aid}|${n.etasje}`]: n.verdi };
      VF.navn = null;
    },
    vfMerk: (d, pf) => {
      const rader = S.boenheter(pf, Number(d.aid)).filter(f => VF.valgt.has(f.id));
      if (d.hva === 'med') rader.forEach(f => { f.enabled = true; });
      if (d.hva === 'ut') rader.forEach(f => { f.enabled = false; });
      if (d.hva === 'pakke') rader.forEach(f => { f.pakke = Number(d.pakke); f.enabled = true; });
      lukk();
    }
  });

  document.addEventListener('click', e => {
    if (VF.meny && !e.target.closest('.vf-meny-boks')) { lukk(); F.tegn(); }
  });
  document.addEventListener('keydown', e => {
    if (e.target.id === 'vf-etasjenavn' && (e.key === 'Enter' || e.key === 'Escape')) {
      e.preventDefault();
      document.querySelector(`[data-handling=${e.key === 'Enter' ? 'vfLagreNavn' : 'vfAvbrytNavn'}]`).click();
      return;
    }
    if (e.key !== 'Escape' || !VF.meny) return;
    if (VF.under) VF.under = false; else lukk();
    F.tegn();
  });
  new MutationObserver(() => document.querySelectorAll('input[data-delvis]').forEach(el => { el.indeterminate = true; }))
    .observe(document.body, { childList: true, subtree: true });
})();
