// ============================================================
//  FOREX DASHBOARD – LIVE CANDLESTICK CHART (FIXED)
//  Uses ExchangeRate-API with your key.
//  Features: Loading spinner, blur overlay, refresh button.
//  Bullish: Yellow, Bearish: Red.
// ============================================================

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    // IMPORTANT: Replace with your actual ExchangeRate-API key
    var API_KEY = 'd4b61ba7b463552f7c64d91b';

    // Supported pairs
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

    // ===== DOM REFS =====
    var chartContainer = document.getElementById('forexChart');
    var priceCardsContainer = document.getElementById('priceCards');
    var pairBtns = document.querySelectorAll('.pair-btn');
    var tfBtns = document.querySelectorAll('.tf-btn');
    var refreshBtn = document.getElementById('refreshBtn');
    var errorMsg = document.getElementById('errorMsg');

    // ===== LOADING OVERLAY =====
    var loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'chartLoadingOverlay';
    loadingOverlay.style.cssText = 'position:absolute;inset:0;background:rgba(19,23,34,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10;border-radius:8px;';
    loadingOverlay.innerHTML = '<div class="spinner"></div>';
    // Append to chart wrapper
    var chartWrapper = document.querySelector('.chart-wrapper');
    if (chartWrapper) {
        chartWrapper.style.position = 'relative';
        chartWrapper.appendChild(loadingOverlay);
    }

    // ===== CSS SPINNER (injected) =====
    var style = document.createElement('style');
    style.textContent = `
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255,255,255,0.1);
            border-top-color: #f0b90b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .dark-mode .spinner {
            border-color: rgba(255,255,255,0.15);
            border-top-color: #f0b90b;
        }
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
                return data.conversion_rates;
            });
    }

    // ===== FETCH HISTORICAL DAILY RATES (ExchangeRate-API) =====
    function fetchHistoricalRates(from, to, startDate, endDate) {
        var startStr = startDate.toISOString().split('T')[0];
        var endStr = endDate.toISOString().split('T')[0];
        // Use ExchangeRate-API historical endpoint with CORS proxy
        var corsProxy = 'https://corsproxy.io/?';
        var url = 'https://v6.exchangerate-api.com/v6/' + API_KEY + '/history/' + from + '/' + startStr + '/' + endStr;
        var fullUrl = corsProxy + encodeURIComponent(url);

        return fetch(fullUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('Historical API request failed');
                return response.json();
            })
            .then(function(data) {
                if (data.result === 'error') throw new Error(data['error-type']);
                var rates = data.conversion_rates;
                var dates = Object.keys(rates).sort();
                return dates.map(function(date) {
                    return { date: new Date(date), close: rates[date][to] };
                });
            });
    }

    // ===== GENERATE OHLC FROM DAILY CLOSE =====
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
            ohlc.push({
                time: dailyData[i].date.getTime() / 1000,
                open: open,
                high: high,
                low: low,
                close: close
            });
            prevClose = close;
        }
        return ohlc;
    }

    // ===== CREATE CHART =====
    function createChart(data) {
        if (chart) {
            chart.remove();
            chart = null;
            candlestickSeries = null;
        }

        chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 450,
            layout: {
                background: { color: '#131722' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#2a2e39' },
                horzLines: { color: '#2a2e39' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#2a2e39',
            },
            timeScale: {
                borderColor: '#2a2e39',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        candlestickSeries = chart.addCandlestickSeries({
            upColor: '#f0b90b',
            downColor: '#ef5350',
            borderUpColor: '#f0b90b',
            borderDownColor: '#ef5350',
            wickUpColor: '#f0b90b',
            wickDownColor: '#ef5350',
        });

        candlestickSeries.setData(data);
        chart.timeScale().fitContent();
        return chart;
    }

    // ===== UPDATE CHART =====
    function updateChart() {
        var pair = currentPair;
        var period = currentPeriod;
        var days = 0;
        switch (period) {
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
                var ohlcData = generateOHLC(dailyData);
                if (ohlcData.length < 2) {
                    // Duplicate to have at least 2 bars
                    ohlcData.push({
                        time: ohlcData[0].time + 86400,
                        open: ohlcData[0].close,
                        high: ohlcData[0].close * 1.001,
                        low: ohlcData[0].close * 0.999,
                        close: ohlcData[0].close
                    });
                }
                createChart(ohlcData);
                // Update live candle
                fetchLiveRateAndUpdate(pair);
            })
            .catch(function(err) {
                hideLoading();
                showError('Failed to load chart data. Please try again.');
                console.error(err);
            });
    }

    // ===== FETCH LIVE RATE & UPDATE LAST CANDLE =====
    function fetchLiveRateAndUpdate(pair) {
        var base = pair.base;
        var quote = pair.quote;
        fetchLiveRates(base)
            .then(function(rates) {
                var rate = rates[quote];
                if (rate && candlestickSeries) {
                    var now = Math.floor(Date.now() / 1000);
                    var lastData = candlestickSeries.data();
                    if (lastData && lastData.length > 0) {
                        var last = lastData[lastData.length - 1];
                        var timeSinceLast = now - last.time;
                        if (timeSinceLast > 60) {
                            var newCandle = {
                                time: now,
                                open: last.close,
                                high: Math.max(last.close, rate),
                                low: Math.min(last.close, rate),
                                close: rate
                            };
                            candlestickSeries.update(newCandle);
                        } else {
                            var updated = {
                                time: last.time,
                                open: last.open,
                                high: Math.max(last.high, rate),
                                low: Math.min(last.low, rate),
                                close: rate
                            };
                            candlestickSeries.update(updated);
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

        var promises = Object.keys(bases).map(function(base) {
            return fetchLiveRates(base)
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

    // ===== INITIALIZE PRICE CARDS =====
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
    pairBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            pairBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            var pairId = this.dataset.pair;
            currentPair = pairs.find(function(p) { return p.id === pairId; }) || pairs[0];
            updateChart();
        });
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
            if (currentPair && candlestickSeries) {
                fetchLiveRateAndUpdate(currentPair);
            }
            updatePriceCards();
        }, 10000);
    }

    // ===== RESIZE HANDLER =====
    function handleResize() {
        if (chart) {
            chart.resize(chartContainer.clientWidth, 450);
        }
    }

    // ===== INITIALIZATION =====
    function init() {
        // Set default active pair
        var defaultPair = pairs[0];
        document.querySelector('.pair-btn[data-pair="' + defaultPair.id + '"]').classList.add('active');

        initPriceCards();
        updateChart();
        startLiveUpdates();

        window.addEventListener('resize', handleResize);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
