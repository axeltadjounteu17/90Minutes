"""
90Minutes — DFL XML Parser
Parses DFL SPORTEC XML files (Events + MatchInformation) into structured
fan-facing events for the 90Minutes real-time app.

Usage:
    python parser.py
"""

import xml.etree.ElementTree as ET
import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Enums & Data Classes (per coding-standards.md)
# ---------------------------------------------------------------------------

class MatchEventType(str, Enum):
    """All event types relevant for fans."""
    GOAL = "GOAL"
    CARD = "CARD"
    HALFTIME = "HALFTIME"
    FULLTIME = "FULLTIME"
    SUBSTITUTION = "SUBSTITUTION"
    OFFSIDE = "OFFSIDE"


@dataclass
class PlayerInfo:
    """Minimal player info extracted from MatchInformation XML."""
    person_id: str
    name: str
    position: Optional[str]
    team_id: str
    team_name: str
    shirt_number: str


@dataclass
class EventKPIs:
    """KPI data attached to GOAL events (per data-pipeline.md)."""
    xG: float = 0.0
    player_speed: float = 0.0
    goal_zone: int = 0
    pressure: float = 0.0
    distance_to_goal: float = 0.0


@dataclass
class EventData:
    """Payload specific to each event type."""
    player: str = ""
    team_id: str = ""
    current_score: str = ""
    card_color: str = ""
    reason: str = ""
    game_section: str = ""
    final_result: str = ""
    player_out: str = ""
    player_in: str = ""
    position: str = ""
    type_of_shot: str = ""
    solo: bool = False
    kpis: Optional[EventKPIs] = None


@dataclass
class MatchEvent:
    """A single fan-facing match event."""
    event_id: str
    match_id: str
    event_time: str
    event_type: MatchEventType
    match_minute: int = 0
    relative_delay_sec: float = 0.0
    data: EventData = field(default_factory=EventData)


@dataclass
class MatchInfo:
    """Static match metadata."""
    match_id: str
    home_team: str
    home_code: str
    guest_team: str
    guest_code: str
    result: str
    kickoff_time: str
    stadium: str
    capacity: str
    players: dict = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Helper: safe float/int extraction from XML attributes
# ---------------------------------------------------------------------------

def _safe_float(value: Optional[str], default: float = 0.0) -> float:
    """Safely parse a float from an XML attribute value."""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def _safe_int(value: Optional[str], default: int = 0) -> int:
    """Safely parse an int from an XML attribute value."""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def _player_name(players: dict, person_id: Optional[str]) -> str:
    """Look up a player name by PersonId, return 'Inconnu' if not found."""
    if person_id is None:
        return "Inconnu"
    info = players.get(person_id)
    if info is None:
        return "Inconnu"
    return info.name if isinstance(info, PlayerInfo) else info.get("name", "Inconnu")


def _parse_xml_file(xml_path: str) -> ET.Element:
    """
    Parse an XML file, stripping any non-XML text before the root element.

    The DFL XML files from the hackathon may contain a browser-generated
    message like 'This XML file does not appear to have any style information...'
    before the actual XML content. This function handles that gracefully.
    """
    path = Path(xml_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {xml_path}")

    content = path.read_text(encoding="utf-8")

    # Find the first '<' that starts an XML tag (skip any preamble text)
    xml_start = content.find("<")
    if xml_start == -1:
        raise ValueError(f"No XML content found in {xml_path}")

    if xml_start > 0:
        logger.warning(
            "Stripped %d chars of non-XML preamble from %s",
            xml_start, xml_path,
        )
        content = content[xml_start:]

    root = ET.fromstring(content)
    return root


# ---------------------------------------------------------------------------
# parse_match_info
# ---------------------------------------------------------------------------

def parse_match_info(xml_path: str) -> MatchInfo:
    """
    Parse MatchInformation XML file.

    Returns a MatchInfo dataclass with team info, stadium, and full player roster.
    Raises FileNotFoundError if the file doesn't exist.
    Raises ET.ParseError if the XML is malformed.
    """
    logger.info("Parsing match info from %s", xml_path)
    root = _parse_xml_file(xml_path)

    general = root.find(".//General")
    if general is None:
        raise ValueError("Missing <General> element in match info XML")

    environment = root.find(".//Environment")

    # Build player roster keyed by PersonId
    players: dict[str, PlayerInfo] = {}
    for team in root.findall(".//Team"):
        team_id = team.get("TeamId", "")
        team_name = team.get("TeamName", "")
        for player_elem in team.findall(".//Player"):
            pid = player_elem.get("PersonId", "")
            players[pid] = PlayerInfo(
                person_id=pid,
                name=player_elem.get("Shortname", "Unknown"),
                position=player_elem.get("PlayingPosition"),
                team_id=team_id,
                team_name=team_name,
                shirt_number=player_elem.get("ShirtNumber", ""),
            )

    match_info = MatchInfo(
        match_id=general.get("MatchId", ""),
        home_team=general.get("HomeTeamName", ""),
        home_code=general.get("HomeTeamThreeLetterCode", ""),
        guest_team=general.get("GuestTeamName", ""),
        guest_code=general.get("GuestTeamThreeLetterCode", ""),
        result=general.get("Result", ""),
        kickoff_time=general.get("KickoffTime", ""),
        stadium=environment.get("StadiumName", "") if environment is not None else "",
        capacity=environment.get("StadiumCapacity", "") if environment is not None else "",
        players=players,
    )

    logger.info(
        "Match: %s vs %s — Result %s — %d players loaded",
        match_info.home_team,
        match_info.guest_team,
        match_info.result,
        len(players),
    )
    return match_info


# ---------------------------------------------------------------------------
# parse_events
# ---------------------------------------------------------------------------

def parse_events(xml_path: str, players: dict) -> list[MatchEvent]:
    """
    Parse Events_Anonym.xml.

    Filters only fan-relevant events: GOAL, CARD, HALFTIME, FULLTIME,
    SUBSTITUTION, OFFSIDE. Sorts by EventTime and computes relative delays
    and estimated match minutes.
    """
    logger.info("Parsing events from %s", xml_path)
    root = _parse_xml_file(xml_path)

    events: list[MatchEvent] = []
    parsed_times: list[tuple[datetime, MatchEvent]] = []

    for event_elem in root.findall(".//Event"):
        event_time_str = event_elem.get("EventTime")
        if not event_time_str:
            continue

        try:
            event_time = datetime.fromisoformat(event_time_str)
        except ValueError:
            logger.warning("Skipping event with unparseable time: %s", event_time_str)
            continue

        event_id = event_elem.get("EventId", "")
        match_id = event_elem.get("MatchId", "")
        event_type: Optional[MatchEventType] = None
        event_data = EventData()

        # ⚽ GOAL — ShotAtGoal containing SuccessfulShot
        shot = event_elem.find(".//ShotAtGoal")
        if shot is not None:
            success = shot.find(".//SuccessfulShot")
            if success is not None:
                pid = shot.get("Player")
                event_type = MatchEventType.GOAL
                event_data = EventData(
                    player=_player_name(players, pid),
                    team_id=shot.get("Team", ""),
                    current_score=success.get("CurrentResult", ""),
                    type_of_shot=shot.get("TypeOfShot", ""),
                    solo=success.get("Solo") == "true",
                    kpis=EventKPIs(
                        xG=_safe_float(shot.get("xG")),
                        player_speed=_safe_float(shot.get("PlayerSpeed")),
                        goal_zone=_safe_int(success.get("GoalZone")),
                        pressure=_safe_float(shot.get("Pressure")),
                        distance_to_goal=_safe_float(shot.get("DistanceToGoal")),
                    ),
                )

        # 🟨🟥 CARD
        caution = event_elem.find(".//Caution")
        if caution is not None:
            pid = caution.get("Player")
            event_type = MatchEventType.CARD
            event_data = EventData(
                player=_player_name(players, pid),
                team_id=caution.get("Team", ""),
                card_color=caution.get("CardColor", "yellow"),
                reason=caution.get("Reason", "foul"),
            )

        # 🔔 HALFTIME / 🏁 FULLTIME
        whistle = event_elem.find(".//FinalWhistle")
        if whistle is not None:
            section = whistle.get("GameSection", "")
            event_type = (
                MatchEventType.HALFTIME
                if "first" in section.lower()
                else MatchEventType.FULLTIME
            )
            event_data = EventData(
                game_section=section,
                final_result=whistle.get("FinalResult", ""),
            )

        # 🔄 SUBSTITUTION
        sub = event_elem.find(".//Substitution")
        if sub is not None:
            event_type = MatchEventType.SUBSTITUTION
            event_data = EventData(
                player_out=_player_name(players, sub.get("PlayerOut")),
                player_in=_player_name(players, sub.get("PlayerIn")),
                team_id=sub.get("Team", ""),
                position=sub.get("PlayingPosition", ""),
            )

        # 🚩 OFFSIDE
        offside = event_elem.find(".//Offside")
        if offside is not None:
            pid = offside.get("Player")
            event_type = MatchEventType.OFFSIDE
            event_data = EventData(
                player=_player_name(players, pid),
                team_id=offside.get("Team", ""),
            )

        if event_type is not None:
            me = MatchEvent(
                event_id=event_id,
                match_id=match_id,
                event_time=event_time_str,
                event_type=event_type,
                data=event_data,
            )
            parsed_times.append((event_time, me))

    # Sort by timestamp
    parsed_times.sort(key=lambda x: x[0])

    # Compute relative delays and match minutes
    if parsed_times:
        base_time = parsed_times[0][0]
        for event_time, me in parsed_times:
            delta = (event_time - base_time).total_seconds()
            me.relative_delay_sec = delta
            # 90 minutes = 5400 seconds of real play
            me.match_minute = min(int((delta / 5400) * 90), 90)
            events.append(me)

    logger.info("Parsed %d fan-relevant events", len(events))
    return events


# ---------------------------------------------------------------------------
# Serialization helpers
# ---------------------------------------------------------------------------

def event_to_dict(event: MatchEvent) -> dict:
    """Convert a MatchEvent to a JSON-serializable dict matching the WebSocket protocol."""
    d = event.data
    result: dict = {
        "eventId": event.event_id,
        "matchId": event.match_id,
        "eventTime": event.event_time,
        "type": event.event_type.value,
        "matchMinute": event.match_minute,
        "relativeDelaySec": round(event.relative_delay_sec, 3),
        "data": {},
    }

    if event.event_type == MatchEventType.GOAL:
        result["data"] = {
            "player": d.player,
            "teamId": d.team_id,
            "currentScore": d.current_score,
            "goalZone": d.kpis.goal_zone if d.kpis else 0,
            "xG": round(d.kpis.xG, 4) if d.kpis else 0,
            "playerSpeed": round(d.kpis.player_speed, 2) if d.kpis else 0,
            "pressure": round(d.kpis.pressure, 2) if d.kpis else 0,
            "distanceToGoal": round(d.kpis.distance_to_goal, 2) if d.kpis else 0,
            "typeOfShot": d.type_of_shot,
            "solo": d.solo,
        }
    elif event.event_type == MatchEventType.CARD:
        result["data"] = {
            "player": d.player,
            "teamId": d.team_id,
            "cardColor": d.card_color,
            "reason": d.reason,
        }
    elif event.event_type in (MatchEventType.HALFTIME, MatchEventType.FULLTIME):
        result["data"] = {
            "gameSection": d.game_section,
            "finalResult": d.final_result,
        }
    elif event.event_type == MatchEventType.SUBSTITUTION:
        result["data"] = {
            "playerOut": d.player_out,
            "playerIn": d.player_in,
            "teamId": d.team_id,
            "position": d.position,
        }
    elif event.event_type == MatchEventType.OFFSIDE:
        result["data"] = {
            "player": d.player,
            "teamId": d.team_id,
        }

    return result


def match_info_to_dict(info: MatchInfo) -> dict:
    """Convert MatchInfo to a JSON-serializable dict (without players roster)."""
    return {
        "matchId": info.match_id,
        "homeTeam": info.home_team,
        "homeCode": info.home_code,
        "guestTeam": info.guest_team,
        "guestCode": info.guest_code,
        "result": info.result,
        "kickoffTime": info.kickoff_time,
        "stadium": info.stadium,
        "capacity": info.capacity,
    }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

EMOJI_MAP = {
    MatchEventType.GOAL: "⚽",
    MatchEventType.CARD: "🟨",
    MatchEventType.HALFTIME: "🔔",
    MatchEventType.FULLTIME: "🏁",
    MatchEventType.SUBSTITUTION: "🔄",
    MatchEventType.OFFSIDE: "🚩",
}


def main() -> None:
    """Parse XML files and print a summary of all fan-relevant events."""
    data_dir = Path(__file__).parent / "data"

    # Parse match info
    match = parse_match_info(str(data_dir / "match_info.xml"))
    print(f"\n⚽ {match.home_team} vs {match.guest_team}")
    print(f"🏟️  {match.stadium} ({match.capacity} places)")
    print(f"📊 Résultat final : {match.result}")
    print(f"👥 {len(match.players)} joueurs chargés\n")

    # Parse events
    events = parse_events(str(data_dir / "events.xml"), match.players)
    print(f"✅ {len(events)} événements fan parsés\n")

    # Print timeline
    for e in events:
        emoji = EMOJI_MAP.get(e.event_type, "❓")
        d = e.data
        detail = ""

        if e.event_type == MatchEventType.GOAL:
            xg = d.kpis.xG if d.kpis else 0
            speed = d.kpis.player_speed if d.kpis else 0
            detail = f"{d.player} — {d.current_score} (xG={xg:.2f}, {speed:.0f}km/h)"
        elif e.event_type == MatchEventType.CARD:
            detail = f"{d.player} — carton {d.card_color}"
        elif e.event_type in (MatchEventType.HALFTIME, MatchEventType.FULLTIME):
            detail = f"Score: {d.final_result}"
        elif e.event_type == MatchEventType.SUBSTITUTION:
            detail = f"{d.player_out} ➜ {d.player_in}"
        elif e.event_type == MatchEventType.OFFSIDE:
            detail = d.player

        print(f"  {emoji} {e.match_minute:3d}' — {e.event_type.value:15s} {detail}")

    # Export to JSON for verification
    output_path = data_dir / "parsed_events.json"
    export = {
        "matchInfo": match_info_to_dict(match),
        "events": [event_to_dict(e) for e in events],
    }
    output_path.write_text(json.dumps(export, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n📁 Exported to {output_path}")


if __name__ == "__main__":
    main()
