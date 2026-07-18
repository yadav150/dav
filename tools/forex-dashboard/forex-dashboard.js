// ============================================================
//  FOREX DASHBOARD – USING CHART.JS (No external dependency issues)
//  Live rates: FreeExchangeRateApi (free, no key)
//  Chart: Chart.js (line chart, updates live)
//  Timeframes: 1D, 1W, 1M, 3M, 1Y (simulated historical)
// ============================================================

(function() {
    'use strict';

    // ===== PAIRS =====
    var pairs = [
        { id: 'EUR/USD', base: 'EUR', quote: 'USD' },
        { id: 'GBP/USD', base: 'GBP', quote: 'USD' },
        { id: 'USD/JPY', base: 'USD', quote: 'JPY' },
        { id: 'USD/INR', base: 'USD', quote: 'INR' },
        { id: 'AUD/USD', base: 'AUD', quote: 'USD' },
        { id: 'USD/CAD', base: 'USD', quote: 'CAD' }
    ];

    var currentPair = pairs[0];
    var currentPeriod = '1W';
    var chartInstance = null;
    var rateData = {};
    var liveUpdateInterval = null;

    // ===== DOM REFS =====
    var chartCanvas = document.getElementById('forexChart');
    var priceCardsContainer = document.getElementById('priceCards');
    var pairSelect = document.getElementById('pairSelect');
    var tfBtns = document.querySelectorAll('.tf-btn');
    var refreshBtn = document.getElementById('refreshBtn');
    var errorMsg = document.getElementById('errorMsg');

    // ===== HELPERS =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }
    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    // ===== FETCH LIVE RATES (FreeExchangeRateApi – no key) =====
    function fetchLiveRates() {
        var url = 'https://api.exchangerate.fun/latest?base=USD';
        return fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('API error');
                return response.json();
            })
            .then(function(data) {
                rateData = data.rates;
                rateData['USD'] = 1;
                return rateData;
            })
            .catch(function(err) {
                console.warn('API failed, using fallback rates:', err);
                // Fallback approximate rates (so page still works)
                rateData = {
                    'USD': 1, 'EUR': 0.92, 'GBP': 0.78, 'JPY': 149, 'INR': 83,
                    'AUD': 1.5, 'CAD': 1.36, 'CHF': 0.88
                };
                return rateData;
            });
    }

    // ===== GENERATE HISTORICAL DATA (Simulation based on current rate) =====
    function generateHistoricalData(pair, days) {
        var from = pair.base;
        var to = pair.quote;
        var baseRate = 1.0;
        if (rateData && rateData[to] && rateData[from]) {
            baseRate = rateData[to] / rateData[from];
        } else {
            var approx = { 'USD': 1, 'EUR': 0.92, 'GBP': 0.78, 'JPY': 149, 'INR': 83, 'AUD': 1.5, 'CAD': 1.36 };
            baseRate = approx[to] / (approx[from] || 1);
        }

        var data = [];
        var current = baseRate * (0.95 + Math.random() * 0.1);
        var volatility = 0.008;
        var endDate = new Date();
        var date = new Date();
        date.setDate(date.getDate() - days);

        for (var i = 0; i <= days; i++) {
            var change = (Math.random() - 0.5) * 2 * volatility * current;
            current = current + change;
            if (current < 0.01) current = 0.01;
            data.push({
                x: new Date(date),
                y: current
            });
            date.setDate(date.getDate() + 1);
        }
        // Ensure last point matches current rate
        if (data.length > 0) {
            data[data.length - 1].y = baseRate;
        }
        return data;
    }

    // ===== UPDATE CHART =====
    function updateChart() {
        if (!chartCanvas) return;
        var days;
        switch (currentPeriod) {
            case '1D': days = 1; break;
            case '1W': days = 7; break;
            case '1M': days = 30; break;
            case '3M': days = 90; break;
            case '1Y': days = 365; break;
            default: days = 7;
        }
        if (days < 2) days = 2;

        var data = generateHistoricalData(currentPair, days);

        if (chartInstance) {
            chartInstance.destroy();
        }

        var ctx = chartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: currentPair.id,
                    data: data,
                    borderColor: '#1a5c3a',
                    backgroundColor: 'rgba(26, 92, 58, 0.15)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toFixed(4);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'day', displayFormats: { day: 'MMM D' } },
                        grid: { display: false }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.06)' }
                    }
                }
            }
        });

        // Update last candle live (simulate by adding a point every update)
        // We'll use the existing update mechanism.
    }

    // ===== UPDATE PRICE CARDS =====
    function updatePriceCards() {
        // Use rateData to compute each pair's rate
        pairs.forEach(function(pair) {
            var fromRate = rateData[pair.base] || 1;
            var toRate = rateData[pair.quote] || 1;
            var rate = toRate / fromRate;
            if (!rate) return;
            var card = document.querySelector('.price-card[data-pair="' + pair.id + '"]');
            if (card) {
                var rateSpan = card.querySelector('.pair-rate');
                var changeSpan = card.querySelector('.pair-change');
                if (rateSpan) rateSpan.textContent = rate.toFixed(4);
                var prev = card.dataset.prevRate ? parseFloat(card.dataset.prevRate) : rate;
                var change = ((rate - prev) / prev) * 100;
                card.dataset.prevRate = rate;
                if (changeSpan) {
                    changeSpan.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
                    changeSpan.className = 'pair-change ' + (change >= 0 ? 'positive' : 'negative');
                }
            }
        });
    }

    // ===== INIT PRICE CARDS =====
    function initPriceCards() {
        var html = '';
        pairs.forEach(function(pair) {
            html += '<div class="price-card" data-pair="' + pair.id + '">';
            html += '  <div class="pair-name">' + pair.id + '</div>';
            html += '  <div class="pair-rate">--</div>';
            html += '  <div class="pair-change">--</div>';
            html += '</div>';
        });
        priceCardsContainer.innerHTML = html;
        fetchLiveRates().then(function() {
            updatePriceCards();
        });
    }

    // ===== LIVE UPDATE LOOP =====
    function startLiveUpdates() {
        if (liveUpdateInterval) clearInterval(liveUpdateInterval);
        liveUpdateInterval = setInterval(function() {
            fetchLiveRates().then(function() {
                updatePriceCards();
                // Update chart with new data point (simulate)
                if (chartInstance) {
                    // Add a new point to the chart (simulate live update)
                    var pair = currentPair;
                    var fromRate = rateData[pair.base] || 1;
                    var toRate = rateData[pair.quote] || 1;
                    var rate = toRate / fromRate;
                    var now = new Date();
                    var dataset = chartInstance.data.datasets[0];
                    // Check if last point is within last minute, update it
                    var lastPoint = dataset.data[dataset.data.length - 1];
                    if (lastPoint && (now - lastPoint.x) < 60000) {
                        // Update last point
                        lastPoint.y = rate;
                    } else {
                        // Add new point
                        dataset.data.push({ x: now, y: rate });
                        // Keep data points limited (optional)
                    }
                    chartInstance.update('none');
                }
            });
        }, 30000); // 30 seconds
    }

    // ===== PAIR SELECTION =====
    pairSelect.addEventListener('change', function() {
        var pairId = this.value;
        currentPair = pairs.find(function(p) { return p.id === pairId; }) || pairs[0];
        updateChart();
    });

    // ===== TIMEFRAME SELECTION =====
    tfBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (this.classList.contains('refresh-btn')) return;
            tfBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentPeriod = this.dataset.period;
            updateChart();
        });
    });

    // ===== REFRESH BUTTON =====
    refreshBtn.addEventListener('click', function() {
        fetchLiveRates().then(function() {
            updatePriceCards();
            updateChart();
        });
    });

    // ===== RESIZE =====
    window.addEventListener('resize', function() {
        if (chartInstance) {
            chartInstance.resize();
        }
    });

    // ===== INIT =====
    function init() {
        // Populate dropdown
        pairSelect.innerHTML = pairs.map(function(p) {
            return '<option value="' + p.id + '">' + p.id + '</option>';
        }).join('');
        var defaultPair = pairs[0];
        pairSelect.value = defaultPair.id;

        initPriceCards();
        // Wait for rates to load before chart
        fetchLiveRates().then(function() {
            updateChart();
            startLiveUpdates();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
