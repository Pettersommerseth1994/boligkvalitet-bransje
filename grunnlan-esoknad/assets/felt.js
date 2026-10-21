/* ──────────────────────────────────────────────────────────────────
   Skjemamotoren

   Hver side er en funksjon som tegner HTML fra søknaden (pf), og en
   funksjon som validerer den. Feltene sier selv hvor svaret skal ligge,
   med data-felt="sti.i.søknaden", for eksempel "eiendommer.0.gaardsNr".
   Motoren leser svaret, skriver det inn i søknaden, lagrer og tegner
   siden på nytt. Fokus og markør flyttes tilbake dit de var.

   Feil vises først når brukeren har prøvd å gå videre, som i dag.
   ────────────────────────────────────────────────────────────────── */

const F = {
  pf: null,               // søknaden som redigeres
  side: null,             // { tegn(pf), valider(pf), handlinger }
  rot: null,              // elementet siden tegnes i
  visFeil: false,         // har brukeren prøvd å gå videre
  feil: {},               // nøkkel → melding
  feilliste: [],          // [{ nokkel, melding }] i rekkefølge
  apneHjelp: new Set(),   // hjelpetekster som er åpne
  lukket: new Set(),      // trekkspill som er lukket
  lagreFn: null,
  etterTegn: null
};

/* ═══ Stier ═══════════════════════════════════════════════════════ */

F.hent = (sti, obj = F.pf) => String(sti).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
F.sett = (sti, verdi, obj = F.pf) => {
  const deler = String(sti).split('.');
  let o = obj;
  deler.slice(0, -1).forEach((k, i) => {
    if (o[k] == null) o[k] = /^\d+$/.test(deler[i + 1]) ? [] : {};
    o = o[k];
  });
  const siste = deler[deler.length - 1];
  if (verdi === undefined) delete o[siste]; else o[siste] = verdi;
};
F.id = n => `f-${String(n).replace(/[^\w]/g, '-')}`;

/* ═══ Feil ════════════════════════════════════════════════════════ */

F.oppdaterFeil = () => {
  const liste = F.side && F.side.valider ? F.side.valider(F.pf) : [];
  F.feilliste = liste.filter(f => f && f.melding);
  F.feil = {};
  F.feilliste.forEach(f => { if (!(f.nokkel in F.feil)) F.feil[f.nokkel] = f.melding; });
  return F.feilliste;
};
F.harFeil = n => F.visFeil && !!F.feil[n];
F.feilHtml = n => (F.harFeil(n)
  ? `<div class="e-feilmelding" id="${F.id(n)}-feil">${E_IKON.feil}<span>${F.feil[n]}</span></div>` : '');
F.gruppefeil = n => (F.harFeil(n) ? `<div data-feltboks="${n}" id="${F.id(n)}">${F.feilHtml(n)}</div>` : '');

F.sammendrag = (tittel = 'Du må svare på disse feltene før du kan gå videre:') => {
  if (!F.visFeil) return '';
  const unike = [];
  F.feilliste.forEach(f => { if (!unike.some(u => u.melding === f.melding && u.nokkel === f.nokkel)) unike.push(f); });
  if (!unike.length) return '';
  return `<div class="e-feilsammendrag" id="feilsammendrag" tabindex="-1">
    <h2 id="feilsammendrag-tittel">${tittel}</h2>
    <ul aria-labelledby="feilsammendrag-tittel">${unike.map(f => `<li><a href="#${F.id(f.nokkel)}" data-til="${eEsc(f.nokkel)}">${f.melding}</a></li>`).join('')}</ul>
  </div>`;
};

/* ═══ Hjelpetekst (?) ═════════════════════════════════════════════ */

F.hjelpKnapp = (nokkel, tittel = 'Vis hjelpetekst') => {
  const apen = F.apneHjelp.has(nokkel);
  return `<span class="e-hjelp"><button type="button" class="e-hjelp__knapp" data-hjelp="${eEsc(nokkel)}" aria-expanded="${apen}" aria-controls="${F.id(`h-${nokkel}`)}" aria-label="${tittel}">?</button></span>`;
};
F.hjelpTekst = (nokkel, html) => `<div class="e-hjelp__tekst" id="${F.id(`h-${nokkel}`)}"${F.apneHjelp.has(nokkel) ? '' : ' hidden'}>${html}</div>`;

/* Etikett med valgfri hjelpetekst. legend=true for fieldset. */
function fEtikett({ label, hjelp, nokkel, forId, legend = false, beskrivelse }) {
  const h = hjelp ? F.hjelpKnapp(`${nokkel}`) : '';
  const lab = legend
    ? `<legend>${label}${h ? ` ${h}` : ''}</legend>`
    : `${h ? '<div class="e-felt__labelrad">' : ''}<label class="e-felt__label"${forId ? ` for="${forId}"` : ''}>${label}</label>${h ? `${h}</div>` : ''}`;
  return `${lab}${hjelp ? F.hjelpTekst(nokkel, hjelp) : ''}${beskrivelse ? `<span class="e-felt__hjelp" id="${F.id(nokkel)}-besk">${beskrivelse}</span>` : ''}`;
}

/* ═══ Felt ════════════════════════════════════════════════════════ */

const fAria = (n, beskrivelse) => `aria-describedby="${beskrivelse ? `${F.id(n)}-besk ` : ''}${F.id(n)}-feil"${F.harFeil(n) ? ' aria-invalid="true"' : ''}`;

F.tekst = ({ felt, label, hjelp, beskrivelse, bredde = 'l', maks, plassholder, type = 'tekst', nokkel = felt, inputmode, autocomplete = 'off' }) => {
  const id = F.id(nokkel);
  const v = F.hent(felt);
  return `<div class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}" data-feltboks="${nokkel}">
    ${fEtikett({ label, hjelp, nokkel, forId: id, beskrivelse })}
    <input class="e-input e-input--${bredde}" id="${id}" data-felt="${felt}" data-type="${type}" value="${eEsc(v ?? '')}"
      ${maks ? `maxlength="${maks}"` : ''} ${plassholder ? `placeholder="${plassholder}"` : ''} ${inputmode ? `inputmode="${inputmode}"` : ''}
      autocomplete="${autocomplete}" ${fAria(nokkel, beskrivelse)}>
    ${F.feilHtml(nokkel)}
  </div>`;
};

F.tall = o => F.tekst({ bredde: 's', inputmode: 'numeric', ...o, type: 'tall' });
F.mnd = o => F.tekst({ bredde: 's', plassholder: 'MM.ÅÅÅÅ', inputmode: 'numeric', ...o, type: 'mnd' });

F.belop = ({ felt, label, hjelp, beskrivelse, nokkel = felt }) => {
  const id = F.id(nokkel);
  return `<div class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}" data-feltboks="${nokkel}">
    ${fEtikett({ label, hjelp, nokkel, forId: id, beskrivelse })}
    <div class="e-belop">${F.belopInput({ felt, nokkel, id })}</div>
    ${F.feilHtml(nokkel)}
  </div>`;
};
F.belopInput = ({ felt, nokkel = felt, id = F.id(nokkel), label = '', bredde = 's' }) => `
  <input class="e-input e-input--${bredde}${F.harFeil(nokkel) ? ' er-feil' : ''}" type="tel" inputmode="numeric" id="${id}" data-felt="${felt}" data-type="belop"
    value="${eTusen(F.hent(felt))}" ${label ? `aria-label="${label}"` : ''} ${fAria(nokkel)}><abbr title="kroner">kr</abbr>`;

F.tekstomrade = ({ felt, label, hjelp, beskrivelse, nokkel = felt, maks }) => {
  const id = F.id(nokkel);
  return `<div class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}" data-feltboks="${nokkel}">
    ${fEtikett({ label, hjelp, nokkel, forId: id, beskrivelse })}
    <textarea class="e-textarea" id="${id}" data-felt="${felt}" data-type="tekst" ${maks ? `maxlength="${maks}"` : ''} rows="4" ${fAria(nokkel, beskrivelse)}>${eEsc(F.hent(felt) ?? '')}</textarea>
    ${F.feilHtml(nokkel)}
  </div>`;
};

F.velg = ({ felt, label, hjelp, beskrivelse, valg, plassholder = '--- Velg ---', nokkel = felt, bredde = 'l' }) => {
  const id = F.id(nokkel);
  const v = F.hent(felt);
  return `<div class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}" data-feltboks="${nokkel}">
    ${fEtikett({ label, hjelp, nokkel, forId: id, beskrivelse })}
    <select class="e-select e-input--${bredde}" id="${id}" data-felt="${felt}" data-type="velg" ${fAria(nokkel, beskrivelse)}>
      <option value="" disabled ${v == null || v === '' ? 'selected' : ''}>${plassholder}</option>
      ${valg.map(o => `<option value="${eEsc(o.v)}" ${String(v) === String(o.v) ? 'selected' : ''}>${o.l}</option>`).join('')}
    </select>
    ${F.feilHtml(nokkel)}
  </div>`;
};

/* Radio og Ja/Nei. Svaret i en Ja/Nei er true/false. */
F.radio = ({ felt, label, hjelp, beskrivelse, valg, rad = false, nokkel = felt, etter = '' }) => {
  const v = F.hent(felt);
  const navn = F.id(nokkel);
  return `<fieldset class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}" data-feltboks="${nokkel}" id="${navn}" ${fAria(nokkel, beskrivelse)}>
    ${fEtikett({ label, hjelp, nokkel, legend: true, beskrivelse })}
    <div class="e-valgliste${rad ? ' e-valgliste--rad' : ''}">
      ${valg.map((o, i) => `
        <label class="e-valg">
          <input type="radio" name="${navn}" id="${navn}-${i}" value="${eEsc(String(o.v))}" data-felt="${felt}" data-type="${typeof o.v === 'boolean' ? 'bool' : 'radio'}"
            ${o.v === v ? 'checked' : ''} ${o.deaktivert ? 'disabled' : ''}>
          <span class="e-valg__tekst"><span>${o.l}${o.hjelp ? ` ${F.hjelpKnapp(`${nokkel}-${i}`)}` : ''}</span></span>
        </label>${o.hjelp ? `<div style="margin:0 0 4px 34px">${F.hjelpTekst(`${nokkel}-${i}`, o.hjelp)}</div>` : ''}${o.under && o.v === v ? `<div class="e-underboks">${o.under}</div>` : ''}`).join('')}
    </div>
    ${F.feilHtml(nokkel)}${etter}
  </fieldset>`;
};
F.janei = o => F.radio({ rad: true, ...o, valg: [{ v: true, l: o.ja || 'Ja' }, { v: false, l: o.nei || 'Nei' }] });

/* Avkrysning der svaret er en liste med verdier */
F.avkryss = ({ felt, label, hjelp, beskrivelse, valg, nokkel = felt, legend = true }) => {
  const v = F.hent(felt) || [];
  const navn = F.id(nokkel);
  return `<fieldset class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}" data-feltboks="${nokkel}" id="${navn}" ${fAria(nokkel, beskrivelse)}>
    ${label ? fEtikett({ label, hjelp, nokkel, legend, beskrivelse }) : ''}
    <div class="e-valgliste">
      ${valg.map((o, i) => `
        <label class="e-valg">
          <input type="checkbox" id="${navn}-${i}" value="${eEsc(o.v)}" data-felt="${felt}" data-type="liste" ${v.includes(o.v) ? 'checked' : ''}>
          <span class="e-valg__tekst"><span>${o.l}${o.hjelp ? ` ${F.hjelpKnapp(`${nokkel}-${i}`)}` : ''}</span></span>
        </label>${o.hjelp ? `<div style="margin:0 0 4px 34px">${F.hjelpTekst(`${nokkel}-${i}`, o.hjelp)}</div>` : ''}${o.under && v.includes(o.v) ? `<div class="e-underboks">${o.under}</div>` : ''}`).join('')}
    </div>
    ${F.feilHtml(nokkel)}
  </fieldset>`;
};

/* Én avkrysningsboks der svaret er true/false */
F.sjekk = ({ felt, label, nokkel = felt }) => `
  <div class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}" data-feltboks="${nokkel}">
    <label class="e-valg"><input type="checkbox" id="${F.id(nokkel)}" data-felt="${felt}" data-type="sjekk" ${F.hent(felt) ? 'checked' : ''} ${fAria(nokkel)}>
      <span class="e-valg__tekst"><span>${label}</span></span></label>
    ${F.feilHtml(nokkel)}
  </div>`;

/* Lesevisning: etikett over verdi */
F.les = (label, verdi) => `<div class="e-felt"><span class="e-felt__label">${label}</span><p class="e-felt__verdi">${verdi}</p></div>`;

/* «Les mer»: en lenkeknapp med pil som åpner en forklaring under.
   Bruker samme mekanisme som hjelpetekstene, så den husker om den er åpen. */
F.lesmer = (nokkel, tittel, html) => {
  const apen = F.apneHjelp.has(nokkel);
  return `<div class="e-lesmer">
    <button type="button" class="e-lesmer__knapp" data-hjelp="${eEsc(nokkel)}" aria-expanded="${apen}" aria-controls="${F.id(`h-${nokkel}`)}">${E_IKON.pilNed}<span>${tittel}</span></button>
    <div class="e-lesmer__innhold" id="${F.id(`h-${nokkel}`)}"${apen ? '' : ' hidden'}>${html}</div>
  </div>`;
};

/* Trekkspill som husker om det er lukket */
F.trekkspill = ({ nokkel, tittel, kropp, klasse = '' }) => {
  const apen = !F.lukket.has(nokkel);
  return `<div class="e-trekk ${klasse}">
    <button type="button" class="e-trekk__topp" data-trekk="${eEsc(nokkel)}" aria-expanded="${apen}" aria-controls="${F.id(`t-${nokkel}`)}"><span>${tittel}</span>${E_IKON.pilNed}</button>
    <div class="e-trekk__kropp" id="${F.id(`t-${nokkel}`)}"${apen ? '' : ' hidden'}>${kropp}</div>
  </div>`;
};

/* ═══ Lesing av svar ══════════════════════════════════════════════ */

function fLes(el) {
  const type = el.dataset.type;
  if (type === 'bool') return el.value === 'true';
  if (type === 'radio') return el.value;
  if (type === 'sjekk') return el.checked || undefined;
  if (type === 'velg') return el.value === '' ? undefined : el.value;
  if (type === 'belop') {
    const s = el.value.replace(/\D/g, '');
    return s === '' ? undefined : Number(s);
  }
  const v = el.value.trim();
  return v === '' ? undefined : (type === 'tekst' && el.tagName === 'TEXTAREA' ? el.value : v);
}

function fSkriv(el) {
  if (el.dataset.type === 'liste') {
    const liste = [...(F.hent(el.dataset.felt) || [])].filter(x => x !== el.value);
    if (el.checked) liste.push(el.value);
    F.sett(el.dataset.felt, liste.length ? liste : undefined);
  } else {
    F.sett(el.dataset.felt, fLes(el));
  }
  if (el.dataset.etter && F.side.etterEndring) F.side.etterEndring(el.dataset.etter, el, F.pf);
  if (F.side.vedEndring) F.side.vedEndring(el.dataset.felt, F.pf);
}

/* ═══ Tegning ═════════════════════════════════════════════════════ */

let fMusNede = false;
let fVenter = false;
let fTimer = null;

F.tegn = () => {
  if (!F.rot || !F.side) return;
  const aktiv = document.activeElement;
  const fokusId = aktiv && aktiv.id && F.rot.contains(aktiv) ? aktiv.id : null;
  const markor = aktiv && typeof aktiv.selectionStart === 'number' ? [aktiv.selectionStart, aktiv.selectionEnd] : null;
  const lengde = aktiv && aktiv.value != null ? aktiv.value.length : 0;
  F.oppdaterFeil();
  F.rot.innerHTML = F.side.tegn(F.pf);
  if (fokusId) {
    const el = document.getElementById(fokusId);
    if (el) {
      el.focus({ preventScroll: true });
      if (markor && typeof el.setSelectionRange === 'function' && el.type !== 'number') {
        try {
          const diff = (el.value || '').length - lengde;
          el.setSelectionRange(markor[0] + diff, markor[1] + diff);
        } catch { /* ikke alle felt har markør */ }
      }
    }
  }
  if (F.etterTegn) F.etterTegn();
};

/* Venter til museklikket er ferdig, så knappen man trykker på ikke
   byttes ut mellom mousedown og mouseup. */
F.planlegg = () => {
  if (fMusNede) { fVenter = true; return; }
  clearTimeout(fTimer);
  fTimer = setTimeout(F.tegn, 0);
};

F.lagre = () => { if (F.lagreFn) F.lagreFn(); };

F.koble = rot => {
  F.rot = rot;
  document.addEventListener('mousedown', () => { fMusNede = true; }, true);
  document.addEventListener('mouseup', () => {
    fMusNede = false;
    if (fVenter) { fVenter = false; setTimeout(F.tegn, 0); }
  }, true);

  rot.addEventListener('input', e => {
    const el = e.target.closest('[data-felt]');
    if (!el || ['bool', 'radio', 'liste', 'sjekk', 'velg'].includes(el.dataset.type)) return;
    fSkriv(el);
    F.lagre();
    if (el.dataset.levende !== undefined) F.planlegg();
  });
  rot.addEventListener('change', e => {
    if (e.target.type === 'file') { if (F.side.vedFil) F.side.vedFil(e.target); return; }
    const el = e.target.closest('[data-felt]');
    if (!el) return;
    fSkriv(el);
    F.lagre();
    F.planlegg();
  });
  rot.addEventListener('focusout', e => {
    const el = e.target.closest('[data-type="belop"]');
    if (el) el.value = eTusen(F.hent(el.dataset.felt));
  });
  rot.addEventListener('click', async e => {
    const hjelp = e.target.closest('[data-hjelp]');
    if (hjelp) {
      const n = hjelp.dataset.hjelp;
      if (F.apneHjelp.has(n)) F.apneHjelp.delete(n); else F.apneHjelp.add(n);
      const apen = F.apneHjelp.has(n);
      hjelp.setAttribute('aria-expanded', String(apen));
      const boks = document.getElementById(F.id(`h-${n}`));
      if (boks) boks.hidden = !apen;
      return;
    }
    const trekk = e.target.closest('[data-trekk]');
    if (trekk) {
      const n = trekk.dataset.trekk;
      if (F.lukket.has(n)) F.lukket.delete(n); else F.lukket.add(n);
      const apen = !F.lukket.has(n);
      trekk.setAttribute('aria-expanded', String(apen));
      document.getElementById(F.id(`t-${n}`)).hidden = !apen;
      return;
    }
    const til = e.target.closest('[data-til]');
    if (til) {
      e.preventDefault();
      F.gaaTilFeil(til.dataset.til);
      return;
    }
    const k = e.target.closest('[data-handling]');
    if (k && F.side.handlinger && F.side.handlinger[k.dataset.handling]) {
      e.preventDefault();
      if (k.disabled) return;
      const svar = await F.side.handlinger[k.dataset.handling](k.dataset, F.pf, e);
      if (svar !== false) { F.lagre(); F.tegn(); }
    }
  });
};

F.gaaTilFeil = nokkel => {
  const boks = document.querySelector(`[data-feltboks="${CSS.escape(nokkel)}"]`) || document.getElementById(F.id(nokkel));
  if (!boks) return;
  const lukket = boks.closest('.e-trekk__kropp[hidden]');
  if (lukket) lukket.previousElementSibling.click();
  boks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  boks.classList.remove('er-markert');
  void boks.offsetWidth;
  boks.classList.add('er-markert');
  const input = boks.matches('input, select, textarea') ? boks : boks.querySelector('input:not([disabled]), select, textarea');
  if (input) input.focus({ preventScroll: true });
};

F.visSammendrag = () => {
  const s = document.getElementById('feilsammendrag');
  if (!s) return;
  s.scrollIntoView({ behavior: 'smooth', block: 'center' });
  s.focus({ preventScroll: true });
};

/* ═══ Vanlige valideringer ════════════════════════════════════════ */

const V = {
  tom: v => v == null || v === '' || (Array.isArray(v) && !v.length),
  epost: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v)),
  telefon: v => /^([0]{2}\d{2}|\+\d{2})?\d{8}$/.test(String(v).replace(/\s/g, '')),
  orgnr: v => /^\d{9}$/.test(String(v || '').replace(/[\s.-]/g, '')),
  navn: v => /^[a-zæøåA-ZÆØÅ0-9_.,\-\s]*$/.test(String(v)),
  heltall: v => /^\d+$/.test(String(v).replace(/\s/g, '')),
  /* "MM.ÅÅÅÅ" → { m, y } eller null */
  mnd: v => {
    const m = /^(1[012]|0?[1-9])\.((?:19|20)\d{2})\s*$/.exec(String(v || ''));
    return m ? { m: Number(m[1]), y: Number(m[2]) } : null;
  },
  mndTall: ({ m, y }) => y * 12 + (m - 1)
};

/* Org.nr.-feltet med oppslag. Navnet vises til høyre når nummeret finnes. */
F.orgnr = ({ felt, label = 'Organisasjonsnummer', nokkel = felt, hjelp }) => {
  const id = F.id(nokkel);
  const v = F.hent(felt);
  const f = V.orgnr(v) ? eForetak(v) : null;
  return `<div class="e-orgnr" data-feltboks="${nokkel}">
    <div class="e-felt${F.harFeil(nokkel) ? ' e-felt--feil' : ''}">
      ${fEtikett({ label, hjelp, nokkel, forId: id })}
      <input class="e-input" id="${id}" data-felt="${felt}" data-type="tekst" data-levende inputmode="numeric" maxlength="9" value="${eEsc(v ?? '')}" autocomplete="off" ${fAria(nokkel)}>
      ${F.feilHtml(nokkel)}
    </div>
    <div class="e-orgnr__navn" aria-live="polite">${f ? `<span class="e-felt__label">Organisasjonsnavn</span><p class="e-mb0">${eEsc(f.navn)}</p><span class="e-sr">Fant foretak ${eEsc(f.navn)}</span>` : ''}</div>
  </div>`;
};

/* Feilmeldingene for et org.nr.-felt, som i dag */
function vOrgnr(v, { paakrevd = true, tomTekst = 'Du må skrive organisasjonsnummer.', sjekk } = {}) {
  if (V.tom(v)) return paakrevd ? tomTekst : null;
  if (!V.orgnr(v)) return 'Du må skrive inn et gyldig organisasjonsnummer.';
  const nr = String(v).replace(/[\s.-]/g, '');
  const f = eForetak(nr);
  if (!f) return 'Vi finner ingen foretak med dette org.nummeret.';
  if (f.orgnr !== nr) return `Søker/låntaker kan ikke være underforetak. Du må registrere orgnummer til hovedforetak med orgnr ${f.orgnr}`;
  return sjekk ? sjekk(f) : null;
}
