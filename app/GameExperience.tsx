"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  advanceUntilChoiceOrEnd,
  chooseOption,
  createInitialLife,
  deriveSurvivalCurve,
  formatAge,
  formatMoney,
  getChoice,
  getLifeStage,
  stepYear,
  type Choice,
  type LifeEvent,
  type PersonState,
} from "@naitre/engine";
import { demoData } from "@naitre/data";
import { ArrowButton, Icon, SectionLabel, SourceBadge, StatBar } from "@naitre/ui";

const STORAGE_KEY = "naitre-france:snapshot:v1";
const LEGACY_STORAGE_KEY = "naitre-ici:snapshot:v1";

const chapterLabels: Record<ReturnType<typeof getLifeStage>, string> = {
  "petite-enfance": "Petite enfance",
  ecole: "École",
  adolescence: "Adolescence",
  "debut-de-vie": "Début de vie",
  "vie-active": "Vie active",
  retraite: "Retraite",
  "fin-de-vie": "Dernier chapitre",
};

const sceneByChapter: Record<ReturnType<typeof getLifeStage>, string> = {
  "petite-enfance": "birth",
  ecole: "school",
  adolescence: "civic",
  "debut-de-vie": "housing",
  "vie-active": "work",
  retraite: "retirement",
  "fin-de-vie": "legacy",
};

function makeSeed() {
  return `NI-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function AppHeader({ softMode, setSoftMode }: { softMode: boolean; setSoftMode: (value: boolean) => void }) {
  const pathname = usePathname();
  const links = [
    ["/jouer", "Jouer"],
    ["/explorer", "Explorer"],
    ["/methodologie", "Méthode"],
  ];
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="Naître en France, accueil">
        <img src="/kit/assets/brand/wordmark.svg" alt="Naître en France" />
      </Link>
      <nav className="main-nav" aria-label="Navigation principale">
        {links.map(([href, label]) => <Link key={href} href={href} className={pathname === href ? "is-active" : ""}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <button className="soft-toggle" type="button" onClick={() => setSoftMode(!softMode)} aria-pressed={softMode}>
          <span className="soft-toggle__dot" /> Mode doux {softMode ? "actif" : "off"}
        </button>
        <Link href="/sources" className="header-info" aria-label="Voir les sources"><Icon name="info" alt="" /></Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div><img src="/kit/assets/brand/mark.svg" alt="" className="footer-mark" /><span>Une vie parmi d'autres.</span></div>
      <nav aria-label="Informations">
        <Link href="/sources">Sources</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/accessibilite">Accessibilité</Link>
      </nav>
      <span className="footer-note">Prototype local · aucune donnée personnelle collectée</span>
    </footer>
  );
}

function Notice({ children, tone = "demo" }: { children: React.ReactNode; tone?: "demo" | "info" }) {
  return <div className={`notice notice--${tone}`} role="note"><span className="notice__mark">{tone === "demo" ? "✳" : "i"}</span><p>{children}</p></div>;
}

function SourcePanel({ event, onClose }: { event?: LifeEvent; onClose: () => void }) {
  const source = demoData.manifest.sources.find((item) => item.id === (event?.sourceId ?? "demo-synthetic")) ?? demoData.manifest.sources[0];
  return (
    <div className="source-panel" role="dialog" aria-label="Provenance des données">
      <div className="source-panel__head"><span>Provenance</span><button type="button" onClick={onClose} aria-label="Fermer">×</button></div>
      <h3>{source.label}</h3>
      <dl>
        <div><dt>Catégorie</dt><dd>{source.status === "synthetique" ? "Événement fictif / paramètre de démo" : "Fait à vérifier"}</dd></div>
        <div><dt>Champ</dt><dd>{source.field}</dd></div>
        <div><dt>Dénominateur</dt><dd>{source.denominator}</dd></div>
        <div><dt>Méthode</dt><dd>{source.method}</dd></div>
        <div><dt>Millésime</dt><dd>{source.vintage}</dd></div>
        <div><dt>Incertitude</dt><dd>{source.uncertainty}</dd></div>
        <div><dt>Identifiant d&apos;hypothèse</dt><dd>{event?.assumptionId ?? "Non renseigné"}</dd></div>
      </dl>
      <a href={source.url} target="_blank" rel="noreferrer">Ouvrir la source ↗</a>
    </div>
  );
}

function BirthLottery({ onStart }: { onStart: (seed: string) => void }) {
  const [seed, setSeed] = useState("");
  return (
    <section className="birth-lottery page-width">
      <div className="birth-lottery__copy">
        <SectionLabel tone="coral">Le tirage commence ici</SectionLabel>
        <h1>Une vie n&apos;est jamais un seul choix.</h1>
        <p className="lede">Un territoire, une famille, des ressources, des rencontres. Lancez une vie fictive et observez ce que les années font aux possibles.</p>
        <Notice>Ce prototype fonctionne avec des données entièrement synthétiques. Il ne prédit la vie de personne et ne décrit pas la France réelle.</Notice>
        <form onSubmit={(event) => { event.preventDefault(); onStart(seed.trim() || makeSeed()); }} className="lottery-form">
          <label htmlFor="seed">Graine facultative <span>(pour rejouer la même vie)</span></label>
          <div className="seed-line"><input id="seed" value={seed} onChange={(event) => setSeed(event.target.value)} placeholder="Ex. NI-2026-AUBE" /><button type="button" className="dice-button" onClick={() => setSeed(makeSeed())} aria-label="Générer une graine">↻</button></div>
          <ArrowButton type="submit">Naître en France</ArrowButton>
        </form>
      </div>
      <div className="birth-lottery__visual">
        <div className="orbit orbit--one" /><div className="orbit orbit--two" />
        <img src="/kit/assets/scenes/hero.svg" alt="Illustration abstraite d'une ville et de trajectoires" />
        <div className="birth-ticket"><span>Certificat de départ</span><strong>Une possibilité</strong><small>à explorer, pas à mériter</small></div>
      </div>
    </section>
  );
}

function Home({ state }: { state: PersonState | null }) {
  return (
    <main>
      <section className="home-hero page-width">
        <div className="home-hero__copy">
          <SectionLabel tone="gold">Simulation de vie · France · mode démo</SectionLabel>
          <h1>Naître en France<span> — une vie parmi d&apos;autres.</span></h1>
          <p>Une expérience narrative pour regarder les trajectoires avec plus de nuance : les choix comptent, les structures aussi.</p>
          <div className="hero-actions"><Link className="arrow-button arrow-button--primary" href="/jouer">{state ? "Reprendre la vie" : "Commencer une vie"}<span aria-hidden="true">↗</span></Link><Link className="text-link" href="/methodologie">Comprendre la méthode</Link></div>
          <div className="hero-meta"><span><b>29</b> scènes</span><span><b>20</b> décisions jouables</span><span><b>0</b> donnée personnelle</span></div>
        </div>
        <div className="home-hero__art">
          <img src="/kit/assets/scenes/hero.svg" alt="Ville stylisée parcourue de chemins" />
          <div className="hero-float hero-float--top"><span>01</span><strong>tirage seedé</strong><small>une naissance fictive</small></div>
          <div className="hero-float hero-float--bottom"><span>02</span><strong>année après année</strong><small>des choix, des effets différés</small></div>
        </div>
      </section>
      <section className="home-intro page-width">
        <div><SectionLabel tone="sage">Le principe</SectionLabel><h2>Voir les possibles sans raconter de fable.</h2></div>
        <p>La simulation ne classe pas les vies. Elle rend visibles des contraintes, des appuis et des bifurcations. Les chiffres sont séparés des hypothèses, et chaque événement indique ce qu&apos;il est vraiment.</p>
      </section>
      <section className="home-cards page-width">
        <article><img src="/kit/assets/icons/graph.svg" alt="" /><h3>Un moteur déterministe</h3><p>Même graine, mêmes décisions, même trajectoire avec la même version de données.</p></article>
        <article><img src="/kit/assets/icons/heart.svg" alt="" /><h3>Une voix digne</h3><p>Les événements difficiles existent sans devenir des jugements sur la valeur d&apos;une personne.</p></article>
        <article><img src="/kit/assets/icons/info.svg" alt="" /><h3>Une méthode lisible</h3><p>La provenance, le dénominateur et l&apos;incertitude restent accessibles à chaque étape.</p></article>
      </section>
      <section className="home-bottom page-width"><div className="home-bottom__quote">« Une trajectoire n&apos;est pas une promesse. C&apos;est une suite de contextes, de liens et de moments où l&apos;on compose. »</div><Link className="soft-card-link" href="/sources">Lire les sources à vérifier <span>↗</span></Link></section>
    </main>
  );
}

function BirthCertificate({ state }: { state: PersonState }) {
  return (
    <article className="birth-certificate">
      <div className="certificate-top"><span>Certificat de départ</span><span>{state.seed}</span></div>
      <div className="certificate-main"><img src="/kit/assets/brand/mark.svg" alt="" /><div><p>Une naissance fictive</p><h2>Voici une possibilité.</h2><small>Elle n&apos;est ni une prédiction, ni une récompense.</small></div></div>
      <dl className="certificate-facts">
        <div><dt>Année</dt><dd>{state.year}</dd></div><div><dt>Territoire</dt><dd>{state.territory}</dd></div><div><dt>Foyer</dt><dd>{state.household}</dd></div><div><dt>Habitat</dt><dd>{state.housing}</dd></div>
      </dl>
      <div className="certificate-foot"><span>Origine sociale — {state.socialOrigin}</span><SourceBadge /></div>
    </article>
  );
}

function SpeedControls({ speed, setSpeed, onAdvance, onAdvanceToChoice, disabled }: { speed: number; setSpeed: (speed: number) => void; onAdvance: () => void; onAdvanceToChoice: () => void; disabled: boolean }) {
  return (
    <div className="speed-controls" aria-label="Contrôles du temps">
      <button type="button" className={speed === 0 ? "speed-button is-current" : "speed-button"} onClick={() => setSpeed(0)} aria-label="Mettre en pause">Ⅱ <span>Pause</span></button>
      <button type="button" className={speed > 0 ? "speed-button is-current" : "speed-button"} onClick={() => setSpeed(speed > 0 ? 0 : 1)} aria-label={speed > 0 ? "Mettre en pause" : "Jouer"}>{speed > 0 ? "Ⅱ" : "▶"} <span>{speed > 0 ? "En cours" : "Jouer"}</span></button>
      <div className="speed-segment" role="group" aria-label="Vitesse"><button type="button" onClick={() => setSpeed(1)} className={speed === 1 ? "is-current" : ""}>1×</button><button type="button" onClick={() => setSpeed(2)} className={speed === 2 ? "is-current" : ""}>2×</button><button type="button" onClick={() => setSpeed(3)} className={speed === 3 ? "is-current" : ""}>4×</button></div>
      <button type="button" className="next-decision" onClick={onAdvanceToChoice} disabled={disabled}>Prochain choix <span>↠</span></button>
      <button type="button" className="next-year" onClick={onAdvance} disabled={disabled}>Une année <span>→</span></button>
    </div>
  );
}

function DecisionModal({ choice, onChoose, onSkip }: { choice: Choice; onChoose: (optionId: string) => void; onSkip: () => void }) {
  const [selected, setSelected] = useState(choice.options[0]?.id ?? "");
  const firstOptionRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    setSelected(choice.options[0]?.id ?? "");
    firstOptionRef.current?.focus();
  }, [choice.id, choice.options]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onSkip]);
  return (
    <div className="decision-modal" role="dialog" aria-modal="true" aria-labelledby="decision-title" aria-describedby="decision-prompt">
      <div className="decision-modal__veil" />
      <div className="decision-modal__card">
        <div className="decision-modal__kicker">À {formatAge(choice.age)}, une décision</div>
        <h2 id="decision-title">{choice.title}</h2><p id="decision-prompt">{choice.prompt}</p>
        <div className="choice-options">{choice.options.map((option, index) => <label key={option.id} className={selected === option.id ? "choice-option is-selected" : "choice-option"}><input ref={index === 0 ? firstOptionRef : undefined} type="radio" name="life-choice" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} /><span className="choice-number">{String.fromCharCode(65 + index)}</span><span className="choice-text"><strong>{option.label}</strong><small>{option.detail}</small></span><span className="choice-cost">{option.cost}</span></label>)}</div>
        <div className="decision-actions"><button type="button" className="text-link" onClick={onSkip}>Passer cette décision</button><ArrowButton onClick={() => onChoose(selected)}>Retenir ce choix</ArrowButton></div>
        <p className="decision-footnote">Les effets peuvent être progressifs. Une décision ne supprime jamais les contraintes structurelles.</p>
      </div>
    </div>
  );
}

function LifeHeader({ state }: { state: PersonState }) {
  const chapter = getLifeStage(state.age);
  return <div className="life-header"><div className="life-header__age"><span>{state.alive ? "Année en cours" : "Dernière année"}</span><strong>{formatAge(state.age)}</strong></div><div className="life-header__chapter"><span className="chapter-dot" />{chapterLabels[chapter]}<small>{state.year} · {state.territory}</small></div><div className="life-header__status"><span className={state.alive ? "alive-dot" : "dead-dot"} />{state.alive ? "La vie continue" : "La simulation est terminée"}</div></div>;
}

function LifeScreen({ state, onAdvance, onAdvanceToChoice, onChoose, onSkip, speed, setSpeed, softMode, onSource, showSource, reset }: { state: PersonState; onAdvance: () => void; onAdvanceToChoice: () => void; onChoose: (optionId: string) => void; onSkip: () => void; speed: number; setSpeed: (speed: number) => void; softMode: boolean; onSource: () => void; showSource: boolean; reset: () => void }) {
  const chapter = getLifeStage(state.age);
  const event = state.timeline.at(-1);
  const choice = getChoice(state.pendingChoiceId);
  return (
    <main className="life-page page-width">
      <LifeHeader state={state} />
      <div className="life-grid">
        <section className="life-main">
          <BirthCertificate state={state} />
          <div className="scene-card"><img src={`/kit/assets/scenes/${sceneByChapter[chapter]}.svg`} alt={`Illustration du chapitre ${chapterLabels[chapter]}`} /><div className="scene-card__caption"><span>{chapterLabels[chapter]}</span><span>{state.year}</span></div></div>
          <article className={`event-card event-card--${event?.kind ?? "ordinaire"}`}>
            <div className="event-card__top"><span>À {formatAge(state.age)}</span><button type="button" onClick={onSource}>Voir la provenance <span>↗</span></button></div>
            <h1>{event?.title}</h1>
            <p>{softMode && event?.sensitivity === "sensible" ? "Un événement sensible est masqué en mode doux. Vous pouvez poursuivre sans en lire le détail." : event?.body}</p>
            <div className="event-card__bottom"><span className="event-kind">{event?.kind === "heureux" ? "Un appui" : event?.kind === "difficile" ? "Un passage difficile" : event?.kind === "fin" ? "Fin de la simulation" : "Un moment de vie"}</span><span className="event-assumption">{event?.kind === "historique" ? "Contexte à documenter" : "Événement fictif"}</span></div>
          </article>
          {showSource ? <SourcePanel event={event} onClose={onSource} /> : null}
          <SpeedControls speed={speed} setSpeed={setSpeed} onAdvance={onAdvance} onAdvanceToChoice={onAdvanceToChoice} disabled={!state.alive || Boolean(choice)} />
          <div className="life-foot-actions"><Link href="/chronologie" className="text-link">Ouvrir la chronologie ↗</Link><button type="button" className="text-link" onClick={reset}>Recommencer une autre vie</button></div>
        </section>
        <aside className="life-side">
          <section className="side-panel side-panel--stats"><div className="panel-heading"><span>Ce qui se construit</span><img src="/kit/assets/icons/graph.svg" alt="" /></div><StatBar label="Santé" value={state.health} tone="sage" note="Un indicateur de ressources, pas un diagnostic." /><StatBar label="Épanouissement" value={state.fulfillment} tone="coral" /><StatBar label="Apprentissage" value={state.learning} tone="blue" /><StatBar label="Liens" value={state.relationships} tone="gold" /></section>
          <section className="side-panel budget-panel"><div className="panel-heading"><span>Budget du mois</span><img src="/kit/assets/icons/money.svg" alt="" /></div><div className="budget-number">{formatMoney(state.incomeMonthly)}<small>revenu simulé</small></div><div className="budget-row"><span>Tension budgétaire</span><strong>{state.budgetStress}/100</strong></div><div className="budget-line"><span style={{ width: `${Math.max(5, state.budgetStress)}%` }} /></div><div className="budget-row"><span>Dette fictive</span><strong>{formatMoney(state.debt)}</strong></div></section>
          <section className="side-panel side-panel--profile"><div className="panel-heading"><span>Autour de soi</span><img src="/kit/assets/icons/family.svg" alt="" /></div><p><strong>{state.household}</strong><br />dans {state.housing}.</p><p className="profile-note">Les catégories sont tirées pour cette démo et ne préjugent ni des capacités ni de la valeur des personnes.</p></section>
        </aside>
      </div>
      {choice ? <DecisionModal choice={choice} onChoose={onChoose} onSkip={onSkip} /> : null}
    </main>
  );
}

function SurvivalCurve({ state }: { state: PersonState | null }) {
  const points = state ? deriveSurvivalCurve(state) : Array.from({ length: 21 }, (_, age) => ({ age: age * 5, alive: true }));
  const maxAge = Math.max(20, points.at(-1)?.age ?? 20);
  const polyline = points.map((point) => `${(point.age / maxAge) * 100},${point.alive ? 18 : 78}`).join(" ");
  return <div className="survival-curve"><div className="curve-grid"><span>vivante</span><span>fin simulée</span><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Courbe de survie de la trajectoire"><polyline points={polyline} /></svg></div><div className="curve-axis"><span>0 an</span><span>{maxAge} ans</span></div><small>Risque annuel synthétique du prototype — aucune cause médicale n&apos;est attribuée.</small></div>;
}

function EndSummary({ state, onReset }: { state: PersonState; onReset: () => void }) {
  const finalAge = state.deathAge ?? state.age;
  const isFinished = !state.alive;
  const [shared, setShared] = useState(false);
  const share = async () => {
    const text = `J'ai traversé une vie fictive dans Naître en France : ${finalAge} ans, ${state.decisions.length} décisions, territoire ${state.territory}.`;
    if (navigator.share) await navigator.share({ title: "Naître en France", text });
    else { await navigator.clipboard?.writeText(text); setShared(true); }
  };
  return <main className="summary-page page-width"><div className="summary-intro"><SectionLabel tone="coral">La carte d&apos;une trajectoire</SectionLabel><h1>{isFinished ? "Cette vie s&apos;arrête ici." : "Cette vie est encore en mouvement."}</h1><p>{isFinished ? "Elle ne se résume pas à un score. Voici quelques traces laissées par les contextes et les choix." : "Le bilan est provisoire. Voici quelques traces laissées par les contextes et les choix jusqu&apos;à maintenant."}</p></div><div className="summary-grid"><div className="summary-card summary-card--dark"><img src="/kit/assets/scenes/legacy.svg" alt="Illustration de transmission" /><div className="summary-card__overlay"><span>{state.seed}</span><strong>{finalAge} ans</strong><small>{state.decisions.length} décisions · {state.timeline.length} moments</small></div></div><div className="summary-facts"><div><span>Départ</span><strong>{state.territory}</strong><small>{state.household}</small></div><div><span>{isFinished ? "Dernier chapitre" : "Chapitre en cours"}</span><strong>{chapterLabels[getLifeStage(finalAge)]}</strong><small>{state.year}</small></div><div><span>Ce qui a tenu</span><strong>{state.relationships}/100</strong><small>liens</small></div></div></div><section className="summary-analysis"><div><SectionLabel tone="blue">Une courbe, pas un verdict</SectionLabel><h2>Les années ne sont pas une ligne droite.</h2><p>La santé, les liens et le budget ont évolué ensemble. Les effets différés rendent visibles des bifurcations qui ne se voient pas tout de suite.</p><SurvivalCurve state={state} /></div><div className="summary-stats"><StatBar label="Santé finale" value={state.health} tone="sage" /><StatBar label="Épanouissement" value={state.fulfillment} tone="coral" /><StatBar label="Apprentissage" value={state.learning} tone="blue" /><StatBar label="Liens" value={state.relationships} tone="gold" /></div></section><div className="summary-actions"><ArrowButton onClick={share}>{shared ? "Carte copiée" : "Partager la carte"}</ArrowButton><Link href="/chronologie" className="arrow-button arrow-button--outline">Relire la chronologie <span>↗</span></Link><button type="button" className="text-link" onClick={onReset}>Tirer une autre vie</button></div></main>;
}

function TimelinePageContent({ state }: { state: PersonState | null }) {
  if (!state) return <EmptyState title="La chronologie attend une vie." body="Lancez une simulation pour voir ses moments s'inscrire dans le temps." />;
  return <main className="content-page page-width"><div className="content-heading"><SectionLabel tone="blue">Chronologie</SectionLabel><h1>Les années une à une.</h1><p>Chaque ligne garde la trace d&apos;un moment. Les choix apparaissent au milieu des événements ordinaires.</p></div><div className="timeline-layout"><div className="timeline-list">{state.timeline.slice().reverse().map((event, index) => <article className={`timeline-entry timeline-entry--${event.kind}`} key={`${event.id}-${event.age}-${index}`}><div className="timeline-entry__date"><strong>{event.age}</strong><span>ans</span><small>{event.year}</small></div><div className="timeline-entry__line"><span /></div><div className="timeline-entry__content"><div><span className="event-kind">{event.kind === "difficile" ? "Passage difficile" : event.kind === "heureux" ? "Appui" : event.kind === "fin" ? "Fin" : "Moment de vie"}</span><span className="timeline-chapter">{chapterLabels[event.chapter]}</span></div><h2>{event.title}</h2><p>{event.body}</p></div></article>)}</div><aside className="timeline-aside"><div className="side-panel"><div className="panel-heading"><span>En bref</span><img src="/kit/assets/icons/clock.svg" alt="" /></div><strong className="big-stat">{state.timeline.length}</strong><p>moments inscrits<br />dans cette trajectoire</p></div><div className="side-panel"><div className="panel-heading"><span>Choix retenus</span><img src="/kit/assets/icons/justice.svg" alt="" /></div><ul className="decision-list">{state.decisions.length ? state.decisions.map((decision) => <li key={decision}>{decision.split(":")[1] ?? decision}</li>) : <li>Pas encore de décision.</li>}</ul></div></aside></div></main>;
}

function Explorer({ state }: { state: PersonState | null }) {
  const total = demoData.birthDistribution.territories.reduce((sum, item) => sum + item.weight, 0);
  const targetAge = state?.age ?? 10;
  const comparisonSeeds = ["COMPARAISON-A", "COMPARAISON-B"];
  const comparisonStates = comparisonSeeds.map((seed) => simulateToAge(seed, targetAge));
  const displayedStates = state ? [state, ...comparisonStates] : comparisonStates;
  return <main className="content-page page-width"><div className="content-heading"><SectionLabel tone="gold">Explorer les paramètres</SectionLabel><h1>Ce que le tirage sait — et ce qu&apos;il ne sait pas.</h1><p>Cette page rend visibles les ressorts du prototype. Les données françaises restent à importer et valider avant toute publication.</p></div><Notice>Les pondérations ci-dessous sont fictives. Elles servent à tester l&apos;interface et le moteur, pas à estimer les naissances françaises.</Notice><div className="explorer-grid"><section className="explorer-card"><div className="panel-heading"><span>Départ territorial</span><img src="/kit/assets/icons/map.svg" alt="" /></div><p className="muted">Base actuelle : {demoData.birthDistribution.basis}</p><div className="territory-bars">{demoData.birthDistribution.territories.map((territory) => <div className="territory-row" key={territory.territory}><div><span>{territory.territory}</span><strong>{Math.round((territory.weight / total) * 100)}%</strong></div><div className="territory-track"><span style={{ width: `${(territory.weight / total) * 100}%` }} /></div></div>)}</div><small className="source-caption">Dénominateur : {demoData.birthDistribution.denominator}</small></section><section className="explorer-card"><div className="panel-heading"><span>Courbe de survie</span><img src="/kit/assets/icons/health.svg" alt="" /></div><SurvivalCurve state={state} /></section><section className="explorer-card explorer-card--wide"><div className="panel-heading"><span>Les catégories du moteur</span><img src="/kit/assets/icons/leaf.svg" alt="" /></div><div className="category-grid"><div><span className="category-dot category-dot--coral" /><strong>Fait observé</strong><p>Une donnée dont le champ, le millésime et le dénominateur sont documentés.</p></div><div><span className="category-dot category-dot--blue" /><strong>Hypothèse de modélisation</strong><p>Une règle nécessaire au moteur, décrite comme telle et calibrable.</p></div><div><span className="category-dot category-dot--sage" /><strong>Événement fictif</strong><p>Une scène narrative créée pour rendre la trajectoire lisible.</p></div></div></section><section className="explorer-card explorer-card--wide"><div className="panel-heading"><span>Comparer sans classer</span><img src="/kit/assets/icons/share.svg" alt="" /></div><p className="muted">Trois graines, une même durée de démonstration. Ce ne sont pas des profils meilleurs ou pires : seulement des possibilités différentes.</p><div className="comparison-grid">{displayedStates.map((candidate, index) => <article className={index === 0 && state ? "comparison-card is-current" : "comparison-card"} key={candidate.seed}><span>{index === 0 && state ? "Votre trajectoire" : `Graine ${String.fromCharCode(65 + index)}`}</span><strong>{candidate.territory}</strong><small>{formatAge(candidate.age)} · {candidate.decisions.length} décisions</small><div className="comparison-bars"><i style={{ width: `${candidate.health}%` }} /><i style={{ width: `${candidate.relationships}%` }} /><i style={{ width: `${candidate.learning}%` }} /></div></article>)}</div></section></div></main>;
}

function simulateToAge(seed: string, targetAge: number): PersonState {
  let simulated = createInitialLife(seed, demoData);
  while (simulated.alive && simulated.age < targetAge) {
    if (simulated.pendingChoiceId) {
      const choice = getChoice(simulated.pendingChoiceId);
      simulated = choice ? chooseOption(simulated, choice.options[0].id) : simulated;
    } else {
      simulated = stepYear(simulated);
    }
  }
  return simulated;
}

function Sources() {
  return <main className="content-page page-width"><div className="content-heading"><SectionLabel tone="coral">Sources</SectionLabel><h1>La confiance commence par les limites.</h1><p>Le prototype est volontairement honnête : les sources réelles sont listées, mais aucune n&apos;est présentée comme déjà intégrée.</p></div><Notice>Avant publication, chaque distribution devra être vérifiée : champ, année, couverture, licence, valeurs manquantes et dénominateur compatible.</Notice><div className="source-directory">{demoData.manifest.sources.map((source) => <article key={source.id} className={`source-directory__item source-directory__item--${source.status}`}><div className="source-directory__status"><span />{source.status === "synthetique" ? "Synthétique" : "À vérifier"}</div><h2>{source.label}</h2><p>{source.field}</p><dl><div><dt>Éditeur</dt><dd>{source.publisher}</dd></div><div><dt>Millésime</dt><dd>{source.vintage}</dd></div><div><dt>Dénominateur</dt><dd>{source.denominator}</dd></div><div><dt>Méthode</dt><dd>{source.method}</dd></div></dl><a href={source.url} target="_blank" rel="noreferrer">Consulter la source ↗</a></article>)}</div></main>;
}

function Methodology() {
  const steps = [["01", "Tirer", "Une graine fixe la naissance, puis le moteur pondère les territoires selon le dataset chargé."], ["02", "Faire avancer", "Chaque année applique les effets différés, calcule le risque annuel et ajoute un moment au journal."], ["03", "Choisir", "Une décision infléchit plusieurs ressources. Elle ne transforme pas une contrainte structurelle en mérite individuel."], ["04", "Relire", "La chronologie, la courbe et les sources permettent de comprendre ce qui relève du récit ou de la donnée."]];
  return <main className="content-page page-width"><div className="content-heading"><SectionLabel tone="sage">Méthodologie</SectionLabel><h1>Un jeu de simulation, pas un oracle.</h1><p>Naître en France sépare ce qui est mesuré, ce qui est modélisé et ce qui est raconté.</p></div><div className="method-flow">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</div><div className="method-columns"><section><h2>Ce que le moteur garantit</h2><ul><li>Une graine et des décisions identiques reproduisent la même vie.</li><li>Aucune génération aléatoire dans les composants React.</li><li>Le risque de mortalité est annuel, sans cause médicale inventée.</li><li>Les sauvegardes restent locales et supprimables.</li></ul></section><section><h2>Ce qui reste à faire</h2><ul><li>Importer et valider les naissances par département et année.</li><li>Conditionner la pauvreté aux familles avec enfants.</li><li>Calibrer les distributions par Monte Carlo.</li><li>Documenter les événements historiques et leurs impacts.</li></ul></section></div></main>;
}

function SimpleInfo({ kind }: { kind: "privacy" | "accessibility" }) {
  const privacy = kind === "privacy";
  return <main className="content-page narrow-page page-width"><SectionLabel tone={privacy ? "blue" : "sage"}>{privacy ? "Confidentialité" : "Accessibilité"}</SectionLabel><h1>{privacy ? "Vos traces restent sur votre appareil." : "Une expérience pensée pour être parcourue autrement."}</h1><div className="rich-copy">{privacy ? <><p>Le prototype ne demande pas de compte et n&apos;envoie pas vos décisions à un serveur. La sauvegarde utilise le stockage local de votre navigateur.</p><h2>Vous gardez la main</h2><p>Vous pouvez recommencer une vie à tout moment. Une version future ajoutera un bouton d&apos;export et de suppression explicite de la sauvegarde.</p><h2>Pas de profilage</h2><p>La simulation n&apos;infère ni opinion politique, ni religion, ni origine ethnique, ni diagnostic médical.</p></> : <><p>Les contrastes, les états de focus, les boutons clavier et les textes alternatifs sont prévus pour une utilisation avec clavier et lecteur d&apos;écran.</p><h2>Mode doux</h2><p>Activez-le dans l&apos;en-tête pour masquer le texte des événements sensibles. Le passage reste signalé, sans vous obliger à le lire.</p><h2>Mouvement réduit</h2><p>Les animations décoratives respectent <code>prefers-reduced-motion</code>. Les informations essentielles restent disponibles sans mouvement.</p></>}</div></main>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <main className="empty-state page-width"><img src="/kit/assets/icons/baby.svg" alt="" /><h1>{title}</h1><p>{body}</p><Link className="arrow-button arrow-button--primary" href="/jouer">Commencer une vie <span>↗</span></Link></main>;
}

export default function GameExperience() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<PersonState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [softMode, setSoftMode] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: PersonState };
        if (parsed.state?.version) setState(parsed.state);
      }
    } catch { /* local storage may be unavailable */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!state) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), dataVersion: demoData.manifest.version, state })); } catch { /* local storage may be unavailable */ }
  }, [state]);

  useEffect(() => {
    if (speed === 0 || !state?.alive || state.pendingChoiceId) return;
    const timer = window.setInterval(() => setState((current) => current ? stepYear(current) : current), speed === 1 ? 1800 : speed === 2 ? 950 : 500);
    return () => window.clearInterval(timer);
  }, [speed, state?.alive, state?.pendingChoiceId]);

  const start = (seed: string) => { setState(createInitialLife(seed, demoData)); setSpeed(0); setShowSource(false); router.push("/vie"); };
  const advance = () => setState((current) => current ? stepYear(current) : current);
  const advanceToChoice = () => setState((current) => current ? advanceUntilChoiceOrEnd(current) : current);
  const choose = (optionId: string) => { setState((current) => current ? chooseOption(current, optionId) : current); setSpeed(0); };
  const skip = () => setState((current) => current ? { ...current, pendingChoiceId: null, journal: [...current.journal, "Décision passée pour cette simulation."] } : current);
  const reset = () => { window.localStorage.removeItem(STORAGE_KEY); window.localStorage.removeItem(LEGACY_STORAGE_KEY); setState(null); setSpeed(0); router.push("/jouer"); };

  const content = useMemo(() => {
    if (!hydrated) return <div className="loading-state" aria-live="polite">Ouverture du carnet…</div>;
    if (pathname === "/" && !state) return <Home state={state} />;
    if (pathname === "/jouer" && !state) return <BirthLottery onStart={start} />;
    if (pathname === "/bilan") return state ? <EndSummary state={state} onReset={reset} /> : <EmptyState title="Le bilan arrive après la vie." body="Tirez une naissance pour ouvrir une trajectoire." />;
    if (pathname === "/chronologie") return <TimelinePageContent state={state} />;
    if (pathname === "/explorer") return <Explorer state={state} />;
    if (pathname === "/sources") return <Sources />;
    if (pathname === "/methodologie") return <Methodology />;
    if (pathname === "/confidentialite") return <SimpleInfo kind="privacy" />;
    if (pathname === "/accessibilite") return <SimpleInfo kind="accessibility" />;
    if (!state) return <BirthLottery onStart={start} />;
    return <LifeScreen state={state} onAdvance={advance} onAdvanceToChoice={advanceToChoice} onChoose={choose} onSkip={skip} speed={speed} setSpeed={setSpeed} softMode={softMode} onSource={() => setShowSource(!showSource)} showSource={showSource} reset={reset} />;
  }, [hydrated, pathname, state, speed, softMode, showSource]);

  return <div className={softMode ? "app-shell soft-mode" : "app-shell"}><AppHeader softMode={softMode} setSoftMode={setSoftMode} />{content}<Footer /></div>;
}
