import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, Dispatch, FormEvent, MutableRefObject, SetStateAction } from "react";
import {
  BarChart3,
  Download,
  Github,
  RefreshCw,
  RotateCcw,
  Search,
  Shovel,
  Skull,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import {
  calculateLeaderboard,
  createCustomStartup,
  domainGraveOptions,
  filterStartups,
  generateStartups,
  getSeasonalEvent,
  MAX_GRAVES_PER_GRAVEYARD,
  realStartups,
  updateStartup,
  withStartupTagline
} from "./lib/startupGenerator";
import { fetchBuzzwordBatch, fetchDomainHint, fetchEulogyIngredients } from "./lib/api";
import { buildEulogy, resurrectStartup } from "./lib/eulogy";
import { downloadTombstoneCard } from "./lib/shareCard";
import type { GraveyardMode, Startup, StartupSector } from "./types";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSector, setActiveSector] = useState<StartupSector | "All">("All");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const soundscapeRef = useRef<Soundscape | null>(null);

  const currentStartups = mode === "generated" ? generatedStartups : realCemetery;
  const baseStartups = currentStartups.slice(0, MAX_GRAVES_PER_GRAVEYARD);
  const visibleStartups = useMemo(
    () => filterStartups(baseStartups, { query: searchQuery, sector: activeSector }),
    [activeSector, baseStartups, searchQuery]
  );
  const selectedStartup = baseStartups.find((startup) => startup.id === selectedId) ?? null;
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
    return () => stopSoundscape(soundscapeRef);
  }, []);

  const generateNewGraveyard = () => {
    setMode("generated");
    setSelectedId(null);
    setSearchQuery("");
    setActiveSector("All");
    setRumbling(true);
    setGeneratedStartups(generateStartups(INITIAL_COUNT, Date.now() % 1000));
    window.setTimeout(() => setRumbling(false), 700);
  };

  const buryStartup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const startup = createCustomStartup(customName, customTagline, Math.min(generatedStartups.length + 1, MAX_GRAVES_PER_GRAVEYARD));
    setMode("generated");
    setSearchQuery("");
    setActiveSector("All");
    setGeneratedStartups((current) => [startup, ...current].slice(0, MAX_GRAVES_PER_GRAVEYARD));
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

      <section className="graveyard-tools" aria-label="Search and domain grave filters">
        <label className="search-field" htmlFor="graveyard-search">
          <Search size={18} />
          <span>Search the graveyard</span>
          <input
            id="graveyard-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search names, domains, sectors, causes..."
          />
        </label>
        <div className="domain-filters" aria-label="Domain-specific graves">
          <button
            type="button"
            className={activeSector === "All" ? "active" : ""}
            aria-pressed={activeSector === "All"}
            onClick={() => setActiveSector("All")}
          >
            All graves
          </button>
          {domainGraveOptions.map((sector) => (
            <button
              key={sector}
              type="button"
              className={activeSector === sector ? "active" : ""}
              aria-pressed={activeSector === sector}
              onClick={() => setActiveSector(sector)}
            >
              {sector} graves
            </button>
          ))}
        </div>
        <p className="result-count">
          {visibleStartups.length} {visibleStartups.length === 1 ? "grave" : "graves"} exhumed
        </p>
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
        {mode === "generated" ? "Maximum 20 graves exhumed per graveyard." : "Reality mode has enough casualties."}
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
      <div className="ticker-track">
        <span>{copy}</span>
        <span aria-hidden="true">{copy}</span>
      </div>
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
