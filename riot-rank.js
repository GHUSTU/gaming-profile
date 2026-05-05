// api/riot-rank.js
// Uses PUUID to look up summoner, then fetches rank — no Summoner ID needed

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const key    = process.env.RIOT_API_KEY;
  const puuid  = process.env.RIOT_PUUID;
  const region = process.env.RIOT_REGION || 'na1';

  if (!key || !puuid) return res.status(400).json({ error: 'Missing RIOT_API_KEY or RIOT_PUUID' });

  try {
    // Step 1: Get summoner profile from PUUID
    const sumR = await fetch(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { 'X-Riot-Token': key } }
    );
    const summoner = await sumR.json();
    if (!summoner.id) return res.status(404).json({ error: 'Summoner not found' });

    // Step 2: Get ranked stats using internal summoner ID (auto-looked up, not stored)
    const rankR = await fetch(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
      { headers: { 'X-Riot-Token': key } }
    );
    const entries = await rankR.json();
    const solo = entries.find(e => e.queueType === 'RANKED_SOLO_5x5') || entries[0] || {};
    res.json(solo);

  } catch(e) { res.status(500).json({ error: e.message }); }
}
