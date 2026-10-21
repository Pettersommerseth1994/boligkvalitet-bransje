/* ──────────────────────────────────────────────────────────────────
   Veiviseren: søknadstype øverst, stepperen og knapperaden.

   Hvert steg ligger i STEG[path] (steg-*.js) med tegn(pf), valider(pf)
   og eventuelle handlinger. «Neste steg» går bare videre når steget er
   gyldig. «Forrige steg» og «Lagre og avslutt» går alltid, som i dag.
   ────────────────────────────────────────────────────────────────── */

const STEG = {};
const W = { t: null, pf: null, path: null, stepperApen: false };

W.stegIndeks = path => S.STEG.findIndex(s => s.path === path);
W.lagre = () => {
  W.pf.sistEndretDato = new Date().toISOString();
  W.pf.sistEndretAv = E_BRUKER;
  eSkriv(W.t);
};
W.kanEndres = () => W.pf.status === 'UFERDIG' || ['SIGNERINGAVVIST', 'SIGNERINGKANSELLERT'].includes(W.pf.status);

function wizardStart() {
  eMonter();
  W.t = eTilstand();
  S.t = W.t;
  const p = new URLSearchParams(location.search);
  W.pf = S.finn(W.t, p.get('id'));
  if (!W.pf) { location.href = 'index.html'; return; }
  if (['SIGNERINGAVVIST', 'SIGNERINGKANSELLERT'].includes(W.pf.status)) { W.pf.status = 'UFERDIG'; W.lagre(); }
  let path = p.get('steg');
  if (p.get('fortsett')) path = W.pf.utfyllingssteg || 'prosjektinformasjon';
  if (!STEG[path]) path = 'prosjektinformasjon';
  if (!W.kanEndres()) path = 'oppsummering';
  F.lagreFn = W.lagre;
  F.koble(document.getElementById('steg'));
  W.visSteg(path, { erstatt: true });
  window.addEventListener('popstate', () => {
    const ny = new URLSearchParams(location.search).get('steg');
    if (STEG[ny]) W.visSteg(ny, { historikk: false });
  });
  document.getElementById('skjema').addEventListener('click', W.klikk);
}

W.visSteg = (path, { erstatt = false, historikk = true } = {}) => {
  W.path = path;
  W.stepperApen = false;
  F.pf = W.pf;
  F.side = STEG[path];
  F.visFeil = !!(W.pf.forsokt && W.pf.forsokt[path]);
  if (W.kanEndres()) {
    W.pf.utfyllingssteg = path;
    W.pf.besokt = [...new Set([...(W.pf.besokt || []), path])];
    W.lagre();
  }
  if (F.side.foer) F.side.foer(W.pf);
  const url = `?id=${W.pf.id}&steg=${path}`;
  if (historikk) { if (erstatt) history.replaceState(null, '', url); else history.pushState(null, '', url); }
  W.tegnSkall();
  F.tegn();
  document.title = `${S.STEG[W.stegIndeks(path)].tittel} | ${E_TJENESTE}`;
  window.scrollTo(0, 0);
};

W.tegnSkall = () => {
  const pf = W.pf;
  const i = W.stegIndeks(W.path);
  const bred = STEG[W.path].bred;
  document.getElementById('side').className = `e-side${bred ? ' e-side--lg' : ''}`;
  const steg = S.STEG.map((s, j) => {
    const ferdig = j < i || (pf.besokt || []).includes(s.path) && j !== i && j < i;
    const kanKlikke = W.kanEndres() && j !== i && (pf.besokt || []).includes(s.path);
    const innhold = `<span class="e-stepper__ikon">${E_IKON[s.ikon]}</span><span class="e-stepper__tekst" data-nr="${j + 1}">${s.tittel}</span>`;
    return `<li class="e-stepper__steg${ferdig ? ' er-ferdig' : ''}${j === i ? ' er-aktiv' : ''}">
      ${kanKlikke ? `<a class="e-stepper__lenke" href="?id=${pf.id}&steg=${s.path}" data-steg="${s.path}">${innhold}</a>`
    : `<span class="e-stepper__lenke"${j === i ? ' aria-current="page"' : ''}>${innhold}</span>`}
    </li>`;
  }).join('');
  document.getElementById('skall').innerHTML = `
    <p class="e-soknadstype"><span class="e-soknadstype__navn">${eEsc(pf.navn || '')}</span>(${S.TILTAK[pf.prosjektTiltakKode].kort})</p>
    ${W.kanEndres() ? `<nav class="e-stepper${W.stepperApen ? ' er-apen' : ''}" aria-label="Steg i søknaden">
      <button type="button" class="e-stepper__mobil" data-stepper aria-expanded="${W.stepperApen}">
        <span><span class="e-liten e-sekundaer">Steg ${i + 1} av ${S.STEG.length}</span><b>${S.STEG[i].tittel}</b></span>${E_IKON.pilNed}
      </button>
      <ol class="e-stepper__liste">${steg}</ol>
    </nav>` : ''}`;
};

/* Knapperaden under hvert steg. Første steg har ikke «Forrige steg». */
W.knapper = ({ neste = true, nesteDeaktivert = false, forrige = true } = {}) => {
  const i = W.stegIndeks(W.path);
  return `<div class="e-knapper">
    <div class="e-knapper__nav">
      ${neste ? `<button type="button" class="e-knapp e-knapp--prominent" id="nesteSteg" data-nav="neste" ${nesteDeaktivert ? 'disabled' : ''}>Neste steg ${E_IKON.pilHoyre}</button>` : ''}
      ${forrige && i > 0 ? `<button type="button" class="e-knapp" id="forrigeSteg" data-nav="forrige">${E_IKON.pilVenstre}Forrige steg</button>` : ''}
    </div>
    <button type="button" class="e-knapp e-knapp--subtil" data-nav="avslutt">${E_IKON.hus}Lagre og avslutt</button>
  </div>`;
};

/* Går til et steg. Framover krever at steget man står på er gyldig. */
W.gaa = async til => {
  const fra = W.stegIndeks(W.path);
  const maal = W.stegIndeks(til);
  if (maal > fra) {
    if (STEG[W.path].kanGaaVidere && !STEG[W.path].kanGaaVidere(W.pf)) { W.markerFeil(); return; }
    if (F.oppdaterFeil().length) { W.markerFeil(); return; }
  }
  if (STEG[W.path].vedForlat) STEG[W.path].vedForlat(W.pf);
  if (W.pf.forsokt) delete W.pf.forsokt[til];
  W.lagre();
  const ferdig = eSpinner('Lagrer');
  await eVent(250);
  ferdig();
  W.visSteg(til);
  eFokuserH1();
};
W.markerFeil = () => {
  W.pf.forsokt = { ...(W.pf.forsokt || {}), [W.path]: true };
  F.visFeil = true;
  W.lagre();
  F.tegn();
  F.visSammendrag();
};

W.klikk = e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    const i = W.stegIndeks(W.path);
    if (nav.dataset.nav === 'neste') W.gaa(S.STEG[i + 1].path);
    if (nav.dataset.nav === 'forrige') W.gaa(S.STEG[i - 1].path);
    if (nav.dataset.nav === 'avslutt') {
      if (STEG[W.path].vedForlat) STEG[W.path].vedForlat(W.pf);
      W.lagre();
      location.href = 'index.html';
    }
    return;
  }
  const lenke = e.target.closest('[data-steg]');
  if (lenke) { e.preventDefault(); W.gaa(lenke.dataset.steg); return; }
  if (e.target.closest('[data-stepper]')) {
    W.stepperApen = !W.stepperApen;
    W.tegnSkall();
  }
};
