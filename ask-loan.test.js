const { calculateAskLoan } = require("./ask-loan.js");

const model = calculateAskLoan({
  innskuttKapital: 5000000,
  lanebelop: 5000000,
  lanerente: 5.6,
  forventetAvkastning: 8,
  skjermingsrente: 3.9,
  antallAar: 10,
  skattesatsGevinst: 37.84,
  skattesatsRentefradrag: 22,
});

const expectedYears = [
  [1, 5000000, 400000, 5400000, 5120000, 4720000, 5000000, 195000, 4915000],
  [2, 5120000, 409600, 5529600, 5249600, 4440000, 4915000, 191685, 4826685],
  [3, 5249600, 419968, 5669568, 5389568, 4160000, 4826685, 188241, 4734926],
  [4, 5389568, 431165, 5820733, 5540733, 3880000, 4734926, 184662, 4639588],
  [5, 5540733, 443259, 5983992, 5703992, 3600000, 4639588, 180944, 4540532],
  [6, 5703992, 456319, 6160311, 5880311, 3320000, 4540532, 177081, 4437612],
  [7, 5880311, 470425, 6350736, 6070736, 3040000, 4437612, 173067, 4330679],
  [8, 6070736, 485659, 6556395, 6276395, 2760000, 4330679, 168896, 4219576],
  [9, 6276395, 502112, 6778507, 6498507, 2480000, 4219576, 164563, 4104139],
  [10, 6498507, 519881, 7018387, 6738387, 2200000, 4104139, 160061, 3984201],
];

const fields = [
  "aar",
  "verdiStart",
  "avkastning",
  "verdiForUttak",
  "verdiEtterUttak",
  "innskudd",
  "grunnlagStart",
  "skjerming",
  "grunnlagSlutt",
];

const errors = [];

function check(label, actual, expected) {
  const rounded = Math.round(actual);
  if (Math.abs(rounded - expected) > 1) {
    errors.push(`${label}: fikk ${rounded}, forventet ${expected}`);
  }
}

if (model.years.length !== expectedYears.length) {
  errors.push(`Antall år: fikk ${model.years.length}, forventet ${expectedYears.length}`);
}

model.years.forEach((year, index) => {
  const expected = expectedYears[index];
  if (!expected) return;
  fields.forEach((field, fieldIndex) => {
    check(`År ${year.aar} ${field}`, year[field], expected[fieldIndex]);
  });
});

const settlement = [
  ["Verdi før uttak", model.oppgjor.verdiForUttak, 7018387],
  ["Renteuttak", model.oppgjor.renteuttak, 280000],
  ["Verdi etter renteuttak", model.oppgjor.verdiEtterRente, 6738387],
  ["Skjermingsgrunnlag", model.oppgjor.skjermingsgrunnlag, 3984201],
  ["Skattepliktig gevinst", model.oppgjor.skattepliktigGevinst, 2754186],
  ["Skatt", model.oppgjor.skattGevinst, 1042184],
  ["Netto fra ASK", model.oppgjor.nettoFraASK, 5696203],
  ["Innfrielse av lån", model.oppgjor.lanebelop, 5000000],
  ["Etter lån", model.oppgjor.etterLan, 696203],
  ["Rentefradrag", model.oppgjor.rentefradrag, 616000],
  ["Netto resultat", model.oppgjor.nettoResultat, 1312203],
];

settlement.forEach(([label, actual, expected]) => check(label, actual, expected));

check("Total avkastning", model.nokkel.totalAvkastning, 4538387);
check("Sum renter", model.nokkel.sumRenter, 2800000);
check("Sum skjerming", model.nokkel.sumSkjerming, 1784201);
check("Nøkkel skatt", model.nokkel.skattGevinst, 1042184);
check("Nøkkel rentefradrag", model.nokkel.rentefradrag, 616000);
check("Nøkkel netto", model.nokkel.nettoResultat, 1312203);

if (model.controlErrors.length) {
  model.controlErrors.forEach((error) => {
    errors.push(`Kontroll ${error.name}: differanse ${error.diff}`);
  });
}

if (model.warnings.length) {
  errors.push(`Uventede advarsler: ${JSON.stringify(model.warnings)}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("ask-loan testcase ok");
