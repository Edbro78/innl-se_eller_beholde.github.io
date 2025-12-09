// Verification script for 1 year calculation
// Portefølje: 10 MNOK, 8% avkastning, Avdragsprofil: 20 år, Antall år: 1

// Excel PMT function (AVDRAG)
function calculatePMT(rate, nper, pv, fv = 0, type = 0) {
  if (rate === 0) {
    return -(pv + fv) / nper;
  }
  
  const pvif = Math.pow(1 + rate, nper);
  const pmt = (rate * (pv * pvif + fv)) / (pvif - 1);
  
  if (type === 1) {
    return pmt / (1 + rate);
  }
  
  return pmt;
}

// Excel FV function (SLUTTVERDI)
function calculateFV(rate, nper, pmt, pv, type = 0) {
  if (rate === 0) {
    return pv + pmt * nper;
  }
  
  const fvif = Math.pow(1 + rate, nper);
  let fv = pv * fvif + pmt * (1 + rate * type) * (fvif - 1) / rate;
  
  return fv;
}

// Variable definitions
const Porteføljestørrelse = 10000000; // 10 MNOK
const rentekotnader = 0.05; // 5%
const Avdragsprofil = 20; // 20 år
const Antall_år = 1; // 1 år
const Forventet_avkastning = 0.08; // 8%

console.log("=== Beregning for 1 år ===\n");
console.log("Input:");
console.log(`  Porteføljestørrelse: ${Porteføljestørrelse.toLocaleString('no-NO')} kr`);
console.log(`  Forventet avkastning: ${(Forventet_avkastning * 100).toFixed(2)}%`);
console.log(`  rentekotnader: ${(rentekotnader * 100).toFixed(2)}%`);
console.log(`  Avdragsprofil: ${Avdragsprofil} år`);
console.log(`  Antall år: ${Antall_år} år\n`);

// Steg 1: Beregn årlig betaling (AVDRAG)
const annualPMT = calculatePMT(rentekotnader, Avdragsprofil, -Porteføljestørrelse, 0, 0);
console.log("Steg 1 - Årlig betaling (AVDRAG):");
console.log(`  AVDRAG(${rentekotnader}; ${Avdragsprofil}; -${Porteføljestørrelse.toLocaleString('no-NO')})`);
console.log(`  Resultat: ${Math.round(Math.abs(annualPMT)).toLocaleString('no-NO')} kr\n`);

// Steg 2: Beregn verdi ved periodens slutt (SLUTTVERDI)
const fvRate = Forventet_avkastning;
const fvNper = Antall_år; // 1 år
const fvPmt = -annualPMT; // Negativ fordi vi tar ut penger
const fvPv = -Porteføljestørrelse; // Negativ fordi det er en investering

console.log("Steg 2 - Verdi ved periodens slutt (SLUTTVERDI):");
console.log(`  SLUTTVERDI(${fvRate}; ${fvNper}; ${Math.round(Math.abs(fvPmt)).toLocaleString('no-NO')}; ${fvPv.toLocaleString('no-NO')})`);

const futureValue = calculateFV(fvRate, fvNper, fvPmt, fvPv, 0);
const exactResult = Math.abs(futureValue);

console.log(`\n✅ Eksakt resultat: ${exactResult.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`✅ Avrundet resultat: ${Math.round(exactResult).toLocaleString('no-NO')} kr\n`);

// Sammenligning med feilaktig formel (for referanse)
console.log("=== Sammenligning med feilaktig formel (for referanse) ===\n");
const wrongValueAfterLoanPeriod = calculateFV(fvRate, Avdragsprofil, fvPmt, fvPv, 0);
const wrongRemainingYears = Math.max(0, Antall_år - Avdragsprofil);
const wrongCompoundFactor = Math.pow(1 + fvRate, wrongRemainingYears);
const wrongResult = Math.abs(wrongValueAfterLoanPeriod * wrongCompoundFactor);
console.log(`  Feilaktig formel (bruker Avdragsprofil): ${wrongResult.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Korrekt formel (bruker Antall år): ${exactResult.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Forskjell: ${(exactResult - wrongResult).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr\n`);

