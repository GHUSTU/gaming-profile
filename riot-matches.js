// api/riot-matches.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const key    = process.env.RIOT_API_KEY;
  const puuid  = process.env.RIOT_PUUID;
  const region = process.env.VALORANT_REGION || 'na';
  if (!key || !puuid) return res.status(400).json({ error: 'Missing env vars' });
  try {
    const listR = await fetch(
      `https://${region}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
      { headers: { 'X-Riot-Token': key } }
    );
    const list = await listR.json();
    if (!list.history?.length) return res.json([]);

    const matches = await Promise.all(list.history.slice(0,10).map(async m => {
      const mR = await fetch(
        `https://${region}.api.riotgames.com/val/match/v1/matches/${m.matchId}`,
        { headers: { 'X-Riot-Token': key } }
      );
      const md = await mR.json();
      const player = md.players?.find(p => p.puuid === puuid);
      if (!player) return null;
      const s = player.stats || {};
      const k = s.kills||0, d = s.deaths||1, a = s.assists||0;
      const hs = s.headshots||0, total = hs+(s.bodyshots||0)+(s.legshots||0);
      const won = player.teamId === md.teams?.find(t=>t.won)?.teamId;
      // Score from rounds
      const myTeamRounds  = md.teams?.find(t=>t.teamId===player.teamId)?.roundsWon||0;
      const oppTeamRounds = md.teams?.find(t=>t.teamId!==player.teamId)?.roundsWon||0;
      const score = `${myTeamRounds}:${oppTeamRounds}`;
      const secs = md.info?.gameLengthMillis ? Math.round(md.info.gameLengthMillis/60000) : 0;
      return {
        won, score,
        map: md.info?.mapId?.split('/')?.pop() || '—',
        agent: player.characterId || '—',
        kills: k, deaths: d, assists: a,
        kda: parseFloat(((k+a)/d).toFixed(2)),
        acs: Math.round((player.stats?.score||0) / Math.max(1, md.info?.roundsPlayed||1)),
        headshots: total ? Math.round((hs/total)*100) : 0,
        duration: secs ? `${secs}m` : '—',
      };
    }));
    res.json(matches.filter(Boolean));
  } catch(e) { res.status(500).json({ error: e.message }); }
}
