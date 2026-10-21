/* ──────────────────────────────────────────────────────────────────
   Steg 5: Vedlegg og steg 6: Kundeopplysninger
   ────────────────────────────────────────────────────────────────── */

const filStr = b => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

STEG.vedlegg = {
  vedFil: input => {
    const pf = F.pf;
    [...input.files].forEach(f => pf.vedlegg.push({ id: S.nyId(), kategori: input.dataset.kategori, tittel: f.name, storrelse: f.size }));
    F.lagre();
    F.tegn();
  },

  tegn: pf => {
    pf.vedlegg = pf.vedlegg || [];
    return `
      <h2 class="e-h2">Vedlegg</h2>
      <p>Last opp dokumentasjonen vi trenger for å behandle søknaden. Hvilke vedlegg som kreves, kommer an på svarene dine i søknaden.</p>
      ${S.vedleggskrav(pf).map(k => {
        const filer = pf.vedlegg.filter(v => v.kategori === k.id);
        const id = F.id(`vedlegg-${k.id}`);
        return `<div class="e-vedlegg${F.harFeil(`vedlegg-${k.id}`) ? ' e-felt--feil' : ''}" data-feltboks="vedlegg-${k.id}" id="${F.id(`vedlegg-${k.id}`)}-boks">
          <div class="e-vedlegg__topp">
            <div><h3>${k.tittel}</h3>${k.hjelp ? `<div class="e-liten e-sekundaer">${/^\s*</.test(k.hjelp) ? k.hjelp : `<p class="e-mb0">${k.hjelp}</p>`}</div>` : ''}</div>
            <div><label class="e-knapp e-knapp--liten" for="${id}">${E_IKON.opplasting}Last opp</label>
              <input type="file" id="${id}" data-kategori="${k.id}" multiple aria-label="Last opp ${k.tittel}"></div>
          </div>
          ${filer.length ? `<ul class="e-filer">${filer.map(v => `<li class="e-fil"><span class="e-fil__navn">${E_IKON.fil}${eEsc(v.tittel)} <span class="e-sekundaer">${filStr(v.storrelse)}</span></span>
            <button type="button" class="e-knapp e-knapp--ikon e-knapp--subtil-destruktiv" data-handling="slettFil" data-id="${v.id}" aria-label="Slett ${eEsc(v.tittel)}">${E_IKON.soppel}</button></li>`).join('')}</ul>` : ''}
          ${F.feilHtml(`vedlegg-${k.id}`)}
        </div>`;
      }).join('')}
      <p class="e-liten e-sekundaer e-mt">Prototype: filene lastes ikke opp noe sted. Bare navnet og størrelsen lagres i nettleseren.</p>
      ${F.sammendrag()}
      ${W.knapper()}`;
  },

  valider: pf => S.vedleggskrav(pf).filter(k => !(pf.vedlegg || []).some(v => v.kategori === k.id))
    .map(k => ({ nokkel: `vedlegg-${k.id}`, melding: `Du må laste opp ${k.tittel.toLowerCase()}.` })),

  handlinger: {
    slettFil: async (d, pf) => {
      const v = pf.vedlegg.find(x => x.id === Number(d.id));
      const ok = await eBekreft({ tittel: 'Bekreft sletting', tekst: `Er du sikker på at du vil slette <b>${eEsc(v.tittel)}</b>?`, bekreft: 'Slett', destruktiv: true });
      if (!ok) return false;
      pf.vedlegg = pf.vedlegg.filter(x => x !== v);
      return true;
    }
  }
};

STEG.kundeopplysninger = {
  kanGaaVidere: pf => pf.kundeskjema === 'ok' || (pf.kundeskjema === 'gammel' && pf.bekreftKundeskjema),

  tegn: pf => {
    const kunde = S.aktivKunde(pf);
    const navn = eEsc(kunde.orgNavn);
    const status = pf.kundeskjema;
    const gammelDato = eDato(new Date(Date.now() - 400 * 864e5));
    return `
      <h2 class="e-h2">Kundeopplysninger</h2>
      ${!status ? `
        ${eCallout('info', `<p>For å kunne behandle søknaden må vi ha tilstrekkelige kundeopplysninger om ${navn}. Du må derfor registrere disse før du kan gå videre.</p>`)}
        <p><button type="button" class="e-knapp e-knapp--prominent" data-handling="registrer">Registrer kundeopplysninger</button></p>
        <p class="e-liten e-sekundaer">Prototype: <button type="button" class="e-knapp e-knapp--lenke" data-handling="gammel">Vis hvordan det ser ut når ${navn} har et eldre, signert kundeskjema</button></p>` : ''}
      ${status === 'ok' ? eCallout('info', `<p>Vi har mottatt kundeopplysninger fra ${navn}. Du kan derfor gå videre og sende inn søknaden</p>`) : ''}
      ${status === 'gammel' ? `
        ${eCallout('info', `<p>Vi mottok signerte kundeopplysninger for ${navn} ${gammelDato}. Før du kan sende inn søknaden må du bekrefte at disse er riktige og oppdaterte, eller endre og sende inn oppdaterte kundeopplysninger.</p>`)}
        <div class="e-kundeskjema"><div class="e-kundeskjema__ark">
          <h3 class="e-h3">Kundeopplysninger for ${navn}</h3>
          <dl class="e-dl"><dt>Organisasjonsnummer</dt><dd>${eOrgnr(kunde.orgNr)}</dd><dt>Daglig leder</dt><dd>Kari Nordmann</dd>
            <dt>Reelle rettighetshavere</dt><dd>Kari Nordmann (60 %), Per Hansen (40 %)</dd><dt>Signert</dt><dd>${gammelDato}</dd></dl>
          <p class="e-sekundaer e-mb0">Oppdiktet eksempel på et innsendt kundeskjema.</p>
        </div></div>
        ${F.sjekk({ felt: 'bekreftKundeskjema', label: 'Jeg bekrefter at de registrerte kundeopplysningene er riktige og oppdaterte.' })}
        <p><button type="button" class="e-knapp" data-handling="registrer">Endre kundeopplysningene</button></p>` : ''}
      ${W.knapper({ nesteDeaktivert: !STEG.kundeopplysninger.kanGaaVidere(pf) })}`;
  },

  valider: () => [],

  handlinger: {
    registrer: async (d, pf) => {
      const ok = await eBekreft({ tittel: 'Kundeskjemaet er en egen løsning',
        tekst: 'I dag sendes du videre til kundeskjemaet, der du fyller ut og signerer kundeopplysningene, og kommer tilbake hit etterpå. Det er ikke med i prototypen. Vi later som kundeskjemaet er fylt ut og signert.',
        bekreft: 'Fyll ut og signer', avbryt: 'Avbryt' });
      if (!ok) return false;
      pf.kundeskjema = 'ok';
      delete pf.bekreftKundeskjema;
      return true;
    },
    gammel: (d, pf) => { pf.kundeskjema = 'gammel'; }
  }
};
