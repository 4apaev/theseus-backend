tech debt
================

### game save

what about a game save?
every player action is saved by default.
rebuild state is present.

let's say player want to save game before some
dangerous maneuver then load game from safe checkpoint.
how does one implement such a thing?


### no station sells an ansible

`ansible.mk1` is the only module in the catalogue that no station
stocks. `sol.outpost` sells the mk1 line, `sol.ganymede` the mk2 line,
and neither lists it.

every starter ship carries one in `utility1` (`starterRig` in
`packages/domain/src/universe.js`), so the ansible works - once. remove
it and it drops into the hold. sell it and it is gone for good, because
there is nowhere to buy another.

a one way door on a phase 3 feature. the fix is one entry in a station's
`stocks`.


### ship's traits

ship's personal traits / characteristic

slightly randomize ship's traits
velocity, acceleration, etc


debt
----------------

### JSDoc (highest priority)

update types & add jsdoc to everything


### service createHandlers otgrow

it's time to make a class of it.
can be extension of pkg/service
can use couple of helper methods like Outbox.write,
to reduce scaffolds & for general readability.


### player service

better checking mechanism `isAdmin(handle)`


### gateway

#### next api version

`/api` is v0 - the routes as they stand. a breaking change gets
`/api/v1` beside it, and the 2 live together until the client moves.

see [progress](progress.md)'s "gateway routes - /api, resources, real
methods" for the convention the current paths follow.

<details>
<summary>DB</summary>


#### ✔ inbox and outbox never pruned - fixed ✔

`npm run db:prune` clears published outbox rows and old inbox rows across
every schema. 7 days by default, `PRUNE_DAYS` to change it. the 2 tables
were 59% of the database's growth. cron it.


#### db backups

probably after deploy phase is ready


#### query registry

create global query registry in `@theseus/db`.
add compile phase for caching, and to avoid duplicates.
unify all query styles for consistency.

#### extract `sql` to `queries.js`
unified `reject`. almost any func in service/src/handlers defines own `reject`

affected services:
- market


#### diagrams

- annotated diagrams of tables + comments on every field
- annotated diagrams of system wide layout

#### query builder

[knex](https://knexjs.org/guide/query-builder.html#knex)

construct and cache queries
pre compile & use cached queries in run time
add prestart phase when queries compiled

```js

  class Q {
    constructor(...a) {
      this.argv = a
      // proxy to handle chain calls
      return new Proxy(this, {
        has(trg, k, px) { return px },
        get(trg, k, px) { return px },
        set(trg, k, px) { return px },
      })
    }

    key()    ; omit()
    select() ; insert() ; update() ; create()
    into()   ; from()   ; join()   ; using()
    case()   ; when()   ; then()   ; where()
    limit()  ; values() ; order()  ; conflict()
    on()     ; and()    ; as()     ; by()
    do()     ; or()     ; for()    ; set()

    ...

    static types = {
      bol: Symbol('boolean'), num: Symbol('num'), obj : Symbol('jsonb'),
      txt: Symbol('text')   , int: Symbol('int'), date: Symbol('timestamp'),

      pk  : Symbol('primary key'), uniq : Symbol('unique')  ,
      ref : Symbol('references') , nnl : Symbol('not null'),

      get now() { return new Date },
      def(x) { return `default ${ x }` },
    }

    static create(...a) { return Reflect.construct(this, [ 'create', ...a ]) }
    static select(...a) { return Reflect.construct(this, [ 'select', ...a ]) }
    static insert(...a) { return Reflect.construct(this, [ 'insert', ...a ]) }
    static update(...a) { return Reflect.construct(this, [ 'update', ...a ]) }
    ...
  }

  function Q() {
    return new QBuild
  }

  const T = QBuild.types

  Q.create('ships', {
    sid     : [ T.txt, T.pk ],
    pid     : [ T.txt, T.nn, T.uniq ],
    stid    : T.txt,
    status  : [ T.txt, T.nn, T.def('docked') ],
    ansible : [ T.bool, T.nn, T.def(false)    ]
  })

  Q.table('ships')
    .key('sid').txt.pk
    .key('pid').txt.nnl.unq
    .key('stid').txt
    .key('status').txt.nnl.def('docked')
    .key('ansible').bol.nnl.def(false)


  Q.table.ships
    .sid.txt.pk
    .pid.txt.nnl.unq
    .stid.txt
    .status.txt.nnl.def.docked
    .ansible.bol.nnl.def.false

  Q.select('fm.slot', 'fm.gid')
    .from('fitted_modules', 'fm')
    .join('ships' 's')
    .using('sid')
    .where('fm.sid', sid)
    .and('s.pid', pid)
    .order('fm.slot')


  Q.select
    .from('ships')
    .omit('ansible')
    .order
      .desc('departed)
    .where('sid', 'xxxx')
    .and({ pid: 'yyyy' })
```


### assertations mess

there is a banch of wild assertations accros the code base.

move all of them to one place, under `@theseus/util`
a `field` from contracts and others


extend `Is` from utils:

- `Is.n.positive`
- `Is.N.positive`
- `Is.not.s.empty`
- etc...

add `dig` function so Is.not can access deep methods:

add a new `Proxy` as in `Is.not` - `Is.assrt`,
so each `Is` method can be invoked with: `Is.assrt.{ method }(...)`
```js

function dig(ctx, path, flbck) {
  return path.split('.').every(k => Is(ctx = ctx[ k ])) ? ctx : flbck
}

dig({ a: { b: { c: { d: 42 }}}}, 'a.b.c.d') // -> 42

Is.assrt = new Proxy(Is, { get: (f, k) => (...a) => Fail.ok(f[ dig(f, k) ](...a)) })
Is.not = new Proxy(Is, { get: (f, k)    => (...a) => !f[ dig(f, k) ](...a) })
```

add calc - so assertation can be invoked by:
```js
export function calc(...a) {
  const [ opr, ...alias ] = String.raw(...a).match(/\S+/g)
  const fn = new Function(`a, b`, `return a ${ opr } b`)

  fn.all = (head, ...tail) => tail.reduce(fn, head)

  calc.operators ??= O.o
  calc.operators[ opr ] = fn

  for (let k of alias) calc.operators[ k ] = fn
  return fn
}

calc`eq     == `, calc`noteq  != `
calc`eql    ===`, calc`noteql !==`
calc`gt     >  `, calc`lt     <  `
calc`gte    >= `, calc`lte    <= `
calc`sum    +  `, calc`mul    *  `
calc`sub    -  `, calc`div    /  `
calc`pow    ** `, calc`or  |`, calc`OR  ||`
calc`mod    %  `, calc`and &`, calc`AND &&`

calc.assrt(1, '<=', 2), calc.eq(1, '1')
calc.assrt(1, '|', 2) , calc.eql(1, '1')
```


</details>


<details>
<summary>infra</summary>


#### git modules

parent dir submodules

```conf

[submodule "backend"]
  path = packages/auth
  url = git@github.com:4apaev/theseus.git

[submodule "frontend"]
  path = packages/auth
  url = git@github.com:4apaev/theseus-front.git

```

#### db

to avoid conflicts when branch switching,
create dedicated db per branch (on demand, not auto).
in case when branch alters/changes db structure,
create a branch specific dbs.
see `ship-upgrades` vs `ship-modules` branch conflicts

#### deploy

see [deploy.md](../../docs/deploy.md) - what has to run, the gaps that block it,
how much data each player base makes, and what the cloud charges.

dockerize the game. need a real plan for this.
uptime check is a dev tool, not a production health check,
when this step lands, will be replaced with systemd/container-native
health check

#### logger

introduce logger.
can be part of `packages/service`


#### observability

add monitoring tools.
logs query, grafana, prometheus (or equivalent).
need some research: today de facto standard?, alternatives?, configs & costs?


#### ✔ load tests

see how theseus behaves under load - [sim.md](sim.md)

tasks:

1. give app.js its own client/qa.html

2. create 10-20 players and run a simulation.
  buy, sell, refit modules, send messges, etc.
  full game capabilities.

3. then collect analytics from db and kafka.
  see wich is more common than the others.
  maybe expose a bottleneck or a bug god forbid.

</details>



nice to have
----------------

- a mechanism to add new game assets
- implement db connection and query with new `using` and `Symbol.dispose` API
    - [explicit-resource-management](https://v8.dev/features/explicit-resource-management)
    - [using keyword](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using)
    - fits `packages/db/src/query.js`'s `withClient` only - `withTransaction`
      and `migrate.js` branch on commit vs rollback, not plain cleanup
    - **deferred to phase 4** - see [phase.4.md](phase.4.md) tech debt
