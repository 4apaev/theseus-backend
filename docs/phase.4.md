phase 4 - from a simulation to a game
================================================

phase 3 (see [phase.3.md](phase.3.md)) closed the open threads: modules,
the ansible, ΔV legs and 23 stations. theseus still reads as a
simulation. every place costs the same to reach, every hold takes every
good, and no player has ever made money on purpose (see [sim.md](sim.md)).

phase 4 makes the map cost something. then it sets the prices against a
player that trades on purpose. a short track runs beside it: the toy
client gets the data it draws. opening the game to other players
(deploy, external login, the admin board) is phase 5.

sources: [game.md](../../docs/game.md)'s "the order" and "the flight and
fight decisions", [sim.md](sim.md), [tech.debt.md](tech.debt.md),
[deploy.md](../../docs/deploy.md) and the [todo](../../docs/todo.md).


before it starts
------------------------------------------------

the user, 2026-10-26: close phase 3 light.

- **3.6** is built (#36). mark it done.
- **3.7, the manifest.** its server half, one field on `GET /api/ship`,
  joins 4.1.
- **3.8, the jsdoc pass.** any time, package by package: a step types
  the package it touches.


steps
------------------------------------------------

2 tracks. the **game** track runs in order, and each step needs the one
before it. the **client** track runs beside it, when a session is free.

| step | track  | what                                              | needs         | status |
|------|--------|---------------------------------------------------|---------------|--------|
| 4.1  | client | the numbers on the wire: positions, tunables, the manifest | -    |        |
| 4.2  | client | fog of war v1 - traffic by system                 | -             |        |
| 4.9  | client | who wrote it, the ship's skin                     | -             |        |
| 4.3  | game   | the gravity well                                  | -             |        |
| 4.4  | game   | an agent player                                   | 4.2           |        |
| 4.5  | game   | the hauling classes                               | -             |        |
| 4.6  | game   | fuel v1 - a burn costs hydrogen, adrift, the tug  | 4.3, 4.5      |        |
| 4.7  | game   | crew v1 - a trait the player buys                 | 4.6           |        |
| 4.8  | game   | fees and the balance pass                         | 4.4, 4.7      |        |


### step 4.1 - the numbers on the wire: positions, tunables, the manifest

the toy client draws the chart and the systems. it keeps its own copy of
the star positions, and it spreads the stations round their stars with
its own angles. the server sends a radius and nothing more.

the user, 2026-10-26: **numbers on the wire, no shared package.**

- **positions.** a star gets x, y, z from `data/hygdata_v42.csv`. a
  station gets a fixed orbit angle beside its radius. a turning angle
  changes leg lengths over time: it waits.
- **tunables.** `GET /api/universe` carries the numbers `legTime()` and
  `capitalCost()` read. the client keeps its own small math with them.
- **the manifest** (3.7): one field on `GET /api/ship`.
- **a check.** a client test runs the server's leg times for a fixture
  universe, and the client's math must give the same.

touches `packages/domain` (positions), `apps/gateway/src/queries.js`.


### step 4.2 - fog of war v1, traffic by system

`GET /api/ship/traffic` with no station returns every ship ever
registered, in transit too (`queries.js`, `traffic()`). it is 48 KB
today, and it grows with every player. [sim.md](sim.md) measures it as
98% of an agent's bill.

game.md's fog of war v1: a player sees the ships in their own system -
docked there, on a leg inside it, or on a leg to or from it. the feed
already filters station chat by who is docked. this is the same filter
one level up.

- `traffic()` takes the player's system.
- the ws fanout of `ship.departed` and `ship.arrived` follows the same rule.
- an admin keeps the whole fleet.

touches `apps/gateway` (queries, feed). no new service.


### step 4.9 - who wrote it, the ship's skin

2 small reads the toy client waits for.

- **the sender's handle.** a message carries the sender's pid only, and
  the traffic shows no pids, on purpose. so every message from another
  player shows "a pilot". a message row carries the sender's handle.
- **the ship's skin.** the client sends `skin` with a rename; the server
  ignores it. the ship keeps its skin, and the traffic shows it, so other
  players see it.

touches `apps/gateway` (the message row, the traffic), ship-service (the
skin).


### step 4.3 - the gravity well

game.md's order puts it first: one term, and the inner system costs
something.

**decided, the user, 2026-10-26: the well as Δv.** the reason below.

the term as written strands the starter ship. game.md proposes an effective acceleration of `a - GM/r²`. Sol
Outpost sits at 1.0 AU (`systems.js`; game.md's table says 1.336). there
the sun pulls 0.0059 m/s², and the starter pushes 0.002. under that term
the starter cannot leave its home port, or Mars at 1.524 AU. only
Ganymede and Titan lie outside its 1.72 AU line.

the term treats a ship as if it hovers. a ship in orbit falls freely,
and a weak drive still spirals out, slowly. the real price of a well is
Δv: a deep orbit moves fast, and a ship must match its speed.

**the well as Δv:** `v(r) = √(GM/r)`, and a leg adds
`|v(from) - v(to)|`. for these orbits that is within 5% of a hohmann
transfer.

| from the outpost, 29.8 km/s | orbit speed | extra Δv  | extra time, starter | with maneuver.mk2 |
|-----------------------------|-------------|-----------|---------------------|-------------------|
| mars, 1.524 AU              | 24.1 km/s   | 5.7 km/s  | 33 days             | 11 days           |
| mercury, 0.387 AU           | 47.9 km/s   | 18.1 km/s | 105 days            | 35 days           |
| icarus, 0.05 AU             | 133.2 km/s  | 103 km/s  | 1.6 years           | 200 days          |

time alone gates nothing: a slow ship still arrives. the gate comes with
4.6. Δv costs fuel, and a tank holds a limited Δv. so the well and fuel
are one model: the well sets the Δv, fuel sets the price, and the tank
sets what is impossible.

gate: a sim run before and after, with the same seed and tempo. read the
rejection mix and the station visits.

the numbers and diagrams: [ΔV.md](../../docs/ΔV.md).

touches `packages/domain/src/universe/space.js` (`legTime()`) and
`graph.js` (the `path()` weights). game.md's "the gravity well" gets the
decision.


### step 4.4 - an agent player

[sim.md](sim.md) plans it, and 4.8 waits for it. a dice player buys and
sells at the same station, and it loses the spread every time. until a
player hauls cargo on purpose, every balance number is tuned against a
random walk.

- 7 tools, written by hand, over the http api. no mcp.
- one tool returns the whole turn: ship, wallet, cargo and the local market.
- no `traffic` read. after 4.2 the system read is the default.
- a cached prefix, low effort, and old tool results cleared.
- dice and agents in one run. the dice are the control group.

the user, 2026-10-26: the model is Claude Haiku 5.5 (`claude-haiku-5-5`).
a run of 1000 turns costs well under $1.

before the build: measure the real token counts with `count_tokens`.
decide one conversation per agent, or one call per turn. the agent sits
behind one small seam - a turn in, an action out - so a free local
model can play too, and the sim compares them.

touches `packages/sim/src/players/`.


### step 4.5 - the hauling classes

every good declares a `form`: dry, liquid, gas, chilled or live. nothing
reads it. game.md's "the hauling classes" designs the mechanic: a hold
module declares the forms it takes, and `cargo.buy` refuses a good the
ship cannot hold.

- 3 hold modules: `cargo.tank` (liquid, gas), `cargo.reefer` (chilled),
  `cargo.pen` (live). the painted client has their models, and sam drew
  the hold interiors (job h1).
- `cargo.mk1` stays dry.
- a station sells the new holds, in its `stocks`.
- the refusal reuses `cargo.operation.rejected`, with a reason the
  market can show.
- v1 has no boil-off and no dead cargo. the risk of live cargo waits for
  a power failure.

touches `packages/domain/src/universe/modules.js`, market-service's buy
check, and `systems.js` for the stocks.


### step 4.6 - fuel v1

game.md decides it: fuel is the cost of a burn, spent per Δv. slush
hydrogen is already a good.

- a leg costs fuel by the rocket equation. the exhaust velocity is tuned
  so a normal trip costs a normal amount. 4.3's well adds its Δv.
- `path()` refuses a leg that the tank cannot pay for. that is the
  impossible leg game.md wants from the well.
- a new ship state, `adrift`: no fuel and no destination.
- the tug tows an adrift ship to the nearest station, for ₢ or in kind:
  cargo first, then modules, at salvage price. never the hull or a bare
  starter rig. sam has drawn the tug.

**decided, the user, 2026-10-26: the drive's tank.** the reason below.

where fuel lives: hydrogen has the form
`gas`, so after 4.5 a dry hold cannot carry it. 2 answers:

1. the drive carries its own tank: a ship stat and a refuel command.
2. fuel sits in the hold, and every ship needs a tank module.

1 it is. the starter ship must fly with no refit. game.md's "a hold
tradeoff" stays open for later, as an extra tank module.

out of v1: flight plans with handles, a course change mid flight, fuel
mass, the beam.

touches `packages/domain` (fuel per leg), ship-service (adrift, the tug
saga) and market-service (refuel).


### step 4.7 - crew v1

the user's call (2026-10-05): a crew member is a trait the player buys.
game.md decides the first seats. the pilot is new, and the portraits
already show one:

| seat     | trait                      | works in v1       |
|----------|----------------------------|-------------------|
| haggler  | a better spread            | yes               |
| engineer | less fuel per burn         | yes, after 4.6    |
| pilot    | more in-system acceleration | yes              |
| gunner   | a better hit chance        | hired, the trait waits for the fight |

- the crew ages in ship time. they are the only people who age with the
  player.
- wages are a money sink.
- **reuse the rig.** a seat is a slot. a crew member is a design with
  `effects`, the shape the modules use (`{ stat, kind, value }`).
  `previewRig` already checks a fit. a station offers crew the way it
  stocks modules.

decided, the user, 2026-10-26:
- **wages per ship year.** the crew is paid for the time it lives. a fast
  leg near light speed is cheap in wages: a reason to buy a faster drive.
  the balance pass (4.8) reads it against `capitalCost()`, which charges
  per galaxy year.
- **the gunner is hired now.** its trait does nothing until the fight.
  the client says so on the card.

the portraits are little yellow robots (sam's `toy-crew-robots`).
game.md's crew section still says "no portraits"; the user's call
replaces that.

touches `packages/domain` (seats, crew designs), market-service (hire)
and ship-service (wages).


### step 4.8 - fees and the balance pass

theseus reads as a simulation, not as a game
([game.md](../../docs/game.md)'s "game balance"). this step sets the
numbers. it comes last, because every mechanic must exist before anyone
tunes it.

**the sim is the instrument.** `player_profit` and `station_profit` in
the report are the same subtraction from both sides, and the rejection
mix says which rule the players fight. see [sim.md](sim.md).

#### what the numbers say today

- **the spread is already a 22.2% tax.** `spread(px, 0.1)` sells at
  +10% of spot and buys at -10%. a round trip pays 22.2% before any fee.
  a trade pays only when the destination beats the origin by that much.
- **the price curve clears it easily.** ore at a stock ratio of 1.5
  prices at 1.63x. profitable arbitrage exists.
- **no sim player has ever found it.** the dice buy and sell at the same
  station, so every run ends with the players in the red and the
  stations ahead - station profit +1645 against players at -936. that
  measures the dice, and not the game.

#### the order

1. **4.4's agent player.** it is the gate for the whole step.
2. **measure the real margin** on a full buy, carry, sell loop.
3. **set the fees to what that margin carries** - see
   [game.md](../../docs/game.md)'s "fees and taxes". prefer a derived
   fee over a flat one: docking from the orbit radius, handling from
   cargo volume, sales tax from the station's produces and consumes
   map. all 3 read data that exists.
4. **re-run and compare.** a balance change lands only with a before
   and an after from the same seed and the same tempo.

#### what needs a balance pass

- the spread margin, per good or per station, instead of a flat 0.1
- STARTER_CREDITS against the price of the first useful module
- drift rate against travel time - the ratio decides whether a trader
  arrives to a restocked market, see [scripts/readme.md](../scripts/readme.md)
- module prices and the tier gaps
- the gravity well, which changes every in-system leg at once (4.3).
  Mercury and Venus turn hard for a starter ship, and the early game
  moves outward
- the fuel price: the exhaust velocity and the price of hydrogen (4.6)
- crew wages against the trait they buy (4.7)
- INTEREST_RATE, which no service reads today

#### the trap

fees and a gravity well both make the inner system expensive. they are
not the same lever. a fee takes money, and a well asks for a better
drive. **stacking both without measuring turns the map into a wall.**


the client
------------------------------------------------

the toy client is phase 4's client: lit, three.js, toy stations and
ships on a 3D stage. it lives in the frontend repo, on `master` since
v0.2.0. it waits on 4.1 (positions, the manifest), 4.2 (traffic), 4.9
(handles, skins), and the crew and fuel of 4.6 and 4.7 for their cards.


any time
------------------------------------------------

small debt with no step. a free session takes it.

- the jsdoc pass (3.8), one package at a time

- `using` and `Symbol.dispose` for `withClient` in
  `packages/db/src/query.js`
- tech.debt.md's "no station sells an ansible" is stale: `sirius.gate`
  and `lalande.qeng` stock `ansible.mk1`.


phase 5: the doors
------------------------------------------------

the user, 2026-10-26: phase 4 is the game and the client. the steps that
open the game to other players move here, as they were written:

- **deploy**: the game in containers. [deploy.md](../../docs/deploy.md)'s
  "what to build first": a Dockerfile and compose for the 6 services,
  `GET /health` and probes, a daily `pg_dump` and a tested restore, the
  prune job on a cron, a logger with levels and metrics, secrets out of
  `.env`. one gateway only. open call: the host.
- **external login**: google, github, apple. the authorization code flow
  with pkce at the gateway; a player links to a (provider, subject) pair.
  apple needs https on a real domain, after deploy. open call: a library
  (`openid-client`) or a small flow over `garage/sync`.
- **the admin board v1**: the sim report and the read models, live
  tunables with a `tunables.changed` event, the admin ops (credit a
  wallet, restock a station). open call: a page in the frontend, or its
  own app.
- **spike: one schema for the wire**: protobuf at the edge, json schema
  from `@theseus/contracts`, or 2 copies and a test. measure first: the
  bytes per route after 4.2, the lines of duplicate validation. the
  output is a decision, not code.


explicitly out (phase 6+)
------------------------------------------------

- **the fight**: in-system, simultaneous turns, heat and radar, weapons
  as cargo, jettison. the gunner seat waits for it.
- **the flight, in full**: flight plans with handles, a course change
  mid flight, player burns, orbital mechanics and ksp piloting.
- **the beam**: the telematter tier and the icarus array. sam draws the
  array. the mechanic waits for fuel v1.
- the full hull catalogue, and buying ships.
- player-to-player trading, the public trade feed, the transponder
  switch, factions.
- exploration, colonies, npc missions, random encounters.
- stations with many goods and with services: repair, security, tech,
  workforce. ship wear and repairs.
- a game save ([tech.debt.md](tech.debt.md)).
- fog of war v2: sensor ranges.
