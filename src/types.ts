export type NavView = 'work-queue' | 'templates' | 'process-doc' | 'records' | 'reports-export';

export type ClaimType =
  | 'Motor / Vehicle'
  | 'Health & Hospitalization'
  | 'Life & Beneficiary'
  | 'Fire & Property'
  | 'Agricultural Crop'
  | 'Travel & Accident';

export type DocumentStatus =
  | 'Needs Review'
  | 'Processing'
  | 'Ready to Sync'
  | 'Approved'
  | 'Rejected'
  | 'Flagged for Re-scan';

export type FieldCategory = 'policy' | 'claimant' | 'incident' | 'payment' | 'internal';

export interface ValidationIssue {
  id: string;
  fieldKey: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  messageMm?: string;
  autoFixable?: boolean;
}

export interface BoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedField {
  id: string;
  key: string;
  labelEn: string;
  labelMm: string;
  category: FieldCategory;
  value: string;
  originalOcrValue: string;
  confidence: number;
  isEdited: boolean;
  isRequired: boolean;
  dataType: 'text' | 'number' | 'date' | 'currency' | 'nrc' | 'phone' | 'select' | 'boolean';
  options?: string[];
  boundingBox?: BoundingBox;
  validationIssues?: ValidationIssue[];
}

export interface ProgressState {
  stage: string;
  percent: number;
  message?: string;
}

export interface BackendFailure {
  code?: string;
  message?: string;
  service?: string;
  details?: unknown;
}

export interface ClaimDocument {
  id: string;
  claimNumber: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  claimType: ClaimType;
  carrierName: string;
  carrierLogo?: string;
  policyNumber: string;
  claimantNameEn: string;
  claimantNameMm: string;
  nrcNumber: string;
  claimedAmount: number;
  currency: 'MMK' | 'USD';
  status: DocumentStatus;
  rawStatus: string;
  overallConfidence: number;
  templateMatchScore: number;
  matchedTemplateId: string;
  matchedTemplateName: string;
  uploadedAt: string;
  age: string;
  assignedReviewer: string;
  issuesCount: number;
  fields: ExtractedField[];
  previewUrl?: string;
  alignedPageBaseUrl?: string;
  rawOcrText?: string;
  notes?: string;
  progress?: ProgressState;
  failure?: BackendFailure | null;
}

export type TemplateStatus = 'Active' | 'Awaiting Approval' | 'Draft' | 'Failed' | 'Needs New Upload' | 'Deprecated';

export interface EditableRegion {
  id: string;
  region_type?: string;
  field_id: string;
  page: number;
  key: string;
  label: string;
  data_type?: string | null;
  language?: string;
  extraction_mode: string;
  required: boolean;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  source_region_ids?: string[];
  source_label_id?: string | null;
  label_token_ids?: string[];
  relationship?: unknown;
  semantic_group_field_id?: string | null;
  option_key?: string | null;
  parent_region_id?: string | null;
  review_required: boolean;
  review_reasons: string[];
  model_metadata?: unknown;
  validation?: unknown;
  enabled: boolean;
  geometry_source: string;
}

export interface TemplateRegion {
  id: string;
  fieldKey: string;
  nameEn: string;
  nameMm: string;
  category: FieldCategory;
  dataType: ExtractedField['dataType'];
  required: boolean;
  box: BoundingBox;
  confidenceThreshold: number;
  regexPattern?: string;
  sampleValue?: string;
  status: 'detected' | 'review_required' | 'approved' | 'disabled';
  source: EditableRegion;
}

export interface OCRTemplate {
  id: string;
  registrationId?: string;
  name: string;
  nameMm: string;
  code: string;
  version: string;
  claimType: ClaimType;
  formTypeId: string;
  carrier: string;
  status: TemplateStatus;
  pageCount: number;
  fieldCount: number;
  lastUpdated: string;
  updatedBy: string;
  sampleDocumentUrl: string;
  regions: TemplateRegion[];
  accuracyScore: number;
  totalProcessedCount: number;
  stage: 'Upload' | 'Analyze' | 'Review' | 'Save';
}

export interface TemplatePage {
  page_id: string;
  page_number: number;
  image_url: string;
  width: number;
  height: number;
  sha256: string;
}

export interface TemplateDraft {
  schema_version: string;
  revision: number;
  page?: TemplatePage;
  pages?: TemplatePage[];
  regions: EditableRegion[];
  structural_regions?: unknown[];
  unassigned_regions?: unknown[];
  warnings?: string[];
  quality_summary?: Record<string, unknown>;
}

export interface TemplateRegistration {
  id: string;
  templateId?: string | null;
  name: string;
  description: string;
  fileName: string;
  formTypeId: string;
  rawStatus: string;
  status: TemplateStatus;
  progress: ProgressState;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
  failure?: BackendFailure | null;
  draft?: TemplateDraft | null;
  draftRevision: number;
  pageUrls: string[];
}

export interface FormCategory {
  id: string;
  name: string;
  label?: string;
  description?: string;
  system?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  documentId?: string;
  documentRef?: string;
  templateId?: string;
  templateName?: string;
  actor: { name: string; role: string; avatar: string };
  actionType:
    | 'OCR_EXTRACTED'
    | 'FIELD_CORRECTED'
    | 'DOCUMENT_APPROVED'
    | 'STATUS_CHANGED'
    | 'SYNCED_CORE_ERP'
    | 'TEMPLATE_MODIFIED'
    | 'VALIDATION_OVERRIDDEN'
    | 'BATCH_EXPORTED';
  description: string;
  details?: { field?: string; oldValue?: string; newValue?: string; confidenceDelta?: number; destination?: string };
}

export interface ServiceHealth {
  name: string;
  key: string;
  status: 'operational' | 'degraded' | 'offline';
  latencyMs: number;
  uptimePercentage: number;
  version: string;
  description: string;
}

export interface DashboardData {
  documents: ClaimDocument[];
  templates: OCRTemplate[];
  registrations: TemplateRegistration[];
  auditEvents: AuditEvent[];
  formCategories: FormCategory[];
}
