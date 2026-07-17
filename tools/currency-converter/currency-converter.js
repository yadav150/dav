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
    var chartPlaceholder = document.getElementById('chartPlaceholder');

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
        fromSearch.value = '';
        toSearch.value = '';
        filterCurrencies(fromSearch, fromSelect);
        filterCurrencies(toSearch, toSelect);
        updateResultDisplay();
        hideError();
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
        generateChart(rate);
        hideError();
        if (autoRefresh.checked) scheduleAutoRefresh();
        if (alertTarget && rate >= alertTarget) {
            alert('Rate Alert!\nExchange rate has reached your target: ' + rate.toFixed(4));
            alertTarget = null;
            rateAlert.value = '';
        }
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
                if (rateData && Object.keys(rateData).length > 0) {
                    generateChart(rateData[toSelect.value] || 1);
                }
            });
        })(timeframeBtns[i]);
    }

    // ===== GENERATE CHART =====
    function generateChart(rate) {
        chartPlaceholder.style.display = 'none';
        chartCanvas.style.display = 'block';
        var ctx = chartCanvas.getContext('2d');
        var w = chartCanvas.parentElement.clientWidth - 32;
        var h = 200;
        chartCanvas.width = w;
        chartCanvas.height = h;
        ctx.clearRect(0, 0, w, h);
        var points = 20;
        var base = rate * 0.9;
        var range = rate * 0.2;
        ctx.beginPath();
        ctx.strokeStyle = '#1a5c3a';
        ctx.lineWidth = 2;
        for (var i = 0; i < points; i++) {
            var x = (i / (points - 1)) * w;
            var y = h - ((base + Math.random() * range) / (rate * 1.2)) * h * 0.8 - 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = 'rgba(26, 92, 58, 0.1)';
        ctx.fill();
        ctx.fillStyle = '#4a6b5a';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        var activePeriod = document.querySelector('.timeframe-btn.active');
        var label = activePeriod ? activePeriod.dataset.period : '1D';
        ctx.fillText('Trend (' + label + ')', w / 2, h - 4);
    }

    function clearChart() {
        chartPlaceholder.style.display = 'flex';
        chartCanvas.style.display = 'none';
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
        // Fix: Ensure layout stays expanded
        fromSelect.size = 1;
        toSelect.size = 1;
        // Remove any inline width overrides
        document.querySelectorAll('.currency-form .field-group input[type="number"]').forEach(function(el) {
            el.style.width = '';
        });
    }

    // ===== EVENT LISTENERS =====
    fetchBtn.addEventListener('click', fetchExchangeRate);

    resetBtn.addEventListener('click', function(e) {
        e.preventDefault();
        resetAll();
    });

    fromSelect.addEventListener('change', function() {
        updateResultDisplay();
        hideError();
    });

    toSelect.addEventListener('change', function() {
        updateResultDisplay();
        hideError();
    });

    amountInput.addEventListener('input', updateResultDisplay);

    // ===== INITIALIZATION =====
    populateCurrencies('fiat');
    updateResultDisplay();

    // Ensure layout is fully expanded on load
    setTimeout(function() {
        document.querySelectorAll('.currency-form .field-group input[type="number"]').forEach(function(el) {
            el.style.width = '100%';
        });
    }, 50);

    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (rateData && Object.keys(rateData).length > 0 && chartCanvas.style.display !== 'none') {
                generateChart(rateData[toSelect.value] || 1);
            }
        }, 300);
    });

})();
