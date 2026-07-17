(function() {
    'use strict';

    // ===== YOUR API KEY =====
    var API_KEY = 'd4b61ba7b463552f7c64d91b';

    // ===== CURRENCY DATA =====
    var currencies = {
        fiat: [
            { code: 'USD', name: 'US Dollar', symbol: '$' },
            { code: 'EUR', name: 'Euro', symbol: '€' },
            { code: 'GBP', name: 'British Pound', symbol: '£' },
            { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
            { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
            { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
            { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
            { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
            { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
            { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
            { code: 'THB', name: 'Thai Baht', symbol: '฿' },
            { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
            { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
            { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
            { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
            { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
            { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
            { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
            { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
            { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
            { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
            { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
            { code: 'RUB', name: 'Russian Ruble', symbol: '₽' }
        ],
        crypto: [
            { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
            { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
            { code: 'USDT', name: 'Tether', symbol: '₮' },
            { code: 'BNB', name: 'Binance Coin', symbol: 'BNB' },
            { code: 'SOL', name: 'Solana', symbol: 'SOL' },
            { code: 'XRP', name: 'Ripple', symbol: 'XRP' },
            { code: 'ADA', name: 'Cardano', symbol: 'ADA' },
            { code: 'DOGE', name: 'Dogecoin', symbol: 'DOGE' },
            { code: 'DOT', name: 'Polkadot', symbol: 'DOT' },
            { code: 'LINK', name: 'Chainlink', symbol: 'LINK' },
            { code: 'MATIC', name: 'Polygon', symbol: 'MATIC' },
            { code: 'UNI', name: 'Uniswap', symbol: 'UNI' },
            { code: 'LTC', name: 'Litecoin', symbol: 'Ł' }
        ],
        metals: [
            { code: 'XAU', name: 'Gold', symbol: 'Au' },
            { code: 'XAG', name: 'Silver', symbol: 'Ag' },
            { code: 'XPT', name: 'Platinum', symbol: 'Pt' },
            { code: 'XPD', name: 'Palladium', symbol: 'Pd' }
        ]
    };

    var currentAsset = 'fiat';
    var rateData = {};
    var alertTarget = null;
    var autoRefreshInterval = null;
    var isFetching = false;
    var chartInstance = null;
    var currentFrom = 'USD';
    var currentTo = 'EUR';
    var currentPeriod = '1W';

    // ===== DOM REFS =====
    var assetToggle = document.getElementById('assetToggle');
    var fromSelect = document.getElementById('fromCurrency');
    var toSelect = document.getElementById('toCurrency');
    var fromSearch = document.getElementById('fromSearch');
    var toSearch = document.getElementById('toSearch');
    var swapBtn = document.getElementById('swapBtn');
    var amountInput = document.getElementById('amount');
    var convertedAmount = document.getElementById('convertedAmount');
    var convertedCurrency = document.getElementById('convertedCurrency');
    var fetchBtn = document.getElementById('fetchBtn');
    var resetBtn = document.getElementById('resetBtn');
    var errorMsg = document.getElementById('errorMsg');
    var resultDisplay = document.getElementById('resultDisplay');
    var autoRefresh = document.getElementById('autoRefresh');
    var rateAlert = document.getElementById('rateAlert');
    var setAlertBtn = document.getElementById('setAlertBtn');
    var timeframeBtns = document.querySelectorAll('.timeframe-btn');
    var chartCanvas = document.getElementById('trendChart');
    var chartContainer = document.getElementById('chartContainer');
    var chartLoading = document.getElementById('chartLoading');

    // ===== POPULATE CURRENCY DROPDOWNS =====
    function populateCurrencies(asset) {
        var list = currencies[asset] || currencies.fiat;
        var fromOptions = '';
        var toOptions = '';
        for (var i = 0; i < list.length; i++) {
            var c = list[i];
            fromOptions += '<option value="' + c.code + '">' + c.code + ' - ' + c.name + '</option>';
            toOptions += '<option value="' + c.code + '">' + c.code + ' - ' + c.name + '</option>';
        }

        var fromVal = fromSelect.value || list[0].code;
        var toVal = toSelect.value || (list.length > 1 ? list[1].code : list[0].code);

        fromSelect.innerHTML = fromOptions;
        toSelect.innerHTML = toOptions;

        var fromExists = false;
        var toExists = false;
        for (var j = 0; j < fromSelect.options.length; j++) {
            if (fromSelect.options[j].value === fromVal) fromExists = true;
            if (toSelect.options[j] && toSelect.options[j].value === toVal) toExists = true;
        }

        fromSelect.value = fromExists ? fromVal : list[0].code;
        toSelect.value = toExists ? toVal : (list.length > 1 ? list[1].code : list[0].code);
        fromSelect.size = 1;
        toSelect.size = 1;
        currentFrom = fromSelect.value;
        currentTo = toSelect.value;
        updateResultDisplay();
    }

    // ===== FILTER SEARCH =====
    function filterCurrencies(searchInput, selectElement) {
        var query = searchInput.value.toLowerCase();
        var options = selectElement.options;
        var visibleCount = 0;
        selectElement.size = 8;
        for (var i = 0; i < options.length; i++) {
            var text = options[i].text.toLowerCase();
            if (text.indexOf(query) !== -1) {
                options[i].style.display = '';
                visibleCount++;
            } else {
                options[i].style.display = 'none';
            }
        }
    }

    fromSearch.addEventListener('input', function() {
        filterCurrencies(this, fromSelect);
    });
    toSearch.addEventListener('input', function() {
        filterCurrencies(this, toSelect);
    });

    fromSearch.addEventListener('blur', function() {
        setTimeout(function() { fromSelect.size = 1; }, 200);
    });
    toSearch.addEventListener('blur', function() {
        setTimeout(function() { toSelect.size = 1; }, 200);
    });

    // ===== ASSET TOGGLE =====
    assetToggle.addEventListener('click', function(e) {
        var btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        var btns = this.querySelectorAll('.toggle-btn');
        for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
        btn.classList.add('active');
        currentAsset = btn.dataset.asset;
        populateCurrencies(currentAsset);
        clearChart();
        resetAlert();
        hideError();
    });

    // ===== SWAP CURRENCIES =====
    swapBtn.addEventListener('click', function() {
        var fromVal = fromSelect.value;
        var toVal = toSelect.value;
        fromSelect.value = toVal;
        toSelect.value = fromVal;
        currentFrom = fromSelect.value;
        currentTo = toSelect.value;
        fromSearch.value = '';
        toSearch.value = '';
        filterCurrencies(fromSearch, fromSelect);
        filterCurrencies(toSearch, toSelect);
        updateResultDisplay();
        hideError();
        // Update chart with new pair
        if (rateData && Object.keys(rateData).length > 0) {
            fetchHistoricalData(currentPeriod);
        }
    });

    // ===== UPDATE RESULT DISPLAY =====
    function updateResultDisplay() {
        var toCode = toSelect.value;
        var amount = parseFloat(amountInput.value) || 0;
        convertedCurrency.textContent = toCode;
        if (rateData && rateData[toCode]) {
            var result = amount * rateData[toCode];
            convertedAmount.textContent = result.toFixed(4);
        } else {
            convertedAmount.textContent = '0.00';
        }
    }

    // ===== LOADING SPINNER =====
    function showLoading() {
        fetchBtn.textContent = 'Loading...';
        fetchBtn.disabled = true;
        isFetching = true;
    }

    function hideLoading() {
        fetchBtn.textContent = 'Calculate Live Conversion';
        fetchBtn.disabled = false;
        isFetching = false;
    }

    // ===== FETCH EXCHANGE RATE =====
    function fetchExchangeRate() {
        var from = fromSelect.value;
        var to = toSelect.value;
        var amount = parseFloat(amountInput.value) || 0;

        if (!from || !to) {
            showError('Please select both currencies.');
            return;
        }
        if (isFetching) return;

        showLoading();

        var apiUrl = 'https://v6.exchangerate-api.com/v6/' + API_KEY + '/latest/' + from;

        fetch(apiUrl)
            .then(function(response) {
                if (!response.ok) throw new Error('API request failed');
                return response.json();
            })
            .then(function(data) {
                if (data.result === 'error') {
                    showError(data['error-type'] || 'API error occurred.');
                    return;
                }
                var rate = data.conversion_rates[to];
                if (!rate) {
                    showError('Currency not supported by the API.');
                    return;
                }
                rateData = {};
                for (var key in data.conversion_rates) {
                    rateData[key] = data.conversion_rates[key];
                }
                processRateData(rate, amount);
            })
            .catch(function(err) {
                showError('Failed to fetch exchange rates. Please try again.');
                console.error('API Error:', err);
            })
            .finally(function() {
                hideLoading();
            });
    }

    // ===== PROCESS RATE DATA =====
    function processRateData(rate, amount) {
        var result = amount * rate;
        var toCode = toSelect.value;
        convertedAmount.textContent = result.toFixed(4);
        convertedCurrency.textContent = toCode;
        resultDisplay.style.opacity = '0.6';
        setTimeout(function() { resultDisplay.style.opacity = '1'; }, 200);

        // Fetch historical data for chart
        fetchHistoricalData(currentPeriod);

        hideError();
        if (autoRefresh.checked) scheduleAutoRefresh();
        if (alertTarget && rate >= alertTarget) {
            alert('Rate Alert!\nExchange rate has reached your target: ' + rate.toFixed(4));
            alertTarget = null;
            rateAlert.value = '';
        }
    }

    // ===== FETCH HISTORICAL DATA FOR CHART =====
    function fetchHistoricalData(period) {
        var from = fromSelect.value;
        var to = toSelect.value;
        if (!from || !to) return;

        var days;
        switch (period) {
            case '1D': days = 1; break;
            case '1W': days = 7; break;
            case '1M': days = 30; break;
            default: days = 7;
        }

        // Calculate date range
        var endDate = new Date();
        var startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        var startStr = startDate.toISOString().split('T')[0];
        var endStr = endDate.toISOString().split('T')[0];

        // Use Frankfurter API for historical data (free, no key)
        var url = 'https://api.frankfurter.app/' + startStr + '..' + endStr + '?from=' + from + '&to=' + to;

        chartLoading.style.display = 'block';
        chartCanvas.style.display = 'none';

        fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('Failed to fetch historical data');
                return response.json();
            })
            .then(function(data) {
                chartLoading.style.display = 'none';
                chartCanvas.style.display = 'block';
                renderChart(data, to);
            })
            .catch(function(err) {
                chartLoading.style.display = 'none';
                showError('Failed to load historical chart data.');
                console.error('Chart API Error:', err);
            });
    }

    // ===== RENDER CHART =====
    function renderChart(data, targetCurrency) {
        var rates = data.rates;
        var labels = Object.keys(rates).sort();
        var values = labels.map(function(date) {
            return rates[date][targetCurrency];
        });

        if (chartInstance) {
            chartInstance.destroy();
        }

        var ctx = chartCanvas.getContext('2d');

        // Detect dark mode
        var isDark = document.body.classList.contains('dark-mode');
        var textColor = isDark ? '#eee' : '#333';
        var gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        var fillColor = 'rgba(26, 92, 58, 0.2)';
        var lineColor = '#1a5c3a';

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '1 ' + targetCurrency + ' = ? ' + fromSelect.value,
                    data: values,
                    borderColor: lineColor,
                    backgroundColor: fillColor,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: lineColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
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
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            maxTicksLimit: 8,
                            font: { size: 10 }
                        }
                    },
                    y: {
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor,
                            font: { size: 10 }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false
                }
            }
        });
    }

    // ===== CLEAR CHART =====
    function clearChart() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        chartCanvas.style.display = 'none';
        chartLoading.style.display = 'none';
    }

    // ===== AUTO-REFRESH =====
    function scheduleAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        if (autoRefresh.checked) {
            autoRefreshInterval = setInterval(fetchExchangeRate, 30000);
        }
    }

    autoRefresh.addEventListener('change', function() {
        if (this.checked) scheduleAutoRefresh();
        else { if (autoRefreshInterval) { clearInterval(autoRefreshInterval);
                autoRefreshInterval = null; } }
    });

    // ===== RATE ALERT =====
    setAlertBtn.addEventListener('click', function() {
        var target = parseFloat(rateAlert.value);
        if (isNaN(target) || target <= 0) {
            showError('Please enter a valid target rate.');
            return;
        }
        alertTarget = target;
        this.textContent = 'Alert Set';
        this.style.background = '#27ae60';
        var self = this;
        setTimeout(function() {
            self.textContent = 'Set Alert';
            self.style.background = '';
        }, 2000);
        hideError();
    });

    function resetAlert() {
        alertTarget = null;
        rateAlert.value = '';
        setAlertBtn.textContent = 'Set Alert';
        setAlertBtn.style.background = '';
    }

    // ===== TIMEFRAME TOGGLE =====
    for (var i = 0; i < timeframeBtns.length; i++) {
        (function(btn) {
            btn.addEventListener('click', function() {
                for (var j = 0; j < timeframeBtns.length; j++) {
                    timeframeBtns[j].classList.remove('active');
                }
                this.classList.add('active');
                currentPeriod = this.dataset.period;
                if (rateData && Object.keys(rateData).length > 0) {
                    fetchHistoricalData(currentPeriod);
                }
            });
        })(timeframeBtns[i]);
    }

    // ===== ERROR HANDLING =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }

    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    // ===== RESET =====
    function resetAll() {
        var defaultList = currencies.fiat;
        fromSelect.value = 'USD';
        toSelect.value = 'EUR';
        currentFrom = 'USD';
        currentTo = 'EUR';
        fromSearch.value = '';
        toSearch.value = '';
        filterCurrencies(fromSearch, fromSelect);
        filterCurrencies(toSearch, toSelect);
        amountInput.value = '1.00';
        rateData = {};
        convertedAmount.textContent = '0.00';
        convertedCurrency.textContent = 'EUR';
        resetAlert();
        autoRefresh.checked = true;
        if (autoRefreshInterval) { clearInterval(autoRefreshInterval);
            autoRefreshInterval = null; }
        scheduleAutoRefresh();
        clearChart();
        hideError();
        resultDisplay.style.opacity = '1';
        fromSelect.size = 1;
        toSelect.size = 1;
        document.querySelectorAll('.currency-form .field-group input[type="number"]').forEach(function(el) {
            el.style.width = '';
        });
        // Reset timeframe to default (1W)
        var btns = document.querySelectorAll('.timeframe-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.remove('active');
            if (btns[i].dataset.period === '1W') btns[i].classList.add('active');
        }
        currentPeriod = '1W';
    }

    // ===== EVENT LISTENERS =====
    fetchBtn.addEventListener('click', fetchExchangeRate);

    resetBtn.addEventListener('click', function(e) {
        e.preventDefault();
        resetAll();
    });

    fromSelect.addEventListener('change', function() {
        currentFrom = this.value;
        updateResultDisplay();
        hideError();
        if (rateData && Object.keys(rateData).length > 0) {
            fetchHistoricalData(currentPeriod);
        }
    });

    toSelect.addEventListener('change', function() {
        currentTo = this.value;
        updateResultDisplay();
        hideError();
        if (rateData && Object.keys(rateData).length > 0) {
            fetchHistoricalData(currentPeriod);
        }
    });

    amountInput.addEventListener('input', updateResultDisplay);

    // ===== DARK MODE OBSERVER =====
    var darkModeObserver = new MutationObserver(function() {
        if (chartInstance) {
            var isDark = document.body.classList.contains('dark-mode');
            var textColor = isDark ? '#eee' : '#333';
            var gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            chartInstance.options.scales.x.ticks.color = textColor;
            chartInstance.options.scales.y.ticks.color = textColor;
            chartInstance.options.scales.y.grid.color = gridColor;
            chartInstance.update();
        }
    });
    darkModeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // ===== INITIALIZATION =====
    populateCurrencies('fiat');
    updateResultDisplay();

    setTimeout(function() {
        document.querySelectorAll('.currency-form .field-group input[type="number"]').forEach(function(el) {
            el.style.width = '100%';
        });
    }, 50);

    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (chartInstance) {
                chartInstance.resize();
            }
        }, 300);
    });

})();
