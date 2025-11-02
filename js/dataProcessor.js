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
        const normalizedContent = content
            .replace(/^\uFEFF/, '') // Remove BOM
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
        const lines = normalizedContent.split('\n').filter(line => line.trim());
        if (lines.length < 3) return [];

        // First line is header, second line is separator
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim());
        const dataLines = lines.slice(2); // Skip header and separator line

        const data = dataLines.map((line) => {
            if (!line.trim()) return null;

            const values = this.parseCSVLine(line);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] !== undefined ? values[index].trim() : '';
            });

            return Object.values(row).some(value => value !== '') ? row : null;
        }).filter(Boolean);

        // Extract year from filename
        const yearMatch = filename.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[0]) : null;

        return { data, year, filename };
    }

    // Parse CSV line handling semicolons
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (insideQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped quote
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ';' && !insideQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);
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

        const availableYears = this.rawData
            .map(d => d.year)
            .filter(year => Number.isFinite(year));
        if (availableYears.length > 0) {
            this.currentYear = Math.max(...availableYears);
        }

        // Build company timeline
        this.buildCompanyTimeline();

        // Analyze data
        this.analyzeData();

        return this.processedData;
    }

    // Read file as text with proper encoding detection
    readFile(file) {
        return new Promise((resolve, reject) => {
            // Read as binary first to detect and fix encoding issues
            const reader = new FileReader();
            reader.onload = (e) => {
                const bytes = new Uint8Array(e.target.result);
                let text = '';
                
                // Manual character mapping for Norwegian characters
                // Based on the actual hex values in the CSV files from Brønnøysund
                // Kråkerøy appears as KR\x8FKER\x9DY in the data
                const charMap = {
                    0x8F: 'å',  // å (lowercase)
                    0x9D: 'ø',  // ø (lowercase)
                    0x86: 'æ',  // æ (lowercase)
                    0x91: 'æ',  // Alternative æ
                    0x9B: 'ø',  // Alternative ø (CP850)
                    0x8D: 'Å',  // Å (uppercase)
                    0x9A: 'Ø',  // Ø (uppercase) 
                    0x8E: 'Æ'   // Æ (uppercase)
                };
                
                // Convert bytes to text with character mapping
                for (let i = 0; i < bytes.length; i++) {
                    const byte = bytes[i];
                    
                    // Check for special Norwegian characters
                    if (charMap[byte]) {
                        text += charMap[byte];
                    } else {
                        // Standard ASCII or extended character
                        text += String.fromCharCode(byte);
                    }
                }
                
                resolve(text);
            };
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    }

    // Build timeline for each company
    buildCompanyTimeline() {
        this.rawData.forEach(yearData => {
            const year = yearData.year;
            if (!Number.isFinite(year)) {
                return;
            }
            
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

                const employeesValue = parseInt((row['Antall ansatte'] || '').replace(/\s/g, ''), 10);
                const employees = Number.isFinite(employeesValue) ? employeesValue : 0;

                const timelineEntry = {
                    year: year,
                    address: row['Forretningsadresse'] || '',
                    postnr: row['Fadr postnr'] || '',
                    poststed: row['Fadr poststed'] || '',
                    employees: employees,
                    stiftelsesdato: row['Stiftelsesdato'] || '',
                    organisasjonsform: row['Organisasjonsform'] || ''
                };

                const existingIndex = company.timeline.findIndex(t => t.year === year);
                if (existingIndex >= 0) {
                    company.timeline[existingIndex] = timelineEntry;
                } else {
                    company.timeline.push(timelineEntry);
                }
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

                if (this.hasLocationChanged(prev, curr)) {
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

        const yearsInDataset = Array.from(
            new Set(
                this.rawData
                    .map(d => d.year)
                    .filter(year => Number.isFinite(year))
            )
        ).sort((a, b) => a - b);

        const earliestYear = yearsInDataset.length > 0 ? yearsInDataset[0] : null;
        const latestYear = yearsInDataset.length > 0 ? yearsInDataset[yearsInDataset.length - 1] : null;

        this.processedData = {
            companies: Array.from(this.companies.values()),
            addressChanges: addressChanges,
            employeeChanges: employeeChanges,
            years: yearsInDataset,
            totalCompanies: this.companies.size,
            totalAddressChanges: addressChanges.length,
            earliestYear,
            latestYear
        };
    }

    // Normalize address components and detect changes
    hasLocationChanged(previous, current) {
        if (!previous && !current) return false;

        const normalize = (value) => (value || '')
            .toString()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();

        const buildLocationKey = (entry) => {
            if (!entry) return '';
            const parts = [
                normalize(entry.address),
                normalize(entry.postnr),
                normalize(entry.poststed)
            ].filter(Boolean);
            return parts.join('|');
        };

        const prevKey = buildLocationKey(previous);
        const currKey = buildLocationKey(current);

        if (!prevKey && !currKey) {
            return false;
        }

        return prevKey !== currKey;
    }

    // Get companies that moved N years ago
    getCompaniesByMoveYear(yearsAgo) {
        const targetYear = this.getTargetYear(yearsAgo);
        if (!Number.isFinite(targetYear)) return [];
        return this.processedData.addressChanges.filter(change => change.year === targetYear);
    }

    // Get the absolute year for a relative move filter
    getTargetYear(yearsAgo) {
        if (!Number.isFinite(yearsAgo)) return null;
        // Always use current year (today) as reference, not latest data year
        const baseYear = this.currentYear;
        if (!Number.isFinite(baseYear)) return null;
        return baseYear - yearsAgo;
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
        const targetYear8 = this.getTargetYear(8);
        const targetYear3 = this.getTargetYear(3);
        
        // Count extreme changes (>200% or <-50% or large absolute changes >100)
        const extremeChanges = this.processedData.addressChanges.filter(change => {
            const changePercent = parseFloat(change.employeeChangePercent);
            return (!isNaN(changePercent) && (changePercent > 200 || changePercent < -50)) ||
                   (Math.abs(change.employeeChange) > 100 && change.employeesBefore > 0);
        });

        return {
            totalCompanies: this.processedData.totalCompanies,
            totalAddressChanges: this.processedData.totalAddressChanges,
            companiesWithGrowth: increases.length,
            companiesWithReduction: decreases.length,
            totalEmployeeIncrease: totalIncrease,
            totalEmployeeDecrease: totalDecrease,
            movers8YearsAgo: movers8Years.length,
            movers3YearsAgo: movers3Years.length,
            extremeChanges: extremeChanges.length,
            latestYear: this.processedData.latestYear || null,
            earliestYear: this.processedData.earliestYear || null,
            targetYear8YearsAgo: Number.isFinite(targetYear8) ? targetYear8 : null,
            targetYear3YearsAgo: Number.isFinite(targetYear3) ? targetYear3 : null,
            yearRange: this.processedData.earliestYear && this.processedData.latestYear
                ? `${this.processedData.earliestYear}-${this.processedData.latestYear}`
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
