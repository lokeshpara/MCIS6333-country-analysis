// Dashboard.js - Main JavaScript for Country Data Dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Add event listeners for navbar links to highlight active page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href || 
            (href !== '/' && currentPath.startsWith(href))) {
            link.classList.add('active');
        }
    });

    // Function to format numbers with commas for thousands
    window.formatNumber = function(num) {
        if (num === null || num === undefined || isNaN(num)) {
            return "N/A";
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Function to fetch data from API endpoints
    window.fetchData = async function(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            return null;
        }
    };

    // Function to create a simple bar chart
    window.createBarChart = function(canvasId, labels, data, title, xAxisLabel, yAxisLabel, backgroundColor = []) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Generate default colors if none provided
        if (!backgroundColor.length) {
            backgroundColor = labels.map((_, i) => {
                // Use more vibrant colors for the bars
                const colorPalette = [
                    'rgba(255, 99, 132, 0.8)',    // Pink
                    'rgba(54, 162, 235, 0.8)',    // Blue
                    'rgba(255, 206, 86, 0.8)',    // Yellow
                    'rgba(75, 192, 192, 0.8)',    // Teal
                    'rgba(153, 102, 255, 0.8)',   // Purple
                    'rgba(255, 159, 64, 0.8)',    // Orange
                    'rgba(46, 204, 113, 0.8)',    // Green
                    'rgba(142, 68, 173, 0.8)',    // Deep purple
                    'rgba(241, 196, 15, 0.8)',    // Gold
                    'rgba(231, 76, 60, 0.8)'      // Red
                ];
                return colorPalette[i % colorPalette.length];
            });
        }
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor.map(color => color.replace(/[0-9].[0-9]/, '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#212529',
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xAxisLabel,
                            color: '#212529',
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            padding: {top: 10, bottom: 10}
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6c757d',
                            padding: 8
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: yAxisLabel,
                            color: '#212529',
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            padding: {top: 10, bottom: 10}
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6c757d',
                            padding: 8
                        }
                    }
                }
            }
        });
    };

    // Function to create a scatter plot
    window.createScatterPlot = function(canvasId, data, xVariable, yVariable, correlation = null) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Filter out any NaN values in the data
        const validData = data.filter(item => 
            item[xVariable] !== null && 
            item[yVariable] !== null && 
            !isNaN(item[xVariable]) && 
            !isNaN(item[yVariable])
        );
        
        return new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: `${xVariable} vs ${yVariable}`,
                    data: validData.map(item => ({
                        x: item[xVariable],
                        y: item[yVariable]
                    })),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: correlation !== null ? 
                            `${xVariable} vs ${yVariable} (Correlation: ${correlation.toFixed(2)})` :
                            `${xVariable} vs ${yVariable}`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#212529',
                        padding: 20
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#212529',
                        bodyColor: '#212529',
                        borderColor: 'rgba(75, 192, 192, 0.5)',
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 8,
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const point = validData[index];
                                return [
                                    `${point.Country || 'Country'}`,
                                    `${xVariable}: ${point[xVariable]}`,
                                    `${yVariable}: ${point[yVariable]}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xVariable,
                            color: '#212529',
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            padding: {top: 10, bottom: 10}
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6c757d',
                            padding: 8
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yVariable,
                            color: '#212529',
                            font: {
                                size: 13,
                                weight: 'bold'
                            },
                            padding: {top: 10, bottom: 10}
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6c757d',
                            padding: 8
                        }
                    }
                }
            }
        });
    };

    // Function to update the UI with a loading indicator
    window.showLoadingIndicator = function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="text-center my-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading...</p>
                </div>
            `;
        }
    };

    // Function to show an error message
    window.showErrorMessage = function(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="alert alert-danger my-3" role="alert">
                    <i class="fas fa-exclamation-triangle me-2" style="color: #dc3545;"></i>
                    ${message}
                </div>
            `;
        }
    };

    // Function to determine correlation color class
    window.getCorrelationColorClass = function(value) {
        if (isNaN(value) || value === null) return 'bg-light text-muted';
        if (value >= 0.7) return 'bg-success bg-opacity-25 text-success';
        if (value >= 0.3) return 'bg-success bg-opacity-10 text-success';
        if (value <= -0.7) return 'bg-danger bg-opacity-25 text-danger';
        if (value <= -0.3) return 'bg-danger bg-opacity-10 text-danger';
        return 'bg-light text-muted';
    };

    // Function to create a correlation text with appropriate styling
    window.formatCorrelation = function(value) {
        if (isNaN(value) || value === null) {
            return '<span class="correlation neutral">Correlation: N/A</span>';
        }
        
        const formattedValue = value.toFixed(2);
        let className = 'correlation ';
        
        if (value >= 0.3) {
            className += 'positive';
        } else if (value <= -0.3) {
            className += 'negative';
        } else {
            className += 'neutral';
        }
        
        return `<span class="${className}">Correlation: ${formattedValue}</span>`;
    };
}); 