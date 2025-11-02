// Export Module
class ExportManager {
    constructor() {
        this.currentData = null;
        this.stats = null;
    }

    // Set current data
    setData(data, stats) {
        this.currentData = data;
        this.stats = stats;
    }

    // Export to CSV
    exportToCSV() {
        if (!this.currentData || this.currentData.length === 0) {
            alert('Ingen data å eksportere');
            return;
        }

        const csvData = this.currentData.map(item => ({
            'Organisasjonsnummer': item.orgnr || '',
            'Navn': item.name || '',
            'Flytteår': item.year || item.firstYear || '',
            'Gammel adresse': item.oldAddress || '',
            'Ny adresse': item.newAddress || item.timeline?.[item.timeline.length - 1]?.address || '',
            'Ansatte før': item.employeesBefore || item.employeesStart || 0,
            'Ansatte etter': item.employeesAfter || item.employeesEnd || 0,
            'Endring': item.employeeChange || item.totalChange || 0,
            'Endring (%)': item.employeeChangePercent || item.totalChangePercent || '0'
        }));

        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(';'),
            ...csvData.map(row => 
                headers.map(header => {
                    const value = row[header];
                    const strValue = String(value);
                    return strValue.includes(';') ? `"${strValue}"` : strValue;
                }).join(';')
            )
        ].join('\n');

        const timestamp = new Date().toISOString().split('T')[0];
        this.downloadFile(csvContent, `fremtidsanalyse_${timestamp}.csv`, 'text/csv;charset=utf-8;');
    }

    // Export to PDF
    exportToPDF() {
        if (!this.currentData || this.currentData.length === 0) {
            alert('Ingen data å eksportere');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        // Add title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Fremtidsanalyse - Selskapsrapport', 15, 20);

        // Add date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const date = new Date().toLocaleDateString('no-NO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Generert: ${date}`, 15, 28);

        let yPos = 38;

        // Add statistics if available
        if (this.stats) {
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Statistikk', 15, 38);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            yPos = 45;
            
            const statsText = [
                `Totalt antall selskaper: ${this.stats.totalCompanies}`,
                `Totale adresseendringer: ${this.stats.totalAddressChanges}`,
                `Selskaper med vekst: ${this.stats.companiesWithGrowth}`,
                `Selskaper med nedgang: ${this.stats.companiesWithReduction}`,
                `Periodedekning: ${this.stats.yearRange}`,
                this.stats.targetYear8YearsAgo
                    ? `Flyttet for 8 år siden (${this.stats.targetYear8YearsAgo}): ${this.stats.movers8YearsAgo}`
                    : `Flyttet for 8 år siden: ${this.stats.movers8YearsAgo}`,
                this.stats.targetYear3YearsAgo
                    ? `Flyttet for 3 år siden (${this.stats.targetYear3YearsAgo}): ${this.stats.movers3YearsAgo}`
                    : `Flyttet for 3 år siden: ${this.stats.movers3YearsAgo}`
            ];

            statsText.forEach(text => {
                doc.text(text, 15, yPos);
                yPos += 6;
            });

            yPos += 5;
        }

        // Prepare table data
        const tableData = this.currentData.slice(0, 50).map(item => [
            item.orgnr || '',
            this.truncateText(item.name || '', 35),
            item.year || item.firstYear || '',
            this.truncateText(item.oldAddress || '', 30),
            this.truncateText(item.newAddress || item.timeline?.[item.timeline.length - 1]?.address || '', 30),
            item.employeesBefore || item.employeesStart || 0,
            item.employeesAfter || item.employeesEnd || 0,
            item.employeeChange || item.totalChange || 0,
            item.employeeChangePercent || item.totalChangePercent || '0'
        ]);

        // Add table
        doc.autoTable({
            startY: yPos,
            head: [[
                'Org.nr',
                'Navn',
                'År',
                'Gammel adresse',
                'Ny adresse',
                'Før',
                'Etter',
                'Endring',
                '%'
            ]],
            body: tableData,
            theme: 'striped',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak',
                font: 'helvetica'
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 45 },
                2: { cellWidth: 15 },
                3: { cellWidth: 40 },
                4: { cellWidth: 40 },
                5: { cellWidth: 15 },
                6: { cellWidth: 15 },
                7: { cellWidth: 20 },
                8: { cellWidth: 15 }
            },
            didDrawCell: (data) => {
                // Color code the change column
                if (data.column.index === 7 && data.section === 'body') {
                    const value = parseInt(data.cell.raw);
                    if (value > 0) {
                        doc.setTextColor(16, 185, 129);
                    } else if (value < 0) {
                        doc.setTextColor(239, 68, 68);
                    }
                }
            },
            didParseCell: (data) => {
                // Reset text color after coloring
                if (data.section === 'body') {
                    doc.setTextColor(0, 0, 0);
                }
            }
        });

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(
                `Side ${i} av ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Add note if data was truncated
        if (this.currentData.length > 50) {
            const lastPage = doc.internal.getNumberOfPages();
            doc.setPage(lastPage);
            doc.setFontSize(9);
            doc.setTextColor(100);
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.text(
                `NB: Rapporten viser de 50 første resultatene av totalt ${this.currentData.length} selskaper.`,
                15,
                finalY
            );
        }

        // Save PDF
        const timestamp = new Date().toISOString().split('T')[0];
        doc.save(`fremtidsanalyse_${timestamp}.pdf`);
    }

    // Truncate text
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
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
const exportManager = new ExportManager();
