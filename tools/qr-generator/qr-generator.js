// ============================================================
//  QR Generator · Yadav Web Tools  –  Full Upgrade
// ============================================================

(function () {
  'use strict';

  // ---------- DOM refs ----------
  const form = document.getElementById('qrForm');
  const contentType = document.getElementById('contentType');
  const dynamicFields = document.getElementById('dynamicFields');
  const fgColor = document.getElementById('fgColor');
  const bgColor = document.getElementById('bgColor');
  const logoUpload = document.getElementById('logoUpload');
  const errorMsg = document.getElementById('errorMsg');
  const qrResult = document.getElementById('qrResult');
  const qrContainer = document.getElementById('qrCodeContainer');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadSvgBtn = document.getElementById('downloadSvgBtn');
  const qrDetail = document.getElementById('qrDetail');

  // ---------- internal state ----------
  let currentQRCanvas = null;        // final canvas (with logo if any)
  let currentRawCanvas = null;      // raw QR canvas from qrcodejs
  let currentLogoImage = null;      // loaded logo image
  let qrCodeInstance = null;        // QRCode instance reference

  // ---------- field definitions per content type ----------
  const fieldConfig = {
    url: {
      fields: [
        { id: 'urlInput', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true }
      ],
      buildContent: (data) => data.urlInput.trim()
    },
    text: {
      fields: [
        { id: 'textInput', label: 'Plain Text', type: 'textarea', placeholder: 'Enter your text here...', required: true }
      ],
      buildContent: (data) => data.textInput.trim()
    },
    wifi: {
      fields: [
        { id: 'wifiSsid', label: 'Network Name (SSID)', type: 'text', placeholder: 'MyWiFi', required: true },
        { id: 'wifiPassword', label: 'Password', type: 'password', placeholder: '••••••••', required: true },
        { id: 'wifiEncryption', label: 'Encryption', type: 'select', options: ['WPA', 'WEP', 'nopass'], default: 'WPA' }
      ],
      buildContent: (data) => {
        const enc = data.wifiEncryption || 'WPA';
        const ssid = data.wifiSsid.trim();
        const pwd = data.wifiPassword.trim();
        if (!ssid) return '';
        return `WIFI:T:${enc};S:${ssid};P:${pwd};;`;
      }
    },
    upi: {
      fields: [
        { id: 'upiPayee', label: 'UPI ID (e.g., example@upi)', type: 'text', placeholder: 'payee@upi', required: true },
        { id: 'upiName', label: 'Payee Name (optional)', type: 'text', placeholder: 'John Doe' },
        { id: 'upiAmount', label: 'Amount (optional)', type: 'number', placeholder: '100.00' },
        { id: 'upiCurrency', label: 'Currency (optional)', type: 'text', placeholder: 'INR', default: 'INR' }
      ],
      buildContent: (data) => {
        const payee = data.upiPayee.trim();
        if (!payee) return '';
        let upi = `upi://pay?pa=${encodeURIComponent(payee)}`;
        if (data.upiName.trim()) upi += `&pn=${encodeURIComponent(data.upiName.trim())}`;
        if (data.upiAmount.trim()) upi += `&am=${encodeURIComponent(data.upiAmount.trim())}`;
        if (data.upiCurrency.trim()) upi += `&cu=${encodeURIComponent(data.upiCurrency.trim())}`;
        return upi;
      }
    },
    contact: {
      fields: [
        { id: 'contactName', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
        { id: 'contactPhone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890' },
        { id: 'contactEmail', label: 'Email', type: 'email', placeholder: 'john@example.com' }
      ],
      buildContent: (data) => {
        const name = data.contactName.trim();
        if (!name) return '';
        const phone = data.contactPhone.trim();
        const email = data.contactEmail.trim();
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        vcard += `FN:${name}\nN:${name};;;\n`;
        if (phone) vcard += `TEL:${phone}\n`;
        if (email) vcard += `EMAIL:${email}\n`;
        vcard += 'END:VCARD';
        return vcard;
      }
    }
  };

  // ---------- helper: render dynamic fields ----------
  function renderFields(type) {
    const config = fieldConfig[type];
    if (!config) return;
    let html = '';
    config.fields.forEach(f => {
      if (f.type === 'textarea') {
        html += `<div class="field-group"><label for="${f.id}">${f.label}</label><textarea id="${f.id}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}></textarea></div>`;
      } else if (f.type === 'select') {
        html += `<div class="field-group"><label for="${f.id}">${f.label}</label><select id="${f.id}">`;
        f.options.forEach(opt => {
          const selected = (opt === f.default) ? ' selected' : '';
          html += `<option value="${opt}"${selected}>${opt}</option>`;
        });
        html += `</select></div>`;
      } else {
        html += `<div class="field-group"><label for="${f.id}">${f.label}</label><input type="${f.type}" id="${f.id}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} ${f.default ? `value="${f.default}"` : ''} /></div>`;
      }
    });
    dynamicFields.innerHTML = html;
  }

  // ---------- get field values ----------
  function getFieldValues(type) {
    const config = fieldConfig[type];
    if (!config) return {};
    const data = {};
    config.fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) data[f.id] = el.value;
    });
    return data;
  }

  // ---------- show/hide error ----------
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = msg ? 'block' : 'none';
  }
  function hideError() { showError(''); }

  // ---------- reset QR display ----------
  function resetQR() {
    qrResult.style.display = 'none';
    qrContainer.innerHTML = '';
    currentQRCanvas = null;
    currentRawCanvas = null;
    hideError();
  }

  // ---------- generate QR code (core) ----------
  function generateQR(content, fg, bg, logoImg) {
    return new Promise((resolve, reject) => {
      if (!content) {
        reject(new Error('Content is empty'));
        return;
      }

      qrContainer.innerHTML = '';
      const qrSize = 300;

      qrCodeInstance = new QRCode(qrContainer, {
        text: content,
        width: qrSize,
        height: qrSize,
        colorDark: fg || '#1a5c3a',
        colorLight: bg || '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });

      setTimeout(() => {
        const canvas = qrContainer.querySelector('canvas');
        if (!canvas) {
          reject(new Error('QR generation failed – no canvas found'));
          return;
        }

        currentRawCanvas = canvas;

        if (logoImg) {
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = qrSize;
          finalCanvas.height = qrSize;
          const ctx = finalCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, 0);
          const logoSize = Math.round(qrSize * 0.22);
          const x = (qrSize - logoSize) / 2;
          const y = (qrSize - logoSize) / 2;
          ctx.beginPath();
          ctx.arc(qrSize/2, qrSize/2, logoSize/2 + 4, 0, 2 * Math.PI);
          ctx.fillStyle = bg || '#ffffff';
          ctx.fill();
          ctx.drawImage(logoImg, x, y, logoSize, logoSize);
          qrContainer.innerHTML = '';
          qrContainer.appendChild(finalCanvas);
          currentQRCanvas = finalCanvas;
        } else {
          currentQRCanvas = canvas;
        }

        qrResult.style.display = 'block';
        hideError();
        const detail = content.length > 80 ? content.substring(0, 80) + '…' : content;
        qrDetail.textContent = `Content: ${detail}`;
        resolve(currentQRCanvas);
      }, 100);
    });
  }

  // ---------- download PNG (high resolution) ----------
  function downloadPNG(canvas, scale = 4) {
    if (!canvas) return;
    const w = canvas.width * scale;
    const h = canvas.height * scale;
    const bigCanvas = document.createElement('canvas');
    bigCanvas.width = w;
    bigCanvas.height = h;
    const ctx = bigCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, w, h);
    const link = document.createElement('a');
    link.download = `qrcode_${Date.now()}.png`;
    link.href = bigCanvas.toDataURL('image/png');
    link.click();
  }

  // ---------- download SVG fallback (high-res PNG) ----------
  function downloadSVG(canvas) {
    if (!canvas) return;
    downloadPNG(canvas, 4);
  }

  // ---------- load image from file ----------
  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image file'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load error'));
        img.src = ev.target.result;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  // ---------- form submit ----------
  async function onFormSubmit(e) {
    e.preventDefault();
    hideError();
    resetQR();

    const type = contentType.value;
    const config = fieldConfig[type];
    if (!config) {
      showError('Invalid content type');
      return;
    }

    const data = getFieldValues(type);
    const content = config.buildContent(data);
    if (!content) {
      showError('Please fill in all required fields.');
      return;
    }

    const fg = fgColor.value;
    const bg = bgColor.value;
    let logoImg = null;
    if (logoUpload.files && logoUpload.files[0]) {
      try {
        logoImg = await loadImageFromFile(logoUpload.files[0]);
      } catch (err) {
        showError('Logo image could not be loaded. Please try another file.');
        return;
      }
    }

    try {
      const canvas = await generateQR(content, fg, bg, logoImg);
      downloadPNG(canvas, 4);  // Auto-download high-res PNG
    } catch (err) {
      showError(err.message || 'QR generation failed');
      console.error(err);
    }
  }

  // ---------- event listeners ----------
  contentType.addEventListener('change', function () {
    renderFields(this.value);
    resetQR();
    hideError();
  });

  form.addEventListener('submit', onFormSubmit);

  form.addEventListener('reset', function () {
    setTimeout(() => {
      logoUpload.value = '';
      resetQR();
      hideError();
      renderFields(contentType.value);
    }, 10);
  });

  downloadPngBtn.addEventListener('click', function () {
    if (currentQRCanvas) downloadPNG(currentQRCanvas, 4);
    else showError('No QR code to download');
  });

  downloadSvgBtn.addEventListener('click', function () {
    if (currentQRCanvas) downloadSVG(currentQRCanvas);
    else showError('No QR code to download');
  });

  // ---------- init ----------
  renderFields(contentType.value);
  resetQR();
  hideError();

  logoUpload.addEventListener('change', function () {
    hideError();
  });

})();
