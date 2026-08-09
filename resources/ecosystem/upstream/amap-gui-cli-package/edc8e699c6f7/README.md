# amap-gui

AI-driven AMap (高德地图) visualization CLI — drives an Electron map container with route planning, POI search and map-state control. Designed for AI Agents.

## Requirements

- Node.js >= 18
- A valid **AMap Web JS API Key** — apply at [lbs.amap.com](https://lbs.amap.com)

## Installation

```bash
npm install -g @amap-lbs/amap-gui
```

## Configure API Keys (Required)

You need **two keys** from the AMap open platform ([lbs.amap.com](https://lbs.amap.com)):

| Env Var | Required | Description |
|---------|----------|-------------|
| `AMAP_KEY` | ✅ Yes | Web JS API Key |
| `AMAP_SECURITY_KEY` | Recommended | JS API Security Key (required for some account types) |

```bash
# macOS / Linux — add to ~/.zshrc or ~/.bashrc for persistence
export AMAP_KEY=your_amap_web_js_key
export AMAP_SECURITY_KEY=your_amap_security_key

# Windows (PowerShell)
$env:AMAP_KEY="your_amap_web_js_key"
$env:AMAP_SECURITY_KEY="your_amap_security_key"

# Windows (cmd)
set AMAP_KEY=your_amap_web_js_key
set AMAP_SECURITY_KEY=your_amap_security_key
```

> The GUI will show an error and refuse to start the map if `AMAP_KEY` is missing.  
> `AMAP_SECURITY_KEY` defaults to empty string if not set (safe for older API keys).

## Usage

```bash
# 1. Check if the GUI container is running
amap-gui status

# 2. Start the GUI (blocks until map is ready)
amap-gui start

# 3. Control the map
amap-gui mapState --json '{"action":"set","center":"上海外滩","zoom":15,"style":"dark"}'
amap-gui route    --json '{"from":{"position":"北京南站"},"to":{"position":"天安门"},"type":"driving"}'
amap-gui searchPOI --json '{"keyword":"咖啡","city":"北京"}'

# 4. Stop the GUI
amap-gui stop
```

## Commands

| Command | Description |
|---------|-------------|
| `amap-gui status` | Check container status (`not_running` / `running`) |
| `amap-gui start` | Launch the Electron GUI (waits until `mapReady: true`) |
| `amap-gui stop` | Shut down the container |
| `amap-gui mapState --json '...'` | Get/set map view (center, zoom, pitch, style) |
| `amap-gui route --json '...'` | Plan a route (driving / walking / riding / transit) |
| `amap-gui searchPOI --json '...'` | Search POIs and pin them on the map |
| `amap-gui getLastEvent` | Get last user interaction event on the map |

All commands return structured JSON: `{ success, data, error }`.

## For AI Agents

See [SKILL.md](./SKILL.md) for detailed parameter schemas, response formats, and typical workflows.


## Quick Start

```bash
# 1. Install
npm install -g @amap-lbs/amap-gui

# 2. Configure API Key (one-time, add to ~/.zshrc for persistence)
export AMAP_KEY=your_amap_key
export AMAP_SECURITY_KEY=your_amap_security_key

# 3. Start the GUI
amap-gui start

# 4. Control the map
amap-gui mapState --json '{"action":"set","center":"北京","zoom":12}'

# 5. Stop
amap-gui stop
```

## License

MIT
