import { pageMetadata } from "@/lib/i18n/metadata"
import { single, type SearchParams } from "@/lib/search-params"
import { BookingForm } from "./booking-form"

export const generateMetadata = pageMetadata("book")

export default async function BookPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  return <BookingForm initialDoctorId={single(params.doctor) ?? null} />
}
