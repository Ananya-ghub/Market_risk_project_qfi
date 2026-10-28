import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  FreshnessInfo,
  PortfolioValuePoint,
  PortfolioReturnPoint,
  PortfolioPnlPoint,
  StockWeight,
  VarSummaryItem,
  RollingVarPoint,
  BacktestSummaryItem,
  ModelComparisonItem,
  BaselineRisk,
  StressTestItem,
  ModelParameter,
  VolatilitySeriesPoint,
  ExceptionPoint,
  UserSettings
} from '../types/risk';
import {
  clearCsvCache,
  loadPortfolioValue,
  loadPortfolioReturns,
  loadPortfolioPnl,
  loadPortfolioWeights,
  loadVarSummary,
  loadRollingVar,
  loadBacktestSummary,
  loadModelComparison,
  loadBaselineRisk,
  loadStressTests,
  loadParameters,
  loadCombinedVolatility,
  loadExceptionSeries
} from '../lib/csvLoader';

interface CalculatedMetrics {
  initialValue: number;
  latestValue: number;
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestDay: { return: number; date: string };
  worstDay: { return: number; date: string };
  stockCount: number;
  latestDate: string;
}

interface RiskDataContextType {
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  freshness: FreshnessInfo;
  metrics: CalculatedMetrics | null;
  portfolioValues: PortfolioValuePoint[];
  portfolioReturns: PortfolioReturnPoint[];
  portfolioPnl: PortfolioPnlPoint[];
  portfolioWeights: StockWeight[];
  varSummary: VarSummaryItem[];
  rollingVar: RollingVarPoint[];
  backtestSummary: BacktestSummaryItem[];
  modelComparison: ModelComparisonItem[];
  baselineRisk: BaselineRisk | null;
  stressTests: StressTestItem[];
  garchParams: ModelParameter[];
  gjrParams: ModelParameter[];
  volatilitySeries: VolatilitySeriesPoint[];
  exceptionSeries: ExceptionPoint[];
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  triggerRefresh: () => Promise<void>;
}

const defaultSettings: UserSettings = {
  confidenceLevel: 0.99,
  chartTimeRange: 'ALL',
  tableDensity: 'comfortable',
  currency: 'USD',
  theme: 'dark-navy'
};

const defaultFreshness: FreshnessInfo = {
  success: true,
  local_latest_date: '2026-10-08',
  market_latest_date: '2026-10-08',
  is_up_to_date: true,
  status: 'data_up_to_date',
  checked_at: new Date().toISOString()
};

const RiskDataContext = createContext<RiskDataContextType | undefined>(undefined);

export const RiskDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [freshness, setFreshness] = useState<FreshnessInfo>(defaultFreshness);
  const [metrics, setMetrics] = useState<CalculatedMetrics | null>(null);

  const [portfolioValues, setPortfolioValues] = useState<PortfolioValuePoint[]>([]);
  const [portfolioReturns, setPortfolioReturns] = useState<PortfolioReturnPoint[]>([]);
  const [portfolioPnl, setPortfolioPnl] = useState<PortfolioPnlPoint[]>([]);
  const [portfolioWeights, setPortfolioWeights] = useState<StockWeight[]>([]);
  const [varSummary, setVarSummary] = useState<VarSummaryItem[]>([]);
  const [rollingVar, setRollingVar] = useState<RollingVarPoint[]>([]);
  const [backtestSummary, setBacktestSummary] = useState<BacktestSummaryItem[]>([]);
  const [modelComparison, setModelComparison] = useState<ModelComparisonItem[]>([]);
  const [baselineRisk, setBaselineRisk] = useState<BaselineRisk | null>(null);
  const [stressTests, setStressTests] = useState<StressTestItem[]>([]);
  const [garchParams, setGarchParams] = useState<ModelParameter[]>([]);
  const [gjrParams, setGjrParams] = useState<ModelParameter[]>([]);
  const [volatilitySeries, setVolatilitySeries] = useState<VolatilitySeriesPoint[]>([]);
  const [exceptionSeries, setExceptionSeries] = useState<ExceptionPoint[]>([]);

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('quant_terminal_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('quant_terminal_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Check market freshness
  const checkFreshness = useCallback(async () => {
    // In local dev with Vite server, attempt /api/freshness first
    if (import.meta.env.DEV) {
      try {
        const res = await fetch('/api/freshness');
        if (res.ok) {
          const text = await res.text();
          if (text && !text.trim().startsWith('<')) {
            setFreshness(JSON.parse(text));
            return;
          }
        }
      } catch {
        // Fall back below
      }
    }

    // Always fetch freshness.json with cache buster
    try {
      const res = await fetch(`/data/freshness.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (res.ok) {
        const text = await res.text();
        if (text && !text.trim().startsWith('<')) {
          const parsed = JSON.parse(text);
          setFreshness({
            ...parsed,
            checked_at: new Date().toISOString()
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Could not contact /data/freshness.json, using verified metadata', e);
    }
  }, []);

  // Main data load function
  const loadAllData = useCallback(async (forceRefresh = false) => {
    try {
      await checkFreshness();

      const [
        values,
        returns,
        pnl,
        weights,
        vSummary,
        rVar,
        bSummary,
        mComp,
        bRisk,
        sTests,
        gParams,
        gjrP,
        volSeries,
        eSeries
      ] = await Promise.all([
        loadPortfolioValue(forceRefresh).catch((e) => {
          console.warn('portfolio_value.csv load failed:', e);
          return [];
        }),
        loadPortfolioReturns(forceRefresh).catch((e) => {
          console.warn('portfolio_returns.csv load failed:', e);
          return [];
        }),
        loadPortfolioPnl(forceRefresh).catch((e) => {
          console.warn('portfolio_pnl.csv load failed:', e);
          return [];
        }),
        loadPortfolioWeights(forceRefresh).catch((e) => {
          console.warn('portfolio_weights.csv load failed:', e);
          return [];
        }),
        loadVarSummary(forceRefresh).catch((e) => {
          console.warn('var_summary.csv load failed:', e);
          return [];
        }),
        loadRollingVar(forceRefresh).catch((e) => {
          console.warn('rolling_var.csv load failed:', e);
          return [];
        }),
        loadBacktestSummary(forceRefresh).catch((e) => {
          console.warn('backtesting_summary.csv load failed:', e);
          return [];
        }),
        loadModelComparison(forceRefresh).catch((e) => {
          console.warn('model_comparison.csv load failed:', e);
          return [];
        }),
        loadBaselineRisk(forceRefresh).catch((e) => {
          console.warn('baseline_risk.csv load failed:', e);
          return null;
        }),
        loadStressTests(forceRefresh).catch((e) => {
          console.warn('stress_test_results.csv load failed:', e);
          return [];
        }),
        loadParameters('/outputs/phase6/garch_parameters.csv', forceRefresh).catch(() => []),
        loadParameters('/outputs/phase7/gjr_garch_parameters.csv', forceRefresh).catch(() => []),
        loadCombinedVolatility(forceRefresh).catch(() => []),
        loadExceptionSeries(forceRefresh).catch(() => [])
      ]);

      if (values.length === 0 && returns.length === 0) {
        setError('Core portfolio datasets (portfolio_value.csv, portfolio_returns.csv) could not be loaded. Please ensure data files are present in /data/processed/.');
      } else {
        setError(null);
      }

      setPortfolioValues(values);
      setPortfolioReturns(returns);
      setPortfolioPnl(pnl);
      setPortfolioWeights(weights);
      setVarSummary(vSummary);
      setRollingVar(rVar);
      setBacktestSummary(bSummary);
      setModelComparison(mComp);
      setBaselineRisk(bRisk);
      setStressTests(sTests);
      setGarchParams(gParams);
      setGjrParams(gjrP);
      setVolatilitySeries(volSeries);
      setExceptionSeries(eSeries);

      // Compute overall metrics
      if (values.length > 0 && returns.length > 0) {
        const initVal = 100000;
        const latVal = values[values.length - 1].value;
        const totRet = (latVal / initVal - 1) * 100;
        const nDays = returns.length;
        const annRet = (Math.pow(latVal / initVal, 252 / nDays) - 1) * 100;

        // Standard deviation of returns
        const rVals = returns.map((r) => r.return);
        const meanRet = rVals.reduce((a, b) => a + b, 0) / nDays;
        const variance = rVals.reduce((a, b) => a + Math.pow(b - meanRet, 2), 0) / (nDays - 1);
        const dailyVol = Math.sqrt(variance);
        const annVol = dailyVol * Math.sqrt(252) * 100;

        const sharpe = (annRet / 100 - 0.04) / (annVol / 100);

        // Max drawdown
        let maxVal = -Infinity;
        let maxDd = 0;
        for (const pt of values) {
          if (pt.value > maxVal) maxVal = pt.value;
          const dd = (pt.value - maxVal) / maxVal;
          if (dd < maxDd) maxDd = dd;
        }

        let best = { return: -Infinity, date: '' };
        let worst = { return: Infinity, date: '' };
        for (const r of returns) {
          if (r.return > best.return) best = { return: r.return * 100, date: r.date };
          if (r.return < worst.return) worst = { return: r.return * 100, date: r.date };
        }

        setMetrics({
          initialValue: initVal,
          latestValue: latVal,
          totalReturn: totRet,
          annualizedReturn: annRet,
          annualizedVolatility: annVol,
          sharpeRatio: sharpe,
          maxDrawdown: maxDd * 100,
          bestDay: best,
          worstDay: worst,
          stockCount: weights.length || 50,
          latestDate: values[values.length - 1].date
        });
      }
    } catch (err: any) {
      console.error('Data loading error:', err);
      setError(err.message || 'Failed to load portfolio risk datasets');
    }
  }, [checkFreshness]);

  // Initial Data Load
  useEffect(() => {
    async function initData() {
      setLoading(true);
      setError(null);
      try {
        await loadAllData(false);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, [loadAllData]);

  // Explicit user refresh trigger
  const triggerRefresh = async () => {
    setRefreshing(true);
    try {
      clearCsvCache();
      if (import.meta.env.DEV) {
        try {
          await fetch('/api/refresh', { method: 'POST' });
        } catch {
          // ignore dev server error
        }
      }
      await loadAllData(true);
    } catch (e: any) {
      console.warn('Manual refresh error:', e);
      setError(e.message || 'Failed to refresh datasets');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <RiskDataContext.Provider
      value={{
        loading,
        error,
        refreshing,
        freshness,
        metrics,
        portfolioValues,
        portfolioReturns,
        portfolioPnl,
        portfolioWeights,
        varSummary,
        rollingVar,
        backtestSummary,
        modelComparison,
        baselineRisk,
        stressTests,
        garchParams,
        gjrParams,
        volatilitySeries,
        exceptionSeries,
        settings,
        updateSettings,
        triggerRefresh
      }}
    >
      {children}
    </RiskDataContext.Provider>
  );
};

export const useRiskData = () => {
  const context = useContext(RiskDataContext);
  if (!context) {
    throw new Error('useRiskData must be used within a RiskDataProvider');
  }
  return context;
};
