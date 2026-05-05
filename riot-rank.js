// api/riot-rank.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const key = process.env.RIOT_API_KEY;
  const id  = process.env.RIOT_SUMMONER_ID;
  const region = process.env.RIOT_REGION || 'na1';
  if (!key || !id) return res.status(400).json({ error: 'Missing env vars' });
  try {
    const r = await fetch(
      `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`,
      { headers: { 'X-Riot-Token': key } }
    );
    const data = await r.json();
    const solo = data.find(e => e.queueType === 'RANKED_SOLO_5x5') || data[0] || {};
    res.json(solo);
  } catch(e) { res.status(500).json({ error: e.message }); }
}
