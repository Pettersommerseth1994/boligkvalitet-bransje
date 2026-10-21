/* ──────────────────────────────────────────────────────────────────
   Steg 4: Økonomi (okonomi)
   ────────────────────────────────────────────────────────────────── */

const OK = {
  utenSum: pf => !(S.er(pf, 'OPPFORING', 'KJOP') || (S.er(pf, 'OMBYGGING', 'OPPGRADERING') && pf.kjop === true)),
  tu: pf => S.produkt(pf, 'TILSKUDDUTLEIE'),
  rader: pf => {
    const tu = OK.tu(pf);
    const p = x => S.produkt(pf, x);
    return [
      { felt: 'kjopesum', l: 'Kjøpesum', navn: 'kjøpesum', tegn: p('KJOP') && (p('OPPGRADERING') || p('OMBYGGING')) ? '+' : '', paakrevd: true,
        vis: S.er(pf, 'KJOP') || (pf.kjop === true && S.er(pf, 'OMBYGGING', 'OPPGRADERING')) },
      { felt: 'omkostninger', l: 'Omkostninger', navn: 'omkostninger', tegn: '+', paakrevd: true, hjelp: 'Du må dokumentere kjøpesum og omkostninger med signert kjøpekontrakt.',
        vis: p('KJOP') || (tu && (S.er(pf, 'KJOP') || (S.er(pf, 'OMBYGGING') && pf.kjop === true))) },
      { felt: 'oppgraderingsKostnad', l: 'Oppgraderingskostnader', navn: 'oppgraderingskostnader', tegn: '', paakrevd: true, hjelp: 'Du må dokumentere kostnader med signert pristilbud/anbud.', vis: p('OPPGRADERING') },
      { felt: 'ombyggingsKostnad', l: 'Ombyggingskostnader', navn: 'ombyggingskostnader', tegn: '', paakrevd: true, hjelp: 'Du må dokumentere kostnader med signert pristilbud/anbud.', vis: p('OMBYGGING') || (tu && S.er(pf, 'OMBYGGING')) },
      { felt: 'byggekostnader', l: 'Byggekostnader', navn: 'byggekostnader', tegn: '', paakrevd: true, hjelp: 'Alle kostnader i prosjektet inkludert byggelånsrente som ikke knyttes til kjøp og klargjøring av tomt.', vis: p('OPPFORING') || (tu && S.er(pf, 'OPPFORING')) },
      { felt: 'tomtekostnader', l: 'Tomtekostnader', navn: 'tomtekostnader', tegn: '+', paakrevd: true, hjelp: 'Alle kostnader knyttet til kjøp og klargjøring av tomt inn til byggegrube.', vis: p('OPPFORING') || (tu && S.er(pf, 'OPPFORING')) },
      { felt: 'utbedringskostnader', l: 'Utbedringskostnader', navn: 'utbedringskostnader', tegn: '+', paakrevd: false, vis: S.er(pf, 'KJOP') && tu }
    ];
  },
  maksLan: pf => (S.utleie(pf) ? 50 : 30),
  produktNavn: pf => (S.produkt(pf, 'OMBYGGING') ? 'ombygging' : 'oppføring'),
  infotekster: pf => {
    const oo = S.produkt(pf, 'OPPFORING') || S.produkt(pf, 'OMBYGGING');
    const avtale = S.harAvtale(pf);
    const pr = OK.produktNavn(pf);
    return [
      oo && S.salg(pf) && `Ved ${pr} av boliger for salg kan lånet utgjøre inntil 90 % av den salgspris Husbanken godkjenner. Husbanken kan redusere låneutmålingen dersom den endelige salgsprisen blir lavere.`,
      oo && S.utleie(pf) && pf.kommuneavtaleTypeKode === 'INGENAVTALE' && `Ved ${pr} av utleieboliger uten tildelingsrett eller tilvisingsavtale med kommunen kan lånet utgjøre inntil 85 % av de prosjektkostnader Husbanken godkjenner.`,
      oo && S.utleie(pf) && avtale && `Ved ${pr} av utleieboliger for stiftelser opprettet av kommunen eller aksjeselskap opprettet av kommunen kan samlet finansiering med lån og tilskudd utgjøre inntil 85% av de prosjektkostnadene Husbanken godkjenner.`,
      S.produkt(pf, 'KJOP') && S.utleie(pf) && avtale && 'Ved kjøp av utleieboliger for stiftelser opprettet av kommunen eller aksjeselskap opprettet av kommunen kan samlet finansiering med lån og tilskudd utgjøre inntil 85% av de prosjektkostnadene Husbanken godkjenner.',
      S.produkt(pf, 'OPPGRADERING') && 'Ved oppgradering kan lånet utgjøre inntil 100 % av de prosjektkostnadene Husbanken godkjenner inntil 90% av antatt eiendomsverdi.'
    ].filter(Boolean);
  },
  differanseSalg: pf => S.sumProsjektkostnader(pf) - S.sumSalgspris(pf),
  differanse: pf => S.sumFinansiering(pf) - S.sumProsjektkostnader(pf)
};

/* Én rad i regnestykket */
function regnRad({ tekst, tegn = '', verdi, sum = false, hjelpNokkel, hjelp, feilNokkel }) {
  return `<div class="e-regn__rad${sum ? ' e-regn__rad--sum' : ''}"${feilNokkel ? ` data-feltboks="${feilNokkel}"` : ''}>
    <div class="e-regn__tekst">${tekst}${hjelp ? F.hjelpKnapp(hjelpNokkel) : ''}</div>
    <div class="e-regn__tegn" aria-hidden="true">${tegn}</div>
    <div class="e-regn__verdi">${verdi}</div>
    ${hjelp ? `<div class="e-regn__feil">${F.hjelpTekst(hjelpNokkel, hjelp)}</div>` : ''}
    ${feilNokkel && F.harFeil(feilNokkel) ? `<div class="e-regn__feil">${F.feilHtml(feilNokkel)}</div>` : ''}
  </div>`;
}
const regnInput = (felt, l) => `<div class="e-belop">${F.belopInput({ felt, label: l, bredde: 'l' }).replace('data-type="belop"', 'data-type="belop" data-levende')}</div>`;
const regnTall = (n, farge = '') => `<span class="e-regn__verdi--tall ${farge}" style="display:inline-block">${eKr(n)}</span>`;
const regnFelt = (pf, r) => regnRad({ tekst: `<label for="${F.id(`okonomi.${r.felt}`)}">${r.l}</label>`, tegn: r.tegn, verdi: regnInput(`okonomi.${r.felt}`, r.l),
  hjelp: r.hjelp, hjelpNokkel: `hj-${r.felt}`, feilNokkel: `okonomi.${r.felt}` });

STEG.okonomi = {
  tegn: pf => {
    const o = S.okonomi(pf);
    const rader = OK.rader(pf).filter(r => r.vis);
    const salg = S.salg(pf);
    const sumK = S.sumProsjektkostnader(pf);
    const dSalg = OK.differanseSalg(pf);
    const dFin = OK.differanse(pf);
    const info = OK.infotekster(pf);

    const kostnader = OK.utenSum(pf) ? `
      <h2 class="e-h2">Spesifiser kostnadene i prosjektet</h2>
      ${rader.map(r => F.belop({ felt: `okonomi.${r.felt}`, label: r.l, hjelp: r.hjelp })).join('')}
      ${!salg ? `${F.belop({ felt: 'okonomi.omsetningsverdi', label: 'Prosjektets omsetningsverdi' })}${F.belop({ felt: 'okonomi.gjeld', label: 'Sum gjeld før innsendt søknad' })}`
    : F.les('Sum salgspris for boligene i prosjektet', eKr(S.sumSalgspris(pf)))}` : `
      <h2 class="e-h2">Spesifiser kostnadene i prosjektet</h2>
      <div class="e-regn">
        ${rader.map(r => regnFelt(pf, r)).join('')}
        ${regnRad({ tekst: 'Sum prosjektkostnader', tegn: '=', verdi: regnTall(sumK), sum: true })}
        ${salg ? regnRad({ tekst: 'Sum salgspris for boligene i prosjektet', tegn: '-', verdi: regnTall(S.sumSalgspris(pf)) }) : ''}
        ${salg && S.produkt(pf, 'OPPFORING') ? regnRad({ tekst: 'Differanse mellom prosjektkostnader og salgspris', tegn: '=', sum: true, feilNokkel: 'differanseSalg',
          verdi: regnTall(dSalg, dSalg === 0 ? 'e-regn__verdi--positiv' : 'e-regn__verdi--negativ') }) : ''}
        ${!salg ? `${regnFelt(pf, { felt: 'gjeld', l: 'Sum gjeld før innsendt søknad', tegn: '' })}${regnFelt(pf, { felt: 'omsetningsverdi', l: 'Prosjektets omsetningsverdi', tegn: '' })}` : ''}
      </div>`;

    return `
      ${kostnader}
      ${OK.tu(pf) ? `<h2 class="e-h2 e-mt">Tilskuddsutmåling</h2>
        <div class="e-felt"><div class="e-felt__labelrad"><span class="e-felt__label">Ditt tilskudd</span>${F.hjelpKnapp('tilskudd')}</div>
          ${F.hjelpTekst('tilskudd', 'Husbanken regner ut tilskudd til utleieboliger etter faste satser per kvadratmeter med en maksimalgrense satt etter en geografisk inndeling. <a href="https://husbanken.no/" target="_blank" rel="noopener">Mer informasjon om tilskudd ligger på våre nettsider. (åpner i ny fane)</a>')}
          <p class="e-fet">${eKr(S.tilskuddUtleie(pf))}</p>
          <p class="e-liten e-sekundaer">Prototype: regnet ut med 4 000 kr per m² primærareal, høyst 250 000 kr per boenhet.</p></div>` : ''}

      <h2 class="e-h2 e-mt">Finansieringsplan</h2>
      ${info.length ? eCallout('info', info.map(t => `<p>${t}</p>`).join('')) : ''}
      <div class="e-regn">
        ${S.lanProdukt(pf) ? regnFelt(pf, { felt: 'grunnlan', l: 'Lån fra Husbanken', tegn: '' }) : ''}
        ${!salg ? regnFelt(pf, { felt: 'andrelan', l: 'Andre lån', tegn: '+' }) : ''}
        ${!salg ? regnFelt(pf, { felt: 'egenkapital', l: 'Egenkapital', tegn: '+', hjelp: 'Egenkapital dokumenteres i eget vedlegg.' }) : ''}
        ${salg ? regnFelt(pf, { felt: 'egenfinansiering', l: 'Egenfinansiering', tegn: '+' }) : ''}
        ${OK.tu(pf) ? regnRad({ tekst: 'Tilskudd fra Husbanken', tegn: '+', verdi: regnTall(S.tilskuddUtleie(pf)) }) : ''}
        ${!salg ? regnFelt(pf, { felt: 'andreTilskudd', l: 'Andre tilskudd', tegn: '+' }) : ''}
        ${regnRad({ tekst: 'Sum Finansieringsplan', tegn: '=', sum: true, verdi: regnTall(S.sumFinansiering(pf)) })}
        ${regnRad({ tekst: 'Prosjektkostnader', tegn: '-', verdi: regnTall(sumK) })}
        ${regnRad({ tekst: 'Differanse', tegn: '=', sum: true, feilNokkel: 'differanse', verdi: regnTall(dFin, dFin === 0 ? 'e-regn__verdi--positiv' : 'e-regn__verdi--negativ') })}
      </div>

      ${S.lanProdukt(pf) && !salg ? `
        <h2 class="e-h2 e-mt">Nedbetalingsvilkår</h2>
        ${F.radio({ felt: 'okonomi.lanType', label: 'Type lån', valg: [{ v: 'ANNUITETSLAN', l: 'Annuitetslån' }, { v: 'SERIELAN', l: 'Serielån' }] })}
        <div class="e-felt${F.harFeil('okonomi.avdragsfriPeriode') ? ' e-felt--feil' : ''}" data-feltboks="okonomi.avdragsfriPeriode">
          <label class="e-felt__label" for="${F.id('okonomi.avdragsfriPeriode')}">Avdragsfri periode (maks 8 år)</label>
          <div class="e-enhet"><input class="e-input e-input--xs" id="${F.id('okonomi.avdragsfriPeriode')}" inputmode="numeric" data-felt="okonomi.avdragsfriPeriode" data-type="tekst" value="${eEsc(o.avdragsfriPeriode ?? '')}"><span class="e-enhet__tekst">år</span></div>
          ${F.feilHtml('okonomi.avdragsfriPeriode')}</div>
        <div class="e-felt${F.harFeil('okonomi.nedbetalingsPeriode') ? ' e-felt--feil' : ''}" data-feltboks="okonomi.nedbetalingsPeriode">
          <label class="e-felt__label" for="${F.id('okonomi.nedbetalingsPeriode')}">Nedbetalingsperiode (maks ${OK.maksLan(pf)} år)</label>
          <div class="e-enhet"><input class="e-input e-input--xs" id="${F.id('okonomi.nedbetalingsPeriode')}" inputmode="numeric" data-felt="okonomi.nedbetalingsPeriode" data-type="tekst" value="${eEsc(o.nedbetalingsPeriode ?? '')}"><span class="e-enhet__tekst">år</span></div>
          ${F.feilHtml('okonomi.nedbetalingsPeriode')}</div>` : ''}

      ${F.sammendrag()}
      ${W.knapper()}`;
  },

  valider: pf => {
    const o = S.okonomi(pf);
    const f = [];
    const feil = (nokkel, melding) => f.push({ nokkel, melding });
    const belop = (felt, navn, paakrevd) => {
      if (V.tom(o[felt])) { if (paakrevd) feil(`okonomi.${felt}`, `Du må skrive ${navn}.`); return; }
      if (eNum(o[felt]) > 9000000000) feil(`okonomi.${felt}`, `${eStor(navn)} kan ikke være større enn 9000000000.`);
    };
    OK.rader(pf).filter(r => r.vis).forEach(r => belop(r.felt, r.navn, r.paakrevd));
    if (!S.salg(pf)) { belop('gjeld', 'sum gjeld før innsendt søknad', false); belop('omsetningsverdi', 'prosjektets omsetningsverdi', true); }
    if (!OK.utenSum(pf) && S.salg(pf) && S.produkt(pf, 'OPPFORING') && OK.differanseSalg(pf) !== 0) feil('differanseSalg', 'Differanse må være 0.');
    if (S.lanProdukt(pf)) belop('grunnlan', 'lån', true);
    ['andrelan', 'egenkapital', 'andreTilskudd', 'egenfinansiering'].forEach(k => belop(k, k, false));
    if (OK.differanse(pf) !== 0) feil('differanse', 'Differanse må være 0.');
    if (S.lanProdukt(pf) && !S.salg(pf)) {
      if (!o.lanType) feil('okonomi.lanType', 'Du må krysse av for ønsket låneform.');
      const periode = (felt, navn, maks, tekst) => {
        if (V.tom(o[felt])) return feil(`okonomi.${felt}`, `Du må skrive ${navn}.`);
        if (!V.heltall(o[felt])) return feil(`okonomi.${felt}`, 'Du kan kun angi hele tall.');
        if (eNum(o[felt]) > maks) return feil(`okonomi.${felt}`, tekst);
        return null;
      };
      periode('avdragsfriPeriode', 'avdragsfri periode', 8, 'Maks periode for avdragsfrihet er 8 år.');
      periode('nedbetalingsPeriode', 'nedbetalingsperiode', OK.maksLan(pf), `Maks periode for nedbetaling er ${OK.maksLan(pf)} år.`);
    }
    return f;
  }
};
