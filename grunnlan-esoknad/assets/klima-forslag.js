/* ──────────────────────────────────────────────────────────────────
   Klimagassavtrykk på Bolig-steget: fem forslag

   Fem måter å stille spørsmålene fra Miro-skissen på. Alle samler inn
   det samme: BTA og antatt utslipp for blokk og småhus uten kjeller,
   og for oppvarmet og uoppvarmet kjeller. Alle regner ut grenseverdiene
   på samme måte, med beregn() under, så det er bare spørsmålene og
   oppsettet som skiller dem.
   ────────────────────────────────────────────────────────────────── */

const KF_ENHET = 'kg CO₂-ekv./m² BTA';

/* Grenseverdiene i forslaget til ny § 2-3, samme tall som på Bolig-steget */
const KF_GRENSER = {
  BOLIGBLOKK: { navn: 'Boligblokk', bygg: 247, oppvarmet: 180, uoppvarmet: 139 },
  SMAHUS_STOR: { navn: 'Småhus, minst 1000 m² BTA', bygg: 130, oppvarmet: 206, uoppvarmet: 159 },
  SMAHUS: { navn: 'Småhus, under 1000 m² BTA', bygg: 167, oppvarmet: 232, uoppvarmet: 179 }
};
const KF_TYPE = { BLOKK: 'Blokker', SMAHUS: 'Småhus' };
const KF_DEL = { bygg: 'uten kjeller', oppvarmet: 'oppvarmet kjeller', uoppvarmet: 'uoppvarmet kjeller' };
const KF_SMAHUS_HJELP = 'Enebolig, to- til firemannsbolig, rekkehus, kjedehus og terrassehus på til og med tre etasjer.';
const KF_BLOKK_HJELP = 'Boligbygg med flere boliger som ikke regnes som småhus, typisk leilighetsbygg.';

/* ═══ Beregningen ═════════════════════════════════════════════════
   deler: [{ type: 'BLOKK'|'SMAHUS', del: 'bygg'|'oppvarmet'|'uoppvarmet', bta, co2 }]

   Småhusene regnes som ett prosjekt på minst 1000 m² når summen av
   all BTA for småhus, med kjeller, er 1000 eller mer. Bygget og kjelleren
   kontrolleres hver for seg. Har en av dem flere deler, vektes både
   grenseverdien og det antatte utslippet etter BTA, slik § 2-3 (3)
   beskriver: summen av BTA × verdi, delt på summen av BTA.
   ─────────────────────────────────────────────────────────────────── */

const kfTall = v => !V.tom(v) && V.heltall(v);

function kfBeregn(deler) {
  const med = deler.filter(p => kfTall(p.bta) && eNum(p.bta) > 0);
  const btaSmahus = med.filter(p => p.type === 'SMAHUS').reduce((s, p) => s + eNum(p.bta), 0);
  const kategori = type => (type === 'BLOKK' ? KF_GRENSER.BOLIGBLOKK : btaSmahus >= 1000 ? KF_GRENSER.SMAHUS_STOR : KF_GRENSER.SMAHUS);
  const rader = med.map(p => ({ ...p, grense: kategori(p.type)[p.del], kategori: kategori(p.type).navn }));
  const gruppe = liste => {
    if (!liste.length) return null;
    const bta = liste.reduce((s, p) => s + eNum(p.bta), 0);
    const grense = liste.reduce((s, p) => s + eNum(p.bta) * p.grense, 0) / bta;
    const alleUtslipp = liste.every(p => kfTall(p.co2));
    const utslipp = alleUtslipp ? liste.reduce((s, p) => s + eNum(p.bta) * eNum(p.co2), 0) / bta : null;
    return { bta, grense, utslipp, vektet: liste.length > 1, ok: utslipp == null ? null : utslipp <= grense };
  };
  return {
    rader,
    totalBta: med.reduce((s, p) => s + eNum(p.bta), 0),
    bygg: gruppe(rader.filter(p => p.del === 'bygg')),
    kjeller: gruppe(rader.filter(p => p.del !== 'bygg'))
  };
}

const kfRund = n => String(Math.round(n));
const kfStatus = (ok, kort = false) => (ok == null ? (kort ? '' : '<span class="e-sekundaer">Mangler utslipp</span>')
  : kort ? (ok ? '<span class="kf-ok" title="Innenfor">✓<span class="e-sr"> Innenfor</span></span>' : '<span class="kf-over" title="Over grensen">✗<span class="e-sr"> Over grensen</span></span>')
    : ok ? '<span class="kf-ok">✓ Innenfor</span>' : '<span class="kf-over">✗ Over grensen</span>');

/* Resultatet som tabell, med linjene for bygg og kjeller under */
function kfResultat(r, { tittel = 'Grenseverdier for prosjektet', kort = false } = {}) {
  if (!r.rader.length) return `<div class="kf-resultat"><h3 class="e-h4">${tittel}</h3><p class="e-sekundaer e-mb0">Fyll ut BTA for å se grenseverdiene.</p></div>`;
  const linje = (navn, g) => (g ? `<tr class="e-tabell__sum"><td>${navn}${g.vektet ? ', vektet' : ''}</td><td class="e-tall">${eTusen(g.bta)}</td>
    <td class="e-tall">${g.utslipp == null ? '' : kfRund(g.utslipp)}</td><td class="e-tall">${kfRund(g.grense)}</td><td>${kfStatus(g.ok, kort)}</td></tr>` : '');
  return `<div class="kf-resultat">
    <h3 class="e-h4">${tittel}</h3>
    <div class="e-tabell-rulle"><table class="e-tabell">
      <thead><tr><th>Del</th><th class="e-tall">m² BTA</th><th class="e-tall">Antatt</th><th class="e-tall">Grense</th><th><span class="e-sr">Status</span></th></tr></thead>
      <tbody>${r.rader.map(p => `<tr><td>${KF_TYPE[p.type]}, ${KF_DEL[p.del]}</td><td class="e-tall">${eTusen(p.bta)}</td>
        <td class="e-tall">${kfTall(p.co2) ? eEsc(p.co2) : ''}</td><td class="e-tall">${p.grense}</td><td>${kfStatus(kfTall(p.co2) ? eNum(p.co2) <= p.grense : null, kort)}</td></tr>`).join('')}
        ${linje('Bygg uten kjeller', r.bygg)}${linje('Kjeller', r.kjeller)}</tbody>
    </table></div>
    <p class="e-liten e-sekundaer e-mb0">Totalt BTA: ${eTusen(r.totalBta)} m². Utslipp og grenseverdier er i ${KF_ENHET}.</p>
  </div>`;
}

/* Et tallfelt med enhet, som oppdaterer resultatet mens man skriver */
function kfTallFelt({ felt, label, enhet = 'm² BTA', beskrivelse, hjelp, smal = false }) {
  const id = F.id(felt);
  return `<div class="e-felt${F.harFeil(felt) ? ' e-felt--feil' : ''}" data-feltboks="${felt}">
    ${hjelp ? `<div class="e-felt__labelrad"><label class="e-felt__label" for="${id}">${label}</label>${F.hjelpKnapp(felt)}</div>${F.hjelpTekst(felt, hjelp)}`
    : `<label class="e-felt__label" for="${id}">${label}</label>`}
    ${beskrivelse ? `<span class="e-felt__hjelp" id="${id}-besk">${beskrivelse}</span>` : ''}
    <div class="e-enhet"><input class="e-input ${smal ? 'e-input--xs' : 'e-input--s'}" id="${id}" inputmode="numeric" data-felt="${felt}" data-type="tekst" data-levende
      value="${eEsc(F.hent(felt) ?? '')}" aria-describedby="${beskrivelse ? `${id}-besk ` : ''}${id}-feil"><span class="e-enhet__tekst">${enhet}</span></div>
    ${F.feilHtml(felt)}
  </div>`;
}

/* Påkrevd tall: legger til feilen hvis feltet er tomt eller ikke et tall */
const kfKrev = (f, felt, v, tom = 'Feltet må fylles ut.') => {
  if (V.tom(v)) f.push({ nokkel: felt, melding: tom });
  else if (!V.heltall(v)) f.push({ nokkel: felt, melding: 'Feltet kan bare inneholde tall, for eksempel 1200.' });
};

const KF_TYPER = [
  { k: 'blokk', type: 'BLOKK', navn: 'blokk', tittel: 'Blokker', enEllerFlere: 'én eller flere blokker', flertall: 'blokkene', hjelp: KF_BLOKK_HJELP },
  { k: 'smahus', type: 'SMAHUS', navn: 'småhus', tittel: 'Småhus', enEllerFlere: 'ett eller flere småhus', flertall: 'småhusene', hjelp: KF_SMAHUS_HJELP }
];

/* ═══ Forslag 1: Trinnvis, slik Miro-skissen er tegnet ════════════ */

const KF1 = {
  navn: 'Trinnvis, som i Miro',
  ide: 'Spørsmålene kommer i samme rekkefølge som i Miro-skissen, ett ja/nei-spørsmål om gangen. Svarer man nei, forsvinner spørsmålene under.',
  fordeler: ['Lett å kjenne igjen for dem som laget skissen.', 'Hvert spørsmål er enkelt å svare på.', 'Samme mønster som resten av e-søknaden, med spørsmål som dukker opp etter svarene.'],
  ulemper: ['Med kjeller får man alltid fire felt, også om all kjeller er oppvarmet. Da må man skrive 0.', 'Blir en lang side når prosjektet har både blokk og småhus.', 'Resultatet kommer først helt nederst.'],
  deler: d => KF_TYPER.flatMap(t => {
    const x = d[t.k] || {};
    if (x.med !== true) return [];
    return [{ type: t.type, del: 'bygg', bta: x.bta, co2: x.co2 },
      ...(x.kjeller === true ? [{ type: t.type, del: 'oppvarmet', bta: x.oppBta, co2: x.oppCo2 }, { type: t.type, del: 'uoppvarmet', bta: x.uoppBta, co2: x.uoppCo2 }] : [])];
  }),
  tegn: (d, p) => `${KF_TYPER.map(t => {
    const x = d[t.k] || {};
    const q = `${p}.${t.k}`;
    return `<h2 class="e-h2 e-mt">${t.tittel}</h2>
      ${F.janei({ felt: `${q}.med`, label: `Vil det være ${t.enEllerFlere} i prosjektet?`, hjelp: t.hjelp })}
      ${x.med === true ? `
        ${kfTallFelt({ felt: `${q}.bta`, label: `Hva er samlet BTA for alle ${t.flertall}?`, beskrivelse: `Uten kjellerareal. Legg sammen BTA for alle ${t.flertall} i prosjektet.` })}
        ${kfTallFelt({ felt: `${q}.co2`, label: `Hvor mye kg CO₂-utslipp vil det være for ${t.flertall} samlet, utenom kjeller?`, beskrivelse: 'Tallet for alle under ett, slik det står i klimagassbudsjettet.', enhet: KF_ENHET })}
        ${F.janei({ felt: `${q}.kjeller`, label: `Vil det være kjeller i noen av ${t.flertall}?` })}
        ${x.kjeller === true ? `
          ${kfTallFelt({ felt: `${q}.oppBta`, label: `Hvor mange m² BTA oppvarmet kjeller vil det være i ${t.flertall} til sammen?` })}
          ${kfTallFelt({ felt: `${q}.uoppBta`, label: `Hvor mange m² BTA uoppvarmet kjeller vil det være i ${t.flertall} til sammen?` })}
          ${kfTallFelt({ felt: `${q}.oppCo2`, label: 'Hvor mye CO₂-utslipp vil det være for de oppvarmede kjellerne samlet?', enhet: KF_ENHET })}
          ${kfTallFelt({ felt: `${q}.uoppCo2`, label: 'Hvor mye CO₂-utslipp vil det være for de uoppvarmede kjellerne samlet?', enhet: KF_ENHET })}` : ''}` : ''}`;
  }).join('')}
    ${F.gruppefeil(`${p}-type`)}
    ${kfResultat(kfBeregn(KF1.deler(d)))}`,
  valider: (d, p) => {
    const f = [];
    KF_TYPER.forEach(t => {
      const x = d[t.k] || {}; const q = `${p}.${t.k}`;
      if (x.med == null) f.push({ nokkel: `${q}.med`, melding: `Du må svare på om det skal være ${t.enEllerFlere} i prosjektet.` });
      if (x.med !== true) return;
      kfKrev(f, `${q}.bta`, x.bta); kfKrev(f, `${q}.co2`, x.co2);
      if (x.kjeller == null) f.push({ nokkel: `${q}.kjeller`, melding: `Du må svare på om det vil være kjeller i noen av ${t.flertall}.` });
      if (x.kjeller === true) ['oppBta', 'uoppBta', 'oppCo2', 'uoppCo2'].forEach(k => kfKrev(f, `${q}.${k}`, x[k], k.endsWith('Bta') ? 'Feltet må fylles ut. Hvis det ikke er slik kjeller, skriv 0.' : 'Feltet må fylles ut.'));
    });
    if ((d.blokk || {}).med === false && (d.smahus || {}).med === false) f.push({ nokkel: `${p}-type`, melding: 'Prosjektet må ha blokk, småhus eller begge.' });
    return f;
  }
};

/* ═══ Forslag 2: Ett kort per bygningstype ════════════════════════ */

const KF2_KJELLER = [
  { v: 'INGEN', l: 'Nei' }, { v: 'OPP', l: 'Ja, bare oppvarmet kjeller' },
  { v: 'UOPP', l: 'Ja, bare uoppvarmet kjeller' }, { v: 'BEGGE', l: 'Ja, både oppvarmet og uoppvarmet kjeller' }
];
const KF2 = {
  navn: 'Ett kort per bygningstype',
  ide: 'Man krysser først av for hvilke bygningstyper prosjektet har. Hver type får sitt eget kort, der BTA og utslipp står side om side. Kjelleren er ett spørsmål med fire svar, så man bare får feltene som gjelder.',
  fordeler: ['Ingen felt med 0. Man får bare spørsmål om kjelleren man faktisk har.', 'BTA og utslipp står ved siden av hverandre, slik de står i klimagassbudsjettet.', 'Hvert kort viser sin egen grenseverdi, så man ser hvilken del som trekker opp.'],
  ulemper: ['Ett spørsmål med fire svar er tyngre å lese enn et ja/nei.', 'Kort i kort kan bli mye ramme på en lang side.'],
  delerFor: (d, t) => {
    const x = d[t.k] || {};
    if (!(d.typer || []).includes(t.type)) return [];
    return [{ type: t.type, del: 'bygg', bta: x.bta, co2: x.co2 },
      ...(['OPP', 'BEGGE'].includes(x.kjeller) ? [{ type: t.type, del: 'oppvarmet', bta: x.oppBta, co2: x.oppCo2 }] : []),
      ...(['UOPP', 'BEGGE'].includes(x.kjeller) ? [{ type: t.type, del: 'uoppvarmet', bta: x.uoppBta, co2: x.uoppCo2 }] : [])];
  },
  deler: d => KF_TYPER.flatMap(t => KF2.delerFor(d, t)),
  tegn: (d, p) => {
    const alle = kfBeregn(KF2.deler(d));
    return `${F.avkryss({ felt: `${p}.typer`, label: 'Hvilke bygningstyper skal prosjektet ha?', beskrivelse: 'Kryss av for alle som gjelder.',
      valg: KF_TYPER.map(t => ({ v: t.type, l: eStor(t.navn), hjelp: t.hjelp })) })}
    ${KF_TYPER.filter(t => (d.typer || []).includes(t.type)).map(t => {
      const x = d[t.k] || {}; const q = `${p}.${t.k}`;
      const egne = alle.rader.filter(r => r.type === t.type);
      const par = (bta, co2, tittel) => `<h3 class="e-h4 e-mt">${tittel}</h3><div class="e-to">
        ${kfTallFelt({ felt: `${q}.${bta}`, label: 'Samlet BTA' })}${kfTallFelt({ felt: `${q}.${co2}`, label: 'Antatt utslipp', enhet: KF_ENHET })}</div>`;
      return eKort({ tittel: t.tittel, kropp: `
        <p>Oppgi tallene for alle ${t.flertall} i prosjektet til sammen.</p>
        ${par('bta', 'co2', `Alle ${t.flertall}, uten kjeller`)}
        ${F.radio({ felt: `${q}.kjeller`, label: `Har noen av ${t.flertall} kjeller?`, valg: KF2_KJELLER })}
        ${['OPP', 'BEGGE'].includes(x.kjeller) ? par('oppBta', 'oppCo2', 'Oppvarmet kjeller, til sammen') : ''}
        ${['UOPP', 'BEGGE'].includes(x.kjeller) ? par('uoppBta', 'uoppCo2', 'Uoppvarmet kjeller, til sammen') : ''}`,
        bunn: egne.length ? `<span class="e-liten">Grenseverdier for ${t.flertall}: ${egne.map(r => `${KF_DEL[r.del]} <b>${r.grense}</b>`).join(' · ')}</span>` : '' });
    }).join('')}
    ${kfResultat(alle)}`;
  },
  valider: (d, p) => {
    const f = [];
    if (V.tom(d.typer)) f.push({ nokkel: `${p}.typer`, melding: 'Du må krysse av for hvilke bygningstyper prosjektet skal ha.' });
    KF_TYPER.filter(t => (d.typer || []).includes(t.type)).forEach(t => {
      const x = d[t.k] || {}; const q = `${p}.${t.k}`;
      kfKrev(f, `${q}.bta`, x.bta); kfKrev(f, `${q}.co2`, x.co2);
      if (!x.kjeller) f.push({ nokkel: `${q}.kjeller`, melding: `Du må svare på om noen av ${t.flertall} har kjeller.` });
      if (['OPP', 'BEGGE'].includes(x.kjeller)) { kfKrev(f, `${q}.oppBta`, x.oppBta); kfKrev(f, `${q}.oppCo2`, x.oppCo2); }
      if (['UOPP', 'BEGGE'].includes(x.kjeller)) { kfKrev(f, `${q}.uoppBta`, x.uoppBta); kfKrev(f, `${q}.uoppCo2`, x.uoppCo2); }
    });
    return f;
  }
};

/* ═══ Forslag 3: Én tabell, som i klimagassbudsjettet ═════════════ */

const KF3_RADER = KF_TYPER.flatMap(t => ['bygg', 'oppvarmet', 'uoppvarmet'].map(del => ({ t, del, k: `${t.k}_${del}` })));
const KF3 = {
  navn: 'Én tabell',
  ide: 'Alle seks bygningsdelene står i én tabell, og man fyller ut radene som gjelder prosjektet. Grenseverdien og om tallet er innenfor, vises på raden mens man skriver.',
  fordeler: ['Raskest for rådgivere og utbyggere som har klimagassbudsjettet foran seg.', 'Hele bildet på ett sted, også de vektede grenseverdiene.', 'Kort side, uten spørsmål som dukker opp og forsvinner.'],
  ulemper: ['Tomme rader betyr «gjelder ikke», og det må forklares.', 'Tabeller med felt er tunge på mobil og med skjermleser.', 'Forutsetter at man vet forskjellen på blokk og småhus før man begynner.'],
  deler: d => KF3_RADER.map(r => ({ type: r.t.type, del: r.del, bta: (d[r.k] || {}).bta, co2: (d[r.k] || {}).co2 }))
    .filter(x => !V.tom(x.bta) || !V.tom(x.co2)),
  tegn: (d, p) => {
    const r = kfBeregn(KF3.deler(d));
    const celle = (felt, label) => `<td data-feltboks="${felt}"><div class="e-enhet" style="gap:6px">
      <input class="e-input e-input--xs${F.harFeil(felt) ? ' er-feil' : ''}" style="margin:0" id="${F.id(felt)}" inputmode="numeric" data-felt="${felt}" data-type="tekst" data-levende value="${eEsc(F.hent(felt) ?? '')}" aria-label="${label}"></div>${F.feilHtml(felt)}</td>`;
    return `<h2 class="e-h2">Klimagassavtrykk</h2>
      <p>Fyll ut radene som gjelder prosjektet, med tallene fra klimagassbudsjettet. Hver rad gjelder alle byggene av samme type til sammen. Har prosjektet tre blokker, legger du sammen BTA for alle tre. La radene som ikke gjelder stå tomme.</p>
      <div class="e-tabell-rulle"><table class="e-tabell">
        <thead><tr><th>Bygningsdel</th><th>BTA (m²)</th><th>Antatt utslipp<br><span class="e-liten" style="font-weight:400">${KF_ENHET}</span></th><th class="e-tall">Grense</th><th><span class="e-sr">Status</span></th></tr></thead>
        <tbody>${KF3_RADER.map((rad, i) => {
          const x = d[rad.k] || {};
          const beregnet = r.rader.find(y => y.type === rad.t.type && y.del === rad.del);
          const navn = `${rad.t.tittel}, ${KF_DEL[rad.del]}`;
          return `${i % 3 === 0 ? `<tr><th colspan="5" style="background:var(--e-gra)">${rad.t.tittel}, til sammen</th></tr>` : ''}
            <tr><td>${eStor(KF_DEL[rad.del])}</td>${celle(`${p}.${rad.k}.bta`, `BTA for ${navn}`)}${celle(`${p}.${rad.k}.co2`, `Antatt utslipp for ${navn}`)}
            <td class="e-tall">${beregnet ? beregnet.grense : ''}</td><td>${beregnet && kfTall(x.co2) ? kfStatus(eNum(x.co2) <= beregnet.grense) : ''}</td></tr>`;
        }).join('')}</tbody>
        <tfoot>
          ${r.bygg ? `<tr><td>Bygg uten kjeller${r.bygg.vektet ? ', vektet' : ''}</td><td>${eTusen(r.bygg.bta)}</td><td>${r.bygg.utslipp == null ? '' : kfRund(r.bygg.utslipp)}</td><td class="e-tall">${kfRund(r.bygg.grense)}</td><td>${kfStatus(r.bygg.ok)}</td></tr>` : ''}
          ${r.kjeller ? `<tr><td>Kjeller${r.kjeller.vektet ? ', vektet' : ''}</td><td>${eTusen(r.kjeller.bta)}</td><td>${r.kjeller.utslipp == null ? '' : kfRund(r.kjeller.utslipp)}</td><td class="e-tall">${kfRund(r.kjeller.grense)}</td><td>${kfStatus(r.kjeller.ok)}</td></tr>` : ''}
        </tfoot>
      </table></div>
      ${F.gruppefeil(`${p}-tabell`)}
      ${F.lesmer(`${p}-hva`, 'Hva er blokk og småhus?', `<p><b>Blokk:</b> ${KF_BLOKK_HJELP}</p><p><b>Småhus:</b> ${KF_SMAHUS_HJELP}</p>`)}`;
  },
  valider: (d, p) => {
    const f = [];
    KF3_RADER.forEach(rad => {
      const x = d[rad.k] || {};
      if (V.tom(x.bta) && V.tom(x.co2)) return;
      kfKrev(f, `${p}.${rad.k}.bta`, x.bta, `Fyll ut BTA for ${rad.t.flertall}, ${KF_DEL[rad.del]}.`);
      kfKrev(f, `${p}.${rad.k}.co2`, x.co2, `Fyll ut antatt utslipp for ${rad.t.flertall}, ${KF_DEL[rad.del]}.`);
    });
    if (!['blokk_bygg', 'smahus_bygg'].some(k => !V.tom((d[k] || {}).bta))) f.push({ nokkel: `${p}-tabell`, melding: 'Fyll ut minst én rad for blokk eller småhus uten kjeller.' });
    return f;
  }
};

/* ═══ Forslag 4: Ett spørsmål om gangen ═══════════════════════════ */

const KF4 = {
  navn: 'Ett spørsmål om gangen',
  ide: 'Klimadelen blir en liten veiviser inne i Bolig-steget, med ett spørsmål per skjerm og en oppsummering til slutt. Spørsmålene følger Miro-skissen, men kjelleren spørres om med avkrysning.',
  fordeler: ['Minst mulig å tenke på om gangen, godt for dem som sjelden søker.', 'Oppsummeringen samler alle tallene og viser resultatet før man går videre.', 'Fungerer godt på mobil.'],
  ulemper: ['Mange klikk for dem som har tallene klare.', 'En veiviser inne i en veiviser kan gjøre det uklart hvor man er.', 'Vanskeligere å se svarene sine under ett mens man fyller ut.'],
  i: 0,
  skjermer: d => KF_TYPER.flatMap(t => {
    const x = d[t.k] || {};
    const s = [{ t, type: 'med' }];
    if (x.med === true) {
      s.push({ t, type: 'bygg' }, { t, type: 'kjeller' });
      if ((x.kjeller || []).includes('OPP')) s.push({ t, type: 'opp' });
      if ((x.kjeller || []).includes('UOPP')) s.push({ t, type: 'uopp' });
    }
    return s;
  }),
  deler: d => KF_TYPER.flatMap(t => {
    const x = d[t.k] || {};
    if (x.med !== true) return [];
    return [{ type: t.type, del: 'bygg', bta: x.bta, co2: x.co2 },
      ...((x.kjeller || []).includes('OPP') ? [{ type: t.type, del: 'oppvarmet', bta: x.oppBta, co2: x.oppCo2 }] : []),
      ...((x.kjeller || []).includes('UOPP') ? [{ type: t.type, del: 'uoppvarmet', bta: x.uoppBta, co2: x.uoppCo2 }] : [])];
  }),
  skjermFeil: (d, p, s) => {
    const f = [];
    const x = d[s.t.k] || {}; const q = `${p}.${s.t.k}`;
    if (s.type === 'med' && x.med == null) f.push({ nokkel: `${q}.med`, melding: 'Velg ja eller nei.' });
    if (s.type === 'bygg') { kfKrev(f, `${q}.bta`, x.bta); kfKrev(f, `${q}.co2`, x.co2); }
    if (s.type === 'kjeller' && V.tom(x.kjeller)) f.push({ nokkel: `${q}.kjeller`, melding: 'Kryss av for kjelleren, eller for «Ingen kjeller».' });
    if (s.type === 'opp') { kfKrev(f, `${q}.oppBta`, x.oppBta); kfKrev(f, `${q}.oppCo2`, x.oppCo2); }
    if (s.type === 'uopp') { kfKrev(f, `${q}.uoppBta`, x.uoppBta); kfKrev(f, `${q}.uoppCo2`, x.uoppCo2); }
    return f;
  },
  tegn: (d, p) => {
    const skjermer = KF4.skjermer(d);
    KF4.i = Math.min(KF4.i, skjermer.length);
    const s = skjermer[KF4.i];
    let innhold;
    if (!s) {
      const r = kfBeregn(KF4.deler(d));
      innhold = `<h2 class="e-h2">Oppsummering av klimagassavtrykket</h2>
        ${kfResultat(r, { tittel: 'Dette har dere svart' })}
        <p><button type="button" class="e-knapp e-knapp--subtil" data-handling="kf4Til" data-i="0">${E_IKON.blyant}Endre svarene</button></p>`;
    } else {
      const t = s.t; const q = `${p}.${t.k}`;
      const sporsmal = {
        med: () => F.janei({ felt: `${q}.med`, label: `<span class="kf-sporsmal">Vil det være ${t.enEllerFlere} i prosjektet?</span>`, hjelp: t.hjelp }),
        bygg: () => `<p class="kf-sporsmal">${eStor(t.flertall)} uten kjeller</p><p>Skriv samlet BTA og antatt utslipp for alle ${t.flertall}, utenom kjellerne.</p>
          ${kfTallFelt({ felt: `${q}.bta`, label: 'Samlet BTA' })}${kfTallFelt({ felt: `${q}.co2`, label: 'Antatt utslipp', enhet: KF_ENHET })}`,
        kjeller: () => F.avkryss({ felt: `${q}.kjeller`, label: `<span class="kf-sporsmal">Vil det være kjeller i noen av ${t.flertall}?</span>`, beskrivelse: 'Kryss av for alle som gjelder.',
          valg: [{ v: 'OPP', l: 'Oppvarmet kjeller' }, { v: 'UOPP', l: 'Uoppvarmet kjeller' }, { v: 'INGEN', l: 'Ingen kjeller' }] }),
        opp: () => `<p class="kf-sporsmal">Oppvarmet kjeller i ${t.flertall}, til sammen</p>${kfTallFelt({ felt: `${q}.oppBta`, label: 'Samlet BTA' })}${kfTallFelt({ felt: `${q}.oppCo2`, label: 'Antatt utslipp', enhet: KF_ENHET })}`,
        uopp: () => `<p class="kf-sporsmal">Uoppvarmet kjeller i ${t.flertall}, til sammen</p>${kfTallFelt({ felt: `${q}.uoppBta`, label: 'Samlet BTA' })}${kfTallFelt({ felt: `${q}.uoppCo2`, label: 'Antatt utslipp', enhet: KF_ENHET })}`
      }[s.type]();
      innhold = `<p class="e-liten e-sekundaer e-mb0">Klimagassavtrykk · spørsmål ${KF4.i + 1} av ${skjermer.length}</p>
        <div class="kf-framdrift" aria-hidden="true"><div style="width:${Math.round((KF4.i / skjermer.length) * 100)}%"></div></div>
        ${sporsmal}
        <div class="e-knappegruppe e-mt">
          ${KF4.i > 0 ? `<button type="button" class="e-knapp" data-handling="kf4Forrige">${E_IKON.pilVenstre}Forrige spørsmål</button>` : ''}
          <button type="button" class="e-knapp e-knapp--prominent" data-handling="kf4Neste">Neste spørsmål ${E_IKON.pilHoyre}</button>
        </div>`;
    }
    return `<div class="kf-veiviser">${innhold}</div>${F.gruppefeil(`${p}-ferdig`)}`;
  },
  valider: (d, p) => {
    const f = KF4.skjermer(d).flatMap(s => KF4.skjermFeil(d, p, s));
    if (!f.length && KF4.i < KF4.skjermer(d).length) f.push({ nokkel: `${p}-ferdig`, melding: 'Gå gjennom spørsmålene om klimagassavtrykk til oppsummeringen.' });
    if ((d.blokk || {}).med === false && (d.smahus || {}).med === false) f.push({ nokkel: `${p}-ferdig`, melding: 'Prosjektet må ha blokk, småhus eller begge.' });
    return f;
  }
};

/* ═══ Forslag 5: Bygningsdeler som liste, med resultat ved siden av ═ */

const KF5_VALG = KF3_RADER.map(r => ({ v: `${r.t.type}|${r.del}`, l: `${eStor(r.t.navn)}, ${KF_DEL[r.del]}` }));
const KF5 = {
  navn: 'Bygningsdeler med resultat ved siden av',
  ide: 'Man legger til én bygningsdel om gangen, som i lista over nærstående på Prosjekt-steget. Hver del har type, BTA og utslipp. Til høyre står resultatet, som oppdateres mens man skriver.',
  fordeler: ['Fleksibelt: to blokker med ulikt utslipp kan legges inn hver for seg.', 'Man ser hele tiden om prosjektet er innenfor, og hvorfor.', 'Ingen spørsmål om ting prosjektet ikke har.'],
  ulemper: ['Man må selv vite hvilke deler som skal med, uten å bli spurt.', 'To kolonner krever bred skjerm. På mobil havner resultatet under lista.', 'Lettere å glemme en del, for eksempel kjelleren.'],
  deler: d => (d.deler || []).filter(x => x.del).map(x => { const [type, del] = x.del.split('|'); return { type, del, bta: x.bta, co2: x.co2 }; }),
  tegn: (d, p) => {
    d.deler = d.deler && d.deler.length ? d.deler : [{ id: 1 }];
    return `<div class="kf-to-kol">
      <div>
        <h2 class="e-h2">Bygningsdeler i prosjektet</h2>
        <p>Legg inn delene av prosjektet med BTA og antatt utslipp fra klimagassbudsjettet. Har prosjektet flere blokker eller småhus, kan hvert bygg legges inn for seg, eller like bygg samles i én del. Kjeller legges inn som egen del.</p>
        ${d.deler.map((x, i) => eKort({ tittel: `Bygningsdel ${i + 1}`, niva: 3, kropp: `
          ${F.velg({ felt: `${p}.deler.${i}.del`, label: 'Type', plassholder: '--- Velg bygningsdel ---', valg: KF5_VALG })}
          <div class="e-to">${kfTallFelt({ felt: `${p}.deler.${i}.bta`, label: 'BTA' })}${kfTallFelt({ felt: `${p}.deler.${i}.co2`, label: 'Antatt utslipp', enhet: KF_ENHET })}</div>`,
          bunn: d.deler.length > 1 ? `<button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="kf5Slett" data-i="${i}">${E_IKON.soppel}Slett</button>` : '' })).join('')}
        <p><button type="button" class="e-knapp" data-handling="kf5Legg">${E_IKON.pluss}Legg til bygningsdel</button></p>
        ${F.lesmer(`${p}-hva`, 'Hva er blokk og småhus?', `<p><b>Blokk:</b> ${KF_BLOKK_HJELP}</p><p><b>Småhus:</b> ${KF_SMAHUS_HJELP}</p>`)}
        ${F.gruppefeil(`${p}-bygg`)}
      </div>
      <aside class="kf-panel" aria-live="polite">${kfResultat(kfBeregn(KF5.deler(d)), { tittel: 'Resultat', kort: true })}
        <p class="e-liten e-mb0" style="margin-top:var(--space-3)">Har bygget eller kjelleren flere deler, vektes grenseverdien etter BTA: summen av BTA × grenseverdi, delt på samlet BTA.</p></aside>
    </div>`;
  },
  valider: (d, p) => {
    const f = [];
    (d.deler || []).forEach((x, i) => {
      if (!x.del) f.push({ nokkel: `${p}.deler.${i}.del`, melding: 'Velg hvilken bygningsdel det er.' });
      kfKrev(f, `${p}.deler.${i}.bta`, x.bta); kfKrev(f, `${p}.deler.${i}.co2`, x.co2);
    });
    if (!(d.deler || []).some(x => (x.del || '').endsWith('|bygg'))) f.push({ nokkel: `${p}-bygg`, melding: 'Legg inn minst én blokk eller ett småhus uten kjeller.' });
    return f;
  }
};

const KF_FORSLAG = [KF1, KF2, KF3, KF4, KF5];

/* ═══ Siden ═══════════════════════════════════════════════════════ */

const KF = { v: 0, visFeil: [false, false, false, false, false] };

function kfSkall() {
  const steg = S.STEG.map((s, j) => `<li class="e-stepper__steg${j < 2 ? ' er-ferdig' : ''}${j === 2 ? ' er-aktiv' : ''}">
    <span class="e-stepper__lenke"><span class="e-stepper__ikon">${E_IKON[s.ikon]}</span><span class="e-stepper__tekst" data-nr="${j + 1}">${s.tittel}</span></span></li>`).join('');
  return `<p class="e-soknadstype"><span class="e-soknadstype__navn">Kaiområdet boliger</span>(Oppføring)</p>
    <nav class="e-stepper" aria-label="Steg i søknaden (eksempel)"><ol class="e-stepper__liste">${steg}</ol></nav>`;
}

function kfTegn() {
  const v = KF_FORSLAG[KF.v];
  const p = `d${KF.v + 1}`;
  F.pf[p] = F.pf[p] || {};
  return `
    <h1 class="e-h1">Klimagassavtrykk på Bolig-steget</h1>
    <p class="e-ingress">Fem forslag til hvordan spørsmålene fra Miro-skissen kan stilles i e-søknaden for bransje, når formålet er klimavennlig bolig. Alle forslagene regner ut grenseverdiene, så dere kan prøve med ekte tall.</p>
    ${eCallout('noytral', `<p class="e-fet e-mb0">Miro-skissen, kort fortalt</p>
      <p>For både blokk og småhus: Vil det forekomme i prosjektet? Hvis ja, hva er BTA, og hvor stort er utslippet utenom kjeller? Vil det være kjeller? Hvis ja, hvor mange m² oppvarmet og uoppvarmet kjeller, og hvor stort er utslippet for hver av dem?</p>
      <p class="e-mb0">Et prosjekt kan ha flere blokker, flere småhus og kjeller under flere av dem. Derfor spør alle forslagene om tallene for alle byggene av samme type til sammen, og forslag 5 lar dem også legges inn hver for seg.</p>`)}
    <div class="kf-faner" role="tablist" aria-label="Forslag">
      ${KF_FORSLAG.map((f, i) => `<button type="button" role="tab" class="kf-fane" aria-selected="${i === KF.v}" data-handling="kfVelg" data-v="${i}"><span class="kf-fane__nr">${i + 1}</span>${f.navn}</button>`).join('')}
    </div>
    <section class="kf-om" aria-labelledby="kf-om-tittel">
      <h2 class="e-h3" id="kf-om-tittel">Forslag ${KF.v + 1}: ${v.navn}</h2>
      <p>${v.ide}</p>
      <div class="e-to"><div><p class="e-fet e-mb0">Fordeler</p><ul class="e-mb0">${v.fordeler.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div><p class="e-fet e-mb0">Ulemper</p><ul class="e-mb0">${v.ulemper.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
    </section>
    <p class="kf-merke">Slik kan det se ut i søknaden</p>
    <div class="kf-ramme">
      ${kfSkall()}
      ${eCallout('noytral', '<p>For å kunne søke om lån til oppføring av klimavennlig bolig må det utarbeides et klimagassbudsjett etter NS 3720:2018.</p>')}
      ${v.tegn(F.pf[p], p)}
      ${KF.v === 3 && KF4.i < KF4.skjermer(F.pf.d4 || {}).length ? '' : F.sammendrag()}
      <div class="e-knapper"><div class="e-knapper__nav">
        <button type="button" class="e-knapp" data-ikke-med="I forslagene går «Forrige steg» ikke noe sted.">${E_IKON.pilVenstre}Forrige steg</button>
        <button type="button" class="e-knapp e-knapp--prominent" data-handling="kfNeste">Neste steg ${E_IKON.pilHoyre}</button>
      </div><button type="button" class="e-knapp e-knapp--subtil" data-handling="kfTom">Tøm svarene i dette forslaget</button></div>
    </div>
    <h2 class="e-h2" style="margin-top:var(--space-8)">Forutsetninger i alle forslagene</h2>
    <div class="e-tabell-rulle"><table class="e-tabell" style="max-width:44rem">
      <thead><tr><th>Kategori</th><th class="e-tall">Bygg</th><th class="e-tall">Oppvarmet kjeller</th><th class="e-tall">Uoppvarmet kjeller</th></tr></thead>
      <tbody>${Object.values(KF_GRENSER).map(g => `<tr><td>${g.navn}</td><td class="e-tall">${g.bygg}</td><td class="e-tall">${g.oppvarmet}</td><td class="e-tall">${g.uoppvarmet}</td></tr>`).join('')}</tbody>
    </table></div>
    <ul>
      <li>Grenseverdiene er de samme som på Bolig-steget i dag, fra forslaget til ny § 2-3, i ${KF_ENHET}.</li>
      <li>Bygget uten kjeller og kjelleren kontrolleres hver for seg.</li>
      <li>Har bygget eller kjelleren flere deler, for eksempel både blokk og småhus, vektes både grenseverdien og utslippet etter BTA.</li>
      <li>Småhusene regnes som et prosjekt på minst 1000 m² når all BTA for småhus, med kjeller, er 1000 eller mer. Det må avklares.</li>
      <li>En advarsel om at tallet er over grensen stopper ikke «Neste steg», slik som i dag.</li>
    </ul>`;
}

function klimaForslag() {
  eMonter();
  S.t = eTilstand();
  const m = /^#forslag-([1-5])$/.exec(location.hash);
  if (m) KF.v = Number(m[1]) - 1;
  F.pf = {};
  F.side = {
    tegn: kfTegn,
    valider: () => KF_FORSLAG[KF.v].valider(F.pf[`d${KF.v + 1}`] || {}, `d${KF.v + 1}`),
    vedEndring: (felt, pf) => {
      /* «Ingen kjeller» kan ikke kombineres med kjeller i forslag 4 */
      const k = /^d4\.(\w+)\.kjeller$/.exec(felt);
      if (k) {
        const x = pf.d4[k[1]]; const sist = (x.kjeller || []).slice(-1)[0];
        if (sist === 'INGEN') x.kjeller = ['INGEN']; else if (x.kjeller) x.kjeller = x.kjeller.filter(y => y !== 'INGEN');
      }
    },
    handlinger: {
      kfVelg: d => { KF.v = Number(d.v); F.visFeil = KF.visFeil[KF.v]; history.replaceState(null, '', `#forslag-${KF.v + 1}`); },
      kfNeste: () => {
        KF.visFeil[KF.v] = true; F.visFeil = true;
        if (F.oppdaterFeil().length) { F.tegn(); F.visSammendrag(); return false; }
        eBekreft({ tittel: 'Klar for neste steg', tekst: 'Alt er fylt ut. I søknaden ville du nå gått videre til Økonomi.', bekreft: 'Lukk', avbryt: null });
        return true;
      },
      kfTom: () => { F.pf[`d${KF.v + 1}`] = {}; KF.visFeil[KF.v] = false; F.visFeil = false; if (KF.v === 3) KF4.i = 0; },
      kf4Neste: () => {
        const d = F.pf.d4; const s = KF4.skjermer(d)[KF4.i];
        const feil = KF4.skjermFeil(d, 'd4', s);
        if (feil.length) { F.visFeil = true; F.feil = {}; return true; }
        F.visFeil = KF.visFeil[3];
        KF4.i += 1;
        return true;
      },
      kf4Forrige: () => { KF4.i = Math.max(0, KF4.i - 1); },
      kf4Til: d => { KF4.i = Number(d.i); },
      kf5Legg: () => { F.pf.d5.deler.push({ id: Date.now() }); },
      kf5Slett: d => { F.pf.d5.deler.splice(Number(d.i), 1); }
    }
  };
  F.koble(document.getElementById('side'));
  F.tegn();
}
