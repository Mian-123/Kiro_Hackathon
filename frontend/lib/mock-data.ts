import { StatusType, PriorityBand } from "./utils";

// ── Lahore area coordinates (used by LiveMap markers) ─────────────────────────
export const LAHORE_INCIDENT_MARKERS = [
  { id: "inc-001", lng: 74.3461, lat: 31.5134, color: "#C0392B", label: "INC-LHR-001", category: "Sewerage / Water",          address: "Gulberg III",       status: "AWAITING_CITIZEN_VERIFICATION", priority: "Critical", firstReported: "Aug 22, 10:30 PM", lastReported: "Aug 22, 11:15 PM", citizenReports: 4, department: "WASA" },
  { id: "inc-002", lng: 74.3392, lat: 31.5198, color: "#C6A55C", label: "INC-LHR-002", category: "Broken Road",               address: "Canal Bank Road",   status: "IN_PROGRESS",                   priority: "High",     firstReported: "Aug 21, 09:10 AM", lastReported: "Aug 22, 02:40 PM", citizenReports: 7, department: "LDA Roads" },
  { id: "inc-003", lng: 74.3650, lat: 31.5260, color: "#E0A400", label: "INC-LHR-003", category: "Garbage / Waste",           address: "Johar Town",        status: "ASSIGNED",                      priority: "Medium",   firstReported: "Aug 22, 08:00 AM", lastReported: "Aug 22, 12:30 PM", citizenReports: 6, department: "LWMC" },
  { id: "inc-004", lng: 74.3720, lat: 31.5080, color: "#0E8A5F", label: "INC-LHR-004", category: "Garbage / Waste",           address: "Model Town",        status: "RESOLVED",                      priority: "Low",      firstReported: "Aug 12, 07:20 AM", lastReported: "Aug 12, 07:20 AM", citizenReports: 1, department: "LWMC" },
  { id: "inc-005", lng: 74.3530, lat: 31.5310, color: "#C0392B", label: "INC-LHR-005", category: "Flooding / Standing Water", address: "Ferozepur Road",    status: "REOPENED",                      priority: "Critical", firstReported: "Aug 14, 06:45 PM", lastReported: "Aug 22, 09:05 AM", citizenReports: 9, department: "WASA" },
  { id: "inc-006", lng: 74.3810, lat: 31.5170, color: "#C6A55C", label: "INC-LHR-006", category: "Streetlight",               address: "DHA Phase 5",       status: "ASSIGNED",                      priority: "High",     firstReported: "Aug 20, 08:15 PM", lastReported: "Aug 21, 08:15 PM", citizenReports: 3, department: "LESCO" },
  { id: "inc-007", lng: 74.3290, lat: 31.5230, color: "#0E8A5F", label: "INC-LHR-007", category: "Broken Road",               address: "Iqbal Town",        status: "RESOLVED",                      priority: "Low",      firstReported: "Aug 10, 11:00 AM", lastReported: "Aug 10, 11:00 AM", citizenReports: 2, department: "LDA Roads" },
  { id: "inc-008", lng: 74.3580, lat: 31.5050, color: "#C0392B", label: "INC-LHR-008", category: "Safety Hazard",             address: "Ichhra",            status: "IN_PROGRESS",                   priority: "Critical", firstReported: "Aug 22, 07:30 AM", lastReported: "Aug 22, 10:00 AM", citizenReports: 5, department: "LMC" },
  { id: "inc-009", lng: 74.3480, lat: 31.5380, color: "#E0A400", label: "INC-LHR-009", category: "Drainage",                  address: "Shadman",           status: "ASSIGNED",                      priority: "Medium",   firstReported: "Aug 21, 05:20 PM", lastReported: "Aug 22, 08:40 AM", citizenReports: 4, department: "WASA" },
  { id: "inc-010", lng: 74.3750, lat: 31.5290, color: "#C6A55C", label: "INC-LHR-010", category: "Broken Road",               address: "Garden Town",       status: "IN_PROGRESS",                   priority: "High",     firstReported: "Aug 19, 03:10 PM", lastReported: "Aug 22, 01:00 PM", citizenReports: 6, department: "LDA Roads" },
  { id: "inc-011", lng: 74.3330, lat: 31.5100, color: "#E0A400", label: "INC-LHR-011", category: "Encroachment",              address: "Samanabad",         status: "SUBMITTED",                     priority: "Medium",   firstReported: "Aug 22, 09:45 AM", lastReported: "Aug 22, 09:45 AM", citizenReports: 2, department: "LMC" },
  { id: "inc-012", lng: 74.3620, lat: 31.5420, color: "#0E8A5F", label: "INC-LHR-012", category: "Streetlight",               address: "Faisal Town",       status: "RESOLVED",                      priority: "Low",      firstReported: "Aug 09, 08:30 PM", lastReported: "Aug 09, 08:30 PM", citizenReports: 1, department: "LESCO" },
  { id: "inc-013", lng: 74.3900, lat: 31.5220, color: "#C0392B", label: "INC-LHR-013", category: "Flooding / Standing Water", address: "Mughalpura",        status: "AWAITING_CITIZEN_VERIFICATION", priority: "Critical", firstReported: "Aug 20, 11:20 PM", lastReported: "Aug 22, 06:10 AM", citizenReports: 8, department: "WASA" },
  { id: "inc-014", lng: 74.3250, lat: 31.5300, color: "#E0A400", label: "INC-LHR-014", category: "Infrastructure",            address: "Sanda",             status: "ASSIGNED",                      priority: "Medium",   firstReported: "Aug 21, 10:05 AM", lastReported: "Aug 22, 09:00 AM", citizenReports: 3, department: "LDA Roads" },
  { id: "inc-015", lng: 74.3700, lat: 31.5150, color: "#C6A55C", label: "INC-LHR-015", category: "Sewerage / Water",          address: "Muslim Town",       status: "IN_PROGRESS",                   priority: "High",     firstReported: "Aug 20, 04:50 PM", lastReported: "Aug 22, 11:30 AM", citizenReports: 5, department: "WASA" },
];

export interface MockReport {
  id: string;
  shortCode: string;
  status: StatusType;
  category: string;
  categoryIcon: string;
  description: string;
  location: string;
  submittedAt: Date;
  incidentId?: string;
  incidentShortCode?: string;
  imageColor: string;
}

export interface MockIncident {
  id: string;
  shortCode: string;
  status: StatusType;
  category: string;
  categoryIcon: string;
  severity: "low" | "medium" | "high" | "critical";
  priorityScore: number;
  priorityBand: PriorityBand;
  location: string;
  area: string;
  lng: number;
  lat: number;
  reportCount: number;
  assignedDepartment?: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  aiSummary?: string;
  resolutionImage?: boolean;
  resolutionDescription?: string;
  verificationState?: "CONFIRMED" | "REJECTED" | "PENDING";
  repVerified?: boolean;
  timeline: { status: StatusType; occurredAt: Date; label: string }[];
}

export interface MockNotification {
  id: string;
  eventType: string;
  title: string;
  body: string;
  entityShortCode?: string;
  isRead: boolean;
  priority: "normal" | "high";
  createdAt: Date;
}

export const MOCK_CITIZEN_REPORTS: MockReport[] = [
  {
    id: "rpt-001",
    shortCode: "LHR-B6BE7",
    status: "AWAITING_CITIZEN_VERIFICATION",
    category: "Sewerage / Water",
    categoryIcon: "SW",
    description: "Sewage overflow on main street near Gulberg III market.",
    location: "Gulberg III, Lahore",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    incidentId: "inc-001",
    incidentShortCode: "INC-LHR-001",
    imageColor: "#0E2A4E",
  },
  {
    id: "rpt-002",
    shortCode: "LHR-2DA1D",
    status: "IN_PROGRESS",
    category: "Broken Road",
    categoryIcon: "BR",
    description: "Large pothole near main gate blocking cars.",
    location: "Canal Bank Road, Lahore",
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    incidentId: "inc-002",
    incidentShortCode: "INC-LHR-002",
    imageColor: "#5A6B84",
  },
  {
    id: "rpt-003",
    shortCode: "LHR-48D6D",
    status: "SUBMITTED",
    category: "Streetlight",
    categoryIcon: "SL",
    description: "3 consecutive streetlights non-functional on DHA Phase 5.",
    location: "DHA Phase 5, Lahore",
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    imageColor: "#C6A55C",
  },
  {
    id: "rpt-004",
    shortCode: "LHR-BB300",
    status: "RESOLVED",
    category: "Garbage / Waste",
    categoryIcon: "GW",
    description: "Garbage pile blocking pedestrian walkway in Model Town.",
    location: "Model Town, Lahore",
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    incidentId: "inc-004",
    incidentShortCode: "INC-LHR-004",
    imageColor: "#0E8A5F",
  },
];

export const MOCK_INCIDENTS: MockIncident[] = [
  {
    id: "inc-001",
    shortCode: "INC-LHR-001",
    status: "AWAITING_CITIZEN_VERIFICATION",
    category: "Sewerage / Water",
    categoryIcon: "SW",
    severity: "high",
    priorityScore: 78.4,
    priorityBand: "CRITICAL",
    location: "Gulberg III, Lahore",
    area: "Gulberg",
    lng: 74.3461,
    lat: 31.5134,
    reportCount: 4,
    assignedDepartment: "WASA Lahore",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    description: "Sewage overflow causing health hazard near residential area.",
    aiSummary: "High-confidence sewerage/drainage issue. Elevated health risk near food market.",
    resolutionImage: true,
    resolutionDescription: "Blocked drain cleared and sewage pipe repaired. Area cleaned and sanitised.",
    verificationState: "PENDING",
    repVerified: true,
    timeline: [
      { status: "SUBMITTED", occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), label: "Report submitted" },
      { status: "VERIFIED", occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), label: "Verified by Street Rep" },
      { status: "ASSIGNED", occurredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), label: "Assigned to WASA Lahore" },
      { status: "IN_PROGRESS", occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), label: "Work commenced" },
      { status: "RESOLUTION_SUBMITTED", occurredAt: new Date(Date.now() - 12 * 60 * 60 * 1000), label: "Resolution submitted" },
      { status: "AWAITING_CITIZEN_VERIFICATION", occurredAt: new Date(Date.now() - 6 * 60 * 60 * 1000), label: "Awaiting citizen verification" },
    ],
  },
  {
    id: "inc-002",
    shortCode: "INC-LHR-002",
    status: "IN_PROGRESS",
    category: "Broken Road",
    categoryIcon: "BR",
    severity: "medium",
    priorityScore: 55.2,
    priorityBand: "HIGH",
    location: "Canal Bank Road, Lahore",
    area: "Shalimar",
    lng: 74.3392,
    lat: 31.5198,
    reportCount: 2,
    assignedDepartment: "LDA Roads Division",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    description: "Large pothole on Canal Bank Road causing traffic hazard.",
    aiSummary: "Road surface damage detected. Medium severity, high traffic area.",
    repVerified: true,
    timeline: [
      { status: "SUBMITTED", occurredAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), label: "Report submitted" },
      { status: "VERIFIED", occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), label: "Verified by Street Rep" },
      { status: "ASSIGNED", occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), label: "Assigned to LDA Roads" },
      { status: "IN_PROGRESS", occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), label: "Work commenced" },
    ],
  },
  {
    id: "inc-003",
    shortCode: "INC-LHR-003",
    status: "ASSIGNED",
    category: "Garbage / Waste",
    categoryIcon: "GW",
    severity: "medium",
    priorityScore: 48.7,
    priorityBand: "MEDIUM",
    location: "Johar Town, Lahore",
    area: "Johar Town",
    lng: 74.3650,
    lat: 31.5260,
    reportCount: 6,
    assignedDepartment: "LWMC Solid Waste",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    description: "Overflowing skip containers near Q-Block market.",
    aiSummary: "Garbage accumulation. Multiple citizen reports — likely collection route delay.",
    repVerified: false,
    timeline: [
      { status: "SUBMITTED", occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), label: "First report" },
      { status: "ASSIGNED", occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000), label: "Assigned to LWMC" },
    ],
  },
  {
    id: "inc-004",
    shortCode: "INC-LHR-004",
    status: "RESOLVED",
    category: "Garbage / Waste",
    categoryIcon: "GW",
    severity: "low",
    priorityScore: 22.1,
    priorityBand: "LOW",
    location: "Model Town, Lahore",
    area: "Model Town",
    lng: 74.3720,
    lat: 31.5080,
    reportCount: 1,
    assignedDepartment: "LWMC Solid Waste",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    description: "Garbage pile resolved after department cleanup.",
    repVerified: true,
    timeline: [
      { status: "SUBMITTED", occurredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), label: "Report submitted" },
      { status: "VERIFIED", occurredAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), label: "Verified by Street Rep" },
      { status: "ASSIGNED", occurredAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), label: "Assigned" },
      { status: "IN_PROGRESS", occurredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), label: "Work commenced" },
      { status: "RESOLUTION_SUBMITTED", occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), label: "Resolution submitted" },
      { status: "RESOLVED", occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), label: "Confirmed resolved" },
    ],
  },
  {
    id: "inc-005",
    shortCode: "INC-LHR-005",
    status: "REOPENED",
    category: "Flooding / Standing Water",
    categoryIcon: "FL",
    severity: "critical",
    priorityScore: 88.3,
    priorityBand: "CRITICAL",
    location: "Ferozepur Road, Lahore",
    area: "Gulberg",
    lng: 74.3530,
    lat: 31.5310,
    reportCount: 9,
    assignedDepartment: "WASA Lahore",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    description: "Persistent flooding on Ferozepur Road underpass during rain.",
    aiSummary: "Critical flooding. 9 supporting reports. Recurring issue at this location.",
    repVerified: true,
    timeline: [
      { status: "SUBMITTED", occurredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), label: "First report" },
      { status: "VERIFIED", occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), label: "Verified by Street Rep" },
      { status: "ASSIGNED", occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), label: "Assigned to WASA" },
      { status: "IN_PROGRESS", occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), label: "Work commenced" },
      { status: "RESOLUTION_SUBMITTED", occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), label: "Resolution submitted" },
      { status: "AWAITING_CITIZEN_VERIFICATION", occurredAt: new Date(Date.now() - 18 * 60 * 60 * 1000), label: "Awaiting verification" },
      { status: "REOPENED", occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000), label: "Citizen rejected: issue persists" },
    ],
  },
];

// ── Duplicate detection mock ──────────────────────────────────────────────────
export interface MockDuplicateReport {
  id: string;
  shortCode: string;
  category: string;
  description: string;
  street: string;
  location?: string;
  distance_m: number;
  submittedAt: Date;
}

export const MOCK_DUPLICATE_REPORTS: MockDuplicateReport[] = [
  { id: "dup-001", shortCode: "LHR-2DA1D", category: "Broken Road", description: "big pothole near main gate blocking cars",        street: "Street 14, Block 6", distance_m: 45, submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: "dup-002", shortCode: "LHR-B6BE7", category: "Broken Road", description: "huge pothole near main gate",                      street: "Street 14, Block 6", distance_m: 12, submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: "dup-003", shortCode: "LHR-48D6D", category: "Broken Road", description: "road damage near main entrance very bad pothole",  street: "Street 14, Block 6", distance_m: 28, submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: "dup-004", shortCode: "LHR-BB300", category: "Broken Road", description: "dangerous pothole blocks traffic near gate",        street: "Street 14, Block 6", distance_m: 67, submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: "dup-005", shortCode: "LHR-C9C08", category: "Broken Road", description: "pothole near gate still not fixed",                 street: "Street 14, Block 6", distance_m: 33, submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
];

export const MOCK_DUPLICATE_SIGNALS = {
  reportCount: 5,
  distance_m: 67,
  time_minutes: 2880,
  category_match: true,
  semantic_similarity: 0.91,
  image_similarity: 0.78,
  combined_probability: 0.94,
  recommendation: "merge" as const,
};

// ── Street Rep mock ───────────────────────────────────────────────────────────
export interface MockStreetArea {
  name: string;
  uc: string;
  totalIncidents: number;
  active: number;
  resolved: number;
  reopened: number;
  avgResolutionDays: number;
  healthScore: number;
  healthTrend: number;
}

export interface MockFieldUpdate {
  id: string;
  incidentShortCode: string;
  category: string;
  note: string;
  submittedAt: Date;
  type: "escalation" | "field-note" | "verification";
}

export const MOCK_STREET_AREA: MockStreetArea = {
  name: "Gulberg III",
  uc: "UC-14, District East",
  totalIncidents: 31,
  active: 12,
  resolved: 17,
  reopened: 2,
  avgResolutionDays: 4.2,
  healthScore: 74,
  healthTrend: 4,
};

export const MOCK_AREA_INCIDENTS = MOCK_INCIDENTS.filter((i) =>
  ["Gulberg", "Shalimar"].includes(i.area)
);

// Reports waiting for Street Rep verification (submitted but not yet verified)
export const MOCK_REP_PENDING_REPORTS = [
  { id: "rv-001", shortCode: "LHR-2DA1D", category: "Broken Road", description: "big pothole near main gate blocking cars",       street: "Street 14, Block 6", submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hasPhoto: false },
  { id: "rv-002", shortCode: "LHR-B6BE7", category: "Broken Road", description: "huge pothole near main gate",                    street: "Street 14, Block 6", submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hasPhoto: false },
  { id: "rv-003", shortCode: "LHR-48D6D", category: "Broken Road", description: "road damage near main entrance very bad pothole",street: "Street 14, Block 6", submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), hasPhoto: false },
  { id: "rv-004", shortCode: "LHR-BB300", category: "Broken Road", description: "dangerous pothole blocks traffic near gate",      street: "Street 14, Block 6", submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), hasPhoto: false },
  { id: "rv-005", shortCode: "LHR-C9C08", category: "Broken Road", description: "pothole near gate still not fixed",               street: "Street 14, Block 6", submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), hasPhoto: false },
];

export const MOCK_STREET_REP_UPDATES: MockFieldUpdate[] = [
  { id: "fu-001", incidentShortCode: "INC-LHR-001", category: "Sewerage / Water", note: "Drain still overflowing at junction. Escalating to WASA supervisor.", submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), type: "escalation" },
  { id: "fu-002", incidentShortCode: "INC-LHR-005", category: "Flooding / Standing Water", note: "Visited site. Road still floods after any rainfall. Previous repair was surface-level only.", submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), type: "field-note" },
  { id: "fu-003", incidentShortCode: "INC-LHR-004", category: "Garbage / Waste", note: "Verified: area is clean. Garbage bins emptied. Marking physically confirmed resolved.", submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), type: "verification" },
];

export const MOCK_CITIZEN_MESSAGES = [
  { id: "msg-001", from: "Hammad Ali",  text: "The sewage smell near Block 6 is unbearable. When will it be fixed?",         sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000),       read: false, incidentRef: "INC-LHR-001" },
  { id: "msg-002", from: "Fatima Khan", text: "Pothole on street 14 has gotten bigger after the rain. Can you check?",        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),  read: false, incidentRef: null },
  { id: "msg-003", from: "Ali Raza",    text: "The garbage was collected today, thank you!",                                   sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),  read: true,  incidentRef: "INC-LHR-004" },
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: "not-001", eventType: "VERIFICATION_REQUESTED", title: "Resolution Awaiting Verification",    body: "WASA Lahore submitted a resolution for INC-LHR-001. Compare evidence and confirm.", entityShortCode: "INC-LHR-001", isRead: false, priority: "high",   createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
  { id: "not-002", eventType: "INCIDENT_IN_PROGRESS",   title: "Work Has Started",                    body: "LDA Roads is now working on INC-LHR-002 (Broken Road, Canal Bank Road).",          entityShortCode: "INC-LHR-002", isRead: false, priority: "normal", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: "not-003", eventType: "REPORT_LINKED_TO_INCIDENT", title: "Report Joined Existing Incident", body: "Your report LHR-48D6D has been linked to INC-LHR-003 (6 citizens reporting).",      entityShortCode: "INC-LHR-003", isRead: true,  priority: "normal", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: "not-004", eventType: "INCIDENT_RESOLVED",      title: "Incident Resolved",                   body: "INC-LHR-004 (Garbage / Waste, Model Town) has been resolved and confirmed.",       entityShortCode: "INC-LHR-004", isRead: true,  priority: "normal", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
];

export const MOCK_ANNOUNCEMENTS = [
  { title: "Water Supply Notice", body: "Maintenance on Gulberg main supply line — Thu 9 AM to 1 PM." },
  { title: "Most Resolved Incidents", body: "WASA Lahore resolved 42 incidents this week — city record." },
];

export const MOCK_DEPT_STATS = {
  assigned: 12,
  inProgress: 5,
  awaitingVerification: 3,
  resolvedThisMonth: 28,
  reopened: 2,
  avgResolutionHours: 22.4,
  verificationAcceptanceRate: 0.87,
};

export const MOCK_DEPT_INCIDENTS = MOCK_INCIDENTS.filter(
  (i) => i.assignedDepartment === "WASA Lahore"
);

// ── UC Operations (Department dashboard) ────────────────────────────────────

export const MOCK_UC_STATS = {
  streets: 142,
  avgScore: 73.4,
  openComplaints: 38,
  overdue: 5,
  activeWorkOrders: 12,
};

export const MOCK_COMPLAINT_QUEUE = [
  { id: "cq-001", title: "Broken road",    street: "St 3, Block 2",  code: "KHI-88317", status: "overdue", daysOverdue: 2,  verifiedByRep: true,  daysOld: 4, hasWorkOrder: false },
  { id: "cq-002", title: "Garbage pile",   street: "St 14, Block 6", code: "KHI-88302", status: "verified", daysOverdue: 0, verifiedByRep: true,  daysOld: 1, hasWorkOrder: false },
  { id: "cq-003", title: "Streetlight",    street: "St 21, Block 6", code: "KHI-88295", status: "verified", daysOverdue: 0, verifiedByRep: true,  daysOld: 1, hasWorkOrder: false },
  { id: "cq-004", title: "Encroachment",   street: "St 9, Block 7",  code: "KHI-88288", status: "pending_rep", daysOverdue: 0, verifiedByRep: false, daysOld: 0, hasWorkOrder: false },
];

export const MOCK_STREET_RANKINGS = [
  { rank: 1,   street: "St 21, Block 6", score: 88,  open: 1, trend: +3, rep: "Sana Malik",   flagged: false },
  { rank: 2,   street: "St 14, Block 6", score: 82,  open: 2, trend: +4, rep: "Ahmed Raza",   flagged: false },
  { rank: 3,   street: "St 15, Block 6", score: 76,  open: 1, trend: +1, rep: "Ahmed Raza",   flagged: false },
  { rank: 141, street: "St 5, Block 7",  score: 57,  open: 4, trend: -2, rep: "Imran Qazi",   flagged: false },
  { rank: 142, street: "St 3, Block 2",  score: 44,  open: 6, trend: -5, rep: "Waseem Abbas", flagged: true  },
];

export const MOCK_REP_PERFORMANCE = [
  { initials: "SM", name: "Sana Malik",    repOfMonth: true,  avgVerifyHrs: 3.1, checklists: 100, rating: 4.8, flagged: false },
  { initials: "AR", name: "Ahmed Raza",    repOfMonth: false, avgVerifyHrs: 5.2, checklists: 100, rating: 4.6, flagged: false },
  { initials: "WA", name: "Waseem Abbas",  repOfMonth: false, avgVerifyHrs: 19,  checklists: 78,  rating: 3.1, flagged: true  },
];

export const MOCK_MINISTRY_STATS = {
  totalActive: 142,
  resolvedThisPeriod: 89,
  reopened: 14,
  awaitingVerification: 23,
  avgResolutionHours: 18.6,
  criticalIncidents: 8,
  categoryBreakdown: [
    { category: "Garbage / Waste",          count: 38, pct: 26.8 },
    { category: "Broken Road",              count: 27, pct: 19.0 },
    { category: "Sewerage / Water",         count: 24, pct: 16.9 },
    { category: "Flooding",                 count: 19, pct: 13.4 },
    { category: "Streetlight",              count: 14, pct: 9.9  },
    { category: "Other",                    count: 20, pct: 14.0 },
  ],
  statusBreakdown: [
    { status: "ASSIGNED",                      count: 45 },
    { status: "IN_PROGRESS",                   count: 52 },
    { status: "AWAITING_CITIZEN_VERIFICATION", count: 23 },
    { status: "RESOLVED",                      count: 89 },
    { status: "REOPENED",                      count: 14 },
  ],
  departmentPerformance: [
    { name: "WASA Lahore",     assigned: 28, inProgress: 12, resolved: 22, avgHours: 16.2, reopenedRate: 0.12, verificationRate: 0.91 },
    { name: "LDA Roads",       assigned: 24, inProgress: 18, resolved: 19, avgHours: 28.4, reopenedRate: 0.08, verificationRate: 0.88 },
    { name: "LWMC Solid Waste",assigned: 38, inProgress: 14, resolved: 31, avgHours:  9.8, reopenedRate: 0.06, verificationRate: 0.94 },
    { name: "LESCO",           assigned: 14, inProgress:  6, resolved: 11, avgHours: 14.1, reopenedRate: 0.18, verificationRate: 0.79 },
    { name: "LMC",             assigned: 18, inProgress:  8, resolved: 16, avgHours: 22.7, reopenedRate: 0.11, verificationRate: 0.85 },
  ],
  hotspots: [
    { area: "Gulberg",        count: 24, dominant: "Sewerage / Water", avgPriority: 68.4, critical: 4 },
    { area: "Johar Town",     count: 19, dominant: "Garbage / Waste",  avgPriority: 51.2, critical: 2 },
    { area: "DHA Phase 5",    count: 16, dominant: "Streetlight",      avgPriority: 44.8, critical: 1 },
    { area: "Ferozepur Road", count: 14, dominant: "Flooding",         avgPriority: 77.1, critical: 5 },
    { area: "Model Town",     count: 11, dominant: "Broken Road",      avgPriority: 39.3, critical: 0 },
  ],
  resolutionTrend: [
    { date: "Aug 15", created: 12, resolved:  8 },
    { date: "Aug 16", created:  9, resolved: 11 },
    { date: "Aug 17", created: 15, resolved:  9 },
    { date: "Aug 18", created: 11, resolved: 14 },
    { date: "Aug 19", created:  8, resolved: 12 },
    { date: "Aug 20", created: 14, resolved: 10 },
    { date: "Aug 21", created:  6, resolved:  7 },
  ],
};

// ── Contractors (for work-order assignment) ───────────────────────────────────
export interface MockContractor {
  id: string;
  name: string;
  specialty: string;
  rating: number;        // 1-5
  completedJobs: number;
  pendingJobs: number;
  avatarInitials: string;
}

export const MOCK_CONTRACTORS: MockContractor[] = [
  { id: "con-001", name: "Al-Jalil Builders",  specialty: "Roads & Infrastructure", rating: 4.7, completedJobs: 142, pendingJobs: 3, avatarInitials: "AJ" },
  { id: "con-002", name: "Metro Contractors",  specialty: "Water & Sewerage",       rating: 4.4, completedJobs: 98,  pendingJobs: 5, avatarInitials: "MC" },
  { id: "con-003", name: "Lahore Infra Co",    specialty: "General Civil Works",    rating: 4.1, completedJobs: 76,  pendingJobs: 2, avatarInitials: "LI" },
];
