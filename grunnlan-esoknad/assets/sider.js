/* ──────────────────────────────────────────────────────────────────
   Sidene utenfor veiviseren: forsiden med søknadsoversikten,
   «Opprett søknad», kvitteringen, og sidene man når fra menyen på
   en innsendt søknad (endre låntaker, igangsettelse, utsette oppstart).
   ────────────────────────────────────────────────────────────────── */

const STATUS = {
  UFERDIG: ['Uferdig', 'noytral-svak'], TILSIGNERING: ['Sendt til signering', 'noytral-svak'], TILSIGNERINGSTARTET: ['Sendt til signering', 'noytral-svak'],
  INNSENDT: ['Innsendt', 'noytral-middels'], INNSENDINGSTARTET: ['Innsendt', 'noytral-middels'],
  UNDERBEHANDLING_SOKNAD: ['Under behandling (søknad)', 'noytral-sterk'], UNDERBEHANDLING_UTBETALING: ['Under behandling (utbetaling)', 'noytral-sterk'],
  SIGNERINGAVVIST: ['Signering avvist', 'negativ-svak'], SIGNERINGKANSELLERT: ['Signering kansellert', 'negativ-svak'],
  AVSLAG: ['Avslag', 'negativ-middels'], TREKKINGSTARTET: ['Trekking startet', 'negativ-middels'], TRUKKET: ['Trukket', 'negativ-middels'],
  ANNULLERT: ['Annullert', 'negativ-middels'], FEILMANGEL: ['Feil/mangel', 'negativ-sterk'], INNVILGET: ['Innvilget', 'positiv-svak'],
  UTBETALT: ['Utbetalt', 'positiv-middels'], AVSLUTTET: ['Avsluttet', 'positiv-middels'], UKJENT: ['Ukjent', '']
};
const visStatus = pf => (['TRUKKET', 'TREKKINGSTARTET', 'ANNULLERT'].includes(pf.status) || pf.hilsStatus === 'UKJENT' ? pf.status : pf.hilsStatus);
const ALTINN_LENKE = '<a href="https://info.altinn.no/hjelp/" target="_blank" rel="noopener">Fullmakt til enkelttjenester i Altinn (åpner i ny fane)</a>';
const sideParam = n => new URLSearchParams(location.search).get(n);

/* ═══ Forsiden ════════════════════════════════════════════════════ */

let apenRad = null;

function forsiden() {
  eMonter();
  const t = eTilstand();
  S.t = t;
  const org = eAktivOrg(t);
  const oppslag = eForetak(org.orgnr);
  const grunner = [];
  if (oppslag && oppslag.orgnr !== org.orgnr) grunner.push(`Søker/låntaker kan ikke være underforetak. Du må registrere orgnummer til hovedforetak med orgnr ${oppslag.orgnr}`);
  if (!E_KUNDETYPER.includes(org.kundeType)) grunner.push(`Vi klarer ikke å innhente tilstrekkelige opplysninger om ${eEsc(org.navn)} til at du kan søke elektronisk. Ta derfor kontakt med oss hvis du ønsker å søke på noen av Husbankens ordninger.`);

  const mine = t.soknader.filter(s => s.soker.orgNr === org.orgnr || (s.lantaker && s.lantaker.orgNr === org.orgnr));
  const rot = document.getElementById('side');
  const tegn = () => {
    rot.innerHTML = `
      <h1 class="e-h1">${eEsc(org.navn)}</h1>
      ${grunner.length ? eCallout('advarsel', grunner.map(g => `<p>${g}</p>`).join(''), false, ' id="disableNySoknadReasons"') : ''}
      <p><button type="button" class="e-knapp e-knapp--prominent" id="nySoknad" ${grunner.length ? 'disabled' : ''}>Ny søknad</button></p>
      <h1 class="e-h1 e-mt" id="oversiktOverSoknader" style="margin-top:var(--space-7)">Oversikt over søknader</h1>
      ${mine.length ? `<div class="e-tabell-rulle"><table class="e-tabell e-oversikt">
        <thead><tr><th><span class="e-sr">Vis detaljer</span></th><th>Status</th><th>Navn</th><th>Virkemiddel</th><th>Dato</th></tr></thead>
        <tbody>${mine.map(soknadsrad).join('')}</tbody></table></div>` : '<p>Du har ingen søknader</p>'}`;
  };
  tegn();

  rot.addEventListener('click', async e => {
    if (e.target.closest('#nySoknad')) { location.href = 'opprett-soknad.html'; return; }
    const k = e.target.closest('[data-valg]');
    if (k) { await soknadsvalg(k.dataset.valg, S.finn(eTilstand(), k.dataset.id)); return; }
    const rad = e.target.closest('.e-oversikt__rad');
    if (rad && !e.target.closest('a, button')) { apenRad = apenRad === rad.dataset.id ? null : rad.dataset.id; tegn(); document.querySelector(`.e-oversikt__rad[data-id="${rad.dataset.id}"]`)?.focus(); }
  });
  rot.addEventListener('keydown', e => {
    const rad = e.target.closest('.e-oversikt__rad');
    if (rad && (e.key === ' ' || e.key === 'Enter') && e.target === rad) { e.preventDefault(); rad.click(); }
  });

  function soknadsrad(pf) {
    const st = visStatus(pf);
    const [tekst, farge] = STATUS[st] || STATUS.UKJENT;
    const apen = apenRad === String(pf.id);
    const dato = pf.status === 'UFERDIG' ? `Sist endret: ${eDato(new Date(pf.sistEndretDato))}`
      : ['TILSIGNERING', 'TILSIGNERINGSTARTET'].includes(pf.status) ? `Sendt til signering: ${eDato(new Date(pf.sendtTilSigneringDato || pf.sistEndretDato))}`
        : pf.mottattDato ? `Innsendt dato: ${eDato(new Date(pf.mottattDato))}` : `Sist endret: ${eDato(new Date(pf.sistEndretDato))}`;
    return `
      <tr class="e-oversikt__rad" data-id="${pf.id}" tabindex="0" aria-expanded="${apen}" title="Trykk for å vise saksdetaljer">
        <td>${apen ? E_IKON.pilOpp : E_IKON.pilNed}</td>
        <td><span class="e-status e-status--${farge}"><span class="e-status__prikk"></span>${tekst}</span></td>
        <td>${eEsc(S.navn(pf))}</td>
        <td>${S.virkemidler(pf).map(v => S.VIRKEMIDDEL[v]).join(', ')}</td>
        <td class="e-liten">${dato}${pf.sistEndretAv ? ` av ${eEsc(pf.sistEndretAv)}` : ''}</td>
      </tr>
      ${apen ? `<tr class="e-oversikt__detalj"><td colspan="5">${soknadsdetalj(pf)}</td></tr>` : ''}`;
  }

  function soknadsdetalj(pf) {
    const knapp = (valg, tekst, stil = '', ikon = '') => `<button type="button" class="e-knapp ${stil}" data-valg="${valg}" data-id="${pf.id}">${ikon}${tekst}</button>`;
    const fortsett = ['UFERDIG', 'SIGNERINGAVVIST', 'SIGNERINGKANSELLERT'].includes(pf.status);
    const iverksatt = pf.igangsatt;
    const hils = pf.hilsStatus;
    const menyen = ['TRUKKET', 'ANNULLERT'].includes(pf.status) ? [] : [
      pf.status === 'UFERDIG' && (Date.now() - new Date(pf.sistEndretDato)) / 864e5 >= 83 && knapp('utsett-sletting', 'Utsett sletting'),
      pf.status === 'UFERDIG' && knapp('slett', 'Slett søknad', 'e-knapp--destruktiv', E_IKON.soppel),
      hils === 'INNVILGET' && !S.er(pf, 'KJOP') && !iverksatt && knapp('igangsettelse', 'Igangsettelse'),
      ['UNDERBEHANDLING_SOKNAD', 'FEILMANGEL', 'INNVILGET'].includes(hils) && !S.er(pf, 'KJOP') && !iverksatt && knapp('utsett-oppstart', 'Utsette oppstart'),
      !S.salg(pf) && ['INNVILGET', 'UNDERBEHANDLING_SOKNAD', 'FEILMANGEL'].includes(hils) && knapp('endre-lantaker', 'Endre låntaker'),
      pf.trekkbar && knapp('trekk', 'Trekk søknad', 'e-knapp--subtil-destruktiv'),
      pf.status === 'TILSIGNERING' && knapp('kanseller', 'Kanseller signering', 'e-knapp--subtil-destruktiv')
    ].filter(Boolean);
    return `
      <p>Saksreferanse: ${eEsc(pf.saksreferanse || pf.id)}</p>
      ${hils === 'FEILMANGEL' ? eCallout('info', '<p>Husbanken vil ta kontakt før søknaden kan behandles videre.</p>') : ''}
      ${pf.status === 'TILSIGNERING' && pf.undertegnere ? `
        <div class="e-kort e-kort--gra"><div class="e-kort__kropp">
          <h3 class="e-h4">Signering</h3>
          <ul class="e-mb0">${pf.undertegnere.map(u => `<li>${eEsc(u.navn)}: venter på signering</li>`).join('')}</ul>
          <p class="e-liten e-sekundaer" style="margin-top:var(--space-3)">Prototype: <button type="button" class="e-knapp e-knapp--lenke" data-valg="signer" data-id="${pf.id}">La alle signere</button></p>
        </div></div>` : ''}
      <div class="e-knappegruppe">
        ${fortsett ? `<a class="e-knapp e-knapp--prominent" href="soknad.html?id=${pf.id}&fortsett=true">Fortsett</a>`
    : `<a class="e-knapp" href="soknad.html?id=${pf.id}&steg=oppsummering">Oversikt</a>`}
        ${menyen.join('')}
      </div>`;
  }
}

async function soknadsvalg(valg, pf) {
  const t = eTilstand();
  const lagret = S.finn(t, pf.id);
  const navn = eEsc(S.navn(pf));
  if (valg === 'slett') {
    const ok = await eBekreft({ tittel: 'Bekreft sletting', tekst: `Er du sikker på at du vil slette <b>${navn}</b>?`, bekreft: 'Slett', destruktiv: true });
    if (!ok) return;
    t.soknader = t.soknader.filter(s => s.id !== pf.id);
    t.varsler = [...(t.varsler || []), { tone: 'feil', html: `<p><b>${navn}</b> er slettet.</p>` }];
    eSkriv(t); location.reload(); return;
  }
  if (valg === 'utsett-sletting') {
    lagret.sistEndretDato = new Date().toISOString();
    t.varsler = [...(t.varsler || []), { tone: 'positiv', html: `<p>Sletting er utsatt med 90 dager for <b>${navn}</b>.</p>` }];
    eSkriv(t); location.reload(); return;
  }
  if (valg === 'kanseller') {
    const ok = await eBekreft({ tittel: 'Bekreft kansellering av signering', tekst: `Er du sikker på at du vil kansellere signering på <b>${navn}</b>?` });
    if (!ok) return;
    lagret.status = 'SIGNERINGKANSELLERT'; lagret.sistEndretDato = new Date().toISOString();
    t.varsler = [...(t.varsler || []), { tone: 'positiv', html: '<p>Signering er kansellert.</p>' }];
    eSkriv(t); location.reload(); return;
  }
  if (valg === 'signer') {
    lagret.status = 'INNSENDT'; lagret.hilsStatus = 'UNDERBEHANDLING_SOKNAD'; lagret.mottattDato = new Date().toISOString();
    lagret.saksreferanse = lagret.saksreferanse || `26/0${String(lagret.id).slice(-4)}`;
    eSkriv(t); location.reload(); return;
  }
  if (valg === 'trekk') {
    const ok = await eBekreft({ tittel: 'Bekreft trekking av søknad', tekst: `<p>Vær klar over følgende:</p><ul><li>Du kan ikke angre eller klage på en søknad som er trukket</li><li>Vi sender melding i Altinn om at søknaden er trukket til foretakene som er registrert som søker og låntaker</li></ul><p>Er du sikker på at du vil trekke søknaden <b>${navn}</b>?</p>` });
    if (!ok) return;
    lagret.status = 'TRUKKET';
    t.varsler = [...(t.varsler || []), { tone: 'positiv', html: `<p><b>${navn}</b>  er trukket.</p>` }];
    eSkriv(t); location.reload(); return;
  }
  location.href = `${valg}.html?id=${pf.id}`;
}

/* ═══ Opprett søknad ══════════════════════════════════════════════ */

const TILTAK_BRANSJE = ['OPPFORING', 'OPPGRADERING', 'KJOP', 'OMBYGGING'];

const opprettRegler = {
  laneformal: d => d.tiltak === 'OPPFORING',
  formal: d => !!d.tiltak && d.tiltak !== 'KJOP',
  avtale: d => d.formal === 'UTLEIE' || d.tiltak === 'KJOP',
  antall: d => d.avtale === 'TILVISNING',
  sokerErLantaker: d => d.tiltak === 'KJOP' || (!!d.formal && d.formal !== 'SALG'),
  harOrgnr: d => opprettRegler.sokerErLantaker(d) && d.sokerErLantaker === false,
  lantaker: d => opprettRegler.harOrgnr(d) && d.harOrgnr === true,
  produkter: d => [d.tiltak, (opprettRegler.avtale(d) && d.avtale === 'TILDELING' && d.tiltak !== 'OPPGRADERING') && 'TILSKUDDUTLEIE'].filter(Boolean)
};

function opprettRens(d) {
  const r = opprettRegler;
  if (!r.laneformal(d)) delete d.laneformal;
  if (!r.formal(d)) delete d.formal;
  if (!r.avtale(d)) delete d.avtale;
  if (d.tiltak === 'OPPGRADERING' && ['TILVISNING', 'TILDELING'].includes(d.avtale)) delete d.avtale;
  if (d.tiltak === 'KJOP' && d.avtale === 'INGENAVTALE') delete d.avtale;
  if (!r.antall(d)) delete d.antall;
  if (!r.sokerErLantaker(d)) delete d.sokerErLantaker;
  if (!r.harOrgnr(d)) delete d.harOrgnr;
  if (!r.lantaker(d)) delete d.lantaker;
  if (d.produkter) { d.produkter = d.produkter.filter(p => r.produkter(d).includes(p)); if (!d.produkter.length) delete d.produkter; }
}

function opprett() {
  eMonter();
  const t = eTilstand();
  S.t = t;
  const org = eAktivOrg(t);
  const epost = (org.varsling || []).map(v => v.email).filter(Boolean);
  const tlf = (org.varsling || []).map(v => v.tlf).filter(Boolean);
  if (!E_KUNDETYPER.includes(org.kundeType) || (eForetak(org.orgnr) || {}).orgnr !== org.orgnr) { location.href = 'index.html'; return; }

  const r = opprettRegler;
  const d = {};
  F.pf = d;
  F.side = {
    vedEndring: () => opprettRens(d),
    tegn: () => {
      const hjelpAvtale = `<p><b>Tilvisningsavtale:</b> Brukes i prosjekt med utleieboliger til vanskeligstilte på boligmarkedet. Anbefales når beboere ikke trenger spesielle oppfølgingstjenester fra kommunen. Det kan gis inntil 85 % lån til hele prosjektet og godkjente prosjektkostnader, mot at kommunen får tilvisingsrett til alle boligene. Ved fem eller flere boliger i prosjektet kan ikke kommunen tilvise flere enn 40 % av boligene til enhver tid. De øvrige boligene kan leies ut på det åpne leiemarked. Krav: Når kommunen benytter seg av tilvisingsretten, skal boligene leies ut til vanskeligstilte på boligmarkedet. Avtalen løper i 20 år fra dato for utbetaling av lånet fra Husbanken.</p>
        <p><b>Tildelingsavtale:</b> Brukes i prosjekt med utleieboliger til vanskeligstilte på boligmarkedet. Anbefales når beboere trenger spesielle oppfølgingstjenester fra kommunen. Husbanken kan gi en kombinasjon av lån og tilskudd til prosjektet mot at kommunen får tildelingssrett til alle boligene. Lån og tilskudd kan til sammen utgjøre inntil 85 % av godkjente prosjektkostnader. Krav: Alle boliger i prosjektet må leies ut til vanskeligstilte på boligmarkedet, også i de tilfellene hvor kommunen ikke benytter seg av sin tildelingsrett. Avtalen løper i 30 år fra dato for utbetaling av tilskuddet fra Husbanken.</p>`;
      const oppgradering = d.tiltak === 'OPPGRADERING';
      const andre = eRepresenterbare().filter(f => f.orgnr !== org.orgnr);
      return `
        ${eCallout('info', `
          <h2>Rammetillatelse</h2><p>Husbanken kan kun finansiere prosjekter/boliger som har fått rammetillatelse fra kommunen.</p>
          <h2>Kundeopplysninger</h2><p>Husbanken har etter Husbankloven, §§ 10-12, rett til å innhente personopplysninger som er nødvendige for å behandle søknader om lån og tilskudd, etterfølgende kontroller og forvalte kundeforholdet. Formålet med behandlingen er å gjennomføre forsvarlig og effektiv forvaltning. For mer informasjon om behandlingen av personopplysninger, herunder retten til å klage (forvaltningsloven § 14), hvilke kilder opplysningene blir hentet fra og hva de skal brukes til, se <a href="https://husbanken.no/om-husbanken/personvern" target="_blank" rel="noopener">Husbankens behandling av personopplysninger - personvernerklæring - Husbanken (åpner i ny fane)</a></p>
          <h2>Digital signatur</h2><p>Både søknad og kundeopplysninger må signeres ihht foretakets signaturregler. Disse kan nå signeres enklere digitalt.</p>`)}

        ${eKort({ tittel: `Nøkkelopplysninger for ${eStor(E_KUNDETYPE_NAVN[org.kundeType].toLowerCase())}`, kropp: `
          ${eCallout('info', '<p>Hvis du skal søke for et annet selskap enn det du representerer nå, endrer du dette i din profil i toppmenyen på siden.</p>')}
          <h3 class="e-h3">Prosjekteier</h3>
          <dl class="e-dl"><dt>Organisasjonsnummer</dt><dd>${org.orgnr}</dd><dt>Navn</dt><dd>${eEsc(org.navn)}</dd>
            <dt>Forretningsadresse</dt><dd>${eEsc(org.gateadresse)}, ${org.postnr} ${eEsc(org.poststed)}</dd></dl>
          <h3 class="e-h3">Varslingsadresser for foretaket</h3>
          <dl class="e-dl"><dt>E-post</dt><dd>${epost.length ? epost.map(eEsc).join('<br>') : 'Ingen'}</dd><dt>Telefon</dt><dd>${tlf.length ? tlf.join('<br>') : 'Ingen'}</dd></dl>
          ${F.gruppefeil('harGyldigEpost')}` })}

        ${F.radio({ felt: 'tiltak', label: 'Hva skal dere gjøre?', valg: TILTAK_BRANSJE.map(k => ({ v: k, l: S.TILTAK[k].valg })) })}

        ${r.laneformal(d) ? F.radio({ felt: 'laneformal', label: 'Velg formål', valg: Object.entries(S.LANEFORMAL).map(([v, l]) => ({ v, l })) }) : ''}

        ${r.formal(d) ? F.radio({ felt: 'formal', label: 'Skal boligene selges eller leies ut?', valg: [{ v: 'SALG', l: 'Salg' }, { v: 'UTLEIE', l: 'Utleie' }] }) : ''}

        ${r.avtale(d) ? F.radio({ felt: 'avtale', label: 'Har dere inngått avtale med en kommune eller et statlig helseforetak?', hjelp: hjelpAvtale,
          etter: '',
          valg: [
            { v: 'TILVISNING', l: 'Tilvisning', deaktivert: oppgradering },
            { v: 'TILDELING', l: 'Tildeling', deaktivert: oppgradering },
            ...(d.tiltak === 'KJOP' ? [] : [{ v: 'INGENAVTALE', l: 'Ingen avtale' }])
          ] }).replace('<div class="e-valgliste', `${oppgradering ? eCallout('advarsel', '<p>Husbanken gir ikke lån/tilskudd til oppgradering av kommunalt disponerte utleieboliger.</p>') : ''}<div class="e-valgliste`) : ''}

        ${r.antall(d) ? F.tall({ felt: 'antall', label: 'Hvor mange boliger skal ha tilvisningsrett?', hjelp: 'I prosjekter med færre enn fem boliger, kan kommunen tilvise alle boligene. Ved fem eller flere boliger i prosjektet, kan kommunen tilvise inntil 40 % av boligene til enhver tid.' }) : ''}

        ${r.sokerErLantaker(d) ? F.janei({ felt: 'sokerErLantaker', label: `Skal ${eEsc(org.navn)} være endelig låntaker?` }) : ''}
        ${r.harOrgnr(d) ? F.janei({ felt: 'harOrgnr', label: 'Har foretaket som skal være låntaker et organisasjonsnummer?' }) : ''}
        ${r.harOrgnr(d) && d.harOrgnr === false ? eCallout('info', '<p>Du kan fortsatt sende inn søknaden selv om foretaket ikke er opprettet. Søknaden må da oppdateres med informasjon om låntakers organisasjonsnummer innen fire uker. Dette kan du gjøre ved å logge inn og velge «Endre låntaker» på den aktuelle søknaden i søknadsoversikten. Dersom søknaden ikke er oppdatert innen fristen vil du få en påminnelse om at søknaden vil bli annullert.</p>', false, ' id="obs-melding-lanetakerStemmerNei"') : ''}
        ${r.lantaker(d) ? `
          <h3 class="e-h3">Låntaker</h3>
          ${F.velg({ felt: 'lantaker', label: 'Velg virksomhet', plassholder: '--- Virksomhet ---', bredde: 'l',
            valg: andre.map(f => ({ v: f.orgnr, l: `${eEsc(f.navn)} ${f.orgnr}` })) })}
          ${eCallout('info', `<p>Dersom ønsket låntaker ikke er i listen må du tildeles rettigheter til tjenesten <b>Lån- og tilskuddstjenester i Husbanken</b>. Dette må du gjøre i Altinn.</p><p>${ALTINN_LENKE}</p>`)}` : ''}

        ${d.tiltak ? eKort({ tittel: 'Dine finansieringsmuligheter', kropp: F.avkryss({ felt: 'produkter', label: 'Velg hva du ønsker å søke om',
          valg: r.produkter(d).map(p => ({ v: p, l: S.PRODUKTNAVN[p] })) }) }) : ''}

        ${F.sammendrag('Du må rette opp i dette før du kan gå videre')}
        ${eCallout('info', '<p>OBS! Valgene på denne siden kan ikke endres i ettertid, det må da eventuelt opprettes et nytt prosjekt.</p>')}
        <button type="button" class="e-knapp e-knapp--prominent" id="nesteSteg" data-handling="opprett">Opprett søknad</button>`;
    },
    valider: () => [
      !epost.length && { nokkel: 'harGyldigEpost', melding: `Det er ikke registrerte varslingsadresser for ${eEsc(org.navn)}. Dette må registreres i Altinn før du kan fullføre søknaden.` },
      !d.tiltak && { nokkel: 'tiltak', melding: 'Du må krysse av for hva prosjektet innebærer at du skal gjøre.' },
      r.laneformal(d) && !d.laneformal && { nokkel: 'laneformal', melding: 'Du må velge formål.' },
      r.formal(d) && !d.formal && { nokkel: 'formal', melding: 'Du må krysse av for om boligen skal selges eller leies ut.' },
      r.avtale(d) && !d.avtale && { nokkel: 'avtale', melding: 'Du må krysse av for type avtale med kommune.' },
      r.antall(d) && (V.tom(d.antall) ? { nokkel: 'antall', melding: 'Du må skrive antall tilvisningsboliger.' }
        : !V.heltall(d.antall) ? { nokkel: 'antall', melding: 'Du kan kun angi hele tall.' }
          : eNum(d.antall) > 9999 && { nokkel: 'antall', melding: 'Antall boliger med tilvisningsrett kan ikke være større enn 9999.' }),
      r.sokerErLantaker(d) && d.sokerErLantaker == null && { nokkel: 'sokerErLantaker', melding: 'Du må krysse av for om dette foretaket skal være endelig låntaker.' },
      r.harOrgnr(d) && d.harOrgnr == null && { nokkel: 'harOrgnr', melding: 'Du må krysse av for om låntaker har organisasjonsnummer.' },
      r.lantaker(d) && (!d.lantaker ? { nokkel: 'lantaker', melding: 'Du må velge låntaker.' } : lantakerFeil(d.lantaker)),
      d.tiltak && V.tom(d.produkter) && { nokkel: 'produkter', melding: 'Du må krysse av for hva du skal søke om.' }
    ].filter(Boolean),
    handlinger: {
      opprett: async () => {
        F.visFeil = true;
        if (F.oppdaterFeil().length) { F.tegn(); F.visSammendrag(); return false; }
        const ferdig = eSpinner('Oppretter søknaden');
        await eVent(600);
        const lant = d.lantaker ? eForetak(d.lantaker) : null;
        const pf = S.ny(t, {
          prosjektTiltakKode: d.tiltak, laneformal: d.laneformal, formalKode: d.formal,
          livslopsboliger: d.laneformal ? d.laneformal === 'LIVSLOPSSTANDARD' : undefined, miljoboliger: d.laneformal ? d.laneformal === 'KLIMAVENNLIG' : undefined, kommuneavtaleTypeKode: d.avtale, antallTilvisningsboliger: d.antall,
          finansieringsProdukter: d.produkter, sokerErLantaker: d.sokerErLantaker !== false ? (r.sokerErLantaker(d) ? true : undefined) : false,
          lantakerHarOrgNr: d.harOrgnr
        });
        if (d.sokerErLantaker === false) pf.lantaker = lant ? { orgNr: lant.orgnr, orgNavn: lant.navn, kundeType: lant.kundeType } : null;
        if (S.salg(pf)) pf.lantaker = null;
        eSkriv(t);
        ferdig();
        location.href = `soknad.html?id=${pf.id}&steg=prosjektinformasjon`;
        return false;
      }
    }
  };
  F.koble(document.getElementById('side'));
  F.tegn();
}

function lantakerFeil(orgnr) {
  const f = eForetak(orgnr);
  if (!f) return { nokkel: 'lantaker', melding: 'Vi finner ingen foretak med dette org.nummeret.' };
  if (f.orgnr !== orgnr) return { nokkel: 'lantaker', melding: `Søker/låntaker kan ikke være underforetak. Du må registrere orgnummer til hovedforetak med orgnr ${f.orgnr}` };
  if (!E_KUNDETYPER.includes(f.kundeType)) return { nokkel: 'lantaker', melding: 'Foretaket er ikke i målgruppen for Husbankens ordninger.' };
  return null;
}

/* ═══ Kvittering ══════════════════════════════════════════════════ */

function kvittering() {
  eMonter();
  const t = eTilstand();
  const pf = S.finn(t, sideParam('id'));
  if (!pf) { location.href = 'index.html'; return; }
  const signering = ['TILSIGNERING', 'TILSIGNERINGSTARTET'].includes(pf.status);
  document.getElementById('side').innerHTML = `
    <h1 class="e-h1 e-h1--senter">${signering ? 'Søknaden er sendt til signering' : 'Husbanken har mottatt din søknad'}</h1>
    ${signering ? eCallout('positiv', '<p>Personene som skal signere vil motta en e-post med nødvendig informasjon om hvordan dette gjøres.</p><p>Så snart alle har signert vil søknaden automatisk oversendes Husbanken for behandling.</p>')
    : eCallout('positiv', `<p>Referansenummer<br><span class="e-stor">${pf.id}</span></p>
        <p>Søknad sendt inn<br><span class="e-stor">${eDato(new Date(pf.mottattDato || Date.now()))}</span></p>
        <p>Forventet saksbehandlingstid<br><span class="e-stor">3 uker</span></p>
        <p>Vi bekrefter å ha mottatt din søknad om finansiering av <b>${eEsc(pf.navn)}</b>.</p>
        <p>Dere vil få tilbakemelding når søknaden er behandlet. Hvis det er feil eller mangler i søknaden vil den ikke kunne behandles. Husbanken vil da ta kontakt for å avklare disse.</p>`)}
    <p><a class="e-knapp" href="index.html">${E_IKON.pilVenstre}Tilbake til hovedsiden</a></p>`;
  eFokuserH1();
}

/* ═══ Endre låntaker ══════════════════════════════════════════════ */

function endreLantaker() {
  eMonter();
  const t = eTilstand();
  S.t = t;
  const pf = S.finn(t, sideParam('id'));
  if (!pf) { location.href = 'index.html'; return; }
  const d = {};
  F.pf = d;
  F.side = {
    tegn: () => `
      <h1 class="e-h1 e-h1--senter">Endre låntaker</h1>
      ${eKort({ tittel: 'Nåværende låntaker', kropp: `<dl class="e-dl"><dt>Foretaksnavn</dt><dd>${eEsc(pf.lantaker ? pf.lantaker.orgNavn : 'Ikke definert')}</dd>
        <dt>Organisasjonsnummer</dt><dd>${pf.lantaker ? eOrgnr(pf.lantaker.orgNr) : ''}</dd></dl>` })}
      ${eKort({ tittel: 'Ny låntaker', kropp: `
        ${F.velg({ felt: 'lantaker', label: 'Velg virksomhet', plassholder: '--- Virksomhet ---', valg: eRepresenterbare().map(f => ({ v: f.orgnr, l: `${eEsc(f.navn)} ${f.orgnr}` })) })}
        ${eCallout('info', `<p>Dersom ønsket låntaker ikke er i listen må du tildeles rettigheter til tjenesten <b>Lån- og tilskuddstjenester i Husbanken</b>. Dette må du gjøre i Altinn.</p><p>${ALTINN_LENKE}</p>`)}` })}
      ${F.sammendrag()}
      <div class="e-knappegruppe">
        <button type="button" class="e-knapp" id="sendInn" data-handling="send">Send inn endring</button>
        <a class="e-knapp" href="index.html">Gå tilbake</a>
      </div>`,
    valider: () => [
      !d.lantaker ? { nokkel: 'lantaker', melding: 'Du må velge låntaker' }
        : pf.lantaker && d.lantaker === pf.lantaker.orgNr ? { nokkel: 'lantaker', melding: 'Kan ikke være samme verdi som før' } : lantakerFeil(d.lantaker)
    ].filter(Boolean),
    handlinger: {
      send: () => {
        F.visFeil = true;
        if (F.oppdaterFeil().length) return true;
        const f = eForetak(d.lantaker);
        const lagret = S.finn(t, pf.id);
        lagret.lantaker = { orgNr: f.orgnr, orgNavn: f.navn, kundeType: f.kundeType };
        t.varsler = [...(t.varsler || []), { tone: 'positiv', html: `<p>Låntaker var endret på søknad <b>${eEsc(pf.navn)}</b> til <b>${eEsc(f.navn)}</b></p>` }];
        eSkriv(t);
        location.href = 'index.html';
        return false;
      }
    }
  };
  F.koble(document.getElementById('side'));
  F.tegn();
}

/* ═══ Melding om igangsettelse ════════════════════════════════════ */

function igangsettelse() {
  eMonter();
  const t = eTilstand();
  const pf = S.finn(t, sideParam('id'));
  if (!pf) { location.href = 'index.html'; return; }
  const d = {};
  F.pf = d;
  F.side = {
    tegn: () => `
      <h3 class="e-h3 e-senter" style="text-align:center">${eEsc(pf.navn)}</h3>
      <h1 class="e-h1 e-h1--senter">Melding om igangsettelse</h1>
      <p>Ved å sende inn denne meldingen bekrefter du at byggingen av prosjektet er igangsatt.<br>Vi vil automatisk innhente byggestatus fra kommunen</p>
      ${F.tekstomrade({ felt: 'kommentar', label: 'Eventuell kommentar til saksbehandler' })}
      ${F.sammendrag()}
      <div class="e-knappegruppe">
        <button type="button" class="e-knapp" data-handling="send">Send inn endring</button>
        <a class="e-knapp" href="index.html">Gå tilbake</a>
      </div>`,
    valider: () => [V.tom(d.kommentar) && { nokkel: 'kommentar', melding: 'Du må legge inn en kommentar til saksbehandler' }].filter(Boolean),
    handlinger: {
      send: () => {
        F.visFeil = true;
        if (F.oppdaterFeil().length) return true;
        S.finn(t, pf.id).igangsatt = true;
        t.varsler = [...(t.varsler || []), { tone: 'positiv', html: `<p>Melding om igangsetting for <b>${eEsc(pf.navn)}</b> er sendt inn.</p>` }];
        eSkriv(t);
        location.href = 'index.html';
        return false;
      }
    }
  };
  F.koble(document.getElementById('side'));
  F.tegn();
}

/* ═══ Utsette oppstart ════════════════════════════════════════════ */

function utsettOppstart() {
  eMonter();
  const t = eTilstand();
  const pf = S.finn(t, sideParam('id'));
  if (!pf) { location.href = 'index.html'; return; }
  const idag = new Date().toISOString().slice(0, 10);
  const d = {};
  F.pf = d;
  const dato = (felt, label) => {
    const id = F.id(felt);
    return `<div class="e-felt${F.harFeil(felt) ? ' e-felt--feil' : ''}" data-feltboks="${felt}">
      <label class="e-felt__label" for="${id}">${label}</label>
      <input class="e-input e-input--s" type="date" id="${id}" min="${idag}" data-felt="${felt}" data-type="tekst" value="${eEsc(d[felt] || '')}">
      ${F.feilHtml(felt)}</div>`;
  };
  F.side = {
    tegn: () => `
      <h3 class="e-h3" style="text-align:center">${eEsc(pf.navn)}</h3>
      <h3 class="e-h1 e-h1--senter">Utsette oppstart</h3>
      ${pf.hilsStatus === 'INNVILGET' ? eCallout('info', `<p>${eEsc(pf.navn)}  har allerede fått tilsagn. En søknad om utsettelse av oppstart innebærer at saken må vurderes på nytt og sakens utfall kan da endres.</p>`) : ''}
      ${eKort({ tittel: 'Nåværende datoer', kropp: `<dl class="e-dl"><dt>Planlagt oppstart</dt><dd>01.${pf.oppstart || ''}</dd><dt>Planlagt ferdigstilt</dt><dd>${pf.ferdig ? `28.${pf.ferdig}` : ''}</dd></dl>` })}
      ${eKort({ tittel: 'Nye datoer', kropp: `${dato('start', 'Når planlegger dere å starte arbeidet?')}${dato('slutt', 'Når antas arbeidet å være sluttført?')}` })}
      ${F.tekstomrade({ felt: 'begrunnelse', label: 'Begrunnelse for utsettelse' })}
      ${F.sammendrag()}
      <div class="e-knappegruppe">
        <button type="button" class="e-knapp" data-handling="send">Send inn endring</button>
        <a class="e-knapp" href="index.html">Gå tilbake</a>
      </div>`,
    valider: () => [
      !d.start ? { nokkel: 'start', melding: 'Du må fylle ut planlagt oppstart.' } : d.start < idag && { nokkel: 'start', melding: 'Oppstartsdato kan ikke være tilbake i tid.' },
      !d.slutt ? { nokkel: 'slutt', melding: 'Du må fylle ut planlagt ferdigstilt.' } : d.start && d.slutt <= d.start && { nokkel: 'slutt', melding: 'Dato for fullført prosjekt kan ikke være tidligere enn oppstart.' },
      V.tom(d.begrunnelse) && { nokkel: 'begrunnelse', melding: 'Du må fylle ut begrunnelse for utsettelse.' }
    ].filter(Boolean),
    handlinger: {
      send: () => {
        F.visFeil = true;
        if (F.oppdaterFeil().length) return true;
        t.varsler = [...(t.varsler || []), { tone: 'positiv', html: `<p>Melding om utsettelse av oppstart for <b>${eEsc(pf.navn)}</b> er sendt inn.</p>` }];
        eSkriv(t);
        location.href = 'index.html';
        return false;
      }
    }
  };
  F.koble(document.getElementById('side'));
  F.tegn();
}
