"""
90Minutes — WebSocket Event Emitter
Replays DFL match events through AWS API Gateway WebSocket at configurable speed.

Usage:
    python emitter.py                    # Default: demo speed (x60)
    python emitter.py --speed 10         # Test speed (x10)
    python emitter.py --speed 1          # Real-time (x1)
    python emitter.py --local            # Local JSON output (no WebSocket)

Environment:
    WEBSOCKET_URL   — wss://xxx.execute-api.us-east-1.amazonaws.com/prod
    SPEED_MULTIPLIER — override default speed (60)
    DATA_DIR        — path to data/ folder (default: ./data)
"""

import asyncio
import json
import logging
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Import parser from same directory
from parser import (
    parse_match_info,
    parse_events,
    event_to_dict,
    match_info_to_dict,
    MatchEvent,
    MatchEventType,
    MatchInfo,
)


# ---------------------------------------------------------------------------
# Speed configuration (per data-pipeline.md)
# ---------------------------------------------------------------------------
SPEED_PRESETS = {
    "demo": 60,      # ~90 seconds for full match (jury demo)
    "test": 10,      # ~9 minutes
    "realistic": 5,  # ~18 minutes
    "realtime": 1,   # ~90 minutes
}

MIN_DELAY = 0.2  # Minimum delay between events in seconds


# ---------------------------------------------------------------------------
# Fan message builder (per data-pipeline.md WebSocket protocol)
# ---------------------------------------------------------------------------

def build_fan_message(event: MatchEvent, match_info: MatchInfo) -> dict:
    """
    Transform a parsed MatchEvent into a fan-facing WebSocket message.

    The output format matches the 'Send Match Event' protocol defined
    in data-pipeline.md.
    """
    d = event.data
    base: dict = {
        "action": "sendMatchEvent",
        "type": event.event_type.value,
        "matchMinute": event.match_minute,
        "matchId": event.match_id,
        "timestamp": event.event_time,
    }

    if event.event_type == MatchEventType.GOAL:
        base.update({
            "emoji": "⚽",
            "title": f"BUUUUT ! {d.current_score}",
            "message": f"{d.player} marque à la {event.match_minute}'",
            "score": d.current_score,
            "kpis": {
                "xG": round(d.kpis.xG, 2) if d.kpis else 0,
                "playerSpeed": round(d.kpis.player_speed, 1) if d.kpis else 0,
                "goalZone": d.kpis.goal_zone if d.kpis else 0,
                "pressure": round(d.kpis.pressure, 2) if d.kpis else 0,
            },
            "triggersReaction": True,
            "triggersPrediction": False,
        })

    elif event.event_type == MatchEventType.CARD:
        color = d.card_color
        is_red = "red" in color.lower() if color else False
        base.update({
            "emoji": "🟥" if is_red else "🟨",
            "title": f"Carton {'rouge' if is_red else 'jaune'} !",
            "message": f"{d.player} reçoit un carton {color}",
            "triggersReaction": True,
            "triggersPrediction": False,
        })

    elif event.event_type == MatchEventType.HALFTIME:
        base.update({
            "emoji": "🔔",
            "title": "Mi-temps !",
            "message": "Pause ! Fais ta prédiction pour la 2ème mi-temps",
            "score": d.final_result,
            "triggersReaction": True,
            "triggersPrediction": True,
        })

    elif event.event_type == MatchEventType.FULLTIME:
        base.update({
            "emoji": "🏁",
            "title": "Fin du match !",
            "message": f"Score final : {d.final_result}",
            "finalScore": d.final_result,
            "triggersReaction": True,
            "triggersPrediction": False,
        })

    elif event.event_type == MatchEventType.SUBSTITUTION:
        base.update({
            "emoji": "🔄",
            "title": "Changement",
            "message": f"{d.player_out} sort, {d.player_in} entre",
            "triggersReaction": False,
            "triggersPrediction": False,
        })

    elif event.event_type == MatchEventType.OFFSIDE:
        base.update({
            "emoji": "🚩",
            "title": "Hors-jeu",
            "message": f"Hors-jeu pour {d.player}",
            "triggersReaction": False,
            "triggersPrediction": False,
        })

    return base


# ---------------------------------------------------------------------------
# Emitter class
# ---------------------------------------------------------------------------

class NinetyMinutesEmitter:
    """
    Replays DFL match events through a WebSocket connection.

    Supports configurable speed multiplier and local-only mode for testing
    without a WebSocket endpoint.
    """

    def __init__(
        self,
        data_dir: str = "./data",
        speed_multiplier: int = 60,
        websocket_url: Optional[str] = None,
    ):
        self.data_dir = Path(data_dir)
        self.speed_multiplier = speed_multiplier
        self.websocket_url = websocket_url

        # Parse data
        self.match_info = parse_match_info(str(self.data_dir / "match_info.xml"))
        self.events = parse_events(
            str(self.data_dir / "events.xml"),
            self.match_info.players,
        )

        logger.info(
            "Emitter ready: %s vs %s — %d events — speed x%d",
            self.match_info.home_team,
            self.match_info.guest_team,
            len(self.events),
            self.speed_multiplier,
        )

    async def emit_to_websocket(self) -> None:
        """Send all events through WebSocket API Gateway."""
        try:
            import websockets
        except ImportError:
            logger.error("websockets package not installed. Run: pip install websockets")
            sys.exit(1)

        if not self.websocket_url:
            logger.error("No WEBSOCKET_URL configured")
            sys.exit(1)

        logger.info("Connecting to %s ...", self.websocket_url)

        async with websockets.connect(self.websocket_url) as ws:
            # Send match start message
            match_start = {
                "action": "sendMatchEvent",
                "type": "MATCH_START",
                "matchInfo": match_info_to_dict(self.match_info),
                "totalEvents": len(self.events),
            }
            await ws.send(json.dumps(match_start))
            logger.info("✅ MATCH_START sent")

            # Replay events with timing
            last_delay = 0.0
            for i, event in enumerate(self.events):
                wait = max(
                    (event.relative_delay_sec - last_delay) / self.speed_multiplier,
                    MIN_DELAY,
                )
                await asyncio.sleep(wait)
                last_delay = event.relative_delay_sec

                msg = build_fan_message(event, self.match_info)
                await ws.send(json.dumps(msg, ensure_ascii=False))

                emoji = msg.get("emoji", "❓")
                title = msg.get("title", "")
                logger.info(
                    "[%d/%d] %s %s — %d'",
                    i + 1, len(self.events), emoji, title, event.match_minute,
                )

        logger.info("🏁 Emission complete!")

    def emit_local(self) -> None:
        """Print all events locally without WebSocket (for testing)."""
        print(f"\n🚀 LOCAL MODE — {self.match_info.home_team} vs {self.match_info.guest_team}")
        print(f"📊 {len(self.events)} events at speed x{self.speed_multiplier}\n")

        for i, event in enumerate(self.events):
            msg = build_fan_message(event, self.match_info)
            emoji = msg.get("emoji", "❓")
            title = msg.get("title", "")
            minute = event.match_minute
            print(f"  [{i+1:3d}/{len(self.events)}] {emoji} {minute:3d}' — {title}")

            # Show extra detail for goals
            if event.event_type == MatchEventType.GOAL and "kpis" in msg:
                kpis = msg["kpis"]
                print(f"           xG={kpis['xG']}, speed={kpis['playerSpeed']}km/h")

        # Export messages to JSON for frontend testing
        output_path = self.data_dir / "emitter_output.json"
        messages = [build_fan_message(e, self.match_info) for e in self.events]
        output_path.write_text(
            json.dumps(messages, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"\n📁 Exported {len(messages)} messages to {output_path}")
        print("   Use this file as fallback replay data for the frontend demo.\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="90Minutes — DFL Match Event Emitter",
    )
    parser.add_argument(
        "--speed",
        type=int,
        default=None,
        help="Speed multiplier (60=demo, 10=test, 5=realistic, 1=realtime)",
    )
    parser.add_argument(
        "--preset",
        choices=list(SPEED_PRESETS.keys()),
        default=None,
        help="Use a named speed preset",
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Local mode: print events without WebSocket",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="Path to data/ directory",
    )
    return parser.parse_args()


def main() -> None:
    """Entry point for the emitter."""
    args = parse_args()

    # Resolve data directory
    data_dir = args.data_dir or os.environ.get("DATA_DIR", str(Path(__file__).parent / "data"))

    # Resolve speed
    if args.preset:
        speed = SPEED_PRESETS[args.preset]
    elif args.speed:
        speed = args.speed
    else:
        speed = int(os.environ.get("SPEED_MULTIPLIER", "60"))

    # Resolve WebSocket URL
    ws_url = os.environ.get("WEBSOCKET_URL")

    emitter = NinetyMinutesEmitter(
        data_dir=data_dir,
        speed_multiplier=speed,
        websocket_url=ws_url,
    )

    if args.local or not ws_url:
        if not args.local and not ws_url:
            logger.warning("No WEBSOCKET_URL set — falling back to local mode")
        emitter.emit_local()
    else:
        asyncio.run(emitter.emit_to_websocket())


if __name__ == "__main__":
    main()
