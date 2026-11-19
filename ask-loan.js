// Lånefinansiert ASK, avdragsfritt eller annuitetslån. Ren beregning: input inn, årsrader, oppgjør og nøkkeltall ut.
// Beløp avrundes ikke underveis.
function calculateAskLoan(input) {
  const src = input || {};
  const lanebelop = num(src.lanebelop);
  const startverdiASK = src.startverdiASK === undefined || src.startverdiASK === null
    ? lanebelop
    : num(src.startverdiASK);
  const innskuttKapital = Math.max(0, num(src.innskuttKapital));
  const lanerente = num(src.lanerente) / 100;
  const forventetAvkastning = num(src.forventetAvkastning) / 100;
  const skjermingsrente = num(src.skjermingsrente) / 100;
  const antallAar = Math.max(0, Math.round(num(src.antallAar)));
  const aksjeandel = src.aksjeandel === undefined || src.aksjeandel === null
    ? 1
    : Math.max(0, Math.min(100, num(src.aksjeandel))) / 100;
  const aksjeskatt = num(src.aksjeskatt) / 100;
  const renteskatt = num(src.renteskatt) / 100;
  const skattesatsRentefradrag = num(src.skattesatsRentefradrag) / 100;
  const avdragsfrihet = src.avdragsfrihet !== false;
  const avdragsprofilAar = Math.max(0, Math.round(num(src.avdragsprofilAar)));
  const arligRente = lanebelop * lanerente;
  const annuitet = avdragsfrihet ? arligRente : annuityPayment(lanerente, avdragsprofilAar, lanebelop);
  const effektivSkjermingsrente = skjermingsrente * aksjeandel;
  const vektetSkattesats = aksjeandel * aksjeskatt + (1 - aksjeandel) * renteskatt;

  const years = [];
  const warnings = [];
  let verdi = startverdiASK;
  let innskudd = innskuttKapital;
  let grunnlag = innskuttKapital;
  let restlan = lanebelop;
  let sumRenter = 0;
  let innskuddNullAar = null;
  let grunnlagNullAar = null;

  for (let t = 1; t <= antallAar; t++) {
    const verdiStart = verdi;
    const innskuddStart = innskudd;
    const grunnlagStart = grunnlag;
    const avkastning = verdiStart * forventetAvkastning;
    const verdiForUttak = verdiStart + avkastning;
    const skjerming = grunnlagStart * effektivSkjermingsrente;
    const tilgjengeligSkattefritt = grunnlagStart + skjerming;
    const restlanStart = restlan;
    const rente = restlanStart * lanerente;
    let avdrag = 0;
    if (!avdragsfrihet && restlanStart > 0) {
      avdrag = t >= avdragsprofilAar ? restlanStart : Math.min(restlanStart, annuitet - rente);
    }
    restlan = Math.max(0, restlanStart - avdrag);
    sumRenter += rente;
    const uttak = rente + avdrag;
    const skattepliktigUttak = Math.max(0, uttak - tilgjengeligSkattefritt);
    const skattUttak = skattepliktigUttak * vektetSkattesats;
    const verdiEtterUttak = verdiForUttak - uttak;
    innskudd = Math.max(0, innskuddStart - uttak);
    const grunnlagSlutt = Math.max(0, tilgjengeligSkattefritt - uttak);
    const ubruktSkjerming = grunnlagSlutt - innskudd;

    const innskuddNaarNull = innskuddStart > 0 && innskudd === 0;
    const grunnlagNaarNull = grunnlagStart > 0 && grunnlagSlutt === 0;
    if (innskuddNaarNull && innskuddNullAar === null) innskuddNullAar = t;
    if (grunnlagNaarNull && grunnlagNullAar === null) grunnlagNullAar = t;

    if (skattepliktigUttak > 0) {
      warnings.push({
        type: "skattepliktig-uttak",
        year: t,
        uttak,
        tilgjengeligSkattefritt,
        skattepliktigUttak,
        skattUttak,
      });
    }
    if (verdiEtterUttak < 0) {
      warnings.push({ type: "negativ-verdi", year: t, verdiEtterUttak });
    }

    years.push({
      aar: t,
      verdiStart,
      avkastning,
      verdiForUttak,
      rente,
      avdrag,
      uttak,
      restlan,
      verdiEtterUttak,
      innskuddStart,
      innskudd,
      grunnlagStart,
      skjerming,
      tilgjengeligSkattefritt,
      grunnlagSlutt,
      ubruktSkjerming,
      skattepliktigUttak,
      skattUttak,
      innskuddNaarNull,
      grunnlagNaarNull,
    });

    verdi = verdiEtterUttak;
    grunnlag = grunnlagSlutt;
  }

  const last = years.length
    ? years[years.length - 1]
    : {
        verdiForUttak: startverdiASK,
        verdiEtterUttak: startverdiASK,
        grunnlagSlutt: innskuttKapital,
        innskudd: innskuttKapital,
        ubruktSkjerming: 0,
      };

  const verdiEtterRente = last.verdiEtterUttak;
  const skjermingsgrunnlag = last.grunnlagSlutt;
  const tapScenario = verdiEtterRente < last.innskudd;
  const tapMotInnskudd = tapScenario ? last.innskudd - verdiEtterRente : 0;
  const skattepliktigGevinst = tapScenario ? 0 : Math.max(0, verdiEtterRente - skjermingsgrunnlag);
  const skattGevinst = skattepliktigGevinst * vektetSkattesats;
  const tapsfradrag = tapMotInnskudd * vektetSkattesats;
  const nettoFraASK = verdiEtterRente - skattGevinst;
  const sumSkattUnderveis = years.reduce((sum, year) => sum + year.skattUttak, 0);
  const sumSkattepliktigUttak = years.reduce((sum, year) => sum + year.skattepliktigUttak, 0);
  const rentefradrag = sumRenter * skattesatsRentefradrag;
  const etterLan = nettoFraASK - restlan;
  const nettoResultat = etterLan - sumSkattUnderveis + rentefradrag + tapsfradrag;

  if (tapScenario) {
    warnings.push({
      type: "tap",
      verdiEtterRente,
      innskudd: last.innskudd,
      tapMotInnskudd,
      tapsfradrag,
    });
  }

  const totalAvkastning = years.reduce((sum, year) => sum + year.avkastning, 0);
  const sumSkjerming = years.reduce((sum, year) => sum + year.skjerming, 0);
  const totalSkattepliktig = sumSkattepliktigUttak + skattepliktigGevinst;
  const totalSkatt = skattGevinst + sumSkattUnderveis;
  const sumUttakForSiste = years.slice(0, -1).reduce((sum, year) => sum + year.uttak, 0);

  const controlErrors = [];
  if (years.length) {
    pushControl(
      controlErrors,
      "K1 Total avkastning",
      totalAvkastning,
      last.verdiForUttak + sumUttakForSiste - startverdiASK
    );
    if (!tapScenario) {
      pushControl(
        controlErrors,
        "K2 Totalt skattepliktig",
        totalSkattepliktig,
        totalAvkastning + (startverdiASK - innskuttKapital) - sumSkjerming
      );
    }
    pushControl(controlErrors, "K3 Total skatt", totalSkatt, totalSkattepliktig * vektetSkattesats);
    pushControl(
      controlErrors,
      "K4 Netto resultat",
      nettoResultat,
      startverdiASK - lanebelop + totalAvkastning - sumRenter - totalSkatt + rentefradrag + tapsfradrag
    );
  }

  return {
    input: {
      startverdiASK,
      innskuttKapital,
      lanebelop,
      lanerente,
      forventetAvkastning,
      skjermingsrente,
      antallAar,
      aksjeandel,
      aksjeskatt,
      renteskatt,
      skattesatsRentefradrag,
      avdragsfrihet,
      avdragsprofilAar,
    },
    arligRente,
    arligUttak: years.length ? years[0].uttak : annuitet,
    annuitet,
    sumUttakForSiste,
    effektivSkjermingsrente,
    vektetSkattesats,
    years,
    warnings,
    controlErrors,
    innskuddNullAar,
    grunnlagNullAar,
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
      sumSkattepliktigUttak,
      totalSkattepliktig,
      sumSkattUnderveis,
      sumRenter,
      rentefradrag,
      tapMotInnskudd,
      tapsfradrag,
      tapScenario,
      totalSkatt,
      nettoResultat,
    },
    nokkel: {
      totalAvkastning,
      sumRenter,
      sumSkjerming,
      totalSkattepliktig,
      skattGevinst,
      sumSkattUnderveis,
      totalSkatt,
      vektetSkattesats,
      effektivSkjermingsrente,
      rentefradrag,
      nettoResultat,
    },
  };
}

// Utregning med faktiske tall, som seksjoner med tekstlinjer. Brukes av testen og «Vis utregning».
function buildAskLoanProof(model) {
  const inp = model.input;
  const o = model.oppgjor;
  const n = model.nokkel;
  const u = model.arligUttak;
  const r = proofRound;
  const sections = [];

  sections.push({
    title: "Avledede satser",
    lines: [
      inp.avdragsfrihet
        ? `Årlig uttak (avdragsfritt): ${proofKr(inp.lanebelop)} × ${proofPct(inp.lanerente)} = ${proofKr(u)}`
        : `Årlig uttak (annuitet over ${inp.avdragsprofilAar} år): ${proofKr(model.annuitet)}, fordelt på renter av restlån og avdrag`,
      `Vektet skattesats: ${proofShare(inp.aksjeandel)} × ${proofPct(inp.aksjeskatt)} + ${proofShare(1 - inp.aksjeandel)} × ${proofPct(inp.renteskatt)} = ${proofPct(model.vektetSkattesats)}`,
      `Effektiv skjermingsrente: ${proofPct(inp.skjermingsrente)} × ${proofShare(inp.aksjeandel)} = ${proofPct(model.effektivSkjermingsrente)}`,
    ],
  });

  const yearLines = model.years.map((y) => {
    const parts = [
      `År ${y.aar}: avkastning ${proofKr(y.verdiStart)} × ${proofPct(inp.forventetAvkastning)} = ${proofKr(y.avkastning)}`,
      `skjerming ${proofKr(y.grunnlagStart)} × ${proofPct(model.effektivSkjermingsrente)} = ${proofKr(y.skjerming)}`,
      `tilgjengelig skattefritt ${proofKr(y.grunnlagStart)} + ${proofKr(y.skjerming)} = ${proofKr(y.tilgjengeligSkattefritt)}`,
    ];
    if (!inp.avdragsfrihet) {
      parts.push(`uttak = renter ${proofKr(y.rente)} + avdrag ${proofKr(y.avdrag)} = ${proofKr(y.uttak)}, restlån ${proofKr(y.restlan)}`);
    }
    parts.push(`skattepliktig uttak max(0, ${proofKr(y.uttak)} − ${proofKr(y.tilgjengeligSkattefritt)}) = ${proofKr(y.skattepliktigUttak)}`);
    if (y.skattUttak > 0) {
      parts.push(`skatt ${proofKr(y.skattepliktigUttak)} × ${proofPct(model.vektetSkattesats)} = ${proofKr(y.skattUttak)}`);
    }
    parts.push(`innskudd max(0, ${proofKr(y.innskuddStart)} − ${proofKr(y.uttak)}) = ${proofKr(y.innskudd)}${y.innskuddNaarNull ? " (innskuddet når 0)" : ""}`);
    parts.push(`grunnlag max(0, ${proofKr(y.tilgjengeligSkattefritt)} − ${proofKr(y.uttak)}) = ${proofKr(y.grunnlagSlutt)}${y.grunnlagNaarNull ? " (grunnlaget når 0)" : ""}`);
    return parts.join("; ");
  });
  sections.push({ title: "År for år", lines: yearLines });

  const special = [];
  const yearByNo = (t) => model.years[t - 1];
  if (model.innskuddNullAar) {
    const before = yearByNo(model.innskuddNullAar - 1);
    if (before) {
      special.push(`År ${before.aar}: innskudd ${proofKr(before.innskuddStart)} − ${proofKr(before.uttak)} = ${proofKr(before.innskudd)}. Grunnlag ${proofKr(before.grunnlagStart)} + ${proofKr(before.skjerming)} − ${proofKr(before.uttak)} = ${proofKr(before.grunnlagSlutt)}.`);
    }
    const y = yearByNo(model.innskuddNullAar);
    let text = `År ${y.aar}: innskuddet går fra ${proofKr(y.innskuddStart)} til 0. Tilgjengelig skattefritt ${proofKr(y.grunnlagStart)} + ${proofKr(y.skjerming)} = ${proofKr(y.tilgjengeligSkattefritt)}.`;
    if (y.skattepliktigUttak > 0) {
      text += ` Skattepliktig uttak ${proofKr(y.uttak)} − ${proofKr(y.tilgjengeligSkattefritt)} = ${proofKr(y.skattepliktigUttak)}. Skatt ${proofKr(y.skattepliktigUttak)} × ${proofPct(model.vektetSkattesats)} = ${proofKr(y.skattUttak)}.`;
    } else {
      text += ` Resten av uttaket dekkes av ubrukt skjerming, nytt grunnlag ${proofKr(y.grunnlagSlutt)}. Ingen skatt.`;
    }
    if (y.grunnlagNaarNull) text += " Grunnlaget går til 0.";
    special.push(text);
  }
  if (model.grunnlagNullAar && model.grunnlagNullAar !== model.innskuddNullAar) {
    const y = yearByNo(model.grunnlagNullAar);
    special.push(`År ${y.aar}: tilgjengelig skattefritt ${proofKr(y.grunnlagStart)} + ${proofKr(y.skjerming)} = ${proofKr(y.tilgjengeligSkattefritt)}. Skattepliktig uttak ${proofKr(y.uttak)} − ${proofKr(y.tilgjengeligSkattefritt)} = ${proofKr(y.skattepliktigUttak)}. Skatt ${proofKr(y.skattUttak)}. Grunnlaget går til 0.`);
  }
  if (model.grunnlagNullAar) {
    const fullTax = model.years.filter((y) => y.aar > model.grunnlagNullAar && y.uttak > 0);
    if (fullTax.length) {
      const sameUttak = fullTax.every((y) => proofRound(y.uttak) === proofRound(fullTax[0].uttak));
      if (sameUttak) {
        const range = fullTax.length === 1 ? `År ${fullTax[0].aar}` : `År ${fullTax[0].aar}–${fullTax[fullTax.length - 1].aar}`;
        const fu = fullTax[0].uttak;
        special.push(`${range}: grunnlag 0 og skjerming 0. Hele uttaket på ${proofKr(fu)} er skattepliktig, skatt ${proofKr(fu)} × ${proofPct(model.vektetSkattesats)} = ${proofKr(fu * model.vektetSkattesats)} per år.`);
      } else {
        fullTax.forEach((y) => {
          special.push(`År ${y.aar}: grunnlag 0 og skjerming 0. Hele uttaket på ${proofKr(y.uttak)} er skattepliktig, skatt ${proofKr(y.skattUttak)}.`);
        });
      }
    }
  }
  const last = model.years[model.years.length - 1];
  if (last && last.innskudd > 0 && !model.grunnlagNullAar) {
    special.push(`År ${last.aar}: grunnlag ${proofKr(last.grunnlagStart)} + ${proofKr(last.skjerming)} − ${proofKr(last.uttak)} = ${proofKr(last.grunnlagSlutt)} = innskudd ${proofKr(last.innskudd)} + sum skjerming ${proofKr(n.sumSkjerming)}`);
  }
  if (special.length) sections.push({ title: "Særskilte år", lines: special });

  const settlement = [
    `Skattepliktig gevinst: ${proofKr(o.verdiEtterRente)} − ${proofKr(o.skjermingsgrunnlag)} = ${proofKr(o.skattepliktigGevinst)}`,
    `Skatt: ${proofKr(o.skattepliktigGevinst)} × ${proofPct(model.vektetSkattesats)} = ${proofKr(o.skattGevinst)}`,
    `Netto fra ASK: ${proofKr(o.verdiEtterRente)} − ${proofKr(o.skattGevinst)} = ${proofKr(o.nettoFraASK)}`,
    `Rentefradrag: ${proofKr(o.sumRenter)} × ${proofPct(inp.skattesatsRentefradrag)} = ${proofKr(o.rentefradrag)}`,
    `Netto resultat: ${proofKr(o.nettoFraASK)} − ${proofKr(o.restlan)}${o.sumSkattUnderveis > 0 ? ` − ${proofKr(o.sumSkattUnderveis)}` : ""} + ${proofKr(o.rentefradrag)}${o.tapsfradrag > 0 ? ` + tapsfradrag ${proofKr(o.tapsfradrag)}` : ""} = ${proofKr(o.nettoResultat)}`,
  ];
  sections.push({ title: "Oppgjør", lines: settlement });

  const note = (calc, exact) => (r(calc) !== r(exact) ? ` (avrundingsavvik på ${proofKr(Math.abs(r(calc) - r(exact)))} kr er godkjent)` : "");
  const priorYears = model.years.slice(0, -1);
  const uniformUttak = priorYears.every((y) => proofRound(y.uttak) === proofRound(u));
  const k1Uttak = uniformUttak
    ? `${priorYears.length} × ${proofKr(u)}`
    : `sum uttak år 1–${priorYears.length} ${proofKr(model.sumUttakForSiste)}`;
  const k1 = r(last ? last.verdiForUttak : 0) + (uniformUttak ? priorYears.length * r(u) : r(model.sumUttakForSiste)) - r(inp.startverdiASK);
  const latent = inp.startverdiASK - inp.innskuttKapital;
  const k2Right = r(n.totalAvkastning) + r(latent) - r(n.sumSkjerming);
  const taxedParts = model.years.filter((y) => y.skattepliktigUttak > 0).map((y) => proofKr(y.skattepliktigUttak));
  const k2Left = taxedParts.length
    ? `${taxedParts.join(" + ")} + ${proofKr(o.skattepliktigGevinst)} = ${proofKr(o.totalSkattepliktig)} = `
    : "";
  const k3Sum = o.sumSkattUnderveis > 0 ? ` = ${proofKr(o.skattGevinst)} + ${proofKr(o.sumSkattUnderveis)}` : "";
  const k4 = r(inp.startverdiASK) - r(inp.lanebelop) + r(n.totalAvkastning) - r(n.sumRenter) - r(n.totalSkatt) + r(n.rentefradrag) + r(o.tapsfradrag);
  const controls = [
    `K1: ${proofKr(last ? last.verdiForUttak : 0)} + ${k1Uttak} − ${proofKr(inp.startverdiASK)} = ${proofKr(k1)}${note(k1, n.totalAvkastning)}`,
    `K2: ${k2Left}${proofKr(n.totalAvkastning)} + ${proofKr(latent)} − ${proofKr(n.sumSkjerming)} = ${proofKr(k2Right)}${note(k2Right, o.totalSkattepliktig)}`,
    `K3: ${proofKr(o.totalSkattepliktig)} × ${proofPct(model.vektetSkattesats)} = ${proofKr(n.totalSkatt)}${k3Sum}`,
    `K4: ${proofKr(inp.startverdiASK)} − ${proofKr(inp.lanebelop)} + ${proofKr(n.totalAvkastning)} − ${proofKr(n.sumRenter)} − ${proofKr(n.totalSkatt)} + ${proofKr(n.rentefradrag)}${o.tapsfradrag > 0 ? ` + ${proofKr(o.tapsfradrag)}` : ""} = ${proofKr(k4)}${note(k4, n.nettoResultat)}`,
    `Kontrollfeil i koden: ${model.controlErrors.length ? model.controlErrors.map((e) => `${e.name} avviker med ${proofKr(e.diff)}`).join(", ") : "ingen"}`,
  ];
  sections.push({ title: "Kontroller", lines: controls });
  return sections;
}

function annuityPayment(rate, nper, pv) {
  if (!(pv > 0) || !(nper > 0)) return 0;
  if (rate === 0) return pv / nper;
  const factor = Math.pow(1 + rate, nper);
  return pv * rate * factor / (factor - 1);
}

function proofRound(value) {
  return Math.round(value) || 0;
}

function proofKr(value) {
  const rounded = proofRound(value);
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return rounded < 0 ? `−${digits}` : digits;
}

function proofPct(rate) {
  return `${(rate * 100).toFixed(4).replace(/\.?0+$/, "").replace(".", ",")} %`;
}

function proofShare(share) {
  return share.toFixed(4).replace(/\.?0+$/, "").replace(".", ",");
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
  module.exports = { calculateAskLoan, buildAskLoanProof };
}
