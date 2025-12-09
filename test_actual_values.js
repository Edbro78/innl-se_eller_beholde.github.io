// Test med eksakte verdier fra applikasjonen for å se hva som faktisk skjer

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

function calculatePortfolioValue(portfolio, expectedReturnPct, interestPct, repaymentYears, years) {
  // Step A: Calculate Annual Outflow (PMT)
  const rate = interestPct / 100;
  const annualPayment = Math.abs(calculatePMT(rate, repaymentYears, -portfolio, 0, 0));
  
  // Step B: Calculate Portfolio Balance
  const fvRate = expectedReturnPct / 100;
  const fvPmt = -annualPayment;
  const fvPv = -portfolio;
  const fvType = 0;
  
  let futureValue;
  if (years <= repaymentYears) {
    // Scenario 1: Still paying down the loan
    futureValue = Math.abs(calculateFV(fvRate, years, fvPmt, fvPv, fvType));
  } else {
    // Scenario 2: Loan is finished, money grows free
    const balanceAtLoanEnd = calculateFV(fvRate, repaymentYears, fvPmt, fvPv, fvType);
    const remainingYears = years - repaymentYears;
    futureValue = Math.abs(balanceAtLoanEnd) * Math.pow(1 + fvRate, remainingYears);
  }
  
  return futureValue;
}

console.log("=== Testing with exact values ===\n");

// Test Case 1
console.log("Case 1: 15 år, 10 år avdrag, 8% avkastning, 5% rente");
const result1 = calculatePortfolioValue(10000000, 8.0, 5.0, 10, 15);
console.log(`  Result: ${Math.round(result1).toLocaleString('no-NO')} kr`);
console.log(`  Expected: 4,155,978 kr`);
console.log(`  Match: ${Math.abs(result1 - 4155978) < 1000 ? '✅' : '❌'}\n`);

// Test Case 2
console.log("Case 2: 1 år, 20 år avdrag, 8% avkastning, 5% rente");
const result2 = calculatePortfolioValue(10000000, 8.0, 5.0, 20, 1);
console.log(`  Result: ${Math.round(result2).toLocaleString('no-NO')} kr`);
console.log(`  Expected: 9,997,574 kr`);
console.log(`  Match: ${Math.abs(result2 - 9997574) < 1000 ? '✅' : '❌'}\n`);

// Test Case 3
console.log("Case 3: 5 år, 20 år avdrag, 8% avkastning, 5% rente");
const result3 = calculatePortfolioValue(10000000, 8.0, 5.0, 20, 5);
console.log(`  Result: ${Math.round(result3).toLocaleString('no-NO')} kr`);
console.log(`  Expected: 9,985,768 kr`);
console.log(`  Match: ${Math.abs(result3 - 9985768) < 1000 ? '✅' : '❌'}\n`);

// Test Case 4
console.log("Case 4: 10 år, 10 år avdrag, 8% avkastning, 5% rente");
const result4 = calculatePortfolioValue(10000000, 8.0, 5.0, 10, 10);
console.log(`  Result: ${Math.round(result4).toLocaleString('no-NO')} kr`);
console.log(`  Expected: 2,828,489 kr`);
console.log(`  Match: ${Math.abs(result4 - 2828489) < 1000 ? '✅' : '❌'}\n`);

// Debug Case 2 in detail
console.log("=== Detailed debug for Case 2 ===\n");
const portfolio = 10000000;
const expectedReturnPct = 8.0;
const interestPct = 5.0;
const repaymentYears = 20;
const years = 1;

const rate = interestPct / 100;
const annualPayment = Math.abs(calculatePMT(rate, repaymentYears, -portfolio, 0, 0));
console.log(`Annual Payment: ${Math.round(annualPayment).toLocaleString('no-NO')} kr`);

const fvRate = expectedReturnPct / 100;
const fvPmt = -annualPayment;
const fvPv = -portfolio;
const fvType = 0;

console.log(`FV parameters:`);
console.log(`  rate: ${fvRate}`);
console.log(`  nper: ${years}`);
console.log(`  pmt: ${fvPmt.toLocaleString('no-NO')} kr`);
console.log(`  pv: ${fvPv.toLocaleString('no-NO')} kr`);
console.log(`  type: ${fvType}`);

const fvResult = calculateFV(fvRate, years, fvPmt, fvPv, fvType);
console.log(`FV raw result: ${fvResult.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`FV absolute: ${Math.abs(fvResult).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);

