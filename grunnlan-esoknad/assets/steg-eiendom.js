/* ──────────────────────────────────────────────────────────────────
   Steg 2: Eiendom (eiendomsopplysninger)
   ────────────────────────────────────────────────────────────────── */

const EI = {
  hentet: e => e.fraMatrikkelen === true || e.fraMatrikkelen === false,
  egendefinert: pf => S.er(pf, 'OPPFORING', 'OMBYGGING'),
  kommuneFraTekst: tekst => {
    const s = String(tekst || '').trim().toLowerCase();
    if (!s) return null;
    return E_KOMMUNER.find(k => `${k.navn} (${k.nr})`.toLowerCase() === s || k.navn.toLowerCase() === s || k.nr === s) || null;
  },
  nyEiendom: () => ({ id: S.nyId(), bygg: [] })
};

STEG.eiendomsopplysninger = {
  foer: pf => { if (!pf.eiendommer || !pf.eiendommer.length) pf.eiendommer = [EI.nyEiendom()]; },

  vedEndring: (felt, pf) => {
    const m = /^eiendommer\.(\d+)\.kommuneSok$/.exec(felt);
    if (m) {
      const e = pf.eiendommer[Number(m[1])];
      const k = EI.kommuneFraTekst(e.kommuneSok);
      e.kommuneNr = k ? k.nr : undefined;
    }
    const alle = /^eiendommer\.(\d+)\.bygg\.(\d+)\.velgAlle$/.exec(felt);
    if (alle) {
      const b = pf.eiendommer[Number(alle[1])].bygg[Number(alle[2])];
      b.adresserFraMatrikkelen.forEach(a => { if (a.veiNavn) a.enabled = !!b.velgAlle || undefined; });
      delete b.velgAlle;
    }
  },

  ikkeAdresser: pf => S.er(pf, 'KJOP') && pf.eiendommer.some(e => e.finnerIkkeAdresse),
  kanGaaVidere: pf => pf.eiendommer.every(EI.hentet) && !STEG.eiendomsopplysninger.ikkeAdresser(pf),

  tegn: pf => {
    const ikkeHentet = pf.eiendommer.some(e => !EI.hentet(e));
    return `
      ${pf.eiendommer.map((e, i) => F.trekkspill({ nokkel: `eiendom-${e.id}`, tittel: EI.hentet(e) ? S.eiendomTittel(e) : 'Legg til eiendom du ønsker å finansiere',
        kropp: EI.hentet(e) ? eiendomHentet(pf, e, i) : eiendomNy(pf, e, i) })).join('')}
      ${pf.eiendommer.length ? '' : '<p>Du har ikke lagt til noen eiendommer ennå</p>'}
      <p><button type="button" class="e-knapp" data-handling="leggTilEiendom">${E_IKON.pluss}Legg til eiendom</button></p>
      ${F.sammendrag()}
      ${F.visFeil && ikkeHentet ? eCallout('feil', '<p>Du må hente eiendomsinformasjon</p>') : ''}
      ${W.knapper({ nesteDeaktivert: STEG.eiendomsopplysninger.ikkeAdresser(pf) })}`;
  },

  valider: pf => {
    const f = [];
    const feil = (nokkel, melding) => f.push({ nokkel, melding });
    const hentede = pf.eiendommer.filter(EI.hentet);
    pf.eiendommer.forEach((e, i) => {
      const p = `eiendommer.${i}`;
      if (!EI.hentet(e)) {
        eiendomFeltFeil(e, i).forEach(x => f.push(x));
        return;
      }
      let valgt = 0;
      e.bygg.forEach((b, j) => {
        const bp = `${p}.bygg.${j}`;
        const harValgt = S.valgteAdresser(b).length > 0;
        valgt += S.valgteAdresser(b).length;
        if (b.fraMatrikkelen && harValgt && S.kjentType(b) && b.erBygningstypeFraMatrikkelenRiktig == null) feil(`${bp}.erBygningstypeFraMatrikkelenRiktig`, 'Du må svare på om bygningstype fra Matrikkelen stemmer med prosjektert bygningstype');
        if (visProsjektert(pf, b) && harValgt && V.tom(b.bygningstypeProsjektert)) feil(`${bp}.bygningstypeProsjektert`, 'Du må velge prosjektert bygningstype');
        if (!b.fraMatrikkelen && !harValgt) feil(`${bp}-adresser`, 'Du må velge minst én adresse til et bygg som skal være med på søknaden');
        (b.adresser || []).forEach((a, k) => {
          const ap = `${bp}.adresser.${k}`;
          if (V.tom(a.veiNavn)) feil(`${ap}.veiNavn`, 'Veinavn må fylles ut');
          if (V.tom(a.veiNummer)) feil(`${ap}.veiNummer`, 'Veinummer må fylles ut');
          else if (!V.heltall(a.veiNummer)) feil(`${ap}.veiNummer`, 'Veinummer må være et tall');
          if (!V.tom(a.veiBokstav) && !/^[a-zæøå]$/i.test(a.veiBokstav)) feil(`${ap}.veiBokstav`, 'Veibokstav har feil format, feltet kan kun inneholde en bokstav');
          const like = S.alleValgteAdresser(pf).filter(x => !x.a.fraMatrikkelen && S.adresseTekst(x.a).toLowerCase() === S.adresseTekst(a).toLowerCase() && a.veiNavn);
          if (like.length > 1 && like[0].a !== a) feil(`${ap}.veiNavn`, 'Du kan ikke legge til samme adresse mer enn én gang');
        });
      });
      if (!valgt) feil(`${p}-velg`, 'Du må velge minst ett bygg og én adresse per eiendom');
      if (hentede[0] && e !== hentede[0] && e.kommuneNr !== hentede[0].kommuneNr) feil(`${p}-velg`, 'Du kan ikke registrere eiendommer i ulike kommuner på samme søknad. Denne eiendommen må sendes inn som egen søknad');
      const lik = hentede.find(x => x !== e && S.eiendomTittel(x) === S.eiendomTittel(e) && hentede.indexOf(x) < hentede.indexOf(e));
      if (lik) feil(`${p}-velg`, 'Du kan ikke legge til samme eiendom mer enn én gang');
    });
    return f;
  },

  handlinger: {
    leggTilEiendom: (d, pf) => { pf.eiendommer.push(EI.nyEiendom()); },
    hent: async (d, pf) => {
      const i = Number(d.i);
      const e = pf.eiendommer[i];
      ['festeNr', 'seksjonsNr'].forEach(k => { if (V.tom(e[k])) e[k] = '0'; });
      if (eiendomFeltFeil(e, i).length) {
        W.pf.forsokt = { ...(W.pf.forsokt || {}), eiendomsopplysninger: true };
        F.visFeil = true;
        return true;
      }
      const ferdig = eSpinner('Henter eiendomsinformasjon');
      await eVent(700);
      ferdig();
      Object.assign(e, eMatrikkel(e, S.nyId));
      e.skalVisesIListeMedAlleBygg = false;
      delete e.kommuneSok;
      return true;
    },
    slettEiendom: async (d, pf) => {
      const e = pf.eiendommer[Number(d.i)];
      const navn = EI.hentet(e) ? `<b>${eEsc(S.eiendomTittel(e))}</b>` : 'eiendommen';
      const ok = await eBekreft({ tittel: 'Bekreft sletting av eiendommen', tekst: `Er du sikker på at du vil slette ${navn}?`, bekreft: 'Slett', destruktiv: true });
      if (!ok) return false;
      const adresser = new Set(e.bygg.flatMap(b => [...(b.adresserFraMatrikkelen || []), ...(b.adresser || [])].map(a => a.id)));
      pf.boenheter = (pf.boenheter || []).filter(fo => !adresser.has(fo.adresseId));
      pf.eiendommer.splice(Number(d.i), 1);
      if (!pf.eiendommer.length) pf.eiendommer.push(EI.nyEiendom());
      return true;
    },
    leggTilBygg: (d, pf) => {
      pf.eiendommer[Number(d.i)].bygg.push({ id: S.nyId(), navn: 'Egendefinert bygg', fraMatrikkelen: false, visForValgtTiltak: true, adresserFraMatrikkelen: [], adresser: [] });
    },
    slettBygg: async (d, pf) => {
      const ok = await eBekreft({ tittel: 'Bekreft sletting av bygg', tekst: 'Er du sikker på at du vil slette bygget?', bekreft: 'Slett', destruktiv: true });
      if (!ok) return false;
      const e = pf.eiendommer[Number(d.i)];
      const b = e.bygg[Number(d.j)];
      const adresser = new Set((b.adresser || []).map(a => a.id));
      pf.boenheter = (pf.boenheter || []).filter(fo => !adresser.has(fo.adresseId));
      e.bygg.splice(Number(d.j), 1);
      return true;
    },
    leggTilAdresse: (d, pf) => {
      pf.eiendommer[Number(d.i)].bygg[Number(d.j)].adresser.push({ id: S.nyId(), enabled: true, fraMatrikkelen: false });
    },
    slettAdresse: (d, pf) => {
      const liste = pf.eiendommer[Number(d.i)].bygg[Number(d.j)].adresser;
      const [a] = liste.splice(Number(d.k), 1);
      pf.boenheter = (pf.boenheter || []).filter(fo => fo.adresseId !== a.id);
    }
  }
};

/* Kommune, gårds- og bruksnummer før oppslaget */
function eiendomFeltFeil(e, i) {
  const f = [];
  const p = `eiendommer.${i}`;
  const tall = (felt, navn, maks, paakrevd) => {
    const v = e[felt];
    if (V.tom(v)) { if (paakrevd) f.push({ nokkel: `${p}.${felt}`, melding: `${navn} må fylles ut` }); return; }
    if (!V.heltall(v)) f.push({ nokkel: `${p}.${felt}`, melding: `${navn} må være et tall` });
    else if (eNum(v) > maks) f.push({ nokkel: `${p}.${felt}`, melding: `${navn} må inneholde et lavere tall` });
  };
  if (!e.kommuneNr) f.push({ nokkel: `${p}.kommuneSok`, melding: V.tom(e.kommuneSok) ? 'Kommunenavn må fylles ut' : 'Velg en kommune fra listen' });
  tall('gaardsNr', 'Gårdsnr.', 99999, true);
  tall('bruksNr', 'Bruksnr.', 9999, true);
  tall('festeNr', 'Festenr.', 9999, false);
  tall('seksjonsNr', 'Seksjonsnr.', 9999, false);
  return f;
}

function eiendomNy(pf, e, i) {
  const p = `eiendommer.${i}`;
  if (e.kommuneSok == null && e.kommuneNr) e.kommuneSok = S.kommuneTekst(e);
  return `
    <div class="e-rutenett" style="grid-template-columns:minmax(12rem,2fr) repeat(4,minmax(7rem,1fr))">
      <div class="e-felt${F.harFeil(`${p}.kommuneSok`) ? ' e-felt--feil' : ''}" data-feltboks="${p}.kommuneSok">
        <label class="e-felt__label" for="${F.id(`${p}.kommuneSok`)}">Kommune</label>
        <input class="e-input" id="${F.id(`${p}.kommuneSok`)}" list="kommuner-${i}" data-felt="${p}.kommuneSok" data-type="tekst" value="${eEsc(e.kommuneSok || '')}" autocomplete="off">
        <datalist id="kommuner-${i}">${E_KOMMUNER.map(k => `<option value="${k.navn} (${k.nr})"></option>`).join('')}</datalist>
        ${F.feilHtml(`${p}.kommuneSok`)}
      </div>
      ${F.tall({ felt: `${p}.gaardsNr`, label: 'Gårdsnr.', bredde: 'l' })}
      ${F.tall({ felt: `${p}.bruksNr`, label: 'Bruksnr.', bredde: 'l' })}
      ${F.tall({ felt: `${p}.festeNr`, label: 'Festenr. (valgfritt)', bredde: 'l' })}
      ${F.tall({ felt: `${p}.seksjonsNr`, label: 'Seksjonsnr. (valgfritt)', bredde: 'l' })}
    </div>
    <div class="e-knappegruppe e-mt">
      <button type="button" class="e-knapp" data-handling="hent" data-i="${i}">Hent eiendomsinformasjon</button>
      <button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="slettEiendom" data-i="${i}">${E_IKON.soppel}Slett eiendommen</button>
    </div>`;
}

const visProsjektert = (pf, b) => !b.fraMatrikkelen || !S.kjentType(b) || b.erBygningstypeFraMatrikkelenRiktig === false;

function eiendomHentet(pf, e, i) {
  const p = `eiendommer.${i}`;
  const skjulte = e.bygg.some(b => b.visForValgtTiltak === false);
  const synlige = e.bygg.map((b, j) => ({ b, j })).filter(({ b }) => e.skalVisesIListeMedAlleBygg === true || b.visForValgtTiltak !== false);
  return `
    <div class="e-rutenett" style="margin-bottom:var(--space-5)">
      ${F.les('Kommune', eEsc(S.kommuneTekst(e)))}${F.les('Gårdsnr.', e.gaardsNr)}${F.les('Bruksnr.', e.bruksNr)}
      ${F.les('Festenr.', e.festeNr ?? 0)}${F.les('Seksjonsnr.', e.seksjonsNr ?? 0)}
    </div>
    ${e.fraMatrikkelen === false ? eCallout('feil', '<p class="e-fet e-mb0">Ingen treff i matrikkelen</p><p>Vi fant ingen treff i matrikkelen på dette gårds- og bruksnummeret.</p>') : ''}
    ${!S.er(pf, 'OMBYGGING') && e.fraMatrikkelen === true ? `
      <span class="e-felt__label">Bygg på eiendommen</span>
      ${skjulte ? `<p class="e-felt__hjelp">Vi viser i utgangspunktet kun bygninger registrert til boligformål. Hvis du ikke finner bygget du leter etter kan du endre visningen for å se alle bygg.</p>
        ${F.radio({ felt: `${p}.skalVisesIListeMedAlleBygg`, label: '<span class="e-sr">Visning av bygg</span>', rad: true, valg: [{ v: true, l: 'Vis alle bygninger' }, { v: false, l: 'Vis kun bygninger registrert til boligformål' }] })}` : ''}` : ''}
    ${EI.egendefinert(pf) ? eCallout('info', '<p class="e-fet e-mb0">Egendefinerte adresser</p><p>Du kan søke finansiering til prosjekter som ikke er registrert i matrikkelen. Du må legge inn disse manuelt og legge ved rammetillatelsen senere i søknaden.</p>') : ''}
    ${synlige.map(({ b, j }) => byggKort(pf, e, i, b, j)).join('')}
    ${F.gruppefeil(`${p}-velg`)}
    <div class="e-knappegruppe e-mt">
      ${EI.egendefinert(pf) ? `<button type="button" class="e-knapp" data-handling="leggTilBygg" data-i="${i}">${E_IKON.pluss}Legg til bygg</button>` : ''}
      <button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="slettEiendom" data-i="${i}">${E_IKON.soppel}Slett eiendommen</button>
    </div>`;
}

function byggKort(pf, e, i, b, j) {
  const bp = `eiendommer.${i}.bygg.${j}`;
  const matr = (b.adresserFraMatrikkelen || []).filter(a => a.veiNavn);
  const alleValgt = matr.length && matr.every(a => a.enabled);
  const kropp = `
    ${b.fraMatrikkelen ? `<div class="e-to">
      ${F.les('Bygningstype fra Matrikkelen', eEsc(S.bygningstypeTekst(b)))}
      ${S.kjentType(b) ? F.janei({ felt: `${bp}.erBygningstypeFraMatrikkelenRiktig`, label: 'Stemmer bygningstype fra Matrikkelen med prosjektert bygningstype?' }) : ''}
    </div>` : ''}
    ${visProsjektert(pf, b) ? F.velg({ felt: `${bp}.bygningstypeProsjektert`, label: 'Prosjektert bygningstype',
      beskrivelse: 'Vi vil vite hvilke bygningstyper det skal være på eiendommen ved prosjektets slutt, ikke dagens bygningstype.',
      plassholder: '--- Velg prosjektert bygningstype ---', valg: E_PROSJEKTERT.map(n => ({ v: n, l: E_erProsjektertBlokk(n) ? `${n} (Blokk)` : n })) }) : ''}
    <fieldset class="e-felt" data-feltboks="${bp}-adresser" id="${F.id(`${bp}-adresser`)}">
      <legend>Adresser</legend>
      ${matr.length > 1 ? `<label class="e-valg"><input type="checkbox" data-felt="${bp}.velgAlle" data-type="sjekk" id="${F.id(`${bp}.velgAlle`)}" ${alleValgt ? 'checked' : ''}><span class="e-valg__tekst"><span class="e-fet">Velg</span></span></label>` : ''}
      ${(b.adresserFraMatrikkelen || []).map((a, k) => (a.veiNavn ? `<label class="e-valg"><input type="checkbox" id="${F.id(`${bp}.m.${k}`)}" data-felt="${bp}.adresserFraMatrikkelen.${k}.enabled" data-type="sjekk" ${a.enabled ? 'checked' : ''}><span class="e-valg__tekst"><span>${eEsc(S.adresseTekst(a))}</span></span></label>` : '')).join('')}
      ${(b.adresser || []).length ? `<div class="e-tabell-rulle"><table class="e-tabell" style="margin-top:var(--space-2)">
        <thead><tr><th>Veinavn</th><th>Veinummer</th><th>Veibokstav</th><th><span class="e-sr">Valg</span></th></tr></thead>
        <tbody>${b.adresser.map((a, k) => {
          const ap = `${bp}.adresser.${k}`;
          const celle = (felt, bredde, label) => `<td><input class="e-input e-input--${bredde}${F.harFeil(`${ap}.${felt}`) ? ' er-feil' : ''}" id="${F.id(`${ap}.${felt}`)}" data-felt="${ap}.${felt}" data-type="tekst" value="${eEsc(a[felt] ?? '')}" aria-label="${label}" data-feltboks="${ap}.${felt}" ${felt === 'veiBokstav' ? 'maxlength="1"' : ''}>${F.feilHtml(`${ap}.${felt}`)}</td>`;
          return `<tr>${celle('veiNavn', 'l', 'Veinavn')}${celle('veiNummer', 'xs', 'Veinummer')}${celle('veiBokstav', 'xs', 'Veibokstav')}
            <td class="e-tabell__handling"><button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="slettAdresse" data-i="${i}" data-j="${j}" data-k="${k}">${E_IKON.soppel}Slett</button></td></tr>`;
        }).join('')}</tbody></table></div>` : ''}
      ${EI.egendefinert(pf) ? `<p style="margin-top:var(--space-2)"><button type="button" class="e-knapp e-knapp--liten" data-handling="leggTilAdresse" data-i="${i}" data-j="${j}">${E_IKON.pluss}Legg til adresse</button></p>` : ''}
      ${F.feilHtml(`${bp}-adresser`)}
    </fieldset>`;
  return `<div class="e-bygg">
    ${kropp}
    ${!b.fraMatrikkelen ? `<div style="border-top:1px solid var(--e-ramme);padding-top:var(--space-3);margin-top:var(--space-3)"><button type="button" class="e-knapp e-knapp--subtil-destruktiv" data-handling="slettBygg" data-i="${i}" data-j="${j}">${E_IKON.soppel}Slett bygg</button></div>` : ''}
  </div>`;
}
