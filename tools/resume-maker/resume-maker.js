(function() {
    'use strict';

    // ============================================================
    // 1. DOM REFERENCES
    // ============================================================
    const form = document.getElementById('resumeForm');
    const previewBtn = document.getElementById('previewBtn');
    const resetBtn = document.querySelector('button[type="reset"]');
    const errorMsg = document.getElementById('errorMsg');
    const photoUpload = document.getElementById('photoUpload');
    const declarationCheck = document.getElementById('declarationCheck');

    const experienceType = document.getElementById('experienceType');
    const fresherContainer = document.getElementById('fresherContainer');
    const experiencedContainer = document.getElementById('experiencedContainer');

    const summarySelect = document.getElementById('summarySelect');
    const customSummaryContainer = document.getElementById('customSummaryContainer');

    const languageSelect = document.getElementById('languageSelect');
    const languageTags = document.getElementById('languageTags');
    let selectedLanguages = [];

    let eduCount = 1;
    let otherCount = 1;
    let expCount = 1;

    // ============================================================
    // 2. LANGUAGE BADGE SYSTEM
    // ============================================================
    function updateLanguageTags() {
        languageTags.innerHTML = '';
        selectedLanguages.forEach(function(lang) {
            const tag = document.createElement('span');
            tag.className = 'language-tag';
            tag.innerHTML = lang + ' <span class="tag-remove">&times;</span>';
            tag.addEventListener('click', function() {
                const idx = selectedLanguages.indexOf(lang);
                if (idx > -1) {
                    selectedLanguages.splice(idx, 1);
                    updateLanguageTags();
                    validateField(languageSelect.closest('.field-group'));
                }
            });
            languageTags.appendChild(tag);
        });
        validateField(languageSelect.closest('.field-group'));
    }

    languageSelect.addEventListener('change', function() {
        const val = this.value;
        if (!val) return;
        if (selectedLanguages.includes(val)) {
            showError('Language already added.');
            return;
        }
        if (selectedLanguages.length >= 5) {
            showError('Maximum 5 languages allowed.');
            return;
        }
        selectedLanguages.push(val);
        updateLanguageTags();
        this.value = '';
        hideError();
    });

    // ============================================================
    // 3. PROFESSIONAL SUMMARY - CUSTOM TOGGLE
    // ============================================================
    summarySelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customSummaryContainer.style.display = 'flex';
        } else {
            customSummaryContainer.style.display = 'none';
        }
    });

    // ============================================================
    // 4. EXPERIENCE TYPE TOGGLE
    // ============================================================
    experienceType.addEventListener('change', function() {
        const val = this.value;
        if (val === 'fresher') {
            fresherContainer.style.display = 'flex';
            experiencedContainer.style.display = 'none';
        } else if (val === 'experienced') {
            fresherContainer.style.display = 'none';
            experiencedContainer.style.display = 'block';
        } else {
            fresherContainer.style.display = 'none';
            experiencedContainer.style.display = 'none';
        }
    });

    // ============================================================
    // 5. ADD / REMOVE FUNCTIONS
    // ============================================================
    window.addEducation = function() {
        if (eduCount >= 3) { showError('Maximum 3 educational entries allowed.'); return; }
        const container = document.getElementById('educationContainer');
        const entry = document.createElement('div');
        entry.className = 'entry-group edu-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeEntry(this, 'edu-entry')">×</button>
            <div class="field-group"><label>Exam Name <span class="required">*</span></label><input type="text" class="edu-exam" placeholder="Enter exam name" /></div>
            <div class="field-group"><label>Board/University <span class="required">*</span></label><input type="text" class="edu-board" placeholder="Enter board/university" /></div>
            <div class="field-group"><label>Passing Year <span class="required">*</span></label><input type="number" class="edu-year" placeholder="Enter year" /></div>
            <div class="field-group"><label>Percentage <span class="required">*</span></label><input type="number" class="edu-percent" step="0.01" placeholder="Enter percentage" /></div>
            <div class="field-group"><label>Division <span class="required">*</span></label><select class="edu-division"><option value="">-- Select Division --</option><option value="1st Division">1st Division</option><option value="2nd Division">2nd Division</option><option value="3rd Division">3rd Division</option></select></div>
        `;
        container.appendChild(entry);
        eduCount++;
        updateAddButtons();
        hideError();
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.addOther = function() {
        if (otherCount >= 3) { showError('Maximum 3 other qualification entries allowed.'); return; }
        const container = document.getElementById('otherContainer');
        const entry = document.createElement('div');
        entry.className = 'entry-group other-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeEntry(this, 'other-entry')">×</button>
            <div class="field-group"><label>Qualification Name <span class="required">*</span></label><input type="text" class="other-name" placeholder="Enter qualification name" /></div>
            <div class="field-group"><label>Institute <span class="required">*</span></label><input type="text" class="other-institute" placeholder="Enter institute name" /></div>
            <div class="field-group"><label>Passing Year <span class="required">*</span></label><input type="number" class="other-year" placeholder="Enter year" /></div>
            <div class="field-group"><label>Score/Grade <span class="required">*</span></label><input type="text" class="other-score" placeholder="Enter score or grade" /></div>
            <div class="field-group"><label>Duration <span class="required">*</span></label><input type="text" class="other-duration" placeholder="Enter duration" /></div>
        `;
        container.appendChild(entry);
        otherCount++;
        updateAddButtons();
        hideError();
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.addExperience = function() {
        if (expCount >= 3) { showError('Maximum 3 experience entries allowed.'); return; }
        const container = document.getElementById('experienceEntries');
        const entry = document.createElement('div');
        entry.className = 'entry-group exp-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeExpEntry(this)">×</button>
            <div class="field-group"><label>Organization <span class="required">*</span></label><input type="text" class="exp-org" placeholder="Organization name" /></div>
            <div class="field-group"><label>Designation <span class="required">*</span></label><input type="text" class="exp-designation" placeholder="Your job title" /></div>
            <div class="field-group"><label>Start Year <span class="required">*</span></label><input type="number" class="exp-start" placeholder="e.g. 2020" /></div>
            <div class="field-group"><label>End Year <span class="required">*</span></label><input type="number" class="exp-end" placeholder="e.g. 2022" /></div>
            <div class="field-group"><label>Work Description <span class="required">*</span></label><textarea class="exp-desc" rows="2" placeholder="Brief description of your responsibilities"></textarea></div>
        `;
        container.appendChild(entry);
        expCount++;
        updateAddButtons();
        hideError();
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.removeEntry = function(btn, className) {
        const entries = document.querySelectorAll('.' + className);
        if (entries.length <= 1) { showError('You must have at least one entry.'); return; }
        btn.closest('.entry-group').remove();
        if (className === 'edu-entry') eduCount--;
        else if (className === 'other-entry') otherCount--;
        updateAddButtons();
        hideError();
    };

    window.removeExpEntry = function(btn) {
        const entries = document.querySelectorAll('.exp-entry');
        if (entries.length <= 1) { showError('You must have at least one experience entry.'); return; }
        btn.closest('.entry-group').remove();
        expCount--;
        updateAddButtons();
        hideError();
    };

    function updateAddButtons() {
        const eduBtn = document.getElementById('addEduBtn');
        const otherBtn = document.getElementById('addOtherBtn');
        const expBtn = document.getElementById('addExpBtn');
        if (eduBtn) eduBtn.disabled = (eduCount >= 3);
        if (otherBtn) otherBtn.disabled = (otherCount >= 3);
        if (expBtn) expBtn.disabled = (expCount >= 3);
    }

    // ============================================================
    // 6. FIELD VALIDATION
    // ============================================================
    function validateField(fieldGroup) {
        if (!fieldGroup) return;
        const inputs = fieldGroup.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            if (input.hasAttribute('required')) {
                const value = input.value.trim();
                const isSelect = input.tagName === 'SELECT';
                const isPlaceholder = isSelect && (value === '' || value === '-- Select Gender --' ||
                    value === '-- Select Category --' || value === '-- Select Marital Status --' ||
                    value === '-- Select Division --' || value === '-- Select Professional Title --' ||
                    value === '-- Select Professional Summary --' || value === '-- Select --' ||
                    value === '-- Select a language --');
                if (value && !isPlaceholder) {
                    fieldGroup.classList.remove('error');
                    fieldGroup.classList.add('highlight');
                } else {
                    fieldGroup.classList.remove('highlight');
                    fieldGroup.classList.add('error');
                }
            }
        });
    }

    // ============================================================
    // 7. VALIDATION (Full Form) — SCROLL TO TOPMOST ERROR
    // ============================================================
    function validateForm() {
        let isValid = true;
        let firstError = null;

        document.querySelectorAll('.field-group.highlight, .field-group.error').forEach(function(el) {
            el.classList.remove('highlight', 'error');
        });

        // 1. Check all required fields in DOM order (top to bottom)
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(function(field) {
            const fieldGroup = field.closest('.field-group');
            if (!fieldGroup) return;

            if (field.type === 'checkbox') {
                if (!field.checked) {
                    fieldGroup.classList.add('error');
                    isValid = false;
                    if (!firstError) firstError = fieldGroup;
                }
                return;
            }

            const value = field.value.trim();
            const isSelect = field.tagName === 'SELECT';
            const isPlaceholder = isSelect && (value === '' || value === '-- Select Gender --' ||
                value === '-- Select Category --' || value === '-- Select Marital Status --' ||
                value === '-- Select Division --' || value === '-- Select Professional Title --' ||
                value === '-- Select Professional Summary --' || value === '-- Select --' ||
                value === '-- Select a language --');

            if (!value || isPlaceholder) {
                fieldGroup.classList.add('error');
                isValid = false;
                if (!firstError) firstError = fieldGroup;
            } else {
                fieldGroup.classList.add('highlight');
            }
        });

        // 2. Languages (special, not part of requiredFields because select has no 'required')
        if (selectedLanguages.length === 0) {
            const langField = languageSelect.closest('.field-group');
            if (langField) {
                langField.classList.add('error');
                isValid = false;
                if (!firstError) firstError = langField;
            }
        }

        // 3. Experience type
        const expTypeVal = experienceType.value;
        if (!expTypeVal) {
            const expField = experienceType.closest('.field-group');
            if (expField) {
                expField.classList.add('error');
                isValid = false;
                if (!firstError) firstError = expField;
            }
        }

        // 4. Fresher/Experienced specific
        if (expTypeVal === 'fresher') {
            const fresherText = document.getElementById('fresherSummary');
            if (!fresherText.value.trim()) {
                const fg = fresherText.closest('.field-group');
                if (fg) {
                    fg.classList.add('error');
                    isValid = false;
                    if (!firstError) firstError = fg;
                }
            }
        } else if (expTypeVal === 'experienced') {
            document.querySelectorAll('.exp-entry').forEach(function(entry) {
                const org = entry.querySelector('.exp-org');
                const des = entry.querySelector('.exp-designation');
                const start = entry.querySelector('.exp-start');
                const end = entry.querySelector('.exp-end');
                const desc = entry.querySelector('.exp-desc');
                [org, des, start, end, desc].forEach(function(input) {
                    if (input && !input.value.trim()) {
                        const fg = input.closest('.field-group');
                        if (fg) {
                            fg.classList.add('error');
                            isValid = false;
                            if (!firstError) firstError = fg;
                        }
                    }
                });
            });
        }

        // 5. Declaration
        if (!declarationCheck.checked) {
            const declField = declarationCheck.closest('.declaration-area');
            if (declField) {
                declField.style.border = '2px solid #c0392b';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#fef6f6';
            }
            isValid = false;
            if (!firstError) firstError = declarationCheck.closest('.declaration-area');
        } else {
            const declField = declarationCheck.closest('.declaration-area');
            if (declField) {
                declField.style.border = '2px solid #27ae60';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#f0faf4';
            }
        }

        // Scroll to the TOPMOST error (first one found)
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
    // 8. ERROR HANDLING
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
    // 9. HELPERS
    // ============================================================
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    function safeValue(el) { return el ? el.value || '' : ''; }

    // ============================================================
    // 10. GENERATE DIGITAL PDF (Text-based, not scan)
    // ============================================================
    function generatePDF() {
        if (!validateForm()) return;

        showSpinner();

        const fullName = safeValue(document.getElementById('fullName')) || 'Applicant';
        const professionalTitle = safeValue(document.getElementById('professionalTitle')) || 'Web Developer';
        const fatherName = safeValue(document.getElementById('fatherName'));
        const motherName = safeValue(document.getElementById('motherName'));
        const mobile = safeValue(document.getElementById('mobileNo'));
        const email = safeValue(document.getElementById('emailAddress'));
        const dob = safeValue(document.getElementById('dob'));
        const gender = safeValue(document.getElementById('gender'));
        const address = safeValue(document.getElementById('address'));
        const category = safeValue(document.getElementById('category'));
        const maritalStatus = safeValue(document.getElementById('maritalStatus'));
        const languages = selectedLanguages.join(', ');

        let summary = '';
        const summaryVal = summarySelect.value;
        if (summaryVal === 'custom') {
            summary = safeValue(document.getElementById('customSummary'));
        } else {
            summary = summaryVal;
        }

        const expType = experienceType.value;
        let experienceText = '';
        if (expType === 'fresher') {
            experienceText = safeValue(document.getElementById('fresherSummary'));
        } else if (expType === 'experienced') {
            const expEntries = document.querySelectorAll('.exp-entry');
            let expParts = [];
            expEntries.forEach(function(entry) {
                const org = safeValue(entry.querySelector('.exp-org'));
                const des = safeValue(entry.querySelector('.exp-designation'));
                const start = safeValue(entry.querySelector('.exp-start'));
                const end = safeValue(entry.querySelector('.exp-end'));
                const desc = safeValue(entry.querySelector('.exp-desc'));
                if (org || des) {
                    expParts.push(des + ' at ' + org + ' (' + start + ' - ' + end + ') - ' + desc);
                }
            });
            experienceText = expParts.join('\n');
        }

        const eduEntries = document.querySelectorAll('.edu-entry');
        let eduData = [];
        eduEntries.forEach(function(entry) {
            const exam = safeValue(entry.querySelector('.edu-exam'));
            const board = safeValue(entry.querySelector('.edu-board'));
            const year = safeValue(entry.querySelector('.edu-year'));
            const percent = safeValue(entry.querySelector('.edu-percent'));
            const division = safeValue(entry.querySelector('.edu-division'));
            if (exam || board || year) {
                eduData.push({ exam, board, year, percent, division });
            }
        });

        const otherEntries = document.querySelectorAll('.other-entry');
        let otherData = [];
        otherEntries.forEach(function(entry) {
            const name = safeValue(entry.querySelector('.other-name'));
            const institute = safeValue(entry.querySelector('.other-institute'));
            const year = safeValue(entry.querySelector('.other-year'));
            const score = safeValue(entry.querySelector('.other-score'));
            const duration = safeValue(entry.querySelector('.other-duration'));
            if (name || institute) {
                otherData.push({ name, institute, year, score, duration });
            }
        });

        const now = new Date();
        const currentDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let y = margin + 8; // extra top padding for name

        // Header: Name + Title (slightly down)
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(26, 92, 58);
        pdf.text(fullName, margin, y);
        y += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(61, 90, 78);
        pdf.text(professionalTitle, margin, y);
        y += 12;

        pdf.setDrawColor(26, 92, 58);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 8;

        // Personal Details
        const details = [
            ['Father\'s Name', fatherName],
            ['Mother\'s Name', motherName],
            ['Mobile', mobile],
            ['Email', email],
            ['Date of Birth', formatDate(dob)],
            ['Gender', gender],
            ['Languages', languages],
            ['Address', address],
            ['Category', category],
            ['Marital Status', maritalStatus]
        ].filter(row => row[1]);

        pdf.setFontSize(10);
        pdf.setTextColor(26, 92, 58);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Personal Details', margin, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        details.forEach(function(row) {
            if (row[1]) {
                pdf.setFont('helvetica', 'bold');
                pdf.text(row[0] + ':', margin, y);
                pdf.setFont('helvetica', 'normal');
                const labelWidth = pdf.getTextWidth(row[0] + ':');
                pdf.text(row[1], margin + labelWidth + 4, y);
                y += 6;
            }
        });
        y += 4;

        // Professional Summary (if any)
        if (summary) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(26, 92, 58);
            pdf.text('Professional Summary', margin, y);
            y += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 30, 30);
            const summaryLines = pdf.splitTextToSize(summary, pageWidth - margin * 2);
            pdf.text(summaryLines, margin, y);
            y += summaryLines.length * 5 + 4;
        }

        // Experience
        if (experienceText) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(26, 92, 58);
            pdf.text('Experience', margin, y);
            y += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 30, 30);
            const expLines = pdf.splitTextToSize(experienceText, pageWidth - margin * 2);
            pdf.text(expLines, margin, y);
            y += expLines.length * 5 + 4;
        }

        // Educational Qualifications
        if (eduData.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(26, 92, 58);
            pdf.text('Educational Qualifications', margin, y);
            y += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 30, 30);
            const col1 = margin, col2 = margin + 40, col3 = margin + 80, col4 = margin + 115, col5 = margin + 150;
            pdf.setFillColor(232, 236, 234);
            pdf.rect(col1, y - 4, pageWidth - margin * 2, 6, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Exam', col1, y);
            pdf.text('Board', col2, y);
            pdf.text('Year', col3, y);
            pdf.text('Percentage', col4, y);
            pdf.text('Division', col5, y);
            y += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 30, 30);
            eduData.forEach(function(e) {
                pdf.text(e.exam, col1, y);
                pdf.text(e.board, col2, y);
                pdf.text(e.year, col3, y);
                pdf.text(e.percent + '%', col4, y);
                pdf.text(e.division, col5, y);
                y += 5;
            });
            y += 4;
        }

        // Other Qualifications
        if (otherData.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(26, 92, 58);
            pdf.text('Other Qualifications', margin, y);
            y += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 30, 30);
            const col1 = margin, col2 = margin + 45, col3 = margin + 85, col4 = margin + 120, col5 = margin + 150;
            pdf.setFillColor(232, 236, 234);
            pdf.rect(col1, y - 4, pageWidth - margin * 2, 6, 'F');
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text('Qualification', col1, y);
            pdf.text('Institute', col2, y);
            pdf.text('Year', col3, y);
            pdf.text('Score', col4, y);
            pdf.text('Duration', col5, y);
            y += 6;
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(30, 30, 30);
            otherData.forEach(function(o) {
                pdf.text(o.name, col1, y);
                pdf.text(o.institute, col2, y);
                pdf.text(o.year, col3, y);
                pdf.text(o.score, col4, y);
                pdf.text(o.duration, col5, y);
                y += 5;
            });
            y += 4;
        }

        // Declaration – with justified alignment
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(45, 61, 50);
        const declText = 'Declaration: I hereby declare that the above particulars of facts and information stated are true, correct and complete to the best of my belief and knowledge.';
        const declLines = pdf.splitTextToSize(declText, pageWidth - margin * 2);
        // Justify each line (jsPDF supports 'justify' alignment)
        pdf.text(declLines, margin, y, { align: 'justify' });
        y += declLines.length * 5 + 8;

        // Footer: Date left, Name right
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 75, 75);
        pdf.setFontSize(9);
        pdf.text('Date: ' + currentDate, margin, pageHeight - 12);
        pdf.setTextColor(26, 92, 58);
        pdf.setFont('helvetica', 'bold');
        pdf.text(fullName, pageWidth - margin - pdf.getTextWidth(fullName), pageHeight - 12);

        const fileName = 'Resume_' + fullName.replace(/\s+/g, '_') + '.pdf';
        pdf.save(fileName);

        hideSpinner();
        showError('Resume downloaded successfully.');
        setTimeout(function() { hideError(); }, 3000);
    }

    // ============================================================
    // 11. SPINNER OVERLAY
    // ============================================================
    function showSpinner() {
        const overlay = document.createElement('div');
        overlay.id = 'spinnerOverlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255,255,255,0.7);
            backdrop-filter: blur(4px);
            display: flex; justify-content: center; align-items: center;
            z-index: 9999;
            flex-direction: column;
            gap: 10px;
        `;
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px; height: 50px;
            border: 4px solid #d4e4dc;
            border-top: 4px solid #1a5c3a;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        overlay.appendChild(spinner);
        const label = document.createElement('span');
        label.textContent = 'Generating PDF...';
        label.style.cssText = 'font-family: Arial; color: #1a5c3a; font-size: 1rem;';
        overlay.appendChild(label);
        document.body.appendChild(overlay);
    }

    function hideSpinner() {
        const overlay = document.getElementById('spinnerOverlay');
        if (overlay) overlay.remove();
    }

    // ============================================================
    // 12. EVENT LISTENERS
    // ============================================================
    previewBtn.addEventListener('click', generatePDF);

    resetBtn.addEventListener('click', function() {
        setTimeout(function() {
            hideSpinner();
            hideError();
            document.querySelectorAll('.field-group.highlight, .field-group.error').forEach(function(el) {
                el.classList.remove('highlight', 'error');
            });
            const declField = declarationCheck.closest('.declaration-area');
            if (declField) {
                declField.style.border = 'none';
                declField.style.padding = '8px 0';
                declField.style.background = 'transparent';
            }
            selectedLanguages = [];
            updateLanguageTags();
            languageSelect.value = '';
            experienceType.value = '';
            fresherContainer.style.display = 'none';
            experiencedContainer.style.display = 'none';
            summarySelect.value = '';
            customSummaryContainer.style.display = 'none';
            eduCount = document.querySelectorAll('.edu-entry').length;
            otherCount = document.querySelectorAll('.other-entry').length;
            expCount = document.querySelectorAll('.exp-entry').length;
            updateAddButtons();
        }, 50);
    });

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

    form.querySelectorAll('input, select, textarea').forEach(function(field) {
        field.addEventListener('input', function() {
            const fg = this.closest('.field-group');
            if (fg) validateField(fg);
            hideError();
        });
        field.addEventListener('change', function() {
            const fg = this.closest('.field-group');
            if (fg) validateField(fg);
            hideError();
        });
    });

    photoUpload.addEventListener('change', function() {
        const label = this.closest('.field-group').querySelector('.file-label');
        if (this.files && this.files[0]) {
            const sizeKB = (this.files[0].size / 1024).toFixed(1);
            label.textContent = this.files[0].name + ' (' + sizeKB + ' KB)';
        } else {
            label.textContent = 'Passport Size Photo (optional)';
        }
    });

    // ============================================================
    // 13. INITIALIZATION
    // ============================================================
    function init() {
        eduCount = document.querySelectorAll('.edu-entry').length;
        otherCount = document.querySelectorAll('.other-entry').length;
        expCount = document.querySelectorAll('.exp-entry').length;
        updateAddButtons();
        form.querySelectorAll('[required]').forEach(function(field) {
            const fg = field.closest('.field-group');
            if (fg) {
                const value = field.value.trim();
                const isSelect = field.tagName === 'SELECT';
                const isPlaceholder = isSelect && (value === '' || value === '-- Select Gender --' ||
                    value === '-- Select Category --' || value === '-- Select Marital Status --' ||
                    value === '-- Select Division --' || value === '-- Select Professional Title --' ||
                    value === '-- Select Professional Summary --' || value === '-- Select --' ||
                    value === '-- Select a language --');
                if (value && !isPlaceholder) {
                    fg.classList.add('highlight');
                }
            }
        });
        if (declarationCheck.checked) {
            const declField = declarationCheck.closest('.declaration-area');
            if (declField) {
                declField.style.border = '2px solid #27ae60';
                declField.style.borderRadius = '8px';
                declField.style.padding = '6px 10px';
                declField.style.background = '#f0faf4';
            }
        }
        updateLanguageTags();
        customSummaryContainer.style.display = 'none';
        fresherContainer.style.display = 'none';
        experiencedContainer.style.display = 'none';
    }
    init();

})();
