// Global app state
let __nextId = 1;
function genId() { return __nextId++; }

const AppState = {
  assets: [
    { id: genId(), name: "LIKVIDER", amount: 2000000, locked: true },
    { id: genId(), name: "FAST EIENDOM", amount: 15000000, locked: true },
    { id: genId(), name: "INVESTERINGER", amount: 8000000, locked: true }
  ],
  debts: [
    { id: genId(), name: "BOLIGLÅN", amount: 10000000 }
  ],
  incomes: [
    { id: genId(), name: "LØNNSINNTEKT", amount: 1500000 },
    { id: genId(), name: "UTBYTTER", amount: 0 },
    { id: genId(), name: "ANDRE INNTEKTER", amount: 0 },
    { id: genId(), name: "ÅRLIG SKATT", amount: 0 },
    { id: genId(), name: "ÅRLIGE KOSTNADER", amount: 0 }
  ],
  debtParams: { type: "Annuitetslån", years: 25, rate: 0.04 },
  expectations: { likvider: 4, fastEiendom: 5, investeringer: 8, andreEiendeler: 0 }
};

document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");
  const sectionTitle = document.getElementById("sectionTitle");
  const moduleRoot = document.getElementById("module-root");
  const stepperList = document.getElementById("stepper-list");
  // Output UI
  initOutputUI();

  // Theme init + toggle
  initTheme();

  // Nullstill-knapp
  const resetBtn = document.getElementById("reset-all");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Nullstill alle beløp i app-state
      (AppState.assets || []).forEach(a => a.amount = 0);
      (AppState.debts || []).forEach(d => d.amount = 0);
      (AppState.incomes || []).forEach(i => i.amount = 0);
      // Re-render gjeldende fane
      const current = document.querySelector(".nav-item.is-active");
      const section = current && (current.getAttribute("data-section") || current.textContent || "");
      if (moduleRoot) {
        if (section === "Eiendeler") renderAssetsModule(moduleRoot);
        else if (section === "Gjeld") renderDebtModule(moduleRoot);
        else if (section === "Inntekter") renderIncomeModule(moduleRoot);
        else if (section === "Analyse") renderAnalysisModule(moduleRoot);
        else if (section === "Tapsbærende evne") renderTbeModule(moduleRoot);
        else if (section === "Forventet avkastning") renderExpectationsModule(moduleRoot);
        else if (section === "Grafikk I") renderGraphicsModule(moduleRoot);
        else if (section === "Grafikk II") renderDonutModule(moduleRoot);
        else if (section === "Kontantstrøm") renderWaterfallModule(moduleRoot);
        else if (section === "Fremtidig utvikling") renderFutureModule(moduleRoot);
        else moduleRoot.innerHTML = "";
      }
      updateTopSummaries();
    });
  }

  // Bygg stepper (uten å vise "Nullstille")
  const allSteps = [
    { key: "Input" },
    { key: "Låne for å investere" },
    { key: "Utbytte/lån" },
    { key: "Innløse Fondskonto" },
    { key: "Innløse ASK" },
    { key: "Nullstille" }
  ];
  const steps = allSteps.filter(s => s.key !== "Nullstille");
  function renderStepper(currentKey) {
    if (!stepperList) return;
    stepperList.innerHTML = "";
    // Sett dynamisk kolonneantall
    stepperList.style.setProperty("--step-count", String(steps.length));
    steps.forEach((s, idx) => {
      const li = document.createElement("li");
      li.className = "step";
      const dot = document.createElement("span");
      dot.className = "step-dot";
      const label = document.createElement("span");
      label.className = "step-label";
      label.textContent = s.key;
      li.appendChild(dot); li.appendChild(label);
      let currentIndex = steps.findIndex(x => x.key === currentKey);
      if (currentIndex < 0) currentIndex = steps.length - 1; // ved "Nullstille" marker siste synlige steg
      if (idx <= currentIndex) li.classList.add("is-reached");
      if (idx === currentIndex) li.classList.add("is-current");
      stepperList.appendChild(li);
    });
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const currentlyActive = document.querySelector(".nav-item.is-active");
      if (currentlyActive) currentlyActive.classList.remove("is-active");

      item.classList.add("is-active");

      const title = item.getAttribute("data-section") || item.textContent || "";
      if (sectionTitle) sectionTitle.textContent = title;
      renderStepper(title);

      if (!moduleRoot) return;
      renderPlaceholder(moduleRoot);
    });
  });

  // Last inn startvisning (plassholder)
  if (moduleRoot) {
    renderPlaceholder(moduleRoot);
  }
  // Oppdater summer i topp-boksene
  updateTopSummaries();
  // Init stepper
  renderStepper("Input");
});

function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const startDark = stored ? stored === "dark" : systemPrefersDark;
  if (startDark) root.classList.add("dark"); else root.classList.remove("dark");
  updateThemeToggleButton(btn, root.classList.contains("dark"));
  if (btn) {
    btn.addEventListener("click", () => {
      const isDark = root.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeToggleButton(btn, isDark);
    });
  }
}

function updateThemeToggleButton(btn, isDark) {
  if (!btn) return;
  btn.setAttribute("aria-pressed", isDark ? "true" : "false");
  btn.textContent = isDark ? "☀️" : "🌙";
}

// Global flagg for å huske om Input-fanen er initialisert
let inputTabInitialized = false;

// Oppdater Input-fanens verdier basert på AppState (uten å re-rendre)
function updateInputTabValues() {
  // Oppdater år-slider
  const yearsSlider = document.getElementById('input-years-slider');
  if (yearsSlider) {
    const newValue = String(AppState.yearsCount || 10);
    if (yearsSlider.value !== newValue) {
      yearsSlider.value = newValue;
      yearsSlider.dispatchEvent(new Event('input'));
    }
  }

  // Oppdater portefølje-slider
  const portfolioSlider = document.getElementById('input-portfolio-slider');
  if (portfolioSlider) {
    const newValue = String(AppState.portfolioSize || 10000000);
    if (portfolioSlider.value !== newValue) {
      portfolioSlider.value = newValue;
      portfolioSlider.dispatchEvent(new Event('input'));
    }
  }

  // Oppdater aksjeandel-knapper (finn alle buttons med aria-pressed i modulen)
  const moduleRoot = document.getElementById('module-root');
  if (moduleRoot) {
    const buttons = Array.from(moduleRoot.querySelectorAll('button[aria-pressed]'));
    const expectedOption = AppState.stockShareOption || "65% Aksjer";
    const targetButton = buttons.find(b => b.textContent.trim() === expectedOption);
    if (targetButton) {
      const isActive = targetButton.getAttribute('aria-pressed') === 'true';
      if (!isActive) {
        targetButton.click();
      }
    }
  }

  // Oppdater forventet avkastning-slidere
  const equitySlider = document.getElementById('expEquity-slider');
  if (equitySlider) {
    const newValue = String(AppState.expEquity || 8.0);
    if (equitySlider.value !== newValue) {
      equitySlider.value = newValue;
      equitySlider.dispatchEvent(new Event('input'));
    }
  }

  const bondsSlider = document.getElementById('expBonds-slider');
  if (bondsSlider) {
    const newValue = String(AppState.expBonds || 5.0);
    if (bondsSlider.value !== newValue) {
      bondsSlider.value = newValue;
      bondsSlider.dispatchEvent(new Event('input'));
    }
  }

  const kpiSlider = document.getElementById('expKpi-slider');
  if (kpiSlider) {
    const newValue = String(AppState.expKpi || 0.0);
    if (kpiSlider.value !== newValue) {
      kpiSlider.value = newValue;
      kpiSlider.dispatchEvent(new Event('input'));
    }
  }

  // Oppdater skjermingsrente
  const shieldSlider = document.getElementById('shield-rate-slider');
  if (shieldSlider) {
    const shieldValue = AppState.shieldRatePct || 3.9;
    if (Number(shieldSlider.value) !== shieldValue) {
      shieldSlider.value = String(shieldValue);
      shieldSlider.dispatchEvent(new Event('input'));
    }
  }

  // Oppdater rentekostnader-slider
  const intSlider = document.getElementById('interest-cost-slider');
  if (intSlider) {
    const intValue = AppState.interestCostPct || 5.0;
    if (Number(intSlider.value) !== intValue) {
      intSlider.value = String(intValue);
      intSlider.dispatchEvent(new Event('input'));
    }
  }

  // Oppdater innskutt kapital-slider
  const capitalSlider = document.getElementById('input-capital-slider');
  if (capitalSlider) {
    const capitalValue = AppState.inputCapital || 0;
    if (Number(capitalSlider.value) !== capitalValue) {
      capitalSlider.value = String(capitalValue);
      capitalSlider.dispatchEvent(new Event('input'));
    }
  }

  // Oppdater rådgivningshonorar-knapper
  const feeButtons = Array.from(moduleRoot.querySelectorAll('button[aria-pressed]'));
  const feeButtonsFiltered = feeButtons.filter(b => {
    const text = b.textContent.trim();
    return text && /^\d+[.,]\d+%$/.test(text.replace(/\s/g, ''));
  });
  if (feeButtonsFiltered.length > 0) {
    const feeOptions = [0.0, 1.37, 0.93, 0.81, 0.69, 0.57];
    const savedFee = AppState.advisoryFeePct !== undefined ? AppState.advisoryFeePct : 0.0;
    const savedFeeIdx = feeOptions.findIndex(f => Math.abs(f - savedFee) < 0.01);
    if (savedFeeIdx >= 0 && savedFeeIdx < feeButtonsFiltered.length) {
      const targetButton = feeButtonsFiltered[savedFeeIdx];
      if (targetButton && targetButton.getAttribute('aria-pressed') !== 'true') {
        targetButton.click();
      }
    }
  }

  // Oppdater tekstfelt for skatt (Utbytteskatt og Kapitalskatt)
  const textInputs = moduleRoot.querySelectorAll('input[type="text"][inputMode="decimal"]');
  textInputs.forEach(input => {
    const label = input.closest('div')?.previousElementSibling;
    if (label) {
      const labelText = label.textContent || '';
      if ((labelText.includes('Utbytteskatt') || labelText.includes('Skatt aksjer')) && AppState.stockTaxPct !== undefined) {
        const currentValue = parseFloat(input.value.replace(',', '.')) || 0;
        const savedValue = AppState.stockTaxPct;
        if (Math.abs(currentValue - savedValue) > 0.01) {
          input.value = savedValue.toFixed(2).replace('.', ',');
          // Ikke dispatche input-event for å unngå loop
        }
      } else if (labelText.includes('Kapitalskatt') && AppState.capitalTaxPct !== undefined) {
        const currentValue = parseFloat(input.value.replace(',', '.')) || 0;
        const savedValue = AppState.capitalTaxPct;
        if (Math.abs(currentValue - savedValue) > 0.01) {
          input.value = savedValue.toFixed(2).replace('.', ',');
          // Ikke dispatche input-event for å unngå loop
        }
      }
    }
  });

  // Oppdater alle andre verdier
  updateTopSummaries();
}

// Enkel plassholder for alle faner
function renderPlaceholder(root) {
  const active = document.querySelector(".nav-item.is-active");
  const title = (active && (active.getAttribute("data-section") || active.textContent || "")).trim();
  
  // For Nullstille-fanen: nullstill alle verdier
  if (title === "Nullstille") {
    // Nullstill alle verdier i AppState til default-verdier
    (AppState.assets || []).forEach(a => {
      if (!a.locked) a.amount = 0;
    });
    (AppState.debts || []).forEach(d => d.amount = 0);
    (AppState.incomes || []).forEach(i => i.amount = 0);
    AppState.portfolioSize = 10000000;
    AppState.yearsCount = 10;
    AppState.stockSharePercent = 65;
    AppState.stockShareOption = "65% Aksjer";
    AppState.expEquity = 8.0;
    AppState.expBonds = 5.0;
    AppState.expKpi = 0.0;
    AppState.advisoryFeePct = 0.0;
    AppState.interestCostPct = 5.0;
    AppState.shieldRatePct = 3.9;
    AppState.capitalTaxPct = 22.0;
    AppState.stockTaxPct = 37.84;
    AppState.inputCapital = 0;
    inputTabInitialized = false; // Reset flagg for å la Input rendres på nytt med nullstilte verdier
    updateTopSummaries();
    // Gå tilbake til Input-fanen etter nullstilling og tving re-render
    const inputNav = document.querySelector('.nav-item[data-section="Input"]');
    if (inputNav && moduleRoot) {
      // Fjern eksisterende innhold for å tvinge ny rendering med nullstilte verdier
      moduleRoot.innerHTML = "";
      inputNav.click();
    }
    return;
  }
  
  // For Input-fanen: sjekk om elementene faktisk eksisterer først
  if (title === "Input") {
    const yearsSlider = document.getElementById('input-years-slider');
    const portfolioSlider = document.getElementById('input-portfolio-slider');
    const expectedReturnOut = document.getElementById('expected-return-out');
    
    // Hvis elementene eksisterer og root har innhold, oppdater bare verdiene (ikke render på nytt)
    if (inputTabInitialized && root.children.length > 0 && yearsSlider && portfolioSlider && expectedReturnOut) {
      updateInputTabValues();
      return;
    }
    // Hvis elementene ikke eksisterer eller root er tom, må vi rendre på nytt
  }
  
  root.innerHTML = "";
  function makePanel() {
    const panel = document.createElement("div");
    panel.className = "panel";
    const p = document.createElement("p");
    p.textContent = "jeg vil fylle hver fane med innhold etterhvert";
    panel.appendChild(p);
    return panel;
  }
  const first = makePanel();
  root.appendChild(first);
  // Kun for Input: legg til to ekstra identiske bokser under,
  // med lik avstand mellom hver (16px), og gjør den tredje høyere
  // title er allerede definert øverst i funksjonen
  // Faner som skal ha to stående paneler som i "Låne for å investere"
  const twoPanelTabs = new Set(["Låne for å investere", "Utbytte/lån", "Innløse ASK", "Innløse Fondskonto"]);
  if (twoPanelTabs.has(title)) {
    const spacing = 1; // luft mellom panelene i rem for zoom-uavhengighet
    if (first && first.remove) first.remove();
    const container = document.createElement("div");
    container.style.display = "grid";
    container.style.gridTemplateColumns = "1fr 1fr";
    container.style.gridAutoRows = "1fr"; // Sikrer at begge rader får samme høyde
    container.style.gap = `${spacing}rem`;
    container.style.alignItems = "stretch"; // Strekker paneler til samme høyde
    root.appendChild(container);

    const left = makePanel();
    const right = makePanel();
    left.style.gridColumn = "auto";
    right.style.gridColumn = "auto";
    left.style.margin = "0";
    right.style.margin = "0";
    left.style.height = "100%"; // Fyll hele grid-cellen
    right.style.height = "100%"; // Fyll hele grid-cellen
    container.appendChild(left);
    container.appendChild(right);

    // Innløse Fondskonto: to kolonner med perfekt linje-justering
    if (title === "Innløse Fondskonto") {
      [left, right].forEach(col => {
        col.innerHTML = "";
        col.style.display = "grid";
        col.style.gridAutoRows = "minmax(1.75rem, auto)"; // konsistent linjehøyde
        col.style.rowGap = "0.5rem";
        col.style.alignContent = "start";
      });

      function makeRow(text, opts = {}) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.lineHeight = "1.4";
        const label = document.createElement("span");
        label.textContent = opts.placeholder ? "" : text;
        if (opts.labelId) label.id = opts.labelId;
        if (opts.bold) label.style.fontWeight = "700";
        if (opts.red) label.style.color = "#D32F2F";
        const value = document.createElement("span");
        value.textContent = opts.placeholder ? "" : "";
        if (opts.id) value.id = opts.id;
        value.style.minWidth = "7rem";
        value.style.textAlign = "right";
        row.appendChild(label);
        row.appendChild(value);
        return row;
      }

      function makeDivider() {
        const div = document.createElement("div");
        div.style.height = "1px";
        div.style.background = "var(--BORDER_LIGHT)";
        return div;
      }

      // Venstre: Flytte fondskonto
      left.appendChild(makeRow("Flytte fondskonto:", { bold: true }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Portefølje", { id: "fk-left-portfolio" }));
      left.appendChild(makeRow("Innskutt kapital", { id: "fk-left-capital" }));
      left.appendChild(makeRow("Gevinst", { id: "fk-left-gain" }));
      left.appendChild(makeRow("Skatt", { red: true, id: "fk-left-tax" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Netto portefølje", { bold: true, id: "fk-left-net" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow(`Verdi portefølje om ${AppState.yearsCount || 0} år:`, { id: "fk-left-future", labelId: "fk-left-future-label" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow(`Gevinst om ${AppState.yearsCount || 0} år`, { id: "fk-left-gain-future", labelId: "fk-left-gain-future-label" }));
      left.appendChild(makeRow("Skjermingsgrunnlag", { id: "fk-left-shield" }));
      left.appendChild(makeRow("Avkastning utover skjerming", { id: "fk-left-excess" }));
      left.appendChild(makeRow("Skatt", { red: true, id: "fk-left-tax-future" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Netto portefølje", { bold: true, id: "fk-left-net-future" }));

      // Høyre: Ikke flytte Fondskonto
      right.appendChild(makeRow("Ikke flytte Fondskonto:", { bold: true }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow("Portefølje", { id: "fk-right-portfolio" }));
      right.appendChild(makeRow("Innskutt kapital", { id: "fk-right-capital" }));
      right.appendChild(makeRow("Gevinst", { id: "fk-right-gain" }));
      right.appendChild(makeRow("Skatt", { red: true }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow("Netto portefølje", { bold: true, id: "fk-right-net-now" }));
      // Sett øyeblikkelig verdi for høyre "Netto portefølje" til porteføljestørrelse
      try {
        const sumAssetsNow = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
        let portfolioNow = sumAssetsNow;
        const portfolioSliderNow = document.getElementById('input-portfolio-slider');
        if (portfolioSliderNow && portfolioSliderNow.value) {
          const v = Number(portfolioSliderNow.value);
          if (isFinite(v)) portfolioNow = v;
        } else if (isFinite(AppState.portfolioSize)) {
          portfolioNow = Number(AppState.portfolioSize);
        }
        const elNRNowInit = document.getElementById('fk-right-net-now');
        if (elNRNowInit) elNRNowInit.textContent = formatNOK(Math.round(portfolioNow));
      } catch (_) {}
      right.appendChild(makeDivider());
      right.appendChild(makeRow(`Verdi portefølje om ${AppState.yearsCount || 0} år:`, { id: "fk-right-future", labelId: "fk-right-future-label" }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow(`Gevinst om ${AppState.yearsCount || 0} år`, { id: "fk-right-gain-future", labelId: "fk-right-gain-future-label" }));
      right.appendChild(makeRow("Skjermingsgrunnlag"));
      right.appendChild(makeRow("Avkastning utover skjerming"));
      right.appendChild(makeRow("Skatt", { red: true, id: "fk-right-tax" }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow("Netto portefølje", { bold: true, id: "fk-right-net" }));

      // Sett verdier i venstre kolonne (initialt)
      try {
        const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
        // Portefølje: bruk Input-fanens slider om den finnes; deretter AppState.portfolioSize; ellers sumAssets
        let portfolio = sumAssets;
        const portfolioSlider = document.getElementById('input-portfolio-slider');
        if (portfolioSlider && portfolioSlider.value) {
          const v = Number(portfolioSlider.value);
          if (isFinite(v)) portfolio = v;
        } else if (isFinite(AppState.portfolioSize)) {
          portfolio = Number(AppState.portfolioSize);
        }
        // Innskutt kapital hentes fra Input-fanen (slider) eller AppState
        let capital = 0;
        const capitalSliderEl = document.getElementById('input-capital-slider');
        if (capitalSliderEl && capitalSliderEl.value) {
          const v = Number(capitalSliderEl.value);
          if (isFinite(v)) capital = v;
        } else if (isFinite(AppState.inputCapital)) {
          capital = Number(AppState.inputCapital);
        }
        const gain = Math.max(0, Math.round(portfolio - capital)); // Gevinst = Portefølje − Innskutt kapital
        const tax = Math.round(gain * 0.378);
        const elP = document.getElementById("fk-left-portfolio");
        const elC = document.getElementById("fk-left-capital");
        const elG = document.getElementById("fk-left-gain");
        const elT = document.getElementById("fk-left-tax");
        const elNet = document.getElementById("fk-left-net");
        const elFuture = document.getElementById("fk-left-future");
        const elGainFuture = document.getElementById("fk-left-gain-future");
        const elShield = document.getElementById("fk-left-shield");
        const elExcess = document.getElementById("fk-left-excess");
        const elTaxFuture = document.getElementById("fk-left-tax-future");
        // høyre kolonne
        const elPR = document.getElementById("fk-right-portfolio");
        const elCR = document.getElementById("fk-right-capital");
        const elGR = document.getElementById("fk-right-gain");
        const elNR = document.getElementById("fk-right-net");
        const elNRNow = document.getElementById("fk-right-net-now");
        const elFR = document.getElementById("fk-right-future");
        const elGFR = document.getElementById("fk-right-gain-future");
        const elTR = document.getElementById("fk-right-tax");
        if (elP) elP.textContent = formatNOK(Math.round(portfolio));
        if (elPR) elPR.textContent = formatNOK(Math.round(portfolio));
        if (elC) elC.textContent = formatNOK(capital);
        if (elCR) elCR.textContent = formatNOK(capital);
        if (elG) elG.textContent = formatNOK(gain);
        if (elGR) elGR.textContent = formatNOK(gain);
        if (elT) { elT.textContent = formatNOK(tax); elT.style.color = "#D32F2F"; }

        // Netto portefølje = Portefølje - Skatt
        const net = Math.max(0, Math.round(portfolio - tax));
        if (elNet) elNet.textContent = formatNOK(net);

        // År og forventet avkastning hentes fra Input
        let years = 0;
        const yearsSlider = document.getElementById('input-years-slider');
        if (yearsSlider && yearsSlider.value) {
          years = Number(yearsSlider.value);
        } else if (isFinite(AppState.yearsCount)) {
          years = Number(AppState.yearsCount);
        }
        
        // Oppdater label-tekstene med dynamisk antall år
        const elLeftFutureLabel = document.getElementById('fk-left-future-label');
        if (elLeftFutureLabel) elLeftFutureLabel.textContent = `Verdi portefølje om ${years} år:`;
        const elLeftGainFutureLabel = document.getElementById('fk-left-gain-future-label');
        if (elLeftGainFutureLabel) elLeftGainFutureLabel.textContent = `Gevinst om ${years} år`;
        const elRightFutureLabel = document.getElementById('fk-right-future-label');
        if (elRightFutureLabel) elRightFutureLabel.textContent = `Verdi portefølje om ${years} år:`;
        const elRightGainFutureLabel = document.getElementById('fk-right-gain-future-label');
        if (elRightGainFutureLabel) elRightGainFutureLabel.textContent = `Gevinst om ${years} år`;

        let expectedReturnPct = 0;
        const inputExpectedReturn = document.getElementById('expected-return-out');
        if (inputExpectedReturn) {
          const txt = (inputExpectedReturn.textContent || "").replace('%','').trim().replace(',', '.');
          const v = Number(txt);
          if (isFinite(v)) expectedReturnPct = v;
        }
        if (!isFinite(expectedReturnPct) || expectedReturnPct === 0) {
          // Fallback til AppState eller beregn fra state
          if (isFinite(AppState.expectedReturnPct)) {
            expectedReturnPct = Number(AppState.expectedReturnPct);
          } else {
            const eq = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
            const bd = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
            const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
            const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
            let share = 65;
            if (typeof AppState.stockSharePercent === 'number') share = AppState.stockSharePercent;
            else if (AppState.stockShareOption) {
              const m = String(AppState.stockShareOption).match(/(\d+)%/);
              if (m) share = Number(m[1]);
            }
            const equityShare = share / 100;
            const gross = equityShare * eq + (1 - equityShare) * bd;
            expectedReturnPct = gross - fee - kpi;
          }
        }
        const r = expectedReturnPct / 100;
        const future = Math.round(net * Math.pow(1 + r, years));
        if (elFuture) elFuture.textContent = formatNOK(future);

        // Høyre: Verdi om x år = netto portefølje × (1 + r)^år
        const futureRight = Math.round(portfolio * Math.pow(1 + r, years));
        if (elFR) elFR.textContent = formatNOK(futureRight);
        // Høyre: Gevinst om x år = portefølje om x år − innskutt kapital
        const gainRight = Math.max(0, futureRight - capital);
        if (elGFR) elGFR.textContent = formatNOK(gainRight);
        // Høyre: Skatt = gevinst om x år × ((aksjeandel × 0,378) + ((1 − aksjeandel) × 0,22))
        if (elTR) {
          let equitySharePctR = 65;
          if (typeof AppState.stockSharePercent === 'number') equitySharePctR = AppState.stockSharePercent;
          else if (AppState.stockShareOption) {
            const m = String(AppState.stockShareOption).match(/(\d+)%/);
            if (m) equitySharePctR = Number(m[1]);
          }
          const equityShareR = Math.max(0, Math.min(1, equitySharePctR / 100));
          const interestShareR = 1 - equityShareR;
          const rateRight = equityShareR * 0.378 + interestShareR * 0.22;
          const taxRight = Math.round(gainRight * rateRight);
          elTR.textContent = formatNOK(taxRight);
          elTR.style.color = "#D32F2F";
          // Høyre: Netto portefølje (fremtid) = Verdi om x år − Skatt
          if (elNR) elNR.textContent = formatNOK(Math.max(0, futureRight - taxRight));
        }

        // Gevinst om x år = framtidsverdi - netto nå
        const gainFuture = Math.max(0, future - net);
        if (elGainFuture) elGainFuture.textContent = formatNOK(gainFuture);

        // Skjermingsgrunnlag = (netto * aksjeandel) * (1 + skjermingsrente)^år
        let shieldRate = 0;
        const shieldSlider = document.getElementById('shield-rate-slider');
        if (shieldSlider && shieldSlider.value) shieldRate = Number(shieldSlider.value);
        else if (isFinite(AppState.shieldRatePct)) shieldRate = Number(AppState.shieldRatePct);
        let equitySharePct = 65;
        if (typeof AppState.stockSharePercent === 'number') equitySharePct = AppState.stockSharePercent;
        else if (AppState.stockShareOption) {
          const m = String(AppState.stockShareOption).match(/(\d+)%/);
          if (m) equitySharePct = Number(m[1]);
        }
        const shieldBase = Math.round(net * (equitySharePct / 100) * Math.pow(1 + shieldRate / 100, years));
        if (elShield) elShield.textContent = formatNOK(shieldBase);

        // Avkastning utover skjerming = framtidsverdi - skjermingsgrunnlag
        const excess = Math.max(0, future - shieldBase);
        if (elExcess) elExcess.textContent = formatNOK(excess);

        // Skatt (fremtid) = avkastning utover skjerming × ((aksjeandel × 0,378) + ((1 − aksjeandel) × 0,22))
        const equityShare = Math.max(0, Math.min(1, equitySharePct / 100));
        const interestShare = 1 - equityShare; // renteandel
        const effectiveTaxRate = equityShare * 0.378 + interestShare * 0.22;
        const taxFuture = Math.round(excess * effectiveTaxRate);
        if (elTaxFuture) { elTaxFuture.textContent = formatNOK(taxFuture); elTaxFuture.style.color = "#D32F2F"; }

        // Netto portefølje (fremtid) = Fremtidsverdi − Skatt (fremtid)
        const elNetFuture = document.getElementById("fk-left-net-future");
        if (elNetFuture) elNetFuture.textContent = formatNOK(Math.max(0, future - taxFuture));
      } catch (_) {}

      return; // ikke kjør annen tab-spesifikk logikk
    }

    // Hvis fanen er "Låne for å investere": fyll venstre panel med pen kalkulasjonsliste
    if (title === "Låne for å investere") {
      left.innerHTML = "";
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "0.75rem"; // Bruker rem for zoom-uavhengighet
      left.style.paddingTop = "1rem";
      left.style.paddingBottom = "1rem";

      function addDivider() {
        const div = document.createElement("div");
        div.style.height = "1px";
        div.style.background = "var(--BORDER_LIGHT)";
        div.style.margin = "0.25rem 0"; // Bruker rem
        left.appendChild(div);
      }

      function addCalcRow(id, labelText, isStrong, isItalic = false, isCost = false) {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 10rem"; // Bruker rem i stedet for px
        row.style.alignItems = "center";
        row.style.gap = "0.75rem"; // Bruker rem

        // Behägelig rødfarge for kostnader (bruker samme rød som ERROR_DEBT men litt mer behagelig)
        const costColor = "#D32F2F"; // En behagelig rødfarge, ikke for sterk

        const label = document.createElement("div");
        label.textContent = labelText;
        label.style.color = isCost ? costColor : "var(--GRAY_TEXT_DARK)";
        label.style.fontWeight = isStrong ? "700" : "400";
        label.style.fontSize = isStrong ? "1.125rem" : "1rem"; // Allerede rem, bra
        label.style.fontStyle = isItalic ? "italic" : "normal";

        const value = document.createElement("div");
        value.id = id;
        value.className = "asset-amount";
        value.textContent = ""; // fylles senere
        value.style.width = "10rem"; // Bruker rem i stedet for px
        value.style.fontSize = isStrong ? "1.125rem" : "1rem";
        value.style.padding = "0.625rem 0.75rem"; // Bruker rem
        value.style.textAlign = "right";
        value.style.color = isCost ? costColor : "inherit"; // Sett rødfarge på verdien også hvis kostnad
        // Gjør "hvite boksen" usynlig, men behold plassering og størrelse
        value.style.background = "transparent";
        value.style.border = "none";
        value.style.boxShadow = "none";

        row.appendChild(label);
        row.appendChild(value);
        left.appendChild(row);
        return value;
      }

      addCalcRow("calc-portfolio", "Portefølje", false);
      addCalcRow("calc-expected", "Forventet avkastning", false);
      addDivider();
      addCalcRow("calc-endvalue", "Verdi ved periodens slutt", true);
      addCalcRow("calc-return", "Avkastning", false, true); // italic
      addCalcRow("calc-shield", "Skjerming", false, true); // italic
      addDivider();
      addCalcRow("calc-tax", "Skatt", false, true, true); // italic, cost (rød)
      addDivider();
      addCalcRow("calc-loanrepay", "Oppgjør gjeld", true, false, true); // bold, cost (rød)
      addCalcRow("calc-interest-deduction", "Fradrag rentekostnader", false); // regular
      addDivider();
      addCalcRow("calc-net", "Netto avkastning", true);
      // Fyll verdier umiddelbart ved rendering
      try { updateInvestLoanCalc(); } catch (_) {}

      // Høyre panel: alternativt regnestykke
      right.innerHTML = "";
      right.style.display = "flex";
      right.style.flexDirection = "column";
      right.style.gap = "0.75rem"; // Bruker rem for zoom-uavhengighet
      right.style.paddingTop = "1rem";
      right.style.paddingBottom = "1rem";

      function addDividerR() {
        const div = document.createElement("div");
        div.style.height = "1px";
        div.style.background = "var(--BORDER_LIGHT)";
        div.style.margin = "0.25rem 0"; // Bruker rem
        right.appendChild(div);
      }

      function addCalcRowR(id, labelText, isStrong) {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 10rem"; // Bruker rem i stedet for px
        row.style.alignItems = "center";
        row.style.gap = "0.75rem"; // Bruker rem

        const label = document.createElement("div");
        label.textContent = labelText;
        label.style.color = "var(--GRAY_TEXT_DARK)";
        label.style.fontWeight = isStrong ? "700" : "400";
        label.style.fontSize = isStrong ? "1.125rem" : "1rem"; // Allerede rem, bra

        const value = document.createElement("div");
        value.id = id;
        value.className = "asset-amount";
        value.textContent = "";
        value.style.width = "10rem"; // Bruker rem i stedet for px
        value.style.fontSize = isStrong ? "1.125rem" : "1rem";
        value.style.padding = "0.625rem 0.75rem"; // Bruker rem
        value.style.textAlign = "right";
        // Gjør "hvite boksen" usynlig, men behold plassering og størrelse
        value.style.background = "transparent";
        value.style.border = "none";
        value.style.boxShadow = "none";

        row.appendChild(label);
        row.appendChild(value);
        right.appendChild(row);
        return value;
      }

      addCalcRowR("calc2-loan", "Lån", false);
      addCalcRowR("calc2-interest", "Rentekostnad", false);
      addDividerR();
      addCalcRowR("calc2-endvalue", "Lån inklusiv renter", true);
      addCalcRowR("calc2-interestAfterTax", "Rentekostnad etter skatt", false);
      
      // Legg til flere dummy-linjer for å matche antall linjer i venstre panel
      // Venstre panel har flere linjer (Avkastning, Skjerming, Skatt, Oppgjør gjeld, Fradrag rentekostnader)
      // Høyre panel trenger ekstra høyd for å få "Avkastning utover lånekostnad" på linje med "Netto avkastning"
      for (let i = 0; i < 5; i++) {
        const dummyDiv = document.createElement("div");
        dummyDiv.style.height = "2.5rem"; // ca samme høyde som en calc-row
        dummyDiv.style.visibility = "hidden";
        right.appendChild(dummyDiv);
      }
      
      addDividerR();
      const excessRow = addCalcRowR("calc2-excess", "Avkastning utover lånekostnad", true);
      // Juster margin for å matche "Netto avkastning" i venstre tabell
      if (excessRow && excessRow.parentElement) {
        excessRow.parentElement.style.marginTop = "0";
        excessRow.parentElement.style.marginBottom = "0.75rem"; // Bruker rem for zoom-uavhengighet
      }
      // Fyll også høyre-verdier ved rendering
      try { updateInvestLoanRightCalc(); } catch (_) {}
    }
    
    // Hvis fanen er "Utbytte/lån": fyll venstre panel med regnestykke
    if (title === "Utbytte/lån") {
      left.innerHTML = "";
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "0.5rem"; // Redusert fra 0.75rem for mer kompakt layout
      left.style.paddingTop = "1rem";
      left.style.paddingBottom = "1rem";
      // Vis innhold; venstre side skal ha tallbokser for utvalgte linjer
      const showDividendLoanContent = true;
      const textOnly = false; // venstre panel viser verdier på enkelte linjer
      // Tall skal vises, men med usynlige rammer rundt boksene
      AppState.hideDividendLoanNumbers = false;

      function addDivider() {
        const div = document.createElement("div");
        div.style.height = "1px";
        div.style.background = "var(--BORDER_LIGHT)";
        div.style.margin = "0.25rem 0"; // Bruker rem
        left.appendChild(div);
      }

      function addCalcRow(id, labelText, isStrong, isIndented = false, isCost = false, isHeader = false) {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 8rem"; // Redusert fra 10rem til 8rem for mer kompakt layout
        row.style.alignItems = "center";
        row.style.gap = "0.4rem"; // Redusert fra 0.75rem til 0.4rem for mindre luft mellom label og verdi

        // Behagelig rødfarge for kostnader (samme som i "Låne for å investere")
        const costColor = "#D32F2F"; // En behagelig rødfarge, ikke for sterk

        const label = document.createElement("div");
        label.textContent = labelText;
        label.style.color = isCost ? costColor : "var(--GRAY_TEXT_DARK)";
        label.style.fontWeight = isStrong ? "700" : "400";
        label.style.fontSize = isStrong ? "1.125rem" : "1rem"; // Allerede rem, bra
        if (isIndented) {
          label.style.paddingLeft = "1rem"; // Redusert fra 1.5rem til 1rem for mer kompakt indentation
        }

        row.appendChild(label);
        
        // Hvis dette ikke er en header, legg til value-boks (men ikke i tekst-modus)
        if (!isHeader && !textOnly) {
          const value = document.createElement("div");
          value.id = id;
          value.className = "asset-amount";
          value.textContent = ""; // fylles senere
          value.style.width = "8rem"; // Redusert fra 10rem til 8rem for mer kompakt layout
          value.style.fontSize = isStrong ? "1.125rem" : "1rem";
          value.style.padding = "0.5rem 0.6rem"; // Redusert fra 0.625rem 0.75rem for mer kompakt padding
          value.style.textAlign = "right";
          value.style.color = isCost ? costColor : "inherit"; // Sett rødfarge på verdien også hvis kostnad
          // Gjør "hvite boksen" usynlig, men behold plassering og størrelse
          value.style.background = "transparent";
          value.style.border = "none";
          value.style.boxShadow = "none";
          row.appendChild(value);
          left.appendChild(row);
          return value;
        } else {
          // For headers, kun legg til label og spacer for alignment
          const spacer = document.createElement("div");
          row.appendChild(spacer);
          left.appendChild(row);
          return spacer;
        }
      }

      if (showDividendLoanContent) {
        // Venstre: første tre linjer med verdi-bokser
        addCalcRow("div-portfolio", "Beholde portefølje", false, false, false, false);
        addCalcRow("div-expected", "Forventet avkastning", false, false, false, false);
        addDivider();
        addCalcRow("div-endvalue", "Verdi ved periodens slutt", true, false, false, false);

        // Utbytte om N år
        addCalcRow("div-dividend-header", `Utbytte om ${AppState.yearsCount || 0} år:`, true, false, false, true);
        addCalcRow("div-dividend", "Utbytte", false, true, false, false);
        addCalcRow("div-dividend-tax", "Utbytteskatt", false, true, true, false);
        addCalcRow("div-dividend-net", "Netto", false, true, false, false);

        // Tom luft
        const spacer = document.createElement("div");
        spacer.style.height = "1rem";
        left.appendChild(spacer);

        // Status om N år
        addCalcRow("div-status-header", `Status om ${AppState.yearsCount || 0} år`, true, false, false, true);
        addCalcRow("div-remaining-portfolio", "Restportefølje", false, true, false, false);
        addCalcRow("div-loan-status", "Lån", false, true, false, false);
        addCalcRow("div-interest-costs", `rentekostnader i ${(AppState.yearsCount || 0)} år`, false, true, true, false);

        addDivider();
        addCalcRow("div-sum", "Sum", true, false, false, false);
        // Fyll verdier for venstre panel
        try { updateDividendLoanCalc(); } catch (_) {}
      }

      // Høyre panel (behold tom boks)
      right.innerHTML = "";
      right.style.display = "flex";
      right.style.flexDirection = "column";
      right.style.justifyContent = "flex-start";
      right.style.gap = "0.5rem";
      right.style.paddingTop = "1rem";
      right.style.paddingBottom = "1rem";

      function addDividerRR() {
        const div = document.createElement("div");
        div.style.height = "1px";
        div.style.background = "var(--BORDER_LIGHT)";
        div.style.margin = "0.25rem 0";
        right.appendChild(div);
      }

      function addCalcRowRR(id, labelText, isStrong, isCost = false, isPositive = false, isHeader = false, isIndented = false) {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 8rem";
        row.style.alignItems = "center";
        row.style.gap = "0.4rem";

        // Behagelig rødfarge for kostnader (samme som i "Låne for å investere")
        const costColor = "#D32F2F";
        // Behagelig grønnfarge for positive verdier
        const positiveColor = "#0C8F4A";

        const label = document.createElement("div");
        label.textContent = labelText;
        label.style.fontWeight = isStrong ? "700" : "400";
        if (isCost) {
          label.style.color = costColor;
        } else if (isPositive) {
          label.style.color = positiveColor;
        } else {
          label.style.color = "var(--GRAY_TEXT_DARK)";
        }
        label.style.fontSize = isStrong ? "1.125rem" : "1rem";
        if (isIndented) {
          label.style.paddingLeft = "1rem";
        }

        row.appendChild(label);
        
        // Hvis dette ikke er en header, legg til value-boks (men ikke i tekst-modus)
        if (!isHeader && !textOnly) {
          const value = document.createElement("div");
          value.id = id;
          value.textContent = "";
          value.style.border = "1px solid var(--BORDER_LIGHT)";
          value.style.borderRadius = "0.75rem";
          value.style.width = "8rem";
          value.style.fontSize = isStrong ? "1.125rem" : "1rem";
          value.style.fontWeight = "700";
          value.style.padding = "0.5rem 0.6rem";
          value.style.textAlign = "right";
          if (isCost) {
            value.style.color = costColor;
          } else if (isPositive) {
            value.style.color = positiveColor;
          }
          // Gjør "hvite boksen" usynlig, men behold plassering og størrelse
          value.style.background = "transparent";
          value.style.border = "none";
          value.style.boxShadow = "none";
          row.appendChild(value);
          right.appendChild(row);
          return value;
        } else {
          // For headers, kun legg til label og spacer for alignment
          const spacer = document.createElement("div");
          row.appendChild(spacer);
          right.appendChild(row);
          return spacer;
        }
      }

      if (showDividendLoanContent) {
        // Høyre panel – identisk tekst som venstre panel, ingen verdier
        const rPortfolioRow = addCalcRowRR("r-portfolio", "Beholde portefølje", false, false, false, false);
        const rExpectedRow = addCalcRowRR("r-expected", "Forventet avkastning", false, false, false, false);
        // Gjør de tre øverste linjene usynlige (men behold dem for layout)
        if (rPortfolioRow && rPortfolioRow.parentElement) rPortfolioRow.parentElement.style.visibility = "hidden";
        if (rExpectedRow && rExpectedRow.parentElement) rExpectedRow.parentElement.style.visibility = "hidden";
        
        addDividerRR();
        
        const rEndValueRow = addCalcRowRR("r-endvalue", "Verdi ved periodens slutt", true, false, false, false);
        if (rEndValueRow && rEndValueRow.parentElement) rEndValueRow.parentElement.style.visibility = "hidden";

        addCalcRowRR("r-div-header", "Utbytte i dag:", true, false, false, true);
        addCalcRowRR("r-div", "Utbytte", false, false, false, false, true);
        addCalcRowRR("r-div-tax", "Utbytteskatt", false, true, false, false, true);
        addCalcRowRR("r-div-net", "Netto", false, false, false, false, true);

        const spacerR = document.createElement("div"); spacerR.style.height = "1rem"; right.appendChild(spacerR);

        addCalcRowRR("r-status-header", `Status om ${(AppState.yearsCount || 0)} år`, true, false, false, true);
        addCalcRowRR("r-remaining", "Restportefølje", false, false, false, false, true);
        addCalcRowRR("r-loan", "Lån", false, false, false, false, true);
        addCalcRowRR("r-interest-costs", `sparte rentekostnader i ${(AppState.yearsCount || 0)} år`, false, false, true, false, true);
        addDividerRR();
        addCalcRowRR("r-sum", "Sum", true, false, false, false);
        // Oppdater verdier i høyre panel
        try { updateDividendLoanCalc(); } catch (_) {}
      }
    }

    const stretchToBottom = () => {
      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const bottomOffset = 40;
      const minH = Math.max(0, viewportH - rect.top - bottomOffset);
      // Sett minHeight på container for å sikre minimum høyde
      container.style.minHeight = `${minH}px`;
      // Bruk dobbel requestAnimationFrame for å sikre at layouten er fullstendig beregnet
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Beregn faktisk høyde av begge paneler og bruk den høyeste
          const leftRect = left.getBoundingClientRect();
          const rightRect = right.getBoundingClientRect();
          const leftHeight = leftRect.height;
          const rightHeight = rightRect.height;
          // Bruk den høyeste av de to, eller minimum høyde
          const maxHeight = Math.max(leftHeight, rightHeight, minH);
          // Tving begge til EXAKT samme høyde ved å bruke den høyeste
          left.style.height = `${maxHeight}px`;
          right.style.height = `${maxHeight}px`;
          // Reset height: 100% hvis det var satt, for å tvinge gjennom den eksakte høyden
          left.style.minHeight = `${maxHeight}px`;
          right.style.minHeight = `${maxHeight}px`;
        });
      });
    };
    // Kjør umiddelbart og ved resize/zoom
    stretchToBottom();
    window.addEventListener("resize", stretchToBottom, { passive: true });
    // Lytter på zoom-endringer via VisualViewport API
    if (window.VisualViewport) {
      window.VisualViewport.addEventListener("resize", stretchToBottom, { passive: true });
    }
    // Backup: lytter på window zoom events
    window.addEventListener("orientationchange", stretchToBottom, { passive: true });
    // Følg med på endringer i DOM som kan påvirke høyde
    const observer = new MutationObserver(() => {
      stretchToBottom();
    });
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
    return;
  }

  // Andre faner (utenom "Input"): behold enkel boks men strekk til bunn
  if (title !== "Input") {
    const stretchToBottom = () => {
      const rect = first.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const bottomOffset = 40;
      const minH = Math.max(0, viewportH - rect.top - bottomOffset);
      first.style.minHeight = `${minH}px`;
    };
    stretchToBottom();
    window.addEventListener("resize", stretchToBottom, { passive: true });
  }
  if (title === "Input") {
    const spacing = 0.75; // konsistent og litt tettere spacing mellom alle bokser i rem for zoom-uavhengighet
    const horizontalSpacing = 1.25; // Mer horisontal luft mellom boksene
    // Erstatt øverste enkeltpanel med en 2-kolonne grid (vertikal deling)
    if (first && first.remove) first.remove();
    const firstContainer = document.createElement("div");
    firstContainer.style.display = "grid";
    firstContainer.style.gridTemplateColumns = "1fr 1fr";
    firstContainer.style.gap = `${horizontalSpacing}rem`; // Økt horisontal spacing
    firstContainer.style.marginBottom = `${spacing}rem`;
    root.appendChild(firstContainer);
    const firstLeft = makePanel();
    const firstRight = makePanel();
    // Overstyr .panel sin standard grid-span
    firstLeft.style.gridColumn = "auto";
    firstRight.style.gridColumn = "auto";
    // Fjern standard panel-margin inne i grid for jevn avstand
    firstLeft.style.margin = "0";
    firstRight.style.margin = "0";
    // Fjern plassholdertekst i toppboksene
    firstLeft.innerHTML = "";
    firstRight.innerHTML = "";
    // Sentrer innholdet i venstre boks og gi litt høyde
    firstLeft.style.display = "flex";
    firstLeft.style.flexDirection = "column";
    firstLeft.style.alignItems = "center";
    firstLeft.style.justifyContent = "center";
    // Reduser høyden: ingen min-høyde, litt mindre vertikal padding
    firstLeft.style.minHeight = "0";
    firstLeft.style.paddingTop = "16px";
    firstLeft.style.paddingBottom = "16px";
    firstContainer.appendChild(firstLeft);
    firstContainer.appendChild(firstRight);

    // Sentrer innholdet i høyre boks og legg inn "ANTALL ÅR"-slider (1–20)
    firstRight.style.display = "flex";
    firstRight.style.flexDirection = "column";
    firstRight.style.alignItems = "center";
    firstRight.style.justifyContent = "center";
    firstRight.style.minHeight = "0";
    firstRight.style.paddingTop = "16px";
    firstRight.style.paddingBottom = "16px";

    const yearsLabel = document.createElement("div");
    yearsLabel.className = "section-label";
    yearsLabel.textContent = "ANTALL ÅR";
    yearsLabel.style.textAlign = "center";
    yearsLabel.style.marginBottom = "8px";

    const yearsRow = document.createElement("div");
    yearsRow.style.display = "flex";
    yearsRow.style.alignItems = "center";
    yearsRow.style.justifyContent = "center";
    yearsRow.style.gap = "1rem"; // Bruker rem for zoom-uavhengighet
    yearsRow.style.width = "100%";
    yearsRow.style.maxWidth = "47.5rem"; // 760px / 16 = 47.5rem

    const yearsCol = document.createElement("div");
    yearsCol.style.flex = "1 1 560px";
    yearsCol.style.display = "flex";
    yearsCol.style.alignItems = "center";

    const years = document.createElement("input");
    years.type = "range";
    years.className = "asset-range";
    years.id = "input-years-slider";
    years.min = "1";
    years.max = "20";
    years.step = "1";
    years.value = String(AppState.yearsCount || 10);
    years.style.width = "100%";
    // lagre i appstate og oppdater toppbokser
    AppState.yearsCount = Number(years.value);

    const yearsOut = document.createElement("div");
    yearsOut.className = "asset-amount";
    yearsOut.textContent = `${years.value} år`;
    yearsOut.style.width = "auto";
    yearsOut.style.display = "inline-flex";
    yearsOut.style.justifyContent = "center";
    yearsOut.style.textAlign = "center";
    yearsOut.style.minWidth = "120px";

    years.addEventListener("input", () => {
      AppState.yearsCount = Number(years.value);
      yearsOut.textContent = `${years.value} år`;
      updateTopSummaries();
    });

    yearsCol.appendChild(years);
    yearsRow.appendChild(yearsCol);
    yearsRow.appendChild(yearsOut);
    firstRight.appendChild(yearsLabel);
    firstRight.appendChild(yearsRow);

    // Legg inn en slider i venstre boks (kun i Input)
    const sliderLabel = document.createElement("div");
    sliderLabel.className = "section-label";
    sliderLabel.textContent = "Porteføljestørrelse";

    const sliderRow = document.createElement("div");
    // Gjør raden til en fleks-beholder som er midtstilt
    sliderRow.style.display = "flex";
    sliderRow.style.alignItems = "center";
    sliderRow.style.justifyContent = "center";
    sliderRow.style.gap = "1rem"; // Bruker rem for zoom-uavhengighet
    sliderRow.style.width = "100%";
    sliderRow.style.maxWidth = "47.5rem"; // 760px / 16 = 47.5rem
    const sliderCol = document.createElement("div");
    // Kolonne kun som fleks-beholder for selve slideren
    sliderCol.style.flex = "1 1 560px";
    sliderCol.style.display = "flex";
    sliderCol.style.alignItems = "center";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "asset-range";
    slider.id = "input-portfolio-slider";
    slider.min = "0";
    slider.max = "50000000";
    slider.step = "50000";
    slider.value = String(AppState.portfolioSize || 10000000);
    slider.style.width = "100%"; // fyll kolonnebredden
    const sliderOut = document.createElement("div");
    sliderOut.className = "asset-amount";
    sliderOut.textContent = formatNOK(Number(slider.value));
    // Overstyr slik at verdien også sentreres og ikke strekkes
    sliderOut.style.width = "auto";
    sliderOut.style.display = "inline-flex";
    sliderOut.style.justifyContent = "center";
    sliderOut.style.textAlign = "center";
    sliderOut.style.minWidth = "180px";
    // lagre i appstate og oppdater toppbokser
    AppState.portfolioSize = Number(slider.value);
    slider.addEventListener("input", () => {
      const v = Number(slider.value);
      AppState.portfolioSize = v;
      sliderOut.textContent = formatNOK(v);
      // Oppdater maksverdi på innskutt kapital-slider
      const capitalSliderEl = document.getElementById('input-capital-slider');
      if (capitalSliderEl) {
        const currentCapitalValue = Number(capitalSliderEl.value);
        capitalSliderEl.max = String(v);
        // Hvis nåværende verdi er større enn ny maks, juster ned
        if (currentCapitalValue > v) {
          capitalSliderEl.value = String(v);
          AppState.inputCapital = v;
          const capitalOut = capitalSliderEl.parentElement.nextElementSibling;
          if (capitalOut) capitalOut.textContent = formatNOK(v);
        }
      }
      updateTopSummaries();
    });
    sliderCol.appendChild(slider);
    sliderRow.appendChild(sliderCol);
    sliderRow.appendChild(sliderOut);
    // Sentrer labelen
    sliderLabel.style.textAlign = "center";
    sliderLabel.style.marginBottom = "8px";
    firstLeft.appendChild(sliderLabel);
    firstLeft.appendChild(sliderRow);

    const second = makePanel();
    second.style.marginBottom = `${spacing}rem`; // Bruker rem for zoom-uavhengighet
    root.appendChild(second);
    // Fyll midterste boks med tittel og 7 valg-bokser, horisontalt og midstilt
    second.innerHTML = "";
    second.style.display = "flex";
    second.style.flexDirection = "column";
    second.style.alignItems = "center";
    second.style.justifyContent = "center";
    second.style.paddingTop = "8px"; // Redusert fra 16px
    second.style.paddingBottom = "8px"; // Redusert fra 16px

    // Overskrift fjernet

    const choicesWrap = document.createElement("div");
    choicesWrap.style.display = "flex";
    choicesWrap.style.flexWrap = "nowrap";
    choicesWrap.style.alignItems = "center";
    choicesWrap.style.justifyContent = "center";
    choicesWrap.style.gap = "8px";
    choicesWrap.style.width = "100%";
    choicesWrap.style.overflowX = "auto";

    const options = [
      "100% Renter",
      "20% Aksjer",
      "45% Aksjer",
      "55% Aksjer",
      "65% Aksjer",
      "85% Aksjer",
      "100% Aksjer"
    ];
    const buttons = [];
    options.forEach((label, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.padding = "16px 22px";
      btn.style.borderRadius = "12px";
      btn.style.border = "1px solid var(--BORDER_LIGHT)";
      btn.style.background = idx === 4 ? "#4B6B88" : "var(--BG_CARD)"; // 65% Aksjer er standard (indeks 4)
      btn.style.color = idx === 4 ? "#ffffff" : "var(--GRAY_TEXT_DARK)";
      btn.style.fontWeight = "700";
      btn.style.boxShadow = "0 2px 8px rgba(16,24,40,0.06)";
      btn.style.whiteSpace = "nowrap";
      btn.style.cursor = "pointer";
      btn.setAttribute("aria-pressed", idx === 4 ? "true" : "false"); // 65% Aksjer er standard
      btn.addEventListener("click", () => setActive(idx));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(idx); }
      });
      buttons.push(btn);
      choicesWrap.appendChild(btn);
    });

    function setActive(activeIdx) {
      buttons.forEach((b, i) => {
        const isActive = i === activeIdx;
        b.setAttribute("aria-pressed", isActive ? "true" : "false");
        b.style.background = isActive ? "#4B6B88" : "var(--BG_CARD)";
        b.style.color = isActive ? "#ffffff" : "var(--GRAY_TEXT_DARK)";
        b.style.borderColor = isActive ? "#4B6B88" : "var(--BORDER_LIGHT)";
      });
      // lagre valget for senere bruk
      AppState.stockShareOption = options[activeIdx];
      // lagre prosenttall ("100% Renter" = 0%)
      const label = options[activeIdx];
      const m = label.match(/(\d+)%/);
      let pct = m ? Number(m[1]) : 0;
      if (/Renter/i.test(label)) pct = 0;
      AppState.stockSharePercent = pct;
      // oppdater forventet avkastning hvis komponenten finnes
      try { if (typeof updateExpectedReturn === 'function') updateExpectedReturn(); } catch (_) {}
      updateTopSummaries();
    }
    // Finn riktig indeks basert på AppState.stockShareOption, standard er 65% Aksjer (indeks 4)
    const savedOption = AppState.stockShareOption || "65% Aksjer";
    const savedIdx = options.findIndex(opt => opt === savedOption);
    setActive(savedIdx >= 0 ? savedIdx : 4); // Standard er 65% Aksjer (indeks 4)

    second.appendChild(choicesWrap);

    // Tredje område: DEL VERTIKALT (side-ved-side) i to like paneler med luft mellom
    const thirdContainer = document.createElement("div");
    thirdContainer.style.display = "grid";
    thirdContainer.style.gridTemplateColumns = "1fr 1fr";
    thirdContainer.style.gap = `${horizontalSpacing}rem`; // Økt horisontal spacing
    root.appendChild(thirdContainer);
    const thirdLeft = makePanel();
    const thirdRight = makePanel();
    // Overstyr .panel sin standard grid-span så de faktisk står i to kolonner
    thirdLeft.style.gridColumn = "auto";
    thirdRight.style.gridColumn = "auto";
    thirdLeft.style.margin = "0";
    thirdRight.style.margin = "0";
    thirdContainer.appendChild(thirdLeft);
    thirdContainer.appendChild(thirdRight);

    // Fyll venstre nederste boks: "Forventet avkastning"
    thirdLeft.innerHTML = "";
    thirdLeft.style.display = "flex";
    thirdLeft.style.flexDirection = "column";
    thirdLeft.style.gap = "0.625rem"; // 10px / 16 = 0.625rem for zoom-uavhengighet
    thirdLeft.style.paddingTop = "1rem"; // Bruker rem for zoom-uavhengighet
    thirdLeft.style.paddingBottom = "1rem"; // Bruker rem for zoom-uavhengighet

    // Overskrift fjernet

    function makePctSlider(idBase, labelText, min, max, step, start) {
      const label = document.createElement("div");
      label.className = "section-label";
      label.textContent = labelText; // Små bokstaver i stedet for store
      label.style.fontSize = "0.75rem"; // 25% mindre (fra 1rem til 0.75rem)

      const row = document.createElement("div");
      // Egen layout for å sikre at slider og verdi alltid får plass
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1fr 140px";
      row.style.alignItems = "center";
      row.style.gap = "12px";
      row.style.width = "100%";
      const col = document.createElement("div");
      col.style.display = "flex";
      col.style.alignItems = "center";
      const input = document.createElement("input");
      input.type = "range";
      input.className = "asset-range";
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(start);
      input.style.width = "100%";
      const out = document.createElement("div");
      out.className = "asset-amount";
      out.textContent = `${Number(start).toFixed(1).replace('.', ',')} %`;
      // Kompakt verdi-boks som alltid får plass
      out.style.width = "140px";
      out.style.fontSize = "1rem";
      out.style.padding = "10px 12px";
      out.style.textAlign = "center";

      input.addEventListener("input", () => {
        out.textContent = `${Number(input.value).toFixed(1).replace('.', ',')} %`;
        updateExpectedReturn();
        if (idBase === "expEquity") AppState.expEquity = Number(input.value);
        else if (idBase === "expBonds") AppState.expBonds = Number(input.value);
        else if (idBase === "expKpi") AppState.expKpi = Number(input.value);
        updateTopSummaries();
      });

      col.appendChild(input);
      row.appendChild(col);
      row.appendChild(out);

      // id-er for oppslag ved beregning
      input.id = `${idBase}-slider`;
      out.id = `${idBase}-out`;

      thirdLeft.appendChild(label);
      thirdLeft.appendChild(row);
      return input;
    }

    const sEquity = makePctSlider("expEquity", "Forventet avkastning aksjer", 0, 20, 0.1, AppState.expEquity || 8.0);
    const sBonds  = makePctSlider("expBonds",  "Forventet avkastning renter", 0, 15, 0.1, AppState.expBonds || 5.0);
    const sKpi    = makePctSlider("expKpi",    "Forventet KPI", 0, 10, 0.1, AppState.expKpi || 0.0);
    AppState.expEquity = Number(sEquity.value);
    AppState.expBonds = Number(sBonds.value);
    AppState.expKpi = Number(sKpi.value);

    // Rådgivningshonorar (horisontal rekke med 6 bokser)
    const feeLabel = document.createElement("div");
    feeLabel.className = "section-label";
    feeLabel.textContent = "Rådgivningshonorar"; // Små bokstaver
    feeLabel.style.fontSize = "0.75rem"; // 25% mindre
    thirdLeft.appendChild(feeLabel);

    const feesWrap = document.createElement("div");
    feesWrap.style.display = "flex";
    feesWrap.style.flexWrap = "nowrap"; // én horisontal rekke
    feesWrap.style.gap = "8px";
    feesWrap.style.overflowX = "auto";
    thirdLeft.appendChild(feesWrap);

    const feeOptions = [0.0, 1.37, 0.93, 0.81, 0.69, 0.57];
    const feeButtons = [];
    function setFeeActive(idx) {
      feeButtons.forEach((b, i) => {
        const active = i === idx;
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.style.background = active ? "#ffffff" : "var(--BG_CARD)";
        b.style.borderColor = active ? "#93C5FD" : "var(--BORDER_LIGHT)";
        b.style.boxShadow = active ? "0 0 0 3px rgba(59,130,246,0.15)" : "0 2px 6px rgba(16,24,40,0.06)";
      });
      AppState.advisoryFeePct = feeOptions[idx];
      updateExpectedReturn();
    }
    feeOptions.forEach((pct, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.style.padding = "10px 14px";
      b.style.borderRadius = "10px";
      b.style.border = "1px solid var(--BORDER_LIGHT)";
      b.style.background = "var(--BG_CARD)";
      b.style.color = "var(--GRAY_TEXT_DARK)";
      b.style.fontWeight = "700";
      b.style.fontSize = "14px";
      b.style.cursor = "pointer";
      b.textContent = `${pct.toFixed(2).replace('.', ',')}%`;
      b.addEventListener("click", () => setFeeActive(idx));
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFeeActive(idx); } });
      feeButtons.push(b);
      feesWrap.appendChild(b);
    });
    // Finn riktig indeks basert på AppState.advisoryFeePct
    const savedFee = AppState.advisoryFeePct !== undefined ? AppState.advisoryFeePct : 0.0;
    const savedFeeIdx = feeOptions.findIndex(f => Math.abs(f - savedFee) < 0.01);
    setFeeActive(savedFeeIdx >= 0 ? savedFeeIdx : 0);

    // Resultatboks nederst
    const result = document.createElement("div");
    result.style.marginTop = "12px";
    result.style.border = "1px solid var(--BORDER_LIGHT)";
    result.style.borderRadius = "12px";
    result.style.padding = "14px 16px";
    result.style.background = "var(--BG_CARD)";
    const resLabel = document.createElement("div");
    resLabel.className = "section-label";
    resLabel.textContent = "Forventet avkastning:"; // Små bokstaver
    resLabel.style.fontSize = "0.75rem"; // 25% mindre
    resLabel.style.margin = "0 0 6px 0";
    const resValue = document.createElement("div");
    resValue.id = "expected-return-out";
    resValue.style.fontWeight = "900";
    resValue.style.fontSize = "24px";
    resValue.textContent = "0.0%";
    result.appendChild(resLabel);
    result.appendChild(resValue);
    thirdLeft.appendChild(result);

    // Beregn og oppdater
    function parseEquityShareFromSelection() {
      const label = AppState.stockShareOption || "65% Aksjer";
      const m = label.match(/(\d+)%/);
      if (!m) return 0;
      const n = Number(m[1]);
      // "100% Renter" betyr 0% aksjer
      if (/Renter/i.test(label)) return 0;
      return Math.max(0, Math.min(100, n));
    }
    function updateExpectedReturn() {
      const eq = Number(sEquity.value);
      const bd = Number(sBonds.value);
      const fee = Number(AppState.advisoryFeePct || 0);
      const kpi = Number(sKpi.value) || 0;
      const equityShare = parseEquityShareFromSelection() / 100; // 0..1
      const gross = equityShare * eq + (1 - equityShare) * bd;
      const net = gross - fee - kpi; // Trekker fra både rådgivningshonorar og KPI
      const el = document.getElementById("expected-return-out");
      if (el) el.textContent = `${net.toFixed(2).replace('.', ',')}%`;
      AppState.expectedReturnPct = net;
      updateTopSummaries();
    }

    // Kall minst én gang ved init
    updateExpectedReturn();

    // Fyll høyre nederste boks: "Skatt"
    thirdRight.innerHTML = "";
    thirdRight.style.display = "flex";
    thirdRight.style.flexDirection = "column";
    thirdRight.style.gap = "0.625rem"; // 10px / 16 = 0.625rem for zoom-uavhengighet
    thirdRight.style.paddingTop = "1rem"; // Bruker rem for zoom-uavhengighet
    thirdRight.style.paddingBottom = "1rem"; // Bruker rem for zoom-uavhengighet

    // Overskrift fjernet

    // Skjermingsrente slider (0–5%) midtstilt
    const shieldLabel = document.createElement("div");
    shieldLabel.className = "section-label";
    shieldLabel.textContent = "Skjermingsrente"; // Små bokstaver
    shieldLabel.style.fontSize = "0.75rem"; // 25% mindre
    thirdRight.appendChild(shieldLabel);

    const shieldRow = document.createElement("div");
    shieldRow.style.display = "grid";
    shieldRow.style.gridTemplateColumns = "1fr 140px";
    shieldRow.style.alignItems = "center";
    shieldRow.style.gap = "12px";
    const shieldCol = document.createElement("div");
    shieldCol.style.display = "flex";
    shieldCol.style.alignItems = "center";
    const shield = document.createElement("input");
    shield.type = "range";
    shield.className = "asset-range";
    shield.id = "shield-rate-slider";
    shield.min = "0"; shield.max = "5"; shield.step = "0.1"; shield.value = String(AppState.shieldRatePct || 3.9);
    shield.style.width = "100%";
    const shieldOut = document.createElement("div");
    shieldOut.className = "asset-amount";
    shieldOut.style.width = "140px";
    shieldOut.style.fontSize = "1rem";
    shieldOut.style.padding = "10px 12px";
    shieldOut.style.textAlign = "center";
    const shieldValue = Number(shield.value);
    shieldOut.textContent = `${shieldValue.toFixed(1).replace('.', ',')} %`;
    AppState.shieldRatePct = shieldValue;
    shield.addEventListener("input", () => {
      shieldOut.textContent = `${Number(shield.value).toFixed(1).replace('.', ',')} %`;
      AppState.shieldRatePct = Number(shield.value);
      updateTopSummaries();
    });
    shieldCol.appendChild(shield);
    shieldRow.appendChild(shieldCol);
    shieldRow.appendChild(shieldOut);
    thirdRight.appendChild(shieldRow);

    // Tekstfelt helper
    function makePercentInput(labelText, defaultValue) {
      const lab = document.createElement("div");
      lab.className = "section-label";
      lab.textContent = labelText; // Små bokstaver i stedet for store
      lab.style.fontSize = "0.75rem"; // 25% mindre
      thirdRight.appendChild(lab);

      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1fr 40px";
      row.style.alignItems = "center";
      row.style.gap = "12px";
      const col = document.createElement("div");
      col.style.display = "flex";
      col.style.alignItems = "center";
      const input = document.createElement("input");
      input.type = "text";
      input.value = Number(defaultValue).toFixed(2).replace('.', ','); // Vis med 2 desimaler
      input.style.width = "100%";
      input.style.border = "1px solid var(--BORDER_LIGHT)";
      input.style.borderRadius = "12px";
      input.style.padding = "12px 14px";
      input.style.background = "#ffffff";
      input.style.color = "var(--GRAY_TEXT_SECONDARY)"; // Samme farge som label
      input.style.fontWeight = "700"; // Bold
      input.style.fontSize = "1rem"; // Samme størrelse som label (16px)
      input.inputMode = "decimal";
      let isUpdating = false;
      
      // Oppdater AppState og formatér når brukeren er ferdig med å skrive (blur)
      input.addEventListener("blur", () => {
        if (isUpdating) return;
        isUpdating = true;
        const rawValue = String(input.value).replace(/\s/g, ''); // Fjern mellomrom
        const v = parseFloat(rawValue.replace(',', '.')) || 0;
        // Oppdater input-verdien med 2 desimaler
        const formatted = v.toFixed(2).replace('.', ',');
        input.value = formatted;
        
        if (labelText.includes("Utbytteskatt") || labelText.includes("Skatt aksjer")) {
          AppState.stockTaxPct = v;
        } else if (labelText.includes("Kapitalskatt")) {
          AppState.capitalTaxPct = v;
        }
        updateTopSummaries();
        isUpdating = false;
      });
      
      // Oppdater AppState underveis (men ikke formater før blur)
      input.addEventListener("input", () => {
        if (isUpdating) return;
        const rawValue = String(input.value).replace(/\s/g, '');
        const v = parseFloat(rawValue.replace(',', '.')) || 0;
        if (!isNaN(v)) {
          if (labelText.includes("Utbytteskatt") || labelText.includes("Skatt aksjer")) {
            AppState.stockTaxPct = v;
          } else if (labelText.includes("Kapitalskatt")) {
            AppState.capitalTaxPct = v;
          }
          updateTopSummaries();
        }
      });
      // Initier verdier i AppState
      const v = parseFloat(String(defaultValue).replace(',', '.')) || 0;
      if (labelText.includes("Utbytteskatt") || labelText.includes("Skatt aksjer")) {
        AppState.stockTaxPct = v;
      } else if (labelText.includes("Kapitalskatt")) {
        AppState.capitalTaxPct = v;
      }
      const suffix = document.createElement("div");
      suffix.textContent = "%";
      suffix.style.textAlign = "center";
      suffix.style.fontWeight = "700"; // Bold
      suffix.style.fontSize = "1rem"; // Samme størrelse som label (16px)
      suffix.style.color = "var(--GRAY_TEXT_SECONDARY)"; // Samme farge som label
      row.appendChild(col);
      col.appendChild(input);
      row.appendChild(suffix);
      thirdRight.appendChild(row);
      return input;
    }

    makePercentInput("Utbytteskatt / Skatt aksjer (%)", AppState.stockTaxPct || 37.84);
    makePercentInput("Kapitalskatt (%)", AppState.capitalTaxPct || 22);

    // Ny slider: Rentekostnader (0–10%, default 5%)
    const intLabel = document.createElement("div");
    intLabel.className = "section-label";
    intLabel.textContent = "Rentekostnader"; // Små bokstaver
    intLabel.style.fontSize = "0.75rem"; // 25% mindre
    thirdRight.appendChild(intLabel);

    const intRow = document.createElement("div");
    intRow.style.display = "grid";
    intRow.style.gridTemplateColumns = "1fr 140px";
    intRow.style.alignItems = "center";
    intRow.style.gap = "12px";
    const intCol = document.createElement("div");
    intCol.style.display = "flex";
    intCol.style.alignItems = "center";
    const intSlider = document.createElement("input");
    intSlider.type = "range";
    intSlider.className = "asset-range";
    intSlider.id = "interest-cost-slider";
    intSlider.min = "0"; intSlider.max = "10"; intSlider.step = "0.1"; intSlider.value = String(AppState.interestCostPct || 5.0);
    intSlider.style.width = "100%";
    const intOut = document.createElement("div");
    intOut.className = "asset-amount";
    intOut.style.width = "140px";
    intOut.style.fontSize = "1rem";
    intOut.style.padding = "10px 12px";
    intOut.style.textAlign = "center";
    const intValue = Number(intSlider.value);
    intOut.textContent = `${intValue.toFixed(1).replace('.', ',')} %`;
    intSlider.addEventListener("input", () => {
      intOut.textContent = `${Number(intSlider.value).toFixed(1).replace('.', ',')} %`;
      AppState.interestCostPct = Number(intSlider.value);
      updateTopSummaries();
    });
    AppState.interestCostPct = intValue;
    intCol.appendChild(intSlider);
    intRow.appendChild(intCol);
    intRow.appendChild(intOut);
    thirdRight.appendChild(intRow);

    // Ny slider: Innskutt kapital (0–porteføljestørrelse, default 0)
    const capitalLabel = document.createElement("div");
    capitalLabel.className = "section-label";
    capitalLabel.textContent = "Innskutt kapital";
    capitalLabel.style.fontSize = "0.75rem";
    thirdRight.appendChild(capitalLabel);

    const capitalRow = document.createElement("div");
    capitalRow.style.display = "grid";
    capitalRow.style.gridTemplateColumns = "1fr 140px";
    capitalRow.style.alignItems = "center";
    capitalRow.style.gap = "12px";
    const capitalCol = document.createElement("div");
    capitalCol.style.display = "flex";
    capitalCol.style.alignItems = "center";
    const capitalSlider = document.createElement("input");
    capitalSlider.type = "range";
    capitalSlider.className = "asset-range";
    capitalSlider.id = "input-capital-slider";
    capitalSlider.min = "0";
    capitalSlider.max = "50000000";
    capitalSlider.step = "50000";
    capitalSlider.value = String(AppState.inputCapital || 0);
    capitalSlider.style.width = "100%";
    const capitalOut = document.createElement("div");
    capitalOut.className = "asset-amount";
    capitalOut.style.width = "140px";
    capitalOut.style.fontSize = "1rem";
    capitalOut.style.padding = "10px 12px";
    capitalOut.style.textAlign = "center";
    const capitalValue = Number(capitalSlider.value);
    capitalOut.textContent = formatNOK(capitalValue);
    
    // Sett initial maksverdi basert på porteføljestørrelse
    const initialPortfolioSize = AppState.portfolioSize || 0;
    capitalSlider.max = String(initialPortfolioSize);
    
    capitalSlider.addEventListener("input", () => {
      const v = Number(capitalSlider.value);
      capitalOut.textContent = formatNOK(v);
      AppState.inputCapital = v;
      updateTopSummaries();
    });
    AppState.inputCapital = capitalValue;
    capitalCol.appendChild(capitalSlider);
    capitalRow.appendChild(capitalCol);
    capitalRow.appendChild(capitalOut);
    thirdRight.appendChild(capitalRow);

    // Gi samlet høyde slik at de to boksene når ned til like over Output-knappen
    function sizeThird() {
      const vpH = window.innerHeight || document.documentElement.clientHeight;
      const containerTop = thirdContainer.getBoundingClientRect().top;
      const fab = document.getElementById("output-fab");
      let bottomLimit = vpH - 16; // default: 16px fra bunn
      if (fab) {
        const fabRect = fab.getBoundingClientRect();
        bottomLimit = fabRect.top - spacing; // samme luft over knappen
      }
      const available = Math.max(240, Math.floor(bottomLimit - containerTop));
      thirdLeft.style.minHeight = `${available}px`;
      thirdRight.style.minHeight = `${available}px`;
    }
    // Beregn ved render og ved resize
    sizeThird();
    window.addEventListener("resize", sizeThird, { passive: true });
    
    // Marker at Input-fanen er initialisert
    inputTabInitialized = true;
  }
}


// --- Eiendeler modul ---
function renderAssetsModule(root) {
  root.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel";

  const heading = document.createElement("h3");
  heading.textContent = "Eiendeler";
  panel.appendChild(heading);

  const list = document.createElement("div");
  list.className = "assets";
  panel.appendChild(list);

  AppState.assets.forEach((item) => list.appendChild(createItemRow("assets", item)));

  const addBtn = document.createElement("button");
  addBtn.className = "btn-add";
  addBtn.textContent = "Legg til eiendel";
  addBtn.addEventListener("click", () => {
    const newItem = { id: genId(), name: "NY EIENDEL", amount: 0 };
    AppState.assets.push(newItem);
    list.appendChild(createItemRow("assets", newItem));
  });
  panel.appendChild(addBtn);

  root.appendChild(panel);
  updateTopSummaries();
}
// --- Forventninger modul ---
function renderExpectationsModule(root) {
  root.innerHTML = "";
  const panel = document.createElement("div");
  panel.className = "panel";
  const heading = document.createElement("h3");
  heading.textContent = "Forventet avkastning";
  panel.appendChild(heading);

  const list = document.createElement("div");
  list.className = "assets";
  panel.appendChild(list);

  const items = [
    { key: "likvider", label: "LIKVIDER" },
    { key: "fastEiendom", label: "FAST EIENDOM" },
    { key: "investeringer", label: "INVESTERINGER" },
    { key: "andreEiendeler", label: "ANDRE EIENDELER" }
  ];

  items.forEach(({ key, label }) => {
    const row = document.createElement("div");
    row.className = "asset-row";

    const col = document.createElement("div");
    col.className = "asset-col";

    const top = document.createElement("div");
    top.className = "asset-top";

    const name = document.createElement("input");
    name.className = "asset-name";
    name.type = "text";
    name.value = label;
    name.addEventListener("input", () => { /* kan redigeres ved behov */ });

    const spacer = document.createElement("div");
    spacer.style.width = "28px"; // plassholder der delete-knapp pleier å være

    top.appendChild(name);
    top.appendChild(spacer);

    const range = document.createElement("input");
    range.className = "asset-range";
    range.type = "range";
    range.min = "0";
    range.max = "12";
    range.step = "1";
    range.value = String(AppState.expectations[key] || 0);

    const out = document.createElement("div");
    out.className = "asset-amount";
    out.textContent = `${Number(range.value).toFixed(1).replace('.', ',')} %`;

    range.addEventListener("input", () => {
      const v = Number(range.value);
      AppState.expectations[key] = v;
      out.textContent = `${v.toFixed(1).replace('.', ',')} %`;
    });

    col.appendChild(top);
    col.appendChild(range);
    row.appendChild(col);
    row.appendChild(out);
    list.appendChild(row);
  });
  root.appendChild(panel);
  updateTopSummaries();
}

// --- Grafikk modul ---
function renderGraphicsModule(root) {
  root.innerHTML = "";

  // Bruk faktiske eiendelsnavn (identiske med Eiendeler-fanen)
  const assets = AppState.assets || [];
  const debts = AppState.debts || [];
  // Lys blåskala for lys tema
  const blueScale = ["#C8DBFF", "#A9C6FF", "#7FAAF6", "#5A94FF", "#E0EDFF", "#F0F6FF"];
  const assetCategories = assets.map((a, idx) => ({
    key: String(a.name || `Eiendel ${idx + 1}`),
    value: a.amount || 0,
    color: blueScale[idx % blueScale.length]
  }));

  const totalAssets = assetCategories.reduce((s, x) => s + x.value, 0);
  const totalDebtRaw = debts.reduce((s, d) => s + (d.amount || 0), 0);
  const debtVal = Math.min(totalDebtRaw, totalAssets);
  const equityVal = Math.max(0, totalAssets - debtVal);

  const financingParts = [
    { key: "Egenkapital", value: equityVal, color: "#4ADE80" },
    { key: "Gjeld", value: debtVal, color: "#f87171" }
  ];

  // Bygg SVG iht. krav (uten ekstra ramme rundt)
  const svg = buildFinanceSVG(assetCategories, financingParts, totalAssets);
  root.appendChild(svg);

  // Rerender ved resize for å holde tooltip-posisjonering korrekt
  const onResize = () => {
    const current = document.getElementById("sectionTitle");
    if (current && current.textContent === "Grafikk") {
      renderGraphicsModule(root);
    } else {
      window.removeEventListener("resize", onResize);
    }
  };
  window.addEventListener("resize", onResize);
}

function buildFinanceSVG(assetCategories, financingParts, totalAssets) {
  const vbW = 1200; const vbH = 700;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${vbW} ${vbH}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Eiendeler og hvordan de er finansiert");
  svg.style.width = "100%";
  svg.style.maxWidth = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";

  // Styles inside SVG
  const style = document.createElementNS(svgNS, "style");
  style.textContent = `
    .t-title { font: 900 28px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #1C2A3A; }
    .t-sub { font: 500 14px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #8A98A7; }
    .t-panel { font: 700 20px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #1C2A3A; }
    .t-label { font: 500 14px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #1C2A3A; }
    .t-value { font: 700 13px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #677788; }
    .t-legend { font: 500 13px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #677788; }
    .sum-text { font: 700 14px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #677788; display: none; }
  `;
  svg.appendChild(style);

  // Background
  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
  bg.setAttribute("width", String(vbW)); bg.setAttribute("height", String(vbH));
  bg.setAttribute("fill", "#F2F4F7");
  svg.appendChild(bg);

  // Defs: shadow and clip
  const defs = document.createElementNS(svgNS, "defs");
  const shadow = document.createElementNS(svgNS, "filter");
  shadow.setAttribute("id", "cardShadow");
  shadow.setAttribute("x", "-10%"); shadow.setAttribute("y", "-10%");
  shadow.setAttribute("width", "120%"); shadow.setAttribute("height", "120%");
  const feDrop = document.createElementNS(svgNS, "feDropShadow");
  feDrop.setAttribute("dx", "0"); feDrop.setAttribute("dy", "1");
  feDrop.setAttribute("stdDeviation", "4");
  feDrop.setAttribute("flood-color", "#000000");
  feDrop.setAttribute("flood-opacity", "0.08");
  shadow.appendChild(feDrop);
  defs.appendChild(shadow);

  const clipBarLeft = document.createElementNS(svgNS, "clipPath");
  clipBarLeft.setAttribute("id", "clipBarLeft");
  const clipRectL = document.createElementNS(svgNS, "rect");
  clipRectL.setAttribute("rx", "8"); clipRectL.setAttribute("ry", "8");
  const clipBarRight = document.createElementNS(svgNS, "clipPath");
  clipBarRight.setAttribute("id", "clipBarRight");
  const clipRectR = document.createElementNS(svgNS, "rect");
  clipRectR.setAttribute("rx", "8"); clipRectR.setAttribute("ry", "8");
  clipBarLeft.appendChild(clipRectL);
  clipBarRight.appendChild(clipRectR);
  defs.appendChild(clipBarLeft);
  defs.appendChild(clipBarRight);

  svg.appendChild(defs);

  // Grid and panels
  const pad = 4; const gutter = 24;
  const innerW = vbW - pad * 2;
  // Two equal columns that always fill the available width (fluid)
  const colW = (innerW - gutter) / 2;
  const panelW = colW;
  const leftX = pad;
  const rightX = pad + panelW + gutter;

  // Title removed per design preference
  // Fjernet undertekst for et renere uttrykk

  // Panels top Y (bring content closer to match spacing under tom ramme)
  const panelsTopY = 0;

  // Card sizes
  const cardR = 12;
  const cardStroke = "#E8EBF3";

  // Estimate card height to fit bar and texts (may approach bottom)
  const cardHeight = Math.min(700 - panelsTopY - 32 - 24, 560); // heuristic to keep legend room

  // Cards
  const leftCard = document.createElementNS(svgNS, "rect");
  leftCard.setAttribute("x", String(leftX));
  leftCard.setAttribute("y", String(panelsTopY));
  leftCard.setAttribute("width", String(panelW));
  leftCard.setAttribute("height", String(cardHeight));
  leftCard.setAttribute("rx", String(cardR)); leftCard.setAttribute("ry", String(cardR));
  leftCard.setAttribute("fill", "#FFFFFF");
  leftCard.setAttribute("stroke", cardStroke);
  leftCard.setAttribute("filter", "url(#cardShadow)");
  leftCard.setAttribute("aria-label", "Eiendeler");
  leftCard.setAttribute("role", "img");
  svg.appendChild(leftCard);

  const rightCard = document.createElementNS(svgNS, "rect");
  rightCard.setAttribute("x", String(rightX));
  rightCard.setAttribute("y", String(panelsTopY));
  rightCard.setAttribute("width", String(panelW));
  rightCard.setAttribute("height", String(cardHeight));
  rightCard.setAttribute("rx", String(cardR)); rightCard.setAttribute("ry", String(cardR));
  rightCard.setAttribute("fill", "#FFFFFF");
  rightCard.setAttribute("stroke", cardStroke);
  rightCard.setAttribute("filter", "url(#cardShadow)");
  rightCard.setAttribute("aria-label", "Finansiering");
  rightCard.setAttribute("role", "img");
  svg.appendChild(rightCard);

  // Panel headings
  const lHead = document.createElementNS(svgNS, "text");
  lHead.setAttribute("x", String(Math.round(leftX + panelW / 2)));
  lHead.setAttribute("y", String(Math.round(panelsTopY + 24 + 20))); // padding-top 24 + 20 baseline
  lHead.setAttribute("text-anchor", "middle");
  lHead.setAttribute("class", "t-panel");
  lHead.textContent = "Eiendeler";
  svg.appendChild(lHead);

  const rHead = document.createElementNS(svgNS, "text");
  rHead.setAttribute("x", String(Math.round(rightX + panelW / 2)));
  rHead.setAttribute("y", String(Math.round(panelsTopY + 24 + 20)));
  rHead.setAttribute("text-anchor", "middle");
  rHead.setAttribute("class", "t-panel");
  rHead.textContent = "Finansiering";
  svg.appendChild(rHead);

  // Bars placement og dynamisk høyde slik at bunnmarg == toppmarg
  const barWidth = 187; // stolpebredde (+20%)
  const gapHeadToBar = 24;
  const barTopY = Math.round(panelsTopY + 24 + 26 + gapHeadToBar);
  const topSpace = barTopY - panelsTopY;
  const barHeight = Math.max(200, cardHeight - topSpace * 2);
  const barCenterLX = Math.round(leftX + panelW / 2);
  const barCenterRX = Math.round(rightX + panelW / 2);
  const barLeftX = barCenterLX - Math.round(barWidth / 2);
  const barRightX = barCenterRX - Math.round(barWidth / 2);

  // Update clip rects
  clipRectL.setAttribute("x", String(barLeftX));
  clipRectL.setAttribute("y", String(barTopY));
  clipRectL.setAttribute("width", String(barWidth));
  clipRectL.setAttribute("height", String(barHeight));
  clipRectR.setAttribute("x", String(barRightX));
  clipRectR.setAttribute("y", String(barTopY));
  clipRectR.setAttribute("width", String(barWidth));
  clipRectR.setAttribute("height", String(barHeight));

  // Groups to hold segments
  const gLeft = document.createElementNS(svgNS, "g");
  gLeft.setAttribute("clip-path", "url(#clipBarLeft)");
  const gRight = document.createElementNS(svgNS, "g");
  gRight.setAttribute("clip-path", "url(#clipBarRight)");
  svg.appendChild(gLeft); svg.appendChild(gRight);

  // Helpers
  function darken(hex, factor = 0.8) {
    const v = hex.replace('#','');
    const r = parseInt(v.substring(0,2),16);
    const g = parseInt(v.substring(2,4),16);
    const b = parseInt(v.substring(4,6),16);
    const d = (x)=> Math.max(0, Math.min(255, Math.round(x*factor)));
    return `#${d(r).toString(16).padStart(2,'0')}${d(g).toString(16).padStart(2,'0')}${d(b).toString(16).padStart(2,'0')}`;
  }

  function pct(value, total) {
    if (total <= 0) return "0,0 %";
    const p = (value * 100) / total;
    return `${p.toFixed(1).replace('.', ',')} %`;
  }

  // Left stacked segments (bottom-up): Anleggsmidler, Varelager, Fordringer, Kontanter
  let cursorY = barTopY + barHeight;
  const leftSeparators = [];
  assetCategories.forEach((seg, idx) => {
    if (seg.value <= 0) return; // hopp over null-segmenter
    const h = Math.max(0, Math.round((seg.value / (totalAssets || 1)) * barHeight));
    const y = cursorY - h;
    cursorY = y;

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", String(barLeftX));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(barWidth));
    rect.setAttribute("height", String(h));
    rect.setAttribute("fill", seg.color);
    rect.setAttribute("fill-opacity", "0.9");
    rect.setAttribute("stroke", darken(seg.color, 0.8));
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("role", "img");
    rect.setAttribute("aria-label", `${seg.key}: ${formatNOK(seg.value)}, ${pct(seg.value, totalAssets)}`);
    gLeft.appendChild(rect);

    // Separator (overlay) except at very top
    if (idx < assetCategories.length - 1) {
      leftSeparators.push(Math.round(y));
    }

    // Labels: always show, clamp within bar for very small segment heights
    {
      let cy = y + Math.round(h / 2);
      if (h < 24) {
        cy = Math.min(Math.max(y + 12, barTopY + 12), barTopY + barHeight - 12);
      }
      const labL = document.createElementNS(svgNS, "text");
      labL.setAttribute("x", String(barLeftX - 12));
      labL.setAttribute("y", String(cy + 4));
      labL.setAttribute("text-anchor", "end");
      labL.setAttribute("class", "t-label");
      labL.textContent = seg.key;
      svg.appendChild(labL);

      const labR = document.createElementNS(svgNS, "text");
      labR.setAttribute("x", String(barLeftX + barWidth + 12));
      labR.setAttribute("y", String(cy + 4));
      labR.setAttribute("text-anchor", "start");
      labR.setAttribute("class", "t-value");
      labR.textContent = `${formatNOK(seg.value)} · ${pct(seg.value, totalAssets)}`;
      svg.appendChild(labR);
    }

    attachTooltip(svg, rect, seg.key, seg.value, pct(seg.value, totalAssets));
  });

  // Draw separators over the bar
  leftSeparators.forEach((y) => {
    const sep = document.createElementNS(svgNS, "rect");
    sep.setAttribute("x", String(barLeftX));
    sep.setAttribute("y", String(Math.max(barTopY, y - 1)));
    sep.setAttribute("width", String(barWidth));
    sep.setAttribute("height", "2");
    sep.setAttribute("fill", "#FFFFFF");
    sep.setAttribute("fill-opacity", "0.6");
    gLeft.appendChild(sep);
  });

  // Outline of full left bar
  const leftOutline = document.createElementNS(svgNS, "rect");
  leftOutline.setAttribute("x", String(barLeftX));
  leftOutline.setAttribute("y", String(barTopY));
  leftOutline.setAttribute("width", String(barWidth));
  leftOutline.setAttribute("height", String(barHeight));
  leftOutline.setAttribute("rx", "8"); leftOutline.setAttribute("ry", "8");
  leftOutline.setAttribute("fill", "none");
  leftOutline.setAttribute("stroke", "#E8EBF3");
  leftOutline.setAttribute("stroke-width", "1.5");
  svg.appendChild(leftOutline);

  // Right financing bar (two parts: bottom Gjeld, top Egenkapital)
  const totalFin = financingParts.reduce((s, x) => s + x.value, 0);
  let cursorYR = barTopY + barHeight;
  const orderRight = [
    financingParts.find(x => x && x.key === "Gjeld") || { key: "Gjeld", value: 0, color: "#f87171" },
    financingParts.find(x => x && x.key === "Egenkapital") || { key: "Egenkapital", value: 0, color: "#10B981" }
  ];
  orderRight.forEach((seg) => {
    const h = totalFin > 0 ? Math.max(0, Math.round((seg.value / totalFin) * barHeight)) : 0;
    if (h <= 0) return; // ikke tegn eller label segmenter uten høyde (unngå overlapp ved 0)
    const y = cursorYR - h;
    cursorYR = y;

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", String(barRightX));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(barWidth));
    rect.setAttribute("height", String(h));
    rect.setAttribute("fill", seg.color);
    rect.setAttribute("fill-opacity", "0.9");
    rect.setAttribute("stroke", darken(seg.color, 0.8));
    rect.setAttribute("stroke-width", "1.5");
    rect.setAttribute("role", "img");
    rect.setAttribute("aria-label", `${seg.key}: ${formatNOK(seg.value)}, ${pct(seg.value, totalFin)}`);
    gRight.appendChild(rect);

    if (h >= 24) {
      const cy = y + Math.round(h / 2);
      const labL = document.createElementNS(svgNS, "text");
      labL.setAttribute("x", String(barRightX - 12));
      labL.setAttribute("y", String(cy + 4));
      labL.setAttribute("text-anchor", "end");
      labL.setAttribute("class", "t-label");
      labL.textContent = seg.key;
      svg.appendChild(labL);

      const labR = document.createElementNS(svgNS, "text");
      labR.setAttribute("x", String(barRightX + barWidth + 12));
      labR.setAttribute("y", String(cy + 4));
      labR.setAttribute("text-anchor", "start");
      labR.setAttribute("class", "t-value");
      labR.textContent = `${formatNOK(seg.value)} · ${pct(seg.value, totalFin)}`;
      svg.appendChild(labR);
    } else if (h > 0) {
      // For svært små segmenter: plasser label utenfor, men på segmentets midtpunkt for å unngå overlapp
      const cy = y + Math.round(h / 2);
      const labL = document.createElementNS(svgNS, "text");
      labL.setAttribute("x", String(barRightX - 12));
      labL.setAttribute("y", String(cy + 4));
      labL.setAttribute("text-anchor", "end");
      labL.setAttribute("class", "t-label");
      labL.textContent = seg.key;
      svg.appendChild(labL);

      const labR = document.createElementNS(svgNS, "text");
      labR.setAttribute("x", String(barRightX + barWidth + 12));
      labR.setAttribute("y", String(cy + 4));
      labR.setAttribute("text-anchor", "start");
      labR.setAttribute("class", "t-value");
      labR.textContent = `${formatNOK(seg.value)} · ${pct(seg.value, totalFin)}`;
      svg.appendChild(labR);
    }

    attachTooltip(svg, rect, seg.key, seg.value, pct(seg.value, totalFin));
  });

  const rightOutline = document.createElementNS(svgNS, "rect");
  rightOutline.setAttribute("x", String(barRightX));
  rightOutline.setAttribute("y", String(barTopY));
  rightOutline.setAttribute("width", String(barWidth));
  rightOutline.setAttribute("height", String(barHeight));
  rightOutline.setAttribute("rx", "8"); rightOutline.setAttribute("ry", "8");
  rightOutline.setAttribute("fill", "none");
  rightOutline.setAttribute("stroke", "#E8EBF3"); // subtle contour
  rightOutline.setAttribute("stroke-width", "1");
  svg.appendChild(rightOutline);

  // Sum texts
  const sumY = Math.round(barTopY + barHeight + 16 + 12);
  const sumL = document.createElementNS(svgNS, "text");
  sumL.setAttribute("x", String(Math.round(leftX + panelW / 2)));
  sumL.setAttribute("y", String(sumY));
  sumL.setAttribute("text-anchor", "middle");
  sumL.setAttribute("class", "sum-text");
  sumL.textContent = `Sum eiendeler: ${formatNOK(totalAssets)}`;
  svg.appendChild(sumL);

  const sumR = document.createElementNS(svgNS, "text");
  sumR.setAttribute("x", String(Math.round(rightX + panelW / 2)));
  sumR.setAttribute("y", String(sumY));
  sumR.setAttribute("text-anchor", "middle");
  sumR.setAttribute("class", "sum-text");
  sumR.textContent = `Sum finansiering: ${formatNOK(totalAssets)}`;
  svg.appendChild(sumR);

  // Equality indicator between bars
  const eqX = Math.round((leftX + panelW + rightX) / 2);
  const eqY = Math.round(barTopY + barHeight / 2);
  const eqPlate = document.createElementNS(svgNS, "rect");
  eqPlate.setAttribute("x", String(eqX - 16));
  eqPlate.setAttribute("y", String(eqY - 16));
  eqPlate.setAttribute("width", "32");
  eqPlate.setAttribute("height", "32");
  eqPlate.setAttribute("rx", "8");
  eqPlate.setAttribute("fill", "#FFFFFF");
  eqPlate.setAttribute("stroke", "#E8EBF3");
  eqPlate.setAttribute("filter", "url(#cardShadow)");
  svg.appendChild(eqPlate);

  const eqText = document.createElementNS(svgNS, "text");
  eqText.setAttribute("x", String(eqX));
  eqText.setAttribute("y", String(eqY + 8));
  eqText.setAttribute("text-anchor", "middle");
  eqText.setAttribute("class", "t-label");
  eqText.setAttribute("fill", "#0A5EDC");
  eqText.textContent = "=";
  svg.appendChild(eqText);

  // Legend (approximate centering, computed after items are appended)
  const legendItems = [
    { key: "Anleggsmidler", color: "#8CB2FF" },
    { key: "Varelager", color: "#5A94FF" },
    { key: "Fordringer", color: "#0A5EDC" },
    { key: "Kontanter", color: "#B6CCFF" },
    { key: "Egenkapital", color: "#0C8F4A" },
    { key: "Gjeld", color: "#912018" }
  ];
  const legendGroup = document.createElementNS(svgNS, "g");
  const legendY = Math.min(vbH - 32, sumY + 24 + 16); // place under sums
  svg.appendChild(legendGroup);
  // Hide legend/categories under the graphic per request
  legendGroup.setAttribute("display", "none");

  let xCursor = pad; const spacing = 16; const mark = 12; const gap = 4;
  const tempItems = [];
  legendItems.forEach((li) => {
    const g = document.createElementNS(svgNS, "g");
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", "0"); rect.setAttribute("y", String(legendY - mark + 2));
    rect.setAttribute("width", String(mark)); rect.setAttribute("height", String(mark));
    rect.setAttribute("rx", "3"); rect.setAttribute("fill", li.color);
    rect.setAttribute("fill-opacity", "0.9");
    rect.setAttribute("stroke", darken(li.color, 0.8)); rect.setAttribute("stroke-width", "1.5");
    g.appendChild(rect);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", String(mark + gap));
    text.setAttribute("y", String(legendY + 2));
    text.setAttribute("class", "t-legend");
    text.textContent = li.key;
    g.appendChild(text);
    legendGroup.appendChild(g);
    tempItems.push({ g, text });
  });

  // Measure and center
  const widths = tempItems.map(({ g, text }) => {
    const bb = text.getBBox();
    return mark + gap + bb.width;
  });
  const totalLegendWidth = widths.reduce((s, w) => s + w, 0) + spacing * (legendItems.length - 1);
  let startX = Math.round((vbW - totalLegendWidth) / 2);
  tempItems.forEach((item, idx) => {
    const g = item.g; const w = widths[idx];
    g.setAttribute("transform", `translate(${startX},0)`);
    startX += w + spacing;
  });

  return svg;
}

// --- Donut (Grafikk2) ---
function renderDonutModule(root) {
  root.innerHTML = "";
  const assets = AppState.assets || [];
  const blueScale = ["#B6CCFF", "#8CB2FF", "#5A94FF", "#0A5EDC", "#C8D8FF", "#E4ECFF"];
  const assetCategories = assets.map((a, idx) => ({
    key: String(a.name || `Eiendel ${idx + 1}`),
    value: a.amount || 0,
    color: blueScale[idx % blueScale.length]
  })).filter(a => a.value > 0);

  const vbW = 960, vbH = 520;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${vbW} ${vbH}`);
  svg.style.width = "100%"; svg.style.height = "auto"; svg.style.display = "block";

  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
  bg.setAttribute("width", String(vbW)); bg.setAttribute("height", String(vbH));
  bg.setAttribute("fill", "#F2F4F7");
  svg.appendChild(bg);

  const centerX = Math.round(vbW * 0.38); const centerY = Math.round(vbH * 0.52);
  const outerR = 208; const innerR = 104; // 30% større donut
  const total = assetCategories.reduce((s, x) => s + x.value, 0) || 1;
  let angle = -Math.PI / 2; // start på topp

  // Tooltip
  const tip = document.createElementNS(svgNS, "g");
  tip.setAttribute("visibility", "hidden");
  tip.setAttribute("pointer-events", "none");
  const tipBg = document.createElementNS(svgNS, "rect");
  tipBg.setAttribute("rx", "8"); tipBg.setAttribute("ry", "8");
  tipBg.setAttribute("fill", "#FFFFFF"); tipBg.setAttribute("stroke", "#E8EBF3");
  const tipText = document.createElementNS(svgNS, "text");
  tipText.setAttribute("fill", "#1C2A3A"); tipText.setAttribute("font-size", "14"); tipText.setAttribute("font-weight", "700");
  tip.appendChild(tipBg); tip.appendChild(tipText);
  svg.appendChild(tip);

  assetCategories.forEach((seg) => {
    const frac = seg.value / total;
    const sweep = frac * Math.PI * 2;
    const x1 = centerX + outerR * Math.cos(angle);
    const y1 = centerY + outerR * Math.sin(angle);
    const x2 = centerX + outerR * Math.cos(angle + sweep);
    const y2 = centerY + outerR * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;

    // Ytre bue
    const g = document.createElementNS(svgNS, "g");
    const path = document.createElementNS(svgNS, "path");
    const d = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
      `L ${centerX + innerR * Math.cos(angle + sweep)} ${centerY + innerR * Math.sin(angle + sweep)}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${centerX + innerR * Math.cos(angle)} ${centerY + innerR * Math.sin(angle)}`,
      "Z"
    ].join(" ");
    path.setAttribute("d", d);
    path.setAttribute("fill", seg.color);
    path.setAttribute("fill-opacity", "0.9");
    g.appendChild(path);
    svg.appendChild(g);

    // Interaktivitet: hover-zoom og tooltip med prosent
    function showTip(evt) {
      const percent = (frac * 100).toFixed(1).replace('.', ',');
      tipText.textContent = `${seg.key}: ${percent} %`;
      tip.setAttribute("visibility", "visible");
      const ptX = evt.clientX - svg.getBoundingClientRect().left;
      const ptY = evt.clientY - svg.getBoundingClientRect().top;
      const x = Math.max(16, Math.min(vbW - 140, ptX));
      const y = Math.max(24, Math.min(vbH - 40, ptY));
      tipText.setAttribute("x", String(x + 10));
      tipText.setAttribute("y", String(y + 18));
      const w = tipText.getComputedTextLength() + 20;
      tipBg.setAttribute("x", String(x)); tipBg.setAttribute("y", String(y));
      tipBg.setAttribute("width", String(w)); tipBg.setAttribute("height", "28");
    }
    function hideTip() { tip.setAttribute("visibility", "hidden"); }
    function zoomIn() { g.setAttribute("transform", `translate(${centerX},${centerY}) scale(1.06) translate(${-centerX},${-centerY})`); }
    function zoomOut() { g.removeAttribute("transform"); }
    g.addEventListener("mouseenter", (e)=>{ zoomIn(); showTip(e); });
    g.addEventListener("mousemove", showTip);
    g.addEventListener("mouseleave", ()=>{ zoomOut(); hideTip(); });

    angle += sweep;
  });

  // Legg på små labels til høyre (legend med verdier)
  const legendX = Math.round(vbW * 0.6); let legendY = centerY - 40;
  assetCategories.forEach((seg) => {
    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", String(legendX)); rect.setAttribute("y", String(legendY));
    rect.setAttribute("width", "12"); rect.setAttribute("height", "12"); rect.setAttribute("rx", "3");
    rect.setAttribute("fill", seg.color); rect.setAttribute("fill-opacity", "0.9");
    svg.appendChild(rect);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", String(legendX + 18)); text.setAttribute("y", String(legendY + 11));
    text.setAttribute("fill", "#1C2A3A"); text.setAttribute("font-size", "14"); text.setAttribute("font-weight", "600");
    text.textContent = `${seg.key} · ${formatNOK(seg.value)}`;
    svg.appendChild(text);
    legendY += 22;
  });

  root.appendChild(svg);
}

// --- Waterfall (Grafikk III) ---
function renderWaterfallModule(root) {
  root.innerHTML = "";

  // Sample period selector (Month/Quarter/Year)
  const controls = document.createElement("div");
  controls.style.display = "none"; // make invisible as requested
  const select = document.createElement("select");
  ["Måned", "Kvartal", "År"].forEach((t) => { const o = document.createElement("option"); o.value = t; o.textContent = t; select.appendChild(o); });
  controls.appendChild(select);
  root.appendChild(controls);

  const svgNS = "http://www.w3.org/2000/svg";
  const vbW = 1200, vbH = 560;
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${vbW} ${vbH}`);
  svg.style.width = "100%"; svg.style.height = "auto"; svg.style.display = "block";

  const style = document.createElementNS(svgNS, "style");
  style.textContent = `
    .wf-title { font: 900 24px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #1C2A3A; }
    .wf-label { font: 600 13px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #677788; }
    .wf-value { font: 700 13px Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif; fill: #1C2A3A; }
  `;
  svg.appendChild(style);

  const bg = document.createElementNS(svgNS, "rect");
  bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
  bg.setAttribute("width", String(vbW)); bg.setAttribute("height", String(vbH));
  bg.setAttribute("fill", "#F2F4F7");
  svg.appendChild(bg);

  const panel = document.createElementNS(svgNS, "rect");
  panel.setAttribute("x", "12"); panel.setAttribute("y", "12");
  panel.setAttribute("width", String(vbW - 24)); panel.setAttribute("height", String(vbH - 24));
  panel.setAttribute("rx", "12"); panel.setAttribute("fill", "#FFFFFF"); panel.setAttribute("stroke", "#E8EBF3");
  svg.appendChild(panel);

  // Data synthesis from AppState with fixed categories
  function getData() {
    const incomeItems = AppState.incomes || [];
    const upper = (s) => String(s || "").toUpperCase();

    // Income categories
    const wage = incomeItems.filter(x => /L[ØO]NN/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
    const dividends = incomeItems.filter(x => /UTBYT/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
    const otherIncome = incomeItems.filter(x => /ANDRE/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
    const totalIncome = wage + dividends + otherIncome;

    // Explicit cost categories from inputs
    const annualTax = incomeItems.filter(x => /SKATT/.test(upper(x.name))).reduce((s,x)=> s + Math.abs(x.amount || 0), 0);
    const annualCosts = incomeItems.filter(x => /KOSTNAD/.test(upper(x.name))).reduce((s,x)=> s + Math.abs(x.amount || 0), 0);

    // Debt-derived costs: interest and principal (approx. first-year split)
    const totalDebt = (AppState.debts || []).reduce((s,d)=> s + (d.amount || 0), 0);
    const r = AppState.debtParams && AppState.debtParams.rate || 0;
    const n = Math.max(1, AppState.debtParams && AppState.debtParams.years || 1);
    let annualPayment = 0;
    const loanType = (AppState.debtParams && AppState.debtParams.type) || "Annuitetslån";
    if (loanType === "Serielån") {
      annualPayment = totalDebt / n + (totalDebt * r) / 2; // approx average
    } else if (loanType === "Avdragsfrihet") {
      // Kun renter, ingen avdrag
      annualPayment = totalDebt * r;
    } else {
      // Annuitetslån
      annualPayment = totalDebt * (r / (1 - Math.pow(1 + r, -n)));
    }
    const interestCost = totalDebt * r; // first-year interest approximation
    const principalCost = loanType === "Avdragsfrihet" ? 0 : Math.max(0, annualPayment - interestCost);

    const costs = [
      { key: "Årlig skatt", value: annualTax },
      { key: "Årlige kostnader", value: annualCosts },
      { key: "Rentekostnader", value: interestCost },
      { key: "Avdrag", value: principalCost }
    ].filter(c => c.value > 0 || c.key === "Avdrag");

    const net = totalIncome - costs.reduce((s,c)=> s + c.value, 0);
    return { totalIncome, costs, net, wage, dividends, otherIncome };
  }

  function draw() {
    // Clear dynamic content except styles/panel
    while (svg.childNodes.length > 3) svg.removeChild(svg.lastChild);

    const { totalIncome, costs, net, wage, dividends, otherIncome } = getData();

    const padX = 80; const padTop = 70; const padBottom = net < 0 ? 96 : 64; // ekstra plass under baseline ved negativ netto
    const chartW = vbW - padX * 2; const chartH = vbH - padTop - padBottom;

    // Bygg trinn, utelat nullverdier
    const steps = [];
    if (wage > 0) steps.push({ type: "up", key: "Lønnsinntekt", value: wage });
    if (dividends > 0) steps.push({ type: "up", key: "Utbytter", value: dividends });
    if (otherIncome > 0) steps.push({ type: "up", key: "Andre inntekter", value: otherIncome });
    costs.forEach(c => { if (c.value > 0) steps.push({ type: "down", key: c.key, value: -c.value }); });
    steps.push({ type: "end", key: "Årlig kontantstrøm", value: net });

    // Skaler etter hele spennvidden i den kumulative serien (topp til bunn)
    const tempSteps = [];
    if (wage > 0) tempSteps.push({ type: "up", value: wage, key: "Lønnsinntekt" });
    if (dividends > 0) tempSteps.push({ type: "up", value: dividends, key: "Utbytter" });
    if (otherIncome > 0) tempSteps.push({ type: "up", value: otherIncome, key: "Andre inntekter" });
    (costs || []).forEach(c => { if (c.value > 0) tempSteps.push({ type: "down", value: -c.value, key: c.key }); });
    let lvl = 0; const levels = [0];
    tempSteps.forEach(s => { lvl += s.value; levels.push(lvl); });
    levels.push(net); // inkluder netto nivå
    const minLevel = Math.min(0, ...levels);
    const maxLevel = Math.max(0, ...levels);
    const levelRange = Math.max(1, maxLevel - minLevel);
    const levelToY = (L) => padTop + chartH - ((L - minLevel) / levelRange) * chartH;
    const barGeom = (fromLevel, toLevel) => {
      const y1 = levelToY(fromLevel); const y2 = levelToY(toLevel);
      const yTop = Math.min(y1, y2);
      const hRaw = Math.abs(y2 - y1);
      return { yTop, h: Math.max(2, hRaw) };
    };

    // Farger
    const cashflowPositive = (getComputedStyle(document.documentElement).getPropertyValue('--BLUE_200') || '#E0EDFF').trim();
    const blue = "#0A5EDC";
    // Rødfarger for kostnadssøyler i lys tema
    const redPalette = ["#F5B5B1", "#F1998F", "#EC7E73", "#E36258", "#D84F47"]; // lys -> dyp
    const redEnd = "#D84F47"; // sluttstolpe ved negativ kontantstrøm
    // Grønnpalett for inntekter
    const greenPalette = ["#B5ECD0", "#7AD9A9", "#34C185", "#0C8F4A"]; // varierte grønntoner
    // Egen farge for Årlig kontantstrøm (uavhengig av tegn)
    const netBarColor = (getComputedStyle(document.documentElement).getPropertyValue('--WF_NET_COLOR') || '#DBEAFE').trim();

    const colW = Math.max(60, Math.floor(chartW / steps.length) - 10);
    let cursorX = padX;
    let running = 0;
    let downIndex = 0; let upIndex = 0;
    steps.forEach((s, idx) => {
      if (!s || !isFinite(s.value)) return; // hopp over nulltrinn, men behold 0 for Avdrag
      let h, y, fill;
      let labelText;
      if (s.type === "up") {
        const from = running;
        const to = running + s.value;
        const geom = barGeom(from, to);
        h = geom.h; y = geom.yTop;
        running = to;
        fill = greenPalette[upIndex % greenPalette.length];
        upIndex++;
        labelText = formatNOK(Math.round(Math.abs(s.value)));
      } else if (s.type === "down") {
        const from = running;
        const to = running + s.value; // s.value is negative
        const geom = barGeom(from, to);
        h = geom.h; y = geom.yTop;
        running = to;
        fill = redPalette[downIndex % redPalette.length];
        downIndex++;
        labelText = formatNOK(Math.round(s.value)); // vis alltid minus for kostnader
      } else { // end (netto)
        const from = 0;
        const to = s.value;
        const geom = barGeom(from, to);
        h = geom.h; y = geom.yTop;
        // Fast definert farge for netto-kolonnen
        fill = netBarColor;
        labelText = formatNOK(Math.round(s.value)); // signert
      }

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", String(cursorX));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(colW));
      rect.setAttribute("height", String(Math.max(2, h)));
      rect.setAttribute("rx", "6");
      rect.setAttribute("fill", fill);
      rect.setAttribute("fill-opacity", "0.9");
      rect.setAttribute("stroke", "#E8EBF3");
      rect.setAttribute("stroke-opacity", "1");
      svg.appendChild(rect);

      const lab = document.createElementNS(svgNS, "text");
      lab.setAttribute("class", "wf-label");
      lab.setAttribute("x", String(cursorX + colW / 2));
      const labelY = Math.min(vbH - 8, y + Math.max(2, h) + 14); // plasser under nederste kant
      lab.setAttribute("y", String(labelY));
      lab.setAttribute("text-anchor", "middle");
      lab.textContent = s.key;
      svg.appendChild(lab);

      const val = document.createElementNS(svgNS, "text");
      val.setAttribute("class", "wf-value");
      val.setAttribute("x", String(cursorX + colW / 2));
      val.setAttribute("y", String(y - 8));
      val.setAttribute("text-anchor", "middle");
      val.textContent = labelText;
      svg.appendChild(val);

      cursorX += colW + 10;
    });

    // Title
    const title = document.createElementNS(svgNS, "text");
    title.setAttribute("class", "wf-title");
    title.setAttribute("x", String(vbW / 2));
    title.setAttribute("y", "44");
    title.setAttribute("text-anchor", "middle");
    title.textContent = "Waterfall";
    svg.appendChild(title);
  }

  select.addEventListener("change", draw);
  draw();
  root.appendChild(svg);
}
// --- Fremtiden modul ---
function renderFutureModule(root) {
  root.innerHTML = "";
  const assets = AppState.assets || [];
  const debts = AppState.debts || [];
  const blueScale = ["#2A4D80", "#355F9E", "#60A5FA", "#00A9E0", "#294269", "#203554"];

  const graphWrap = document.createElement("div");
  root.appendChild(graphWrap);

  function projectAssetsForYear(yearVal) {
    const yearsFromStart = Math.max(0, Number(yearVal) - 2025);
    const exp = AppState.expectations || { likvider: 0, fastEiendom: 0, investeringer: 0, andreEiendeler: 0 };
    const rLikv = (exp.likvider || 0) / 100;
    const rEiend = (exp.fastEiendom || 0) / 100;
    const rInv = (exp.investeringer || 0) / 100;
    const rOther = (exp.andreEiendeler || 0) / 100;
    return assets.map((a, idx) => {
      const name = String(a.name || `Eiendel ${idx + 1}`);
      const base = a.amount || 0;
      let rate = rOther;
      const U = name.toUpperCase();
      if (/LIKVIDER/.test(U)) rate = rLikv;
      else if (/FAST|EIENDOM/.test(U)) rate = rEiend;
      else if (/INVEST/.test(U)) rate = rInv;
      const value = base * Math.pow(1 + rate, yearsFromStart);
      return { key: name, value, color: blueScale[idx % blueScale.length] };
    });
  }

  function remainingDebtForYear(yearVal) {
    const P = debts.reduce((s, d) => s + (d.amount || 0), 0);
    const t = Math.max(0, Math.min(Number(yearVal) - 2025, AppState.debtParams.years));
    const N = Math.max(1, AppState.debtParams.years);
    const r = AppState.debtParams.rate || 0;
    if (P <= 0) return 0;
    // Avdragsfrihet: ingen avdrag -> gjelden forblir konstant over tid
    if (AppState.debtParams.type === "Avdragsfrihet") {
      return P;
    }
    if (AppState.debtParams.type === "Serielån") {
      const rem = P - (P / N) * t;
      return Math.max(0, rem);
    } else {
      if (r === 0) {
        return Math.max(0, P * (1 - t / N));
      }
      const A = P * (r / (1 - Math.pow(1 + r, -N)));
      const rem = P * Math.pow(1 + r, t) - A * ((Math.pow(1 + r, t) - 1) / r);
      return Math.max(0, rem);
    }
  }

  function draw(yearVal) {
    const assetCategories = projectAssetsForYear(yearVal);
    const totalAssets = assetCategories.reduce((s, x) => s + x.value, 0);
    const remDebt = remainingDebtForYear(yearVal);
    const debtVal = Math.min(remDebt, totalAssets);
    const equityVal = Math.max(0, totalAssets - debtVal);
  const financingParts = [
    { key: "Egenkapital", value: equityVal, color: "#4ADE80" },
    { key: "Gjeld", value: debtVal, color: "#f87171" }
  ];
    graphWrap.innerHTML = "";
    graphWrap.appendChild(buildFinanceSVG(assetCategories, financingParts, totalAssets));

    // Oppdater toppbokser med projiserte tall
    const elA = document.getElementById("sum-assets");
    if (elA) elA.textContent = formatNOK(Math.round(totalAssets));
    const elD = document.getElementById("sum-debts");
    if (elD) elD.textContent = formatNOK(Math.round(remDebt));
    const elE = document.getElementById("sum-equity");
    if (elE) elE.textContent = formatNOK(Math.round(totalAssets - remDebt));
  }

  // Initial draw at 2025
  draw(2025);

  // År-slider under grafikken
  const wrap = document.createElement("div");
  wrap.className = "year-slider-card";

  const yearLabel = document.createElement("div");
  yearLabel.className = "year-display";
  yearLabel.textContent = "2025";
  wrap.appendChild(yearLabel);

  const year = document.createElement("input");
  year.type = "range";
  year.min = "2025"; year.max = "2050"; year.step = "1"; year.value = "2025";
  year.className = "year-range";
  year.addEventListener("input", () => { yearLabel.textContent = year.value; draw(Number(year.value)); });
  wrap.appendChild(year);
  root.appendChild(wrap);
}

function attachTooltip(svg, target, title, value, percentText) {
  const svgNS = "http://www.w3.org/2000/svg";
  let tip;
  function ensureTip() {
    if (tip) return tip;
    tip = document.createElementNS(svgNS, "g");
    tip.setAttribute("visibility", "hidden");
    tip.setAttribute("pointer-events", "none");
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("rx", "12"); bg.setAttribute("ry", "12");
    bg.setAttribute("fill", "#FFFFFF");
    bg.setAttribute("stroke", "#E2E8F0");
    bg.setAttribute("filter", "url(#cardShadow)");
    const t1 = document.createElementNS(svgNS, "text"); t1.setAttribute("class", "t-label"); t1.setAttribute("fill", "#334155");
    const t2 = document.createElementNS(svgNS, "text"); t2.setAttribute("class", "t-value");
    const t3 = document.createElementNS(svgNS, "text"); t3.setAttribute("class", "t-value");
    tip.appendChild(bg); tip.appendChild(t1); tip.appendChild(t2); tip.appendChild(t3);
    svg.appendChild(tip);
    tip.bg = bg; tip.t1 = t1; tip.t2 = t2; tip.t3 = t3;
    return tip;
  }
  function show(e) {
    const t = ensureTip();
    t.t1.textContent = title;
    t.t2.textContent = `Verdi: ${formatNOK(value)}`;
    t.t3.textContent = `Andel: ${percentText} av total`;
    t.setAttribute("visibility", "visible");
    position(e);
  }
  function hide() { if (tip) tip.setAttribute("visibility", "hidden"); }
  function position(e) {
    const rect = svg.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 700 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const padding = 12;
    const t = ensureTip();
    // layout texts
    const baseY = y - 8;
    t.t1.setAttribute("x", String(x + padding)); t.t1.setAttribute("y", String(baseY));
    t.t2.setAttribute("x", String(x + padding)); t.t2.setAttribute("y", String(baseY + 18));
    t.t3.setAttribute("x", String(x + padding)); t.t3.setAttribute("y", String(baseY + 34));
    // measure
    const w = Math.max(t.t1.getBBox().width, t.t2.getBBox().width, t.t3.getBBox().width) + padding * 2;
    const h = 12 + 34 + padding; // approx
    t.bg.setAttribute("x", String(x));
    t.bg.setAttribute("y", String(baseY - 22));
    t.bg.setAttribute("width", String(w));
    t.bg.setAttribute("height", String(44));
  }
  target.addEventListener("mouseenter", show);
  target.addEventListener("mousemove", position);
  target.addEventListener("mouseleave", hide);
}

function makeBlock(title, amountText, variant, grow, heightPx) {
  const b = document.createElement("div");
  b.className = `viz-block ${variant || ''}`.trim();
  if (heightPx !== undefined) {
    b.style.height = `${Math.max(56, Math.round(heightPx))}px`;
  }
  const t = document.createElement("div");
  t.style.fontWeight = "700";
  t.style.marginBottom = "8px";
  t.textContent = title;
  const a = document.createElement("div");
  a.className = "value";
  a.textContent = amountText;
  b.appendChild(t);
  b.appendChild(a);
  return b;
}

function createItemRow(collectionName, item) {
  const row = document.createElement("div");
  row.className = "asset-row";

  // Kostnadsrader (inntekter med SKATT/KOSTNAD) markeres
  const markCostIfNeeded = (label) => {
    if (collectionName === "incomes") {
      const U = String(label || "").toUpperCase();
      if (/SKATT|KOSTNAD/.test(U)) row.classList.add("is-cost");
      else row.classList.remove("is-cost");
    }
  };
  markCostIfNeeded(item && item.name);

  const col = document.createElement("div");
  col.className = "asset-col";

  const top = document.createElement("div");
  top.className = "asset-top";

  const name = document.createElement("input");
  name.className = "asset-name";
  name.type = "text";
  name.value = item.name || "";
  name.setAttribute("aria-label", `Navn på ${collectionName.slice(0, -1)}`);
  if (item.locked) {
    name.readOnly = true;
  } else {
    name.addEventListener("input", () => { item.name = name.value; markCostIfNeeded(name.value); setRangeBounds(); });
  }

  const del = document.createElement("button");
  del.className = "asset-delete";
  del.setAttribute("aria-label", `Slett ${collectionName.slice(0, -1)}`);
  del.textContent = "×";
  if (item.locked) {
    del.disabled = true;
    del.style.opacity = "0.5";
    del.style.cursor = "not-allowed";
  } else {
    del.addEventListener("click", () => {
      const list = AppState[collectionName];
      const idx = list.findIndex((x) => x.id === item.id);
      if (idx >= 0) list.splice(idx, 1);
      row.remove();
      updateTopSummaries();
    });
  }

  top.appendChild(name);
  top.appendChild(del);

  const range = document.createElement("input");
  range.className = "asset-range";
  range.type = "range";
  range.min = "0";
  range.max = "50000000"; // 50 mill.
  range.step = "50000";
  range.value = String(item.amount || 0);

  // Juster maksgrense for lønn til 10 MNOK
  function setRangeBounds() {
    if (collectionName === "incomes") {
      const label = String(item.name || name.value || "").toUpperCase();
      // Lønn, Skatt, Utbytter, Andre inntekter, Kostnader: maks 10 MNOK
      if (/L[ØO]NN|SKATT|UTBYT|ANDRE|KOSTNAD/.test(label)) {
        range.max = "10000000";
      } else {
        range.max = "50000000";
      }
      if (Number(range.value) > Number(range.max)) {
        range.value = range.max;
        amount.textContent = formatNOK(Number(range.value));
      }
    }
  }

  const amount = document.createElement("div");
  amount.className = "asset-amount";
  amount.textContent = formatNOK(Number(range.value));
  setRangeBounds();

  range.addEventListener("input", () => {
    const v = Number(range.value);
    item.amount = v;
    amount.textContent = formatNOK(v);
    updateTopSummaries();
  });

  col.appendChild(top);
  col.appendChild(range);

  row.appendChild(col);
  row.appendChild(amount);

  return row;
}

function formatNOK(value) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(value);
}

// --- Gjeld modul ---
function renderDebtModule(root) {
  root.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel debt";

  const heading = document.createElement("h3");
  heading.textContent = "Gjeld";
  panel.appendChild(heading);

  const list = document.createElement("div");
  list.className = "assets";
  panel.appendChild(list);

  AppState.debts.forEach((item) => list.appendChild(createItemRow("debts", item)));

  // Lånetype
  const typeLabel = document.createElement("div");
  typeLabel.className = "section-label";
  typeLabel.textContent = "Lånetype";
  panel.appendChild(typeLabel);

  const typeWrap = document.createElement("div");
  typeWrap.className = "select";
  const select = document.createElement("select");
  ["Annuitetslån", "Serielån", "Avdragsfrihet"].forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t.toUpperCase();
    select.appendChild(opt);
  });
  select.value = AppState.debtParams.type;
  select.addEventListener("change", () => {
    AppState.debtParams.type = select.value;
    updateTopSummaries();
  });
  typeWrap.appendChild(select);
  panel.appendChild(typeWrap);

  // Lånetid (år)
  const yearsLabel = document.createElement("div");
  yearsLabel.className = "section-label";
  yearsLabel.textContent = "Lånetid (år)";
  panel.appendChild(yearsLabel);

  const yearsRow = document.createElement("div");
  yearsRow.className = "asset-row";
  const yearsCol = document.createElement("div");
  yearsCol.className = "asset-col";
  const yearsRange = document.createElement("input");
  yearsRange.type = "range";
  yearsRange.className = "asset-range";
  yearsRange.min = "1"; yearsRange.max = "30"; yearsRange.step = "1";
  // Clamp to 30 if necessary
  if (AppState.debtParams.years > 30) AppState.debtParams.years = 30;
  yearsRange.value = String(AppState.debtParams.years);
  const yearsOut = document.createElement("div");
  yearsOut.className = "asset-amount";
  yearsOut.textContent = `${AppState.debtParams.years} år`;
  yearsRange.addEventListener("input", () => {
    AppState.debtParams.years = Number(yearsRange.value);
    yearsOut.textContent = `${yearsRange.value} år`;
    updateTopSummaries();
  });
  yearsCol.appendChild(yearsRange);
  yearsRow.appendChild(yearsCol);
  yearsRow.appendChild(yearsOut);
  panel.appendChild(yearsRow);

  // Rentekostnader (%)
  const rateLabel = document.createElement("div");
  rateLabel.className = "section-label";
  rateLabel.textContent = "Rentekostnader (%)";
  panel.appendChild(rateLabel);

  const rateRow = document.createElement("div");
  rateRow.className = "asset-row";
  const rateCol = document.createElement("div");
  rateCol.className = "asset-col";
  const rateRange = document.createElement("input");
  rateRange.type = "range";
  rateRange.className = "asset-range";
  rateRange.min = "0"; rateRange.max = "20"; rateRange.step = "0.1"; rateRange.value = String(AppState.debtParams.rate * 100);
  const rateOut = document.createElement("div");
  rateOut.className = "asset-amount";
  rateOut.textContent = `${(AppState.debtParams.rate * 100).toFixed(1).replace('.', ',')} %`;
  rateRange.addEventListener("input", () => {
    AppState.debtParams.rate = Number(rateRange.value) / 100;
    rateOut.textContent = `${Number(rateRange.value).toFixed(1).replace('.', ',')} %`;
    updateTopSummaries();
  });
  rateCol.appendChild(rateRange);
  rateRow.appendChild(rateCol);
  rateRow.appendChild(rateOut);
  panel.appendChild(rateRow);

  const addBtn = document.createElement("button");
  addBtn.className = "btn-add";
  addBtn.textContent = "Legg til gjeld";
  addBtn.addEventListener("click", () => {
    const newItem = { id: genId(), name: "NY GJELD", amount: 0 };
    AppState.debts.push(newItem);
    list.appendChild(createItemRow("debts", newItem));
  });
  panel.appendChild(addBtn);

  root.appendChild(panel);
  updateTopSummaries();
}

// --- Inntekter modul ---
function renderIncomeModule(root) {
  root.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel";

  const heading = document.createElement("h3");
  heading.textContent = "Inntekt";
  panel.appendChild(heading);

  const list = document.createElement("div");
  list.className = "assets";
  panel.appendChild(list);

  AppState.incomes.forEach((item) => list.appendChild(createItemRow("incomes", item)));

  const addBtn = document.createElement("button");
  addBtn.className = "btn-add";
  addBtn.textContent = "Legg til inntekt";
  addBtn.addEventListener("click", () => {
    const newItem = { id: genId(), name: "NY INNTEKT", amount: 0 };
    AppState.incomes.push(newItem);
    list.appendChild(createItemRow("incomes", newItem));
  });
  panel.appendChild(addBtn);

  root.appendChild(panel);
  updateTopSummaries();
}

// --- Analyse modul ---
function renderAnalysisModule(root) {
  root.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel";

  const heading = document.createElement("h3");
  heading.textContent = "Nøkkeltall og anbefalinger";
  panel.appendChild(heading);

  // Aggregates
  const totalAssets = AppState.assets.reduce((s, x) => s + (x.amount || 0), 0);
  const totalDebt = AppState.debts.reduce((s, x) => s + (x.amount || 0), 0);
  const upper = (s) => String(s || "").toUpperCase();
  const incomeItems = AppState.incomes;
  const annualCosts = incomeItems
    .filter((x) => /SKATT|KOSTNAD/.test(upper(x.name)))
    .reduce((s, x) => s + (x.amount || 0), 0);
  const totalIncome = incomeItems
    .filter((x) => !/SKATT|KOSTNAD/.test(upper(x.name)))
    .reduce((s, x) => s + (x.amount || 0), 0);

  // Debt service per year
  const r = AppState.debtParams.rate; // annual
  const n = Math.max(1, AppState.debtParams.years);
  let annualDebtPayment = 0;
  if (AppState.debtParams.type === "Annuitetslån") {
    if (r === 0) annualDebtPayment = totalDebt / n;
    else annualDebtPayment = totalDebt * (r / (1 - Math.pow(1 + r, -n)));
  } else if (AppState.debtParams.type === "Serielån") { // Serielån (avg. over løpetid)
    annualDebtPayment = totalDebt / n + (totalDebt * r) / 2;
  } else { // Avdragsfrihet: kun renter
    annualDebtPayment = totalDebt * r;
  }

  const cashflow = totalIncome - annualCosts - annualDebtPayment;
  // Din verdi: default 0 kr
  const bufferCurrent = 0;
  // Anbefalt buffer: (årlig total inntekt / 12) x 3
  const bufferRecommended = (totalIncome / 12) * 3; // 3 mnd av inntekt

  // Ratios
  const incomeToDebt = totalDebt > 0 ? totalIncome / totalDebt : 0;
  const debtServiceToIncome = totalIncome > 0 ? annualDebtPayment / totalIncome : 0;
  const debtToIncome = totalIncome > 0 ? totalDebt / totalIncome : 0;
  const equity = totalAssets - totalDebt;
  const leverage = equity > 0 ? totalDebt / equity : Infinity;

  function statusSpan(ok) {
    const span = document.createElement("span");
    span.className = `status ${ok ? "ok" : "warn"}`;
    span.textContent = ok ? "OK" : "SJEKK";
    return span;
  }

  function recCell(text, ok) {
    const wrap = document.createElement("span");
    const rec = document.createElement("span");
    rec.textContent = text;
    rec.style.marginRight = "8px";
    wrap.appendChild(rec);
    wrap.appendChild(statusSpan(ok));
    return wrap;
  }

  function tr(label, valueEl, recEl) {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td"); td1.textContent = label; td1.className = "muted";
    const td2 = document.createElement("td"); td2.appendChild(valueEl);
    const td3 = document.createElement("td"); if (recEl) td3.appendChild(recEl); else td3.textContent = "-"; td3.className = recEl ? "" : "muted";
    tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
    return tr;
  }

  function textNode(txt) { const s = document.createElement("span"); s.textContent = txt; return s; }

  const table = document.createElement("table");
  table.className = "kpi-table";
  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Indikator</th><th>Din verdi</th><th>Anbefaling</th></tr>";
  const tbody = document.createElement("tbody");

  tbody.appendChild(tr("Sum inntekter", textNode(formatNOK(totalIncome))));
  const costsRow = tr("Årlige kostnader", textNode(formatNOK(annualCosts)));
  costsRow.classList.add("is-cost");
  tbody.appendChild(costsRow);
  const debtSvcRow = tr("Renter og avdrag per år", textNode(formatNOK(Math.round(annualDebtPayment))));
  debtSvcRow.classList.add("is-cost");
  tbody.appendChild(debtSvcRow);

  const cashRow = tr("Kontantstrøm per år", textNode(formatNOK(Math.round(cashflow))));
  if (cashflow < 0) cashRow.classList.add("is-cost");
  tbody.appendChild(cashRow);
  tbody.appendChild(tr(
    "Anbefalt bufferkonto / Likviditetsfond",
    textNode(formatNOK(Math.round(bufferCurrent))),
    textNode(formatNOK(Math.round(bufferRecommended)))
  ));

  // Thresholds
  const incomeDebtOk = incomeToDebt >= 0.2; // >=20%
  const dsIncomeOk = debtServiceToIncome <= 0.3; // <=30%
  const debtIncomeOk = debtToIncome <= 5; // <=5x
  const leverageOk = leverage <= 2.5; // <=2.5x

  tbody.appendChild(
    tr("Sum Inntekter / Gjeld", textNode(`${incomeToDebt.toFixed(2)}x`), recCell("> 20%", incomeDebtOk))
  );

  tbody.appendChild(
    tr("Renter og avdrag / Sum inntekter", textNode(`${(debtServiceToIncome*100).toFixed(1)}%`), recCell("< 30%", dsIncomeOk))
  );

  tbody.appendChild(
    tr("Gjeld / Sum inntekter", textNode(`${debtToIncome.toFixed(2)}x`), recCell("< 5x", debtIncomeOk))
  );

  tbody.appendChild(
    tr(
      "Gjeldsgrad (gjeld / egenkapital)",
      textNode(`${isFinite(leverage) ? leverage.toFixed(2) + 'x' : '∞'}`),
      recCell("< 2.5x", leverageOk)
    )
  );

  table.appendChild(thead);
  table.appendChild(tbody);
  panel.appendChild(table);
  root.appendChild(panel);
  updateTopSummaries();
}

// --- Tapsbærende Evne (TBE) ---
function renderTbeModule(root) {
  root.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "panel";

  const heading = document.createElement("h3");
  heading.textContent = "Tapsbærende evne (TBE)";
  panel.appendChild(heading);

  // Hent grunnlag
  const totalAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const totalDebt = (AppState.debts || []).reduce((s, x) => s + (x.amount || 0), 0);

  const incomeItems = AppState.incomes || [];
  const upper = (s) => String(s || "").toUpperCase();
  const annualCosts = incomeItems.filter((x) => /SKATT|KOSTNAD/.test(upper(x.name))).reduce((s, x) => s + (x.amount || 0), 0);
  const totalIncome = incomeItems.filter((x) => !/SKATT|KOSTNAD/.test(upper(x.name))).reduce((s, x) => s + (x.amount || 0), 0);

  // Gjeldsforpliktelser (per år)
  const r = AppState.debtParams.rate || 0; // årlig
  const n = Math.max(1, AppState.debtParams.years || 1);
  let annualDebtPayment = 0;
  if (AppState.debtParams.type === "Annuitetslån") {
    annualDebtPayment = r === 0 ? totalDebt / n : totalDebt * (r / (1 - Math.pow(1 + r, -n)));
  } else {
    annualDebtPayment = totalDebt / n + (totalDebt * r) / 2;
  }

  // Nøkler
  const equity = totalAssets - totalDebt;
  const disposableCashflow = totalIncome - annualCosts; // etter skatt/utgifter, før renter/avdrag

  const debtToIncome = totalIncome > 0 ? totalDebt / totalIncome : 0; // Gjeldsgrad
  const equityPct = totalAssets > 0 ? (equity / totalAssets) * 100 : 0; // EK%
  const cashToDebt = totalDebt > 0 ? disposableCashflow / totalDebt : 0; // Kontantstrøm/Gjeld

  // Klassifisering iht. kriterier
  // Justert terskler (mindre strenge) iht. spesifikasjonen
  // Gjeld/inntekt: Bra < 3x, Ok 3–5x, Dårlig > 5x
  function scoreDebtToIncome(v) { if (v < 3.0) return "high"; if (v <= 5.0) return "mid"; return "low"; }
  // EK-andel: Bra >= 35%, Ok 20–35%, Dårlig < 20%
  function scoreEquityPct(v) { if (v >= 35) return "high"; if (v >= 20) return "mid"; return "low"; }
  // Kontantstrøm/gjeld: Bra >= 25%, Ok 10–25%, Dårlig < 10%
  function scoreCashToDebt(v) { if (v >= 0.25) return "high"; if (v >= 0.10) return "mid"; return "low"; }

  const s1 = scoreDebtToIncome(debtToIncome);
  const s2 = scoreEquityPct(equityPct);
  const s3 = scoreCashToDebt(cashToDebt);

  // Samlet konklusjon (regel):
  //  - Alle tre grønne ("high") => Høy
  //  - To grønne => Middels
  //  - Én eller ingen grønne => Lav
  const greenCount = [s1, s2, s3].filter((s) => s === "high").length;
  let overall = greenCount === 3 ? "high" : greenCount === 2 ? "mid" : "low";

  function statusLabel(s) { return s === "high" ? "HØY" : s === "mid" ? "MIDDELS" : "LAV"; }
  function statusClass(s) { return s === "high" ? "ok" : s === "mid" ? "mid" : "warn"; }
  function fmtX(x) { return `${x.toFixed(2).replace('.', ',')}x`; }
  function fmtPct(p) { return `${p.toFixed(1).replace('.', ',')} %`; }

  // Tabell
  const table = document.createElement("table");
  table.className = "kpi-table";
  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>Nøkkeltall</th><th>Resultat</th><th>Vurdering</th><th>Formel</th><th>Måler</th></tr>";
  const tbody = document.createElement("tbody");

  function trRow(name, resultText, score, formula, measure) {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td"); td1.textContent = name; td1.className = "muted";
    const td2 = document.createElement("td"); td2.textContent = resultText;
    const td3 = document.createElement("td"); const wrap = document.createElement("span"); wrap.className = `status ${statusClass(score)}`; wrap.textContent = statusLabel(score); td3.appendChild(wrap);
    const td4 = document.createElement("td"); td4.textContent = formula; td4.className = "muted";
    const td5 = document.createElement("td"); td5.textContent = measure; td5.className = "muted";
    tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); tr.appendChild(td4); tr.appendChild(td5);
    return tr;
  }

  tbody.appendChild(trRow("Gjeldsgrad", fmtX(debtToIncome), s1, "Total gjeld / Årlig inntekt", "Gjeldskapasitet"));
  tbody.appendChild(trRow("Egenkapitalandel (EK%)", fmtPct(equityPct), s2, "(Total EK / Totale eiendeler) × 100", "Soliditet"));
  tbody.appendChild(trRow("Kontantstrøm/Gjeld", fmtX(cashToDebt), s3, "Årlig kontantstrøm / Gjeld", "Likviditet"));

  table.appendChild(thead);
  table.appendChild(tbody);
  panel.appendChild(table);

  // Konklusjon
  const concl = document.createElement("div");
  concl.className = `tbe-conclusion ${overall}`;
  const title = document.createElement("div");
  title.className = "tbe-title";
  title.textContent = `Samlet TBE: ${statusLabel(overall)}`;
  const expl = document.createElement("p");
  let reason = "";
  if (overall === "low") {
    const worst = s1 === "low" ? `høy Gjeldsgrad (${fmtX(debtToIncome)})` : s2 === "low" ? `lav EK% (${fmtPct(equityPct)})` : `lav Kontantstrøm/Gjeld (${fmtX(cashToDebt)})`;
    reason = `Din Tapsbærende Evne er Lav fordi færre enn to nøkkeltall er Høy (bl.a. ${worst}). Løft minst to indikatorer til Høy.`;
  } else if (overall === "mid") {
    reason = "Din Tapsbærende Evne er Middels fordi to nøkkeltall er Høy. For å nå Høy, få alle tre nøkkeltall til Høy.";
  } else {
    reason = "Alle tre nøkkeltall er Høy. Økonomien fremstår robust.";
  }
  expl.textContent = reason;
  concl.appendChild(title);
  concl.appendChild(expl);
  panel.appendChild(concl);

  // Grunnlagsblokk bevisst utelatt i TBE-visningen

  root.appendChild(panel);
  updateTopSummaries();
}

// Oppdater kalkulasjonslisten i "Låne for å investere" dersom den finnes på siden
function updateInvestLoanCalc() {
  const elPortfolio = document.getElementById('calc-portfolio');
  const elExpected = document.getElementById('calc-expected');
  const elEnd = document.getElementById('calc-endvalue');
  const elLoanRepay = document.getElementById('calc-loanrepay');
  const elInterestDeduction = document.getElementById('calc-interest-deduction');
  const elReturn = document.getElementById('calc-return');
  const elShield = document.getElementById('calc-shield');
  const elTax = document.getElementById('calc-tax');
  const elNet = document.getElementById('calc-net');
  if (!elPortfolio && !elExpected && !elEnd) return; // ikke i riktig fane

  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const years = Math.max(0, Number(AppState.yearsCount || 0));
  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  const shieldPct = isFinite(AppState.shieldRatePct) ? Number(AppState.shieldRatePct) : 0;
  const equitySharePct = typeof AppState.stockSharePercent === 'number' ? AppState.stockSharePercent : 0;
  const capitalTaxPct = isFinite(AppState.capitalTaxPct) ? Number(AppState.capitalTaxPct) : 22.0;
  const stockTaxPct = isFinite(AppState.stockTaxPct) ? Number(AppState.stockTaxPct) : 37.84;

  // Beregn forventet avkastning nøyaktig (samme som i Input-fanen) i stedet for å bruke avrundet verdi
  const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
  const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
  const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
  const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
  const equityShare = equitySharePct / 100; // 0..1
  const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
  const expectedPct = grossExpected - fee - kpi; // Trekker fra både rådgivningshonorar og KPI

  // Beregn verdi ved periodens slutt: P * (1 + r)^n der r = pct/100
  const r = expectedPct / 100;
  const endValue = portfolio * Math.pow(1 + r, years);

  if (elPortfolio) elPortfolio.textContent = formatNOK(Math.round(portfolio));
  // Hent "Forventet avkastning" direkte fra Input-fanen (samme verdi, to desimaler)
  const inputExpectedReturn = document.getElementById('expected-return-out');
  if (elExpected) {
    if (inputExpectedReturn) {
      // Hent verdien direkte fra Input-fanen (allerede formatert med to desimaler)
      const inputValue = inputExpectedReturn.textContent.trim();
      elExpected.textContent = inputValue;
    } else {
      // Fallback: bruk samme beregning med to desimaler
      elExpected.textContent = `${expectedPct.toFixed(2).replace('.', ',')} %`;
    }
  }
  if (elEnd) elEnd.textContent = formatNOK(Math.round(endValue));

  // Oppgjør gjeld = Lån inklusiv renter
  const rInt = interestPct / 100;
  const endLoanValue = portfolio * Math.pow(1 + rInt, years);
  const interestAfterTax = Math.max(0, endLoanValue - portfolio) * 0.78;
  if (elLoanRepay) elLoanRepay.textContent = formatNOK(Math.round(endLoanValue));
  
  // Fradrag rentekostnader = (Lån inklusiv renter - Lån) × 0.22
  // Renteutgifter ganges med kapitalskatten (22%) som fradrag
  const interestDeduction = Math.max(0, endLoanValue - portfolio) * 0.22;
  if (elInterestDeduction) elInterestDeduction.textContent = formatNOK(Math.round(interestDeduction));

  // Avkastning = Verdi ved periodens slutt - Portefølje
  const netReturn = endValue - portfolio;
  if (elReturn) elReturn.textContent = formatNOK(Math.round(netReturn));

  // Skjerming = (Portefølje * Aksjeandel) * ((1 + skjermingsrente)^år - 1)
  const equities = portfolio * Math.max(0, equitySharePct) / 100;
  const rShield = shieldPct / 100;
  const shieldGain = equities * (Math.pow(1 + rShield, years) - 1);
  if (elShield) elShield.textContent = formatNOK(Math.round(shieldGain));

  // Skatt = (Avkastning - Skjerming) × (Kapitalskatt × Renteandel + Aksjeskatt × Aksjeandel)
  // Renteandel = 1 - Aksjeandel
  const renteAndel = (100 - equitySharePct) / 100;
  const aksjeAndel = equitySharePct / 100;
  const taxableBase = Math.max(0, netReturn - shieldGain);
  const weightedTaxRate = (capitalTaxPct / 100 * renteAndel) + (stockTaxPct / 100 * aksjeAndel);
  const taxAmount = taxableBase * weightedTaxRate;
  if (elTax) elTax.textContent = formatNOK(Math.round(taxAmount));

  // Netto avkastning = Verdi ved periodens slutt - Skatt - Oppgjør gjeld + Fradrag rentekostnader
  const netAvkastning = endValue - taxAmount - endLoanValue + interestDeduction;
  if (elNet) elNet.textContent = formatNOK(Math.round(netAvkastning));
}

// Oppdater kalkulasjonslisten i "Utbytte/lån" dersom den finnes på siden
function updateDividendLoanCalc() {
  const elPortfolio = document.getElementById('div-portfolio');
  const elExpected = document.getElementById('div-expected');
  const elEndValue = document.getElementById('div-endvalue');
  const elDividend = document.getElementById('div-dividend');
  const elDividendTax = document.getElementById('div-dividend-tax');
  const elDividendNet = document.getElementById('div-dividend-net');
  // Høyre panel – samme felt som venstre panel
  const elRPortfolio = document.getElementById('r-portfolio');
  const elRExpected = document.getElementById('r-expected');
  const elREndValue = document.getElementById('r-endvalue');
  const elRDiv = document.getElementById('r-div');
  const elRDivTax = document.getElementById('r-div-tax');
  const elRDivNet = document.getElementById('r-div-net');
  const elRRemaining = document.getElementById('r-remaining');
  const elRLoan = document.getElementById('r-loan');
  const elRInterestCosts = document.getElementById('r-interest-costs');
  const elRSum = document.getElementById('r-sum');
  const elDividendHeader = document.getElementById('div-dividend-header');
  const elStatusHeader = document.getElementById('div-status-header');
  const elRDividendHeader = document.getElementById('r-div-header');
  const elRStatusHeader = document.getElementById('r-status-header');
  const elRemainingPortfolio = document.getElementById('div-remaining-portfolio');
  const elLoanStatus = document.getElementById('div-loan-status');
  const elInterestCosts = document.getElementById('div-interest-costs');
  const elSum = document.getElementById('div-sum');
  if (!elPortfolio && !elExpected && !elEndValue) return; // ikke i riktig fane

  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const years = Math.max(0, Number(AppState.yearsCount || 0));
  // Oppdater selve overskriftslabelen til å vise riktig år (label er første child av parent row)
  if (elDividendHeader && elDividendHeader.parentElement) {
    const label = elDividendHeader.parentElement.firstElementChild;
    if (label) label.textContent = `Utbytte om ${years} år:`;
  }
  if (elStatusHeader && elStatusHeader.parentElement) {
    const label = elStatusHeader.parentElement.firstElementChild;
    if (label) label.textContent = `Status om ${years} år`;
  }
  if (elRDividendHeader && elRDividendHeader.parentElement) {
    const label = elRDividendHeader.parentElement.firstElementChild;
    if (label) label.textContent = "Utbytte i dag:";
  }
  if (elRStatusHeader && elRStatusHeader.parentElement) {
    const label = elRStatusHeader.parentElement.firstElementChild;
    if (label) label.textContent = `Status om ${years} år`;
  }
  // Oppdater etikett for rentekostnader til å inkludere år (label er første child av parent row)
  if (elInterestCosts && elInterestCosts.parentElement) {
    const label = elInterestCosts.parentElement.firstElementChild;
    if (label) label.textContent = `rentekostnader i ${years} år`;
  }
  const elRInterestLabel = document.getElementById('r-interest-costs');
  if (elRInterestLabel && elRInterestLabel.parentElement) {
    const label = elRInterestLabel.parentElement.firstElementChild;
    if (label) label.textContent = `sparte rentekostnader i ${years} år`;
  }
  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  
  // Hent forventet avkastning fra Input-fanen (allerede beregnet med KPI trukket fra)
  const inputExpectedReturn = document.getElementById('expected-return-out');
  let expectedReturnPct = 0;
  if (inputExpectedReturn) {
    const expectedText = inputExpectedReturn.textContent.trim().replace(',', '.').replace('%', '');
    expectedReturnPct = parseFloat(expectedText) || 0;
  } else {
    // Fallback: beregn selv
    const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
    const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
    const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
    const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
    const equitySharePct = typeof AppState.stockSharePercent === 'number' ? AppState.stockSharePercent : 65;
    const equityShare = equitySharePct / 100;
    const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
    expectedReturnPct = grossExpected - fee - kpi;
  }

  // Beholde portefølje = porteføljestørrelse
  if (elPortfolio) elPortfolio.textContent = formatNOK(Math.round(portfolio));
  // Høyre: Beholde portefølje skal være 0
  if (elRPortfolio) elRPortfolio.textContent = formatNOK(0);
  
  // Forventet avkastning = fra Input-fanen
  if (elExpected) elExpected.textContent = `${expectedReturnPct.toFixed(2).replace('.', ',')} %`;
  if (elRExpected) elRExpected.textContent = `${expectedReturnPct.toFixed(2).replace('.', ',')} %`;
  
  // Verdi ved periodens slutt = porteføljestørrelse × (1 + forventet avkastning)^antall år
  const r = expectedReturnPct / 100;
  const endValue = portfolio * Math.pow(1 + r, years);
  if (elEndValue) elEndValue.textContent = formatNOK(Math.round(endValue));
  // Høyre: Verdi ved periodens slutt skal være 0
  if (elREndValue) elREndValue.textContent = formatNOK(0);
  
  // Utbytte = porteføljestørrelse
  if (elDividend) elDividend.textContent = formatNOK(Math.round(portfolio));
  if (elRDiv) elRDiv.textContent = formatNOK(Math.round(portfolio));
  
  // Utbytteskatt = porteføljestørrelse × 0.3784
  const dividendTax = portfolio * 0.3784;
  if (elDividendTax) elDividendTax.textContent = formatNOK(Math.round(dividendTax));
  if (elRDivTax) elRDivTax.textContent = formatNOK(Math.round(dividendTax));
  
  // Netto = Utbytte - Utbytteskatt
  const dividendNet = portfolio - dividendTax;
  if (elDividendNet) elDividendNet.textContent = formatNOK(Math.round(dividendNet));
  if (elRDivNet) elRDivNet.textContent = formatNOK(Math.round(dividendNet));
  
  // Restportefølje = Verdi ved periodens slutt - Utbytte
  const remainingPortfolio = endValue - portfolio;
  if (elRemainingPortfolio) elRemainingPortfolio.textContent = formatNOK(Math.round(remainingPortfolio));
  // Høyre panel: Restportefølje skal være 0
  if (elRRemaining) elRRemaining.textContent = formatNOK(0);
  
  // Lån = Netto
  if (elLoanStatus) elLoanStatus.textContent = formatNOK(Math.round(dividendNet));
  // Høyre panel: Lån = Netto fra høyre tabell
  if (elRLoan) elRLoan.textContent = formatNOK(Math.round(dividendNet));
  
  // rentekostnader i x antall år = (Lån × rentekostnader) × antall år
  const interestRate = interestPct / 100;
  // Venstre: rentekostnader basert på lån (dividendNet)
  const interestCostsTotal = (dividendNet * interestRate) * years;
  if (elInterestCosts) elInterestCosts.textContent = formatNOK(Math.round(interestCostsTotal));
  // Høyre: rentekostnader basert på lån (dividendNet)
  const rInterestCostsTotal = (dividendNet * interestRate) * years;
  if (elRInterestCosts) elRInterestCosts.textContent = formatNOK(Math.round(rInterestCostsTotal));
  
  // Sum = Restportefølje + Lån - rentekostnader (venstre)
  const sum = remainingPortfolio + dividendNet - interestCostsTotal;
  if (elSum) elSum.textContent = formatNOK(Math.round(sum));
  // Høyre: Sum = Lån + rentekostnader i 10 år
  const rSum = dividendNet + rInterestCostsTotal;
  if (elRSum) elRSum.textContent = formatNOK(Math.round(rSum));
}

// Oppdater høyre kalkulasjonsliste i "Låne for å investere"
function updateInvestLoanRightCalc() {
  const elLoan = document.getElementById('calc2-loan');
  const elRate = document.getElementById('calc2-interest');
  const elEnd = document.getElementById('calc2-endvalue');
  const elAfterTax = document.getElementById('calc2-interestAfterTax');
  const elExcess = document.getElementById('calc2-excess');
  if (!elLoan && !elRate && !elEnd && !elAfterTax) return; // ikke i riktig fane

  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const loan = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const ratePct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  const years = Math.max(0, Number(AppState.yearsCount || 0));

  const r = ratePct / 100;
  const endValue = loan * Math.pow(1 + r, years);
  const afterTax = Math.max(0, endValue - loan) * 0.78;

  if (elLoan) elLoan.textContent = formatNOK(Math.round(loan));
  if (elRate) elRate.textContent = `${ratePct.toFixed(1).replace('.', ',')} %`;
  if (elEnd) elEnd.textContent = formatNOK(Math.round(endValue));
  if (elAfterTax) elAfterTax.textContent = formatNOK(Math.round(afterTax));
  
  // "Avkastning utover lånekostnad" skal vise samme verdi som "Netto avkastning"
  const elNettoAvkastning = document.getElementById('calc-net');
  if (elExcess && elNettoAvkastning) {
    // Hent verdien direkte fra "Netto avkastning"-feltet (den er alltid oppdatert først)
    elExcess.textContent = elNettoAvkastning.textContent.trim();
  }
}

function updateTopSummaries() {
  // Oppdater titler på toppkortene (gjelder alle faner)
  const tAssets = document.querySelector('.summary-assets .summary-title'); if (tAssets) tAssets.textContent = 'Porteføljestørrelse';
  const tDebts = document.querySelector('.summary-debts .summary-title'); if (tDebts) tDebts.textContent = 'Aksjeandel';
  const tEquity = document.querySelector('.summary-equity .summary-title'); if (tEquity) tEquity.textContent = 'Forventet avkastning';
  const tCash = document.querySelector('.summary-cash .summary-title'); if (tCash) tCash.textContent = 'Antall år';

  // Porteføljestørrelse (NOK)
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? AppState.portfolioSize : sumAssets;
  const el = document.getElementById('sum-assets');
  if (el) el.textContent = formatNOK(portfolio);

  // Aksjeandel (%)
  let stockPct = typeof AppState.stockSharePercent === 'number' ? AppState.stockSharePercent : 0;
  if (stockPct <= 0 && AppState.stockShareOption) {
    const m = String(AppState.stockShareOption).match(/(\d+)%/); stockPct = m ? Number(m[1]) : 0;
    if (/Renter/i.test(String(AppState.stockShareOption))) stockPct = 0;
  }
  const elD = document.getElementById('sum-debts');
  if (elD) elD.textContent = `${stockPct.toFixed(0).replace('.', ',')} %`;

  // Forventet avkastning (%)
  const exp = typeof AppState.expectedReturnPct === 'number' ? AppState.expectedReturnPct : 0;
  const elE = document.getElementById('sum-equity');
  if (elE) elE.textContent = `${exp.toFixed(2).replace('.', ',')} %`;

  // Antall år
  const years = typeof AppState.yearsCount === 'number' ? AppState.yearsCount : 0;
  const elC = document.getElementById('sum-cashflow');
  if (elC) elC.textContent = `${years} år`;

  // Oppdater kalkulasjon (hvis aktuell fane)
  try { updateInvestLoanCalc(); } catch (_) {}
  try { updateInvestLoanRightCalc(); } catch (_) {}
  try { updateDividendLoanCalc(); } catch (_) {}

  // Oppdater «Flytte fondskonto»-kortene dersom de finnes i DOM
  try {
    const elLeftCap = document.getElementById("fk-left-capital");
    const elRightCap = document.getElementById("fk-right-capital");
    if (elLeftCap || elRightCap) {
      const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
      let portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
      const portfolioSlider = document.getElementById('input-portfolio-slider');
      if (portfolioSlider && portfolioSlider.value) {
        const v = Number(portfolioSlider.value);
        if (isFinite(v)) portfolio = v;
      }

      let capital = 0;
      const capitalSliderEl = document.getElementById('input-capital-slider');
      if (capitalSliderEl && capitalSliderEl.value) {
        const v = Number(capitalSliderEl.value);
        if (isFinite(v)) capital = v;
      } else if (isFinite(AppState.inputCapital)) {
        capital = Number(AppState.inputCapital);
      }

      const gain = Math.max(0, Math.round(portfolio - capital));
      const taxLeft = Math.round(gain * 0.378);

      const elLP = document.getElementById("fk-left-portfolio");
      const elLG = document.getElementById("fk-left-gain");
      const elLT = document.getElementById("fk-left-tax");
      const elLNet = document.getElementById("fk-left-net");
      const elRP = document.getElementById("fk-right-portfolio");
      const elRG = document.getElementById("fk-right-gain");
      const elRT = document.getElementById("fk-right-tax");
      const elRNet = document.getElementById("fk-right-net");

      if (elLP) elLP.textContent = formatNOK(Math.round(portfolio));
        if (elRP) elRP.textContent = formatNOK(Math.round(portfolio));
      if (elLeftCap) elLeftCap.textContent = formatNOK(capital);
      if (elRightCap) elRightCap.textContent = formatNOK(capital);
      if (elLG) elLG.textContent = formatNOK(gain);
      if (elRG) elRG.textContent = formatNOK(gain);
      if (elLT) { elLT.textContent = formatNOK(taxLeft); elLT.style.color = "#D32F2F"; }
      if (elLNet) elLNet.textContent = formatNOK(Math.max(0, Math.round(portfolio - taxLeft)));
        if (elNRNow) elNRNow.textContent = formatNOK(Math.round(portfolio));

      // Høyre skatt avhenger av aksje-/renteandel
      if (elRT || elRNet) {
        let equitySharePctR = 65;
        if (typeof AppState.stockSharePercent === 'number') equitySharePctR = AppState.stockSharePercent;
        else if (AppState.stockShareOption) {
          const m = String(AppState.stockShareOption).match(/(\d+)%/);
          if (m) equitySharePctR = Number(m[1]);
        }
        const equityShareR = Math.max(0, Math.min(1, equitySharePctR / 100));
        const interestShareR = 1 - equityShareR;
        const rateRight = equityShareR * 0.378 + interestShareR * 0.22;
        const taxRight = Math.round(gain * rateRight);
        if (elRT) { elRT.textContent = formatNOK(taxRight); elRT.style.color = "#D32F2F"; }
        // På høyre side (øverste blokk) skal "Netto portefølje" vise Porteføljestørrelse
        if (elNRNow) elNRNow.textContent = formatNOK(Math.round(portfolio));
      }
      
      // Oppdater label-tekstene med dynamisk antall år
      const yearsForLabels = typeof AppState.yearsCount === 'number' ? AppState.yearsCount : 0;
      const elLeftFutureLabel = document.getElementById('fk-left-future-label');
      if (elLeftFutureLabel) elLeftFutureLabel.textContent = `Verdi portefølje om ${yearsForLabels} år:`;
      const elLeftGainFutureLabel = document.getElementById('fk-left-gain-future-label');
      if (elLeftGainFutureLabel) elLeftGainFutureLabel.textContent = `Gevinst om ${yearsForLabels} år`;
      const elRightFutureLabel = document.getElementById('fk-right-future-label');
      if (elRightFutureLabel) elRightFutureLabel.textContent = `Verdi portefølje om ${yearsForLabels} år:`;
      const elRightGainFutureLabel = document.getElementById('fk-right-gain-future-label');
      if (elRightGainFutureLabel) elRightGainFutureLabel.textContent = `Gevinst om ${yearsForLabels} år`;
    }
  } catch (_) {}
}



// --- Output modal, copy, and generation ---
function initOutputUI() {
  const fab = document.getElementById("output-fab");
  const modal = document.getElementById("output-modal");
  const textArea = document.getElementById("output-text");
  const copyBtn = document.getElementById("copy-output");

  if (!fab || !modal || !textArea || !copyBtn) return;

  function openModal() {
    // Generate fresh output every time
    try {
      textArea.value = generateOutputText();
    } catch (e) {
      textArea.value = `Kunne ikke generere output.\n${String(e && e.message || e)}`;
    }
    modal.removeAttribute("hidden");
    // Focus for accessibility
    setTimeout(() => { textArea.focus(); textArea.select(); }, 0);
    document.addEventListener("keydown", onKeyDown);
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
    }
  }

  fab.addEventListener("click", openModal);
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeModal();
    }
  });

  copyBtn.addEventListener("click", async () => {
    const reset = () => {
      copyBtn.classList.remove("is-success");
      const icon = copyBtn.querySelector(".copy-icon");
      const label = copyBtn.querySelector(".copy-label");
      if (icon) icon.textContent = "📋";
      if (label) label.textContent = "Kopier";
    };

    try {
      const txt = textArea.value || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(txt);
      } else {
        // Fallback method
        textArea.focus();
        textArea.select();
        const ok = document.execCommand && document.execCommand("copy");
        if (!ok) throw new Error("Clipboard API ikke tilgjengelig");
      }
      copyBtn.classList.add("is-success");
      const icon = copyBtn.querySelector(".copy-icon");
      const label = copyBtn.querySelector(".copy-label");
      if (icon) icon.textContent = "✔"; // hake-ikon
      if (label) label.textContent = "Kopiert!";
      setTimeout(reset, 2000);
    } catch (err) {
      // Error state visual
      const label = copyBtn.querySelector(".copy-label");
      if (label) label.textContent = "Feil ved kopiering";
      setTimeout(() => { const l = copyBtn.querySelector(".copy-label"); if (l) l.textContent = "Kopier"; }, 2000);
      console.error("Kopiering feilet:", err);
    }
  });
}

function generateOutputText() {
  // Samle alle inn- og ut-data med norsk formatering
  const nf = new Intl.NumberFormat("nb-NO");
  const nok = (v) => new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(v || 0);
  const nokSigned = (v) => new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(v);

  // Inputs (skann AppState)
  const assets = (AppState.assets || []).map((a) => `- ${a.name}: ${nok(a.amount)}`).join("\n");
  const debts = (AppState.debts || []).map((d) => `- ${d.name}: ${nok(d.amount)}`).join("\n");
  const incomes = (AppState.incomes || []).map((i) => `- ${i.name}: ${nok(i.amount)}`).join("\n");
  const debtParams = `- Lånetype: ${AppState.debtParams.type}\n- Lånetid: ${nf.format(AppState.debtParams.years)} år\n- Rente: ${(AppState.debtParams.rate*100).toFixed(1).replace('.', ',')} %`;
  const exp = AppState.expectations || { likvider: 0, fastEiendom: 0, investeringer: 0, andreEiendeler: 0 };
  const expectations = [
    `- LIKVIDER: ${nf.format(exp.likvider)} %`,
    `- FAST EIENDOM: ${nf.format(exp.fastEiendom)} %`,
    `- INVESTERINGER: ${nf.format(exp.investeringer)} %`,
    `- ANDRE EIENDELER: ${nf.format(exp.andreEiendeler)} %`
  ].join("\n");

  // Results (sanntid)
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const sumDebts = (AppState.debts || []).reduce((s, x) => s + (x.amount || 0), 0);
  const equity = sumAssets - sumDebts;

  const incomeItems = AppState.incomes || [];
  const upper = (s) => String(s || "").toUpperCase();
  const annualCosts = incomeItems.filter((x) => /SKATT|KOSTNAD/.test(upper(x.name))).reduce((s, x) => s + (x.amount || 0), 0);
  const totalIncome = incomeItems.filter((x) => !/SKATT|KOSTNAD/.test(upper(x.name))).reduce((s, x) => s + (x.amount || 0), 0);
  const r = AppState.debtParams.rate;
  const n = Math.max(1, AppState.debtParams.years);
  let annualDebtPayment = 0;
  if (AppState.debtParams.type === "Annuitetslån") {
    if (r === 0) annualDebtPayment = sumDebts / n;
    else annualDebtPayment = sumDebts * (r / (1 - Math.pow(1 + r, -n)));
  } else if (AppState.debtParams.type === "Serielån") {
    annualDebtPayment = sumDebts / n + (sumDebts * r) / 2;
  } else { // Avdragsfrihet
    annualDebtPayment = sumDebts * r;
  }
  const cashflow = Math.round(totalIncome - annualCosts - annualDebtPayment);

  // Waterfall-detaljer (inntekter og kostnader eksplisitt)
  const wage = incomeItems.filter(x => /L[ØO]NN/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
  const dividends = incomeItems.filter(x => /UTBYT/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
  const otherIncome = incomeItems.filter(x => /ANDRE/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
  const annualTax = incomeItems.filter(x => /SKATT/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
  const annualCostsOnly = incomeItems.filter(x => /KOSTNAD/.test(upper(x.name))).reduce((s,x)=> s + (x.amount || 0), 0);
  const totalDebt = sumDebts;
  const interestCost = totalDebt * r;
  let annualPaymentWF = 0;
  if (AppState.debtParams.type === "Serielån") annualPaymentWF = totalDebt / n + (totalDebt * r) / 2;
  else if (AppState.debtParams.type === "Annuitetslån") annualPaymentWF = r === 0 ? totalDebt / n : totalDebt * (r / (1 - Math.pow(1 + r, -n)));
  else annualPaymentWF = totalDebt * r; // Avdragsfrihet
  const principalCost = Math.max(0, annualPaymentWF - interestCost);

  // TBE-indikatorer
  const equityPct = sumAssets > 0 ? (equity / sumAssets) * 100 : 0;
  const debtToIncome = totalIncome > 0 ? sumDebts / totalIncome : 0;
  const disposableCashflow = totalIncome - annualCosts; // før renter/avdrag
  const cashToDebt = sumDebts > 0 ? disposableCashflow / sumDebts : 0;
  const scoreDebtToIncome = (v) => v < 3.0 ? "HØY" : v <= 5.0 ? "MIDDELS" : "LAV";
  const scoreEquityPct = (v) => v >= 35 ? "HØY" : v >= 20 ? "MIDDELS" : "LAV";
  const scoreCashToDebt = (v) => v >= 0.25 ? "HØY" : v >= 0.10 ? "MIDDELS" : "LAV";
  const s1 = scoreDebtToIncome(debtToIncome);
  const s2 = scoreEquityPct(equityPct);
  const s3 = scoreCashToDebt(cashToDebt);
  const greenCount = [s1,s2,s3].filter(x => x === "HØY").length;
  const overallTBE = greenCount === 3 ? "HØY" : greenCount === 2 ? "MIDDELS" : "LAV";

  // Strukturert tekst
  const lines = [];
  lines.push("=== INPUT ===");
  lines.push("Eiendeler:");
  lines.push(assets || "- (ingen)");
  lines.push("");
  lines.push("Gjeld:");
  lines.push(debts || "- (ingen)");
  lines.push("");
  lines.push("Inntekter og kostnader:");
  lines.push(incomes || "- (ingen)");
  lines.push("");
  lines.push("Låneparametre:");
  lines.push(debtParams);
  lines.push("");
  lines.push("Forventninger (% p.a.):");
  lines.push(expectations);
  lines.push("");
  lines.push("=== RESULTATER (sanntid) ===");
  lines.push(`Sum eiendeler: ${nok(sumAssets)}`);
  lines.push(`Sum gjeld: ${nok(sumDebts)}`);
  lines.push(`Egenkapital: ${nok(equity)}`);
  lines.push(`Årlig kontantstrøm: ${nok(cashflow)}`);

  // Waterfall-detaljer
  lines.push("");
  lines.push("=== KONTANTSTRØM (detaljer) ===");
  if (wage > 0) lines.push(`Lønnsinntekt: ${nok(wage)}`);
  if (dividends > 0) lines.push(`Utbytter: ${nok(dividends)}`);
  if (otherIncome > 0) lines.push(`Andre inntekter: ${nok(otherIncome)}`);
  if (annualTax > 0) lines.push(`Årlig skatt: ${nokSigned(-annualTax)}`);
  if (annualCostsOnly > 0) lines.push(`Årlige kostnader: ${nokSigned(-annualCostsOnly)}`);
  if (interestCost > 0) lines.push(`Rentekostnader: ${nokSigned(-Math.round(interestCost))}`);
  if (principalCost > 0) lines.push(`Avdrag: ${nokSigned(-Math.round(principalCost))}`);
  lines.push(`Netto kontantstrøm: ${nokSigned(Math.round(cashflow))}`);

  // TBE-oversikt
  lines.push("");
  lines.push("=== TBE (indikatorer) ===");
  lines.push(`Gjeld/inntekter: ${debtToIncome.toFixed(2)}x · ${s1}`);
  lines.push(`Egenkapitalandel: ${equityPct.toFixed(1).replace('.', ',')} % · ${s2}`);
  lines.push(`Kontantstrøm/gjeld: ${cashToDebt.toFixed(2)}x · ${s3}`);
  lines.push(`Samlet TBE: ${overallTBE}`);

  return lines.join("\n");
}


