/* ──────────────────────────────────────────────────────────────────
   «Merk som» i boenhetstabellen (oppgradering)

   Avkrysningen markerer bare rader for en handling (VF.valgt, lagres
   ikke). «Med i utmålingen» er fortsatt fo.enabled, og settes sammen
   med pakken fra «Merk som»-menyen.
   ────────────────────────────────────────────────────────────────── */

const VF_UTMALING_NEDTREKK = new URLSearchParams(location.search).get('utmaling') !== 'tag';

const VF = { valgt: new Set(), meny: false, etMeny: null };

const vfEtasjenavn = (pf, aid, etasje) => ((pf.etasjenavn || {})[`${aid}|${etasje}`]) || `Etasje ${etasje}`;

const vfAktiv = pf => S.oppgPakker(pf);
const vfNavn = fo => `${fo.etasje}${fo.bruksenhetsNr}`;

function vfUtmalingSelect(pf, fo) {
  const p = `boenheter.${B.indeks(pf, fo)}.enabled`;
  return `<select class="vf-utmalingsvalg ${fo.enabled ? 'vf-utmalingsvalg--med' : ''}" id="${F.id(p)}" data-felt="${p}" data-type="bool" aria-label="Låneutmålingen for ${vfNavn(fo)}">
    <option value="true" ${fo.enabled ? 'selected' : ''}>Med</option>
    <option value="false" ${fo.enabled ? '' : 'selected'}>Ikke med</option>
  </select>`;
}

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
    ${pf.oppg.pakker.map((y, j) => `<option value="${y.id}" ${x === y ? 'selected' : ''}>${eEsc(ogPakkeTittel(y, j))}</option>`).join('')}</select></div>${fo.enabled ? F.feilHtml(p) : ''}</td>`;
}

const vfVelgBoks = fo => `<input type="checkbox" class="vf-velg" data-handling="vfVelg" data-id="${fo.id}" ${VF.valgt.has(fo.id) ? 'checked' : ''} aria-label="Marker ${vfNavn(fo)}">`;

/* ═══ Adressen ════════════════════════════════════════════════════ */

function vfAdresse(pf, e, b, a) {
  const rader = S.boenheter(pf, a.id);
  const etasjer = S.sorterEtasjer(rader.map(f => f.etasje));
  const kanLegge = B.kanLeggeTil(pf, b, a);
  const tittel = `${eEsc(S.adresseTekst(a))}${etasjer.length ? `, ${etasjer.length} ${etasjer.length === 1 ? 'etasje' : 'etasjer'}` : ''}`;
  const kropp = `
    ${F.visFeil && !rader.some(r => r.enabled) ? eCallout('feil', '<p>Du må velge minst en bolig for denne adressen eller fjerne den.</p>') : ''}
    ${F.gruppefeil(`adresse-${a.id}`)}
    ${etasjer.map(et => vfEtasje(pf, a, et, kanLegge)).join('')}
    <p class="vf-leggtil"><button type="button" class="e-knapp" data-handling="leggTilSammeEtasje" data-aid="${a.id}" data-etasje="H00">${E_IKON.pluss}Legg til etasje</button></p>`;
  const nokkel = `adresse-${a.id}`;
  const apen = !F.lukket.has(nokkel);
  return `<div class="e-trekk e-trekk--inni vf-trekk">
    <div class="vf-trekk__rad">
      <button type="button" class="e-trekk__topp" data-trekk="${eEsc(nokkel)}" aria-expanded="${apen}" aria-controls="${F.id(`t-${nokkel}`)}"><span>${tittel}</span>${E_IKON.pilNed}</button>
    </div>
    <div class="e-trekk__kropp" id="${F.id(`t-${nokkel}`)}"${apen ? '' : ' hidden'}>${kropp}</div>
  </div>`;
}

const vfByggRader = (pf, b) => S.valgteAdresser(b).flatMap(a => S.boenheter(pf, a.id));
const vfAlleRader = pf => S.alleValgteBygg(pf).flatMap(x => vfByggRader(pf, x.b));

function vfBygg(pf, b) {
  const rader = vfByggRader(pf, b);
  const alle = rader.length > 0 && rader.every(f => VF.valgt.has(f.id));
  return `<div class="vf-bygg">
      <h2 class="e-h2">${eEsc(S.byggNavn(b))}</h2>
      ${rader.length ? `<button type="button" class="e-knapp e-knapp--subtil" data-handling="vfVelgAlle" data-ids="${rader.map(f => f.id).join(',')}">${alle ? 'Fjern markering' : 'Marker alt'}</button>` : ''}
    </div>`;
}

function vfMerkSom(pf) {
  const valgte = vfAlleRader(pf).filter(f => VF.valgt.has(f.id));
  if (!valgte.length) { VF.pilleVist = false; return ''; }
  const inn = !VF.pilleVist;
  VF.pilleVist = true;
  const apen = VF.meny;
  const valg = (tekst, ekstra) => `<button type="button" role="menuitem" class="vf-meny__valg" data-handling="vfMerk" ${ekstra}>${tekst}</button>`;
  const under = (navn, tittel, innhold) => `<div class="vf-meny__under${VF.under === navn ? ' er-apen' : ''}">
          <button type="button" role="menuitem" class="vf-meny__valg" data-handling="vfUnder" data-under="${navn}" aria-haspopup="menu" aria-expanded="${VF.under === navn}">${tittel}<span class="vf-meny__pil" aria-hidden="true">›</span></button>
          <div class="vf-meny vf-meny--under" role="menu" aria-label="${tittel}">${innhold}</div>
        </div>`;
  return `<div class="vf-handlingslinje${inn ? ' vf-inn' : ''}" role="toolbar" aria-label="Handlinger for markerte boenheter">
    <span class="vf-antall">${valgte.length} valgt</span>
    <div class="vf-meny-boks">
      <button type="button" class="vf-pille" data-handling="vfMeny" aria-haspopup="menu" aria-expanded="${apen}">Marker som ${E_IKON.pilNed}</button>
      ${apen ? `<div class="vf-meny" role="menu" aria-label="Marker som">
        ${under('utmaling', 'Låneutmåling', `${valg('Med', 'data-hva="med"')}${valg('Ikke med', 'data-hva="ut"')}`)}
        ${under('pakke', 'Tilknytt pakke', pf.oppg.pakker.map((x, j) => valg(eEsc(ogPakkeTittel(x, j)), `data-hva="pakke" data-pakke="${x.id}"`)).join(''))}
      </div>` : ''}
    </div>
    <button type="button" class="vf-pille vf-pille--lys" data-handling="vfFjernValg">Fjern markering</button>
    <button type="button" class="vf-pille vf-pille--lys vf-pille--slett" data-handling="vfSlettMarkerte">${E_IKON.soppel}Slett markerte</button>
  </div>`;
}

/* ═══ Etasjen ═════════════════════════════════════════════════════ */

function vfEtasje(pf, a, etasje, kanLegge) {
  const rader = S.boenheter(pf, a.id).filter(f => f.etasje === etasje).sort((x, y) => Number(x.bruksenhetsNr) - Number(y.bruksenhetsNr));
  const kolonner = vfKolonner(pf);
  const kanRedigere = S.kanLeggeTilBoliger(pf);
  const nokkel = `${a.id}|${etasje}`;
  const menyApen = VF.etMeny === nokkel;
  const navn = vfEtasjenavn(pf, a.id, etasje);
  const ds = `data-aid="${a.id}" data-etasje="${etasje}"`;

  const hode = `<th colspan="2" class="vf-nrhode">Bolignummer</th>
    ${kolonner.slice(0, 3).map(k => `<th>${k.h}</th>`).join('')}
    <th>Oppgraderingspakke</th>${kolonner.slice(3).map(k => `<th>${k.h}</th>`).join('')}<th>Låneutmålingen</th>`;

  const rad = fo => {
    const i = B.indeks(pf, fo);
    const radFeil = F.visFeil && fo.enabled && F.feilliste.some(x => x.nokkel.startsWith(`boenheter.${i}.`));
    const celler = `<td>${vfVelgBoks(fo)}</td><td class="vf-nr">${vfNavn(fo)}</td>
      ${kolonner.slice(0, 3).map(k => vfCelle(pf, fo, k)).join('')}
      ${vfPakkeSelect(pf, fo)}${kolonner.slice(3).map(k => vfCelle(pf, fo, k)).join('')}<td>${VF_UTMALING_NEDTREKK ? vfUtmalingSelect(pf, fo) : vfUtmaling(fo)}</td>`;
    const meny = kanRedigere ? `<td class="e-tabell__handling">${radMeny(fo, kanLegge)}</td>` : '';
    return `<tr class="${fo.enabled ? '' : 'er-av'}${radFeil ? ' er-feil' : ''}${VF.valgt.has(fo.id) ? ' vf-markert' : ''}${nyTid && VF.ny.rader.has(fo.id) ? ' vf-ny' : ''}">${celler}${meny}</tr>`;
  };

  const nyTid = VF.ny && Date.now() < VF.ny.til;
  const ny = nyTid && VF.ny.etasjer.has(nokkel);
  return `<div class="e-etasje${ny ? ' vf-ny' : ''}${VF_UTMALING_NEDTREKK ? ' vf-utmaling-nedtrekk' : ''}" data-vf-etasje="${nokkel}">
    <div class="e-etasje__topp vf-etasjetopp">
      <div class="e-etasje__tittel">
        ${eEsc(navn)}
        <div class="og-meny-boks vf-etmeny">
          <button type="button" class="e-knapp e-knapp--ikon og-prikker" data-handling="vfEtMeny" ${ds} aria-haspopup="menu" aria-expanded="${menyApen}" aria-label="Flere valg for ${eEsc(navn)}">⋯</button>
          ${menyApen ? `<div class="og-meny" role="menu" aria-label="Valg for ${eEsc(navn)}">
            <button type="button" role="menuitem" class="og-meny__valg" data-handling="vfEndreNavn" ${ds}>${E_IKON.blyant}Endre navn</button>
            <button type="button" role="menuitem" class="og-meny__valg" data-handling="kopierEtasje" ${ds}>${E_IKON.kopier}Dupliser</button>
            <button type="button" role="menuitem" class="og-meny__valg og-meny__valg--slett" data-handling="slettEtasje" ${ds}>${E_IKON.soppel}Slett</button>
          </div>` : ''}
        </div>
      </div>
    </div>
    <div class="e-tabell-rulle"><table class="e-tabell vf-tabell">
      <thead><tr>${hode}${kanRedigere ? '<th><span class="e-sr">Valg</span></th>' : ''}</tr></thead>
      <tbody>${rader.map(rad).join('')}</tbody>
    </table></div>
  </div>`;
}

function vfNavneModal(navn, { etikett = 'Navn på etasjen', feil = 'Du må skrive navn på etasjen.' } = {}) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.className = 'e-modal';
    d.setAttribute('aria-labelledby', 'vf-navn-tittel');
    d.innerHTML = `
      <form method="dialog" novalidate>
        <div class="e-modal__topp"><h2 id="vf-navn-tittel">Endre navn</h2>
          <button type="button" class="e-knapp e-knapp--ikon" data-svar="nei" aria-label="Lukk">${E_IKON.kryss}</button></div>
        <div class="e-modal__kropp">
          <div class="e-felt">
            <label class="e-felt__label" for="vf-navn-felt">${etikett}</label>
            <input class="e-input" id="vf-navn-felt" maxlength="40" value="${eEsc(navn)}" aria-describedby="vf-navn-feil">
            <div id="vf-navn-feil"></div>
          </div>
        </div>
        <div class="e-modal__bunn">
          <button type="submit" class="e-knapp e-knapp--prominent">Lagre</button>
          <button type="button" class="e-knapp" data-svar="nei">Avbryt</button>
        </div>
      </form>`;
    document.body.appendChild(d);
    const felt = d.querySelector('#vf-navn-felt');
    const lukk = svar => { d.close(); d.remove(); resolve(svar); };
    d.addEventListener('click', e => { if (e.target.closest('[data-svar="nei"]')) lukk(null); });
    d.addEventListener('cancel', e => { e.preventDefault(); lukk(null); });
    d.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const v = felt.value.trim();
      if (!v) {
        felt.classList.add('er-feil');
        felt.setAttribute('aria-invalid', 'true');
        d.querySelector('#vf-navn-feil').innerHTML = `<div class="e-feilmelding">${E_IKON.feil}<span>${feil}</span></div>`;
        felt.focus();
        return;
      }
      lukk(v);
    });
    d.showModal();
    felt.select();
  });
}

/* ═══ Kobling til Bolig-steget ════════════════════════════════════ */

(() => {
  const steg = STEG.boligkvaliteter;
  const orgAdresse = adresseBlokk;
  adresseBlokk = (pf, e, b, a) => (vfAktiv(pf) ? vfAdresse(pf, e, b, a) : orgAdresse(pf, e, b, a));
  const orgBygg = byggOverskrift;
  byggOverskrift = (pf, b) => (vfAktiv(pf) ? vfBygg(pf, b) : orgBygg(pf, b));

  const orgTegn = steg.tegn;
  steg.tegn = pf => {
    const ider = new Set(pf.boenheter.map(f => f.id));
    VF.valgt.forEach(id => { if (!ider.has(id)) VF.valgt.delete(id); });
    return `${orgTegn(pf)}${vfAktiv(pf) ? vfMerkSom(pf) : ''}`;
  };

  const lukk = () => { VF.meny = false; VF.under = null; };

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
    vfFjernValg: () => { VF.valgt.clear(); lukk(); },
    vfUnder: d => { VF.under = VF.under === d.under ? null : d.under; },
    vfMeny: () => { const varApen = VF.meny; lukk(); VF.meny = !varApen; },
    ogEndrePakkenavn: async (d, pf) => {
      const j = Number(d.j);
      const x = pf.oppg.pakker[j];
      const nytt = await vfNavneModal(ogPakkeTittel(x, j), { etikett: 'Navn på pakken', feil: 'Du må skrive navn på pakken.' });
      if (nytt == null) return false;
      x.navn = nytt;
    },
    vfEtMeny: d => { const n = `${d.aid}|${d.etasje}`; VF.etMeny = VF.etMeny === n ? null : n; },
    vfEndreNavn: async (d, pf) => {
      VF.etMeny = null;
      F.tegn();
      const nytt = await vfNavneModal(vfEtasjenavn(pf, Number(d.aid), d.etasje));
      if (nytt == null) return false;
      pf.etasjenavn = { ...(pf.etasjenavn || {}), [`${d.aid}|${d.etasje}`]: nytt };
    },
    vfSlettMarkerte: async (d, pf) => {
      lukk();
      const rader = vfAlleRader(pf).filter(f => VF.valgt.has(f.id));
      if (!rader.length) return false;
      const tekst = rader.length === 1 ? 'den markerte boenheten' : `de <b>${rader.length}</b> markerte boenhetene`;
      const ok = await eBekreft({ tittel: 'Slett boenheter', tekst: `Er du sikker på at du vil slette ${tekst}?`, bekreft: 'Slett', destruktiv: true });
      if (!ok) return true;
      const ider = new Set(rader.map(f => f.id));
      pf.boenheter = pf.boenheter.filter(f => !ider.has(f.id));
      VF.valgt.clear();
    },
    vfMerk: (d, pf) => {
      const rader = vfAlleRader(pf).filter(f => VF.valgt.has(f.id));
      if (d.hva === 'med') rader.forEach(f => { f.enabled = true; });
      if (d.hva === 'ut') rader.forEach(f => { f.enabled = false; });
      if (d.hva === 'pakke') rader.forEach(f => { f.pakke = Number(d.pakke); f.enabled = true; });
      lukk();
    }
  });

  ['leggTilSammeEtasje', 'kopierEtasje', 'slettEtasje'].forEach(h => {
    const org = steg.handlinger[h];
    steg.handlinger[h] = (d, pf, e) => { VF.etMeny = null; return org(d, pf, e); };
  });

  const visNy = el => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top >= 80 && r.bottom <= innerHeight - 140) return;
    const rolig = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: rolig ? 'auto' : 'smooth', block: 'center' });
  };

  const orgLeggPakke = steg.handlinger.ogLeggPakke;
  steg.handlinger.ogLeggPakke = (d, pf, e) => {
    const svar = orgLeggPakke(d, pf, e);
    setTimeout(() => {
      const knapp = document.querySelector('[data-handling="ogLeggPakke"]');
      const kort = knapp && knapp.closest('p').previousElementSibling;
      if (!kort || !kort.classList.contains('e-kort')) return;
      kort.classList.add('vf-ny');
      visNy(kort);
    }, 0);
    return svar;
  };

  ['kopierEtasje', 'leggTilSammeEtasje', 'kopierBoenhet', 'leggTilBoenhet'].forEach(h => {
    const org = steg.handlinger[h];
    steg.handlinger[h] = (d, pf, e) => {
      const forIder = new Set(pf.boenheter.map(f => f.id));
      const forEtasjer = new Set(pf.boenheter.map(f => `${f.adresseId}|${f.etasje}`));
      const svar = org(d, pf, e);
      const nye = pf.boenheter.filter(f => !forIder.has(f.id));
      if (!nye.length) return svar;
      const etasjer = new Set(nye.map(f => `${f.adresseId}|${f.etasje}`).filter(k => !forEtasjer.has(k)));
      const rader = new Set(nye.filter(f => !etasjer.has(`${f.adresseId}|${f.etasje}`)).map(f => f.id));
      VF.ny = { etasjer, rader, til: Date.now() + 1200 };
      setTimeout(() => visNy(document.querySelector('.e-etasje.vf-ny, tr.vf-ny')), 0);
      return svar;
    };
  });

  document.addEventListener('click', e => {
    if (VF.meny && !e.target.closest('.vf-meny-boks')) { lukk(); F.tegn(); }
    if (VF.etMeny && !e.target.closest('.vf-etmeny')) { VF.etMeny = null; F.tegn(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && VF.etMeny) { VF.etMeny = null; F.tegn(); return; }
    if (e.key !== 'Escape' || !VF.meny) return;
    if (VF.under) VF.under = null; else lukk();
    F.tegn();
  });
})();
