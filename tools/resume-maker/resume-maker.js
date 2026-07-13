(function() {
    'use strict';

    // ============================================================
    // 1. DOM REFERENCES
    // ============================================================
    const form = document.getElementById('resumeForm');
    const previewBtn = document.getElementById('previewBtn');
    const resetBtn = document.querySelector('button[type="reset"]');
    const errorMsg = document.getElementById('errorMsg');

    // Personal Details
    const fullName = document.getElementById('fullName');
    const professionalTitle = document.getElementById('professionalTitle');
    const fatherName = document.getElementById('fatherName');
    const motherName = document.getElementById('motherName');
    const mobileNo = document.getElementById('mobileNo');
    const emailAddress = document.getElementById('emailAddress');
    const dob = document.getElementById('dob');
    const gender = document.getElementById('gender');
    const address = document.getElementById('address');
    const category = document.getElementById('category');
    const maritalStatus = document.getElementById('maritalStatus');

    // Languages & Skills
    const languageSelect = document.getElementById('languageSelect');
    const languageTags = document.getElementById('languageTags');
    const skillsSelect = document.getElementById('skillsSelect');
    const skillsTags = document.getElementById('skillsTags');
    const customSkillInput = document.getElementById('customSkill');
    const customSkillContainer = document.getElementById('customSkillContainer');

    // Summary
    const summarySelect = document.getElementById('summarySelect');
    const customSummary = document.getElementById('customSummary');
    const customSummaryContainer = document.getElementById('customSummaryContainer');

    // Experience
    const experienceType = document.getElementById('experienceType');
    const fresherSummary = document.getElementById('fresherSummary');
    const fresherContainer = document.getElementById('fresherContainer');
    const experiencedContainer = document.getElementById('experiencedContainer');

    // Photo
    const photoUpload = document.getElementById('photoUpload');

    // Declaration
    const declarationCheck = document.getElementById('declarationCheck');

    let selectedLanguages = [];
    let selectedSkills = [];

    // ============================================================
    // 2. LANGUAGE BADGE SYSTEM
    // ============================================================
    function updateLanguageTagsUI() {
        languageTags.innerHTML = '';
        selectedLanguages.forEach(function(lang) {
            const tag = document.createElement('span');
            tag.className = 'lang-tag';
            tag.innerHTML = lang + ' <span class="tag-remove">&times;</span>';
            tag.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = selectedLanguages.indexOf(lang);
                if (idx > -1) {
                    selectedLanguages.splice(idx, 1);
                    updateLanguageTagsUI();
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
            this.selectedIndex = 0;
            return;
        }
        if (selectedLanguages.length >= 5) {
            showError('Maximum 5 languages allowed.');
            this.selectedIndex = 0;
            return;
        }
        selectedLanguages.push(val);
        updateLanguageTagsUI();
        this.selectedIndex = 0; // Reset to placeholder
        hideError();
    });

    // ============================================================
    // 3. SKILLS BADGE SYSTEM (FIXED)
    // ============================================================
    function updateSkillsTagsUI() {
        skillsTags.innerHTML = '';
        if (selectedSkills.length === 0) {
            // Optional: show a placeholder message
            return;
        }
        selectedSkills.forEach(function(skill) {
            const tag = document.createElement('span');
            tag.className = 'lang-tag';
            tag.innerHTML = skill + ' <span class="tag-remove">&times;</span>';
            tag.addEventListener('click', function(e) {
                e.stopPropagation();
                const idx = selectedSkills.indexOf(skill);
                if (idx > -1) {
                    selectedSkills.splice(idx, 1);
                    updateSkillsTagsUI();
                    validateField(skillsSelect.closest('.field-group'));
                }
            });
            skillsTags.appendChild(tag);
        });
        validateField(skillsSelect.closest('.field-group'));
    }

    skillsSelect.addEventListener('change', function() {
        const val = this.value;
        if (!val) {
            // If placeholder selected, hide custom container
            customSkillContainer.style.display = 'none';
            return;
        }

        // Handle custom skill
        if (val === 'custom') {
            customSkillContainer.style.display = 'flex';
            customSkillInput.focus();
            this.selectedIndex = 0;
            return;
        }

        // Check if already added
        if (selectedSkills.includes(val)) {
            showError('Skill already added.');
            this.selectedIndex = 0;
            return;
        }

        // Check max limit
        if (selectedSkills.length >= 3) {
            showError('Maximum 3 skills allowed.');
            this.selectedIndex = 0;
            return;
        }

        // Add skill
        selectedSkills.push(val);
        updateSkillsTagsUI();
        this.selectedIndex = 0; // Reset to placeholder
        hideError();
        customSkillContainer.style.display = 'none';
    });

    // Custom skill input - press Enter to add
    customSkillInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = this.value.trim();
            if (!val) return;

            if (selectedSkills.includes(val)) {
                showError('Skill already added.');
                this.value = '';
                return;
            }
            if (selectedSkills.length >= 3) {
                showError('Maximum 3 skills allowed.');
                this.value = '';
                return;
            }

            selectedSkills.push(val);
            updateSkillsTagsUI();
            this.value = '';
            hideError();
            customSkillContainer.style.display = 'none';
            skillsSelect.selectedIndex = 0;
        }
    });

    // ============================================================
    // 4. PROFESSIONAL SUMMARY – CUSTOM TOGGLE
    // ============================================================
    summarySelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customSummaryContainer.style.display = 'flex';
        } else {
            customSummaryContainer.style.display = 'none';
        }
    });

    // ============================================================
    // 5. EXPERIENCE TYPE TOGGLE
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
    // 6. ADD / REMOVE FUNCTIONS
    // ============================================================
    let eduCount = 1, otherCount = 1, expCount = 1;
    const MAX_ENTRIES = 3;

    window.addEducation = function() {
        if (eduCount >= MAX_ENTRIES) { showError('Maximum 3 educational entries allowed.'); return; }
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
        if (otherCount >= MAX_ENTRIES) { showError('Maximum 3 other qualification entries allowed.'); return; }
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
        if (expCount >= MAX_ENTRIES) { showError('Maximum 3 experience entries allowed.'); return; }
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
        if (eduBtn) eduBtn.disabled = (eduCount >= MAX_ENTRIES);
        if (otherBtn) otherBtn.disabled = (otherCount >= MAX_ENTRIES);
        if (expBtn) expBtn.disabled = (expCount >= MAX_ENTRIES);
    }

    // ============================================================
    // 7. VALIDATION HELPERS
    // ============================================================
    function validateField(fieldGroup) {
        if (!fieldGroup) return;
        const inputs = fieldGroup.querySelectorAll('input, select, textarea');
        inputs.forEach(function(input) {
            if (input.hasAttribute('required')) {
                const val = input.value.trim();
                const isSelect = input.tagName === 'SELECT';
                const isPlaceholder = isSelect && (val === '' || val.includes('-- Select'));
                if (val && !isPlaceholder) {
                    fieldGroup.classList.remove('error');
                    fieldGroup.classList.add('highlight');
                } else {
                    fieldGroup.classList.remove('highlight');
                    fieldGroup.classList.add('error');
                }
            }
        });
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.add('show');
    }

    function hideError() {
        errorMsg.classList.remove('show');
        errorMsg.textContent = '';
    }

    // ============================================================
    // 8. FULL FORM VALIDATION
    // ============================================================
    function validateForm() {
        let isValid = true;
        let firstError = null;
        document.querySelectorAll('.field-group.highlight, .field-group.error').forEach(el => {
            el.classList.remove('highlight', 'error');
        });

        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(function(field) {
            const fg = field.closest('.field-group');
            if (!fg) return;
            const val = field.value.trim();
            const isSelect = field.tagName === 'SELECT';
            const isPlaceholder = isSelect && (val === '' || val.includes('-- Select'));

            if (field.type === 'checkbox') {
                if (!field.checked) {
                    fg.classList.add('error');
                    isValid = false;
                    if (!firstError) firstError = fg;
                }
                return;
            }

            if (!val || isPlaceholder) {
                fg.classList.add('error');
                isValid = false;
                if (!firstError) firstError = fg;
            } else {
                fg.classList.add('highlight');
            }
        });

        // Languages
        if (selectedLanguages.length === 0) {
            const fg = languageSelect.closest('.field-group');
            if (fg) { fg.classList.add('error'); isValid = false; if (!firstError) firstError = fg; }
        }

        // Skills
        if (selectedSkills.length === 0) {
            const fg = skillsSelect.closest('.field-group');
            if (fg) { fg.classList.add('error'); isValid = false; if (!firstError) firstError = fg; }
        }

        // Experience type
        const expType = experienceType.value;
        if (!expType) {
            const fg = experienceType.closest('.field-group');
            if (fg) { fg.classList.add('error'); isValid = false; if (!firstError) firstError = fg; }
        }

        // Experienced fields
        if (expType === 'experienced') {
            document.querySelectorAll('.exp-entry .field-group input, .exp-entry .field-group textarea').forEach(function(input) {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    const fg = input.closest('.field-group');
                    if (fg) { fg.classList.add('error'); isValid = false; if (!firstError) firstError = fg; }
                }
            });
        }

        // Declaration
        if (!declarationCheck.checked) {
            const fg = declarationCheck.closest('.declaration-area');
            if (fg) {
                fg.style.border = '2px solid #c0392b';
                fg.style.borderRadius = '8px';
                fg.style.padding = '6px 10px';
                fg.style.background = '#fef6f6';
            }
            isValid = false;
            if (!firstError) firstError = declarationCheck.closest('.declaration-area');
        } else {
            const fg = declarationCheck.closest('.declaration-area');
            if (fg) {
                fg.style.border = '2px solid #27ae60';
                fg.style.borderRadius = '8px';
                fg.style.padding = '6px 10px';
                fg.style.background = '#f0faf4';
            }
        }

        if (firstError) {
            setTimeout(function() {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.style.transition = 'box-shadow 0.3s';
                firstError.style.boxShadow = '0 0 0 4px rgba(192,57,43,0.2)';
                setTimeout(function() { firstError.style.boxShadow = 'none'; }, 2000);
            }, 100);
            showError('Please fill all required fields (marked with *).');
        } else {
            hideError();
        }
        return isValid;
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
    // 10. GENERATE RESUME PDF
    // ============================================================
    function generateResumePDF() {
        if (!validateForm()) return;

        const name = safeValue(fullName) || 'Applicant';
        const title = safeValue(professionalTitle) || 'Web Developer';
        const father = safeValue(fatherName);
        const mother = safeValue(motherName);
        const mobile = safeValue(mobileNo);
        const email = safeValue(emailAddress);
        const dobVal = safeValue(dob);
        const genderVal = safeValue(gender);
        const addr = safeValue(address);
        const cat = safeValue(category);
        const marital = safeValue(maritalStatus);

        const languages = selectedLanguages;

        let summary = '';
        const summaryVal = summarySelect.value;
        if (summaryVal === 'custom') {
            summary = safeValue(customSummary);
        } else {
            summary = summaryVal;
        }

        const expType = experienceType.value;
        let experienceHTML = '';
        if (expType === 'fresher') {
            const fresherText = safeValue(fresherSummary);
            experienceHTML = `<div class="experience-heading">Fresher</div>
                              ${fresherText ? `<p>${fresherText}</p>` : ''}`;
        } else if (expType === 'experienced') {
            const expEntries = document.querySelectorAll('.exp-entry');
            let expRows = '';
            expEntries.forEach(function(entry) {
                const org = safeValue(entry.querySelector('.exp-org'));
                const des = safeValue(entry.querySelector('.exp-designation'));
                const start = safeValue(entry.querySelector('.exp-start'));
                const end = safeValue(entry.querySelector('.exp-end'));
                const desc = safeValue(entry.querySelector('.exp-desc'));
                if (org || des) {
                    expRows += `<div style="margin-bottom:6px;">
                        <div class="experience-heading">${des} at ${org}</div>
                        <div style="font-size:10.5px;color:#555;">${start} - ${end}</div>
                        <p style="font-size:10.5px;margin-top:2px;">${desc}</p>
                    </div>`;
                }
            });
            experienceHTML = expRows || '<p>No experience details provided.</p>';
        }

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
            if (exam || board) {
                hasEdu = true;
                eduRows += `<tr><td>${exam}</td><td>${board}</td><td>${year}</td><td>${percent}%</td><td>${division}</td></tr>`;
            }
        });
        const eduTable = hasEdu ? `
            <table class="resume-table">
                <thead><tr><th>Examination</th><th>Board / University</th><th>Passing Year</th><th>Percentage</th><th>Division</th></tr></thead>
                <tbody>${eduRows}</tbody>
            </table>
        ` : '<p>No educational qualifications provided.</p>';

        // Other Qualifications
        const otherEntries = document.querySelectorAll('.other-entry');
        let otherRows = '';
        let hasOther = false;
        otherEntries.forEach(function(entry) {
            const qName = safeValue(entry.querySelector('.other-name'));
            const institute = safeValue(entry.querySelector('.other-institute'));
            const year = safeValue(entry.querySelector('.other-year'));
            const score = safeValue(entry.querySelector('.other-score'));
            const duration = safeValue(entry.querySelector('.other-duration'));
            if (qName || institute) {
                hasOther = true;
                otherRows += `<tr><td>${qName}</td><td>${institute}</td><td>${year}</td><td>${score}</td><td>${duration}</td></tr>`;
            }
        });
        const otherTable = hasOther ? `
            <table class="resume-table">
                <thead><tr><th>Qualification</th><th>Institute</th><th>Passing Year</th><th>Score / Grade</th><th>Duration</th></tr></thead>
                <tbody>${otherRows}</tbody>
            </table>
        ` : '<p>No other qualifications provided.</p>';

        const skills = selectedSkills;
        const skillsChips = skills.map(s => `<li class="skill-chip">${s}</li>`).join('');

        const langChips = languages.map(l => `<span class="language-chip">${l}</span>`).join('');

        let photoBase64 = '';
        if (photoUpload.files && photoUpload.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoBase64 = e.target.result;
                generateFullPDF(name, title, father, mother, mobile, email, dobVal, genderVal, addr, cat, marital,
                    languages, summary, experienceHTML, eduTable, otherTable, skillsChips, langChips, photoBase64);
            };
            reader.readAsDataURL(photoUpload.files[0]);
        } else {
            generateFullPDF(name, title, father, mother, mobile, email, dobVal, genderVal, addr, cat, marital,
                languages, summary, experienceHTML, eduTable, otherTable, skillsChips, langChips, '');
        }
    }

    function generateFullPDF(name, title, father, mother, mobile, email, dobVal, genderVal, addr, cat, marital,
        languages, summary, experienceHTML, eduTable, otherTable, skillsChips, langChips, photoBase64) {

        const resumeHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Resume</title>
                <style>
                    *{margin:0;padding:0;box-sizing:border-box}
                    body{font-family:Calibri, "Segoe UI", Arial, sans-serif;color:#222;line-height:1.4;background:#fff;padding:0}
                    .resume{width:210mm;min-height:297mm;margin:0 auto;padding:13mm 16mm;background:#fff}
                    .resume-header{display:flex;align-items:center;gap:20px;padding-bottom:15px;border-bottom:2px solid #222}
                    .profile-photo{width:112px;height:132px;flex-shrink:0;object-fit:cover;border:1px solid #bbb;border-radius:8px;background:#f3f3f3}
                    .header-content{flex:1;min-width:0}
                    .applicant-name{font-size:29px;line-height:1.1;font-weight:700;letter-spacing:0.5px;text-transform:uppercase}
                    .professional-title{margin-top:5px;font-size:15px;font-weight:600;color:#555;letter-spacing:0.8px;text-transform:uppercase}
                    .contact-info{display:flex;flex-wrap:wrap;gap:5px 18px;margin-top:11px;font-size:11.5px}
                    .resume-section{margin-top:15px;break-inside:avoid}
                    .section-title{margin-bottom:8px;padding:5px 10px;background:#f0f2f4;border-left:4px solid #222;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase}
                    .resume-section p{font-size:11.5px;line-height:1.5;text-align:justify}
                    .personal-details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:45px;row-gap:9px;width:100%}
                    .detail-item{display:flex;align-items:flex-start;gap:6px;min-width:0;font-size:11.5px}
                    .detail-item strong{flex-shrink:0;font-weight:700}
                    .detail-item span{min-width:0;overflow-wrap:break-word}
                    .language-list{display:flex;flex-wrap:wrap;gap:4px}
                    .language-chip{display:inline-block;padding:2px 7px;background:#f7f7f7;border:1px solid #d2d2d2;border-radius:4px;font-size:10px;line-height:1.3}
                    .experience-heading{font-size:12px;font-weight:700;margin-bottom:4px}
                    .resume-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10.5px}
                    .resume-table th,.resume-table td{padding:6px;border:1px solid #c8c8c8;text-align:left;vertical-align:middle;overflow-wrap:break-word}
                    .resume-table th{background:#f2f3f4;font-weight:700}
                    .skills-list{display:flex;flex-wrap:wrap;gap:6px;list-style:none}
                    .skill-chip{padding:4px 9px;background:#f3f4f5;border:1px solid #d5d5d5;border-radius:6px;font-size:10.5px}
                    .declaration{margin-top:17px}
                    .resume-footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:25px;padding-bottom:5px;font-size:11.5px;break-inside:avoid}
                    .footer-left{display:flex;flex-direction:column;gap:8px}
                    .footer-row{display:flex;align-items:baseline}
                    .footer-label{min-width:38px;font-weight:700}
                    .place-dots{display:inline-block;min-width:145px;letter-spacing:1px}
                    .footer-name{min-width:190px;text-align:center;font-size:12.5px;font-weight:700;text-transform:uppercase}
                    @page{size:A4;margin:0}
                    @media print{.resume{width:210mm;min-height:297mm;margin:0;padding:13mm 16mm;box-shadow:none}
                    .resume-section,.resume-footer{break-inside:avoid}}
                </style>
            </head>
            <body>
                <main class="resume">
                    <header class="resume-header">
                        <img class="profile-photo" src="${photoBase64 || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'112\' height=\'132\'%3E%3Crect width=\'112\' height=\'132\' fill=\'%23f3f3f3\'/%3E%3Ctext x=\'56\' y=\'68\' font-family=\'Arial\' font-size=\'12\' fill=\'%23999\' text-anchor=\'middle\'%3EPhoto%3C/text%3E%3C/svg%3E'}" alt="Applicant Photo">
                        <div class="header-content">
                            <h1 class="applicant-name">${name}</h1>
                            <div class="professional-title">${title}</div>
                            <div class="contact-info">
                                <span>${mobile}</span>
                                <span>${email}</span>
                                <span>${addr}</span>
                            </div>
                        </div>
                    </header>

                    <section class="resume-section">
                        <h2 class="section-title">Professional Summary</h2>
                        <p>${summary || 'Not provided.'}</p>
                    </section>

                    <section class="resume-section">
                        <h2 class="section-title">Personal Details</h2>
                        <div class="personal-details-grid">
                            <div class="detail-item"><strong>Father\'s Name:</strong><span>${father}</span></div>
                            <div class="detail-item"><strong>Mother\'s Name:</strong><span>${mother}</span></div>
                            <div class="detail-item"><strong>Date of Birth:</strong><span>${formatDate(dobVal)}</span></div>
                            <div class="detail-item"><strong>Gender:</strong><span>${genderVal}</span></div>
                            <div class="detail-item"><strong>Category:</strong><span>${cat}</span></div>
                            <div class="detail-item"><strong>Marital Status:</strong><span>${marital}</span></div>
                            <div class="detail-item">
                                <strong>Known Languages:</strong>
                                <div class="language-list">${langChips}</div>
                            </div>
                            <div class="detail-item"><strong>Address:</strong><span>${addr}</span></div>
                        </div>
                    </section>

                    <section class="resume-section">
                        <h2 class="section-title">Experience</h2>
                        ${experienceHTML}
                    </section>

                    <section class="resume-section">
                        <h2 class="section-title">Educational Qualifications</h2>
                        ${eduTable}
                    </section>

                    <section class="resume-section">
                        <h2 class="section-title">Other Qualifications</h2>
                        ${otherTable}
                    </section>

                    <section class="resume-section">
                        <h2 class="section-title">Skills</h2>
                        <ul class="skills-list">${skillsChips}</ul>
                    </section>

                    <section class="resume-section declaration">
                        <h2 class="section-title">Declaration</h2>
                        <p>I hereby declare that the above particulars of facts and information stated are true, correct and complete to the best of my belief and knowledge.</p>
                    </section>

                    <footer class="resume-footer">
                        <div class="footer-left">
                            <div class="footer-row">
                                <span class="footer-label">Date:</span>
                                <span id="currentDate"></span>
                            </div>
                            <div class="footer-row">
                                <span class="footer-label">Place:</span>
                                <span class="place-dots">............................</span>
                            </div>
                        </div>
                        <div class="footer-name">${name}</div>
                    </footer>
                </main>
                <script>
                    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-GB', {
                        day:'2-digit', month:'long', year:'numeric'
                    });
                <\/script>
            </body>
            </html>
        `;

        showSpinner();
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        pdf.html(resumeHTML, {
            callback: function(pdf) {
                pdf.save('Resume_' + name.replace(/\s+/g, '_') + '.pdf');
                hideSpinner();
                showError('Resume downloaded successfully.');
                setTimeout(hideError, 3000);
            },
            x: 0,
            y: 0,
            html2canvas: {
                scale: 0.6,
                useCORS: true,
                letterRendering: true
            },
            autoPaging: 'text',
            margin: 0,
            width: 210,
            windowWidth: 800
        });
    }

    // ============================================================
    // 11. SPINNER
    // ============================================================
    function showSpinner() {
        const overlay = document.createElement('div');
        overlay.id = 'spinnerOverlay';
        overlay.style.cssText = `
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(255,255,255,0.7);
            backdrop-filter: blur(4px);
            display: flex; justify-content: center; align-items: center;
            z-index: 9999; flex-direction: column; gap:10px;
        `;
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width:50px; height:50px;
            border:4px solid #d4e4dc;
            border-top:4px solid #1a5c3a;
            border-radius:50%;
            animation: spin 1s linear infinite;
        `;
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);
        overlay.appendChild(spinner);
        const label = document.createElement('span');
        label.textContent = 'Generating PDF...';
        label.style.cssText = 'font-family:Arial; color:#1a5c3a; font-size:1rem;';
        overlay.appendChild(label);
        document.body.appendChild(overlay);
    }

    function hideSpinner() {
        const overlay = document.getElementById('spinnerOverlay');
        if (overlay) overlay.remove();
    }

    // ============================================================
    // 12. LIVE VALIDATION
    // ============================================================
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

    // ============================================================
    // 13. RESET
    // ============================================================
    resetBtn.addEventListener('click', function() {
        setTimeout(function() {
            hideSpinner();
            hideError();
            document.querySelectorAll('.field-group.highlight, .field-group.error').forEach(el => {
                el.classList.remove('highlight', 'error');
            });
            const declField = declarationCheck.closest('.declaration-area');
            if (declField) {
                declField.style.border = 'none';
                declField.style.padding = '8px 0';
                declField.style.background = 'transparent';
            }
            selectedLanguages = [];
            selectedSkills = [];
            updateLanguageTagsUI();
            updateSkillsTagsUI();
            languageSelect.selectedIndex = 0;
            skillsSelect.selectedIndex = 0;
            customSkillContainer.style.display = 'none';
            customSkillInput.value = '';
            experienceType.selectedIndex = 0;
            fresherContainer.style.display = 'none';
            experiencedContainer.style.display = 'none';
            summarySelect.selectedIndex = 0;
            customSummaryContainer.style.display = 'none';
            eduCount = document.querySelectorAll('.edu-entry').length;
            otherCount = document.querySelectorAll('.other-entry').length;
            expCount = document.querySelectorAll('.exp-entry').length;
            updateAddButtons();
        }, 50);
    });

    // ============================================================
    // 14. INIT
    // ============================================================
    function init() {
        eduCount = document.querySelectorAll('.edu-entry').length;
        otherCount = document.querySelectorAll('.other-entry').length;
        expCount = document.querySelectorAll('.exp-entry').length;
        updateAddButtons();
        updateLanguageTagsUI();
        updateSkillsTagsUI();
        customSummaryContainer.style.display = 'none';
        fresherContainer.style.display = 'none';
        experiencedContainer.style.display = 'none';
        customSkillContainer.style.display = 'none';
    }
    init();

    previewBtn.addEventListener('click', generateResumePDF);

})();
