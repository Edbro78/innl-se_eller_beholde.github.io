// Test med forskjellige fortegn for å finne riktig formel

// Excel FV function (SLUTTVERDI)
function calculateFV(rate, nper, pmt, pv, type = 0) {
  if (rate === 0) {
    return pv + pmt * nper;
  }
  
  const fvif = Math.pow(1 + rate, nper);
  let fv = pv * fvif + pmt * (1 + rate * type) * (fvif - 1) / rate;
  
  return fv;
}

// Excel PMT function
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

const portfolio = 10000000;
const expectedReturn = 0.08;
const interestRate = 0.05;
const repaymentYears = 20;
const years = 1;

const annualPMT = Math.abs(calculatePMT(interestRate, repaymentYears, -portfolio, 0, 0));
console.log(`Annual PMT: ${Math.round(annualPMT).toLocaleString('no-NO')} kr\n`);

console.log("=== Testing different sign combinations ===\n");

// Test 1: Negativ PV, negativ PMT (current approach)
console.log("Test 1: PV = -portfolio, PMT = -annualPMT");
const fv1 = calculateFV(expectedReturn, years, -annualPMT, -portfolio, 0);
console.log(`  FV result: ${fv1.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Absolute: ${Math.abs(fv1).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Expected: 9,997,574 kr`);
console.log(`  Match: ${Math.abs(Math.abs(fv1) - 9997574) < 1000 ? '✅' : '❌'}\n`);

// Test 2: Positiv PV, negativ PMT
console.log("Test 2: PV = portfolio, PMT = -annualPMT");
const fv2 = calculateFV(expectedReturn, years, -annualPMT, portfolio, 0);
console.log(`  FV result: ${fv2.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Absolute: ${Math.abs(fv2).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Expected: 9,997,574 kr`);
console.log(`  Match: ${Math.abs(Math.abs(fv2) - 9997574) < 1000 ? '✅' : '❌'}\n`);

// Test 3: Negativ PV, positiv PMT
console.log("Test 3: PV = -portfolio, PMT = annualPMT");
const fv3 = calculateFV(expectedReturn, years, annualPMT, -portfolio, 0);
console.log(`  FV result: ${fv3.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Absolute: ${Math.abs(fv3).toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`  Expected: 9,997,574 kr`);
console.log(`  Match: ${Math.abs(Math.abs(fv3) - 9997574) < 1000 ? '✅' : '❌'}\n`);

// Test 4: Manual calculation for verification
console.log("=== Manual calculation ===\n");
const portfolioAfterGrowth = portfolio * (1 + expectedReturn);
const portfolioAfterPayment = portfolioAfterGrowth - annualPMT;
console.log(`Portfolio after 8% growth: ${portfolioAfterGrowth.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`Portfolio after payment: ${portfolioAfterPayment.toLocaleString('no-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`);
console.log(`Expected: 9,997,574 kr`);
console.log(`Match: ${Math.abs(portfolioAfterPayment - 9997574) < 1 ? '✅' : '❌'}\n`);

