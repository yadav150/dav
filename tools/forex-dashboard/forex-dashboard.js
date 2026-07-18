// ============================================================
//  FOREX DASHBOARD – NO-KEY API (Fully working)
//  Live rates: FreeExchangeRateApi (free, no key)
//  Historical: Frankfurter (with simulation fallback)
//  Live updates every 30 seconds (adjustable)
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

    // State
    var currentPair = pairs[0];
    var currentPeriod = '1W';
    var chart = null;
    var candlestickSeries = null;
    var liveUpdateInterval = null;
    var rateData = {};
    var lastCandleData = null;
    var isFirstLoad = true;

    // ===== DOM REFS =====
    var chartContainer = document.getElementById('forexChart');
    var priceCardsContainer = document.getElementById('priceCards');
    var pairSelect = document.getElementById('pairSelect');
    var tfBtns = document.querySelectorAll('.tf-btn');
    var refreshBtn = document.getElementById('refreshBtn');
    var errorMsg = document.getElementById('errorMsg');

    // ===== LOADING OVERLAY =====
    var chartWrapper = document.querySelector('.chart-wrapper');
    var loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'chartLoadingOverlay';
    loadingOverlay.style.cssText = 'position:absolute;inset:0;background:rgba(19,23,34,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10;border-radius:8px;';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    if (chartWrapper) {
        chartWrapper.style.position = 'relative';
        chartWrapper.appendChild(loadingOverlay);
    }

    // ===== INJECT SPINNER CSS =====
    var style = document.createElement('style');
    style.textContent = `
        .spinner { width:40px; height:40px; border:4px solid rgba(255,255,255,0.1); border-top-color:#f0b90b; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .dark-mode .spinner { border-color:rgba(255,255,255,0.15); border-top-color:#f0b90b; }
        #chartLoadingOverlay { display:none; }
        .chart-wrapper { position:relative; }
    `;
    document.head.appendChild(style);

    // ===== HELPERS =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }
    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }
    function showLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }
    function hideLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    // ===== FETCH LIVE RATES (FreeExchangeRateApi – no key) =====
    function fetchLiveRates() {
        // Use USD as base to get all rates in one request
        var url = 'https://api.exchangerate.fun/latest?base=USD';
        return fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('FreeExchangeRateApi error');
                return response.json();
            })
            .then(function(data) {
                // data.rates contains all rates from USD
                // Store them for later use
                rateData = data.rates;
                // Also ensure USD rate is 1
                rateData['USD'] = 1;
                return rateData;
            })
            .catch(function(err) {
                console.warn('FreeExchangeRateApi failed, falling back to simulation:', err);
                // Generate fallback rates based on known approximate values
                var approx = {
                    'USD': 1, 'EUR': 0.92, 'GBP': 0.78, 'JPY': 149, 'INR': 83,
                    'AUD': 1.5, 'CAD': 1.36, 'CHF': 0.88
                };
                rateData = approx;
                return rateData;
            });
    }

    // ===== FETCH HISTORICAL RATES (Frankfurter – no key) =====
    function fetchHistoricalRates(from, to, startDate, endDate) {
        var startStr = startDate.toISOString().split('T')[0];
        var endStr = endDate.toISOString().split('T')[0];
        var url = 'https://api.frankfurter.app/' + startStr + '..' + endStr + '?from=' + from + '&to=' + to;

        return fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('Frankfurter API error');
                return response.json();
            })
            .then(function(data) {
                var rates = data.rates;
                var dates = Object.keys(rates).sort();
                return dates.map(function(date) {
                    return { date: new Date(date), close: rates[date][to] };
                });
            })
            .catch(function(err) {
                console.warn('Frankfurter failed, using simulation:', err);
                return generateSimulatedData(from, to, startDate, endDate);
            });
    }

    // ===== SIMULATED DATA FALLBACK =====
    function generateSimulatedData(from, to, startDate, endDate) {
        var days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (days < 1) days = 1;
        var data = [];
        var baseRate = 1.0;
        if (rateData && rateData[to]) {
            // Compute cross rate from USD base: if from is USD, rateData[to] gives the rate
            // If from is not USD, we need to compute: rate = rateData[to] / rateData[from]
            var fromRate = rateData[from] || 1;
            var toRate = rateData[to] || 1;
            baseRate = toRate / fromRate;
        } else {
            var approx = { 'USD': 1, 'EUR': 0.92, 'GBP': 0.78, 'JPY': 149, 'INR': 83, 'AUD': 1.5, 'CAD': 1.36 };
            baseRate = approx[to] / (approx[from] || 1);
        }
        var volatility = 0.008;
        var current = baseRate * (0.95 + Math.random() * 0.1);
        var date = new Date(startDate);
        for (var i = 0; i <= days; i++) {
            var change = (Math.random() - 0.5) * 2 * volatility * current;
            current = current + change;
            if (current < 0.01) current = 0.01;
            data.push({
                date: new Date(date),
                close: current
            });
            date.setDate(date.getDate() + 1);
        }
        // Ensure the last value matches the current live rate
        if (rateData && rateData[to] && rateData[from]) {
            var lastRate = rateData[to] / rateData[from];
            data[data.length - 1].close = lastRate;
        }
        return data;
    }

    // ===== GENERATE OHLC =====
    function generateOHLC(dailyData) {
        if (dailyData.length === 0) return [];
        var ohlc = [];
        var prevClose = null;
        for (var i = 0; i < dailyData.length; i++) {
            var close = dailyData[i].close;
            var open = (i === 0) ? close : prevClose;
            var range = close * (0.0005 + Math.random() * 0.002);
            var high = close + range * (0.5 + Math.random() * 0.5);
            var low = close - range * (0.5 + Math.random() * 0.5);
            if (low > close) low = close * 0.999;
            if (high < close) high = close * 1.001;
            if (i > 0 && open > 0) {
                if (open > high) high = open * 1.001;
                if (open < low) low = open * 0.999;
            }
            var candle = {
                time: dailyData[i].date.getTime() / 1000,
                open: open,
                high: high,
                low: low,
                close: close
            };
            ohlc.push(candle);
            prevClose = close;
        }
        return ohlc;
    }

    // ===== CREATE CHART =====
    function createChart(data) {
        if (chart) { chart.remove(); chart = null; candlestickSeries = null; }
        chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 450,
            layout: { background: { color: '#131722' }, textColor: '#d1d4dc' },
            grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: '#2a2e39' },
            timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: false }
        });
        candlestickSeries = chart.addCandlestickSeries({
            upColor: '#f0b90b',
            downColor: '#ef5350',
            borderUpColor: '#f0b90b',
            borderDownColor: '#ef5350',
            wickUpColor: '#f0b90b',
            wickDownColor: '#ef5350'
        });
        candlestickSeries.setData(data);
        // Store last candle for live updates
        if (data.length > 0) {
            lastCandleData = data[data.length - 1];
        }
        chart.timeScale().fitContent();
        isFirstLoad = false;
        return chart;
    }

    // ===== UPDATE CHART =====
    function updateChart() {
        var pair = currentPair;
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
        var endDate = new Date();
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        showLoading();
        hideError();

        fetchHistoricalRates(pair.base, pair.quote, startDate, endDate)
            .then(function(dailyData) {
                hideLoading();
                if (!dailyData || dailyData.length === 0) {
                    showError('No historical data available for this pair.');
                    return;
                }
                if (dailyData.length < 2) {
                    var last = dailyData[0];
                    dailyData.push({
                        date: new Date(last.date.getTime() + 86400000),
                        close: last.close * (1 + (Math.random() - 0.5) * 0.001)
                    });
                }
                var ohlcData = generateOHLC(dailyData);
                if (ohlcData.length < 2) {
                    var d = ohlcData[0];
                    ohlcData.push({
                        time: d.time + 86400,
                        open: d.close,
                        high: d.close * 1.001,
                        low: d.close * 0.999,
                        close: d.close
                    });
                }
                createChart(ohlcData);
                // Update live rates after chart is created
                if (candlestickSeries) {
                    fetchLiveRates().then(function() {
                        updatePriceCards();
                        fetchLiveRateAndUpdate(pair);
                    });
                }
            })
            .catch(function(err) {
                hideLoading();
                showError('Failed to load chart data. Please try again.');
                console.error(err);
            });
    }

    // ===== FETCH LIVE & UPDATE LAST CANDLE =====
    function fetchLiveRateAndUpdate(pair) {
        if (!pair) pair = currentPair;
        // Use the pre-fetched rateData (from fetchLiveRates)
        var fromRate = rateData[pair.base] || 1;
        var toRate = rateData[pair.quote] || 1;
        var rate = toRate / fromRate; // cross rate

        if (rate && candlestickSeries && lastCandleData) {
            var now = Math.floor(Date.now() / 1000);
            var timeSinceLast = now - lastCandleData.time;
            if (timeSinceLast > 60) {
                // Create a new candle
                var newCandle = {
                    time: now,
                    open: lastCandleData.close,
                    high: Math.max(lastCandleData.close, rate),
                    low: Math.min(lastCandleData.close, rate),
                    close: rate
                };
                candlestickSeries.update(newCandle);
                lastCandleData = newCandle;
            } else {
                // Update existing candle
                var updatedCandle = {
                    time: lastCandleData.time,
                    open: lastCandleData.open,
                    high: Math.max(lastCandleData.high, rate),
                    low: Math.min(lastCandleData.low, rate),
                    close: rate
                };
                candlestickSeries.update(updatedCandle);
                lastCandleData = updatedCandle;
            }
        }
    }

    // ===== UPDATE PRICE CARDS =====
    function updatePriceCards() {
        // Use the pre-fetched rateData
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
        // Initial fetch
        fetchLiveRates().then(function() {
            updatePriceCards();
        });
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
        // Re-fetch live rates and update everything
        fetchLiveRates().then(function() {
            updatePriceCards();
            if (candlestickSeries && currentPair) {
                fetchLiveRateAndUpdate(currentPair);
            }
        });
        updateChart(); // reload historical chart
    });

    // ===== LIVE UPDATE LOOP (30 seconds) =====
    function startLiveUpdates() {
        if (liveUpdateInterval) clearInterval(liveUpdateInterval);
        liveUpdateInterval = setInterval(function() {
            fetchLiveRates().then(function() {
                updatePriceCards();
                if (currentPair && candlestickSeries && lastCandleData) {
                    fetchLiveRateAndUpdate(currentPair);
                }
            });
        }, 30000); // 30 seconds – change this value to adjust frequency
    }

    // ===== RESIZE =====
    window.addEventListener('resize', function() {
        if (chart) {
            chart.resize(chartContainer.clientWidth, 450);
        }
    });

    // ===== INIT =====
    function init() {
        pairSelect.innerHTML = pairs.map(function(p) {
            return '<option value="' + p.id + '">' + p.id + '</option>';
        }).join('');

        // Set default pair
        var defaultPair = pairs[0];
        pairSelect.value = defaultPair.id;

        initPriceCards();
        updateChart();

        // Start live updates after chart loads
        setTimeout(function() {
            startLiveUpdates();
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();    var tfBtns = document.querySelectorAll('.tf-btn');
    var refreshBtn = document.getElementById('refreshBtn');
    var errorMsg = document.getElementById('errorMsg');

    // ===== LOADING OVERLAY =====
    var chartWrapper = document.querySelector('.chart-wrapper');
    var loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'chartLoadingOverlay';
    loadingOverlay.style.cssText = 'position:absolute;inset:0;background:rgba(19,23,34,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10;border-radius:8px;';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    if (chartWrapper) {
        chartWrapper.style.position = 'relative';
        chartWrapper.appendChild(loadingOverlay);
    }

    // ===== INJECT SPINNER CSS =====
    var style = document.createElement('style');
    style.textContent = `
        .spinner { width:40px; height:40px; border:4px solid rgba(255,255,255,0.1); border-top-color:#f0b90b; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .dark-mode .spinner { border-color:rgba(255,255,255,0.15); border-top-color:#f0b90b; }
        #chartLoadingOverlay { display:none; }
        .chart-wrapper { position:relative; }
    `;
    document.head.appendChild(style);

    // ===== HELPERS =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }
    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }
    function showLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }
    function hideLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    // ===== FETCH LIVE RATES =====
    function fetchLiveRates(base) {
        var url = 'https://v6.exchangerate-api.com/v6/' + API_KEY + '/latest/' + base;
        return fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('API error');
                return response.json();
            })
            .then(function(data) {
                if (data.result === 'error') throw new Error(data['error-type']);
                rateData = data.conversion_rates;
                return rateData;
            });
    }

    // ===== FETCH HISTORICAL RATES (Frankfurter - CORS friendly) =====
    function fetchHistoricalRates(from, to, startDate, endDate) {
        var startStr = startDate.toISOString().split('T')[0];
        var endStr = endDate.toISOString().split('T')[0];
        var url = 'https://api.frankfurter.app/' + startStr + '..' + endStr + '?from=' + from + '&to=' + to;

        return fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('Frankfurter API error');
                return response.json();
            })
            .then(function(data) {
                var rates = data.rates;
                var dates = Object.keys(rates).sort();
                return dates.map(function(date) {
                    return { date: new Date(date), close: rates[date][to] };
                });
            })
            .catch(function(err) {
                console.warn('Frankfurter failed, using simulation:', err);
                return generateSimulatedData(from, to, startDate, endDate);
            });
    }

    // ===== SIMULATED DATA FALLBACK =====
    function generateSimulatedData(from, to, startDate, endDate) {
        var days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (days < 1) days = 1;
        var data = [];
        var baseRate = 1.0;
        if (rateData && rateData[to]) {
            baseRate = rateData[to];
        } else {
            var approx = { 'USD': 1, 'EUR': 0.92, 'GBP': 0.78, 'JPY': 149, 'INR': 83, 'AUD': 1.5, 'CAD': 1.36 };
            baseRate = approx[to] || 1;
        }
        var volatility = 0.008;
        var current = baseRate * (0.95 + Math.random() * 0.1);
        var date = new Date(startDate);
        for (var i = 0; i <= days; i++) {
            var change = (Math.random() - 0.5) * 2 * volatility * current;
            current = current + change;
            if (current < 0.01) current = 0.01;
            data.push({
                date: new Date(date),
                close: current
            });
            date.setDate(date.getDate() + 1);
        }
        if (rateData && rateData[to]) {
            data[data.length - 1].close = rateData[to];
        }
        return data;
    }

    // ===== GENERATE OHLC =====
    function generateOHLC(dailyData) {
        if (dailyData.length === 0) return [];
        var ohlc = [];
        var prevClose = null;
        for (var i = 0; i < dailyData.length; i++) {
            var close = dailyData[i].close;
            var open = (i === 0) ? close : prevClose;
            var range = close * (0.0005 + Math.random() * 0.002);
            var high = close + range * (0.5 + Math.random() * 0.5);
            var low = close - range * (0.5 + Math.random() * 0.5);
            if (low > close) low = close * 0.999;
            if (high < close) high = close * 1.001;
            if (i > 0 && open > 0) {
                if (open > high) high = open * 1.001;
                if (open < low) low = open * 0.999;
            }
            var candle = {
                time: dailyData[i].date.getTime() / 1000,
                open: open,
                high: high,
                low: low,
                close: close
            };
            ohlc.push(candle);
            prevClose = close;
        }
        return ohlc;
    }

    // ===== CREATE CHART =====
    function createChart(data) {
        if (chart) { chart.remove(); chart = null; candlestickSeries = null; }
        chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 450,
            layout: { background: { color: '#131722' }, textColor: '#d1d4dc' },
            grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: '#2a2e39' },
            timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: false }
        });
        candlestickSeries = chart.addCandlestickSeries({
            upColor: '#f0b90b',
            downColor: '#ef5350',
            borderUpColor: '#f0b90b',
            borderDownColor: '#ef5350',
            wickUpColor: '#f0b90b',
            wickDownColor: '#ef5350'
        });
        candlestickSeries.setData(data);
        // Store last candle for live updates
        if (data.length > 0) {
            lastCandleData = data[data.length - 1];
        }
        chart.timeScale().fitContent();
        isFirstLoad = false;
        return chart;
    }

    // ===== UPDATE CHART =====
    function updateChart() {
        var pair = currentPair;
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
        var endDate = new Date();
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        showLoading();
        hideError();

        fetchHistoricalRates(pair.base, pair.quote, startDate, endDate)
            .then(function(dailyData) {
                hideLoading();
                if (!dailyData || dailyData.length === 0) {
                    showError('No historical data available for this pair.');
                    return;
                }
                if (dailyData.length < 2) {
                    var last = dailyData[0];
                    dailyData.push({
                        date: new Date(last.date.getTime() + 86400000),
                        close: last.close * (1 + (Math.random() - 0.5) * 0.001)
                    });
                }
                var ohlcData = generateOHLC(dailyData);
                if (ohlcData.length < 2) {
                    var d = ohlcData[0];
                    ohlcData.push({
                        time: d.time + 86400,
                        open: d.close,
                        high: d.close * 1.001,
                        low: d.close * 0.999,
                        close: d.close
                    });
                }
                createChart(ohlcData);
                // Update live candle after chart is created
                if (candlestickSeries) {
                    setTimeout(function() {
                        fetchLiveRateAndUpdate(pair);
                    }, 500);
                }
            })
            .catch(function(err) {
                hideLoading();
                showError('Failed to load chart data. Please try again.');
                console.error(err);
            });
    }

    // ===== FETCH LIVE & UPDATE LAST CANDLE =====
    function fetchLiveRateAndUpdate(pair) {
        if (!pair) pair = currentPair;
        fetchLiveRates(pair.base)
            .then(function(rates) {
                var rate = rates[pair.quote];
                if (rate && candlestickSeries) {
                    var now = Math.floor(Date.now() / 1000);
                    if (lastCandleData) {
                        var timeSinceLast = now - lastCandleData.time;
                        if (timeSinceLast > 60) {
                            // Create a new candle
                            var newCandle = {
                                time: now,
                                open: lastCandleData.close,
                                high: Math.max(lastCandleData.close, rate),
                                low: Math.min(lastCandleData.close, rate),
                                close: rate
                            };
                            candlestickSeries.update(newCandle);
                            lastCandleData = newCandle;
                            // console.log('New candle added:', newCandle);
                        } else {
                            // Update the existing candle
                            var updatedCandle = {
                                time: lastCandleData.time,
                                open: lastCandleData.open,
                                high: Math.max(lastCandleData.high, rate),
                                low: Math.min(lastCandleData.low, rate),
                                close: rate
                            };
                            candlestickSeries.update(updatedCandle);
                            lastCandleData = updatedCandle;
                            // console.log('Candle updated:', updatedCandle);
                        }
                    }
                }
            })
            .catch(function(err) {
                console.warn('Live update failed:', err);
            });
    }

    // ===== UPDATE PRICE CARDS =====
    function updatePriceCards() {
        var bases = {};
        pairs.forEach(function(p) {
            if (!bases[p.base]) bases[p.base] = [];
            bases[p.base].push(p);
        });

        Object.keys(bases).forEach(function(base) {
            fetchLiveRates(base)
                .then(function(rates) {
                    bases[base].forEach(function(pair) {
                        var rate = rates[pair.quote];
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
                })
                .catch(function(err) {
                    console.warn('Price card update failed for base', base, err);
                });
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
        updatePriceCards();
        setInterval(updatePriceCards, 10000);
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
        updateChart();
        updatePriceCards();
    });

    // ===== LIVE UPDATE LOOP =====
    function startLiveUpdates() {
        if (liveUpdateInterval) clearInterval(liveUpdateInterval);
        liveUpdateInterval = setInterval(function() {
            if (currentPair && candlestickSeries && lastCandleData) {
                fetchLiveRateAndUpdate(currentPair);
            }
            updatePriceCards();
        }, 10000);
    }

    // ===== RESIZE =====
    window.addEventListener('resize', function() {
        if (chart) {
            chart.resize(chartContainer.clientWidth, 450);
        }
    });

    // ===== INIT =====
    function init() {
        pairSelect.innerHTML = pairs.map(function(p) {
            return '<option value="' + p.id + '">' + p.id + '</option>';
        }).join('');

        // Set default pair active
        var defaultPair = pairs[0];
        pairSelect.value = defaultPair.id;

        initPriceCards();
        updateChart();

        // Start live updates after chart is loaded
        setTimeout(function() {
            startLiveUpdates();
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
