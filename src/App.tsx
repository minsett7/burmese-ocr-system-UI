import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { approveDocument, deleteDocument, fetchServiceHealth, loadDashboard, processDocument, reprocessDocument, saveDocumentCorrections, syncDocument, userError } from './api';
import { AuditEvent, ClaimDocument, FormCategory, NavView, OCRTemplate, ProgressState, ServiceHealth, TemplateRegistration } from './types';
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
  const [documents, setDocuments] = useState<ClaimDocument[]>([]);
  const [templates, setTemplates] = useState<OCRTemplate[]>([]);
  const [registrations, setRegistrations] = useState<TemplateRegistration[]>([]);
  const [formCategories, setFormCategories] = useState<FormCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState('');
  const [darkMode] = useState(() => localStorage.getItem('formflow_dark_mode') === 'true');
  const [isBurmese] = useState(() => localStorage.getItem('formflow_is_burmese') === 'true');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showServiceHealthModal, setShowServiceHealthModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const refreshData = useCallback(async (preferredRegistrationId?: string) => {
    try {
      const data = await loadDashboard();
      setDocuments(data.documents); setTemplates(data.templates); setRegistrations(data.registrations);
      setFormCategories(data.formCategories); setAuditLogs(data.auditEvents); setAppError('');
      setSelectedDocId(current => current && data.documents.some(item => item.id === current) ? current : data.documents[0]?.id ?? '');
      setSelectedRegistrationId(current => {
        if (preferredRegistrationId && data.registrations.some(item => item.id === preferredRegistrationId)) return preferredRegistrationId;
        return current && data.registrations.some(item => item.id === current) ? current : data.registrations[0]?.id ?? '';
      });
    } catch (error) { setAppError(userError(error)); }
    finally { setLoading(false); }
  }, []);

  const refreshHealth = useCallback(async () => {
    try { setServices(await fetchServiceHealth()); } catch { setServices([]); }
  }, []);

  useEffect(() => { void refreshData(); void refreshHealth(); }, [refreshData, refreshHealth]);
  useEffect(() => {
    const hasActiveJobs = documents.some(item => item.rawStatus === 'uploaded' || item.rawStatus === 'processing') ||
      registrations.some(item => !['needs_approval', 'needs_resubmission', 'registered', 'failed'].includes(item.rawStatus));
    if (!hasActiveJobs) return;
    const timer = window.setInterval(() => void refreshData(), 3000);
    return () => window.clearInterval(timer);
  }, [documents, registrations, refreshData]);
  useEffect(() => { const timer = window.setInterval(() => void refreshHealth(), 30000); return () => window.clearInterval(timer); }, [refreshHealth]);
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.getElementById('global-search-input')?.focus(); }
      if (event.key === '?' && !['INPUT','TEXTAREA','SELECT'].includes((event.target as HTMLElement).tagName)) setShowShortcutsModal(value => !value);
      if (event.key === 'Escape') { setShowServiceHealthModal(false); setShowShortcutsModal(false); setShowExportModal(false); }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, []);

  const selectedDocument = documents.find(item => item.id === selectedDocId);
  const selectedTemplate = templates.find(item => item.registrationId === selectedRegistrationId || item.id === selectedRegistrationId);
  const needsReviewCount = documents.filter(item => item.status === 'Needs Review').length;
  const templateDraftsCount = registrations.filter(item => item.status === 'Awaiting Approval').length;

  function navigate(view: NavView) {
    if (view === 'reports-export') setShowExportModal(true); else setCurrentView(view);
  }

  async function handleProcess(file: File, templateId: string, onProgress: (value: ProgressState) => void) {
    const result = await processDocument(file, templateId, templates, onProgress);
    setDocuments(current => [result, ...current.filter(item => item.id !== result.id)]);
    setSelectedDocId(result.id);
    await refreshData();
  }

  async function refreshSelectedDocument(id: string) {
    await refreshData(); setSelectedDocId(id);
  }

  return <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC] font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <Sidebar currentView={currentView} onSelectView={navigate} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(value => !value)}
      needsReviewCount={needsReviewCount} templateDraftsCount={templateDraftsCount} isBurmese={isBurmese}/>
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <TopBar currentView={currentView} isBurmese={isBurmese} onOpenServiceHealth={() => setShowServiceHealthModal(true)} services={services}
        searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedDocClaimNo={currentView === 'process-doc' ? selectedDocument?.claimNumber : undefined}
        selectedTemplateCode={currentView === 'templates' ? selectedTemplate?.code : undefined}/>
      {appError && <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        <AlertCircle className="h-4 w-4"/><span className="flex-1">{appError}</span><button onClick={() => setAppError('')}><X className="h-4 w-4"/></button></div>}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        {loading ? <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin"/>Connecting to the OCR platform…</div> : <>
          {currentView === 'work-queue' && <WorkQueue documents={documents} onReviewDocument={doc => {setSelectedDocId(doc.id);setCurrentView('process-doc');}}
            onNavigateToTemplates={() => setCurrentView('templates')} onNavigateToProcessDocs={() => setCurrentView('process-doc')}
            isBurmese={isBurmese} searchQuery={searchQuery} templateDraftsCount={templateDraftsCount} onRefresh={refreshData}/>}
          {currentView === 'templates' && <TemplateWorkspace registrations={registrations} categories={formCategories} selectedRegistrationId={selectedRegistrationId}
            onSelectRegistration={setSelectedRegistrationId} onChanged={refreshData} isBurmese={isBurmese}/>}
          {currentView === 'process-doc' && <ProcessDocumentView document={selectedDocument} templates={templates} onProcess={handleProcess}
            onUpdateDocument={updated => setDocuments(current => current.map(item => item.id === updated.id ? updated : item))}
            onSave={async doc => {await saveDocumentCorrections(doc);await refreshSelectedDocument(doc.id);}}
            onApprove={async doc => {if (doc.fields.some(field => field.isEdited)) await saveDocumentCorrections(doc);await approveDocument(doc.id);await refreshSelectedDocument(doc.id);}}
            onSync={async doc => {await syncDocument(doc.id);await refreshSelectedDocument(doc.id);}}
            onReprocess={async doc => {await reprocessDocument(doc.id);await refreshSelectedDocument(doc.id);}}
            onDelete={async doc => {await deleteDocument(doc.id);await refreshData();setCurrentView('work-queue');}} onNavigateBack={() => setCurrentView('work-queue')}/>}
          {currentView === 'records' && <RecordsView documents={documents} auditLogs={auditLogs} onOpenDocumentDetail={doc => {setSelectedDocId(doc.id);setCurrentView('process-doc');}}
            isBurmese={isBurmese} onOpenExportModal={() => setShowExportModal(true)}/>}
        </>}
      </main>
    </div>
    <ReportsExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} documents={documents} isBurmese={isBurmese}/>
    <ServiceHealthModal isOpen={showServiceHealthModal} onClose={() => setShowServiceHealthModal(false)} services={services} isBurmese={isBurmese}/>
    <ShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} isBurmese={isBurmese}/>
  </div>;
}
