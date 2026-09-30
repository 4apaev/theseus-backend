// @ts-check

import { nil } from '@theseus/util'

/*
    the commodities. a module is a good too, and its row lives in
    modules.js beside the design - Design extends Good, so one seed row
    carries the trade half and the fitting half together.

    `form` is how a hold must carry it, and `category` is what it is.
    the 2 are not the same axis: grain and gene stock are both food,
    and one rides in a dry hold while the other needs life support.
    nothing reads `form` yet - see game.md, "the hauling classes".
*/

/** @type { Record<string, import('../../types/universe/model.js').GoodSeed> } */
export const goods = nil({
    // ── bulk, cheap, and heavy ───────────────────────────────
    water      : { name: 'potable water'   , price_base:  12, elasticity: 0.8, volume: 1, form: 'liquid' , category: 'food'     },
    trinkets   : { name: 'mass trinkets'   , price_base:  15, elasticity: 0.9, volume: 1, form: 'dry'    , category: 'consumer' },
    chinesium  : { name: 'chinesium alloy' , price_base:  18, elasticity: 1.8, volume: 1, form: 'dry'    , category: 'metal'    },
    textiles   : { name: 'bulk textiles'   , price_base:  22, elasticity: 1.0, volume: 1, form: 'dry'    , category: 'consumer' },
    grain      : { name: 'hydro grain'     , price_base:  25, elasticity: 1.0, volume: 1, form: 'dry'    , category: 'food'     },
    hydrogen   : { name: 'slush hydrogen'  , price_base:  30, elasticity: 1.2, volume: 2, form: 'gas'    , category: 'chemical' },
    protein    : { name: 'vat protein'     , price_base:  35, elasticity: 1.1, volume: 1, form: 'chilled', category: 'food'     },
    ore        : { name: 'iron ore'        , price_base:  40, elasticity: 1.2, volume: 1, form: 'dry'    , category: 'metal'    },
    polymer    : { name: 'feedstock polymer', price_base: 45, elasticity: 1.0, volume: 2, form: 'liquid' , category: 'chemical' },

    // ── the middle of the ladder ─────────────────────────────
    spice      : { name: 'void spice'      , price_base:  90, elasticity: 1.5, volume: 1, form: 'dry'    , category: 'luxury'   },
    electronics: { name: 'cheap electronics', price_base: 95, elasticity: 1.1, volume: 2, form: 'dry'    , category: 'consumer' },
    liquor     : { name: 'station liquor'  , price_base: 130, elasticity: 1.3, volume: 2, form: 'liquid' , category: 'luxury'   },
    livestock  : { name: 'gene stock'      , price_base: 140, elasticity: 1.4, volume: 4, form: 'live'   , category: 'food'     },
    titanium   : { name: 'hull titanium'   , price_base: 180, elasticity: 1.1, volume: 2, form: 'dry'    , category: 'metal'    },

    // ── what a full hold is worth ────────────────────────────
    chips      : { name: 'logic chips'     , price_base: 220, elasticity: 1.2, volume: 1, form: 'dry'    , category: 'tech'     },
    reagents   : { name: 'reactor reagents', price_base: 260, elasticity: 1.3, volume: 2, form: 'liquid' , category: 'chemical' },
    optics     : { name: 'sensor optics'   , price_base: 320, elasticity: 1.2, volume: 2, form: 'dry'    , category: 'tech'     },
    'rare.earth': { name: 'rare earths'    , price_base: 400, elasticity: 1.6, volume: 1, form: 'dry'    , category: 'metal'    },
    artifacts  : { name: 'relic artifacts' , price_base: 600, elasticity: 1.9, volume: 2, form: 'dry'    , category: 'luxury'   },
    mainframe  : { name: 'colony mainframe', price_base: 900, elasticity: 1.1, volume: 8, form: 'dry'    , category: 'tech'     },
})
