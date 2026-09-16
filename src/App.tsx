import React, { useState } from 'react';
import {
  TabType,
  ScenarioType,
  FailedPickCase,
  InvestigationRecord,
  DiscrepancyRecord,
} from './types';
import {
  INITIAL_FAILED_CASES,
  INITIAL_INVESTIGATIONS,
  INITIAL_DISCREPANCIES,
  DATA_SOURCES,
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OpenCasesView } from './components/OpenCasesView';
import { CompletedCasesView } from './components/CompletedCasesView';
import { CaseResolutionFlow } from './components/CaseResolutionFlow';
import { DashboardView } from './components/DashboardView';
import { InvestigationsView } from './components/InvestigationsView';
import { DiscrepanciesView } from './components/DiscrepanciesView';
import { DataSourcesView } from './components/DataSourcesView';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Primary operational tab starts on OPEN CASES
  const [currentTab, setCurrentTab] = useState<TabType>('open-cases');
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>('happy-path');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Collections state
  const [cases, setCases] = useState<FailedPickCase[]>(INITIAL_FAILED_CASES);
  const [investigations, setInvestigations] = useState<InvestigationRecord[]>(INITIAL_INVESTIGATIONS);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyRecord[]>(INITIAL_DISCREPANCIES);

  // Global notification banner
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);

  // Active case object
  const activeCase = cases.find((c) => c.id === activeCaseId) || null;

  // Counts
  const openCases = cases.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'ESCALATED'
  );
  const completedCases = cases.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'ESCALATED'
  );
  const resolvedCount = cases.filter((c) => c.status === 'RESOLVED').length;
  const escalatedCount = cases.filter((c) => c.status === 'ESCALATED').length;
  const avgResolutionTime = '02:41';

  // Picker opens a failed pick case
  const handleOpenCase = (c: FailedPickCase) => {
    setActiveCaseId(c.id);
    setCurrentTab('open-cases');
  };

  const handleBackToOpenCases = () => {
    setActiveCaseId(null);
    setCurrentTab('open-cases');
  };

  const handleResetCase = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: 'ITEM_NOT_FOUND',
              foundLocation: undefined,
              resolutionTime: undefined,
              completedAt: undefined,
              investigationId: undefined,
              discrepancyId: undefined,
            }
          : c
      )
    );
    setActiveCaseId(null);
    setCurrentTab('open-cases');
  };

  const handleCompleteResolution = (details: {
    sku: string;
    itemName: string;
    expectedLocation: string;
    verifiedLocation: string;
    resolutionTime: string;
    evidence: string;
    status: 'Resolved' | 'Escalated';
  }) => {
    const invId =
      details.sku === 'SKU-1042'
        ? 'INV-1042'
        : `INV-${Math.floor(1000 + Math.random() * 9000)}`;

    const discId =
      details.sku === 'SKU-1042'
        ? 'DISC-881'
        : `DISC-${Math.floor(880 + Math.random() * 100)}`;

    const newInv: InvestigationRecord = {
      id: invId,
      caseId: activeCaseId || undefined,
      taskId: activeCaseId || undefined,
      sku: details.sku,
      expectedLocation: details.expectedLocation,
      recommendedLocation: details.verifiedLocation === '—' ? '—' : details.verifiedLocation,
      evidence: details.evidence,
      status: details.status,
      resolutionTime: details.resolutionTime,
      timestamp: 'Just now',
      reason:
        details.status === 'Resolved'
          ? `Physically verified at ${details.verifiedLocation}`
          : 'Physically checked at recommended location; item absent. Escalated to warehouse supervisor.',
    };

    setInvestigations((prev) => [newInv, ...prev.filter((i) => i.id !== invId)]);

    if (details.status === 'Resolved') {
      const newDisc: DiscrepancyRecord = {
        id: discId,
        caseId: activeCaseId || undefined,
        taskId: activeCaseId || undefined,
        sku: details.sku,
        itemName: details.itemName,
        expectedLocation: details.expectedLocation,
        foundLocation: details.verifiedLocation,
        reason: 'Item found at unexpected location following camera trace',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidence: details.evidence,
        status: 'Resolved',
        resolvedBy: 'Floor Picker #12 (Rajesh K.)',
      };

      setDiscrepancies((prev) => [newDisc, ...prev.filter((d) => d.id !== discId)]);

      setResolutionNotice(
        `✓ ${details.sku} resolved: Found at ${details.verifiedLocation}. Case moved to Completed Cases.`
      );
    } else {
      setResolutionNotice(`⚠ ${details.sku} escalated to Warehouse Supervisor review.`);
    }

    // Update case in state
    setCases((prev) =>
      prev.map((c) =>
        c.sku === details.sku
          ? {
              ...c,
              status: details.status === 'Resolved' ? 'RESOLVED' : 'ESCALATED',
              foundLocation: details.status === 'Resolved' ? details.verifiedLocation : undefined,
              resolutionTime: details.resolutionTime,
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              investigationId: invId,
              discrepancyId: details.status === 'Resolved' ? discId : undefined,
            }
          : c
      )
    );
  };

  const handleResetDemo = () => {
    setCases(INITIAL_FAILED_CASES);
    setInvestigations(INITIAL_INVESTIGATIONS);
    setDiscrepancies(INITIAL_DISCREPANCIES);
    setActiveCaseId(null);
    setCurrentScenario('happy-path');
    setCurrentTab('open-cases');
    setResolutionNotice('Prototype state restored to clean initial condition.');
  };

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setActiveCaseId(null);
        }}
        openCasesCount={openCases.length}
        completedCount={completedCases.length}
        discrepanciesCount={discrepancies.length}
        connectedSystemsCount={3}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main app viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* Top operational bar */}
        <TopBar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Global resolution notice banner */}
        {resolutionNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-medium animate-in fade-in">
            <div className="flex items-center space-x-2 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{resolutionNotice}</span>
            </div>
            <button
              onClick={() => setResolutionNotice(null)}
              className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active View Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-full overflow-x-hidden">
          {/* TAB 1: OPEN CASES / ACTIVE CASE RESOLUTION FLOW */}
          {currentTab === 'open-cases' && (
            activeCase ? (
              <CaseResolutionFlow
                caseData={activeCase}
                scenario={currentScenario}
                onCompleteResolution={handleCompleteResolution}
                onBackToOpenCases={handleBackToOpenCases}
                onResetCase={() => handleResetCase(activeCase.id)}
              />
            ) : (
              <OpenCasesView
                cases={cases}
                onOpenCase={handleOpenCase}
                onViewCompleted={() => setCurrentTab('completed-cases')}
                completedCount={completedCases.length}
              />
            )
          )}

          {/* TAB 2: COMPLETED CASES */}
          {currentTab === 'completed-cases' && (
            <CompletedCasesView
              cases={cases}
              onReopenCase={(c) => {
                handleResetCase(c.id);
                handleOpenCase(c);
              }}
              onBackToOpenCases={() => setCurrentTab('open-cases')}
            />
          )}

          {/* TAB 3: SUPERVISOR DASHBOARD */}
          {currentTab === 'dashboard' && (
            <DashboardView
              cases={cases}
              onOpenCase={handleOpenCase}
              onGoToOpenCases={() => {
                setActiveCaseId(null);
                setCurrentTab('open-cases');
              }}
              openCasesCount={openCases.length}
              resolvedCount={resolvedCount}
              escalatedCount={escalatedCount}
              avgResolutionTime={avgResolutionTime}
              activeCase={activeCase}
            />
          )}

          {/* TAB 4: INVESTIGATION LOGS */}
          {currentTab === 'investigations' && (
            <InvestigationsView investigations={investigations} />
          )}

          {/* TAB 5: DISCREPANCIES */}
          {currentTab === 'discrepancies' && (
            <DiscrepanciesView discrepancies={discrepancies} />
          )}

          {/* TAB 6: CONNECTED SYSTEMS */}
          {currentTab === 'data-sources' && (
            <DataSourcesView dataSources={DATA_SOURCES} />
          )}
        </main>
      </div>
    </div>
  );
}
