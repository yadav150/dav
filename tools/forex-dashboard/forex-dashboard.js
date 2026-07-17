// ============================================================
//  FOREX DASHBOARD – LIVE CANDLESTICK CHART
//  Uses Lightweight Charts from TradingView
//  Data: ExchangeRate-API for live rates, Frankfurter for historical
//  Bullish candles: Yellow, Bearish: Red
// ============================================================

(function() {
    'use strict';

    // ===== CONFIGURATION =====
    var API_KEY = 'YOUR_API_KEY_HERE';  // <-- Replace with your ExchangeRate-API key

    // Supported pairs (base/quote)
    var pairs = [
        { id: 'EUR/USD', base: 'EUR', quote: 'USD' },
        { id: 'GBP/USD', base: 'GBP', quote: 'USD' },
        { id: 'USD/JPY', base: 'USD', quote: 'JPY' },
        { id: 'USD/INR', base: 'USD', quote: 'INR' },
        { id: 'AUD/USD', base: 'AUD', quote: 'USD' },
        { id: 'USD/CAD', base: 'USD', quote: 'CAD' }
    ];

    // Major pairs for price cards (use same list)
    var majorPairs = pairs;

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
    var errorMsg = document.getElementById('errorMsg');

    // ===== HELPER FUNCTIONS =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }

    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
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

    // ===== FETCH HISTORICAL DAILY RATES =====
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
            });
    }

    // ===== GENERATE OHLC FROM DAILY CLOSE =====
    function generateOHLC(dailyData, volatilityFactor) {
        if (dailyData.length === 0) return [];
        var ohlc = [];
        var prevClose = null;
        for (var i = 0; i < dailyData.length; i++) {
            var close = dailyData[i].close;
            var open = (i === 0) ? close : prevClose;
            // Simulate high/low with random variation around close
            var range = close * (0.0005 + Math.random() * 0.002); // 0.05% to 0.2% range
            var high = close + range * (0.5 + Math.random() * 0.5);
            var low = close - range * (0.5 + Math.random() * 0.5);
            // Ensure high/low bound
            if (low > close) low = close * 0.999;
            if (high < close) high = close * 1.001;
            if (i > 0 && open > 0) {
                // Avoid extreme gaps
                if (open > high) high = open * 1.001;
                if (open < low) low = open * 0.999;
            }
            ohlc.push({
                time: dailyData[i].date.getTime() / 1000, // seconds
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
            upColor: '#f0b90b',     // Yellow for bullish
            downColor: '#ef5350',   // Red for bearish
            borderUpColor: '#f0b90b',
            borderDownColor: '#ef5350',
            wickUpColor: '#f0b90b',
            wickDownColor: '#ef5350',
        });

        candlestickSeries.setData(data);

        chart.timeScale().fitContent();
        return chart;
    }

    // ===== UPDATE CHART WITH NEW PAIR & TIMEFRAME =====
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

        // For intraday, we'd need more data, but we'll use daily for simplicity
        // but if 1D, we may not have enough data, we can still show last few days.
        if (days < 2) days = 2;

        var endDate = new Date();
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Show loading state
        showError('Loading chart data...');

        fetchHistoricalRates(pair.base, pair.quote, startDate, endDate)
            .then(function(dailyData) {
                hideError();
                if (dailyData.length === 0) {
                    showError('No historical data available for this pair.');
                    return;
                }
                // Generate OHLC from daily data
                var ohlcData = generateOHLC(dailyData, 0.01);
                // If only one bar, duplicate it
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
                // Fetch live rate and update last candle
                fetchLiveRateAndUpdate(pair);
            })
            .catch(function(err) {
                hideError();
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
                    // Update the last candle's close
                    var now = Math.floor(Date.now() / 1000);
                    // Get the last data point
                    var lastData = candlestickSeries.data();
                    if (lastData && lastData.length > 0) {
                        var last = lastData[lastData.length - 1];
                        // If the last candle is within the last minute, update its close
                        // For simplicity, we'll add a new candle if the time has advanced significantly
                        var timeSinceLast = now - last.time;
                        if (timeSinceLast > 60) {
                            // Create a new candle
                            var newCandle = {
                                time: now,
                                open: last.close,
                                high: Math.max(last.close, rate),
                                low: Math.min(last.close, rate),
                                close: rate
                            };
                            candlestickSeries.update(newCandle);
                        } else {
                            // Update the existing candle's close and adjust high/low
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
        // Fetch rates for each unique base currency
        var bases = {};
        majorPairs.forEach(function(p) {
            if (!bases[p.base]) bases[p.base] = [];
            bases[p.base].push(p);
        });

        // Fetch sequentially for each base (or parallel)
        var promises = Object.keys(bases).map(function(base) {
            return fetchLiveRates(base)
                .then(function(rates) {
                    // For each pair with this base, update card
                    bases[base].forEach(function(pair) {
                        var rate = rates[pair.quote];
                        if (!rate) {
                            // Try reversed pair
                            return;
                        }
                        // Find the card element
                        var card = document.querySelector('.price-card[data-pair="' + pair.id + '"]');
                        if (card) {
                            var rateSpan = card.querySelector('.pair-rate');
                            var changeSpan = card.querySelector('.pair-change');
                            if (rateSpan) rateSpan.textContent = rate.toFixed(4);
                            // Compute change from previous stored value (we'll store in data attribute)
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

        // Also update the chart's last candle if pair is same
        // Already handled by live update interval
    }

    // ===== INITIALIZE PRICE CARDS =====
    function initPriceCards() {
        var html = '';
        majorPairs.forEach(function(pair) {
            html += '<div class="price-card" data-pair="' + pair.id + '">';
            html += '  <div class="pair-name">' + pair.id + '</div>';
            html += '  <div class="pair-rate">--</div>';
            html += '  <div class="pair-change">--</div>';
            html += '</div>';
        });
        priceCardsContainer.innerHTML = html;

        // Fetch initial rates for cards
        updatePriceCards();
        // Then refresh every 10 seconds
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
            tfBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentPeriod = this.dataset.period;
            updateChart();
        });
    });

    // ===== LIVE UPDATE LOOP (every 10 seconds) =====
    function startLiveUpdates() {
        if (liveUpdateInterval) clearInterval(liveUpdateInterval);
        liveUpdateInterval = setInterval(function() {
            // Update the last candle with latest rate
            if (currentPair && candlestickSeries) {
                fetchLiveRateAndUpdate(currentPair);
            }
            // Also update price cards
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

        // Initialize price cards
        initPriceCards();

        // Load initial chart
        updateChart();

        // Start live updates
        startLiveUpdates();

        // Resize handler
        window.addEventListener('resize', handleResize);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
