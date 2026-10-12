import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Zap,
  Info,
  Package,
  Layers,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { RoiAssumptions, FailedPickCase, InvestigationRecord } from '../../types';
import { DEFAULT_ROI_ASSUMPTIONS } from '../../data/mockData';

interface ManagerRoiDashboardProps {
  onGoToSupervisor?: () => void;
  onGoToPicker?: () => void;
  cases?: FailedPickCase[];
  investigations?: InvestigationRecord[];
}

export const ManagerRoiDashboard: React.FC<ManagerRoiDashboardProps> = ({
  onGoToSupervisor,
  onGoToPicker,
  cases = [],
  investigations = [],
}) => {
  const [assumptions, setAssumptions] = useState<RoiAssumptions>(DEFAULT_ROI_ASSUMPTIONS);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  // Safe updater for editable assumptions handling zero, negative, or invalid inputs
  const updateAssumption = (key: keyof RoiAssumptions, rawValue: number) => {
    const value = Math.max(0, isNaN(rawValue) ? 0 : rawValue);
    setAssumptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetDefaults = () => {
    setAssumptions(DEFAULT_ROI_ASSUMPTIONS);
  };

  // 1. Evidence-tier usage calculated from active cases data
  const evidenceTierStats = useMemo(() => {
    if (!cases || cases.length === 0) {
      return {
        tier1Percent: 0,
        tier2Percent: 0,
        insufficientPercent: 0,
        totalCases: 0,
      };
    }

    const total = cases.length;
    const tier1Count = cases.filter(
      (c) => c.evidenceTierUsed === 'TIER_1_SCANNER_WMS' || c.evidenceTierUsed === 'TRANSACTION_SCANNER'
    ).length;
    const tier2Count = cases.filter(
      (c) => c.evidenceTierUsed === 'TIER_2_TARGETED_CAMERA' || c.evidenceTierUsed === 'SCANNER_ONLY'
    ).length;
    const insufficientCount = cases.filter(
      (c) => c.evidenceTierUsed === 'INSUFFICIENT' || c.evidenceTierUsed === 'CONFLICTING' || c.evidenceTierUsed === 'STALE'
    ).length;

    return {
      tier1Percent: Math.round((tier1Count / total) * 100),
      tier2Percent: Math.round((tier2Count / total) * 100),
      insufficientPercent: Math.round((insufficientCount / total) * 100),
      totalCases: total,
    };
  }, [cases]);

  // 2. Median resolution time calculated from completed cases with recorded timestamps
  const medianResolutionTime = useMemo(() => {
    const casesWithTime = cases.filter((c) => c.resolutionTime && c.resolutionTime.includes(':'));
    if (casesWithTime.length === 0) {
      return null;
    }

    const secondsList = casesWithTime
      .map((c) => {
        const parts = (c.resolutionTime || '').split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return parts[0] * 60 + parts[1];
        }
        return null;
      })
      .filter((s): s is number => s !== null)
      .sort((a, b) => a - b);

    if (secondsList.length === 0) return null;

    const mid = Math.floor(secondsList.length / 2);
    const medianSec =
      secondsList.length % 2 !== 0
        ? secondsList[mid]
        : Math.round((secondsList[mid - 1] + secondsList[mid]) / 2);

    const mins = Math.floor(medianSec / 60);
    const secs = medianSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [cases]);

  // 3. Real-time Transparent Financial & Operational Calculations
  const calculations = useMemo(() => {
    const monthlyFailedPicks = Math.max(
      0,
      assumptions.failedPicksPerDay * assumptions.operatingDaysPerMonth
    );

    // Labour search cost before vs after
    const searchHoursBefore = (assumptions.searchTimeBeforeMins / 60) * monthlyFailedPicks;
    const searchHoursAfter = (assumptions.searchTimeAfterMins / 60) * monthlyFailedPicks;
    const monthlySearchLabourCostBefore = searchHoursBefore * assumptions.hourlyLaborCost;
    const monthlySearchLabourCostAfter = searchHoursAfter * assumptions.hourlyLaborCost;
    const searchLabourSavingsMonthly = Math.max(0, monthlySearchLabourCostBefore - monthlySearchLabourCostAfter);

    // Delayed or cancelled orders & recoverable margin
    const recoveryRate = Math.min(1, Math.max(0, assumptions.expectedRecoveryRatePercent / 100));
    const contributionMargin = Math.min(1, Math.max(0, assumptions.contributionMarginPercent / 100));

    const delayedOrdersMonthly = monthlyFailedPicks * (assumptions.delayedOrdersPercent / 100);
    const ordersRecoveredMonthly = Math.round(delayedOrdersMonthly * recoveryRate);

    // REVENUE vs MARGIN: Only contribution margin is treated as recoverable economic value
    const orderRevenueRecovered = ordersRecoveredMonthly * assumptions.avgOrderValue;
    const recoverableOrderMargin = orderRevenueRecovered * contributionMargin;

    // Avoided stock write-offs
    const writeOffUnitsMonthly = monthlyFailedPicks * (assumptions.stockWriteOffPercent / 100);
    const writeOffUnitsSavedMonthly = Math.round(writeOffUnitsMonthly * recoveryRate);
    const avoidedWriteOffValue = writeOffUnitsSavedMonthly * assumptions.avgItemWriteOffCost;

    // Baseline monthly cost of failed picks (labour search before + lost contribution margin + lost stock cost)
    const baselineMonthlyCostOfFailedPicks =
      monthlySearchLabourCostBefore +
      (delayedOrdersMonthly * assumptions.avgOrderValue * contributionMargin) +
      (writeOffUnitsMonthly * assumptions.avgItemWriteOffCost);

    // Costs: Investigation costs + Monthly StockTrace software subscription
    const totalInvestigationCostsMonthly = monthlyFailedPicks * assumptions.avgInvestigationCostPerCase;
    const monthlySoftwareCost = assumptions.monthlySoftwareCost;
    const totalApplicableCosts = totalInvestigationCostsMonthly + monthlySoftwareCost;

    // Gross Benefit (Labor savings + Recovered contribution margin + Avoided write-offs)
    const estimatedMonthlyGrossBenefit =
      searchLabourSavingsMonthly + recoverableOrderMargin + avoidedWriteOffValue;

    // Net Benefit after applicable costs
    const estimatedMonthlyNetBenefit = estimatedMonthlyGrossBenefit - totalApplicableCosts;
    const annualizedNetBenefit = estimatedMonthlyNetBenefit * 12;

    const timeSavedPercent = assumptions.searchTimeBeforeMins > 0
      ? Math.round(
          ((assumptions.searchTimeBeforeMins - assumptions.searchTimeAfterMins) /
            assumptions.searchTimeBeforeMins) *
            100
        )
      : 0;

    return {
      monthlyFailedPicks,
      monthlySearchLabourCostBefore,
      monthlySearchLabourCostAfter,
      searchLabourSavingsMonthly,
      delayedOrdersMonthly,
      ordersRecoveredMonthly,
      orderRevenueRecovered,
      recoverableOrderMargin,
      writeOffUnitsMonthly,
      writeOffUnitsSavedMonthly,
      avoidedWriteOffValue,
      baselineMonthlyCostOfFailedPicks,
      totalInvestigationCostsMonthly,
      monthlySoftwareCost,
      totalApplicableCosts,
      estimatedMonthlyGrossBenefit,
      estimatedMonthlyNetBenefit,
      annualizedNetBenefit,
      timeSavedPercent,
    };
  }, [assumptions]);

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-mono uppercase">
              Operational Analytics
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Bengaluru Distribution Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 mt-1">
            Warehouse Manager ROI &amp; Exception Impact Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimate the potential financial and operational impact of resolving inventory exceptions using transparent, user-editable assumptions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-semibold cursor-pointer shadow-2xs transition-colors flex items-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>{showFormulaDetails ? 'Hide Formulas' : 'Show Formulas & Notes'}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md font-semibold cursor-pointer shadow-2xs transition-colors flex items-center space-x-1"
            title="Reset to default baseline assumptions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Mandatory Financial Integrity Notice */}
      <div className="bg-slate-50 border-l-4 border-slate-700 p-3.5 rounded-r-lg text-xs text-slate-600 space-y-1">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <Info className="w-4 h-4 text-slate-700 shrink-0" />
          <span>FINANCIAL INTEGRITY &amp; ESTIMATION POLICY:</span>
        </div>
        <p className="leading-relaxed">
          All outputs displayed are illustrative potential savings derived directly from user-editable operational assumptions. They are not historical measured savings. Order recovery value reflects <strong>contribution margin ({assumptions.contributionMarginPercent}%)</strong> rather than full order value. Labor, order margin, and inventory write-offs are tracked independently to prevent double-counting.
        </p>
      </div>

      {/* Formula & Calculation Transparency Drawer */}
      {showFormulaDetails && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Calculation Formulas &amp; Methodology
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Auditable Economic Model</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">1. Search Labour Savings:</span>
              <p className="font-mono text-[11px] text-slate-600">
                (Time Before - Time After) / 60 &times; Failed Picks/mo &times; Labour Wage/hr
              </p>
              <p className="text-[11px] text-slate-500">
                = ({assumptions.searchTimeBeforeMins}m - {assumptions.searchTimeAfterMins}m)/60 &times; {calculations.monthlyFailedPicks} &times; ₹{assumptions.hourlyLaborCost} = <strong>{formatInr(calculations.searchLabourSavingsMonthly)}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">2. Recoverable Order Margin:</span>
              <p className="font-mono text-[11px] text-slate-600">
                Failed Picks/mo &times; Delayed Order % &times; Recovery Rate &times; AOV &times; Margin %
              </p>
              <p className="text-[11px] text-slate-500">
                = {calculations.ordersRecoveredMonthly} orders &times; ₹{assumptions.avgOrderValue} &times; {assumptions.contributionMarginPercent}% = <strong>{formatInr(calculations.recoverableOrderMargin)}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">3. Avoided Write-offs:</span>
              <p className="font-mono text-[11px] text-slate-600">
                Failed Picks/mo &times; Write-off % &times; Recovery Rate &times; Item Write-off Cost
              </p>
              <p className="text-[11px] text-slate-500">
                = {calculations.writeOffUnitsSavedMonthly} units &times; ₹{assumptions.avgItemWriteOffCost} = <strong>{formatInr(calculations.avoidedWriteOffValue)}</strong>
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
            <span>Net Monthly Benefit = Gross Benefit ({formatInr(calculations.estimatedMonthlyGrossBenefit)}) - Investigation Costs ({formatInr(calculations.totalInvestigationCostsMonthly)}) - Software Cost ({formatInr(calculations.monthlySoftwareCost)})</span>
            <strong className="text-emerald-700 font-mono text-sm">{formatInr(calculations.estimatedMonthlyNetBenefit)} / mo</strong>
          </div>
        </div>
      )}

      {/* TOP OUTPUT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Estimated Net Monthly Benefit */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Estimated Net Benefit</span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
              NET VALUE
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">
            {formatInr(calculations.estimatedMonthlyNetBenefit)}
          </div>
          <p className="text-[11px] text-slate-500">
            Annualized net: <strong>{formatInr(calculations.annualizedNetBenefit)}</strong>
          </p>
        </div>

        {/* KPI 2: Baseline Monthly Cost of Failed Picks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Cost of Failed Picks</span>
            <span className="text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-semibold">
              BASELINE LOSS
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatInr(calculations.baselineMonthlyCostOfFailedPicks)}
          </div>
          <p className="text-[11px] text-slate-500">
            From {calculations.monthlyFailedPicks} exceptions/mo without StockTrace
          </p>
        </div>

        {/* KPI 3: Median Resolution Time (Calculated from Data) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Median Resolution Time</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            {medianResolutionTime ? (
              <>
                <span className="text-2xl font-black font-mono text-slate-900">
                  {medianResolutionTime}
                </span>
                <span className="text-[11px] text-emerald-700 font-bold">measured</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400">
                Unavailable (No completed logs)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            Assumed search reduction: <strong className="text-emerald-700">{calculations.timeSavedPercent}%</strong> ({assumptions.searchTimeAfterMins}m vs {assumptions.searchTimeBeforeMins}m)
          </p>
        </div>

        {/* KPI 4: Orders & Stock Recovered */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Preserved Fulfillment</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {calculations.ordersRecoveredMonthly}{' '}
            <span className="text-xs text-slate-500 font-normal">orders/mo</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Avoids {calculations.writeOffUnitsSavedMonthly} lost stock units/mo
          </p>
        </div>
      </div>

      {/* MAIN 2-COLUMN SECTION: EDITABLE ASSUMPTIONS vs VALUE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: EDITABLE ASSUMPTIONS (7 COLS) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>Editable Operational Assumptions</span>
            </div>
            <span className="text-[11px] text-slate-400">Real-time recalculation</span>
          </div>

          {/* Group 1: Volume & Labour Parameters */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
              1. Exception Volume &amp; Search Labour
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Failed picks per day */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Failed picks / day:</span>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={assumptions.failedPicksPerDay}
                    onChange={(e) => updateAssumption('failedPicksPerDay', Number(e.target.value))}
                    className="w-16 px-1.5 py-0.5 text-right font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={assumptions.failedPicksPerDay}
                  onChange={(e) => updateAssumption('failedPicksPerDay', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">
                  Monthly volume: {calculations.monthlyFailedPicks} picks ({assumptions.operatingDaysPerMonth} operating days)
                </div>
              </div>

              {/* Operating days per month */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Operating days / month:</span>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={assumptions.operatingDaysPerMonth}
                    onChange={(e) => updateAssumption('operatingDaysPerMonth', Number(e.target.value))}
                    className="w-16 px-1.5 py-0.5 text-right font-mono font-bold bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <input
                  type="range"
                  min="20"
                  max="31"
                  step="1"
                  value={assumptions.operatingDaysPerMonth}
                  onChange={(e) => updateAssumption('operatingDaysPerMonth', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Warehouse operating shifts per month</div>
              </div>

              {/* Search time before */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Manual search time before:</span>
                  <span className="font-mono font-bold text-slate-900">{assumptions.searchTimeBeforeMins} mins</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={assumptions.searchTimeBeforeMins}
                  onChange={(e) => updateAssumption('searchTimeBeforeMins', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Average time picker wanders looking for lost item</div>
              </div>

              {/* Search time after */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Resolution time with StockTrace:</span>
                  <span className="font-mono font-bold text-teal-800">{assumptions.searchTimeAfterMins} mins</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={assumptions.searchTimeAfterMins}
                  onChange={(e) => updateAssumption('searchTimeAfterMins', Number(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Targeted verification at suggested location</div>
              </div>

              {/* Loaded labour cost */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 sm:col-span-2">
                <div className="flex justify-between text-slate-600">
                  <span>Loaded floor labour cost / hour:</span>
                  <span className="font-mono font-bold text-slate-900">₹{assumptions.hourlyLaborCost}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="10"
                  value={assumptions.hourlyLaborCost}
                  onChange={(e) => updateAssumption('hourlyLaborCost', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Loaded base wage + employee overheads</div>
              </div>
            </div>
          </div>

          {/* Group 2: Order & Inventory Economics */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
              2. Order SLAs &amp; Inventory Valuation
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Delayed orders percent */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Orders delayed/cancelled %:</span>
                  <span className="font-mono font-bold text-slate-900">{assumptions.delayedOrdersPercent}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={assumptions.delayedOrdersPercent}
                  onChange={(e) => updateAssumption('delayedOrdersPercent', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Exceptions that breach dispatch cutoff times</div>
              </div>

              {/* Average order value */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Average order value (AOV):</span>
                  <span className="font-mono font-bold text-slate-900">₹{assumptions.avgOrderValue}</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="100"
                  value={assumptions.avgOrderValue}
                  onChange={(e) => updateAssumption('avgOrderValue', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Average customer invoice size</div>
              </div>

              {/* Contribution margin % (Financial Integrity Requirement) */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Contribution margin %:</span>
                  <span className="font-mono font-bold text-teal-800">{assumptions.contributionMarginPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={assumptions.contributionMarginPercent}
                  onChange={(e) => updateAssumption('contributionMarginPercent', Number(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Net margin preserved (not full revenue)</div>
              </div>

              {/* Expected recovery rate % */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Expected recovery rate %:</span>
                  <span className="font-mono font-bold text-slate-900">{assumptions.expectedRecoveryRatePercent}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="98"
                  step="1"
                  value={assumptions.expectedRecoveryRatePercent}
                  onChange={(e) => updateAssumption('expectedRecoveryRatePercent', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Proportion of exceptions resolved in time</div>
              </div>

              {/* Stock write-off % */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Stock write-off %:</span>
                  <span className="font-mono font-bold text-slate-900">{assumptions.stockWriteOffPercent}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={assumptions.stockWriteOffPercent}
                  onChange={(e) => updateAssumption('stockWriteOffPercent', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Exceptions that result in permanent inventory loss</div>
              </div>

              {/* Avg item write-off cost */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Avg item write-off cost:</span>
                  <span className="font-mono font-bold text-slate-900">₹{assumptions.avgItemWriteOffCost}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={assumptions.avgItemWriteOffCost}
                  onChange={(e) => updateAssumption('avgItemWriteOffCost', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Inventory cost of lost SKU</div>
              </div>
            </div>
          </div>

          {/* Group 3: Investigation Costs & Software Subscription */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
              3. System Costs &amp; Subscriptions
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Avg investigation cost per case */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Investigation cost / case:</span>
                  <span className="font-mono font-bold text-slate-900">₹{assumptions.avgInvestigationCostPerCase}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={assumptions.avgInvestigationCostPerCase}
                  onChange={(e) => updateAssumption('avgInvestigationCostPerCase', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Blended compute &amp; camera trace cost</div>
              </div>

              {/* Monthly StockTrace cost */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Monthly StockTrace software:</span>
                  <span className="font-mono font-bold text-slate-900">₹{assumptions.monthlySoftwareCost.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="100000"
                  step="5000"
                  value={assumptions.monthlySoftwareCost}
                  onChange={(e) => updateAssumption('monthlySoftwareCost', Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">Facility software license fee</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED OUTPUT BREAKDOWN (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Output Card: Benefit Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Monthly Estimated Benefit
              </span>
              <span className="text-[11px] font-mono text-emerald-700 font-bold">
                {formatInr(calculations.estimatedMonthlyGrossBenefit)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Labour Savings */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900">1. Search Labour Savings</div>
                  <div className="text-[11px] text-slate-500">
                    Saves {assumptions.searchTimeBeforeMins - assumptions.searchTimeAfterMins} mins &times; {calculations.monthlyFailedPicks} picks
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {formatInr(calculations.searchLabourSavingsMonthly)}
                </span>
              </div>

              {/* Recovered Order Margin */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900">2. Recovered Order Margin</div>
                  <div className="text-[11px] text-slate-500">
                    ~{calculations.ordersRecoveredMonthly} orders &times; {assumptions.contributionMarginPercent}% margin
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {formatInr(calculations.recoverableOrderMargin)}
                </span>
              </div>

              {/* Avoided Stock Write-Offs */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-slate-900">3. Avoided Stock Write-offs</div>
                  <div className="text-[11px] text-slate-500">
                    ~{calculations.writeOffUnitsSavedMonthly} units &times; ₹{assumptions.avgItemWriteOffCost}
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {formatInr(calculations.avoidedWriteOffValue)}
                </span>
              </div>
            </div>

            {/* Applicable Costs Deductions */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Applicable Operational Costs:
              </span>

              <div className="flex justify-between text-slate-600">
                <span>&bull; Investigation costs ({calculations.monthlyFailedPicks} &times; ₹{assumptions.avgInvestigationCostPerCase}):</span>
                <span className="font-mono text-rose-700">-{formatInr(calculations.totalInvestigationCostsMonthly)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>&bull; Monthly StockTrace license:</span>
                <span className="font-mono text-rose-700">-{formatInr(calculations.monthlySoftwareCost)}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-bold">
                <span className="text-slate-900">Net Estimated Monthly Value:</span>
                <span className="text-lg font-mono text-emerald-700">
                  {formatInr(calculations.estimatedMonthlyNetBenefit)}
                </span>
              </div>
            </div>
          </div>

          {/* Real Evidence-Tier Usage in Sample Dataset */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Case Evidence-Tier Distribution
                </span>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                {evidenceTierStats.totalCases} Active Cases
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Tier 1 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-medium text-slate-700">Tier 1: Transaction &amp; Scanner (Default Low-Cost)</span>
                  <span className="font-mono font-bold text-slate-900">{evidenceTierStats.tier1Percent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${evidenceTierStats.tier1Percent}%` }}
                  />
                </div>
              </div>

              {/* Tier 2 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-medium text-slate-700">Tier 2: Targeted Camera Evidence</span>
                  <span className="font-mono font-bold text-slate-900">{evidenceTierStats.tier2Percent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${evidenceTierStats.tier2Percent}%` }}
                  />
                </div>
              </div>

              {/* Insufficient / Conflicting */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="font-medium text-slate-700">Insufficient / Conflicting (Safe Refusal)</span>
                  <span className="font-mono font-bold text-slate-900">{evidenceTierStats.insufficientPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${evidenceTierStats.insufficientPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 pt-1 leading-snug">
              Derived directly from active cases dataset in the application. Evaluates Tier 1 scanner transactions first, moving to targeted Tier 2 camera evidence when needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
