// Lånefinansiert ASK. Ren beregning: input inn, årsrader, oppgjør og nøkkeltall ut.
// Beløp avrundes ikke underveis.
function calculateAskLoan(input) {
  const src = input || {};
  const innskuttKapital = num(src.innskuttKapital);
  const lanebelop = num(src.lanebelop);
  const lanerente = num(src.lanerente) / 100;
  const forventetAvkastning = num(src.forventetAvkastning) / 100;
  const skjermingsrente = num(src.skjermingsrente) / 100;
  const antallAar = Math.max(0, Math.round(num(src.antallAar)));
  const skattesatsGevinst = num(src.skattesatsGevinst) / 100;
  const skattesatsRentefradrag = num(src.skattesatsRentefradrag) / 100;
  const avdragsfrihet = src.avdragsfrihet !== false;
  const avdragsprofilAar = Math.max(0, Math.round(num(src.avdragsprofilAar)));
  const arligRente = lanebelop * lanerente;
  const annuitet = avdragsfrihet ? arligRente : annuityPayment(lanerente, avdragsprofilAar, lanebelop);

  const years = [];
  const warnings = [];
  let verdi = innskuttKapital;
  let innskudd = innskuttKapital;
  let grunnlag = innskuttKapital;
  let restlan = lanebelop;
  let sumRenter = 0;
  let tidligereSkattepliktig = 0;

  for (let t = 1; t <= antallAar; t++) {
    const verdiStart = verdi;
    const avkastning = verdiStart * forventetAvkastning;
    const verdiForUttak = verdiStart + avkastning;
    const grunnlagStart = grunnlag;
    const skjerming = grunnlagStart * skjermingsrente;
    const innskuddFoer = innskudd;
    let rente = 0;
    let avdrag = 0;
    let uttak = 0;
    if (avdragsfrihet) {
      rente = arligRente;
      uttak = arligRente;
    } else if (restlan > 0 && t <= avdragsprofilAar) {
      rente = restlan * lanerente;
      const skyldig = restlan + rente;
      uttak = t === avdragsprofilAar ? skyldig : Math.min(annuitet, skyldig);
      avdrag = uttak - rente;
      restlan -= avdrag;
      if (restlan < 1e-6) restlan = 0;
    }
    sumRenter += rente;

    let skattepliktigUttak = 0;
    if (uttak > innskuddFoer) {
      const overskytende = uttak - innskuddFoer;
      const ubrukt = Math.max(0, grunnlagStart + skjerming - innskuddFoer);
      skattepliktigUttak = Math.max(0, overskytende - ubrukt);
      tidligereSkattepliktig += skattepliktigUttak;
      warnings.push({
        type: "uttak-over-innskudd",
        year: t,
        uttak,
        innskudd: innskuddFoer,
        skattepliktig: skattepliktigUttak,
      });
    }

    const verdiEtterUttak = verdiForUttak - uttak;
    innskudd = innskuddFoer - uttak;
    const grunnlagSlutt = grunnlagStart + skjerming - uttak;
    const ubruktSkjerming = grunnlagSlutt - innskudd;

    years.push({
      aar: t,
      verdiStart,
      avkastning,
      verdiForUttak,
      uttak,
      rente,
      avdrag,
      restlan,
      verdiEtterUttak,
      innskudd,
      grunnlagStart,
      skjerming,
      grunnlagSlutt,
      ubruktSkjerming,
      skattepliktigUttak,
    });

    verdi = verdiEtterUttak;
    grunnlag = grunnlagSlutt;
  }

  const last = years.length
    ? years[years.length - 1]
    : {
        verdiForUttak: innskuttKapital,
        verdiEtterUttak: innskuttKapital,
        grunnlagSlutt: innskuttKapital,
        innskudd: innskuttKapital,
        ubruktSkjerming: 0,
      };

  const verdiEtterRente = last.verdiEtterUttak;
  const skjermingsgrunnlag = last.grunnlagSlutt;
  const tapMotInnskudd = Math.max(0, last.innskudd - verdiEtterRente);
  const skattepliktigGevinst = tapMotInnskudd > 0 ? 0 : Math.max(0, verdiEtterRente - skjermingsgrunnlag);
  const tapsfradrag = tapMotInnskudd * skattesatsGevinst;
  const skattGevinst = tapMotInnskudd > 0
    ? tidligereSkattepliktig * skattesatsGevinst
    : (skattepliktigGevinst + tidligereSkattepliktig) * skattesatsGevinst;
  const nettoFraASK = verdiEtterRente - skattGevinst;
  const etterLan = nettoFraASK - restlan;
  const rentefradrag = sumRenter * skattesatsRentefradrag;
  const nettoResultat = etterLan + rentefradrag + tapsfradrag;

  if (tapMotInnskudd > 0) {
    warnings.push({
      type: "tap",
      verdiEtterRente,
      skjermingsgrunnlag,
      innskudd: last.innskudd,
      tapMotInnskudd,
      tapsfradrag,
    });
  }

  const totalAvkastning = years.reduce((sum, year) => sum + year.avkastning, 0);
  const sumSkjerming = years.reduce((sum, year) => sum + year.skjerming, 0);
  const sumUttakForSiste = years.slice(0, -1).reduce((sum, year) => sum + year.uttak, 0);
  const control1 = years.length
    ? last.verdiForUttak + sumUttakForSiste - innskuttKapital
    : 0;
  const control2 = years.length ? last.innskudd + sumSkjerming : 0;
  const control3 = totalAvkastning - sumSkjerming;
  const control4 = totalAvkastning - sumRenter - skattGevinst + rentefradrag + tapsfradrag + innskuttKapital - lanebelop;

  const controlErrors = [];
  pushControl(controlErrors, "Total avkastning", totalAvkastning, control1);
  pushControl(controlErrors, "Skjermingsgrunnlag", skjermingsgrunnlag, control2);
  pushControl(controlErrors, "Skattepliktig gevinst", skattepliktigGevinst, Math.max(0, control3));
  pushControl(controlErrors, "Netto resultat", nettoResultat, control4);

  return {
    arligRente,
    arligUttak: avdragsfrihet ? arligRente : annuitet,
    avdragsfrihet,
    years,
    warnings,
    controlErrors,
    oppgjor: {
      verdiForUttak: last.verdiForUttak,
      renteuttak: arligRente,
      verdiEtterRente,
      skjermingsgrunnlag,
      innskudd: last.innskudd,
      ubruktSkjerming: last.ubruktSkjerming,
      skattepliktigGevinst,
      skattGevinst,
      nettoFraASK,
      lanebelop,
      restlan,
      etterLan,
      sumRenter,
      rentefradrag,
      tapMotInnskudd,
      tapsfradrag,
      tapScenario: tapMotInnskudd > 0,
      nettoResultat,
    },
    nokkel: {
      totalAvkastning,
      sumRenter,
      sumSkjerming,
      skattGevinst,
      rentefradrag,
      nettoResultat,
    },
  };
}

function annuityPayment(rate, nper, pv) {
  if (!(pv > 0) || !(nper > 0)) return 0;
  if (rate === 0) return pv / nper;
  const factor = Math.pow(1 + rate, nper);
  return pv * rate * factor / (factor - 1);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pushControl(errors, name, left, right) {
  const diff = left - right;
  if (Math.abs(diff) > 1) {
    errors.push({ name, left, right, diff });
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateAskLoan };
}
