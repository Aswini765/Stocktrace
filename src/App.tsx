import React, { useState } from 'react';
import {
  TabType,
  ScenarioType,
  FailedPickCase,
  InvestigationRecord,
  DiscrepancyRecord,
  WorkerVerificationOutcome,
  AppRole,
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
import { SopGuidanceModal } from './components/SopGuidanceModal';
import { HomeLandingView } from './components/home/HomeLandingView';
import { PickerWhatsAppView } from './components/picker/PickerWhatsAppView';
import { ManagerRoiDashboard } from './components/manager/ManagerRoiDashboard';
import { FutureRoadmapModal } from './components/FutureRoadmapModal';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  // Current Persona Role (Section 3: Core V2 Requirement)
  // 'home' | 'picker' | 'supervisor' | 'manager'
  const [currentRole, setCurrentRole] = useState<AppRole>('home');

  // Supervisor operational tab navigation
  const [currentTab, setCurrentTab] = useState<TabType>('open-cases');
  const [currentScenario, setCurrentScenario] = useState<ScenarioType>('happy-path');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSopModalOpen, setIsSopModalOpen] = useState<boolean>(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState<boolean>(false);

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

  // Supervisor opens a failed pick case
  const handleOpenCase = (c: FailedPickCase) => {
    setActiveCaseId(c.id);
    setCurrentTab('open-cases');
    setCurrentRole('supervisor');
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
              pickerOutcome: undefined,
              pickerNotes: undefined,
              pickerTimestamp: undefined,
            }
          : c
      )
    );
    if (currentRole !== 'picker') {
      setActiveCaseId(null);
      setCurrentTab('open-cases');
    }
  };

  const handleRequestRecheck = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: 'TRY_LOCATION',
              pickerOutcome: undefined,
              pickerNotes: undefined,
              auditTrail: [
                ...(c.auditTrail || []),
                {
                  id: `AUD-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  actor: 'Warehouse Supervisor',
                  action: 'RECHECK_REQUESTED',
                  details: 'Supervisor requested floor associate re-check.',
                },
              ],
            }
          : c
      )
    );
    setResolutionNotice(`Re-check requested for case ${caseId}. Assigned back to floor associate.`);
  };

  // Shared Resolution Handler
  const handleCompleteResolution = (details: {
    caseId?: string;
    sku: string;
    itemName: string;
    expectedLocation: string;
    verifiedLocation: string;
    resolutionTime: string;
    evidence: string;
    status: 'Resolved' | 'Escalated';
    outcome?: WorkerVerificationOutcome;
    foundQuantity?: number;
    discrepancyReason?: string;
  }) => {
    const targetCaseId = details.caseId || activeCaseId;
    if (targetCaseId) {
      setActiveCaseId(targetCaseId);
    }

    const invId =
      details.sku === 'SKU-1042'
        ? 'INV-1042'
        : `INV-${targetCaseId ? targetCaseId.replace('CASE-', '') : Math.floor(1000 + Math.random() * 9000)}`;

    const discId =
      details.sku === 'SKU-1042'
        ? 'DISC-881'
        : `DISC-${targetCaseId ? targetCaseId.replace('CASE-', '') : Math.floor(880 + Math.random() * 100)}`;

    const newInv: InvestigationRecord = {
      id: invId,
      caseId: targetCaseId || undefined,
      taskId: targetCaseId || undefined,
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
          : details.discrepancyReason || 'Physically checked; discrepancy logged. Escalated to supervisor.',
    };

    setInvestigations((prev) => [newInv, ...prev.filter((i) => i.id !== invId)]);

    const discReason =
      details.discrepancyReason ||
      (details.status === 'Resolved'
        ? 'Item found at unexpected location following movement trace'
        : `Verification result: ${details.outcome || 'NOT_FOUND'} at ${details.verifiedLocation}`);

    const newDisc: DiscrepancyRecord = {
      id: discId,
      caseId: targetCaseId || undefined,
      taskId: targetCaseId || undefined,
      sku: details.sku,
      itemName: details.itemName,
      expectedLocation: details.expectedLocation,
      foundLocation: details.verifiedLocation,
      reason: discReason,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      evidence: details.evidence,
      status: details.status === 'Resolved' ? 'Resolved' : 'Pending Review',
      resolvedBy: 'Floor Picker #12 (Rajesh K.)',
    };

    setDiscrepancies((prev) => [newDisc, ...prev.filter((d) => d.id !== discId)]);

    if (details.status === 'Resolved') {
      setResolutionNotice(
        `✓ ${details.sku} resolved: Found at ${details.verifiedLocation}. Case verified & moved to Completed Cases.`
      );
    } else if (details.outcome === 'PARTIALLY_FOUND') {
      setResolutionNotice(
        `⚠ ${details.sku} partially found (${details.foundQuantity} units). Discrepancy recorded for supervisor review.`
      );
    } else if (details.outcome === 'WRONG_QUANTITY') {
      setResolutionNotice(
        `⚠ ${details.sku} quantity discrepancy recorded (${details.foundQuantity} units found). Case escalated.`
      );
    } else if (details.outcome === 'DAMAGED') {
      setResolutionNotice(
        `⚠ ${details.sku} logged as DAMAGED. Case escalated for supervisor inventory inspection.`
      );
    } else if (details.outcome === 'NOT_FOUND') {
      setResolutionNotice(
        `⚠ ${details.sku} verified missing: Item confirmed absent and case escalated to Inventory Control.`
      );
    } else {
      setResolutionNotice(`⚠ ${details.sku} escalated to Warehouse Supervisor review.`);
    }

    const auditActor = details.evidence?.includes('Picker')
      ? 'Floor Picker #12'
      : 'Warehouse Supervisor';

    // Update case in state (strictly match caseId first)
    setCases((prev) =>
      prev.map((c) =>
        (details.caseId ? c.id === details.caseId : c.sku === details.sku)
          ? {
              ...c,
              status: details.status === 'Resolved' ? 'RESOLVED' : 'ESCALATED',
              foundLocation:
                details.status === 'Resolved'
                  ? details.verifiedLocation
                  : details.outcome === 'PARTIALLY_FOUND' ||
                    details.outcome === 'WRONG_QUANTITY' ||
                    details.outcome === 'DAMAGED'
                  ? details.verifiedLocation
                  : undefined,
              resolutionTime: details.resolutionTime,
              completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              investigationId: invId,
              discrepancyId: discId,
              pickerOutcome: details.outcome,
              pickerNotes: details.discrepancyReason,
              pickerTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              auditTrail: [
                ...(c.auditTrail || []),
                {
                  id: `AUD-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  actor: auditActor,
                  action: details.status === 'Resolved' ? 'PHYSICAL_VERIFICATION_FOUND' : 'EXCEPTION_VERIFIED_ESCALATED',
                  details: details.discrepancyReason || `Verified outcome: ${details.outcome || 'NOT_FOUND'}`,
                  tierUsed: c.evidenceTierUsed,
                },
              ],
            }
          : c
      )
    );
  };

  // Handler for actions coming directly from Persona 1 (Picker WhatsApp View)
  const handlePickerVerification = (details: {
    caseId: string;
    sku: string;
    itemName: string;
    expectedLocation: string;
    verifiedLocation: string;
    outcome: WorkerVerificationOutcome;
    foundQuantity?: number;
    notes?: string;
  }) => {
    handleCompleteResolution({
      caseId: details.caseId,
      sku: details.sku,
      itemName: details.itemName,
      expectedLocation: details.expectedLocation,
      verifiedLocation: details.verifiedLocation,
      resolutionTime: '01:14',
      evidence: 'Tier 1 — Scanner Data (Verified by Picker)',
      status: details.outcome === 'FOUND' ? 'Resolved' : 'Escalated',
      outcome: details.outcome,
      foundQuantity: details.foundQuantity,
      discrepancyReason: details.notes,
    });
  };

  // Handler when picker initiates an investigation or reports an item
  const handlePickerReportInitiated = (report: {
    caseId?: string;
    sku?: string;
    itemName: string;
    expectedLocation?: string;
    rawText: string;
    isUnidentified?: boolean;
  }): string => {
    // 1. If unidentified item report (e.g. "I cannot find charger")
    if (report.isUnidentified) {
      const unId = `CASE-UNID-${Date.now().toString().slice(-4)}`;
      const newCase: FailedPickCase = {
        id: unId,
        sku: 'UNIDENTIFIED',
        item: `Missing: ${report.itemName}`,
        qty: 1,
        expectedLocation: '—',
        status: 'ESCALATED',
        priority: 'HIGH',
        reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reportedBy: 'Floor Associate (Picker)',
        pickerOutcome: 'ESCALATE',
        pickerNotes: `Unidentified item reported: "${report.rawText}". Item not found in catalog or dispatch orders.`,
        pickerTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        evidenceTierUsed: 'INSUFFICIENT',
        tierResolutionNote: 'Picker reported item could not be identified in catalog or dispatch orders. Supervisor review required.',
        auditTrail: [
          {
            id: `AUD-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actor: 'Floor Associate (Picker)',
            action: 'UNIDENTIFIED_ITEM_REPORTED',
            details: `Picker entered: "${report.rawText}". Requested supervisor assistance.`,
          },
        ],
      };
      setCases((prev) => [newCase, ...prev.filter((c) => c.id !== unId)]);
      setActiveCaseId(unId);
      return unId;
    }

    // 2. If identified item: find existing case or create new case
    const existing = cases.find(
      (c) => (report.caseId && c.id === report.caseId) || (report.sku && c.sku === report.sku)
    );

    if (existing) {
      setCases((prev) =>
        prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                status: 'INVESTIGATING',
                pickerNotes: report.rawText,
                pickerTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                auditTrail: [
                  ...(c.auditTrail || []),
                  {
                    id: `AUD-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    actor: 'Floor Associate (Picker)',
                    action: 'FAILED_PICK_REPORTED',
                    details: report.rawText,
                  },
                ],
              }
            : c
        )
      );
      setActiveCaseId(existing.id);
      return existing.id;
    }

    const cleanNum = report.sku ? report.sku.replace('SKU-', '') : Date.now().toString().slice(-4);
    const newId = `CASE-${cleanNum}`;
    const newCase: FailedPickCase = {
      id: newId,
      sku: report.sku || `SKU-${cleanNum}`,
      item: report.itemName,
      qty: 1,
      expectedLocation: report.expectedLocation || 'A12',
      status: 'INVESTIGATING',
      priority: 'NORMAL',
      destinationBin: 'TOTE-44',
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reportedBy: 'Floor Associate (Picker)',
      pickerNotes: report.rawText,
      pickerTimestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      evidenceTierUsed: 'TIER_1_SCANNER_WMS',
      auditTrail: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: 'Floor Associate (Picker)',
          action: 'FAILED_PICK_REPORTED',
          details: report.rawText,
        },
      ],
    };
    setCases((prev) => [newCase, ...prev.filter((c) => c.id !== newId)]);
    setActiveCaseId(newId);
    return newId;
  };

  // Switch to Supervisor view directly from Picker or Home
  const handleSwitchToSupervisor = (caseId?: string) => {
    if (caseId) {
      setActiveCaseId(caseId);
    }
    setCurrentRole('supervisor');
    setCurrentTab('open-cases');
  };

  return (
    <div className="flex h-screen w-full max-w-full overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar navigation: active in Supervisor console */}
      {currentRole === 'supervisor' && (
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
      )}

      {/* Main app viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* Top Bar with Role Switcher */}
        <TopBar
          currentRole={currentRole}
          onSelectRole={(role) => {
            setCurrentRole(role);
            if (role === 'supervisor') {
              setCurrentTab('open-cases');
            }
          }}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSopModal={() => setIsSopModalOpen(true)}
          onOpenRoadmapModal={() => setIsRoadmapModalOpen(true)}
        />

        {/* Global resolution notice banner */}
        {resolutionNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-medium animate-in fade-in shrink-0">
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
          {/* VIEW A: HOME SCREEN / ROLE SELECTOR */}
          {currentRole === 'home' && (
            <HomeLandingView
              onSelectRole={(role) => setCurrentRole(role)}
              openCasesCount={openCases.length}
              completedCount={completedCases.length}
              cases={cases}
            />
          )}

          {/* VIEW B: PERSONA 1 — PICKER (WHATSAPP MOBILE) */}
          {currentRole === 'picker' && (
            <PickerWhatsAppView
              cases={cases}
              activeCaseId={activeCaseId}
              onSelectCase={(id) => setActiveCaseId(id)}
              onPickerReportInitiated={handlePickerReportInitiated}
              onPickerVerification={handlePickerVerification}
              onResetCase={handleResetCase}
              onSwitchToSupervisor={handleSwitchToSupervisor}
            />
          )}

          {/* VIEW C: PERSONA 3 — MANAGER (ROI DASHBOARD) */}
          {currentRole === 'manager' && (
            <ManagerRoiDashboard
              onGoToSupervisor={() => setCurrentRole('supervisor')}
              onGoToPicker={() => setCurrentRole('picker')}
              cases={cases}
              investigations={investigations}
            />
          )}

          {/* VIEW D: PERSONA 2 — SUPERVISOR CONSOLE */}
          {currentRole === 'supervisor' && (
            <>
              {/* TAB 1: OPEN CASES / ACTIVE CASE RESOLUTION FLOW */}
              {currentTab === 'open-cases' && (
                activeCase ? (
                  <CaseResolutionFlow
                    caseData={activeCase}
                    scenario={currentScenario}
                    onCompleteResolution={handleCompleteResolution}
                    onBackToOpenCases={handleBackToOpenCases}
                    onResetCase={() => handleResetCase(activeCase.id)}
                    onRequestRecheck={handleRequestRecheck}
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
                activeCase ? (
                  <CaseResolutionFlow
                    caseData={activeCase}
                    scenario={currentScenario}
                    onCompleteResolution={handleCompleteResolution}
                    onBackToOpenCases={() => {
                      setActiveCaseId(null);
                      setCurrentTab('completed-cases');
                    }}
                    onResetCase={() => handleResetCase(activeCase.id)}
                    onRequestRecheck={handleRequestRecheck}
                  />
                ) : (
                  <CompletedCasesView
                    cases={cases}
                    onViewCase={(c) => {
                      setActiveCaseId(c.id);
                    }}
                    onReopenCase={(c) => {
                      handleResetCase(c.id);
                      handleOpenCase(c);
                    }}
                    onBackToOpenCases={() => {
                      setActiveCaseId(null);
                      setCurrentTab('open-cases');
                    }}
                  />
                )
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
            </>
          )}
        </main>
      </div>

      {/* Warehouse SOP Operational Guidance Modal */}
      <SopGuidanceModal
        isOpen={isSopModalOpen}
        onClose={() => setIsSopModalOpen(false)}
      />

      {/* Privacy Guardrails & Future Roadmap Modal */}
      <FutureRoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
      />
    </div>
  );
}
