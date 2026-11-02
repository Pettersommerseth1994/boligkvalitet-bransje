/* ──────────────────────────────────────────────────────────────────
   Steg 3: Bolig (boligkvaliteter)

   Bygg → adresse → etasje → boenhet. Boenhetene ligger i én flat liste,
   pf.boenheter, med adresseId og etasjekode (U01, H01, L01 …).
   ────────────────────────────────────────────────────────────────── */

const KVALITETER = [
  ['ETTERINSTALLERING_AV_HEIS', 'Etterinstallering av heis', 50, 'UU', 1], ['OPPGRADERING_BADEROM', 'Oppgradering av baderom', 50, 'UU', 1],
  ['TILGJENGELIG_INNGANGSPARTI', 'Tilgjengelig og synlig inngangsparti', 50, 'UU', 1],
  ['FUNKSJONER_PA_INNGANGSPLANET', 'Tiltak som gjør at alle boligfunksjoner er på inngangsplanet', 50, 'UU', 1],
  ['ENOVAS_OPPGRADERING', 'Enovas krav for oppgradering av bolig', 50, 'EM', 1],
  ['FELLES_TRAPPEROM', 'Oppgradering av felles trapperom', 10, 'UU', 2], ['OPPGRADERING_INNGANGSDORPARTI', 'Oppgradering av inngangsdør/parti', 5, 'UU', 2],
  ['ENDRE_INNGANGSPLANET', 'Endre inngangsplanet', 5, 'UU', 2], ['TILGJENGELIG_BAD', 'Tilgjengelig bad', 5, 'UU', 2],
  ['TRINNFRI_ADKOMSTVEI', 'Trinnfri adkomstvei', 5, 'UU', 2], ['INNGANGSPARTI_VOGN', 'Overbygd inngangsparti med plass til vogn', 5, 'UU', 2],
  ['TERSKELFRIE_DORAPNINGER', 'Terskelfrie døråpninger', 5, 'UU', 2],
  ['OPPGRADERING_YTTERTAK', 'Oppgradering av yttertak', 10, 'EM', 2], ['OPPGRADERING_YTTERVEGG', 'Oppgradering av yttervegg', 10, 'EM', 2]
].map(([kode, navn, poeng, kat, gruppe]) => ({ kode, navn, poeng, kat, gruppe }));
const kvalitet = k => KVALITETER.find(x => x.kode === k);

/* Poengene: ett tiltak på 50 poeng holder alene, ellers minst 10 poeng
   både for universell utforming og for energi og miljø. */
function prosentFerdig(koder) {
  let uu = 0; let em = 0; let p = 0;
  for (const kode of koder || []) {
    const k = kvalitet(kode);
    if (!k) continue;
    if (k.poeng === 50) return 100;
    if (k.kat === 'UU') uu += k.poeng; else em += k.poeng;
    if (uu > 9 && em > 9) return 100;
    p = Math.min(90, (uu + em) * 2);
  }
  return p;
}

const LIVSLOP_HJELP = [
  '<p>En livsløpsbolig skal utover kravene til tilgjengelig boenhet i gjeldende byggteknisk forskrift oppfylle fire ekstra kvaliteter:</p><p>a. tilgjengelig parsengsrom<br>b. tilgjengelig innvendig bod<br>c. vaskesøyle på tilgjengelig bad eller vaskerom<br>d. forberedt for installering av velferds- og smarthusteknologi</p><p>Les Husbankens veileder for mer detaljert informasjon.</p>',
  '<p>Husbanken kan finansiere leiligheter i andre etasje i fire- og seksmannsboliger uten at det er trinnfri atkomst til boligene ved ferdigstillelse.</p><p>Husbanken krever da at det er forberedt for innvending løfteinnretning.</p><p>Les Husbankens veileder for mer detaljert informasjon.</p>',
  null
];

const B = {
  visBoliger: pf => (S.visBK(pf) ? (pf.boligkonfigurasjoner || []).some(k => !k.utenforKvalitetskriterier) : true),
  visA: pf => S.visBK(pf) && !S.oppfOmb(pf),
  visB: pf => B.visBoliger(pf) && !S.er(pf, 'KJOP', 'OPPFORING', 'OMBYGGING') && !S.boligsosialt(pf),
  visC: pf => S.oppfOmb(pf) && S.visBK(pf),
  visD: pf => B.visBoliger(pf) || S.oppfOmb(pf),
  visVelgBk: pf => S.visBK(pf) && !S.oppfOmb(pf),
  visLivslop: pf => S.visBK(pf) && S.oppfOmb(pf) && pf.livslopsboliger === true,
  livslopBk: pf => ['LIVSLOPSBOLIG_ALLE_KRAV', 'LIVSLOPSBOLIG_LOEFTEINNRETNING_FORBEREDT', 'Ingen boligkvalitet'].map(n => (pf.boligkonfigurasjoner || []).find(k => k.navn === n)),
  kvalitetsBk: pf => (pf.boligkonfigurasjoner || []).filter(k => !k.utenforKvalitetskriterier),
  kanLeggeTil: (pf, b, a) => {
    if (!S.kanLeggeTilBoliger(pf)) return false;
    const type = S.hbType(pf, b);
    const n = S.boenheter(pf, a.id).length;
    if (['ENEBOLIG', 'ENEBOLIGMEDHYBEL'].includes(type) && n === 0) return true;
    return S.MAKS_BOENHETER[type] ? n < S.MAKS_BOENHETER[type] : true;
  },
  indeks: (pf, fo) => pf.boenheter.indexOf(fo),
  nesteNr: (pf, aid, etasje) => eTo(Math.max(0, ...S.boenheter(pf, aid).filter(f => f.etasje === etasje).map(f => Number(f.bruksenhetsNr) || 0)) + 1),
  nesteEtasje: (pf, aid, bokstav) => `${bokstav}${eTo(Math.max(0, ...S.boenheter(pf, aid).filter(f => f.etasje[0] === bokstav).map(f => Number(f.etasje.slice(1)))) + 1)}`,
  redigerer: null,
  modal: null
};

STEG.boligkvaliteter = {
  bred: true,

  foer: pf => {
    pf.boenheter = pf.boenheter || [];
    S.alleValgteAdresser(pf).forEach(({ a }) => { if (a.fraMatrikkelen) S.lagMatrikkelBoenheter(pf, a); });
    if (S.er(pf, 'OPPFORING')) pf.boenheter.forEach(f => { f.enabled = true; });
    if (S.oppfOmb(pf) && !(pf.boligkonfigurasjoner || []).length) S.standardKonfigurasjoner(pf, S.t);
    B.redigerer = null;
  },

  vedEndring: (felt, pf) => {
    /* Uten kjeller er spørsmålene om kjellerarealet borte, og svarene tømmes */
    if (felt === 'klima.harKjeller' && pf.klima && pf.klima.harKjeller === false) {
      delete pf.klima.oppvarmetKjeller; delete pf.klima.co2Kjeller;
      delete pf.klima.btaKjellerOppvarmet; delete pf.klima.btaKjellerUoppvarmet;
    }
    /* BTA-andelene spørres bare om ved «Både blokk og småhus», og tømmes ellers */
    if (felt === 'klima.bygningstype' && pf.klima && pf.klima.bygningstype !== 'BEGGE') {
      delete pf.klima.btaBlokk; delete pf.klima.btaSmahus;
    }
    const alle = /^adresseBk\.a(\d+)$/.exec(felt);
    if (alle) { S.boenheter(pf, Number(alle[1])).forEach(f => { f.bkId = Number(pf.adresseBk[`a${alle[1]}`]); }); delete pf.adresseBk; }
    const m = /^boenheter\.(\d+)\.bkId$/.exec(felt);
    if (m) pf.boenheter[Number(m[1])].bkId = Number(pf.boenheter[Number(m[1])].bkId);
    if (/^boenheter\.\d+\.enabled$/.test(felt)) { const i = Number(felt.split('.')[1]); pf.boenheter[i].enabled = !!pf.boenheter[i].enabled; }
    const alleRader = /^etasjeAlle\.a(\d+)\.(\w\d\d)$/.exec(felt);
    if (alleRader) {
      const verdi = !!F.hent(felt);
      S.boenheter(pf, Number(alleRader[1])).filter(f => f.etasje === alleRader[2]).forEach(f => { f.enabled = verdi; });
      delete pf.etasjeAlle;
    }
  },

  tegn: pf => {
    const a = B.visA(pf); const c = B.visC(pf); const d = B.visD(pf);
    const aktive = S.aktiveBoenheter(pf);
    const med = aktive.filter(fo => {
      const x = S.alleValgteAdresser(pf).find(y => y.a.id === fo.adresseId);
      return !x || !S.utmalingsvarsel(pf, x.b, x.a, fo);
    }).length;
    return `
      ${erKlimavennlig(pf) ? `${eCallout('noytral', `<p>For å kunne søke om lån til oppføring av klimavennlig bolig må det utarbeides et klimagassbudsjett etter NS 3720:2018.</p>
        <ul>
          <li>Ved søknadstidspunktet er det kun nødvendig med et foreløpig klimagassbudsjett som dokumentasjon.</li>
          <li>Ved søknad om utbetaling eller før videresalg må ferdig klimagassregnskap sendes inn som dokumentasjon.</li>
        </ul>`)}
        ${blokkKlimabudsjett(pf)}
        ${blokkKlimaTyper(pf)}` : ''}
      ${a ? blokkKvalitetskrav(pf) : ''}
      ${B.visB(pf) ? blokkEnergikarakter(pf) : ''}
      ${c && !erKlimavennlig(pf) ? blokkKlima(pf) : ''}
      ${d ? S.alleValgteBygg(pf).map(({ e, b }) => `
        <h2 class="e-h2 e-mt">${eEsc(S.byggNavn(b))}</h2>
        ${S.valgteAdresser(b).map(adr => adresseBlokk(pf, e, b, adr)).join('')}`).join('') : ''}
      ${d && !S.alleValgteBygg(pf).length ? eCallout('advarsel', '<p>Du har ikke valgt noen adresser på Eiendom-steget ennå.</p>') : ''}
      ${F.gruppefeil('minstEnBoenhet')}
      <h2 class="e-h2 e-mt">Antall boenheter i prosjektet</h2>
      <table class="e-tabell e-tabell--enkel" style="max-width:32rem"><tbody>
        ${S.boligsosialt(pf) || S.er(pf, 'OMBYGGING') ? '' : `
          <tr><td>Boenheter med i låneutmåling</td><td></td><td class="e-tall">${med}</td></tr>
          <tr><td>Boenheter ikke med i låneutmåling</td><td class="e-senter">+</td><td class="e-tall">${aktive.length - med}</td></tr>`}
        <tr class="e-tabell__sum"><td>Totalt antall boliger</td><td class="e-senter">=</td><td class="e-tall">${aktive.length || ''}</td></tr>
      </tbody></table>
      ${F.sammendrag()}
      ${W.knapper()}
      ${B.modal ? kvalitetsmodal(pf) : ''}`;
  },

  valider: pf => {
    const f = [];
    const feil = (nokkel, melding) => f.push({ nokkel, melding });
    if (B.visA(pf) && !B.kvalitetsBk(pf).length) feil('kvalitetskrav', 'Du mangler boligtype(r)');
    if (B.visB(pf)) {
      if (!pf.energikarakterFor) feil('energikarakterFor', 'Du må legge inn energikarakter');
      if (!pf.energikarakterEtter) feil('energikarakterEtter', 'Du må legge inn energikarakter');
    }
    if (erKlimavennlig(pf)) {
      const k = pf.klima || {};
      if (k.harKlimabudsjett == null) feil('klima.harKlimabudsjett', 'Du må svare på om det er utarbeidet et klimagassbudsjett for prosjektet.');
      if (V.tom(k.typer)) feil('klima.typer', 'Du må krysse av for hvilke bygningstyper prosjektet skal ha.');
      KV_TYPER.filter(t => (k.typer || []).includes(t.type)).forEach(t => {
        const x = k[t.k] || {}; const q = `klima.${t.k}`;
        const tall = (felt, verdi) => {
          if (V.tom(verdi)) feil(`${q}.${felt}`, 'Feltet må fylles ut.');
          else if (!V.heltall(verdi)) feil(`${q}.${felt}`, 'Feltet kan bare inneholde tall, for eksempel 1200.');
        };
        tall('bta', x.bta); tall('co2', x.co2);
        if (!x.kjeller) feil(`${q}.kjeller`, `Du må svare på om noen av ${t.flertall} har kjeller.`);
        if (['OPP', 'BEGGE'].includes(x.kjeller)) { tall('oppBta', x.oppBta); tall('oppCo2', x.oppCo2); }
        if (['UOPP', 'BEGGE'].includes(x.kjeller)) { tall('uoppBta', x.uoppBta); tall('uoppCo2', x.uoppCo2); }
      });
    }
    if (B.visC(pf) && !erKlimavennlig(pf)) {
      const k = pf.klima || {};
      if (V.tom(k.btaTotalt)) feil('klima.btaTotalt', 'Du må skrive totalt BTA for prosjektet.');
      else if (!V.heltall(k.btaTotalt) || eNum(k.btaTotalt) < 1) feil('klima.btaTotalt', 'BTA kan bare være tall, for eksempel 1200.');
      {
        if (V.tom(k.co2)) feil('klima.co2', 'Du må skrive antatt kg CO₂-ekv./m² BTA for prosjektet.');
        else if (!V.heltall(k.co2)) feil('klima.co2', 'Klimagassavtrykket kan bare være tall, for eksempel 150.');
        if (k.oppvarmetKjeller == null) feil('klima.oppvarmetKjeller', 'Du må svare på om kjelleren vil være oppvarmet.');
      }
    }
    if (!B.visD(pf)) return f;

    const betegnelser = {};
    S.aktiveBoenheter(pf).forEach(fo => { if (fo.boligbetegnelse) betegnelser[fo.boligbetegnelse.toLowerCase()] = (betegnelser[fo.boligbetegnelse.toLowerCase()] || 0) + 1; });
    S.alleValgteAdresser(pf).forEach(({ b, a }) => {
      const rader = S.boenheter(pf, a.id);
      const type = S.hbType(pf, b);
      const aktiv = rader.filter(fo => fo.enabled);
      if (!aktiv.length) feil(`adresse-${a.id}`, 'Du må velge minst en bolig for hver adresse.');
      if (S.MAKS_BOENHETER[type] && aktiv.length > S.MAKS_BOENHETER[type]) feil(`adresse-${a.id}`, `Adresser med type ${E_BYGNINGSTYPE_NAVN[type]} kan maks ha ${S.MAKS_BOENHETER[type]} boenheter.`);
      if (type === 'ENEBOLIGMEDHYBEL' && !S.arealValideringAv(pf) && aktiv.reduce((s, x) => s + eNum(x.bruksAreal), 0) > 250) feil(`adresse-${a.id}`, `Total BRA-i er større enn Husbankens maksimalgrenser som kan finansieres. Maksimal total BRA-i for ${E_BYGNINGSTYPE_NAVN[type]} er 250.`);
      aktiv.forEach(fo => {
        const p = `boenheter.${B.indeks(pf, fo)}`;
        const tall = (felt, navn, { min = 1, maks, maksTekst } = {}) => {
          const v = fo[felt];
          if (V.tom(v)) return feil(`${p}.${felt}`, `Du må skrive ${navn}.`);
          if (!V.heltall(v)) return feil(`${p}.${felt}`, 'Du kan kun angi hele tall.');
          if (maks != null && eNum(v) > maks) return feil(`${p}.${felt}`, maksTekst || `${eStor(navn)} kan ikke være større enn ${maks}.`);
          if (eNum(v) < min) return feil(`${p}.${felt}`, `${eStor(navn)} må minimum være ${min}.`);
          return null;
        };
        const bb = fo.boligbetegnelse;
        if (V.tom(bb)) feil(`${p}.boligbetegnelse`, 'Du må skrive boligbetegnelse.');
        else if (bb.length > 15) feil(`${p}.boligbetegnelse`, 'Boligbetegnelse kan ikke være mer enn 15 tegn.');
        else if (!/^[a-zæøåA-ZÆØÅ0-9 _\-.,#&:;()[\]]+$/.test(bb)) feil(`${p}.boligbetegnelse`, 'Boligbetegnelsen kan inneholde bokstavene A til Å, tallene 0 til 9, mellomrom, og spesialtegnene _ - . , # & : ; ( ) [ ]');
        else if (betegnelser[bb.toLowerCase()] > 1) feil(`${p}.boligbetegnelse`, 'Boligbetegnelsen må være unik');
        if (S.er(pf, 'OPPFORING')) tall('bruksAreal', 'bruksareal', { maks: 10000 });
        else {
          const maks = S.arealValideringAv(pf) ? null : S.maksAreal(type, fo.bruksenhetsNr);
          tall('bruksAreal', 'bruksareal', { maks: maks ?? undefined, maksTekst: maks ? `Total BRA-i er større enn Husbankens maksimalgrenser som kan finansieres. Maksimal total BRA-i for ${E_BYGNINGSTYPE_NAVN[type]} er ${maks}.` : null });
        }
        if (S.visPrimaer(pf)) {
          if (!tall('primaerAreal', 'primærareal', { maks: 10000 }) && eNum(fo.primaerAreal) > eNum(fo.bruksAreal) && !V.tom(fo.primaerAreal)) feil(`${p}.primaerAreal`, 'Primærareal må være mindre eller lik bruttoareal');
        }
        tall('antallRom', 'antall rom', { maks: 9 });
        if (B.visVelgBk(pf) && !fo.bkId) feil(`${p}.bkId`, 'Du må velge boligtype.');
        if (S.salg(pf)) {
          if (V.tom(fo.salgspris)) feil(`${p}.salgspris`, 'Du må skrive salgspris.');
          else if (eNum(fo.salgspris) > 90000000) feil(`${p}.salgspris`, 'Salgspris kan ikke være større enn 90000000.');
        }
        if (S.utleie(pf)) {
          if (V.tom(fo.utleiepris)) feil(`${p}.utleiepris`, 'Du må skrive husleie.');
          else if (eNum(fo.utleiepris) > 100000) feil(`${p}.utleiepris`, 'Husleie kan ikke være større enn 100000.');
        }
        if (B.visLivslop(pf) && !fo.bkId) feil(`${p}.bkId`, 'Du må skrive krav til livsløpsbolig.');
      });
    });
    if (!S.aktiveBoenheter(pf).length) feil('minstEnBoenhet', 'Du må velge minst en boenhet som skal gjelde for søknaden din');
    return f;
  },

  handlinger: {
    lagBk: () => { B.modal = { navn: '', koder: [], forsokt: false }; setTimeout(() => document.getElementById('kvalitet-navn')?.focus(), 0); },
    endreBk: (d, pf) => { const k = pf.boligkonfigurasjoner.find(x => x.id === Number(d.id)); B.modal = { id: k.id, navn: k.navn, koder: [...k.koder], forsokt: false }; },
    slettBk: async (d, pf) => {
      const ok = await eBekreft({ tittel: 'Bekreft sletting', tekst: 'Er du sikker på at du vil slette boligtypen?', bekreft: 'Slett', destruktiv: true });
      if (!ok) return false;
      pf.boligkonfigurasjoner = pf.boligkonfigurasjoner.filter(k => k.id !== Number(d.id));
      return true;
    },
    modalKode: (d) => {
      B.modal.navn = document.getElementById('kvalitet-navn')?.value ?? B.modal.navn;
      const i = B.modal.koder.indexOf(d.kode);
      if (i >= 0) B.modal.koder.splice(i, 1); else B.modal.koder.push(d.kode);
    },
    modalLagre: (d, pf) => {
      B.modal.forsokt = true;
      B.modal.navn = document.getElementById('kvalitet-navn').value.trim();
      if (!B.modal.navn || prosentFerdig(B.modal.koder) < 100) return true;
      if (B.modal.id) Object.assign(pf.boligkonfigurasjoner.find(k => k.id === B.modal.id), { navn: B.modal.navn, koder: B.modal.koder });
      else pf.boligkonfigurasjoner.push({ id: S.nyId(), navn: B.modal.navn, koder: B.modal.koder });
      B.modal = null;
      return true;
    },
    modalLukk: () => { B.modal = null; },

    leggTilEtasje: (d, pf) => {
      const aid = Number(d.aid);
      const ny = (pf.nyEtasje || {})[`a${aid}`] || {};
      const feil = {};
      if (!ny.kode) feil.kode = 'Du må velge etasjekode';
      if (V.tom(ny.nr)) feil.nr = 'Du må fylle ut etasjenummer';
      else if (!/^[1-9]\d*$/.test(ny.nr) || eNum(ny.nr) > 99) feil.nr = 'Etasjenummer må være mellom 1 og 99';
      const kode = `${ny.kode}${eTo(eNum(ny.nr))}`;
      if (!feil.kode && !feil.nr && S.boenheter(pf, aid).some(f => f.etasje === kode)) feil.nr = 'Etasjen finnes allerede';
      pf.nyEtasjeFeil = { ...(pf.nyEtasjeFeil || {}), [aid]: feil };
      if (Object.keys(feil).length) return true;
      pf.boenheter.push({ id: S.nyId(), adresseId: aid, etasje: kode, bruksenhetsNr: '01', enabled: true, fraMatrikkelen: false });
      delete pf.nyEtasje[`a${aid}`];
      return true;
    },
    leggTilSammeEtasje: (d, pf) => {
      const aid = Number(d.aid);
      pf.boenheter.push({ id: S.nyId(), adresseId: aid, etasje: B.nesteEtasje(pf, aid, d.etasje[0]), bruksenhetsNr: '01', enabled: true, fraMatrikkelen: false });
    },
    kopierEtasje: (d, pf) => {
      const aid = Number(d.aid);
      const ny = B.nesteEtasje(pf, aid, d.etasje[0]);
      S.boenheter(pf, aid).filter(f => f.etasje === d.etasje).forEach(f => pf.boenheter.push({ ...f, id: S.nyId(), etasje: ny, fraMatrikkelen: false, boligbetegnelse: undefined }));
    },
    slettEtasje: async (d, pf) => {
      const ok = await eBekreft({ tittel: 'Bekreft sletting', tekst: `Er du sikker på at du vil slette etasje <b>${d.etasje}</b>?`, bekreft: 'Slett', destruktiv: true });
      if (!ok) return false;
      pf.boenheter = pf.boenheter.filter(f => !(f.adresseId === Number(d.aid) && f.etasje === d.etasje));
      return true;
    },
    redigerEtasje: d => { B.redigerer = { aid: Number(d.aid), etasje: d.etasje, nr: d.etasje.slice(1), feil: '' }; },
    avbrytEtasje: () => { B.redigerer = null; },
    lagreEtasje: (d, pf) => {
      const r = B.redigerer;
      r.nr = document.getElementById('etasje-nytt-nr').value.trim();
      if (V.tom(r.nr) || !/^[1-9]\d*$/.test(r.nr) || eNum(r.nr) > 99) { r.feil = 'Du må skrive etasjenummer.'; return true; }
      const kode = `${r.etasje[0]}${eTo(eNum(r.nr))}`;
      if (kode !== r.etasje && S.boenheter(pf, r.aid).some(f => f.etasje === kode)) { r.feil = 'Denne etasjekoden finnes allerede.'; return true; }
      S.boenheter(pf, r.aid).filter(f => f.etasje === r.etasje).forEach(f => { f.etasje = kode; });
      B.redigerer = null;
      return true;
    },
    leggTilBoenhet: (d, pf) => {
      const fo = pf.boenheter.find(f => f.id === Number(d.id));
      pf.boenheter.push({ id: S.nyId(), adresseId: fo.adresseId, etasje: fo.etasje, bruksenhetsNr: B.nesteNr(pf, fo.adresseId, fo.etasje), enabled: true, fraMatrikkelen: false });
    },
    kopierBoenhet: (d, pf) => {
      const fo = pf.boenheter.find(f => f.id === Number(d.id));
      pf.boenheter.push({ ...fo, id: S.nyId(), bruksenhetsNr: B.nesteNr(pf, fo.adresseId, fo.etasje), fraMatrikkelen: false, boligbetegnelse: undefined });
    },
    slettBoenhet: async (d, pf) => {
      const fo = pf.boenheter.find(f => f.id === Number(d.id));
      const ok = await eBekreft({ tittel: 'Bekreft sletting', tekst: `Er du sikker på at du vil slette <b>${fo.etasje}${fo.bruksenhetsNr}</b>?`, bekreft: 'Slett', destruktiv: true });
      if (!ok) return false;
      pf.boenheter = pf.boenheter.filter(f => f !== fo);
      return true;
    },
    velgAlleLivslop: (d, pf) => {
      S.boenheter(pf, Number(d.aid)).filter(f => f.etasje === d.etasje).forEach(f => { f.bkId = Number(d.bk); });
    }
  }
};

/* ═══ Blokkene ════════════════════════════════════════════════════ */

function blokkKvalitetskrav(pf) {
  const liste = B.kvalitetsBk(pf);
  const kat = (k, grupper) => (k.koder || []).map(kvalitet).filter(x => x && grupper.includes(x.kat)).map(x => x.navn).join(', ');
  const brukt = id => pf.boenheter.some(f => f.bkId === id);
  return `<div class="e-gruppe-info" data-feltboks="kvalitetskrav" id="${F.id('kvalitetskrav')}">
    <h2 class="e-h2">Kvalitetskrav</h2>
    <p><button type="button" class="e-knapp" data-handling="${S.er(pf, 'OPPGRADERING') ? 'lagBk' : 'ingen'}">Lag boligkvalitet</button></p>
    ${liste.length ? `<div class="e-tabell-rulle"><table class="e-tabell" style="background:#fff">
      <thead><tr><th>Navn</th><th>Universell utforming</th><th>Energi og miljø</th><th><span class="e-sr">Valg</span></th></tr></thead>
      <tbody>${liste.map(k => `<tr><td>${eEsc(k.navn)}</td><td>${kat(k, ['UU'])}</td><td>${kat(k, ['EM'])}</td>
        <td class="e-tabell__handling"><button type="button" class="e-knapp e-knapp--liten" data-handling="endreBk" data-id="${k.id}">Endre</button>
          <button type="button" class="e-knapp e-knapp--liten e-knapp--subtil-destruktiv" data-handling="slettBk" data-id="${k.id}" ${brukt(k.id) ? 'disabled' : ''}>${E_IKON.soppel}Slett</button></td></tr>`).join('')}</tbody>
    </table></div>` : ''}
    ${F.feilHtml('kvalitetskrav')}
  </div>`;
}

function blokkEnergikarakter(pf) {
  const valg = 'ABCDEFG'.split('').map(v => ({ v, l: v }));
  const t = pf.prosjektTiltakKode.toLowerCase();
  return eKort({ tittel: 'Energikarakter', kropp: `
    ${F.radio({ felt: 'energikarakterFor', label: `Energikarakter <b>før</b> ${t}`, rad: true, valg })}
    ${F.radio({ felt: 'energikarakterEtter', label: `Energikarakter <b>etter</b> ${t}`, rad: true, valg })}` });
}

const BTA_HJELP = 'BTA betyr bruttoareal. Det er hele arealet i prosjektet, målt til utsiden av ytterveggene, i alle etasjer. Kjeller og loft regnes med, og det samme gjør arealet veggene tar opp. En garasje, bod eller et anneks som står for seg selv, regnes ikke med.';
const CO2_ENHET = 'kg CO₂-ekv./m² BTA';

/* Grenseverdiene i forslaget til ny § 2-3 (høringsnotat, KDD sak 26/1208),
   i kg CO₂-ekv./m² BTA. Bygget og kjelleren har hver sine. Er ett av de
   valgte byggene en blokk, regnes prosjektet som boligblokk. Ellers er det
   et småhusprosjekt, og totalt BTA avgjør om det er under eller minst 1000 m². */
const CO2_GRENSER = {
  BOLIGBLOKK: { navn: 'boligblokk', bygg: 247, oppvarmet: 180, uoppvarmet: 139 },
  SMAHUS_STOR: { navn: 'småhusprosjekter på minimum 1000 m² BTA', bygg: 130, oppvarmet: 206, uoppvarmet: 159 },
  SMAHUS: { navn: 'småhusprosjekter under 1000 m² BTA', bygg: 167, oppvarmet: 232, uoppvarmet: 179 }
};
const co2Kategori = pf => {
  const typer = S.alleValgteBygg(pf).map(({ b }) => S.hbType(pf, b));
  if (typer.some(t => ['BLOKK', 'OMSORGSBOLIGSYKEHJEM'].includes(t))) return CO2_GRENSER.BOLIGBLOKK;
  return eNum((pf.klima || {}).btaTotalt) >= 1000 ? CO2_GRENSER.SMAHUS_STOR : CO2_GRENSER.SMAHUS;
};
const co2GrenseBygg = pf => co2Kategori(pf).bygg;
const co2GrenseKjeller = pf => ((pf.klima || {}).oppvarmetKjeller === true ? co2Kategori(pf).oppvarmet : co2Kategori(pf).uoppvarmet);

/* Advarsel under et CO₂-felt når tallet er over grenseverdien. Samme stil
   som feilmeldingene, men den stopper ikke «Neste steg». */
function co2Advarsel(pf, felt, grense) {
  if (grense == null) return '';
  const v = (pf.klima || {})[felt.split('.')[1]];
  return !V.tom(v) && V.heltall(v) && eNum(v) > grense
    ? `<div class="e-feilmelding" id="${F.id(felt)}-advarsel">${E_IKON.feil}<span>For å kvalifisere til dette lånet kan klimagassavtrykket ikke være høyere enn ${fmtGrense(grense)} ${CO2_ENHET}.</span></div>`
    : '';
}

/* Tallet avrundes til nærmeste hele når grenseverdien er vektet (et snitt). */
function fmtGrense(n) { return String(Math.round(n)); }

const erKlimavennlig = S.erKlimavennlig;

/* Spørsmålet om klimabudsjett. Svarer man nei, vises en advarsel i samme
   stil som feilmeldingene, men den stopper ikke «Neste steg». */
function blokkKlimabudsjett(pf) {
  const advarsel = (pf.klima || {}).harKlimabudsjett === false
    ? `<div class="e-feilmelding" id="${F.id('klima.harKlimabudsjett')}-advarsel">${E_IKON.feil}<span>Uten et klimagassbudsjett etter NS 3720:2018 kvalifiserer du ikke til dette lånet. Du må få laget budsjettet før du søker.</span></div>`
    : '';
  return F.janei({ felt: 'klima.harKlimabudsjett', label: 'Er det blitt utarbeidet et klimagassbudsjett for prosjektet etter NS 3720:2018?', etter: advarsel });
}

/* Et tallfelt med enheten til høyre, som i lånesøknaden */
function tallMedEnhet({ felt, label, enhet, hjelp, etter = '' }) {
  const id = F.id(felt);
  return `<div class="e-felt${F.harFeil(felt) ? ' e-felt--feil' : ''}" data-feltboks="${felt}">
    <div class="e-felt__labelrad"><label class="e-felt__label" for="${id}">${label}</label>${hjelp ? F.hjelpKnapp(felt) : ''}</div>
    ${hjelp ? F.hjelpTekst(felt, hjelp) : ''}
    <div class="e-enhet"><input class="e-input e-input--s" id="${id}" inputmode="numeric" data-felt="${felt}" data-type="tekst" value="${eEsc(F.hent(felt) ?? '')}" aria-describedby="${id}-feil"><span class="e-enhet__tekst">${enhet}</span></div>
    ${F.feilHtml(felt)}${etter}
  </div>`;
}

/* Hva som er blokk og småhus, etter DiBKs veiledning til TEK17 § 14-2 (NS 3457-3) */
const SMAHUS_HJELP = '<p class="e-mb0">Enebolig, to- til firemannsbolig, rekkehus, kjedehus og terrassehus på til og med tre etasjer.</p>';
const BLOKK_HJELP = '<p class="e-mb0">Boligbygg med flere boliger som ikke regnes som småhus, typisk leilighetsbygg.</p>';

/* ═══ Klimagassavtrykk for «Klimavennlig bolig» ═════════════════
   Forslag 2 fra klima-forslag.html: man krysser av for blokk og/eller
   småhus, og hver type får et kort med samlet BTA og antatt utslipp,
   uten kjeller og for oppvarmet og uoppvarmet kjeller.

   Grenseverdien for hver del står under utslippsfeltet og i tabellen
   nederst. Bygget uten kjeller og kjelleren kontrolleres hver for seg.
   Har en av dem flere deler, vektes både grenseverdien og utslippet
   etter BTA (§ 2-3 (3)): summen av BTA × verdi, delt på summen av BTA.
   Småhusene regnes som et prosjekt på minst 1000 m² når all BTA for
   småhus, med kjeller, er 1000 eller mer.
   ─────────────────────────────────────────────────────────────────── */

const KV_TYPER = [
  { k: 'blokk', type: 'BLOKK', tittel: 'Blokker', flertall: 'blokkene', hjelp: BLOKK_HJELP },
  { k: 'smahus', type: 'SMAHUS', tittel: 'Småhus', flertall: 'småhusene', hjelp: SMAHUS_HJELP }
];
const KV_DEL = { bygg: 'uten kjeller', oppvarmet: 'oppvarmet kjeller', uoppvarmet: 'uoppvarmet kjeller' };
const KV_KJELLER = [
  { v: 'INGEN', l: 'Nei' }, { v: 'OPP', l: 'Ja, bare oppvarmet kjeller' },
  { v: 'UOPP', l: 'Ja, bare uoppvarmet kjeller' }, { v: 'BEGGE', l: 'Ja, både oppvarmet og uoppvarmet kjeller' }
];
const kvTall = v => !V.tom(v) && V.heltall(v);

/* Delene prosjektet har, ut fra avkrysningene */
function kvDeler(pf) {
  const k = pf.klima || {};
  return KV_TYPER.filter(t => (k.typer || []).includes(t.type)).flatMap(t => {
    const x = k[t.k] || {};
    return [{ t, del: 'bygg', bta: x.bta, co2: x.co2 },
      ...(['OPP', 'BEGGE'].includes(x.kjeller) ? [{ t, del: 'oppvarmet', bta: x.oppBta, co2: x.oppCo2 }] : []),
      ...(['UOPP', 'BEGGE'].includes(x.kjeller) ? [{ t, del: 'uoppvarmet', bta: x.uoppBta, co2: x.uoppCo2 }] : [])];
  });
}

function kvBeregn(pf) {
  const med = kvDeler(pf).filter(d => kvTall(d.bta) && eNum(d.bta) > 0);
  const btaSmahus = med.filter(d => d.t.type === 'SMAHUS').reduce((s, d) => s + eNum(d.bta), 0);
  const kat = type => (type === 'BLOKK' ? CO2_GRENSER.BOLIGBLOKK : btaSmahus >= 1000 ? CO2_GRENSER.SMAHUS_STOR : CO2_GRENSER.SMAHUS);
  const rader = med.map(d => ({ ...d, grense: kat(d.t.type)[d.del], over: kvTall(d.co2) ? eNum(d.co2) > kat(d.t.type)[d.del] : null }));
  const gruppe = liste => {
    if (!liste.length) return null;
    const bta = liste.reduce((s, d) => s + eNum(d.bta), 0);
    const grense = liste.reduce((s, d) => s + eNum(d.bta) * d.grense, 0) / bta;
    const utslipp = liste.every(d => kvTall(d.co2)) ? liste.reduce((s, d) => s + eNum(d.bta) * eNum(d.co2), 0) / bta : null;
    return { bta, grense, utslipp, vektet: liste.length > 1, ok: utslipp == null ? null : utslipp <= grense };
  };
  return {
    rader, totalBta: med.reduce((s, d) => s + eNum(d.bta), 0),
    bygg: gruppe(rader.filter(d => d.del === 'bygg')), kjeller: gruppe(rader.filter(d => d.del !== 'bygg'))
  };
}

/* Advarselen under et utslippsfelt. Den stopper ikke «Neste steg». Er
   delen over grensen, men bygget eller kjelleren samlet innenfor, sier
   den det, så man ikke tror at prosjektet ikke kvalifiserer. */
function kvAdvarsel(r, t, del, felt) {
  const rad = r.rader.find(d => d.t === t && d.del === del);
  if (!rad || !rad.over) return '';
  const g = del === 'bygg' ? r.bygg : r.kjeller;
  const hva = del === 'bygg' ? 'bygget uten kjeller' : 'kjelleren';
  const navn = `${t.flertall}, ${KV_DEL[del]}`;
  const tekst = g && g.vektet && g.ok
    ? `Klimagassavtrykket for ${navn} er høyere enn grenseverdien på ${rad.grense} ${CO2_ENHET}. Samlet for ${hva} er prosjektet likevel innenfor, se tabellen under.`
    : `For å kvalifisere til dette lånet kan klimagassavtrykket for ${navn} ikke være høyere enn ${rad.grense} ${CO2_ENHET}.${g && g.vektet && g.ok === false ? ` Samlet for ${hva} er det ${fmtGrense(g.utslipp)}, mot grenseverdien ${fmtGrense(g.grense)}.` : ''}`;
  return `<div class="e-feilmelding" id="${F.id(felt)}-advarsel">${E_IKON.feil}<span>${tekst}</span></div>`;
}

/* Tallfelt med enhet, som oppdaterer grenseverdiene mens man skriver */
function kvTallFelt({ felt, label, enhet = 'm² BTA', etter = '' }) {
  const id = F.id(felt);
  return `<div class="e-felt${F.harFeil(felt) ? ' e-felt--feil' : ''}" data-feltboks="${felt}">
    <label class="e-felt__label" for="${id}">${label}</label>
    <div class="e-enhet"><input class="e-input e-input--s" id="${id}" inputmode="numeric" data-felt="${felt}" data-type="tekst" data-levende
      value="${eEsc(F.hent(felt) ?? '')}" aria-describedby="${id}-feil${etter ? ` ${id}-advarsel` : ''}"><span class="e-enhet__tekst">${enhet}</span></div>
    ${F.feilHtml(felt)}${etter}
  </div>`;
}

/* Tabellen med grenseverdier, med linjene for bygg og kjeller under */
function kvResultat(r) {
  const status = ok => (ok == null ? '<span class="e-sekundaer">Mangler utslipp</span>'
    : ok ? '<span class="kv-ok">✓ Innenfor</span>' : '<span class="kv-over">✗ Over grensen</span>');
  if (!r.rader.length) return '<div class="kv-resultat"><h3 class="e-h4">Grenseverdier for prosjektet</h3><p class="e-sekundaer e-mb0">Fyll ut BTA for å se grenseverdiene.</p></div>';
  const linje = (navn, g) => (g ? `<tr class="e-tabell__sum"><td>${navn}${g.vektet ? ', vektet' : ''}</td><td class="e-tall">${eTusen(g.bta)}</td>
    <td class="e-tall">${g.utslipp == null ? '' : fmtGrense(g.utslipp)}</td><td class="e-tall">${fmtGrense(g.grense)}</td><td class="e-tall">${status(g.ok)}</td></tr>` : '');
  return `<div class="kv-resultat" aria-live="polite">
    <h3 class="e-h4">Grenseverdier for prosjektet</h3>
    <div class="e-tabell-rulle"><table class="e-tabell">
      <thead><tr><th>Del</th><th class="e-tall">m² BTA</th><th class="e-tall">Antatt</th><th class="e-tall">Grense</th><th class="e-tall">Status</th></tr></thead>
      <tbody>${r.rader.map(d => `<tr${d.over ? ' class="kv-rad--over"' : ''}><td>${d.t.tittel}, ${KV_DEL[d.del]}</td><td class="e-tall">${eTusen(d.bta)}</td>
        <td class="e-tall">${kvTall(d.co2) ? eEsc(d.co2) : ''}</td><td class="e-tall">${d.grense}</td><td class="e-tall">${status(d.over == null ? null : !d.over)}</td></tr>`).join('')}
        ${linje('Bygg uten kjeller', r.bygg)}${linje('Kjeller', r.kjeller)}</tbody>
    </table></div>
    <p class="e-liten e-sekundaer e-mb0">Totalt BTA for prosjektet: ${eTusen(r.totalBta)} m². Utslipp og grenseverdier er i ${CO2_ENHET}.</p>
  </div>`;
}

function blokkKlimaTyper(pf) {
  const k = pf.klima || {};
  const r = kvBeregn(pf);
  return `<h2 class="e-h2 e-mt">Bygningstyper og klimagassavtrykk</h2>
    ${F.avkryss({ felt: 'klima.typer', label: 'Hvilke bygningstyper skal prosjektet ha?', beskrivelse: 'Kryss av for alle som gjelder.',
      valg: KV_TYPER.map(t => ({ v: t.type, l: t.type === 'BLOKK' ? 'Blokk' : 'Småhus', hjelp: t.hjelp })) })}
    ${KV_TYPER.filter(t => (k.typer || []).includes(t.type)).map(t => {
      const x = k[t.k] || {}; const q = `klima.${t.k}`;
      const egne = r.rader.filter(d => d.t === t);
      const par = (bta, co2, del, tittel) => `<h3 class="e-h4 e-mt">${tittel}</h3><div class="e-to">
        ${kvTallFelt({ felt: `${q}.${bta}`, label: 'Samlet BTA' })}
        ${kvTallFelt({ felt: `${q}.${co2}`, label: 'Antatt utslipp', enhet: CO2_ENHET, etter: kvAdvarsel(r, t, del, `${q}.${co2}`) })}</div>`;
      return eKort({ tittel: t.tittel, kropp: `
        <p>Oppgi tallene for alle ${t.flertall} i prosjektet til sammen, slik de står i klimagassbudsjettet.</p>
        ${par('bta', 'co2', 'bygg', `Alle ${t.flertall}, uten kjeller`)}
        ${F.radio({ felt: `${q}.kjeller`, label: `Har noen av ${t.flertall} kjeller?`, valg: KV_KJELLER })}
        ${['OPP', 'BEGGE'].includes(x.kjeller) ? par('oppBta', 'oppCo2', 'oppvarmet', 'Oppvarmet kjeller, til sammen') : ''}
        ${['UOPP', 'BEGGE'].includes(x.kjeller) ? par('uoppBta', 'uoppCo2', 'uoppvarmet', 'Uoppvarmet kjeller, til sammen') : ''}`,
        bunn: egne.length ? `<span class="e-liten">Grenseverdier for ${t.flertall}: ${egne.map(d => `${KV_DEL[d.del]} <b>${d.grense}</b>`).join(' · ')}</span>` : '' });
    }).join('')}
    ${kvResultat(r)}`;
}

function blokkKlima(pf) {
  return `<div class="e-avsnitt">
    ${tallMedEnhet({ felt: 'klima.btaTotalt', label: 'Hva er totalt BTA på hele prosjektet?', enhet: 'm² BTA', hjelp: BTA_HJELP })}
    ${tallMedEnhet({ felt: 'klima.co2', label: 'Hva er antatt kg CO₂-ekv./m² BTA for prosjektet uten kjellerareal?', enhet: CO2_ENHET, etter: co2Advarsel(pf, 'klima.co2', co2GrenseBygg(pf)) })}
    ${F.janei({ felt: 'klima.oppvarmetKjeller', label: 'Vil kjelleren være oppvarmet?', rad: false })}
  </div>`;
}

function adresseBlokk(pf, e, b, a) {
  const rader = S.boenheter(pf, a.id);
  const etasjer = S.sorterEtasjer(rader.map(f => f.etasje));
  const kanLegge = B.kanLeggeTil(pf, b, a);
  const ny = (pf.nyEtasje || {})[`a${a.id}`] || {};
  const nyFeil = (pf.nyEtasjeFeil || {})[a.id] || {};
  const tittel = `${eEsc(S.adresseTekst(a))}${etasjer.length ? `, ${etasjer.length} ${etasjer.length === 1 ? 'etasje' : 'etasjer'}` : ''}`;
  const kropp = `
    ${B.visVelgBk(pf) ? `<div class="e-felt"><label class="e-felt__label" for="${F.id(`adresseBk.${a.id}`)}">Sett boligkvalitet for alle boenheter på adressen</label>
      <select class="e-select e-input--m" id="${F.id(`adresseBk.${a.id}`)}" data-felt="adresseBk.a${a.id}" data-type="velg">
        <option value="" disabled selected>Velg boligkvalitet...</option>
        ${(pf.boligkonfigurasjoner || []).map(k => `<option value="${k.id}">${eEsc(k.navn)}</option>`).join('')}
      </select></div>` : ''}
    ${F.visFeil && !rader.some(f => f.enabled) ? eCallout('feil', '<p>Du må velge minst en bolig for denne adressen eller fjerne den.</p>') : ''}
    ${F.gruppefeil(`adresse-${a.id}`)}
    ${etasjer.map(et => etasjeBlokk(pf, b, a, et, kanLegge)).join('')}
    ${kanLegge ? `<div class="e-leggtil-etasje">
      <div class="e-felt${nyFeil.kode ? ' e-felt--feil' : ''}"><label class="e-felt__label" for="${F.id(`ny-${a.id}-kode`)}">Etasjekode:</label>
        <select class="e-select" id="${F.id(`ny-${a.id}-kode`)}" data-felt="nyEtasje.a${a.id}.kode" data-type="velg">
          <option value="" disabled ${ny.kode ? '' : 'selected'}>Velg</option>
          ${[['U', 'Underetasje'], ['H', 'Hovedetasje'], ['L', 'Loftsetasje']].map(([v, l]) => `<option value="${v}" ${ny.kode === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>${nyFeil.kode ? `<div class="e-feilmelding">${E_IKON.feil}<span>${nyFeil.kode}</span></div>` : ''}</div>
      <div class="e-felt${nyFeil.nr ? ' e-felt--feil' : ''}"><label class="e-felt__label" for="${F.id(`ny-${a.id}-nr`)}">Etasjenummer:</label>
        <input class="e-input" id="${F.id(`ny-${a.id}-nr`)}" inputmode="numeric" data-felt="nyEtasje.a${a.id}.nr" data-type="tekst" value="${eEsc(ny.nr || '')}">
        ${nyFeil.nr ? `<div class="e-feilmelding">${E_IKON.feil}<span>${nyFeil.nr}</span></div>` : ''}</div>
      <div><button type="button" class="e-knapp" data-handling="leggTilEtasje" data-aid="${a.id}">${E_IKON.pluss}Legg til etasje</button></div>
    </div>` : ''}`;
  return F.trekkspill({ nokkel: `adresse-${a.id}`, tittel, kropp, klasse: 'e-trekk--inni' });
}

function etasjeBlokk(pf, b, a, etasje, kanLegge) {
  const rader = S.boenheter(pf, a.id).filter(f => f.etasje === etasje).sort((x, y) => Number(x.bruksenhetsNr) - Number(y.bruksenhetsNr));
  const oppf = S.er(pf, 'OPPFORING');
  const liv = B.visLivslop(pf);
  const livBk = B.livslopBk(pf);
  const rediger = B.redigerer && B.redigerer.aid === a.id && B.redigerer.etasje === etasje;
  const kanRedigere = S.kanLeggeTilBoliger(pf);
  const maksNaadd = kanRedigere && !kanLegge;
  const alle = rader.length && rader.every(f => f.enabled);
  const kol = [
    { h: oppf ? '<span class="e-sr">Merknad</span>' : `<label class="e-valg" style="padding:0"><input type="checkbox" data-felt="etasjeAlle.a${a.id}.${etasje}" data-type="sjekk" id="${F.id(`alle-${a.id}-${etasje}`)}" ${alle ? 'checked' : ''}><span>Bolignummer</span></label>` },
    { h: `<span style="display:inline-flex;gap:6px;align-items:center">Utbyggers boligbetegnelse ${F.hjelpKnapp(`bet-${a.id}-${etasje}`)}</span>`, felt: 'boligbetegnelse', type: 'tekst', bredde: 'm' },
    { h: '<abbr title="Bruksareal">BRA-i</abbr>', felt: 'bruksAreal', type: 'tekst', bredde: 'xs' },
    S.visPrimaer(pf) && { h: 'P-rom', felt: 'primaerAreal', type: 'tekst', bredde: 'xs' },
    { h: 'Antall rom', felt: 'antallRom', type: 'tekst', bredde: 'xs' },
    B.visVelgBk(pf) && { h: 'Velg boligkvalitet', felt: 'bkId', type: 'bk' },
    S.salg(pf) && { h: 'Salgspris', felt: 'salgspris', type: 'belop' },
    S.utleie(pf) && { h: 'Husleie', felt: 'utleiepris', type: 'belop' }
  ].filter(Boolean);
  const livKol = liv ? ['Oppfyller alle krav til livsløpsboliger', 'Forberedt for innvendig løfteinnretning', 'Oppfyller ikke krav'] : [];

  const celle = (fo, k) => {
    const p = `boenheter.${B.indeks(pf, fo)}.${k.felt}`;
    const av = !fo.enabled ? 'disabled' : '';
    const feilKl = F.harFeil(p) ? ' er-feil' : '';
    let inp;
    if (k.type === 'bk') {
      inp = `<select class="e-select${feilKl}" id="${F.id(p)}" data-felt="${p}" data-type="velg" ${av} aria-label="Velg boligkvalitet for ${fo.etasje}${fo.bruksenhetsNr}">
        <option value="" disabled ${fo.bkId ? '' : 'selected'}>Velg boligkvalitet...</option>
        ${(pf.boligkonfigurasjoner || []).map(x => `<option value="${x.id}" ${fo.bkId === x.id ? 'selected' : ''}>${eEsc(x.navn)}</option>`).join('')}</select>`;
    } else if (k.type === 'belop') {
      inp = `<div class="e-belop">${F.belopInput({ felt: p, label: `${k.h} for ${fo.etasje}${fo.bruksenhetsNr}` }).replace('<input', `<input ${av}`)}</div>`;
    } else {
      inp = `<input class="e-input e-input--${k.bredde}${feilKl}" id="${F.id(p)}" data-felt="${p}" data-type="tekst" value="${eEsc(fo[k.felt] ?? '')}" ${k.felt === 'boligbetegnelse' ? 'maxlength="15"' : 'inputmode="numeric"'} ${av} aria-label="${k.felt === 'boligbetegnelse' ? 'Utbyggers boligbetegnelse' : k.felt === 'bruksAreal' ? 'Bruksareal' : k.felt === 'primaerAreal' ? 'Primærareal' : 'Antall rom'} for ${fo.etasje}${fo.bruksenhetsNr}">`;
    }
    return `<td data-feltboks="${p}">${inp}${fo.enabled ? F.feilHtml(p) : ''}</td>`;
  };

  const rad = fo => {
    const i = B.indeks(pf, fo);
    const varsel = oppf ? S.utmalingsvarsel(pf, b, a, fo) : '';
    const radFeil = F.visFeil && fo.enabled && F.feilliste.some(x => x.nokkel.startsWith(`boenheter.${i}.`));
    const forste = oppf
      ? `<td>${varsel ? `<span style="color:var(--e-advarsel-kant)">${F.hjelpKnapp(`varsel-${fo.id}`, 'Vis merknad')}</span>` : ''}<span class="e-sr">${fo.etasje}${fo.bruksenhetsNr}</span></td>`
      : `<td><label class="e-valg" style="padding:0"><input type="checkbox" id="${F.id(`boenheter.${i}.enabled`)}" data-felt="boenheter.${i}.enabled" data-type="sjekk" ${fo.enabled ? 'checked' : ''}><span>${fo.etasje}${fo.bruksenhetsNr}</span></label></td>`;
    const livCeller = livKol.map((l, j) => `<td class="e-senter"><input type="radio" name="${F.id(`liv-${fo.id}`)}" id="${F.id(`liv-${fo.id}-${j}`)}" value="${livBk[j] ? livBk[j].id : ''}" data-felt="boenheter.${i}.bkId" data-type="radio" ${livBk[j] && fo.bkId === livBk[j].id ? 'checked' : ''} aria-label="${l} for ${fo.etasje}${fo.bruksenhetsNr}" style="width:20px;height:20px;accent-color:var(--e-knapp)"></td>`).join('');
    const handling = kanRedigere ? `<td class="e-tabell__handling">
      <button type="button" class="e-knapp e-knapp--ikon" data-handling="leggTilBoenhet" data-id="${fo.id}" title="Legg til boenhet" aria-label="Legg til boenhet" ${kanLegge ? '' : 'disabled'}>${E_IKON.pluss}</button>
      <button type="button" class="e-knapp e-knapp--ikon" data-handling="kopierBoenhet" data-id="${fo.id}" title="Kopier bolignummer ${fo.bruksenhetsNr}" aria-label="Kopier bolignummer ${fo.bruksenhetsNr}" ${kanLegge ? '' : 'disabled'}>${E_IKON.kopier}</button>
      <button type="button" class="e-knapp e-knapp--ikon e-knapp--subtil-destruktiv" data-handling="slettBoenhet" data-id="${fo.id}" title="Slett bolignummer ${fo.bruksenhetsNr}" aria-label="Slett bolignummer ${fo.bruksenhetsNr}">${E_IKON.soppel}</button></td>` : '';
    return `<tr class="${fo.enabled ? '' : 'er-av'}${radFeil ? ' er-feil' : ''}">${forste}${kol.slice(1).map(k => celle(fo, k)).join('')}${livCeller}${handling}</tr>
      ${varsel ? `<tr><td colspan="${kol.length + livKol.length + 1}" style="padding:0;border:0">${F.hjelpTekst(`varsel-${fo.id}`, varsel)}</td></tr>` : ''}
      ${liv && fo.enabled && F.harFeil(`boenheter.${i}.bkId`) ? `<tr><td colspan="${kol.length + livKol.length + 1}" style="border:0;padding-top:0">${F.feilHtml(`boenheter.${i}.bkId`)}</td></tr>` : ''}`;
  };

  return `<div class="e-etasje">
    <div class="e-etasje__topp">
      <div class="e-etasje__tittel">
        ${rediger ? `Etasje ${etasje[0]}<input class="e-input" id="etasje-nytt-nr" inputmode="numeric" maxlength="2" value="${eEsc(B.redigerer.nr)}" aria-label="Nytt etasjenummer">
          <button type="button" class="e-knapp e-knapp--ikon" data-handling="lagreEtasje" title="Bekreft" aria-label="Bekreft">${E_IKON.sjekk}</button>
          <button type="button" class="e-knapp e-knapp--ikon" data-handling="avbrytEtasje" title="Avbryt redigering" aria-label="Avbryt redigering">${E_IKON.kryss}</button>`
    : `Etasje ${etasje}${kanRedigere ? `<button type="button" class="e-knapp e-knapp--ikon" data-handling="redigerEtasje" data-aid="${a.id}" data-etasje="${etasje}" title="Rediger etasjenummer" aria-label="Rediger etasjenummer for ${etasje}">${E_IKON.blyant}</button>` : ''}`}
      </div>
      ${kanLegge ? `<div>
        <button type="button" class="e-knapp e-knapp--ikon" data-handling="leggTilSammeEtasje" data-aid="${a.id}" data-etasje="${etasje}" title="Legg til etasje" aria-label="Legg til etasje">${E_IKON.pluss}</button>
        <button type="button" class="e-knapp e-knapp--ikon" data-handling="kopierEtasje" data-aid="${a.id}" data-etasje="${etasje}" title="Kopier etasje" aria-label="Kopier etasje ${etasje}">${E_IKON.kopier}</button>
        <button type="button" class="e-knapp e-knapp--ikon e-knapp--subtil-destruktiv" data-handling="slettEtasje" data-aid="${a.id}" data-etasje="${etasje}" title="Slett etasje" aria-label="Slett etasje ${etasje}">${E_IKON.soppel}</button>
      </div>` : ''}
    </div>
    ${rediger && B.redigerer.feil ? `<div class="e-feilmelding">${E_IKON.feil}<span>${B.redigerer.feil}</span></div>` : ''}
    ${F.hjelpTekst(`bet-${a.id}-${etasje}`, 'Oppgi betegnelsen dere bruker på boligen i prosjektet. Hvis boligen skal selges eller leies ut er det viktig at betegnelsen benyttes i dialog med kjøper/leietaker/megler.')}
    <div class="e-tabell-rulle"><table class="e-tabell">
      <thead>
        ${liv ? `<tr><th colspan="${kol.length}" style="border:0"></th><th colspan="3" class="e-senter" style="border-left:1px solid var(--e-ramme);border-right:1px solid var(--e-ramme)">Livsløpsboliger</th><th style="border:0"></th></tr>` : ''}
        <tr>${kol.map(k => `<th>${k.h}</th>`).join('')}
          ${livKol.map((l, j) => `<th class="e-senter" style="white-space:normal;min-width:8rem">${l} ${LIVSLOP_HJELP[j] ? F.hjelpKnapp(`liv-${a.id}-${etasje}-${j}`) : ''}<br>
            <button type="button" class="e-knapp e-knapp--liten" style="margin-top:4px" data-handling="velgAlleLivslop" data-aid="${a.id}" data-etasje="${etasje}" data-bk="${livBk[j] ? livBk[j].id : ''}">Velg alle</button></th>`).join('')}
          ${kanRedigere ? '<th><span class="e-sr">Valg</span></th>' : ''}</tr>
      </thead>
      <tbody>${rader.map(rad).join('')}</tbody>
    </table></div>
    ${livKol.map((l, j) => (LIVSLOP_HJELP[j] ? F.hjelpTekst(`liv-${a.id}-${etasje}-${j}`, LIVSLOP_HJELP[j]) : '')).join('')}
    ${maksNaadd ? eCallout('advarsel', '<p>Du kan ikke legge til flere boenheter på denne boligtypen.</p>') : ''}
  </div>`;
}

function kvalitetsmodal() {
  const m = B.modal;
  const prosent = prosentFerdig(m.koder);
  const forLite = m.forsokt && prosent < 100;
  const utenNavn = m.forsokt && !m.navn;
  const boks = k => `<label class="e-valg"><input type="checkbox" data-handling="modalKode" data-kode="${k.kode}" ${m.koder.includes(k.kode) ? 'checked' : ''}><span>${k.navn}</span></label>`;
  const gruppe = (g, kat) => KVALITETER.filter(k => k.gruppe === g && k.kat === kat).map(boks).join('');
  return `<div class="e-spinner" style="background:rgba(0,0,0,.55);place-items:start center;overflow:auto;padding:24px 12px">
    <div class="e-modal e-modal--stor" role="dialog" aria-modal="true" aria-labelledby="kvalitet-tittel" style="display:block;position:static;margin:0">
      <div class="e-modal__topp"><h2 id="kvalitet-tittel">Velg kvaliteter</h2>
        <button type="button" class="e-knapp e-knapp--ikon" data-handling="modalLukk" aria-label="Lukk">${E_IKON.kryss}</button></div>
      <div class="e-modal__kropp" style="max-height:none">
        <p>For å kunne få lån i Husbanken stiller vi noen minimumskrav til kvalitet i boligene.</p>
        <span class="e-felt__label">Godkjent</span>
        <div class="e-maler${forLite ? ' er-feil' : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${prosent}" aria-label="Godkjent"><div class="e-maler__fyll" style="width:${prosent}%"></div></div>
        ${forLite ? `<div class="e-feilmelding" style="margin-top:-8px;margin-bottom:var(--space-4)">${E_IKON.feil}<span>Boligtypen oppfyller ikke Husbankens kvalitetskrav</span></div>` : ''}
        <h3 class="e-h3">Særskilt gode tiltak</h3>
        <div class="e-to"><div><h4 class="e-h4">Universell utforming</h4>${gruppe(1, 'UU')}</div><div><h4 class="e-h4">Energi og miljø</h4>${gruppe(1, 'EM')}</div></div>
        <h3 class="e-h3 e-mt">Ordinære tiltak</h3>
        <div class="e-to"><div><h4 class="e-h4">Universell utforming</h4>${gruppe(2, 'UU')}</div><div><h4 class="e-h4">Energi og miljø</h4>${gruppe(2, 'EM')}</div></div>
        <div class="e-felt e-mt${utenNavn ? ' e-felt--feil' : ''}">
          <label class="e-felt__label" for="kvalitet-navn">Gi boligkvaliteten et gjenkjennelig navn</label>
          <input class="e-input e-input--l" id="kvalitet-navn" maxlength="36" placeholder="Angi navn" value="${eEsc(m.navn)}">
          ${utenNavn ? `<div class="e-feilmelding">${E_IKON.feil}<span>Du må gi boligkvaliteten et navn</span></div>` : ''}
        </div>
        ${forLite || utenNavn ? `<div class="e-feilsammendrag"><h2>Du må svare på disse feltene før du kan gå videre:</h2><ul>
          ${forLite ? '<li>Boligtypen oppfyller ikke Husbankens kvalitetskrav</li>' : ''}${utenNavn ? '<li>Du må gi boligkvaliteten et navn</li>' : ''}</ul></div>` : ''}
      </div>
      <div class="e-modal__bunn e-modal__bunn--senter">
        <button type="button" class="e-knapp e-knapp--prominent" data-handling="modalLagre">Lagre</button>
        <button type="button" class="e-knapp" data-handling="modalLukk">Avbryt</button>
      </div>
    </div>
  </div>`;
}
