// ============================================================
//  FILE ARCHIVER – Yadav Web Tools
//  External JavaScript – Handles ZIP creation and download
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
    var archiveName = document.getElementById('archiveName');
    var compressionLevel = document.getElementById('compressionLevel');
    var zipPassword = document.getElementById('zipPassword');
    var createZipBtn = document.getElementById('createZipBtn');
    var resetBtn = document.getElementById('resetBtn');
    var progressContainer = document.getElementById('progressContainer');
    var progressLabel = document.getElementById('progressLabel');
    var progressPercent = document.getElementById('progressPercent');
    var progressBar = document.getElementById('progressBar');
    var downloadContainer = document.getElementById('downloadContainer');
    var downloadBtn = document.getElementById('downloadBtn');
    var errorMsg = document.getElementById('errorMsg');

    // ===== STATE =====
    var selectedFiles = [];
    var zipBlob = null;

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

        // Attach remove event listeners
        document.querySelectorAll('.file-remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var index = parseInt(this.dataset.index);
                selectedFiles.splice(index, 1);
                updateFileList();
                resetDownloadState();
                hideError();
            });
        });
    }

    // ===== RESET DOWNLOAD STATE =====
    function resetDownloadState() {
        zipBlob = null;
        downloadContainer.style.display = 'none';
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
    }

    // ===== ADD FILES =====
    function addFiles(files) {
        for (var i = 0; i < files.length; i++) {
            selectedFiles.push(files[i]);
        }
        updateFileList();
        resetDownloadState();
        hideError();
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
            this.value = '';
        }
    });

    // ===== ADD MORE FILES =====
    addMoreBtn.addEventListener('click', function() {
        fileInput.click();
    });

    // ===== CREATE ZIP =====
    createZipBtn.addEventListener('click', function() {
        if (selectedFiles.length === 0) {
            showError('Please add at least one file.');
            return;
        }

        var name = archiveName.value.trim() || 'archive.zip';
        if (!name.toLowerCase().endsWith('.zip')) {
            name += '.zip';
        }
        var level = parseInt(compressionLevel.value) || 6;
        var password = zipPassword.value.trim();

        // Show progress
        progressContainer.style.display = 'block';
        progressLabel.textContent = 'Compressing files...';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        createZipBtn.disabled = true;
        downloadContainer.style.display = 'none';
        hideError();

        var zip = new JSZip();

        // Add files to zip
        var totalFiles = selectedFiles.length;
        var processed = 0;

        selectedFiles.forEach(function(file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var fileName = file.webkitRelativePath || file.name;
                zip.file(fileName, e.target.result);

                processed++;
                var pct = Math.round((processed / totalFiles) * 100);
                progressBar.style.width = pct + '%';
                progressPercent.textContent = pct + '%';

                if (processed === totalFiles) {
                    // All files added, generate zip
                    generateZip(zip, name, level, password);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    });

    // ===== GENERATE ZIP =====
    function generateZip(zip, name, level, password) {
        progressLabel.textContent = 'Creating ZIP archive...';
        progressBar.style.width = '50%';
        progressPercent.textContent = '50%';

        var options = {
            compression: level === 0 ? 'STORE' : 'DEFLATE',
            compressionOptions: level > 0 ? { level: level } : undefined,
            type: 'blob'
        };

        if (password) {
            options.password = password;
        }

        zip.generateAsync(options, function(metadata) {
            var pct = Math.round(metadata.percent);
            progressBar.style.width = pct + '%';
            progressPercent.textContent = pct + '%';
        }).then(function(blob) {
            zipBlob = blob;
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';
            progressLabel.textContent = 'Done!';
            createZipBtn.disabled = false;

            // Show download button
            downloadContainer.style.display = 'block';
        }).catch(function(err) {
            showError('Failed to create ZIP: ' + err.message);
            createZipBtn.disabled = false;
            progressContainer.style.display = 'none';
            console.error(err);
        });
    }

    // ===== DOWNLOAD ZIP =====
    downloadBtn.addEventListener('click', function() {
        if (!zipBlob) {
            showError('No ZIP file available. Please create one first.');
            return;
        }
        var name = archiveName.value.trim() || 'archive.zip';
        if (!name.toLowerCase().endsWith('.zip')) {
            name += '.zip';
        }
        var link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function() {
            URL.revokeObjectURL(link.href);
        }, 5000);
        hideError();
    });

    // ===== RESET =====
    resetBtn.addEventListener('click', function() {
        selectedFiles = [];
        updateFileList();
        resetDownloadState();
        archiveName.value = 'archive.zip';
        compressionLevel.value = '6';
        zipPassword.value = '';
        createZipBtn.disabled = false;
        hideError();
        fileInput.value = '';
    });

    // ===== INIT =====
    updateFileList();

})();
