import { lazy, Suspense, useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { FxLayer } from './components/FxLayer';
import { FanGate } from './components/FanGate';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FullTimeBanner } from './components/FullTime';
import { HeadToHead } from './components/HeadToHead';
import { Lineups } from './components/Lineups';
import { PlayersToWatch } from './components/PlayersToWatch';
import { Predictions } from './components/Predictions';
import { MatchZone } from './components/MatchZone';
import { Bingo } from './components/Bingo';
import { Ratings } from './components/Ratings';
import { Excuses } from './components/Excuses';
import { Footer } from './components/Footer';

const Admin = lazy(() => import('./admin/Admin'));

function Site() {
  const { side } = useStore();
  const [gate, setGate] = useState(side === null);

  return (
    <>
      <Header onSwitchSide={() => setGate(true)} />
      <main>
        <Hero />
        <FullTimeBanner />
        <HeadToHead />
        <PlayersToWatch />
        <Lineups />
        <Predictions />
        <MatchZone />
        <Bingo />
        <Ratings />
        <Excuses />
      </main>
      <Footer />
      {gate && <FanGate onClose={() => setGate(false)} />}
      <FxLayer />
    </>
  );
}

export default function App() {
  if (window.location.pathname.replace(/\/$/, '') === '/admin') {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    );
  }
  return (
    <StoreProvider>
      <Site />
    </StoreProvider>
  );
}
