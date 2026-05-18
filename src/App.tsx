import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  BarChart3,
  Download,
  Github,
  RefreshCw,
  RotateCcw,
  Skull,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import {
  calculateLeaderboard,
  generateStartups,
  getSeasonalEvent,
  MAX_GRAVES_PER_GRAVEYARD,
  realStartups,
  updateStartup,
  withStartupTagline
} from "./lib/startupGenerator";
import { fetchBuzzwordBatch, fetchDomainHint, fetchEulogyIngredients, fetchOpenDataStartups } from "./lib/api";
import { buildEulogy, resurrectStartup } from "./lib/eulogy";
import { downloadTombstoneCard } from "./lib/shareCard";
import type { GraveyardMode, Startup } from "./types";

const INITIAL_COUNT = 20;
const MORE_COUNT = 12;
const REAL_LOADING_GRAVES = MAX_GRAVES_PER_GRAVEYARD;

export default function App() {
  const [generatedStartups, setGeneratedStartups] = useState<Startup[]>(() => generateStartups(INITIAL_COUNT));
  const [realCemetery, setRealCemetery] = useState<Startup[]>(realStartups);
  const [mode, setMode] = useState<GraveyardMode>("real");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eulogyIngredients, setEulogyIngredients] = useState<{
    selectedId: string;
    uselessFact: string;
    boredActivity: string;
  } | null>(null);
  const [rumbling, setRumbling] = useState(false);
  const [resurrectingId, setResurrectingId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [realDataStatus, setRealDataStatus] = useState<"idle" | "loading" | "live" | "fallback">(() =>
    import.meta.env.MODE === "test" ? "idle" : "loading"
  );
  const [realDataRefreshKey, setRealDataRefreshKey] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const soundscapeRef = useRef<Soundscape | null>(null);

  const isLoadingRealStartups = mode === "real" && realDataStatus === "loading";
  const currentStartups = mode === "generated" ? generatedStartups : realCemetery;
  const baseStartups = currentStartups.slice(0, MAX_GRAVES_PER_GRAVEYARD);
  const visibleStartups = isLoadingRealStartups ? [] : baseStartups;
  const selectedStartup = baseStartups.find((startup) => startup.id === selectedId) ?? null;
  const leaderboard = useMemo(() => calculateLeaderboard(baseStartups), [baseStartups]);
  const seasonalEvent = useMemo(() => getSeasonalEvent(), []);
  const eulogy = useMemo(() => {
    if (!selectedStartup) {
      return null;
    }

    const ingredients =
      eulogyIngredients?.selectedId === selectedStartup.id
        ? eulogyIngredients
        : {
            uselessFact: "A landing page can outlive the company by several fiscal quarters.",
            boredActivity: "tokenize office snacks"
          };

    return buildEulogy({
      startup: selectedStartup,
      uselessFact: ingredients.uselessFact,
      boredActivity: ingredients.boredActivity
    });
  }, [eulogyIngredients, selectedStartup]);

  useEffect(() => {
    if (import.meta.env.MODE === "test") {
      return;
    }

    hydrateGeneratedStartups(setGeneratedStartups);
  }, []);

  useEffect(() => {
    if (mode !== "generated" || !sentinelRef.current || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGeneratedStartups((current) => {
            if (current.length >= MAX_GRAVES_PER_GRAVEYARD) {
              return current;
            }

            const remainingSlots = MAX_GRAVES_PER_GRAVEYARD - current.length;
            return [...current, ...generateStartups(Math.min(MORE_COUNT, remainingSlots), current.length)];
          });
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    if (!selectedStartup) {
      return;
    }

    if (selectedStartup.mode === "real" || import.meta.env.MODE === "test") {
      return;
    }

    let cancelled = false;
    fetchEulogyIngredients().then((ingredients) => {
      if (!cancelled) {
        setEulogyIngredients({ selectedId: selectedStartup.id, ...ingredients });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedStartup]);

  useEffect(() => {
    return () => stopSoundscape(soundscapeRef);
  }, []);

  useEffect(() => {
    if (mode !== "real" || import.meta.env.MODE === "test") {
      return;
    }

    let cancelled = false;

    fetchOpenDataStartups(MAX_GRAVES_PER_GRAVEYARD)
      .then((startups) => {
        if (cancelled) {
          return;
        }

        if (startups.length > 0) {
          setRealCemetery(startups);
          setRealDataStatus("live");
        } else {
          setRealCemetery(realStartups);
          setRealDataStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRealCemetery(realStartups);
          setRealDataStatus("fallback");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, realDataRefreshKey]);

  const generateNewGraveyard = () => {
    setMode("real");
    setSelectedId(null);
    setEulogyIngredients(null);
    setRealDataStatus("loading");
    setRumbling(true);
    setRealDataRefreshKey((current) => current + 1);
    window.setTimeout(() => setRumbling(false), 700);
  };

  const resurrectSelected = () => {
    if (!selectedStartup) {
      return;
    }

    const resurrected = resurrectStartup(selectedStartup);
    setResurrectingId(resurrected.id);

    if (mode === "generated") {
      setGeneratedStartups((current) => updateStartup(current, resurrected));
    } else {
      setRealCemetery((current) => updateStartup(current, resurrected));
    }

    setEulogyIngredients({
      selectedId: resurrected.id,
      uselessFact: "The tokenomics spreadsheet opened successfully once.",
      boredActivity: "form a DAO around an expired domain"
    });
    window.setTimeout(() => setResurrectingId(null), 900);
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      stopSoundscape(soundscapeRef);
      setAudioEnabled(false);
    } else {
      startSoundscape(soundscapeRef);
      setAudioEnabled(true);
    }
  };

  return (
    <main className={`app ${rumbling ? "rumbling" : ""} ${seasonalEvent?.key ?? ""}`}>
      <div className="fog fog-a" />
      <div className="fog fog-b" />
      <Crows />

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">Welcome to the cemetery of confident decks</p>
          <h1 id="page-title">Startup Name Graveyard</h1>
          <p>
            Tombstones for companies that raised money to disrupt nothing, shipped vibes, and left
            their Slack workspaces technically alive.
          </p>
        </div>

        <div className="grave-controls" aria-label="Graveyard controls">
          <button type="button" onClick={generateNewGraveyard}>
            <RefreshCw size={18} />
            Generate New Graveyard
          </button>
          <button
            type="button"
            className={mode === "real" ? "active" : ""}
            onClick={() => {
              setMode("real");
              if (realDataStatus !== "live") {
                setRealDataStatus("loading");
                setRealDataRefreshKey((current) => current + 1);
              }
              setSelectedId(null);
            }}
          >
            <Skull size={18} />
            Real Startup Graveyard
          </button>
          <button type="button" onClick={toggleAudio} aria-pressed={audioEnabled}>
            {audioEnabled ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {audioEnabled ? "Mute Soundscape" : "Enter Mystery Soundscape"}
          </button>
        </div>

        {seasonalEvent && (
          <div className="seasonal-banner">
            <strong>{seasonalEvent.label}</strong>
            <span>{seasonalEvent.banner}</span>
          </div>
        )}
      </section>

      <VCTicker startups={baseStartups} mode={mode} />

      <LeaderboardPanel leaderboard={leaderboard} startups={baseStartups} mode={mode} />

      <section className="graveyard" aria-label="Startup tombstones">
        {isLoadingRealStartups ? (
          <GraveyardSkeleton />
        ) : (
          visibleStartups.map((startup, index) => (
            <Tombstone
              key={startup.id}
              startup={startup}
              index={index}
              active={startup.id === selectedId}
              resurrecting={startup.id === resurrectingId}
              onOpen={() => setSelectedId(startup.id)}
            />
          ))
        )}
      </section>

      <div ref={sentinelRef} className="scroll-sentinel">
        {realDataMessage(realDataStatus)}
      </div>

      {selectedStartup && eulogy && (
        <EulogyDialog
          startup={selectedStartup}
          eulogy={eulogy}
          onClose={() => setSelectedId(null)}
          onResurrect={resurrectSelected}
          onShare={() => downloadTombstoneCard(selectedStartup)}
        />
      )}
      <a className="github-link" href="https://github.com/puneetdixit200" target="_blank" rel="noreferrer" aria-label="GitHub puneetdixit200">
        <Github size={18} />
        <span>puneetdixit200</span>
      </a>
    </main>
  );
}

function realDataMessage(status: "idle" | "loading" | "live" | "fallback"): string {
  if (status === "loading") {
    return "Exhuming live company data from Wikipedia and Wikidata.";
  }

  if (status === "live") {
    return "Real graves sourced from Wikipedia and Wikidata.";
  }

  if (status === "fallback") {
    return "Open data was unreachable, so the curated real cemetery is showing.";
  }

  return "Reality mode has enough casualties.";
}

function GraveyardSkeleton() {
  return (
    <div className="graveyard-loading" role="status" aria-label="Loading real startup graves">
      {Array.from({ length: REAL_LOADING_GRAVES }, (_, index) => {
        const depth = Math.min(8, Math.floor(index / 4));
        const style = {
          "--depth": depth,
          "--delay": `${(index % 12) * 60}ms`
        } as CSSProperties;

        return (
          <article
            key={index}
            className={`tombstone tombstone-skeleton depth-${depth}`}
            style={style}
            data-testid="loading-grave"
            aria-hidden="true"
          >
            <span className="skeleton-logo" />
            <span className="skeleton-line skeleton-title" />
            <span className="skeleton-line" />
            <span className="skeleton-line short" />
            <span className="skeleton-rip" />
          </article>
        );
      })}
    </div>
  );
}

function Tombstone({
  startup,
  index,
  active,
  resurrecting,
  onOpen
}: {
  startup: Startup;
  index: number;
  active: boolean;
  resurrecting: boolean;
  onOpen: () => void;
}) {
  const depth = Math.min(8, Math.floor(index / 4));
  const style = {
    "--depth": depth,
    "--delay": `${(index % 12) * 70}ms`
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`tombstone depth-${depth} ${active ? "active" : ""} ${resurrecting ? "resurrecting" : ""}`}
      style={style}
      onClick={onOpen}
      aria-label={`Open eulogy for ${startup.name}`}
    >
      <span className="logo-disc">
        <img
          src={startup.logoUrl}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      </span>
      <svg className="crack-lines" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M62 8 51 26l9 18-16 19 12 16-18 28" />
        <path d="M72 22 83 38l-7 18 14 16" />
      </svg>
      <span className="sector-chip">{startup.sector} grave</span>
      <span className="rip">RIP</span>
      <span className="startup-name">{startup.name}</span>
      <span className="tagline">{startup.tagline}</span>
      <span className="epitaph">{startup.epitaph}</span>
      <span className="domain-hint">Domain: {startup.sector} | {startup.domainHint}</span>
      {(index + 1) % 5 === 0 && <span className="lantern" aria-hidden="true" />}
    </button>
  );
}

function EulogyDialog({
  startup,
  eulogy,
  onClose,
  onResurrect,
  onShare
}: {
  startup: Startup;
  eulogy: NonNullable<ReturnType<typeof buildEulogy>>;
  onClose: () => void;
  onResurrect: () => void;
  onShare: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="eulogy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eulogy-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label="Close eulogy">
          <X size={20} />
        </button>
        <p className="modal-kicker">Filed under posthumous product strategy</p>
        <h2 id="eulogy-title">{eulogy.title}</h2>
        <p className="modal-tagline">{startup.tagline}</p>
        <div className="metric-list">
          {eulogy.metrics.map((metric) => (
            <span key={metric}>{metric}</span>
          ))}
        </div>
        <p className="cause">{eulogy.cause}</p>
        <p>{eulogy.body}</p>
        {startup.epitaph.includes("DAO") && <p className="second-death">{startup.epitaph}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onResurrect}>
            <RotateCcw size={18} />
            Resurrect
          </button>
          <button type="button" onClick={onShare}>
            <Download size={18} />
            Share Tombstone
          </button>
        </div>
      </section>
    </div>
  );
}

function LeaderboardPanel({
  leaderboard,
  startups,
  mode
}: {
  leaderboard: ReturnType<typeof calculateLeaderboard>;
  startups: Startup[];
  mode: GraveyardMode;
}) {
  if (mode === "real") {
    const sourceBackedCount = startups.filter((startup) => startup.sourceUrl || startup.wikidataId).length;
    const earliestFounded = findStartupByYear(startups, "founded", "earliest");
    const latestDied = findStartupByYear(startups, "died", "latest");

    return (
      <section className="leaderboard" aria-label="Real startup source ledger">
        <header>
          <BarChart3 size={20} />
          <h2>Open Data Ledger</h2>
        </header>
        <div className="leader-grid">
          <Metric
            title="Source-Backed Graves"
            value={`${sourceBackedCount}/${startups.length}`}
            note="Wikipedia or Wikidata records"
          />
          <Metric
            title="Earliest Founded"
            value={earliestFounded?.name ?? "Unknown"}
            note={earliestFounded ? `Founded ${earliestFounded.founded}` : "Not available from open data"}
          />
          <Metric
            title="Latest Recorded Death"
            value={latestDied?.name ?? "Unknown"}
            note={latestDied ? `Died ${latestDied.died}` : "Not available from open data"}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="leaderboard" aria-label="Graveyard leaderboard">
      <header>
        <BarChart3 size={20} />
        <h2>Graveyard Leaderboard</h2>
      </header>
      <div className="leader-grid">
        <Metric title="Most Pivots Before Death" value={leaderboard.mostPivots.name} note={`${leaderboard.mostPivots.metrics.pivotCount} pivots`} />
        <Metric
          title="Shortest Lifespan"
          value={leaderboard.shortestLifespan.name}
          note={`${leaderboard.shortestLifespan.metrics.lifespanHours} hours of impact theater`}
        />
        <Metric
          title="Most Buzzwords"
          value={leaderboard.mostBuzzwords.name}
          note={`${leaderboard.mostBuzzwords.metrics.buzzwordCount} terms in one sentence`}
        />
      </div>
    </section>
  );
}

function findStartupByYear(
  startups: Startup[],
  field: "founded" | "died",
  direction: "earliest" | "latest"
): Startup | null {
  const known = startups
    .map((startup) => ({ startup, year: readDisplayYear(startup[field]) }))
    .filter((item): item is { startup: Startup; year: number } => item.year !== null);

  if (known.length === 0) {
    return null;
  }

  return known.reduce((winner, item) => {
    if (direction === "earliest") {
      return item.year < winner.year ? item : winner;
    }

    return item.year > winner.year ? item : winner;
  }).startup;
}

function readDisplayYear(value: string): number | null {
  const match = /^(\d{4})$/.exec(value);
  return match ? Number(match[1]) : null;
}

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="leader-metric">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function VCTicker({ startups, mode }: { startups: Startup[]; mode: GraveyardMode }) {
  const copy =
    mode === "real"
      ? startups.slice(0, 10).map(realTickerLine).join("     ")
      : startups
          .slice(0, 10)
          .map(
            (startup) =>
              `Breaking: ${startup.name} raised $${startup.metrics.seriesA.toFixed(1)}M to disrupt ${startup.tagline
                .split(" ")
                .slice(0, 3)
                .join(" ")
                .toLowerCase()}`
          )
          .join("     ");

  return (
    <div className="ticker" aria-label="VC funding ticker">
      <div className="ticker-track">
        <span>{copy}</span>
        <span aria-hidden="true">{copy}</span>
      </div>
    </div>
  );
}

function realTickerLine(startup: Startup): string {
  const dates = [
    startup.founded !== "Unknown" ? `founded ${startup.founded}` : null,
    startup.died !== "Unknown" ? `died ${startup.died}` : null
  ].filter(Boolean);
  const source = startup.wikidataId ? `Wikidata ${startup.wikidataId}` : startup.sourceUrl ? "Wikipedia" : "curated fallback";

  return `Open data: ${startup.name} documented as defunct${dates.length ? `, ${dates.join(", ")}` : ""}; source ${source}`;
}

function Crows() {
  return (
    <div className="crow-layer" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <svg key={index} className={`crow crow-${index}`} viewBox="0 0 60 24">
          <path d="M2 15c12-14 22-14 30 0 8-14 18-14 26 0-9-6-17-6-26 2C23 9 13 9 2 15Z" />
        </svg>
      ))}
    </div>
  );
}

async function hydrateGeneratedStartups(
  setGeneratedStartups: Dispatch<SetStateAction<Startup[]>>
): Promise<void> {
  const taglines = await fetchBuzzwordBatch(INITIAL_COUNT);
  const startupsForHints: Startup[] = [];

  setGeneratedStartups((current) =>
    current.map((startup, index) => {
      const hydrated = withStartupTagline(startup, taglines[index] ?? startup.tagline);
      if (index < 8) {
        startupsForHints.push(hydrated);
      }
      return hydrated;
    })
  );

  const hints = await Promise.all(startupsForHints.map((startup) => fetchDomainHint(startup)));

  setGeneratedStartups((current) =>
    current.map((startup, index) => ({
      ...startup,
      domainHint: hints[index] ?? startup.domainHint
    }))
  );
}

interface Soundscape {
  context: AudioContext;
  nodes: AudioNode[];
  sources: AudioScheduledSourceNode[];
  timers: number[];
}

function startSoundscape(soundscapeRef: MutableRefObject<Soundscape | null>): void {
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor || soundscapeRef.current) {
    return;
  }

  const context = new AudioContextCtor();
  const master = context.createGain();
  const lowpass = context.createBiquadFilter();
  const drone = context.createOscillator();
  const undertone = context.createOscillator();
  const tremolo = context.createOscillator();
  const tremoloDepth = context.createGain();
  const wind = createNoiseLoop(context);
  const windFilter = context.createBiquadFilter();
  const windGain = context.createGain();

  master.gain.value = 0.045;
  lowpass.type = "lowpass";
  lowpass.frequency.value = 520;
  lowpass.Q.value = 1.8;
  drone.type = "sawtooth";
  drone.frequency.value = 42;
  undertone.type = "sine";
  undertone.frequency.value = 56.6;
  tremolo.type = "sine";
  tremolo.frequency.value = 0.09;
  tremoloDepth.gain.value = 0.012;
  windFilter.type = "bandpass";
  windFilter.frequency.value = 180;
  windFilter.Q.value = 0.7;
  windGain.gain.value = 0.018;

  drone.connect(lowpass);
  undertone.connect(lowpass);
  lowpass.connect(master);
  tremolo.connect(tremoloDepth);
  tremoloDepth.connect(master.gain);
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  master.connect(context.destination);

  drone.start();
  undertone.start();
  tremolo.start();
  wind.start();

  const timers = [
    window.setInterval(() => playDistantChime(context, master), 11500),
    window.setInterval(() => playLowKnock(context, master), 17300)
  ];

  soundscapeRef.current = {
    context,
    nodes: [master, lowpass, tremoloDepth, windFilter, windGain],
    sources: [drone, undertone, tremolo, wind],
    timers
  };
}

function stopSoundscape(soundscapeRef: MutableRefObject<Soundscape | null>): void {
  const soundscape = soundscapeRef.current;
  if (!soundscape) {
    return;
  }

  soundscape.timers.forEach((timer) => window.clearInterval(timer));
  soundscape.sources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // Audio sources throw if already stopped; disconnecting and closing handles cleanup.
    }
    source.disconnect();
  });
  soundscape.nodes.forEach((node) => node.disconnect());
  void soundscape.context.close();
  soundscapeRef.current = null;
}

function createNoiseLoop(context: AudioContext): AudioBufferSourceNode {
  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * 0.38;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function playDistantChime(context: AudioContext, destination: AudioNode): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(620 + Math.random() * 90, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.028, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.4);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 4.5);
}

function playLowKnock(context: AudioContext, destination: AudioNode): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(74, now);
  oscillator.frequency.exponentialRampToValueAtTime(39, now + 1.4);
  gain.gain.setValueAtTime(0.032, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + 1.5);
}
