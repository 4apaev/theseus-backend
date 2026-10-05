phase 4 - from a simulation to a game
================================================

phase 3 (see [phase.3.md](phase.3.md)) closed the open threads: modules,
the ansible, ΔV legs and 23 stations. theseus still reads as a
simulation. every place costs the same to reach, every hold takes every
good, and no player has ever made money on purpose (see [sim.md](sim.md)).

phase 4 makes the map cost something. then it sets the prices against a
player that trades on purpose. 2 short tracks run beside it: the new
client gets the data it draws, and the game opens to players who are not
on this laptop.

sources: [game.md](../../docs/game.md)'s "the order" and "the flight and
fight decisions", [sim.md](sim.md), [tech.debt.md](tech.debt.md),
[deploy.md](../../docs/deploy.md) and the [todo](../../docs/todo.md).


before it starts
------------------------------------------------

phase 3 has 2 open steps:

- **3.7, the manifest.** the server half is one field on `GET /api/ship`.
  the painted client draws it. the old client gets nothing.
- **3.8, the jsdoc pass.** it touches every package, so it lands before
  phase 4 changes them again.

3.6 is built (#36). its row in the phase 3 table has no mark.


steps
------------------------------------------------

4 tracks. the **game** track runs in order, and each step needs the one
before it. the **client**, **doors** and **spike** tracks run beside it,
when a session is free.

| step | track  | what                                              | needs         | status |
|------|--------|---------------------------------------------------|---------------|--------|
| 4.1  | client | the domain in the browser, coordinates on the wire | -            |        |
| 4.2  | client | fog of war v1 - traffic by system                 | -             |        |
| 4.3  | game   | the gravity well                                  | -             |        |
| 4.4  | game   | an agent player                                   | 4.2           |        |
| 4.5  | game   | the hauling classes                               | -             |        |
| 4.6  | game   | fuel v1 - a burn costs hydrogen, adrift, the tug  | 4.3, 4.5      |        |
| 4.7  | game   | crew v1 - a trait the player buys                 | 4.6           |        |
| 4.8  | game   | fees and the balance pass                         | 4.4, 4.7      |        |
| 4.9  | doors  | deploy - the game in containers                   | -             |        |
| 4.10 | doors  | external login - google, github, apple            | 4.9 for apple |        |
| 4.11 | doors  | the admin board v1                                | 4.9           |        |
| 4.12 | spike  | one schema for the wire - protobuf or contracts   | 4.2           |        |


### step 4.1 - the domain in the browser, coordinates on the wire

game.md names this the first build step under the flight and the fight.
the painted client needs it now: the chart and the system map draw
places, and a place has no position today.

- **the browser cannot import `@theseus/domain`.** `universe/index.js`
  imports `readEnv`, and `@theseus/config` calls `process.loadEnvFile()`
  at import. the browser has no `process`. the domain exports its
  defaults. each service reads the env and passes the tunables in. the
  client then runs `legTime()` and `capitalCost()` with the server's
  numbers.
- **coordinates.** a star gets x, y, z from `data/hygdata_v42.csv`. a
  station gets an orbit angle beside its radius. `GET /api/universe`
  carries both.
- the frontend todo "inner well view" waits for this: the Sol stations
  stand on one straight line.

open calls:
- a fixed orbit angle, or an angle that turns with game time. a turning
  angle changes leg lengths over time. start fixed.
- how the client gets the package: a git dependency (as `garage`), a
  published package, or a build step that copies it.

touches `packages/domain`, `packages/config`, `apps/gateway/src/queries.js`.


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


### step 4.3 - the gravity well

game.md's order puts it first: one term, and the inner system costs
something.

**open call at step start: the term as written strands the starter
ship.** game.md proposes an effective acceleration of `a - GM/r²`. Sol
Outpost sits at 1.0 AU (`systems.js`; game.md's table says 1.336). there
the sun pulls 0.0059 m/s², and the starter pushes 0.002. under that term
the starter cannot leave its home port, or Mars at 1.524 AU. only
Ganymede and Titan lie outside its 1.72 AU line.

the term treats a ship as if it hovers. a ship in orbit falls freely,
and a weak drive still spirals out, slowly. the real price of a well is
Δv: a deep orbit moves fast, and a ship must match its speed.

**recommend: the well as Δv.** `v(r) = √(GM/r)`, and a leg adds
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

before the build: measure the real token counts with `count_tokens`.
decide one conversation per agent, or one call per turn. the model is
the user's choice.

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

**open call at step start: where fuel lives.** hydrogen has the form
`gas`, so after 4.5 a dry hold cannot carry it. 2 answers:

1. the drive carries its own tank: a ship stat and a refuel command.
2. fuel sits in the hold, and every ship needs a tank module.

recommend 1. the starter ship must fly with no refit. game.md's "a hold
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
| gunner   | a better hit chance        | no: there is no fight yet |

- the crew ages in ship time. they are the only people who age with the
  player.
- wages are a money sink.
- **reuse the rig.** a seat is a slot. a crew member is a design with
  `effects`, the shape the modules use (`{ stat, kind, value }`).
  `previewRig` already checks a fit. a station offers crew the way it
  stocks modules.

open calls:
- wages per ship year or per galaxy year. per ship year makes a long
  interstellar leg cheap, because the crew sleeps through the galaxy's
  years. per galaxy year matches how `capitalCost()` charges.
- the gunner: hire it now and it waits, or leave the seat out until the
  fight.

the portraits are sam's job cr2. game.md's crew section still says "no
portraits"; the user's call replaces that.

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


### step 4.9 - deploy

[deploy.md](../../docs/deploy.md) lists what has to run, the gaps that
block a deploy, and what the cloud costs. its "what to build first" is
this step:

1. a `Dockerfile` and a compose file that runs the 6 services, not only
   the infra
2. `GET /health` on the gateway, and a real probe per service
3. a daily `pg_dump` to object storage, and a restore that someone has
   run
4. the prune job on a cron
5. a logger with levels, and one metrics endpoint
6. secrets out of `.env`

one gateway only: the ws fanout lives in one process. a second gateway
waits for a shared fanout.

open call: the host. deploy.md prices "the cheap shape - one box" and
"the managed shape".


### step 4.10 - external login

the [todo](../../docs/todo.md): google, apple and github. a new player
signs in with an account they already have.

- the authorization code flow with pkce, at the gateway. the gateway
  still signs its own token (`packages/auth`), so nothing behind it
  changes.
- a player links to a (provider, subject) pair. the first external login
  runs the register saga, then asks for a handle. the first-login call
  to action already exists for the ship name.
- google and github accept a localhost callback, so they can start
  before 4.9. apple needs https on a real domain, so it waits for 4.9.
- github speaks oauth 2, not openid connect. it needs its own path.
- handle and password stay, for development and the sim.

open call: a library (`openid-client`), or a small flow over
`garage/sync`.


### step 4.11 - the admin board v1

phase 3's "seed data is code" splits the powers:

| what | how it changes |
|------|----------------|
| the universe - systems, stations, goods, modules | a commit, a review, a deploy. the board shows it and does not edit it |
| the tunables - TIME_SCALE, STARTER_CREDITS, INTEREST_RATE, spread, drift | live, from the board |

v1:
- the sim report and the read models. `packages/sim/src/analytics.js`
  is written for the board.
- live tunables: a table and a `tunables.changed` event. today `readEnv`
  reads each tunable once, at import. 4.1 already moves that read into
  the services.
- the admin ops that [permissions.md](permissions.md) left for later:
  credit a wallet, restock a station.

open call: the board as a page in the frontend repo, or its own app.


### step 4.12 - spike: one schema for the wire

the question under "protobuf!": the painted client writes its own
validators for every payload (`frontend/src/core/transport/validate.ts`,
268 lines). `@theseus/contracts` validates the same shapes on the
server. 2 copies drift.

compare 3 answers, and write the decision here:

1. **protobuf at the edge**, the gateway and the client: binary on the
   ws feed, and generated types for both sides.
2. **json schema from `@theseus/contracts`**: the client generates its
   validators and types, and the wire stays json.
3. **nothing**: 2 copies, and a test that compares them.

measure first: the bytes per route after 4.2, and the lines of duplicate
validation. kafka and the event log stay json. a new encoding there
changes how every past event reads, and a projection rebuild reads them
all.

the output is a decision, not code.


the client
------------------------------------------------

the painted client is phase 4's client: lit, three.js, 3D stations and
ships in a painted look. it lives in the frontend repo, branch
`painted-art`. its plan is [architecture.client.md](../../docs/architecture.client.md).

it waits on 3.7 (the manifest), 4.1 (positions) and 4.2 (traffic). the
port operations of the old scraps - robots and cargo on the deck - are
client work, and they have started.


any time
------------------------------------------------

small debt with no step. a free session takes it.

- `using` and `Symbol.dispose` for `withClient` in
  `packages/db/src/query.js`
- tech.debt.md's "no station sells an ansible" is stale: `sirius.gate`
  and `lalande.qeng` stock `ansible.mk1`.


explicitly out (phase 5+)
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
