from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import os
import json
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import shutil

app = Flask(__name__)

# Custom JSON encoder to handle NaN values
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating, np.bool_)):
            return obj.item()
        if pd.isna(obj):
            return None
        if np.isinf(obj):
            return None
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

# Try to load the data file
try:
    # Check if we need to copy the data file from professor provided folder
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    target_data_file = os.path.join(data_dir, 'country_data.csv')
    
    # Create the data directory if it doesn't exist
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    # Copy the file if it doesn't exist in our data directory
    if not os.path.exists(target_data_file):
        # Attempt to find the data file in different potential locations
        possible_paths = [
            '../professor provided/country_data.csv',     # Relative to web_dashboard
            '../../professor provided/country_data.csv',  # Relative to project root
            '../../data/country_data.csv',                # Two directories up in data folder
            '../data/country_data.csv',                   # One directory up in data folder
            'data/country_data.csv'                       # Local to the web app
        ]
        
        source_data_file = None
        for path in possible_paths:
            abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), path))
            if os.path.exists(abs_path):
                source_data_file = abs_path
                break
        
        if source_data_file is None:
            raise FileNotFoundError("Could not find country_data.csv in any expected location")
        
        # Copy the file to our data directory
        shutil.copyfile(source_data_file, target_data_file)
        print(f"Copied data file from {source_data_file} to {target_data_file}")
    
    # Load the dataset from our local copy
    df = pd.read_csv(target_data_file)
    
    # Clean the data
    # Replace infinities with NaN
    df = df.replace([np.inf, -np.inf], np.nan)
    
    # Convert specific columns to numeric, coercing errors to NaN
    numeric_columns = ['Population', 'Area', 'Pop. Density', 'Coastline', 'Net migration',
                       'Infant mortality', 'GDP', 'Literacy', 'Phones', 'Arable', 'Crops',
                       'Other', 'Climate', 'Birthrate', 'Deathrate', 'Agriculture', 
                       'Industry', 'Service']
    
    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # For analysis, we don't want to fill NaN values with 0 as it skews statistics
    # We'll handle NaN values in each route/function as needed
    
    print(f"Loaded data from {target_data_file}")
    print(f"Dataset shape: {df.shape}")
    
except Exception as e:
    print(f"Error loading data: {str(e)}")
    df = pd.DataFrame()  # Create empty DataFrame if loading fails

@app.route('/')
def index():
    """Render the home page"""
    try:
        # Get list of regions for the dashboard filters
        regions = sorted(df['Region'].dropna().unique().tolist())
        
        # Get some basic stats
        countries_count = len(df)
        
        # Handle NaN values for Population sum
        total_population = df['Population'].dropna().sum()
        if pd.isna(total_population):
            total_population_str = "N/A"
        else:
            total_population_str = f"{total_population:,.0f}"
        
        # Handle NaN values for GDP mean
        avg_gdp = df['GDP'].dropna().mean()
        if pd.isna(avg_gdp):
            avg_gdp_str = "N/A"
        else:
            avg_gdp_str = f"${avg_gdp:,.2f}"
        
        return render_template('index.html', 
                              regions=regions,
                              countries_count=countries_count,
                              total_population=total_population_str,
                              avg_gdp=avg_gdp_str)
    except Exception as e:
        return render_template('index.html', 
                              error=str(e),
                              regions=[],
                              countries_count=0,
                              total_population="N/A",
                              avg_gdp="N/A")

@app.route('/histograms')
def histograms():
    """Render the histograms page"""
    try:
        # Handle the case where there is not enough data
        if len(df['Birthrate'].dropna()) < 2 or len(df['Literacy'].dropna()) < 2:
            return render_template('histograms.html', 
                                  error="Not enough data to generate histograms",
                                  birth_counts=[],
                                  birth_labels=[],
                                  birth_tallest_count=0,
                                  birth_tallest_lower=0,
                                  birth_tallest_upper=0,
                                  lit_counts=[],
                                  lit_labels=[],
                                  lit_tallest_count=0,
                                  lit_tallest_lower=0,
                                  lit_tallest_upper=0)
        
        # Generate histogram data for Birthrate
        birthrate_hist = np.histogram(df['Birthrate'].dropna(), bins=10)
        birth_counts = birthrate_hist[0].tolist()
        birth_edges = [round(edge, 2) for edge in birthrate_hist[1].tolist()]
        birth_labels = [f"{birth_edges[i]}-{birth_edges[i+1]}" for i in range(len(birth_edges)-1)]
        
        # Find tallest bar for birthrate
        birth_tallest_idx = np.argmax(birth_counts)
        birth_tallest_count = int(birth_counts[birth_tallest_idx])
        birth_tallest_lower = birth_edges[birth_tallest_idx]
        birth_tallest_upper = birth_edges[birth_tallest_idx + 1]
        
        # Generate histogram data for Literacy
        literacy_hist = np.histogram(df['Literacy'].dropna(), bins=10)
        lit_counts = literacy_hist[0].tolist()
        lit_edges = [round(edge, 2) for edge in literacy_hist[1].tolist()]
        lit_labels = [f"{lit_edges[i]}-{lit_edges[i+1]}" for i in range(len(lit_edges)-1)]
        
        # Find tallest bar for literacy
        lit_tallest_idx = np.argmax(lit_counts)
        lit_tallest_count = int(lit_counts[lit_tallest_idx])
        lit_tallest_lower = lit_edges[lit_tallest_idx]
        lit_tallest_upper = lit_edges[lit_tallest_idx + 1]
        
        return render_template('histograms.html',
                              birth_counts=birth_counts,
                              birth_labels=birth_labels,
                              birth_tallest_count=birth_tallest_count,
                              birth_tallest_lower=birth_tallest_lower,
                              birth_tallest_upper=birth_tallest_upper,
                              lit_counts=lit_counts,
                              lit_labels=lit_labels,
                              lit_tallest_count=lit_tallest_count,
                              lit_tallest_lower=lit_tallest_lower,
                              lit_tallest_upper=lit_tallest_upper)
    except Exception as e:
        return render_template('histograms.html', error=str(e))

@app.route('/scatter')
def scatter():
    """Render the scatter plots page"""
    try:
        # Get list of numeric variables for dropdowns
        variables = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Calculate default correlation for Population vs Area
        pop_area_df = df[['Population', 'Area']].dropna()
        pop_area_corr = None
        if len(pop_area_df) >= 2:
            pop_area_corr = pop_area_df.corr().iloc[0, 1]
            # Check if correlation is NaN (can happen with constant data)
            if pd.isna(pop_area_corr):
                pop_area_corr = None
        
        pop_area_corr_str = "N/A" if pop_area_corr is None else f"{pop_area_corr:.2f}"
        
        # Default key demographic variables
        demographic_vars = ['Birthrate', 'Deathrate', 'Infant mortality', 'GDP']
        
        # Calculate correlation matrix for these variables
        correlation_matrix = df[demographic_vars].corr().round(2)
        
        # Replace NaN with None for template rendering
        correlation_dict = {}
        for var1 in demographic_vars:
            correlation_dict[var1] = {}
            for var2 in demographic_vars:
                value = correlation_matrix.loc[var1, var2]
                if pd.isna(value):
                    correlation_dict[var1][var2] = None
                else:
                    correlation_dict[var1][var2] = value
        
        return render_template('scatter.html',
                              variables=variables,
                              pop_area_corr=pop_area_corr_str,
                              demographic_vars=demographic_vars,
                              correlation_matrix=correlation_dict)
    except Exception as e:
        return render_template('scatter.html', error=str(e))

@app.route('/visualizations')
def visualizations():
    """Route to display static visualizations generated by generate_plots.py"""
    try:
        # Path to static visualization directory in our web app
        static_folder = os.path.join(os.path.dirname(__file__), 'static', 'visualizations')
        os.makedirs(static_folder, exist_ok=True)
        
        # Alternative paths to find the visualization images
        possible_paths = [
            os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static_visualizations', 'output_images'),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), 'plots'),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'plots')
        ]
        
        # Find all available images from all possible locations
        image_files = []
        source_paths = {}
        
        # Check if we already have images in our static directory
        if os.path.exists(static_folder):
            for file in os.listdir(static_folder):
                if file.endswith('.png'):
                    image_files.append(file)
        
        # If we don't have images in static directory, check other locations
        if not image_files:
            for path in possible_paths:
                if os.path.exists(path):
                    for file in os.listdir(path):
                        if file.endswith('.png') and file not in image_files:
                            image_files.append(file)
                            source_paths[file] = os.path.join(path, file)
            
            # Copy newly found images to the static folder
            for img, src_path in source_paths.items():
                dst = os.path.join(static_folder, img)
                try:
                    shutil.copyfile(src_path, dst)
                    print(f"Copied {img} to {dst}")
                except Exception as e:
                    print(f"Error copying {img}: {str(e)}")
        
        # Create visualization data with descriptions
        # Regional visualizations
        regional_visualizations = []
        for img in image_files:
            if 'by_region' in img or 'region' in img:
                title = img.replace('_', ' ').replace('.png', '').replace('by region', '- Regional Analysis').title()
                
                # Create descriptive text based on image content
                description = ""
                if 'gdp_population' in img:
                    description = "This visualization shows the relationship between GDP and population across different regions. Each point represents a country, with colors indicating different geographical regions."
                elif 'gdp_literacy' in img:
                    description = "Comparing GDP and literacy rates with region-based coloring. The plot reveals economic and educational patterns across different geographical areas."
                elif 'birthrate' in img and 'histogram' in img:
                    description = "Distribution of birthrates shown by region. The histogram displays how birthrates vary across different geographical areas."
                elif 'Birthrate_vs_' in img or '_vs_Birthrate' in img:
                    description = "Correlation between birthrate and other demographic indicators, color-coded by region to highlight geographic patterns."
                elif 'economic_sectors' in img:
                    description = "Breakdown of economic sectors (Agriculture, Industry, Service) by region, showing regional economic specialization patterns."
                elif 'population_area' in img:
                    description = "Relationship between country population and land area, colored by region to reveal geographic patterns in population density."
                else:
                    description = "Regional analysis showing how patterns differ across geographic regions. The visualization uses color-coding to distinguish between different parts of the world."
                
                regional_visualizations.append({
                    'title': title,
                    'image_path': f"/static/visualizations/{img}",
                    'description': description
                })
        
        # Distribution visualizations
        distribution_visualizations = []
        for img in image_files:
            if ('histogram' in img or 'distribution' in img) and 'by_region' not in img and 'region' not in img:
                title = img.replace('_', ' ').replace('.png', '').title()
                
                description = ""
                if 'birthrate' in img:
                    description = "Distribution of birthrates across countries. This histogram shows how many countries fall into different birthrate ranges."
                elif 'literacy' in img:
                    description = "Distribution of literacy rates globally. The histogram reveals educational attainment patterns across countries."
                elif 'population' in img:
                    description = "Population distribution showing how country populations are distributed across different size categories."
                else:
                    description = "Statistical distribution showing how countries are distributed across different value ranges for this demographic indicator."
                    
                distribution_visualizations.append({
                    'title': title,
                    'image_path': f"/static/visualizations/{img}",
                    'description': description
                })
        
        # Correlation visualizations
        correlation_visualizations = []
        for img in image_files:
            if ('correlation' in img or ('_vs_' in img and 'by_region' not in img and 'region' not in img)):
                title = img.replace('_', ' ').replace('.png', '').title()
                
                description = ""
                if 'correlation_matrix' in img:
                    description = "Correlation matrix showing relationships between key demographic variables. Darker colors indicate stronger correlations."
                elif 'Birthrate_vs_Infant' in img or 'Infant_vs_Birthrate' in img:
                    description = "Relationship between birthrate and infant mortality. This scatter plot reveals how these two health indicators are connected."
                elif 'GDP_vs_' in img or '_vs_GDP' in img:
                    description = "Correlation between GDP and another demographic indicator, revealing economic relationships."
                elif '_vs_' in img:
                    # Extract the two variables being compared
                    parts = img.split('_vs_')
                    if len(parts) > 1:
                        var1 = parts[0].replace('_', ' ').title()
                        var2 = parts[1].split('_')[0].replace('_', ' ').title()
                        description = f"Correlation analysis between {var1} and {var2}, showing how these two indicators relate to each other across countries."
                else:
                    description = "Correlation analysis revealing relationships between demographic indicators."
                    
                correlation_visualizations.append({
                    'title': title,
                    'image_path': f"/static/visualizations/{img}",
                    'description': description
                })
        
        # For a better user experience, ensure we have at least some items in each category
        if not regional_visualizations and (distribution_visualizations or correlation_visualizations):
            # Move some items to regional if empty
            for i, viz in enumerate(correlation_visualizations):
                if 'region' in viz['title'].lower() or 'regional' in viz['title'].lower():
                    regional_visualizations.append(viz)
                    correlation_visualizations.pop(i)
                    break
            
        if not distribution_visualizations and (regional_visualizations or correlation_visualizations):
            # Create a generic entry if we have no distributions
            distribution_visualizations.append({
                'title': 'Statistical Distributions',
                'image_path': regional_visualizations[0]['image_path'] if regional_visualizations else correlation_visualizations[0]['image_path'],
                'description': 'Statistical distributions showing how countries are distributed across different demographic indicators.'
            })
        
        if not correlation_visualizations and (regional_visualizations or distribution_visualizations):
            # Create a generic entry if we have no correlations
            correlation_visualizations.append({
                'title': 'Variable Correlations',
                'image_path': regional_visualizations[0]['image_path'] if regional_visualizations else distribution_visualizations[0]['image_path'],
                'description': 'Correlation analysis showing relationships between different country indicators.'
            })
            
        return render_template('visualizations.html',
                            regional_visualizations=regional_visualizations,
                            distribution_visualizations=distribution_visualizations,
                            correlation_visualizations=correlation_visualizations)
    except Exception as e:
        print(f"Error in visualizations route: {str(e)}")
        return render_template('visualizations.html', error=str(e))

# ----- API Routes for Data Access -----

@app.route('/api/countries')
def get_countries():
    """API route to get all country data"""
    try:
        # Convert to records and clean any NaN values
        countries = [{k: (None if pd.isna(v) else v) for k, v in record.items()} 
                     for record in df.to_dict(orient='records')]
        return jsonify(countries)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/histogram/<variable>')
def get_histogram_data(variable):
    """API route to get histogram data for a specific variable"""
    try:
        if variable not in df.columns:
            return jsonify({"error": "Invalid variable name"}), 400
            
        # Generate histogram data
        hist_data = np.histogram(df[variable].dropna(), bins=10)
        counts = hist_data[0].tolist()
        edges = [round(edge, 2) for edge in hist_data[1].tolist()]
        labels = [f"{edges[i]}-{edges[i+1]}" for i in range(len(edges)-1)]
        
        # Find tallest bar
        tallest_idx = np.argmax(counts)
        
        return jsonify({
            "counts": counts,
            "edges": edges,
            "labels": labels,
            "tallest_idx": int(tallest_idx),
            "tallest_count": int(counts[tallest_idx]),
            "tallest_lower": edges[tallest_idx],
            "tallest_upper": edges[tallest_idx + 1]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scatter/<x_var>/<y_var>')
def get_scatter_data(x_var, y_var):
    """API route to get scatter plot data for two variables"""
    try:
        if x_var not in df.columns or y_var not in df.columns:
            return jsonify({"error": "Invalid variable names"}), 400
            
        # Filter to relevant columns and handle NaN values
        scatter_df = df[['Country', 'Region', x_var, y_var]].copy()
        
        # Calculate correlation (before dropping NaN to get a more accurate count)
        # Use only rows where both values are present
        valid_data = scatter_df.dropna(subset=[x_var, y_var])
        correlation = None
        if len(valid_data) >= 2:  # Need at least 2 data points for correlation
            correlation = valid_data[[x_var, y_var]].corr().iloc[0, 1]
            # Check for NaN correlation (can happen with constant data)
            if pd.isna(correlation):
                correlation = None
        
        # Convert to dict and handle NaN values
        scatter_data = []
        for _, row in scatter_df.iterrows():
            row_dict = row.to_dict()
            # Replace NaN with None for JSON serialization
            for key, value in row_dict.items():
                if pd.isna(value):
                    row_dict[key] = None
            scatter_data.append(row_dict)
        
        # Create the response data
        data = {
            "data": scatter_data,
            "correlation": correlation
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/correlation-matrix')
def get_correlation_matrix():
    """API route to get correlation matrix for demographics"""
    try:
        # Use key demographic variables
        variables = ['Birthrate', 'Deathrate', 'Infant mortality', 'GDP']
        
        # Calculate correlation matrix
        corr_matrix = df[variables].corr().round(2).values.tolist()
        
        # Replace NaN values with None for JSON serialization
        for i in range(len(corr_matrix)):
            for j in range(len(corr_matrix[i])):
                if pd.isna(corr_matrix[i][j]):
                    corr_matrix[i][j] = None
        
        return jsonify({
            "variables": variables,
            "matrix": corr_matrix
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Create necessary directories for the Flask app
if not os.path.exists('static'):
    os.makedirs('static')
if not os.path.exists('templates'):
    os.makedirs('templates')

if __name__ == '__main__':
    app.run(debug=True, port=5000)