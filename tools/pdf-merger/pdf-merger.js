// ============================================================
//  PDF MERGER – Yadav Web Tools
//  Merges multiple PDFs with drag‑and‑drop reordering.
//  NO COMPRESSION – preserves original quality.
// ============================================================

(function() {
    'use strict';

    // ===== DOM REFS =====
    var dropZone = document.getElementById('dropZone');
    var fileInput = document.getElementById('fileInput');
    var fileListContainer = document.getElementById('fileListContainer');
    var fileList = document.getElementById('fileList');
    var fileCount = document.getElementById('fileCount');
    var addMoreBtn = document.getElementById('addMoreBtn');
    var outputName = document.getElementById('outputName');
    var mergeBtn = document.getElementById('mergeBtn');
    var resetBtn = document.getElementById('resetBtn');
    var progressContainer = document.getElementById('progressContainer');
    var progressLabel = document.getElementById('progressLabel');
    var progressPercent = document.getElementById('progressPercent');
    var progressBar = document.getElementById('progressBar');
    var errorMsg = document.getElementById('errorMsg');

    // ===== STATE =====
    var selectedFiles = [];
    var mergedBlob = null;
    var sortableInstance = null;

    // ===== HELPERS =====
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }

    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // ===== UPDATE FILE LIST =====
    function updateFileList() {
        if (selectedFiles.length === 0) {
            fileListContainer.style.display = 'none';
            if (sortableInstance) {
                sortableInstance.destroy();
                sortableInstance = null;
            }
            return;
        }
        fileListContainer.style.display = 'block';
        fileCount.textContent = selectedFiles.length + ' files';

        var html = '';
        selectedFiles.forEach(function(file, index) {
            html += '<div class="file-item" data-index="' + index + '">';
            html += '  <span class="file-name">' + file.name + '</span>';
            html += '  <span class="file-size">' + formatFileSize(file.size) + '</span>';
            html += '  <button type="button" class="file-remove" data-index="' + index + '" aria-label="Remove file">✕</button>';
            html += '</div>';
        });
        fileList.innerHTML = html;

        document.querySelectorAll('.file-remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.dataset.index);
                selectedFiles.splice(index, 1);
                updateFileList();
                resetMergeState();
                hideError();
            });
        });

        if (sortableInstance) {
            sortableInstance.destroy();
        }
        sortableInstance = Sortable.create(fileList, {
            animation: 150,
            handle: '.file-item',
            onEnd: function(evt) {
                var oldIndex = evt.oldIndex;
                var newIndex = evt.newIndex;
                if (oldIndex !== newIndex) {
                    var moved = selectedFiles.splice(oldIndex, 1)[0];
                    selectedFiles.splice(newIndex, 0, moved);
                    var items = fileList.querySelectorAll('.file-item');
                    items.forEach(function(item, idx) {
                        item.dataset.index = idx;
                    });
                }
            }
        });
    }

    // ===== RESET MERGE STATE =====
    function resetMergeState() {
        mergedBlob = null;
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
    }

    // ===== ADD FILES =====
    function addFiles(files) {
        var valid = true;
        for (var i = 0; i < files.length; i++) {
            if (files[i].type !== 'application/pdf') {
                showError('Please upload only PDF files.');
                valid = false;
                continue;
            }
            selectedFiles.push(files[i]);
        }
        if (valid) {
            updateFileList();
            resetMergeState();
            hideError();
        }
        fileInput.value = '';
    }

    // ===== HANDLE DROP =====
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    });

    dropZone.addEventListener('click', function() {
        fileInput.click();
    });

    // ===== FILE INPUT =====
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            addFiles(this.files);
        }
    });

    // ===== ADD MORE =====
    addMoreBtn.addEventListener('click', function() {
        fileInput.click();
    });

    // ===== MERGE PDFS (WITHOUT COMPRESSION) =====
    mergeBtn.addEventListener('click', function() {
        if (selectedFiles.length === 0) {
            showError('Please add at least one PDF file.');
            return;
        }

        if (selectedFiles.length === 1) {
            var singleBlob = new Blob([selectedFiles[0]], { type: 'application/pdf' });
            downloadBlob(singleBlob, outputName.value.trim() || 'merged.pdf');
            return;
        }

        var name = outputName.value.trim() || 'merged.pdf';
        if (!name.toLowerCase().endsWith('.pdf')) {
            name += '.pdf';
        }

        progressContainer.style.display = 'block';
        progressLabel.textContent = 'Merging PDFs...';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        mergeBtn.disabled = true;
        hideError();

        var { PDFDocument } = PDFLib;
        var mergedPdf = PDFDocument.create();

        var totalFiles = selectedFiles.length;
        var processed = 0;

        selectedFiles.forEach(function(file, fileIndex) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var bytes = new Uint8Array(e.target.result);
                PDFDocument.load(bytes)
                    .then(function(doc) {
                        var pages = doc.getPages();
                        var copyPromises = pages.map(function(page, pageIndex) {
                            return mergedPdf.copyPages(doc, [pageIndex])
                                .then(function(copies) {
                                    mergedPdf.addPage(copies[0]);
                                });
                        });
                        return Promise.all(copyPromises);
                    })
                    .then(function() {
                        processed++;
                        var pct = Math.round((processed / totalFiles) * 100);
                        progressBar.style.width = pct + '%';
                        progressPercent.textContent = pct + '%';

                        if (processed === totalFiles) {
                            progressLabel.textContent = 'Generating merged PDF...';
                            // ===== NO COMPRESSION =====
                            mergedPdf.save({ compress: false })
                                .then(function(pdfBytes) {
                                    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
                                    mergedBlob = blob;
                                    progressBar.style.width = '100%';
                                    progressPercent.textContent = '100%';
                                    progressLabel.textContent = 'Done!';
                                    mergeBtn.disabled = false;
                                    downloadBlob(blob, name);
                                })
                                .catch(function(err) {
                                    showError('Failed to merge PDFs: ' + err.message);
                                    mergeBtn.disabled = false;
                                    progressContainer.style.display = 'none';
                                    console.error(err);
                                });
                        }
                    })
                    .catch(function(err) {
                        showError('Failed to load PDF: ' + file.name + ' - ' + err.message);
                        mergeBtn.disabled = false;
                        progressContainer.style.display = 'none';
                        console.error(err);
                    });
            };
            reader.readAsArrayBuffer(file);
        });
    });

    // ===== DOWNLOAD =====
    function downloadBlob(blob, name) {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function() {
            URL.revokeObjectURL(link.href);
        }, 5000);
        hideError();
    }

    // ===== RESET =====
    resetBtn.addEventListener('click', function() {
        selectedFiles = [];
        updateFileList();
        resetMergeState();
        outputName.value = 'merged.pdf';
        mergeBtn.disabled = false;
        hideError();
        fileInput.value = '';
    });

    // ===== INIT =====
    updateFileList();

})();
