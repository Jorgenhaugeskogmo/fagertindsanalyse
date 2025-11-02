// Data Processor Module
class DataProcessor {
    constructor() {
        this.rawData = [];
        this.processedData = {};
        this.companies = new Map();
        this.currentYear = new Date().getFullYear();
    }

    // Parse CSV content
    parseCSV(content, filename) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 3) return [];

        // First line is header, second line is separator
        const headers = lines[0].split(';').map(h => h.trim());
        const dataLines = lines.slice(2); // Skip header and separator line

        const data = dataLines.map(line => {
            const values = this.parseCSVLine(line);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });

            return row;
        });

        // Extract year from filename
        const yearMatch = filename.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[0]) : null;

        return { data, year, filename };
    }

    // Parse CSV line handling semicolons
    parseCSVLine(line) {
        const values = line.split(';');
        return values;
    }

    // Process all uploaded files
    async processFiles(files) {
        this.rawData = [];
        this.companies.clear();

        for (const file of files) {
            const content = await this.readFile(file);
            const parsed = this.parseCSV(content, file.name);
            if (parsed.data && parsed.data.length > 0) {
                this.rawData.push(parsed);
            }
        }

        // Sort by year
        this.rawData.sort((a, b) => (a.year || 0) - (b.year || 0));

        // Build company timeline
        this.buildCompanyTimeline();

        // Analyze data
        this.analyzeData();

        return this.processedData;
    }

    // Read file as text
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'UTF-8');
        });
    }

    // Build timeline for each company
    buildCompanyTimeline() {
        this.rawData.forEach(yearData => {
            const year = yearData.year;
            
            yearData.data.forEach(row => {
                const orgnr = row['Orgnr'];
                if (!orgnr) return;

                if (!this.companies.has(orgnr)) {
                    this.companies.set(orgnr, {
                        orgnr: orgnr,
                        name: row['Navn'] || '',
                        timeline: []
                    });
                }

                const company = this.companies.get(orgnr);
                
                // Update name if available
                if (row['Navn']) {
                    company.name = row['Navn'];
                }

                company.timeline.push({
                    year: year,
                    address: row['Forretningsadresse'] || '',
                    postnr: row['Fadr postnr'] || '',
                    poststed: row['Fadr poststed'] || '',
                    employees: parseInt(row['Antall ansatte']) || 0,
                    stiftelsesdato: row['Stiftelsesdato'] || '',
                    organisasjonsform: row['Organisasjonsform'] || ''
                });
            });
        });

        // Sort timelines by year
        this.companies.forEach(company => {
            company.timeline.sort((a, b) => a.year - b.year);
        });
    }

    // Analyze data
    analyzeData() {
        const addressChanges = [];
        const employeeChanges = [];

        this.companies.forEach(company => {
            const timeline = company.timeline;
            if (timeline.length < 2) return;

            // Detect address changes
            for (let i = 1; i < timeline.length; i++) {
                const prev = timeline[i - 1];
                const curr = timeline[i];

                if (this.hasAddressChanged(prev.address, curr.address)) {
                    addressChanges.push({
                        orgnr: company.orgnr,
                        name: company.name,
                        year: curr.year,
                        oldAddress: prev.address,
                        newAddress: curr.address,
                        oldPostnr: prev.postnr,
                        newPostnr: curr.postnr,
                        oldPoststed: prev.poststed,
                        newPoststed: curr.poststed,
                        employeesBefore: prev.employees,
                        employeesAfter: curr.employees,
                        employeeChange: curr.employees - prev.employees,
                        employeeChangePercent: prev.employees > 0 
                            ? ((curr.employees - prev.employees) / prev.employees * 100).toFixed(1)
                            : 'N/A'
                    });
                }
            }

            // Calculate total employee changes
            const first = timeline[0];
            const last = timeline[timeline.length - 1];
            
            if (first.year !== last.year) {
                employeeChanges.push({
                    orgnr: company.orgnr,
                    name: company.name,
                    firstYear: first.year,
                    lastYear: last.year,
                    employeesStart: first.employees,
                    employeesEnd: last.employees,
                    totalChange: last.employees - first.employees,
                    totalChangePercent: first.employees > 0
                        ? ((last.employees - first.employees) / first.employees * 100).toFixed(1)
                        : 'N/A',
                    timeline: timeline
                });
            }
        });

        this.processedData = {
            companies: Array.from(this.companies.values()),
            addressChanges: addressChanges,
            employeeChanges: employeeChanges,
            years: this.rawData.map(d => d.year).filter(y => y),
            totalCompanies: this.companies.size,
            totalAddressChanges: addressChanges.length
        };
    }

    // Check if address has changed
    hasAddressChanged(addr1, addr2) {
        if (!addr1 || !addr2) return false;
        const clean1 = addr1.toLowerCase().replace(/\s+/g, ' ').trim();
        const clean2 = addr2.toLowerCase().replace(/\s+/g, ' ').trim();
        return clean1 !== clean2;
    }

    // Get companies that moved N years ago
    getCompaniesByMoveYear(yearsAgo) {
        const targetYear = this.currentYear - yearsAgo;
        return this.processedData.addressChanges.filter(change => change.year === targetYear);
    }

    // Get companies with largest employee changes
    getTopEmployeeChanges(count = 10, type = 'all') {
        let changes = [...this.processedData.employeeChanges];

        // Filter by type
        if (type === 'increase') {
            changes = changes.filter(c => c.totalChange > 0);
        } else if (type === 'decrease') {
            changes = changes.filter(c => c.totalChange < 0);
        }

        // Sort by absolute change
        changes.sort((a, b) => Math.abs(b.totalChange) - Math.abs(a.totalChange));

        return count === 'all' ? changes : changes.slice(0, count);
    }

    // Get companies that moved N years ago with largest changes
    getTopMoversByYear(yearsAgo, count = 10, type = 'all') {
        const movers = this.getCompaniesByMoveYear(yearsAgo);
        
        let filtered = [...movers];
        
        if (type === 'increase') {
            filtered = filtered.filter(c => c.employeeChange > 0);
        } else if (type === 'decrease') {
            filtered = filtered.filter(c => c.employeeChange < 0);
        }

        filtered.sort((a, b) => Math.abs(b.employeeChange) - Math.abs(a.employeeChange));

        return count === 'all' ? filtered : filtered.slice(0, count);
    }

    // Get address changes by year
    getAddressChangesByYear() {
        const byYear = {};
        
        this.processedData.addressChanges.forEach(change => {
            if (!byYear[change.year]) {
                byYear[change.year] = [];
            }
            byYear[change.year].push(change);
        });

        return byYear;
    }

    // Get statistics
    getStatistics() {
        const changes = this.processedData.employeeChanges;
        const increases = changes.filter(c => c.totalChange > 0);
        const decreases = changes.filter(c => c.totalChange < 0);
        
        const totalIncrease = increases.reduce((sum, c) => sum + c.totalChange, 0);
        const totalDecrease = Math.abs(decreases.reduce((sum, c) => sum + c.totalChange, 0));

        const movers8Years = this.getCompaniesByMoveYear(8);
        const movers3Years = this.getCompaniesByMoveYear(3);

        return {
            totalCompanies: this.processedData.totalCompanies,
            totalAddressChanges: this.processedData.totalAddressChanges,
            companiesWithGrowth: increases.length,
            companiesWithReduction: decreases.length,
            totalEmployeeIncrease: totalIncrease,
            totalEmployeeDecrease: totalDecrease,
            movers8YearsAgo: movers8Years.length,
            movers3YearsAgo: movers3Years.length,
            yearRange: this.processedData.years.length > 0 
                ? `${Math.min(...this.processedData.years)}-${Math.max(...this.processedData.years)}`
                : 'N/A'
        };
    }

    // Get company details
    getCompanyDetails(orgnr) {
        return this.companies.get(orgnr);
    }

    // Export to CSV
    exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(';'),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(';') 
                        ? `"${value}"` 
                        : value;
                }).join(';')
            )
        ].join('\n');

        this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    }

    // Download file
    downloadFile(content, filename, type) {
        const blob = new Blob(['\ufeff' + content], { type: type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}

// Create global instance
const dataProcessor = new DataProcessor();

