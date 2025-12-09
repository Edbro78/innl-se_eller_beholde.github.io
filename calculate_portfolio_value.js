// Robust financial calculation function for portfolio value
// Follows the exact specification with two scenarios

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

/**
 * Calculate portfolio value at end of period
 * 
 * @param {number} porteføljestørrelse - Initial investment/loan amount
 * @param {number} forventet_avkastning - Annual return on investment (e.g., 0.08 for 8%)
 * @param {number} rentekostnad - Annual interest rate on loan (e.g., 0.05 for 5%)
 * @param {number} avdragsprofil - Number of years for loan amortization
 * @param {number} antall_år - Total duration to calculate value for
 * @returns {number} Portfolio value at end of period
 */
function calculatePortfolioValue(porteføljestørrelse, forventet_avkastning, rentekostnad, avdragsprofil, antall_år) {
  // Step A: Calculate Annual Outflow (PMT)
  // PMT(rate=rentekostnad, nper=avdragsprofil, pv=-porteføljestørrelse)
  const annualPMT = calculatePMT(rentekostnad, avdragsprofil, -porteføljestørrelse, 0, 0);
  
  // Step B: Calculate Portfolio Balance
  if (antall_år <= avdragsprofil) {
    // Scenario 1: Still paying down the loan
    // FV(rate=forventet_avkastning, nper=antall_år, pmt=PMT_from_Step_A, pv=-porteføljestørrelse)
    const fv = calculateFV(
      forventet_avkastning,
      antall_år,
      -annualPMT, // Negative because it's an outflow
      -porteføljestørrelse, // Negative because it's an investment (Excel convention)
      0
    );
    return Math.abs(fv);
  } else {
    // Scenario 2: Loan is finished, money grows free
    // Step 1: Calculate balance at end of avdragsprofil period
    const balanceAtLoanEnd = calculateFV(
      forventet_avkastning,
      avdragsprofil,
      -annualPMT,
      -porteføljestørrelse,
      0
    );
    
    // Step 2: Compound the remaining balance for remaining years
    const remainingYears = antall_år - avdragsprofil;
    const finalValue = Math.abs(balanceAtLoanEnd) * Math.pow(1 + forventet_avkastning, remainingYears);
    
    return finalValue;
  }
}

// Test Cases
console.log("=== Financial Calculation Verification ===\n");

// Case 1: The Long Run (Profit Phase)
console.log("Case 1: The Long Run (Profit Phase)");
console.log("  porteføljestørrelse: 10,000,000");
console.log("  forventet_avkastning: 8% (0.08)");
console.log("  rentekostnad: 5% (0.05)");
console.log("  avdragsprofil: 10");
console.log("  antall_år: 15");
const result1 = calculatePortfolioValue(10000000, 0.08, 0.05, 10, 15);
console.log(`  Result: ${Math.round(result1).toLocaleString('no-NO')} kr`);
console.log(`  Expected: ~4,155,974 kr`);
console.log(`  Match: ${Math.abs(result1 - 4155974) < 1000 ? '✅' : '❌'}\n`);

// Case 2: Short Term (Negative Cashflow Effect)
console.log("Case 2: Short Term (Negative Cashflow Effect)");
console.log("  porteføljestørrelse: 10,000,000");
console.log("  forventet_avkastning: 8% (0.08)");
console.log("  rentekostnad: 5% (0.05)");
console.log("  avdragsprofil: 20");
console.log("  antall_år: 1");
const result2 = calculatePortfolioValue(10000000, 0.08, 0.05, 20, 1);
console.log(`  Result: ${Math.round(result2).toLocaleString('no-NO')} kr`);
console.log(`  Expected: ~9,997,574 kr`);
console.log(`  Match: ${Math.abs(result2 - 9997574) < 1000 ? '✅' : '❌'}\n`);

// Case 3: Medium Term (Still paying loan)
console.log("Case 3: Medium Term (Still paying loan)");
console.log("  porteføljestørrelse: 10,000,000");
console.log("  forventet_avkastning: 8% (0.08)");
console.log("  rentekostnad: 5% (0.05)");
console.log("  avdragsprofil: 20");
console.log("  antall_år: 5");
const result3 = calculatePortfolioValue(10000000, 0.08, 0.05, 20, 5);
console.log(`  Result: ${Math.round(result3).toLocaleString('no-NO')} kr`);
console.log(`  Expected: ~9,985,768 kr`);
console.log(`  Match: ${Math.abs(result3 - 9985768) < 1000 ? '✅' : '❌'}\n`);

// Case 4: Exact Loan Finish (Break Point)
console.log("Case 4: Exact Loan Finish (Break Point)");
console.log("  porteføljestørrelse: 10,000,000");
console.log("  forventet_avkastning: 8% (0.08)");
console.log("  rentekostnad: 5% (0.05)");
console.log("  avdragsprofil: 10");
console.log("  antall_år: 10");
const result4 = calculatePortfolioValue(10000000, 0.08, 0.05, 10, 10);
console.log(`  Result: ${Math.round(result4).toLocaleString('no-NO')} kr`);
console.log(`  Expected: ~2,828,487 kr`);
console.log(`  Match: ${Math.abs(result4 - 2828487) < 1000 ? '✅' : '❌'}\n`);

// Detailed breakdown for Case 2 (1 year) to understand the calculation
console.log("=== Detailed Breakdown for Case 2 (1 year) ===\n");
const porteføljestørrelse = 10000000;
const forventet_avkastning = 0.08;
const rentekostnad = 0.05;
const avdragsprofil = 20;
const antall_år = 1;

const pmt = calculatePMT(rentekostnad, avdragsprofil, -porteføljestørrelse, 0, 0);
console.log(`Step A - Annual PMT: ${Math.round(Math.abs(pmt)).toLocaleString('no-NO')} kr`);

const fv = calculateFV(forventet_avkastning, antall_år, -pmt, -porteføljestørrelse, 0);
console.log(`Step B - FV calculation:`);
console.log(`  FV(${forventet_avkastning}; ${antall_år}; ${Math.round(Math.abs(-pmt)).toLocaleString('no-NO')}; ${-porteføljestørrelse.toLocaleString('no-NO')})`);
console.log(`  Raw FV result: ${fv.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Absolute value: ${Math.abs(fv).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);

