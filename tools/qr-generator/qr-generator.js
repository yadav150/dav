// ============================================================
//  QR GENERATOR – Yadav Web Tools
//  Generates QR codes with logo support (rectangle, no compression)
// ============================================================

(function() {
    'use strict';

    // ===== DOM REFS =====
    var form = document.getElementById('qrForm');
    var contentType = document.getElementById('contentType');
    var dynamicFields = document.getElementById('dynamicFields');
    var fgColor = document.getElementById('fgColor');
    var bgColor = document.getElementById('bgColor');
    var logoUpload = document.getElementById('logoUpload');
    var errorMsg = document.getElementById('errorMsg');
    var qrResult = document.getElementById('qrResult');
    var qrCodeContainer = document.getElementById('qrCodeContainer');
    var qrDetail = document.getElementById('qrDetail');
    var downloadPngBtn = document.getElementById('downloadPngBtn');
    var downloadSvgBtn = document.getElementById('downloadSvgBtn');

    var currentQR = null;
    var currentData = '';
    var qrCanvas = null;

    // ===== TEMPLATES =====
    var templates = {
        url: `
            <div class="field-group">
                <label for="urlInput">Website URL</label>
                <input type="url" id="urlInput" placeholder="https://example.com" required />
                <span class="helper-text">https:// will be added automatically</span>
            </div>
        `,
        text: `
            <div class="field-group" style="align-items:stretch;">
                <label for="textInput">Plain Text</label>
                <textarea id="textInput" rows="4" placeholder="Enter your text, message, or notes..." required></textarea>
            </div>
        `,
        wifi: `
            <div class="field-group">
                <label for="ssid">Network Name (SSID)</label>
                <input type="text" id="ssid" placeholder="e.g. MyWiFi" required />
            </div>
            <div class="field-group">
                <label for="wifiPassword">Password</label>
                <div style="display:flex;flex:1 1 200px;min-width:160px;gap:8px;">
                    <input type="password" id="wifiPassword" placeholder="Enter Wi-Fi password" style="flex:1;" />
                    <button type="button" class="toggle-password-btn" data-target="wifiPassword" style="padding:0 12px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;font-size:1rem;">👁️</button>
                </div>
            </div>
            <div class="field-group">
                <label for="wifiSecurity">Network Security</label>
                <select id="wifiSecurity" class="qr-select">
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Unsecured (Open)</option>
                </select>
            </div>
        `,
        upi: `
            <div class="field-group">
                <label for="upiId">UPI ID</label>
                <input type="text" id="upiId" placeholder="username@oksbi" required />
            </div>
            <div class="field-group">
                <label for="payeeName">Payee Name</label>
                <input type="text" id="payeeName" placeholder="Enter payee name" required />
            </div>
            <div class="field-group">
                <label for="upiAmount">Amount (optional)</label>
                <input type="number" id="upiAmount" step="0.01" min="0" placeholder="e.g. 100.00" />
                <span class="helper-text">Leave blank for user to enter amount</span>
            </div>
        `,
        contact: `
            <div class="field-group">
                <label for="contactName">Full Name</label>
                <input type="text" id="contactName" placeholder="e.g. John Doe" required />
            </div>
            <div class="field-group">
                <label for="contactPhone">Phone Number</label>
                <input type="tel" id="contactPhone" placeholder="e.g. +91 9876543210" required />
            </div>
            <div class="field-group">
                <label for="contactEmail">Email</label>
                <input type="email" id="contactEmail" placeholder="john@example.com" required />
            </div>
            <div class="field-group">
                <label for="contactCompany">Company / Website (optional)</label>
                <input type="text" id="contactCompany" placeholder="e.g. MyCompany.com" />
            </div>
        `
    };

    // ===== RENDER DYNAMIC FIELDS =====
    function renderFields(type) {
        dynamicFields.innerHTML = templates[type] || templates.text;
        document.querySelectorAll('.toggle-password-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var targetId = this.dataset.target;
                var input = document.getElementById(targetId);
                if (input) {
                    var isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    this.textContent = isPassword ? '🙈' : '👁️';
                }
            });
        });
    }

    renderFields(contentType.value);

    contentType.addEventListener('change', function() {
        renderFields(this.value);
        qrResult.style.display = 'none';
        hideError();
    });

    // ===== HELPERS =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
        qrResult.style.display = 'none';
    }

    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    function getVal(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }

    function buildQRData() {
        var type = contentType.value;
        var data = '';

        switch (type) {
            case 'url': {
                var url = getVal('urlInput').trim();
                if (!url) return '';
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                data = url;
                break;
            }
            case 'text': {
                data = getVal('textInput').trim();
                break;
            }
            case 'wifi': {
                var ssid = getVal('ssid').trim();
                var password = getVal('wifiPassword').trim();
                var security = getVal('wifiSecurity');
                if (!ssid) return '';
                var enc = security === 'nopass' ? 'nopass' : security;
                data = 'WIFI:T:' + enc + ';S:' + ssid + ';P:' + password + ';;';
                break;
            }
            case 'upi': {
                var upiId = getVal('upiId').trim();
                var name = getVal('payeeName').trim();
                var amount = getVal('upiAmount').trim();
                if (!upiId || !name) return '';
                var upiStr = 'upi://pay?pa=' + upiId + '&pn=' + name;
                if (amount) {
                    upiStr += '&am=' + amount;
                }
                data = upiStr;
                break;
            }
            case 'contact': {
                var cName = getVal('contactName').trim();
                var phone = getVal('contactPhone').trim();
                var email = getVal('contactEmail').trim();
                var company = getVal('contactCompany').trim();
                if (!cName || !phone || !email) return '';
                data = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + cName + '\nTEL:' + phone + '\nEMAIL:' + email;
                if (company) data += '\nORG:' + company;
                data += '\nEND:VCARD';
                break;
            }
            default:
                data = '';
        }
        return data;
    }

    // ===== GENERATE QR =====
    function generateQR() {
        hideError();
        qrResult.style.display = 'none';

        var data = buildQRData();
        if (!data) {
            showError('Please fill in the required fields for the selected content type.');
            return;
        }

        currentData = data;
        qrCodeContainer.innerHTML = '';

        var size = 600;

        try {
            currentQR = new QRCode(qrCodeContainer, {
                text: data,
                width: size,
                height: size,
                colorDark: fgColor.value,
                colorLight: bgColor.value,
                correctLevel: QRCode.CorrectLevel.H
            });

            var canvas = qrCodeContainer.querySelector('canvas');
            if (canvas) {
                qrCanvas = canvas;
                var logoFile = logoUpload.files[0];
                if (logoFile) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var img = new Image();
                        img.onload = function() {
                            var ctx = canvas.getContext('2d');
                            var logoSize = canvas.width * 0.25;
                            var x = (canvas.width - logoSize) / 2;
                            var y = (canvas.height - logoSize) / 2;

                            ctx.fillStyle = bgColor.value;
                            ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);

                            var imgAspect = img.width / img.height;
                            var drawW = logoSize;
                            var drawH = logoSize;
                            if (imgAspect > 1) {
                                drawH = logoSize / imgAspect;
                            } else {
                                drawW = logoSize * imgAspect;
                            }
                            var offsetX = (logoSize - drawW) / 2;
                            var offsetY = (logoSize - drawH) / 2;
                            ctx.drawImage(img, x + offsetX, y + offsetY, drawW, drawH);
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(logoFile);
                }
            }

            qrResult.style.display = 'block';
            qrDetail.textContent = 'QR code generated for: ' + data.substring(0, 60) + (data.length > 60 ? '...' : '');

        } catch (err) {
            showError('Failed to generate QR code. Please check your input.');
            console.error(err);
        }
    }

    // ===== DOWNLOADS =====
    function getCanvas() {
        var canvas = qrCodeContainer.querySelector('canvas');
        if (!canvas) {
            showError('Please generate a QR code first.');
            return null;
        }
        return canvas;
    }

    function downloadPNG() {
        var canvas = getCanvas();
        if (!canvas) return;
        var link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function downloadSVG() {
        var canvas = getCanvas();
        if (!canvas) return;
        var dataUrl = canvas.toDataURL('image/png');
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvas.width + '" height="' + canvas.height +
            '"><image href="' + dataUrl + '" width="' + canvas.width + '" height="' + canvas.height + '" /></svg>';
        var blob = new Blob([svg], { type: 'image/svg+xml' });
        var link = document.createElement('a');
        link.download = 'qrcode.svg';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }

    // ===== EVENT LISTENERS =====
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        generateQR();
    });

    form.addEventListener('reset', function(e) {
        setTimeout(function() {
            renderFields(contentType.value);
            fgColor.value = '#1a5c3a';
            bgColor.value = '#ffffff';
            logoUpload.value = '';
            qrResult.style.display = 'none';
            qrCodeContainer.innerHTML = '';
            hideError();
        }, 10);
    });

    downloadPngBtn.addEventListener('click', downloadPNG);
    downloadSvgBtn.addEventListener('click', downloadSVG);

    dynamicFields.addEventListener('input', hideError);

})();
