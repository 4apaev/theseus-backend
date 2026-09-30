🧮 domain
================================


- pure domain math + game data - no file/network io, no deps on other theseus
  service packages; the one exception is `@theseus/config`'s `readEnv`, used
  to read this game's tunable rule constants (see below)
- interstellar trade formulas from Krugman's [the theory of interstellar trade](../../docs/The.Theory.of.Interstellar.Trade.md)


### deps:
- `@theseus/config` - `readEnv` for the game-mechanics constants
- otherwise none (uses `garage/util` via the root workspace)


### exports
- `src/trade.js`
    - `commonFrameYears(distanceLy, velocityC)` - `distance / velocity`
    - `shipFrameYears(distanceLy, velocityC)`   - relativistic proper time, `years * sqrt(1 - v²)`
    - `gameSeconds(commonYears, secondsPerYear)` - game clock conversion
    - `capitalCost(principal, interestRate, commonYears)` - compound interest over travel time
- `src/universe.js`
    - `Universe` - two levels: `systems` (stars) hold `nodes` (stations),
      `edges` is the undirected adjacency between stations
        - `system(sysid, meta)` / `node(stid, meta)` / `has` / `neighbors`
        - `link(a, b, ly, c)` - `c` is the peak speed of the route, in
          fractions of light speed. `1` lets the ship use its own velocity
        - `route(from, to)` → `{ ly, c }` / `distance(from, to)` → `ly` /
          `speedLimit(from, to)` → `c`
        - `node()` raises on an unknown system. every station lives in one,
          because the client map groups by it
        - `toJSON()` → `{ systems, stations, routes }` - plain wire shape,
          both directions of every link as its own row (gateway's
          `GET /api/universe`)
        - `path(from, to, velocity, acceleration)` → ordered stids, `from`
          and `to` both included, or `undefined` when nothing connects them -
          dijkstra, weighted by `legTime()`, not by `ly` alone, so the
          winning route can change with the ship
        - `legTime(ly, c, velocity, acceleration)` → years for one leg.
          an interstellar route holds one speed. an in-system route
          accelerates, then decelerates - see "the 2 travel models" below
    - `universe`    - the known universe singleton, 5 systems, 10 stations,
      15 links, 30 directed routes
    - `goods`       - `{ gid: { name, price_base, elasticity, kind, volume } }` -
      ore / grain / spice (`kind: 'commodity'`) plus the packaged module
      goods from `modules.js` (`kind: 'module'`) - one catalogue for
      everything tradable, `kind` and `volume` drive cargo weighting
    - `starterShip` - docked `sol.outpost`, 0.6c, capacity 20 (name comes
      from `randomShipName()`, not a field on this object)
    - `randomShipName()` - a fresh ship name each call: some come from
      Iain M. Banks' Culture novels, the rest are generated from word
      pools, sci-fi flavored. `src/shipNames.js`.
    - `TIME_SCALE` / `INTEREST_RATE` / `STARTER_CREDITS` - this game's tunable
      rules, `readEnv`-backed (defaults 20 / 0.05 / 1000) - single source of
      truth; ship-service and player-service import these instead of each
      reading their own env var with its own (driftable) default
    - `universeData` - `{ systems, stations, routes, goods, hulls, modules, starter, constants }`
      - the full `GET /api/universe` wire payload, composed once at import time
- `src/economy.js` - supply & demand, no state prices here
    - `price(base, stock, target, elasticity)` - scarcity ↑, glut ↓
    - `spread(price, margin)` → `{ price_buy, price_sell }` - station ask above bid
- `src/modules.js` - ship modules catalogue + resolver. mechanics are
  designed in [docs/modules.md](../../docs/modules.md) - read that first.
  `Design` and `Hull` are real classes - a bad or missing field throws
  at construction, not on first use. jsdoc types alias
  `types/modules.d.ts` rather than redefine it, so the two can't drift.
    - `hulls` - `{ id: Hull }`, one entry today: `starter` (20 capacity,
      0.6c, matching the existing starter ship before any upgrade)
    - `modules` - `{ gid: Design }` - family, mount, power draw,
      install context, requirements/conflicts/provides (rate + rank)
      and effects (flat/percent). a design is not a good - see `goods`
      below, they join on a shared gid
    - `starterRig` - `{ slot: gid }`, the starter hull's day-1 fit
    - `mounts` / `slotFamilies` - ordering data for the client
    - `Fitting` - the resolver, bound to one module catalogue at
      construction (`modules` by default - tests pass their own toy
      catalogue instead)
        - `deriveStats(hull, fitted)` → `{ capacity, velocity, power: {
          available, used } }` - hull base → flat → percent → hull cap,
          the same fixed order for every stat
        - `previewRig(hull, fitted, operation, context)` → `{
          proposed, stats, errors }` - one install or remove, checked
          against the *proposed* final rig only, never history.
          `errors` lists every violation, not just the first
    - `fitting` - the live `Fitting` instance every service imports;
      `deriveStats` / `previewRig` above are it, already bound
    - `cargoLoad(cargo, goodsCatalog)` - `Σ(quantity × volume)`, so a
      reactor and a crate of grain are not the same 1 cargo unit
    - `previewExchange(load, goodsCatalog, { incoming, outgoing })` -
      the resulting load after one module exchange, either side
      optional. shared by market-service's real saga and the gateway's
      advisory preview - see `docs/modules.md`

------------------------------------------------

### the known universe

10 star systems, 23 stations, 35 links. one station in each system carries
the links to other stars - the gateway. a system with more than a gateway is
an inner well: Sol, Ran, Procyon, Lalande 21185, Barnards Star, Wolf 359 and
Sirius. Alpha Centauri, Ross 154 and Lacaille 9352 are bare gateways.

**between the stars**, in light years. every gateway and what it reaches:

| gateway | reaches |
|---------|---------|
| `sol.outpost` | alpha 4.32, barnards 5.95 |
| `alpha.exchange` | sol 4.32, barnards 6.44, ross 8.11, wolf 8.27, sirius 9.52, lacaille 10.36 |
| `barnards.port` | ross 5.54, sol 5.95, alpha 6.44, wolf 10.93 |
| `wolf.reach` | lalande 4.06, alpha 8.27, procyon 8.66, sirius 9.02, barnards 10.93 |
| `sirius.gate` | procyon 5.26, ran 7.84, wolf 9.02, alpha 9.52 |
| `procyon.gate` | sirius 5.26, wolf 8.66, lalande 9.68 |
| `lalande.gate` | wolf 4.06, procyon 9.68 |
| `ross.beacon` | barnards 5.54, alpha 8.11, lacaille 9.58 |
| `lacaille.relay` | ross 9.58, alpha 10.36, ran 11.49 |
| `ran.gate` | sirius 7.84, lacaille 11.49 |

**Sol keeps 2 links, so the frontier stays behind the hubs.** Alpha Centauri
carries 6 and holds one station - it is a crossroads, not a destination. Ran
sits in the far corner, reached through Sirius or through Lacaille 9352.

**inside Sol**, in AU. Mars is the junction. Sol Outpost sits at Earth's
orbit - home base, between Venus and Mars:

```
  mercury ─ 0.336 ─ venus       mars ─ 3.679 ─ ganymede
     │                  ╲       ╱  │                │
   0.613                0.524     8.013 ─┐        4.334
     │                    ╲     ╱         │          │
     └───────────────── outpost ── 8.537 ┴─────── titan
```

**the other inner wells**, in AU. each holds its gateway and what orbits
with it:

| system | stations |
|--------|----------|
| Ran, ε Eridani | Ran Gate 1.00, Aegir Drift 3.48, Rorschach Watch 20.0 |
| Procyon | Procyon Gate 1.0, Bebop Docks 4.2, Ember Station 15.0 |
| Lalande 21185 | Qeng Ho Depot 0.30, Lalande Gate 1.00 |
| Barnards Star | Rama Dock 0.23, Barnards Port 1.00 |
| Wolf 359 | Wolf Reach 1.00, Solaris Lab 1.85 |
| Sirius | Sirius Gate 1.0, Planetes Salvage 19.8 |

Aegir Drift takes the orbit of ε Eridani b, the one confirmed planet there.
Ember Station rides Procyon B, and Planetes Salvage rides Sirius B - both
white dwarfs. the deepest legs cost about 4 years, near what a short star
crossing costs, so an outer station is a voyage and not an errand.

### the goods

20 commodities, from potable water at 12 to a colony mainframe at 900.
each one carries 2 axes, and they are not the same axis:

- **`category`** - food, tech, chemical, metal, consumer, luxury. what
  it is, and how the market board groups it.
- **`form`** - dry, liquid, gas, chilled, live. how a hold must carry
  it. grain and gene stock are both food, and one rides in a dry hold
  while the other needs life support.

nothing reads `form` yet. every hold takes every good, and the hauling
classes that change it are designed in [game.md](../../docs/game.md),
"the hauling classes".

a module is a good too. `Design extends Good`, so a reactor declares
`kind: 'module'` and rides in a dry hold like any crate.

**every station exports 2 goods cheap** (`↑ produces`) and craves 2
(`↓ consumes`), so profitable routes exist in every direction. a good a
station neither makes nor takes still trades there, at its base price -
that is the baseline every arbitrage is measured against. whether a run
profits after `capitalCost` of travel time - that's the game.

**a straight line inside Sol always wins on time, and sometimes on
distance too.** every in-system distance is `|radius_a - radius_b|`, so
every station sits on one line, at its own distance from Sol, in this
order: Mercury, Venus, Outpost, Mars, Ganymede, Titan. when a 3rd station
sits between the 2 you are comparing, a direct link covers exactly the
distance the long way covers: titan↔outpost (8.537 AU) equals
titan→mars→outpost added up, since Mars sits between them - and the same
is true of mars↔titan against mars→ganymede→titan.

equal distance is not equal time. a ship stops at every station on its
route, then accelerates again from rest. an in-system leg costs roughly
`2·√(d/a)`, and a square root is subadditive, so 2 legs always cost more
than 1 leg of the same total distance. `path()` takes the direct link on
both pairs.

outpost↔mercury is shorter as well as faster (0.613 AU direct, 1.661 AU
the long way through Venus and Mars), because Outpost sits between Venus
and Mars, not beyond either one - so no 3rd station lies between Outpost
and Mercury. the stars are also not on one line, so `path()` has real
work there too - `sol.mercury` to `sirius.gate` comes back
`sol.outpost → alpha.exchange → sirius.gate`, the 2-hop route, never the
3-hop one through Barnards Star and Wolf 359.

**star distances are real**, computed in light years from Sol against the HYG
star catalogue (`docs/hygdata_v42.csv`), which ships in this repo.
`alpha.exchange` stands for Rigil Kentaurus, the G2V star of the Alpha
Centauri pair.

**an in-system distance is the gap between two mean orbit radii**, in AU. the
radii are the standard published NASA figures. it is an approximation - the
true distance changes as the planets move around the star. Sol Outpost has
no orbit of its own - it sits at Earth's, 1.0 AU out, because it is home
base, where every new player starts. Ganymede and Titan are moons, so they
sit at their planet's orbit - Jupiter's and Saturn's.

**no gateway links to every other gateway.** Sol does not reach Wolf 359 or
Sirius directly. a player flies through Alpha Centauri, or through Barnards
Star. that restriction is a design choice, not a fact about the stars - Sol
really is 7.80 ly from Wolf 359 and 8.60 ly from Sirius, both a straight
line. `path()` picks the multi-hop route, so a player never has to plan the
detour by hand.

### the 2 travel models

`legTime(ly, c, velocity, acceleration)` holds both. the route's own `c`
picks between them.

**between stars, `c` is 1.** the ship holds its own velocity for the whole
leg, and the leg takes `ly / velocity`. this is Krugman's own
simplification - see
[The.Theory.of.Interstellar.Trade.md](../../docs/The.Theory.of.Interstellar.Trade.md).
the pilot ages less than the galaxy.

**inside a system, `c` is `0.00008`** - 24 km/s, or 1.5 times the speed of
Voyager 2. the ship accelerates to the midpoint, flips, then decelerates.
this is a brachistochrone trajectory. `a` comes from the hull and the
fitted maneuver drive.

the peak speed is `√(a·d)`. a leg that stays under `c` takes `2·√(d/a)`.
a leg that reaches `c` coasts between the 2 burns, and takes `d/c + c/a`.
the coast formula approaches `d/c` as `a` grows, so the old flat-speed
model is this same model with an unlimited drive.

the cap keeps a strong drive from ending a short hop at once. it also
holds every in-system speed far below light, so an in-system leg ages the
pilot and the galaxy by the same amount. only a trip between stars costs
the pilot less time than the clock.

the starter hull accelerates at `0.002` m/s². Venus to Mars then takes
about 10 game seconds, and Titan to Sol Outpost, the longest hop in Sol,
about 41. a `maneuver.mk2` drive raises `a` to `0.006`, which cuts the
short hop to about 6 seconds. the hull caps `a` at `0.01`. these are
balance numbers, not physics.


TODO
----------------
- **more stations in the other systems**. only Sol is built out today.
- **`path()` is O(V²) per call** - a linear scan for the closest unvisited
  station, no heap. fine for a few dozen stations, wrong for a universe
  10x this size.