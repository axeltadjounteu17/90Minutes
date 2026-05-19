"""Quick test script for the parser."""
import sys
sys.path.insert(0, ".")
from parser import parse_match_info, parse_events

try:
    m = parse_match_info("data/match_info.xml")
    print(f"Match: {m.home_team} vs {m.guest_team} = {m.result}")
    print(f"Players: {len(m.players)}")

    e = parse_events("data/events.xml", m.players)
    print(f"Events: {len(e)}")
    for x in e:
        print(f"  {x.event_type.value:15s} {x.match_minute:3d}' {x.data}")
except Exception as ex:
    print(f"ERROR: {ex}")
    import traceback
    traceback.print_exc()
