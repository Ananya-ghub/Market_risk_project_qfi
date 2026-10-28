import Papa from 'papaparse';
import {
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
  ExceptionPoint
} from '../types/risk';

const cache = new Map<string, string>();

export function clearCsvCache(): void {
  cache.clear();
}

export async function fetchCsvText(url: string, forceRefresh = false): Promise<string> {
  if (!forceRefresh && cache.has(url)) {
    return cache.get(url)!;
  }

  // Try direct path first, then fallback to public path prefix
  const pathsToTry = [url];
  if (!url.startsWith('/')) {
    pathsToTry.unshift('/' + url);
  }

  let text = '';
  let lastError: Error | null = null;

  for (const basePath of pathsToTry) {
    try {
      const fetchUrl = forceRefresh
        ? `${basePath}${basePath.includes('?') ? '&' : '?'}t=${Date.now()}`
        : basePath;

      const response = await fetch(fetchUrl, {
        cache: forceRefresh ? 'no-cache' : 'default',
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : undefined
      });

      if (response.ok) {
        const candidate = await response.text();
        const trimmed = candidate.trim();
        // Guard against SPA 404 falling back to index.html
        if (
          trimmed.startsWith('<!DOCTYPE') ||
          trimmed.startsWith('<!doctype') ||
          trimmed.startsWith('<html') ||
          trimmed.includes('window.__vite_plugin_react_preamble_installed__')
        ) {
          lastError = new Error(`File at ${basePath} returned an HTML document (file not found on static host)`);
          continue;
        }
        if (trimmed.length > 0) {
          text = candidate;
          break;
        }
      } else {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!text) {
    throw new Error(`Failed to load CSV from ${url}: ${lastError?.message || 'Not found'}`);
  }

  cache.set(url, text);
  return text;
}

export async function parseCsv<T = any>(
  url: string,
  options?: Papa.ParseConfig,
  forceRefresh = false
): Promise<T[]> {
  const text = await fetchCsvText(url, forceRefresh);
  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      ...options,
      complete: (results) => {
        resolve(results.data as T[]);
      },
      error: (err: any) => {
        reject(err);
      }
    });
  });
}

export async function loadPortfolioValue(forceRefresh = false): Promise<PortfolioValuePoint[]> {
  const rows = await parseCsv<{ Date: string; portfolio_value: number }>(
    '/data/processed/portfolio_value.csv',
    undefined,
    forceRefresh
  );
  return rows
    .filter((r) => r.Date && typeof r.portfolio_value === 'number')
    .map((r) => ({
      date: r.Date,
      value: Number(r.portfolio_value)
    }));
}

export async function loadPortfolioReturns(forceRefresh = false): Promise<PortfolioReturnPoint[]> {
  const rows = await parseCsv<{ Date: string; portfolio_return: number }>(
    '/data/processed/portfolio_returns.csv',
    undefined,
    forceRefresh
  );
  return rows
    .filter((r) => r.Date && typeof r.portfolio_return === 'number')
    .map((r) => ({
      date: r.Date,
      return: Number(r.portfolio_return)
    }));
}

export async function loadPortfolioPnl(forceRefresh = false): Promise<PortfolioPnlPoint[]> {
  const rows = await parseCsv<{ Date: string; daily_pnl: number }>(
    '/data/processed/portfolio_pnl.csv',
    undefined,
    forceRefresh
  );
  return rows
    .filter((r) => r.Date && typeof r.daily_pnl === 'number')
    .map((r) => ({
      date: r.Date,
      pnl: Number(r.daily_pnl)
    }));
}

export async function loadPortfolioWeights(forceRefresh = false): Promise<StockWeight[]> {
  const rows = await parseCsv<any>(
    '/data/processed/portfolio_weights.csv',
    undefined,
    forceRefresh
  );
  return rows.map((r) => {
    const keys = Object.keys(r);
    const tickerKey = keys.find((k) => k.toLowerCase() === 'ticker') || keys.find((k) => k !== 'weight') || keys[0];
    return {
      ticker: String(r[tickerKey] || r['Unnamed: 0'] || r[''] || 'STOCK'),
      weight: Number(r.weight || 0.02)
    };
  });
}

export async function loadVarSummary(forceRefresh = false): Promise<VarSummaryItem[]> {
  return await parseCsv<VarSummaryItem>('/outputs/phase4/var_summary.csv', undefined, forceRefresh);
}

export async function loadRollingVar(forceRefresh = false): Promise<RollingVarPoint[]> {
  const rows = await parseCsv<any>('/outputs/phase4/rolling_var.csv', undefined, forceRefresh);
  return rows
    .filter((r) => r.date && typeof r.VaR_return === 'number' && !isNaN(r.VaR_return))
    .map((r) => ({
      date: String(r.date),
      window: Number(r.window),
      confidence: Number(r.confidence),
      VaR_return: Number(r.VaR_return),
      ES_return: Number(r.ES_return)
    }));
}

export async function loadBacktestSummary(forceRefresh = false): Promise<BacktestSummaryItem[]> {
  const rows = await parseCsv<any>('/outputs/phase8/backtesting_summary.csv', undefined, forceRefresh);
  return rows.map((r) => ({
    model: String(r.model),
    confidence: Number(r.confidence),
    observations: Number(r.observations),
    exceptions: Number(r.exceptions),
    expected_exceptions: Number(r.expected_exceptions),
    exception_rate: Number(r.exception_rate),
    kupiec_LR: Number(r.kupiec_LR),
    kupiec_p_value: Number(r.kupiec_p_value),
    independence_LR: Number(r.independence_LR),
    independence_p_value: Number(r.independence_p_value),
    conditional_coverage_LR: Number(r.conditional_coverage_LR),
    conditional_coverage_p_value: Number(r.conditional_coverage_p_value),
    kupiec_pass_5pct: r.kupiec_pass_5pct === true || r.kupiec_pass_5pct === 'True',
    independence_pass_5pct: r.independence_pass_5pct === true || r.independence_pass_5pct === 'True',
    conditional_coverage_pass_5pct: r.conditional_coverage_pass_5pct === true || r.conditional_coverage_pass_5pct === 'True'
  }));
}

export async function loadExceptionSeries(forceRefresh = false): Promise<ExceptionPoint[]> {
  const rows = await parseCsv<any>('/outputs/phase8/exception_series.csv', undefined, forceRefresh);
  return rows.map((r) => ({
    date: String(r.date),
    model: String(r.model),
    confidence: Number(r.confidence),
    exception: Number(r.exception)
  }));
}

export async function loadModelComparison(forceRefresh = false): Promise<ModelComparisonItem[]> {
  const rows = await parseCsv<any>('/outputs/phase9/model_comparison.csv', undefined, forceRefresh);
  return rows.map((r) => ({
    model: String(r.model),
    confidence: Number(r.confidence),
    observations: Number(r.observations),
    exceptions: Number(r.exceptions),
    expected_exceptions: Number(r.expected_exceptions),
    exception_rate: Number(r.exception_rate),
    average_VaR: Number(r.average_VaR),
    average_ES: Number(r.average_ES),
    VaR_std: Number(r.VaR_std),
    worst_daily_loss: Number(r.worst_daily_loss)
  }));
}

export async function loadBaselineRisk(forceRefresh = false): Promise<BaselineRisk> {
  const rows = await parseCsv<any>('/outputs/phase10/baseline_risk.csv', undefined, forceRefresh);
  if (rows.length === 0) {
    return {
      initial_investment: 100000,
      daily_volatility: 0.01075,
      covariance_portfolio_volatility: 0.01075,
      historical_var_99: 0.03048,
      historical_es_99: 0.04407,
      historical_var_99_dollars: 3048.62,
      historical_es_99_dollars: 4407.53
    };
  }
  const r = rows[0];
  return {
    initial_investment: Number(r.initial_investment),
    daily_volatility: Number(r.daily_volatility),
    covariance_portfolio_volatility: Number(r.covariance_portfolio_volatility),
    historical_var_99: Number(r.historical_var_99),
    historical_es_99: Number(r.historical_es_99),
    historical_var_99_dollars: Number(r.historical_var_99_dollars),
    historical_es_99_dollars: Number(r.historical_es_99_dollars)
  };
}

export async function loadStressTests(forceRefresh = false): Promise<StressTestItem[]> {
  const rows = await parseCsv<any>('/outputs/phase10/stress_test_results.csv', undefined, forceRefresh);
  return rows.map((r) => ({
    scenario: String(r.scenario),
    type: String(r.type),
    portfolio_return_shock: Number(r.portfolio_return_shock),
    stressed_loss_dollars: Number(r.stressed_loss_dollars),
    stressed_portfolio_value: Number(r.stressed_portfolio_value),
    description: String(r.description),
    loss_as_pct_initial: Number(r.loss_as_pct_initial),
    loss_rank: Number(r.loss_rank)
  }));
}

export async function loadParameters(filepath: string, forceRefresh = false): Promise<ModelParameter[]> {
  const rows = await parseCsv<any>(filepath, undefined, forceRefresh);
  return rows.map((r) => ({
    parameter: String(r.parameter),
    estimate: Number(r.estimate)
  }));
}

export async function loadCombinedVolatility(forceRefresh = false): Promise<VolatilitySeriesPoint[]> {
  // Combine EWMA, GARCH, and GJR volatility series with returns safely
  const [ewma, garch, gjr] = await Promise.all([
    parseCsv<any>('/outputs/phase5/ewma_results.csv', undefined, forceRefresh).catch(() => []),
    parseCsv<any>('/outputs/phase6/garch_results.csv', undefined, forceRefresh).catch(() => []),
    parseCsv<any>('/outputs/phase7/gjr_garch_results.csv', undefined, forceRefresh).catch(() =>
      parseCsv<any>('/outputs/phase7/gjr_results.csv', undefined, forceRefresh).catch(() => [])
    )
  ]);

  const map = new Map<string, VolatilitySeriesPoint>();

  ewma.forEach((row) => {
    const d = row.Date || row.date;
    if (d) {
      map.set(d, {
        date: d,
        return: Number(row.portfolio_return) || 0,
        ewma_vol: Number(row.ewma_volatility) || undefined,
        standardized_return: Number(row.standardized_return) || undefined
      });
    }
  });

  garch.forEach((row) => {
    const d = row.Date || row.date;
    if (d && map.has(d)) {
      const item = map.get(d)!;
      item.garch_vol = Number(row.conditional_volatility) || undefined;
    }
  });

  gjr.forEach((row) => {
    const d = row.Date || row.date;
    if (d && map.has(d)) {
      const item = map.get(d)!;
      item.gjr_vol = Number(row.conditional_volatility) || undefined;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
