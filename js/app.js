// Main Application
class App {
    constructor() {
        this.files = [];
        this.currentResults = [];
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
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">Ingen resultater funnet</td></tr>';
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
            
            const warningIcon = isExtremeChange ? '<span class="warning-icon" title="Ekstrem endring - vurder datakvalitet">⚠️</span> ' : '';
            
            // Determine what to show in the "employees" columns
            let empBefore, empAfter;
            if (showSinceMove && item.employeesAtMove !== undefined) {
                empBefore = item.employeesAtMove;
                empAfter = item.employeesNow;
            } else {
                empBefore = item.employeesBefore;
                empAfter = item.employeesAfter;
            }
            
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
                <div class="filter-alert-icon">📅</div>
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
                icon = '📊';
                title = 'Alle selskaper';
                subtitle = `Viser ${count} selskaper med adresseendringer`;
                alertClass = '';
                break;
            case 'moves':
                icon = '📍';
                title = 'Alle adresseendringer';
                subtitle = `Viser ${count} adresseendringer`;
                alertClass = '';
                break;
            case 'growth':
                icon = '📈';
                title = 'Selskaper med vekst';
                subtitle = `Viser ${count} selskaper som har økt antall ansatte`;
                alertClass = 'success';
                break;
            case 'decline':
                icon = '📉';
                title = 'Selskaper med nedgang';
                subtitle = `Viser ${count} selskaper som har redusert antall ansatte`;
                alertClass = 'danger';
                break;
            case 'extreme':
                icon = '⚠️';
                title = 'Selskaper med ekstreme endringer';
                subtitle = `Viser ${count} selskaper med usannsynlig store endringer (>200% vekst, <-50% nedgang, eller >±100 ansatte). Vurder datakvalitet.`;
                alertClass = '';
                alertDiv.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                break;
            case '8years':
                const year8 = new Date().getFullYear() - 8;
                icon = '🏢';
                title = `Selskaper som flyttet i ${year8}`;
                subtitle = `Viser ${count} selskaper sortert etter størst endring i ansatte SIDEN flyttingen (potensielle utgående leieavtaler)`;
                alertClass = '';
                break;
            case '3years':
                const year3 = new Date().getFullYear() - 3;
                icon = '🏢';
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
                <div class="filter-alert-icon">${icon}</div>
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
                
                // Display cluster summary
                this.displayClusterSummary(clusters);
                
                // Display scatter plot
                chartManager.createMLScatterPlot(clusters);
                
                // Display high-risk companies
                this.displayHighRiskCompanies();
                
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

    displayClusterSummary(clusters) {
        const summary = mlAnalyzer.getClusterSummary();
        const container = document.getElementById('clusterSummary');
        
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem;">';
        
        summary.forEach(cluster => {
            html += `
                <div style="padding: 1.5rem; background: ${cluster.color}15; border-left: 4px solid ${cluster.color}; border-radius: 8px;">
                    <h3 style="margin: 0 0 0.5rem 0; color: ${cluster.color};">${cluster.label}</h3>
                    <p style="margin: 0 0 1rem 0; color: #666; font-size: 0.9rem;">${cluster.description}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem;">
                        <div><strong>Antall:</strong> ${cluster.size}</div>
                        <div><strong>Gj.snitt år:</strong> ${cluster.stats.avgYearsSinceMove.toFixed(1)}</div>
                        <div><strong>Gj.snitt endring:</strong> ${cluster.stats.avgChange.toFixed(0)}</div>
                        <div><strong>Gj.snitt %:</strong> ${cluster.stats.avgPercentChange.toFixed(1)}%</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    displayHighRiskCompanies() {
        const highRisk = mlAnalyzer.getHighRiskCompanies(70);
        const container = document.getElementById('highRiskCompanies');
        
        if (highRisk.length === 0) {
            container.innerHTML = '<p>Ingen høyrisiko selskaper identifisert.</p>';
            return;
        }

        let html = `
            <div style="background: #fee; padding: 1.5rem; border-radius: 8px; border: 2px solid #f44;">
                <h3 style="margin: 0 0 1rem 0; color: #c33;">
                    ⚠️ Høyrisiko selskaper (Risikoscore ≥ 70)
                </h3>
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
