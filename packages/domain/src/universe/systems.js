// @ts-check

/*
    the map. this is the only file that content touches.

    star distances are real, in light years, from the HYG catalogue
    (docs/hygdata_v42.csv). an orbit radius is the standard NASA mean,
    in AU. the true distance moves with the planets, so a radius is an
    approximation, and a good one.

    a station carries its radius and nothing else about position. every
    in-system distance is the gap between 2 radii, and index.js does
    that arithmetic - see `lightYears(Math.abs(a.au - b.au))`.

    **the topology stays explicit.** which stations link is a design
    choice, not a consequence of the radii: Venus links to Mars but not
    to the Outpost, though the Outpost is its nearer neighbour. only the
    distance derives.

    a gateway holds the links to the other stars. a system with one
    station is a bare gateway, and it takes the Outpost's own notional
    1.0 AU. a system with more is an inner well.
*/

/** @type { Record<string, import('../../types/universe/model.js').SystemSeed> } */
export const systems = {
    sol: {
        name: 'Sol', star: 'G2V yellow dwarf', gateway: 'sol.outpost',

        orbits: {
            'sol.mercury' : { name: 'Mercury Deep',   au: 0.387, produces: { ore: 10, titanium: 6 }, consumes: { grain: 6, water: 8 }},
            'sol.venus'   : { name: 'Venus Lab',      au: 0.723, produces: { polymer: 8, reagents: 5 }, consumes: { ore: 4, protein: 5 }},
            'sol.outpost' : { name: 'Sol Outpost',    au: 1.000, produces: { ore: 8, electronics: 6 }, consumes: { grain: 5, hydrogen: 6 }, stocks: [ 'reactor.mk1', 'cruise.mk1', 'maneuver.mk1', 'cargo.mk1' ]},
            'sol.mars'    : { name: 'Mars Hub',       au: 1.524, produces: { grain: 7, protein: 6 }, consumes: { spice: 5, chinesium: 7 }},
            'sol.ganymede': { name: 'Ganymede Yards', au: 5.203, produces: { titanium: 7, chips: 4 }, consumes: { 'rare.earth': 3, hydrogen: 8 }, stocks: [ 'reactor.mk2', 'cruise.mk2', 'maneuver.mk2', 'cargo.mk2' ]},
            'sol.titan'   : { name: 'Titan Ring',     au: 9.537, produces: { hydrogen: 9, polymer: 6 }, consumes: { grain: 5, electronics: 4 }},
        },

        links: [
            [ 'sol.outpost',  'sol.mercury'  ],
            [ 'sol.mercury',  'sol.venus'    ],
            [ 'sol.venus',    'sol.mars'     ],
            [ 'sol.mars',     'sol.ganymede' ],
            [ 'sol.mars',     'sol.titan'    ],
            [ 'sol.mars',     'sol.outpost'  ],
            [ 'sol.titan',    'sol.outpost'  ],
            [ 'sol.ganymede', 'sol.titan'    ],
        ],
    },

    'alpha.centauri': {
        name: 'Alpha Centauri', star: 'G2V + K1V binary', gateway: 'alpha.exchange',
        orbits: {
            'alpha.exchange': { name: 'Alpha Exchange', au: 1.0, produces: { grain: 8, trinkets: 9 }, consumes: { spice: 5, livestock: 3 }},
        },
    },

    'barnards.star': {
        name: 'Barnards Star', star: 'M4V red dwarf', gateway: 'barnards.port',

        orbits: {
            'barnards.rama': { name: 'Rama Dock',    au: 0.23, produces: { ore: 7, chinesium: 9 }, consumes: { spice: 5, water: 6 }, stocks: [ 'maneuver.mk1', 'maneuver.mk2' ]},
            'barnards.port': { name: 'Barnards Port', au: 1.00, produces: { spice: 8, liquor: 5 }, consumes: { ore: 5, chips: 3 }},
        },

        links: [
            [ 'barnards.port', 'barnards.rama' ],
        ],
    },

    'wolf.359': {
        name: 'Wolf 359', star: 'M6V red dwarf', gateway: 'wolf.reach',

        orbits: {
            'wolf.reach'  : { name: 'Wolf Reach',  au: 1.00, produces: { grain: 9, water: 7 }, consumes: { ore: 6, optics: 3 }},
            'wolf.solaris': { name: 'Solaris Lab', au: 1.85, produces: { optics: 5, reagents: 4 }, consumes: { grain: 5, chinesium: 6 }, stocks: [ 'reactor.mk1' ]},
        },

        links: [
            [ 'wolf.reach', 'wolf.solaris' ],
        ],
    },

    sirius: {
        name: 'Sirius', star: 'A1V + white dwarf', gateway: 'sirius.gate',

        orbits: {
            'sirius.gate'    : { name: 'Sirius Gate'  , au:  1.0, produces: { ore: 9, chips: 5 }, consumes: { spice: 6, protein: 5 }, stocks: [ 'ansible.mk1' ]},
            'sirius.technora': { name: 'Technora Corp', au: 19.8, produces: { chinesium: 10, titanium: 6 }, consumes: { ore: 5, liquor: 4 }, stocks: [ 'cruise.mk2'  ]},
        },

        links: [
            [ 'sirius.gate', 'sirius.technora' ],
        ],
    },

    ran: {
        name: 'Ran', star: 'K2V orange dwarf', gateway: 'ran.gate',

        orbits: {
            'ran.gate'      : { name: 'Ran Gate',         au:  1.00, produces: { grain: 7, textiles: 8 }, consumes: { ore: 5, mainframe: 2 }},
            'ran.aegir'     : { name: 'Aegir Drift',      au:  3.48, produces: { hydrogen: 10, ore: 9 }, consumes: { grain: 6, electronics: 5 }, stocks: [ 'cargo.mk1', 'cargo.mk2' ]},
            'ran.rorschach' : { name: 'Rorschach Watch',  au: 20.00, produces: { artifacts: 3, spice: 9 }, consumes: { grain: 6, water: 7 }},
        },

        links: [
            [ 'ran.gate',  'ran.aegir'     ],
            [ 'ran.aegir', 'ran.rorschach' ],
            [ 'ran.gate',  'ran.rorschach' ],
        ],
    },

    procyon: {
        name: 'Procyon', star: 'F5IV-V + white dwarf', gateway: 'procyon.gate',

        orbits: {
            'procyon.gate' : { name: 'Procyon Gate',  au:  1.0, produces: { ore: 8, textiles: 6 }, consumes: { spice: 5, reagents: 4 }},
            'procyon.bebop': { name: 'Bebop Docks',   au:  4.2, produces: { electronics: 8, trinkets: 7 }, consumes: { titanium: 5, chinesium: 6 }, stocks: [ 'cruise.mk1', 'maneuver.mk1', 'cargo.mk1' ]},
            'procyon.ember': { name: 'Ember Station', au: 15.0, produces: { 'rare.earth': 4, spice: 10 }, consumes: { grain: 7, water: 6 }, stocks: [ 'reactor.mk2' ]},
        },

        links: [
            [ 'procyon.gate',  'procyon.bebop' ],
            [ 'procyon.bebop', 'procyon.ember' ],
            [ 'procyon.gate',  'procyon.ember' ],
        ],
    },

    lalande: {
        name: 'Lalande 21185', star: 'M2V red dwarf', gateway: 'lalande.gate',

        orbits: {
            'lalande.qeng': { name: 'Qeng Ho Depot', au: 0.30, produces: { mainframe: 2, liquor: 6 }, consumes: { artifacts: 2, chinesium: 5 }, stocks: [ 'ansible.mk1' ]},
            'lalande.gate': { name: 'Lalande Gate',  au: 1.00, produces: { spice: 7, protein: 6 }, consumes: { ore: 4, trinkets: 5 }},
        },

        links: [
            [ 'lalande.gate', 'lalande.qeng' ],
        ],
    },

    'ross.154': {
        name: 'Ross 154', star: 'M3.5Ve flare star', gateway: 'ross.beacon',
        orbits: {
            'ross.beacon': { name: 'Ross Beacon', au: 1.0, produces: { ore: 7, 'rare.earth': 3 }, consumes: { grain: 5, textiles: 5 }},
        },
    },

    'lacaille.9352': {
        name: 'Lacaille 9352', star: 'M2/M3V red dwarf', gateway: 'lacaille.relay',
        orbits: {
            'lacaille.relay': { name: 'Lacaille Relay', au: 1.0, produces: { grain: 6, livestock: 3 }, consumes: { spice: 4, polymer: 5 }},
        },
    },
}

/*
    the star links, in light years, gateway to gateway.

    alpha.exchange stands for Rigil Kentaurus, the G2V star of the Alpha
    Centauri pair - the type closest to Sol's own.

    no gateway reaches every other gateway. Sol does not touch Wolf 359
    or Sirius, so a player flies through Alpha Centauri or through
    Barnards Star. that is a design choice and not a fact about the
    stars: Sol really sits 7.80 ly from Wolf 359, and 8.60 ly from
    Sirius, both in a straight line.

    Sol keeps its 2 links, so the frontier stays behind the hubs. Alpha
    Centauri carries 6 and holds one station - it is a crossroads, not
    a destination. Ran sits in the far corner, through Sirius or
    through Lacaille 9352.
*/
/** @type { [ string, string, number ][] } */
export const stars = [
    [ 'sol.outpost',    'alpha.exchange',   4.32 ],
    [ 'sol.outpost',    'barnards.port',    5.95 ],
    [ 'alpha.exchange', 'barnards.port',    6.44 ],
    [ 'barnards.port',  'wolf.reach',      10.93 ],
    [ 'alpha.exchange', 'sirius.gate',      9.52 ],
    [ 'alpha.exchange', 'wolf.reach',       8.27 ],
    [ 'wolf.reach',     'sirius.gate',      9.02 ],

    [ 'lalande.gate',   'wolf.reach',       4.06 ],
    [ 'lalande.gate',   'procyon.gate',     9.68 ],
    [ 'procyon.gate',   'sirius.gate',      5.26 ],
    [ 'procyon.gate',   'wolf.reach',       8.66 ],
    [ 'ran.gate',       'sirius.gate',      7.84 ],
    [ 'ran.gate',       'lacaille.relay',  11.49 ],
    [ 'ross.beacon',    'barnards.port',    5.54 ],
    [ 'ross.beacon',    'alpha.exchange',   8.11 ],
    [ 'lacaille.relay', 'ross.beacon',      9.58 ],
    [ 'lacaille.relay', 'alpha.exchange',  10.36 ],
]
