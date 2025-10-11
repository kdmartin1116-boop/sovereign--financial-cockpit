export class CreditReportVisualizer {
    constructor() {
        this.accountTypesChartCtx = document.getElementById('account-types-chart').getContext('2d');
        this.utilizationChartCtx = document.getElementById('utilization-chart').getContext('2d');
        this.charts = {};
    }

    destroyCharts() {
        for (const chart in this.charts) {
            if (this.charts[chart]) {
                this.charts[chart].destroy();
            }
        }
    }

    createCharts(accounts) {
        this.destroyCharts(); // Clear existing charts before creating new ones

        this._createAccountTypesChart(accounts);
        this._createUtilizationChart(accounts);

        document.getElementById('credit-report-summary').classList.remove('hidden');
    }

    _createAccountTypesChart(accounts) {
        const accountTypes = accounts.reduce((acc, account) => {
            const type = account.type || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        this.charts.accountTypes = new Chart(this.accountTypesChartCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(accountTypes),
                datasets: [{
                    label: 'Account Types',
                    data: Object.values(accountTypes),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Account Types Breakdown'
                    }
                }
            }
        });
    }

    _createUtilizationChart(accounts) {
        const utilizationData = accounts.filter(acc => 
            acc.type.toLowerCase().includes('credit') && 
            acc.balance && acc.credit_limit && 
            acc.balance !== 'N/A' && acc.credit_limit !== 'N/A'
        ).map(acc => {
            const balance = parseFloat(acc.balance.replace(/[^\d.]/g, ''));
            const limit = parseFloat(acc.credit_limit.replace(/[^\d.]/g, ''));
            return {
                name: acc.name,
                utilization: limit > 0 ? (balance / limit) * 100 : 0
            };
        });

        if (utilizationData.length === 0) return; // Don't create the chart if there's no data

        this.charts.utilization = new Chart(this.utilizationChartCtx, {
            type: 'bar',
            data: {
                labels: utilizationData.map(d => d.name),
                datasets: [{
                    label: 'Credit Utilization (%)',
                    data: utilizationData.map(d => d.utilization),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Credit Utilization'
                    }
                }
            }
        });
    }
}
