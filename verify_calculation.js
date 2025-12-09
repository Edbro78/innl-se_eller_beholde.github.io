// Verification script for "Verdi ved periodens slutt" calculation
// Based on Excel formula: SLUTTVERDI(Avkastning; Antall år; AVDRAG(Lånerente; Avdragsprofil; -Lån); -Startbeløp)

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
const Porteføljestørrelse = 10000000; // 10,000,000
const rentekotnader = 0.05; // 5%
const Avdragsprofil = 20; // 20 years
const Antall_år = 5; // 5 years

console.log("=== Financial Calculation Verification ===\n");
console.log("Variables:");
console.log(`  Porteføljestørrelse (Loan amount): ${Porteføljestørrelse.toLocaleString('no-NO')}`);
console.log(`  rentekotnader (Loan interest): ${(rentekotnader * 100).toFixed(2)}%`);
console.log(`  Avdragsprofil (Amortization period): ${Avdragsprofil} years`);
console.log(`  Antall år (Holding period): ${Antall_år} years\n`);

// Step 1: Calculate annual PMT based on Avdragsprofil (20 years)
// AVDRAG(rentekotnader; Avdragsprofil; -Porteføljestørrelse)
const annualPMT = calculatePMT(rentekotnader, Avdragsprofil, -Porteføljestørrelse, 0, 0);
console.log(`Step 1 - Annual Payment (PMT):`);
console.log(`  AVDRAG(${rentekotnader}; ${Avdragsprofil}; -${Porteføljestørrelse.toLocaleString('no-NO')})`);
console.log(`  Result: ${Math.round(annualPMT).toLocaleString('no-NO')} kr\n`);

// Test Case A: Forventet avkastning = 8%
console.log("=== Test Case A: 8% Expected Return ===\n");
const Forventet_avkastning_A = 0.08; // 8%

// Step 2: Calculate FV based on Antall år (5 years) using the PMT from Step 1
// SLUTTVERDI(Forventet avkastning; Antall år; PMT; -Porteføljestørrelse)
const fvRate_A = Forventet_avkastning_A;
const fvNper_A = Antall_år; // Using Antall år directly, not Avdragsprofil
const fvPmt_A = -annualPMT; // Negative because we're taking out money (loan payment)
const fvPv_A = -Porteføljestørrelse; // Negative because it's an investment (Excel convention)

console.log(`Step 2 - Future Value (FV):`);
console.log(`  SLUTTVERDI(${fvRate_A}; ${fvNper_A}; ${Math.round(fvPmt_A).toLocaleString('no-NO')}; ${fvPv_A.toLocaleString('no-NO')})`);

const futureValue_A = calculateFV(fvRate_A, fvNper_A, fvPmt_A, fvPv_A, 0);
const roundedResult_A = Math.round(Math.abs(futureValue_A)); // Take absolute value

console.log(`  Result: ${roundedResult_A.toLocaleString('no-NO')} kr`);
console.log(`  Target: 9,985,768 kr`);

if (Math.abs(roundedResult_A - 9985768) < 1000) {
  console.log(`\n✅ Verification Successful: ${roundedResult_A.toLocaleString('no-NO')}\n`);
} else {
  console.log(`\n❌ Verification Failed: Expected ~9,985,768, got ${roundedResult_A.toLocaleString('no-NO')}\n`);
}

// Test Case B: Forventet avkastning = 6.95%
console.log("=== Test Case B: 6.95% Expected Return (Sensitivity Analysis) ===\n");
const Forventet_avkastning_B = 0.0695; // 6.95%

const fvRate_B = Forventet_avkastning_B;
const fvNper_B = Antall_år;
const fvPmt_B = -annualPMT;
const fvPv_B = -Porteføljestørrelse;

const futureValue_B = calculateFV(fvRate_B, fvNper_B, fvPmt_B, fvPv_B, 0);
const roundedResult_B = Math.round(Math.abs(futureValue_B)); // Take absolute value

console.log(`  SLUTTVERDI(${fvRate_B}; ${fvNper_B}; ${Math.round(fvPmt_B).toLocaleString('no-NO')}; ${fvPv_B.toLocaleString('no-NO')})`);
console.log(`📉 Result with 6.95% return: ${roundedResult_B.toLocaleString('no-NO')} kr\n`);

// Test Case C: 1 year with 8% return (user's specific case)
console.log("=== Test Case C: 1 Year with 8% Expected Return ===\n");
const Antall_år_1 = 1; // 1 year
const Forventet_avkastning_C = 0.08; // 8%

const fvRate_C = Forventet_avkastning_C;
const fvNper_C = Antall_år_1; // 1 year
const fvPmt_C = -annualPMT; // Same PMT as before
const fvPv_C = -Porteføljestørrelse;

console.log(`  SLUTTVERDI(${fvRate_C}; ${fvNper_C}; ${Math.round(fvPmt_C).toLocaleString('no-NO')}; ${fvPv_C.toLocaleString('no-NO')})`);

const futureValue_C = calculateFV(fvRate_C, fvNper_C, fvPmt_C, fvPv_C, 0);
const exactResult_C = Math.abs(futureValue_C);
const roundedResult_C = Math.round(exactResult_C);

console.log(`  Exact result: ${exactResult_C.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Rounded result: ${roundedResult_C.toLocaleString('no-NO')} kr\n`);

// Additional verification: Compare with current implementation approach
console.log("=== Comparison with Current Implementation Approach ===\n");
console.log("Current approach uses Avdragsprofil (20 years) for FV, then compounds:");
const valueAfterLoanPeriod = calculateFV(fvRate_A, Avdragsprofil, fvPmt_A, fvPv_A, 0);
const remainingYears = Math.max(0, Antall_år - Avdragsprofil);
const compoundFactor = Math.pow(1 + fvRate_A, remainingYears);
const currentApproachResult = Math.abs(valueAfterLoanPeriod * compoundFactor);
console.log(`  Current approach result: ${Math.round(currentApproachResult).toLocaleString('no-NO')} kr`);
console.log(`  Correct approach result: ${roundedResult_A.toLocaleString('no-NO')} kr`);
console.log(`  Difference: ${(roundedResult_A - Math.round(currentApproachResult)).toLocaleString('no-NO')} kr\n`);

