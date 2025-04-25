// scatter.js - JavaScript for scatter plot visualizations

document.addEventListener('DOMContentLoaded', function() {
    // Initialize global variables
    let countryData = [];
    let populationAreaChart = null;
    let customScatterChart = null;
    let correlationMatrix = null;
    const availableVariables = ['Birthrate', 'Deathrate', 'Infant mortality', 'GDP'];
    
    // Initialize the page
    initializePage();

    async function initializePage() {
        try {
            // Fetch the country data
            showLoadingIndicator('population-area-container');
            showLoadingIndicator('custom-scatter-container');
            showLoadingIndicator('correlation-matrix-container');
            
            countryData = await fetchData('/api/countries');
            
            if (!countryData || !countryData.length) {
                throw new Error('No country data available');
            }
            
            // Initialize Population vs Area scatter plot
            await initializePopulationAreaScatter();
            
            // Initialize custom scatter plot with variable selectors
            await initializeCustomScatter();
            
            // Initialize correlation matrix
            await initializeCorrelationMatrix();
            
        } catch (error) {
            console.error('Error initializing page:', error);
            showErrorMessage('population-area-container', 'Failed to load data. Please try refreshing the page.');
            showErrorMessage('custom-scatter-container', 'Failed to load data. Please try refreshing the page.');
            showErrorMessage('correlation-matrix-container', 'Failed to load data. Please try refreshing the page.');
        }
    }

    async function initializePopulationAreaScatter() {
        try {
            const scatterData = await fetchData('/api/scatter/Population/Area');
            
            if (!scatterData || !scatterData.data) {
                throw new Error('Invalid scatter data for Population vs Area');
            }
            
            // Clear loading indicator
            document.getElementById('population-area-container').innerHTML = '<canvas id="population-area-chart"></canvas>';
            
            // Calculate correlation
            const correlation = calculateCorrelation(
                scatterData.data.map(d => d.Population),
                scatterData.data.map(d => d.Area)
            );
            
            // Create chart
            populationAreaChart = createScatterPlot(
                'population-area-chart',
                scatterData.data,
                'Population',
                'Area',
                correlation
            );
            
        } catch (error) {
            console.error('Error initializing Population vs Area scatter:', error);
            showErrorMessage('population-area-container', 'Failed to load Population vs Area chart.');
        }
    }

    async function initializeCustomScatter() {
        try {
            // Set up variable selectors
            const xSelector = document.getElementById('x-variable');
            const ySelector = document.getElementById('y-variable');
            
            // Clear existing options
            xSelector.innerHTML = '';
            ySelector.innerHTML = '';
            
            // Populate selectors
            availableVariables.forEach(variable => {
                xSelector.appendChild(new Option(variable, variable));
                ySelector.appendChild(new Option(variable, variable));
            });
            
            // Set default values
            xSelector.value = 'Birthrate';
            ySelector.value = 'GDP';
            
            // Clear loading indicator
            document.getElementById('custom-scatter-container').innerHTML = '<canvas id="custom-scatter-chart"></canvas>';
            
            // Initialize with default values
            await updateCustomScatter();
            
            // Add event listener for update button
            document.getElementById('update-scatter').addEventListener('click', updateCustomScatter);
            
        } catch (error) {
            console.error('Error initializing custom scatter:', error);
            showErrorMessage('custom-scatter-container', 'Failed to load custom scatter chart.');
        }
    }

    async function updateCustomScatter() {
        try {
            const xVar = document.getElementById('x-variable').value;
            const yVar = document.getElementById('y-variable').value;
            
            if (!xVar || !yVar) {
                throw new Error('Please select both X and Y variables');
            }
            
            if (xVar === yVar) {
                throw new Error('Please select different variables for X and Y axes');
            }
            
            // Show loading indicator
            showLoadingIndicator('custom-scatter-container');
            
            // Fetch data for selected variables
            const scatterData = await fetchData(`/api/scatter/${xVar}/${yVar}`);
            
            if (!scatterData || !scatterData.data) {
                throw new Error(`Invalid scatter data for ${xVar} vs ${yVar}`);
            }
            
            // Clear loading indicator
            document.getElementById('custom-scatter-container').innerHTML = '<canvas id="custom-scatter-chart"></canvas>';
            
            // Calculate correlation
            const correlation = calculateCorrelation(
                scatterData.data.map(d => d[xVar]),
                scatterData.data.map(d => d[yVar])
            );
            
            // Update correlation display
            document.getElementById('correlation-value').innerHTML = formatCorrelation(correlation);
            
            // Destroy previous chart if exists
            if (customScatterChart) {
                customScatterChart.destroy();
            }
            
            // Create new chart
            customScatterChart = createScatterPlotWithRegions(
                'custom-scatter-chart',
                scatterData.data,
                xVar,
                yVar,
                correlation
            );
            
        } catch (error) {
            console.error('Error updating custom scatter:', error);
            showErrorMessage('custom-scatter-container', error.message || 'Failed to update scatter chart.');
        }
    }

    async function initializeCorrelationMatrix() {
        try {
            // Fetch correlation data
            const correlationData = await fetchData('/api/correlation-matrix');
            
            if (!correlationData || !correlationData.matrix) {
                throw new Error('Invalid correlation matrix data');
            }
            
            // Clear loading indicator
            const container = document.getElementById('correlation-matrix-container');
            container.innerHTML = '';
            
            // Create table element
            const table = document.createElement('table');
            table.className = 'table table-bordered correlation-table';
            
            // Create header row
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            // Empty cell for top left corner
            headerRow.appendChild(document.createElement('th'));
            
            // Add variable names to header
            correlationData.variables.forEach(variable => {
                const th = document.createElement('th');
                th.textContent = variable;
                headerRow.appendChild(th);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            
            // Add rows for each variable
            correlationData.variables.forEach((rowVar, rowIndex) => {
                const row = document.createElement('tr');
                
                // Add variable name in first column
                const th = document.createElement('th');
                th.textContent = rowVar;
                row.appendChild(th);
                
                // Add correlation values
                correlationData.variables.forEach((colVar, colIndex) => {
                    const td = document.createElement('td');
                    const correlationValue = correlationData.matrix[rowIndex][colIndex];
                    
                    // Don't highlight the diagonal (self-correlations)
                    if (rowIndex === colIndex) {
                        td.textContent = '1.00';
                        td.className = 'bg-light';
                    } else if (correlationValue === null || isNaN(correlationValue)) {
                        td.textContent = 'N/A';
                        td.className = 'bg-light';
                    } else {
                        td.textContent = correlationValue.toFixed(2);
                        td.className = getCorrelationColorClass(correlationValue);
                    }
                    
                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            container.appendChild(table);
            
        } catch (error) {
            console.error('Error initializing correlation matrix:', error);
            showErrorMessage('correlation-matrix-container', 'Failed to load correlation matrix.');
        }
    }

    // Helper function to calculate Pearson correlation coefficient
    function calculateCorrelation(x, y) {
        const n = x.length;
        if (n !== y.length || n === 0) return 0;
        
        // Filter out any non-numeric values
        const validPairs = [];
        for (let i = 0; i < n; i++) {
            if (!isNaN(x[i]) && !isNaN(y[i]) && x[i] !== null && y[i] !== null) {
                validPairs.push([x[i], y[i]]);
            }
        }
        
        if (validPairs.length < 2) return null; // Not enough data for correlation
        
        // Calculate means
        let sumX = 0, sumY = 0;
        for (const [xi, yi] of validPairs) {
            sumX += xi;
            sumY += yi;
        }
        
        const meanX = sumX / validPairs.length;
        const meanY = sumY / validPairs.length;
        
        // Calculate correlation coefficient
        let numerator = 0;
        let denomX = 0;
        let denomY = 0;
        
        for (const [xi, yi] of validPairs) {
            const diffX = xi - meanX;
            const diffY = yi - meanY;
            numerator += diffX * diffY;
            denomX += diffX * diffX;
            denomY += diffY * diffY;
        }
        
        if (denomX === 0 || denomY === 0) return null; // Avoid division by zero
        
        return numerator / Math.sqrt(denomX * denomY);
    }

    // Function to create a scatter plot with points colored by region
    window.createScatterPlotWithRegions = function(canvasId, data, xVariable, yVariable, correlation = null) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Filter out any NaN values in the data
        const validData = data.filter(item => 
            item[xVariable] !== null && 
            item[yVariable] !== null && 
            !isNaN(item[xVariable]) && 
            !isNaN(item[yVariable])
        );
        
        // Get unique regions
        const regions = [...new Set(validData.map(item => item.Region).filter(r => r !== null))];
        
        // Generate colors for regions
        const regionColors = {};
        regions.forEach((region, i) => {
            // Use more vibrant, eye-catching colors
            const colorPalette = [
                'rgba(255, 99, 132, 0.8)',    // Bright pink
                'rgba(54, 162, 235, 0.8)',    // Bright blue
                'rgba(255, 206, 86, 0.8)',    // Bright yellow
                'rgba(75, 192, 192, 0.8)',    // Teal
                'rgba(153, 102, 255, 0.8)',   // Purple
                'rgba(255, 159, 64, 0.8)',    // Orange
                'rgba(46, 204, 113, 0.8)',    // Green
                'rgba(142, 68, 173, 0.8)',    // Deep purple
                'rgba(241, 196, 15, 0.8)',    // Gold
                'rgba(231, 76, 60, 0.8)'      // Red
            ];
            
            // If we have more regions than colors, start cycling through the palette
            regionColors[region] = colorPalette[i % colorPalette.length];
        });
        
        // Group data by region
        const datasetsByRegion = [];
        regions.forEach(region => {
            const regionData = validData.filter(item => item.Region === region);
            
            datasetsByRegion.push({
                label: region,
                data: regionData.map(item => ({
                    x: item[xVariable],
                    y: item[yVariable],
                    country: item.Country
                })),
                backgroundColor: regionColors[region],
                pointRadius: 6,
                pointHoverRadius: 8
            });
        });
        
        // Add a dataset for items without a region
        const noRegionData = validData.filter(item => !item.Region);
        if (noRegionData.length > 0) {
            datasetsByRegion.push({
                label: 'Unknown Region',
                data: noRegionData.map(item => ({
                    x: item[xVariable],
                    y: item[yVariable],
                    country: item.Country
                })),
                backgroundColor: 'rgba(100, 100, 100, 0.7)',
                pointRadius: 6,
                pointHoverRadius: 8
            });
        }
        
        return new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasetsByRegion
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
                        borderColor: 'rgba(200, 80, 192, 0.5)',
                        borderWidth: 1,
                        displayColors: true,
                        boxPadding: 8,
                        callbacks: {
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `${point.country || 'Country'}`,
                                    `${xVariable}: ${point.x}`,
                                    `${yVariable}: ${point.y}`
                                ];
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            color: '#212529',
                            padding: 15,
                            font: {
                                size: 11
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
}); 