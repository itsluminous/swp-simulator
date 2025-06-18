# Retirement SWP Calculator with AI Analysis

This project provides a Retirement Systematic Withdrawal Plan (SWP) calculator with an optional AI-powered financial health check. It helps users plan their retirement by projecting corpus growth and potential monthly withdrawals, and offers insights through a Gemini API integration.

## Table of Contents

* [Features](#features)

* [Local Setup and Testing](#local-setup-and-testing)

  * [Prerequisites](#prerequisites)

  * [Running Locally](#running-locally)

* [Deployment to GitHub Pages](#deployment-to-github-pages)

  * [Environment Variables (Secrets & Variables)](#environment-variables-secrets--variables)

  * [GitHub Actions Workflow](#github-actions-workflow)

* [Project Structure](#project-structure)

* [Contributing](#contributing)

* [License](#license)

## Features

* **Retirement Corpus Calculation:** Projects your retirement corpus based on current market value, monthly SIP, and SIP tenure.

* **SWP Projections:** Calculates initial monthly withdrawals and provides detailed yearly/monthly projections of portfolio balance.

* **Interactive Charts:** Visualizes portfolio balance over time using Chart.js.

* **AI Financial Health Check (Optional):** Provides an AI-generated analysis of your financial plan, offering insights into strengths, risks, and actionable suggestions.

* **Responsive Design:** Works well on various screen sizes (mobile, tablet, desktop) due to Tailwind CSS.

## Local Setup and Testing

To run and test this application on your local machine, follow these steps:

### Prerequisites

* A web browser (Chrome, Firefox, Edge, etc.)

* Node.js installed on your system (for a local web server, along with the `http-server` package)

### Running Locally

Since this is a client-side application, you'll need a simple local web server to avoid CORS issues when loading JavaScript modules.

1. **Clone the Repository:**

   ```
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
   cd YOUR_REPO_NAME
   
   ```

   (Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.)

2. **Start a Local Web Server:**

   Choose one of the following methods:

   * **Using Python (Recommended for simplicity if Python is installed):**
     Open your terminal/command prompt in the project's root directory and run:

     ```
     python -m http.server
     
     ```

     Then, open your web browser and navigate to `http://localhost:8000`.

   * **Using Node.js `http-server` (if Node.js is installed):**
     First, install `http-server` globally (if you haven't already):

     ```
     npm install -g http-server
     
     ```

     Then, open your terminal/command prompt in the project's root directory and run:

     ```
     http-server
     
     ```

     Open your web browser and navigate to `http://localhost:8080` (or the address shown in your terminal).

   * **Using VS Code Live Server Extension:**
     If you use Visual Studio Code, install the "Live Server" extension. Open the project folder in VS Code, right-click on `index.html` in the Explorer, and select "Open with Live Server".

3. **Testing the AI Financial Health Check (Optional, requires API Key):**

   For local testing of the AI feature, you can temporarily hardcode your Gemini API key directly into `script.js` for development purposes. **Remember to remove it before pushing to a public repository if you are not using GitHub Actions to inject it securely.**

   * Open `script.js`.

   * Find the line: `const AI_API_KEY = typeof __ai_api_key !== 'undefined' ? __ai_api_key : '';`

   * Change it to: `const AI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";` (Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual key).

   * To hide/show the AI button locally, you can also modify:
     `const SHOW_AI_CHECK_BUTTON = typeof __show_ai_check_button !== 'undefined' ? __show_ai_check_button === 'true' : true;`
     to
     `const SHOW_AI_CHECK_BUTTON = true;` or `const SHOW_AI_CHECK_BUTTON = false;`

   * After making changes, refresh your browser page running from the local server.

## Deployment to GitHub Pages

This application is designed to be easily deployable to GitHub Pages using GitHub Actions for secure management of environment variables.

### Environment Variables (Secrets & Variables)

The application uses environment variables for the Gemini API key and to control the visibility of the AI health check button. These are securely managed using **GitHub Secrets** and **GitHub Variables** in your repository settings.

1. **Gemini API Key (Secret):**

   * Go to your GitHub repository settings.

   * Navigate to **Settings > Secrets and variables > Actions > Repository secrets**.

   * Click **New repository secret**.

   * Name: `GEMINI_API_KEY`

   * Value: Paste your actual Gemini API Key here.

   * Click "Add secret".

   * **DO NOT commit your actual API key directly into your code.** The GitHub Action will inject it during deployment.

2. **AI Button Visibility (Variable):**

   * Go to your GitHub repository settings.

   * Navigate to **Settings > Secrets and variables > Actions > Repository variables**.

   * Click **New repository variable**.

   * Name: `SHOW_AI_CHECK_BUTTON`

   * Value: Set to `true` or `false` (as a string).

   * Click "Add variable".

### GitHub Actions Workflow

The `.github/workflows/deploy.yml` file automates the deployment process:

* It checks out your code.

* It uses `sed` commands to replace placeholder values in `script.js` with your `GEMINI_API_KEY` (from secrets) and `SHOW_AI_CHECK_BUTTON` (from variables).

* It then deploys the modified files to GitHub Pages.

To enable GitHub Pages:

1. Go to your GitHub repository.

2. Navigate to **Settings > Pages**.

3. Under "Build and deployment", select **Deploy from a branch**.

4. Choose your primary branch (e.g., `main` or `master`) and select `/ (root)` as the folder.

5. Click **Save**.

Your site will be deployed automatically when changes are pushed to the configured branch.

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions workflow for deployment
├── index.html           # Main HTML file
├── style.css            # CSS styling
└── script.js            # JavaScript logic and AI integration
├── README.md            # This file

```

## Contributing

Feel free to fork this repository, open issues, or submit pull requests.
