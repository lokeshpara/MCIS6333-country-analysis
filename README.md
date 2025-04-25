# Country Analysis Dashboard

![Deployment Status](https://github.com/lokeshpara/MCIS6333-country-analysis/actions/workflows/deploy.yml/badge.svg)

A comprehensive data visualization web dashboard for analyzing country-level statistics. This Flask-based application provides various visualizations and insights on global demographic and economic data.

## Live Demo

The live application is deployed at: [https://mcis6333-country-analysis.onrender.com](https://mcis6333-country-analysis.onrender.com)

## Features

- Interactive dashboard with country filters
- Histogram visualizations for birthrate and literacy
- Scatter plots with correlation analysis
- Pre-generated data visualizations
- API endpoints for data access

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/lokeshpara/MCIS6333-country-analysis.git
   cd MCIS6333-country-analysis
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python app.py
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Technologies Used

- **Backend**: Flask, Python, Pandas, NumPy
- **Visualization**: Matplotlib, Seaborn
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Deployment**: Render, GitHub Actions

## Data Source

The application uses country demographic and economic data from the `data/country_data.csv` file. This dataset includes information on population, GDP, literacy rates, birth rates, and other key indicators for countries around the world.

## Application Structure

- `app.py`: Main Flask application
- `templates/`: HTML templates for the dashboard
- `static/`: CSS, JavaScript, and visualization assets
- `data/`: CSV data files
