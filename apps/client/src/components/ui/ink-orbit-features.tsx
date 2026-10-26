import React from "react"

// Interactive features bento for the exam desk: notices gather, attempt sheets
// keep printing, exam streams come into view one at a time, and a sample
// practice line can be scrubbed. Scoped styles live on `.ib-root` because the
// diagram motion is SVG and container-query layout, not utility classes.
// React is the only import. No remote images or icon packages.

export type InkFeatureCopy = {
  title: string
  description: string
  href?: string
  linkLabel?: string
}

export type InkFeatures = {
  tag: string
  /** `*word*` sets a muted run. A newline or the two characters \n break the line. */
  title: string
  collaboration: InkFeatureCopy
  reports: InkFeatureCopy
  integrations: InkFeatureCopy & { tools: string[] }
  insights: InkFeatureCopy & { values: number[]; forecastFrom: number }
}

export type InkOrbitFeaturesProps = {
  /** `auto` follows prefers-color-scheme. */
  theme?: "light" | "dark" | "auto"
  /** Shown in diagram labels. The hub chip uses `chip`, or the first word of this. */
  brand?: string
  chip?: string
  tag?: string
  title?: string
  collaboration?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] }
  reports?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] }
  integrations?: { [K in keyof InkFeatures["integrations"]]?: InkFeatures["integrations"][K] }
  insights?: { [K in keyof InkFeatures["insights"]]?: InkFeatures["insights"][K] }
  className?: string
  style?: React.CSSProperties
}

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function chartPaths(values: number[], w: number, h: number, pad: number) {
  const n = values.length
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const pts = values.map((v, i) => [
    pad + (n < 2 ? 0 : (i / (n - 1)) * (w - pad * 2)),
    h - pad - ((v - lo) / span) * (h - pad * 2),
  ] as [number, number])
  let line = ""
  pts.forEach(([x, y], i) => {
    if (i === 0) {
      line = "M" + x.toFixed(1) + "," + y.toFixed(1)
      return
    }
    const [px, py] = pts[i - 1]
    const cx = (px + x) / 2
    line +=
      " C" +
      cx.toFixed(1) +
      "," +
      py.toFixed(1) +
      " " +
      cx.toFixed(1) +
      "," +
      y.toFixed(1) +
      " " +
      x.toFixed(1) +
      "," +
      y.toFixed(1)
  })
  const area = n
    ? line +
      " L" +
      pts[n - 1][0].toFixed(1) +
      "," +
      (h - pad) +
      " L" +
      pts[0][0].toFixed(1) +
      "," +
      (h - pad) +
      " Z"
    : ""
  return { line, area, points: pts }
}

function nearestIndex(xs: number[], x: number): number {
  let best = 0
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i
  return best
}

function parseTitle(s: string): { text: string; muted: boolean }[][] {
  return s.split(/\n|\\n/).map((line) => {
    const out: { text: string; muted: boolean }[] = []
    line.split("*").forEach((text, i) => {
      if (text) out.push({ text, muted: i % 2 === 1 })
    })
    return out
  })
}

const D_FEATURES: InkFeatures = {
  tag: "What we serve",
  title: "Learn, practise,\nand *test yourself*",
  collaboration: {
    title: "Notice desk",
    description:
      "SSC, UPSC, railway, and bank updates gather in one desk, with dates and a path to the official notice.",
    href: "/blogs",
    linkLabel: "Read updates",
  },
  reports: {
    title: "Attempt sheets",
    description: "Each live test lays down a score sheet — timing, answers, and what to revise next.",
    href: "/test-series",
    linkLabel: "View live tests",
  },
  integrations: {
    title: "Exam streams",
    description: "Move between SSC, UPSC, railway, and banking preparation without starting from scratch.",
    tools: ["SSC", "UPSC", "RRB", "IBPS"],
    href: "/blogs",
    linkLabel: "Browse streams",
  },
  insights: {
    title: "Practice trend",
    description:
      "Scrub this sample twelve-week line. Weeks before the dashed mark are logged. After it, the line is only a forecast.",
    values: [46, 48, 47, 51, 50, 54, 53, 58, 57, 61, 64, 68],
    forecastFrom: 8,
    href: "/test-series",
    linkLabel: "Explore quizzes",
  },
}

const FLOW_CAPTION = "Notices collect here, then print as attempt sheets"

// Rounded once so server and browser trig agree during hydration.
const RAYS = [-62, -38, -14, 14, 38, 62].map((angle) => {
  const at = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    return (320 + Math.sin(rad) * 260).toFixed(1) + "," + (110 - Math.cos(rad) * 260).toFixed(1)
  }
  return "M320,110 L" + at(angle) + " L" + at(angle + 7) + "Z"
})

export default function InkOrbitFeatures({
  theme = "auto",
  brand = "GovtPariksha",
  chip,
  tag = D_FEATURES.tag,
  title = D_FEATURES.title,
  collaboration,
  reports,
  integrations,
  insights,
  className = "",
  style,
}: InkOrbitFeaturesProps) {
  const uid = "ib" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const F: InkFeatures = {
    tag,
    title,
    collaboration: { ...D_FEATURES.collaboration, ...collaboration },
    reports: { ...D_FEATURES.reports, ...reports },
    integrations: { ...D_FEATURES.integrations, ...integrations },
    insights: { ...D_FEATURES.insights, ...insights },
  }
  const chipText = (chip || brand.split(/\s+/)[0] || "GP").toUpperCase()

  const [dark, setDark] = React.useState(theme === "dark")
  const [allowMotion, setAllowMotion] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setDark(theme === "dark")
      setAllowMotion(false)
      return
    }
    const scheme = window.matchMedia("(prefers-color-scheme: dark)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setDark(theme === "auto" ? scheme.matches : theme === "dark")
      setAllowMotion(!motion.matches)
    }
    sync()
    scheme.addEventListener?.("change", sync)
    motion.addEventListener?.("change", sync)
    return () => {
      scheme.removeEventListener?.("change", sync)
      motion.removeEventListener?.("change", sync)
    }
  }, [theme])

  const [featRef, featIn] = useInView<HTMLDivElement>(0.12)

  return (
    <div
      className={"ib-root " + className}
      data-theme={dark ? "dark" : "light"}
      data-motion={allowMotion ? "1" : "0"}
      style={style}
    >
      <style>{IB_CSS}</style>
      <div className="ib-shell">
        <section className="ib-sec" aria-labelledby={uid + "feat"}>
          <div className="ib-reveal" ref={featRef} data-in={featIn ? "true" : "false"}>
            <div className="ib-head">
              {F.tag ? <p className="ib-tag">{F.tag}</p> : null}
              <Title text={F.title} id={uid + "feat"} />
            </div>
            <div className="ib-bento">
              <FlowCard
                brand={brand}
                chip={chipText}
                features={F}
                uid={uid}
                allowMotion={allowMotion}
                inView={featIn}
              />
              <IntegrationsCard copy={F.integrations} uid={uid} allowMotion={allowMotion} inView={featIn} />
              <InsightsCard copy={F.insights} uid={uid} allowMotion={allowMotion} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = React.useRef<T>(null)
  const [inView, setInView] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver !== "function") {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, threshold])
  return [ref, inView] as const
}

function Brackets() {
  return (
    <>
      <span className="ib-c ib-c-tl" aria-hidden="true" />
      <span className="ib-c ib-c-tr" aria-hidden="true" />
      <span className="ib-c ib-c-bl" aria-hidden="true" />
      <span className="ib-c ib-c-br" aria-hidden="true" />
    </>
  )
}

function Title({
  text,
  className = "ib-h2",
  id,
}: {
  text: string
  className?: string
  id?: string
}) {
  return (
    <h2 className={className} id={id}>
      {parseTitle(text).map((line, i) => (
        <span key={i}>
          {line.map((run, j) =>
            run.muted ? (
              <span key={j} className="ib-muted">
                {run.text}
              </span>
            ) : (
              <React.Fragment key={j}>{run.text}</React.Fragment>
            ),
          )}
        </span>
      ))}
    </h2>
  )
}

function Mark({ size = 16, uid }: { size?: number; uid: string }) {
  const grad = uid + "mk"
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF7A00" />
          <stop offset="1" stopColor="#B83200" />
        </linearGradient>
      </defs>
      <path d="M12 2.2 3.2 7.4 12 12.4 20.8 7.4Z" fill={"url(#" + grad + ")"} />
      <path d="M6.4 9.2 12 12.5 17.6 9.2 16.4 11.1c-2.1-.9-6.7-.9-8.8 0Z" fill="#8F2800" />
      <path d="M5.4 10.2c-2.2 2.4-1.9 6.6.7 8.6-1.9-2.2-2.1-5.8.1-7.8Z" fill="#FF6A00" />
    </svg>
  )
}

function CopyBlock({ copy }: { copy: InkFeatureCopy }) {
  const body = (
    <>
      <h3>{copy.title}</h3>
      <p>{copy.description}</p>
      {copy.href ? (
        <span className="ib-go">
          {copy.linkLabel || "Open"} <span aria-hidden="true">→</span>
        </span>
      ) : null}
    </>
  )
  if (!copy.href) return <div className="ib-copy">{body}</div>
  return (
    <a className="ib-copy" href={copy.href}>
      {body}
    </a>
  )
}

function ToolGlyph({ index }: { index: number }) {
  const k = index % 4
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {k === 0 && (
        <>
          <path d="M-4.2 -6.2h5.2l2.6 2.6v8.2h-7.8z" />
          <path d="M-2.2 -1.2h4.2M-2.2 1.6h4.2" />
        </>
      )}
      {k === 1 && (
        <>
          <path d="M-6 -6.2h12v9.2h-12z" />
          <path d="M-6 -2.4h12M-2.2 -6.2v3.8" />
        </>
      )}
      {k === 2 && (
        <>
          <path d="M-7 3.2h14" />
          <path d="M-5.2 3.2V-1.2h10.4v4.4" />
          <path d="M-3.2 -1.2V-4.2h6.4v3" />
        </>
      )}
      {k === 3 && (
        <>
          <rect x="-6.2" y="-5.2" width="12.4" height="9.2" rx="1.4" />
          <path d="M-3.4 4v2.2h6.8V4" />
        </>
      )}
    </g>
  )
}

const UPDATES = [
  { x: 58, y: 40, code: "SSC", name: "SSC · CGL notice", live: true },
  { x: 112, y: 24, code: "UPSC", name: "UPSC · prelims date", live: true },
  { x: 158, y: 42, code: "RRB", name: "RRB · vacancy update", live: true },
  { x: 46, y: 98, code: "IBPS", name: "IBPS · exam calendar", live: true },
  { x: 152, y: 114, code: "PSC", name: "State PSC · syllabus", live: false },
]

function FlowCard({
  brand,
  chip,
  features,
  uid,
  allowMotion,
  inView,
}: {
  brand: string
  chip: string
  features: InkFeatures
  uid: string
  allowMotion: boolean
  inView: boolean
}) {
  const [sheets, setSheets] = React.useState(24)
  const [side, setSide] = React.useState<"" | "left" | "right">("")
  const [caption, setCaption] = React.useState(FLOW_CAPTION)
  React.useEffect(() => {
    if (!allowMotion || !inView) return
    const timer = setInterval(() => setSheets((n) => n + 1), 2800)
    return () => clearInterval(timer)
  }, [allowMotion, inView])

  const L1 = "M117,67 C196,67 210,100 262,100"
  const L2 = "M117,73 C186,73 206,120 262,120"
  const R1 = "M378,100 C412,100 418,86 450,86"
  const R2 = "M378,120 C412,120 418,134 450,134"
  const chipLong = chip.length > 7
  const rays = uid + "rays"
  const glow = uid + "glow"

  return (
    <div className="ib-frame ib-frame-hover ib-wide">
      <Brackets />
      <div className="ib-card ib-card-flush">
        <svg
          className="ib-diagram"
          viewBox="0 0 640 178"
          role="group"
          aria-label={"Notices flow through " + brand + " into attempt sheets"}
        >
          <defs>
            <radialGradient id={glow} cx="320" cy="110" r="190" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--ib-raise)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--ib-raise)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={rays} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ib-accent)" stopOpacity=".28" />
              <stop offset="1" stopColor="var(--ib-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="640" height="178" fill={"url(#" + glow + ")"} />
          {RAYS.map((d, i) => (
            <path key={i} d={d} fill={"url(#" + rays + ")"} opacity=".7" />
          ))}

          <g
            onMouseEnter={() => setSide("left")}
            onMouseLeave={() => {
              setSide("")
              setCaption(FLOW_CAPTION)
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setSide("")
                setCaption(FLOW_CAPTION)
              }
            }}
          >
            <rect x="20" y="8" width="176" height="132" fill="transparent" />
            {UPDATES.map((item) => (
              <line
                key={"l" + item.code}
                x1={item.x}
                y1={item.y}
                x2="104"
                y2="70"
                stroke="var(--ib-line-strong)"
                strokeDasharray="2 3"
              />
            ))}
            <g transform="translate(91,57)">
              <rect width="26" height="26" rx="6" className="ib-node" />
              <g transform="translate(5,5)">
                <Mark size={16} uid={uid + "desk"} />
              </g>
            </g>
            {UPDATES.map((item, i) => (
              <g
                key={item.code}
                className="ib-exam"
                tabIndex={0}
                role="img"
                aria-label={item.name + (item.live ? ", active" : ", quiet")}
                onMouseEnter={() => {
                  setSide("left")
                  setCaption(item.name)
                }}
                onFocus={() => {
                  setSide("left")
                  setCaption(item.name)
                }}
              >
                <rect x={item.x - 22} y={item.y - 22} width="44" height="44" fill="transparent" />
                <rect x={item.x - 18} y={item.y - 10} width="36" height="20" rx="5" className="ib-node" />
                <text
                  x={item.x}
                  y={item.y + 3.5}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="600"
                  fill="var(--ib-ink)"
                  fontFamily="var(--ib-sans)"
                >
                  {item.code}
                </text>
                <circle
                  cx={item.x + 16}
                  cy={item.y + 8}
                  r="2.6"
                  fill={item.live ? "var(--ib-accent)" : "var(--ib-faint)"}
                  stroke="var(--ib-paper)"
                  className={item.live ? "ib-presence" : undefined}
                />
              </g>
            ))}
          </g>

          {[L1, L2].map((d, i) => (
            <path key={d} d={d} className={"ib-flow" + (side === "left" ? " ib-flow-on" : "") + (i ? " ib-dash" : "")} />
          ))}
          {[R1, R2].map((d, i) => (
            <path key={d} d={d} className={"ib-flow" + (side === "right" ? " ib-flow-on" : "") + (i ? " ib-dash" : "")} />
          ))}
          {allowMotion && inView &&
            [L1, L2, R1, R2].map((d, i) => (
              <circle key={"p" + i} r="2.2" className="ib-pkt">
                <animateMotion dur={2.2 + (i % 2) * 0.6 + "s"} begin={i * 0.35 + "s"} repeatCount="indefinite" path={d} />
              </circle>
            ))}

          <g transform="translate(262,88)">
            <rect x="-4" y="-4" width="124" height="52" rx="10" fill="none" stroke="var(--ib-line)" className={allowMotion ? "ib-glow" : undefined} />
            <rect width="116" height="44" rx="8" className="ib-node" />
            <g transform="translate(12,14)">
              <Mark size={16} uid={uid + "hub"} />
            </g>
            <text
              x="34"
              y="26"
              fontSize="8.5"
              letterSpacing="1.2"
              fontWeight="600"
              fill="var(--ib-soft)"
              fontFamily="var(--ib-sans)"
              textLength={chipLong ? 58 : undefined}
              lengthAdjust={chipLong ? "spacingAndGlyphs" : undefined}
            >
              {chip}
            </text>
            <path d="M100 18l4 4-4 4" fill="none" stroke="var(--ib-muted)" strokeWidth="1.3" />
          </g>

          <g
            onMouseEnter={() => {
              setSide("right")
              setCaption("Attempt sheet " + sheets + " is printing")
            }}
            onMouseLeave={() => {
              setSide("")
              setCaption(FLOW_CAPTION)
            }}
            onFocus={() => {
              setSide("right")
              setCaption("Attempt sheet " + sheets + " is printing")
            }}
            onBlur={() => {
              setSide("")
              setCaption(FLOW_CAPTION)
            }}
          >
            <rect x="448" y="20" width="180" height="140" fill="transparent" />
            {[2, 1, 0].map((k) => (
              <g key={sheets - k} transform={"translate(" + (450 + k * 12) + "," + (40 - k * 10) + ")"} opacity={1 - k * 0.22}>
                <g className={"ib-sheet" + (k === 0 ? " ib-sheet-new" : "")}>
                  <rect width="138" height="102" rx="4" fill="var(--ib-raise)" stroke="var(--ib-line-strong)" />
                  {k === 0 && (
                    <>
                      <text x="10" y="16" fontSize="7" fill="var(--ib-muted)" fontFamily="var(--ib-mono)">
                        {"SHEET " + sheets}
                      </text>
                      <rect x="10" y="24" width="64" height="5" rx="1" fill="var(--ib-ink)" opacity=".8" />
                      <rect x="10" y="33" width="92" height="3" rx="1" fill="var(--ib-line-strong)" />
                      <rect x="10" y="39" width="80" height="3" rx="1" fill="var(--ib-line-strong)" />
                      {[18, 26, 14, 30, 22, 34].map((h, j) => (
                        <rect key={j} x={12 + j * 13} y={92 - h} width="8" height={h} fill="var(--ib-accent)" opacity={0.28 + j * 0.1} />
                      ))}
                      <path d="M92 64h34M92 72h28M92 80h32" stroke="var(--ib-line-strong)" strokeWidth="2.5" />
                    </>
                  )}
                </g>
              </g>
            ))}
          </g>
        </svg>
        <p className="ib-caption" aria-hidden="true">
          {caption}
        </p>
        <div className="ib-wide-copy">
          <CopyBlock copy={features.collaboration} />
          <CopyBlock copy={features.reports} />
        </div>
      </div>
    </div>
  )
}

function IntegrationsCard({
  copy,
  uid,
  allowMotion,
  inView,
}: {
  copy: InkFeatures["integrations"]
  uid: string
  allowMotion: boolean
  inView: boolean
}) {
  const [hover, setHover] = React.useState(-1)
  const [auto, setAuto] = React.useState(0)
  const tools = copy.tools.slice(0, 4)
  React.useEffect(() => {
    if (!allowMotion || !inView || hover >= 0) return
    const timer = setInterval(() => setAuto((a) => (a + 1) % Math.max(tools.length, 1)), 1700)
    return () => clearInterval(timer)
  }, [allowMotion, inView, hover, tools.length])
  const on = hover >= 0 ? hover : allowMotion ? auto : -1
  const tiles = [
    { x: 66, y: 34 },
    { x: 66, y: 112 },
    { x: 234, y: 34 },
    { x: 234, y: 112 },
  ]
  const path = (i: number) => {
    const tile = tiles[i]
    const dir = tile.x < 150 ? -1 : 1
    return "M" + (150 + dir * 17) + ",72 H" + (150 + dir * 42) + " V" + tile.y + " H" + (tile.x - dir * 16)
  }
  const activeName = on >= 0 ? tools[on] || "Stream" : ""

  return (
    <div className="ib-frame ib-frame-hover">
      <Brackets />
      <div className="ib-card">
        <svg className="ib-diagram" viewBox="0 0 300 148" role="group" aria-label="Exam streams">
          {tiles.map((_, i) => (
            <path key={i} d={path(i)} className={"ib-flow" + (on === i ? " ib-flow-on" : "")} />
          ))}
          {allowMotion && on >= 0 && (
            <circle key={on} r="2.2" className="ib-pkt">
              <animateMotion dur="1.1s" repeatCount="indefinite" path={path(on)} />
            </circle>
          )}
          <g transform="translate(133,55)">
            <rect width="34" height="34" rx="8" className="ib-node" />
            <g transform="translate(8,8)">
              <Mark size={18} uid={uid + "int"} />
            </g>
          </g>
          {tiles.map((tile, i) => (
            <g
              key={i}
              className={"ib-tool" + (on === i ? " ib-tool-on" : "")}
              tabIndex={0}
              role="img"
              aria-label={tools[i] || "Exam stream"}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(-1)}
            >
              <rect x={tile.x - 22} y={tile.y - 22} width="44" height="44" fill="transparent" />
              <rect x={tile.x - 15} y={tile.y - 15} width="30" height="30" rx="7" className="ib-node" />
              <g transform={"translate(" + tile.x + "," + tile.y + ")"} style={{ color: "var(--ib-ink)" }}>
                <ToolGlyph index={i} />
              </g>
            </g>
          ))}
        </svg>
        <p className="ib-caption" aria-hidden="true">
          {activeName ? "In view · " + activeName : tools.length + " streams"}
        </p>
        <CopyBlock copy={copy} />
      </div>
    </div>
  )
}

function InsightsCard({
  copy,
  uid,
  allowMotion,
}: {
  copy: InkFeatures["insights"]
  uid: string
  allowMotion: boolean
}) {
  const [ref, inView] = useInView<HTMLDivElement>(0.3)
  const [hover, setHover] = React.useState(-1)
  const W = 300
  const H = 128
  const vals = copy.values.length > 1 ? copy.values : [1, 2]
  const { line, area, points } = chartPaths(vals, W, H, 16)
  const split = clamp(copy.forecastFrom, 1, vals.length - 1)
  const fill = uid + "area"
  const last = points[points.length - 1]
  const i = hover >= 0 ? hover : points.length - 1
  const p = points[i]
  const pct = Math.round(((vals[i] - vals[0]) / (vals[0] || 1)) * 100)
  const valueText =
    (i >= split ? "Forecast week " : "Week ") +
    (i + 1) +
    ", " +
    vals[i] +
    " on the sample line, " +
    (pct >= 0 ? "+" : "") +
    pct +
    " percent from week 1"

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width) return
    setHover(nearestIndex(points.map((q) => q[0]), ((event.clientX - rect.left) / rect.width) * W))
  }

  return (
    <div className="ib-frame ib-frame-hover" ref={ref} data-in={inView ? "true" : "false"}>
      <Brackets />
      <div className="ib-card">
        <svg
          className="ib-diagram ib-chart"
          viewBox={"0 0 " + W + " " + (H + 8)}
          tabIndex={0}
          role="slider"
          aria-label={copy.title + ". Left and right arrows move along the sample line."}
          aria-valuemin={1}
          aria-valuemax={vals.length}
          aria-valuenow={i + 1}
          aria-valuetext={valueText}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(-1)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
            event.preventDefault()
            const current = hover >= 0 ? hover : points.length - 1
            setHover(clamp(current + (event.key === "ArrowRight" ? 1 : -1), 0, points.length - 1))
          }}
        >
          <defs>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ib-accent)" stopOpacity=".22" />
              <stop offset="1" stopColor="var(--ib-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="16" x2={W - 16} y1={H * g} y2={H * g} stroke="var(--ib-line)" />
          ))}
          <path d={area} fill={"url(#" + fill + ")"} />
          <path d={line} fill="none" stroke="var(--ib-ink)" strokeWidth="1.6" pathLength={1} className="ib-line-draw" />
          <line
            x1={points[split][0]}
            x2={points[split][0]}
            y1="12"
            y2={H - 16}
            stroke="var(--ib-accent)"
            strokeDasharray="2 3"
            opacity=".7"
          />
          <text
            x={points[split][0] - 4}
            y="20"
            textAnchor="end"
            fontSize="7"
            fill="var(--ib-accent)"
            fontFamily="var(--ib-sans)"
            fontWeight="600"
          >
            FORECAST
          </text>
          {hover >= 0 && <line x1={p[0]} x2={p[0]} y1="10" y2={H - 14} stroke="var(--ib-ink)" strokeOpacity=".28" />}
          {allowMotion && hover < 0 && (
            <circle cx={last[0]} cy={last[1]} r="7" fill="var(--ib-accent)" opacity=".18" className="ib-glow" />
          )}
          <circle cx={p[0]} cy={p[1]} r="3.4" fill="var(--ib-raise)" stroke="var(--ib-accent)" strokeWidth="1.6" />
          <g transform={"translate(" + clamp(p[0], 48, W - 48) + "," + (p[1] < 36 ? p[1] + 22 : p[1] - 14) + ")"}>
            <rect x="-40" y="-11" width="80" height="16" rx="3" fill="var(--ib-inv)" />
            <text x="0" y="1" textAnchor="middle" fontSize="7.5" fill="var(--ib-inv-ink)" fontFamily="var(--ib-mono)">
              {(i >= split ? "forecast " : "wk " + (i + 1) + " ") + vals[i] + " · " + (pct >= 0 ? "+" : "") + pct + "%"}
            </text>
          </g>
        </svg>
        <CopyBlock copy={copy} />
      </div>
    </div>
  )
}

const IB_CSS = `
.ib-root{
  --ib-page:#fff8f1;
  --ib-hatch:rgba(255,77,0,.055);
  --ib-paper:#fffaf1;
  --ib-card:#fff6ee;
  --ib-raise:#ffffff;
  --ib-ink:#191613;
  --ib-soft:#514a44;
  --ib-muted:#675f58;
  --ib-faint:#9a9086;
  --ib-line:rgba(25,22,19,.12);
  --ib-line-strong:rgba(25,22,19,.22);
  --ib-bracket:rgba(255,77,0,.72);
  --ib-accent:#ff4d00;
  --ib-inv:#191613;
  --ib-inv-ink:#fff8f1;
  --ib-shadow:0 1px 2px rgba(25,22,19,.05),0 16px 32px -20px rgba(25,22,19,.28);
  --ib-sans:"Geist","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  --ib-serif:"EB Garamond",Georgia,"Times New Roman",serif;
  --ib-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;
  position:relative;
  width:100%;
  overflow-x:clip;
  box-sizing:border-box;
  background-color:var(--ib-page);
  background-image:repeating-linear-gradient(135deg,var(--ib-hatch) 0 1px,transparent 1px 11px);
  color:var(--ib-ink);
  font-family:var(--ib-sans);
  font-size:15px;
  line-height:1.5;
  -webkit-font-smoothing:antialiased;
  padding:clamp(56px,8vw,96px) clamp(16px,4vw,40px);
}
.ib-root[data-theme="dark"]{
  --ib-page:#100e0c;
  --ib-hatch:rgba(255,77,0,.08);
  --ib-paper:#171412;
  --ib-card:#211c18;
  --ib-raise:#2a241f;
  --ib-ink:#f6f1ea;
  --ib-soft:#d9cfc4;
  --ib-muted:#b7aea4;
  --ib-faint:#8a8178;
  --ib-line:rgba(246,241,234,.12);
  --ib-line-strong:rgba(246,241,234,.24);
  --ib-bracket:rgba(255,122,0,.8);
  --ib-inv:#fff8f1;
  --ib-inv-ink:#191613;
  --ib-shadow:0 1px 2px rgba(0,0,0,.4),0 18px 36px -18px rgba(0,0,0,.7);
}
.ib-root :where(*){box-sizing:border-box}
.ib-root :focus-visible{outline:2px solid var(--ib-accent);outline-offset:3px}
.ib-root :where(svg){display:block;max-width:100%;flex:none}
.ib-root :where(h2,h3,p){margin:0;padding:0}
.ib-shell{width:100%;max-width:1120px;margin:0 auto;container-type:inline-size}
.ib-sec{position:relative;background:var(--ib-paper);border:1px solid var(--ib-line);padding:clamp(32px,6cqw,64px) clamp(16px,4cqw,40px)}
.ib-reveal{transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.ib-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;margin-bottom:clamp(28px,4.5cqw,48px)}
.ib-tag{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--ib-accent)}
.ib-h2{font-family:var(--ib-serif);font-size:clamp(32px,4.6cqw,48px);line-height:1.08;letter-spacing:-.02em;font-weight:400;text-wrap:balance}
.ib-h2>span{display:block}
.ib-muted{color:var(--ib-muted)}
.ib-frame{position:relative;display:flex;flex-direction:column;min-width:0}
.ib-c{position:absolute;width:12px;height:12px;border-color:var(--ib-bracket);border-style:solid;border-width:0;pointer-events:none;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1)}
.ib-c-tl{top:-6px;left:-6px;border-top-width:1.5px;border-left-width:1.5px}
.ib-c-tr{top:-6px;right:-6px;border-top-width:1.5px;border-right-width:1.5px}
.ib-c-bl{bottom:-6px;left:-6px;border-bottom-width:1.5px;border-left-width:1.5px}
.ib-c-br{bottom:-6px;right:-6px;border-bottom-width:1.5px;border-right-width:1.5px}
.ib-frame-hover:hover>.ib-c,.ib-frame-hover:focus-within>.ib-c{border-color:var(--ib-accent)}
.ib-frame-hover:hover>.ib-c-tl,.ib-frame-hover:focus-within>.ib-c-tl{transform:translate(-3px,-3px)}
.ib-frame-hover:hover>.ib-c-tr,.ib-frame-hover:focus-within>.ib-c-tr{transform:translate(3px,-3px)}
.ib-frame-hover:hover>.ib-c-bl,.ib-frame-hover:focus-within>.ib-c-bl{transform:translate(-3px,3px)}
.ib-frame-hover:hover>.ib-c-br,.ib-frame-hover:focus-within>.ib-c-br{transform:translate(3px,3px)}
.ib-bento{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(22px,3cqw,28px)}
@container (min-width:760px){
  .ib-bento{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ib-wide{grid-column:1 / -1}
}
.ib-card{
  background:linear-gradient(180deg,var(--ib-raise),var(--ib-card));
  border:1px solid var(--ib-line);
  padding:clamp(14px,2cqw,20px);
  display:flex;
  flex-direction:column;
  gap:12px;
  min-width:0;
  flex:1;
  transition:border-color .25s,box-shadow .3s;
}
.ib-card-flush{padding:8px 0 8px;overflow:hidden}
.ib-card:hover,.ib-frame:focus-within>.ib-card{border-color:var(--ib-line-strong);box-shadow:var(--ib-shadow)}
.ib-card h3{font-family:var(--ib-serif);font-size:22px;font-weight:500;letter-spacing:-.015em;line-height:1.15}
.ib-card p{font-size:13px;line-height:1.55;color:var(--ib-muted);max-width:46ch}
.ib-diagram{width:100%;height:auto;overflow:visible}
.ib-caption{
  min-height:2.5em;
  padding:0 16px;
  text-align:center;
  font-size:12px;
  line-height:1.45;
  color:var(--ib-soft);
}
.ib-wide-copy{display:grid;grid-template-columns:1fr;gap:8px;padding:4px 12px 12px}
@container (min-width:640px){.ib-wide-copy{grid-template-columns:1fr 1fr;gap:12px;padding:4px 16px 16px}}
.ib-copy{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  gap:6px;
  min-height:44px;
  padding:10px 12px;
  border-radius:10px;
  color:inherit;
  text-decoration:none;
}
a.ib-copy{cursor:pointer}
a.ib-copy:hover h3{color:var(--ib-accent)}
.ib-go{font-size:12px;font-weight:600;color:var(--ib-accent)}
a.ib-copy:hover .ib-go{color:#d94100}
.ib-flow{stroke:var(--ib-line-strong);fill:none;stroke-width:1.25;transition:stroke .25s}
.ib-flow-on{stroke:var(--ib-accent)}
.ib-dash{stroke-dasharray:3 4;animation:ib-dash 1.2s linear infinite}
.ib-pkt{fill:var(--ib-accent)}
.ib-node{fill:var(--ib-raise);stroke:var(--ib-line-strong);transition:stroke .25s}
.ib-exam{cursor:pointer;transition:transform .3s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.ib-exam:hover,.ib-exam:focus-visible{transform:translateY(-1px)}
.ib-presence{animation:ib-pulse 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.ib-sheet{transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s}
.ib-sheet-new{animation:ib-sheet-in .7s cubic-bezier(.2,.8,.2,1) both}
.ib-tool{cursor:pointer;transition:transform .3s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.ib-tool:hover,.ib-tool:focus-visible,.ib-tool-on{transform:translateY(-2px)}
.ib-tool-on rect.ib-node{stroke:var(--ib-accent)}
.ib-chart{cursor:crosshair;touch-action:pan-y}
.ib-line-draw{stroke-dasharray:1;stroke-dashoffset:0}
.ib-root[data-motion="1"] .ib-line-draw{stroke-dashoffset:1;transition:stroke-dashoffset 1.6s cubic-bezier(.4,.1,.2,1)}
.ib-root[data-motion="1"] [data-in="true"] .ib-line-draw{stroke-dashoffset:0}
.ib-glow{animation:ib-pulse 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes ib-dash{to{stroke-dashoffset:-14}}
@keyframes ib-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.35)}}
@keyframes ib-sheet-in{from{opacity:0;transform:translate(14px,-10px) rotate(3deg)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){
  .ib-reveal{opacity:1;transform:none;transition:none}
  .ib-dash,.ib-presence,.ib-glow,.ib-sheet-new{animation:none}
  .ib-line-draw{transition:none;stroke-dashoffset:0}
  .ib-exam,.ib-tool,.ib-c{transition:none}
}
@media (max-width:719px){
  .ib-card h3{font-size:20px}
  .ib-wide-copy{padding-inline:8px}
}
`
