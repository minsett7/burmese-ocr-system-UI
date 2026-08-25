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

export type ConfidenceTier = 'high' | 'medium' | 'low';

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
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage
  height: number; // percentage
}

export interface ExtractedField {
  id: string;
  key: string;
  labelEn: string;
  labelMm: string;
  category: FieldCategory;
  value: string;
  originalOcrValue: string;
  confidence: number; // 0 to 100
  isEdited: boolean;
  isRequired: boolean;
  dataType: 'text' | 'number' | 'date' | 'currency' | 'nrc' | 'phone' | 'select' | 'boolean';
  options?: string[];
  boundingBox?: BoundingBox;
  validationIssues?: ValidationIssue[];
}

export interface ClaimDocument {
  id: string;
  claimNumber: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  claimType: ClaimType;
  carrierName: string; // e.g. KBZ MS General Insurance, IKBZ, GGI Tokiomarine, AYA SOMPO
  carrierLogo?: string;
  policyNumber: string;
  claimantNameEn: string;
  claimantNameMm: string;
  nrcNumber: string; // National Registration Card (e.g., 12/LKN(N)148293)
  claimedAmount: number; // in MMK
  currency: 'MMK' | 'USD';
  status: DocumentStatus;
  overallConfidence: number; // 0-100
  templateMatchScore: number; // 0-100
  matchedTemplateId: string;
  matchedTemplateName: string;
  uploadedAt: string;
  age: string;
  assignedReviewer: string;
  issuesCount: number;
  fields: ExtractedField[];
  previewUrl?: string;
  rawOcrText?: string;
  notes?: string;
}

export type TemplateStatus = 'Active' | 'Awaiting Approval' | 'Draft' | 'Deprecated';

export interface TemplateRegion {
  id: string;
  fieldKey: string;
  nameEn: string;
  nameMm: string;
  category: FieldCategory;
  dataType: 'text' | 'number' | 'date' | 'currency' | 'nrc' | 'phone' | 'select';
  required: boolean;
  box: BoundingBox;
  confidenceThreshold: number;
  regexPattern?: string;
  sampleValue?: string;
  status: 'detected' | 'review_required' | 'approved' | 'disabled';
}

export interface OCRTemplate {
  id: string;
  name: string;
  nameMm: string;
  code: string;
  version: string;
  claimType: ClaimType;
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
  stage: 'Upload' | 'Detect Regions' | 'Map Fields' | 'Review' | 'Approve';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  documentId?: string;
  documentRef?: string;
  templateId?: string;
  templateName?: string;
  actor: {
    name: string;
    role: string;
    avatar: string;
  };
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
  details?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    confidenceDelta?: number;
    destination?: string;
  };
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
