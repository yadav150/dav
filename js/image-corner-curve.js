/* ============================================================
   IMAGE CORNER CURVE — Tool logic
   Client-side only. No external libraries. No uploads to server.
   ============================================================ */

(function () {
    'use strict';

    // ===== DOM refs =====
    var dropZone = document.getElementById('dropZone');
    var fileInput = document.getElementById('fileInput');
    var previewCanvas = document.getElementById('previewCanvas');
    var previewPlaceholder = document.getElementById('previewPlaceholder');
    var radiusSlider = document.getElementById('radiusSlider');
    var radiusNumber = document.getElementById('radiusNumber');
    var radiusValue = document.getElementById('radiusValue');
    var resetRadiusBtn = document.getElementById('resetRadius');
    var formatSelect = document.getElementById('formatSelect');
    var downloadBtn = document.getElementById('downloadBtn');
    var resetAllBtn = document.getElementById('resetAll');
    var errorMsg = document.getElementById('errorMsg');

    // ===== Constants =====
    var ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    var MAX_DIMENSION = 8000;

    // ===== State =====
    var currentImage = null;
    var currentFileName = 'image';

    // ===== Error helpers =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }
    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    // ===== Rounded-rect path (with fallback for older browsers) =====
    function buildRoundedRectPath(ctx, x, y, w, h, r) {
        if (r < 0) r = 0;
        var maxR = Math.min(w, h) / 2;
        if (r > maxR) r = maxR;

        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, r);
            return;
        }

        // Fallback for browsers without ctx.roundRect
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // ===== Render current image on canvas with radius =====
    function render() {
        if (!currentImage) return;

        var w = previewCanvas.width;
        var h = previewCanvas.height;
        var radius = parseInt(radiusSlider.value, 10) || 0;
        var maxR = Math.floor(Math.min(w, h) / 2);
        if (radius > maxR) radius = maxR;

        var ctx = previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        buildRoundedRectPath(ctx, 0, 0, w, h, radius);
        ctx.clip();

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(currentImage, 0, 0, w, h);

        ctx.restore();

        radiusValue.textContent = radius + 'px';
    }

    // ===== Load file =====
    function handleFile(file) {
        if (!file) return;

        if (ALLOWED_TYPES.indexOf(file.type) === -1) {
            showError('Please upload a JPG, PNG, or WebP image.');
            return;
        }

        var reader = new FileReader();

        reader.onerror = function () {
            showError('Could not read this image. Try another file.');
        };

        reader.onload = function (e) {
            var img = new Image();

            img.onerror = function () {
                showError('Could not read this image. Try another file.');
            };

            img.onload = function () {
                if (img.naturalWidth > MAX_DIMENSION || img.naturalHeight > MAX_DIMENSION) {
                    showError('This image is too large for your browser to process safely.');
                    return;
                }

                currentImage = img;
                var base = (file.name || 'image').replace(/\.[^.]+$/, '');
                currentFileName = base || 'image';

                // Setup canvas to original dimensions
                previewCanvas.width = img.naturalWidth;
                previewCanvas.height = img.naturalHeight;

                // Update radius max based on smaller side
                var maxR = Math.floor(Math.min(img.naturalWidth, img.naturalHeight) / 2);
                radiusSlider.max = maxR;
                radiusNumber.max = maxR;

                // Clamp current radius
                var cur = parseInt(radiusSlider.value, 10) || 0;
                if (cur > maxR) cur = maxR;
                radiusSlider.value = cur;
                radiusNumber.value = cur;

                // Show canvas, hide placeholder
                previewPlaceholder.style.display = 'none';
                previewCanvas.style.display = 'block';

                hideError();
                render();
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    }

    // ===== Slider <-> Number sync =====
    function onRadiusInput(source) {
        var val = parseInt(source.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        var maxR = parseInt(radiusSlider.max, 10) || 0;
        if (val > maxR) val = maxR;

        radiusSlider.value = val;
        radiusNumber.value = val;
        render();
    }

    // ===== Reset radius to 0 =====
    function resetRadius() {
        radiusSlider.value = 0;
        radiusNumber.value = 0;
        render();
    }

    // ===== Reset everything =====
    function resetAll() {
        currentImage = null;
        currentFileName = 'image';
        fileInput.value = '';
        radiusSlider.value = 0;
        radiusNumber.value = 0;
        radiusSlider.max = 500;
        radiusNumber.max = 500;
        radiusValue.textContent = '0px';

        previewCanvas.style.display = 'none';
        previewCanvas.width = 0;
        previewCanvas.height = 0;
        previewPlaceholder.style.display = '';
        previewPlaceholder.textContent = 'No image uploaded yet';

        hideError();
    }

    // ===== Download =====
    function download() {
        if (!currentImage) {
            showError('Please upload an image first.');
            return;
        }

        var format = formatSelect.value;
        var mime, ext, quality;

        if (format === 'png') {
            mime = 'image/png';
            ext = 'png';
            quality = undefined; // PNG is always lossless
        } else if (format === 'webp') {
            mime = 'image/webp';
            ext = 'webp';
            quality = 1.0; // lossless WebP
        } else if (format === 'jpeg') {
            mime = 'image/jpeg';
            ext = 'jpg';
            quality = 0.95; // near-lossless (JPEG is lossy)
        } else {
            mime = 'image/png';
            ext = 'png';
            quality = undefined;
        }

        // Build export canvas at original dimensions
        var exportCanvas = document.createElement('canvas');
        exportCanvas.width = previewCanvas.width;
        exportCanvas.height = previewCanvas.height;
        var ectx = exportCanvas.getContext('2d');

        // JPEG does not support transparency — fill white background
        if (format === 'jpeg') {
            ectx.fillStyle = '#ffffff';
            ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }

        ectx.drawImage(previewCanvas, 0, 0);

        try {
            exportCanvas.toBlob(function (blob) {
                if (!blob) {
                    showError('Download failed. Please try again.');
                    return;
                }

                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = url;
                link.download = currentFileName + '-rounded.' + ext;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(function () {
                    URL.revokeObjectURL(url);
                }, 1000);
            }, mime, quality);
        } catch (err) {
            showError('Download failed. Please try again.');
        }
    }

    // ===== Event bindings =====

    // File input change
    fileInput.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        handleFile(file);
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach(function (evt) {
        dropZone.addEventListener(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
        dropZone.addEventListener(evt, function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });
    dropZone.addEventListener('drop', function (e) {
        var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    // Radius controls
    radiusSlider.addEventListener('input', function () { onRadiusInput(radiusSlider); });
    radiusNumber.addEventListener('input', function () { onRadiusInput(radiusNumber); });
    resetRadiusBtn.addEventListener('click', resetRadius);

    // Actions
    downloadBtn.addEventListener('click', download);
    resetAllBtn.addEventListener('click', resetAll);

    // Format change — just clear any error
    formatSelect.addEventListener('change', function () { hideError(); });

    // ===== Init =====
    radiusValue.textContent = '0px';

})();
