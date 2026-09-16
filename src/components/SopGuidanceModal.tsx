import React, { useState, useEffect } from 'react';
import { BookOpen, Search, X, ShieldAlert, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { sopService, SopQueryResult, SopDocument } from '../services/sop';

interface SopGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const SAMPLE_QUERIES = [
  'Failed pick escalation',
  'What to do if item is damaged',
  'Wrong quantity found at bin',
  'Conflicting camera and scanner evidence',
  'Where is SKU-9999 located right now?', // Refusal test case
];

export const SopGuidanceModal: React.FC<SopGuidanceModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [result, setResult] = useState<SopQueryResult | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<SopDocument | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setResult(sopService.querySop(initialQuery));
    } else {
      setResult(sopService.querySop('failed pick'));
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (searchStr: string) => {
    setQuery(searchStr);
    setSelectedDoc(null);
    const res = sopService.querySop(searchStr);
    setResult(res);
  };

  const allSops = sopService.getAllSops();

  return (
    <div
      id="sop-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="sop-modal-dialog"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 tracking-tight">
                Warehouse Standard Operating Procedures (SOP)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Approved operational discrepancy and escalation guidance · Section 15 Compliance
              </p>
            </div>
          </div>
          <button
            id="btn-close-sop-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Sample Prompts */}
        <div className="p-4 sm:p-6 border-b border-slate-100 space-y-3 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="sop-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask an SOP question (e.g., 'What is the procedure for damaged inventory?')..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-colors outline-hidden"
            />
            <button
              type="submit"
              id="btn-submit-sop-query"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Lookup
            </button>
          </form>

          {/* Prompt chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0 mr-1">
              Sample queries:
            </span>
            {SAMPLE_QUERIES.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSearch(sq)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  query === sq
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Query Result Card */}
          {result && (
            <div>
              {result.matched && result.document ? (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {result.document.id}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                          Approved Procedure
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900">
                        {result.document.title}
                      </h4>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                      {result.citation}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {result.answer}
                  </p>

                  {/* Steps checklist */}
                  {result.applicableSteps && result.applicableSteps.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-emerald-200/70">
                      <div className="text-[11px] font-black text-emerald-900 uppercase tracking-wide">
                        Required Operational Steps:
                      </div>
                      <div className="space-y-1.5">
                        {result.applicableSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-2 text-xs text-slate-800 bg-white/80 border border-emerald-100 p-2.5 rounded-xl"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-medium leading-normal">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Strict Refusal Display (Section 15) */
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>REFUSAL COMPLIANCE (SECTION 15)</span>
                  </div>
                  <p className="text-lg font-black text-slate-950">
                    “{result.answer}”
                  </p>
                  {result.refusalReason && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium pt-2 border-t border-rose-200/80">
                      {result.refusalReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Document Browser (Detailed Inspection) */}
          {selectedDoc && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                  {selectedDoc.id} · {selectedDoc.category}
                </span>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                >
                  Close Doc
                </button>
              </div>
              <h4 className="text-base font-black text-slate-900">{selectedDoc.title}</h4>
              <p className="text-xs text-slate-600">{selectedDoc.summary}</p>
              <div className="space-y-1.5 pt-2">
                {selectedDoc.steps.map((st, idx) => (
                  <div key={idx} className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    {st}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Available Approved SOPs */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="text-xs font-black text-slate-400 uppercase tracking-wide">
              All Approved Warehouse SOPs ({allSops.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allSops.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    handleSearch(doc.title);
                  }}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer space-y-1 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      {doc.id}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {doc.category}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {doc.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Trust Principle: SOPs guide procedures; physical locations require floor verification.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
