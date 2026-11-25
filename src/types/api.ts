/**
 * TypeScript mirror of the backend API — the contract between client and server.
 *
 * When the backend changes a payload, update the type here first; TypeScript
 * will then show every place in the client that needs to change.
 * Conventions: ids are Mongo ObjectId strings, dates are ISO strings,
 * populated references use small "Ref" types (e.g. UserRef).
 */

export type Role = "admin" | "doctor" | "patient"
export type Language = "en" | "ar"
export type ObjectId = string
export type IsoDate = string

/** Every successful response is wrapped like this. lib/api/request.ts unwraps it. */
export interface ApiEnvelope<T> {
  message: string
  data: T
}

/** Paged list response. `count` = total items, `pages` = total pages. */
export interface Paginated<T> {
  docs: T[]
  count: number
  currentPage: number
  size: number
  pages: number
}

/** Error response (NestJS style). `message` may be a list of validation errors. */
export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error?: string
  errorCode?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface User {
  _id: ObjectId
  role: Role
  name: string
  email: string
  city: string
  phone?: string
  avatarUrl: string | null
  provider?: "system" | "google"
  emailVerified: boolean
  language: Language | null
  createdAt?: IsoDate
  updatedAt?: IsoDate
}

/** Minimal user info embedded in other objects. */
export interface UserRef {
  _id: ObjectId
  name: string
  email: string
  avatarUrl: string | null
}

export type DoctorVerificationStatus = "pending" | "approved" | "rejected"

export interface LicenseDocument {
  index: number
  originalName: string
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp"
  size: number
  uploadedAt: IsoDate
}

/** A doctor's license review state. `status` is null before any submission. */
export interface DoctorVerification {
  status: DoctorVerificationStatus | null
  licenseNumber: string | null
  submittedAt: IsoDate | null
  verifiedAt: IsoDate | null
  rejectionReason: string | null
  documents: LicenseDocument[]
}

export interface DoctorClinic {
  _id: ObjectId
  user: ObjectId
  clinicName: string
  clinicAddress: string
  specialty: string | null
  licenseNumber: string | null
  bio: string | null
  yearsOfExperience: number | null
  verificationStatus: DoctorVerificationStatus | null
}

/** A doctor as seen by their patient (doctor info + when they were assigned). */
export interface AssignedDoctor {
  assignmentId: ObjectId
  assignedAt: IsoDate | null
  _id: ObjectId
  name: string
  email: string
  city: string
  phone: string | null
  avatarUrl: string | null
  clinicName: string | null
  clinicAddress: string | null
  specialty: string | null
  bio: string | null
  yearsOfExperience: number | null
  verificationStatus: DoctorVerificationStatus | null
}

export interface PatientAccount {
  _id: ObjectId
  name: string
  email: string
  city: string
  phone?: string
  avatarUrl: string | null
  emailVerified: boolean
  isActive: boolean
}

/** Medical record of a patient; `user` is their login account. */
export interface Patient {
  _id: ObjectId
  medicalRecordNumber: string
  user: PatientAccount
  dateOfBirth: IsoDate | null
  gender: "male" | "female" | null
  emergencyContact: string | null
  diabetesSince: number | null
  medicalNotes: string | null
  createdAt: IsoDate
  updatedAt: IsoDate
}

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed"
export type EyeSide = "left" | "right" | "unknown"
/** Diabetic retinopathy grade: 0 none, 1 mild, 2 moderate, 3 severe, 4 proliferative. */
export type DrLevel = 0 | 1 | 2 | 3 | 4

/**
 * Stage-1 screening classes: N normal, D diabetic retinopathy, G glaucoma,
 * C cataract, A age-related macular degeneration, H hypertension,
 * M myopia, O other.
 */
export type FindingCode = "N" | "D" | "G" | "C" | "A" | "H" | "M" | "O"
export type Stage1Status = "DETECTED" | "SUSPECTED"

export interface AnalysisFinding {
  code: FindingCode
  name: string
  probability: number
  threshold: number
  detected: boolean
}

/**
 * One fundus image processed by the AI.
 * - stage1: multi-disease screening (always present once completed)
 * - stage2: DR severity grade (only when `available`)
 * - isMock: produced by the mock AI (development), not a real model
 */
export interface Analysis {
  _id: ObjectId
  doctor: ObjectId
  patient: UserRef | null
  image: {
    _id: ObjectId
    eye: EyeSide
    originalName: string | null
    notes: string | null
    capturedAt: IsoDate | null
    mimeType: "image/jpeg" | "image/png" | "image/webp"
    size: number
  } | null
  status: AnalysisStatus
  stage1: {
    hasDR: boolean | null
    confidence: number | null
    /** Ensemble probability of the D class (null on analyses made before stage 1 was linked). */
    drProbability?: number | null
    /** Threshold drProbability was compared against. */
    threshold?: number | null
    /** DETECTED when any class passed its threshold, SUSPECTED when none did. */
    status?: Stage1Status | null
    detected?: FindingCode[]
    /** Codes to display: the detected ones, or the top suspected ones. */
    shown?: FindingCode[]
    top?: FindingCode | null
    /** Finding code the Grad-CAM heatmap explains. */
    gradCamClass?: FindingCode | null
    findings: AnalysisFinding[]
  }
  stage2: {
    available: boolean
    predictedLevel: DrLevel | null
    label: string | null
    confidence: number | null
    probabilities: number[]
  }
  hasGradCam: boolean
  modelVersion: string | null
  isMock: boolean
  error: string | null
  attempts: number
  processingMs: number | null
  completedAt: IsoDate | null
  reviewedAt: IsoDate | null
  history?: AnalysisHistoryEntry[]
  createdAt: IsoDate
  updatedAt: IsoDate
}

export interface AnalysisHistoryEntry {
  status: AnalysisStatus
  message?: string
  at: IsoDate
  by?: ObjectId | null
}

/** The doctor's confirmation or correction of an analysis. */
export interface Review {
  _id: ObjectId
  analysis: ObjectId
  doctor: ObjectId
  patient: ObjectId
  aiResultConfirmed: boolean
  confirmedLevel: DrLevel
  confirmedLabel: string
  notes: string | null
  recommendations: string | null
  followUpDate: IsoDate | null
  createdAt: IsoDate
  updatedAt: IsoDate
}

/** One bookable time slot of a doctor. */
export interface Slot {
  _id: ObjectId
  doctor: ObjectId
  startAt: IsoDate
  endAt: IsoDate
  isBooked: boolean
  appointment: ObjectId | null
}

export interface PatientSearchResult {
  _id: ObjectId
  medicalRecordNumber: string
  name: string
  email: string
  city: string
  avatarUrl: string | null
  assigned: boolean
}

export type Gender = "male" | "female"

export type RescheduleReason =
  | "patient_request"
  | "patient_emergency"
  | "doctor_unavailable"
  | "medical_follow_up"
  | "other"

export interface RescheduleEntry {
  from: IsoDate
  to: IsoDate
  reason: RescheduleReason
  note?: string
  by: ObjectId
  byRole: Role
  at: IsoDate
}

/** AI service status. mode: "remote" = real model service, "mock" = fake results (dev), "disabled" = AI off. */
export interface AiHealth {
  mode: "remote" | "mock" | "disabled"
  available: boolean
  modelVersion: string | null
  error: string | null
  info?: Record<string, unknown>
}

export type ReportStatus = "draft" | "sent"

export interface Report {
  _id: ObjectId
  doctor: UserRef | null
  patient: UserRef | null
  analysis: ObjectId
  review: ObjectId | null
  title: string
  content: string | null
  recommendations: string | null
  status: ReportStatus
  sentAt: IsoDate | null
  viewedAt: IsoDate | null
  hasPdf: boolean
  pdfSize: number | null
  createdAt: IsoDate
  updatedAt: IsoDate
}

export type AppointmentStatus =
  "pending" | "confirmed" | "cancelled" | "completed"

/** A pending/decided cancel or reschedule request on an appointment. */
export interface AppointmentChangeRequest {
  type: "cancel" | "reschedule"
  status: "pending" | "approved" | "rejected" | "withdrawn"
  reason: string
  scheduledAt: IsoDate | null
  requestedBy: ObjectId
  requestedAt: IsoDate
}

export interface Appointment {
  _id: ObjectId
  doctor: UserRef | null
  patient: UserRef | null
  slot: ObjectId | null
  scheduledAt: IsoDate
  endAt: IsoDate | null
  status: AppointmentStatus
  reason: string | null
  cancelledBy?: ObjectId | null
  cancelReason?: string | null
  changeRequest: AppointmentChangeRequest | null
  rescheduleHistory?: RescheduleEntry[]
  createdAt: IsoDate
  updatedAt: IsoDate
}

export type NotificationType =
  | "appointment"
  | "analysis"
  | "report"
  | "message"
  | "system"
  | "note"
  | "follow_up"

/** `link` is a backend-style path; map it with notificationRoute(). */
export interface AppNotification {
  _id: ObjectId
  type: NotificationType
  title: string
  body: string
  link: string | null
  resourceId: ObjectId | null
  read: boolean
  readAt: IsoDate | null
  createdAt: IsoDate
}

export interface NotificationPage extends Paginated<AppNotification> {
  unreadCount: number
}

export interface ChatParticipant {
  _id: ObjectId
  name: string
  avatarUrl: string | null
  role: Role
}

export interface ChatAttachment {
  index: number
  url: string
  contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
  isImage: boolean
}

export interface ChatMessage {
  _id: ObjectId
  conversation: ObjectId
  sender: ObjectId
  message: string
  attachments: ChatAttachment[]
  readBy: ObjectId[]
  createdAt: IsoDate
  clientId?: string
}

export interface Conversation {
  _id: ObjectId
  doctor: ChatParticipant
  patient: ChatParticipant
  lastMessage: ChatMessage | null
  lastMessageAt: IsoDate | null
  unreadCount: number
}

/** Chat history page. Pass `nextBefore` as `before` to load older messages (null = no more). */
export interface MessagePage {
  docs: ChatMessage[]
  nextBefore: IsoDate | null
}

/** Doctor account + clinic + verification, flattened for the admin queue. */
export interface AdminDoctor {
  _id: ObjectId
  userId: ObjectId
  name: string
  email: string
  city: string
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  emailVerified: boolean
  clinicName: string
  clinicAddress: string
  specialty: string | null
  licenseNumber: string | null
  yearsOfExperience: number | null
  status: DoctorVerificationStatus | null
  submittedAt: IsoDate | null
  verifiedAt: IsoDate | null
  rejectionReason: string | null
  documents: LicenseDocument[]
  createdAt: IsoDate
}
