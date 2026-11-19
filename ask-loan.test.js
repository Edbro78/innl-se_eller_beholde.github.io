const { calculateAskLoan, buildAskLoanProof } = require("./ask-loan.js");

const baseInput = {
  startverdiASK: 5000000,
  innskuttKapital: 5000000,
  lanebelop: 5000000,
  lanerente: 5.6,
  forventetAvkastning: 6.65,
  aksjeandel: 55,
  skjermingsrente: 3.9,
  aksjeskatt: 37.84,
  renteskatt: 22,
  antallAar: 10,
  skattesatsRentefradrag: 22,
};

const errors = [];

function check(label, actual, expected) {
  const rounded = Math.round(actual);
  if (Math.abs(rounded - expected) > 1) {
    errors.push(`${label}: fikk ${rounded}, forventet ${expected}`);
  }
}

function checkRate(label, actual, expected) {
  if (Math.abs(actual - expected) > 1e-9) {
    errors.push(`${label}: fikk ${actual}, forventet ${expected}`);
  }
}

function checkYears(name, model, fields, rows) {
  if (model.years.length !== rows.length) {
    errors.push(`${name} antall år: fikk ${model.years.length}, forventet ${rows.length}`);
  }
  model.years.forEach((year, index) => {
    const expected = rows[index];
    if (!expected) return;
    fields.forEach((field, i) => check(`${name} år ${year.aar} ${field}`, year[field], expected[i]));
  });
}

function checkControls(name, model) {
  model.controlErrors.forEach((error) => {
    errors.push(`${name} kontroll ${error.name}: differanse ${error.diff}`);
  });
}

// Testcase 1: innskutt kapital 5 MNOK
const model1 = calculateAskLoan(baseInput);
checkRate("TC1 vektet skattesats", model1.vektetSkattesats, 0.30712);
checkRate("TC1 effektiv skjermingsrente", model1.effektivSkjermingsrente, 0.02145);
check("TC1 årlig rente", model1.arligRente, 280000);
checkYears(
  "TC1",
  model1,
  ["aar", "verdiStart", "avkastning", "verdiForUttak", "verdiEtterUttak", "innskudd", "grunnlagStart", "skjerming", "grunnlagSlutt"],
  [
    [1, 5000000, 332500, 5332500, 5052500, 4720000, 5000000, 107250, 4827250],
    [2, 5052500, 335991, 5388491, 5108491, 4440000, 4827250, 103545, 4650795],
    [3, 5108491, 339715, 5448206, 5168206, 4160000, 4650795, 99760, 4470554],
    [4, 5168206, 343686, 5511892, 5231892, 3880000, 4470554, 95893, 4286447],
    [5, 5231892, 347921, 5579812, 5299812, 3600000, 4286447, 91944, 4098392],
    [6, 5299812, 352438, 5652250, 5372250, 3320000, 4098392, 87911, 3906302],
    [7, 5372250, 357255, 5729505, 5449505, 3040000, 3906302, 83790, 3710092],
    [8, 5449505, 362392, 5811897, 5531897, 2760000, 3710092, 79581, 3509674],
    [9, 5531897, 367871, 5899768, 5619768, 2480000, 3509674, 75283, 3304956],
    [10, 5619768, 373715, 5993482, 5713482, 2200000, 3304956, 70891, 3095848],
  ]
);
model1.years.forEach((year) => {
  check(`TC1 år ${year.aar} skattepliktig uttak`, year.skattepliktigUttak, 0);
  check(`TC1 år ${year.aar} skatt på uttak`, year.skattUttak, 0);
});
const o1 = model1.oppgjor;
check("TC1 Verdi etter renteuttak", o1.verdiEtterRente, 5713482);
check("TC1 Skjermingsgrunnlag", o1.skjermingsgrunnlag, 3095848);
check("TC1 Skattepliktig gevinst", o1.skattepliktigGevinst, 2617635);
check("TC1 Skatt", o1.skattGevinst, 803928);
check("TC1 Netto fra ASK", o1.nettoFraASK, 4909554);
check("TC1 Lån", o1.lanebelop, 5000000);
check("TC1 Skatt på uttak underveis", o1.sumSkattUnderveis, 0);
check("TC1 Rentefradrag", o1.rentefradrag, 616000);
check("TC1 Netto resultat", o1.nettoResultat, 525554);
check("TC1 Total avkastning", model1.nokkel.totalAvkastning, 3513482);
check("TC1 Sum skjerming", model1.nokkel.sumSkjerming, 895848);
check("TC1 Total skatt", model1.nokkel.totalSkatt, 803928);
checkControls("TC1", model1);
if (model1.warnings.length) errors.push(`TC1 uventede advarsler: ${JSON.stringify(model1.warnings)}`);

// Testcase 2: innskutt kapital 2 MNOK
const model2 = calculateAskLoan(Object.assign({}, baseInput, { innskuttKapital: 2000000 }));
checkYears(
  "TC2",
  model2,
  ["aar", "verdiStart", "avkastning", "verdiEtterUttak", "innskudd", "grunnlagStart", "skjerming", "grunnlagSlutt", "skattepliktigUttak", "skattUttak"],
  [
    [1, 5000000, 332500, 5052500, 1720000, 2000000, 42900, 1762900, 0, 0],
    [2, 5052500, 335991, 5108491, 1440000, 1762900, 37814, 1520714, 0, 0],
    [3, 5108491, 339715, 5168206, 1160000, 1520714, 32619, 1273334, 0, 0],
    [4, 5168206, 343686, 5231892, 880000, 1273334, 27313, 1020647, 0, 0],
    [5, 5231892, 347921, 5299812, 600000, 1020647, 21893, 762539, 0, 0],
    [6, 5299812, 352438, 5372250, 320000, 762539, 16356, 498896, 0, 0],
    [7, 5372250, 357255, 5449505, 40000, 498896, 10701, 229597, 0, 0],
    [8, 5449505, 362392, 5531897, 0, 229597, 4925, 0, 45478, 13967],
    [9, 5531897, 367871, 5619768, 0, 0, 0, 0, 280000, 85994],
    [10, 5619768, 373715, 5713482, 0, 0, 0, 0, 280000, 85994],
  ]
);
const o2 = model2.oppgjor;
check("TC2 Verdi etter renteuttak", o2.verdiEtterRente, 5713482);
check("TC2 Skjermingsgrunnlag", o2.skjermingsgrunnlag, 0);
check("TC2 Skattepliktig gevinst", o2.skattepliktigGevinst, 5713482);
check("TC2 Skatt", o2.skattGevinst, 1754725);
check("TC2 Netto fra ASK", o2.nettoFraASK, 3958758);
check("TC2 Lån", o2.lanebelop, 5000000);
check("TC2 Skatt på uttak år 8–10", o2.sumSkattUnderveis, 185954);
check("TC2 Rentefradrag", o2.rentefradrag, 616000);
check("TC2 Netto resultat", o2.nettoResultat, -611197);
check("TC2 Total avkastning", model2.nokkel.totalAvkastning, 3513482);
check("TC2 Sum skjerming", model2.nokkel.sumSkjerming, 194522);
check("TC2 Totalt skattepliktig", model2.nokkel.totalSkattepliktig, 6318960);
check("TC2 Total skatt", model2.nokkel.totalSkatt, 1940679);
if (model2.innskuddNullAar !== 8) errors.push(`TC2 innskudd når 0: fikk år ${model2.innskuddNullAar}, forventet år 8`);
if (model2.grunnlagNullAar !== 8) errors.push(`TC2 grunnlag når 0: fikk år ${model2.grunnlagNullAar}, forventet år 8`);
checkControls("TC2", model2);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("ask-loan testcase 1 og 2 ok");
printProof("BEVIS TESTCASE 1 (innskutt kapital 5 MNOK)", model1);
printProof("BEVIS TESTCASE 2 (innskutt kapital 2 MNOK)", model2);
printComparison(model1, model2);

function printProof(title, model) {
  console.log(`\n=== ${title} ===`);
  buildAskLoanProof(model).forEach((section) => {
    console.log(`\n${section.title}`);
    section.lines.forEach((line) => console.log(`  ${line}`));
  });
}

function kr(value) {
  const rounded = Math.round(value) || 0;
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return rounded < 0 ? `−${digits}` : digits;
}

function printComparison(m1, m2) {
  const rows = [
    ["Total avkastning", m1.nokkel.totalAvkastning, m2.nokkel.totalAvkastning],
    ["Sum skjerming", m1.nokkel.sumSkjerming, m2.nokkel.sumSkjerming],
    ["Total skatt", m1.nokkel.totalSkatt, m2.nokkel.totalSkatt],
    ["Netto resultat", m1.nokkel.nettoResultat, m2.nokkel.nettoResultat],
  ];
  console.log("\n=== SAMMENLIGNING ===");
  console.log(`  ${"".padEnd(18)}${"Case 1".padStart(12)}${"Case 2".padStart(12)}${"Forskjell".padStart(12)}`);
  rows.forEach(([label, a, b]) => {
    console.log(`  ${label.padEnd(18)}${kr(a).padStart(12)}${kr(b).padStart(12)}${kr(b - a).padStart(12)}`);
  });
  const latent = m2.input.startverdiASK - m2.input.innskuttKapital;
  console.log(`\n  Avkastningen er lik i begge casene. Forskjellen skyldes at case 2 har en latent gevinst på ${kr(latent)}`);
  console.log(`  fra start som blir beskattet, og at lavere grunnlag gir mindre skjerming (${kr(m2.nokkel.sumSkjerming)} mot ${kr(m1.nokkel.sumSkjerming)}).`);
  console.log(`  Total skatt blir ${kr(m2.nokkel.totalSkatt - m1.nokkel.totalSkatt)} høyere, og netto resultat går fra ${kr(m1.nokkel.nettoResultat)} til ${kr(m2.nokkel.nettoResultat)}.`);
}
