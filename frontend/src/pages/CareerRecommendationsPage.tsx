import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCareerRecommendations,
  type CareerRecommendation,
} from '../api/careerRecommendations'

export default function CareerRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetchCareerRecommendations(3)
      .then((result) => {
        if (!active) return
        setRecommendations(result.recommendations)
        setNote(result.note)
      })
      .catch((err: unknown) => {
        if (!active) return
        const message =
          err instanceof Error
            ? err.message
            : 'Could not load career recommendations. Please try again.'
        setError(message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Career development</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Career Recommendations
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Explore roles that best match the skills saved in your CareerPilot AI profile.
          Review the gaps to decide what to learn next.
        </p>
      </header>

      {loading && (
        <div role="status" className="rounded-xl border p-6 text-sm">
          Finding roles that match your skills…
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-xl border border-destructive/40 p-4">
          <p className="font-medium">Recommendations could not be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <section className="rounded-xl border p-6">
          <h2 className="font-semibold">No recommendations available</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add skills to your profile, then return to see matching career roles.
          </p>
        </section>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {recommendations.map((role, index) => (
            <article
              key={role.role_name}
              className="space-y-4 rounded-xl border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recommendation #{index + 1}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{role.role_name}</h2>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold tabular-nums">
                    {role.readiness_score}%
                  </p>
                  <p className="text-xs text-muted-foreground">skill match</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{role.description}</p>

              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                aria-label={`${role.readiness_score}% skill match`}
                role="img"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${role.readiness_score}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-3 py-1">
                  {role.matched_count} skills matched
                </span>
                <span className="rounded-full bg-muted px-3 py-1">
                  {role.missing_count} skills to develop
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Suggested next skills</h3>
                {role.recommended_next_skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {role.recommended_next_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You match all listed skills for this role.
                  </p>
                )}
              </div>

              <Link
                to="/ai/skill-gap"
                className="inline-flex rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                View skill-gap analysis
              </Link>
            </article>
          ))}
        </section>
      )}

      {!loading && !error && note && (
        <p className="text-xs text-muted-foreground">{note}</p>
      )}
    </main>
  )
}
