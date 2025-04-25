import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# Directory for screenshots
SCREENSHOT_DIR = 'screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def take_screenshot(driver, url, output_file):
    """Take a screenshot of the given URL and save it to the output file."""
    print(f"Taking screenshot of {url}...")
    driver.get(url)
    time.sleep(2)  # Wait for page to load
    driver.save_screenshot(output_file)
    print(f"Screenshot saved to {output_file}")

def main():
    # Set up Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Set up the WebDriver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        # Take screenshots of each page
        take_screenshot(driver, "http://localhost:5000/", os.path.join(SCREENSHOT_DIR, "dashboard.png"))
        take_screenshot(driver, "http://localhost:5000/histograms", os.path.join(SCREENSHOT_DIR, "histograms.png"))
        take_screenshot(driver, "http://localhost:5000/scatter", os.path.join(SCREENSHOT_DIR, "scatter.png"))
        take_screenshot(driver, "http://localhost:5000/visualizations", os.path.join(SCREENSHOT_DIR, "visualizations.png"))
    finally:
        # Close the WebDriver
        driver.quit()

if __name__ == "__main__":
    main() 