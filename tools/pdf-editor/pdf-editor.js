// ============================================================
//  PDF EDITOR – Yadav Web Tools
//  Upload, reorder, delete pages, and download edited PDF.
//  Controls are always visible.
// ============================================================

(function() {
    'use strict';

    // ----- DOM refs -----
    var dropZone = document.getElementById('dropZone');
    var fileInput = document.getElementById('fileInput');
    var workspace = document.getElementById('workspace');
    var fileName = document.getElementById('fileName');
    var pageCount = document.getElementById('pageCount');
    var pagesGrid = document.getElementById('pagesGrid');
    var downloadBtn = document.getElementById('downloadBtn');
    var resetBtn = document.getElementById('resetBtn');
    var errorMsg = document.getElementById('errorMsg');
    var outputFileName = document.getElementById('outputFileName');

    // ----- State -----
    var pdfDoc = null;
    var pageData = [];
    var currentFile = null;

    // ----- Error handling -----
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
        // workspace stays visible – do NOT hide it
    }

    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    // ----- Helpers -----
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // ----- Render thumbnails using pdf.js -----
    async function renderThumbnails() {
        pagesGrid.innerHTML = '';
        for (var i = 0; i < pdfDoc.numPages; i++) {
            var pageNum = i + 1;
            var page = await pdfDoc.getPage(pageNum);
            var viewport = page.getViewport({ scale: 0.5 });
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvasContext: context, viewport: viewport }).promise;

            var card = document.createElement('div');
            card.className = 'page-card';
            card.dataset.index = i;

            var thumbDiv = document.createElement('div');
            thumbDiv.className = 'page-thumb';
            thumbDiv.appendChild(canvas);

            var numSpan = document.createElement('span');
            numSpan.className = 'page-number';
            numSpan.textContent = 'Page ' + (i + 1);

            var actions = document.createElement('div');
            actions.className = 'page-actions';

            var delBtn = document.createElement('button');
            delBtn.className = 'btn-sm btn-delete';
            delBtn.textContent = 'Delete';
            delBtn.dataset.index = i;

            actions.appendChild(delBtn);

            card.appendChild(thumbDiv);
            card.appendChild(numSpan);
            card.appendChild(actions);

            pagesGrid.appendChild(card);
            pageData[i] = { pageNum: pageNum };
        }

        updatePageNumbers();

        // Init Sortable
        if (typeof Sortable !== 'undefined') {
            Sortable.create(pagesGrid, {
                animation: 150,
                handle: '.page-card',
                onEnd: function(evt) {
                    var moved = pageData.splice(evt.oldIndex, 1)[0];
                    pageData.splice(evt.newIndex, 0, moved);
                    updatePageNumbers();
                }
            });
        }

        // Show file info
        workspace.style.display = 'block';
        fileName.textContent = currentFile.name + ' (' + formatFileSize(currentFile.size) + ')';
        pageCount.textContent = pdfDoc.numPages + ' pages';
        hideError();

        // Set default file name
        var baseName = currentFile.name.replace(/\.pdf$/i, '');
        outputFileName.value = baseName + '_edited';
    }

    function updatePageNumbers() {
        var cards = pagesGrid.querySelectorAll('.page-card');
        cards.forEach(function(card, idx) {
            var numSpan = card.querySelector('.page-number');
            if (numSpan) numSpan.textContent = 'Page ' + (idx + 1);
            card.dataset.index = idx;
        });
    }

    // ----- Load PDF -----
    async function loadPDF(file) {
        try {
            hideError();
            var arrayBuffer = await file.arrayBuffer();
            var loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            pdfDoc = await loadingTask.promise;
            pageData = [];
            currentFile = file;
            await renderThumbnails();
        } catch (err) {
            showError('Unable to load PDF. Please make sure the file is valid.');
            console.error(err);
        }
    }

    // ----- Handle file selection -----
    function handleFile(file) {
        if (!file) {
            showError('Please select a valid PDF file.');
            return;
        }
        if (file.type !== 'application/pdf') {
            showError('Please select a valid PDF file.');
            return;
        }
        loadPDF(file);
    }

    // ----- Event listeners for upload -----
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

    // ----- Page actions (delegated) -----
    pagesGrid.addEventListener('click', function(e) {
        var target = e.target.closest('button');
        if (!target) return;
        var card = target.closest('.page-card');
        if (!card) return;
        var index = parseInt(card.dataset.index);

        if (target.classList.contains('btn-delete')) {
            pageData.splice(index, 1);
            card.remove();
            updatePageNumbers();
            if (pageData.length === 0) {
                // Clear file info but keep workspace visible
                fileName.textContent = '';
                pageCount.textContent = '0 pages';
            } else {
                pageCount.textContent = pageData.length + ' pages';
            }
        }
    });

    // ----- Download -----
    downloadBtn.addEventListener('click', async function() {
        if (!pdfDoc || pageData.length === 0) {
            showError('Please upload a PDF file first.');
            return;
        }

        try {
            var PDFDocument = window.PDFLib.PDFDocument;
            var existingPdfBytes = await currentFile.arrayBuffer();
            var srcDoc = await PDFDocument.load(existingPdfBytes);
            var newDoc = await PDFDocument.create();

            for (var i = 0; i < pageData.length; i++) {
                var data = pageData[i];
                var pages = await newDoc.copyPages(srcDoc, [data.pageNum - 1]);
                newDoc.addPage(pages[0]);
            }

            var pdfBytes = await newDoc.save({ compress: false });
            var blob = new Blob([pdfBytes], { type: 'application/pdf' });
            var url = URL.createObjectURL(blob);

            // Get file name
            var name = outputFileName.value.trim() || 'edited';
            if (!name.toLowerCase().endsWith('.pdf')) {
                name += '.pdf';
            }

            var a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            hideError();
        } catch (err) {
            showError('Error generating PDF. Please try again.');
            console.error(err);
        }
    });

    // ----- Reset -----
    resetBtn.addEventListener('click', function() {
        fileInput.value = '';
        currentFile = null;
        pdfDoc = null;
        pageData = [];
        pagesGrid.innerHTML = '';
        fileName.textContent = '';
        pageCount.textContent = '';
        outputFileName.value = '';
        hideError();
        dropZone.classList.remove('dragover');
        // workspace stays visible
    });

})();
