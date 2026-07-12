(function() {
    'use strict';

    // ============================================================
    // 1. DOM REFERENCES
    // ============================================================
    const form = document.getElementById('resumeForm');
    const previewBtn = document.getElementById('previewBtn');
    const resetBtn = document.querySelector('button[type="reset"]');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const previewDiv = document.getElementById('resumePreview');
    const a4Container = document.getElementById('resumeA4');
    const errorMsg = document.getElementById('errorMsg');
    const photoUpload = document.getElementById('photoUpload');
    const declarationCheck = document.getElementById('declarationCheck');

    // ============================================================
    // 2. COUNTERS FOR ADD MORE BUTTONS (Max 3 entries each)
    // ============================================================
    let eduCount = 3;  // starts with 3
    let otherCount = 3; // starts with 3

    // ============================================================
    // 3. ADD / REMOVE FUNCTIONS
    // ============================================================

    // ----- Add Education -----
    window.addEducation = function() {
        const container = document.getElementById('educationContainer');
        const addBtn = document.getElementById('addEduBtn');

        if (eduCount >= 3) {
            showError('Maximum 3 educational entries allowed.');
            return;
        }

        const entry = document.createElement('div');
        entry.className = 'entry-group edu-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeEntry(this, 'edu-entry')">×</button>
            <div class="field-group">
                <label>Exam Name <span class="required">*</span></label>
                <input type="text" class="edu-exam" placeholder="e.g. HSLC" required />
            </div>
            <div class="field-group">
                <label>Board/University <span class="required">*</span></label>
                <input type="text" class="edu-board" placeholder="e.g. SEBA" required />
            </div>
            <div class="field-group">
                <label>Passing Year <span class="required">*</span></label>
                <input type="number" class="edu-year" placeholder="e.g. 2020" required />
            </div>
            <div class="field-group">
                <label>Percentage <span class="required">*</span></label>
                <input type="number" class="edu-percent" step="0.01" placeholder="e.g. 75" required />
            </div>
            <div class="field-group">
                <label>Division <span class="required">*</span></label>
                <select class="edu-division" required>
                    <option value="">-- Select Division --</option>
                    <option value="1st Division">1st Division</option>
                    <option value="2nd Division">2nd Division</option>
                    <option value="3rd Division">3rd Division</option>
                </select>
            </div>
        `;

        container.appendChild(entry);
        eduCount++;
        updateAddButtons();
        hideError();

        // Scroll to new entry
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // ----- Add Other Qualification -----
    window.addOther = function() {
        const container = document.getElementById('otherContainer');
        const addBtn = document.getElementById('addOtherBtn');

        if (otherCount >= 3) {
            showError('Maximum 3 other qualification entries allowed.');
            return;
        }

        const entry = document.createElement('div');
        entry.className = 'entry-group other-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeEntry(this, 'other-entry')">×</button>
            <div class="field-group">
                <label>Qualification Name <span class="required">*</span></label>
                <input type="text" class="other-name" placeholder="e.g. Web Development" required />
            </div>
            <div class="field-group">
                <label>Institute/Organization <span class="required">*</span></label>
                <input type="text" class="other-institute" placeholder="e.g. Self-Learned" required />
            </div>
            <div class="field-group">
                <label>Passing Year <span class="required">*</span></label>
                <input type="number" class="other-year" placeholder="e.g. 2024" required />
            </div>
            <div class="field-group">
                <label>Score/Grade <span class="required">*</span></label>
                <input type="text" class="other-score" placeholder="e.g. A" required />
            </div>
            <div class="field-group">
                <label>Duration <span class="required">*</span></label>
                <input type="text" class="other-duration" placeholder="e.g. 6 months" required />
            </div>
        `;

        container.appendChild(entry);
        otherCount++;
        updateAddButtons();
        hideError();

        // Scroll to new entry
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // ----- Remove Entry -----
    window.removeEntry = function(btn, className) {
        const entries = document.querySelectorAll('.' + className);
        if (entries.length <= 1) {
            showError('You must have at least one entry.');
            return;
        }

        const entryGroup = btn.closest('.entry-group');
        entryGroup.remove();

        if (className === 'edu-entry') {
            eduCount--;
        } else if (className === 'other-entry') {
            otherCount--;
        }

        updateAddButtons();
        hideError();
    };

    // ----- Update Add Buttons State -----
    function updateAddButtons() {
        const eduBtn = document.getElementById('addEduBtn');
        const otherBtn = document.getElementById('addOtherBtn');

        if (eduBtn) {
            eduBtn.disabled = (eduCount >= 3);
        }
        if (otherBtn) {
            otherBtn.disabled = (otherCount >= 3);
        }
    }

    // ============================================================
    // 4. ERROR HANDLING
    // ============================================================
    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }

    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    // ============================================================
    // 5. VALIDATION & GREEN HIGHLIGHT
    // ============================================================
    function validateForm() {
        let isValid = true;
        let firstError = null;
        const requiredFields = form.querySelectorAll('[required]');

        // Remove previous highlights
        document.querySelectorAll('.field-group.highlight, .field-group.error').forEach(function(el) {
            el.classList.remove('highlight', 'error');
        });

        requiredFields.forEach(function(field) {
            const fieldGroup = field.closest('.field-group');
            if (!fieldGroup) return;

            if (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA') {
                const value = field.value.trim();

                // Special check for checkbox
                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        fieldGroup.classList.add('error');
                        isValid = false;
                        if (!firstError) firstError = fieldGroup;
                    }
                    return;
                }

                if (!value || value === '' || value === '-- Select Gender --' || value === '-- Select Category --' ||
                    value === '-- Select Marital Status --' || value === '-- Select Division --') {
                    fieldGroup.classList.add('error');
                    isValid = false;
                    if (!firstError) firstError = fieldGroup;
                } else {
                    fieldGroup.classList.add('highlight');
                }
            }
        });

        // Check declaration checkbox
        const declField = declarationCheck.closest('.declaration-area');
        if (!declarationCheck.checked) {
            if (declField) {
                declField.style.border = '2px solid #c0392b';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#fef6f6';
            }
            isValid = false;
            if (!firstError) firstError = declField;
        } else {
            if (declField) {
                declField.style.border = '2px solid #27ae60';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#f0faf4';
            }
        }

        // Scroll to first error
        if (firstError) {
            setTimeout(function() {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.style.transition = 'box-shadow 0.3s';
                firstError.style.boxShadow = '0 0 0 4px rgba(192,57,43,0.2)';
                setTimeout(function() {
                    firstError.style.boxShadow = 'none';
                }, 2000);
            }, 100);
            showError('Please fill all required fields (marked with *).');
        } else {
            hideError();
        }

        return isValid;
    }

    // ============================================================
    // 6. FORMAT DATE
    // ============================================================
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }

    // ============================================================
    // 7. SAFE VALUE
    // ============================================================
    function safeValue(el) {
        return el ? el.value || '' : '';
    }

    // ============================================================
    // 8. GENERATE RESUME PREVIEW
    // ============================================================
    function generateResume() {
        // Validate first
        if (!validateForm()) {
            return;
        }

        // Collect data
        const fullName = safeValue(document.getElementById('fullName')) || 'Yadav Subba';
        const fatherName = safeValue(document.getElementById('fatherName'));
        const motherName = safeValue(document.getElementById('motherName'));
        const mobile = safeValue(document.getElementById('mobileNo'));
        const email = safeValue(document.getElementById('emailAddress'));
        const dob = safeValue(document.getElementById('dob'));
        const gender = safeValue(document.getElementById('gender'));
        const languages = safeValue(document.getElementById('languages'));
        const address = safeValue(document.getElementById('address'));
        const category = safeValue(document.getElementById('category'));
        const maritalStatus = safeValue(document.getElementById('maritalStatus'));
        const experience = safeValue(document.getElementById('experience'));

        const dobFormatted = formatDate(dob);

        // ----- Personal Details Table -----
        const details = [
            { label: 'Father\'s Name', value: fatherName },
            { label: 'Mother\'s Name', value: motherName },
            { label: 'Mobile', value: mobile },
            { label: 'Email', value: email },
            { label: 'Date of Birth', value: dobFormatted },
            { label: 'Gender', value: gender },
            { label: 'Languages', value: languages },
            { label: 'Address', value: address },
            { label: 'Category', value: category },
            { label: 'Marital Status', value: maritalStatus }
        ];

        let detailsHTML = '';
        details.forEach(function(item) {
            if (item.value) {
                detailsHTML += `
                    <tr>
                        <td class="label-cell">${item.label}</td>
                        <td class="value-cell">${item.value}</td>
                    </tr>
                `;
            }
        });

        // ----- Education Table -----
        const eduEntries = document.querySelectorAll('.edu-entry');
        let eduRows = '';
        eduEntries.forEach(function(entry) {
            const exam = entry.querySelector('.edu-exam').value || '';
            const board = entry.querySelector('.edu-board').value || '';
            const year = entry.querySelector('.edu-year').value || '';
            const percent = entry.querySelector('.edu-percent').value || '';
            const division = entry.querySelector('.edu-division').value || '';
            if (exam || board || year) {
                eduRows += `
                    <tr>
                        <td>${exam}</td>
                        <td>${board}</td>
                        <td>${year}</td>
                        <td>${percent}%</td>
                        <td>${division}</td>
                    </tr>
                `;
            }
        });

        let eduHTML = '';
        if (eduRows) {
            eduHTML = `
                <div class="section-wrapper">
                    <div class="section-head">Educational Qualifications</div>
                    <table class="edu-table">
                        <thead>
                            <tr><th>Exam</th><th>Board/University</th><th>Year</th><th>Percentage</th><th>Division</th></tr>
                        </thead>
                        <tbody>${eduRows}</tbody>
                    </table>
                </div>
            `;
        }

        // ----- Other Qualifications Table -----
        const otherEntries = document.querySelectorAll('.other-entry');
        let otherRows = '';
        otherEntries.forEach(function(entry) {
            const name = entry.querySelector('.other-name').value || '';
            const institute = entry.querySelector('.other-institute').value || '';
            const year = entry.querySelector('.other-year').value || '';
            const score = entry.querySelector('.other-score').value || '';
            const duration = entry.querySelector('.other-duration').value || '';
            if (name || institute) {
                otherRows += `
                    <tr>
                        <td>${name}</td>
                        <td>${institute}</td>
                        <td>${year}</td>
                        <td>${score}</td>
                        <td>${duration}</td>
                    </tr>
                `;
            }
        });

        let otherHTML = '';
        if (otherRows) {
            otherHTML = `
                <div class="section-wrapper">
                    <div class="section-head">Other Qualifications</div>
                    <table class="other-table">
                        <thead>
                            <tr><th>Qualification</th><th>Institute</th><th>Year</th><th>Score/Grade</th><th>Duration</th></tr>
                        </thead>
                        <tbody>${otherRows}</tbody>
                    </table>
                </div>
            `;
        }

        // ----- Experience -----
        let expHTML = '';
        if (experience) {
            expHTML = `
                <div class="section-wrapper">
                    <div class="section-head">Experience</div>
                    <div class="experience-box">${experience}</div>
                </div>
            `;
        }

        // ----- Build Full Resume -----
        a4Container.innerHTML = `
            <!-- HEADER -->
            <div class="header">
                <div class="name-title">
                    <h1>${fullName}</h1>
                    <div class="tagline">Web Developer &amp; Content Writer</div>
                </div>
                <div class="photo-wrap" id="photoPreview">
                    <span>Photo</span>
                </div>
            </div>

            <!-- PERSONAL DETAILS -->
            <div class="section-wrapper">
                <div class="section-head">Personal Details</div>
                <table class="resume-table">
                    <tbody>${detailsHTML}</tbody>
                </table>
            </div>

            ${expHTML}
            ${eduHTML}
            ${otherHTML}

            <!-- DECLARATION -->
            <div class="declaration">
                <strong>Declaration:</strong> I hereby declare that the above particulars of facts and information stated are true, correct and complete to the best of my belief and knowledge.
            </div>
        `;

        // ----- Handle Photo -----
        const photoPreview = document.getElementById('photoPreview');
        if (photoUpload.files && photoUpload.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo" />`;
            };
            reader.readAsDataURL(photoUpload.files[0]);
        } else {
            photoPreview.innerHTML = `<span>Photo</span>`;
        }

        // ----- Show Preview -----
        previewDiv.classList.add('active');
        previewDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        hideError();
    }

    // ============================================================
    // 9. EVENT LISTENERS
    // ============================================================

    // ----- Preview Button -----
    previewBtn.addEventListener('click', generateResume);

    // ----- Close Preview -----
    closePreviewBtn.addEventListener('click', function() {
        previewDiv.classList.remove('active');
    });

    // ----- Reset -----
    resetBtn.addEventListener('click', function(e) {
        // Let default reset happen first, then clean up
        setTimeout(function() {
            previewDiv.classList.remove('active');
            hideError();

            // Reset highlight styles
            document.querySelectorAll('.field-group.highlight, .field-group.error').forEach(function(el) {
                el.classList.remove('highlight', 'error');
            });

            // Reset declaration border
            const declField = declarationCheck.closest('.declaration-area');
            if (declField) {
                declField.style.border = 'none';
                declField.style.padding = '8px 0';
                declField.style.background = 'transparent';
            }

            // Reset add buttons
            eduCount = document.querySelectorAll('.edu-entry').length;
            otherCount = document.querySelectorAll('.other-entry').length;
            updateAddButtons();
        }, 50);
    });

    // ----- Declaration Checkbox Highlight -----
    declarationCheck.addEventListener('change', function() {
        const declField = this.closest('.declaration-area');
        if (declField) {
            if (this.checked) {
                declField.style.border = '2px solid #27ae60';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#f0faf4';
            } else {
                declField.style.border = '2px solid #c0392b';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#fef6f6';
            }
        }
        hideError();
    });

    // ----- Live Validation on Input -----
    form.querySelectorAll('input, select, textarea').forEach(function(field) {
        field.addEventListener('input', function() {
            const fieldGroup = this.closest('.field-group');
            if (!fieldGroup) return;

            const value = this.value.trim();
            if (this.hasAttribute('required')) {
                if (value && value !== '' && value !== '-- Select Gender --' &&
                    value !== '-- Select Category --' && value !== '-- Select Marital Status --' &&
                    value !== '-- Select Division --') {
                    fieldGroup.classList.remove('error');
                    fieldGroup.classList.add('highlight');
                } else {
                    fieldGroup.classList.remove('highlight');
                    fieldGroup.classList.add('error');
                }
            }
            hideError();
        });

        field.addEventListener('change', function() {
            const fieldGroup = this.closest('.field-group');
            if (!fieldGroup) return;

            const value = this.value.trim();
            if (this.hasAttribute('required')) {
                if (value && value !== '' && value !== '-- Select Gender --' &&
                    value !== '-- Select Category --' && value !== '-- Select Marital Status --' &&
                    value !== '-- Select Division --') {
                    fieldGroup.classList.remove('error');
                    fieldGroup.classList.add('highlight');
                } else {
                    fieldGroup.classList.remove('highlight');
                    fieldGroup.classList.add('error');
                }
            }
            hideError();
        });
    });

    // ============================================================
    // 10. PHOTO UPLOAD LABEL
    // ============================================================
    photoUpload.addEventListener('change', function() {
        const label = this.closest('.field-group').querySelector('.file-label');
        if (this.files && this.files[0]) {
            const sizeKB = (this.files[0].size / 1024).toFixed(1);
            label.textContent = this.files[0].name + ' (' + sizeKB + ' KB)';
        } else {
            label.textContent = 'Passport Size Photo (100KB)';
        }
    });

    // ============================================================
    // 11. INITIALIZATION
    // ============================================================
    function init() {
        // Update add button states
        eduCount = document.querySelectorAll('.edu-entry').length;
        otherCount = document.querySelectorAll('.other-entry').length;
        updateAddButtons();

        // Initial highlight for pre-filled fields
        form.querySelectorAll('[required]').forEach(function(field) {
            const fieldGroup = field.closest('.field-group');
            if (!fieldGroup) return;

            const value = field.value.trim();
            if (value && value !== '' && value !== '-- Select Gender --' &&
                value !== '-- Select Category --' && value !== '-- Select Marital Status --' &&
                value !== '-- Select Division --') {
                fieldGroup.classList.add('highlight');
            }
        });

        // Declaration initial state
        if (declarationCheck.checked) {
            const declField = declarationCheck.closest('.declaration-area');
            if (declField) {
                declField.style.border = '2px solid #27ae60';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#f0faf4';
            }
        }
    }

    init();

})();
