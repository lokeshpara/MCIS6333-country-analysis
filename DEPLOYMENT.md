# Deployment Guide

This document provides instructions for deploying the Country Analysis Dashboard to various platforms.

## Table of Contents
- [Local Deployment](#local-deployment)
- [Google Cloud App Engine](#google-cloud-app-engine)
- [Heroku](#heroku)
- [Railway](#railway)

## Local Deployment

1. Clone the repository:
   ```
   git clone https://github.com/lokeshpara/MCIS6333-country-analysis.git
   cd MCIS6333-country-analysis
   ```

2. Create a virtual environment and activate it:
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

5. Open your browser and go to `http://localhost:5000`

## Google Cloud App Engine

1. Create a Google Cloud account and install the Google Cloud SDK

2. Initialize the SDK and login:
   ```
   gcloud init
   gcloud auth login
   ```

3. Deploy the application:
   ```
   gcloud app deploy app.yaml
   ```

4. Open your browser and go to the URL provided in the deployment output

## Heroku

1. Create a Heroku account and install the Heroku CLI

2. Login to Heroku and create a new app:
   ```
   heroku login
   heroku create your-app-name
   ```

3. Deploy the application:
   ```
   git push heroku main
   ```

4. Open your browser and go to `https://your-app-name.herokuapp.com`

## Railway

1. Create a Railway account at [railway.app](https://railway.app)

2. Install the Railway CLI:
   ```
   npm i -g @railway/cli
   ```

3. Login and initialize your project:
   ```
   railway login
   railway init
   ```

4. Deploy the application:
   ```
   railway up
   ```

5. Open your browser and go to the URL provided by Railway 