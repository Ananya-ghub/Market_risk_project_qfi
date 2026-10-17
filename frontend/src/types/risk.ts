export interface FreshnessInfo {
  success: boolean;
  local_latest_date: string;
  market_latest_date: string;
  is_up_to_date: boolean;
  status: 'data_up_to_date' | 'updates_available' | 'refresh_in_progress' | 'refresh_completed' | 'refresh_failed' | 'refresh_unavailable';
  market_data_mtime?: string | null;
  analysis_mtime?: string | null;
  checked_at?: string;
  calendar_note?: string;
  error?: string;
  message?: string;
}

export interface PortfolioValuePoint {
  date: string;
  value: number;
}

export interface PortfolioReturnPoint {
  date: string;
  return: number;
}

export interface PortfolioPnlPoint {
  date: string;
  pnl: number;
}

export interface StockWeight {
  ticker: string;
  weight: number;
}

export interface VarSummaryItem {
  confidence: number;
  VaR_return: number;
  ES_return: number;
  VaR_dollars_initial_100k: number;
  ES_dollars_initial_100k: number;
  observations: number;
}

export interface RollingVarPoint {
  date: string;
  window: number;
  confidence: number;
  VaR_return: number;
  ES_return: number;
}

export interface VolatilitySeriesPoint {
  date: string;
  return: number;
  ewma_vol?: number;
  garch_vol?: number;
  gjr_vol?: number;
  rolling_vol_250?: number;
  standardized_return?: number;
}

export interface ModelParameter {
  parameter: string;
  estimate: number;
}

export interface BacktestSummaryItem {
  model: string;
  confidence: number;
  observations: number;
  exceptions: number;
  expected_exceptions: number;
  exception_rate: number;
  kupiec_LR: number;
  kupiec_p_value: number;
  independence_LR: number;
  independence_p_value: number;
  conditional_coverage_LR: number;
  conditional_coverage_p_value: number;
  kupiec_pass_5pct: boolean;
  independence_pass_5pct: boolean;
  conditional_coverage_pass_5pct: boolean;
}

export interface ExceptionPoint {
  date: string;
  model: string;
  confidence: number;
  exception: number;
}

export interface ModelComparisonItem {
  model: string;
  confidence: number;
  observations: number;
  exceptions: number;
  expected_exceptions: number;
  exception_rate: number;
  average_VaR: number;
  average_ES: number;
  VaR_std: number;
  worst_daily_loss: number;
}

export interface BaselineRisk {
  initial_investment: number;
  daily_volatility: number;
  covariance_portfolio_volatility: number;
  historical_var_99: number;
  historical_es_99: number;
  historical_var_99_dollars: number;
  historical_es_99_dollars: number;
}

export interface StressTestItem {
  scenario: string;
  type: string;
  portfolio_return_shock: number;
  stressed_loss_dollars: number;
  stressed_portfolio_value: number;
  description: string;
  loss_as_pct_initial: number;
  loss_rank: number;
}

export interface CatalogItem {
  filename: string;
  relativePath: string;
  publicPath: string;
  category: string;
  sizeBytes: number;
  lastModified: string;
}

export interface UserSettings {
  confidenceLevel: 0.95 | 0.99 | 0.995;
  chartTimeRange: '1Y' | '3Y' | '5Y' | 'ALL';
  tableDensity: 'compact' | 'comfortable';
  currency: 'USD' | 'EUR' | 'GBP';
  theme: 'dark-navy' | 'dark-slate' | 'terminal';
}
