import { playCheer, playLaugh, playRoar } from './audio';
import { bigConfetti, confetti, fx } from './fx';

export function celebrateGoal() {
  fx.goal('GOOOL!');
  bigConfetti();
  playRoar();
}

export function celebrateAwayGoal() {
  confetti({ colors: ['#ffffff', '#C9A227', '#0F1A4A'], count: 90 });
  playCheer();
}

export function madridWelcome() {
  fx.rain(['laugh', 'tissue', 'laugh'], 40);
  playLaugh();
}

export function barcaWelcome() {
  bigConfetti();
  playCheer();
}

