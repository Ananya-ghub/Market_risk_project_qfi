# Advanced Equity Portfolio Risk Management — Quantitative Frontend

Professional institutional risk analytics terminal built with **React 19, TypeScript, Vite, Tailwind CSS, Recharts, and Lucide Icons**.

This frontend presents the quantitative finance research and econometric market risk models developed in the Python backend:
- **Value at Risk (VaR)** & **Expected Shortfall (ES / CVaR)**
- **EWMA Volatility Scaling** ($\lambda = 0.94$)
- **GARCH(1,1)** with Student's $t$ innovations
- **GJR-GARCH** with asymmetric downside leverage effect
- **Kupiec POF** and **Christoffersen Independence** Backtesting
- **Stress Testing** across historical crashes, volatility surges, and sector shocks

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Python (v3.10+) with `yfinance` installed for live exchange freshness verification

### Installation & Launch

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The terminal will automatically mirror the required datasets into `public/` and launch the Vite development server at:
**`http://localhost:5173/`**

### Production Build

```bash
cd frontend
npm run build
npm run preview
```

---

## 12-Page Navigation Directory

| Route | Page Name | Core Functionality |
| :--- | :--- | :--- |
| `/` | **Overview Dashboard** | 10 KPI metric cards, capital trajectory area chart, daily P&L bars, and backtest summary. |
| `/portfolio` | **Portfolio Analytics** | Cumulative portfolio growth, daily dollar P&L, extreme returns, and 50-stock weights. |
| `/risk-models` | **Risk Models** | Econometric equations, fitted GARCH/GJR parameters, assumptions, and limitations. |
| `/historical-var` | **Historical VaR & ES** | Tail loss cutoffs, return distribution histogram, and rolling window comparisons (250/500/750d). |
| `/volatility` | **Volatility Analysis** | Multi-model volatility comparison aligning EWMA, GARCH, and GJR-GARCH. |
| `/backtesting` | **VaR Backtesting** | Kupiec POF Likelihood Ratio and Christoffersen independence Markov chain tests. |
| `/model-comparison` | **Model Comparison** | Evaluation across 2,711 post-warmup sessions: average VaR, ES, and dynamism. |
| `/stress-testing` | **Stress Testing** | Baseline risk, macro crash shocks, and an interactive hypothetical client-side simulator. |
| `/data-explorer` | **Data Explorer** | Interactive inspector for 20 project CSVs with search, schema inspection, and download. |
| `/reports` | **Reports & Exports** | Standardized executive compliance audit with CSV and printable PDF reporting. |
| `/about` | **About Project** | 10-phase pipeline architecture, regulatory alignment, and GitHub repository links. |
| `/settings` | **Settings & Diagnostics** | User preferences, regulatory confidence levels, and data freshness diagnostics. |

---

## Data Freshness & Pipeline Separation Architecture

The application strictly separates **Market Data Freshness** from **Analysis Model Freshness**:
- When the dashboard opens, `/api/freshness` inspects the Yahoo Finance exchange calendar for SPY.
- If newer market sessions have occurred since the last local run, an informational banner appears:
  *"The exchange has published data up to [Date], whereas the current risk models were computed on data through [Date]."*
- Clicking **"Refresh"** verifies the latest market date without fabricating numbers or claiming that downstream models have been rerun.
