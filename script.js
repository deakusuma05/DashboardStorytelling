// ===================================================================
// SEMANTIC COLOR SYSTEM
// ===================================================================
const C = {
    sales:      { bg: 'rgba(74,144,217,0.72)',  line: '#4A90D9' },
    healthy:    { bg: 'rgba(46,204,113,0.72)',  line: '#2ECC71' },
    monitor:    { bg: 'rgba(142,68,173,0.55)', line: '#8E44AD' },
    warning:    { bg: 'rgba(243,156,18,0.72)', line: '#F39C12' },
    critical:   { bg: 'rgba(231,76,60,0.72)',  line: '#E74C3C' },
    context:    { bg: 'rgba(189,195,199,0.50)', line: '#95A5A6' },
};

// Status by margin threshold
function marginStatus(m) {
    if (m < 0)    return { status: 'Critical', badge: 'badge-red',    color: C.critical.line, rowClass: 'row-critical' };
    if (m < 0.03) return { status: 'Warning',  badge: 'badge-amber',  color: C.warning.line,  rowClass: 'row-warning' };
    if (m < 0.08) return { status: 'Monitor',  badge: 'badge-purple', color: C.monitor.line,  rowClass: '' };
    return             { status: 'Healthy',  badge: 'badge-green',  color: C.healthy.line,  rowClass: '' };
}

function marginColorPair(m) {
    const s = marginStatus(m);
    if (s.status === 'Critical') return C.critical;
    if (s.status === 'Warning')  return C.warning;
    if (s.status === 'Monitor')  return C.monitor;
    return C.healthy;
}

// ===================================================================
// GLOBALS
// ===================================================================
let RAW_DATA = [];
let charts = {};

// ===================================================================
// METRICS
// ===================================================================
const sumSales   = a => a.reduce((s, d) => s + d._Sales, 0);
const sumProfit  = a => a.reduce((s, d) => s + d._Profit, 0);
const avgDisc    = a => a.length ? a.reduce((s, d) => s + d._Discount, 0) / a.length : 0;
const distinctOrders = a => new Set(a.map(d => d['Order ID'])).size;
const margin     = a => { const s = sumSales(a); return s === 0 ? 0 : sumProfit(a) / s; };

function fmt(n, pre = '') {
    if (Math.abs(n) >= 1e6) return pre + (n / 1e6).toFixed(2) + 'M';
    if (Math.abs(n) >= 1e3) return pre + (n / 1e3).toFixed(1) + 'K';
    return pre + n.toFixed(2);
}
const pct = n => (n * 100).toFixed(2) + '%';

// ===================================================================
// FILTER HELPERS
// ===================================================================
function applyFilter(data, year, quarter) {
    return data.filter(d =>
        (year === 'all' || d._Year === year) &&
        (quarter === 'all' || d._Quarter === quarter)
    );
}
const furniture = data => data.filter(d => d.Category === 'Furniture');

// ===================================================================
// CHART FACTORY – destroys and recreates
// ===================================================================
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#5D6D7E';

function makeChart(id, config) {
    if (charts[id]) charts[id].destroy();
    
    // Safety check in case canvas is missing
    const canvas = document.getElementById(id);
    if (!canvas) {
        console.error("Canvas element not found for id:", id);
        return null;
    }
    
    charts[id] = new Chart(canvas.getContext('2d'), config);
    return charts[id];
}

// ===================================================================
// MAIN RENDER
// ===================================================================
function renderDashboard() {
    const year    = document.getElementById('filter-year').value;
    const quarter = document.getElementById('filter-quarter').value;

    const yLbl = year    === 'all' ? 'Semua Tahun'    : year;
    const qLbl = quarter === 'all' ? 'Semua Kuartal'  : quarter;
    const periodFull  = `${yLbl} · ${qLbl}`;
    const periodShort = (year === 'all' && quarter === 'all')
        ? 'secara keseluruhan'
        : `pada periode terpilih (${yLbl}${quarter !== 'all' ? ' - ' + qLbl : ''})`;

    document.getElementById('navbar-period').textContent   = periodFull;
    document.getElementById('exec-period').textContent     = periodFull;
    document.getElementById('reco-period-label').textContent = `Rekomendasi berdasarkan data ${periodShort}.`;

    const filtered = applyFilter(RAW_DATA, year, quarter);
    const furn     = furniture(filtered);
    const offSup   = filtered.filter(d => d.Category === 'Office Supplies');
    const tech     = filtered.filter(d => d.Category === 'Technology');
    const others   = filtered.filter(d => d.Category !== 'Furniture');

    const furnMargin   = margin(furn);
    const othersMargin = margin(others);
    const gap          = furnMargin - othersMargin;

    renderHeroBigNumbers(furn, furnMargin, gap, periodFull);
    renderExecutiveSummary(furn, furnMargin, othersMargin, periodShort);
    renderKPIs(furn, filtered, furnMargin, gap);
    renderCategoryChart(furn, offSup, tech, furnMargin, othersMargin, periodShort);
    renderTrendChart(furn, year, quarter, periodShort);
    renderSubcatChart(furn, periodShort);
    renderDiscountCharts(furn, periodShort);
    renderRegionSection(furn, periodShort);
    renderCTA(furn, filtered, furnMargin, othersMargin, periodShort);
}

// ===================================================================
// 0. HERO BIG NUMBERS & MINI INSIGHT
// ===================================================================
function renderHeroBigNumbers(furn, furnMargin, gap, periodFull) {
    let stateClass, statusText, marginState;
    if (furnMargin < 0) {
        stateClass = 'state-negative';
        statusText = 'Furniture merugi pada periode ini.';
        marginState = '<span style="color:var(--red-500); font-weight:700;">Critical</span>';
    } else if (gap < 0) {
        stateClass = 'state-warning';
        statusText = 'Furniture belum mencapai profitabilitas kategori lain.';
        marginState = '<span style="color:var(--amber-500); font-weight:700;">Warning</span>';
    } else {
        stateClass = 'state-healthy';
        statusText = 'Furniture berada pada performa margin sehat.';
        marginState = '<span style="color:var(--green-500); font-weight:700;">Healthy</span>';
    }

    const gapSign = gap >= 0 ? '+' : '';

    document.getElementById('hero-big-numbers').innerHTML = `
        <div class="hero-big-card ${stateClass}">
            <div class="hero-big-label">Margin Furniture</div>
            <div class="hero-big-number">${pct(furnMargin)}</div>
            <span class="hero-big-status">${statusText}</span>
        </div>
        <div class="hero-big-card ${gap < 0 ? 'state-warning' : 'state-healthy'}">
            <div class="hero-big-label">Gap vs Kategori Lain</div>
            <div class="hero-big-number">${gapSign}${pct(gap)}</div>
            <span class="hero-big-status">${gap < 0 ? 'Di bawah rata-rata kategori lain' : 'Di atas rata-rata kategori lain'}</span>
        </div>
    `;

    // Extract Mini Insight Data
    const subcats = [...new Set(furn.map(d => d['Sub-Category']))];
    const subcatData = subcats.map(sc => ({ name: sc, profit: sumProfit(furn.filter(d => d['Sub-Category'] === sc)), disc: avgDisc(furn.filter(d => d['Sub-Category'] === sc)) }));
    const negSubs = subcatData.filter(d => d.profit < 0).map(d => d.name);
    
    const regions = [...new Set(furn.map(d => d.Region))];
    const regionData = regions.map(r => {
        const rf = furn.filter(d => d.Region === r);
        return { name: r, margin: margin(rf), discount: avgDisc(rf) };
    });
    const worstRegion = [...regionData].sort((a, b) => a.margin - b.margin)[0];
    
    const subcatText = negSubs.length > 0 ? `<span style="color:var(--red-500); font-weight:600;">${negSubs.join(', ')}</span>` : '<span style="color:var(--text-secondary);">Aman (Tidak ada rugi)</span>';
    const regionText = worstRegion ? `<strong style="color:var(--text-primary);">${worstRegion.name}</strong> (${pct(worstRegion.margin)})` : '-';
    
    let highestDiscText = '-';
    if (regionData.length > 0) {
        const highestDiscRegion = [...regionData].sort((a, b) => b.discount - a.discount)[0];
        const highestDiscSubcat = [...subcatData].sort((a, b) => b.disc - a.disc)[0];
        if (highestDiscSubcat && highestDiscSubcat.disc > highestDiscRegion.discount) {
            highestDiscText = `<strong style="color:var(--text-primary);">${highestDiscSubcat.name}</strong> (${pct(highestDiscSubcat.disc)})`;
        } else {
            highestDiscText = `<strong style="color:var(--text-primary);">${highestDiscRegion.name} Region</strong> (${pct(highestDiscRegion.discount)})`;
        }
    }

    document.getElementById('hero-mini-insight').innerHTML = `
        <div class="mini-insight-item">
            <span class="mini-insight-label">Periode Aktif</span>
            <div style="font-weight:600; color:var(--text-primary);">🗓️ ${periodFull}</div>
        </div>
        <div class="mini-insight-item">
            <span class="mini-insight-label">Status Margin</span>
            <div>${marginState}</div>
        </div>
        <div class="mini-insight-item">
            <span class="mini-insight-label">Sub-category Kritis</span>
            <div>${subcatText}</div>
        </div>
        <div class="mini-insight-item">
            <span class="mini-insight-label">Region Prioritas</span>
            <div>${regionText}</div>
        </div>
        <div class="mini-insight-item">
            <span class="mini-insight-label">Diskon Tertinggi</span>
            <div>${highestDiscText}</div>
        </div>
    `;
}

// ===================================================================
// 1. EXECUTIVE SUMMARY
// ===================================================================
function renderExecutiveSummary(furn, furnMargin, othersMargin, periodShort) {
    const subcats    = [...new Set(furn.map(d => d['Sub-Category']))];
    const subcatData = subcats.map(sc => ({
        name: sc, profit: sumProfit(furn.filter(d => d['Sub-Category'] === sc))
    }));
    const negSubs    = subcatData.filter(s => s.profit < 0).map(s => s.name);
    const lowSub     = [...subcatData].sort((a, b) => a.profit - b.profit)[0];

    const regions    = [...new Set(furn.map(d => d.Region))];
    const regionData = regions.map(r => {
        const rf = furn.filter(d => d.Region === r);
        return { name: r, margin: margin(rf), discount: avgDisc(rf) };
    });
    const worstM  = [...regionData].sort((a, b) => a.margin - b.margin)[0];
    const highD   = [...regionData].sort((a, b) => b.discount - a.discount)[0];

    let profitLeakText;
    if (negSubs.length > 0) {
        profitLeakText = `<strong>${negSubs.join(' dan ')}</strong> mencatat profit negatif dan menjadi prioritas audit.`;
    } else {
        profitLeakText = `Tidak ada sub-category yang merugi, namun <strong>${lowSub ? lowSub.name : '-'}</strong> memiliki profit paling tipis dan perlu dipantau.`;
    }

    let regionText;
    if (worstM && highD) {
        if (worstM.name === highD.name) {
            regionText = `<strong>${worstM.name}</strong> menjadi prioritas evaluasi karena memiliki margin terendah (${pct(worstM.margin)}) sekaligus average discount tertinggi (${pct(highD.discount)}).`;
        } else {
            regionText = `<strong>${worstM.name}</strong> menjadi prioritas margin (${pct(worstM.margin)}), sementara <strong>${highD.name}</strong> perlu audit diskon karena average discount tertinggi (${pct(highD.discount)}).`;
        }
    } else {
        regionText = 'Data region tidak tersedia untuk periode ini.';
    }

    const cmpText = furnMargin < othersMargin
        ? `lebih rendah dibanding rata-rata kategori lain (${pct(othersMargin)})`
        : `lebih tinggi dibanding rata-rata kategori lain (${pct(othersMargin)})`;

    document.getElementById('summary-list').innerHTML = [
        `<strong>Status Profitabilitas:</strong> Margin Furniture ${periodShort} berada di <strong>${pct(furnMargin)}</strong>, ${cmpText}.`,
        `<strong>Titik Kebocoran Profit:</strong> ${profitLeakText}`,
        `<strong>Prioritas Regional:</strong> ${regionText}`
    ].map(s => `<li>${s}</li>`).join('');
}

// ===================================================================
// 2. KPI CARDS
// ===================================================================
function renderKPIs(furn, all, furnMargin, gap) {
    const s = sumSales(furn), p = sumProfit(furn), d = avgDisc(furn);
    const kpis = [
        { icon: '💰', label: 'Total Sales',            value: fmt(s, '$'),                     cls: '' },
        { icon: '📈', label: 'Total Profit',           value: fmt(p, '$'),                     cls: p >= 0 ? 'positive' : 'negative' },
        { icon: '📊', label: 'Profit Margin',          value: pct(furnMargin),                 cls: furnMargin >= 0.08 ? 'positive' : furnMargin >= 0 ? 'warning' : 'negative' },
        { icon: '⚖️', label: 'Gap vs Kategori Lain',  value: (gap >= 0 ? '+' : '') + pct(gap), cls: gap >= 0 ? 'positive' : 'negative' },
        { icon: '🏷️', label: 'Avg Discount',          value: pct(d),                          cls: d > 0.15 ? 'warning' : '' },
    ];
    document.getElementById('kpi-grid').innerHTML = kpis.map((k, i) =>
        `<div class="glass-card kpi-card ${k.cls}" style="animation-delay:${i * 0.06}s">
            <div class="kpi-icon">${k.icon}</div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-label">${k.label}</div>
        </div>`
    ).join('');
}

// ===================================================================
// 3. CONTEXT – CATEGORY COMPARISON
// ===================================================================
function renderCategoryChart(furn, offSup, tech, furnMargin, othersMargin, periodShort) {
    const cats    = ['Furniture', 'Office Supplies', 'Technology'];
    const sales   = [sumSales(furn), sumSales(offSup), sumSales(tech)];
    const margins = [margin(furn), margin(offSup), margin(tech)];

    makeChart('chart-category', {
        type: 'bar',
        data: {
            labels: cats,
            datasets: [
                {
                    label: 'Sales ($)', data: sales, yAxisID: 'y', order: 2,
                    backgroundColor: [C.sales.bg, C.context.bg, C.context.bg],
                    borderColor:     [C.sales.line, C.context.line, C.context.line],
                    borderWidth: 2, borderRadius: 8
                },
                {
                    label: 'Margin (%)', data: margins.map(m => m * 100),
                    type: 'line', yAxisID: 'y1', order: 1,
                    borderColor: C.warning.line, fill: false, tension: 0.3, borderWidth: 3,
                    pointBackgroundColor: margins.map(m => marginColorPair(m).line),
                    pointRadius: 8, pointHoverRadius: 11,
                    backgroundColor: 'transparent',
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            scales: {
                y:  { position: 'left',  title: { display: true, text: 'Sales ($)' }, ticks: { callback: v => '$' + fmt(v) } },
                y1: { position: 'right', title: { display: true, text: 'Margin (%)' }, ticks: { callback: v => v.toFixed(1) + '%' }, grid: { drawOnChartArea: false } }
            }
        },
        plugins: [{
            id: 'catAnnotation',
            afterDatasetsDraw(chart) {
                if (!chart.chartArea || !chart.scales) return;
                const { ctx } = chart;
                const mds = chart.data.datasets[1].data;
                if (mds[0] < mds[1] && mds[0] < mds[2]) {
                    const meta = chart.getDatasetMeta(1).data[0];
                    ctx.save();
                    ctx.fillStyle = C.critical.line;
                    ctx.font = "bold 11px 'Poppins'";
                    ctx.textAlign = 'left';
                    ctx.fillText('⚠ Margin Terendah', meta.x + 12, meta.y + 4);
                    ctx.restore();
                }
            }
        }]
    });

    const el = document.getElementById('insight-category');
    if (furnMargin < othersMargin) {
        el.innerHTML = `<div class="insight-callout insight-warning"><span class="icon">💡</span><span><strong>SO WHAT:</strong> ${periodShort.charAt(0).toUpperCase() + periodShort.slice(1)}, margin Furniture (${pct(furnMargin)}) tertinggal dari rata-rata kategori lain (${pct(othersMargin)}). Penciptaan demand tidak cukup tanpa efisiensi cost yang memadai.</span></div>`;
    } else {
        el.innerHTML = `<div class="insight-callout insight-success"><span class="icon">✅</span><span><strong>SO WHAT:</strong> Margin Furniture kompetitif pada periode ini. Pertahankan strategi pricing dan fokus skalakan sub-category yang profitable.</span></div>`;
    }
}

// ===================================================================
// 4. CONFLICT – TREND
// ===================================================================
function renderTrendChart(furn, year, quarter, periodShort) {
    let labels = [], salesData = [], marginData = [];
    const subtitle = document.getElementById('trend-subtitle');

    if (year === 'all') {
        subtitle.textContent = 'Tren tahunan — Sales vs Profit Margin Furniture';
        const years = [...new Set(furn.map(d => d._Year))].sort();
        labels = years;
        years.forEach(y => {
            const sub = furn.filter(d => d._Year === y);
            salesData.push(sumSales(sub));
            marginData.push(margin(sub) * 100);
        });
    } else if (quarter === 'all') {
        subtitle.textContent = `Tren kuartalan — ${year}`;
        const available = [...new Set(furn.map(d => d._Quarter))];
        labels = ['Q1','Q2','Q3','Q4'].filter(q => available.includes(q));
        labels.forEach(q => {
            const sub = furn.filter(d => d._Quarter === q);
            salesData.push(sumSales(sub));
            marginData.push(margin(sub) * 100);
        });
    } else {
        subtitle.textContent = `Tren bulanan — ${year} ${quarter}`;
        const qMonths = { Q1:[1,2,3], Q2:[4,5,6], Q3:[7,8,9], Q4:[10,11,12] };
        const avail = [...new Set(furn.map(d => d._Month))];
        const months = (qMonths[quarter] || []).filter(m => avail.includes(m));
        const mn = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        labels = months.map(m => mn[m]);
        months.forEach(m => {
            const sub = furn.filter(d => d._Month === m);
            salesData.push(sumSales(sub));
            marginData.push(margin(sub) * 100);
        });
    }

    const negPeriods = marginData.filter(m => m < 0);
    const minM = Math.min(...marginData);
    const maxS = Math.max(...salesData);

    // Dynamic conflict title
    const conflictTitleEl = document.getElementById('conflict-title');
    if (negPeriods.length > 0) {
        conflictTitleEl.textContent = `Furniture Mengalami Titik Rugi pada Beberapa Periode`;
    } else if (marginData.every(m => m > 8)) {
        conflictTitleEl.textContent = 'Margin Furniture Tidak Negatif, tetapi Masih Perlu Dijaga';
    } else {
        conflictTitleEl.textContent = 'Sales Furniture Tumbuh, tetapi Margin Belum Mengikuti Secara Proporsional';
    }

    makeChart('chart-trend', {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Sales ($)', data: salesData, yAxisID: 'y', order: 2, backgroundColor: C.sales.bg, borderColor: C.sales.line, borderWidth: 2, borderRadius: 8 },
                {
                    label: 'Margin (%)', data: marginData, type: 'line', yAxisID: 'y1', order: 1,
                    borderColor: C.context.line, fill: false, tension: 0.35, borderWidth: 3,
                    pointBackgroundColor: marginData.map(m => marginColorPair(m / 100).line),
                    pointRadius: 6, pointHoverRadius: 9, backgroundColor: 'transparent',
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            scales: {
                y:  { position: 'left',  title: { display: true, text: 'Sales ($)' }, ticks: { callback: v => '$' + fmt(v) } },
                y1: { position: 'right', title: { display: true, text: 'Margin (%)' }, ticks: { callback: v => v.toFixed(1) + '%' }, grid: { drawOnChartArea: false } }
            }
        },
        plugins: [{
            id: 'trendAnnotation',
            afterDatasetsDraw(chart) {
                if (!chart.chartArea || !chart.scales) return;
                const { ctx } = chart;
                const mds = chart.data.datasets[1].data;
                const sds = chart.data.datasets[0].data;

                mds.forEach((val, i) => {
                    // Only annotate minimum margin point if below 5%
                    if (val === minM && val < 5 && mds.length > 1) {
                        const meta = chart.getDatasetMeta(1).data[i];
                        ctx.save();
                        ctx.fillStyle = val < 0 ? C.critical.line : C.warning.line;
                        ctx.font = "bold 11px 'Poppins'";
                        ctx.textAlign = 'center';
                        ctx.fillText('⚠ Margin Terendah', meta.x, meta.y - 14);
                        ctx.restore();
                    }
                });

                // Annotate highest sales point if it differs from max margin index
                const maxSIdx = sds.indexOf(maxS);
                const minMIdx = mds.indexOf(minM);
                if (maxSIdx !== minMIdx && mds.length > 1) {
                    const meta = chart.getDatasetMeta(0).data[maxSIdx];
                    ctx.save();
                    ctx.fillStyle = C.sales.line;
                    ctx.font = "bold 11px 'Poppins'";
                    ctx.textAlign = 'center';
                    ctx.fillText('↑ Sales Tertinggi', meta.x, meta.y - 10);
                    ctx.restore();
                }
            }
        }]
    });

    const el = document.getElementById('insight-trend');
    if (negPeriods.length > 0) {
        el.innerHTML = `<div class="insight-callout insight-danger"><span class="icon">🔴</span><span><strong>SO WHAT:</strong> Terdapat ${negPeriods.length} titik margin negatif. Meski sales tidak selalu bermasalah, margin yang tertinggal menunjukkan pertumbuhan volume belum efisien. Fokus analisis perlu bergeser ke cost, discount, dan sub-category yang menekan profit.</span></div>`;
    } else {
        el.innerHTML = `<div class="insight-callout insight-info"><span class="icon">💡</span><span><strong>SO WHAT:</strong> Meski sales tidak selalu bermasalah, margin yang tertinggal menunjukkan bahwa pertumbuhan volume belum sepenuhnya efisien. Fokus perlu bergeser ke cost, discount, dan sub-category yang menekan profit.</span></div>`;
    }
}

// ===================================================================
// 5. ROOT CAUSE 1 – SUB-CATEGORY (Horizontal Bar)
// ===================================================================
function renderSubcatChart(furn, periodShort) {
    const subcats = [...new Set(furn.map(d => d['Sub-Category']))];
    const data = subcats
        .map(sc => ({ name: sc, profit: sumProfit(furn.filter(d => d['Sub-Category'] === sc)) }))
        .sort((a, b) => a.profit - b.profit); // Low to high (worst first on left)

    const negSubs = data.filter(d => d.profit < 0);
    const posSubs = data.filter(d => d.profit >= 0);

    // Dynamic title & insight
    const titleEl = document.getElementById('subcat-title');
    const subtitleEl = document.getElementById('subcat-subtitle');
    
    if (negSubs.length > 0) {
        const negNames = negSubs.map(d => d.name).join(' dan ');
        const posNames = posSubs.slice(-2).reverse().map(d => d.name).join(' dan ');
        titleEl.textContent = `${negNames} Menjadi Titik Rugi Utama Furniture`;
        subtitleEl.textContent = `Profit per sub-category menunjukkan bahwa kerugian terbesar berasal dari ${negNames}.`;
        
        const el = document.getElementById('insight-subcat');
        el.innerHTML = `<div class="insight-callout insight-danger"><span class="icon">🔴</span><span><strong>SO WHAT:</strong> Profit positif dari ${posNames} terkikis oleh kerugian ${negNames}. Audit pricing, cost structure, dan kebijakan diskon perlu difokuskan pada sub-category yang merugi.</span></div>`;
    } else {
        titleEl.textContent = `Semua Sub-Category Furniture Profitabel`;
        subtitleEl.textContent = `Tidak ada sub-category yang mencatat kerugian pada periode ini.`;
        
        const el = document.getElementById('insight-subcat');
        el.innerHTML = `<div class="insight-callout insight-success"><span class="icon">✅</span><span><strong>SO WHAT:</strong> Seluruh sub-category memberikan kontribusi positif. Lanjutkan strategi pertumbuhan secara proporsional.</span></div>`;
    }

    const colors  = data.map(d => d.profit < 0 ? C.critical.bg : C.healthy.bg);
    const borders = data.map(d => d.profit < 0 ? C.critical.line : C.healthy.line);

    // Index of highest profit bar (last after sort)
    const highIdx = data.length - 1;

    makeChart('chart-subcat', {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{ label: 'Profit ($)', data: data.map(d => d.profit), backgroundColor: colors, borderColor: borders, borderWidth: 2, borderRadius: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            layout: { padding: { left: 80, right: 120 } },
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => 'Profit: $' + fmt(ctx.raw) } }
            },
            scales: {
                x: { title: { display: true, text: 'Total Profit ($)' }, ticks: { callback: v => '$' + fmt(v) } },
                y: { grid: { display: false } }
            }
        },
        plugins: [{
            id: 'subcatAnnotation',
            afterDraw(chart) {
                if (!chart.chartArea || !chart.scales || !chart.scales.x || !chart.scales.y) return;
                const { ctx, scales: { x, y } } = chart;

                // Break-even line at x = 0
                const zeroX = x.getPixelForValue(0);
                if (zeroX >= chart.chartArea.left && zeroX <= chart.chartArea.right) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(zeroX, y.top);
                    ctx.lineTo(zeroX, y.bottom);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = '#5D6D7E';
                    ctx.setLineDash([5, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    // Pill background for label
                    const label = 'Break-even';
                    ctx.font = "bold 10px 'Poppins'";
                    const metrics = ctx.measureText(label);
                    const padX = 8, padY = 4;
                    const w = metrics.width + padX * 2, h = 18;
                    const topY = Math.max(y.top - h/2 + 2, 12);
                    
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.roundRect(zeroX - w/2, topY - h/2, w, h, 8);
                    ctx.fill();
                    ctx.strokeStyle = '#BDC3C7';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.fillStyle = '#5D6D7E';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, zeroX, topY);
                    ctx.restore();
                }

                // Labels only on negative bars and highest profit bar
                chart.data.datasets[0].data.forEach((val, i) => {
                    const meta = chart.getDatasetMeta(0).data[i];
                    ctx.save();
                    ctx.font = "bold 11.5px 'Poppins'";
                    ctx.textBaseline = 'middle';

                    if (val < 0) {
                        const text = `⚠ Loss $${fmt(val)}`;
                        const textW = ctx.measureText(text).width;
                        if (meta.x - 8 - textW < chart.chartArea.left) {
                            ctx.fillStyle = '#FFF';
                            ctx.textAlign = 'left';
                            ctx.fillText(text, meta.x + 8, meta.y);
                        } else {
                            ctx.fillStyle = C.critical.line;
                            ctx.textAlign = 'right';
                            ctx.fillText(text, meta.x - 8, meta.y);
                        }
                    } else if (i === highIdx) {
                        const text = `Profit tertinggi $${fmt(val)} ⭐`;
                        const textW = ctx.measureText(text).width;
                        if (meta.x + 8 + textW > chart.chartArea.right) {
                            ctx.fillStyle = '#FFF';
                            ctx.textAlign = 'right';
                            ctx.fillText(text, meta.x - 8, meta.y);
                        } else {
                            ctx.fillStyle = '#27AE60'; 
                            ctx.textAlign = 'left';
                            ctx.fillText(text, meta.x + 8, meta.y);
                        }
                    }
                    ctx.restore();
                });
            }
        }]
    });

    // Insight handled dynamically above
}

// ===================================================================
// 6. ROOT CAUSE 2 – DISCOUNT vs PROFIT
// ===================================================================
function renderDiscountCharts(furn, periodShort) {
    const subcats = [...new Set(furn.map(d => d['Sub-Category']))];
    const dData = subcats.map(sc => {
        const sub = furn.filter(d => d['Sub-Category'] === sc);
        return { name: sc, avgDiscount: avgDisc(sub) * 100, profit: sumProfit(sub), margin: margin(sub) * 100, sales: sumSales(sub) };
    }).sort((a, b) => b.avgDiscount - a.avgDiscount);

    // Average discount reference line value
    const avgDiscAll = dData.reduce((s, d) => s + d.avgDiscount, 0) / dData.length;
    const highestDiscIdx = 0; // sorted desc

    // Bar + Line chart
    makeChart('chart-discount', {
        type: 'bar',
        data: {
            labels: dData.map(d => d.name),
            datasets: [
                { label: 'Sales ($)', data: dData.map(d => d.sales), yAxisID: 'y', backgroundColor: C.sales.bg, borderColor: C.sales.line, borderWidth: 2, borderRadius: 6 },
                {
                    label: 'Avg Discount (%)', data: dData.map(d => d.avgDiscount), type: 'line', yAxisID: 'y1',
                    borderColor: C.context.line, fill: false, tension: 0.3, borderWidth: 3,
                    pointBackgroundColor: dData.map(d => d.profit < 0 ? C.critical.line : C.healthy.line),
                    pointRadius: 6, backgroundColor: 'transparent',
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            scales: {
                y:  { beginAtZero: true, position: 'left',  title: { display: true, text: 'Sales ($)' }, ticks: { callback: v => '$' + fmt(v) } },
                y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'Avg Discount (%)' }, ticks: { callback: v => v.toFixed(0) + '%' }, grid: { drawOnChartArea: false } }
            }
        },
        plugins: [{
            id: 'discAnnotation',
            afterDatasetsDraw(chart) {
                if (!chart.chartArea || !chart.scales || !chart.scales.y1) return;
                const { ctx, chartArea, scales: { y1 } } = chart;
                // Average discount reference line
                const refY = y1.getPixelForValue(avgDiscAll);
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(chartArea.left, refY);
                ctx.lineTo(chartArea.right, refY);
                ctx.lineWidth = 1; ctx.setLineDash([4,4]);
                ctx.strokeStyle = C.context.line;
                ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = C.context.line;
                ctx.font = "10px 'Poppins'";
                ctx.textAlign = 'right';
                ctx.fillText(`Avg Disc: ${avgDiscAll.toFixed(1)}%`, chartArea.right - 4, refY - 5);
                ctx.restore();

                // Label highest discount point
                const meta1 = chart.getDatasetMeta(1).data;
                if (meta1.length > 0) {
                    const hp = meta1[highestDiscIdx];
                    ctx.save();
                    ctx.fillStyle = C.warning.line;
                    ctx.font = "bold 10px 'Poppins'";
                    ctx.textAlign = 'center';
                    ctx.fillText('Diskon tertinggi', hp.x, hp.y - 14);
                    ctx.restore();

                    // Label margin negative points
                    dData.forEach((d, i) => {
                        if (d.profit < 0 && meta1[i]) {
                            ctx.save();
                            ctx.fillStyle = C.critical.line;
                            ctx.font = "bold 10px 'Poppins'";
                            ctx.textAlign = 'center';
                            ctx.fillText('Margin negatif', meta1[i].x, meta1[i].y + 18);
                            ctx.restore();
                        }
                    });
                }
            }
        }]
    });

    // Bubble scatter
    makeChart('chart-discount-scatter', {
        type: 'bubble',
        data: {
            datasets: dData.map(d => ({
                label: d.name,
                data: [{ x: d.avgDiscount, y: d.margin, r: Math.max(6, Math.min(26, Math.abs(d.profit) / 500)) }],
                backgroundColor: d.profit < 0 ? C.critical.bg : C.healthy.bg,
                borderColor:     d.profit < 0 ? C.critical.line : C.healthy.line,
                borderWidth: 2,
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => { const d = dData[ctx.datasetIndex]; return `${d.name}: Disc ${d.avgDiscount.toFixed(1)}%, Margin ${d.margin.toFixed(2)}%`; } } }
            },
            scales: {
                x: { title: { display: true, text: 'Avg Discount (%)' }, ticks: { callback: v => v.toFixed(0) + '%' } },
                y: { title: { display: true, text: 'Profit Margin (%)' }, ticks: { callback: v => v.toFixed(1) + '%' } }
            }
        },
        plugins: [{
            id: 'scatterLabels',
            afterDatasetsDraw(chart) {
                if (!chart.chartArea || !chart.scales) return;
                const { ctx } = chart;
                const meta = chart.getDatasetMeta(0).data;
                meta.forEach((el, i) => {
                    const d = dData[i];
                    ctx.save();
                    ctx.fillStyle = d.profit < 0 ? C.critical.line : '#555';
                    ctx.font = d.profit < 0 ? "bold 10px 'Poppins'" : "10px 'Poppins'";
                    ctx.textAlign = 'center';
                    ctx.fillText(d.name, el.x, el.y - el.options.radius - 4);
                    ctx.restore();
                });
            }
        }]
    });

    const titleEl = document.getElementById('discount-title');
    const subtitleEl = document.getElementById('discount-subtitle');

    const highDiscNeg = dData.filter(d => d.avgDiscount > 15 && d.profit < 0);
    const highDiscPos = dData.filter(d => d.avgDiscount > 15 && d.profit >= 0);
    const el = document.getElementById('insight-discount');
    
    if (highDiscNeg.length > 0) {
        const negNames = highDiscNeg.map(d => d.name).join(' dan ');
        titleEl.textContent = `Diskon Tinggi Memperbesar Risiko Margin Negatif`;
        subtitleEl.textContent = `Sub-category dengan average discount tinggi cenderung memiliki margin lebih rendah.`;
        el.innerHTML = `<div class="insight-callout insight-danger"><span class="icon">🔴</span><span><strong>SO WHAT:</strong> ${negNames} memiliki diskon relatif tinggi sekaligus margin negatif. Kebijakan diskon perlu dikontrol agar promosi tidak hanya menaikkan sales, tetapi juga tetap menjaga profit.</span></div>`;
    } else if (highDiscPos.length > 0) {
        titleEl.textContent = `Diskon Tinggi Belum Menekan Margin Secara Signifikan`;
        subtitleEl.textContent = `Beberapa sub-category memiliki diskon tinggi, tetapi masih membukukan profit positif.`;
        el.innerHTML = `<div class="insight-callout insight-warning"><span class="icon">⚠️</span><span><strong>SO WHAT:</strong> Diskon tinggi belum menyebabkan rugi pada periode ini, tetapi tetap perlu dipantau karena dapat menekan margin jika volume meningkat.</span></div>`;
    } else {
        titleEl.textContent = `Tingkat Diskon Proporsional, Margin Terjaga`;
        subtitleEl.textContent = `Tidak ditemukan korelasi antara diskon tinggi dengan kerugian pada periode ini.`;
        el.innerHTML = `<div class="insight-callout insight-info"><span class="icon">💡</span><span><strong>SO WHAT:</strong> Tingkat diskon masih proporsional. Tidak ada indikasi tekanan margin dari kebijakan diskon saat ini.</span></div>`;
    }
}

// ===================================================================
// 7. REGIONAL INSIGHT
// ===================================================================
function renderRegionSection(furn, periodShort) {
    const regions = [...new Set(furn.map(d => d.Region))];
    const rData = regions.map(r => {
        const rf = furn.filter(d => d.Region === r);
        return { name: r, sales: sumSales(rf), profit: sumProfit(rf), margin: margin(rf), discount: avgDisc(rf) };
    }).sort((a, b) => a.margin - b.margin); // Worst to best

    const worstM  = rData[0];
    const bestM   = rData[rData.length - 1];
    const highD   = [...rData].sort((a, b) => b.discount - a.discount)[0];

    makeChart('chart-region', {
        type: 'bar',
        data: {
            labels: rData.map(r => r.name),
            datasets: [{
                label: 'Profit Margin (%)',
                data: rData.map(r => r.margin * 100),
                backgroundColor: rData.map(r => marginColorPair(r.margin).bg),
                borderColor:     rData.map(r => marginColorPair(r.margin).line),
                borderWidth: 2, borderRadius: 8,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => { const r = rData[ctx.dataIndex]; return [`Margin: ${pct(r.margin)}`, `Sales: $${fmt(r.sales)}`, `Disc: ${pct(r.discount)}`]; } } }
            },
            scales: {
                y: { title: { display: true, text: 'Profit Margin (%)' }, ticks: { callback: v => v.toFixed(1) + '%' } },
                x: { grid: { display: false } }
            }
        },
        plugins: [{
            id: 'regionAnnotation',
            afterDatasetsDraw(chart) {
                if (!chart.chartArea || !chart.scales) return;
                const { ctx, data } = chart;
                // Annotate worst margin only
                const worstIdx = 0;
                const meta = chart.getDatasetMeta(0).data[worstIdx];
                if (meta) {
                    ctx.save();
                    ctx.fillStyle = marginColorPair(rData[worstIdx].margin).line;
                    ctx.font = "bold 11px 'Poppins'";
                    ctx.textAlign = 'center';
                    const yPos = rData[worstIdx].margin < 0 ? meta.y + 18 : meta.y - 14;
                    ctx.fillText('⚠ Margin Terendah', meta.x, yPos);
                    ctx.restore();
                }
            }
        }]
    });

    // Table – sorted worst to best
    document.getElementById('region-tbody').innerHTML = rData.map(r => {
        const { status, badge, color, rowClass } = marginStatus(r.margin);
        return `<tr class="${rowClass}">
            <td style="font-weight:600;">${r.name}</td>
            <td>${fmt(r.sales, '$')}</td>
            <td style="color:${color}; font-weight:600;">${fmt(r.profit, '$')}</td>
            <td style="color:${color}; font-weight:600;">${pct(r.margin)}</td>
            <td>${pct(r.discount)}</td>
            <td><span class="badge ${badge}">${status}</span></td>
        </tr>`;
    }).join('');

    // SO WHAT
    const el = document.getElementById('insight-region');
    let txt;
    if (worstM && highD) {
        if (worstM.name === highD.name) {
            txt = `<strong>${worstM.name}</strong> menjadi prioritas evaluasi karena mencatat margin terendah (${pct(worstM.margin)}) sekaligus average discount tertinggi (${pct(highD.discount)}) ${periodShort}.`;
        } else {
            txt = `<strong>${worstM.name}</strong> menjadi prioritas evaluasi karena margin terendah (${pct(worstM.margin)}), sementara <strong>${highD.name}</strong> perlu audit diskon karena average discount tertinggi (${pct(highD.discount)}).`;
        }
    } else {
        txt = 'Analisis regional tidak tersedia untuk filter ini.';
    }
    const cls = worstM && worstM.margin < 0 ? 'insight-danger' : worstM && worstM.margin < 0.03 ? 'insight-warning' : 'insight-info';
    const icon = worstM && worstM.margin < 0 ? '🔴' : '⚠️';
    el.innerHTML = `<div class="insight-callout ${cls}"><span class="icon">${icon}</span><span><strong>SO WHAT:</strong> ${txt}</span></div>`;
}

// ===================================================================
// 8. CALL TO ACTION
// ===================================================================
function renderCTA(furn, allFiltered, furnMargin, othersMargin, periodShort) {
    const subcats = [...new Set(furn.map(d => d['Sub-Category']))];
    const subcatData = subcats.map(sc => ({ name: sc, profit: sumProfit(furn.filter(d => d['Sub-Category'] === sc)) }));
    const negSubs  = subcatData.filter(d => d.profit < 0);

    const regions = [...new Set(furn.map(d => d.Region))];
    const rData = regions.map(r => {
        const rf = furn.filter(d => d.Region === r);
        return { name: r, margin: margin(rf), discount: avgDisc(rf) };
    });
    const worstMR  = [...rData].sort((a, b) => a.margin - b.margin)[0];
    const highDR   = [...rData].sort((a, b) => b.discount - a.discount)[0];
    const bestMR   = [...rData].sort((a, b) => b.margin - a.margin)[0];

    const recs = [];

    // 1. KPI shift
    if (furnMargin < othersMargin) {
        recs.push({
            icon: '🎯',
            title: 'Fokus pada Profitable Growth',
            target: 'Target: Margin ≥ 8% periode berikutnya',
            desc: `Ubah KPI utama dari sales growth menjadi profitable growth. Margin Furniture saat ini baru <strong>${pct(furnMargin)}</strong>, tertinggal ${pct(othersMargin - furnMargin)} dari kategori lain.`
        });
    }

    // 2. Sub-category audit
    if (negSubs.length > 0) {
        recs.push({
            icon: '🔍',
            title: 'Audit Sub-Category Kritis',
            target: `Prioritas: ${negSubs.map(d => d.name).join(', ')}`,
            desc: `Audit pricing, cost structure, dan discount policy pada <strong>${negSubs.map(d => d.name).join(' dan ')}</strong>. Fokuskan pada sub-category dengan profit negatif atau margin terendah.`
        });
    } else {
        recs.push({
            icon: '📈',
            title: 'Skalakan Sub-Category Unggulan',
            target: `Semua sub-category positif ${periodShort}`,
            desc: 'Tidak ada sub-category yang merugi. Alokasikan resource sales ke sub-category dengan margin tertinggi untuk pertumbuhan yang efisien.'
        });
    }

    // 3. Region evaluation
    if (worstMR) {
        recs.push({
            icon: '🗺️',
            title: `Evaluasi Strategi di ${worstMR.name}`,
            target: `Margin ${worstMR.name}: ${pct(worstMR.margin)}`,
            desc: `Evaluasi strategi sales, distribusi, dan logistik di <strong>${worstMR.name}</strong> karena mencatat margin terendah. Standardisasikan praktik dari ${bestMR && bestMR.name !== worstMR.name ? bestMR.name : 'region terbaik'}.`
        });
    }

    // 4. Discount limit
    if (highDR && highDR.discount > 0.12) {
        recs.push({
            icon: '🏷️',
            title: 'Tetapkan Hard Limit Diskon',
            target: `Batas maks: 15–18% (saat ini ${pct(highDR.discount)} di ${highDR.name})`,
            desc: `Tetapkan hard limit diskon untuk <strong>${highDR.name}</strong> yang memiliki average discount tertinggi (${pct(highDR.discount)}). Cegah erosi margin akibat diskon tanpa batas.`
        });
    }

    // 5. Replicate best region (only if there is a healthy region)
    const healthyRegions = rData.filter(r => r.margin >= 0.08);
    if (healthyRegions.length > 0 && worstMR && worstMR.margin < 0.08) {
        recs.push({
            icon: '✨',
            title: `Replikasi Praktik ${healthyRegions[0].name}`,
            target: `${healthyRegions[0].name} margin: ${pct(healthyRegions[0].margin)}`,
            desc: `Replikasi pendekatan dari <strong>${healthyRegions[0].name}</strong> ke region Warning/Critical, terutama terkait kontrol diskon dan fokus produk yang lebih profitable.`
        });
    }

    document.getElementById('rec-grid').innerHTML = recs.map(r => `
        <div class="rec-item">
            <div class="rec-icon">${r.icon}</div>
            <div class="rec-title">${r.title}</div>
            <div class="rec-target">${r.target}</div>
            <div class="rec-desc">${r.desc}</div>
        </div>
    `).join('');
}

// ===================================================================
// DATE PARSING & DATA PROCESSING
// ===================================================================
function parseEU(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    val = String(val).replace(/"/g, '').trim();
    if (val.includes(',') && val.lastIndexOf(',') > val.lastIndexOf('.')) {
        val = val.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(val) || 0;
}

function parseOrderDate(value) {
    if (!value) return null;
    let date;
    if (value.includes('/')) {
        const p = value.split('/');
        if (p.length === 3) {
            // DD/MM/YYYY vs MM/DD/YYYY heuristic
            if (parseInt(p[0]) > 12) {
                date = new Date(p[2], parseInt(p[1]) - 1, parseInt(p[0]));
            } else if (parseInt(p[1]) > 12) {
                date = new Date(p[2], parseInt(p[0]) - 1, parseInt(p[1]));
            } else {
                // Ambiguous – assume DD/MM/YYYY (European format common in this dataset)
                date = new Date(p[2], parseInt(p[1]) - 1, parseInt(p[0]));
            }
        } else {
            date = new Date(value);
        }
    } else {
        date = new Date(value);
    }
    if (isNaN(date.getTime())) {
        console.warn('[parseOrderDate] Invalid date:', value);
        return null;
    }
    return date;
}

function processData(rows) {
    const out = [];
    for (const row of rows) {
        if (!row['Order Date'] || !row['Category']) continue;
        const d = parseOrderDate(row['Order Date']);
        if (!d) continue;
        row._Sales    = parseEU(row['Sales']);
        row._Profit   = parseEU(row['Profit']);
        row._Discount = parseEU(row['Discount']);
        row._Year     = d.getFullYear().toString();
        row._Month    = d.getMonth() + 1;
        row._Quarter  = 'Q' + Math.ceil(row._Month / 3);
        out.push(row);
    }
    return out;
}

// ===================================================================
// INIT
// ===================================================================
function init() {
    fetch('data/sample_superstore.csv')
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(csv => {
            Papa.parse(csv, {
                header: true, skipEmptyLines: true, delimiter: ';',
                complete({ data }) {
                    RAW_DATA = processData(data);

                    // Debug: validate years
                    const years = [...new Set(RAW_DATA.map(d => d._Year))].filter(y => y && !isNaN(y)).sort((a,b) => +a - +b);
                    console.log('[Dashboard] Unique years from CSV (parsed safely):', years);
                    console.log('[Dashboard] Rows with invalid year:', RAW_DATA.filter(d => !d._Year || isNaN(d._Year)).length);
                    const maxYear = Math.max(...years.map(Number));
                    console.log('[Dashboard] Rows with year > maxYear (' + maxYear + '):', RAW_DATA.filter(d => +d._Year > maxYear).length);

                    // Populate year filter from CSV data only
                    const sel = document.getElementById('filter-year');
                    years.forEach(y => {
                        const opt = document.createElement('option');
                        opt.value = y; opt.textContent = y;
                        sel.appendChild(opt);
                    });

                    document.getElementById('filter-year').addEventListener('change', renderDashboard);
                    document.getElementById('filter-quarter').addEventListener('change', renderDashboard);

                    renderDashboard();

                    const overlay = document.getElementById('loading-overlay');
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.style.display = 'none', 500);
                },
                error(err) { throw err; }
            });
        })
        .catch(err => {
            console.error('[Dashboard] Error loading data:', err);
            document.getElementById('loading-overlay').innerHTML = `
                <div style="text-align:center; font-family:Poppins,sans-serif;">
                    <div style="font-size:2.5rem; margin-bottom:12px;">⚠️</div>
                    <div style="color:#E74C3C; font-size:1.1rem; font-weight:600; margin-bottom:8px;">Gagal memuat data</div>
                    <div style="color:#7F8C8D; font-size:0.85rem;">Pastikan file <code>data/sample_superstore.csv</code> tersedia dan server HTTP berjalan.</div>
                    <div style="color:#AAA; font-size:0.75rem; margin-top:12px;">${err.message}</div>
                </div>
            `;
        });
}

document.addEventListener('DOMContentLoaded', init);

// ===================================================================
// PDF EXPORT
// ===================================================================
window.preparePrint = function() {
    const btn = document.querySelector('.print-btn');
    const originalText = btn.textContent;
    btn.textContent = "Menyiapkan PDF...";
    
    // Allow UI to update before blocking main thread
    setTimeout(() => {
        // Convert canvas to images
        const containers = document.querySelectorAll('.chart-container');
        containers.forEach(c => {
            const canvas = c.querySelector('canvas');
            if (canvas) {
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                img.className = 'print-img';
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.display = 'none'; // Will be block in @media print
                c.appendChild(img);
            }
        });
        
        // Wait a tiny bit for DOM to apply images, then print
        setTimeout(() => {
            window.print();
            
            // Cleanup after print dialog closes
            setTimeout(() => {
                document.querySelectorAll('.print-img').forEach(img => img.remove());
                btn.textContent = originalText;
            }, 1000);
        }, 300);
    }, 50);
};
