/* ──────────────────────────────────────────────────────────────────
   Sidene for klimavennlig bolig etter at søknaden er innvilget:
   søknad om utbetaling med klimagassregnskap, og saksbehandlers visning
   av klimatallene og boenhetene, med eksport til Elements.

   Bruker kvBeregn, KV_DEL og fmtGrense fra steg-bolig.js.
   ────────────────────────────────────────────────────────────────── */

const pst = (del, total) => (total ? `${Math.round((del / total) * 100)} %` : '');

/* Delene fra søknaden: bygningstype, del, BTA, andel og antatt utslipp */
function klimaTabell(pf, { grenser = true } = {}) {
  const r = kvBeregn(pf);
  if (!r.rader.length) return '<p class="e-sekundaer">Søknaden har ingen klimatall.</p>';
  const status = ok => (ok == null ? '' : ok ? '<span class="kv-ok">✓ Innenfor</span>' : '<span class="kv-over">✗ Over grensen</span>');
  const linje = (navn, g) => (g ? `<tr class="e-tabell__sum"><td>${navn}${g.vektet ? ', vektet' : ''}</td><td class="e-tall">${eTusen(g.bta)}</td><td class="e-tall">${pst(g.bta, r.totalBta)}</td>
    <td class="e-tall">${g.utslipp == null ? '' : fmtGrense(g.utslipp)}</td>${grenser ? `<td class="e-tall">${fmtGrense(g.grense)}</td><td class="e-tall">${status(g.ok)}</td>` : ''}</tr>` : '');
  return `<div class="e-tabell-rulle"><table class="e-tabell">
    <thead><tr><th>Del</th><th class="e-tall">m² BTA</th><th class="e-tall">Andel</th><th class="e-tall">Antatt utslipp</th>${grenser ? '<th class="e-tall">Grenseverdi</th><th class="e-tall">Status</th>' : ''}</tr></thead>
    <tbody>${r.rader.map(d => `<tr><td>${d.t.tittel}, ${KV_DEL[d.del]}</td><td class="e-tall">${eTusen(d.bta)}</td><td class="e-tall">${pst(eNum(d.bta), r.totalBta)}</td>
      <td class="e-tall">${kvTall(d.co2) ? eEsc(d.co2) : ''}</td>${grenser ? `<td class="e-tall">${d.grense}</td><td class="e-tall">${status(d.over == null ? null : !d.over)}</td>` : ''}</tr>`).join('')}
      ${linje('Bygg uten kjeller', r.bygg)}${linje('Kjeller', r.kjeller)}</tbody>
  </table></div>
  <p class="e-liten e-sekundaer">Totalt BTA: ${eTusen(r.totalBta)} m². ${grenser ? 'Utslipp og grenseverdier' : 'Utslipp'} er i ${CO2_ENHET}.</p>`;
}

/* ═══ Søknad om utbetaling ════════════════════════════════════════ */

function utbetaling() {
  eMonter();
  const t = eTilstand();
  S.t = t;
  const pf = S.finn(t, sideParam('id'));
  if (!pf || !S.erKlimavennlig(pf)) { location.href = 'index.html'; return; }
  const d = { vedlegg: [] };
  F.pf = d;
  F.side = {
    vedFil: input => {
      [...input.files].forEach(f => d.vedlegg.push({ id: S.nyId(), tittel: f.name, storrelse: f.size }));
      F.tegn();
    },
    tegn: () => `
      <h3 class="e-h3" style="text-align:center">${eEsc(pf.navn)}</h3>
      <h1 class="e-h1 e-h1--senter">Søknad om utbetaling</h1>
      <div>
      ${eCallout('noytral', `<p>For å få lånet til klimavennlig bolig utbetalt må dere sende inn et ferdig klimagassregnskap. Regnskapet skal lages etter byggteknisk forskrift § 17-1, med metoden i NS 3720:2018.</p>
        <p class="e-mb0">Regnskapet bekrefter at klimagassutslippene er de samme som dere oppga i klimagassbudsjettet da dere søkte.</p>`)}
      ${eKort({ tittel: 'Dette oppga dere i søknaden', kropp: klimaTabell(pf, { grenser: false }) })}
      <div class="e-vedlegg${F.harFeil('regnskap') ? ' e-felt--feil' : ''}" data-feltboks="regnskap">
        <div class="e-vedlegg__topp">
          <div><h3>Klimagassregnskap</h3><div class="e-liten e-sekundaer"><p class="e-mb0">Ferdig klimagassregnskap etter NS 3720:2018.</p></div></div>
          <div><label class="e-knapp e-knapp--liten" for="${F.id('regnskap')}">${E_IKON.opplasting}Last opp</label>
            <input type="file" id="${F.id('regnskap')}" multiple aria-label="Last opp klimagassregnskap"></div>
        </div>
        ${d.vedlegg.length ? `<ul class="e-filer">${d.vedlegg.map(v => `<li class="e-fil"><span class="e-fil__navn">${E_IKON.fil}${eEsc(v.tittel)}</span></li>`).join('')}</ul>` : ''}
        ${F.feilHtml('regnskap')}
      </div>
      ${F.janei({ felt: 'sammeUtslipp', label: 'Viser klimagassregnskapet samme eller lavere utslipp enn dere oppga i søknaden?',
        etter: d.sammeUtslipp === false ? eCallout('advarsel', '<p>Saksbehandler vurderer om prosjektet fortsatt oppfyller kravene til klimavennlig bolig. Forklar avviket under.</p>') : '' })}
      ${d.sammeUtslipp === false ? F.tekstomrade({ felt: 'avvik', label: 'Hva er avviket, og hvorfor?' }) : ''}
      </div>
      ${F.tekstomrade({ felt: 'kommentar', label: 'Eventuell kommentar til saksbehandler' })}
      ${F.sammendrag()}
      <div class="e-knappegruppe">
        <button type="button" class="e-knapp" data-handling="send">Send søknad om utbetaling</button>
        <a class="e-knapp" href="index.html">Gå tilbake</a>
      </div>`,
    valider: () => [
      !d.vedlegg.length && { nokkel: 'regnskap', melding: 'Du må laste opp klimagassregnskapet.' },
      d.sammeUtslipp == null && { nokkel: 'sammeUtslipp', melding: 'Du må svare på om klimagassregnskapet viser samme eller lavere utslipp.' },
      d.sammeUtslipp === false && V.tom(d.avvik) && { nokkel: 'avvik', melding: 'Du må forklare avviket.' }
    ].filter(Boolean),
    handlinger: {
      send: () => {
        F.visFeil = true;
        if (F.oppdaterFeil().length) return true;
        S.finn(t, pf.id).utbetalingSokt = true;
        t.varsler = [...(t.varsler || []), { tone: 'positiv', html: `<p>Søknad om utbetaling for <b>${eEsc(pf.navn)}</b> er sendt inn, med klimagassregnskapet.</p>` }];
        eSkriv(t);
        location.href = 'index.html';
        return false;
      }
    }
  };
  F.koble(document.getElementById('side'));
  F.tegn();
}

/* ═══ Saksbehandlers visning ══════════════════════════════════════ */

/* Én rad per boenhet, med bygningstypen og arealgrensen etter de nye
   reglene. Det samme ligger i fila til Elements. */
function boenhetsrader(pf) {
  return S.alleValgteAdresser(pf).flatMap(({ b, a }) => S.boenheter(pf, a.id).filter(fo => fo.enabled !== false).map(fo => {
    const type = S.hbType(pf, b);
    const grense = S.maksAreal(type, fo.bruksenhetsNr);
    return {
      bygg: S.byggNavn(b), adresse: `${a.veiNavn} ${a.veiNummer}${a.veiBokstav || ''}`, bolig: `${fo.etasje}${fo.bruksenhetsNr}`,
      type: E_BYGNINGSTYPE_NAVN[type] || type, areal: fo.bruksAreal || '', grense: grense || '',
      medIUtmaling: !S.utmalingsvarsel(pf, b, a, fo)
    };
  }));
}

function saksbehandler() {
  eMonter();
  const t = eTilstand();
  S.t = t;
  const pf = S.finn(t, sideParam('id'));
  if (!pf) { location.href = 'index.html'; return; }
  const rader = boenhetsrader(pf);
  const med = rader.filter(x => x.medIUtmaling).length;
  document.getElementById('side').innerHTML = `
    <h3 class="e-h3" style="text-align:center">${eEsc(pf.navn)} · ${eEsc(pf.saksreferanse || pf.id)}</h3>
    <h1 class="e-h1 e-h1--senter">Saksbehandlers visning</h1>
    ${eCallout('info', '<p>Prototype av hva saksbehandler ser av klimatallene og boenhetene. Den ekte visningen ligger i saksbehandlingsløsningen.</p>')}
    ${S.erKlimavennlig(pf) ? `<div>${eKort({ tittel: 'Klimagassavtrykk', kropp: `
      <dl class="e-dl"><dt>Formål</dt><dd>${S.LANEFORMAL[pf.laneformal]}</dd>
        <dt>Klimagassbudsjett etter NS 3720:2018</dt><dd>${(pf.klima || {}).harKlimabudsjett ? 'Ja, lastet opp' : 'Nei'}</dd>
        <dt>Klimagassregnskap</dt><dd>${pf.utbetalingSokt ? 'Sendt inn med søknad om utbetaling' : 'Kommer ved søknad om utbetaling'}</dd></dl>
      ${klimaTabell(pf)}` })}</div>` : ''}
    <div>${eKort({ tittel: 'Boenheter', kropp: rader.length ? `
      <div class="e-tabell-rulle"><table class="e-tabell">
        <thead><tr><th>Adresse</th><th>Bolig</th><th>Bygningstype</th><th class="e-tall">Bruksareal</th><th class="e-tall">Arealgrense</th><th>Med i låneutmåling</th></tr></thead>
        <tbody>${rader.map(x => `<tr><td>${eEsc(x.adresse)}</td><td>${eEsc(x.bolig)}</td><td>${eEsc(x.type)}</td><td class="e-tall">${eEsc(x.areal)}</td><td class="e-tall">${x.grense}</td><td>${x.medIUtmaling ? 'Ja' : 'Nei'}</td></tr>`).join('')}</tbody>
      </table></div>
      <p>Med i låneutmåling: ${med} av ${rader.length} boenheter.</p>
      <button type="button" class="e-knapp" id="last-ned">${E_IKON.opplasting}Last ned fil til Elements (CSV)</button>`
    : '<p class="e-sekundaer e-mb0">Søknaden har ingen boenheter.</p>' })}</div>
    <div class="e-knappegruppe"><a class="e-knapp" href="index.html">Gå tilbake</a></div>`;

  const knapp = document.getElementById('last-ned');
  if (knapp) knapp.addEventListener('click', () => {
    const felt = v => `"${String(v).replace(/"/g, '""')}"`;
    const linjer = [['Bygg', 'Adresse', 'Bolig', 'Bygningstype', 'Bruksareal', 'Arealgrense', 'Med i låneutmåling'],
      ...rader.map(x => [x.bygg, x.adresse, x.bolig, x.type, x.areal, x.grense, x.medIUtmaling ? 'Ja' : 'Nei'])];
    const blob = new Blob([`﻿${linjer.map(l => l.map(felt).join(';')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `boenheter-${pf.saksreferanse || pf.id}.csv`.replace(/\//g, '-');
    a.click();
    URL.revokeObjectURL(a.href);
  });
}
