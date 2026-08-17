// Global app state
let __nextId = 1;
function genId() { return __nextId++; }

const AppState = {
  assets: [
    { id: genId(), name: "LIKVIDER", amount: 2000000, locked: true },
    { id: genId(), name: "FAST EIENDOM", amount: 15000000, locked: true },
    { id: genId(), name: "INVESTERINGER", amount: 8000000, locked: true }
  ],
  repaymentProfileYears: 20,
  /** Utbetale utbytte: ta med skattefradrag renter (Input Ja/Nei), standard Ja */
  interestTaxDeductionOnLoan: true,
  /** Realisasjon skatt 2026 — venstre kolonne, uavhengig av Input */
  realisationRedeemAmount: 2000000,
  realisationGain: 800000,
  realisationTax: 302720
};

document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");
  const sectionTitle = document.getElementById("sectionTitle");
  const moduleRoot = document.getElementById("module-root");
  const stepperList = document.getElementById("stepper-list");
  // Input UI
  initInputUI();
  
  // Output UI
  initOutputUI();

  
  // Disclaimer modal init
  initDisclaimerUI();
  
  // Fullscreen button init
  initFullscreen();
  
  // Chart modal init
  initChartUI();
  initVisGrafiskUI();
  
  // Dividend chart modal init
  initDividendChartUI();
  initTaxRateChangeChartUI();
  
  // Equity share chart modal init
  initEquityShareChartUI();
  
  // Interest cost chart modal init
  initInterestCostChartUI();

  // Bygg stepper
  const allSteps = [
    { key: "Forside" },
    { key: "Input" },
    { key: "Nedbetale lån" },
    { key: "Utbetale utbytte" },
    { key: "Innløse Fondskonto" },
    { key: "Realisasjon skatt 2026" }
  ];
  const steps = allSteps.filter(s => s.key !== "Forside");
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
      if (currentIndex < 0) currentIndex = 0;
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
      updateTopSummaries();
    });
  });

  // Last inn startvisning (plassholder)
  if (moduleRoot) {
    renderPlaceholder(moduleRoot);
  }
  // Oppdater summer i topp-boksene
  updateTopSummaries();
  // Init stepper
  renderStepper("Forside");
});


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
    const newValue = String(AppState.expKpi ?? 2.0);
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

  // Oppdater avdragsprofil-slider
  const repaymentSlider = document.getElementById('repayment-profile-slider');
  if (repaymentSlider) {
    const repaymentValue = AppState.repaymentProfileYears || 20;
    if (Number(repaymentSlider.value) !== repaymentValue) {
      repaymentSlider.value = String(repaymentValue);
      repaymentSlider.dispatchEvent(new Event('input'));
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
  
  // Oppdater custom rådgivningshonorar input felt
  const feesWrap = moduleRoot.querySelector('.fees-wrap');
  if (feesWrap) {
    const firstInput = feesWrap.querySelector('input[type="text"][inputMode="decimal"]');
    if (firstInput) {
      const savedFee = AppState.advisoryFeePct !== undefined ? AppState.advisoryFeePct : 0.0;
      const currentValue = parseFloat(firstInput.value.replace(',', '.')) || 0;
      if (Math.abs(currentValue - savedFee) > 0.01) {
        firstInput.value = savedFee.toFixed(2).replace('.', ',');
      }
    }
  }

  // Oppdater tekstfelt for skatt (Utbytteskatt, Kapitalskatt og Skatt fondskonto første år)
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
      } else if (labelText.includes('Skatt fondskonto første år') && AppState.fundTaxFirstYearPct !== undefined) {
        const currentValue = parseFloat(input.value.replace(',', '.')) || 0;
        const savedValue = AppState.fundTaxFirstYearPct;
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

  // Scoper CSS for bedre visuell balanse kun på Input-fanen
  if (root && root.classList) root.classList.toggle("input-tab", title === "Input");
  const contentEl = document.querySelector("main.content");
  if (contentEl) {
    const hideTopSummaries = title === "Input" || title === "Forside";
    contentEl.classList.toggle("hide-top-summaries", hideTopSummaries);
  }
  
  // For Forside-fanen: vis 6 fliser med knapp
  if (title === "Forside") {
    // Sett defaultverdier tilsvarende Input-fanen hvis de ikke allerede er satt
    if (AppState.portfolioSize === undefined) AppState.portfolioSize = 10000000;
    if (AppState.yearsCount === undefined) AppState.yearsCount = 10;
    if (AppState.stockSharePercent === undefined) AppState.stockSharePercent = 65;
    if (AppState.stockShareOption === undefined) AppState.stockShareOption = "65% Aksjer";
    if (AppState.expEquity === undefined) AppState.expEquity = 8.0;
    if (AppState.expBonds === undefined) AppState.expBonds = 5.0;
    if (AppState.expKpi === undefined) AppState.expKpi = 2.0;
    if (AppState.advisoryFeePct === undefined) AppState.advisoryFeePct = 0.0;
    if (AppState.interestCostPct === undefined) AppState.interestCostPct = 5.0;
    if (AppState.shieldRatePct === undefined) AppState.shieldRatePct = 3.9;
    if (AppState.capitalTaxPct === undefined) AppState.capitalTaxPct = 22.0;
    if (AppState.stockTaxPct === undefined) AppState.stockTaxPct = 37.84;
    if (AppState.inputCapital === undefined) AppState.inputCapital = 5000000;
    if (AppState.repaymentProfileYears === undefined) AppState.repaymentProfileYears = 20;
    if (AppState.interestTaxDeductionOnLoan === undefined) AppState.interestTaxDeductionOnLoan = true;
    
    // Beregn og sett forventet avkastning basert på defaultverdier
    const expEquity = AppState.expEquity || 8.0;
    const expBonds = AppState.expBonds || 5.0;
    const fee = AppState.advisoryFeePct || 0.0;
    const kpi = AppState.expKpi ?? 2.0;
    const equitySharePct = AppState.stockSharePercent || 65;
    const equityShare = equitySharePct / 100;
    const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
    const expectedReturnPct = grossExpected - fee - kpi;
    AppState.expectedReturnPct = expectedReturnPct;
    
    root.innerHTML = "";

    const page = document.createElement("div");
    page.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
      max-width: none;
      margin: 0;
      box-sizing: border-box;
    `;

    const tilesContainer = document.createElement("div");
    tilesContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
      width: 100%;
    `;

    const tiles = [
      {
        id: "tile-assets",
        icon: "slider-alt",
        title: "Input",
        description: "Porteføljestørrelse, aksjeandel, innskutt kapital, skatt og forventet avkastning",
        section: "Input",
        action: "Gå til input"
      },
      {
        id: "tile-income",
        icon: "credit-card",
        title: "Nedbetale lån",
        description: "Lønner det seg å nedbetale lån eller beholde eksisterende lån",
        section: "Nedbetale lån",
        action: "Se detaljer"
      },
      {
        id: "tile-debt",
        icon: "dollar-circle",
        title: "Utbetale utbytte",
        description: "Hva koster et utbytte i lys av skatt, alternativ avkastning og rentes rente-effekten",
        section: "Utbetale utbytte",
        action: "Se detaljer"
      },
      {
        id: "tile-cashflow",
        icon: "transfer-alt",
        title: "Innløse Fondskonto",
        description: "Flytte en fondskonto over til en ASK, eller beholde den som den er",
        section: "Innløse Fondskonto",
        action: "Se detaljer"
      },
      {
        id: "tile-realisation",
        icon: "receipt",
        title: "Realisasjon skatt 2026",
        description: "Hvordan vil skatteregningen knyttet til porteføljeendringen i 2026 påvirke din portefølje i en gitt periode",
        section: "Realisasjon skatt 2026",
        action: "Se detaljer"
      }
    ];

    tiles.forEach((tile) => {
      const card = document.createElement("article");
      card.id = tile.id;
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.style.cssText = `
        background: var(--white);
        border: 1px solid var(--gray-300);
        border-radius: var(--radius-lg);
        overflow: hidden;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        box-shadow: var(--shadow-sm);
        transition: box-shadow 0.15s ease, border-color 0.15s ease;
      `;

      const goToSection = () => {
        const target = (tile.section || "").trim();
        const navItem = Array.from(document.querySelectorAll(".nav-item")).find(
          (btn) => (btn.getAttribute("data-section") || "").trim() === target
        );
        if (navItem) navItem.click();
      };
      card.addEventListener("click", goToSection);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToSection();
        }
      });

      // Soft brand media band (flat — no gradient)
      const media = document.createElement("div");
      media.style.cssText = `
        height: 88px;
        background: var(--blue-50);
        border-bottom: 1px solid var(--blue-200);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        box-sizing: border-box;
      `;
      const iconWrap = document.createElement("span");
      iconWrap.setAttribute("aria-hidden", "true");
      iconWrap.style.cssText = `
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--white);
        border: 1px solid var(--blue-200);
        color: var(--blue-main);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
      `;
      iconWrap.innerHTML = `<i class="bx bx-${tile.icon}"></i>`;
      media.appendChild(iconWrap);

      const body = document.createElement("div");
      body.style.cssText = `
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 8px;
        box-sizing: border-box;
      `;

      const title = document.createElement("h3");
      title.textContent = tile.title;
      title.style.cssText = `
        margin: 0;
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3;
        color: var(--sp-navy);
      `;

      const desc = document.createElement("p");
      desc.textContent = tile.description;
      desc.style.cssText = `
        margin: 0;
        font-family: var(--font-sans);
        font-size: 14px;
        line-height: 1.5;
        color: var(--gray-600);
        flex: 1;
      `;

      const cta = document.createElement("div");
      cta.className = "forside-tile-link";
      cta.style.cssText = `
        margin-top: 16px;
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 36px;
        padding: 0 14px;
        border-radius: var(--radius-md);
        border: 1px solid var(--gray-300);
        background: var(--white);
        color: var(--sp-navy);
        font-family: var(--font-sans);
        font-size: 14px;
        font-weight: 600;
        transition: background-color 0.15s ease, border-color 0.15s ease;
        box-shadow: var(--shadow-sm);
      `;
      cta.innerHTML = `${tile.action} <i class="bx bx-right-arrow-alt" aria-hidden="true" style="font-size:18px;color:var(--blue-main)"></i>`;

      card.addEventListener("mouseenter", () => {
        card.style.boxShadow = "var(--shadow-lg)";
        card.style.borderColor = "var(--gray-300)";
        cta.style.background = "var(--gray-50)";
        cta.style.borderColor = "var(--gray-300)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.boxShadow = "var(--shadow-sm)";
        card.style.borderColor = "var(--gray-300)";
        cta.style.background = "var(--white)";
        cta.style.borderColor = "var(--gray-300)";
      });

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(cta);
      card.appendChild(media);
      card.appendChild(body);
      tilesContainer.appendChild(card);
    });

    page.appendChild(tilesContainer);
    root.appendChild(page);

    return;
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
  // Faner som skal ha to stående paneler som i "Nedbetale lån"
  const twoPanelTabs = new Set(["Nedbetale lån", "Utbetale utbytte", "Innløse Fondskonto", "Realisasjon skatt 2026"]);
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

    // Tom fullbredde-container under de to panelene
    let bottom = null;
    if (title === "Nedbetale lån" || title === "Utbetale utbytte" || title === "Innløse Fondskonto" || title === "Realisasjon skatt 2026") {
      container.style.gridAutoRows = "auto";
      bottom = makePanel();
      bottom.innerHTML = "";
      bottom.style.gridColumn = "1 / -1";
      bottom.style.margin = "0";
      bottom.style.minHeight = "0";
      bottom.style.display = "flex";
      bottom.style.alignItems = "center";
      bottom.style.justifyContent = "center";
      bottom.style.padding = "1rem 1.25rem";
      bottom.style.overflow = "hidden";
      bottom.style.minWidth = "0";
      bottom.style.boxSizing = "border-box";
      container.appendChild(bottom);
    }

    // Innløse Fondskonto / Realisasjon skatt 2026: to kolonner med perfekt linje-justering
    if (title === "Innløse Fondskonto" || title === "Realisasjon skatt 2026") {
      [left, right].forEach(col => {
        col.innerHTML = "";
        col.style.display = "grid";
        col.style.gridAutoRows = "minmax(1.2rem, auto)"; // Redusert linjehøyde
        col.style.rowGap = "0.25rem"; // Redusert gap
        col.style.alignContent = "start";
        col.style.overflowY = "hidden";
        col.style.overflowX = "hidden";
        col.style.padding = "0.5rem";
      });

      function makeRow(text, opts = {}) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.lineHeight = "1.3";
        row.style.fontSize = "0.75rem";
        row.style.fontFamily = 'var(--font-sans)';
        const label = document.createElement("span");
        label.textContent = opts.placeholder ? "" : text;
        if (opts.labelId) label.id = opts.labelId;
        label.style.fontFamily = 'var(--font-sans)';
        label.style.lineHeight = "1.3";
        if (opts.bold) {
          label.style.fontWeight = "700";
          label.style.fontSize = "0.875rem";
        } else {
          label.style.fontWeight = "400";
          label.style.fontSize = "0.75rem";
        }
        if (opts.red) {
          label.style.color = "var(--error-600)";
          label.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
        }
        const value = document.createElement("span");
        value.textContent = opts.placeholder ? "" : "";
        if (opts.id) value.id = opts.id;
        value.style.fontFamily = 'var(--font-sans)';
        value.style.lineHeight = "1.3";
        value.style.minWidth = "6rem";
        value.style.textAlign = "right";
        if (opts.bold) {
          value.style.fontWeight = "700";
          value.style.fontSize = "0.875rem";
        } else {
          value.style.fontWeight = "400";
          value.style.fontSize = "0.75rem";
        }
        if (opts.red) {
          value.style.color = "var(--error-600)";
          value.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
        }
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

      const isRealisationTab = title === "Realisasjon skatt 2026";
      const leftHeading = isRealisationTab ? "Gjennomføre endring" : "Flytte fondskonto:";
      const rightHeading = isRealisationTab ? "Ikke gjennomføre endring" : "Ikke flytte Fondskonto:";
      const capitalLabel = isRealisationTab ? "Andel av portefølje som skal innløses" : "Innskutt kapital";

      // Venstre kolonne
      left.appendChild(makeRow(leftHeading, { bold: true }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Portefølje", { id: "fk-left-portfolio" }));
      left.appendChild(makeRow(capitalLabel, { id: "fk-left-capital" }));
      left.appendChild(makeRow("Gevinst", { id: "fk-left-gain" }));
      left.appendChild(makeRow("Skatt", { red: true, id: "fk-left-tax" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Netto portefølje", { bold: true, id: "fk-left-net" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow(`Verdi portefølje om ${AppState.yearsCount || 0} år:`, { id: "fk-left-future", labelId: "fk-left-future-label" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow(`Gevinst om ${AppState.yearsCount || 0} år`, { id: "fk-left-gain-future", labelId: "fk-left-gain-future-label" }));
      if (!isRealisationTab) {
        left.appendChild(makeRow("Skjermingsgrunnlag", { id: "fk-left-shield" }));
        left.appendChild(makeRow("Avkastning utover skjerming", { id: "fk-left-excess" }));
      }
      left.appendChild(makeRow("Skatt", { red: true, id: "fk-left-tax-future" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Netto portefølje", { bold: true, id: "fk-left-net-future" }));

      // Høyre kolonne
      right.appendChild(makeRow(rightHeading, { bold: true }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow("Portefølje", { id: "fk-right-portfolio" }));
      right.appendChild(makeRow(capitalLabel, { id: "fk-right-capital" }));
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
      if (!isRealisationTab) {
        right.appendChild(makeRow("Skjermingsgrunnlag", { id: "fk-right-shield" }));
        right.appendChild(makeRow("Avkastning utover skjerming", { id: "fk-right-excess" }));
      }
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
        // Innskutt kapital hentes fra Input-fanen (slider) eller AppState — brukes på høyre side
        let capital = 0;
        const capitalSliderEl = document.getElementById('input-capital-slider');
        if (capitalSliderEl && capitalSliderEl.value) {
          const v = Number(capitalSliderEl.value);
          if (isFinite(v)) capital = v;
        } else if (isFinite(AppState.inputCapital)) {
          capital = Number(AppState.inputCapital);
        }
        const gain = Math.max(0, Math.round(portfolio - capital)); // Gevinst = Portefølje − Innskutt kapital
        // Beregn skatt for venstre side: Gevinst × Skatt fondskonto første år (%)
        const fundTaxFirstYearPct = AppState.fundTaxFirstYearPct || 37.84;
        const taxRateLeft = fundTaxFirstYearPct / 100; // Konverter prosent til desimal
        const tax = Math.round(gain * taxRateLeft);
        let capitalLeft = capital;
        let gainLeft = gain;
        let taxLeft = tax;
        if (isRealisationTab) {
          capitalLeft = Number.isFinite(Number(AppState.realisationRedeemAmount)) ? Number(AppState.realisationRedeemAmount) : 2000000;
          gainLeft = Number.isFinite(Number(AppState.realisationGain)) ? Number(AppState.realisationGain) : 800000;
          taxLeft = Number.isFinite(Number(AppState.realisationTax)) ? Number(AppState.realisationTax) : 302720;
        }
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
        const elShieldRight = document.getElementById("fk-right-shield");
        const elExcessRight = document.getElementById("fk-right-excess");
        const elTR = document.getElementById("fk-right-tax");
        if (elP) elP.textContent = formatNOK(Math.round(portfolio));
        if (elPR) elPR.textContent = formatNOK(Math.round(portfolio));
        if (elC) elC.textContent = formatNOK(capitalLeft);
        if (elCR) elCR.textContent = formatNOK(isRealisationTab ? capitalLeft : capital);
        if (elG) elG.textContent = formatNOK(gainLeft);
        if (elGR) elGR.textContent = formatNOK(isRealisationTab ? gainLeft : gain);
        if (elT) { 
          elT.textContent = formatNOK(taxLeft); 
          elT.style.color = "var(--error-600)"; 
          elT.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
        }

        // Netto portefølje = Portefølje - Skatt
        const net = Math.max(0, Math.round(portfolio - taxLeft));
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
        if (isRealisationTab) {
          expectedReturnPct = getSummaryExpectedReturnPct();
          years = getSummaryYears();
        }
        const r = expectedReturnPct / 100;
        const future = Math.round(net * Math.pow(1 + r, years));
        if (elFuture) elFuture.textContent = formatNOK(future);

        // Høyre: Verdi om x år = netto portefølje nå × (1 + r)^år
        const netNowRight = portfolio;
        const futureRight = Math.round(netNowRight * Math.pow(1 + r, years));
        if (elFR) elFR.textContent = formatNOK(futureRight);
        // Høyre: Gevinst om x år
        const gainNowRight = isRealisationTab ? gainLeft : gain;
        const gainRight = isRealisationTab
          ? Math.max(0, Math.round(gainNowRight + (futureRight - netNowRight)))
          : Math.max(0, futureRight - capital);
        if (elGFR) elGFR.textContent = formatNOK(gainRight);
        
        // Høyre: Skjermingsgrunnlag = (Innskuttkapital × aksjeandel) × ((1 + skjermingsrente)^antall år) - (innskuttkapital × aksjeandel)
        let equitySharePctR = 65;
        if (typeof AppState.stockSharePercent === 'number') equitySharePctR = AppState.stockSharePercent;
        else if (AppState.stockShareOption) {
          const m = String(AppState.stockShareOption).match(/(\d+)%/);
          if (m) equitySharePctR = Number(m[1]);
        }
        let shieldRateR = 0;
        const shieldSliderR = document.getElementById('shield-rate-slider');
        if (shieldSliderR && shieldSliderR.value) shieldRateR = Number(shieldSliderR.value);
        else if (isFinite(AppState.shieldRatePct)) shieldRateR = Number(AppState.shieldRatePct);
        const capitalAksjeandel = capital * (equitySharePctR / 100);
        const shieldBaseRight = Math.round((capitalAksjeandel * Math.pow(1 + shieldRateR / 100, years)) - capitalAksjeandel);
        if (elShieldRight) elShieldRight.textContent = formatNOK(shieldBaseRight);
        
        // Høyre: Avkastning utover skjerming = Gevinst om x år - Skjermingsgrunnlag
        const excessRight = Math.max(0, gainRight - shieldBaseRight);
        if (elExcessRight) elExcessRight.textContent = formatNOK(excessRight);
        
        // Høyre: Skatt
        if (elTR) {
          let taxRight;
          if (isRealisationTab) {
            taxRight = Math.round(gainRight * 0.3784);
          } else {
            const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
            const capitalTaxRate = (AppState.capitalTaxPct || 22.00) / 100;
            const equityShareR = Math.max(0, Math.min(1, equitySharePctR / 100));
            const interestShareR = 1 - equityShareR;
            const rateRight = equitySharePctR > 80 ? stockTaxRate : (equityShareR * stockTaxRate + interestShareR * capitalTaxRate);
            taxRight = Math.round(excessRight * rateRight);
          }
          elTR.textContent = formatNOK(taxRight);
          elTR.style.color = "var(--error-600)";
          if (elNR) elNR.textContent = formatNOK(Math.max(0, futureRight - taxRight));
        }

        // Gevinst om x år = verdi portefølje om x år − netto portefølje
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
        const shieldBase = Math.round((net * (equitySharePct / 100) * Math.pow(1 + shieldRate / 100, years)) - (net * (equitySharePct / 100)));
        if (elShield) elShield.textContent = formatNOK(shieldBase);

        // Avkastning utover skjerming = Gevinst om x år - Skjermingsgrunnlag
        const excess = Math.max(0, gainFuture - shieldBase);
        if (elExcess) elExcess.textContent = formatNOK(excess);

        // Skatt (fremtid) = avkastning utover skjerming × ((aksjeandel × Utbytteskatt) + ((1 − aksjeandel) × Kapitalskatt))
        // Hent skattesatser fra Input-fanen
        const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100; // Konverter prosent til desimal
        const capitalTaxRate = (AppState.capitalTaxPct || 22.00) / 100; // Konverter prosent til desimal
        const equityShare = Math.max(0, Math.min(1, equitySharePct / 100));
        const interestShare = 1 - equityShare; // renteandel
        // Hvis aksjeandel > 80%, bruk utbytteskatt på hele avkastningen
        const effectiveTaxRate = equitySharePct > 80 ? stockTaxRate : (equityShare * stockTaxRate + interestShare * capitalTaxRate);
        const taxFuture = isRealisationTab
          ? Math.round(gainFuture * 0.3784)
          : Math.round(excess * effectiveTaxRate);
        if (elTaxFuture) { 
          elTaxFuture.textContent = formatNOK(taxFuture); 
          elTaxFuture.style.color = "var(--error-600)"; 
          elTaxFuture.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
        }

        // Netto portefølje (fremtid) = Fremtidsverdi − Skatt (fremtid)
        const elNetFuture = document.getElementById("fk-left-net-future");
        if (elNetFuture) elNetFuture.textContent = formatNOK(Math.max(0, future - taxFuture));

        if (isRealisationTab) {
          enableNokDblclickEdit(elC, () => Number.isFinite(Number(AppState.realisationRedeemAmount)) ? Number(AppState.realisationRedeemAmount) : 2000000, (v) => {
            AppState.realisationRedeemAmount = v;
            updateTopSummaries();
          });
          enableNokDblclickEdit(elG, () => Number.isFinite(Number(AppState.realisationGain)) ? Number(AppState.realisationGain) : 800000, (v) => {
            AppState.realisationGain = v;
            updateTopSummaries();
          });
          enableNokDblclickEdit(elT, () => Number.isFinite(Number(AppState.realisationTax)) ? Number(AppState.realisationTax) : 302720, (v) => {
            AppState.realisationTax = v;
            updateTopSummaries();
          });
        }
      } catch (_) {}

      if (bottom) {
        bottom.style.display = "flex";
        bottom.style.alignItems = "center";
        bottom.style.justifyContent = "center";
        bottom.style.padding = "1rem 1.25rem";
        bottom.style.overflow = "hidden";
        bottom.style.minWidth = "0";
        bottom.style.boxSizing = "border-box";
        bottom.style.textAlign = "center";

        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "chart-action-row";

        const flyttLabel = isRealisationTab ? "Gjennomføre endring" : "Flytte fondskonto";
        const ikkeFlyttLabel = isRealisationTab ? "Ikke gjennomføre endring" : "Ikke flytte Fondskonto";

        const flyttBtn = document.createElement("button");
        flyttBtn.id = "chart-icon-vis-grafisk-fondskonto-flytt";
        flyttBtn.type = "button";
        flyttBtn.className = "chart-action-btn chart-action-btn--primary";
        flyttBtn.setAttribute("aria-label", flyttLabel);
        flyttBtn.textContent = flyttLabel;
        flyttBtn.addEventListener("click", () => {
          if (typeof window.openVisGrafiskModal === "function") {
            window.openVisGrafiskModal("fondskonto-flytt");
          }
        });
        buttonWrapper.appendChild(flyttBtn);

        const ikkeFlyttBtn = document.createElement("button");
        ikkeFlyttBtn.id = "chart-icon-vis-grafisk-fondskonto-ikke-flytt";
        ikkeFlyttBtn.type = "button";
        ikkeFlyttBtn.className = "chart-action-btn chart-action-btn--primary";
        ikkeFlyttBtn.setAttribute("aria-label", ikkeFlyttLabel);
        ikkeFlyttBtn.textContent = ikkeFlyttLabel;
        ikkeFlyttBtn.addEventListener("click", () => {
          if (typeof window.openVisGrafiskModal === "function") {
            window.openVisGrafiskModal("fondskonto-ikke-flytt");
          }
        });
        buttonWrapper.appendChild(ikkeFlyttBtn);

        const sammenlignBtn = document.createElement("button");
        sammenlignBtn.id = "chart-icon-fondskonto-sammenlign";
        sammenlignBtn.type = "button";
        sammenlignBtn.className = "chart-action-btn chart-action-btn--primary";
        sammenlignBtn.setAttribute("aria-label", "Sammenlign alternativer");
        sammenlignBtn.textContent = "Sammenlign alternativer";
        sammenlignBtn.addEventListener("click", () => {
          if (typeof window.openVisGrafiskModal === "function") {
            window.openVisGrafiskModal("fondskonto-sammenlign");
          }
        });
        buttonWrapper.appendChild(sammenlignBtn);

        const differanseBtn = document.createElement("button");
        differanseBtn.id = "chart-icon-fondskonto-differanse";
        differanseBtn.type = "button";
        differanseBtn.className = "chart-action-btn chart-action-btn--primary";
        differanseBtn.setAttribute("aria-label", "Differanse år for år");
        differanseBtn.textContent = "Differanse år for år";
        differanseBtn.addEventListener("click", () => {
          if (typeof window.openVisGrafiskModal === "function") {
            window.openVisGrafiskModal("fondskonto-differanse");
          }
        });
        buttonWrapper.appendChild(differanseBtn);

        bottom.appendChild(buttonWrapper);
      }
    }

    // Hvis fanen er "Nedbetale lån": to kolonner med pen kalkulasjonsliste
    if (title === "Nedbetale lån") {
      [left, right].forEach(col => {
        col.innerHTML = "";
        col.style.display = "grid";
        col.style.gridAutoRows = "minmax(1.2rem, auto)"; // Redusert linjehøyde
        col.style.rowGap = "0.25rem"; // Redusert gap
        col.style.alignContent = "start";
        col.style.overflowY = "hidden";
        col.style.overflowX = "hidden";
        col.style.paddingTop = "0.5rem";
        col.style.paddingBottom = "0.5rem";
        col.style.paddingLeft = "0.5rem";
        col.style.paddingRight = "0.5rem";
      });

      function makeRow(text, opts = {}) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.style.lineHeight = "1.3";
        row.style.fontSize = "0.75rem";
        row.style.fontFamily = 'var(--font-sans)';
        // Skjul hele raden hvis hidden er satt, men behold plassen
        if (opts.hidden) {
          row.style.visibility = "hidden";
        }
        const label = document.createElement("span");
        label.textContent = opts.placeholder ? "" : text;
        if (opts.labelId) label.id = opts.labelId;
        label.style.fontFamily = 'var(--font-sans)';
        label.style.lineHeight = "1.3";
        if (opts.bold) {
          label.style.fontWeight = "700";
          label.style.fontSize = "0.875rem";
        } else {
          label.style.fontWeight = "400";
          label.style.fontSize = "0.75rem";
        }
        if (opts.red) {
          label.style.color = "var(--error-600)";
          label.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
        }
        if (opts.italic) label.style.fontStyle = "italic";
        // Skjul "X" i tomme linjer - behold linjen men gjør teksten usynlig
        if (text === "X") {
          label.style.visibility = "hidden";
        }
        const value = document.createElement("span");
        value.textContent = opts.placeholder ? "" : "";
        if (opts.id) value.id = opts.id;
        value.style.fontFamily = 'var(--font-sans)';
        value.style.lineHeight = "1.3";
        value.style.minWidth = "6rem";
        value.style.textAlign = "right";
        if (opts.bold) {
          value.style.fontWeight = "700";
          value.style.fontSize = "0.875rem";
        } else {
          value.style.fontWeight = "400";
          value.style.fontSize = "0.75rem";
        }
        // Sett rødfarge på verdien også hvis red er satt
        if (opts.red) {
          value.style.color = "var(--error-600)";
          value.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
        }
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

      // Venstre boks: 23 linjer
      left.appendChild(makeRow("Portefølje", { id: "inv-left-portfolio" }));
      left.appendChild(makeRow("Forventet avkastning", { id: "inv-left-expected" }));
      left.appendChild(makeRow("Innskutt kapital", { id: "inv-left-capital", hidden: true }));
      left.appendChild(makeRow("X", { id: "inv-left-empty1" }));
      left.appendChild(makeRow("Uttak til renter og avdrag", { red: true, id: "inv-left-payment" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Verdi ved periodens slutt", { bold: true, id: "inv-left-endvalue" }));
      left.appendChild(makeRow("Avkastning:", { id: "inv-left-avkastning-diff" }));
      left.appendChild(makeRow("Rest innskutt kapital", { italic: true, id: "inv-left-rest-capital", hidden: true }));
      left.appendChild(makeRow("Skatt", { id: "inv-left-tax" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Netto portefølje etter skatt", { id: "inv-left-net" }));
      left.appendChild(makeRow("Oppgjør gjeld", { red: true, id: "inv-left-debt-settle" }));
      left.appendChild(makeRow("Fradrag rentekostnader", { id: "inv-left-interest-deduction" }));
      left.appendChild(makeDivider());
      left.appendChild(makeRow("Netto avkastning", { bold: true, id: "inv-left-net-return" }));

      right.appendChild(makeRow("Lån", { id: "inv-right-loan" }));
      right.appendChild(makeRow("Rentekostnad", { id: "inv-right-rate" }));
      right.appendChild(makeRow("Årlig renter og avdrag per år", { italic: true, red: true, id: "inv-right-annual-payment" }));
      right.appendChild(makeRow("Renter totalt", { italic: true, red: true, id: "inv-right-total-interest" }));
      right.appendChild(makeRow("X", { id: "inv-right-empty1" }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow("Restlån ved periodens slutt", { bold: true, id: "inv-right-remaining-loan" }));
      right.appendChild(makeRow("X", { id: "inv-right-empty6" }));
      right.appendChild(makeRow("X", { id: "inv-right-empty7" }));
      right.appendChild(makeRow("X", { id: "inv-right-empty14" }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow("X", { id: "inv-right-empty8" }));
      right.appendChild(makeRow("X", { id: "inv-right-empty9" }));
      right.appendChild(makeRow("X", { id: "inv-right-empty10" }));
      right.appendChild(makeDivider());
      right.appendChild(makeRow("Avkastning utover lånekostnad", { bold: true, id: "inv-right-excess-return" }));
      
      // Knapper i den nye fullbredde-containeren under panelene
      if (bottom) {
        bottom.style.display = "flex";
        bottom.style.alignItems = "center";
        bottom.style.justifyContent = "center";
        bottom.style.padding = "1rem 1.25rem";
        bottom.style.overflow = "hidden";
        bottom.style.minWidth = "0";
        bottom.style.boxSizing = "border-box";
        bottom.style.textAlign = "center";

        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "chart-action-row";

        const visGrafiskBtn = document.createElement("button");
        visGrafiskBtn.id = "chart-icon-vis-grafisk";
        visGrafiskBtn.type = "button";
        visGrafiskBtn.className = "chart-action-btn chart-action-btn--primary";
        visGrafiskBtn.setAttribute("aria-label", "Kontantstrøm alle år");
        visGrafiskBtn.textContent = "Kontantstrøm alle år";
        visGrafiskBtn.addEventListener("click", () => {
          if (typeof window.openVisGrafiskModal === "function") window.openVisGrafiskModal();
        });
        buttonWrapper.appendChild(visGrafiskBtn);

        const chartIcon = document.createElement("button");
        chartIcon.id = "chart-icon";
        chartIcon.type = "button";
        chartIcon.className = "chart-action-btn chart-action-btn--blue";
        chartIcon.setAttribute("aria-label", "Endre antall år");
        chartIcon.textContent = "Endre antall år";
        chartIcon.addEventListener("click", () => {
          if (typeof window.openChartModal === "function") window.openChartModal();
        });
        buttonWrapper.appendChild(chartIcon);

        const equityShareIcon = document.createElement("button");
        equityShareIcon.id = "chart-icon-equity-share";
        equityShareIcon.type = "button";
        equityShareIcon.className = "chart-action-btn chart-action-btn--secondary";
        equityShareIcon.setAttribute("aria-label", "Endre aksjeandel");
        equityShareIcon.textContent = "Endre aksjeandel";
        equityShareIcon.addEventListener("click", () => {
          if (typeof window.openEquityShareChartModal === "function") {
            window.openEquityShareChartModal();
          }
        });
        buttonWrapper.appendChild(equityShareIcon);

        const interestCostIcon = document.createElement("button");
        interestCostIcon.id = "chart-icon-interest-cost";
        interestCostIcon.type = "button";
        interestCostIcon.className = "chart-action-btn chart-action-btn--soft";
        interestCostIcon.setAttribute("aria-label", "Endre rentekostnad");
        interestCostIcon.textContent = "Endre rentekostnad";
        interestCostIcon.addEventListener("click", () => {
          if (typeof window.openInterestCostChartModal === "function") {
            window.openInterestCostChartModal();
          }
        });
        buttonWrapper.appendChild(interestCostIcon);

        bottom.appendChild(buttonWrapper);
      }
      
      // Sett inn porteføljestørrelse og andre verdier
      // VIKTIG: Kall updateInvestLoanCalc etter at alle elementer er opprettet
      setTimeout(() => {
        try {
          updateInvestLoanCalc();
        } catch (e) {
          console.error('Feil ved første oppdatering av kalkulasjon:', e);
        }
      }, 50);
      
      try {
        // Hent porteføljestørrelse en gang
        const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
        let portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
        const portfolioSlider = document.getElementById('input-portfolio-slider');
        if (portfolioSlider && portfolioSlider.value) {
          const v = Number(portfolioSlider.value);
          if (isFinite(v)) portfolio = v;
        }
        
        // Oppdater venstre boksen
        const elPortfolio = document.getElementById("inv-left-portfolio");
        if (elPortfolio) {
          elPortfolio.textContent = formatNOK(Math.round(portfolio));
        }
        // Sett inn innskutt kapital fra Input-fanen
        const elCapital = document.getElementById("inv-left-capital");
        if (elCapital) {
          let capital = 0;
          const capitalSliderEl = document.getElementById('input-capital-slider');
          if (capitalSliderEl && capitalSliderEl.value) {
            const v = Number(capitalSliderEl.value);
            if (isFinite(v)) capital = v;
          } else if (isFinite(AppState.inputCapital)) {
            capital = Number(AppState.inputCapital);
          }
          elCapital.textContent = formatNOK(Math.round(capital));
        }
        // Sett inn forventet avkastning fra Input-fanen
        const elExpected = document.getElementById("inv-left-expected");
        if (elExpected) {
          const inputExpectedReturn = document.getElementById('expected-return-out');
          if (inputExpectedReturn) {
            // Hent verdien direkte fra Input-fanen (allerede formatert med to desimaler)
            const inputValue = inputExpectedReturn.textContent.trim();
            elExpected.textContent = inputValue;
          } else if (isFinite(AppState.expectedReturnPct)) {
            // Fallback: bruk AppState hvis elementet ikke finnes
            elExpected.textContent = `${AppState.expectedReturnPct.toFixed(2).replace('.', ',')} %`;
          }
        }
        
        // Beregn og oppdater "Uttak til renter og avdrag" med AVDRAG-funksjonen
        const elPayment = document.getElementById("inv-left-payment");
        if (elPayment) {
          let repaymentYears = 20; // default
          const repaymentSliderEl = document.getElementById('repayment-profile-slider');
          if (repaymentSliderEl && repaymentSliderEl.value) {
            const v = Number(repaymentSliderEl.value);
            if (isFinite(v) && v > 0) repaymentYears = v;
          } else if (isFinite(AppState.repaymentProfileYears)) {
            repaymentYears = Number(AppState.repaymentProfileYears);
          }
          
          let interestCost = 5.0;
          const interestSliderEl = document.getElementById('interest-cost-slider');
          if (interestSliderEl && interestSliderEl.value) {
            const v = Number(interestSliderEl.value);
            if (isFinite(v)) interestCost = v;
          } else if (isFinite(AppState.interestCostPct)) {
            interestCost = Number(AppState.interestCostPct);
          }
          
          // PMT-parametere:
          const rate = interestCost / 100; // rentekostnad per år
          const nper = repaymentYears; // antall år
          const pv = portfolio; // porteføljestørrelse
          const fv = 0; // sluttverdi
          const type = 0; // betaling i slutten av perioden
          
          // Beregn årlig betaling
          const annualPayment = Math.abs(calculatePMT(rate, nper, pv, fv, type));
          elPayment.textContent = formatNOK(Math.round(annualPayment));
          elPayment.style.color = "var(--error-600)";
          
          // Oppdater "Årlig renter og avdrag per år" i høyre boksen med minus foran
          const elAnnualPayment = document.getElementById("inv-right-annual-payment");
          if (elAnnualPayment) {
            elAnnualPayment.textContent = formatNOK(-Math.round(annualPayment));
            elAnnualPayment.style.color = "var(--error-600)";
          }
          
          // "Verdi ved periodens slutt" beregnes i updateInvestLoanCalc() som kalles etter at UI er opprettet
          // Dette sikrer konsistent beregning med riktig forventet avkastning basert på aksjeandel
          // Vi henter verdien fra DOM etter at updateInvestLoanCalc() har beregnet den
          
          // Hent antall år for beregninger
          let years = 10; // default
          const yearsSliderEl = document.getElementById('input-years-slider');
          if (yearsSliderEl && yearsSliderEl.value) {
            const v = Number(yearsSliderEl.value);
            if (isFinite(v) && v > 0) years = v;
          } else if (isFinite(AppState.yearsCount)) {
            years = Number(AppState.yearsCount);
          }
          
          // Beregn restlån ved periodens slutt
          const elRemainingLoan = document.getElementById("inv-right-remaining-loan");
          if (elRemainingLoan) {
            // Beregn restlån først
            // Hent avdragsprofil for å sjekke om lånet er nedbetalt
            let repaymentYearsForCalc1 = 20; // default
            const repaymentSliderElForCalc1 = document.getElementById('repayment-profile-slider');
            if (repaymentSliderElForCalc1 && repaymentSliderElForCalc1.value) {
              const v = Number(repaymentSliderElForCalc1.value);
              if (isFinite(v) && v > 0) repaymentYearsForCalc1 = v;
            } else if (isFinite(AppState.repaymentProfileYears)) {
              repaymentYearsForCalc1 = Number(AppState.repaymentProfileYears);
            }
            
            let remainingLoan = 0;
            // Hvis antall år >= avdragsprofil, er lånet fullstendig nedbetalt (restlån = 0)
            if (years >= repaymentYearsForCalc1) {
              remainingLoan = 0;
            } else {
              const pvRate = interestCost / 100;
              const remainingYears = repaymentYearsForCalc1 - years;
              const pvNper = remainingYears;
              const pvPmt = -annualPayment;
              remainingLoan = Math.abs(calculatePV(pvRate, pvNper, pvPmt, 0, 0));
            }
            elRemainingLoan.textContent = formatNOK(Math.round(remainingLoan));
            
            // Oppdater "Oppgjør gjeld" i venstre boks = Restlån ved periodens slutt med minus foran
            const elDebtSettle = document.getElementById('inv-left-debt-settle');
            if (elDebtSettle && remainingLoan > 0) {
              elDebtSettle.textContent = formatNOK(-Math.round(remainingLoan));
              elDebtSettle.style.color = "var(--error-600)";
            } else if (elDebtSettle) {
              elDebtSettle.textContent = formatNOK(0);
              elDebtSettle.style.color = "var(--error-600)";
            }
            
            // "Avkastning:" beregnes i updateInvestLoanCalc() som kalles etter at UI er opprettet
            // Dette sikrer konsistent beregning med riktig forventet avkastning basert på aksjeandel
            
            // Beregn og oppdater "Rest innskutt kapital" med SLUTTVERDI-funksjonen
            const elRestCapital = document.getElementById("inv-left-rest-capital");
            if (elRestCapital && annualPayment > 0) {
                // Hent innskutt kapital fra Input-fanen
                let capital = 0;
                const capitalSliderEl = document.getElementById('input-capital-slider');
                if (capitalSliderEl && capitalSliderEl.value) {
                  const v = Number(capitalSliderEl.value);
                  if (isFinite(v)) capital = v;
                } else if (isFinite(AppState.inputCapital)) {
                  capital = Number(AppState.inputCapital);
                }
                
                // Hent skjermingsrente fra Input-fanen
                let shieldRatePct = 3.9;
                const shieldSliderEl = document.getElementById('shield-rate-slider');
                if (shieldSliderEl && shieldSliderEl.value) {
                  const v = Number(shieldSliderEl.value);
                  if (isFinite(v)) shieldRatePct = v;
                } else if (isFinite(AppState.shieldRatePct)) {
                  shieldRatePct = Number(AppState.shieldRatePct);
                }
                
                // FV-parametere:
                const restRate = shieldRatePct / 100;
                const restNper = years;
                const restPmt = -annualPayment; // Med minus først
                const restPv = capital; // Innskutt kapital
                const restType = 0;
                
                // Beregn rest innskutt kapital med SLUTTVERDI
                // Hvis innskutt kapital er 0 eller negativ, vis 0
                let restCapitalValue = 0;
                if (capital <= 0) {
                  elRestCapital.textContent = formatNOK(0);
                  restCapitalValue = 0;
                } else {
                  const restCapital = -calculateFV(restRate, restNper, restPmt, restPv, restType);
                  // Hvis verdien blir negativ, vis 0
                  restCapitalValue = Math.max(0, Math.round(restCapital));
                  elRestCapital.textContent = formatNOK(restCapitalValue);
                }
                
                // Beregn og oppdater "Skatt" basert på "Avkastning:"-linjen × ((Aksjeandel × 0,3784) + ((1 - Aksjeandel) × 0,22))
                const elTax = document.getElementById("inv-left-tax");
                if (elTax) {
                  // Hent verdien fra "Avkastning:"-linjen
                  let avkastningDiffValue = 0;
                  const elAvkastningDiff = document.getElementById("inv-left-avkastning-diff");
                  if (elAvkastningDiff && elAvkastningDiff.textContent) {
                    let avkastningText = elAvkastningDiff.textContent.trim();
                    // Sjekk om verdien er negativ (kan ha minus-tegn eller Unicode minus U+2212)
                    const isNegative = avkastningText.includes('-') || avkastningText.includes('−');
                    // Fjern alle tegn bortsett fra tall
                    avkastningText = avkastningText.replace(/[^\d]/g, '');
                    avkastningDiffValue = parseFloat(avkastningText) || 0;
                    // Legg til minus hvis verdien var negativ
                    if (isNegative) {
                      avkastningDiffValue = -Math.abs(avkastningDiffValue);
                    }
                  }
                  
                  // Hent aksjeandel fra Input-fanen
                  let equitySharePct = 65; // default
                  if (typeof AppState.stockSharePercent === 'number') {
                    equitySharePct = AppState.stockSharePercent;
                  } else if (AppState.stockShareOption) {
                    const m = String(AppState.stockShareOption).match(/(\d+)%/);
                    if (m) equitySharePct = Number(m[1]);
                    if (/Renter/i.test(String(AppState.stockShareOption))) equitySharePct = 0;
                  }
                  
                  // Konverter aksjeandel til desimal (0-1) for beregning
                  const aksjeAndel = equitySharePct / 100;
                  
                  // Hent skattesatser fra Input-fanen
                  const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100; // Konverter prosent til desimal
                  const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100; // Konverter prosent til desimal
                  
                  // Beregn skatt: -Avkastning × ((Aksjeandel × Utbytteskatt) + ((1 - Aksjeandel) × Kapitalskatt))
                  // Hvis avkastning er negativ, blir skatt positiv (skattefordel, grønn)
                  // Hvis avkastning er positiv, blir skatt negativ (skattekostnad, rød)
                  const taxRate = (aksjeAndel * stockTaxRate) + ((1 - aksjeAndel) * capitalTaxRate);
                  const taxAmount = -avkastningDiffValue * taxRate;
                  const roundedTax = Math.round(taxAmount);
                  elTax.textContent = formatNOK(roundedTax);
                  
                  // Sett farge: grønn hvis positiv (skattefordel), rød hvis negativ (skattekostnad)
                  const taxColor = roundedTax >= 0 ? "var(--success-600)" : "var(--error-600)"; // Grønn eller rød
                  elTax.style.color = taxColor;
                  
                  // Oppdater også etiketten "Skatt" med samme farge
                  const taxRow = elTax.parentElement;
                  if (taxRow) {
                    const taxLabel = taxRow.querySelector('span:first-child');
                    if (taxLabel) {
                      taxLabel.style.color = taxColor;
                    }
                  }
                }
              }
            } else if (elRemainingLoan) {
              // Hent verdier fra Input-fanen
              let yearsForLoan = 10; // default
              const yearsSliderEl = document.getElementById('input-years-slider');
              if (yearsSliderEl && yearsSliderEl.value) {
                const v = Number(yearsSliderEl.value);
                if (isFinite(v) && v > 0) yearsForLoan = v;
              } else if (isFinite(AppState.yearsCount)) {
                yearsForLoan = Number(AppState.yearsCount);
              }
              
              // PV-parametere:
              // Rente: rentekostnad fra input-fanen
              const pvRate = interestCost / 100;
              // Antall utbetalinger: Antall år fra input-fanen
              const pvNper = yearsForLoan;
              // Utbetaling: fra "Uttak til renter og avdrag" (med minus)
              const pvPmt = -annualPayment; // Negativ fordi det er utbetaling
              // Sluttverdi: 0
              const pvFv = 0;
              // Type: 0 (tom, betaling i slutten av perioden)
              const pvType = 0;
              
              // Beregn restlån ved periodens slutt
              // Hent avdragsprofil for å sjekke om lånet er nedbetalt
              let repaymentYearsForCalc2 = 20; // default
              const repaymentSliderElForCalc2 = document.getElementById('repayment-profile-slider');
              if (repaymentSliderElForCalc2 && repaymentSliderElForCalc2.value) {
                const v = Number(repaymentSliderElForCalc2.value);
                if (isFinite(v) && v > 0) repaymentYearsForCalc2 = v;
              } else if (isFinite(AppState.repaymentProfileYears)) {
                repaymentYearsForCalc2 = Number(AppState.repaymentProfileYears);
              }
              
              let remainingLoan = 0;
              // Hvis antall år >= avdragsprofil, er lånet fullstendig nedbetalt (restlån = 0)
              if (yearsForLoan >= repaymentYearsForCalc2) {
                remainingLoan = 0;
              } else {
                const remainingYears = repaymentYearsForCalc2 - yearsForLoan;
                const pvRate2 = interestCost / 100;
                const pvNper2 = remainingYears;
                const pvPmt2 = -annualPayment;
                remainingLoan = Math.abs(calculatePV(pvRate2, pvNper2, pvPmt2, pvFv, pvType));
              }
              elRemainingLoan.textContent = formatNOK(Math.round(remainingLoan));
              
              // Oppdater "Oppgjør gjeld" i venstre boks = Restlån ved periodens slutt med minus foran
              const elDebtSettle = document.getElementById('inv-left-debt-settle');
              if (elDebtSettle && remainingLoan > 0) {
                elDebtSettle.textContent = formatNOK(-Math.round(remainingLoan));
              } else if (elDebtSettle) {
                elDebtSettle.textContent = formatNOK(0);
              }
            }
        }
        
        // Oppdater høyre boksen
        // Sett inn lån (porteføljestørrelse) i høyre boksen
        const elRightLoan = document.getElementById("inv-right-loan");
        if (elRightLoan) {
          elRightLoan.textContent = formatNOK(Math.round(portfolio));
        }
        // Sett inn rentekostnad i høyre boksen
        const elRightRate = document.getElementById("inv-right-rate");
        if (elRightRate) {
          let interestCost = 5.0;
          const interestSliderEl = document.getElementById('interest-cost-slider');
          if (interestSliderEl && interestSliderEl.value) {
            const v = Number(interestSliderEl.value);
            if (isFinite(v)) interestCost = v;
          } else if (isFinite(AppState.interestCostPct)) {
            interestCost = Number(AppState.interestCostPct);
          }
          elRightRate.textContent = `${interestCost.toFixed(1).replace('.', ',')} %`;
        }
      } catch (_) {}
      
      // Oppdater også med setTimeout for å sikre at DOM er klar
      setTimeout(() => {
        try {
          const sumAssets2 = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
          let portfolio2 = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets2;
          const portfolioSlider2 = document.getElementById('input-portfolio-slider');
          if (portfolioSlider2 && portfolioSlider2.value) {
            const v = Number(portfolioSlider2.value);
            if (isFinite(v)) portfolio2 = v;
          }
          
          const elRightLoan2 = document.getElementById("inv-right-loan");
          if (elRightLoan2) {
            elRightLoan2.textContent = formatNOK(Math.round(portfolio2));
          }
          
          const elRightRate2 = document.getElementById("inv-right-rate");
          if (elRightRate2) {
            let interestCost2 = 5.0;
            const interestSliderEl2 = document.getElementById('interest-cost-slider');
            if (interestSliderEl2 && interestSliderEl2.value) {
              const v = Number(interestSliderEl2.value);
              if (isFinite(v)) interestCost2 = v;
            } else if (isFinite(AppState.interestCostPct)) {
              interestCost2 = Number(AppState.interestCostPct);
            }
            elRightRate2.textContent = `${interestCost2.toFixed(1).replace('.', ',')} %`;
          }
          
          // Oppdater også "Uttak til renter og avdrag"
          const elPayment2 = document.getElementById("inv-left-payment");
          let annualPayment2 = 0;
          if (elPayment2) {
            let repaymentYears2 = 20;
            const repaymentSliderEl2 = document.getElementById('repayment-profile-slider');
            if (repaymentSliderEl2 && repaymentSliderEl2.value) {
              const v = Number(repaymentSliderEl2.value);
              if (isFinite(v) && v > 0) repaymentYears2 = v;
            } else if (isFinite(AppState.repaymentProfileYears)) {
              repaymentYears2 = Number(AppState.repaymentProfileYears);
            }
            
            let interestCost2 = 5.0;
            const interestSliderEl2 = document.getElementById('interest-cost-slider');
            if (interestSliderEl2 && interestSliderEl2.value) {
              const v = Number(interestSliderEl2.value);
              if (isFinite(v)) interestCost2 = v;
            } else if (isFinite(AppState.interestCostPct)) {
              interestCost2 = Number(AppState.interestCostPct);
            }
            
            const rate2 = interestCost2 / 100;
            const nper2 = repaymentYears2;
            const pv2 = portfolio2;
            annualPayment2 = Math.abs(calculatePMT(rate2, nper2, pv2, 0, 0));
            elPayment2.textContent = formatNOK(Math.round(annualPayment2));
            elPayment2.style.color = "var(--error-600)";
          }
          
          // Oppdater "Årlig renter og avdrag per år" i høyre boksen med minus foran
          const elAnnualPayment2 = document.getElementById("inv-right-annual-payment");
          if (elAnnualPayment2 && annualPayment2 > 0) {
            elAnnualPayment2.textContent = formatNOK(-Math.round(annualPayment2));
            elAnnualPayment2.style.color = "var(--error-600)";
          }
          
          // VIKTIG: Kall updateInvestLoanCalc() for å beregne "Verdi ved periodens slutt"
          // Dette sikrer at verdien vises når fanen rendres første gang
          try {
            updateInvestLoanCalc();
          } catch (e) {
            console.error('Feil ved oppdatering av "Verdi ved periodens slutt":', e);
          }
          
          // Oppdater også "Restlån ved periodens slutt"
          const elRemainingLoan2 = document.getElementById("inv-right-remaining-loan");
          if (elRemainingLoan2 && annualPayment2 > 0) {
            let years2 = 10;
            const yearsSliderEl2 = document.getElementById('input-years-slider');
            if (yearsSliderEl2 && yearsSliderEl2.value) {
              const v = Number(yearsSliderEl2.value);
              if (isFinite(v) && v > 0) years2 = v;
            } else if (isFinite(AppState.yearsCount)) {
              years2 = Number(AppState.yearsCount);
            }
            
            let interestCost2 = 5.0;
            const interestSliderEl2 = document.getElementById('interest-cost-slider');
            if (interestSliderEl2 && interestSliderEl2.value) {
              const v = Number(interestSliderEl2.value);
              if (isFinite(v)) interestCost2 = v;
            } else if (isFinite(AppState.interestCostPct)) {
              interestCost2 = Number(AppState.interestCostPct);
            }
            
            // Hent avdragsprofil for å sjekke om lånet er nedbetalt
            let repaymentYearsForTimeout = 20; // default
            const repaymentSliderElTimeout = document.getElementById('repayment-profile-slider');
            if (repaymentSliderElTimeout && repaymentSliderElTimeout.value) {
              const v = Number(repaymentSliderElTimeout.value);
              if (isFinite(v) && v > 0) repaymentYearsForTimeout = v;
            } else if (isFinite(AppState.repaymentProfileYears)) {
              repaymentYearsForTimeout = Number(AppState.repaymentProfileYears);
            }
            
            let remainingLoan2 = 0;
            // Hvis antall år >= avdragsprofil, er lånet fullstendig nedbetalt (restlån = 0)
            if (years2 >= repaymentYearsForTimeout) {
              remainingLoan2 = 0;
            } else {
              const pvRate2 = interestCost2 / 100;
              const remainingYears2 = repaymentYearsForTimeout - years2;
              const pvNper2 = remainingYears2;
              const pvPmt2 = -annualPayment2;
              remainingLoan2 = Math.abs(calculatePV(pvRate2, pvNper2, pvPmt2, 0, 0));
            }
            elRemainingLoan2.textContent = formatNOK(Math.round(remainingLoan2));
            
            // Oppdater "Oppgjør gjeld" i venstre boks = Restlån ved periodens slutt med minus foran
            const elDebtSettle2 = document.getElementById('inv-left-debt-settle');
            if (elDebtSettle2 && remainingLoan2 > 0) {
              elDebtSettle2.textContent = formatNOK(-Math.round(remainingLoan2));
            } else if (elDebtSettle2) {
              elDebtSettle2.textContent = formatNOK(0);
            }
          }
        } catch (_) {}
      }, 0);
    }
    
    // Hvis fanen er "Utbetale utbytte": fyll venstre panel med regnestykke
    if (title === "Utbetale utbytte") {
      left.innerHTML = "";
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "0.25rem"; // Redusert for mer kompakt layout
      left.style.paddingTop = "0.5rem";
      left.style.paddingBottom = "0.5rem";
      left.style.overflowY = "hidden";
      left.style.overflowX = "hidden";
      // Vis innhold; venstre side skal ha tallbokser for utvalgte linjer
      const showDividendLoanContent = true;
      const textOnly = false; // venstre panel viser verdier på enkelte linjer
      // Tall skal vises, men med usynlige rammer rundt boksene
      AppState.hideDividendLoanNumbers = false;

      function addDivider() {
        const div = document.createElement("div");
        div.style.height = "1px";
        div.style.background = "var(--BORDER_LIGHT)";
        div.style.margin = "0.15rem 0"; // Redusert margin
        left.appendChild(div);
      }

      function addCalcRow(id, labelText, isStrong, isIndented = false, isCost = false, isHeader = false) {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 7rem"; // Redusert for mer kompakt layout
        row.style.alignItems = "center";
        row.style.gap = "0.3rem"; // Redusert gap
        row.style.marginBottom = "0.1rem"; // Minimal margin mellom rader

        // Behagelig rødfarge for kostnader (samme som i "Nedbetale lån")
        const costColor = "var(--error-600)"; // En behagelig rødfarge, ikke for sterk

        const label = document.createElement("div");
        label.textContent = labelText;
        label.style.fontFamily = 'var(--font-sans)';
        label.style.lineHeight = "1.3";
        label.style.color = isCost ? costColor : "var(--GRAY_TEXT_DARK)";
        if (isCost) {
          label.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
          label.style.fontSize = "0.75rem";
        } else if (isStrong) {
          label.style.fontWeight = "700";
          label.style.fontSize = "0.875rem";
        } else {
          label.style.fontWeight = "400";
          label.style.fontSize = "0.75rem";
        }
        if (isIndented) {
          label.style.paddingLeft = "0.75rem"; // Redusert indentation
        }

        row.appendChild(label);
        
        // Hvis dette ikke er en header, legg til value-boks (men ikke i tekst-modus)
        if (!isHeader && !textOnly) {
          const value = document.createElement("div");
          value.id = id;
          value.className = "asset-amount";
          value.textContent = ""; // fylles senere
        value.style.fontFamily = 'var(--font-sans)';
          value.style.lineHeight = "1.3";
          value.style.width = "7rem"; // Redusert for mer kompakt layout
          if (isCost) {
            value.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
            value.style.fontSize = "0.75rem";
            value.style.color = costColor;
          } else if (isStrong) {
            value.style.fontWeight = "700";
            value.style.fontSize = "0.875rem";
          } else {
            value.style.fontWeight = "400";
            value.style.fontSize = "0.75rem";
          }
          value.style.padding = "0.25rem 0.4rem"; // Redusert padding
          value.style.textAlign = "right";
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
          if (id) spacer.id = id;
          row.appendChild(spacer);
          left.appendChild(row);
          return spacer;
        }
      }

      if (showDividendLoanContent) {
        const panelTitleLeft = document.createElement("div");
        panelTitleLeft.textContent = "Beholde portefølje:";
        panelTitleLeft.style.fontFamily = 'var(--font-sans)';
        panelTitleLeft.style.fontWeight = "700";
        panelTitleLeft.style.fontSize = "0.875rem";
        panelTitleLeft.style.lineHeight = "1.3";
        panelTitleLeft.style.color = "var(--GRAY_TEXT_DARK)";
        panelTitleLeft.style.marginBottom = "0.25rem";
        left.appendChild(panelTitleLeft);

        // Venstre: første tre linjer med verdi-bokser
        addCalcRow("div-portfolio", "Beholde portefølje", false, false, false, false);
        addCalcRow("div-expected", "Forventet avkastning", false, false, false, false);
        addDivider();
        addCalcRow("div-endvalue", "Verdi ved periodens slutt", true, false, false, false);

        // Utbytte om N år
        addCalcRow("div-dividend-header", `Utbytte om ${AppState.yearsCount || 0} år:`, false, false, false, true);
        addCalcRow("div-dividend", "Utbytte", false, true, false, false);
        addCalcRow("div-dividend-tax", "Utbytteskatt", false, true, true, false);
        addCalcRow("div-dividend-net", "Netto", false, true, false, false);

        // Tom luft
        const spacer = document.createElement("div");
        spacer.style.height = "0.5rem"; // Redusert spacer
        left.appendChild(spacer);

        // Status om N år
        addCalcRow("div-status-header", `Status om ${AppState.yearsCount || 0} år:`, true, false, false, true);
        addCalcRow("div-loan-status", "Nedbetalt gjeld", false, true, false, false);
        addCalcRow("div-remaining-portfolio", "Restportefølje", false, true, false, false);
        addCalcRow("div-interest-costs", `Rentekostnader i ${(AppState.yearsCount || 0)} år`, false, true, true, false);
        addCalcRow("div-interest-deduction", "Skattefradrag renter", false, true, false, false);

        const spacerBeforeSumSection = document.createElement("div");
        spacerBeforeSumSection.style.height = "0.35rem";
        spacerBeforeSumSection.style.flexShrink = "0";
        left.appendChild(spacerBeforeSumSection);

        addDivider();
        const sumRow = addCalcRow("div-sum", "Sum", true, false, false, false);
        
        // Diskret linje mellom Sum og Forskjell
        const subtleDivider = document.createElement("div");
        subtleDivider.style.height = "1px";
        subtleDivider.style.background = "var(--BORDER_LIGHT)";
        subtleDivider.style.margin = "0.4rem 0"; // Redusert margin
        subtleDivider.style.opacity = "0.5"; // Diskret
        left.appendChild(subtleDivider);
        
        const differenceRow = addCalcRow("div-difference", "Forskjell mellom å beholde Vs. å utbetale", false, false, false, false);
        // Redusert avstand over den nederste linjen
        if (differenceRow && differenceRow.parentElement) {
          differenceRow.parentElement.style.marginTop = "0.4rem"; // Redusert margin
        }
        
        // Fyll verdier for venstre panel
        try { updateDividendLoanCalc(); } catch (_) {}
      }

      // Høyre panel (behold tom boks)
      right.innerHTML = "";
      right.style.display = "flex";
      right.style.flexDirection = "column";
      right.style.justifyContent = "flex-start";
      right.style.gap = "0.25rem";
      right.style.paddingTop = "0.5rem";
      right.style.paddingBottom = "0.5rem";
      right.style.overflowY = "hidden";
      right.style.overflowX = "hidden";

      function addDividerRR() {
        const div = document.createElement("div");
        div.style.height = "1px";
        div.style.background = "var(--BORDER_LIGHT)";
        div.style.margin = "0.15rem 0"; // Redusert margin
        right.appendChild(div);
      }

      function addCalcRowRR(id, labelText, isStrong, isCost = false, isPositive = false, isHeader = false, isIndented = false) {
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 7rem";
        row.style.alignItems = "center";
        row.style.gap = "0.3rem";
        row.style.marginBottom = "0.1rem"; // Minimal margin mellom rader

        // Behagelig rødfarge for kostnader (samme som i "Nedbetale lån")
        const costColor = "var(--error-600)";
        // Behagelig grønnfarge for positive verdier
        const positiveColor = "var(--success-600)";

        const label = document.createElement("div");
        label.textContent = labelText;
        label.style.fontFamily = 'var(--font-sans)';
        label.style.lineHeight = "1.3";
        if (isCost) {
          label.style.color = costColor;
          label.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
          label.style.fontSize = "0.75rem";
        } else if (isPositive) {
          label.style.color = positiveColor;
          label.style.fontWeight = "400";
          label.style.fontSize = "0.75rem";
        } else {
          label.style.color = "var(--GRAY_TEXT_DARK)";
          if (isStrong) {
            label.style.fontWeight = "700";
            label.style.fontSize = "0.875rem";
          } else {
            label.style.fontWeight = "400";
            label.style.fontSize = "0.75rem";
          }
        }
        if (isIndented) {
          label.style.paddingLeft = "0.75rem"; // Redusert indentation
        }

        row.appendChild(label);
        
        // Hvis dette ikke er en header, legg til value-boks (men ikke i tekst-modus)
        if (!isHeader && !textOnly) {
          const value = document.createElement("div");
          value.id = id;
          value.textContent = "";
        value.style.fontFamily = 'var(--font-sans)';
          value.style.lineHeight = "1.3";
          value.style.border = "1px solid var(--BORDER_LIGHT)";
          value.style.borderRadius = "0.5rem";
          value.style.width = "7rem";
          if (isCost) {
            value.style.color = costColor;
            value.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
            value.style.fontSize = "0.75rem";
          } else if (isPositive) {
            value.style.color = positiveColor;
            value.style.fontWeight = "400";
            value.style.fontSize = "0.75rem";
          } else if (isStrong) {
            value.style.fontWeight = "700";
            value.style.fontSize = "0.875rem";
          } else {
            value.style.fontWeight = "400";
            value.style.fontSize = "0.75rem";
          }
          value.style.padding = "0.25rem 0.4rem"; // Redusert padding
          value.style.textAlign = "right";
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
          if (id) spacer.id = id;
          row.appendChild(spacer);
          right.appendChild(row);
          return spacer;
        }
      }

      if (showDividendLoanContent) {
        const panelTitleRight = document.createElement("div");
        panelTitleRight.textContent = "Utbetale utbytte:";
        panelTitleRight.style.fontFamily = 'var(--font-sans)';
        panelTitleRight.style.fontWeight = "700";
        panelTitleRight.style.fontSize = "0.875rem";
        panelTitleRight.style.lineHeight = "1.3";
        panelTitleRight.style.color = "var(--GRAY_TEXT_DARK)";
        panelTitleRight.style.marginBottom = "0.25rem";
        right.appendChild(panelTitleRight);

        // Høyre panel – identisk tekst som venstre panel, ingen verdier
        const rPortfolioRow = addCalcRowRR("r-portfolio", "Beholde portefølje", false, false, false, false);
        const rExpectedRow = addCalcRowRR("r-expected", "Forventet avkastning", false, false, false, false);
        // Gjør de tre øverste linjene usynlige (men behold dem for layout)
        if (rPortfolioRow && rPortfolioRow.parentElement) rPortfolioRow.parentElement.style.visibility = "hidden";
        if (rExpectedRow && rExpectedRow.parentElement) rExpectedRow.parentElement.style.visibility = "hidden";
        
        addDividerRR();
        
        const rEndValueRow = addCalcRowRR("r-endvalue", "Verdi ved periodens slutt", true, false, false, false);
        if (rEndValueRow && rEndValueRow.parentElement) rEndValueRow.parentElement.style.visibility = "hidden";

        addCalcRowRR("r-div-header", "Utbytte i dag:", false, false, false, true);
        addCalcRowRR("r-div", "Utbytte", false, false, false, false, true);
        addCalcRowRR("r-div-tax", "Utbytteskatt", false, true, false, false, true);
        addCalcRowRR("r-div-net", "Netto", false, false, false, false, true);

        const spacerR = document.createElement("div"); spacerR.style.height = "0.5rem"; right.appendChild(spacerR);

        addCalcRowRR("r-status-header", `Status om ${(AppState.yearsCount || 0)} år:`, true, false, false, true);
        addCalcRowRR("r-loan", "Nedbetalt gjeld", false, false, false, false, true);
        addCalcRowRR("r-remaining", "Restportefølje", false, false, false, false, true);
        addCalcRowRR("r-interest-costs", `Rentekostnader i ${(AppState.yearsCount || 0)} år`, false, false, true, false, true);
        addCalcRowRR("r-interest-deduction", "Skattefradrag renter", false, false, false, false, true);
        const spacerBeforeSumSectionR = document.createElement("div");
        spacerBeforeSumSectionR.style.height = "0.35rem";
        spacerBeforeSumSectionR.style.flexShrink = "0";
        right.appendChild(spacerBeforeSumSectionR);

        addDividerRR();
        addCalcRowRR("r-sum", "Sum", true, false, false, false);
        // Oppdater verdier i høyre panel
        try { updateDividendLoanCalc(); } catch (_) {}
      }
      
      // Knapper i den nye fullbredde-containeren under panelene
      if (bottom) {
        bottom.style.display = "flex";
        bottom.style.alignItems = "center";
        bottom.style.justifyContent = "center";
        bottom.style.padding = "1rem 1.25rem";
        bottom.style.overflow = "hidden";
        bottom.style.minWidth = "0";
        bottom.style.boxSizing = "border-box";
        bottom.style.textAlign = "center";

        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "chart-action-row";

        const visGrafiskBtn = document.createElement("button");
        visGrafiskBtn.id = "chart-icon-vis-grafisk-dividend";
        visGrafiskBtn.type = "button";
        visGrafiskBtn.className = "chart-action-btn chart-action-btn--primary";
        visGrafiskBtn.setAttribute("aria-label", "Kontantstrøm alle år");
        visGrafiskBtn.textContent = "Kontantstrøm alle år";
        visGrafiskBtn.addEventListener("click", () => {
          if (typeof window.openVisGrafiskModal === "function") window.openVisGrafiskModal("dividend");
        });
        buttonWrapper.appendChild(visGrafiskBtn);

        const chartIcon = document.createElement("button");
        chartIcon.id = "chart-icon-dividend";
        chartIcon.type = "button";
        chartIcon.className = "chart-action-btn chart-action-btn--blue";
        chartIcon.setAttribute("aria-label", "Endre antall år");
        chartIcon.textContent = "Endre antall år";
        chartIcon.addEventListener("click", () => {
          if (window.openDividendChartModal) {
            window.openDividendChartModal();
          }
        });
        buttonWrapper.appendChild(chartIcon);

        const taxChangeIcon = document.createElement("button");
        taxChangeIcon.id = "chart-icon-tax-change";
        taxChangeIcon.type = "button";
        taxChangeIcon.className = "chart-action-btn chart-action-btn--secondary";
        taxChangeIcon.setAttribute("aria-label", "Endre skattesats");
        taxChangeIcon.textContent = "Endre skattesats";
        taxChangeIcon.addEventListener("click", () => {
          if (window.openTaxRateChangeChartModal) {
            window.openTaxRateChangeChartModal();
          }
        });
        buttonWrapper.appendChild(taxChangeIcon);

        bottom.appendChild(buttonWrapper);
      }
    }

    const stretchToBottom = () => {
      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const bottomOffset = 40;
      const minH = Math.max(0, viewportH - rect.top - bottomOffset);
      // Øvre paneler: ~83 % — bunncontainer redusert ytterligere 10 %
      const topH = Math.floor(minH * 0.83);
      const gapPx = parseFloat(getComputedStyle(container).rowGap || getComputedStyle(container).gap) || 16;
      const bottomH = bottom ? Math.max(0, Math.floor(minH - topH - gapPx)) : 0;
      container.style.minHeight = `${minH}px`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          left.style.height = `${topH}px`;
          right.style.height = `${topH}px`;
          left.style.minHeight = `${topH}px`;
          right.style.minHeight = `${topH}px`;
          if (bottom) {
            bottom.style.height = `${bottomH}px`;
            bottom.style.minHeight = `${bottomH}px`;
          }
        });
      });
    };
    // Kjør umiddelbart og ved resize/zoom
    stretchToBottom();
    window.addEventListener("resize", stretchToBottom, { passive: true });
    // Lytter på zoom-endringer via VisualViewport API
    if (window.VisualViewport && typeof window.VisualViewport.addEventListener === 'function') {
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
    const spacing = 0.55; // Mer luft mellom hovedområder
    const horizontalSpacing = 0.85; // Litt mer horisontal luft mellom kolonnene
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
    firstLeft.style.gap = "0.6rem";
    // Reduser høyden: ingen min-høyde, litt mindre vertikal padding
    firstLeft.style.minHeight = "0";
    firstLeft.style.paddingTop = "0.5rem";
    firstLeft.style.paddingBottom = "0.5rem";
    firstContainer.appendChild(firstLeft);
    firstContainer.appendChild(firstRight);

    // Sentrer innholdet i høyre boks og legg inn "ANTALL ÅR"-slider (1–20)
    firstRight.style.display = "flex";
    firstRight.style.flexDirection = "column";
    firstRight.style.alignItems = "center";
    firstRight.style.justifyContent = "center";
    firstRight.style.gap = "0.6rem";
    firstRight.style.minHeight = "0";
    firstRight.style.paddingTop = "0.5rem";
    firstRight.style.paddingBottom = "0.5rem";

    const yearsLabel = document.createElement("div");
    yearsLabel.className = "section-label";
    yearsLabel.textContent = "ANTALL ÅR";
    yearsLabel.style.textAlign = "center";
    yearsLabel.style.marginBottom = "0.25rem";

    const yearsRow = document.createElement("div");
    yearsRow.style.display = "flex";
    yearsRow.style.alignItems = "center";
    yearsRow.style.justifyContent = "center";
    yearsRow.style.gap = "0.5rem"; // Redusert gap
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
    yearsOut.style.minWidth = "90px";
    yearsOut.style.fontSize = "0.75rem";
    yearsOut.style.padding = "0.4rem 0.5rem";

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
    sliderRow.style.gap = "0.5rem"; // Redusert gap
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
    sliderOut.style.minWidth = "140px";
    sliderOut.style.fontSize = "0.75rem";
    sliderOut.style.padding = "0.4rem 0.5rem";
    sliderOut.style.cursor = "text";
    sliderOut.title = "Dobbeltklikk for å legge inn manuelt";
    // lagre i appstate og oppdater toppbokser
    AppState.portfolioSize = Number(slider.value);
    
    // Hjelpefunksjon for å oppdatere porteføljestørrelse
    const updatePortfolioSize = (newValue) => {
      const v = Math.max(0, Number(newValue)); // Sørg for at verdien ikke er negativ
      AppState.portfolioSize = v;
      
      // Oppdater slider hvis verdien er innenfor sliderens nåværende rekkevidde
      // Ellers oppdater maksverdi
      if (v <= Number(slider.max)) {
        slider.value = String(v);
      } else {
        // Oppdater maksverdi til å være minst den nye verdien
        slider.max = String(Math.max(Number(slider.max), v));
        slider.value = String(v);
      }
      
      sliderOut.textContent = formatNOK(v);
      
      // Oppdater innskutt kapital-slider
      const capitalSliderEl = document.getElementById('input-capital-slider');
      if (capitalSliderEl) {
        const currentCapitalValue = Number(capitalSliderEl.value);
        // Oppdater maksverdi til ny porteføljestørrelse
        capitalSliderEl.max = String(v);
        
        // Innskutt kapital har egen default (5 MNOK) og følger ikke porteføljen.
        // Begrens den bare hvis den overstiger ny porteføljestørrelse.
        if (currentCapitalValue > v) {
          capitalSliderEl.value = String(v);
          AppState.inputCapital = v;
          const capitalRowEl = capitalSliderEl.closest('div[style*="grid"]');
          if (capitalRowEl) {
            const capitalOutEl = capitalRowEl.querySelector('.asset-amount');
            if (capitalOutEl) {
              capitalOutEl.textContent = formatNOK(v);
            }
          }
        }
      }
      updateTopSummaries();
    };
    
    slider.addEventListener("input", () => {
      updatePortfolioSize(slider.value);
    });
    
    // Dobbelklikk for manuell input
    sliderOut.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const currentValue = AppState.portfolioSize;
      
      // Opprett input-felt
      const input = document.createElement("input");
      input.type = "number";
      input.value = String(currentValue);
      input.style.width = sliderOut.style.minWidth;
      input.style.fontSize = sliderOut.style.fontSize;
      input.style.padding = sliderOut.style.padding;
      input.style.border = "1px solid var(--BORDER_LIGHT)";
      input.style.borderRadius = "8px";
      input.style.boxShadow = "var(--shadow-sm)";
      input.style.textAlign = "center";
      input.style.fontFamily = "inherit";
      input.style.fontWeight = sliderOut.style.fontWeight || "inherit";
      input.style.minWidth = sliderOut.style.minWidth;
      input.style.backgroundColor = "#ffffff";
      input.style.color = "var(--GRAY_TEXT_DARK)";
      input.min = "0";
      input.step = "1";
      
      // Erstatt sliderOut med input
      sliderOut.style.display = "none";
      sliderRow.insertBefore(input, sliderOut);
      input.focus();
      input.select();
      
      // Funksjon for å avslutte redigering
      const finishEditing = () => {
        const newValue = input.value.trim();
        if (newValue !== "" && !isNaN(newValue)) {
          updatePortfolioSize(newValue);
        } else {
          // Hvis ugyldig input, gå tilbake til forrige verdi
          sliderOut.textContent = formatNOK(currentValue);
        }
        input.remove();
        sliderOut.style.display = "inline-flex";
      };
      
      // Avslutt ved Enter eller Escape
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finishEditing();
        } else if (e.key === "Escape") {
          e.preventDefault();
          input.remove();
          sliderOut.style.display = "inline-flex";
        }
      });
      
      // Avslutt ved blur (klikk utenfor)
      input.addEventListener("blur", finishEditing);
    });
    sliderCol.appendChild(slider);
    sliderRow.appendChild(sliderCol);
    sliderRow.appendChild(sliderOut);
    // Sentrer labelen
    sliderLabel.style.textAlign = "center";
    sliderLabel.style.marginBottom = "0.25rem";
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
    second.style.paddingTop = "0.5rem";
    second.style.paddingBottom = "0.5rem";

    // Overskrift fjernet

    const choicesWrap = document.createElement("div");
    choicesWrap.style.display = "flex";
    choicesWrap.style.flexWrap = "nowrap";
    choicesWrap.style.alignItems = "center";
    choicesWrap.style.justifyContent = "center";
    choicesWrap.style.gap = "8px";
    choicesWrap.style.width = "100%";
    choicesWrap.style.overflowX = "hidden";

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
      btn.style.padding = "0.5rem 0.75rem";
      btn.style.borderRadius = "8px";
      btn.style.fontSize = "0.75rem";
      btn.style.border = "1px solid var(--BORDER_LIGHT)";
      btn.style.background = idx === 4 ? "var(--blue-main)" : "var(--BG_CARD)"; // 65% Aksjer er standard (indeks 4)
      btn.style.color = idx === 4 ? "var(--white)" : "var(--GRAY_TEXT_DARK)";
      btn.style.fontWeight = "700";
      btn.style.boxShadow = "var(--shadow-sm)";
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
        b.style.background = isActive ? "var(--blue-main)" : "var(--BG_CARD)";
        b.style.color = isActive ? "var(--white)" : "var(--GRAY_TEXT_DARK)";
        b.style.borderColor = isActive ? "var(--blue-main)" : "var(--BORDER_LIGHT)";
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
      // Dette vil automatisk trigge updateTopSummaries() via setTimeout
      try { 
        if (typeof updateExpectedReturn === 'function') {
          updateExpectedReturn();
        } else {
          // Hvis updateExpectedReturn ikke finnes, kall updateTopSummaries direkte
          updateTopSummaries();
        }
      } catch (_) {
        // Fallback hvis noe går galt
        updateTopSummaries();
      }
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
    thirdLeft.style.gap = "0.486rem"; // ytterligere 10 % mindre luft mellom linjene
    thirdLeft.style.paddingTop = "0.5rem";
    thirdLeft.style.paddingBottom = "0.5rem";
    thirdLeft.style.overflowY = "hidden";
    thirdLeft.style.overflowX = "hidden";

    // Overskrift fjernet

    function makePctSlider(idBase, labelText, min, max, step, start) {
      const label = document.createElement("div");
      label.className = "section-label";
      label.textContent = labelText; // Små bokstaver i stedet for store
      label.style.fontSize = "0.75rem"; // 25% mindre (fra 1rem til 0.75rem)

      const row = document.createElement("div");
      // Egen layout for å sikre at slider og verdi alltid får plass
      row.style.display = "grid";
      row.style.gridTemplateColumns = "1fr 110px";
      row.style.alignItems = "center";
      row.style.gap = "0.5rem";
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
      out.style.width = "110px";
      out.style.fontSize = "0.75rem";
      out.style.padding = "0.4rem 0.5rem";
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
    const sKpi    = makePctSlider("expKpi",    "Forventet KPI", 0, 10, 0.1, AppState.expKpi ?? 2.0);
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
    feesWrap.className = "fees-wrap";
    feesWrap.style.display = "flex";
    feesWrap.style.flexWrap = "nowrap"; // én horisontal rekke
    feesWrap.style.gap = "0.4rem";
    feesWrap.style.overflowX = "hidden";
    thirdLeft.appendChild(feesWrap);

    const feeOptions = [0.0, 1.37, 0.93, 0.81, 0.69, 0.57];
    const feeButtons = [];
    let customFeeInput = null;
    
    function setFeeActive(idx) {
      // idx er indeks i feeOptions arrayet (0 = custom, 1-5 = knapper)
      // feeButtons arrayet har bare knappene (ikke custom input), så indeks 0 i feeButtons = indeks 1 i feeOptions
      feeButtons.forEach((b, i) => {
        const active = (i + 1) === idx; // i+1 fordi feeButtons starter fra indeks 0, men tilsvarer feeOptions[1], feeOptions[2], etc.
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.style.background = active ? "#ffffff" : "var(--BG_CARD)";
        b.style.borderColor = active ? "var(--blue-300)" : "var(--BORDER_LIGHT)";
        b.style.boxShadow = active ? "var(--shadow-sm), 0 0 0 3px rgba(59,130,246,0.15)" : "var(--shadow-sm)";
      });
      if (customFeeInput) {
        const active = idx === 0;
        customFeeInput.style.background = active ? "#ffffff" : "var(--BG_CARD)";
        customFeeInput.style.borderColor = active ? "var(--blue-300)" : "var(--BORDER_LIGHT)";
        customFeeInput.style.boxShadow = active ? "var(--shadow-sm), 0 0 0 3px rgba(59,130,246,0.15)" : "var(--shadow-sm)";
      }
      AppState.advisoryFeePct = feeOptions[idx];
      updateExpectedReturn();
    }
    
    function setCustomFeeActive() {
      feeButtons.forEach((b, i) => {
        b.setAttribute("aria-pressed", "false");
        b.style.background = "var(--BG_CARD)";
        b.style.borderColor = "var(--BORDER_LIGHT)";
        b.style.boxShadow = "var(--shadow-sm)";
      });
      if (customFeeInput) {
        customFeeInput.style.background = "#ffffff";
        customFeeInput.style.borderColor = "var(--blue-300)";
        customFeeInput.style.boxShadow = "var(--shadow-sm), 0 0 0 3px rgba(59,130,246,0.15)";
      }
    }
    
    // Create custom input for first option (0.0)
    const customInput = document.createElement("input");
    customInput.type = "text";
    customInput.value = "0,00";
    customInput.style.width = "50px";
    customInput.style.padding = "0.4rem 0.5rem";
    customInput.style.borderRadius = "6px";
    customInput.style.border = "1px solid var(--BORDER_LIGHT)";
    customInput.style.background = "#ffffff";
    customInput.style.boxShadow = "var(--shadow-sm)";
    customInput.style.color = "var(--GRAY_TEXT_DARK)";
    customInput.style.fontWeight = "700";
    customInput.style.fontSize = "0.75rem";
    customInput.style.textAlign = "center";
    customInput.inputMode = "decimal";
    let isUpdatingCustomFee = false;
    
    customInput.addEventListener("focus", setCustomFeeActive);
    
    customInput.addEventListener("blur", () => {
      if (isUpdatingCustomFee) return;
      isUpdatingCustomFee = true;
      const rawValue = String(customInput.value).replace(/\s/g, '');
      const v = parseFloat(rawValue.replace(',', '.')) || 0;
      const formatted = v.toFixed(2).replace('.', ',');
      customInput.value = formatted;
      AppState.advisoryFeePct = v;
      setCustomFeeActive();
      updateExpectedReturn();
      isUpdatingCustomFee = false;
    });
    
    customInput.addEventListener("input", () => {
      if (isUpdatingCustomFee) return;
      const rawValue = String(customInput.value).replace(/\s/g, '');
      const v = parseFloat(rawValue.replace(',', '.')) || 0;
      if (!isNaN(v)) {
        AppState.advisoryFeePct = v;
        setCustomFeeActive();
        updateExpectedReturn();
      }
    });
    
    customFeeInput = customInput;
    feesWrap.appendChild(customInput);
    
    // Create buttons for remaining options
    feeOptions.slice(1).forEach((pct, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.style.padding = "0.4rem 0.5rem";
      b.style.borderRadius = "6px";
      b.style.border = "1px solid var(--BORDER_LIGHT)";
      b.style.background = "var(--BG_CARD)";
      b.style.boxShadow = "var(--shadow-sm)";
      b.style.color = "var(--GRAY_TEXT_DARK)";
      b.style.fontWeight = "700";
      b.style.fontSize = "0.75rem";
      b.style.cursor = "pointer";
      b.textContent = `${pct.toFixed(2).replace('.', ',')}%`;
      b.addEventListener("click", () => setFeeActive(idx + 1));
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFeeActive(idx + 1); } });
      feeButtons.push(b);
      feesWrap.appendChild(b);
    });
    
    // Finn riktig indeks basert på AppState.advisoryFeePct
    const savedFee = AppState.advisoryFeePct !== undefined ? AppState.advisoryFeePct : 0.0;
    const savedFeeIdx = feeOptions.findIndex(f => Math.abs(f - savedFee) < 0.01);
    if (savedFeeIdx === 0 && !feeOptions.slice(1).find(f => Math.abs(f - savedFee) < 0.01)) {
      // Custom value, not matching any preset
      customInput.value = savedFee.toFixed(2).replace('.', ',');
      setCustomFeeActive();
    } else {
      setFeeActive(savedFeeIdx >= 0 ? savedFeeIdx : 0);
    }

    // Resultatboks nederst
    const result = document.createElement("div");
    result.style.marginTop = "0";
    result.style.border = "1px solid var(--BORDER_LIGHT)";
    result.style.borderRadius = "8px";
    result.style.boxShadow = "var(--shadow-sm)";
    result.style.padding = "0.5rem 0.75rem";
    result.style.background = "var(--BG_CARD)";
    result.style.textAlign = "center";
    const resLabel = document.createElement("div");
    resLabel.className = "section-label";
    resLabel.textContent = "Forventet avkastning:"; // Små bokstaver
    resLabel.style.fontSize = "0.75rem"; // 25% mindre
    resLabel.style.margin = "0 0 0.25rem 0";
    resLabel.style.textAlign = "center";
    const resValue = document.createElement("div");
    resValue.id = "expected-return-out";
    resValue.style.fontWeight = "900";
    resValue.style.fontSize = "1.25rem";
    resValue.style.textAlign = "center";
    resValue.textContent = "0.0%";
    result.appendChild(resLabel);
    result.appendChild(resValue);
    thirdLeft.appendChild(result);

    // Ny slider: Innskutt kapital (0–porteføljestørrelse, default = porteføljestørrelse)
    const capitalLabel = document.createElement("div");
    capitalLabel.className = "section-label";
    capitalLabel.textContent = "Innskutt kapital";
    capitalLabel.style.fontSize = "0.75rem";
    capitalLabel.style.marginTop = "0";
    thirdLeft.appendChild(capitalLabel);

    const capitalRow = document.createElement("div");
    capitalRow.style.display = "grid";
    capitalRow.style.gridTemplateColumns = "1fr 110px";
    capitalRow.style.alignItems = "center";
    capitalRow.style.gap = "0.5rem";
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
    
    // Default: Innskutt kapital = 5 MNOK (begrenset av porteføljestørrelse)
    const defaultInputCapital = 5000000;
    const initialPortfolioSize = AppState.portfolioSize || 10000000;
    if (AppState.inputCapital === undefined) AppState.inputCapital = defaultInputCapital;
    const initialCapitalValue = Math.min(AppState.inputCapital, initialPortfolioSize);
    capitalSlider.value = String(initialCapitalValue);
    capitalSlider.style.width = "100%";
    
    // Sett maksverdi basert på porteføljestørrelse
    capitalSlider.max = String(initialPortfolioSize);
    
    const capitalOut = document.createElement("div");
    capitalOut.className = "asset-amount";
    capitalOut.style.width = "110px";
    capitalOut.style.fontSize = "0.75rem";
    capitalOut.style.padding = "0.4rem 0.5rem";
    capitalOut.style.textAlign = "center";
    // Initialiser capitalManuallySet hvis den ikke eksisterer
    if (AppState.capitalManuallySet === undefined) {
      AppState.capitalManuallySet = false;
    }
    
    const capitalValue = Math.min(
      AppState.capitalManuallySet ? (AppState.inputCapital || 0) : (AppState.inputCapital ?? defaultInputCapital),
      initialPortfolioSize
    );
    capitalSlider.value = String(capitalValue);
    capitalOut.textContent = formatNOK(capitalValue);
    
    // Når brukeren drar i innskutt kapital-slideren, marker den som manuelt satt (frigjort)
    let isDragging = false;
    capitalSlider.addEventListener("mousedown", () => {
      isDragging = true;
      // Marker som manuelt satt så snart brukeren begynner å dra
      AppState.capitalManuallySet = true;
    });
    capitalSlider.addEventListener("input", () => {
      const v = Number(capitalSlider.value);
      capitalOut.textContent = formatNOK(v);
      AppState.inputCapital = v;
      // Marker som manuelt satt når brukeren interagerer med slideren
      AppState.capitalManuallySet = true;
      updateTopSummaries();
    });
    capitalSlider.addEventListener("mouseup", () => {
      isDragging = false;
    });
    capitalSlider.addEventListener("mouseleave", () => {
      isDragging = false;
    });
    
    AppState.inputCapital = capitalValue;
    capitalCol.appendChild(capitalSlider);
    capitalRow.appendChild(capitalCol);
    capitalRow.appendChild(capitalOut);
    thirdLeft.appendChild(capitalRow);

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
      if (el) {
        el.textContent = `${net.toFixed(2).replace('.', ',')}%`;
        // Trigger en custom event for å sikre at alle lyttere oppdager endringen
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      AppState.expectedReturnPct = net;
      
      // Kall updateInvestLoanCalc() direkte for å oppdatere "Verdi ved periodens slutt" umiddelbart
      // Dette sikrer at alle verdier hentes på nytt og beregnes korrekt med SLUTTVERDI
      try {
        updateInvestLoanCalc();
      } catch (e) {
        console.error('Feil ved oppdatering av kalkulasjon:', e);
      }
      
      // Bruk setTimeout for å sikre at DOM er oppdatert før updateTopSummaries kalles
      setTimeout(() => {
        updateTopSummaries();
      }, 0);
    }

    // Kall minst én gang ved init
    updateExpectedReturn();

    // Fyll høyre nederste boks: "Skatt"
    thirdRight.innerHTML = "";
    thirdRight.style.display = "flex";
    thirdRight.style.flexDirection = "column";
    thirdRight.style.gap = "0.486rem"; // ytterligere 10 % mindre luft mellom linjene
    thirdRight.style.paddingTop = "0.5rem";
    thirdRight.style.paddingBottom = "0.5rem";
    thirdRight.style.overflowY = "hidden";
    thirdRight.style.overflowX = "hidden";

    // Overskrift fjernet

    // Skjermingsrente slider (0–5%) midtstilt
    const shieldLabel = document.createElement("div");
    shieldLabel.className = "section-label";
    shieldLabel.textContent = "Skjermingsrente"; // Små bokstaver
    shieldLabel.style.fontSize = "0.75rem"; // 25% mindre
    thirdRight.appendChild(shieldLabel);

    const shieldRow = document.createElement("div");
    shieldRow.style.display = "grid";
    shieldRow.style.gridTemplateColumns = "1fr 110px";
    shieldRow.style.alignItems = "center";
    shieldRow.style.gap = "0.5rem";
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
    shieldOut.style.width = "110px";
    shieldOut.style.fontSize = "0.75rem";
    shieldOut.style.padding = "0.4rem 0.5rem";
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
      row.style.gridTemplateColumns = "1fr 30px";
      row.style.alignItems = "center";
      row.style.gap = "0.5rem";
      const col = document.createElement("div");
      col.style.display = "flex";
      col.style.alignItems = "center";
      const input = document.createElement("input");
      input.type = "text";
      input.value = Number(defaultValue).toFixed(2).replace('.', ','); // Vis med 2 desimaler
      input.style.width = "100%";
      input.style.border = "1px solid var(--BORDER_LIGHT)";
      input.style.borderRadius = "8px";
      input.style.boxShadow = "var(--shadow-sm)";
      input.style.padding = "0.4rem 0.5rem";
      input.style.background = "#ffffff";
      input.style.color = "var(--GRAY_TEXT_SECONDARY)"; // Samme farge som label
      input.style.fontWeight = "700"; // Bold
      input.style.fontSize = "0.75rem"; // Redusert font-størrelse
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
        } else if (labelText.includes("Skatt fondskonto første år")) {
          AppState.fundTaxFirstYearPct = v;
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
          } else if (labelText.includes("Skatt fondskonto første år")) {
            AppState.fundTaxFirstYearPct = v;
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
      } else if (labelText.includes("Skatt fondskonto første år")) {
        AppState.fundTaxFirstYearPct = v;
      }
      const suffix = document.createElement("div");
      suffix.textContent = "%";
      suffix.style.textAlign = "center";
      suffix.style.fontWeight = "700"; // Bold
      suffix.style.fontSize = "0.75rem"; // Redusert font-størrelse
      suffix.style.color = "var(--GRAY_TEXT_SECONDARY)"; // Samme farge som label
      row.appendChild(col);
      col.appendChild(input);
      row.appendChild(suffix);
      thirdRight.appendChild(row);
      return input;
    }

    makePercentInput("Utbytteskatt / Skatt aksjer (%)", AppState.stockTaxPct ?? 37.84);
    makePercentInput("Kapitalskatt (%)", AppState.capitalTaxPct || 22);
    makePercentInput("Skatt fondskonto første år (%)", AppState.fundTaxFirstYearPct || 37.84);

    // Ny slider: Rentekostnader (0–10%, default 5%)
    const intLabel = document.createElement("div");
    intLabel.className = "section-label";
    intLabel.textContent = "Rentekostnader"; // Små bokstaver
    intLabel.style.fontSize = "0.75rem"; // 25% mindre
    thirdRight.appendChild(intLabel);

    const intRow = document.createElement("div");
    intRow.style.display = "grid";
    intRow.style.gridTemplateColumns = "1fr 110px";
    intRow.style.alignItems = "center";
    intRow.style.gap = "0.5rem";
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
    intOut.style.width = "110px";
    intOut.style.fontSize = "0.75rem";
    intOut.style.padding = "0.4rem 0.5rem";
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

    // Avdragsprofil – rett under Rentekostnader (5–25 år)
    const repaymentProfileLabel = document.createElement("div");
    repaymentProfileLabel.className = "section-label";
    repaymentProfileLabel.textContent = "Avdragsprofil";
    repaymentProfileLabel.style.fontSize = "0.75rem";
    repaymentProfileLabel.style.margin = "0";
    repaymentProfileLabel.style.marginBottom = "0.25rem";
    thirdRight.appendChild(repaymentProfileLabel);

    const repaymentRow = document.createElement("div");
    repaymentRow.style.display = "grid";
    repaymentRow.style.gridTemplateColumns = "1fr 110px";
    repaymentRow.style.alignItems = "center";
    repaymentRow.style.gap = "0.5rem";
    repaymentRow.style.marginBottom = "0.75rem";
    const repaymentCol = document.createElement("div");
    repaymentCol.style.display = "flex";
    repaymentCol.style.alignItems = "center";
    const repaymentSlider = document.createElement("input");
    repaymentSlider.type = "range";
    repaymentSlider.className = "asset-range";
    repaymentSlider.id = "repayment-profile-slider";
    repaymentSlider.min = "5";
    repaymentSlider.max = "25";
    repaymentSlider.step = "1";
    repaymentSlider.value = String(AppState.repaymentProfileYears || 20);
    repaymentSlider.style.width = "100%";
    const repaymentOut = document.createElement("div");
    repaymentOut.className = "asset-amount";
    repaymentOut.style.width = "110px";
    repaymentOut.style.fontSize = "0.75rem";
    repaymentOut.style.padding = "0.4rem 0.5rem";
    repaymentOut.style.textAlign = "center";
    const repaymentValue = Number(repaymentSlider.value);
    repaymentOut.textContent = `${repaymentValue} år`;
    repaymentSlider.addEventListener("input", () => {
      repaymentOut.textContent = `${Number(repaymentSlider.value)} år`;
      AppState.repaymentProfileYears = Number(repaymentSlider.value);
      updateTopSummaries();
    });
    AppState.repaymentProfileYears = repaymentValue;
    repaymentCol.appendChild(repaymentSlider);
    repaymentRow.appendChild(repaymentCol);
    repaymentRow.appendChild(repaymentOut);
    thirdRight.appendChild(repaymentRow);

    // Avdragsfrihet (Ja/Nei) – samme layout som «Skattefradrag renter»
    const interestOnlyHeader = document.createElement("div");
    interestOnlyHeader.style.display = "flex";
    interestOnlyHeader.style.justifyContent = "space-between";
    interestOnlyHeader.style.alignItems = "center";
    interestOnlyHeader.style.marginBottom = "0.25rem";
    const interestOnlyTitle = document.createElement("div");
    interestOnlyTitle.className = "section-label";
    interestOnlyTitle.textContent = "Avdragsfrihet";
    interestOnlyTitle.style.fontSize = "0.75rem";
    interestOnlyTitle.style.margin = "0";
    interestOnlyHeader.appendChild(interestOnlyTitle);
    const interestOnlyBtns = document.createElement("div");
    interestOnlyBtns.style.display = "flex";
    interestOnlyBtns.style.alignItems = "center";
    interestOnlyBtns.style.gap = "0.5rem";

    const interestOnlyYesBtn = document.createElement("button");
    interestOnlyYesBtn.type = "button";
    interestOnlyYesBtn.setAttribute("aria-pressed", "false");
    interestOnlyYesBtn.setAttribute("aria-label", "Avdragsfrihet: Ja");

    const interestOnlyNoBtn = document.createElement("button");
    interestOnlyNoBtn.type = "button";
    interestOnlyNoBtn.setAttribute("aria-pressed", "false");
    interestOnlyNoBtn.setAttribute("aria-label", "Avdragsfrihet: Nei");
    
    // Initialiser AppState for avdragsfrihet hvis ikke satt
    if (AppState.interestOnly === undefined) {
      AppState.interestOnly = false; // Default: Nei
    }
    
    const updateInterestOnlyButtons = () => {
      const isYesActive = AppState.interestOnly === true;

      interestOnlyYesBtn.setAttribute("aria-pressed", isYesActive ? "true" : "false");
      interestOnlyNoBtn.setAttribute("aria-pressed", isYesActive ? "false" : "true");

      interestOnlyYesBtn.textContent = "Ja";
      interestOnlyNoBtn.textContent = "Nei";

      interestOnlyYesBtn.style.cssText = `
        appearance: none;
        border: 1px solid var(--BORDER_LIGHT);
        background: ${isYesActive ? "var(--P_ACCENT)" : "#ffffff"};
        color: ${isYesActive ? "#ffffff" : "var(--GRAY_TEXT_DARK)"};
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        min-width: 45px;
        text-align: center;
        box-shadow: var(--shadow-sm);
      `;

      interestOnlyNoBtn.style.cssText = `
        appearance: none;
        border: 1px solid var(--BORDER_LIGHT);
        background: ${!isYesActive ? "var(--P_ACCENT)" : "#ffffff"};
        color: ${!isYesActive ? "#ffffff" : "var(--GRAY_TEXT_DARK)"};
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        min-width: 45px;
        text-align: center;
        box-shadow: var(--shadow-sm);
      `;
    };
    
    updateInterestOnlyButtons();
    
    interestOnlyYesBtn.addEventListener("click", () => {
      AppState.interestOnly = true;
      updateInterestOnlyButtons();
      updateTopSummaries();
    });
    
    interestOnlyNoBtn.addEventListener("click", () => {
      AppState.interestOnly = false;
      updateInterestOnlyButtons();
      updateTopSummaries();
    });
    
    interestOnlyYesBtn.addEventListener("mouseenter", () => {
      if (AppState.interestOnly !== true) {
        interestOnlyYesBtn.style.background = "var(--BLUE_100)";
        interestOnlyYesBtn.style.borderColor = "var(--BLUE_300)";
      }
    });
    
    interestOnlyYesBtn.addEventListener("mouseleave", () => {
      if (AppState.interestOnly !== true) {
        interestOnlyYesBtn.style.background = "#ffffff";
        interestOnlyYesBtn.style.borderColor = "var(--BORDER_LIGHT)";
      }
    });
    
    interestOnlyNoBtn.addEventListener("mouseenter", () => {
      if (AppState.interestOnly !== false) {
        interestOnlyNoBtn.style.background = "var(--BLUE_100)";
        interestOnlyNoBtn.style.borderColor = "var(--BLUE_300)";
      }
    });
    
    interestOnlyNoBtn.addEventListener("mouseleave", () => {
      if (AppState.interestOnly !== false) {
        interestOnlyNoBtn.style.background = "#ffffff";
        interestOnlyNoBtn.style.borderColor = "var(--BORDER_LIGHT)";
      }
    });
    
    interestOnlyBtns.appendChild(interestOnlyYesBtn);
    interestOnlyBtns.appendChild(interestOnlyNoBtn);
    interestOnlyHeader.appendChild(interestOnlyBtns);
    thirdRight.appendChild(interestOnlyHeader);

    // Skattefradrag renter (Ja/Nei)
    const interestDeductionHeader = document.createElement("div");
    interestDeductionHeader.style.display = "flex";
    interestDeductionHeader.style.justifyContent = "space-between";
    interestDeductionHeader.style.alignItems = "center";
    interestDeductionHeader.style.marginBottom = "0.25rem";
    const interestDeductionTitle = document.createElement("div");
    interestDeductionTitle.className = "section-label";
    interestDeductionTitle.textContent = "Skattefradrag renter";
    interestDeductionTitle.style.fontSize = "0.75rem";
    interestDeductionTitle.style.margin = "0";
    interestDeductionHeader.appendChild(interestDeductionTitle);
    const interestDeductionBtns = document.createElement("div");
    interestDeductionBtns.style.display = "flex";
    interestDeductionBtns.style.alignItems = "center";
    interestDeductionBtns.style.gap = "0.5rem";
    const interestDeductionYesBtn = document.createElement("button");
    interestDeductionYesBtn.type = "button";
    interestDeductionYesBtn.setAttribute("aria-pressed", "false");
    interestDeductionYesBtn.setAttribute("aria-label", "Skattefradrag renter: Ja");
    const interestDeductionNoBtn = document.createElement("button");
    interestDeductionNoBtn.type = "button";
    interestDeductionNoBtn.setAttribute("aria-pressed", "false");
    interestDeductionNoBtn.setAttribute("aria-label", "Skattefradrag renter: Nei");
    if (AppState.interestTaxDeductionOnLoan === undefined) {
      AppState.interestTaxDeductionOnLoan = true;
    }
    const updateInterestDeductionButtons = () => {
      const isYes = AppState.interestTaxDeductionOnLoan !== false;
      interestDeductionYesBtn.setAttribute("aria-pressed", isYes ? "true" : "false");
      interestDeductionNoBtn.setAttribute("aria-pressed", isYes ? "false" : "true");
      interestDeductionYesBtn.textContent = "Ja";
      interestDeductionNoBtn.textContent = "Nei";
      interestDeductionYesBtn.style.cssText = `
        appearance: none;
        border: 1px solid var(--BORDER_LIGHT);
        background: ${isYes ? "var(--P_ACCENT)" : "#ffffff"};
        color: ${isYes ? "#ffffff" : "var(--GRAY_TEXT_DARK)"};
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        min-width: 45px;
        text-align: center;
        box-shadow: var(--shadow-sm);
      `;
      interestDeductionNoBtn.style.cssText = `
        appearance: none;
        border: 1px solid var(--BORDER_LIGHT);
        background: ${!isYes ? "var(--P_ACCENT)" : "#ffffff"};
        color: ${!isYes ? "#ffffff" : "var(--GRAY_TEXT_DARK)"};
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        min-width: 45px;
        text-align: center;
        box-shadow: var(--shadow-sm);
      `;
    };
    updateInterestDeductionButtons();
    const refreshAfterInterestDeductionToggle = () => {
      updateTopSummaries();
      try { updateDividendLoanCalc(); } catch (_) {}
      try { updateInvestLoanCalc(); } catch (_) {}
    };
    interestDeductionYesBtn.addEventListener("click", () => {
      AppState.interestTaxDeductionOnLoan = true;
      updateInterestDeductionButtons();
      refreshAfterInterestDeductionToggle();
    });
    interestDeductionNoBtn.addEventListener("click", () => {
      AppState.interestTaxDeductionOnLoan = false;
      updateInterestDeductionButtons();
      refreshAfterInterestDeductionToggle();
    });
    interestDeductionYesBtn.addEventListener("mouseenter", () => {
      if (AppState.interestTaxDeductionOnLoan !== true) {
        interestDeductionYesBtn.style.background = "var(--BLUE_100)";
        interestDeductionYesBtn.style.borderColor = "var(--BLUE_300)";
      }
    });
    interestDeductionYesBtn.addEventListener("mouseleave", () => {
      updateInterestDeductionButtons();
    });
    interestDeductionNoBtn.addEventListener("mouseenter", () => {
      if (AppState.interestTaxDeductionOnLoan !== false) {
        interestDeductionNoBtn.style.background = "var(--BLUE_100)";
        interestDeductionNoBtn.style.borderColor = "var(--BLUE_300)";
      }
    });
    interestDeductionNoBtn.addEventListener("mouseleave", () => {
      updateInterestDeductionButtons();
    });
    interestDeductionBtns.appendChild(interestDeductionYesBtn);
    interestDeductionBtns.appendChild(interestDeductionNoBtn);
    interestDeductionHeader.appendChild(interestDeductionBtns);
    thirdRight.appendChild(interestDeductionHeader);

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

function formatNOK(value) {
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(value);
}

function parseNokInput(text) {
  if (text == null) return NaN;
  const cleaned = String(text).trim().replace(/\s/g, "").replace(",", ".");
  const digits = cleaned.replace(/[^\d.-]/g, "");
  return Number(digits);
}

function enableNokDblclickEdit(el, getValue, setValue) {
  if (!el || el.dataset.nokEditBound === "1") return;
  el.dataset.nokEditBound = "1";
  el.classList.add("nok-editable");
  el.style.minWidth = "6.5rem";
  el.style.boxSizing = "border-box";
  el.title = "Klikk for å endre";
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", `${el.title}`);

  const startEditing = (e) => {
    if (e) e.stopPropagation();
    if (el.dataset.editing === "1") return;
    el.dataset.editing = "1";
    const currentValue = getValue();
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.value = String(Math.round(Number(currentValue) || 0));
    input.className = "nok-editable-input";
    input.style.color = el.style.color || "var(--GRAY_TEXT_DARK)";
    el.textContent = "";
    el.appendChild(input);
    input.focus();
    input.select();

    let finished = false;
    const finishEditing = (commit) => {
      if (finished) return;
      finished = true;
      delete el.dataset.editing;
      const raw = input.value;
      input.remove();
      if (commit) {
        const parsed = parseNokInput(raw);
        if (isFinite(parsed)) {
          setValue(Math.round(parsed));
          return;
        }
      }
      el.textContent = formatNOK(getValue());
    };

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        finishEditing(true);
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        finishEditing(false);
      }
    });
    input.addEventListener("blur", () => finishEditing(true));
  };

  el.addEventListener("click", startEditing);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startEditing(e);
    }
  });
}

function getSummaryExpectedReturnPct() {
  const el = document.getElementById("sum-equity");
  if (el && el.textContent) {
    const v = Number(String(el.textContent).replace("%", "").trim().replace(",", "."));
    if (isFinite(v)) return v;
  }
  if (isFinite(AppState.expectedReturnPct)) return Number(AppState.expectedReturnPct);
  return 0;
}

function getSummaryYears() {
  if (isFinite(AppState.yearsCount)) return Number(AppState.yearsCount);
  const el = document.getElementById("sum-cashflow");
  if (el && el.textContent) {
    const m = String(el.textContent).match(/(\d+)/);
    if (m) return Number(m[1]);
  }
  return 0;
}

function isRealisationTabActive() {
  const activeNav = document.querySelector(".nav-item.is-active");
  const section = (activeNav && activeNav.getAttribute("data-section")) || "";
  return section.trim() === "Realisasjon skatt 2026";
}

function parseNokFromEl(el) {
  if (!el) return NaN;
  return parseNokInput(el.textContent);
}

function formatDiffPct(pct) {
  if (!isFinite(pct)) return "0 %";
  const digits = Math.abs(pct) >= 1 ? 2 : 1;
  return `${pct.toFixed(digits).replace(".", ",")} %`;
}

function formatShortRatePct(pct) {
  if (!isFinite(pct)) return "0,00 %";
  return `${pct.toFixed(2).replace(".", ",")} %`;
}

function longRateToShortRatePct(longPct, years) {
  const n = Number(years);
  const long = Number(longPct) / 100;
  if (!isFinite(n) || n <= 0 || !isFinite(long)) return 0;
  const factor = 1 + long;
  if (factor <= 0) return (long / n) * 100;
  return (Math.pow(factor, 1 / n) - 1) * 100;
}

// Excel AVDRAG-funksjon (PMT)
// rate: rentesats per periode (desimal)
// nper: antall perioder
// pv: nåverdi (present value)
// fv: sluttverdi (future value, default 0)
// type: 0 for betaling i slutten av perioden, 1 for begynnelsen (default 0)
function calculatePMT(rate, nper, pv, fv = 0, type = 0) {
  if (rate === 0) {
    // Hvis rente er 0, er betalingen bare lånet delt på antall perioder
    return -(pv + fv) / nper;
  }
  
  const pvif = Math.pow(1 + rate, nper); // Present Value Interest Factor
  const pmt = (rate * (pv * pvif + fv)) / (pvif - 1);
  
  if (type === 1) {
    // Hvis betaling i begynnelsen av perioden
    return pmt / (1 + rate);
  }
  
  return pmt;
}

// Excel NÅVERDI-funksjon (PV)
// rate: rentesats per periode (desimal)
// nper: antall perioder
// pmt: utbetaling per periode (negative for utbetalinger)
// fv: sluttverdi (future value, default 0)
// type: 0 for betaling i slutten av perioden, 1 for begynnelsen (default 0)
function calculatePV(rate, nper, pmt, fv = 0, type = 0) {
  if (rate === 0) {
    // Hvis rente er 0, er nåverdien bare summen av betalinger pluss sluttverdi
    return -(pmt * nper + fv);
  }
  
  const pvif = Math.pow(1 + rate, -nper); // Present Value Interest Factor
  const pv = -(pmt * (1 - pvif) / rate + fv * pvif);
  
  if (type === 1) {
    // Hvis betaling i begynnelsen av perioden
    return pv * (1 + rate);
  }
  
  return pv;
}

// Excel SAMLET.RENTE-funksjon (CUMIPMT)
// rate: rentesats per periode (desimal)
// nper: antall perioder (totalt)
// pv: nåverdi (present value)
// start_period: startperiode (1-indeksert)
// end_period: sluttperiode (1-indeksert)
// type: 0 for betaling i slutten av perioden, 1 for begynnelsen (default 0)
function calculateCUMIPMT(rate, nper, pv, start_period, end_period, type = 0) {
  if (rate === 0) {
    // Hvis rente er 0, er total rente 0
    return 0;
  }
  
  if (start_period < 1 || end_period < start_period || end_period > nper) {
    return 0;
  }
  
  // Beregn PMT først
  const pmt = calculatePMT(rate, nper, pv, 0, type);
  
  // Beregn kumulativ rente fra start_period til end_period
  let totalInterest = 0;
  let balance = pv;
  
  for (let period = 1; period <= end_period; period++) {
    // Beregn rente for denne perioden
    const interest = balance * rate;
    
    // Beregn hovedstolbetaling for denne perioden
    const principal = pmt - interest;
    
    // Oppdater saldo
    balance = balance - principal;
    
    // Hvis perioden er innenfor start_period til end_period, legg til renten
    if (period >= start_period && period <= end_period) {
      totalInterest += interest;
    }
  }
  
  return -totalInterest; // Negativ fordi det er en kostnad
}

// Excel SLUTTVERDI-funksjon (FV)
// rate: rentesats per periode (desimal)
// nper: antall perioder
// pmt: utbetaling per periode (positive for utbetalinger, negative for innbetalinger)
// pv: nåverdi (present value, negative for investering)
// type: 0 for betaling i slutten av perioden, 1 for begynnelsen (default 0)
function calculateFV(rate, nper, pmt, pv, type = 0) {
  if (rate === 0) {
    // Hvis rente er 0, er sluttverdien bare nåverdi pluss summen av betalinger
    return pv + pmt * nper;
  }
  
  const fvif = Math.pow(1 + rate, nper); // Future Value Interest Factor
  let fv = pv * fvif + pmt * (1 + rate * type) * (fvif - 1) / rate;
  
  return fv;
}

// Oppdater kalkulasjonslisten i "Nedbetale lån" dersom den finnes på siden
function updateInvestLoanCalc() {
  // Sjekk om "Nedbetale lån" elementene finnes
  const elInvEndValue = document.getElementById('inv-left-endvalue');
  if (!elInvEndValue) return; // ikke i riktig fane

  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  // Hent antall år fra slideren hvis tilgjengelig, ellers fra AppState
  let years = 0;
  const yearsSlider = document.getElementById('input-years-slider');
  if (yearsSlider && yearsSlider.value) {
    years = Number(yearsSlider.value);
  } else if (isFinite(AppState.yearsCount)) {
    years = Number(AppState.yearsCount);
  }
  years = Math.max(0, years);
  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  const equitySharePct = typeof AppState.stockSharePercent === 'number' ? AppState.stockSharePercent : 0;

  // Beregn forventet avkastning nøyaktig (samme som i Input-fanen) i stedet for å bruke avrundet verdi
  const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
  const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
  const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
  const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
  const equityShare = equitySharePct / 100; // 0..1
  const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
  const expectedPct = grossExpected - fee - kpi; // Trekker fra både rådgivningshonorar og KPI

  // Hent "Forventet avkastning" direkte fra Input-fanen (samme verdi, to desimaler)
  const inputExpectedReturn = document.getElementById('expected-return-out');
  let expectedValue = "";
  if (inputExpectedReturn) {
    expectedValue = inputExpectedReturn.textContent.trim();
  } else {
    expectedValue = `${expectedPct.toFixed(2).replace('.', ',')} %`;
  }
  // Oppdater inv-left-expected hvis den finnes
  const elInvExpected = document.getElementById('inv-left-expected');
  if (elInvExpected) {
    elInvExpected.textContent = expectedValue;
  }
  // Oppdater også inv-left-portfolio hvis den finnes
  const elInvPortfolio = document.getElementById('inv-left-portfolio');
  if (elInvPortfolio) {
    elInvPortfolio.textContent = formatNOK(Math.round(portfolio));
  }
  // Oppdater også inv-left-capital hvis den finnes
  const elInvCapital = document.getElementById('inv-left-capital');
  if (elInvCapital) {
    let capital = 0;
    const capitalSliderEl = document.getElementById('input-capital-slider');
    if (capitalSliderEl && capitalSliderEl.value) {
      const v = Number(capitalSliderEl.value);
      if (isFinite(v)) capital = v;
    } else if (isFinite(AppState.inputCapital)) {
      capital = Number(AppState.inputCapital);
    }
    elInvCapital.textContent = formatNOK(Math.round(capital));
  }
  // Oppdater også inv-right-loan (lån = porteføljestørrelse) hvis den finnes
  const elInvRightLoan = document.getElementById('inv-right-loan');
  if (elInvRightLoan) {
    elInvRightLoan.textContent = formatNOK(Math.round(portfolio));
  }
  // Oppdater også inv-right-rate (rentekostnad) hvis den finnes
  const elInvRightRate = document.getElementById('inv-right-rate');
  if (elInvRightRate) {
    elInvRightRate.textContent = `${interestPct.toFixed(1).replace('.', ',')} %`;
  }
  // Beregn og oppdater "Uttak til renter og avdrag" med AVDRAG-funksjonen
  // VIKTIG: Beregn alltid annualPayment, uavhengig av om elementet finnes eller ikke
  // Dette er nødvendig for SLUTTVERDI-beregningen senere
  const elPayment = document.getElementById('inv-left-payment');
  let annualPayment = 0;
  
  // Hent verdier fra Input-fanen for å beregne annualPayment
  let repaymentYears = 20; // default
  const repaymentSliderEl = document.getElementById('repayment-profile-slider');
  if (repaymentSliderEl && repaymentSliderEl.value) {
    const v = Number(repaymentSliderEl.value);
    if (isFinite(v) && v > 0) repaymentYears = v;
  } else if (isFinite(AppState.repaymentProfileYears)) {
    repaymentYears = Number(AppState.repaymentProfileYears);
  }
  
  // Sjekk om avdragsfrihet er aktivert
  const interestOnly = AppState.interestOnly === true;
  
  // PMT-parametere:
  // rate: rentekostnad per år (konverter fra prosent til desimal)
  const rate = interestPct / 100;
  // nper: antall år (avdragsprofil)
  const nper = repaymentYears;
  // pv: porteføljestørrelse (nåverdi)
  const pv = portfolio;
  // fv: 0 (sluttverdi)
  const fv = 0;
  // type: 0 (betaling i slutten av perioden)
  const type = 0;
  
  // Beregn årlig betaling (resultatet blir negativt, så vi tar absoluttverdi)
  // Hvis avdragsfrihet er aktivert, beregn kun årlige renter
  if (interestOnly) {
    // Årlige renter = portfolio * rentesats
    annualPayment = portfolio * rate;
  } else {
    // Normal beregning med avdrag
    annualPayment = Math.abs(calculatePMT(rate, nper, pv, fv, type));
  }
  
  // Oppdater elementet hvis det finnes
  if (elPayment) {
    elPayment.textContent = formatNOK(Math.round(annualPayment));
    elPayment.style.color = "var(--error-600)";
  }
  
  // Oppdater "Årlig renter og avdrag per år" i høyre boksen med minus foran
  const elAnnualPayment = document.getElementById('inv-right-annual-payment');
  if (elAnnualPayment && annualPayment > 0) {
    elAnnualPayment.textContent = formatNOK(-Math.round(annualPayment));
    elAnnualPayment.style.color = "var(--error-600)";
  }
  
  // Beregn og oppdater "Renter totalt" med år-for-år akkumulering:
  // Beregner akkumulert rente for perioden "Antall år" basert på lån med "Avdragsprofil"
  const elTotalInterest = document.getElementById('inv-right-total-interest');
  let totalInterest = 0; // Deklarer utenfor if-blokken for å kunne bruke den senere
  if (elTotalInterest) {
    if (interestOnly) {
      // Hvis avdragsfrihet: årlige renter * antall år
      // Bruk minimum av "Antall år" og "Avdragsprofil" (lånet opphører etter avdragsprofil år)
      const payingYears = Math.min(years, repaymentYears);
      const annualInterest = portfolio * rate;
      totalInterest = -annualInterest * payingYears;
    } else {
      // Step 1: Annual Payment (AVDRAG) - allerede beregnet som annualPayment
      // annualPayment er allerede beregnet med: AVDRAG(rentekotnader; Avdragsprofil; -Porteføljestørrelse)
      
      // Step 2: Year-by-year loop for å akkumulere renter
      // Variabler:
      // - Porteføljestørrelse = portfolio
      // - rentekotnader = rate (interestPct / 100)
      // - Avdragsprofil = repaymentYears (brukes for å beregne PMT)
      // - Antall år = years (perioden vi akkumulerer renter for)
      let currentBalance = portfolio; // Start med full porteføljestørrelse
      let totalAccumulatedInterest = 0;
      const interestRate = rate; // rentekotnader (allerede beregnet som interestPct / 100)
      
      // Loop fra år 1 til minimum av "Antall år" og "Avdragsprofil"
      // Lånet opphører etter avdragsprofil år, så vi kan ikke betale renter etter det
      const payingYears = Math.min(years, repaymentYears);
      for (let year = 1; year <= payingYears; year++) {
        // Beregn rentekomponent for dette året
        const interestComponent = currentBalance * interestRate;
        
        // Beregn hovedstolkomponent (PMT - rente)
        const principalComponent = annualPayment - interestComponent;
        
        // Oppdater saldo (trekk fra hovedstolbetaling)
        currentBalance = currentBalance - principalComponent;
        
        // Akkumuler rente
        totalAccumulatedInterest += interestComponent;
      }
      
      // Step 3: Returner som negativ verdi (fordi det er en kostnad)
      totalInterest = -totalAccumulatedInterest;
    }
    
    elTotalInterest.textContent = formatNOK(Math.round(totalInterest));
    elTotalInterest.style.color = "var(--error-600)";
    
    // Beregn og oppdater "Fradrag rentekostnader" i venstre boks = -renter totalt × kapitalskatt (fra input)
    // Siden totalInterest er negativ (f.eks. -4220379), blir fradraget: -(-4220379) × kapitalskatt = 4220379 × kapitalskatt
    const elInterestDeduction = document.getElementById('inv-left-interest-deduction');
    if (elInterestDeduction) {
      if (AppState.interestTaxDeductionOnLoan === false) {
        elInterestDeduction.textContent = "kr 0,-";
      } else if (totalInterest < 0) {
        const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100;
        const interestDeduction = Math.abs(totalInterest) * capitalTaxRate;
        elInterestDeduction.textContent = formatNOK(Math.round(interestDeduction));
      } else {
        elInterestDeduction.textContent = formatNOK(0);
      }
    }
  }
  
  // Beregn og oppdater "Verdi ved periodens slutt" med SLUTTVERDI-funksjonen (fra Excel)
  // DENNE MÅ ALLTID OPPDATERES når forventet avkastning endres (f.eks. når aksjeandel endres)
  // VIKTIG: Denne funksjonen er ikke statisk, men oppdateres løpende for alle endringer i inputfanen
  const elEndValue = document.getElementById('inv-left-endvalue');
  let futureValue = 0;
  if (elEndValue) {
    // Beregn forventet avkastning ALLTID på nytt basert på nåværende verdier
    // Dette sikrer at vi alltid får riktig verdi uavhengig av aksjeandel
    // VIKTIG: Ikke bruk cached verdier, beregn alltid på nytt
    
    // Hent nåværende verdier direkte fra AppState
    const currentExpEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
    const currentExpBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
    const currentFee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
    const currentKpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
    
    // Hent aksjeandel - PRIORITET 1: Fra stockShareOption (mer pålitelig)
    let currentEquitySharePct = null;
    if (AppState.stockShareOption) {
      const m = String(AppState.stockShareOption).match(/(\d+)%/);
      if (m) {
        currentEquitySharePct = Number(m[1]);
      }
      if (/Renter/i.test(String(AppState.stockShareOption))) {
        currentEquitySharePct = 0;
      }
    }
    
    // PRIORITET 2: Fra stockSharePercent hvis ikke funnet
    if (currentEquitySharePct === null && typeof AppState.stockSharePercent === 'number') {
      currentEquitySharePct = AppState.stockSharePercent;
    }
    
    // PRIORITET 3: Fallback - hvis ingenting funnet, bruk standard 65%
    // VIKTIG: equitySharePct fra linje 2154 kan være 0 hvis stockSharePercent ikke er satt
    // I så fall må vi bruke 65% som standard
    if (currentEquitySharePct === null || currentEquitySharePct === undefined) {
      // Sjekk om equitySharePct er satt og > 0 (fra tidligere i funksjonen)
      if (typeof equitySharePct === 'number' && equitySharePct > 0) {
        currentEquitySharePct = equitySharePct;
      } else {
        // Standard 65% hvis ingenting funnet eller hvis equitySharePct er 0
        currentEquitySharePct = 65;
      }
    }
    
    // Beregn forventet avkastning på nytt med nåværende aksjeandel
    const currentEquityShare = currentEquitySharePct / 100;
    const currentGrossExpected = currentEquityShare * currentExpEquity + (1 - currentEquityShare) * currentExpBonds;
    const expectedReturnPct = currentGrossExpected - currentFee - currentKpi;
    
    // Hent avdragsprofil for den nye formelen
    let repaymentYearsForFV = 20; // default
    const repaymentSliderElForFV = document.getElementById('repayment-profile-slider');
    if (repaymentSliderElForFV && repaymentSliderElForFV.value) {
      const v = Number(repaymentSliderElForFV.value);
      if (isFinite(v) && v > 0) repaymentYearsForFV = v;
    } else if (isFinite(AppState.repaymentProfileYears)) {
      repaymentYearsForFV = Number(AppState.repaymentProfileYears);
    }
    
    // KORREKT FORMEL med to scenarier:
    // Scenario 1: antall_år <= avdragsprofil (lånet betales fortsatt)
    //   FV(rate=forventet_avkastning, nper=antall_år, pmt=-annualPayment, pv=-portfolio)
    // Scenario 2: antall_år > avdragsprofil (lånet er nedbetalt)
    //   1. Beregn verdi ved slutten av avdragsprofil-perioden
    //   2. Renters rente for resterende år
    
    const fvRate = expectedReturnPct / 100; // Forventet avkastning (konvertert fra prosent til desimal)
    // VIKTIG: For riktig beregning må vi bruke:
    // - PV = portfolio (positiv) og PMT = -annualPayment (negativ), ELLER
    // - PV = -portfolio (negativ) og PMT = annualPayment (positiv)
    // Vi bruker første variant for å få positiv FV direkte
    // Hvis avdragsfrihet: bruk kun årlige renter som PMT
    const fvPmt = annualPayment > 0 ? -annualPayment : 0; // Negativ fordi vi tar ut penger
    const fvPv = portfolio; // Positiv fordi det er startverdi
    const fvType = 0; // Type: 0 (betaling i slutten av perioden)
    
    if (interestOnly) {
      // Hvis avdragsfrihet: beregn verdi ved periodens slutt med kun renter som uttak
      // Vi tar ut kun renter hvert år, ikke avdrag
      // Bruk minimum av "Antall år" og "Avdragsprofil" (lånet opphører ikke ved avdragsfrihet, men vi stopper beregningen ved avdragsprofil)
      const payingYears = Math.min(years, repaymentYearsForFV);
      if (payingYears > 0) {
        futureValue = calculateFV(fvRate, payingYears, fvPmt, fvPv, fvType);
        // Hvis years > repaymentYearsForFV, fortsett vekst uten uttak
        if (years > repaymentYearsForFV) {
          const remainingYears = years - repaymentYearsForFV;
          futureValue = futureValue * Math.pow(1 + fvRate, remainingYears);
        }
      } else {
        futureValue = portfolio * Math.pow(1 + fvRate, years);
      }
    } else if (years <= repaymentYearsForFV) {
      // Scenario 1: Still paying down the loan
      // FV(rate=forventet_avkastning, nper=antall_år, pmt=-annualPayment, pv=portfolio)
      futureValue = calculateFV(fvRate, years, fvPmt, fvPv, fvType);
    } else {
      // Scenario 2: Loan is finished, money grows free
      // Step 1: Calculate balance at end of avdragsprofil period
      const balanceAtLoanEnd = calculateFV(fvRate, repaymentYearsForFV, fvPmt, fvPv, fvType);
      // Step 2: Compound the remaining balance for remaining years
      const remainingYears = years - repaymentYearsForFV;
      futureValue = balanceAtLoanEnd * Math.pow(1 + fvRate, remainingYears);
    }
    elEndValue.textContent = formatNOK(Math.round(futureValue));
    
    // Beregn og oppdater "Netto portefølje etter skatt" = Verdi ved periodens slutt - Skatt
    // Vi må vente til skatten er beregnet, så vi setter dette etterpå
  }
  
  // Beregn og oppdater "Restlån ved periodens slutt" med NÅVERDI-funksjonen
  const elRemainingLoan = document.getElementById('inv-right-remaining-loan');
  let remainingLoan = 0;
  if (elRemainingLoan) {
    if (interestOnly) {
      // Hvis avdragsfrihet er aktivert: restlån er uforandret (samme som opprinnelig lån)
      remainingLoan = portfolio;
    } else {
      // Hent avdragsprofil fra Input-fanen for å sjekke om lånet er nedbetalt
      let repaymentYears = 20; // default
      const repaymentSliderEl = document.getElementById('repayment-profile-slider');
      if (repaymentSliderEl && repaymentSliderEl.value) {
        const v = Number(repaymentSliderEl.value);
        if (isFinite(v) && v > 0) repaymentYears = v;
      } else if (isFinite(AppState.repaymentProfileYears)) {
        repaymentYears = Number(AppState.repaymentProfileYears);
      }
      
      // Hvis antall år >= avdragsprofil, er lånet fullstendig nedbetalt (restlån = 0)
      if (years >= repaymentYears) {
        remainingLoan = 0;
      } else {
        // Beregn restlån med NÅVERDI-funksjonen
        // Vi beregner hvor mye som gjenstår etter "years" år med betalinger
        // Rente: rentekostnad fra input-fanen
        const rate = interestPct / 100;
        // Antall utbetalinger: Antall år som gjenstår (avdragsprofil - antall år)
        const remainingYears = repaymentYears - years;
        const nper = remainingYears;
        // Utbetaling: fra "Uttak til renter og avdrag" (med minus)
        const pmt = -annualPayment; // Negativ fordi det er utbetaling
        // Sluttverdi: 0
        const fv = 0;
        // Type: 0 (tom, betaling i slutten av perioden)
        const type = 0;
        
        // Beregn restlån ved periodens slutt (hvor mye gjenstår etter "years" år)
        remainingLoan = Math.abs(calculatePV(rate, nper, pmt, fv, type));
      }
    }
    
    elRemainingLoan.textContent = formatNOK(Math.round(remainingLoan));
    
    // Oppdater "Oppgjør gjeld" i venstre boks
    const elDebtSettle = document.getElementById('inv-left-debt-settle');
    if (elDebtSettle) {
      if (interestOnly) {
        // Hvis avdragsfrihet: Oppgjør gjeld = opprinnelig lån med minus foran
        elDebtSettle.textContent = formatNOK(-Math.round(portfolio));
        elDebtSettle.style.color = "var(--error-600)";
      } else if (remainingLoan > 0) {
        // Normal: Oppgjør gjeld = Restlån ved periodens slutt med minus foran
        elDebtSettle.textContent = formatNOK(-Math.round(remainingLoan));
        elDebtSettle.style.color = "var(--error-600)";
      } else {
        elDebtSettle.textContent = formatNOK(0);
        elDebtSettle.style.color = "var(--error-600)";
      }
    }
  }
  
  // Beregn og oppdater "Avkastning:" = Verdi ved periodens slutt - Restlån ved periodens slutt
  const elAvkastningDiff = document.getElementById('inv-left-avkastning-diff');
  if (elAvkastningDiff) {
    const diffValue = futureValue - remainingLoan;
    const roundedDiff = Math.round(diffValue);
    let formattedDiff;
    if (roundedDiff < 0) {
      const absValue = Math.abs(roundedDiff);
      const absFormatted = formatNOK(absValue);
      const cleanFormatted = absFormatted.replace(/^[\s\u00A0\-−]+/, '').trim();
      formattedDiff = '−' + cleanFormatted;
    } else {
      formattedDiff = formatNOK(roundedDiff);
    }
    elAvkastningDiff.textContent = formattedDiff;
    elAvkastningDiff.innerHTML = formattedDiff;
  }
  
  // Beregn og oppdater "Rest innskutt kapital" med SLUTTVERDI-funksjonen
  const elRestCapital = document.getElementById('inv-left-rest-capital');
  if (elRestCapital && annualPayment > 0) {
    // Hent innskutt kapital fra Input-fanen
    let capital = 0;
    const capitalSliderEl = document.getElementById('input-capital-slider');
    if (capitalSliderEl && capitalSliderEl.value) {
      const v = Number(capitalSliderEl.value);
      if (isFinite(v)) capital = v;
    } else if (isFinite(AppState.inputCapital)) {
      capital = Number(AppState.inputCapital);
    }
    
    // Hent skjermingsrente fra Input-fanen
    let shieldRatePct = 3.9; // default
    const shieldSliderEl = document.getElementById('shield-rate-slider');
    if (shieldSliderEl && shieldSliderEl.value) {
      const v = Number(shieldSliderEl.value);
      if (isFinite(v)) shieldRatePct = v;
    } else if (isFinite(AppState.shieldRatePct)) {
      shieldRatePct = Number(AppState.shieldRatePct);
    }
    
    // FV-parametere for "Rest innskutt kapital":
    // Rente: skjermingsrenten fra input-fanen
    const restRate = shieldRatePct / 100;
    // Antall utbetalinger: Antall år fra input-fanen
    const restNper = years;
    // Utbetaling: fra "Uttak til renter og avdrag" (med minus først)
    const restPmt = -annualPayment; // Negativ fordi det er utbetaling
    // Nåverdi: innskutt kapital fra input-fanen
    const restPv = capital;
    // Type: 0
    const restType = 0;
    
    // Beregn rest innskutt kapital med SLUTTVERDI
    // Hvis innskutt kapital er 0 eller negativ, vis 0
    let restCapitalValue = 0;
    if (capital <= 0) {
      elRestCapital.textContent = formatNOK(0);
      restCapitalValue = 0;
    } else {
      const restCapital = -calculateFV(restRate, restNper, restPmt, restPv, restType);
      // Hvis verdien blir negativ, vis 0
      restCapitalValue = Math.max(0, Math.round(restCapital));
      elRestCapital.textContent = formatNOK(restCapitalValue);
    }
    
    // Beregn og oppdater "Skatt" basert på "Avkastning:"-linjen × ((Aksjeandel × 0,3784) + ((1 - Aksjeandel) × 0,22))
    let taxAmount = 0; // Deklarer utenfor if-blokken for å kunne bruke den senere
    const elTax = document.getElementById('inv-left-tax');
    if (elTax) {
      // Hent verdien fra "Avkastning:"-linjen
      let avkastningDiffValue = 0;
      const elAvkastningDiff = document.getElementById('inv-left-avkastning-diff');
      if (elAvkastningDiff && elAvkastningDiff.textContent) {
        let avkastningText = elAvkastningDiff.textContent.trim();
        // Sjekk om verdien er negativ (kan ha minus-tegn eller Unicode minus U+2212)
        const isNegative = avkastningText.includes('-') || avkastningText.includes('−');
        // Fjern alle tegn bortsett fra tall
        avkastningText = avkastningText.replace(/[^\d]/g, '');
        avkastningDiffValue = parseFloat(avkastningText) || 0;
        // Legg til minus hvis verdien var negativ
        if (isNegative) {
          avkastningDiffValue = -Math.abs(avkastningDiffValue);
        }
      }
      
      // Hent aksjeandel fra Input-fanen
      let equitySharePct = 65; // default
      if (typeof AppState.stockSharePercent === 'number') {
        equitySharePct = AppState.stockSharePercent;
      } else if (AppState.stockShareOption) {
        const m = String(AppState.stockShareOption).match(/(\d+)%/);
        if (m) equitySharePct = Number(m[1]);
        if (/Renter/i.test(String(AppState.stockShareOption))) equitySharePct = 0;
      }
      
      // Konverter aksjeandel til desimal (0-1) for beregning
      const aksjeAndel = equitySharePct / 100;
      
      // Hent skattesatser fra Input-fanen
      const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100; // Konverter prosent til desimal
      const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100; // Konverter prosent til desimal
      
      // Beregn skatt: -Avkastning × ((Aksjeandel × Utbytteskatt) + ((1 - Aksjeandel) × Kapitalskatt))
      // Hvis avkastning er negativ, blir skatt positiv (skattefordel, grønn)
      // Hvis avkastning er positiv, blir skatt negativ (skattekostnad, rød)
      const taxRate = (aksjeAndel * stockTaxRate) + ((1 - aksjeAndel) * capitalTaxRate);
      taxAmount = -avkastningDiffValue * taxRate;
      // Ekstra sjekk: Hvis avkastning er negativ, må skatt være positiv
      if (avkastningDiffValue < 0 && taxAmount < 0) {
        taxAmount = Math.abs(taxAmount);
      }
      // Ekstra sjekk: Hvis avkastning er positiv, må skatt være negativ
      if (avkastningDiffValue > 0 && taxAmount > 0) {
        taxAmount = -taxAmount;
      }
      const roundedTax = Math.round(taxAmount);
      elTax.textContent = formatNOK(roundedTax);
      
      // Sett farge: grønn hvis positiv (skattefordel), rød hvis negativ (skattekostnad)
      const taxColor = roundedTax >= 0 ? "var(--success-600)" : "var(--error-600)"; // Grønn eller rød
      elTax.style.color = taxColor;
      
      // Oppdater også etiketten "Skatt" med samme farge
      const taxRow = elTax.parentElement;
      if (taxRow) {
        const taxLabel = taxRow.querySelector('span:first-child');
        if (taxLabel) {
          taxLabel.style.color = taxColor;
        }
      }
      
      // Beregn og oppdater "Netto portefølje etter skatt" = Verdi ved periodens slutt + Skatt
      // Hent "Verdi ved periodens slutt" fra DOM (den er allerede beregnet tidligere i funksjonen)
      const elNetPortfolio = document.getElementById('inv-left-net');
      if (elNetPortfolio) {
        // Hent "Verdi ved periodens slutt" fra DOM eller bruk futureValue hvis tilgjengelig
        let futureValueForNet = futureValue;
        if (futureValueForNet === 0) {
          const elEndValueForNet = document.getElementById('inv-left-endvalue');
          if (elEndValueForNet && elEndValueForNet.textContent) {
            const endValueText = elEndValueForNet.textContent.trim().replace(/[^\d,-]/g, '').replace(/\s/g, '').replace(',', '');
            futureValueForNet = parseFloat(endValueText) || 0;
          }
        }
        // Beregn "Netto portefølje etter skatt" = Verdi ved periodens slutt + Skatt
        // Hvis skatt er positiv (fordel), legger vi den til. Hvis skatt er negativ (kostnad), trekker vi den fra.
        // Dette kan bli negativt, så vi fjerner Math.max(0, ...)
        const netPortfolioAfterTax = Math.round(futureValueForNet + taxAmount);
        elNetPortfolio.textContent = formatNOK(netPortfolioAfterTax);
      }
    } else if (elTax) {
      elTax.textContent = formatNOK(0);
      elTax.style.color = "var(--error-600)";
      taxAmount = 0; // Sett til 0 hvis skatt er 0
      
      // Hvis skatt er 0, er "Netto portefølje etter skatt" = Verdi ved periodens slutt
      const elNetPortfolio = document.getElementById('inv-left-net');
      if (elNetPortfolio) {
        // Hent "Verdi ved periodens slutt" fra DOM hvis tilgjengelig
        const elEndValue = document.getElementById('inv-left-endvalue');
        if (elEndValue && elEndValue.textContent) {
          let endValueText = elEndValue.textContent.trim();
          // Sjekk om verdien er negativ (kan ha minus-tegn eller Unicode minus U+2212)
          const isNegative = endValueText.includes('-') || endValueText.includes('−');
          // Fjern alle tegn bortsett fra tall
          endValueText = endValueText.replace(/[^\d]/g, '');
          let futureValueFromDOM = parseFloat(endValueText) || 0;
          // Legg til minus hvis verdien var negativ
          if (isNegative) {
            futureValueFromDOM = -Math.abs(futureValueFromDOM);
          }
          // Beregn "Netto portefølje etter skatt" = Verdi ved periodens slutt + Skatt
          // Hvis skatt er positiv (fordel), legger vi den til. Hvis skatt er negativ (kostnad), trekker vi den fra.
          const netPortfolioAfterTax = Math.round(futureValueFromDOM + taxAmount);
          elNetPortfolio.textContent = formatNOK(netPortfolioAfterTax);
        } else {
          // Hvis ingen verdi, sett til 0 minus skatt (som er 0)
          elNetPortfolio.textContent = formatNOK(0);
        }
      }
    }
  }
  
  // Beregn og oppdater "Netto portefølje etter skatt" = Verdi ved periodens slutt + Skatt
  // Hvis skatt er positiv (fordel), legger vi den til. Hvis skatt er negativ (kostnad), trekker vi den fra.
  // Dette kan bli negativt, så vi fjerner Math.max(0, ...) og sjekken på futureValue > 0
  // Hvis ikke allerede satt ovenfor
  const elNetPortfolio = document.getElementById('inv-left-net');
  if (elNetPortfolio && (!elNetPortfolio.textContent || !elNetPortfolio.textContent.trim())) {
    // Hvis ikke allerede satt, beregn den nå
    const netPortfolioAfterTax = Math.round(futureValue + taxAmount);
    elNetPortfolio.textContent = formatNOK(netPortfolioAfterTax);
  }
  
  // Beregn og oppdater "Netto avkastning" i venstre boks = Netto portefølje etter skatt + Oppgjør gjeld + Fradrag rentekostnader
  // VIKTIG: Beregn dette ved å bruke de beregnede variablene direkte, ikke parse fra DOM
  const elNetReturn = document.getElementById('inv-left-net-return');
  if (elNetReturn) {
    // Hent verdiene fra DOM hvis tilgjengelige, ellers bruk beregnede verdier
    let netPortfolioAfterTax = 0;
    const elNetPortfolio = document.getElementById('inv-left-net');
    if (elNetPortfolio && elNetPortfolio.textContent && elNetPortfolio.textContent.trim()) {
      let netText = elNetPortfolio.textContent.trim();
      const isNegative = netText.startsWith('-') || netText.startsWith('−');
      netText = netText.replace(/[^\d]/g, '');
      netPortfolioAfterTax = parseFloat(netText) || 0;
      if (isNegative && netPortfolioAfterTax > 0) netPortfolioAfterTax = -netPortfolioAfterTax;
    } else {
      // Fallback: beregn fra futureValue og taxAmount
      // Hvis skatt er positiv (fordel), legger vi den til. Hvis skatt er negativ (kostnad), trekker vi den fra.
      const taxAmountValue = (taxAmount !== undefined && taxAmount !== null) ? taxAmount : 0;
      netPortfolioAfterTax = Math.round(futureValue + taxAmountValue);
      // Oppdater også DOM-elementet
      if (elNetPortfolio) {
        elNetPortfolio.textContent = formatNOK(netPortfolioAfterTax);
      }
    }
    
    // Oppgjør gjeld = -remainingLoan (negativ verdi)
    let debtSettle = 0;
    const elDebtSettle = document.getElementById('inv-left-debt-settle');
    if (elDebtSettle && elDebtSettle.textContent && elDebtSettle.textContent.trim()) {
      let debtText = elDebtSettle.textContent.trim();
      const isNegative = debtText.startsWith('-') || debtText.startsWith('−');
      debtText = debtText.replace(/[^\d]/g, '');
      debtSettle = parseFloat(debtText) || 0;
      if (isNegative && debtSettle > 0) debtSettle = -debtSettle;
    } else {
      debtSettle = remainingLoan > 0 ? -remainingLoan : 0;
    }
    
    // Fradrag rentekostnader = |totalInterest| × kapitalskatt (fra input), eller 0 hvis «Skattefradrag renter» = Nei
    let interestDeduction = 0;
    const elInterestDeduction = document.getElementById('inv-left-interest-deduction');
    if (AppState.interestTaxDeductionOnLoan === false) {
      interestDeduction = 0;
    } else if (elInterestDeduction && elInterestDeduction.textContent && elInterestDeduction.textContent.trim()) {
      let interestText = elInterestDeduction.textContent.trim().replace(/[^\d]/g, '');
      interestDeduction = parseFloat(interestText) || 0;
    } else {
      if (totalInterest !== 0 && totalInterest !== undefined && totalInterest !== null) {
        const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100;
        interestDeduction = Math.abs(totalInterest) * capitalTaxRate;
      }
    }
    
    // Beregn netto avkastning = Netto portefølje etter skatt + Oppgjør gjeld + Fradrag rentekostnader
    // Merk: Oppgjør gjeld er negativ (f.eks. -6 196 120), så når vi legger det til, trekker vi faktisk fra
    // Formelen blir: netPortfolioAfterTax + debtSettle + interestDeduction
    const netReturnValue = netPortfolioAfterTax + debtSettle + interestDeduction;
    // Alltid vis verdien, selv om den er 0 - force sett verdien
    const formattedValue = formatNOK(Math.round(netReturnValue));
    elNetReturn.textContent = formattedValue;
    elNetReturn.innerHTML = formattedValue; // Bruk også innerHTML som backup
    // Trigger en reflow for å sikre at endringen vises
    void elNetReturn.offsetHeight;
    
    // Oppdater "Avkastning utover lånekostnad" i høyre boks = Netto avkastning fra venstre boks
    const elExcessReturn = document.getElementById('inv-right-excess-return');
    if (elExcessReturn) {
      // Hent "Netto avkastning" direkte fra venstre boks (den er nettopp beregnet)
      const excessValue = formattedValue; // Bruk samme formaterte verdi
      elExcessReturn.textContent = excessValue;
      elExcessReturn.innerHTML = excessValue; // Bruk også innerHTML som backup
      // Trigger en reflow for å sikre at endringen vises
      void elExcessReturn.offsetHeight;
    }
  }
  
  // Sikre at verdiene er satt ved å kjøre en ekstra oppdatering med setTimeout
  // Dette sikrer at verdiene vises selv om de ikke var klare ved første kjøring
  setTimeout(() => {
    const elNetReturnDelayed = document.getElementById('inv-left-net-return');
    if (elNetReturnDelayed) {
      // Hjelpefunksjon for å parse formatNOK-verdier
      function parseFormattedValue(el) {
        if (!el || !el.textContent || !el.textContent.trim()) return null;
        let text = el.textContent.trim();
        const isNegative = text.startsWith('-') || text.startsWith('−');
        text = text.replace(/[^\d]/g, '');
        const value = parseFloat(text);
        if (isNaN(value)) return null;
        return isNegative ? -value : value;
      }
      
      // Hent verdiene fra DOM
      const elNetPortfolioDelayed = document.getElementById('inv-left-net');
      const elDebtSettleDelayed = document.getElementById('inv-left-debt-settle');
      const elInterestDeductionDelayed = document.getElementById('inv-left-interest-deduction');
      const elEndValueDelayed = document.getElementById('inv-left-endvalue');
      const elTaxDelayed = document.getElementById('inv-left-tax');
      const elRemainingLoanDelayed = document.getElementById('inv-right-remaining-loan');
      const elTotalInterestDelayed = document.getElementById('inv-right-total-interest');
      
      // Parse alle verdier fra DOM
      let netPortfolioDelayed = parseFormattedValue(elNetPortfolioDelayed);
      let debtSettleDelayed = parseFormattedValue(elDebtSettleDelayed);
      let interestDeductionDelayed = parseFormattedValue(elInterestDeductionDelayed);
      
      // Hvis verdiene ikke finnes i DOM, beregn dem på nytt fra kildene
      if (netPortfolioDelayed === null) {
        const endValue = parseFormattedValue(elEndValueDelayed);
        const tax = parseFormattedValue(elTaxDelayed);
        if (endValue !== null && tax !== null) {
          netPortfolioDelayed = Math.max(0, endValue - tax);
        } else {
          netPortfolioDelayed = 0;
        }
      }
      
      if (debtSettleDelayed === null) {
        const remainingLoan = parseFormattedValue(elRemainingLoanDelayed);
        if (remainingLoan !== null && remainingLoan > 0) {
          debtSettleDelayed = -remainingLoan;
        } else {
          debtSettleDelayed = 0;
        }
      }
      
      if (interestDeductionDelayed === null) {
        if (AppState.interestTaxDeductionOnLoan === false) {
          interestDeductionDelayed = 0;
        } else {
          const totalInterest = parseFormattedValue(elTotalInterestDelayed);
          if (totalInterest !== null) {
            const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100;
            interestDeductionDelayed = Math.abs(totalInterest) * capitalTaxRate;
          } else {
            interestDeductionDelayed = 0;
          }
        }
      }
      
      // Beregn netto avkastning
      const netReturnValueDelayed = (netPortfolioDelayed || 0) + (debtSettleDelayed || 0) + (interestDeductionDelayed || 0);
      const formattedValueDelayed = formatNOK(Math.round(netReturnValueDelayed));
      elNetReturnDelayed.textContent = formattedValueDelayed;
      elNetReturnDelayed.innerHTML = formattedValueDelayed; // Bruk også innerHTML som backup
      // Trigger en reflow for å sikre at endringen vises
      void elNetReturnDelayed.offsetHeight;
      
      // Oppdater også høyre boks
      const elExcessReturnDelayed = document.getElementById('inv-right-excess-return');
      if (elExcessReturnDelayed) {
        elExcessReturnDelayed.textContent = formattedValueDelayed;
        elExcessReturnDelayed.innerHTML = formattedValueDelayed; // Bruk også innerHTML som backup
        // Trigger en reflow for å sikre at endringen vises
        void elExcessReturnDelayed.offsetHeight;
      }
    }
  }, 200);

  const visGrafiskModal = document.getElementById("vis-grafisk-modal");
  if (visGrafiskModal && !visGrafiskModal.hasAttribute("hidden") && typeof window.drawVisGrafiskChart === "function") {
    window.drawVisGrafiskChart();
  }
}

// Oppdater kalkulasjonslisten i "Utbetale utbytte" dersom den finnes på siden
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
  const elInterestDeduction = document.getElementById('div-interest-deduction');
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
    if (label) {
      label.textContent = `Status om ${years} år:`;
      label.style.fontWeight = "700";
    }
  }
  if (elRDividendHeader && elRDividendHeader.parentElement) {
    const label = elRDividendHeader.parentElement.firstElementChild;
    if (label) label.textContent = "Utbytte i dag:";
  }
  if (elRStatusHeader && elRStatusHeader.parentElement) {
    const label = elRStatusHeader.parentElement.firstElementChild;
    if (label) {
      label.textContent = `Status om ${years} år:`;
      label.style.fontWeight = "700";
    }
  }
  // Oppdater etikett for rentekostnader til å inkludere år (label er første child av parent row)
  if (elInterestCosts && elInterestCosts.parentElement) {
    const label = elInterestCosts.parentElement.firstElementChild;
    if (label) label.textContent = `Rentekostnader i ${years} år`;
  }
  if (elRInterestCosts && elRInterestCosts.parentElement) {
    const rInterestLabel = elRInterestCosts.parentElement.firstElementChild;
    if (rInterestLabel) rInterestLabel.textContent = `Rentekostnader i ${years} år`;
  }

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

  // Utbytteskatt = porteføljestørrelse × (utbytteskatt/skatt aksjer fra input)
  const dividendTaxRate = (AppState.stockTaxPct ?? 37.84) / 100; // Konverter prosent til desimal
  const dividendTax = portfolio * dividendTaxRate;
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

  // Nedbetalt gjeld (venstre) = Netto i parentes
  if (elLoanStatus) elLoanStatus.textContent = `(${formatNOK(Math.round(dividendNet))})`;
  if (elLoanStatus && elLoanStatus.parentElement) {
    const loanLabelL = elLoanStatus.parentElement.firstElementChild;
    if (loanLabelL) loanLabelL.textContent = "Nedbetalt gjeld";
  }
  // Høyre panel: Lån = Netto fra høyre tabell
  if (elRLoan) elRLoan.textContent = `(${formatNOK(Math.round(dividendNet))})`;
  if (elRLoan && elRLoan.parentElement) {
    const loanLabelR = elRLoan.parentElement.firstElementChild;
    if (loanLabelR) loanLabelR.textContent = "Nedbetalt gjeld";
  }

  // Venstre rentelinje: sats fra Input «Rentekostnader»; formel netto×(1+sats)^år − netto
  let interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  const interestSliderEl = document.getElementById("interest-cost-slider");
  if (interestSliderEl && interestSliderEl.value !== "") {
    const v = Number(interestSliderEl.value);
    if (isFinite(v)) interestPct = v;
  }
  const interestRateLoan = interestPct / 100;
  // Netto × (1 + rentekostnad)^år − netto (rentesats fra Input «Rentekostnader»)
  const interestCostsTotal = dividendNet * Math.pow(1 + interestRateLoan, years) - dividendNet;
  if (elInterestCosts) elInterestCosts.textContent = formatNOK(Math.round(interestCostsTotal));
  if (elRInterestCosts) elRInterestCosts.textContent = "kr 0,-";

  const capitalTaxDec = (AppState.capitalTaxPct ?? 22) / 100;
  const interestTaxDeduction =
    AppState.interestTaxDeductionOnLoan !== false ? interestCostsTotal * capitalTaxDec : 0;
  const elRInterestDeduction = document.getElementById('r-interest-deduction');
  if (elInterestDeduction) {
    elInterestDeduction.textContent =
      AppState.interestTaxDeductionOnLoan !== false
        ? formatNOK(Math.round(interestTaxDeduction))
        : "kr 0,-";
  }
  if (elRInterestDeduction) elRInterestDeduction.textContent = "kr 0,-";

  // Sum (venstre) = Restportefølje − rentekostnader + skattefradrag rentekostnader
  const sum = remainingPortfolio - interestCostsTotal + interestTaxDeduction;
  if (elSum) elSum.textContent = formatNOK(Math.round(sum));
  if (elRSum) elRSum.textContent = "kr 0,-";
  
  // Forskjell mellom å beholde Vs. å utbetale = Sum (venstre) - Sum (høyre)
  const elDifference = document.getElementById('div-difference');
  const difference = sum;
  if (elDifference) elDifference.textContent = formatNOK(Math.round(difference));

  const visGrafiskModal = document.getElementById("vis-grafisk-modal");
  if (visGrafiskModal && !visGrafiskModal.hasAttribute("hidden") && typeof window.drawVisGrafiskChart === "function") {
    window.drawVisGrafiskChart();
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
  let exp = typeof AppState.expectedReturnPct === 'number' ? AppState.expectedReturnPct : 0;
  
  // Hvis forventet avkastning ikke er satt eller er 0, beregn den basert på nåværende verdier
  if (!exp || exp === 0) {
    const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
    const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
    const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
    const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
    
    // Hent aksjeandel
    let equitySharePct = typeof AppState.stockSharePercent === 'number' ? AppState.stockSharePercent : 65;
    if (equitySharePct <= 0 && AppState.stockShareOption) {
      const m = String(AppState.stockShareOption).match(/(\d+)%/);
      equitySharePct = m ? Number(m[1]) : 65;
      if (/Renter/i.test(String(AppState.stockShareOption))) equitySharePct = 0;
    }
    if (!equitySharePct || equitySharePct <= 0) equitySharePct = 65; // Standard 65% hvis ikke satt
    
    const equityShare = equitySharePct / 100;
    const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
    exp = grossExpected - fee - kpi;
    
    // Oppdater AppState med den beregnede verdien
    AppState.expectedReturnPct = exp;
  }
  
  const elE = document.getElementById('sum-equity');
  if (elE) elE.textContent = `${exp.toFixed(2).replace('.', ',')} %`;

  // Antall år
  const years = typeof AppState.yearsCount === 'number' ? AppState.yearsCount : 0;
  const elC = document.getElementById('sum-cashflow');
  if (elC) elC.textContent = `${years} år`;

  // Oppdater kalkulasjon (hvis aktuell fane)
  try { updateInvestLoanCalc(); } catch (_) {}
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
      
      // Beregn skatt for venstre side: Gevinst × Skatt fondskonto første år (%)
      const fundTaxFirstYearPct = AppState.fundTaxFirstYearPct || 37.84;
      const taxRateLeft = fundTaxFirstYearPct / 100; // Konverter prosent til desimal
      const taxLeftFromInput = Math.round(gain * taxRateLeft);

      const activeNav = document.querySelector(".nav-item.is-active");
      const activeSection = (activeNav && activeNav.getAttribute("data-section")) || "";
      const isRealisationTab = activeSection.trim() === "Realisasjon skatt 2026";
      const capitalLeft = isRealisationTab
        ? (Number.isFinite(Number(AppState.realisationRedeemAmount)) ? Number(AppState.realisationRedeemAmount) : 2000000)
        : capital;
      const gainLeft = isRealisationTab
        ? (Number.isFinite(Number(AppState.realisationGain)) ? Number(AppState.realisationGain) : 800000)
        : gain;
      const taxLeft = isRealisationTab
        ? (Number.isFinite(Number(AppState.realisationTax)) ? Number(AppState.realisationTax) : 302720)
        : taxLeftFromInput;

      const elLP = document.getElementById("fk-left-portfolio");
      const elLG = document.getElementById("fk-left-gain");
      const elLT = document.getElementById("fk-left-tax");
      const elLNet = document.getElementById("fk-left-net");
      const elRP = document.getElementById("fk-right-portfolio");
      const elRG = document.getElementById("fk-right-gain");
      const elRT = document.getElementById("fk-right-tax");
      const elRNet = document.getElementById("fk-right-net");
      const elNRNow = document.getElementById("fk-right-net-now");

      if (elLP) elLP.textContent = formatNOK(Math.round(portfolio));
        if (elRP) elRP.textContent = formatNOK(Math.round(portfolio));
      if (elLeftCap && elLeftCap.dataset.editing !== "1") elLeftCap.textContent = formatNOK(capitalLeft);
      if (elRightCap) elRightCap.textContent = formatNOK(isRealisationTab ? capitalLeft : capital);
      if (elLG && elLG.dataset.editing !== "1") elLG.textContent = formatNOK(gainLeft);
      if (elRG) elRG.textContent = formatNOK(isRealisationTab ? gainLeft : gain);
      if (elLT && elLT.dataset.editing !== "1") { 
        elLT.textContent = formatNOK(taxLeft); 
        elLT.style.color = "var(--error-600)"; 
        elLT.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
      }
      const netLeft = Math.max(0, Math.round(portfolio - taxLeft));
      const netRightNow = Math.round(portfolio);
      if (elLNet) elLNet.textContent = formatNOK(netLeft);
      if (elNRNow) elNRNow.textContent = formatNOK(netRightNow);

      // Høyre skatt avhenger av aksje-/renteandel
      if (!isRealisationTab && (elRT || elRNet)) {
        let equitySharePctR = 65;
        if (typeof AppState.stockSharePercent === 'number') equitySharePctR = AppState.stockSharePercent;
        else if (AppState.stockShareOption) {
          const m = String(AppState.stockShareOption).match(/(\d+)%/);
          if (m) equitySharePctR = Number(m[1]);
        }
        // Hent skattesatser fra Input-fanen
        const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100; // Konverter prosent til desimal
        const capitalTaxRate = (AppState.capitalTaxPct || 22.00) / 100; // Konverter prosent til desimal
        const equityShareR = Math.max(0, Math.min(1, equitySharePctR / 100));
        const interestShareR = 1 - equityShareR;
        // Hvis aksjeandel > 80%, bruk utbytteskatt på hele gevinsten
        const rateRight = equitySharePctR > 80 ? stockTaxRate : (equityShareR * stockTaxRate + interestShareR * capitalTaxRate);
        const taxRight = Math.round(gain * rateRight);
        if (elRT) { 
          elRT.textContent = formatNOK(taxRight); 
          elRT.style.color = "var(--error-600)"; 
          elRT.style.fontWeight = "400"; // Rød tekst skal ha font-weight 400
        }
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
      
      // Beregn og oppdater den fremtidige skatten i venstre tabell
      const elTaxFuture = document.getElementById("fk-left-tax-future");
      const elNetFuture = document.getElementById("fk-left-net-future");
      const elFuture = document.getElementById("fk-left-future");
      const elGainFuture = document.getElementById("fk-left-gain-future");
      const elShield = document.getElementById("fk-left-shield");
      const elExcess = document.getElementById("fk-left-excess");
      const elFR = document.getElementById("fk-right-future");
      const elGFR = document.getElementById("fk-right-gain-future");
      
      if (elTaxFuture || elNetFuture || elFuture || elFR) {
        // Hver kolonne vokser fra sin egen netto
        const net = netLeft;
        
        // Hent antall år
        let years = 0;
        const yearsSlider = document.getElementById('input-years-slider');
        if (yearsSlider && yearsSlider.value) {
          years = Number(yearsSlider.value);
        } else if (isFinite(AppState.yearsCount)) {
          years = Number(AppState.yearsCount);
        }
        
        // Hent forventet avkastning
        let expectedReturnPct = 0;
        const inputExpectedReturn = document.getElementById('expected-return-out');
        if (inputExpectedReturn) {
          const txt = (inputExpectedReturn.textContent || "").replace('%','').trim().replace(',', '.');
          const v = Number(txt);
          if (isFinite(v)) expectedReturnPct = v;
        }
        if (!isFinite(expectedReturnPct) || expectedReturnPct === 0) {
          if (isFinite(AppState.expectedReturnPct)) {
            expectedReturnPct = Number(AppState.expectedReturnPct);
          }
        }
        if (isRealisationTab) {
          expectedReturnPct = getSummaryExpectedReturnPct();
          years = getSummaryYears();
        }
        
        // Beregn fremtidsverdi: netto × (1 + forventet avkastning)^år
        const r = expectedReturnPct / 100;
        const future = Math.round(net * Math.pow(1 + r, years));
        if (elFuture) elFuture.textContent = formatNOK(future);
        
        // Beregn gevinst om x år = verdi portefølje om x år − netto portefølje
        const gainFuture = Math.max(0, future - net);
        if (elGainFuture) elGainFuture.textContent = formatNOK(gainFuture);

        const futureRight = Math.round(netRightNow * Math.pow(1 + r, years));
        if (elFR) elFR.textContent = formatNOK(futureRight);
        const gainNowRight = isRealisationTab ? gainLeft : gain;
        const gainRightFuture = isRealisationTab
          ? Math.max(0, Math.round(gainNowRight + (futureRight - netRightNow)))
          : Math.max(0, futureRight - capital);
        if (elGFR) elGFR.textContent = formatNOK(gainRightFuture);
        
        // Beregn skjermingsgrunnlag
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
        const shieldBase = Math.round((net * (equitySharePct / 100) * Math.pow(1 + shieldRate / 100, years)) - (net * (equitySharePct / 100)));
        if (elShield) elShield.textContent = formatNOK(shieldBase);
        
        // Beregn avkastning utover skjerming
        const excess = Math.max(0, gainFuture - shieldBase);
        if (elExcess) elExcess.textContent = formatNOK(excess);
        
        // Beregn skatt (fremtid) med dynamiske skattesatser fra Input-fanen
        const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100; // Konverter prosent til desimal
        const capitalTaxRate = (AppState.capitalTaxPct || 22.00) / 100; // Konverter prosent til desimal
        const equityShare = Math.max(0, Math.min(1, equitySharePct / 100));
        const interestShare = 1 - equityShare; // renteandel
        // Hvis aksjeandel > 80%, bruk utbytteskatt på hele avkastningen
        const effectiveTaxRate = equitySharePct > 80 ? stockTaxRate : (equityShare * stockTaxRate + interestShare * capitalTaxRate);
        const taxFuture = isRealisationTab
          ? Math.round(gainFuture * 0.3784)
          : Math.round(excess * effectiveTaxRate);
        if (elTaxFuture) { elTaxFuture.textContent = formatNOK(taxFuture); elTaxFuture.style.color = "var(--error-600)"; }
        
        // Netto portefølje (fremtid) = Fremtidsverdi − Skatt (fremtid)
        if (elNetFuture) elNetFuture.textContent = formatNOK(Math.max(0, future - taxFuture));

        if (isRealisationTab) {
          const taxRightFuture = Math.round(gainRightFuture * 0.3784);
          if (elRT) {
            elRT.textContent = formatNOK(taxRightFuture);
            elRT.style.color = "var(--error-600)";
            elRT.style.fontWeight = "400";
          }
          if (elRNet) elRNet.textContent = formatNOK(Math.max(0, futureRight - taxRightFuture));
        }
      }
    }
  } catch (_) {}

  // Oppdater "Nedbetale lån"-kortene dersom de finnes i DOM
  try {
    const elInvPortfolio = document.getElementById("inv-left-portfolio");
    const elInvCapital = document.getElementById("inv-left-capital");
    if (elInvPortfolio) {
      const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
      let portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
      const portfolioSlider = document.getElementById('input-portfolio-slider');
      if (portfolioSlider && portfolioSlider.value) {
        const v = Number(portfolioSlider.value);
        if (isFinite(v)) portfolio = v;
      }
      elInvPortfolio.textContent = formatNOK(Math.round(portfolio));
    }
    if (elInvCapital) {
      let capital = 0;
      const capitalSliderEl = document.getElementById('input-capital-slider');
      if (capitalSliderEl && capitalSliderEl.value) {
        const v = Number(capitalSliderEl.value);
        if (isFinite(v)) capital = v;
      } else if (isFinite(AppState.inputCapital)) {
        capital = Number(AppState.inputCapital);
      }
      elInvCapital.textContent = formatNOK(Math.round(capital));
    }
    const elInvExpected = document.getElementById("inv-left-expected");
    if (elInvExpected) {
      const inputExpectedReturn = document.getElementById('expected-return-out');
      if (inputExpectedReturn) {
        // Hent verdien direkte fra Input-fanen (allerede formatert med to desimaler)
        const inputValue = inputExpectedReturn.textContent.trim();
        elInvExpected.textContent = inputValue;
      } else if (isFinite(AppState.expectedReturnPct)) {
        // Fallback: bruk AppState hvis elementet ikke finnes
        elInvExpected.textContent = `${AppState.expectedReturnPct.toFixed(2).replace('.', ',')} %`;
      }
    }
    // Hent porteføljestørrelse og andre verdier som trengs for beregninger
    const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
    let portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
    const portfolioSlider = document.getElementById('input-portfolio-slider');
    if (portfolioSlider && portfolioSlider.value) {
      const v = Number(portfolioSlider.value);
      if (isFinite(v)) portfolio = v;
    }
    
    // Oppdater "Uttak til renter og avdrag" med AVDRAG-funksjonen
    const elInvPayment = document.getElementById("inv-left-payment");
    let annualPayment = 0;
    if (elInvPayment) {
      let repaymentYears = 20;
      const repaymentSliderEl = document.getElementById('repayment-profile-slider');
      if (repaymentSliderEl && repaymentSliderEl.value) {
        const v = Number(repaymentSliderEl.value);
        if (isFinite(v) && v > 0) repaymentYears = v;
      } else if (isFinite(AppState.repaymentProfileYears)) {
        repaymentYears = Number(AppState.repaymentProfileYears);
      }
      
      let interestCost = 5.0;
      const interestSliderEl = document.getElementById('interest-cost-slider');
      if (interestSliderEl && interestSliderEl.value) {
        const v = Number(interestSliderEl.value);
        if (isFinite(v)) interestCost = v;
      } else if (isFinite(AppState.interestCostPct)) {
        interestCost = Number(AppState.interestCostPct);
      }
      
      const rate = interestCost / 100;
      const nper = repaymentYears;
      const pv = portfolio;
      annualPayment = Math.abs(calculatePMT(rate, nper, pv, 0, 0));
      elInvPayment.textContent = formatNOK(Math.round(annualPayment));
      elInvPayment.style.color = "var(--error-600)";
    }
    
    // Oppdater "Årlig renter og avdrag per år" i høyre boksen med minus foran
    const elInvAnnualPayment = document.getElementById("inv-right-annual-payment");
    if (elInvAnnualPayment && annualPayment > 0) {
      elInvAnnualPayment.textContent = formatNOK(-Math.round(annualPayment));
      elInvAnnualPayment.style.color = "var(--error-600)";
    }
    
    // "Verdi ved periodens slutt" og "Avkastning" beregnes i updateInvestLoanCalc() som kalles tidligere i funksjonen
    // for å unngå duplisert logikk og sikre konsistent oppdatering
    // Beregn og oppdater "Restlån ved periodens slutt" hvis nødvendig (avkastning er allerede beregnet)
    const elInvRemainingLoan = document.getElementById("inv-right-remaining-loan");
    if (elInvRemainingLoan && annualPayment > 0) {
      // Sjekk om avdragsfrihet er aktivert
      const interestOnly = AppState.interestOnly === true;
      
      // Hent verdier for beregning
      let years = 10;
      const yearsSliderEl = document.getElementById('input-years-slider');
      if (yearsSliderEl && yearsSliderEl.value) {
        const v = Number(yearsSliderEl.value);
        if (isFinite(v) && v > 0) years = v;
      } else if (isFinite(AppState.yearsCount)) {
        years = Number(AppState.yearsCount);
      }
      
      let interestCost = 5.0;
      const interestSliderEl = document.getElementById('interest-cost-slider');
      if (interestSliderEl && interestSliderEl.value) {
        const v = Number(interestSliderEl.value);
        if (isFinite(v)) interestCost = v;
      } else if (isFinite(AppState.interestCostPct)) {
        interestCost = Number(AppState.interestCostPct);
      }
      
      // Hent porteføljestørrelse
      const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
      let portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
      const portfolioSlider = document.getElementById('input-portfolio-slider');
      if (portfolioSlider && portfolioSlider.value) {
        const v = Number(portfolioSlider.value);
        if (isFinite(v)) portfolio = v;
      }
      
      let remainingLoan = 0;
      if (interestOnly) {
        // Hvis avdragsfrihet er aktivert: restlån er uforandret (samme som opprinnelig lån)
        remainingLoan = portfolio;
      } else {
        // Hent avdragsprofil for å sjekke om lånet er nedbetalt
        let repaymentYearsForTop = 20; // default
        const repaymentSliderElForTop = document.getElementById('repayment-profile-slider');
        if (repaymentSliderElForTop && repaymentSliderElForTop.value) {
          const v = Number(repaymentSliderElForTop.value);
          if (isFinite(v) && v > 0) repaymentYearsForTop = v;
        } else if (isFinite(AppState.repaymentProfileYears)) {
          repaymentYearsForTop = Number(AppState.repaymentProfileYears);
        }
        
        // Hvis antall år >= avdragsprofil, er lånet fullstendig nedbetalt (restlån = 0)
        if (years >= repaymentYearsForTop) {
          remainingLoan = 0;
        } else {
          // PV-parametere:
          const pvRate = interestCost / 100;
          const remainingYears = repaymentYearsForTop - years;
          const pvNper = remainingYears;
          const pvPmt = -annualPayment; // Negativ fordi det er utbetaling
          const pvFv = 0;
          const pvType = 0;
          
          remainingLoan = Math.abs(calculatePV(pvRate, pvNper, pvPmt, pvFv, pvType));
        }
      }
      elInvRemainingLoan.textContent = formatNOK(Math.round(remainingLoan));
      
      // Avkastning er allerede beregnet i updateInvestLoanCalc() som kalles tidligere i funksjonen
      
      // Beregn og oppdater "Rest innskutt kapital" med SLUTTVERDI-funksjonen
      const elInvRestCapital = document.getElementById("inv-left-rest-capital");
      if (elInvRestCapital && annualPayment > 0) {
        // Hent innskutt kapital fra Input-fanen
        let capital = 0;
        const capitalSliderEl = document.getElementById('input-capital-slider');
        if (capitalSliderEl && capitalSliderEl.value) {
          const v = Number(capitalSliderEl.value);
          if (isFinite(v)) capital = v;
        } else if (isFinite(AppState.inputCapital)) {
          capital = Number(AppState.inputCapital);
        }
        
        // Hent skjermingsrente fra Input-fanen
        let shieldRatePct = 3.9;
        const shieldSliderEl = document.getElementById('shield-rate-slider');
        if (shieldSliderEl && shieldSliderEl.value) {
          const v = Number(shieldSliderEl.value);
          if (isFinite(v)) shieldRatePct = v;
        } else if (isFinite(AppState.shieldRatePct)) {
          shieldRatePct = Number(AppState.shieldRatePct);
        }
        
        // FV-parametere:
        const restRate = shieldRatePct / 100;
        const restNper = years;
        const restPmt = -annualPayment; // Med minus først
        const restPv = capital; // Innskutt kapital
        const restType = 0;
        
        // Beregn rest innskutt kapital med SLUTTVERDI
        // Hvis innskutt kapital er 0 eller negativ, vis 0
        let restCapitalValue = 0;
        if (capital <= 0) {
          elInvRestCapital.textContent = formatNOK(0);
          restCapitalValue = 0;
        } else {
          const restCapital = -calculateFV(restRate, restNper, restPmt, restPv, restType);
          // Hvis verdien blir negativ, vis 0
          restCapitalValue = Math.max(0, Math.round(restCapital));
          elInvRestCapital.textContent = formatNOK(restCapitalValue);
        }
        
        // Beregn og oppdater "Skatt" basert på "Avkastning:"-linjen × ((Aksjeandel × 0,3784) + ((1 - Aksjeandel) × 0,22))
        const elInvTax = document.getElementById("inv-left-tax");
        if (elInvTax) {
          // Hent verdien fra "Avkastning:"-linjen
          let avkastningDiffValue = 0;
          const elAvkastningDiff = document.getElementById("inv-left-avkastning-diff");
          if (elAvkastningDiff && elAvkastningDiff.textContent) {
            let avkastningText = elAvkastningDiff.textContent.trim();
            // Sjekk om verdien er negativ (kan ha minus-tegn eller Unicode minus U+2212)
            const isNegative = avkastningText.includes('-') || avkastningText.includes('−');
            // Fjern alle tegn bortsett fra tall
            avkastningText = avkastningText.replace(/[^\d]/g, '');
            avkastningDiffValue = parseFloat(avkastningText) || 0;
            // Legg til minus hvis verdien var negativ
            if (isNegative) {
              avkastningDiffValue = -Math.abs(avkastningDiffValue);
            }
          }
          
          // Hent aksjeandel fra Input-fanen
          let equitySharePct = 65; // default
          if (typeof AppState.stockSharePercent === 'number') {
            equitySharePct = AppState.stockSharePercent;
          } else if (AppState.stockShareOption) {
            const m = String(AppState.stockShareOption).match(/(\d+)%/);
            if (m) equitySharePct = Number(m[1]);
            if (/Renter/i.test(String(AppState.stockShareOption))) equitySharePct = 0;
          }
          
          // Konverter aksjeandel til desimal (0-1) for beregning
          const aksjeAndel = equitySharePct / 100;
          
          // Hent skattesatser fra Input-fanen
          const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100; // Konverter prosent til desimal
          const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100; // Konverter prosent til desimal
          
          // Beregn skatt: -Avkastning × ((Aksjeandel × Utbytteskatt) + ((1 - Aksjeandel) × Kapitalskatt))
          // Hvis avkastning er negativ, blir skatt positiv (skattefordel, grønn)
          // Hvis avkastning er positiv, blir skatt negativ (skattekostnad, rød)
          const taxRate = (aksjeAndel * stockTaxRate) + ((1 - aksjeAndel) * capitalTaxRate);
          const taxAmount = -avkastningDiffValue * taxRate;
          const roundedTax = Math.round(taxAmount);
          elInvTax.textContent = formatNOK(roundedTax);
          
          // Sett farge: grønn hvis positiv (skattefordel), rød hvis negativ (skattekostnad)
          const taxColor = roundedTax >= 0 ? "var(--success-600)" : "var(--error-600)"; // Grønn eller rød
          elInvTax.style.color = taxColor;
          
          // Oppdater også etiketten "Skatt" med samme farge
          const taxRow = elInvTax.parentElement;
          if (taxRow) {
            const taxLabel = taxRow.querySelector('span:first-child');
            if (taxLabel) {
              taxLabel.style.color = taxColor;
            }
          }
        }
      }
    } else if (elInvRemainingLoan && annualPayment > 0 && !elInvReturn) {
      // Fallback: bare beregn restlån uten avkastning
      const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
      let portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
      const portfolioSlider = document.getElementById('input-portfolio-slider');
      if (portfolioSlider && portfolioSlider.value) {
        const v = Number(portfolioSlider.value);
        if (isFinite(v)) portfolio = v;
      }
      
      let years = 10;
      const yearsSliderEl = document.getElementById('input-years-slider');
      if (yearsSliderEl && yearsSliderEl.value) {
        const v = Number(yearsSliderEl.value);
        if (isFinite(v) && v > 0) years = v;
      } else if (isFinite(AppState.yearsCount)) {
        years = Number(AppState.yearsCount);
      }
      
      let interestCost = 5.0;
      const interestSliderEl = document.getElementById('interest-cost-slider');
      if (interestSliderEl && interestSliderEl.value) {
        const v = Number(interestSliderEl.value);
        if (isFinite(v)) interestCost = v;
      } else if (isFinite(AppState.interestCostPct)) {
        interestCost = Number(AppState.interestCostPct);
      }
      
      // Hent avdragsprofil for å sjekke om lånet er nedbetalt
      let repaymentYearsForTop2 = 20; // default
      const repaymentSliderElForTop2 = document.getElementById('repayment-profile-slider');
      if (repaymentSliderElForTop2 && repaymentSliderElForTop2.value) {
        const v = Number(repaymentSliderElForTop2.value);
        if (isFinite(v) && v > 0) repaymentYearsForTop2 = v;
      } else if (isFinite(AppState.repaymentProfileYears)) {
        repaymentYearsForTop2 = Number(AppState.repaymentProfileYears);
      }
      
      let remainingLoan = 0;
      // Hvis antall år >= avdragsprofil, er lånet fullstendig nedbetalt (restlån = 0)
      if (years >= repaymentYearsForTop2) {
        remainingLoan = 0;
      } else {
        const pvRate = interestCost / 100;
        const remainingYears = repaymentYearsForTop2 - years;
        const pvNper = remainingYears;
        const pvFv = 0;
        const pvType = 0;
        
        remainingLoan = Math.abs(calculatePV(pvRate, pvNper, pvFv, pvType));
      }
      elInvRemainingLoan.textContent = formatNOK(Math.round(remainingLoan));
    }
    // Oppdater også høyre boksen: Lån og Rentekostnad
    const elInvRightLoan = document.getElementById("inv-right-loan");
    const elInvRightRate = document.getElementById("inv-right-rate");
    if (elInvRightLoan) {
      const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
      let portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
      const portfolioSlider = document.getElementById('input-portfolio-slider');
      if (portfolioSlider && portfolioSlider.value) {
        const v = Number(portfolioSlider.value);
        if (isFinite(v)) portfolio = v;
      }
      elInvRightLoan.textContent = formatNOK(Math.round(portfolio));
    }
    
    // "Verdi ved periodens slutt" er allerede oppdatert tidligere i denne funksjonen
    // "Avkastning" er også allerede oppdatert tidligere i denne funksjonen (linje 3298-3304)
    // Denne ekstra oppdateringen er ikke lenger nødvendig siden oppdateringen alltid skjer
    // tidligere i funksjonen
    
    if (elInvRightRate) {
      let interestCost = 5.0;
      const interestSliderEl = document.getElementById('interest-cost-slider');
      if (interestSliderEl && interestSliderEl.value) {
        const v = Number(interestSliderEl.value);
        if (isFinite(v)) interestCost = v;
      } else if (isFinite(AppState.interestCostPct)) {
        interestCost = Number(AppState.interestCostPct);
      }
      elInvRightRate.textContent = `${interestCost.toFixed(1).replace('.', ',')} %`;
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
      // Store current active tab to restore later
      const moduleRoot = document.getElementById("module-root");
      const currentTab = document.querySelector(".nav-item.is-active");
      const currentTabSection = currentTab ? currentTab.getAttribute("data-section") : null;
      
      // First, ensure all tabs are updated to get fresh values
      try { updateTopSummaries(); } catch (_) {}
      
      // Get list of all calculation tabs that need to be rendered
      // Note: ASK tab is not yet implemented, so skip it
      const calculationTabs = ["Nedbetale lån", "Utbetale utbytte", "Innløse Fondskonto"];
      
      // Create hidden container to store all rendered tabs
      const hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "absolute";
      hiddenContainer.style.left = "-9999px";
      hiddenContainer.style.visibility = "hidden";
      document.body.appendChild(hiddenContainer);
      
      // Iterate through each calculation tab and render it temporarily to collect data
      calculationTabs.forEach((tabName) => {
        // Find the tab button
        const tabButton = Array.from(document.querySelectorAll(".nav-item")).find(
          btn => btn.getAttribute("data-section") === tabName || btn.textContent.includes(tabName)
        );
        
        if (tabButton) {
          // Activate this tab
          document.querySelectorAll(".nav-item").forEach(t => t.classList.remove("is-active"));
          tabButton.classList.add("is-active");
          
          // Create a temporary root for this tab and append to body so getElementById works
          const tempRoot = document.createElement("div");
          tempRoot.style.position = "absolute";
          tempRoot.style.left = "-9999px";
          tempRoot.style.visibility = "hidden";
          document.body.appendChild(tempRoot);
          
          // Render the tab content into tempRoot
          try {
            renderPlaceholder(tempRoot);
            updateTopSummaries();
            
            // Copy all elements with IDs from tempRoot to hidden container
            // But skip modal elements to avoid creating backdrops
            const clonedElements = tempRoot.querySelectorAll("[id]");
            clonedElements.forEach(el => {
              // Skip modal elements and their children
              if (el.closest('.modal')) return;
              const clone = el.cloneNode(true);
              clone.id = el.id; // Preserve the ID
              hiddenContainer.appendChild(clone);
            });
            
            // Clean up tempRoot
            document.body.removeChild(tempRoot);
          } catch (e) {
            console.error(`Error rendering tab ${tabName}:`, e);
            // Ensure cleanup even on error
            try { document.body.removeChild(tempRoot); } catch (_) {}
          }
        }
      });
      
      // Now generate output which will read all the rendered tabs from the hidden container
      // Temporarily move hidden container content to main moduleRoot so getElementById works
      const savedModuleRootHTML = moduleRoot ? moduleRoot.innerHTML : "";
      if (moduleRoot) {
        moduleRoot.innerHTML = "";
        const hiddenElements = Array.from(hiddenContainer.children);
        hiddenElements.forEach(el => moduleRoot.appendChild(el.cloneNode(true)));
      }
      
      textArea.value = generateOutputText();
      
      // Clean up hidden container first
      document.body.removeChild(hiddenContainer);
      
      // Restore the previously active tab by re-rendering it
      // Don't restore originalRootHTML since we'll re-render anyway
      if (moduleRoot) {
        moduleRoot.innerHTML = "";
      }
      
      if (currentTab) {
        document.querySelectorAll(".nav-item").forEach(t => t.classList.remove("is-active"));
        currentTab.classList.add("is-active");
        if (moduleRoot) {
          renderPlaceholder(moduleRoot);
          updateTopSummaries();
        }
      }
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
  const nf = new Intl.NumberFormat("nb-NO");
  const nok = (v) => new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(v || 0);
  const lines = [];
  
  // === INPUT FANEN ===
  lines.push("=== INPUT ===");
  lines.push(`Antall år: ${AppState.yearsCount || 10} år`);
  lines.push(`Porteføljestørrelse: ${nok(AppState.portfolioSize || 10000000)}`);
  lines.push(`Innskutt kapital: ${nok(AppState.inputCapital || 0)}`);
  lines.push(`Aksjeandel: ${AppState.stockShareOption || "65% Aksjer"}`);
  lines.push(`Forventet avkastning aksjer: ${(AppState.expEquity || 8.0).toFixed(1).replace('.', ',')} %`);
  lines.push(`Forventet avkastning renter: ${(AppState.expBonds || 5.0).toFixed(1).replace('.', ',')} %`);
  lines.push(`Forventet KPI: ${(AppState.expKpi ?? 2.0).toFixed(1).replace('.', ',')} %`);
  lines.push(`Rådgivningshonorar: ${(AppState.advisoryFeePct || 0.0).toFixed(2).replace('.', ',')} %`);
  lines.push(`Skjermingsrente: ${(AppState.shieldRatePct || 3.9).toFixed(1).replace('.', ',')} %`);
  lines.push(`Rentekostnader: ${(AppState.interestCostPct || 5.0).toFixed(1).replace('.', ',')} %`);
  lines.push(`Avdragsprofil: ${AppState.repaymentProfileYears || 20} år`);
  lines.push(`Skattefradrag renter: ${AppState.interestTaxDeductionOnLoan !== false ? "Ja" : "Nei"}`);
  lines.push(`Utbytteskatt: ${(AppState.stockTaxPct ?? 37.84).toFixed(2).replace('.', ',')} %`);
  lines.push(`Kapitalskatt: ${(AppState.capitalTaxPct || 22.0).toFixed(2).replace('.', ',')} %`);
  lines.push("");
  
  // === NEDBETALE LÅN FANEN ===
  lines.push("=== NEDBETALE LÅN ===");
  const nedbetaleData = [
    { id: "inv-left-portfolio", label: "Portefølje" },
    { id: "inv-left-capital", label: "Innskutt kapital" },
    { id: "inv-left-expected", label: "Forventet avkastning" },
    { id: "inv-left-payment", label: "Uttak til renter og avdrag" },
    { id: "inv-left-endvalue", label: "Verdi ved periodens slutt" },
    { id: "inv-left-avkastning-diff", label: "Avkastning:" },
    { id: "inv-left-rest-capital", label: "Rest innskutt kapital" },
    { id: "inv-left-tax", label: "Skatt" },
    { id: "inv-left-net", label: "Netto portefølje etter skatt" },
    { id: "inv-left-debt-settle", label: "Oppgjør gjeld" },
    { id: "inv-left-interest-deduction", label: "Fradrag rentekostnader" },
    { id: "inv-left-net-return", label: "Netto avkastning" },
    { id: "inv-right-remaining-loan", label: "Restlån ved periodens slutt" },
    { id: "inv-right-annual-payment", label: "Årlig renter og avdrag per år" }
  ];
  nedbetaleData.forEach(item => {
    const el = document.getElementById(item.id);
    if (el && el.textContent.trim()) {
      lines.push(`${item.label}: ${el.textContent.trim()}`);
    }
  });
  lines.push("");
  
  // === UTBETALE UTBYTTE FANEN ===
  lines.push("=== UTBETALE UTBYTTE ===");
  const utbytteData = [
    { id: "div-portfolio", label: "Beholde portefølje" },
    { id: "div-expected", label: "Forventet avkastning" },
    { id: "div-endvalue", label: "Verdi ved periodens slutt" },
    { id: "div-dividend", label: "Utbytte" },
    { id: "div-dividend-tax", label: "Utbytteskatt" },
    { id: "div-dividend-net", label: "Netto" },
    { id: "div-remaining", label: "Restportefølje" },
    { id: "div-loan", label: "Lån" },
    { id: "div-interest-costs", label: "rentekostnader i x år" },
    { id: "div-interest-deduction", label: "Skattefradrag renter" },
    { id: "div-sum", label: "Sum" }
  ];
  utbytteData.forEach(item => {
    const el = document.getElementById(item.id);
    if (el && el.textContent.trim()) {
      lines.push(`${item.label}: ${el.textContent.trim()}`);
    }
  });
  lines.push("");
  
  // === INNLØSE FONDSKONTO FANEN ===
  lines.push("=== INNLØSE FONDSKONTO ===");
  const fondskontoData = [
    { id: "fk-left-portfolio", label: "Portefølje" },
    { id: "fk-left-capital", label: "Innskutt kapital" },
    { id: "fk-left-gain", label: "Gevinst" },
    { id: "fk-left-tax", label: "Skatt" },
    { id: "fk-left-net", label: "Netto portefølje" },
    { id: "fk-left-future", label: "Verdi portefølje om x år" },
    { id: "fk-left-gain-future", label: "Gevinst om x år" },
    { id: "fk-left-shield", label: "Skjermingsgrunnlag" },
    { id: "fk-left-excess", label: "Avkastning utover skjerming" },
    { id: "fk-left-tax-future", label: "Skatt" },
    { id: "fk-left-net-future", label: "Netto portefølje" },
    { id: "fk-right-portfolio", label: "Portefølje" },
    { id: "fk-right-capital", label: "Innskutt kapital" },
    { id: "fk-right-gain", label: "Gevinst" },
    { id: "fk-right-tax", label: "Skatt" },
    { id: "fk-right-net", label: "Netto portefølje" }
  ];
  fondskontoData.forEach(item => {
    const el = document.getElementById(item.id);
    if (el && el.textContent.trim()) {
      lines.push(`${item.label}: ${el.textContent.trim()}`);
    }
  });
  lines.push("");

  return lines.join("\n");
}

// --- Input modal, parse, and update ---
function initInputUI() {
  const fab = document.getElementById("input-fab");
  const modal = document.getElementById("input-modal");
  const textArea = document.getElementById("input-text");
  const applyBtn = document.getElementById("apply-input");

  if (!fab || !modal || !textArea || !applyBtn) return;

  function openModal() {
    modal.removeAttribute("hidden");
    document.addEventListener("keydown", onKeyDown);
    // Fokus på textarea
    setTimeout(() => textArea.focus(), 100);
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

  function parseAndApplyInput() {
    const text = textArea.value.trim();
    if (!text) {
      alert("Ingen tekst å parse. Lim inn tekst fra Output-knappen.");
      return;
    }

    try {
      parseInputText(text);
      closeModal();
      // Oppdater alle faner
      updateTopSummaries();
      // Re-render aktiv fane hvis den finnes
      const activeTab = document.querySelector(".nav-item.is-active");
      if (activeTab) {
        const section = activeTab.getAttribute("data-section");
        if (section) {
          renderPlaceholder(document.getElementById("module-root"));
          updateTopSummaries();
        }
      }
      alert("Input oppdatert!");
    } catch (e) {
      console.error("Feil ved parsing av input:", e);
      alert(`Feil ved parsing av input: ${e.message}`);
    }
  }

  fab.addEventListener("click", openModal);
  applyBtn.addEventListener("click", parseAndApplyInput);
  
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeModal();
    }
  });
}

function parseInputText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  
  // Parse INPUT-seksjonen
  let inInputSection = false;
  
  for (const line of lines) {
    if (line === "=== INPUT ===") {
      inInputSection = true;
      continue;
    }
    
    if (line.startsWith("===") && line !== "=== INPUT ===") {
      inInputSection = false;
      continue;
    }
    
    if (!inInputSection) continue;
    
    // Parse hver linje
    if (line.startsWith("Antall år:")) {
      const match = line.match(/Antall år:\s*(\d+)\s*år/);
      if (match) {
        AppState.yearsCount = parseInt(match[1], 10);
      }
    } else if (line.startsWith("Porteføljestørrelse:")) {
      const match = line.match(/Porteføljestørrelse:\s*([\d\s]+)\s*kr/);
      if (match) {
        const value = parseInt(match[1].replace(/\s/g, ""), 10);
        AppState.portfolioSize = value;
      }
    } else if (line.startsWith("Innskutt kapital:")) {
      const match = line.match(/Innskutt kapital:\s*([\d\s]+)\s*kr/);
      if (match) {
        const value = parseInt(match[1].replace(/\s/g, ""), 10);
        AppState.inputCapital = value;
      }
    } else if (line.startsWith("Aksjeandel:")) {
      const match = line.match(/Aksjeandel:\s*(.+)/);
      if (match) {
        AppState.stockShareOption = match[1].trim();
        // Prøv å ekstrahere prosent hvis mulig
        const pctMatch = match[1].match(/(\d+)%/);
        if (pctMatch) {
          AppState.stockSharePercent = parseInt(pctMatch[1], 10);
        }
      }
    } else if (line.startsWith("Forventet avkastning aksjer:")) {
      const match = line.match(/Forventet avkastning aksjer:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.expEquity = parseFloat(match[1].replace(",", "."));
      }
    } else if (line.startsWith("Forventet avkastning renter:")) {
      const match = line.match(/Forventet avkastning renter:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.expBonds = parseFloat(match[1].replace(",", "."));
      }
    } else if (line.startsWith("Forventet KPI:")) {
      const match = line.match(/Forventet KPI:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.expKpi = parseFloat(match[1].replace(",", "."));
      }
    } else if (line.startsWith("Rådgivningshonorar:")) {
      const match = line.match(/Rådgivningshonorar:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.advisoryFeePct = parseFloat(match[1].replace(",", "."));
      }
    } else if (line.startsWith("Skjermingsrente:")) {
      const match = line.match(/Skjermingsrente:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.shieldRatePct = parseFloat(match[1].replace(",", "."));
      }
    } else if (line.startsWith("Rentekostnader:")) {
      const match = line.match(/Rentekostnader:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.interestCostPct = parseFloat(match[1].replace(",", "."));
      }
    } else if (line.startsWith("Avdragsprofil:")) {
      const match = line.match(/Avdragsprofil:\s*(\d+)\s*år/);
      if (match) {
        AppState.repaymentProfileYears = parseInt(match[1], 10);
      }
    } else if (line.startsWith("Skattefradrag renter:") || line.startsWith("Skattefradrag på renter:")) {
      const m = line.match(/Skattefradrag (?:på )?renter:\s*(Ja|Nei)/i);
      if (m) {
        AppState.interestTaxDeductionOnLoan = /^ja$/i.test(m[1].trim());
      }
    } else if (line.startsWith("Utbytteskatt:")) {
      const match = line.match(/Utbytteskatt:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.stockTaxPct = parseFloat(match[1].replace(",", "."));
      }
    } else if (line.startsWith("Kapitalskatt:")) {
      const match = line.match(/Kapitalskatt:\s*([\d,]+)\s*%/);
      if (match) {
        AppState.capitalTaxPct = parseFloat(match[1].replace(",", "."));
      }
    }
  }
  
  // Oppdater alle input-felter i UI
  updateInputTabValues();
}

// --- Disclaimer modal ---
function initDisclaimerUI() {
  const btn = document.getElementById("disclaimer-btn");
  const modal = document.getElementById("disclaimer-modal");
  if (!btn || !modal) return;

  function openModal() {
    modal.removeAttribute("hidden");
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

  btn.addEventListener("click", openModal);
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeModal();
    }
  });
}

// --- Visningskontroller: zoom + vanlig fullskjerm + kant-til-kant ---
const VIEW_ZOOM_KEY = "dashboard-manual-zoom";
const VIEW_ZOOM_MIN = 0.5;
const VIEW_ZOOM_MAX = 1.5;
const VIEW_ZOOM_STEP = 0.1;
const EDGE_BASE_WIDTH = 1440;

function initFullscreen() {
  const btn = document.getElementById("fullscreen-btn");
  const edgeBtn = document.getElementById("edge-fullscreen-btn");
  const appEl = document.querySelector(".app");

  let manualZoom = 1;
  try {
    const stored = parseFloat(localStorage.getItem(VIEW_ZOOM_KEY));
    if (isFinite(stored) && stored >= VIEW_ZOOM_MIN && stored <= VIEW_ZOOM_MAX) {
      manualZoom = stored;
    }
  } catch (_) {}

  function clampZoom(z) {
    return Math.min(VIEW_ZOOM_MAX, Math.max(VIEW_ZOOM_MIN, Math.round(z * 100) / 100));
  }

  function isNativeFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.mozFullScreenElement || document.msFullscreenElement);
  }

  function isEdgeMode() {
    return document.body.classList.contains("edge-to-edge-fs");
  }

  function applyManualZoom() {
    if (isEdgeMode()) return;
    document.documentElement.style.setProperty("--app-zoom", String(manualZoom));
    document.documentElement.style.removeProperty("--edge-scale");
    document.documentElement.style.removeProperty("--edge-base-width");
  }

  function saveManualZoom() {
    try { localStorage.setItem(VIEW_ZOOM_KEY, String(manualZoom)); } catch (_) {}
  }

  function setManualZoom(next) {
    manualZoom = clampZoom(next);
    saveManualZoom();
    applyManualZoom();
  }

  function applyEdgeScale() {
    if (!isEdgeMode()) return;
    const scale = window.innerWidth / EDGE_BASE_WIDTH;
    document.documentElement.style.setProperty("--edge-scale", String(scale));
    document.documentElement.style.setProperty("--edge-base-width", `${EDGE_BASE_WIDTH}px`);
    // Overstyr manuell zoom helt mens kant-til-kant er aktiv
    document.documentElement.style.setProperty("--app-zoom", "1");
  }

  function enterNativeFullscreen(element) {
    const el = element || document.documentElement;
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
    return Promise.reject(new Error("Fullscreen API unavailable"));
  }

  function exitNativeFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
    return Promise.resolve();
  }

  function updateFullscreenIcon(isFs) {
    if (!btn) return;
    const svg = btn.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    if (isFs) {
      svg.innerHTML = `<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      btn.setAttribute("aria-label", "Avslutt fullskjerm");
      btn.title = "Avslutt fullskjerm";
    } else {
      svg.innerHTML = `<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      btn.setAttribute("aria-label", "Aktiver fullskjerm");
      btn.title = "Aktiver fullskjerm";
    }
  }

  function updateEdgeButton() {
    if (!edgeBtn) return;
    const active = isEdgeMode();
    edgeBtn.classList.toggle("is-active", active);
    edgeBtn.setAttribute("aria-pressed", active ? "true" : "false");
    if (active) {
      edgeBtn.title = "Avslutt kant-til-kant";
      edgeBtn.setAttribute("aria-label", "Avslutt kant-til-kant");
    } else {
      edgeBtn.title = "Fullskjerm kant-til-kant";
      edgeBtn.setAttribute("aria-label", "Fullskjerm kant-til-kant");
    }
  }

  function enterEdgeToEdge() {
    // CSS-basert kant-til-kant — uten requestFullscreen.
    // Native Fullscreen API avsluttes ved Ctrl+PageUp / fane-bytte (nettleserbegrensning).
    // Denne modusen overlever fane-bytte; kombiner gjerne med F11 for vindus-fullskjerm.
    document.body.classList.add("edge-to-edge-fs");
    document.body.classList.add("edge-to-edge-fs--fallback");
    if (appEl) {
      appEl.style.position = "fixed";
      appEl.style.inset = "0";
      appEl.style.zIndex = "9999";
    }
    try { sessionStorage.setItem("dashboard-edge-fs", "1"); } catch (_) {}
    applyEdgeScale();
    updateEdgeButton();
  }

  function exitEdgeToEdge() {
    document.body.classList.remove("edge-to-edge-fs");
    document.body.classList.remove("edge-to-edge-fs--fallback");
    if (appEl) {
      appEl.style.position = "";
      appEl.style.inset = "";
      appEl.style.zIndex = "";
    }
    document.documentElement.style.removeProperty("--edge-scale");
    document.documentElement.style.removeProperty("--edge-base-width");
    try { sessionStorage.removeItem("dashboard-edge-fs"); } catch (_) {}

    // Gjenopprett manuell zoom fra localStorage
    try {
      const stored = parseFloat(localStorage.getItem(VIEW_ZOOM_KEY));
      if (isFinite(stored)) manualZoom = clampZoom(stored);
    } catch (_) {}
    applyManualZoom();
    updateEdgeButton();
  }

  function toggleEdgeToEdge() {
    if (isEdgeMode()) exitEdgeToEdge();
    else enterEdgeToEdge();
  }

  function toggleRegularFullscreen() {
    if (isNativeFullscreen()) {
      exitNativeFullscreen().catch(() => {});
    } else {
      enterNativeFullscreen(document.documentElement).catch(() => {});
    }
  }

  // Fullskjerm-knapper
  if (btn) btn.addEventListener("click", toggleRegularFullscreen);
  if (edgeBtn) edgeBtn.addEventListener("click", toggleEdgeToEdge);

  const fsEvents = ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"];
  fsEvents.forEach((event) => {
    document.addEventListener(event, () => {
      updateFullscreenIcon(isNativeFullscreen());
      // Ikke avslutt kant-til-kant ved native fullscreen-exit (f.eks. fane-bytte)
    });
  });

  window.addEventListener("resize", () => {
    if (isEdgeMode()) applyEdgeScale();
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isEdgeMode()) applyEdgeScale();
  });

  // Init
  applyManualZoom();
  updateFullscreenIcon(isNativeFullscreen());
  try {
    if (sessionStorage.getItem("dashboard-edge-fs") === "1") enterEdgeToEdge();
  } catch (_) {}
  updateEdgeButton();
}

// Chart modal og grafikk
function initChartUI() {
  const modal = document.getElementById("chart-modal");
  const chartContainer = document.getElementById("chart-container");
  const resizeHandle = document.getElementById("chart-resize-handle");
  if (!modal || !chartContainer) return;

  // Resize funksjonalitet
  if (resizeHandle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      const rect = chartContainer.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "none";
    });

    function handleResize(e) {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newWidth = Math.max(400, startWidth + deltaX);
      const newHeight = Math.max(300, startHeight + deltaY);
      chartContainer.style.width = `${newWidth}px`;
      chartContainer.style.height = `${newHeight}px`;
      chartContainer.style.minHeight = `${newHeight}px`;
    }

    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "";
      // Re-tegn grafikken med ny størrelse når resize er ferdig
      setTimeout(() => {
        drawBarChart();
      }, 10);
    }
  }

  function openChartModal() {
    // Toggle: hvis modal allerede er åpen, lukk den
    if (!modal.hasAttribute("hidden")) {
      closeChartModal();
      return;
    }
    modal.removeAttribute("hidden");
    // Reset størrelse når modal åpnes
    if (chartContainer) {
      chartContainer.style.width = "";
      chartContainer.style.height = "";
      chartContainer.style.minHeight = "";
    }
    requestAnimationFrame(() => drawBarChart());
    document.addEventListener("keydown", onKeyDown);
  }

  function closeChartModal() {
    modal.setAttribute("hidden", "");
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeChartModal();
    }
  }

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeChartModal();
    }
  });

  // Eksponer openChartModal globalt så ikonet kan kalle den
  window.openChartModal = openChartModal;
}

/** Hent felles input for Nedbetale lån / Vis grafisk */
function getInvestLoanChartInputs() {
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;

  let years = 10;
  const yearsSlider = document.getElementById("input-years-slider");
  if (yearsSlider && yearsSlider.value) {
    const v = Number(yearsSlider.value);
    if (isFinite(v) && v > 0) years = v;
  } else if (isFinite(AppState.yearsCount) && AppState.yearsCount > 0) {
    years = Number(AppState.yearsCount);
  }

  let repaymentYears = 20;
  const repaymentSliderEl = document.getElementById("repayment-profile-slider");
  if (repaymentSliderEl && repaymentSliderEl.value) {
    const v = Number(repaymentSliderEl.value);
    if (isFinite(v) && v > 0) repaymentYears = v;
  } else if (isFinite(AppState.repaymentProfileYears)) {
    repaymentYears = Number(AppState.repaymentProfileYears);
  }

  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  const interestOnly = AppState.interestOnly === true;
  const loanRate = interestPct / 100;

  let equitySharePct = 65;
  if (typeof AppState.stockSharePercent === "number") {
    equitySharePct = AppState.stockSharePercent;
  } else if (AppState.stockShareOption) {
    const m = String(AppState.stockShareOption).match(/(\d+)%/);
    if (m) equitySharePct = Number(m[1]);
    if (/Renter/i.test(String(AppState.stockShareOption))) equitySharePct = 0;
  }

  const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
  const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
  const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
  const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
  const equityShare = equitySharePct / 100;
  const expectedReturnPct = equityShare * expEquity + (1 - equityShare) * expBonds - fee - kpi;
  const expectedRate = expectedReturnPct / 100;

  const annualPayment = interestOnly
    ? portfolio * loanRate
    : Math.abs(calculatePMT(loanRate, repaymentYears, portfolio, 0, 0));

  return {
    portfolio,
    years,
    repaymentYears,
    interestOnly,
    loanRate,
    expectedRate,
    expectedReturnPct,
    equitySharePct,
    annualPayment,
  };
}

/**
 * År-for-år serie for Vis grafisk:
 * Hvert år: én søyle over null (hovedstol + avkastning) minus uttak til renter og avdrag.
 * Siste år: skatt + oppgjør gjeld + fradrag slås sammen til én negativ søyle.
 */
function buildVisGrafiskData() {
  const {
    portfolio,
    years,
    repaymentYears,
    interestOnly,
    loanRate,
    expectedRate,
    equitySharePct,
    annualPayment,
  } = getInvestLoanChartInputs();

  let portfolioBal = portfolio;
  let loanBal = portfolio;
  let totalInterestPaid = 0;
  let opYear = 0;

  function applyOperatingYear() {
    opYear += 1;
    const start = portfolioBal;
    const growth = portfolioBal * expectedRate;
    portfolioBal += growth;

    let interestPay = 0;
    let principalPay = 0;
    if (opYear <= repaymentYears && annualPayment > 0) {
      if (interestOnly) {
        interestPay = portfolio * loanRate;
        principalPay = 0;
      } else {
        interestPay = Math.max(0, loanBal * loanRate);
        principalPay = Math.max(0, Math.min(annualPayment - interestPay, loanBal));
        loanBal = Math.max(0, loanBal - principalPay);
      }
      totalInterestPaid += interestPay;
      portfolioBal -= interestPay + principalPay;
    }

    return {
      start,
      growth,
      interest: interestPay,
      principal: principalPay,
      payment: interestPay + principalPay,
      endPortfolio: portfolioBal,
    };
  }

  const yearRows = [];
  for (let y = 1; y <= years; y++) {
    const op = applyOperatingYear();
    yearRows.push({
      year: y,
      hovedstol: op.start,
      growth: op.growth,
      interest: op.interest,
      principal: op.principal,
      payment: op.payment,
      endPortfolio: op.endPortfolio,
      isLast: y === years,
    });
  }

  const futureValue = portfolioBal;
  let remainingLoan = 0;
  if (interestOnly) {
    remainingLoan = portfolio;
  } else if (years < repaymentYears) {
    const remainingYears = repaymentYears - years;
    remainingLoan = Math.abs(calculatePV(loanRate, remainingYears, -annualPayment, 0, 0));
  }

  const aksjeAndel = equitySharePct / 100;
  const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
  const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100;
  const taxRate = aksjeAndel * stockTaxRate + (1 - aksjeAndel) * capitalTaxRate;
  const excessValue = futureValue - remainingLoan;
  let taxAmount = -excessValue * taxRate;
  if (excessValue < 0 && taxAmount < 0) taxAmount = Math.abs(taxAmount);
  if (excessValue > 0 && taxAmount > 0) taxAmount = -taxAmount;

  const debtSettle = remainingLoan > 0 ? -remainingLoan : 0;
  const interestDeduction =
    AppState.interestTaxDeductionOnLoan === false
      ? 0
      : totalInterestPaid * capitalTaxRate;

  const netReturn = futureValue + taxAmount + debtSettle + interestDeduction;

  const last = yearRows[yearRows.length - 1];
  last.tax = taxAmount;
  last.debtSettle = debtSettle;
  last.interestDeduction = interestDeduction;
  last.final = netReturn;

  return {
    portfolio,
    years,
    yearRows,
    futureValue,
    remainingLoan,
    taxAmount,
    debtSettle,
    interestDeduction,
    netReturn,
  };
}

function getDividendChartInputs() {
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const years = Math.max(0, Number(AppState.yearsCount || 0));

  const inputExpectedReturn = document.getElementById("expected-return-out");
  let expectedReturnPct = 0;
  if (inputExpectedReturn) {
    const expectedText = inputExpectedReturn.textContent.trim().replace(",", ".").replace("%", "");
    expectedReturnPct = parseFloat(expectedText) || 0;
  } else {
    const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
    const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
    const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
    const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
    const equitySharePct = typeof AppState.stockSharePercent === "number" ? AppState.stockSharePercent : 65;
    const equityShare = equitySharePct / 100;
    expectedReturnPct = equityShare * expEquity + (1 - equityShare) * expBonds - fee - kpi;
  }

  const dividend = portfolio;
  const dividendTax = portfolio * ((AppState.stockTaxPct ?? 37.84) / 100);
  const dividendNet = dividend - dividendTax;

  let interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  const interestSliderEl = document.getElementById("interest-cost-slider");
  if (interestSliderEl && interestSliderEl.value !== "") {
    const v = Number(interestSliderEl.value);
    if (isFinite(v)) interestPct = v;
  }
  const interestCosts = dividendNet * Math.pow(1 + interestPct / 100, years) - dividendNet;
  const capitalTaxDec = (AppState.capitalTaxPct ?? 22) / 100;
  const interestDeduction =
    AppState.interestTaxDeductionOnLoan !== false ? interestCosts * capitalTaxDec : 0;
  const endValue = portfolio * Math.pow(1 + expectedReturnPct / 100, years);
  const remainingPortfolio = endValue - dividend;
  const sum = remainingPortfolio - interestCosts + interestDeduction;

  return {
    portfolio,
    years,
    expectedRate: expectedReturnPct / 100,
    dividend,
    dividendTax,
    interestCosts,
    interestDeduction,
    endValue,
    remainingPortfolio,
    sum,
  };
}

/**
 * Utbytte-graf: hovedstol vokser med avkastning i X år.
 * Siste år: uttak (utbytte) + skatt + rentekostnader; sluttverdi = Sum.
 */
function buildDividendVisGrafiskData() {
  const {
    portfolio,
    years,
    expectedRate,
    dividend,
    dividendTax,
    interestCosts,
    interestDeduction,
    remainingPortfolio,
    sum,
  } = getDividendChartInputs();

  const yearRows = [];
  let bal = portfolio;
  for (let y = 1; y <= years; y++) {
    const start = bal;
    const growth = bal * expectedRate;
    bal += growth;
    yearRows.push({
      kind: "dividend",
      year: y,
      hovedstol: start,
      growth,
      payment: 0,
      endPortfolio: bal,
      isLast: y === years,
    });
  }

  const last = yearRows[yearRows.length - 1];
  if (last) {
    last.dividend = -dividend;
    last.tax = -dividendTax;
    last.interestCosts = -interestCosts;
    last.interestDeduction = interestDeduction;
    last.remainingPortfolio = remainingPortfolio;
    last.final = sum;
  }

  return { portfolio, years, yearRows, remainingPortfolio, sum };
}

function getFondskontoFlyttChartInputs() {
  if (isRealisationTabActive()) {
    const parsedPortfolio = parseNokFromEl(document.getElementById("fk-left-portfolio"));
    const portfolio = isFinite(parsedPortfolio)
      ? Math.round(parsedPortfolio)
      : (isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : 0);
    const parsedTax = parseNokFromEl(document.getElementById("fk-left-tax"));
    const tax = isFinite(parsedTax)
      ? Math.round(parsedTax)
      : (Number.isFinite(Number(AppState.realisationTax)) ? Math.round(Number(AppState.realisationTax)) : 302720);
    const net = Math.max(0, Math.round(portfolio - tax));
    const years = Math.max(0, getSummaryYears());
    const expectedReturnPct = getSummaryExpectedReturnPct();
    const r = expectedReturnPct / 100;
    const parsedFuture = parseNokFromEl(document.getElementById("fk-left-future"));
    const future = isFinite(parsedFuture) ? Math.round(parsedFuture) : Math.round(net * Math.pow(1 + r, years));
    const parsedTaxFuture = parseNokFromEl(document.getElementById("fk-left-tax-future"));
    const taxFuture = isFinite(parsedTaxFuture)
      ? Math.round(parsedTaxFuture)
      : Math.round(Math.max(0, future - net) * 0.3784);
    const parsedNetFuture = parseNokFromEl(document.getElementById("fk-left-net-future"));
    const netFuture = isFinite(parsedNetFuture) ? Math.round(parsedNetFuture) : Math.max(0, future - taxFuture);
    return { portfolio, tax, net, years, expectedRate: r, taxFuture, future, netFuture };
  }

  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  let portfolio = sumAssets;
  const portfolioSlider = document.getElementById("input-portfolio-slider");
  if (portfolioSlider && portfolioSlider.value) {
    const v = Number(portfolioSlider.value);
    if (isFinite(v)) portfolio = v;
  } else if (isFinite(AppState.portfolioSize)) {
    portfolio = Number(AppState.portfolioSize);
  }

  let capital = 0;
  if (Number.isFinite(Number(AppState.inputCapital))) {
    capital = Number(AppState.inputCapital);
  } else {
    const capitalSliderEl = document.getElementById("input-capital-slider");
    if (capitalSliderEl && capitalSliderEl.value) {
      const v = Number(capitalSliderEl.value);
      if (isFinite(v)) capital = v;
    }
  }

  const gain = Math.max(0, Math.round(portfolio - capital));
  const fundTaxFirstYearPct = Number.isFinite(Number(AppState.fundTaxFirstYearPct))
    ? Number(AppState.fundTaxFirstYearPct)
    : 37.84;
  const tax = Math.round(gain * (fundTaxFirstYearPct / 100));
  const net = Math.max(0, Math.round(portfolio - tax));

  let years = 0;
  const yearsSlider = document.getElementById("input-years-slider");
  if (yearsSlider && yearsSlider.value) {
    years = Number(yearsSlider.value);
  } else if (isFinite(AppState.yearsCount)) {
    years = Number(AppState.yearsCount);
  }
  years = Math.max(0, years);

  let expectedReturnPct = 0;
  const inputExpectedReturn = document.getElementById("expected-return-out");
  if (inputExpectedReturn) {
    const txt = (inputExpectedReturn.textContent || "").replace("%", "").trim().replace(",", ".");
    const v = Number(txt);
    if (isFinite(v)) expectedReturnPct = v;
  }
  if (!isFinite(expectedReturnPct) || expectedReturnPct === 0) {
    if (isFinite(AppState.expectedReturnPct)) {
      expectedReturnPct = Number(AppState.expectedReturnPct);
    } else {
      const eq = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
      const bd = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
      const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
      const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
      let share = 65;
      if (typeof AppState.stockSharePercent === "number") share = AppState.stockSharePercent;
      else if (AppState.stockShareOption) {
        const m = String(AppState.stockShareOption).match(/(\d+)%/);
        if (m) share = Number(m[1]);
      }
      expectedReturnPct = share / 100 * eq + (1 - share / 100) * bd - fee - kpi;
    }
  }

  const r = expectedReturnPct / 100;
  const future = Math.round(net * Math.pow(1 + r, years));
  const gainFuture = Math.max(0, future - net);

  let shieldRate = 0;
  const shieldSlider = document.getElementById("shield-rate-slider");
  if (shieldSlider && shieldSlider.value) shieldRate = Number(shieldSlider.value);
  else if (isFinite(AppState.shieldRatePct)) shieldRate = Number(AppState.shieldRatePct);

  let equitySharePct = 65;
  if (typeof AppState.stockSharePercent === "number") equitySharePct = AppState.stockSharePercent;
  else if (AppState.stockShareOption) {
    const m = String(AppState.stockShareOption).match(/(\d+)%/);
    if (m) equitySharePct = Number(m[1]);
  }

  const shieldBase = Math.round(
    net * (equitySharePct / 100) * Math.pow(1 + shieldRate / 100, years) - net * (equitySharePct / 100)
  );
  const excess = Math.max(0, gainFuture - shieldBase);
  const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
  const capitalTaxRate = (AppState.capitalTaxPct || 22.00) / 100;
  const equityShare = Math.max(0, Math.min(1, equitySharePct / 100));
  const effectiveTaxRate =
    equitySharePct > 80 ? stockTaxRate : equityShare * stockTaxRate + (1 - equityShare) * capitalTaxRate;
  const taxFuture = Math.round(excess * effectiveTaxRate);
  const netFuture = Math.max(0, future - taxFuture);

  return {
    portfolio,
    tax,
    net,
    years,
    expectedRate: r,
    taxFuture,
    future,
    netFuture,
  };
}

function getFondskontoIkkeFlyttChartInputs() {
  if (isRealisationTabActive()) {
    const parsedPortfolio = parseNokFromEl(document.getElementById("fk-right-portfolio"));
    const parsedNetNow = parseNokFromEl(document.getElementById("fk-right-net-now"));
    const portfolio = isFinite(parsedPortfolio)
      ? Math.round(parsedPortfolio)
      : (isFinite(parsedNetNow)
        ? Math.round(parsedNetNow)
        : (isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : 0));
    const net = isFinite(parsedNetNow) ? Math.round(parsedNetNow) : portfolio;
    const years = Math.max(0, getSummaryYears());
    const expectedReturnPct = getSummaryExpectedReturnPct();
    const r = expectedReturnPct / 100;
    const parsedFuture = parseNokFromEl(document.getElementById("fk-right-future"));
    const future = isFinite(parsedFuture) ? Math.round(parsedFuture) : Math.round(net * Math.pow(1 + r, years));
    const parsedTaxFuture = parseNokFromEl(document.getElementById("fk-right-tax"));
    const taxFuture = isFinite(parsedTaxFuture)
      ? Math.round(parsedTaxFuture)
      : Math.round(Math.max(0, parseNokFromEl(document.getElementById("fk-right-gain-future")) || (future - net)) * 0.3784);
    const parsedNetFuture = parseNokFromEl(document.getElementById("fk-right-net"));
    const netFuture = isFinite(parsedNetFuture) ? Math.round(parsedNetFuture) : Math.max(0, future - taxFuture);
    return { portfolio, tax: 0, net, years, expectedRate: r, taxFuture, future, netFuture };
  }

  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  let portfolio = sumAssets;
  const portfolioSlider = document.getElementById("input-portfolio-slider");
  if (portfolioSlider && portfolioSlider.value) {
    const v = Number(portfolioSlider.value);
    if (isFinite(v)) portfolio = v;
  } else if (isFinite(AppState.portfolioSize)) {
    portfolio = Number(AppState.portfolioSize);
  }

  let capital = 0;
  const capitalSliderEl = document.getElementById("input-capital-slider");
  if (capitalSliderEl && capitalSliderEl.value) {
    const v = Number(capitalSliderEl.value);
    if (isFinite(v)) capital = v;
  } else if (isFinite(AppState.inputCapital)) {
    capital = Number(AppState.inputCapital);
  }

  let years = 0;
  const yearsSlider = document.getElementById("input-years-slider");
  if (yearsSlider && yearsSlider.value) {
    years = Number(yearsSlider.value);
  } else if (isFinite(AppState.yearsCount)) {
    years = Number(AppState.yearsCount);
  }
  years = Math.max(0, years);

  let expectedReturnPct = 0;
  const inputExpectedReturn = document.getElementById("expected-return-out");
  if (inputExpectedReturn) {
    const txt = (inputExpectedReturn.textContent || "").replace("%", "").trim().replace(",", ".");
    const v = Number(txt);
    if (isFinite(v)) expectedReturnPct = v;
  }
  if (!isFinite(expectedReturnPct) || expectedReturnPct === 0) {
    if (isFinite(AppState.expectedReturnPct)) {
      expectedReturnPct = Number(AppState.expectedReturnPct);
    } else {
      const eq = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
      const bd = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
      const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
      const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
      let share = 65;
      if (typeof AppState.stockSharePercent === "number") share = AppState.stockSharePercent;
      else if (AppState.stockShareOption) {
        const m = String(AppState.stockShareOption).match(/(\d+)%/);
        if (m) share = Number(m[1]);
      }
      expectedReturnPct = share / 100 * eq + (1 - share / 100) * bd - fee - kpi;
    }
  }

  const r = expectedReturnPct / 100;
  const net = Math.round(portfolio);
  const future = Math.round(portfolio * Math.pow(1 + r, years));
  const gainFuture = Math.max(0, future - capital);

  let shieldRate = 0;
  const shieldSlider = document.getElementById("shield-rate-slider");
  if (shieldSlider && shieldSlider.value) shieldRate = Number(shieldSlider.value);
  else if (isFinite(AppState.shieldRatePct)) shieldRate = Number(AppState.shieldRatePct);

  let equitySharePct = 65;
  if (typeof AppState.stockSharePercent === "number") equitySharePct = AppState.stockSharePercent;
  else if (AppState.stockShareOption) {
    const m = String(AppState.stockShareOption).match(/(\d+)%/);
    if (m) equitySharePct = Number(m[1]);
  }

  const capitalAksjeandel = capital * (equitySharePct / 100);
  const shieldBase = Math.round(
    capitalAksjeandel * Math.pow(1 + shieldRate / 100, years) - capitalAksjeandel
  );
  const excess = Math.max(0, gainFuture - shieldBase);
  const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
  const capitalTaxRate = (AppState.capitalTaxPct || 22.00) / 100;
  const equityShare = Math.max(0, Math.min(1, equitySharePct / 100));
  const effectiveTaxRate =
    equitySharePct > 80 ? stockTaxRate : equityShare * stockTaxRate + (1 - equityShare) * capitalTaxRate;
  const taxFuture = Math.round(excess * effectiveTaxRate);
  const netFuture = Math.max(0, future - taxFuture);

  return {
    portfolio,
    tax: 0,
    net,
    years,
    expectedRate: r,
    taxFuture,
    future,
    netFuture,
  };
}

/**
 * Fondskonto-graf: hovedstol år 1, ev. skatt ved flytting, vekst i X år, deretter skatt.
 * Sluttverdi = Netto portefølje i valgt panel.
 */
function buildFondskontoVisGrafiskData(kind) {
  const inputs =
    kind === "fondskonto-ikke-flytt"
      ? getFondskontoIkkeFlyttChartInputs()
      : getFondskontoFlyttChartInputs();
  const { portfolio, tax, net, years, expectedRate, taxFuture, netFuture } = inputs;
  const yearRows = [];
  let bal = net;

  for (let y = 1; y <= years; y++) {
    const isFirst = y === 1;
    const start = isFirst ? portfolio : bal;
    const growthBase = isFirst ? net : bal;
    const growth = growthBase * expectedRate;
    bal = growthBase + growth;
    yearRows.push({
      kind,
      year: y,
      hovedstol: start,
      growth,
      firstTax: isFirst ? -tax : 0,
      payment: 0,
      endPortfolio: bal,
      isLast: y === years,
    });
  }

  const last = yearRows[yearRows.length - 1];
  if (last) {
    last.tax = -taxFuture;
    last.final = netFuture;
    if (isFinite(inputs.future)) last.endPortfolio = inputs.future;
  }

  return { portfolio, years, yearRows, netFuture };
}

function buildFondskontoFlyttVisGrafiskData() {
  return buildFondskontoVisGrafiskData("fondskonto-flytt");
}

const VIS_GRAFISK_COLORS = {
  positive: "#5B8DEF", // behagelig blå (hovedstol + avkastning)
  negative: "#98A2B3", // behagelig grå (alle trekk)
  stroke: "#FFFFFF",
};

function signedChartPart(label, value) {
  if (Math.abs(value) < 0.5) return null;
  return { label, value };
}

function getVisGrafiskStacks(row) {
  const positive = [];
  const negative = [];

  const hovedstol = Number(row.hovedstol) || 0;
  const growth = Number(row.growth) || 0;
  const posSum = hovedstol + Math.max(0, growth);
  if (posSum > 0.5) {
    positive.push({
      value: posSum,
      color: VIS_GRAFISK_COLORS.positive,
      title: "Hovedstol + avkastning",
      parts: [
        signedChartPart("Hovedstol", hovedstol),
        signedChartPart("Avkastning", growth),
      ].filter(Boolean),
    });
  }

  if (row.kind === "dividend") {
    if (row.isLast) {
      const uttak = Math.abs(Number(row.dividend) || 0);
      const tax = Number(row.tax) || 0;
      const interest = Math.abs(Number(row.interestCosts) || 0);
      const ded = Number(row.interestDeduction) || 0;
      const negParts = [
        signedChartPart("Utbytte", -uttak),
        signedChartPart("Utbytteskatt", tax),
        signedChartPart("Rentekostnader", -interest),
        signedChartPart("Skattefradrag renter", ded),
      ].filter(Boolean);
      const negNet = -uttak + tax - interest + ded;
      if (negNet < -0.5) {
        negative.push({
          value: Math.abs(negNet),
          color: VIS_GRAFISK_COLORS.negative,
          title: "Uttak, skatt og renter",
          parts: negParts,
        });
      }
    }
    return { positive, negative };
  }

  if (row.kind === "fondskonto-differanse") {
    const diff = Number(row.diff) || 0;
    const part = signedChartPart("Differanse", diff);
    const pctPart = isFinite(row.pct)
      ? { label: "Andel av netto", value: row.pct, unit: "pct", note: true }
      : null;
    const shortPart = isFinite(row.shortPct)
      ? {
          label: "Årlig reduksjon i avkastning",
          value: row.shortPct,
          unit: "pct-short",
          note: true,
        }
      : null;
    const parts = [part, pctPart, shortPart].filter(Boolean);
    if (diff > 0.5) {
      positive.push({
        value: diff,
        color: VIS_GRAFISK_COLORS.positive,
        title: "Differanse",
        parts,
      });
    } else if (diff < -0.5) {
      negative.push({
        value: Math.abs(diff),
        color: VIS_GRAFISK_COLORS.negative,
        title: "Differanse",
        parts,
      });
    }
    return { positive, negative };
  }

  if (row.kind === "fondskonto-flytt" || row.kind === "fondskonto-ikke-flytt") {
    const firstTax = Number(row.firstTax) || 0;
    const futureTax = row.isLast ? Number(row.tax) || 0 : 0;
    const negParts = [
      signedChartPart(isRealisationTabActive() ? "Skatt år 1" : "Skatt ved flytting", firstTax),
      signedChartPart("Skatt", futureTax),
    ].filter(Boolean);
    const negNet = firstTax + futureTax;
    if (negNet < -0.5) {
      negative.push({
        value: Math.abs(negNet),
        color: VIS_GRAFISK_COLORS.negative,
        title: "Skatt",
        parts: negParts,
      });
    }
    return { positive, negative };
  }

  const payment = Number(row.payment) || 0;
  const tax = row.isLast ? Number(row.tax) || 0 : 0;
  const debt = row.isLast ? Number(row.debtSettle) || 0 : 0;
  const ded = row.isLast ? Number(row.interestDeduction) || 0 : 0;
  const extrasNet = tax + debt + ded;
  const negParts = [
    signedChartPart("Uttak til renter og avdrag", payment ? -payment : 0),
    ...(row.isLast
      ? [
          signedChartPart("Skatt", tax),
          signedChartPart("Oppgjør gjeld", debt),
          signedChartPart("Fradrag rentekostnader", ded),
        ]
      : []),
  ].filter(Boolean);
  const negNet = -payment + extrasNet;
  if (negNet < -0.5) {
    negative.push({
      value: Math.abs(negNet),
      color: VIS_GRAFISK_COLORS.negative,
      title: row.isLast ? "Negative beløp" : "Uttak til renter og avdrag",
      parts: negParts,
    });
  }

  return { positive, negative };
}

function buildFondskontoLineSeries(inputs, name, color) {
  const { portfolio, net, years, expectedRate, netFuture } = inputs;
  const points = [{ year: 0, value: portfolio, label: "Portefølje" }];
  let bal = net;
  for (let y = 1; y <= years; y++) {
    bal = bal * (1 + expectedRate);
    const isLast = y === years;
    points.push({
      year: y,
      value: isLast ? netFuture : bal,
      label: isLast ? "Netto portefølje" : "Verdi",
    });
  }
  return { name, color, points, endValue: netFuture };
}

function buildFondskontoCompareLineData() {
  const realisation = isRealisationTabActive();
  return {
    series: [
      buildFondskontoLineSeries(
        getFondskontoFlyttChartInputs(),
        realisation ? "Gjennomføre endring" : "Flytte fondskonto",
        VIS_GRAFISK_COLORS.positive
      ),
      buildFondskontoLineSeries(
        getFondskontoIkkeFlyttChartInputs(),
        realisation ? "Ikke gjennomføre endring" : "Ikke flytte Fondskonto",
        CHART_THEME.ink
      ),
    ],
  };
}

function buildFondskontoDiffBarData() {
  const currentYears = Math.max(1, getSummaryYears() || 10);
  const horizon = currentYears;
  const r = getSummaryExpectedReturnPct() / 100;
  const taxRate = 0.3784;

  const parsedPortfolio = parseNokFromEl(document.getElementById("fk-left-portfolio"))
    || parseNokFromEl(document.getElementById("fk-right-portfolio"));
  const portfolio = isFinite(parsedPortfolio)
    ? Math.round(parsedPortfolio)
    : (isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : 0);

  const parsedTax1 = parseNokFromEl(document.getElementById("fk-left-tax"));
  const taxYear1 = isFinite(parsedTax1)
    ? Math.round(parsedTax1)
    : (Number.isFinite(Number(AppState.realisationTax)) ? Math.round(Number(AppState.realisationTax)) : 0);

  const parsedGain = parseNokFromEl(document.getElementById("fk-right-gain"))
    || parseNokFromEl(document.getElementById("fk-left-gain"));
  const gainNow = isFinite(parsedGain)
    ? Math.round(parsedGain)
    : (Number.isFinite(Number(AppState.realisationGain)) ? Math.round(Number(AppState.realisationGain)) : 0);

  const parsedNetNow = parseNokFromEl(document.getElementById("fk-right-net-now"));
  const netRightNow = isFinite(parsedNetNow) ? Math.round(parsedNetNow) : portfolio;
  const netLeftNow = Math.max(0, Math.round(portfolio - taxYear1));

  const parsedLeftNet = parseNokFromEl(document.getElementById("fk-left-net"));
  const pctBase = isFinite(parsedLeftNet) && parsedLeftNet > 0 ? parsedLeftNet : netLeftNow;

  const yearRows = [];
  for (let y = 1; y <= horizon; y++) {
    const futureLeft = Math.round(netLeftNow * Math.pow(1 + r, y));
    const taxLeftFuture = Math.round(Math.max(0, futureLeft - netLeftNow) * taxRate);
    const netLeft = futureLeft - taxLeftFuture;

    const futureRight = Math.round(netRightNow * Math.pow(1 + r, y));
    const gainRight = gainNow + (futureRight - netRightNow);
    const taxRightFuture = Math.round(Math.max(0, gainRight) * taxRate);
    const netRight = futureRight - taxRightFuture;

    const diff = netRight - netLeft;
    const pct = pctBase > 0 ? (diff / pctBase) * 100 : 0;
    const shortPct = longRateToShortRatePct(pct, y);
    yearRows.push({
      kind: "fondskonto-differanse",
      year: y,
      diff,
      pct,
      shortPct,
      hovedstol: 0,
      growth: 0,
      endPortfolio: diff,
      final: diff,
      isLast: y === horizon,
      alwaysShowLabel: y === currentYears,
    });
  }

  return { years: horizon, yearRows, pctBase };
}

function cmToChartPx(cm) {
  return (cm * 96) / 2.54;
}

function separateStackedLabelYs(preferredYs, minSep, minY, maxY) {
  const items = preferredYs.map((y, i) => ({ i, y })).sort((a, b) => a.y - b.y);
  if (items.length < 2) return preferredYs.slice();

  const mid = items.reduce((s, it) => s + it.y, 0) / items.length;
  const span = minSep * (items.length - 1);
  let start = mid - span / 2;
  if (start < minY) start = minY;
  if (start + span > maxY) start = maxY - span;
  items.forEach((it, idx) => {
    const packed = start + idx * minSep;
    if (idx === 0) {
      it.y = Math.min(it.y, packed);
    } else if (idx === items.length - 1) {
      it.y = Math.max(it.y, packed);
    } else {
      it.y = packed;
    }
  });
  for (let i = 1; i < items.length; i++) {
    if (items[i].y - items[i - 1].y < minSep) {
      items[i].y = items[i - 1].y + minSep;
    }
  }
  const overflow = items[items.length - 1].y - maxY;
  if (overflow > 0) items.forEach((it) => { it.y -= overflow; });
  if (items[0].y < minY) {
    items[0].y = minY;
    for (let i = 1; i < items.length; i++) {
      items[i].y = Math.max(items[i].y, items[i - 1].y + minSep);
    }
  }

  const result = new Array(preferredYs.length);
  items.forEach((it) => { result[it.i] = it.y; });
  return result;
}

function drawFondskontoCompareChart(data) {
  const chartContainer = document.getElementById("vis-grafisk-container");
  if (!chartContainer) return;

  const { series } = data || buildFondskontoCompareLineData();
  const allPoints = series.flatMap((s) => s.points);
  if (!allPoints.length) return;

  const values = allPoints.map((p) => p.value);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(...values, 1);
  const pad = 1.1;
  let niceMax = maxValue * pad;
  let niceMin = minValue < 0 ? minValue * pad : 0;
  let range = niceMax - niceMin || 1;
  const niceTick = niceNumber(range / 8, true) || range / 8;
  if (niceMin < 0) niceMin = Math.floor(niceMin / niceTick) * niceTick;
  niceMax = Math.ceil(niceMax / niceTick) * niceTick;
  range = niceMax - niceMin || 1;

  const existingSvg = chartContainer.querySelector("svg");
  if (existingSvg) existingSvg.remove();
  const existingLegend = chartContainer.querySelector(".vis-grafisk-legend");
  if (existingLegend) existingLegend.remove();
  const existingTip = chartContainer.querySelector(".vis-grafisk-tooltip");
  if (existingTip) existingTip.remove();

  const tooltip = document.createElement("div");
  tooltip.className = "vis-grafisk-tooltip";
  tooltip.hidden = true;

  function hideChartTooltip() {
    tooltip.hidden = true;
    tooltip.innerHTML = "";
  }

  function positionChartTooltip(evt) {
    const cr = chartContainer.getBoundingClientRect();
    const padPx = 12;
    const tw = tooltip.offsetWidth || 220;
    const th = tooltip.offsetHeight || 80;
    let left = evt.clientX - cr.left + padPx;
    let top = evt.clientY - cr.top + padPx;
    if (left + tw + 8 > cr.width) left = evt.clientX - cr.left - tw - padPx;
    if (top + th + 8 > cr.height) top = evt.clientY - cr.top - th - padPx;
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
  }

  function showLineTooltip(seriesItem, point, evt) {
    tooltip.innerHTML = [
      `<div class="vis-grafisk-tooltip-row vis-grafisk-tooltip-total"><span>${seriesItem.name}</span><span></span></div>`,
      `<div class="vis-grafisk-tooltip-row"><span>${point.label}</span><span>${formatNOK(Math.round(point.value))}</span></div>`,
      `<div class="vis-grafisk-tooltip-row"><span>År</span><span>${point.year}</span></div>`,
    ].join("");
    tooltip.hidden = false;
    positionChartTooltip(evt);
  }

  const containerRect = chartContainer.getBoundingClientRect();
  const width = Math.max(640, containerRect.width || 900);
  const height = Math.max(360, containerRect.height || 520);
  const margin = { top: 28, right: 28, bottom: 88, left: 108 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const maxYear = Math.max(...allPoints.map((p) => p.year), 1);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.overflow = "visible";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);

  const yScale = (v) => chartHeight - ((v - niceMin) / range) * chartHeight;
  const xScale = (year) => (year / maxYear) * chartWidth;

  const ticks = [];
  for (let t = 0; t >= niceMin; t -= niceTick) ticks.push(t);
  for (let t = niceTick; t <= niceMax; t += niceTick) ticks.push(t);
  const uniqueTicks = [...new Set(ticks)].sort((a, b) => a - b);
  appendChartGridLines(g, uniqueTicks, niceMin, niceMax, chartWidth, chartHeight);

  uniqueTicks.forEach((tick) => {
    const y = yScale(tick);
    const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tickLine.setAttribute("x1", -6);
    tickLine.setAttribute("y1", y);
    tickLine.setAttribute("x2", 0);
    tickLine.setAttribute("y2", y);
    tickLine.setAttribute("stroke", CHART_THEME.axis);
    tickLine.setAttribute("stroke-width", "1.5");
    g.appendChild(tickLine);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", -10);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    styleChartText(label, { size: CHART_THEME.tickSize, weight: "500" });
    label.textContent = formatNOK(Math.round(tick));
    g.appendChild(label);
  });

  const zeroY = yScale(0);
  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", 0);
  xAxisLine.setAttribute("y1", zeroY);
  xAxisLine.setAttribute("x2", chartWidth);
  xAxisLine.setAttribute("y2", zeroY);
  xAxisLine.setAttribute("stroke", "var(--sp-navy, #002359)");
  xAxisLine.setAttribute("stroke-width", "2.5");
  g.appendChild(xAxisLine);

  for (let year = 0; year <= maxYear; year++) {
    const x = xScale(year);
    const yearLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yearLabel.setAttribute("x", x);
    yearLabel.setAttribute("y", chartHeight + 22);
    yearLabel.setAttribute("text-anchor", "middle");
    styleChartText(yearLabel, { size: CHART_THEME.categorySize, weight: "500", fill: CHART_THEME.ink });
    yearLabel.textContent = String(year);
    g.appendChild(yearLabel);
  }

  series.forEach((seriesItem) => {
    const d = seriesItem.points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.year)} ${yScale(p.value)}`)
      .join(" ");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", seriesItem.color);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
    g.appendChild(path);

    seriesItem.points.forEach((point) => {
      const cx = xScale(point.year);
      const cy = yScale(point.value);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", cx);
      dot.setAttribute("cy", cy);
      dot.setAttribute("r", 5);
      dot.setAttribute("fill", seriesItem.color);
      dot.setAttribute("stroke", "#FFFFFF");
      dot.setAttribute("stroke-width", "2");
      dot.style.cursor = "pointer";
      dot.addEventListener("mouseenter", (e) => showLineTooltip(seriesItem, point, e));
      dot.addEventListener("mousemove", positionChartTooltip);
      dot.addEventListener("mouseleave", hideChartTooltip);
      g.appendChild(dot);
    });

  });

  const endLabelPlans = series.map((seriesItem) => {
    const last = seriesItem.points[seriesItem.points.length - 1];
    if (!last) return null;
    return {
      last,
      x: xScale(last.year),
      preferredY: yScale(last.value) - 12,
    };
  }).filter(Boolean);
  const labelSize = Number(CHART_THEME.valueSize) || 18;
  const minLabelSep = cmToChartPx(1) + labelSize;
  const separatedYs = separateStackedLabelYs(
    endLabelPlans.map((p) => p.preferredY),
    minLabelSep,
    16,
    chartHeight - 8
  );
  endLabelPlans.forEach((plan, i) => {
    const endLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    endLabel.setAttribute("x", plan.x);
    endLabel.setAttribute("y", separatedYs[i]);
    endLabel.setAttribute("text-anchor", "end");
    styleChartText(endLabel, { size: CHART_THEME.valueSize, weight: "600", fill: CHART_THEME.ink });
    endLabel.textContent = formatNOK(Math.round(plan.last.value));
    endLabel.style.pointerEvents = "none";
    g.appendChild(endLabel);
  });

  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", chartWidth / 2);
  xAxisLabel.setAttribute("y", chartHeight + 48);
  xAxisLabel.setAttribute("text-anchor", "middle");
  styleChartText(xAxisLabel, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
  xAxisLabel.textContent = "Antall år";
  g.appendChild(xAxisLabel);

  svg.appendChild(g);
  chartContainer.appendChild(svg);

  const legend = document.createElement("div");
  legend.className = "vis-grafisk-legend";
  const legendGroup = document.createElement("div");
  legendGroup.className = "vis-grafisk-legend-group";
  series.forEach((s) => {
    const item = document.createElement("span");
    item.className = "vis-grafisk-legend-item";
    item.innerHTML = `<i style="background:${s.color}"></i>${s.name}`;
    legendGroup.appendChild(item);
  });
  legend.appendChild(legendGroup);
  chartContainer.appendChild(legend);
  chartContainer.appendChild(tooltip);
}

function drawVisGrafiskChart(kind) {
  const chartKind = kind || window._visGrafiskKind || "loan";
  if (chartKind === "fondskonto-sammenlign") {
    drawFondskontoCompareChart();
    return;
  }

  const chartContainer = document.getElementById("vis-grafisk-container");
  if (!chartContainer) return;

  const data =
    chartKind === "dividend"
      ? buildDividendVisGrafiskData()
      : chartKind === "fondskonto-flytt" || chartKind === "fondskonto-ikke-flytt"
        ? buildFondskontoVisGrafiskData(chartKind)
        : chartKind === "fondskonto-differanse"
          ? buildFondskontoDiffBarData()
          : buildVisGrafiskData();
  const { yearRows } = data;
  if (!yearRows.length) return;

  const stacksByYear = yearRows.map((row) => ({
    row,
    ...getVisGrafiskStacks(row),
  }));

  let maxPos = 0;
  let maxNeg = 0;
  stacksByYear.forEach(({ positive, negative }) => {
    const posSum = positive.reduce((s, p) => s + p.value, 0);
    const negSum = negative.reduce((s, n) => s + n.value, 0);
    if (posSum > maxPos) maxPos = posSum;
    if (negSum > maxNeg) maxNeg = negSum;
  });

  // Y-akse følger data (med litt luft), slik at søylene fyller mer av høyden
  const pad = 1.1;
  let niceMax = Math.max(maxPos * pad, 1);
  let niceMin = maxNeg > 0 ? -maxNeg * pad : 0;
  if (chartKind === "fondskonto-differanse") {
    const lastDiff = Number(yearRows[yearRows.length - 1]?.diff) || 0;
    const lastAbs = Math.abs(lastDiff);
    const axisMax = lastAbs * 2.5; // siste års differanse + 150 %
    if (lastDiff >= 0) {
      niceMax = Math.max(axisMax, 1);
      niceMin = maxNeg > 0 ? -maxNeg * pad : 0;
    } else {
      niceMax = maxPos > 0 ? maxPos * pad : 0;
      niceMin = -Math.max(axisMax, 1);
    }
  }

  let range = niceMax - niceMin || 1;
  const niceTick = niceNumber(range / 8, true) || range / 8;
  // Avrund ticks uten å blåse opp skalaen unødig
  if (niceMin < 0) {
    niceMin = Math.floor(niceMin / niceTick) * niceTick;
  }
  niceMax = Math.ceil(niceMax / niceTick) * niceTick;
  range = niceMax - niceMin || 1;

  const existingSvg = chartContainer.querySelector("svg");
  if (existingSvg) existingSvg.remove();
  const existingLegend = chartContainer.querySelector(".vis-grafisk-legend");
  if (existingLegend) existingLegend.remove();
  const existingTip = chartContainer.querySelector(".vis-grafisk-tooltip");
  if (existingTip) existingTip.remove();

  const tooltip = document.createElement("div");
  tooltip.className = "vis-grafisk-tooltip";
  tooltip.hidden = true;

  function hideChartTooltip() {
    tooltip.hidden = true;
    tooltip.innerHTML = "";
  }

  function showChartTooltip(seg, evt) {
    const parts = Array.isArray(seg.parts) && seg.parts.length
      ? seg.parts
      : [{ label: seg.title, value: seg.value }];
    const rows = parts.map((p) => {
      const formatted = p.unit === "pct-short"
        ? formatShortRatePct(p.value)
        : p.unit === "pct"
          ? formatDiffPct(p.value)
          : formatNOK(Math.round(p.value));
      return `<div class="vis-grafisk-tooltip-row"><span>${p.label}</span><span>${formatted}</span></div>`;
    });
    if (parts.length > 1) {
      const totalParts = parts.filter((p) => !p.note);
      const total = totalParts.reduce((s, p) => s + p.value, 0);
      rows.push(`<div class="vis-grafisk-tooltip-row vis-grafisk-tooltip-total"><span>Sum</span><span>${formatNOK(Math.round(total))}</span></div>`);
    }
    tooltip.innerHTML = rows.join("");
    tooltip.hidden = false;
    positionChartTooltip(evt);
  }

  function positionChartTooltip(evt) {
    const cr = chartContainer.getBoundingClientRect();
    const pad = 12;
    const tw = tooltip.offsetWidth || 220;
    const th = tooltip.offsetHeight || 80;
    let left = evt.clientX - cr.left + pad;
    let top = evt.clientY - cr.top + pad;
    if (left + tw + 8 > cr.width) left = evt.clientX - cr.left - tw - pad;
    if (top + th + 8 > cr.height) top = evt.clientY - cr.top - th - pad;
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
  }

  const containerRect = chartContainer.getBoundingClientRect();
  const width = Math.max(640, containerRect.width || 900);
  const height = Math.max(360, containerRect.height || 520);
  const margin = {
    top: 28,
    right: chartKind === "fondskonto-differanse" ? 108 : 20,
    bottom: 88,
    left: 108,
  };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.overflow = "visible";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);

  const yScale = (v) => chartHeight - ((v - niceMin) / range) * chartHeight;

  const ticks = [];
  for (let t = 0; t >= niceMin; t -= niceTick) ticks.push(t);
  for (let t = niceTick; t <= niceMax; t += niceTick) ticks.push(t);
  const uniqueTicks = [...new Set(ticks)].sort((a, b) => a - b);
  appendChartGridLines(g, uniqueTicks, niceMin, niceMax, chartWidth, chartHeight);

  uniqueTicks.forEach((tick) => {
    const y = yScale(tick);
    const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tickLine.setAttribute("x1", -6);
    tickLine.setAttribute("y1", y);
    tickLine.setAttribute("x2", 0);
    tickLine.setAttribute("y2", y);
    tickLine.setAttribute("stroke", CHART_THEME.axis);
    tickLine.setAttribute("stroke-width", "1.5");
    g.appendChild(tickLine);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", -10);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    styleChartText(label, { size: CHART_THEME.tickSize, weight: "500" });
    label.textContent = formatNOK(Math.round(tick));
    g.appendChild(label);
  });

  if (chartKind === "fondskonto-differanse" && data.pctBase > 0) {
    const rightAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rightAxis.setAttribute("x1", chartWidth);
    rightAxis.setAttribute("y1", 0);
    rightAxis.setAttribute("x2", chartWidth);
    rightAxis.setAttribute("y2", chartHeight);
    rightAxis.setAttribute("stroke", CHART_THEME.axis);
    rightAxis.setAttribute("stroke-width", "1.5");
    g.appendChild(rightAxis);

    uniqueTicks.forEach((tick) => {
      const yPct = yScale(tick);
      const rightTick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      rightTick.setAttribute("x1", chartWidth);
      rightTick.setAttribute("y1", yPct);
      rightTick.setAttribute("x2", chartWidth + 6);
      rightTick.setAttribute("y2", yPct);
      rightTick.setAttribute("stroke", CHART_THEME.axis);
      rightTick.setAttribute("stroke-width", "1.5");
      g.appendChild(rightTick);

      const pct = (tick / data.pctBase) * 100;
      const pctLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      pctLabel.setAttribute("x", chartWidth + 10);
      pctLabel.setAttribute("y", yPct);
      pctLabel.setAttribute("text-anchor", "start");
      pctLabel.setAttribute("dominant-baseline", "middle");
      styleChartText(pctLabel, { size: CHART_THEME.tickSize, weight: "500" });
      pctLabel.textContent = formatDiffPct(pct);
      g.appendChild(pctLabel);
    });

    const pctTitleX = chartWidth + 86;
    const pctTitleY = chartHeight / 2;
    const pctAxisTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    pctAxisTitle.setAttribute("x", pctTitleX);
    pctAxisTitle.setAttribute("y", pctTitleY);
    pctAxisTitle.setAttribute("text-anchor", "middle");
    pctAxisTitle.setAttribute("transform", `rotate(-90 ${pctTitleX} ${pctTitleY})`);
    styleChartText(pctAxisTitle, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
    pctAxisTitle.textContent = "Differanse i %";
    g.appendChild(pctAxisTitle);
  }

  const zeroY = yScale(0);
  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", 0);
  xAxisLine.setAttribute("y1", zeroY);
  xAxisLine.setAttribute("x2", chartWidth);
  xAxisLine.setAttribute("y2", zeroY);
  xAxisLine.setAttribute("stroke", "var(--sp-navy, #002359)");
  xAxisLine.setAttribute("stroke-width", "2.5");
  g.appendChild(xAxisLine);

  const groupWidth = chartWidth / yearRows.length;
  const barWidth = groupWidth * 0.55;
  const barRadius = Math.min(18, barWidth * 0.42);

  function roundedBarPath(x, y, w, h, r, roundTop) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    if (radius < 0.5) {
      return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
    }
    if (roundTop) {
      return [
        `M ${x} ${y + h}`,
        `V ${y + radius}`,
        `Q ${x} ${y} ${x + radius} ${y}`,
        `H ${x + w - radius}`,
        `Q ${x + w} ${y} ${x + w} ${y + radius}`,
        `V ${y + h}`,
        `Z`,
      ].join(" ");
    }
    return [
      `M ${x} ${y}`,
      `H ${x + w}`,
      `V ${y + h - radius}`,
      `Q ${x + w} ${y + h} ${x + w - radius} ${y + h}`,
      `H ${x + radius}`,
      `Q ${x} ${y + h} ${x} ${y + h - radius}`,
      `Z`,
    ].join(" ");
  }

  function addSegment(parent, x, fromVal, toVal, seg) {
    if (Math.abs(toVal - fromVal) < 0.5) return;
    const y1 = yScale(fromVal);
    const y2 = yScale(toVal);
    const top = Math.min(y1, y2);
    const h = Math.max(2, Math.abs(y2 - y1));
    const roundTop = toVal > fromVal;
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shape.setAttribute("d", roundedBarPath(x, top, barWidth, h, barRadius, roundTop));
    shape.setAttribute("fill", seg.color);
    shape.style.cursor = "pointer";
    shape.addEventListener("mouseenter", (e) => {
      shape.style.filter = "brightness(1.06)";
      showChartTooltip(seg, e);
    });
    shape.addEventListener("mousemove", positionChartTooltip);
    shape.addEventListener("mouseleave", () => {
      shape.style.filter = "";
      hideChartTooltip();
    });
    parent.appendChild(shape);
  }

  stacksByYear.forEach(({ row, positive, negative }) => {
    const x = (row.year - 1) * groupWidth + (groupWidth - barWidth) / 2;
    const yearGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    let posCursor = 0;
    positive.forEach((seg) => {
      addSegment(yearGroup, x, posCursor, posCursor + seg.value, seg);
      posCursor += seg.value;
    });

    let negCursor = 0;
    negative.forEach((seg) => {
      addSegment(yearGroup, x, negCursor, negCursor - seg.value, seg);
      negCursor -= seg.value;
    });

    const yearLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yearLabel.setAttribute("x", x + barWidth / 2);
    yearLabel.setAttribute("y", chartHeight + 22);
    yearLabel.setAttribute("text-anchor", "middle");
    styleChartText(yearLabel, { size: CHART_THEME.categorySize, weight: "500", fill: CHART_THEME.ink });
    yearLabel.textContent = String(row.year);
    yearGroup.appendChild(yearLabel);

    const endVal = row.diff != null ? row.diff : (row.isLast ? row.final : row.endPortfolio);
    const endLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    endLabel.setAttribute("x", x + barWidth / 2);
    const labelY = (Number(endVal) || 0) >= 0 ? yScale(posCursor) - 6 : yScale(negCursor) + 14;
    endLabel.setAttribute("y", labelY);
    endLabel.setAttribute("text-anchor", "middle");
    styleChartText(endLabel, { size: CHART_THEME.valueSize, weight: "600", fill: CHART_THEME.ink });
    endLabel.textContent = formatNOK(Math.round(endVal));
    endLabel.style.pointerEvents = "none";
    if (!row.alwaysShowLabel && (row.kind === "fondskonto-differanse" || !row.isLast)) {
      endLabel.style.opacity = "0";
      endLabel.style.transition = "opacity 0.12s ease";
      yearGroup.addEventListener("mouseenter", () => { endLabel.style.opacity = "1"; });
      yearGroup.addEventListener("mouseleave", () => { endLabel.style.opacity = "0"; });
    }
    yearGroup.appendChild(endLabel);
    g.appendChild(yearGroup);
  });

  if (chartKind === "fondskonto-differanse") {
    const lineColor = "#8B95A5";
    const pctPoints = yearRows.map((row) => ({
      x: (row.year - 1) * groupWidth + groupWidth / 2,
      y: yScale(Number(row.diff) || 0),
      row,
    }));
    const linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    linePath.setAttribute("d", pctPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" "));
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", lineColor);
    linePath.setAttribute("stroke-width", "2.75");
    linePath.setAttribute("stroke-linejoin", "round");
    linePath.setAttribute("stroke-linecap", "round");
    linePath.style.pointerEvents = "none";
    g.appendChild(linePath);

    pctPoints.forEach((point) => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", point.x);
      dot.setAttribute("cy", point.y);
      dot.setAttribute("r", 5);
      dot.setAttribute("fill", lineColor);
      dot.setAttribute("stroke", "#FFFFFF");
      dot.setAttribute("stroke-width", "2");
      dot.style.cursor = "pointer";
      const seg = {
        title: "Differanse i %",
        value: point.row.pct,
        parts: [
          { label: "Differanse", value: point.row.diff },
          { label: "Andel av netto", value: point.row.pct, unit: "pct", note: true },
          {
            label: "Årlig reduksjon i avkastning",
            value: point.row.shortPct,
            unit: "pct-short",
            note: true,
          },
        ],
      };
      dot.addEventListener("mouseenter", (e) => showChartTooltip(seg, e));
      dot.addEventListener("mousemove", positionChartTooltip);
      dot.addEventListener("mouseleave", hideChartTooltip);
      g.appendChild(dot);
    });
  }

  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", chartWidth / 2);
  xAxisLabel.setAttribute("y", chartHeight + 48);
  xAxisLabel.setAttribute("text-anchor", "middle");
  styleChartText(xAxisLabel, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
  xAxisLabel.textContent = "Antall år";
  g.appendChild(xAxisLabel);

  svg.appendChild(g);
  chartContainer.appendChild(svg);

  const legend = document.createElement("div");
  legend.className = "vis-grafisk-legend";
  const negativeLegend =
    chartKind === "dividend"
      ? "Uttak, skatt og renter"
      : chartKind === "fondskonto-differanse"
        ? "Negativ differanse"
        : chartKind === "fondskonto-flytt" || chartKind === "fondskonto-ikke-flytt"
          ? "Skatt"
          : "Uttak og oppgjør";
  const positiveLegend = chartKind === "fondskonto-differanse"
    ? "Differanse ( Gjennomføre Vs. Ikke gjennomføre)"
    : "Hovedstol + avkastning";
  const pctLineItem = chartKind === "fondskonto-differanse"
    ? `<span class="vis-grafisk-legend-item"><i style="background:#8B95A5;width:16px;height:3px;border-radius:2px;"></i>Differanseavkastning i % av nettoportefølje i år 1</span>`
    : "";
  const negativeItem = chartKind === "fondskonto-differanse"
    ? ""
    : `<span class="vis-grafisk-legend-item"><i style="background:${VIS_GRAFISK_COLORS.negative}"></i>${negativeLegend}</span>`;
  legend.innerHTML = `
    <div class="vis-grafisk-legend-group">
      <span class="vis-grafisk-legend-item"><i style="background:${VIS_GRAFISK_COLORS.positive}"></i>${positiveLegend}</span>
      ${pctLineItem}
      ${negativeItem}
    </div>
  `;
  chartContainer.appendChild(legend);
  chartContainer.appendChild(tooltip);
}

// «Vis grafisk»-modal — porteføljeutvikling år for år
function initVisGrafiskUI() {
  const modal = document.getElementById("vis-grafisk-modal");
  if (!modal) return;

  function openVisGrafiskModal(kind = "loan") {
    if (!modal.hasAttribute("hidden")) {
      closeVisGrafiskModal();
      return;
    }
    window._visGrafiskKind =
      kind === "dividend" ||
      kind === "fondskonto-flytt" ||
      kind === "fondskonto-ikke-flytt" ||
      kind === "fondskonto-sammenlign" ||
      kind === "fondskonto-differanse"
        ? kind
        : "loan";
    modal.removeAttribute("hidden");
    const title = document.getElementById("vis-grafisk-title");
    if (title) {
      title.textContent =
        window._visGrafiskKind === "fondskonto-flytt"
          ? (isRealisationTabActive() ? "Gjennomføre endring" : "Flytte fondskonto")
          : window._visGrafiskKind === "fondskonto-ikke-flytt"
            ? (isRealisationTabActive() ? "Ikke gjennomføre endring" : "Ikke flytte Fondskonto")
            : window._visGrafiskKind === "fondskonto-sammenlign"
              ? "Sammenlign alternativer"
              : window._visGrafiskKind === "fondskonto-differanse"
                ? "Differanse mellom de to alternativene siste år etter skatt"
                : "Porteføljeutvikling";
    }
    requestAnimationFrame(() => drawVisGrafiskChart(window._visGrafiskKind));
    document.addEventListener("keydown", onKeyDown);
  }

  function closeVisGrafiskModal() {
    modal.setAttribute("hidden", "");
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeVisGrafiskModal();
    }
  }

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-close") === "true") {
      closeVisGrafiskModal();
    }
  });

  window.openVisGrafiskModal = openVisGrafiskModal;
  window.drawVisGrafiskChart = drawVisGrafiskChart;
}

// Beregn netto avkastning for en gitt aksjeandel-grad (basert på nedbetale lån-beregninger)
function calculateNetReturnForEquityShare(equitySharePercent) {
  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;

  // Hent antall år
  let years = 10;
  const yearsSliderEl = document.getElementById('input-years-slider');
  if (yearsSliderEl && yearsSliderEl.value) {
    const v = Number(yearsSliderEl.value);
    if (isFinite(v) && v > 0) years = v;
  } else if (isFinite(AppState.yearsCount)) {
    years = Number(AppState.yearsCount);
  }

  // Beregn forventet avkastning med den gitte aksjeandel-graden
  const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
  const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
  const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
  const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
  const equityShare = equitySharePercent / 100;
  const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
  const expectedPct = grossExpected - fee - kpi;

  // Hent avdragsprofil
  let repaymentYears = 20;
  const repaymentSliderEl = document.getElementById('repayment-profile-slider');
  if (repaymentSliderEl && repaymentSliderEl.value) {
    const v = Number(repaymentSliderEl.value);
    if (isFinite(v) && v > 0) repaymentYears = v;
  } else if (isFinite(AppState.repaymentProfileYears)) {
    repaymentYears = Number(AppState.repaymentProfileYears);
  }

  // Beregn årlig betaling (hensynta avdragsfrihet)
  const interestOnly = AppState.interestOnly === true;
  const rate = interestPct / 100;
  const nper = repaymentYears;
  const pv = portfolio;
  const annualPayment = interestOnly
    ? portfolio * rate
    : Math.abs(calculatePMT(rate, nper, pv, 0, 0));

  // Beregn verdi ved periodens slutt med KORREKT FORMEL (to scenarier):
  const fvRate = expectedPct / 100; // Forventet avkastning (konvertert fra prosent til desimal)
  // VIKTIG: Bruk PV = portfolio (positiv) og PMT = -annualPayment (negativ) for riktig beregning
  const fvPmt = annualPayment > 0 ? -annualPayment : 0; // Negativ fordi vi tar ut penger
  const fvPv = portfolio; // Positiv fordi det er startverdi
  const fvType = 0; // Type: 0 (betaling i slutten av perioden)
  
  let futureValue;
  if (interestOnly) {
    const payingYears = Math.min(years, repaymentYears);
    if (payingYears > 0) {
      futureValue = calculateFV(fvRate, payingYears, fvPmt, fvPv, fvType);
      if (years > repaymentYears) {
        futureValue = futureValue * Math.pow(1 + fvRate, years - repaymentYears);
      }
    } else {
      futureValue = portfolio * Math.pow(1 + fvRate, years);
    }
  } else if (years <= repaymentYears) {
    // Scenario 1: Still paying down the loan
    // FV(rate=forventet_avkastning, nper=antall_år, pmt=-annualPayment, pv=portfolio)
    futureValue = calculateFV(fvRate, years, fvPmt, fvPv, fvType);
  } else {
    // Scenario 2: Loan is finished, money grows free
    // Step 1: Calculate balance at end of avdragsprofil period
    const balanceAtLoanEnd = calculateFV(fvRate, repaymentYears, fvPmt, fvPv, fvType);
    // Step 2: Compound the remaining balance for remaining years
    const remainingYears = years - repaymentYears;
    futureValue = balanceAtLoanEnd * Math.pow(1 + fvRate, remainingYears);
  }

  // Beregn restlån
  let remainingLoan = 0;
  if (interestOnly) {
    remainingLoan = portfolio;
  } else if (years < repaymentYears) {
    const remainingYears = repaymentYears - years;
    const pvRate = interestPct / 100;
    const pvNper = remainingYears;
    const pvPmt = -annualPayment;
    remainingLoan = Math.abs(calculatePV(pvRate, pvNper, pvPmt, 0, 0));
  }

  // Beregn rest innskutt kapital
  let capital = 0;
  const capitalSliderEl = document.getElementById('input-capital-slider');
  if (capitalSliderEl && capitalSliderEl.value) {
    const v = Number(capitalSliderEl.value);
    if (isFinite(v)) capital = v;
  } else if (isFinite(AppState.inputCapital)) {
    capital = Number(AppState.inputCapital);
  }

  let restCapitalValue = 0;
  if (capital > 0) {
    let shieldRatePct = 3.9;
    const shieldSliderEl = document.getElementById('shield-rate-slider');
    if (shieldSliderEl && shieldSliderEl.value) {
      const v = Number(shieldSliderEl.value);
      if (isFinite(v)) shieldRatePct = v;
    } else if (isFinite(AppState.shieldRatePct)) {
      shieldRatePct = Number(AppState.shieldRatePct);
    }
    const restRate = shieldRatePct / 100;
    const restNper = years;
    const restPmt = -annualPayment;
    const restPv = capital;
    restCapitalValue = Math.max(0, -calculateFV(restRate, restNper, restPmt, restPv, 0));
  }

  // Beregn avkastning = Verdi ved periodens slutt - Restlån ved periodens slutt
  // Dette kan bli negativt, så vi fjerner Math.max(0, ...)
  const excessValue = futureValue - remainingLoan;

  // Beregn skatt med den gitte aksjeandel-graden
  // Hvis avkastning er negativ, blir skatt positiv (skattefordel, grønn)
  // Hvis avkastning er positiv, blir skatt negativ (skattekostnad, rød)
  let taxAmount = 0;
  if (excessValue !== 0) {
    const aksjeAndel = equitySharePercent / 100;
    const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
    const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100;
    const taxRate = (aksjeAndel * stockTaxRate) + ((1 - aksjeAndel) * capitalTaxRate);
    // Beregn skatt: -Avkastning × skattesats
    taxAmount = -excessValue * taxRate;
    // Ekstra sjekk: Hvis avkastning er negativ, må skatt være positiv
    if (excessValue < 0 && taxAmount < 0) {
      taxAmount = Math.abs(taxAmount);
    }
    // Ekstra sjekk: Hvis avkastning er positiv, må skatt være negativ
    if (excessValue > 0 && taxAmount > 0) {
      taxAmount = -taxAmount;
    }
  }

  // Beregn netto portefølje etter skatt = Verdi ved periodens slutt + Skatt
  // Hvis skatt er positiv (fordel), legger vi den til. Hvis skatt er negativ (kostnad), trekker vi den fra.
  // Dette kan bli negativt, så vi fjerner Math.max(0, ...)
  const netPortfolioAfterTax = futureValue + taxAmount;

  // Beregn fradrag rentekostnader (hensynta avdragsfrihet)
  const payingYears = Math.min(years, repaymentYears);
  let totalInterest;
  if (interestOnly) {
    totalInterest = -(portfolio * rate) * payingYears;
  } else {
    let currentBalance = portfolio;
    let totalAccumulatedInterest = 0;
    for (let year = 1; year <= payingYears; year++) {
      const interestComponent = currentBalance * rate;
      const principalComponent = annualPayment - interestComponent;
      currentBalance = currentBalance - principalComponent;
      totalAccumulatedInterest += interestComponent;
    }
    totalInterest = -totalAccumulatedInterest;
  }
  const interestDeduction =
    AppState.interestTaxDeductionOnLoan !== false
      ? Math.abs(totalInterest) * ((AppState.capitalTaxPct ?? 22.00) / 100)
      : 0;

  // Beregn netto avkastning (Avkastning utover lånekostnad)
  const debtSettle = remainingLoan > 0 ? -remainingLoan : 0;
  const netReturn = netPortfolioAfterTax + debtSettle + interestDeduction;

  return netReturn;
}

// Beregn netto avkastning (Avkastning utover lånekostnad) for en gitt rentekostnad
function calculateNetReturnForInterestCost(interestCostPercent) {
  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const interestPct = interestCostPercent; // Bruk den gitte rentekostnaden

  // Hent antall år
  let years = 10;
  const yearsSliderEl = document.getElementById('input-years-slider');
  if (yearsSliderEl && yearsSliderEl.value) {
    const v = Number(yearsSliderEl.value);
    if (isFinite(v) && v > 0) years = v;
  } else if (isFinite(AppState.yearsCount)) {
    years = Number(AppState.yearsCount);
  }

  // Beregn forventet avkastning (bruk nåværende aksjeandel fra Input)
  const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
  const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
  const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
  const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
  
  // Hent aksjeandel fra Input
  let equitySharePct = 65;
  if (typeof AppState.stockSharePercent === 'number') {
    equitySharePct = AppState.stockSharePercent;
  } else if (AppState.stockShareOption) {
    const m = String(AppState.stockShareOption).match(/(\d+)%/);
    if (m) equitySharePct = Number(m[1]);
    if (/Renter/i.test(String(AppState.stockShareOption))) equitySharePct = 0;
  }
  
  const equityShare = equitySharePct / 100;
  const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
  const expectedPct = grossExpected - fee - kpi;

  // Hent avdragsprofil
  let repaymentYears = 20;
  const repaymentSliderEl = document.getElementById('repayment-profile-slider');
  if (repaymentSliderEl && repaymentSliderEl.value) {
    const v = Number(repaymentSliderEl.value);
    if (isFinite(v) && v > 0) repaymentYears = v;
  } else if (isFinite(AppState.repaymentProfileYears)) {
    repaymentYears = Number(AppState.repaymentProfileYears);
  }

  // Beregn årlig betaling med den gitte rentekostnaden (hensynta avdragsfrihet)
  const interestOnly = AppState.interestOnly === true;
  const rate = interestPct / 100;
  const nper = repaymentYears;
  const pv = portfolio;
  const annualPayment = interestOnly
    ? portfolio * rate
    : Math.abs(calculatePMT(rate, nper, pv, 0, 0));

  // Beregn verdi ved periodens slutt med KORREKT FORMEL (to scenarier):
  const fvRate = expectedPct / 100; // Forventet avkastning (konvertert fra prosent til desimal)
  // VIKTIG: Bruk PV = portfolio (positiv) og PMT = -annualPayment (negativ) for riktig beregning
  const fvPmt = annualPayment > 0 ? -annualPayment : 0; // Negativ fordi vi tar ut penger
  const fvPv = portfolio; // Positiv fordi det er startverdi
  const fvType = 0; // Type: 0 (betaling i slutten av perioden)
  
  let futureValue;
  if (interestOnly) {
    const payingYears = Math.min(years, repaymentYears);
    if (payingYears > 0) {
      futureValue = calculateFV(fvRate, payingYears, fvPmt, fvPv, fvType);
      if (years > repaymentYears) {
        futureValue = futureValue * Math.pow(1 + fvRate, years - repaymentYears);
      }
    } else {
      futureValue = portfolio * Math.pow(1 + fvRate, years);
    }
  } else if (years <= repaymentYears) {
    // Scenario 1: Still paying down the loan
    // FV(rate=forventet_avkastning, nper=antall_år, pmt=-annualPayment, pv=portfolio)
    futureValue = calculateFV(fvRate, years, fvPmt, fvPv, fvType);
  } else {
    // Scenario 2: Loan is finished, money grows free
    // Step 1: Calculate balance at end of avdragsprofil period
    const balanceAtLoanEnd = calculateFV(fvRate, repaymentYears, fvPmt, fvPv, fvType);
    // Step 2: Compound the remaining balance for remaining years
    const remainingYears = years - repaymentYears;
    futureValue = balanceAtLoanEnd * Math.pow(1 + fvRate, remainingYears);
  }

  // Beregn restlån med den gitte rentekostnaden
  let remainingLoan = 0;
  if (interestOnly) {
    remainingLoan = portfolio;
  } else if (years < repaymentYears) {
    const remainingYears = repaymentYears - years;
    const pvRate = interestPct / 100;
    const pvNper = remainingYears;
    const pvPmt = -annualPayment;
    remainingLoan = Math.abs(calculatePV(pvRate, pvNper, pvPmt, 0, 0));
  }

  // Beregn rest innskutt kapital
  let capital = 0;
  const capitalSliderEl = document.getElementById('input-capital-slider');
  if (capitalSliderEl && capitalSliderEl.value) {
    const v = Number(capitalSliderEl.value);
    if (isFinite(v)) capital = v;
  } else if (isFinite(AppState.inputCapital)) {
    capital = Number(AppState.inputCapital);
  }

  let restCapitalValue = 0;
  if (capital > 0) {
    let shieldRatePct = 3.9;
    const shieldSliderEl = document.getElementById('shield-rate-slider');
    if (shieldSliderEl && shieldSliderEl.value) {
      const v = Number(shieldSliderEl.value);
      if (isFinite(v)) shieldRatePct = v;
    } else if (isFinite(AppState.shieldRatePct)) {
      shieldRatePct = Number(AppState.shieldRatePct);
    }
    const restRate = shieldRatePct / 100;
    const restNper = years;
    const restPmt = -annualPayment;
    const restPv = capital;
    restCapitalValue = Math.max(0, -calculateFV(restRate, restNper, restPmt, restPv, 0));
  }

  // Beregn avkastning = Verdi ved periodens slutt - Restlån ved periodens slutt
  // Dette kan bli negativt, så vi fjerner Math.max(0, ...)
  const excessValue = futureValue - remainingLoan;

  // Beregn skatt
  // Hvis avkastning er negativ, blir skatt positiv (skattefordel, grønn)
  // Hvis avkastning er positiv, blir skatt negativ (skattekostnad, rød)
  let taxAmount = 0;
  if (excessValue !== 0) {
    const aksjeAndel = equitySharePct / 100;
    const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
    const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100;
    const taxRate = (aksjeAndel * stockTaxRate) + ((1 - aksjeAndel) * capitalTaxRate);
    // Beregn skatt: -Avkastning × skattesats
    taxAmount = -excessValue * taxRate;
    // Ekstra sjekk: Hvis avkastning er negativ, må skatt være positiv
    if (excessValue < 0 && taxAmount < 0) {
      taxAmount = Math.abs(taxAmount);
    }
    // Ekstra sjekk: Hvis avkastning er positiv, må skatt være negativ
    if (excessValue > 0 && taxAmount > 0) {
      taxAmount = -taxAmount;
    }
  }

  // Beregn netto portefølje etter skatt = Verdi ved periodens slutt + Skatt
  // Hvis skatt er positiv (fordel), legger vi den til. Hvis skatt er negativ (kostnad), trekker vi den fra.
  // Dette kan bli negativt, så vi fjerner Math.max(0, ...)
  const netPortfolioAfterTax = futureValue + taxAmount;

  // Beregn fradrag rentekostnader (hensynta avdragsfrihet)
  const payingYears = Math.min(years, repaymentYears);
  let totalInterest;
  if (interestOnly) {
    totalInterest = -(portfolio * rate) * payingYears;
  } else {
    let currentBalance = portfolio;
    let totalAccumulatedInterest = 0;
    for (let year = 1; year <= payingYears; year++) {
      const interestComponent = currentBalance * rate;
      const principalComponent = annualPayment - interestComponent;
      currentBalance = currentBalance - principalComponent;
      totalAccumulatedInterest += interestComponent;
    }
    totalInterest = -totalAccumulatedInterest;
  }
  const interestDeduction =
    AppState.interestTaxDeductionOnLoan !== false
      ? Math.abs(totalInterest) * ((AppState.capitalTaxPct ?? 22.00) / 100)
      : 0;

  // Beregn netto avkastning (Avkastning utover lånekostnad)
  const debtSettle = remainingLoan > 0 ? -remainingLoan : 0;
  const netReturn = netPortfolioAfterTax + debtSettle + interestDeduction;

  return netReturn;
}

// Beregn netto avkastning for et gitt antall år
function calculateNetReturnForYears(years) {
  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  const equitySharePct = typeof AppState.stockSharePercent === 'number' ? AppState.stockSharePercent : 0;

  // Beregn forventet avkastning
  const expEquity = isFinite(AppState.expEquity) ? Number(AppState.expEquity) : 8.0;
  const expBonds = isFinite(AppState.expBonds) ? Number(AppState.expBonds) : 5.0;
  const fee = isFinite(AppState.advisoryFeePct) ? Number(AppState.advisoryFeePct) : 0;
  const kpi = isFinite(AppState.expKpi) ? Number(AppState.expKpi) : 0;
  const equityShare = equitySharePct / 100;
  const grossExpected = equityShare * expEquity + (1 - equityShare) * expBonds;
  const expectedPct = grossExpected - fee - kpi;

  // Hent avdragsprofil
  let repaymentYears = 20;
  const repaymentSliderEl = document.getElementById('repayment-profile-slider');
  if (repaymentSliderEl && repaymentSliderEl.value) {
    const v = Number(repaymentSliderEl.value);
    if (isFinite(v) && v > 0) repaymentYears = v;
  } else if (isFinite(AppState.repaymentProfileYears)) {
    repaymentYears = Number(AppState.repaymentProfileYears);
  }

  // Beregn årlig betaling (hensynta avdragsfrihet)
  const interestOnly = AppState.interestOnly === true;
  const rate = interestPct / 100;
  const nper = repaymentYears;
  const pv = portfolio;
  const annualPayment = interestOnly
    ? portfolio * rate
    : Math.abs(calculatePMT(rate, nper, pv, 0, 0));

  // Beregn verdi ved periodens slutt med KORREKT FORMEL (to scenarier):
  const fvRate = expectedPct / 100; // Forventet avkastning (konvertert fra prosent til desimal)
  // VIKTIG: Bruk PV = portfolio (positiv) og PMT = -annualPayment (negativ) for riktig beregning
  const fvPmt = annualPayment > 0 ? -annualPayment : 0; // Negativ fordi vi tar ut penger
  const fvPv = portfolio; // Positiv fordi det er startverdi
  const fvType = 0; // Type: 0 (betaling i slutten av perioden)
  
  let futureValue;
  if (interestOnly) {
    const payingYears = Math.min(years, repaymentYears);
    if (payingYears > 0) {
      futureValue = calculateFV(fvRate, payingYears, fvPmt, fvPv, fvType);
      if (years > repaymentYears) {
        futureValue = futureValue * Math.pow(1 + fvRate, years - repaymentYears);
      }
    } else {
      futureValue = portfolio * Math.pow(1 + fvRate, years);
    }
  } else if (years <= repaymentYears) {
    // Scenario 1: Still paying down the loan
    // FV(rate=forventet_avkastning, nper=antall_år, pmt=-annualPayment, pv=portfolio)
    futureValue = calculateFV(fvRate, years, fvPmt, fvPv, fvType);
  } else {
    // Scenario 2: Loan is finished, money grows free
    // Step 1: Calculate balance at end of avdragsprofil period
    const balanceAtLoanEnd = calculateFV(fvRate, repaymentYears, fvPmt, fvPv, fvType);
    // Step 2: Compound the remaining balance for remaining years
    const remainingYears = years - repaymentYears;
    futureValue = balanceAtLoanEnd * Math.pow(1 + fvRate, remainingYears);
  }

  // Beregn restlån
  let remainingLoan = 0;
  if (interestOnly) {
    remainingLoan = portfolio;
  } else if (years < repaymentYears) {
    const remainingYears = repaymentYears - years;
    const pvRate = interestPct / 100;
    const pvNper = remainingYears;
    const pvPmt = -annualPayment;
    remainingLoan = Math.abs(calculatePV(pvRate, pvNper, pvPmt, 0, 0));
  }

  // Beregn rest innskutt kapital
  let capital = 0;
  const capitalSliderEl = document.getElementById('input-capital-slider');
  if (capitalSliderEl && capitalSliderEl.value) {
    const v = Number(capitalSliderEl.value);
    if (isFinite(v)) capital = v;
  } else if (isFinite(AppState.inputCapital)) {
    capital = Number(AppState.inputCapital);
  }

  let restCapitalValue = 0;
  if (capital > 0) {
    let shieldRatePct = 3.9;
    const shieldSliderEl = document.getElementById('shield-rate-slider');
    if (shieldSliderEl && shieldSliderEl.value) {
      const v = Number(shieldSliderEl.value);
      if (isFinite(v)) shieldRatePct = v;
    } else if (isFinite(AppState.shieldRatePct)) {
      shieldRatePct = Number(AppState.shieldRatePct);
    }
    const restRate = shieldRatePct / 100;
    const restNper = years;
    const restPmt = -annualPayment;
    const restPv = capital;
    restCapitalValue = Math.max(0, -calculateFV(restRate, restNper, restPmt, restPv, 0));
  }

  // Beregn avkastning = Verdi ved periodens slutt - Restlån ved periodens slutt
  // Dette kan bli negativt, så vi fjerner Math.max(0, ...)
  const excessValue = futureValue - remainingLoan;

  // Beregn skatt basert på avkastning
  // Hvis avkastning er negativ, blir skatt positiv (skattefordel, grønn)
  // Hvis avkastning er positiv, blir skatt negativ (skattekostnad, rød)
  let taxAmount = 0;
  if (excessValue !== 0) {
    let equitySharePctForTax = 65;
    if (typeof AppState.stockSharePercent === 'number') {
      equitySharePctForTax = AppState.stockSharePercent;
    } else if (AppState.stockShareOption) {
      const m = String(AppState.stockShareOption).match(/(\d+)%/);
      if (m) equitySharePctForTax = Number(m[1]);
      if (/Renter/i.test(String(AppState.stockShareOption))) equitySharePctForTax = 0;
    }
    const aksjeAndel = equitySharePctForTax / 100;
    const stockTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
    const capitalTaxRate = (AppState.capitalTaxPct ?? 22.00) / 100;
    const taxRate = (aksjeAndel * stockTaxRate) + ((1 - aksjeAndel) * capitalTaxRate);
    // Beregn skatt: -Avkastning × skattesats
    taxAmount = -excessValue * taxRate;
    // Ekstra sjekk: Hvis avkastning er negativ, må skatt være positiv
    if (excessValue < 0 && taxAmount < 0) {
      taxAmount = Math.abs(taxAmount);
    }
    // Ekstra sjekk: Hvis avkastning er positiv, må skatt være negativ
    if (excessValue > 0 && taxAmount > 0) {
      taxAmount = -taxAmount;
    }
  }

  // Beregn netto portefølje etter skatt = Verdi ved periodens slutt + Skatt
  // Hvis skatt er positiv (fordel), legger vi den til. Hvis skatt er negativ (kostnad), trekker vi den fra.
  // Dette kan bli negativt, så vi fjerner Math.max(0, ...)
  const netPortfolioAfterTax = futureValue + taxAmount;

  // Beregn fradrag rentekostnader (hensynta avdragsfrihet)
  const payingYears = Math.min(years, repaymentYears);
  let totalInterest;
  if (interestOnly) {
    totalInterest = -(portfolio * rate) * payingYears;
  } else {
    let currentBalance = portfolio;
    let totalAccumulatedInterest = 0;
    for (let year = 1; year <= payingYears; year++) {
      const interestComponent = currentBalance * rate;
      const principalComponent = annualPayment - interestComponent;
      currentBalance = currentBalance - principalComponent;
      totalAccumulatedInterest += interestComponent;
    }
    totalInterest = -totalAccumulatedInterest;
  }
  const interestDeduction =
    AppState.interestTaxDeductionOnLoan !== false
      ? Math.abs(totalInterest) * ((AppState.capitalTaxPct ?? 22.00) / 100)
      : 0;

  // Beregn netto avkastning
  const debtSettle = remainingLoan > 0 ? -remainingLoan : 0;
  const netReturn = netPortfolioAfterTax + debtSettle + interestDeduction;

  return netReturn;
}

// Nice number algorithm for Y-akse
function niceNumber(range, round) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * Math.pow(10, exponent);
}

/* SPWM chart chrome — presentation only (does not affect bar values/geometry) */
const CHART_THEME = {
  grid: "var(--blue-200, #E6EFFB)",
  axis: "var(--blue-300, #B5CFF5)",
  zero: "var(--blue-400, #99BEF5)",
  label: "var(--sp-navy-ink, #12326E)",
  ink: "var(--sp-navy, #002359)",
  font: "var(--font-sans, 'Hanken Grotesk', sans-serif)",
  positive: "var(--chart-blue, #0A5EDC)",
  negative: "var(--blue-400, #99BEF5)",
  // Felles typografi for alle chart-modaler
  tickSize: "16",
  categorySize: "18",
  axisTitleSize: "18",
  valueSize: "18",
};

function styleChartText(el, { size = "16", weight = "500", fill } = {}) {
  el.setAttribute("font-family", CHART_THEME.font);
  el.setAttribute("font-size", String(size));
  el.setAttribute("font-weight", weight);
  el.setAttribute("fill", fill || CHART_THEME.label);
}

function appendChartGridLines(g, ticks, niceMin, niceMax, chartWidth, chartHeight) {
  ticks.forEach((tick) => {
    if (tick === 0) return;
    const y = chartHeight - ((tick - niceMin) / (niceMax - niceMin)) * chartHeight;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", 0);
    line.setAttribute("y1", y);
    line.setAttribute("x2", chartWidth);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", CHART_THEME.grid);
    line.setAttribute("stroke-width", "1");
    g.appendChild(line);
  });
}

// Tegn søylediagram
function drawBarChart() {
  const chartContainer = document.getElementById("chart-container");
  if (!chartContainer) return;

  // Beregn netto avkastning for hvert år (1-20)
  const data = [];
  for (let year = 1; year <= 20; year++) {
    const netReturn = calculateNetReturnForYears(year);
    data.push({ year, value: netReturn });
  }

  // Finn min og max verdier
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Automatisk Y-akse: hvis ingen negative verdier, start fra 0 eller minValue
  // Legg til maksimalt 10% padding på toppen og bunnen
  let niceMin, niceMax;
  
  // Beregn maksimalt tillatt range (10% over/under)
  const maxAllowed = maxValue * 1.1; // Maksimalt 10% over høyeste tall
  const minAllowed = minValue < 0 ? minValue * 1.1 : Math.max(0, minValue * 0.9); // Maksimalt 10% under laveste tall
  
  if (minValue >= 0) {
    // Ingen negative verdier - start fra 0 eller lavere
    niceMin = 0;
    niceMax = maxAllowed; // Maksimalt 10% over høyeste tall
  } else if (maxValue <= 0) {
    // Alle verdier er negative - slutt ved 0 eller høyere
    niceMin = minAllowed; // Maksimalt 10% under laveste tall
    niceMax = 0;
  } else {
    // Både positive og negative verdier - sentrer rundt null med maksimalt 10% padding
    const maxAbs = Math.max(Math.abs(minValue), Math.abs(maxValue));
    niceMin = Math.min(-maxAbs * 1.1, minAllowed);
    niceMax = Math.min(maxAbs * 1.1, maxAllowed);
  }
  
  // Bruk niceNumber for å få pene verdier, men respekter maksimalt tillatt range
  let range = niceMax - niceMin;
  const niceRange = niceNumber(range, false);
  niceMin = Math.floor(niceMin / niceRange) * niceRange;
  let calculatedMax = Math.ceil(niceMax / niceRange) * niceRange;
  
  // Sikre at niceMax ikke overstiger maxAllowed (10% over høyeste tall)
  niceMax = Math.min(calculatedMax, maxAllowed);
  // Sikre at niceMin ikke går under minAllowed (10% under laveste tall)
  if (minValue < 0) {
    niceMin = Math.max(niceMin, minAllowed);
  }
  
  // Beregn niceTick basert på range for faste runde intervall
  range = niceMax - niceMin;
  const niceTick = niceNumber(range / 10, true);

  // SVG dimensjoner - bruk container-størrelse hvis satt, ellers standard
  const containerRect = chartContainer.getBoundingClientRect();
  const containerWidth = containerRect.width > 0 ? containerRect.width : 1800;
  const containerHeight = containerRect.height > 0 ? containerRect.height : 1300;
  
  const margin = { top: 16, right: 24, bottom: 96, left: 112 };
  const width = Math.max(800, containerWidth);
  const height = Math.max(600, containerHeight);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Behold resize-handle, fjern bare SVG
  const existingSvg = chartContainer.querySelector("svg");
  if (existingSvg) {
    existingSvg.remove();
  }

  // Opprett SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.width = "100%";
  svg.style.maxWidth = `${width}px`;
  svg.style.height = "auto";
  svg.style.aspectRatio = `${width} / ${height}`;
  svg.style.overflow = "visible";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);


  // Y-akse linje
  const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxisLine.setAttribute("x1", 0);
  yAxisLine.setAttribute("y1", 0);
  yAxisLine.setAttribute("x2", 0);
  yAxisLine.setAttribute("y2", chartHeight);
  yAxisLine.setAttribute("stroke", CHART_THEME.axis);
  yAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(yAxisLine);

  // Y-akse ticks og labels - start fra 0 og gå i faste runde intervall oppover og nedover
  const ticks = [];
  
  // Start fra 0 og gå nedover
  for (let tick = 0; tick >= niceMin; tick -= niceTick) {
    ticks.push(tick);
  }
  
  // Gå oppover fra 0
  for (let tick = niceTick; tick <= niceMax; tick += niceTick) {
    ticks.push(tick);
  }
  
  // Sorter ticks for riktig rekkefølge
  ticks.sort((a, b) => a - b);
  
  // Fjern duplikater
  const uniqueTicks = [...new Set(ticks)];

  appendChartGridLines(g, uniqueTicks, niceMin, niceMax, chartWidth, chartHeight);
  
  uniqueTicks.forEach(tick => {
    const y = chartHeight - ((tick - niceMin) / (niceMax - niceMin)) * chartHeight;
    
    // Tick linje
    const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tickLine.setAttribute("x1", -8);
    tickLine.setAttribute("y1", y);
    tickLine.setAttribute("x2", 0);
    tickLine.setAttribute("y2", y);
    tickLine.setAttribute("stroke", CHART_THEME.axis);
    tickLine.setAttribute("stroke-width", "1.5");
    g.appendChild(tickLine);

    // Label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", -20);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    styleChartText(label, { size: CHART_THEME.tickSize, weight: "500" });
    label.textContent = formatNOK(Math.round(tick));
    g.appendChild(label);
  });

  // Beregn null-linje posisjon (Y-akse sentrert rundt null)
  const zeroY = chartHeight - ((0 - niceMin) / (niceMax - niceMin)) * chartHeight;

  // Null-linje (X-akse ved y = 0)
  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", 0);
  xAxisLine.setAttribute("y1", zeroY);
  xAxisLine.setAttribute("x2", chartWidth);
  xAxisLine.setAttribute("y2", zeroY);
  xAxisLine.setAttribute("stroke", CHART_THEME.zero);
  xAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(xAxisLine);

  // X-akse labels
  const barWidth = chartWidth / 20;
  data.forEach((d, i) => {
    const x = (i + 0.5) * barWidth;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", chartHeight + 30);
    label.setAttribute("text-anchor", "middle");
    styleChartText(label, { size: CHART_THEME.categorySize, weight: "500" });
    label.textContent = d.year;
    g.appendChild(label);
  });

  // X-akse forklaring
  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", chartWidth / 2);
  xAxisLabel.setAttribute("y", chartHeight + 75);
  xAxisLabel.setAttribute("text-anchor", "middle");
  styleChartText(xAxisLabel, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
  xAxisLabel.textContent = "Antall år";
  g.appendChild(xAxisLabel);

  // Søyler - negative (røde, nedover) og positive (grønne, oppover)
  data.forEach((d, i) => {
    const barHeight = Math.abs((d.value / (niceMax - niceMin)) * chartHeight);
    const x = i * barWidth + barWidth * 0.1;
    const width = barWidth * 0.8;
    
    let y, height;
    let fillColor;
    
    if (d.value >= 0) {
      // Positiv søyle - går oppover fra null-linjen (grønn)
      y = zeroY - barHeight;
      height = barHeight;
      fillColor = CHART_THEME.positive;
    } else {
      // Negativ søyle - går nedover fra null-linjen (rød)
      y = zeroY;
      height = barHeight;
      fillColor = CHART_THEME.negative;
    }

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", fillColor);
    rect.setAttribute("stroke", "none");
    rect.setAttribute("rx", "6");
    rect.setAttribute("ry", "6");
    rect.style.cursor = "pointer";
    rect.style.transition = "opacity 0.2s";

    // Hover effekt
    rect.addEventListener("mouseenter", () => {
      rect.style.opacity = "0.8";
      // Vis tooltip
      const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltip.setAttribute("x", x + width / 2);
      tooltip.setAttribute("y", d.value >= 0 ? y - 8 : y + height + 20);
      tooltip.setAttribute("text-anchor", "middle");
      styleChartText(tooltip, { size: CHART_THEME.valueSize, weight: "600", fill: CHART_THEME.ink });
      tooltip.setAttribute("id", `tooltip-${i}`);
      tooltip.textContent = formatNOK(Math.round(d.value));
      g.appendChild(tooltip);
    });

    rect.addEventListener("mouseleave", () => {
      rect.style.opacity = "1";
      const tooltip = g.querySelector(`#tooltip-${i}`);
      if (tooltip) tooltip.remove();
    });

    g.appendChild(rect);
  });

  svg.appendChild(g);
  chartContainer.appendChild(svg);
}

// Beregn forskjell mellom å beholde Vs. å utbetale for et gitt antall år
function calculateDifferenceForYears(years) {
  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;

  // Hent forventet avkastning fra Input-fanen
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

  // Beregn verdier for venstre boks (beholde)
  const r = expectedReturnPct / 100;
  const endValue = portfolio * Math.pow(1 + r, years);
  const dividendTaxRate = (AppState.stockTaxPct ?? 37.84) / 100;
  const dividendTax = portfolio * dividendTaxRate;
  const dividendNet = portfolio - dividendTax;
  const remainingPortfolio = endValue - portfolio;
  const interestRate = interestPct / 100;
  const interestCostsTotal = dividendNet * Math.pow(1 + interestRate, years) - dividendNet;
  const capitalTaxDec = (AppState.capitalTaxPct ?? 22) / 100;
  const interestTaxDeduction =
    AppState.interestTaxDeductionOnLoan !== false ? interestCostsTotal * capitalTaxDec : 0;
  const sum = remainingPortfolio - interestCostsTotal + interestTaxDeduction;
  const rSum = 0;
  
  return sum - rSum;
}

// Beregn forskjell mellom å beholde Vs. å utbetale for en gitt skattesats
function calculateDifferenceForTaxRate(taxRatePercent) {
  // Hent verdier fra AppState / Input-fanen
  const sumAssets = (AppState.assets || []).reduce((s, x) => s + (x.amount || 0), 0);
  const portfolio = isFinite(AppState.portfolioSize) ? Number(AppState.portfolioSize) : sumAssets;
  const interestPct = isFinite(AppState.interestCostPct) ? Number(AppState.interestCostPct) : 5.0;
  
  // Hent antall år
  let years = 10;
  const yearsSliderEl = document.getElementById('input-years-slider');
  if (yearsSliderEl && yearsSliderEl.value) {
    const v = Number(yearsSliderEl.value);
    if (isFinite(v) && v > 0) years = v;
  } else if (isFinite(AppState.yearsCount)) {
    years = Number(AppState.yearsCount);
  }

  // Hent forventet avkastning fra Input-fanen
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

  // Beregn verdier for venstre boks (beholde)
  const r = expectedReturnPct / 100;
  const endValue = portfolio * Math.pow(1 + r, years);
  // Bruk den gitte skattesatsen i stedet for AppState.stockTaxPct
  const dividendTaxRate = taxRatePercent / 100;
  const dividendTax = portfolio * dividendTaxRate;
  const dividendNet = portfolio - dividendTax;
  const remainingPortfolio = endValue - portfolio;
  const interestRate = interestPct / 100;
  const interestCostsTotal = dividendNet * Math.pow(1 + interestRate, years) - dividendNet;
  const capitalTaxDec = (AppState.capitalTaxPct ?? 22) / 100;
  const interestTaxDeduction =
    AppState.interestTaxDeductionOnLoan !== false ? interestCostsTotal * capitalTaxDec : 0;
  const sum = remainingPortfolio - interestCostsTotal + interestTaxDeduction;
  const rSum = 0;
  
  return sum - rSum;
}

// Tegn søylediagram for forskjell mellom å beholde Vs. å utbetale
function drawDividendDifferenceChart() {
  const chartContainer = document.getElementById("dividend-chart-container");
  if (!chartContainer) return;

  // Beregn forskjell for hvert år (1-20)
  const data = [];
  for (let year = 1; year <= 20; year++) {
    const difference = calculateDifferenceForYears(year);
    data.push({ year, value: difference });
  }

  // Finn min og max verdier
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Automatisk Y-akse: hvis ingen negative verdier, start fra 0 eller minValue
  // Legg til maksimalt 10% padding på toppen og bunnen
  let niceMin, niceMax;
  
  // Beregn maksimalt tillatt range (10% over/under)
  const maxAllowed = maxValue * 1.1; // Maksimalt 10% over høyeste tall
  const minAllowed = minValue < 0 ? minValue * 1.1 : Math.max(0, minValue * 0.9); // Maksimalt 10% under laveste tall
  
  if (minValue >= 0) {
    // Ingen negative verdier - start fra 0 eller lavere
    niceMin = 0;
    niceMax = maxAllowed; // Maksimalt 10% over høyeste tall
  } else if (maxValue <= 0) {
    // Alle verdier er negative - slutt ved 0 eller høyere
    niceMin = minAllowed; // Maksimalt 10% under laveste tall
    niceMax = 0;
  } else {
    // Både positive og negative verdier - sentrer rundt null med maksimalt 10% padding
    const maxAbs = Math.max(Math.abs(minValue), Math.abs(maxValue));
    niceMin = Math.min(-maxAbs * 1.1, minAllowed);
    niceMax = Math.min(maxAbs * 1.1, maxAllowed);
  }
  
  // Bruk niceNumber for å få pene verdier, men respekter maksimalt tillatt range
  let range = niceMax - niceMin;
  const niceRange = niceNumber(range, false);
  niceMin = Math.floor(niceMin / niceRange) * niceRange;
  let calculatedMax = Math.ceil(niceMax / niceRange) * niceRange;
  
  // Sikre at niceMax ikke overstiger maxAllowed (10% over høyeste tall)
  niceMax = Math.min(calculatedMax, maxAllowed);
  // Sikre at niceMin ikke går under minAllowed (10% under laveste tall)
  if (minValue < 0) {
    niceMin = Math.max(niceMin, minAllowed);
  }
  
  // Beregn niceTick basert på range for faste runde intervall
  range = niceMax - niceMin;
  const niceTick = niceNumber(range / 10, true);

  // SVG dimensjoner - bruk container-størrelse hvis satt, ellers standard
  const containerRect = chartContainer.getBoundingClientRect();
  const containerWidth = containerRect.width > 0 ? containerRect.width : 1800;
  const containerHeight = containerRect.height > 0 ? containerRect.height : 1300;
  
  const margin = { top: 16, right: 24, bottom: 96, left: 112 };
  const width = Math.max(800, containerWidth);
  const height = Math.max(600, containerHeight);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Behold resize-handle, fjern bare SVG
  const existingSvg = chartContainer.querySelector("svg");
  if (existingSvg) {
    existingSvg.remove();
  }

  // Opprett SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.width = "100%";
  svg.style.maxWidth = `${width}px`;
  svg.style.height = "auto";
  svg.style.aspectRatio = `${width} / ${height}`;
  svg.style.overflow = "visible";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);


  // Y-akse linje
  const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxisLine.setAttribute("x1", 0);
  yAxisLine.setAttribute("y1", 0);
  yAxisLine.setAttribute("x2", 0);
  yAxisLine.setAttribute("y2", chartHeight);
  yAxisLine.setAttribute("stroke", CHART_THEME.axis);
  yAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(yAxisLine);

  // Y-akse ticks og labels - start fra 0 og gå i faste runde intervall oppover og nedover
  const ticks = [];
  
  // Start fra 0 og gå nedover
  for (let tick = 0; tick >= niceMin; tick -= niceTick) {
    ticks.push(tick);
  }
  
  // Gå oppover fra 0
  for (let tick = niceTick; tick <= niceMax; tick += niceTick) {
    ticks.push(tick);
  }
  
  // Sorter ticks for riktig rekkefølge
  ticks.sort((a, b) => a - b);
  
  // Fjern duplikater
  const uniqueTicks = [...new Set(ticks)];

  appendChartGridLines(g, uniqueTicks, niceMin, niceMax, chartWidth, chartHeight);
  
  uniqueTicks.forEach(tick => {
    const y = chartHeight - ((tick - niceMin) / (niceMax - niceMin)) * chartHeight;
    
    // Tick linje
    const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tickLine.setAttribute("x1", -8);
    tickLine.setAttribute("y1", y);
    tickLine.setAttribute("x2", 0);
    tickLine.setAttribute("y2", y);
    tickLine.setAttribute("stroke", CHART_THEME.axis);
    tickLine.setAttribute("stroke-width", "1.5");
    g.appendChild(tickLine);

    // Label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", -20);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    styleChartText(label, { size: CHART_THEME.tickSize, weight: "500" });
    label.textContent = formatNOK(Math.round(tick));
    g.appendChild(label);
  });

  // Beregn null-linje posisjon (Y-akse sentrert rundt null)
  const zeroY = chartHeight - ((0 - niceMin) / (niceMax - niceMin)) * chartHeight;

  // Null-linje (X-akse ved y = 0)
  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", 0);
  xAxisLine.setAttribute("y1", zeroY);
  xAxisLine.setAttribute("x2", chartWidth);
  xAxisLine.setAttribute("y2", zeroY);
  xAxisLine.setAttribute("stroke", CHART_THEME.zero);
  xAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(xAxisLine);

  // X-akse labels
  const barWidth = chartWidth / 20;
  data.forEach((d, i) => {
    const x = (i + 0.5) * barWidth;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", chartHeight + 30);
    label.setAttribute("text-anchor", "middle");
    styleChartText(label, { size: CHART_THEME.categorySize, weight: "500" });
    label.textContent = d.year;
    g.appendChild(label);
  });

  // X-akse forklaring
  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", chartWidth / 2);
  xAxisLabel.setAttribute("y", chartHeight + 75);
  xAxisLabel.setAttribute("text-anchor", "middle");
  styleChartText(xAxisLabel, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
  xAxisLabel.textContent = "Antall år";
  g.appendChild(xAxisLabel);

  // Søyler - negative (røde, nedover) og positive (grønne, oppover)
  data.forEach((d, i) => {
    const barHeight = Math.abs((d.value / (niceMax - niceMin)) * chartHeight);
    const x = i * barWidth + barWidth * 0.1;
    const width = barWidth * 0.8;
    
    let y, height;
    let fillColor;
    
    if (d.value >= 0) {
      // Positiv søyle - går oppover fra null-linjen (grønn)
      y = zeroY - barHeight;
      height = barHeight;
      fillColor = CHART_THEME.positive;
    } else {
      // Negativ søyle - går nedover fra null-linjen (rød)
      y = zeroY;
      height = barHeight;
      fillColor = CHART_THEME.negative;
    }

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", fillColor);
    rect.setAttribute("stroke", "none");
    rect.setAttribute("rx", "6");
    rect.setAttribute("ry", "6");
    rect.style.cursor = "pointer";
    rect.style.transition = "opacity 0.2s";

    // Hover effekt
    rect.addEventListener("mouseenter", () => {
      rect.style.opacity = "0.8";
      // Vis tooltip
      const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltip.setAttribute("x", x + width / 2);
      tooltip.setAttribute("y", d.value >= 0 ? y - 8 : y + height + 20);
      tooltip.setAttribute("text-anchor", "middle");
      styleChartText(tooltip, { size: CHART_THEME.valueSize, weight: "600", fill: CHART_THEME.ink });
      tooltip.setAttribute("id", `tooltip-${i}`);
      tooltip.textContent = formatNOK(Math.round(d.value));
      g.appendChild(tooltip);
    });

    rect.addEventListener("mouseleave", () => {
      rect.style.opacity = "1";
      const tooltip = g.querySelector(`#tooltip-${i}`);
      if (tooltip) tooltip.remove();
    });

    g.appendChild(rect);
  });

  svg.appendChild(g);
  chartContainer.appendChild(svg);
}

// Tegn søylediagram for forskjell mellom å beholde Vs. å utbetale for ulike skattesatser
function drawTaxRateChangeChart() {
  const chartContainer = document.getElementById("tax-rate-change-chart-container");
  if (!chartContainer) return;

  // De 9 ulike skattesatsene
  const taxRateOptions = [
    { label: "0%", percent: 0 },
    { label: "5%", percent: 5 },
    { label: "10%", percent: 10 },
    { label: "22%", percent: 22 },
    { label: "25%", percent: 25 },
    { label: "30%", percent: 30 },
    { label: "35%", percent: 35 },
    { label: "37,84%", percent: 37.84 },
    { label: "51,5%", percent: 51.5 }
  ];

  // Beregn forskjell for hver skattesats
  const data = [];
  taxRateOptions.forEach(option => {
    const difference = calculateDifferenceForTaxRate(option.percent);
    data.push({ label: option.label, percent: option.percent, value: difference });
  });

  // Finn min og max verdier
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Automatisk Y-akse: hvis ingen negative verdier, start fra 0 eller minValue
  // Legg til maksimalt 10% padding på toppen og bunnen
  let niceMin, niceMax;
  
  // Beregn maksimalt tillatt range (10% over/under)
  const maxAllowed = maxValue * 1.1; // Maksimalt 10% over høyeste tall
  const minAllowed = minValue < 0 ? minValue * 1.1 : Math.max(0, minValue * 0.9); // Maksimalt 10% under laveste tall
  
  if (minValue >= 0) {
    // Ingen negative verdier - start fra 0 eller lavere
    niceMin = 0;
    niceMax = maxAllowed; // Maksimalt 10% over høyeste tall
  } else if (maxValue <= 0) {
    // Alle verdier er negative - slutt ved 0 eller høyere
    niceMin = minAllowed; // Maksimalt 10% under laveste tall
    niceMax = 0;
  } else {
    // Både positive og negative verdier - sentrer rundt null med maksimalt 10% padding
    const maxAbs = Math.max(Math.abs(minValue), Math.abs(maxValue));
    niceMin = Math.min(-maxAbs * 1.1, minAllowed);
    niceMax = Math.min(maxAbs * 1.1, maxAllowed);
  }
  
  // Bruk niceNumber for å få pene verdier, men respekter maksimalt tillatt range
  let range = niceMax - niceMin;
  const niceRange = niceNumber(range, false);
  niceMin = Math.floor(niceMin / niceRange) * niceRange;
  let calculatedMax = Math.ceil(niceMax / niceRange) * niceRange;
  
  // Sikre at niceMax ikke overstiger maxAllowed (10% over høyeste tall)
  niceMax = Math.min(calculatedMax, maxAllowed);
  // Sikre at niceMin ikke går under minAllowed (10% under laveste tall)
  if (minValue < 0) {
    niceMin = Math.max(niceMin, minAllowed);
  }
  
  // Beregn niceTick basert på range for faste runde intervall
  range = niceMax - niceMin;
  const niceTick = niceNumber(range / 10, true);

  // Fjern alle eksisterende SVG-elementer først for å sikre ren start
  const existingSvgs = chartContainer.querySelectorAll("svg");
  existingSvgs.forEach(svg => svg.remove());

  const containerRect = chartContainer.getBoundingClientRect();
  const containerWidth = containerRect.width > 0 ? containerRect.width : 1800;
  const containerHeight = containerRect.height > 0 ? containerRect.height : 1300;
  
  const margin = { top: 16, right: 24, bottom: 96, left: 112 };
  const width = Math.max(800, containerWidth);
  const height = Math.max(600, containerHeight);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Opprett SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.width = "100%";
  svg.style.maxWidth = `${width}px`;
  svg.style.height = "auto";
  svg.style.aspectRatio = `${width} / ${height}`;
  svg.style.overflow = "visible";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);

  // Y-akse linje
  const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxisLine.setAttribute("x1", 0);
  yAxisLine.setAttribute("y1", 0);
  yAxisLine.setAttribute("x2", 0);
  yAxisLine.setAttribute("y2", chartHeight);
  yAxisLine.setAttribute("stroke", CHART_THEME.axis);
  yAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(yAxisLine);

  // Y-akse ticks og labels - start fra 0 og gå i faste runde intervall oppover og nedover
  const ticks = [];
  
  // Start fra 0 og gå nedover
  for (let tick = 0; tick >= niceMin; tick -= niceTick) {
    ticks.push(tick);
  }
  
  // Gå oppover fra 0
  for (let tick = niceTick; tick <= niceMax; tick += niceTick) {
    ticks.push(tick);
  }
  
  // Sorter ticks for riktig rekkefølge
  ticks.sort((a, b) => a - b);
  
  // Fjern duplikater
  const uniqueTicks = [...new Set(ticks)];

  appendChartGridLines(g, uniqueTicks, niceMin, niceMax, chartWidth, chartHeight);
  
  uniqueTicks.forEach(tick => {
    const y = chartHeight - ((tick - niceMin) / (niceMax - niceMin)) * chartHeight;
    
    // Tick linje
    const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tickLine.setAttribute("x1", -8);
    tickLine.setAttribute("y1", y);
    tickLine.setAttribute("x2", 0);
    tickLine.setAttribute("y2", y);
    tickLine.setAttribute("stroke", CHART_THEME.axis);
    tickLine.setAttribute("stroke-width", "1.5");
    g.appendChild(tickLine);

    // Label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", -20);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    styleChartText(label, { size: CHART_THEME.tickSize, weight: "500" });
    label.textContent = formatNOK(Math.round(tick));
    g.appendChild(label);
  });

  // Beregn null-linje posisjon (Y-akse sentrert rundt null)
  const zeroY = chartHeight - ((0 - niceMin) / (niceMax - niceMin)) * chartHeight;

  // Null-linje (X-akse ved y = 0)
  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", 0);
  xAxisLine.setAttribute("y1", zeroY);
  xAxisLine.setAttribute("x2", chartWidth);
  xAxisLine.setAttribute("y2", zeroY);
  xAxisLine.setAttribute("stroke", CHART_THEME.zero);
  xAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(xAxisLine);

  // X-akse labels
  const barWidth = chartWidth / 9; // 9 søyler
  data.forEach((d, i) => {
    const x = (i + 0.5) * barWidth;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", chartHeight + 30);
    label.setAttribute("text-anchor", "middle");
    styleChartText(label, { size: CHART_THEME.categorySize, weight: "500" });
    label.textContent = d.label;
    g.appendChild(label);
  });

  // X-akse forklaring
  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", chartWidth / 2);
  xAxisLabel.setAttribute("y", chartHeight + 75);
  xAxisLabel.setAttribute("text-anchor", "middle");
  styleChartText(xAxisLabel, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
  xAxisLabel.textContent = "Skattesats";
  g.appendChild(xAxisLabel);

  // Søyler - negative (røde, nedover) og positive (grønne, oppover)
  data.forEach((d, i) => {
    const barHeight = Math.abs((d.value / (niceMax - niceMin)) * chartHeight);
    const x = i * barWidth + barWidth * 0.1;
    const width = barWidth * 0.8;
    
    let y, height;
    let fillColor;
    
    if (d.value >= 0) {
      y = zeroY - barHeight;
      height = barHeight;
      fillColor = CHART_THEME.positive;
    } else {
      y = zeroY;
      height = barHeight;
      fillColor = CHART_THEME.negative;
    }
    
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", fillColor);
    rect.setAttribute("stroke", "none");
    rect.setAttribute("rx", "6");
    rect.setAttribute("ry", "6");
    rect.style.cursor = "pointer";
    rect.style.transition = "opacity 0.2s";

    // Hover effekt
    rect.addEventListener("mouseenter", () => {
      rect.style.opacity = "0.8";
      const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltip.setAttribute("x", x + width / 2);
      tooltip.setAttribute("y", d.value >= 0 ? y - 8 : y + height + 20);
      tooltip.setAttribute("text-anchor", "middle");
      styleChartText(tooltip, { size: CHART_THEME.valueSize, weight: "600", fill: CHART_THEME.ink });
      tooltip.setAttribute("id", `tooltip-${i}`);
      tooltip.textContent = formatNOK(Math.round(d.value));
      g.appendChild(tooltip);
    });

    rect.addEventListener("mouseleave", () => {
      rect.style.opacity = "1";
      const tooltip = g.querySelector(`#tooltip-${i}`);
      if (tooltip) tooltip.remove();
    });

    g.appendChild(rect);
  });

  svg.appendChild(g);
  chartContainer.appendChild(svg);
}

// Dividend difference chart modal
function initDividendChartUI() {
  const modal = document.getElementById("dividend-chart-modal");
  const chartContainer = document.getElementById("dividend-chart-container");
  const resizeHandle = document.getElementById("dividend-chart-resize-handle");
  if (!modal || !chartContainer) return;

  // Resize funksjonalitet
  if (resizeHandle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      const rect = chartContainer.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "none";
    });

    function handleResize(e) {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newWidth = Math.max(400, startWidth + deltaX);
      const newHeight = Math.max(300, startHeight + deltaY);
      chartContainer.style.width = `${newWidth}px`;
      chartContainer.style.height = `${newHeight}px`;
      chartContainer.style.minHeight = `${newHeight}px`;
    }

    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "";
      // Re-tegn grafikken med ny størrelse når resize er ferdig
      setTimeout(() => {
        drawDividendDifferenceChart();
      }, 10);
    }
  }

  function openDividendChartModal() {
    // Toggle: hvis modal allerede er åpen, lukk den
    if (!modal.hasAttribute("hidden")) {
      closeDividendChartModal();
      return;
    }
    modal.removeAttribute("hidden");
    // Reset størrelse når modal åpnes
    if (chartContainer) {
      chartContainer.style.width = "";
      chartContainer.style.height = "";
      chartContainer.style.minHeight = "";
    }
    requestAnimationFrame(() => drawDividendDifferenceChart());
    document.addEventListener("keydown", onKeyDown);
  }

  function closeDividendChartModal() {
    modal.setAttribute("hidden", "");
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDividendChartModal();
    }
  }

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeDividendChartModal();
    }
  });

  // Eksponer openDividendChartModal globalt så ikonet kan kalle den
  window.openDividendChartModal = openDividendChartModal;
}

// Tax rate change chart modal
function initTaxRateChangeChartUI() {
  const modal = document.getElementById("tax-rate-change-chart-modal");
  const chartContainer = document.getElementById("tax-rate-change-chart-container");
  const resizeHandle = document.getElementById("tax-rate-change-chart-resize-handle");
  if (!modal || !chartContainer) return;

  // Resize funksjonalitet
  if (resizeHandle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      const rect = chartContainer.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "none";
    });

    function handleResize(e) {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newWidth = Math.max(400, startWidth + deltaX);
      const newHeight = Math.max(300, startHeight + deltaY);
      chartContainer.style.width = `${newWidth}px`;
      chartContainer.style.height = `${newHeight}px`;
      chartContainer.style.minHeight = `${newHeight}px`;
    }

    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "";
      // Re-tegn grafikken med ny størrelse når resize er ferdig
      setTimeout(() => {
        drawTaxRateChangeChart();
      }, 10);
    }
  }

  function openTaxRateChangeChartModal() {
    // Toggle: hvis modal allerede er åpen, lukk den
    if (!modal.hasAttribute("hidden")) {
      closeTaxRateChangeChartModal();
      return;
    }
    modal.removeAttribute("hidden");
    // Reset størrelse når modal åpnes
    if (chartContainer) {
      chartContainer.style.width = "";
      chartContainer.style.height = "";
      chartContainer.style.minHeight = "";
      chartContainer.style.maxWidth = "";
      chartContainer.style.maxHeight = "";
    }
    requestAnimationFrame(() => drawTaxRateChangeChart());
    document.addEventListener("keydown", onKeyDown);
  }

  function closeTaxRateChangeChartModal() {
    modal.setAttribute("hidden", "");
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeTaxRateChangeChartModal();
    }
  }

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeTaxRateChangeChartModal();
    }
  });

  // Eksponer openTaxRateChangeChartModal globalt så ikonet kan kalle den
  window.openTaxRateChangeChartModal = openTaxRateChangeChartModal;
}

// Equity share chart modal og grafikk (identisk med chart-modal)
function initEquityShareChartUI() {
  const modal = document.getElementById("equity-share-chart-modal");
  const chartContainer = document.getElementById("equity-share-chart-container");
  const resizeHandle = document.getElementById("equity-share-chart-resize-handle");
  if (!modal || !chartContainer) return;

  // Resize funksjonalitet
  if (resizeHandle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      const rect = chartContainer.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "none";
    });

    function handleResize(e) {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newWidth = Math.max(400, startWidth + deltaX);
      const newHeight = Math.max(300, startHeight + deltaY);
      chartContainer.style.width = `${newWidth}px`;
      chartContainer.style.height = `${newHeight}px`;
      chartContainer.style.minHeight = `${newHeight}px`;
    }

    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "";
      // Re-tegn grafikken med ny størrelse når resize er ferdig
      setTimeout(() => {
        drawEquityShareBarChart();
      }, 10);
    }
  }

  function openEquityShareChartModal() {
    // Toggle: hvis modal allerede er åpen, lukk den
    if (!modal.hasAttribute("hidden")) {
      closeEquityShareChartModal();
      return;
    }
    modal.removeAttribute("hidden");
    // Reset størrelse når modal åpnes
    if (chartContainer) {
      chartContainer.style.width = "";
      chartContainer.style.height = "";
      chartContainer.style.minHeight = "";
    }
    requestAnimationFrame(() => drawEquityShareBarChart());
    document.addEventListener("keydown", onKeyDown);
  }

  function closeEquityShareChartModal() {
    modal.setAttribute("hidden", "");
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeEquityShareChartModal();
    }
  }

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeEquityShareChartModal();
    }
  });

  // Eksponer openEquityShareChartModal globalt så ikonet kan kalle den
  window.openEquityShareChartModal = openEquityShareChartModal;
}

function drawEquityShareBarChart() {
  const chartContainer = document.getElementById("equity-share-chart-container");
  if (!chartContainer) return;

  // De syv ulike gradene av aksjeandel
  const equityShareOptions = [
    { label: "100% Renter", percent: 0 },
    { label: "20% Aksjer", percent: 20 },
    { label: "45% Aksjer", percent: 45 },
    { label: "55% Aksjer", percent: 55 },
    { label: "65% Aksjer", percent: 65 },
    { label: "85% Aksjer", percent: 85 },
    { label: "100% Aksjer", percent: 100 }
  ];

  // Beregn netto avkastning (Avkastning utover lånekostnad) for hver aksjeandel-grad
  const data = [];
  equityShareOptions.forEach(option => {
    const netReturn = calculateNetReturnForEquityShare(option.percent);
    data.push({ label: option.label, value: netReturn });
  });

  // Finn min og max verdier
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Automatisk Y-akse: hvis ingen negative verdier, start fra 0 eller minValue
  // Legg til maksimalt 10% padding på toppen og bunnen
  let niceMin, niceMax;
  
  // Beregn maksimalt tillatt range (10% over/under)
  const maxAllowed = maxValue * 1.1; // Maksimalt 10% over høyeste tall
  const minAllowed = minValue < 0 ? minValue * 1.1 : Math.max(0, minValue * 0.9); // Maksimalt 10% under laveste tall
  
  if (minValue >= 0) {
    // Ingen negative verdier - start fra 0 eller lavere
    niceMin = 0;
    niceMax = maxAllowed; // Maksimalt 10% over høyeste tall
  } else if (maxValue <= 0) {
    // Alle verdier er negative - slutt ved 0 eller høyere
    niceMin = minAllowed; // Maksimalt 10% under laveste tall
    niceMax = 0;
  } else {
    // Både positive og negative verdier - sentrer rundt null med maksimalt 10% padding
    const maxAbs = Math.max(Math.abs(minValue), Math.abs(maxValue));
    niceMin = Math.min(-maxAbs * 1.1, minAllowed);
    niceMax = Math.min(maxAbs * 1.1, maxAllowed);
  }
  
  // Bruk niceNumber for å få pene verdier, men respekter maksimalt tillatt range
  let range = niceMax - niceMin;
  const niceRange = niceNumber(range, false);
  niceMin = Math.floor(niceMin / niceRange) * niceRange;
  let calculatedMax = Math.ceil(niceMax / niceRange) * niceRange;
  
  // Sikre at niceMax ikke overstiger maxAllowed (10% over høyeste tall)
  niceMax = Math.min(calculatedMax, maxAllowed);
  // Sikre at niceMin ikke går under minAllowed (10% under laveste tall)
  if (minValue < 0) {
    niceMin = Math.max(niceMin, minAllowed);
  }
  
  // Beregn niceTick basert på range for faste runde intervall
  range = niceMax - niceMin;
  const niceTick = niceNumber(range / 10, true);

  // SVG dimensjoner - bruk container-størrelse hvis satt, ellers standard
  const containerRect = chartContainer.getBoundingClientRect();
  const containerWidth = containerRect.width > 0 ? containerRect.width : 1800;
  const containerHeight = containerRect.height > 0 ? containerRect.height : 1300;
  
  const margin = { top: 16, right: 24, bottom: 96, left: 112 };
  const width = Math.max(800, containerWidth);
  const height = Math.max(600, containerHeight);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Behold resize-handle, fjern bare SVG
  const existingSvg = chartContainer.querySelector("svg");
  if (existingSvg) {
    existingSvg.remove();
  }

  // Opprett SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.width = "100%";
  svg.style.maxWidth = `${width}px`;
  svg.style.height = "auto";
  svg.style.aspectRatio = `${width} / ${height}`;
  svg.style.overflow = "visible";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);


  // Y-akse linje
  const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxisLine.setAttribute("x1", 0);
  yAxisLine.setAttribute("y1", 0);
  yAxisLine.setAttribute("x2", 0);
  yAxisLine.setAttribute("y2", chartHeight);
  yAxisLine.setAttribute("stroke", CHART_THEME.axis);
  yAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(yAxisLine);

  // Y-akse ticks og labels - start fra 0 og gå i faste runde intervall oppover og nedover
  const ticks = [];
  
  // Start fra 0 og gå nedover
  for (let tick = 0; tick >= niceMin; tick -= niceTick) {
    ticks.push(tick);
  }
  
  // Gå oppover fra 0
  for (let tick = niceTick; tick <= niceMax; tick += niceTick) {
    ticks.push(tick);
  }
  
  // Sorter ticks for riktig rekkefølge
  ticks.sort((a, b) => a - b);
  
  // Fjern duplikater
  const uniqueTicks = [...new Set(ticks)];

  appendChartGridLines(g, uniqueTicks, niceMin, niceMax, chartWidth, chartHeight);
  
  uniqueTicks.forEach(tick => {
    const y = chartHeight - ((tick - niceMin) / (niceMax - niceMin)) * chartHeight;
    
    // Tick linje
    const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tickLine.setAttribute("x1", -8);
    tickLine.setAttribute("y1", y);
    tickLine.setAttribute("x2", 0);
    tickLine.setAttribute("y2", y);
    tickLine.setAttribute("stroke", CHART_THEME.axis);
    tickLine.setAttribute("stroke-width", "1.5");
    g.appendChild(tickLine);

    // Label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", -20);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    styleChartText(label, { size: CHART_THEME.tickSize, weight: "500" });
    label.textContent = formatNOK(Math.round(tick));
    g.appendChild(label);
  });

  // Beregn null-linje posisjon (Y-akse sentrert rundt null)
  const zeroY = chartHeight - ((0 - niceMin) / (niceMax - niceMin)) * chartHeight;

  // Null-linje (X-akse ved y = 0)
  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", 0);
  xAxisLine.setAttribute("y1", zeroY);
  xAxisLine.setAttribute("x2", chartWidth);
  xAxisLine.setAttribute("y2", zeroY);
  xAxisLine.setAttribute("stroke", CHART_THEME.zero);
  xAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(xAxisLine);

  // X-akse labels - "100% Renter" på to linjer, resten bare prosent
  const barWidth = chartWidth / 7;
  data.forEach((d, i) => {
    const x = (i + 0.5) * barWidth;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", chartHeight + 30);
    label.setAttribute("text-anchor", "middle");
    styleChartText(label, { size: CHART_THEME.categorySize, weight: "500" });
    
    // Del opp label i prosent og ord
    const parts = d.label.split(" ");
    const percentPart = parts[0]; // F.eks. "100%" eller "20%"
    const wordPart = parts.slice(1).join(" "); // F.eks. "Renter" eller "Aksjer"
    
    if (d.label === "100% Renter") {
      // Første label: "100% Renter" på to linjer
      const tspan1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan1.setAttribute("x", x);
      tspan1.setAttribute("dy", "0");
      tspan1.textContent = percentPart;
      label.appendChild(tspan1);
      
      const tspan2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan2.setAttribute("x", x);
      tspan2.setAttribute("dy", "1.2em");
      tspan2.textContent = wordPart;
      label.appendChild(tspan2);
    } else {
      // Resten: bare prosenten
      label.textContent = percentPart;
    }
    
    g.appendChild(label);
  });

  // X-akse forklaring
  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", chartWidth / 2);
  xAxisLabel.setAttribute("y", chartHeight + 80);
  xAxisLabel.setAttribute("text-anchor", "middle");
  styleChartText(xAxisLabel, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
  xAxisLabel.textContent = "Aksjeandel";
  g.appendChild(xAxisLabel);

  // Søyler - negative (røde, nedover) og positive (grønne, oppover)
  data.forEach((d, i) => {
    const barHeight = Math.abs((d.value / (niceMax - niceMin)) * chartHeight);
    const x = i * barWidth + barWidth * 0.1;
    const width = barWidth * 0.8;
    
    let y, height;
    let fillColor;
    
    if (d.value >= 0) {
      // Positiv søyle - går oppover fra null-linjen (grønn)
      y = zeroY - barHeight;
      height = barHeight;
      fillColor = CHART_THEME.positive;
    } else {
      // Negativ søyle - går nedover fra null-linjen (rød)
      y = zeroY;
      height = barHeight;
      fillColor = CHART_THEME.negative;
    }

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", fillColor);
    rect.setAttribute("stroke", "none");
    rect.setAttribute("rx", "6");
    rect.setAttribute("ry", "6");
    rect.style.cursor = "pointer";
    rect.style.transition = "opacity 0.2s";

    // Hover effekt
    rect.addEventListener("mouseenter", () => {
      rect.style.opacity = "0.8";
      // Vis tooltip
      const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltip.setAttribute("x", x + width / 2);
      tooltip.setAttribute("y", d.value >= 0 ? y - 8 : y + height + 20);
      tooltip.setAttribute("text-anchor", "middle");
      styleChartText(tooltip, { size: CHART_THEME.valueSize, weight: "600", fill: CHART_THEME.ink });
      tooltip.setAttribute("id", `tooltip-${i}`);
      tooltip.textContent = formatNOK(Math.round(d.value));
      g.appendChild(tooltip);
    });

    rect.addEventListener("mouseleave", () => {
      rect.style.opacity = "1";
      const tooltip = g.querySelector(`#tooltip-${i}`);
      if (tooltip) tooltip.remove();
    });

    g.appendChild(rect);
  });

  svg.appendChild(g);
  chartContainer.appendChild(svg);
}

// Interest cost chart modal og grafikk (100% identisk med equity-share-chart-modal)
function initInterestCostChartUI() {
  const modal = document.getElementById("interest-cost-chart-modal");
  const chartContainer = document.getElementById("interest-cost-chart-container");
  const resizeHandle = document.getElementById("interest-cost-chart-resize-handle");
  if (!modal || !chartContainer) return;

  if (resizeHandle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      const rect = chartContainer.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "none";
    });

    function handleResize(e) {
      if (!isResizing) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const newWidth = Math.max(400, startWidth + deltaX);
      const newHeight = Math.max(300, startHeight + deltaY);
      chartContainer.style.width = `${newWidth}px`;
      chartContainer.style.height = `${newHeight}px`;
      chartContainer.style.minHeight = `${newHeight}px`;
    }

    function stopResize() {
      isResizing = false;
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      chartContainer.style.userSelect = "";
      setTimeout(() => {
        drawInterestCostBarChart();
      }, 10);
    }
  }

  function openInterestCostChartModal() {
    if (!modal.hasAttribute("hidden")) {
      closeInterestCostChartModal();
      return;
    }
    modal.removeAttribute("hidden");
    if (chartContainer) {
      chartContainer.style.width = "";
      chartContainer.style.height = "";
      chartContainer.style.minHeight = "";
    }
    requestAnimationFrame(() => drawInterestCostBarChart());
    document.addEventListener("keydown", onKeyDown);
  }

  function closeInterestCostChartModal() {
    modal.setAttribute("hidden", "");
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeInterestCostChartModal();
    }
  }

  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && (t.getAttribute && t.getAttribute("data-close") === "true")) {
      closeInterestCostChartModal();
    }
  });

  window.openInterestCostChartModal = openInterestCostChartModal;
}

function drawInterestCostBarChart() {
  const chartContainer = document.getElementById("interest-cost-chart-container");
  if (!chartContainer) return;

  // De ti ulike rentekostnadene (1% til 10%)
  const interestCostOptions = [
    { label: "1%", percent: 1 },
    { label: "2%", percent: 2 },
    { label: "3%", percent: 3 },
    { label: "4%", percent: 4 },
    { label: "5%", percent: 5 },
    { label: "6%", percent: 6 },
    { label: "7%", percent: 7 },
    { label: "8%", percent: 8 },
    { label: "9%", percent: 9 },
    { label: "10%", percent: 10 }
  ];

  // Beregn netto avkastning (Avkastning utover lånekostnad) for hver rentekostnad
  const data = [];
  interestCostOptions.forEach(option => {
    const netReturn = calculateNetReturnForInterestCost(option.percent);
    data.push({ label: option.label, value: netReturn });
  });

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  let niceMin, niceMax;
  const maxAllowed = maxValue * 1.1;
  const minAllowed = minValue < 0 ? minValue * 1.1 : Math.max(0, minValue * 0.9);
  
  if (minValue >= 0) {
    niceMin = 0;
    niceMax = maxAllowed;
  } else if (maxValue <= 0) {
    niceMin = minAllowed;
    niceMax = 0;
  } else {
    const maxAbs = Math.max(Math.abs(minValue), Math.abs(maxValue));
    niceMin = Math.min(-maxAbs * 1.1, minAllowed);
    niceMax = Math.min(maxAbs * 1.1, maxAllowed);
  }
  
  let range = niceMax - niceMin;
  const niceRange = niceNumber(range, false);
  niceMin = Math.floor(niceMin / niceRange) * niceRange;
  let calculatedMax = Math.ceil(niceMax / niceRange) * niceRange;
  niceMax = Math.min(calculatedMax, maxAllowed);
  if (minValue < 0) {
    niceMin = Math.max(niceMin, minAllowed);
  }
  
  range = niceMax - niceMin;
  const niceTick = niceNumber(range / 10, true);

  const containerRect = chartContainer.getBoundingClientRect();
  const containerWidth = containerRect.width > 0 ? containerRect.width : 1800;
  const containerHeight = containerRect.height > 0 ? containerRect.height : 1300;
  
  const margin = { top: 16, right: 24, bottom: 96, left: 112 };
  const width = Math.max(800, containerWidth);
  const height = Math.max(600, containerHeight);
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const existingSvg = chartContainer.querySelector("svg");
  if (existingSvg) {
    existingSvg.remove();
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.style.width = "100%";
  svg.style.maxWidth = `${width}px`;
  svg.style.height = "auto";
  svg.style.aspectRatio = `${width} / ${height}`;
  svg.style.overflow = "visible";

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("transform", `translate(${margin.left},${margin.top})`);

  const yAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxisLine.setAttribute("x1", 0);
  yAxisLine.setAttribute("y1", 0);
  yAxisLine.setAttribute("x2", 0);
  yAxisLine.setAttribute("y2", chartHeight);
  yAxisLine.setAttribute("stroke", CHART_THEME.axis);
  yAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(yAxisLine);

  const ticks = [];
  for (let tick = 0; tick >= niceMin; tick -= niceTick) {
    ticks.push(tick);
  }
  for (let tick = niceTick; tick <= niceMax; tick += niceTick) {
    ticks.push(tick);
  }
  ticks.sort((a, b) => a - b);
  const uniqueTicks = [...new Set(ticks)];

  appendChartGridLines(g, uniqueTicks, niceMin, niceMax, chartWidth, chartHeight);
  
  uniqueTicks.forEach(tick => {
    const y = chartHeight - ((tick - niceMin) / (niceMax - niceMin)) * chartHeight;
    
    const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    tickLine.setAttribute("x1", -8);
    tickLine.setAttribute("y1", y);
    tickLine.setAttribute("x2", 0);
    tickLine.setAttribute("y2", y);
    tickLine.setAttribute("stroke", CHART_THEME.axis);
    tickLine.setAttribute("stroke-width", "1.5");
    g.appendChild(tickLine);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", -20);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("dominant-baseline", "middle");
    styleChartText(label, { size: CHART_THEME.tickSize, weight: "500" });
    label.textContent = formatNOK(Math.round(tick));
    g.appendChild(label);
  });

  const zeroY = chartHeight - ((0 - niceMin) / (niceMax - niceMin)) * chartHeight;

  const xAxisLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxisLine.setAttribute("x1", 0);
  xAxisLine.setAttribute("y1", zeroY);
  xAxisLine.setAttribute("x2", chartWidth);
  xAxisLine.setAttribute("y2", zeroY);
  xAxisLine.setAttribute("stroke", CHART_THEME.zero);
  xAxisLine.setAttribute("stroke-width", "1.5");
  g.appendChild(xAxisLine);

  // X-akse labels - vis rentekostnad (1%, 2%, 3%, osv.)
  const barWidth = chartWidth / 10;
  data.forEach((d, i) => {
    const x = (i + 0.5) * barWidth;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x);
    label.setAttribute("y", chartHeight + 30);
    label.setAttribute("text-anchor", "middle");
    styleChartText(label, { size: CHART_THEME.categorySize, weight: "500" });
    label.textContent = d.label;
    g.appendChild(label);
  });

  // X-akse forklaring
  const xAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  xAxisLabel.setAttribute("x", chartWidth / 2);
  xAxisLabel.setAttribute("y", chartHeight + 80);
  xAxisLabel.setAttribute("text-anchor", "middle");
  styleChartText(xAxisLabel, { size: CHART_THEME.axisTitleSize, weight: "600", fill: CHART_THEME.ink });
  xAxisLabel.textContent = "Rentekostnad";
  g.appendChild(xAxisLabel);

  data.forEach((d, i) => {
    const barHeight = Math.abs((d.value / (niceMax - niceMin)) * chartHeight);
    const x = i * barWidth + barWidth * 0.1;
    const width = barWidth * 0.8;
    
    let y, height;
    let fillColor;
    
    if (d.value >= 0) {
      y = zeroY - barHeight;
      height = barHeight;
      fillColor = CHART_THEME.positive;
    } else {
      y = zeroY;
      height = barHeight;
      fillColor = CHART_THEME.negative;
    }

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", fillColor);
    rect.setAttribute("stroke", "none");
    rect.setAttribute("rx", "6");
    rect.setAttribute("ry", "6");
    rect.style.cursor = "pointer";
    rect.style.transition = "opacity 0.2s";

    rect.addEventListener("mouseenter", () => {
      rect.style.opacity = "0.8";
      const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltip.setAttribute("x", x + width / 2);
      tooltip.setAttribute("y", d.value >= 0 ? y - 8 : y + height + 20);
      tooltip.setAttribute("text-anchor", "middle");
      styleChartText(tooltip, { size: CHART_THEME.valueSize, weight: "600", fill: CHART_THEME.ink });
      tooltip.setAttribute("id", `tooltip-${i}`);
      tooltip.textContent = formatNOK(Math.round(d.value));
      g.appendChild(tooltip);
    });

    rect.addEventListener("mouseleave", () => {
      rect.style.opacity = "1";
      const tooltip = g.querySelector(`#tooltip-${i}`);
      if (tooltip) tooltip.remove();
    });

    g.appendChild(rect);
  });

  svg.appendChild(g);
  chartContainer.appendChild(svg);
}