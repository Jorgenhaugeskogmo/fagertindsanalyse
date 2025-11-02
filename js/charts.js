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
        const canvas = document.createElement('canvas');
        canvas.id = 'employeeChart';
        canvas.height = 100;
        
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.appendChild(canvas);

        const sortedData = [...data].sort((a, b) => 
            Math.abs(b.totalChange) - Math.abs(a.totalChange)
        ).slice(0, 15);

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
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    // Create timeline chart
    createTimelineChart(changesByYear, containerId) {
        const canvas = document.createElement('canvas');
        canvas.id = 'timelineChart';
        canvas.height = 80;
        
        const container = document.getElementById(containerId);
        container.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">Adresseendringer per år</h3>';
        container.appendChild(canvas);

        const years = Object.keys(changesByYear).sort();
        const counts = years.map(year => changesByYear[year].length);

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
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Create company timeline chart
    createCompanyTimelineChart(company, containerId) {
        const canvas = document.createElement('canvas');
        canvas.id = 'companyTimelineChart';
        canvas.height = 80;
        
        const container = document.getElementById(containerId);
        const chartWrapper = document.createElement('div');
        chartWrapper.style.marginTop = '2rem';
        chartWrapper.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">Utvikling i antall ansatte</h3>';
        chartWrapper.appendChild(canvas);
        container.appendChild(chartWrapper);

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
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Create distribution chart
    createDistributionChart(data, containerId) {
        const canvas = document.createElement('canvas');
        canvas.id = 'distributionChart';
        canvas.height = 80;
        
        const container = document.getElementById(containerId);
        const wrapper = document.createElement('div');
        wrapper.style.marginTop = '2rem';
        wrapper.innerHTML = '<h3 style="margin-bottom: 1rem; font-size: 1.125rem; font-weight: 600;">Fordeling av vekst vs nedgang</h3>';
        wrapper.appendChild(canvas);
        container.appendChild(wrapper);

        const growth = data.filter(d => d.totalChange > 0).length;
        const decline = data.filter(d => d.totalChange < 0).length;
        const noChange = data.filter(d => d.totalChange === 0).length;

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
}

// Create global instance
const chartManager = new ChartManager();

