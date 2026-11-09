/**
 * Response and request shapes of the RetinaCare API (server/source).
 * Every response is wrapped as { message, data }; apiClient unwraps `data`.
 */

export type UserRole = "doctor" | "patient" | "admin"
export type Id = string

export type ApiResponse<T> = { message: string; data: T }

export type Paged<T> = {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export type ApiUser = {
  id: Id
  _id?: Id
  name: string
  email: string
  city?: string
  phone?: string | null
  role: UserRole
  avatarUrl?: string | null
  provider?: string
  emailVerifiedAt?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type DoctorProfile = {
  _id: Id
  user: Id
  clinicName: string
  clinicAddress: string
  specialty?: string
  licenseNumber?: string
  bio?: string
  yearsOfExperience?: number
}

export type DiabetesType = "type1" | "type2" | "gestational" | "other"
export type Gender = "male" | "female"

export type PatientProfile = {
  _id: Id
  user: Id
  medicalRecordNumber: string
  dateOfBirth?: string
  gender?: Gender
  emergencyContact?: string
  diabetesType?: DiabetesType
  diabetesSince?: number
  medicalNotes?: string
}

export type Me = ApiUser & {
  consentAcceptedAt: string | null
  lang: string | null
  profile: DoctorProfile | PatientProfile | null
  profileComplete: boolean
  dashboard: string
}

export type UserWithProfile<P> = ApiUser & { profile: P | null }

/* ---------- Auth ---------- */

export type AuthTokens = { accessToken: string; refreshToken: string }

export type SignUpDto = {
  name: string
  email: string
  password: string
  city: string
  role: "patient" | "doctor"
  acceptTerms: boolean
  clinicName?: string
  clinicAddress?: string
  specialty?: string
  licenseNumber?: string
}

export type SignUpResponse = {
  email: string
  role: "patient" | "doctor"
  emailVerificationRequired: boolean
}

/* ---------- Images and analyses ---------- */

export type EyeSide = "left" | "right" | "unknown"
export type DrLevel = 0 | 1 | 2 | 3 | 4
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed"

export type FundusImage = {
  id: Id
  patient: ApiUser | Id
  uploadedBy: ApiUser | Id
  eye: EyeSide
  source: "upload" | "device"
  mimeType: string
  size: number
  originalName?: string
  notes?: string
  capturedAt?: string
  fileUrl: string
  createdAt: string
}

export type AnalysisResult = {
  hasDR: boolean
  drStatus: "DR" | "No DR"
  stage1Confidence: number
  predictedLevel: DrLevel | null
  gradeLabel: string | null
  gradeDescription: string | null
  referable: boolean
  confidence: number
  probabilities: number[]
  gradCamUrl: string | null
  modelVersion?: string
  isMock: boolean
}

export type AnalysisReviewSummary = {
  id: Id
  doctor: { id: Id; name: string } | null
  aiResultConfirmed: boolean
  confirmedLevel: DrLevel
  confirmedLabel?: string
  notes?: string
  recommendations?: string
  followUpDate?: string | null
}

export type Analysis = {
  id: Id
  status: AnalysisStatus
  doctor: ApiUser | Id
  patient: ApiUser | Id
  image: Partial<FundusImage> & { id: Id; fileUrl: string }
  result: AnalysisResult | null
  error: string | null
  attempts: number
  processingMs: number | null
  completedAt: string | null
  disclaimer: string
  createdAt: string
  updatedAt: string
  reviews?: AnalysisReviewSummary[]
}

export type AnalysisHistoryEntry = { status: string; message: string; at: string }

export type UploadResult = { image: FundusImage; analysis: Analysis | null }

/* ---------- Reviews and reports ---------- */

export type DoctorReview = {
  id: Id
  analysis: Id
  patient: ApiUser | Id
  doctor: ApiUser | Id
  aiResultConfirmed: boolean
  confirmedLevel: DrLevel
  confirmedLabel: string
  notes?: string
  recommendations?: string
  followUpDate: string | null
}

export type ReviewDto = {
  analysisId: string
  aiResultConfirmed: boolean
  confirmedLevel: DrLevel
  notes?: string
  recommendations?: string
  followUpDate?: string
}

export type ReportStatus = "draft" | "sent"

export type ReportSummary = {
  id: Id
  title: string
  status: ReportStatus
  sentAt: string | null
  viewedAt: string | null
  doctor: ApiUser | Id
  patient: ApiUser | Id
  analysis: Id
  pdfUrl: string
  createdAt: string
}

export type Report = ReportSummary & {
  content: string
  recommendations: string
  patientProfile: PatientProfile | null
  doctorProfile: DoctorProfile | null
  review: {
    id: Id
    aiResultConfirmed: boolean
    confirmedLevel: DrLevel
    confirmedLabel: string
    followUpDate: string | null
  } | null
  analysis: Analysis
  disclaimer: string
}

/* ---------- Patients and assignments ---------- */

export type PatientListItem = UserWithProfile<PatientProfile> & {
  latestAnalysis: { id: Id; predictedLevel: DrLevel; hasDR: boolean; createdAt: string } | null
}

export type PatientRecord = UserWithProfile<PatientProfile> & {
  stats: { images: number; analyses: number; reports: number; upcomingAppointments: number }
}

export type CreatePatientDto = {
  name: string
  email: string
  city: string
  dateOfBirth?: string
  gender?: Gender
  diabetesType?: DiabetesType
  diabetesSince?: number
  sendInvitation?: boolean
}

export type AssignmentStatus = "pending" | "active" | "ended"

export type Assignment = {
  id: Id
  status: AssignmentStatus
  assignedAt: string
  endedAt: string | null
  notes?: string
  doctor: ApiUser | Id
  patient: ApiUser | Id
}

export type PatientDoctor = {
  assignmentId: Id
  status: AssignmentStatus
  assignedAt: string
  doctor: UserWithProfile<DoctorProfile>
}

export type HistoryItem =
  | { type: "scan"; id: Id; date: string; title: string; data: FundusImage }
  | { type: "analysis"; id: Id; date: string; title: string; data: Analysis }
  | {
      type: "report"
      id: Id
      date: string
      title: string
      data: { id: Id; title: string; status: ReportStatus; analysis: Id; sentAt?: string; createdAt: string }
    }

/* ---------- Doctors ---------- */

export type DoctorDashboard = {
  patients: number
  pendingPatientRequests: number
  analyses: number
  referableCases: number
  failedAnalyses: number
  pendingAppointments: number
  draftReports: number
  todayAppointments: {
    id: Id
    scheduledAt: string
    status: AppointmentStatus
    reason?: string
    patient: ApiUser
  }[]
  recentAnalyses: Analysis[]
}

/* ---------- Appointments and availability ---------- */

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed"

export type Appointment = {
  id: Id
  doctor: ApiUser | Id
  patient: ApiUser | Id
  slot: Id | null
  scheduledAt: string
  endAt: string
  status: AppointmentStatus
  reason?: string
  notes?: string
  cancelReason?: string
  createdAt: string
}

export type Slot = {
  id: Id
  doctor: Id
  startAt: string
  endAt: string
  isBooked: boolean
  appointment: Id | null
}

/* ---------- Chat and notifications ---------- */

export type Message = {
  id: Id
  conversation: Id
  sender: Id
  message: string
  attachments: string[]
  readBy: Id[]
  deletedAt: string | null
  editedAt: string | null
  createdAt: string
}

export type Conversation = {
  id: Id
  doctor: Id
  patient: Id
  participant: ApiUser
  lastMessage: Message | null
  lastMessageAt: string | null
  unreadCount: number
  canSend: boolean
  createdAt: string
}

export type MessagesPage = { items: Message[]; hasMore: boolean; nextBefore: string | null }

export type NotificationItem = {
  id: Id
  type: string
  title: string
  body: string
  link: string | null
  resourceId: Id | null
  read: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationsPage = Paged<NotificationItem> & { unreadCount: number }
