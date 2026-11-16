/* ──────────────────────────────────────────────────────────────────
   Versjonsvelger for e-søknaden

   Samme boks som i lånesøknaden for privatpersoner. Hver versjon er en
   egen mappe. Den siste ligger rett i grunnlan-esoknad/, så lenker som
   er delt ut peker på det nyeste, og de eldre ligger frosset i v1/ og så
   videre. Alle versjonene laster denne fila, så lista står ett sted.

   Slik legger du til en ny versjon:
     1. Kopier sidene i flyten og assets/ til vN/, uten versjoner.*,
        hb-versjoner.css og forslagssidene. Rett stiene i kopien til
        ../../ds/ og ../assets/versjoner.* og ../assets/hb-versjoner.css,
        som i v1/.
     2. Gi den nye versjonen sin egen E_LAGER i felles.js, så svarene
        ikke blandes mellom versjonene.
     3. Sett mappe: 'vN/' på den forrige versjonen her, og legg den nye
        nederst med mappe: ''.
     4. Sett data-versjon på <body> i alle sidene.

   Endringene i en versjon står i endringer. Nummeret er plassen i lista,
   og det samme nummeret settes på blokka det gjelder med
   data-endret="N". Bryteren «Vis endringene» markerer blokkene, og
   punktene i lista tar deg til dem.

   En endring i skjemaet har steg (stien i veiviseren) og soknad, som
   sier hvilken eksempelsøknad som viser den: 'klima' er den påbegynte
   klimavennlige, 'livslop' den påbegynte med livsløpsstandard og
   'innvilget' den innvilgede klimavennlige. Sider utenfor skjemaet får
   søknaden med ?id=.
   ────────────────────────────────────────────────────────────────── */

const E_VERSJONER = [
  {
    nr: 1,
    navn: 'Klimavennlig bolig, alternativ 2',
    dato: '9. november 2026',
    mappe: 'v1/',
    endringer: [
      { side: 'opprett-soknad.html', tekst: '«Velg formål» ved oppføring: Klimavennlig bolig eller Livsløpsstandard. Velg «Bygge nye boliger» for å se det.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'boligkvaliteter', tekst: 'Infoboks om klimagassbudsjett etter NS 3720:2018, og klimagassregnskap ved utbetaling eller videresalg.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'boligkvaliteter', tekst: 'Nytt spørsmål: er det utarbeidet et klimagassbudsjett? Svarer man nei, kommer en advarsel.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'boligkvaliteter', tekst: 'Alternativ 2 fra Miro: kryss av for blokk og/eller småhus. Hver type får et kort med samlet BTA og antatt utslipp, uten kjeller og for oppvarmet og uoppvarmet kjeller.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'boligkvaliteter', tekst: 'Tabell med grenseverdiene for prosjektet. Bygg og kjeller vektes etter BTA når det er flere deler.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'vedlegg', tekst: 'Nytt vedlegg: klimagassbudsjett, når man har svart ja på at det er laget.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'oppsummering', tekst: 'Oppsummeringen viser bygningstypene, BTA og utslipp for hver del, og bygg og kjeller mot grenseverdiene.' }
    ]
  },
  {
    nr: 2,
    navn: 'Post-it-lappene fra Miro',
    dato: '16. november 2026',
    mappe: '',
    endringer: [
      { side: 'opprett-soknad.html', tekst: 'Transformasjon erstatter ombygging: «Gjøre om bygg til boligformål (transformasjon)» og «Lån til transformasjon».' },
      { side: 'soknad.html', soknad: 'livslop', steg: 'boligkvaliteter', tekst: 'Livsløpsstandard og transformasjon spør ikke lenger om BTA, klimagassavtrykk og kjeller. Klimaspørsmålene gjelder bare Klimavennlig bolig.' },
      { side: 'soknad.html', soknad: 'livslop', steg: 'boligkvaliteter', tekst: 'Arealgrensen for småhus er 200 m² per boenhet, som enebolig. Blokk er fortsatt 130 m².' },
      { side: 'soknad.html', soknad: 'klima', steg: 'vedlegg', tekst: 'Vedlegget klimagassbudsjett sier at ferdig klimagassregnskap må sendes inn ved utbetaling eller før videresalg.' },
      { side: 'opprett-soknad.html', tekst: 'Transformasjon: en boks ber dere ta kontakt med regionkontoret før dere søker, for et forprosjekt. Velg «Gjøre om bygg til boligformål» for å se den.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'oppsummering', tekst: 'Oppsummeringen viser andelen av prosjektets BTA og grenseverdien for hver del.' },
      { side: 'utbetaling.html', soknad: 'innvilget', tekst: 'Ny side: søknad om utbetaling, der klimagassregnskapet lastes opp og sammenlignes med tallene fra søknaden. Åpnes fra «Søk om utbetaling» på Havnelageret.' },
      { side: 'saksbehandler.html', soknad: 'innvilget', tekst: 'Ny side: saksbehandlers visning av klimatallene, med andeler, grenseverdier og status.' },
      { side: 'saksbehandler.html', soknad: 'innvilget', tekst: 'Boenhetene med bygningstype, arealgrense og om de er med i låneutmålingen, og fila til Elements (CSV) med de samme kolonnene.' },
      { side: 'soknad.html', soknad: 'klima', steg: 'boligkvaliteter', tekst: 'En boenhet over arealgrensen for bygningstypen får et «i» i stedet for «?». Trykk på det for å se merknaden. Antallet med og uten i låneutmålingen står under.' }
    ]
  }
];

(function () {
  const kropp = document.body;
  const naa = Number(kropp.dataset.versjon);
  const gjeldende = E_VERSJONER.find(v => v.nr === naa);
  if (!gjeldende) return;
  const siste = E_VERSJONER[E_VERSJONER.length - 1];

  const rotUrl = new URL('../', document.currentScript.src);
  const side = location.pathname.split('/').pop() || 'index.html';
  const lenke = v => new URL(v.mappe + (side === 'soknad.html' ? 'index.html' : side), rotUrl).href;

  const celler = E_VERSJONER.map(v => {
    const tittel = `Versjon ${v.nr}, ${v.navn}, ${v.dato}`;
    return v.nr === naa
      ? `<span class="versjoner__celle" aria-current="page" title="${tittel}">${v.nr}</span>`
      : `<a class="versjoner__celle" href="${lenke(v)}" title="${tittel}">${v.nr}</a>`;
  }).join('');

  const endringer = gjeldende.endringer || [];
  const punkter = endringer.map((e, i) => `
      <li><button type="button" data-endring="${i + 1}" title="${e.tekst}">
        <span class="nr">${i + 1}</span>
        <span class="tekst">${e.tekst}</span>
      </button></li>`).join('');

  const rot = document.createElement('nav');
  rot.className = 'versjoner';
  rot.setAttribute('aria-label', 'Versjoner av prototypen');
  rot.innerHTML = `
    <div class="versjoner__rad">
      <span class="versjoner__hint">Versjoner</span>
      <div class="versjoner__celler">${celler}</div>
    </div>
    <p class="versjoner__endring">
      <b>${gjeldende.nr}. ${gjeldende.navn}, ${gjeldende.dato}</b>
      ${naa !== siste.nr ? `<em class="versjoner__eldre">Dette er en eldre versjon.</em>
        <a href="${lenke(siste)}">Gå til den siste</a>.` : ''}
    </p>
    ${endringer.length ? `
      <label class="versjoner__bryter">
        <input type="checkbox" id="vis-endringer">
        <span class="versjoner__spor"></span>
        <span class="versjoner__bryter-tekst">Vis endringene
          <span class="versjoner__antall">(${endringer.length})</span>
        </span>
      </label>
      <ul class="versjoner__liste" hidden>${punkter}</ul>` : ''}`;

  function monter() {
    const topp = document.getElementById('e-topp');
    if (topp) topp.after(rot); else kropp.prepend(rot);
  }
  monter();

  if (!endringer.length) return;

  function visEndring(nr) {
    document.querySelectorAll('[data-endret].er-valgt').forEach(m => m.classList.remove('er-valgt'));
    const el = document.querySelector(`[data-endret="${nr}"]:not([hidden])`);
    if (!el) return;
    const innhold = el.closest('.e-lesmer__innhold');
    if (innhold && innhold.hidden) innhold.parentElement.querySelector('.e-lesmer__knapp').click();
    el.classList.add('er-valgt');
    el.scrollIntoView({ block: 'center' });
  }

  const LAGER = 'e-viser-endringer';
  const boks = rot.querySelector('#vis-endringer');
  const liste = rot.querySelector('.versjoner__liste');

  function tegn(paa) {
    kropp.classList.toggle('viser-endringer', paa);
    liste.hidden = !paa;
  }

  boks.addEventListener('change', () => {
    tegn(boks.checked);
    try { localStorage.setItem(LAGER, boks.checked ? '1' : '0'); } catch (e) { /* privat modus */ }
  });

  const PASSER = {
    klima: s => s.status === 'UFERDIG' && s.laneformal === 'KLIMAVENNLIG',
    livslop: s => s.status === 'UFERDIG' && s.laneformal === 'LIVSLOPSSTANDARD',
    innvilget: s => s.hilsStatus === 'INNVILGET' && s.laneformal === 'KLIMAVENNLIG'
  };
  const finnSoknad = passer => ((typeof eTilstand === 'function' && eTilstand()) || { soknader: [] }).soknader.find(passer);

  /* Endringen kan ligge på en annen side, et annet steg eller i en annen
     eksempelsøknad. Er vi allerede i riktig søknad, bytter vi steg
     direkte. Ellers går vi dit, med nummeret i adressen, og viser blokka
     når siden er tegnet. */
  liste.addEventListener('click', e => {
    const knapp = e.target.closest('[data-endring]');
    if (!knapp) return;
    const nr = Number(knapp.dataset.endring);
    const endring = endringer[nr - 1];

    const passer = PASSER[endring.soknad] || (() => true);
    if (endring.side !== 'soknad.html') {
      if (endring.side === side) { visEndring(nr); return; }
      const s = endring.soknad && finnSoknad(passer);
      location.href = `${endring.side}${s ? `?id=${s.id}` : ''}#endring-${nr}`;
      return;
    }
    const iSoknad = side === 'soknad.html' && typeof W !== 'undefined' && W.pf;
    if (iSoknad && passer(W.pf)) {
      if (W.path !== endring.steg) W.visSteg(endring.steg);
      visEndring(nr);
      return;
    }
    const s = finnSoknad(passer);
    location.href = s ? `soknad.html?id=${s.id}&steg=${endring.steg}#endring-${nr}` : 'index.html';
  });

  let paa = false;
  try { paa = localStorage.getItem(LAGER) === '1'; } catch (e) { /* privat modus */ }
  boks.checked = paa;
  tegn(paa);

  /* Veiviseren skriver om adressen når den starter, så nummeret leses nå */
  const maal = /^#endring-(\d+)$/.exec(location.hash);
  if (maal) {
    window.addEventListener('DOMContentLoaded', () => {
      visEndring(Number(maal[1]));
      history.replaceState(null, '', location.pathname + location.search);
    });
  }
})();
