// Charts Module
class ChartManager {
    constructor() {
        this.charts = {};
    }

    // Destroy existing charts
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    // Create employee change chart
    createEmployeeChangeChart(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const heading = document.createElement('h3');
        heading.textContent = 'Topp 15 selskaper etter endring i antall ansatte';
        heading.style.marginBottom = '1rem';
        heading.style.fontSize = '1.125rem';
        heading.style.fontWeight = '600';
        container.appendChild(heading);

        if (!data || data.length === 0) {
            this.renderEmptyState(container, 'Ingen datapunkter tilgjengelig for ansattutvikling.');
            return;
        }

        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.height = '400px';
        canvasWrapper.style.position = 'relative';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'employeeChart';
        canvasWrapper.appendChild(canvas);
        container.appendChild(canvasWrapper);

        const sortedData = [...data].sort((a, b) => 
            Math.abs(b.totalChange) - Math.abs(a.totalChange)
        ).slice(0, 15);

        if (sortedData.length === 0) {
            this.renderEmptyState(container, 'Ingen datapunkter tilgjengelig for ansattutvikling.');
            return;
        }

        const labels = sortedData.map(d => this.truncateText(d.name, 30));
        const changes = sortedData.map(d => d.totalChange);
        const colors = changes.map(change => 
            change > 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        );

        const ctx = canvas.getContext('2d');
        this.charts.employeeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Endring i antall ansatte',
                    data: changes,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.8', '1')),
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Topp 15 selskaper etter endring i antall ansatte',
                        font: {
                            size: 16,
                            weight: '600'
                        },
                        padding: 20
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return value > 0 
                                    ? `Vekst: +${value} ansatte`
                                    : `Nedgang: ${value} ansatte`;
                            }
                        }
                    }
                },
                scales: this.buildDefaultScales({ rotateX: true })
            }
        });
    }

    // Create timeline chart
    createTimelineChart(changesByYear, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const heading = document.createElement('h3');
        heading.textContent = 'Adresseendringer per år';
        heading.style.marginBottom = '1rem';
        heading.style.fontSize = '1.125rem';
        heading.style.fontWeight = '600';
        container.appendChild(heading);

        const years = Object.keys(changesByYear).sort();
        const counts = years.map(year => changesByYear[year].length);

        if (years.length === 0) {
            this.renderEmptyState(container, 'Ingen adresseendringer funnet i datasettet.');
            return;
        }

        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.height = '300px';
        canvasWrapper.style.position = 'relative';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'timelineChart';
        canvasWrapper.appendChild(canvas);
        container.appendChild(canvasWrapper);

        const ctx = canvas.getContext('2d');
        this.charts.timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Antall adresseendringer',
                    data: counts,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                return `År ${context[0].label}`;
                            },
                            label: function(context) {
                                return `${context.parsed.y} selskaper flyttet`;
                            }
                        }
                    }
                },
                scales: this.buildDefaultScales({ stepSizeY: 1 })
            }
        });
    }

    // Create company timeline chart
    createCompanyTimelineChart(company, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const chartWrapper = document.createElement('div');
        chartWrapper.style.marginTop = '2rem';
        chartWrapper.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">Utvikling i antall ansatte</h3>';
        container.appendChild(chartWrapper);

        if (!company || !company.timeline || company.timeline.length === 0) {
            this.renderEmptyState(chartWrapper, 'Ingen tidslinjedata tilgjengelig for dette selskapet.');
            return;
        }

        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.height = '300px';
        canvasWrapper.style.position = 'relative';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'companyTimelineChart';
        canvasWrapper.appendChild(canvas);
        chartWrapper.appendChild(canvasWrapper);

        const years = company.timeline.map(t => t.year);
        const employees = company.timeline.map(t => t.employees);

        const ctx = canvas.getContext('2d');
        this.charts.companyTimelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Antall ansatte',
                    data: employees,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                return `År ${context[0].label}`;
                            },
                            label: function(context) {
                                return `${context.parsed.y} ansatte`;
                            }
                        }
                    }
                },
                scales: this.buildDefaultScales()
            }
        });
    }

    // Create distribution chart
    createDistributionChart(data, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const wrapper = document.createElement('div');
        wrapper.style.marginTop = '2rem';
        container.appendChild(wrapper);

        const heading = document.createElement('h3');
        heading.textContent = 'Fordeling av vekst vs nedgang';
        heading.style.marginBottom = '1rem';
        heading.style.fontSize = '1.125rem';
        heading.style.fontWeight = '600';
        wrapper.appendChild(heading);

        if (!data || data.length === 0) {
            this.renderEmptyState(wrapper, 'Ingen selskaper har registrert ansattendringer.');
            return;
        }

        const growth = data.filter(d => d.totalChange > 0).length;
        const decline = data.filter(d => d.totalChange < 0).length;
        const noChange = data.filter(d => d.totalChange === 0).length;

        if (growth === 0 && decline === 0 && noChange === 0) {
            this.renderEmptyState(wrapper, 'Ingen selskaper har registrert ansattendringer.');
            return;
        }

        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.height = '300px';
        canvasWrapper.style.position = 'relative';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'distributionChart';
        canvasWrapper.appendChild(canvas);
        wrapper.appendChild(canvasWrapper);

        const ctx = canvas.getContext('2d');
        this.charts.distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Vekst', 'Nedgang', 'Uendret'],
                datasets: [{
                    data: [growth, decline, noChange],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(100, 116, 139, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(100, 116, 139, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 13
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Truncate text
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Render empty state message
    renderEmptyState(container, message) {
        const emptyState = document.createElement('div');
        emptyState.textContent = message;
        emptyState.style.padding = '1rem';
        emptyState.style.color = '#64748b';
        emptyState.style.background = '#f8fafc';
        emptyState.style.borderRadius = '0.75rem';
        emptyState.style.border = '1px dashed #cbd5f5';
        container.appendChild(emptyState);
    }

    // Default chart scales helper
    buildDefaultScales({ rotateX = false, stepSizeY = undefined } = {}) {
        return {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    stepSize: stepSizeY
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    maxRotation: rotateX ? 45 : 0,
                    minRotation: rotateX ? 45 : 0
                }
            }
        };
    }
}

// Create global instance
const chartManager = new ChartManager();
