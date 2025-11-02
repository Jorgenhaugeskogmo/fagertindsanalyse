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
            <div class="stat-card info" data-filter="all" style="cursor: pointer;" title="Klikk for å vise alle selskaper">
                <div class="stat-value">${stats.totalCompanies}</div>
                <div class="stat-label">Totalt selskaper</div>
            </div>
            <div class="stat-card" data-filter="moves" style="cursor: pointer;" title="Klikk for å vise alle adresseendringer">
                <div class="stat-value">${stats.totalAddressChanges}</div>
                <div class="stat-label">Adresseendringer</div>
            </div>
            <div class="stat-card success" data-filter="growth" style="cursor: pointer;" title="Klikk for å vise selskaper med vekst">
                <div class="stat-value">${stats.companiesWithGrowth}</div>
                <div class="stat-label">Selskaper med vekst</div>
            </div>
            <div class="stat-card danger" data-filter="decline" style="cursor: pointer;" title="Klikk for å vise selskaper med nedgang">
                <div class="stat-value">${stats.companiesWithReduction}</div>
                <div class="stat-label">Selskaper med nedgang</div>
            </div>
            <div class="stat-card info" data-filter="8years" style="cursor: pointer;" title="Klikk for å vise selskaper som flyttet for 8 år siden">
                <div class="stat-value">${stats.movers8YearsAgo}</div>
                <div class="stat-label">${movers8Label}</div>
            </div>
            <div class="stat-card info" data-filter="3years" style="cursor: pointer;" title="Klikk for å vise selskaper som flyttet for 3 år siden">
                <div class="stat-value">${stats.movers3YearsAgo}</div>
                <div class="stat-label">${movers3Label}</div>
            </div>
        `;
        
        // Add click handlers to stat cards
        statsGrid.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const filter = card.dataset.filter;
                this.quickFilter(filter);
                // Scroll to results
                document.getElementById('resultsSection').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            });
        });
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
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">Ingen resultater funnet</td></tr>';
            // Remove show more button if exists
            const showMoreBtn = tableContainer.querySelector('.show-more-btn');
            if (showMoreBtn) showMoreBtn.remove();
            return;
        }

        // Display limited or all data
        const displayData = limit ? data.slice(0, limit) : data;
        
        tbody.innerHTML = displayData.map(item => {
            const changeClass = item.employeeChange > 0 ? 'change-positive' : 
                               item.employeeChange < 0 ? 'change-negative' : '';
            
            return `
                <tr data-orgnr="${item.orgnr}">
                    <td>${item.orgnr}</td>
                    <td>${item.name}</td>
                    <td>${item.year}</td>
                    <td>${item.oldAddress} ${item.oldPostnr ? item.oldPostnr : ''} ${item.oldPoststed ? item.oldPoststed : ''}</td>
                    <td>${item.newAddress} ${item.newPostnr ? item.newPostnr : ''} ${item.newPoststed ? item.newPoststed : ''}</td>
                    <td>${item.employeesBefore}</td>
                    <td>${item.employeesAfter}</td>
                    <td class="${changeClass}">${item.employeeChange > 0 ? '+' : ''}${item.employeeChange}</td>
                    <td class="${changeClass}">${item.employeeChangePercent !== 'N/A' ? (item.employeeChange > 0 ? '+' : '') + item.employeeChangePercent + '%' : 'N/A'}</td>
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
            item.innerHTML = `
                <div class="timeline-year">${year}</div>
                <div class="timeline-companies">${companies.length} selskaper flyttet</div>
            `;
            breakdown.appendChild(item);
        });

        timelineContainer.appendChild(breakdown);
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
            case '8years':
                filteredData = dataProcessor.getCompaniesByMoveYear(8);
                document.getElementById('yearFilter').value = '8';
                document.getElementById('changeType').value = 'all';
                break;
            case '3years':
                filteredData = dataProcessor.getCompaniesByMoveYear(3);
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
        
        this.updateTable(filteredData);
        exportManager.setData(filteredData, stats);
    }

    applyFilters() {
        const yearFilter = document.getElementById('yearFilter').value;
        const changeType = document.getElementById('changeType').value;
        const topCount = document.getElementById('topCount').value;

        let filteredData;

        if (yearFilter === 'all') {
            filteredData = dataProcessor.processedData.addressChanges;
        } else {
            const yearsAgo = parseInt(yearFilter);
            filteredData = dataProcessor.getTopMoversByYear(yearsAgo, 'all', changeType);
        }

        // Apply change type filter if not already filtered by year
        if (yearFilter === 'all') {
            if (changeType === 'increase') {
                filteredData = filteredData.filter(c => c.employeeChange > 0);
            } else if (changeType === 'decrease') {
                filteredData = filteredData.filter(c => c.employeeChange < 0);
            }
        }

        // Sort by absolute change
        filteredData.sort((a, b) => 
            Math.abs(b.employeeChange) - Math.abs(a.employeeChange)
        );

        // Apply count limit
        if (topCount !== 'all') {
            filteredData = filteredData.slice(0, parseInt(topCount));
        }

        // Update display
        this.updateTable(filteredData);
        exportManager.setData(filteredData, dataProcessor.getStatistics());
    }

    resetFilters() {
        document.getElementById('yearFilter').value = 'all';
        document.getElementById('changeType').value = 'all';
        document.getElementById('topCount').value = '10';
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});
