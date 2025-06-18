// --- Global Variables ---
let portfolioChartInstance = null;
let lastCalculationInputs = {};
let currentProjectionView = 'Yearly';

// --- Environment Variables (for GitHub Pages) ---
// The actual API key will be set in GitHub Actions/Pages environment variables.
// In development, you might set it directly in your local environment.
const AI_API_KEY = "__GEMINI_API_KEY_PLACEHOLDER__";
const SHOW_AI_CHECK_BUTTON = true;

// --- DOM Elements ---
const calculateBtn = document.getElementById('calculateBtn');
const aiCheckBtn = document.getElementById('aiCheckBtn');
const viewYearlyBtn = document.getElementById('viewYearlyBtn');
const viewMonthlyBtn = document.getElementById('viewMonthlyBtn');

const resultsDiv = document.getElementById('results');
const projectionContainer = document.getElementById('projectionContainer');
const projectionHeader = document.getElementById('projectionHeader');
const projectionTableBody = document.getElementById('projectionTableBody');
const chartContainer = document.getElementById('chartContainer');
const aiAnalysisContainer = document.getElementById('aiAnalysisContainer');
const aiAnalysisResult = document.getElementById('aiAnalysisResult');
const aiLoading = document.getElementById('aiLoading');
const errorMessageDiv = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Control visibility of the AI Check button based on environment variable
    if (!SHOW_AI_CHECK_BUTTON) {
        aiCheckBtn.classList.add('ai-check-button-hidden');
    }

    calculateBtn.click(); // Perform an initial calculation on page load
});

// --- Event Listeners ---
calculateBtn.addEventListener('click', handleCalculation);
aiCheckBtn.addEventListener('click', handleAICheck);
viewYearlyBtn.addEventListener('click', () => setProjectionView('Yearly'));
viewMonthlyBtn.addEventListener('click', () => setProjectionView('Monthly'));

// --- Core Functions ---
function handleCalculation() {
    try {
        hideAllSections();
        const inputs = getInputs();
        validateInputs(inputs);

        lastCalculationInputs = { ...inputs };
        const { projectedCorpus, initialMonthlyWithdrawal } = calculateRetirement(inputs);
        lastCalculationInputs.projectedCorpus = projectedCorpus;
        lastCalculationInputs.initialMonthlyWithdrawal = initialMonthlyWithdrawal;
        console.log("Calculation complete. Projected Corpus:", projectedCorpus, "Initial Monthly Withdrawal:", initialMonthlyWithdrawal);

        displaySummary(projectedCorpus, initialMonthlyWithdrawal);
        const { tableHTML, chartLabels, chartData } = generateProjections();

        updateTable(tableHTML);
        renderChart(chartLabels, chartData);

        showResultSections();
        // Only enable if the button is supposed to be visible
        if (SHOW_AI_CHECK_BUTTON) {
            aiCheckBtn.disabled = false;
        }

    } catch (error) {
        console.error("Error in handleCalculation:", error);
        displayError(error.message);
    }
}

function setProjectionView(view) {
    if (currentProjectionView === view || !lastCalculationInputs.projectedCorpus) {
        console.log("Projection view already set or no data to project.");
        return;
    }
    currentProjectionView = view;
    updateToggleButtonUI();
    const { tableHTML } = generateProjections();
    updateTable(tableHTML);
}

function updateTable(html) {
     updateTableHeaders();
     projectionTableBody.innerHTML = html;
}

// --- Helper Functions ---
function getInputs() {
    return {
        currentMarketValue: parseFloat(document.getElementById('currentMarketValue').value) || 0,
        monthlySIP: parseFloat(document.getElementById('monthlySIP').value) || 0,
        sipTenureMonths: parseInt(document.getElementById('sipTenureMonths').value) || 0,
        marketReturnRate: parseFloat(document.getElementById('marketReturnRate').value) || 0,
        inflationRate: parseFloat(document.getElementById('inflationRate').value) || 0,
        swpTenure: parseInt(document.getElementById('swpTenure').value) || 0,
    };
}

function validateInputs(inputs) {
    for (const key in inputs) {
        if (isNaN(inputs[key]) || inputs[key] < 0) {
            throw new Error(`Invalid input for ${key}. Please enter a positive number.`);
        }
    }
    if (inputs.marketReturnRate <= inputs.inflationRate) {
        throw new Error("Market return rate must be greater than the inflation rate for a sustainable withdrawal.");
    }
}

function calculateRetirement({ currentMarketValue, monthlySIP, sipTenureMonths, marketReturnRate }) {
    const monthlyReturnRate = marketReturnRate / 100 / 12;
    const sipYears = sipTenureMonths / 12;
    // Calculate Future Value of Current Investment
    const fvOfCurrentInvestment = currentMarketValue * Math.pow((1 + (marketReturnRate / 100)), sipYears);
    // Calculate Future Value of SIP
    const fvOfSIP = monthlySIP * ((Math.pow(1 + monthlyReturnRate, sipTenureMonths) - 1) / monthlyReturnRate) * (1 + monthlyReturnRate);
    const projectedCorpus = fvOfCurrentInvestment + fvOfSIP;

    const { inflationRate, swpTenure } = lastCalculationInputs;
    // Calculate Real Return Rate (Adjusted for Inflation)
    const realReturnRate = ((1 + (marketReturnRate / 100)) / (1 + (inflationRate / 100))) - 1;
    // Calculate Monthly Real Return Rate
    const monthlyRealReturnRate = Math.pow((1 + realReturnRate), 1 / 12) - 1;
    // Calculate Initial Monthly Withdrawal using SWP formula
    const initialMonthlyWithdrawal = (projectedCorpus * monthlyRealReturnRate) / (1 - Math.pow(1 + monthlyRealReturnRate, -(swpTenure * 12)));

    return { projectedCorpus, initialMonthlyWithdrawal };
}

function generateProjections() {
    return currentProjectionView === 'Yearly'
        ? generateYearlyProjections()
        : generateMonthlyProjections();
}

function generateYearlyProjections() {
    const { projectedCorpus, initialMonthlyWithdrawal, marketReturnRate, inflationRate, swpTenure } = lastCalculationInputs;
    let tableHTML = '';
    const chartLabels = ['Start'];
    const chartData = [projectedCorpus];
    let openingBalance = projectedCorpus;
    let monthlyWithdrawal = initialMonthlyWithdrawal;

    for (let year = 1; year <= swpTenure; year++) {
        const annualWithdrawal = monthlyWithdrawal * 12;
        if (openingBalance < annualWithdrawal && year > 1) { // Break if balance is insufficient, unless it's the very first year
            console.warn(`Insufficient balance for annual withdrawal in year ${year}. Breaking projection.`);
            break;
        }
        const portfolioGain = (openingBalance - annualWithdrawal) * (marketReturnRate / 100);
        const closingBalance = openingBalance - annualWithdrawal + portfolioGain;
        tableHTML += buildRow([year, openingBalance, annualWithdrawal, portfolioGain, closingBalance]);
        chartLabels.push(`Year ${year}`);
        chartData.push(closingBalance);
        openingBalance = closingBalance;
        monthlyWithdrawal *= (1 + (inflationRate / 100));
    }
    return { tableHTML, chartLabels, chartData };
}

function generateMonthlyProjections() {
    const { projectedCorpus, initialMonthlyWithdrawal, marketReturnRate, inflationRate, swpTenure } = lastCalculationInputs;
    const monthlyReturnRate = marketReturnRate / 100 / 12;
    let tableHTML = '';
    const chartLabels = ['Start'];
    const chartData = [projectedCorpus];
    let openingBalance = projectedCorpus;
    let monthlyWithdrawal = initialMonthlyWithdrawal;

    for (let month = 1; month <= swpTenure * 12; month++) {
        if (openingBalance < monthlyWithdrawal && month > 1) { // Break if balance is insufficient, unless it's the very first month
            console.warn(`Insufficient balance for monthly withdrawal in month ${month}. Breaking projection.`);
            break;
        }
        const portfolioGain = (openingBalance - monthlyWithdrawal) * monthlyReturnRate;
        const closingBalance = openingBalance - monthlyWithdrawal + portfolioGain;
        tableHTML += buildRow([month, openingBalance, monthlyWithdrawal, portfolioGain, closingBalance]);
        openingBalance = closingBalance;
        // Push chart data yearly for cleaner chart, despite monthly table
        if (month % 12 === 0) {
            monthlyWithdrawal *= (1 + (inflationRate / 100));
            chartLabels.push(`Year ${month / 12}`);
            chartData.push(closingBalance);
        }
    }
    return { tableHTML, chartLabels, chartData };
}

// --- UI & Display Functions ---
function hideAllSections() {
    errorMessageDiv.classList.add('hidden');
    resultsDiv.classList.add('hidden');
    projectionContainer.classList.add('hidden');
    chartContainer.classList.add('hidden');
    aiAnalysisContainer.classList.add('hidden');
}

function showResultSections() {
    resultsDiv.classList.remove('hidden');
    projectionContainer.classList.remove('hidden');
    chartContainer.classList.remove('hidden');
}

function updateToggleButtonUI() {
    const isYearly = currentProjectionView === 'Yearly';
    viewYearlyBtn.classList.toggle('bg-white', isYearly);
    viewYearlyBtn.classList.toggle('text-indigo-600', isYearly);
    viewYearlyBtn.classList.toggle('shadow', isYearly);
    viewMonthlyBtn.classList.toggle('bg-white', !isYearly);
    viewMonthlyBtn.classList.toggle('text-indigo-600', !isYearly);
    viewMonthlyBtn.classList.toggle('shadow', !isYearly);
}

function updateTableHeaders() {
    const headers = currentProjectionView === 'Yearly'
        ? ['Year', 'Opening Balance', 'Annual Withdrawal', 'Portfolio Gain', 'Closing Balance']
        : ['Month', 'Opening Balance', 'Monthly Withdrawal', 'Portfolio Gain', 'Closing Balance'];
    projectionHeader.innerHTML = headers.map(h => `<th scope="col" class="px-6 py-3">${h}</th>`).join('');
}

function buildRow(data) {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    return `<tr class="bg-white border-b hover:bg-gray-50">
        <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${data[0]}</td>
        <td class="px-6 py-4">${formatter.format(data[1])}</td>
        <td class="px-6 py-4">${formatter.format(data[2])}</td>
        <td class="px-6 py-4 text-green-600">${formatter.format(data[3])}</td>
        <td class="px-6 py-4 font-semibold">${formatter.format(data[4])}</td>
    </tr>`;
}

function displaySummary(corpus, withdrawal) {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    document.getElementById('projectedCorpus').textContent = formatter.format(corpus);
    document.getElementById('monthlyWithdrawal').textContent = formatter.format(withdrawal);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    if (portfolioChartInstance) portfolioChartInstance.destroy();
    portfolioChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Balance',
                data: data,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => v >= 1e7 ? `₹${(v/1e7).toFixed(2)} Cr` : `₹${(v/1e5).toFixed(1)} L` } } },
            plugins: { tooltip: { callbacks: { label: c => ` Balance: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(c.parsed.y)}` } } }
        }
    });
}

function displayError(message) {
     console.error("Error:", message);
     errorText.innerHTML = message;
     errorMessageDiv.classList.remove('hidden'); // Make error message visible
}

async function handleAICheck() {
    if (!AI_API_KEY || AI_API_KEY === "__GEMINI_API_KEY_PLACEHOLDER__") {
        displayError("To get AI analysis, please fork <a href='https://github.com/itsluminous/swp-simulator' class='text-blue-600 hover:underline'>swp-simulator repository</a> and set the AI_API_KEY environment variable to gemini API key.");
        console.warn("AI_API_KEY is not set.");
        return;
    }

    aiAnalysisContainer.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiAnalysisResult.classList.add('hidden');
    aiCheckBtn.disabled = true;

    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    const { currentMarketValue, monthlySIP, sipTenureMonths, marketReturnRate, inflationRate, swpTenure, projectedCorpus, initialMonthlyWithdrawal } = lastCalculationInputs;

    const prompt = `You are a friendly and experienced financial advisor in India. Your goal is to provide a clear, helpful, and encouraging analysis of a user's retirement plan. Do not provide any financial advice that could be construed as professional investment advice. Frame all suggestions as educational and for informational purposes only, and add a disclaimer at the end. Based on the following data, please provide a "Financial Health Check":
        **User's Financial Data:**\n* Current Portfolio Value: ${formatter.format(currentMarketValue)}\n* Monthly SIP: ${formatter.format(monthlySIP)}\n* Remaining SIP Tenure: ${sipTenureMonths} months\n* Projected Retirement Corpus: ${formatter.format(projectedCorpus)}\n* Desired Retirement Period (SWP): ${swpTenure} years\n* Initial Monthly Withdrawal (SWP): ${formatter.format(initialMonthlyWithdrawal)}
        **Assumptions:**\n* Expected Annual Market Return: ${marketReturnRate}%\n* Expected Annual Inflation: ${inflationRate}%.
        **Your Analysis Should Include:**\n1.  **Overall Outlook:** Start with a brief, encouraging summary. Is the plan on track, ambitious, or cautious?\n2.  **Potential Strengths:** What are the strong points of this plan? (e.g., high savings rate, long investment horizon).\n3.  **Potential Risks & Blind Spots:** What should the user be mindful of? (e.g., sequence of returns risk, underestimating inflation, healthcare costs). Be specific.\n4.  **Actionable Suggestions:** Provide 2-3 clear, actionable tips. For example: "Consider creating a bucket for medical emergencies" or "Review your asset allocation as you near retirement."\n5.  **Lifestyle Snapshot:** Based on the initial monthly withdrawal of ${formatter.format(initialMonthlyWithdrawal)}, provide a sample monthly budget for a comfortable lifestyle in a major Indian metro city like Bangalore or Pune. Use categories like Housing, Food, Utilities, Transport, Healthcare, and Leisure.
        Please format your response using Markdown for clarity (headings, bold text, and lists).`;

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        const result = await response.json();

        if (result.candidates && result.candidates.length > 0) {
            aiAnalysisResult.innerHTML = marked.parse(result.candidates[0].content.parts[0].text);
        } else {
            throw new Error("Received an empty response from the AI. Please try again.");
        }
    } catch (error) {
        console.error("Error during AI analysis:", error);
        aiAnalysisResult.innerHTML = `<p class="text-red-600">Sorry, an error occurred while generating the analysis: ${error.message}</p>`;
        displayError(`AI Analysis Error: ${error.message}`); // Also show in the general error div
    } finally {
        aiLoading.classList.add('hidden');
        aiAnalysisResult.classList.remove('hidden');
        // Re-enable if the button is supposed to be visible
        if (SHOW_AI_CHECK_BUTTON) {
            aiCheckBtn.disabled = false;
        }
    }
}
