import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, Dispatch, FormEvent, MutableRefObject, SetStateAction } from "react";
import {
  BarChart3,
  Download,
  RefreshCw,
  RotateCcw,
  Shovel,
  Skull,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import {
  calculateLeaderboard,
  createCustomStartup,
  generateStartups,
  getSeasonalEvent,
  realStartups,
  updateStartup,
  withStartupTagline
} from "./lib/startupGenerator";
import { fetchBuzzwordBatch, fetchDomainHint, fetchEulogyIngredients } from "./lib/api";
import { buildEulogy, resurrectStartup } from "./lib/eulogy";
import { downloadTombstoneCard } from "./lib/shareCard";
import type { GraveyardMode, Startup } from "./types";

const INITIAL_COUNT = 20;
const MORE_COUNT = 12;

export default function App() {
  const [generatedStartups, setGeneratedStartups] = useState<Startup[]>(() => generateStartups(INITIAL_COUNT));
  const [realCemetery, setRealCemetery] = useState<Startup[]>(realStartups);
  const [mode, setMode] = useState<GraveyardMode>("generated");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eulogyIngredients, setEulogyIngredients] = useState<{
    selectedId: string;
    uselessFact: string;
    boredActivity: string;
  } | null>(null);
  const [rumbling, setRumbling] = useState(false);
  const [digging, setDigging] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customTagline, setCustomTagline] = useState("");
  const [resurrectingId, setResurrectingId] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const visibleStartups = mode === "generated" ? generatedStartups : realCemetery;
  const selectedStartup = visibleStartups.find((startup) => startup.id === selectedId) ?? null;
  const leaderboard = useMemo(() => calculateLeaderboard(visibleStartups), [visibleStartups]);
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
          setGeneratedStartups((current) => [...current, ...generateStartups(MORE_COUNT, current.length)]);
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

    if (import.meta.env.MODE === "test") {
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
    return () => stopDrone(audioRef, oscillatorRef, gainRef);
  }, []);

  const generateNewGraveyard = () => {
    setMode("generated");
    setSelectedId(null);
    setRumbling(true);
    setGeneratedStartups(generateStartups(INITIAL_COUNT, Date.now() % 1000));
    window.setTimeout(() => setRumbling(false), 700);
  };

  const buryStartup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startup = createCustomStartup(customName, customTagline, generatedStartups.length + 1);
    setMode("generated");
    setGeneratedStartups((current) => [startup, ...current]);
    setCustomName("");
    setCustomTagline("");
    setDigging(false);
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
      stopDrone(audioRef, oscillatorRef, gainRef);
      setAudioEnabled(false);
    } else {
      startDrone(audioRef, oscillatorRef, gainRef);
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
              setMode(mode === "real" ? "generated" : "real");
              setSelectedId(null);
            }}
          >
            <Skull size={18} />
            Real Startup Graveyard
          </button>
          <button type="button" onClick={() => setDigging((value) => !value)} aria-expanded={digging}>
            <Shovel size={18} />
            Dig a grave
          </button>
          <button type="button" onClick={toggleAudio} aria-pressed={audioEnabled}>
            {audioEnabled ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {audioEnabled ? "Mute Drone" : "Wake Drone"}
          </button>
        </div>

        {seasonalEvent && (
          <div className="seasonal-banner">
            <strong>{seasonalEvent.label}</strong>
            <span>{seasonalEvent.banner}</span>
          </div>
        )}
      </section>

      <VCTicker startups={visibleStartups} />

      {digging && (
        <form className="dig-form" onSubmit={buryStartup}>
          <label>
            Startup name
            <input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="PitchDeckOS"
            />
          </label>
          <label>
            Fatal pitch
            <input
              value={customTagline}
              onChange={(event) => setCustomTagline(event.target.value)}
              placeholder="Investor-grade vibes for spreadsheet avoiders."
            />
          </label>
          <button type="submit">
            <Shovel size={18} />
            Bury Startup
          </button>
        </form>
      )}

      <LeaderboardPanel leaderboard={leaderboard} />

      <section className="graveyard" aria-label="Startup tombstones">
        {visibleStartups.map((startup, index) => (
          <Tombstone
            key={startup.id}
            startup={startup}
            index={index}
            active={startup.id === selectedId}
            resurrecting={startup.id === resurrectingId}
            onOpen={() => setSelectedId(startup.id)}
          />
        ))}
      </section>

      <div ref={sentinelRef} className="scroll-sentinel">
        {mode === "generated" ? "The graveyard keeps going." : "Reality mode has enough casualties."}
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
    </main>
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
      <span className="rip">RIP</span>
      <span className="startup-name">{startup.name}</span>
      <span className="tagline">{startup.tagline}</span>
      <span className="epitaph">{startup.epitaph}</span>
      <span className="domain-hint">{startup.domainHint}</span>
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

function LeaderboardPanel({ leaderboard }: { leaderboard: ReturnType<typeof calculateLeaderboard> }) {
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

function Metric({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <article className="leader-metric">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function VCTicker({ startups }: { startups: Startup[] }) {
  const copy = startups
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
      <span>{copy}</span>
      <span>{copy}</span>
    </div>
  );
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

function startDrone(
  audioRef: MutableRefObject<AudioContext | null>,
  oscillatorRef: MutableRefObject<OscillatorNode | null>,
  gainRef: MutableRefObject<GainNode | null>
): void {
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor || audioRef.current) {
    return;
  }

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const detuned = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sawtooth";
  oscillator.frequency.value = 48;
  detuned.type = "sine";
  detuned.frequency.value = 51;
  filter.type = "lowpass";
  filter.frequency.value = 420;
  gain.gain.value = 0.035;

  oscillator.connect(filter);
  detuned.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  detuned.start();

  audioRef.current = context;
  oscillatorRef.current = oscillator;
  gainRef.current = gain;
}

function stopDrone(
  audioRef: MutableRefObject<AudioContext | null>,
  oscillatorRef: MutableRefObject<OscillatorNode | null>,
  gainRef: MutableRefObject<GainNode | null>
): void {
  try {
    oscillatorRef.current?.stop();
  } catch {
    // Oscillators can only be stopped once; closing the context below is the real cleanup.
  }

  oscillatorRef.current?.disconnect();
  gainRef.current?.disconnect();
  void audioRef.current?.close();
  oscillatorRef.current = null;
  gainRef.current = null;
  audioRef.current = null;
}
