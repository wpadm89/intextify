document.addEventListener('DOMContentLoaded', () => {

    // --- State & DOM Mapping ---
    const APP_STATE = {
        theme: 'dark',
        metric: false,
        location: 'lahore',
        plotDetails: {
            sizePreset: '5_marla',
            length: 50,
            width: 25,
            roofHeight: 11,
            area: 1250 // Native units stored internally
        },
        boqData: [
            { id: 'bricks', name: 'Bricks', unitMetric: 'piece', unitImp: 'piece', defaultRate: 24, factor: 13.15, currentQty: 16438, currentRate: 24, isCustomQty: false, heightDep: true },
            { id: 'cement', name: 'Cement', unitMetric: 'bags', unitImp: 'bags', defaultRate: 1450, factor: 0.39, currentQty: 488, currentRate: 1450, isCustomQty: false, heightDep: true },
            { id: 'sand', name: 'Sand', unitMetric: 'cum', unitImp: 'cft', defaultRate: 55, factor: 1.84, currentQty: 2300, currentRate: 55, isCustomQty: false, heightDep: true },
            { id: 'crush', name: 'Crush / Gravel', unitMetric: 'cum', unitImp: 'cft', defaultRate: 105, factor: 1.31, currentQty: 1638, currentRate: 105, isCustomQty: false, heightDep: false },
            { id: 'steel', name: 'Steel', unitMetric: 'kg', unitImp: 'kg', defaultRate: 282, factor: 2.63, currentQty: 3288, currentRate: 282, isCustomQty: false, heightDep: false },
            { id: 'labor', name: 'Labor', unitMetric: 'sqm', unitImp: 'sqft', defaultRate: 420, factor: 1, currentQty: 1250, currentRate: 420, isCustomQty: false, heightDep: false }
        ]
    };

    // DOM Elements
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const unitToggle = document.getElementById('unit-toggle');
    const unitToggleLabel = document.getElementById('unit-toggle-label');
    
    // UI Selectors
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    // Estimator Inputs
    const plotSizeSelect = document.getElementById('plotSize');
    const plotLength = document.getElementById('plotLength');
    const plotWidth = document.getElementById('plotWidth');
    const roofHeight = document.getElementById('roofHeight');
    const areaDisplay = document.getElementById('coveredAreaDisplay');
    const overallTotalEl = document.getElementById('overall-total');

    const projectLocationSelect = document.getElementById('projectLocation');
    const ratesLastUpdatedEl = document.getElementById('rates-last-updated');

    const cLength = document.getElementById('concLength');
    const cWidth = document.getElementById('concWidth');
    const cDepth = document.getElementById('concDepth');
    const cRatio = document.getElementById('concRatio');

    const plotConfigSection = document.getElementById('plot-config-section');
    const ratesConfigSection = document.getElementById('rates-config-section');
    const concreteConfigSection = document.getElementById('concrete-config-section');
    const actionFooter = document.querySelector('.sidebar-footer');

    // Labels
    const lblLen = document.querySelectorAll('.lbl-len');
    const lblThick = document.querySelectorAll('.lbl-thick');
    const lblVol = document.querySelectorAll('.lbl-vol');

    // --- Helpers ---
    const formatCurrency = (amt) => 'Rs. ' + Math.ceil(amt).toLocaleString('en-PK', { maximumFractionDigits: 0 });

    const getRawFloat = (el) => parseFloat(el.value) || 0;

    const FREIGHT_MODIFIERS = {
        'lahore': 0.00,
        'gujranwala': 0.02,
        'talagang': 0.06,
        'islamabad': 0.05,
        'karachi': 0.08
    };

    let serverBaseRates = {}; // Store unmodified base rates


    // Highlight active link based on URL pathname
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('href') === window.location.pathname) {
            link.classList.add('active');
        }
    });

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-view');
            if (!targetId) return;

            navItems.forEach(n => n.classList.remove('active'));
            viewSections.forEach(v => v.classList.remove('active'));
            
            btn.classList.add('active');
            updateSeoContent(targetId);
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');
            
            // Context Aware Sidebar Swapping
            if(targetId === 'concrete-view') {
                if(plotConfigSection) plotConfigSection.classList.add('hidden');
                if(ratesConfigSection) ratesConfigSection.classList.add('hidden');
                if(actionFooter) actionFooter.classList.add('hidden');
                if(concreteConfigSection) concreteConfigSection.classList.remove('hidden');
            } else if (targetId === 'estimator-view') {
                if(plotConfigSection) plotConfigSection.classList.remove('hidden');
                if(ratesConfigSection) ratesConfigSection.classList.remove('hidden');
                if(actionFooter) actionFooter.classList.remove('hidden');
                if(concreteConfigSection) concreteConfigSection.classList.add('hidden');
            } else {
                // If it is any of the 'coming soon' panels, hide everything in the right config panel to keep it clean
                if(plotConfigSection) plotConfigSection.classList.add('hidden');
                if(ratesConfigSection) ratesConfigSection.classList.add('hidden');
                if(actionFooter) actionFooter.classList.add('hidden');
                if(concreteConfigSection) concreteConfigSection.classList.add('hidden');
            }
        });
    });

    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', async () => {
        if (!window.jspdf) {
            alert('PDF engine is still loading. Please try again in a moment!');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Define Units dynamically
        const unitL = APP_STATE.metric ? "m" : "ft";
        
        // Header Infographics
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text("Intextify BOQ Estimator", 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("Project Estimate Report", 14, 30);
        
        // Metadata / Project Dimension strings
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        let activePlotText = plotSizeSelect.options[plotSizeSelect.selectedIndex].text;
        
        doc.text(`Plot Size: ${activePlotText}`, 14, 45);
        doc.text(`Dimensions: ${plotLength.value} ${unitL} x ${plotWidth.value} ${unitL}`, 14, 52);
        doc.text(`Roof Height: ${roofHeight.value} ${unitL}`, 14, 59);
        doc.text(`Covered Area: ${areaDisplay.value}`, 14, 66);
        
        // Compile the rows for the tabular report
        let tableData = [];
        let grandTotal = 0;
        
        APP_STATE.boqData.forEach(mat => {
            const unitStr = APP_STATE.metric ? mat.unitMetric : mat.unitImp;
            const cost = mat.currentQty * mat.currentRate;
            grandTotal += cost;
            
            tableData.push([
                mat.name,
                `${Number(mat.currentQty.toFixed(2))} ${unitStr}`,
                `Rs. ${Number(mat.currentRate.toFixed(2))}`,
                `Rs. ${Math.ceil(cost).toLocaleString('en-PK')}`
            ]);
        });
        
        // Generate the strict one-page tabular form using autotable plugin
        doc.autoTable({
            startY: 75,
            head: [['Material', 'Quantity', 'Rate', 'Amount Total (PKR)']],
            body: tableData,
            foot: [[
                { content: 'Estimated Cost (Total PKR)', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [20, 20, 20]} },
                { content: `Rs. ${Math.ceil(grandTotal).toLocaleString('en-PK')}`, styles: { fontStyle: 'bold', fillColor: [0, 229, 255], textColor: [0,0,0]} }
            ]],
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
            styles: { fontSize: 11, cellPadding: 4, textColor: [40, 40, 40] }
        });
        
        // Ask for Download Location using File System Access API
        try {
            if (window.showSaveFilePicker) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'Intextify_BOQ_Estimate.pdf',
                    types: [{
                        description: 'PDF Document',
                        accept: {'application/pdf': ['.pdf']},
                    }],
                });
                
                const writable = await fileHandle.createWritable();
                const blob = doc.output('blob');
                await writable.write(blob);
                await writable.close();
            } else {
                // Fallback for older browsers
                throw new Error('Not supported');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                const customName = prompt('Enter a filename to save:', 'Intextify_BOQ_Estimate.pdf');
                if (customName) doc.save(customName);
            }
        }
    });
    }

    const btnSave = document.getElementById('btn-save');
    if (btnSave) {
        btnSave.addEventListener('click', () => saveState());
    }

    // --- Global Math Unit Toggler ---
    const enforceMetricMath = () => {
        const isMetric = APP_STATE.metric;

        // Label updates
        lblLen.forEach(l => l.innerText = isMetric ? 'm' : 'ft');
        lblThick.forEach(l => l.innerText = isMetric ? 'cm' : 'inches');
        lblVol.forEach(l => l.innerText = isMetric ? 'cum' : 'cft');
        if(unitToggleLabel) unitToggleLabel.innerText = isMetric ? 'Units: Metric (m)' : 'Units: Imperial (ft)';

        if (!plotLength) return; // Exit if calculator inputs are missing

        // Number conversion helper
        const cleanVal = v => Number(v.toFixed(5)).toString();
        const convertDim = (val, toMetric) => toMetric ? (val * 0.3048) : (val / 0.3048);
        const convertThick = (val, toMetric) => toMetric ? (val * 2.54) : (val / 2.54);

        // Modify physical inputs globally
        plotLength.value = cleanVal(convertDim(getRawFloat(plotLength), isMetric));
        plotWidth.value = cleanVal(convertDim(getRawFloat(plotWidth), isMetric));
        roofHeight.value = cleanVal(convertDim(getRawFloat(roofHeight), isMetric));
        
        cLength.value = cleanVal(convertDim(getRawFloat(cLength), isMetric));
        cWidth.value = cleanVal(convertDim(getRawFloat(cWidth), isMetric));
        cDepth.value = cleanVal(convertThick(getRawFloat(cDepth), isMetric));

        // Rate and Custom Qty Conversion 
        APP_STATE.boqData.forEach(mat => {
            if (mat.unitMetric !== mat.unitImp) {
                if(mat.unitMetric === 'cum' && mat.unitImp === 'cft') {
                    const volFactor = Math.pow(0.3048, 3);
                    mat.currentRate = isMetric ? (mat.currentRate / volFactor) : (mat.currentRate * volFactor);
                    if(mat.isCustomQty) mat.currentQty = isMetric ? (mat.currentQty * volFactor) : (mat.currentQty / volFactor);
                }
                if(mat.unitMetric === 'sqm' && mat.unitImp === 'sqft') {
                    const areaFactor = Math.pow(0.3048, 2);
                    mat.currentRate = isMetric ? (mat.currentRate / areaFactor) : (mat.currentRate * areaFactor);
                    if(mat.isCustomQty) mat.currentQty = isMetric ? (mat.currentQty * areaFactor) : (mat.currentQty / areaFactor);
                }
            }
        });
    };

    // Bridge for new unit toggle event
    document.addEventListener('unitChange', (e) => {
        APP_STATE.metric = e.detail.unit === 'sqm';
        
        // Convert Steel length input
        const sLen = document.getElementById('steelLength');
        if (sLen && sLen.value !== '') {
            let currentValue = parseFloat(sLen.value);
            if (!isNaN(currentValue)) {
                let newValue = APP_STATE.metric ? (currentValue * 0.3048) : (currentValue / 0.3048);
                sLen.value = newValue.toFixed(2);
            }
        }

        enforceMetricMath();
        renderRatesSidebar();
        renderEstimator();
        updateConcreteCalculator();
        if (typeof calculateSteel === 'function') calculateSteel();
        saveState();
    });

    // Bridge for new dark mode toggle to update charts
    const observer = new MutationObserver(() => {
        APP_STATE.theme = document.documentElement.dataset.theme || 'dark';
        saveState();
        if(pieChartInstance && barChartInstance) {
            Chart.defaults.color = getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#94a3b8';
            pieChartInstance.update();
            barChartInstance.update();
        }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

(function () {
  'use strict';

  const header     = document.getElementById('mainHeader');
  const darkToggle = document.getElementById('darkToggle');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!header || !darkToggle || !menuToggle || !mobileMenu) return;

  // ── Dropdown: JS hover delay for bulletproof UX ──────────────
  let ddCloseTimer = null;

  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const menu = dropdown.querySelector('.nav-dropdown-menu');
    if (!menu) return;

    const openDropdown = () => {
      clearTimeout(ddCloseTimer);
      dropdown.classList.add('dd-open');
      menu.style.opacity = '1';
      menu.style.visibility = 'visible';
      menu.style.transform = 'translateX(-50%) translateY(0)';
      menu.style.pointerEvents = 'auto';
    };

    const closeDropdown = () => {
      ddCloseTimer = setTimeout(() => {
        dropdown.classList.remove('dd-open');
        menu.style.opacity = '';
        menu.style.visibility = '';
        menu.style.transform = '';
        menu.style.pointerEvents = '';
      }, 380); /* 380ms grace period — cursor can travel safely */
    };

    dropdown.addEventListener('mouseenter', openDropdown);
    dropdown.addEventListener('mouseleave', closeDropdown);
    menu.addEventListener('mouseenter', () => clearTimeout(ddCloseTimer));
    menu.addEventListener('mouseleave', closeDropdown);
  });

  // Dark Mode — restore saved preference
  const savedTheme = localStorage.getItem('intextify-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  darkToggle.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const next   = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('intextify-theme', next);
    darkToggle.setAttribute('aria-label',
      isDark ? 'Enable dark mode' : 'Enable light mode');
  });

  // Unit Toggle
  document.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.unit-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      document.dispatchEvent(new CustomEvent('unitChange', {
        detail: { unit: btn.dataset.unit }
      }));
    });
  });

  // Mobile Menu
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.focus();
    }
  });

  // Scroll shadow
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // SEO FIX: aria-current — set "page" on active link, 
  // REMOVE attribute entirely on inactive links (not set to "false")
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    const isActive = href === '/'
      ? path === '/' || path === '/index.html'
      : path.startsWith(href);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current'); // ← correct SEO practice
    }
  });

})();

    // ── Context-Aware SEO Sections ────────────────────────────
    function updateSeoContent(activeViewId) {
        const boqSeo = document.getElementById('seo-boq');
        const pccSeo = document.getElementById('seo-pcc');
        if (!boqSeo || !pccSeo) return;
        const isBoq  = activeViewId === 'estimator-view';
        const isPcc  = activeViewId === 'concrete-view';
        boqSeo.classList.toggle('seo-hidden', !isBoq);
        pccSeo.classList.toggle('seo-hidden', !isPcc);
    }

    // ── Scroll Transition: Tools dim when SEO section appears ─
    function initSeoScrollTransitions() {
        const seoWrapper = document.getElementById('seo-content-wrapper');
        const dashLayout = document.querySelector('.dashboard-layout');
        if (!seoWrapper || !dashLayout) return;

        // Dim/lift the tools panel when SEO content scrolls in
        const toolsFader = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                dashLayout.classList.toggle('tools-scrolled-out',
                    e.isIntersecting);
            });
        }, { threshold: 0.05 });
        toolsFader.observe(seoWrapper);

        // Staggered entrance for each individual SEO block
        const blockFader = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting)
                    e.target.classList.add('seo-block-visible');
            });
        }, { threshold: 0.08 });
        document.querySelectorAll('.seo-block')
            .forEach(b => blockFader.observe(b));
    }

    // --- State Engine ---
    const loadState = () => {
        const saved = localStorage.getItem('intextifyBOQ_v1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.assign(APP_STATE.plotDetails, parsed.plotDetails || {});
                APP_STATE.theme = parsed.theme || 'dark';
                APP_STATE.metric = parsed.metric || false;
                APP_STATE.location = parsed.location || 'lahore';
            } catch(e) {}
        }
        
        if (projectLocationSelect) {
            projectLocationSelect.value = APP_STATE.location;
        }

        if (themeToggle) themeToggle.checked = APP_STATE.theme === 'dark';
        root.setAttribute('data-theme', APP_STATE.theme);
        if (unitToggle) unitToggle.checked = APP_STATE.metric;
        if(unitToggleLabel) unitToggleLabel.innerText = APP_STATE.metric ? 'Units: Metric (m)' : 'Units: Imperial (ft)';
        if(APP_STATE.metric) {
           lblLen.forEach(l => l.innerText = 'm');
           lblThick.forEach(l => l.innerText = 'cm');
           lblVol.forEach(l => l.innerText = 'cum');
        }
    };

    const saveState = () => {
        localStorage.setItem('intextifyBOQ_v1', JSON.stringify({
            theme: APP_STATE.theme,
            metric: APP_STATE.metric,
            location: APP_STATE.location,
            plotDetails: APP_STATE.plotDetails
        }));
    };

    const applyFreightModifiers = () => {
        const freightMult = 1 + (FREIGHT_MODIFIERS[APP_STATE.location] || 0);

        APP_STATE.boqData.forEach(mat => {
            let base = serverBaseRates[mat.id] || mat.defaultRate;
            // Apply freight to materials except labor
            if (mat.id !== 'labor') {
                mat.currentRate = base * freightMult;
            } else {
                mat.currentRate = base;
            }
        });

        // Trigger math refresh to adjust standard units
        if (APP_STATE.metric) {
            enforceMetricMath();
        } else {
            renderRatesSidebar();
            renderEstimator();
            updateConcreteCalculator();
            if (typeof calculateSteel === 'function') calculateSteel();
        }
    };

    const fetchLiveRates = () => {
        overallTotalEl.innerHTML = '<span class="animate-pulse text-gray-400">Fetching live rates...</span>';

        fetch('/api/rates')
            .then(res => {
                if (!res.ok) throw new Error('Server error: ' + res.status);
                return res.json();
            })
            .then(data => {
                // Set default if not provided
                if (data.lastUpdated) {
                    const dateObj = new Date(data.lastUpdated);
                    const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    ratesLastUpdatedEl.innerText = `Last Updated : ${formattedDate} [${formattedTime}]`;
                } else {
                    ratesLastUpdatedEl.innerText = `Last Updated : Today`;
                }
                
                // Merge overrides on top of base rates
                serverBaseRates = { ...data.baseRates, ...data.overrides };
                applyFreightModifiers();
            })
            .catch(() => {
                ratesLastUpdatedEl.innerText = 'Last Updated : Offline (Local)';
                console.log('Backend not reachable, using static fallbacks.');
                
                // Initialize with fallbacks
                APP_STATE.boqData.forEach(mat => { serverBaseRates[mat.id] = mat.defaultRate; });
                applyFreightModifiers();
                
                overallTotalEl.textContent = 'Rs. (offline estimate)';
            });
    };

    if (projectLocationSelect) {
        projectLocationSelect.addEventListener('change', (e) => {
            APP_STATE.location = e.target.value;
            saveState();
            applyFreightModifiers();
        });
    }

    // --- Estimator Math Engine ---
    const updateDimensions = () => {
        const L = getRawFloat(plotLength);
        const W = getRawFloat(plotWidth);
        let currentArea = L * W; // This could be sqft or sqm depending on state!
        
        // Let's store area physically in the same dimension
        APP_STATE.plotDetails.area = currentArea;
        areaDisplay.value = currentArea.toFixed(1) + (APP_STATE.metric ? ' sqm' : ' sqft');
        return currentArea;
    };

    let pieChartInstance = null;
    let barChartInstance = null;

    const initCharts = () => {
        try {
            const pieCtx = document.getElementById('costPieChart').getContext('2d');
            const barCtx = document.getElementById('timelineBarChart').getContext('2d');

            Chart.defaults.color = getComputedStyle(root).getPropertyValue('--text-secondary').trim() || '#94a3b8';
            Chart.defaults.font.family = "'Inter', sans-serif";

            pieChartInstance = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#00E5FF', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right' } }
                }
            });

            barChartInstance = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['M1 (21.9%)', 'M2 (18.4%)', 'M3 (11.1%)', 'M4 (16.9%)', 'M5 (17.8%)', 'M6 (13.9%)'],
                    datasets: [{
                        label: 'Required Funds (PKR)',
                        data: [],
                        backgroundColor: 'rgba(236, 72, 153, 0.85)',
                        hoverBackgroundColor: 'rgba(236, 72, 153, 1)',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        } catch(e) { console.log('Chart init failed', e); }
    };

    const renderRatesSidebar = () => {
        const ratesContainer = document.getElementById('material-rates-container');
        if(!ratesContainer) return;
        ratesContainer.innerHTML = '';
        
        APP_STATE.boqData.forEach(mat => {
            let unitLabel = APP_STATE.metric ? mat.unitMetric : mat.unitImp;
            
            const group = document.createElement('div');
            group.className = 'form-group';
            group.innerHTML = `
                <label>${mat.name} Rate (PKR / ${unitLabel})</label>
                <input type="number" class="rate-input" data-id="${mat.id}" value="${Number(mat.currentRate.toFixed(2))}">
            `;
            ratesContainer.appendChild(group);
        });

        document.querySelectorAll('.rate-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const targetMat = APP_STATE.boqData.find(m => m.id === input.getAttribute('data-id'));
                if(targetMat) { targetMat.currentRate = parseFloat(input.value) || 0; }
                renderEstimator(); 
            });
        });
    };

    const renderEstimator = () => {
        const currentArea = updateDimensions();
        const cardsContainer = document.getElementById('boq-dashboard-cards');
        if(!cardsContainer) return;
        cardsContainer.innerHTML = '';
        
        let overallCost = 0;
        let pieLabels = [];
        let pieData = [];

        APP_STATE.boqData.forEach(mat => {
            const normalizationFactor = APP_STATE.metric ? (1 / Math.pow(0.3048, 2)) : 1;
            const absoluteSqftArea = currentArea * normalizationFactor;

            const inputHeight = getRawFloat(roofHeight);
            const heightInFt = APP_STATE.metric ? (inputHeight / 0.3048) : inputHeight;
            const heightMultiplier = heightInFt / 11;

            let computedQtySqft = absoluteSqftArea * mat.factor;
            if (mat.heightDep) {
                computedQtySqft = computedQtySqft * heightMultiplier;
            }

            let displayQty = computedQtySqft;
            let unitLabel = APP_STATE.metric ? mat.unitMetric : mat.unitImp;

            if (APP_STATE.metric) {
                if (mat.unitMetric === 'cum' && mat.unitImp === 'cft') displayQty = computedQtySqft * Math.pow(0.3048, 3);
                if (mat.unitMetric === 'sqm' && mat.unitImp === 'sqft') displayQty = currentArea;
            }

            if (mat.isCustomQty) {
                displayQty = mat.currentQty;
            } else {
                mat.currentQty = displayQty;
            }

            const cost = displayQty * mat.currentRate;
            overallCost += cost;

            pieLabels.push(mat.name);
            pieData.push(cost);

            // Create Information Card
            const card = document.createElement('div');
            card.className = 'info-card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-title">${mat.name}</span>
                    <span class="card-unit">${unitLabel}</span>
                </div>
                <div class="card-body">
                    <div class="card-metric">
                        <span>Quantity Req.</span>
                        <strong>${Number(displayQty.toFixed(2))}</strong>
                    </div>
                    <div class="card-metric">
                        <span>Current Rate</span>
                        <strong>Rs. ${Number(mat.currentRate.toFixed(2))}</strong>
                    </div>
                </div>
                <div class="card-total">
                    <span>Est. Cost</span>
                    <strong>${formatCurrency(cost)}</strong>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        overallTotalEl.innerText = formatCurrency(overallCost);

        // Update Charts Data dynamically
        if(pieChartInstance && barChartInstance) {
            pieChartInstance.data.labels = pieLabels;
            pieChartInstance.data.datasets[0].data = pieData;
            pieChartInstance.update();

            // 6 months arbitrary distribution simulating a construction flow
            const timelineRatios = [0.219, 0.184, 0.111, 0.169, 0.178, 0.139];
            barChartInstance.data.datasets[0].data = timelineRatios.map(r => overallCost * r);
            barChartInstance.update();
        }
    };

    if (plotSizeSelect) {
        plotSizeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            APP_STATE.plotDetails.sizePreset = val;
            
            // Reset custom quantity overrides when plotting standard sizes
            APP_STATE.boqData.forEach(m => m.isCustomQty = false);
            
            let STANDARD_PLOTS;
            // Inject standard dims in feet or meters depending on state
            if (APP_STATE.metric) {
                STANDARD_PLOTS = {
                    '5_marla': { L: 15.24, W: 7.62 },
                    '10_marla': { L: 19.81, W: 10.66 },
                    '1_kanal': { L: 27.43, W: 15.24 }
                };
            } else {
                STANDARD_PLOTS = {
                    '5_marla': { L: 50, W: 25 },
                    '10_marla': { L: 65, W: 35 },
                    '1_kanal': { L: 90, W: 50 }
                };
            }

            if (STANDARD_PLOTS[val]) {
                plotLength.value = STANDARD_PLOTS[val].L;
                plotWidth.value = STANDARD_PLOTS[val].W;
                renderEstimator();
            }
        });
    }

    if (plotLength && plotWidth && roofHeight) {
        [plotLength, plotWidth, roofHeight].forEach(inp => {
            inp.addEventListener('input', () => {
                plotSizeSelect.value = 'custom';
                APP_STATE.plotDetails.sizePreset = 'custom';
                // Reset custom quantity overrides when re-calculating dimensions
                APP_STATE.boqData.forEach(m => m.isCustomQty = false);
                renderEstimator();
            });
        });
    }

    // --- Concrete Calculator Logic ---
    let concreteChartInstance = null;
    function updateConcreteChart(cementKg, sandKg, aggKg) {
        if (concreteChartInstance) concreteChartInstance.destroy();
        const ctx = document.getElementById('concreteChart');
        if (!ctx) return;
        concreteChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cement', 'Sand', 'Aggregate'],
                datasets: [{
                    data: [cementKg, sandKg, aggKg],
                    backgroundColor: ['#00E5FF', '#3b82f6', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }
            }
        });
    }

    const updateConcreteCalculator = () => {
        const concShape = document.getElementById('concShape');
        if (!concShape) return;
        
        const isMetric = APP_STATE.metric;
        const shape = concShape.value;
        const qty = parseFloat(document.getElementById('concQty').value) || 1;
        const ratioStr = document.getElementById('concRatio').value;
        
        const L = getRawFloat(cLength);
        const W = getRawFloat(cWidth);
        const D = getRawFloat(cDepth);
        const dia = parseFloat(document.getElementById('concDiameter').value) || 0;
        
        let wetVol = 0;
        if (shape === 'slab') {
            wetVol = isMetric ? (L * W * (D / 100)) : (L * W * (D / 12));
            wetVol *= qty;
        } else {
            const H_converted = isMetric ? (D / 100) : (D / 12);
            wetVol = Math.PI * Math.pow(dia / 2, 2) * H_converted * qty;
        }

        const dryVol = wetVol * 1.54; // Standard factor — NOT 1.524

        // Parse ratio
        const parts = ratioStr.split(':').map(Number);
        const sum = parts.reduce((a, b) => a + b, 0);

        const cementVol = dryVol * (parts[0] / sum);
        const sandVol = dryVol * (parts[1] / sum);
        const aggVol = dryVol * (parts[2] / sum);

        let cementBags, sandTons, aggTons;

        if (isMetric) {
            cementBags = (cementVol / 0.0347).toFixed(1);
            sandTons = (sandVol * 1550 / 1000).toFixed(2);
            aggTons = (aggVol * 1350 / 1000).toFixed(2);
        } else {
            cementBags = (cementVol / 1.25).toFixed(1);
            sandTons = (sandVol * 43.76 / 1000).toFixed(2);
            aggTons = (aggVol * 38.23 / 1000).toFixed(2);
        }

        const cementKg = (parseFloat(cementBags) * 50);

        // Update DOM
        const unitVol = isMetric ? ' cum' : ' cft';
        document.getElementById('res-wet-vol').textContent = wetVol.toFixed(2) + unitVol;
        document.getElementById('res-dry-vol').textContent = dryVol.toFixed(2) + unitVol;
        document.getElementById('res-cement-bags').textContent = cementBags + ' Bags';
        document.getElementById('res-cement-kg').textContent = cementKg + ' kg';
        document.getElementById('res-sand-cft').textContent = sandVol.toFixed(2) + unitVol;
        document.getElementById('res-sand-tons').textContent = sandTons + ' T';
        document.getElementById('res-agg-cft').textContent = aggVol.toFixed(2) + unitVol;
        document.getElementById('res-agg-tons').textContent = aggTons + ' T';

        // Update chart
        updateConcreteChart(cementKg, parseFloat(sandTons) * 1000, parseFloat(aggTons) * 1000);
    };

    const concShape = document.getElementById('concShape');
    if (concShape) {
        concShape.addEventListener('change', (e) => {
            const isColumn = e.target.value === 'column';
            document.getElementById('conc-diameter-group').classList.toggle('hidden', !isColumn);
            document.querySelector('.conc-slab-inputs').classList.toggle('hidden', isColumn);
            updateConcreteCalculator();
        });
    }

    ['concLength', 'concWidth', 'concDepth', 'concDiameter', 'concQty', 'concRatio'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateConcreteCalculator);
    });

    // --- Steel Calculator Logic ---
    const calculateSteel = () => {
        const diaSel = document.getElementById('steelDiameter');
        const lenInp = document.getElementById('steelLength');
        if (!diaSel || !lenInp) return;
        
        let diameter = parseFloat(diaSel.value) || 0;
        let length = parseFloat(lenInp.value) || 0;
        
        let weightKg;
        if (APP_STATE.metric) {
            weightKg = (Math.pow(diameter, 2) / 162.28) * length;
        } else {
            weightKg = (Math.pow(diameter, 2) / 533) * length;
        }
        
        // Find current steel rate from global state
        let steelMat = APP_STATE.boqData.find(m => m.id === 'steel');
        let currentRate = steelMat ? steelMat.currentRate : (serverBaseRates['steel'] || 282);

        let totalCost = weightKg * currentRate;

        // DOM Update
        const weightEl = document.getElementById('res-steel-weight');
        const rateEl = document.getElementById('res-steel-rate');
        const costEl = document.getElementById('res-steel-cost');
        
        if (weightEl) weightEl.innerText = weightKg.toFixed(2);
        if (rateEl) rateEl.innerText = formatCurrency(currentRate);
        if (costEl) costEl.innerText = formatCurrency(totalCost);
    };

    // --- Plastering Calculator Logic ---
    const calculatePlastering = () => {
        const areaInp = document.getElementById('plastArea');
        const thickInp = document.getElementById('plastThickness');
        const ratioSel = document.getElementById('plastRatio');
        if (!areaInp || !thickInp || !ratioSel) return;
        
        const area = parseFloat(areaInp.value) || 0;
        const thickness = parseFloat(thickInp.value) || 0;
        const ratioStr = ratioSel.value || '1:6';
        
        // Wet Volume = Area (sqft) * (Thickness (in) / 12)
        const wetVol = area * (thickness / 12);
        const dryVol = wetVol * 1.33; // Standard mortar dry volume factor
        
        const parts = ratioStr.split(':').map(Number);
        const sum = parts.reduce((a, b) => a + b, 0);
        
        const cementVol = dryVol * (parts[0] / sum);
        const sandVol = dryVol * (parts[1] / sum);
        
        const cementBags = (cementVol / 1.25);
        const sandTons = (sandVol * 43.76) / 1000;
        
        // Pricing
        const cementMat = APP_STATE.boqData.find(m => m.id === 'cement');
        const sandMat = APP_STATE.boqData.find(m => m.id === 'sand');
        const cementRate = cementMat ? cementMat.currentRate : (serverBaseRates['cement'] || 1450);
        const sandRate = sandMat ? sandMat.currentRate : (serverBaseRates['sand'] || 55);
        
        // Cost: Cement bags * rate per bag + Sand volume (cft) * rate per cft
        const totalCost = (Math.ceil(cementBags) * cementRate) + (sandVol * sandRate);
        
        // Update DOM
        const elWet = document.getElementById('res-plast-wet');
        const elDry = document.getElementById('res-plast-dry');
        const elCement = document.getElementById('res-plast-cement');
        const elSand = document.getElementById('res-plast-sand');
        const elCost = document.getElementById('res-plast-cost');
        
        if (elWet) elWet.innerText = wetVol.toFixed(2);
        if (elDry) elDry.innerText = dryVol.toFixed(2);
        if (elCement) elCement.innerText = Math.ceil(cementBags) + ' Bags';
        if (elSand) elSand.innerText = sandTons.toFixed(2) + ' Tons';
        if (elCost) elCost.innerText = formatCurrency(totalCost);
    };

    const pArea = document.getElementById('plastArea');
    const pThick = document.getElementById('plastThickness');
    const pRatio = document.getElementById('plastRatio');
    if (pArea) pArea.addEventListener('input', calculatePlastering);
    if (pThick) pThick.addEventListener('input', calculatePlastering);
    if (pRatio) pRatio.addEventListener('change', calculatePlastering);


    const sDia = document.getElementById('steelDiameter');
    const sLen = document.getElementById('steelLength');
    if (sDia) sDia.addEventListener('input', calculateSteel);
    if (sLen) sLen.addEventListener('input', calculateSteel);

    // Initialize
    loadState();
    updateSeoContent('estimator-view');
    if (document.getElementById('seo-content-wrapper'))
        initSeoScrollTransitions();
    if (document.getElementById('plotSize')) {
        initCharts();
        fetchLiveRates();
        renderRatesSidebar();
        renderEstimator();
        updateConcreteCalculator();
        if (typeof calculateSteel === 'function') calculateSteel();
        if (typeof calculatePlastering === 'function') calculatePlastering();
    }

    // ── Hash-based view routing (from dropdown links on other pages) ──
    const switchToView = (viewId) => {
        if (!viewId) return;
        viewSections.forEach(v => v.classList.remove('active'));
        const target = document.getElementById(viewId);
        if (!target) return;
        target.classList.add('active');

        if (viewId === 'concrete-view') {
            if(plotConfigSection)     plotConfigSection.classList.add('hidden');
            if(ratesConfigSection)    ratesConfigSection.classList.add('hidden');
            if(actionFooter)          actionFooter.classList.add('hidden');
            if(concreteConfigSection) concreteConfigSection.classList.remove('hidden');
            updateConcreteCalculator();
        } else if (viewId === 'steel-view') {
            if(plotConfigSection)     plotConfigSection.classList.add('hidden');
            if(ratesConfigSection)    ratesConfigSection.classList.add('hidden');
            if(actionFooter)          actionFooter.classList.add('hidden');
            if(concreteConfigSection) concreteConfigSection.classList.add('hidden');
            calculateSteel();
        } else if (viewId === 'plastering-view') {
            if(plotConfigSection)     plotConfigSection.classList.add('hidden');
            if(ratesConfigSection)    ratesConfigSection.classList.add('hidden');
            if(actionFooter)          actionFooter.classList.add('hidden');
            if(concreteConfigSection) concreteConfigSection.classList.add('hidden');
            calculatePlastering();
        } else if (viewId === 'estimator-view') {
            if(plotConfigSection)     plotConfigSection.classList.remove('hidden');
            if(ratesConfigSection)    ratesConfigSection.classList.remove('hidden');
            if(actionFooter)          actionFooter.classList.remove('hidden');
            if(concreteConfigSection) concreteConfigSection.classList.add('hidden');
        }
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
        history.replaceState(null, '', '#' + viewId);
    };

    const VALID_VIEWS = ['estimator-view', 'concrete-view', 'steel-view', 'plastering-view'];
    const activateFromHash = () => {
        const hash = window.location.hash.replace('#', '');
        if (VALID_VIEWS.includes(hash)) switchToView(hash);
    };
    activateFromHash();
    window.addEventListener('hashchange', activateFromHash);

    // Wire dropdown links on index.html to switch views without page reload
    document.querySelectorAll('.nav-dd-item[href]').forEach(link => {
        const hash = link.getAttribute('href').replace('/#', '').replace('/', '');
        if (VALID_VIEWS.includes(hash)) {
            link.addEventListener('click', (e) => {
                if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                    e.preventDefault();
                    switchToView(hash);
                }
            });
        }
    });

    // --- Compliance & Cookies ---
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookiesBtn = document.getElementById('accept-cookies');
    
    if (cookieBanner && acceptCookiesBtn) {
        if (localStorage.getItem('intextify_cookie_consent') !== 'accepted') {
            setTimeout(() => cookieBanner.classList.remove('hidden'), 1500);
        }
        
        acceptCookiesBtn.addEventListener('click', () => {
            localStorage.setItem('intextify_cookie_consent', 'accepted');
            cookieBanner.style.opacity = '0';
            setTimeout(() => cookieBanner.classList.add('hidden'), 300);
        });
    }
});
