/* ──────────────────────────────────────────────────────────────────
   Steg 7: Oppsummering, signering og innsending
   ────────────────────────────────────────────────────────────────── */

/* Oppdiktede personer med signaturrett, som om de var hentet fra
   Enhetsregisteret for foretaket som skal signere. */
const UNDERTEGNERE = [
  { navn: 'Kari Nordmann', roller: ['Daglig leder'], adresse: 'Dugnadsgata 3' },
  { navn: 'Per Hansen', roller: ['Styrets leder'], adresse: 'Lindeveien 14' },
  { navn: 'Liv Berg', roller: ['Styremedlem'], adresse: 'Solbergveien 2B' }
];
const SIGNATURBESTEMMELSE = 'Daglig leder alene, eller styrets leder og ett styremedlem i fellesskap.';
const signeringGyldigKombinasjon = valgte => valgte.some(u => u.roller.includes('Daglig leder'))
  || (valgte.some(u => u.roller.includes('Styrets leder')) && valgte.some(u => u.roller.includes('Styremedlem')));

const OP = {
  jaNei: v => (v === true ? 'Ja' : v === false ? 'Nei' : null),
  rad: (l, v) => (v == null || v === '' ? '' : `<dt>${l}</dt><dd>${v}</dd>`),
  valgte: pf => UNDERTEGNERE.map((u, i) => ({ ...u, i, ...((pf.signering || {})[`p${i}`] || {}) })).filter(u => u.valgt),
  signeringGyldig: pf => {
    const v = OP.valgte(pf);
    return v.length > 0 && v.every(u => V.epost(u.epost || '') && u.adresseRiktig === true);
  },
  kort: (pf, { tittel, ikon, kropp, steg }) => eKort({ tittel, ikon: ikon ? E_IKON[ikon] : '', kropp, klasse: 'e-oppskort',
    bunn: W.kanEndres() && steg ? `<a class="e-knapp e-knapp--subtil" href="?id=${pf.id}&steg=${steg}" data-steg="${steg}">${E_IKON.blyant}Endre</a>` : '' })
};

STEG.oppsummering = {
  bred: true,

  tegn: pf => {
    const kan = W.kanEndres();
    return `
      ${kan ? `<div class="e-knappegruppe" style="margin-bottom:var(--space-5)">
        <button type="button" class="e-knapp e-knapp--destruktiv" data-handling="slett">${E_IKON.soppel}Slett søknad</button></div>` : ''}
      <div id="oppsummering">
        ${kortFormal(pf)}
        ${kortProsjekt(pf)}
        ${kortEiendom(pf)}
        ${kortBoenheter(pf)}
        ${kortOkonomi(pf)}
        ${kortVedlegg(pf)}
        ${kan ? kortSignering(pf) : ''}
      </div>
      ${kan ? `
        ${F.sjekk({ felt: 'bekreftOpplysninger', label: 'Jeg bekrefter at alle opplysningene jeg har oppgitt i søknaden er korrekte. En kopi av denne søknaden med informasjon om navn på innsender og tidspunkt vil bli sendt til foretakets meldingsboks i Altinn.' })}
        ${!OP.signeringGyldig(pf) ? eCallout('feil', '<p>Du må fullføre Signeringsseksjonen før du kan sende til signering</p>') : ''}
        <div class="e-knapper">
          <div class="e-knapper__nav">
            <button type="button" class="e-knapp" data-nav="forrige">${E_IKON.pilVenstre}Forrige steg</button>
            <button type="button" class="e-knapp e-knapp--prominent" id="sendTilSignering" data-handling="send">Send til signering ${E_IKON.send}</button>
          </div>
          <button type="button" class="e-knapp e-knapp--subtil" data-nav="avslutt">${E_IKON.hus}Lagre og avslutt</button>
        </div>` : ''}`;
  },

  valider: pf => {
    const f = [];
    if (!pf.bekreftOpplysninger) f.push({ nokkel: 'bekreftOpplysninger', melding: 'Du må bekrefte at opplysningene er korrekte.' });
    OP.valgte(pf).forEach(u => {
      if (!V.epost(u.epost || '')) f.push({ nokkel: `signering.p${u.i}.epost`, melding: 'Epost må være gyldig' });
      if (u.adresseRiktig === false) f.push({ nokkel: `signering.p${u.i}.adresseRiktig`, melding: 'Adresse må være riktig. Endres i Folkeregisteret.' });
      if (u.adresseRiktig == null) f.push({ nokkel: `signering.p${u.i}.adresseRiktig`, melding: 'Du må svare på om adressen er riktig.' });
    });
    return f;
  },

  vedEndring: (felt, pf) => { if (felt.startsWith('signering.')) delete pf.feilKombinasjon; },

  handlinger: {
    slett: async (d, pf) => {
      const navn = eEsc(S.navn(pf));
      const ok = await eBekreft({ tittel: 'Bekreft sletting', tekst: `Er du sikker på at du vil slette <b>${navn}</b>?`, bekreft: 'Slett', destruktiv: true });
      if (!ok) return false;
      W.t.soknader = W.t.soknader.filter(s => s !== pf);
      W.t.varsler = [...(W.t.varsler || []), { tone: 'feil', html: `<p><b>${navn}</b> er slettet.</p>` }];
      eSkriv(W.t);
      location.href = 'index.html';
      return false;
    },
    send: async (d, pf) => {
      F.visFeil = true;
      W.pf.forsokt = { ...(W.pf.forsokt || {}), oppsummering: true };
      if (!pf.bekreftOpplysninger) { F.tegn(); F.gaaTilFeil('bekreftOpplysninger'); return false; }
      if (!OP.signeringGyldig(pf)) { F.tegn(); document.getElementById('signering')?.scrollIntoView({ behavior: 'smooth' }); return false; }
      if (!signeringGyldigKombinasjon(OP.valgte(pf))) {
        pf.feilKombinasjon = true;
        F.tegn();
        document.getElementById('signering')?.scrollIntoView({ behavior: 'smooth' });
        return false;
      }
      const ferdig = eSpinner('Sender til signering');
      await eVent(1200);
      pf.status = 'TILSIGNERING';
      pf.sendtTilSigneringDato = new Date().toISOString();
      pf.undertegnere = OP.valgte(pf).map(u => ({ navn: u.navn, roller: u.roller, epost: u.epost }));
      pf.trekkbar = false;
      W.lagre();
      ferdig();
      location.href = `kvittering.html?id=${pf.id}`;
      return false;
    }
  }
};

/* ═══ Kortene ═════════════════════════════════════════════════════ */

function kortFormal(pf) {
  const org = E_FORETAK.find(f => f.orgnr === pf.soker.orgNr) || {};
  const k = pf.kontaktinformasjon || {};
  return OP.kort(pf, { tittel: 'Formål', ikon: 'personer', kropp: `
    <dl class="e-dl">${OP.rad('Type prosjekt', S.TILTAK[pf.prosjektTiltakKode].valg)}${OP.rad('Formål', S.LANEFORMAL[pf.laneformal])}</dl>
    <h3 class="e-h3">Prosjekteiers navn og kontaktinfo</h3>
    <dl class="e-dl">${OP.rad('Foretaksnavn', eEsc(pf.soker.orgNavn))}${OP.rad('Org.nr.', eOrgnr(pf.soker.orgNr))}
      ${OP.rad('Kontaktadresse', org.gateadresse ? `${eEsc(org.gateadresse)}, ${org.postnr} ${eEsc(org.poststed)}` : '')}
      ${OP.rad('E-post', eEsc(((org.varsling || []).find(v => v.email) || {}).email || ''))}</dl>
    ${!S.salg(pf) ? `<h3 class="e-h3">Låntakers navn og kontaktinfo</h3>
      <dl class="e-dl">${OP.rad('Foretaksnavn', eEsc(pf.lantaker ? pf.lantaker.orgNavn : 'Ikke definert'))}${OP.rad('Org.nr.', pf.lantaker ? eOrgnr(pf.lantaker.orgNr) : 'Har ikke organisasjonsnummer')}</dl>` : ''}
    <dl class="e-dl">
      ${OP.rad('Kjøpe nye eller brukte boliger', pf.eksisterendeBoligmasse == null ? null : pf.eksisterendeBoligmasse ? 'Brukte boliger' : 'Nye boliger')}
      ${OP.rad('Skal tomten/boligene/bygget kjøpes?', pf.kjop == null ? null : pf.kjop ? 'Kjøpes' : 'Eier fra før')}
      ${OP.rad('Formålet med boligene', { UTLEIE: 'Boliger for utleie', SALG: 'Boliger for salg' }[pf.formalKode])}
      ${OP.rad('Avtale med kommune/helseforetak', { TILVISNING: 'Tilvisningsavtale', TILDELING: 'Tildelingsavtale', INGENAVTALE: 'Ingen avtale' }[pf.kommuneavtaleTypeKode])}
      ${OP.rad('Antall boliger med tilvisningsrett', pf.antallTilvisningsboliger)}
      ${OP.rad('Søker om', `<ul>${(pf.finansieringsProdukter || []).map(p => `<li>${S.PRODUKTNAVN[p]}</li>`).join('')}</ul>`)}
    </dl>
    <h3 class="e-h3">Søknadens kontaktinfo</h3>
    <dl class="e-dl">${OP.rad('Navn', eEsc(k.navn))}${OP.rad('Epost', eEsc(k.epost))}${OP.rad('Telefonnummer', eEsc(k.telefonNr))}</dl>` });
}

function kortProsjekt(pf) {
  const navnListe = liste => `<ul>${(liste || []).map(x => {
    const f = x.orgNr ? eForetak(x.orgNr) : null;
    return `<li>${f ? `${eEsc(f.navn)} (${eOrgnr(f.orgnr)})` : eEsc(x.fulltNavn || x.orgNr || '')}</li>`;
  }).join('')}</ul>`;
  const mg = { FLYKTNINGER: 'Flyktninger', OVRIGEVANSKELIGSTILTE: 'Mennesker i en vanskelig bosituasjon', RUSPSYKISKEPROBLEMER: 'Mennesker med rus- og psykiske lidelser' };
  const k = pf.kontaktpersonSamarbeidspartner;
  const kf = k && k.orgNr ? eForetak(k.orgNr) : null;
  return OP.kort(pf, { tittel: 'Grunnleggende prosjektinformasjon', ikon: 'personer', steg: 'prosjektinformasjon', kropp: `
    <dl class="e-dl">
      ${OP.rad('Prosjektnavn', eEsc(pf.navn))}
      ${OP.rad('Har låntaker sentral godkjenning?', OP.jaNei(pf.sentralGodkjenning))}
      ${OP.rad('Skal arbeid utføres av selskap med relasjon til søker?', OP.jaNei(pf.naerstaendeArbeid))}
      ${pf.naerstaendeArbeid ? OP.rad('Selskaper med relasjoner til søker', navnListe(pf.naerstaendeArbeidUtforesAv)) : ''}
      ${OP.rad('Har selger relasjon til søker?', OP.jaNei(pf.naerstaendeSelger))}
      ${pf.naerstaendeSelger ? OP.rad('Selgere med relasjon til søker', navnListe(pf.naerstaendeSelgere)) : ''}
      ${OP.rad('Eiendommen omsatt i de åpne markedet?', OP.jaNei(pf.omsattApentMarked))}
      ${OP.rad('Tidligere kontakt med Husbanken om prosjektet?', OP.jaNei(pf.forbildeprosjekt))}
      ${pf.forbildeprosjekt ? `${OP.rad('Henvendelsen gjaldt', 'Generell forespørsel om prosjektet')}${OP.rad('Saksreferanse', eEsc((pf.forbildeInfo || {}).saksreferanse))}${OP.rad('Kontaktperson Husbanken', eEsc((pf.forbildeInfo || {}).navn))}` : ''}
      ${OP.rad('Planlagt oppstart', pf.oppstart)}${OP.rad('Planlagt ferdigstilt', pf.ferdig)}
      ${(pf.malgrupper || []).length ? OP.rad('Målgrupper for boligene', `<ul>${pf.malgrupper.map(m => `<li>${mg[m]}</li>`).join('')}</ul>`) : ''}
      ${pf.energikarakterFor && pf.energikarakterEtter ? `${OP.rad('Energikarakter før', pf.energikarakterFor)}${OP.rad('Energikarakter etter', pf.energikarakterEtter)}` : ''}
    </dl>
    ${k && k.navn ? `<h3 class="e-h3">Kontaktperson i kommune eller helseforetak</h3>
      <dl class="e-dl">${OP.rad('Foretaksnavn', eEsc(kf ? kf.navn : ''))}${OP.rad('Organisasjonsnummer', eOrgnr(k.orgNr))}${OP.rad('Navn', eEsc(k.navn))}${OP.rad('Telefon', eEsc(k.telefon))}${OP.rad('E-post', eEsc(k.epost))}</dl>` : ''}` });
}

function kortEiendom(pf) {
  return OP.kort(pf, { tittel: 'Eiendommer og bygg med adresser', ikon: 'hierarki', steg: 'eiendomsopplysninger', kropp: (pf.eiendommer || []).filter(e => e.fraMatrikkelen != null).map(e => `
    <h3 class="e-h3">${eEsc(S.eiendomTittel(e))}</h3>
    ${e.finnerIkkeAdresse ? eCallout('advarsel', '<p>Denne eiendommen har adresser som ikke ble funnet i matrikkelen. Saksbehandler vil bruke vedlagt rammetillatelse som dokumentasjon.</p>') : ''}
    ${e.bygg.filter(S.byggMed).map(b => `
      <h4 class="e-h4">${eEsc(S.byggNavn(b))} - ${E_BYGNINGSTYPE_NAVN[S.hbType(pf, b)]}</h4>
      <table class="e-tabell" style="margin-bottom:var(--space-4)"><thead><tr><th>Adresse</th></tr></thead>
        <tbody>${S.valgteAdresser(b).map(a => `<tr><td>${eEsc(S.adresseTekst(a))}</td></tr>`).join('')}</tbody></table>`).join('')}`).join('') || '<p>Ingen eiendommer er lagt til.</p>' });
}

function kortBoenheter(pf) {
  const a = S.oppfOmb(pf);
  const liv = S.visBK(pf) && pf.livslopsboliger && a;
  const livBk = B.livslopBk(pf);
  const prim = S.visPrimaer(pf);
  const alle = [];
  const tabeller = S.alleValgteBygg(pf).map(({ b }) => {
    const rader = S.valgteAdresser(b).map(adr => {
      const enheter = S.boenheter(pf, adr.id).filter(f => f.enabled).sort((x, y) => (x.etasje + x.bruksenhetsNr).localeCompare(y.etasje + y.bruksenhetsNr));
      alle.push(...enheter.map(fo => ({ fo, b, adr })));
      const bk = fo => (pf.boligkonfigurasjoner || []).find(k => k.id === fo.bkId);
      return `${a ? `<tr><td colspan="12" class="e-fet">${eEsc(S.adresseTekst(adr))}</td></tr>` : ''}
        ${enheter.map(fo => `<tr>
          ${a ? '<td></td>' : `<td>${eEsc(S.adresseTekst(adr))}</td>`}
          <td>${fo.etasje}${fo.bruksenhetsNr}</td>
          ${a ? `<td>${eEsc(fo.boligbetegnelse || '')}</td>` : ''}
          <td class="e-tall">${eEsc(fo.bruksAreal || '')} m²</td>
          ${prim ? `<td class="e-tall">${eEsc(fo.primaerAreal || '')} m²</td>` : ''}
          <td class="e-tall">${eEsc(fo.antallRom || '')} stk</td>
          ${liv ? livBk.map(k => `<td class="e-senter">${k && fo.bkId === k.id ? '✓' : ''}</td>`).join('') : ''}
          ${!a && S.visBK(pf) ? `<td>${eEsc((bk(fo) || {}).navn || '')}</td>` : ''}
          ${S.utleie(pf) ? `<td class="e-tall">${eKr(fo.utleiepris)}</td>` : ''}
          ${S.salg(pf) ? `<td class="e-tall">${eKr(fo.salgspris)}</td>` : ''}
        </tr>`).join('')}`;
    }).join('');
    return `<h3 class="e-h3">${eEsc(S.byggNavn(b))}</h3>
      <div class="e-tabell-rulle"><table class="e-tabell"><thead>
        ${liv ? `<tr><th colspan="${prim ? 6 : 5}" style="border:0"></th><th colspan="3" class="e-senter">Livsløp</th><th style="border:0"></th></tr>` : ''}
        <tr><th>Adresse</th><th>${a ? 'Bolignr.' : 'Bolignummer'}</th>${a ? '<th>Utbyggers boligbetegnelse</th>' : ''}<th class="e-tall">BRA-i</th>${prim ? '<th class="e-tall">Primærareal</th>' : ''}<th class="e-tall">Antall rom</th>
          ${liv ? '<th class="e-senter">Oppfyller alle krav til livsløpsboliger</th><th class="e-senter">Forberedt for innvendig løfteinnretning</th><th class="e-senter">Oppfyller ikke krav</th>' : ''}
          ${!a && S.visBK(pf) ? '<th>Boligkvaliteter</th>' : ''}${S.utleie(pf) ? '<th class="e-tall">Husleie</th>' : ''}${S.salg(pf) ? '<th class="e-tall">Salgspris</th>' : ''}</tr>
      </thead><tbody>${rader}</tbody></table></div>`;
  }).join('');
  const sum = k => alle.reduce((s, x) => s + eNum(x.fo[k]), 0);
  const med = alle.filter(x => !S.utmalingsvarsel(pf, x.b, x.adr, x.fo)).length;
  const k = pf.klima || {};
  /* Spørsmålene om kjeller finnes bare for «Klimavennlig bolig». Rader uten svar vises ikke. */
  const miljo = S.visKlima(pf) || S.erKlimavennlig(pf) ? `<dl class="e-dl">${OP.rad('Totalt BTA på hele prosjektet', k.btaTotalt ? `${eTusen(k.btaTotalt)} m² BTA` : null)}
    ${OP.rad('Antatt klimagassutslipp for prosjektet uten kjellerareal', k.co2 ? `${eEsc(k.co2)} kg CO₂-ekv./m² BTA` : null)}${OP.rad('Har prosjektet kjeller?', OP.jaNei(k.harKjeller))}${OP.rad('Vil kjelleren være oppvarmet?', OP.jaNei(k.oppvarmetKjeller))}${k.harKjeller === true ? OP.rad('Antatt klimagassutslipp for kjellerarealet i prosjektet', k.co2Kjeller ? `${eEsc(k.co2Kjeller)} kg CO₂-ekv./m² BTA` : null) : ''}</dl>` : '';
  const kvalitetskrav = !a && S.visBK(pf) && B.kvalitetsBk(pf).length ? `<h3 class="e-h3">Kvalitetskrav</h3>
    <table class="e-tabell" style="margin-bottom:var(--space-5)"><thead><tr><th>Navn</th><th>Energi og Miljø</th><th>Universell utforming</th></tr></thead><tbody>
    ${B.kvalitetsBk(pf).map(k => `<tr><td>${eEsc(k.navn)}</td><td>${k.koder.map(kvalitet).filter(x => x && x.kat === 'EM').map(x => x.navn).join(', ')}</td><td>${k.koder.map(kvalitet).filter(x => x && x.kat === 'UU').map(x => x.navn).join(', ')}</td></tr>`).join('')}</tbody></table>` : '';
  return OP.kort(pf, { tittel: S.visBK(pf) ? 'Kvalitetskrav og boenheter' : 'Boenheter', ikon: 'husStor', steg: 'boligkvaliteter', kropp: `
    ${miljo}${kvalitetskrav}${tabeller || '<p>Ingen boenheter er lagt til.</p>'}
    <table class="e-tabell e-tabell--enkel" style="max-width:36rem">
      ${S.er(pf, 'OPPFORING') ? `<tr><td>Med i låneutmåling</td><td class="e-tall">${med} stk</td></tr><tr><td>Ikke med i låneutmåling</td><td class="e-tall">${alle.length - med} stk</td></tr>` : ''}
      <tr class="e-tabell__sum"><td>Totalt</td><td class="e-tall">${alle.length} stk</td><td class="e-tall">${sum('bruksAreal')} m²</td>
        ${S.utleie(pf) ? `<td class="e-tall">${eKr(sum('utleiepris'))}</td>` : ''}${S.salg(pf) ? `<td class="e-tall">${eKr(sum('salgspris'))}</td>` : ''}</tr>
    </table>` });
}

function kortOkonomi(pf) {
  const o = S.okonomi(pf);
  const r = (l, v, sum = false) => (v == null || v === '' ? '' : `<div class="e-verdirad${sum ? ' e-verdirad--sum' : ''}"><span>${l}</span><span>${eTusen(v)}</span></div>`);
  const salg = S.salg(pf);
  const tu = S.tilskuddUtleie(pf);
  return OP.kort(pf, { tittel: 'Økonomi', ikon: 'kroner', steg: 'okonomi', kropp: `<div class="e-tre">
    <div><h3 class="e-h3">Prosjektkostnader</h3>
      ${r('Kjøpesum', o.kjopesum)}${r('Omkostninger', o.omkostninger)}${r('Utbedringskostnader', o.utbedringskostnader)}${r('Byggekostnader', o.byggekostnader)}
      ${r('Tomtekostnader', o.tomtekostnader)}${r('Oppgraderingskostnader', o.oppgraderingsKostnad)}${r('Ombyggingskostnader', o.ombyggingsKostnad)}
      ${r('Prosjektkostnader', S.sumProsjektkostnader(pf), true)}
      ${salg ? r('Sum salgspris for boligene i prosjektet', S.sumSalgspris(pf)) : r('Prosjektets omsetningsverdi', o.omsetningsverdi)}
      ${r('Sum gjeld', o.gjeld)}
      ${tu > 0 ? `<h3 class="e-h3 e-mt">Tilskudd til utleieboliger</h3>${r('Foreløpig beregning av tilskudd', tu)}` : ''}</div>
    <div><h3 class="e-h3">Finansieringsplan</h3>
      ${r('Søkt lån fra Husbanken', o.grunnlan)}${!salg ? r('Andre lån', o.andrelan) : ''}${tu > 0 ? r('Foreløpig beregnet tilskudd fra Husbanken', tu) : ''}
      ${!salg ? `${r('Tilskudd fra andre', o.andreTilskudd)}${r('Egenkapital', o.egenkapital)}` : r('Egenfinansiering', o.egenfinansiering)}
      ${r('Sum finansieringsplan', S.sumFinansiering(pf), true)}</div>
    <div>${S.lanProdukt(pf) && (o.lanType || o.avdragsfriPeriode || o.nedbetalingsPeriode) ? `<h3 class="e-h3">Nedbetalingsvilkår</h3>
      <div class="e-verdirad"><span>Låneform</span><span>${{ ANNUITETSLAN: 'Annuitetslån', SERIELAN: 'Serielån' }[o.lanType] || ''}</span></div>
      <div class="e-verdirad"><span>Avdragsfri periode</span><span>${eEsc(o.avdragsfriPeriode ?? '')}</span></div>
      <div class="e-verdirad"><span>Nedbetalingsperiode</span><span>${eEsc(o.nedbetalingsPeriode ?? '')}</span></div>
      <div class="e-verdirad"><span>Total løpetid</span><span>${eNum(o.avdragsfriPeriode) + eNum(o.nedbetalingsPeriode)}</span></div>` : ''}</div>
  </div>` });
}

function kortVedlegg(pf) {
  const filer = [...(pf.vedlegg || [])].sort((a, b) => a.kategori.localeCompare(b.kategori, 'nb') || a.tittel.localeCompare(b.tittel, 'nb'));
  const tittel = id => (S.VEDLEGG.find(k => k.id === id) || {}).tittel || id;
  return OP.kort(pf, { tittel: 'Vedlegg', ikon: 'binders', steg: 'vedlegg', kropp: filer.length ? `<ul class="e-vedleggsliste">${filer.map(v => `
    <li>${E_IKON.fil}<span><a href="#" data-ikke-med="Nedlasting av vedlegg er ikke med i prototypen.">${eEsc(v.tittel)}</a><br><span class="e-tag">${tittel(v.kategori)}</span></span></li>`).join('')}</ul>` : '<p>Ingen vedlegg er lastet opp.</p>' });
}

function kortSignering(pf) {
  const kunde = S.aktivKunde(pf);
  return `<section class="e-kort e-oppskort" id="signering">
    <div class="e-kort__topp">${E_IKON.blyant}<h2>Signering</h2></div>
    <div class="e-kort__kropp">
      <p>Signaturbestemmelse for ${eEsc(kunde.orgNavn)} ${kunde.orgNr}:</p>
      <p class="e-fet">${SIGNATURBESTEMMELSE}</p>
      <p>Velg hvem som skal signere søknaden. De får en e-post med informasjon om hvordan de signerer.</p>
      ${UNDERTEGNERE.map((u, i) => {
        const p = `signering.p${i}`;
        const s = (pf.signering || {})[`p${i}`] || {};
        return `<div class="e-undertegner">
          <label class="e-valg"><input type="checkbox" id="${F.id(`${p}.valgt`)}" data-felt="${p}.valgt" data-type="sjekk" ${s.valgt ? 'checked' : ''}>
            <span class="e-valg__tekst"><span class="e-fet">${u.navn}</span><span class="e-liten e-sekundaer">${u.roller.join(', ')}</span></span></label>
          ${s.valgt ? `<div class="e-undertegner__detalj">
            ${F.tekst({ felt: `${p}.epost`, label: 'E-post', autocomplete: 'off' })}
            ${F.janei({ felt: `${p}.adresseRiktig`, label: `Er folkeregistrert adresse riktig? (${u.adresse})` })}
          </div>` : ''}
        </div>`;
      }).join('')}
      ${pf.feilKombinasjon ? eCallout('advarsel', '<p>Valgte undertegnere er ikke i henhold til foretakets signaturbestemmelse.</p>') : ''}
      <p class="e-liten e-sekundaer e-mb0">Prototype: personene med signaturrett er oppdiktet.</p>
    </div>
  </section>`;
}
