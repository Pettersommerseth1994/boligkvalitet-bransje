/* ──────────────────────────────────────────────────────────────────
   Steg 1: Prosjekt (prosjektinformasjon)
   ────────────────────────────────────────────────────────────────── */

const naaMnd = () => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); };
const mndTekst = n => `${eTo((n % 12) + 1)}.${Math.floor(n / 12)}`;

const P = {
  selskap: pf => (pf.lantaker && pf.lantaker.orgNavn) || pf.soker.orgNavn,
  visPeriode: pf => !S.er(pf, 'KJOP'),
  visKjop: pf => !S.er(pf, 'KJOP'),
  visOmsatt: pf => S.er(pf, 'KJOP') || pf.kjop === true,
  visArbeid: pf => !S.er(pf, 'KJOP'),
  visSelger: pf => S.er(pf, 'KJOP') || pf.kjop === true,
  visMalgrupper: pf => S.utleie(pf) && S.harAvtale(pf),
  visKontaktKommune: pf => S.harAvtale(pf),
  visHusbanken: pf => !S.er(pf, 'KJOP')
};

const NAERSTAENDE_HJELP = pf => `<p>Mulige relasjoner:</p><ul>
  <li>Daglig leder</li><li>Styremedlemmer</li><li>Eiere/aksjeeiere</li>
  <li>Nærstående jf. <a href="https://lovdata.no/NL/lov/1997-06-13-44/§1-5" target="_blank" rel="noopener">aksjeloven § 1-5 (1) (åpner i ny fane)</a> til daglig leder, styremedlemmer, eiere/aksjeeiere (med mer enn 5% eierandel)</li>
  <li>Virksomhet som <b>${eEsc(pf.soker.orgNavn)}</b> eller noen av de som er nevnt ovenfor direkte eller indirekte eier eller kontrollerer (mer enn 5% av eierandelene eller stemmene)</li></ul>`;

const KJOP_LABEL = { OPPFORING: ['Skal dere kjøpe tomten, eller eier dere den fra før?', 'Du må krysse av for om dere skal kjøpe tomten eller eier den fra før.'],
  OMBYGGING: ['Skal dere kjøpe bygget, eller eier dere det fra før?', 'Du må krysse av for om dere skal kjøpe bygget eller eier det fra før.'],
  OPPGRADERING: ['Skal dere kjøpe boligene, eller eier dere dem fra før?', 'Du må krysse av for om dere skal kjøpe boligene eller eier dem fra før.'] };

STEG.prosjektinformasjon = {
  vedEndring: (felt, pf) => {
    if (felt === 'naerstaendeArbeid') pf.naerstaendeArbeidUtforesAv = pf.naerstaendeArbeid ? (pf.naerstaendeArbeidUtforesAv && pf.naerstaendeArbeidUtforesAv.length ? pf.naerstaendeArbeidUtforesAv : [{ id: S.nyId() }]) : [];
    if (felt === 'naerstaendeSelger') pf.naerstaendeSelgere = pf.naerstaendeSelger ? (pf.naerstaendeSelgere && pf.naerstaendeSelgere.length ? pf.naerstaendeSelgere : [{ id: S.nyId() }]) : [];
    if (!P.visOmsatt(pf)) delete pf.omsattApentMarked;
    if (!P.visSelger(pf)) { delete pf.naerstaendeSelger; pf.naerstaendeSelgere = []; }
    if (pf.forbildeprosjekt !== true) delete pf.forbildeInfo;
    if (pf.navn !== undefined) W.tegnSkall();
  },

  tegn: pf => {
    const periode = (() => {
      const a = V.mnd(pf.oppstart); const b = V.mnd(pf.ferdig);
      return a && b && V.mndTall(b) > V.mndTall(a) ? `${V.mndTall(b) - V.mndTall(a)} måneder` : 'Ingen periode valgt';
    })();
    const [kjopLabel] = KJOP_LABEL[pf.prosjektTiltakKode] || ['Skal dere kjøpe, eller eier dere fra før?'];
    return `
      ${F.tekst({ felt: 'navn', label: 'Prosjektnavn', maks: 36, bredde: 'l' }).replace('data-type="tekst"', 'data-type="tekst" data-levende')}

      ${P.visPeriode(pf) ? eKort({ tittel: 'Når skal bygningsarbeidet foregå?', kropp: `
        ${eCallout('info', '<p>Maksimal tillatt varighet er 24 måneder</p>')}
        <div class="e-to">
          ${F.mnd({ felt: 'oppstart', label: 'Planlagt oppstart', hjelp: 'Husbanken gir ikke lån til prosjekter der arbeidet har startet.' })}
          ${F.mnd({ felt: 'ferdig', label: 'Planlagt ferdigstilt' })}
        </div>
        <span class="e-felt__label">Valgt periode</span><p class="e-fet e-mb0">${periode}</p>` }) : ''}

      ${P.visKjop(pf) ? F.radio({ felt: 'kjop', label: kjopLabel, rad: true, valg: [{ v: true, l: 'Kjøp' }, { v: false, l: 'Eier fra før' }] }) : ''}
      ${S.er(pf, 'KJOP') ? F.radio({ felt: 'eksisterendeBoligmasse', label: 'Er boligene du skal kjøpe nye eller brukte?', rad: true, valg: [{ v: true, l: 'Brukte boliger' }, { v: false, l: 'Nye boliger' }] }) : ''}
      ${P.visOmsatt(pf) ? F.janei({ felt: 'omsattApentMarked', label: 'Er eiendommen omsatt i det åpne markedet?' }) : ''}
      ${F.janei({ felt: 'sentralGodkjenning', label: `Har ${eEsc(P.selskap(pf))} sentral godkjenning?` })}

      ${P.visArbeid(pf) ? `
        ${F.janei({ felt: 'naerstaendeArbeid', label: `Skal arbeid utføres av foretak med relasjon til ${eEsc(pf.soker.orgNavn)}?`, hjelp: NAERSTAENDE_HJELP(pf) })}
        ${pf.naerstaendeArbeid ? `${(pf.naerstaendeArbeidUtforesAv || []).map((x, i) => eKort({ tittel: 'Arbeid utføres av', niva: 3, klasse: 'e-kort--inn',
          kropp: F.orgnr({ felt: `naerstaendeArbeidUtforesAv.${i}.orgNr` }),
          bunn: `<button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="slettArbeid" data-i="${i}">${E_IKON.soppel}Slett</button>` })).join('')}
          <p><button type="button" class="e-knapp" data-handling="leggTilArbeid">${E_IKON.pluss}Legg til</button></p>` : ''}` : ''}

      ${P.visSelger(pf) ? `
        ${F.janei({ felt: 'naerstaendeSelger', label: `Har ${eEsc(pf.soker.orgNavn)} noen relasjon til selger?`, hjelp: NAERSTAENDE_HJELP(pf) })}
        ${pf.naerstaendeSelger ? `${(pf.naerstaendeSelgere || []).map((x, i) => eKort({ tittel: `Selger ${x.orgNr && V.orgnr(x.orgNr) ? x.orgNr : ''}`, niva: 3, klasse: 'e-kort--inn',
          kropp: `<p>Fyll inn organisasjonsnummer hvis selger er et foretak<br>eller fornavn og etternavn hvis selger er en person.</p>
            ${F.orgnr({ felt: `naerstaendeSelgere.${i}.orgNr` })}
            <p class="e-fet">eller</p>
            ${F.tekst({ felt: `naerstaendeSelgere.${i}.fulltNavn`, label: 'Fornavn og etternavn', maks: 200 })}
            ${F.gruppefeil(`selger-${i}`)}`,
          bunn: `<button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="slettSelger" data-i="${i}">${E_IKON.soppel}Slett</button>` })).join('')}
          <p><button type="button" class="e-knapp" data-handling="leggTilSelger">${E_IKON.pluss}Legg til</button></p>` : ''}` : ''}

      ${P.visMalgrupper(pf) ? F.avkryss({ felt: 'malgrupper', label: 'Hvem skal boligene leies ut til?',
        hjelp: `<p>En person regnes som flyktning så lenge kommunen mottar integreringstilskudd for han/henne. Integreringstilskuddet mottas i fem år etter første bosetting i kommunen.</p>
          <p>Mennesker som har psykiske helseproblemer og/eller rusmiddelproblemer som trenger hjelp til å skaffe seg bolig eller beholde den boligen de har.</p>
          <p>Mennesker i en vanskelig bosituasjon kan være de som trenger hjelp til å skaffe seg bolig på grunn av dårlig økonomi, nedsatt funksjonsevne, helsemessige- eller sosiale problemer, dårlige kunnskaper om det norske boligmarkedet eller liknende forhold. Disse kan befinne seg i en av følgende situasjoner:</p>
          <ul><li>Er uten egen bolig</li><li>Står i fare for å miste boligen sin</li><li>Bor i en bolig eller bomiljø som ikke egner seg</li></ul>`,
        valg: [{ v: 'FLYKTNINGER', l: 'Flyktninger' }, { v: 'RUSPSYKISKEPROBLEMER', l: 'Mennesker med rus- og psykiske lidelser' }, { v: 'OVRIGEVANSKELIGSTILTE', l: 'Mennesker i en vanskelig bosituasjon' }] }) : ''}

      ${P.visKontaktKommune(pf) ? eKort({ tittel: 'Kontaktperson i kommune eller helseforetak', kropp: `
        <p>Dere har en avtale med en kommune eller helseforetak. Vi vil gjerne vite hvem vi kan ta kontakt med om vi lurer på noe rundt denne avtalen.</p>
        ${F.orgnr({ felt: 'kontaktpersonSamarbeidspartner.orgNr' })}
        ${F.tekst({ felt: 'kontaktpersonSamarbeidspartner.navn', label: 'Navn på kontaktperson', maks: 100 })}
        ${F.tekst({ felt: 'kontaktpersonSamarbeidspartner.epost', label: 'E-post', autocomplete: 'email' })}
        ${F.tekst({ felt: 'kontaktpersonSamarbeidspartner.telefon', label: 'Telefonnummer', bredde: 'm', inputmode: 'tel' })}
        ${F.gruppefeil('kontaktKommune')}` }) : ''}

      ${P.visHusbanken(pf) ? `
        ${F.janei({ felt: 'forbildeprosjekt', label: 'Har dere vært i kontakt med Husbanken om prosjektet tidligere?' })}
        ${pf.forbildeprosjekt ? eKort({ tittel: 'Saksreferanse eller kontaktperson', niva: 3, klasse: 'e-kort--inn', kropp: `
          <p>Skriv inn saksreferanse og/eller kontaktperson i Husbanken dere har diskutert prosjektet med.</p>
          ${F.tekst({ felt: 'forbildeInfo.saksreferanse', label: 'Saksreferanse', maks: 36, bredde: 'm' })}
          ${F.tekst({ felt: 'forbildeInfo.navn', label: 'Navn på kontaktperson i Husbanken', maks: 36 })}
          ${F.gruppefeil('forbilde')}` }) : ''}` : ''}

      ${eKort({ tittel: 'Kontaktperson', kropp: `
        <p>Skriv inn kontakpersonen til prosjektet</p>
        ${F.tekst({ felt: 'kontaktinformasjon.navn', label: 'Fullt navn', maks: 36, autocomplete: 'name' })}
        ${F.tekst({ felt: 'kontaktinformasjon.epost', label: 'Epost', autocomplete: 'email' })}
        ${F.tekst({ felt: 'kontaktinformasjon.telefonNr', label: 'Telefonnummer', maks: 8, bredde: 'm', inputmode: 'tel' })}` })}

      ${F.sammendrag()}
      ${W.knapper()}`;
  },

  valider: pf => {
    const f = [];
    const feil = (nokkel, melding) => f.push({ nokkel, melding });
    if (V.tom(pf.navn)) feil('navn', 'Du må gi prosjektet et navn.');
    else if (!V.navn(pf.navn)) feil('navn', 'Prosjektnavn kan bare inneholde bokstaver og tall.');

    if (P.visPeriode(pf)) {
      const naa = naaMnd();
      const a = V.mnd(pf.oppstart); const b = V.mnd(pf.ferdig);
      if (V.tom(pf.oppstart)) feil('oppstart', 'Du må velge måned og år for planlagt oppstart.');
      else if (!a) feil('oppstart', 'Dato format er feil. Dato må være på format MM.ÅÅÅÅ');
      else if (V.mndTall(a) < naa + 1) feil('oppstart', 'Planlagt oppstart må være etter dagens dato.');
      else if (V.mndTall(a) > naa + 12) feil('oppstart', 'Planlagt oppstart må være maks 1 år etter dagens dato.');
      const min = a ? V.mndTall(a) + 1 : naa + 2;
      const maks = a ? V.mndTall(a) + 24 : naa + 26;
      if (V.tom(pf.ferdig)) feil('ferdig', 'Du må velge måned og år for planlagt ferdigstillelse.');
      else if (!b) feil('ferdig', 'Dato format er feil. Dato må være på format MM.ÅÅÅÅ');
      else if (a && V.mndTall(b) <= V.mndTall(a)) feil('ferdig', 'Planlagt ferdigstillelse må være etter Planlagt oppstart');
      else if (V.mndTall(b) < min) feil('ferdig', 'Planlagt ferdigstillingsdato må være etter dagens dato.');
      else if (V.mndTall(b) > maks) feil('ferdig', 'Planlagt ferdigstillingsdato må være maks 2 år etter dagens dato.');
    }
    if (P.visKjop(pf) && pf.kjop == null) feil('kjop', (KJOP_LABEL[pf.prosjektTiltakKode] || [])[1] || 'Du må krysse av for om du skal kjøpe eller eier fra før.');
    if (S.er(pf, 'KJOP') && pf.eksisterendeBoligmasse == null) feil('eksisterendeBoligmasse', 'Du må krysse av for om det er nye eller brukte boliger.');
    if (P.visOmsatt(pf) && pf.omsattApentMarked == null) feil('omsattApentMarked', 'Du må krysse av for om eiendommen er omsatt i det åpne markedet eller ikke.');
    if (pf.sentralGodkjenning == null) feil('sentralGodkjenning', 'Du må krysse av for om dere har sentral godkjenning.');

    if (P.visArbeid(pf)) {
      if (pf.naerstaendeArbeid == null) feil('naerstaendeArbeid', 'Du må krysse av for om det skal brukes nærstående.');
      if (pf.naerstaendeArbeid) (pf.naerstaendeArbeidUtforesAv || []).forEach((x, i) => {
        const m = vOrgnr(x.orgNr); if (m) feil(`naerstaendeArbeidUtforesAv.${i}.orgNr`, m);
      });
    }
    if (P.visSelger(pf)) {
      if (pf.naerstaendeSelger == null) feil('naerstaendeSelger', 'Du må krysse av for om selger er nærstående.');
      if (pf.naerstaendeSelger) (pf.naerstaendeSelgere || []).forEach((x, i) => {
        const harNr = !V.tom(x.orgNr); const harNavn = !V.tom(x.fulltNavn);
        if (harNr === harNavn) feil(`selger-${i}`, 'Du må fylle inn enten fullt navn eller organisasjonsnummer (ikke begge deler).');
        else if (harNr) { const m = vOrgnr(x.orgNr); if (m) feil(`naerstaendeSelgere.${i}.orgNr`, m); }
      });
    }
    if (P.visMalgrupper(pf) && V.tom(pf.malgrupper)) feil('malgrupper', 'Du må krysse av for hvem boligene skal leies ut til.');
    if (P.visKontaktKommune(pf)) {
      const k = pf.kontaktpersonSamarbeidspartner || {};
      const m = vOrgnr(k.orgNr, { sjekk: fo => (['KOMM', 'KF'].includes(fo.orgform) || ['6100', '1120', '1110'].includes(fo.sektor) ? null : 'Foretaket er ikke en kommune eller et statlig helseforetak.') });
      if (m) feil('kontaktpersonSamarbeidspartner.orgNr', m);
      if (V.tom(k.navn)) feil('kontaktpersonSamarbeidspartner.navn', 'Du må skrive navn på kontaktperson i kommune eller helseforetak.');
      if (!V.tom(k.epost) && !V.epost(k.epost)) feil('kontaktpersonSamarbeidspartner.epost', 'Du må skrive en gyldig e-postadresse.');
      if (!V.tom(k.telefon) && !V.telefon(k.telefon)) feil('kontaktpersonSamarbeidspartner.telefon', 'Du må skrive et gyldig telefonnummer.');
      if (V.tom(k.epost) && V.tom(k.telefon)) feil('kontaktKommune', 'Du må skrive telefonnummer eller e-postadresse.');
    }
    if (P.visHusbanken(pf)) {
      if (pf.forbildeprosjekt == null) feil('forbildeprosjekt', 'Du må krysse av for om dere har vært i kontakt med Husbanken om prosjektet tidligere.');
      if (pf.forbildeprosjekt && V.tom((pf.forbildeInfo || {}).saksreferanse) && V.tom((pf.forbildeInfo || {}).navn)) feil('forbilde', 'Du må skrive enten saksreferanse eller navn på kontaktperson.');
    }
    const k = pf.kontaktinformasjon || {};
    if (V.tom(k.navn)) feil('kontaktinformasjon.navn', 'Navn må fylles ut');
    if (V.tom(k.epost)) feil('kontaktinformasjon.epost', 'Epost må fylles ut');
    else if (!V.epost(k.epost)) feil('kontaktinformasjon.epost', 'Du må skrive en gyldig e-postadresse.');
    if (V.tom(k.telefonNr)) feil('kontaktinformasjon.telefonNr', 'Telefonnummer må fylles ut');
    else if (!V.telefon(k.telefonNr)) feil('kontaktinformasjon.telefonNr', 'Du må skrive et gyldig telefonnummer.');
    return f;
  },

  handlinger: {
    leggTilArbeid: (d, pf) => { pf.naerstaendeArbeidUtforesAv.push({ id: S.nyId() }); },
    slettArbeid: (d, pf) => {
      pf.naerstaendeArbeidUtforesAv.splice(Number(d.i), 1);
      if (!pf.naerstaendeArbeidUtforesAv.length) pf.naerstaendeArbeid = false;
    },
    leggTilSelger: (d, pf) => { pf.naerstaendeSelgere.push({ id: S.nyId() }); },
    slettSelger: (d, pf) => {
      pf.naerstaendeSelgere.splice(Number(d.i), 1);
      if (!pf.naerstaendeSelgere.length) pf.naerstaendeSelger = false;
    }
  }
};
