import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import {
  defaultProfiles,
  type ProfileData,
  type ProfileRole,
} from "@/lib/profile-settings"
import type { CreatePatientValues } from "@/lib/validation/patient"

export type PatientRecord = CreatePatientValues & {
  lastVisit: string
  status: "Needs review" | "Stable" | "Follow-up"
}

export type AppointmentRecord = {
  id: string
  patient: string
  reason: string
  date: string
  time: string
  location: string
  status: "Confirmed" | "Needs confirmation"
}

export type ScreeningRecord = {
  date: string
  grade: string
  confidence: number
  status: string
  tone: "amber" | "blue" | "green"
}

export type ReportRecord = {
  id: string
  date: string
  status: "Awaiting doctor review" | "Shared"
}

export type ConversationRecord = {
  patient: string
  latestMessage: string
  messages: {
    sender: "doctor" | "patient"
    text: string
    time: string
  }[]
}

export type WorkspaceActivity = {
  id: string
  type: "screening" | "report" | "appointment"
  title: string
  detail: string
}

type WorkspaceState = {
  profiles: Record<ProfileRole, ProfileData>
  patients: PatientRecord[]
  appointments: AppointmentRecord[]
  screenings: ScreeningRecord[]
  reports: ReportRecord[]
  conversations: ConversationRecord[]
  activity: WorkspaceActivity[]
}

const initialState: WorkspaceState = {
  profiles: defaultProfiles,
  patients: [
    {
      name: "Maya Johnson",
      email: "maya.johnson@example.com",
      patientId: "PT-1048",
      age: 58,
      lastVisit: "Today, 9:42 AM",
      status: "Needs review",
    },
    {
      name: "Noah Williams",
      email: "noah.williams@example.com",
      patientId: "PT-1047",
      age: 64,
      lastVisit: "Today, 8:15 AM",
      status: "Follow-up",
    },
    {
      name: "Sophia Chen",
      email: "sophia.chen@example.com",
      patientId: "PT-1042",
      age: 51,
      lastVisit: "Oct 18, 2026",
      status: "Stable",
    },
    {
      name: "Liam Patel",
      email: "liam.patel@example.com",
      patientId: "PT-1039",
      age: 72,
      lastVisit: "Oct 17, 2026",
      status: "Needs review",
    },
  ],
  appointments: [
    {
      id: "appointment-maya",
      patient: "Maya Johnson",
      reason: "Retinal screening review",
      date: "Tuesday, October 20, 2026",
      time: "10:30 AM",
      location: "In clinic",
      status: "Confirmed",
    },
    {
      id: "appointment-noah",
      patient: "Noah Williams",
      reason: "Follow-up consultation",
      date: "Tuesday, October 20, 2026",
      time: "11:15 AM",
      location: "In clinic",
      status: "Confirmed",
    },
    {
      id: "appointment-olivia",
      patient: "Olivia Brown",
      reason: "Fundus imaging",
      date: "Tuesday, October 20, 2026",
      time: "1:00 PM",
      location: "In clinic",
      status: "Needs confirmation",
    },
    {
      id: "appointment-alex",
      patient: "Alex Morgan",
      reason: "Eye health follow-up",
      date: "Thursday, October 29, 2026",
      time: "10:30 AM",
      location: "In clinic",
      status: "Confirmed",
    },
  ],
  screenings: [
    {
      date: "October 20, 2026",
      grade: "Moderate diabetic retinopathy",
      confidence: 92,
      status: "Doctor review recommended",
      tone: "amber",
    },
    {
      date: "April 12, 2026",
      grade: "Mild diabetic retinopathy",
      confidence: 88,
      status: "Report available",
      tone: "blue",
    },
    {
      date: "October 06, 2025",
      grade: "No signs of diabetic retinopathy",
      confidence: 95,
      status: "Report available",
      tone: "green",
    },
  ],
  reports: [
    {
      id: "report-oct-20",
      date: "October 20, 2026",
      status: "Awaiting doctor review",
    },
  ],
  conversations: [
    {
      patient: "Maya Johnson",
      latestMessage: "Thank you, doctor.",
      messages: [
        {
          sender: "patient",
          text: "Thank you, doctor.",
          time: "9:45 AM",
        },
      ],
    },
    {
      patient: "Noah Williams",
      latestMessage: "No new messages",
      messages: [],
    },
    {
      patient: "Sophia Chen",
      latestMessage: "No new messages",
      messages: [],
    },
    {
      patient: "Alex Morgan",
      latestMessage: "Thank you, I’ll see you then.",
      messages: [
        {
          sender: "doctor",
          text: "Hello Alex, your latest screening is ready for review. Let’s discuss it at your follow-up.",
          time: "9:45 AM",
        },
        {
          sender: "patient",
          text: "Thank you, I’ll see you then.",
          time: "10:02 AM",
        },
      ],
    },
  ],
  activity: [
    {
      id: "activity-screening-maya",
      type: "screening",
      title: "Screening reviewed",
      detail: "Maya Johnson · Today at 9:42 AM",
    },
    {
      id: "activity-report-noah",
      type: "report",
      title: "Report ready to send",
      detail: "Noah Williams · Today at 8:15 AM",
    },
    {
      id: "activity-appointment-sophia",
      type: "appointment",
      title: "Appointment confirmed",
      detail: "Sophia Chen · Yesterday",
    },
  ],
}

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    profileUpdated(
      state,
      action: PayloadAction<{ role: ProfileRole; profile: ProfileData }>
    ) {
      state.profiles[action.payload.role] = action.payload.profile
    },
    profilesHydrated(
      state,
      action: PayloadAction<Partial<Record<ProfileRole, ProfileData>>>
    ) {
      for (const role of ["doctor", "patient"] as const) {
        const profile = action.payload[role]
        if (profile) state.profiles[role] = profile
      }
    },
    patientAdded(state, action: PayloadAction<PatientRecord>) {
      state.patients.unshift(action.payload)
    },
  },
})

export const { patientAdded, profileUpdated, profilesHydrated } =
  workspaceSlice.actions
export default workspaceSlice.reducer
