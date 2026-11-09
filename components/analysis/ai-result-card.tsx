import type { Analysis, DrLevel } from "@/lib/api-types"
import { GRADE_COLOR, GRADE_LABELS, GRADE_TEXT, GRADES, isLevel } from "@/lib/grades"
import { pct } from "@/lib/format"
import { Chip } from "@/components/rc/ui"
import { cn } from "@/lib/utils"

const SCALE_LABELS = ["No DR", "Mild", "Moderate", "Severe", "PDR"]

export function SeverityScale({ level }: { level: DrLevel }) {
  return (
    <div
      role="img"
      aria-label={`Severity scale, grade ${level} of 0 to 4`}
      className="grid grid-cols-5 gap-1.5 text-center text-xs font-medium"
    >
      {GRADES.map((g) => (
        <span key={g} className={cn("flex flex-col gap-1.5", g === level ? "font-bold text-foreground" : "text-muted-foreground")}>
          <span
            className={cn("h-2 rounded-full", g === level && "ring-2 ring-foreground ring-offset-2 ring-offset-card")}
            style={{ background: GRADE_COLOR[g], opacity: g === level ? 1 : 0.35 }}
          />
          {SCALE_LABELS[g]}
        </span>
      ))}
    </div>
  )
}

/** The AI result panel: grade, scale, stage confidences, class probabilities, disclaimer. */
export function AiResultCard({ analysis }: { analysis: Analysis }) {
  const r = analysis.result
  if (!r || !isLevel(r.predictedLevel)) return null
  const level = r.predictedLevel
  return (
    <section aria-label="AI result" className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">AI result</h2>
        <span className="flex gap-2">
          {r.isMock && <Chip className="bg-warning-bg text-warning-fg">DEMO</Chip>}
          {r.referable ? (
            <Chip className="bg-[#FCE4E4] text-[#A11B1B] dark:bg-[#3d1717] dark:text-[#ffaaaa]">Referable</Chip>
          ) : (
            <Chip className="bg-[#E7F5EC] text-[#166534] dark:bg-[#123322] dark:text-[#8fe0aa]">Not referable</Chip>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={cn("font-heading text-[30px] leading-tight font-semibold", GRADE_TEXT[level])}>
          {level === 0 ? "No DR" : `${GRADE_LABELS[level]} DR`}
        </span>
        {r.gradeDescription && <p className="text-[15px] leading-relaxed text-subtle-foreground">{r.gradeDescription}</p>}
      </div>
      <SeverityScale level={level} />
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted p-3.5">
          <dt className="text-[13px] text-muted-foreground">Stage 1 · DR detected</dt>
          <dd className="mt-0.5 font-heading text-lg font-semibold">
            {r.hasDR ? "Yes" : "No"} · {pct(r.stage1Confidence)}
          </dd>
        </div>
        <div className="rounded-xl bg-muted p-3.5">
          <dt className="text-[13px] text-muted-foreground">Stage 2 · confidence</dt>
          <dd className="mt-0.5 font-heading text-lg font-semibold">{pct(r.confidence)}</dd>
        </div>
      </dl>
      {r.probabilities.length === 5 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Class probabilities (after TTA)</span>
          {r.probabilities.map((value, i) => (
            <div key={i} className="grid grid-cols-[96px_1fr_44px] items-center gap-3 text-sm">
              <span className="text-subtle-foreground">{GRADE_LABELS[i as DrLevel]}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.max(2, value * 100)}%`, background: GRADE_COLOR[i as DrLevel] }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">{pct(value)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[13px] leading-snug text-muted-foreground">{analysis.disclaimer}</p>
    </section>
  )
}
