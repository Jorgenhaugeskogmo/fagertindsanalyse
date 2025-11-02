// Main Application
class App {
    constructor() {
        this.files = [];
        this.currentResults = [];
        this.currentSortColumn = null;
        this.currentSortDirection = 'asc';
        this.hideDuplicates = false;
        this.currentRiskThreshold = 70;
        this.allMLCompanies = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragDrop();
    }

    setupEventListeners() {
        // Upload button
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeData();
        });

        // Filter button
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetFilters();
        });

        // Export buttons
        document.getElementById('exportCsvBtn').addEventListener('click', () => {
            exportManager.exportToCSV();
        });

        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            exportManager.exportToPDF();
        });

        // Close detail button
        document.getElementById('closeDetailBtn').addEventListener('click', () => {
            document.getElementById('detailSection').style.display = 'none';
        });

        // ML Analysis button
        document.getElementById('runMLBtn').addEventListener('click', () => {
            this.runMLAnalysis();
        });

        // Table sorting
        document.querySelectorAll('.data-table th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const sortKey = th.getAttribute('data-sort');
                this.sortTable(sortKey);
            });
        });

        // Hide duplicates checkbox
        document.getElementById('hideDuplicatesCheckbox').addEventListener('change', (e) => {
            this.hideDuplicates = e.target.checked;
            this.applyDuplicateFilter();
        });

        // Risk threshold slider (will be initialized after ML analysis)
        const slider = document.getElementById('riskThresholdSlider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.updateRiskThreshold(parseInt(e.target.value));
            });
        }
    }

    setupDragDrop() {
        const uploadArea = document.getElementById('uploadArea');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        uploadArea.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList).filter(file => 
            file.name.endsWith('.csv')
        );

        if (newFiles.length === 0) {
            alert('Vennligst velg CSV-filer');
            return;
        }

        // Add new files
        newFiles.forEach(file => {
            // Check if file already exists
            if (!this.files.some(f => f.name === file.name && f.size === file.size)) {
                this.files.push(file);
            }
        });

        this.displayFiles();
        document.getElementById('analyzeBtn').style.display = 'block';
    }

    displayFiles() {
        const fileList = document.getElementById('fileList');
        
        if (this.files.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        fileList.innerHTML = '<h3 style="margin: 1.5rem 0 1rem 0; font-weight: 600;">Valgte filer:</h3>';

        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const sizeKB = (file.size / 1024).toFixed(1);
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="file-icon">📄</span>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${sizeKB} KB</div>
                    </div>
                </div>
                <button class="remove-file" data-index="${index}">✕</button>
            `;

            fileList.appendChild(fileItem);
        });

        // Add remove handlers
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.files.splice(index, 1);
                this.displayFiles();
                
                if (this.files.length === 0) {
                    document.getElementById('analyzeBtn').style.display = 'none';
                }
            });
        });
    }

    async analyzeData() {
        if (this.files.length === 0) {
            alert('Vennligst last opp filer først');
            return;
        }

        // Show loading
        document.getElementById('loadingOverlay').style.display = 'flex';

        try {
            // Process files
            await dataProcessor.processFiles(this.files);

            // Get statistics
            const stats = dataProcessor.getStatistics();

            // Display results
            this.displayStatistics(stats);
            this.displayResults(dataProcessor.processedData.addressChanges);
            this.displayTimeline();

            // Show sections
            document.getElementById('controlsSection').style.display = 'block';
            document.getElementById('resultsSection').style.display = 'block';
            document.getElementById('mlSection').style.display = 'block';
            document.getElementById('timelineSection').style.display = 'block';

            // Scroll to results
            document.getElementById('controlsSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });

        } catch (error) {
            console.error('Error analyzing data:', error);
            alert('Det oppstod en feil under analyse av dataene. Vennligst sjekk at filene er i riktig format.');
        } finally {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }

    displayStatistics(stats) {
        this.updateYearFilterOptions(stats);

        const statsGrid = document.getElementById('statsGrid');
        const movers8Label = stats.targetYear8YearsAgo
            ? `Flyttet for 8 år siden (${stats.targetYear8YearsAgo})`
            : 'Flyttet for 8 år siden';
        const movers3Label = stats.targetYear3YearsAgo
            ? `Flyttet for 3 år siden (${stats.targetYear3YearsAgo})`
            : 'Flyttet for 3 år siden';
        
        statsGrid.innerHTML = `
            <div class="stat-card info" data-filter="all" onclick="window.appInstance.handleStatCardClick('all')" title="Klikk for å vise alle selskaper">
                <div class="stat-value">${stats.totalCompanies}</div>
                <div class="stat-label">Totalt selskaper</div>
            </div>
            <div class="stat-card" data-filter="moves" onclick="window.appInstance.handleStatCardClick('moves')" title="Klikk for å vise alle adresseendringer">
                <div class="stat-value">${stats.totalAddressChanges}</div>
                <div class="stat-label">Adresseendringer</div>
            </div>
            <div class="stat-card success" data-filter="growth" onclick="window.appInstance.handleStatCardClick('growth')" title="Klikk for å vise selskaper med vekst">
                <div class="stat-value">${stats.companiesWithGrowth}</div>
                <div class="stat-label">Selskaper med vekst</div>
            </div>
            <div class="stat-card danger" data-filter="decline" onclick="window.appInstance.handleStatCardClick('decline')" title="Klikk for å vise selskaper med nedgang">
                <div class="stat-value">${stats.companiesWithReduction}</div>
                <div class="stat-label">Selskaper med nedgang</div>
            </div>
            <div class="stat-card" data-filter="extreme" onclick="window.appInstance.handleStatCardClick('extreme')" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);" title="Klikk for å vise selskaper med ekstreme endringer">
                <div class="stat-value">${stats.extremeChanges || 0}</div>
                <div class="stat-label">⚠️ Ekstreme endringer</div>
            </div>
            <div class="stat-card info" data-filter="8years" onclick="window.appInstance.handleStatCardClick('8years')" title="Klikk for å vise selskaper som flyttet for 8 år siden">
                <div class="stat-value">${stats.movers8YearsAgo}</div>
                <div class="stat-label">${movers8Label}</div>
            </div>
            <div class="stat-card info" data-filter="3years" onclick="window.appInstance.handleStatCardClick('3years')" title="Klikk for å vise selskaper som flyttet for 3 år siden">
                <div class="stat-value">${stats.movers3YearsAgo}</div>
                <div class="stat-label">${movers3Label}</div>
            </div>
        `;
    }

    displayResults(data) {
        this.currentResults = data;
        this.originalResults = data; // Store original for duplicate filtering
        
        // Store data for export
        exportManager.setData(data, dataProcessor.getStatistics());

        // Create charts
        chartManager.destroyCharts();
        chartManager.createEmployeeChangeChart(
            dataProcessor.processedData.employeeChanges,
            'chartContainer'
        );

        // Create distribution chart
        chartManager.createDistributionChart(
            dataProcessor.processedData.employeeChanges,
            'chartContainer'
        );

        // Display table
        this.updateTable(data);
    }

    updateTable(data, limit = 50) {
        const tbody = document.getElementById('resultsTableBody');
        const tableContainer = document.querySelector('.table-container');
        const tableNote = document.getElementById('tableNote');
        
        // Check if we're showing cluster data (with risk scores)
        const showRiskScore = data.length > 0 && data[0].riskScore !== undefined;
        
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${showRiskScore ? 10 : 9}" style="text-align: center; padding: 2rem; color: #64748b;">Ingen resultater funnet</td></tr>`;
            // Remove show more button if exists
            const showMoreBtn = tableContainer.querySelector('.show-more-btn');
            if (showMoreBtn) showMoreBtn.remove();
            if (tableNote) tableNote.style.display = 'none';
            return;
        }

        // Display limited or all data
        const displayData = limit ? data.slice(0, limit) : data;
        
        // Check if we're showing data with "since move" information
        const showSinceMove = displayData.some(item => item.employeeChangeSinceMove !== undefined);
        
        // Show/hide note
        if (tableNote) {
            tableNote.style.display = showSinceMove ? 'block' : 'none';
        }
        
        // Update table header if needed
        const thead = document.querySelector('#resultsTable thead tr');
        if (thead) {
            if (showRiskScore && !thead.querySelector('th[data-risk-column]')) {
                // Add risk score column
                const th = document.createElement('th');
                th.textContent = 'Risikoscore';
                th.setAttribute('data-risk-column', 'true');
                th.style.textAlign = 'center';
                thead.appendChild(th);
            } else if (!showRiskScore && thead.querySelector('th[data-risk-column]')) {
                // Remove risk score column
                thead.querySelector('th[data-risk-column]').remove();
            }
        }
        
        tbody.innerHTML = displayData.map(item => {
            let changeClass, changeValue, changePercent;
            
            if (showSinceMove && item.employeeChangeSinceMove !== undefined) {
                // Show change SINCE the move
                changeClass = item.employeeChangeSinceMove > 0 ? 'change-positive' : 
                             item.employeeChangeSinceMove < 0 ? 'change-negative' : '';
                changeValue = item.employeeChangeSinceMove;
                changePercent = item.changePercentSinceMove;
            } else {
                // Show change AT the move
                changeClass = item.employeeChange > 0 ? 'change-positive' : 
                             item.employeeChange < 0 ? 'change-negative' : '';
                changeValue = item.employeeChange;
                changePercent = item.employeeChangePercent;
            }
            
            // Check for extreme changes
            const changePercentNum = parseFloat(changePercent);
            const isExtremeChange = (
                (!isNaN(changePercentNum) && (changePercentNum > 200 || changePercentNum < -50)) ||
                (Math.abs(changeValue) > 100)
            );
            
            const warningIcon = isExtremeChange ? '<span class="warning-icon" title="Ekstrem endring - vurder datakvalitet">!</span> ' : '';
            
            // Determine what to show in the "employees" columns
            let empBefore, empAfter;
            if (showSinceMove && item.employeesAtMove !== undefined) {
                empBefore = item.employeesAtMove;
                empAfter = item.employeesNow;
            } else {
                empBefore = item.employeesBefore;
                empAfter = item.employeesAfter;
            }
            
            const riskScoreHtml = showRiskScore ? `
                <td style="text-align: center;">
                    <div style="display: inline-block; background: ${item.riskScore >= 85 ? '#c33' : item.riskScore >= 75 ? '#f90' : item.riskScore >= 65 ? '#fa0' : '#10b981'}; 
                                color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: bold; min-width: 50px;">
                        ${item.riskScore}
                    </div>
                </td>
            ` : '';
            
            return `
                <tr data-orgnr="${item.orgnr}" class="${isExtremeChange ? 'extreme-change-row' : ''}">
                    <td>${item.orgnr}</td>
                    <td>${warningIcon}${item.name}</td>
                    <td>${item.year}</td>
                    <td>${item.oldAddress || ''} ${item.oldPostnr ? item.oldPostnr : ''} ${item.oldPoststed ? item.oldPoststed : ''}</td>
                    <td>${item.newAddress || ''} ${item.newPostnr ? item.newPostnr : ''} ${item.newPoststed ? item.newPoststed : ''}</td>
                    <td>${empBefore}</td>
                    <td>${empAfter}</td>
                    <td class="${changeClass}">${changeValue > 0 ? '+' : ''}${changeValue}</td>
                    <td class="${changeClass}">${changePercent !== 'N/A' ? (changeValue > 0 ? '+' : '') + changePercent + '%' : 'N/A'}</td>
                    ${riskScoreHtml}
                </tr>
            `;
        }).join('');

        // Add click handlers
        tbody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => {
                const orgnr = row.dataset.orgnr;
                this.showCompanyDetails(orgnr);
            });
        });
        
        // Add or update "Show More" button
        let showMoreBtn = tableContainer.querySelector('.show-more-btn');
        if (data.length > limit && limit !== null) {
            if (!showMoreBtn) {
                showMoreBtn = document.createElement('button');
                showMoreBtn.className = 'btn btn-secondary show-more-btn';
                showMoreBtn.style.width = '100%';
                showMoreBtn.style.marginTop = '1rem';
                tableContainer.appendChild(showMoreBtn);
            }
            showMoreBtn.textContent = `Vis alle ${data.length} resultater (viser ${displayData.length})`;
            showMoreBtn.onclick = () => this.updateTable(data, null);
        } else if (showMoreBtn) {
            showMoreBtn.remove();
        }
    }

    displayTimeline() {
        const changesByYear = dataProcessor.getAddressChangesByYear();
        const timelineContainer = document.getElementById('timelineContainer');
        
        // Create timeline chart
        chartManager.createTimelineChart(changesByYear, 'timelineContainer');

        // Add year breakdown
        const years = Object.keys(changesByYear).sort().reverse();
        
        const breakdown = document.createElement('div');
        breakdown.style.marginTop = '2rem';
        breakdown.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">Detaljert oversikt per år</h3>';

        years.forEach(year => {
            const companies = changesByYear[year];
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.style.cursor = 'pointer';
            item.title = 'Klikk for å se selskaper som flyttet dette året';
            item.innerHTML = `
                <div class="timeline-year">${year}</div>
                <div class="timeline-companies">${companies.length} selskaper flyttet</div>
            `;
            
            // Add click handler to show companies for this year
            item.addEventListener('click', () => {
                this.showCompaniesByYear(year, companies);
            });
            
            breakdown.appendChild(item);
        });

        timelineContainer.appendChild(breakdown);
    }

    showCompaniesByYear(year, companies) {
        // Sort by absolute employee change
        const sortedCompanies = [...companies].sort((a, b) => 
            Math.abs(b.employeeChange) - Math.abs(a.employeeChange)
        );
        
        // Show filter alert
        this.showFilterAlert('year_' + year, sortedCompanies.length);
        
        // Update the filter alert with year-specific info
        const alertDiv = document.getElementById('activeFilterAlert');
        alertDiv.className = 'filter-alert';
        alertDiv.innerHTML = `
            <div class="filter-alert-content">
                <div class="filter-alert-icon" style="font-weight: 600; font-size: 0.875rem;">${year}</div>
                <div class="filter-alert-text">
                    <div class="filter-alert-title">Selskaper som flyttet i ${year}</div>
                    <div class="filter-alert-subtitle">Viser ${sortedCompanies.length} selskaper som endret adresse dette året</div>
                </div>
            </div>
            <button class="filter-alert-close" onclick="window.appInstance.clearFilter()" title="Tilbakestill filter">✕</button>
        `;
        
        // Update table with filtered companies
        this.updateTable(sortedCompanies);
        exportManager.setData(sortedCompanies, dataProcessor.getStatistics());
        
        // Scroll to results
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    showCompanyDetails(orgnr) {
        const company = dataProcessor.getCompanyDetails(orgnr);
        if (!company) return;

        const detailSection = document.getElementById('detailSection');
        const detailsDiv = document.getElementById('companyDetails');

        // Build details HTML
        detailsDiv.innerHTML = `
            <div class="company-header">
                <div>
                    <h3 class="company-name">${company.name}</h3>
                    <p class="company-orgnr">Org.nr: ${company.orgnr}</p>
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-card">
                    <h3>Nøkkelinfo</h3>
                    ${company.timeline.map((t, i) => `
                        <div class="detail-row">
                            <span class="detail-label">År ${t.year}</span>
                            <span class="detail-value">${t.employees} ansatte</span>
                        </div>
                    `).join('')}
                </div>
                <div class="detail-card">
                    <h3>Adressehistorikk</h3>
                    ${company.timeline.map((t, i) => `
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                            <span class="detail-label">År ${t.year}</span>
                            <span class="detail-value" style="margin-top: 0.25rem;">
                                ${t.address}<br>
                                ${t.postnr} ${t.poststed}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div id="companyChartContainer"></div>
        `;

        // Create company timeline chart
        chartManager.createCompanyTimelineChart(company, 'companyChartContainer');

        detailSection.style.display = 'block';
        detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    handleStatCardClick(filter) {
        this.quickFilter(filter);
        // Scroll to results
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    showFilterAlert(filterType, count) {
        const alertDiv = document.getElementById('activeFilterAlert');
        let icon, title, subtitle, alertClass;
        
        switch(filterType) {
            case 'all':
                icon = 'Alle';
                title = 'Alle selskaper';
                subtitle = `Viser ${count} selskaper med adresseendringer`;
                alertClass = '';
                break;
            case 'moves':
                icon = 'Flytting';
                title = 'Alle adresseendringer';
                subtitle = `Viser ${count} adresseendringer`;
                alertClass = '';
                break;
            case 'growth':
                icon = 'Vekst';
                title = 'Selskaper med vekst';
                subtitle = `Viser ${count} selskaper som har økt antall ansatte`;
                alertClass = 'success';
                break;
            case 'decline':
                icon = 'Nedgang';
                title = 'Selskaper med nedgang';
                subtitle = `Viser ${count} selskaper som har redusert antall ansatte`;
                alertClass = 'danger';
                break;
            case 'extreme':
                icon = 'Ekstrem';
                title = 'Selskaper med ekstreme endringer';
                subtitle = `Viser ${count} selskaper med usannsynlig store endringer (>200% vekst, <-50% nedgang, eller >±100 ansatte). Vurder datakvalitet.`;
                alertClass = '';
                alertDiv.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                break;
            case '8years':
                const year8 = new Date().getFullYear() - 8;
                icon = '8 år';
                title = `Selskaper som flyttet i ${year8}`;
                subtitle = `Viser ${count} selskaper sortert etter størst endring i ansatte SIDEN flyttingen (potensielle utgående leieavtaler)`;
                alertClass = '';
                break;
            case '3years':
                const year3 = new Date().getFullYear() - 3;
                icon = '3 år';
                title = `Selskaper som flyttet i ${year3}`;
                subtitle = `Viser ${count} selskaper sortert etter størst endring i ansatte SIDEN flyttingen (potensielle utgående leieavtaler)`;
                alertClass = '';
                break;
            default:
                alertDiv.style.display = 'none';
                return;
        }
        
        alertDiv.className = 'filter-alert ' + alertClass;
        alertDiv.style.display = 'flex';
        alertDiv.innerHTML = `
            <div class="filter-alert-content">
                <div class="filter-alert-icon" style="font-weight: 600; font-size: 0.875rem;">${icon}</div>
                <div class="filter-alert-text">
                    <div class="filter-alert-title">${title}</div>
                    <div class="filter-alert-subtitle">${subtitle}</div>
                </div>
            </div>
            <button class="filter-alert-close" onclick="window.appInstance.clearFilter()" title="Tilbakestill filter">✕</button>
        `;
    }

    clearFilter() {
        document.getElementById('activeFilterAlert').style.display = 'none';
        this.resetFilters();
    }

    quickFilter(filter) {
        let filteredData;
        const stats = dataProcessor.getStatistics();
        
        switch(filter) {
            case 'all':
                filteredData = dataProcessor.processedData.addressChanges;
                document.getElementById('yearFilter').value = 'all';
                document.getElementById('changeType').value = 'all';
                break;
            case 'moves':
                filteredData = dataProcessor.processedData.addressChanges;
                document.getElementById('yearFilter').value = 'all';
                document.getElementById('changeType').value = 'all';
                break;
            case 'growth':
                filteredData = dataProcessor.processedData.addressChanges.filter(c => c.employeeChange > 0);
                document.getElementById('changeType').value = 'increase';
                document.getElementById('yearFilter').value = 'all';
                break;
            case 'decline':
                filteredData = dataProcessor.processedData.addressChanges.filter(c => c.employeeChange < 0);
                document.getElementById('changeType').value = 'decrease';
                document.getElementById('yearFilter').value = 'all';
                break;
            case 'extreme':
                filteredData = dataProcessor.processedData.addressChanges.filter(change => {
                    const changePercent = parseFloat(change.employeeChangePercent);
                    return (!isNaN(changePercent) && (changePercent > 200 || changePercent < -50)) ||
                           (Math.abs(change.employeeChange) > 100 && change.employeesBefore > 0);
                });
                document.getElementById('yearFilter').value = 'all';
                document.getElementById('changeType').value = 'all';
                break;
            case '8years':
                filteredData = dataProcessor.getCompaniesByMoveYear(8);
                // Sort by change SINCE the move
                filteredData.sort((a, b) => Math.abs(b.employeeChangeSinceMove || 0) - Math.abs(a.employeeChangeSinceMove || 0));
                document.getElementById('yearFilter').value = '8';
                document.getElementById('changeType').value = 'all';
                break;
            case '3years':
                filteredData = dataProcessor.getCompaniesByMoveYear(3);
                // Sort by change SINCE the move
                filteredData.sort((a, b) => Math.abs(b.employeeChangeSinceMove || 0) - Math.abs(a.employeeChangeSinceMove || 0));
                document.getElementById('yearFilter').value = '3';
                document.getElementById('changeType').value = 'all';
                break;
            default:
                filteredData = dataProcessor.processedData.addressChanges;
        }
        
        // Sort by absolute change
        filteredData.sort((a, b) => 
            Math.abs(b.employeeChange) - Math.abs(a.employeeChange)
        );
        
        // Show filter alert
        this.showFilterAlert(filter, filteredData.length);
        
        this.updateTable(filteredData);
        exportManager.setData(filteredData, stats);
    }

    applyFilters() {
        const yearFilter = document.getElementById('yearFilter').value;
        const changeType = document.getElementById('changeType').value;
        const topCount = document.getElementById('topCount').value;

        let filteredData;
        let filterType = 'all';

        if (yearFilter === 'all') {
            filteredData = dataProcessor.processedData.addressChanges;
        } else {
            const yearsAgo = parseInt(yearFilter);
            filteredData = dataProcessor.getTopMoversByYear(yearsAgo, 'all', changeType);
            filterType = yearsAgo === 8 ? '8years' : yearsAgo === 3 ? '3years' : 'all';
        }

        // Apply change type filter if not already filtered by year
        if (yearFilter === 'all') {
            if (changeType === 'increase') {
                filteredData = filteredData.filter(c => c.employeeChange > 0);
                filterType = 'growth';
            } else if (changeType === 'decrease') {
                filteredData = filteredData.filter(c => c.employeeChange < 0);
                filterType = 'decline';
            }
        }

        // Sort by absolute change
        filteredData.sort((a, b) => 
            Math.abs(b.employeeChange) - Math.abs(a.employeeChange)
        );

        // Apply count limit
        const fullCount = filteredData.length;
        if (topCount !== 'all') {
            filteredData = filteredData.slice(0, parseInt(topCount));
        }

        // Show filter alert
        this.showFilterAlert(filterType, fullCount);

        // Update display
        this.updateTable(filteredData);
        exportManager.setData(filteredData, dataProcessor.getStatistics());
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    resetFilters() {
        document.getElementById('yearFilter').value = 'all';
        document.getElementById('changeType').value = 'all';
        document.getElementById('topCount').value = '10';
        document.getElementById('activeFilterAlert').style.display = 'none';
        this.displayResults(dataProcessor.processedData.addressChanges);
    }

    updateYearFilterOptions(stats) {
        const yearFilter = document.getElementById('yearFilter');
        if (!yearFilter) return;

        const earliestYear = stats.earliestYear;

        yearFilter.querySelectorAll('option[data-years-ago]').forEach(option => {
            const yearsAgo = parseInt(option.dataset.yearsAgo, 10);
            if (!Number.isFinite(yearsAgo)) return;

            const targetYear = dataProcessor.getTargetYear(yearsAgo);
            if (Number.isFinite(targetYear)) {
                option.textContent = `For ${yearsAgo} år siden (${targetYear})`;
                option.disabled = Number.isFinite(earliestYear) ? targetYear < earliestYear : false;
            } else {
                option.textContent = `For ${yearsAgo} år siden`;
                option.disabled = true;
            }
        });

        const selectedOption = yearFilter.querySelector(`option[value="${yearFilter.value}"]`);
        if (selectedOption && selectedOption.disabled) {
            yearFilter.value = 'all';
        }
    }

    runMLAnalysis() {
        if (!dataProcessor.processedData || !dataProcessor.processedData.addressChanges || dataProcessor.processedData.addressChanges.length === 0) {
            alert('Ingen data tilgjengelig for ML-analyse. Last inn data først.');
            return;
        }

        // Show loading
        document.getElementById('loadingOverlay').style.display = 'flex';

        setTimeout(() => {
            try {
                // Prepare data - use companies that moved 3-8 years ago
                const data8Years = dataProcessor.getCompaniesByMoveYear(8);
                const data3Years = dataProcessor.getCompaniesByMoveYear(3);
                const allMovers = [...data8Years, ...data3Years];

                if (allMovers.length < 3) {
                    alert('Ikke nok data for ML-analyse. Trenger minst 3 selskaper.');
                    document.getElementById('loadingOverlay').style.display = 'none';
                    return;
                }

                // Run clustering
                const clusters = mlAnalyzer.kMeansClustering(allMovers, 4);
                
                // Store all companies with risk scores for threshold filtering
                this.allMLCompanies = allMovers.map(company => ({
                    ...company,
                    riskScore: mlAnalyzer.calculateRiskScore(company)
                }));
                
                // Display cluster overview
                this.displayClusterOverview(clusters);
                
                // Display cluster summary
                this.displayClusterSummary(clusters);
                
                // Display scatter plot
                chartManager.createMLScatterPlot(clusters);
                
                // Display high-risk companies
                this.displayHighRiskCompanies(this.currentRiskThreshold);
                
                // Show results
                document.getElementById('mlResults').style.display = 'block';
                
                // Scroll to ML section
                document.getElementById('mlSection').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });

            } catch (error) {
                console.error('ML analysis error:', error);
                alert('Det oppstod en feil under ML-analysen: ' + error.message);
            } finally {
                document.getElementById('loadingOverlay').style.display = 'none';
            }
        }, 100);
    }

    displayClusterOverview(clusters) {
        const container = document.getElementById('clusterOverview');
        
        const totalCompanies = clusters.reduce((sum, c) => sum + c.size, 0);
        const highRiskCluster = clusters.find(c => c.risk === 'high');
        const mediumRiskCluster = clusters.find(c => c.risk === 'medium');
        const growthCluster = clusters.find(c => c.risk === 'growth');
        const declineCluster = clusters.find(c => c.risk === 'decline');
        
        const avgYears = clusters.reduce((sum, c) => sum + c.stats.avgYearsSinceMove * c.size, 0) / totalCompanies;
        const avgChange = clusters.reduce((sum, c) => sum + c.stats.avgChange * c.size, 0) / totalCompanies;
        
        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${totalCompanies}</div>
                    <div style="opacity: 0.9;">Totalt analysert</div>
                </div>
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${highRiskCluster ? highRiskCluster.size : 0}</div>
                    <div style="opacity: 0.9;">Høy risiko</div>
                </div>
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${mediumRiskCluster ? mediumRiskCluster.size : 0}</div>
                    <div style="opacity: 0.9;">Medium risiko</div>
                </div>
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${growthCluster ? growthCluster.size : 0}</div>
                    <div style="opacity: 0.9;">Ekspansjon</div>
                </div>
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${declineCluster ? declineCluster.size : 0}</div>
                    <div style="opacity: 0.9;">Nedskalering</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1.5rem; background: #f8fafc; border-radius: 8px;">
                <div>
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Gjennomsnitt år siden flytting</div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: #1e293b;">${avgYears.toFixed(1)} år</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Gjennomsnitt ansattendring</div>
                    <div style="font-size: 1.5rem; font-weight: 600; color: ${avgChange > 0 ? '#10b981' : '#ef4444'};">
                        ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(0)} ansatte
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    updateRiskThreshold(threshold) {
        this.currentRiskThreshold = threshold;
        
        // Update display
        document.getElementById('riskThresholdValue').textContent = threshold;
        
        // Update high-risk companies list
        this.displayHighRiskCompanies(threshold);
    }

    displayClusterSummary(clusters) {
        const summary = mlAnalyzer.getClusterSummary();
        const container = document.getElementById('clusterSummary');
        
        // Store clusters for later use
        this.currentClusters = clusters;
        
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem;">';
        
        summary.forEach((cluster, index) => {
            html += `
                <div onclick="window.appInstance.showClusterCompanies(${index})" 
                     style="padding: 1.5rem; background: ${cluster.color}15; border-left: 4px solid ${cluster.color}; 
                            border-radius: 8px; cursor: pointer; transition: all 0.3s ease; user-select: none;"
                     onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.12)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <h3 style="margin: 0 0 0.5rem 0; color: ${cluster.color};">${cluster.label}</h3>
                    <p style="margin: 0 0 1rem 0; color: #666; font-size: 0.9rem;">${cluster.description}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem;">
                        <div><strong>Antall:</strong> ${cluster.size}</div>
                        <div><strong>Gj.snitt år:</strong> ${cluster.stats.avgYearsSinceMove.toFixed(1)}</div>
                        <div><strong>Gj.snitt endring:</strong> ${cluster.stats.avgChange > 0 ? '+' : ''}${cluster.stats.avgChange.toFixed(0)}</div>
                        <div><strong>Gj.snitt %:</strong> ${cluster.stats.avgPercentChange > 0 ? '+' : ''}${cluster.stats.avgPercentChange.toFixed(1)}%</div>
                    </div>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid ${cluster.color}40; font-size: 0.875rem;">
                        <div style="display: flex; justify-content: space-between; color: #64748b;">
                            <span>Median endring:</span>
                            <strong style="color: ${cluster.color};">${cluster.stats.medianChange > 0 ? '+' : ''}${cluster.stats.medianChange.toFixed(0)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #64748b; margin-top: 0.5rem;">
                            <span>Gj.snitt størrelse:</span>
                            <strong style="color: ${cluster.color};">${cluster.stats.avgSize.toFixed(0)} ansatte</strong>
                        </div>
                    </div>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid ${cluster.color}40; 
                                text-align: center; font-size: 0.85rem; color: ${cluster.color}; font-weight: 600;">
                        Klikk for å se selskapene
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    showClusterCompanies(clusterIndex) {
        if (!this.currentClusters || !this.currentClusters[clusterIndex]) {
            return;
        }

        const cluster = this.currentClusters[clusterIndex];
        const companies = cluster.items;

        // Sort by risk score descending
        const sortedCompanies = companies
            .map(company => ({
                ...company,
                riskScore: mlAnalyzer.calculateRiskScore(company)
            }))
            .sort((a, b) => b.riskScore - a.riskScore);

        // Show filter alert
        const alertDiv = document.getElementById('activeFilterAlert');
        alertDiv.className = 'filter-alert';
        alertDiv.style.background = cluster.color + '15';
        alertDiv.style.borderLeft = `4px solid ${cluster.color}`;
        alertDiv.innerHTML = `
            <div class="filter-alert-content">
                <div class="filter-alert-icon" style="background: ${cluster.color}20; color: ${cluster.color};">ML</div>
                <div class="filter-alert-text">
                    <div class="filter-alert-title" style="color: ${cluster.color};">${cluster.label}</div>
                    <div class="filter-alert-subtitle">${cluster.description} - Viser ${sortedCompanies.length} selskaper</div>
                </div>
            </div>
            <button class="filter-alert-close" onclick="window.appInstance.clearFilter()" title="Tilbakestill filter">✕</button>
        `;
        alertDiv.style.display = 'block';

        // Update table with cluster companies (show all, no limit)
        this.updateTable(sortedCompanies, false);
        exportManager.setData(sortedCompanies, dataProcessor.getStatistics());

        // Scroll to alert (right above table)
        setTimeout(() => {
            alertDiv.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    }

    displayHighRiskCompanies(threshold = 70) {
        const highRisk = mlAnalyzer.getHighRiskCompanies(threshold);
        const container = document.getElementById('highRiskCompanies');
        
        // Update counter
        document.getElementById('riskCompanyCount').textContent = `${highRisk.length} ${highRisk.length === 1 ? 'selskap' : 'selskaper'}`;
        
        if (highRisk.length === 0) {
            container.innerHTML = `
                <div style="background: #f0fdf4; padding: 2rem; border-radius: 8px; border: 2px solid #86efac; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✓</div>
                    <h3 style="margin: 0 0 0.5rem 0; color: #16a34a;">Ingen høyrisiko selskaper ved denne terskelen</h3>
                    <p style="margin: 0; color: #4ade80;">Senk terskelen for å se flere selskaper med risiko.</p>
                </div>
            `;
            return;
        }

        // Calculate risk distribution
        const veryHigh = highRisk.filter(c => c.riskScore >= 85).length;
        const high = highRisk.filter(c => c.riskScore >= 75 && c.riskScore < 85).length;
        const moderate = highRisk.filter(c => c.riskScore >= threshold && c.riskScore < 75).length;

        let html = `
            <div style="background: #fee; padding: 1.5rem; border-radius: 8px; border: 2px solid #f44;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: #c33;">
                        Høyrisiko selskaper (Risikoscore ≥ ${threshold})
                    </h3>
                    <div style="display: flex; gap: 1rem; font-size: 0.875rem;">
                        <div style="padding: 0.5rem 1rem; background: #dc2626; color: white; border-radius: 4px;">
                            <strong>${veryHigh}</strong> Svært høy (≥85)
                        </div>
                        <div style="padding: 0.5rem 1rem; background: #f97316; color: white; border-radius: 4px;">
                            <strong>${high}</strong> Høy (75-84)
                        </div>
                        <div style="padding: 0.5rem 1rem; background: #fbbf24; color: white; border-radius: 4px;">
                            <strong>${moderate}</strong> Moderat (${threshold}-74)
                        </div>
                    </div>
                </div>
                <p style="margin: 0 0 1rem 0; color: #666;">
                    Disse selskapene har høy sannsynlighet for å trenge nye lokaler snart.
                </p>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5; text-align: left;">
                                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Risiko</th>
                                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Selskap</th>
                                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">År siden flytting</th>
                                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">Endring</th>
                                <th style="padding: 0.75rem; border-bottom: 2px solid #ddd;">% Endring</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        highRisk.forEach(company => {
            const riskColor = company.riskScore >= 85 ? '#c33' : company.riskScore >= 75 ? '#f90' : '#fa0';
            html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 0.75rem;">
                        <div style="background: ${riskColor}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; text-align: center; font-weight: bold;">
                            ${company.riskScore}
                        </div>
                    </td>
                    <td style="padding: 0.75rem; font-weight: 500;">${company.name}</td>
                    <td style="padding: 0.75rem;">${company.yearsSinceMove || 'N/A'} år</td>
                    <td style="padding: 0.75rem; color: ${(company.employeeChangeSinceMove || company.employeeChange || 0) > 0 ? '#10b981' : '#ef4444'};">
                        ${(company.employeeChangeSinceMove || company.employeeChange || 0) > 0 ? '+' : ''}${company.employeeChangeSinceMove || company.employeeChange || 0}
                    </td>
                    <td style="padding: 0.75rem; color: ${parseFloat(company.changePercentSinceMove || company.employeeChangePercent || 0) > 0 ? '#10b981' : '#ef4444'};">
                        ${parseFloat(company.changePercentSinceMove || company.employeeChangePercent || 0) > 0 ? '+' : ''}${company.changePercentSinceMove || company.employeeChangePercent || 0}%
                    </td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    sortTable(sortKey) {
        if (!this.currentResults || this.currentResults.length === 0) return;

        // Toggle direction if clicking same column
        if (this.currentSortColumn === sortKey) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortColumn = sortKey;
            this.currentSortDirection = 'asc';
        }

        // Sort the data
        const sorted = [...this.currentResults].sort((a, b) => {
            let valA, valB;

            switch(sortKey) {
                case 'orgnr':
                    valA = a.orgnr || '';
                    valB = b.orgnr || '';
                    break;
                case 'name':
                    valA = (a.name || '').toLowerCase();
                    valB = (b.name || '').toLowerCase();
                    break;
                case 'year':
                    valA = a.year || 0;
                    valB = b.year || 0;
                    break;
                case 'empBefore':
                    valA = a.employeesAtMove !== undefined ? a.employeesAtMove : (a.employeesBefore || 0);
                    valB = b.employeesAtMove !== undefined ? b.employeesAtMove : (b.employeesBefore || 0);
                    break;
                case 'empAfter':
                    valA = a.employeesNow !== undefined ? a.employeesNow : (a.employeesAfter || 0);
                    valB = b.employeesNow !== undefined ? b.employeesNow : (b.employeesAfter || 0);
                    break;
                case 'change':
                    valA = a.employeeChangeSinceMove !== undefined ? a.employeeChangeSinceMove : (a.employeeChange || 0);
                    valB = b.employeeChangeSinceMove !== undefined ? b.employeeChangeSinceMove : (b.employeeChange || 0);
                    break;
                case 'changePercent':
                    valA = parseFloat(a.changePercentSinceMove !== undefined ? a.changePercentSinceMove : (a.employeeChangePercent || 0));
                    valB = parseFloat(b.changePercentSinceMove !== undefined ? b.changePercentSinceMove : (b.employeeChangePercent || 0));
                    break;
                default:
                    return 0;
            }

            if (typeof valA === 'string') {
                return this.currentSortDirection === 'asc' 
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            } else {
                return this.currentSortDirection === 'asc'
                    ? valA - valB
                    : valB - valA;
            }
        });

        // Update sort indicators
        document.querySelectorAll('.data-table th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.getAttribute('data-sort') === sortKey) {
                th.classList.add(`sort-${this.currentSortDirection}`);
            }
        });

        // Re-render table with sorted data
        this.currentResults = sorted;
        this.updateTable(sorted, false);
    }

    applyDuplicateFilter() {
        if (!this.currentResults || this.currentResults.length === 0) return;

        let dataToDisplay;

        if (this.hideDuplicates) {
            // Group by organization number and keep only the latest entry
            const latestByOrg = new Map();
            
            this.currentResults.forEach(item => {
                const existing = latestByOrg.get(item.orgnr);
                
                if (!existing || item.year > existing.year) {
                    latestByOrg.set(item.orgnr, item);
                }
            });
            
            dataToDisplay = Array.from(latestByOrg.values());
            
            // Re-apply current sort if any
            if (this.currentSortColumn) {
                const sortKey = this.currentSortColumn;
                const direction = this.currentSortDirection;
                
                dataToDisplay.sort((a, b) => {
                    let valA, valB;
                    
                    switch(sortKey) {
                        case 'orgnr':
                            valA = a.orgnr || '';
                            valB = b.orgnr || '';
                            break;
                        case 'name':
                            valA = (a.name || '').toLowerCase();
                            valB = (b.name || '').toLowerCase();
                            break;
                        case 'year':
                            valA = a.year || 0;
                            valB = b.year || 0;
                            break;
                        case 'empBefore':
                            valA = a.employeesAtMove !== undefined ? a.employeesAtMove : (a.employeesBefore || 0);
                            valB = b.employeesAtMove !== undefined ? b.employeesAtMove : (b.employeesBefore || 0);
                            break;
                        case 'empAfter':
                            valA = a.employeesNow !== undefined ? a.employeesNow : (a.employeesAfter || 0);
                            valB = b.employeesNow !== undefined ? b.employeesNow : (b.employeesAfter || 0);
                            break;
                        case 'change':
                            valA = a.employeeChangeSinceMove !== undefined ? a.employeeChangeSinceMove : (a.employeeChange || 0);
                            valB = b.employeeChangeSinceMove !== undefined ? b.employeeChangeSinceMove : (b.employeeChange || 0);
                            break;
                        case 'changePercent':
                            valA = parseFloat(a.changePercentSinceMove !== undefined ? a.changePercentSinceMove : (a.employeeChangePercent || 0));
                            valB = parseFloat(b.changePercentSinceMove !== undefined ? b.changePercentSinceMove : (b.employeeChangePercent || 0));
                            break;
                        default:
                            return 0;
                    }
                    
                    if (typeof valA === 'string') {
                        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    } else {
                        return direction === 'asc' ? valA - valB : valB - valA;
                    }
                });
            }
        } else {
            dataToDisplay = this.currentResults;
        }

        this.updateTable(dataToDisplay, false);
        exportManager.setData(dataToDisplay, dataProcessor.getStatistics());
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
