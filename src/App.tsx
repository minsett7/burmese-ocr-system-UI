import React, { useState, useEffect } from 'react';
import { 
  NavView, 
  ClaimDocument, 
  OCRTemplate, 
  AuditEvent, 
  ServiceHealth 
} from './types';
import { 
  INITIAL_DOCUMENTS, 
  INITIAL_TEMPLATES, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_SERVICES 
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { WorkQueue } from './components/WorkQueue';
import { TemplateWorkspace } from './components/TemplateWorkspace';
import { ProcessDocumentView } from './components/ProcessDocumentView';
import { RecordsView } from './components/RecordsView';
import { ReportsExportModal } from './components/ReportsExportModal';
import { ServiceHealthModal } from './components/ServiceHealthModal';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('work-queue');
  const [documents, setDocuments] = useState<ClaimDocument[]>(INITIAL_DOCUMENTS);
  const [templates, setTemplates] = useState<OCRTemplate[]>(INITIAL_TEMPLATES);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS);
  const [services] = useState<ServiceHealth[]>(INITIAL_SERVICES);

  const [selectedDocId, setSelectedDocId] = useState<string>('doc-0884');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl-kbz-motor-01');

  // UI customization states
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('formflow_dark_mode');
    return saved ? saved === 'true' : false;
  });
  const [isBurmese, setIsBurmese] = useState<boolean>(() => {
    const saved = localStorage.getItem('formflow_is_burmese');
    return saved ? saved === 'true' : false;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showServiceHealthModal, setShowServiceHealthModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Sync dark mode class with root and localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('formflow_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('formflow_dark_mode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('formflow_is_burmese', String(isBurmese));
  }, [isBurmese]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      // ? for shortcuts
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
      // Esc to close modals
      if (e.key === 'Escape') {
        setShowServiceHealthModal(false);
        setShowShortcutsModal(false);
        setShowExportModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedDocument = documents.find(d => d.id === selectedDocId) || documents[0];
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const handleUpdateDocument = (updatedDoc: ClaimDocument) => {
    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
  };

  const handleUpdateTemplate = (updatedTmpl: OCRTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTmpl.id ? updatedTmpl : t));
    // Log audit event
    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      templateId: updatedTmpl.id,
      templateName: updatedTmpl.name,
      actor: {
        name: 'Daw Khin Mar',
        role: 'Senior Claims Lead',
        avatar: 'KM'
      },
      actionType: 'TEMPLATE_MODIFIED',
      description: `Updated template ${updatedTmpl.code} configuration. Total regions: ${updatedTmpl.regions.length}.`,
      details: {
        oldValue: updatedTmpl.status,
        newValue: updatedTmpl.status
      }
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleReviewDocument = (doc: ClaimDocument) => {
    setSelectedDocId(doc.id);
    setCurrentView('process-doc');
  };

  const handleApproveAndNext = (doc: ClaimDocument) => {
    const updatedDoc: ClaimDocument = {
      ...doc,
      status: 'Approved',
      issuesCount: 0
    };
    handleUpdateDocument(updatedDoc);

    // Add audit log
    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      documentId: doc.id,
      documentRef: doc.claimNumber,
      actor: {
        name: 'Daw Khin Mar',
        role: 'Senior Claims Lead',
        avatar: 'KM'
      },
      actionType: 'DOCUMENT_APPROVED',
      description: `Approved claim ${doc.claimNumber} (${doc.carrierName}) for payout of ${doc.claimedAmount.toLocaleString()} MMK.`,
      details: {
        oldValue: doc.status,
        newValue: 'Approved'
      }
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Find next document in queue
    const remaining = documents.filter(d => d.id !== doc.id && d.status === 'Needs Review');
    if (remaining.length > 0) {
      setSelectedDocId(remaining[0].id);
    } else {
      setCurrentView('work-queue');
    }
  };

  const handleMarkReadyToSync = (doc: ClaimDocument) => {
    const updatedDoc: ClaimDocument = {
      ...doc,
      status: 'Ready to Sync'
    };
    handleUpdateDocument(updatedDoc);

    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      documentId: doc.id,
      documentRef: doc.claimNumber,
      actor: {
        name: 'Daw Khin Mar',
        role: 'Senior Claims Lead',
        avatar: 'KM'
      },
      actionType: 'STATUS_CHANGED',
      description: `Marked claim ${doc.claimNumber} ready for bulk ERP sync dispatch.`,
      details: {
        oldValue: doc.status,
        newValue: 'Ready to Sync'
      }
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleFlagForRescan = (doc: ClaimDocument) => {
    const updatedDoc: ClaimDocument = {
      ...doc,
      status: 'Flagged for Re-scan'
    };
    handleUpdateDocument(updatedDoc);

    const newAudit: AuditEvent = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      documentId: doc.id,
      documentRef: doc.claimNumber,
      actor: {
        name: 'Daw Khin Mar',
        role: 'Senior Claims Lead',
        avatar: 'KM'
      },
      actionType: 'STATUS_CHANGED',
      description: `Flagged document ${doc.fileName} for high-resolution physical scanner re-capture.`,
      details: {
        oldValue: doc.status,
        newValue: 'Flagged for Re-scan'
      }
    };
    setAuditLogs(prev => [newAudit, ...prev]);
    setCurrentView('work-queue');
  };

  const needsReviewCount = documents.filter(d => d.status === 'Needs Review').length;
  const templateDraftsCount = templates.filter(t => t.status === 'Awaiting Approval').length;

  return (
    <div className={`flex h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden dark:bg-slate-950 dark:text-slate-100 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Left Collapsible Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          if (view === 'reports-export') {
            setShowExportModal(true);
          } else {
            setCurrentView(view);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        needsReviewCount={needsReviewCount}
        templateDraftsCount={templateDraftsCount}
        isBurmese={isBurmese}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <TopBar
          currentView={currentView}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          isBurmese={isBurmese}
          onToggleBurmese={() => setIsBurmese(!isBurmese)}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onOpenServiceHealth={() => setShowServiceHealthModal(true)}
          services={services}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDocClaimNo={currentView === 'process-doc' ? selectedDocument?.claimNumber : undefined}
          selectedTemplateCode={currentView === 'templates' ? selectedTemplate?.code : undefined}
        />

        {/* Dynamic Workspace View */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {currentView === 'work-queue' && (
            <WorkQueue
              documents={documents}
              onReviewDocument={handleReviewDocument}
              onNavigateToTemplates={() => setCurrentView('templates')}
              onNavigateToProcessDocs={() => setCurrentView('process-doc')}
              isBurmese={isBurmese}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'templates' && (
            <TemplateWorkspace
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={(tmpl) => setSelectedTemplateId(tmpl.id)}
              onUpdateTemplate={handleUpdateTemplate}
              isBurmese={isBurmese}
            />
          )}

          {currentView === 'process-doc' && selectedDocument && (
            <ProcessDocumentView
              document={selectedDocument}
              onUpdateDocument={handleUpdateDocument}
              onApproveAndNext={handleApproveAndNext}
              onMarkReadyToSync={handleMarkReadyToSync}
              onFlagForRescan={handleFlagForRescan}
              isBurmese={isBurmese}
              onNavigateBack={() => setCurrentView('work-queue')}
            />
          )}

          {currentView === 'records' && (
            <RecordsView
              documents={documents}
              auditLogs={auditLogs}
              onOpenDocumentDetail={handleReviewDocument}
              isBurmese={isBurmese}
              onOpenExportModal={() => setShowExportModal(true)}
            />
          )}
        </main>
      </div>

      {/* Structured Export Modal */}
      <ReportsExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        documents={documents}
        isBurmese={isBurmese}
      />

      {/* Service Telemetry Health Modal */}
      <ServiceHealthModal
        isOpen={showServiceHealthModal}
        onClose={() => setShowServiceHealthModal(false)}
        services={services}
        isBurmese={isBurmese}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        isBurmese={isBurmese}
      />
    </div>
  );
}
