"use client"

/**
 * Doctor home: greeting, summary cards (to review / DR found / processing / failed),
 * AI service status, a filterable review queue, and today's appointments.
 *
 * Everything is "locked" (queries skipped) until the doctor is approved, because
 * the API would answer 403. Each section loads its own data.
 */

import { PushPrompt } from "@/components/layout/push-prompt"
import { useGetMyVerificationQuery } from "@/services/doctor.service"

import { AiStatusBanner } from "./ai-status-banner"
import { DashboardHeader } from "./dashboard-header"
import { ReviewQueue } from "./review-queue"
import { SummaryCards } from "./summary-cards"
import { TodaySchedule } from "./today-schedule"

export function DoctorDashboard({ name }: { name: string }) {
  const { data: verification } = useGetMyVerificationQuery()
  const locked = verification?.status !== "approved"

  return (
    <>
      <DashboardHeader name={name} locked={locked} />
      <PushPrompt />
      <SummaryCards locked={locked} />
      <AiStatusBanner locked={locked} />
      <div className="flex flex-wrap items-start gap-6">
        <ReviewQueue locked={locked} />
        <TodaySchedule locked={locked} />
      </div>
    </>
  )
}
