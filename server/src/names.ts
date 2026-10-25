// Name cleaning and a deliberately small profanity filter (EN / ES / CA / FR / IT).
const BANNED = [
  'fuck', 'shit', 'cunt', 'bitch', 'nigg', 'fagot', 'faggot', 'whore', 'slut', 'retard', 'nazi', 'hitler',
  'puta', 'puto', 'mierda', 'gilipoll', 'cabron', 'maricon', 'joder', 'hijoputa', 'hijodeputa', 'pendej',
  'collons', 'merde', 'putain', 'encule', 'cazzo', 'stronzo',
];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[013457@$!]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z]/g, '');
}

export function isProfane(name: string) {
  const n = normalize(name);
  return BANNED.some((w) => n.includes(w));
}

export function cleanName(raw: string) {
  return raw.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
}

export function slug(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
