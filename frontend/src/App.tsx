import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RiskDataProvider } from './context/RiskDataContext';
import { Shell } from './components/layout/Shell';

import { OverviewPage } from './pages/OverviewPage';
import { PortfolioAnalyticsPage } from './pages/PortfolioAnalyticsPage';
import { RiskModelsPage } from './pages/RiskModelsPage';
import { HistoricalVarPage } from './pages/HistoricalVarPage';
import { VolatilityAnalysisPage } from './pages/VolatilityAnalysisPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { StressTestingPage } from './pages/StressTestingPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { ReportsExportsPage } from './pages/ReportsExportsPage';
import { AboutPage } from './pages/AboutPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <RiskDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/portfolio" element={<PortfolioAnalyticsPage />} />
            <Route path="/risk-models" element={<RiskModelsPage />} />
            <Route path="/historical-var" element={<HistoricalVarPage />} />
            <Route path="/volatility" element={<VolatilityAnalysisPage />} />
            <Route path="/backtesting" element={<BacktestingPage />} />
            <Route path="/model-comparison" element={<ModelComparisonPage />} />
            <Route path="/stress-testing" element={<StressTestingPage />} />
            <Route path="/data-explorer" element={<DataExplorerPage />} />
            <Route path="/reports" element={<ReportsExportsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RiskDataProvider>
  );
}

export default App;
