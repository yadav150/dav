(function() {
    'use strict';

    // ============================================================
    // 1. DOM REFERENCES
    // ============================================================
    const form = document.getElementById('resumeForm');
    const previewBtn = document.getElementById('previewBtn');
    const resetBtn = document.querySelector('button[type="reset"]');
    const previewDiv = document.getElementById('resumePreview');
    const a4Container = document.getElementById('resumeA4');
    const errorMsg = document.getElementById('errorMsg');
    const photoUpload = document.getElementById('photoUpload');
    const declarationCheck = document.getElementById('declarationCheck');

    // Experience type
    const experienceType = document.getElementById('experienceType');
    const fresherContainer = document.getElementById('fresherContainer');
    const experiencedContainer = document.getElementById('experiencedContainer');

    // Professional Summary
    const summarySelect = document.getElementById('summarySelect');
    const customSummaryContainer = document.getElementById('customSummaryContainer');

    // Language
    const languageSelect = document.getElementById('languageSelect');
    const languageTags = document.getElementById('languageTags');
    let selectedLanguages = [];

    // Counters
    let eduCount = 1;
    let otherCount = 1;
    let expCount = 1;

    // ============================================================
    // 2. LANGUAGE BADGE SYSTEM (Max 5, Fade Green Hover)
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

    // ----- Add Education -----
    window.addEducation = function() {
        if (eduCount >= 3) {
            showError('Maximum 3 educational entries allowed.');
            return;
        }
        const container = document.getElementById('educationContainer');
        const entry = document.createElement('div');
        entry.className = 'entry-group edu-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeEntry(this, 'edu-entry')">×</button>
            <div class="field-group">
                <label>Exam Name <span class="required">*</span></label>
                <input type="text" class="edu-exam" placeholder="Enter exam name" />
            </div>
            <div class="field-group">
                <label>Board/University <span class="required">*</span></label>
                <input type="text" class="edu-board" placeholder="Enter board/university" />
            </div>
            <div class="field-group">
                <label>Passing Year <span class="required">*</span></label>
                <input type="number" class="edu-year" placeholder="Enter year" />
            </div>
            <div class="field-group">
                <label>Percentage <span class="required">*</span></label>
                <input type="number" class="edu-percent" step="0.01" placeholder="Enter percentage" />
            </div>
            <div class="field-group">
                <label>Division <span class="required">*</span></label>
                <select class="edu-division">
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
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // ----- Add Other Qualification -----
    window.addOther = function() {
        if (otherCount >= 3) {
            showError('Maximum 3 other qualification entries allowed.');
            return;
        }
        const container = document.getElementById('otherContainer');
        const entry = document.createElement('div');
        entry.className = 'entry-group other-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeEntry(this, 'other-entry')">×</button>
            <div class="field-group">
                <label>Qualification Name <span class="required">*</span></label>
                <input type="text" class="other-name" placeholder="Enter qualification name" />
            </div>
            <div class="field-group">
                <label>Institute <span class="required">*</span></label>
                <input type="text" class="other-institute" placeholder="Enter institute name" />
            </div>
            <div class="field-group">
                <label>Passing Year <span class="required">*</span></label>
                <input type="number" class="other-year" placeholder="Enter year" />
            </div>
            <div class="field-group">
                <label>Score/Grade <span class="required">*</span></label>
                <input type="text" class="other-score" placeholder="Enter score or grade" />
            </div>
            <div class="field-group">
                <label>Duration <span class="required">*</span></label>
                <input type="text" class="other-duration" placeholder="Enter duration" />
            </div>
        `;
        container.appendChild(entry);
        otherCount++;
        updateAddButtons();
        hideError();
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // ----- Add Experience -----
    window.addExperience = function() {
        if (expCount >= 3) {
            showError('Maximum 3 experience entries allowed.');
            return;
        }
        const container = document.getElementById('experienceEntries');
        const entry = document.createElement('div');
        entry.className = 'entry-group exp-entry';
        entry.innerHTML = `
            <button type="button" class="remove-btn" onclick="removeExpEntry(this)">×</button>
            <div class="field-group">
                <label>Organization <span class="required">*</span></label>
                <input type="text" class="exp-org" placeholder="Organization name" />
            </div>
            <div class="field-group">
                <label>Designation <span class="required">*</span></label>
                <input type="text" class="exp-designation" placeholder="Your job title" />
            </div>
            <div class="field-group">
                <label>Start Year <span class="required">*</span></label>
                <input type="number" class="exp-start" placeholder="e.g. 2020" />
            </div>
            <div class="field-group">
                <label>End Year <span class="required">*</span></label>
                <input type="number" class="exp-end" placeholder="e.g. 2022" />
            </div>
            <div class="field-group">
                <label>Work Description <span class="required">*</span></label>
                <textarea class="exp-desc" rows="2" placeholder="Brief description of your responsibilities"></textarea>
            </div>
        `;
        container.appendChild(entry);
        expCount++;
        updateAddButtons();
        hideError();
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // ----- Remove Entry (Education / Other) -----
    window.removeEntry = function(btn, className) {
        const entries = document.querySelectorAll('.' + className);
        if (entries.length <= 1) {
            showError('You must have at least one entry.');
            return;
        }
        btn.closest('.entry-group').remove();
        if (className === 'edu-entry') eduCount--;
        else if (className === 'other-entry') otherCount--;
        updateAddButtons();
        hideError();
    };

    // ----- Remove Experience -----
    window.removeExpEntry = function(btn) {
        const entries = document.querySelectorAll('.exp-entry');
        if (entries.length <= 1) {
            showError('You must have at least one experience entry.');
            return;
        }
        btn.closest('.entry-group').remove();
        expCount--;
        updateAddButtons();
        hideError();
    };

    // ----- Update Add Buttons State -----
    function updateAddButtons() {
        const eduBtn = document.getElementById('addEduBtn');
        const otherBtn = document.getElementById('addOtherBtn');
        const expBtn = document.getElementById('addExpBtn');

        if (eduBtn) eduBtn.disabled = (eduCount >= 3);
        if (otherBtn) otherBtn.disabled = (otherCount >= 3);
        if (expBtn) expBtn.disabled = (expCount >= 3);
    }

    // ============================================================
    // 6. FIELD VALIDATION (Green Highlight)
    // ============================================================
    function validateField(fieldGroup) {
        if (!fieldGroup) return;
        const inputs = fieldGroup.querySelectorAll('input, select, textarea');
        let allValid = true;
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
                    allValid = false;
                }
            }
        });
        return allValid;
    }

    // ============================================================
    // 7. VALIDATION (Full Form)
    // ============================================================
    function validateForm() {
        let isValid = true;
        let firstError = null;

        // Reset all highlights
        document.querySelectorAll('.field-group.highlight, .field-group.error').forEach(function(el) {
            el.classList.remove('highlight', 'error');
        });

        // Check all required fields
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

        // Check languages
        if (selectedLanguages.length === 0) {
            const langField = languageSelect.closest('.field-group');
            if (langField) {
                langField.classList.add('error');
                isValid = false;
                if (!firstError) firstError = langField;
            }
        }

        // Check experience type
        const expTypeVal = experienceType.value;
        if (!expTypeVal) {
            const expField = experienceType.closest('.field-group');
            if (expField) {
                expField.classList.add('error');
                isValid = false;
                if (!firstError) firstError = expField;
            }
        }

        // Check fresher/experienced specific fields
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
            const expEntries = document.querySelectorAll('.exp-entry');
            expEntries.forEach(function(entry) {
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

        // Check declaration
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

    function safeValue(el) {
        return el ? el.value || '' : '';
    }

    function safeText(el) {
        return el ? el.textContent || '' : '';
    }

    // ============================================================
    // 10. GENERATE RESUME & AUTO-DOWNLOAD PDF
    // ============================================================
    function generateResume() {
        if (!validateForm()) return;

        // Collect data
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

        // Languages
        const languages = selectedLanguages.join(', ');

        // Professional Summary
        let summary = '';
        const summaryVal = summarySelect.value;
        if (summaryVal === 'custom') {
            summary = safeValue(document.getElementById('customSummary'));
        } else {
            summary = summaryVal;
        }

        // Experience
        const expType = experienceType.value;
        let expHTML = '';
        if (expType === 'fresher') {
            const fresherText = safeValue(document.getElementById('fresherSummary'));
            if (fresherText) {
                expHTML = `
                    <div class="section-wrapper">
                        <div class="section-head">Experience</div>
                        <div class="experience-box">${fresherText}</div>
                    </div>
                `;
            }
        } else if (expType === 'experienced') {
            const expEntries = document.querySelectorAll('.exp-entry');
            let expRows = '';
            let hasExp = false;
            expEntries.forEach(function(entry) {
                const org = safeValue(entry.querySelector('.exp-org'));
                const des = safeValue(entry.querySelector('.exp-designation'));
                const start = safeValue(entry.querySelector('.exp-start'));
                const end = safeValue(entry.querySelector('.exp-end'));
                const desc = safeValue(entry.querySelector('.exp-desc'));
                if (org || des) {
                    hasExp = true;
                    expRows += `
                        <div class="experience-item">
                            <div class="exp-org-title">${des} at ${org}</div>
                            <div class="exp-meta">${start} - ${end}</div>
                            <div class="exp-desc-text">${desc}</div>
                        </div>
                    `;
                }
            });
            if (hasExp) {
                expHTML = `
                    <div class="section-wrapper">
                        <div class="section-head">Experience</div>
                        <div class="experience-box">${expRows}</div>
                    </div>
                `;
            }
        }

        // Personal Details Table
        const details = [
            { label: 'Father\'s Name', value: fatherName },
            { label: 'Mother\'s Name', value: motherName },
            { label: 'Mobile', value: mobile },
            { label: 'Email', value: email },
            { label: 'Date of Birth', value: formatDate(dob) },
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

        // Education
        const eduEntries = document.querySelectorAll('.edu-entry');
        let eduRows = '';
        let hasEdu = false;
        eduEntries.forEach(function(entry) {
            const exam = safeValue(entry.querySelector('.edu-exam'));
            const board = safeValue(entry.querySelector('.edu-board'));
            const year = safeValue(entry.querySelector('.edu-year'));
            const percent = safeValue(entry.querySelector('.edu-percent'));
            const division = safeValue(entry.querySelector('.edu-division'));
            if (exam || board || year) {
                hasEdu = true;
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
        if (hasEdu) {
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

        // Other Qualifications
        const otherEntries = document.querySelectorAll('.other-entry');
        let otherRows = '';
        let hasOther = false;
        otherEntries.forEach(function(entry) {
            const name = safeValue(entry.querySelector('.other-name'));
            const institute = safeValue(entry.querySelector('.other-institute'));
            const year = safeValue(entry.querySelector('.other-year'));
            const score = safeValue(entry.querySelector('.other-score'));
            const duration = safeValue(entry.querySelector('.other-duration'));
            if (name || institute) {
                hasOther = true;
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
        if (hasOther) {
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

        // Summary
        let summaryHTML = '';
        if (summary) {
            summaryHTML = `
                <div class="section-wrapper">
                    <div class="section-head">Professional Summary</div>
                    <div class="summary-box">${summary}</div>
                </div>
            `;
        }

        // Current date
        const now = new Date();
        const currentDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // Build Full Resume
        a4Container.innerHTML = `
            <div class="header">
                <div class="name-title">
                    <h1>${fullName}</h1>
                    <div class="tagline">${professionalTitle}</div>
                </div>
                <div class="photo-wrap" id="photoPreview">
                    <span class="placeholder-icon">👤</span>
                </div>
            </div>

            <div class="section-wrapper">
                <div class="section-head">Personal Details</div>
                <table class="resume-table">
                    <tbody>${detailsHTML}</tbody>
                </table>
            </div>

            ${summaryHTML}
            ${expHTML}
            ${eduHTML}
            ${otherHTML}

            <div class="declaration">
                <strong>Declaration:</strong> I hereby declare that the above particulars of facts and information stated are true, correct and complete to the best of my belief and knowledge.
            </div>

            <div class="resume-footer">
                <span class="footer-left">Date: ${currentDate}</span>
                <span class="footer-right">${fullName}</span>
            </div>
        `;

        // Handle photo
        const photoPreview = document.getElementById('photoPreview');
        if (photoUpload.files && photoUpload.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo" />`;
                generatePDF(fullName);
            };
            reader.readAsDataURL(photoUpload.files[0]);
        } else {
            // Placeholder remains
            generatePDF(fullName);
        }

        previewDiv.classList.add('active');
        hideError();
    }

    // ============================================================
    // 11. GENERATE PDF (Auto-Download, No Emojis, No Success Messages)
    // ============================================================
    function generatePDF(fullName) {
        previewBtn.textContent = 'Generating...';
        previewBtn.disabled = true;

        const element = a4Container;

        html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: element.scrollWidth,
            height: element.scrollHeight,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        }).then(function(canvas) {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdfHeight;
            }

            const fileName = 'Resume_' + fullName.replace(/\s+/g, '_') + '.pdf';
            pdf.save(fileName);

            previewBtn.textContent = 'Generate Resume';
            previewBtn.disabled = false;

            // Professional success indicator (no emoji, no casual text)
            showError('Resume downloaded successfully.');
            setTimeout(function() {
                hideError();
            }, 3000);

        }).catch(function(err) {
            console.error('PDF generation error:', err);
            previewBtn.textContent = 'Generate Resume';
            previewBtn.disabled = false;
            showError('Error generating PDF. Please try again.');
        });
    }

    // ============================================================
    // 12. EVENT LISTENERS
    // ============================================================

    previewBtn.addEventListener('click', generateResume);

    resetBtn.addEventListener('click', function() {
        setTimeout(function() {
            previewDiv.classList.remove('active');
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

            // Reset languages
            selectedLanguages = [];
            updateLanguageTags();
            languageSelect.value = '';

            // Reset experience
            experienceType.value = '';
            fresherContainer.style.display = 'none';
            experiencedContainer.style.display = 'none';

            // Reset summary
            summarySelect.value = '';
            customSummaryContainer.style.display = 'none';

            // Reset counts
            eduCount = document.querySelectorAll('.edu-entry').length;
            otherCount = document.querySelectorAll('.other-entry').length;
            expCount = document.querySelectorAll('.exp-entry').length;
            updateAddButtons();

            previewBtn.textContent = 'Generate Resume';
            previewBtn.disabled = false;
        }, 50);
    });

    // Declaration checkbox highlight
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

    // Live validation on input/change
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

    // Photo upload label
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

        // Initial validation for pre-filled (empty) fields
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

        // Language initial state
        updateLanguageTags();

        // Hide custom summary initially
        customSummaryContainer.style.display = 'none';

        // Hide experience containers initially
        fresherContainer.style.display = 'none';
        experiencedContainer.style.display = 'none';
    }

    init();

})();
