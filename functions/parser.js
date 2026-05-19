/**
 * 90Minutes — DFL Event Parser
 * Parses XML match events and produces anonymized output.
 * Never throws — returns Result type {ok, value/error}.
 *
 * Requirements: 13.3, 14.1, 14.2, 14.4
 */

/** Valid event types */
const VALID_TYPES = ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'HALFTIME', 'FULLTIME', 'SUBSTITUTION', 'OFFSIDE', 'MATCH_START'];

/** Anonymized team names */
const TEAM_MAP = {
  'FC Team': 'FC Team',
  'Club': 'Club',
};

/**
 * Parse a DFL XML event string into a structured object.
 * Never throws — returns {ok: true, value} or {ok: false, error}.
 * @param {string} xml - The XML string to parse
 * @returns {{ok: boolean, value?: object, error?: string}}
 */
function parseEvent(xml) {
  try {
    if (!xml || typeof xml !== 'string') {
      return { ok: false, error: 'MALFORMED_XML' };
    }

    // Extract type
    const typeMatch = xml.match(/<Type>(.*?)<\/Type>/);
    if (!typeMatch) return { ok: false, error: 'MALFORMED_XML' };
    const type = typeMatch[1].trim();
    if (!VALID_TYPES.includes(type)) return { ok: false, error: 'MALFORMED_XML' };

    // Extract minute
    const minuteMatch = xml.match(/<Minute>(.*?)<\/Minute>/);
    const minute = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
    if (isNaN(minute) || minute < 0 || minute > 95) return { ok: false, error: 'MALFORMED_XML' };

    // Extract team (anonymize)
    const teamMatch = xml.match(/<Team>(.*?)<\/Team>/);
    let team = 'FC Team';
    if (teamMatch) {
      const rawTeam = teamMatch[1].trim();
      // Map to anonymized names: first team → 'FC Team', second → 'Club'
      if (rawTeam.toLowerCase().includes('guest') || rawTeam.toLowerCase().includes('away') || rawTeam === 'Club') {
        team = 'Club';
      } else {
        team = 'FC Team';
      }
    }

    // Extract player (anonymize)
    const playerMatch = xml.match(/<Player>(.*?)<\/Player>/);
    let player = '';
    if (playerMatch) {
      const rawPlayer = playerMatch[1].trim();
      // Anonymize: take first letter of first name + abbreviated last name
      player = anonymizePlayer(rawPlayer);
    }

    return {
      ok: true,
      value: { type, minute, team, player },
    };
  } catch (err) {
    return { ok: false, error: 'MALFORMED_XML' };
  }
}

/**
 * Anonymize a player name.
 * Format: "S. Fünf" style (first initial + dot + space + generic surname)
 */
function anonymizePlayer(name) {
  if (!name || name.length === 0) return '';
  const initial = name.charAt(0).toUpperCase();
  // Generate a consistent anonymized surname based on name length
  const surnames = ['Eins', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn'];
  const idx = name.length % surnames.length;
  return `${initial}. ${surnames[idx]}`;
}

/**
 * Convert a parsed DFL event back to XML string.
 * Produces semantically equivalent XML.
 * @param {{type: string, minute: number, team: string, player: string}} event
 * @returns {string} XML representation
 */
function prettyPrintEvent(event) {
  if (!event || !event.type) return '';

  const parts = ['<Event>'];
  parts.push(`  <Type>${event.type}</Type>`);
  parts.push(`  <Minute>${event.minute}</Minute>`);
  parts.push(`  <Team>${event.team}</Team>`);
  if (event.player) {
    parts.push(`  <Player>${event.player}</Player>`);
  }
  parts.push('</Event>');

  return parts.join('\n');
}

module.exports = {
  parseEvent,
  prettyPrintEvent,
  anonymizePlayer,
  VALID_TYPES,
};
