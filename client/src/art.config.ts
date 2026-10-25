// Real images used across the site, served from client/public/art/.
// Crests: from the clubs' Wikipedia pages (trademarks of the clubs, used for identification).
// Photos: freely licensed via Wikimedia Commons; credits live in server/data/match.json (playersToWatch)
// and are shown in the footer. Clear a value to fall back to the drawn artwork in Players.tsx.
// The middle player of each trio is shown in front.
export const ART = {
  homeBadge: '/art/barcelona.svg',
  awayBadge: '/art/real-madrid.svg',
  homePlayers: ['/art/pedri.jpg', '/art/lamine-yamal.jpg', '/art/raphinha.jpg'],
  awayPlayers: ['/art/valverde.jpg', '/art/mbappe.jpg', '/art/bellingham.jpg'],
};
