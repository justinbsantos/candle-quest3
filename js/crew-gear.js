/* Equipment for the painted crew. Faces are fixed. Slots never change a fill. */
(function (G) {
  'use strict';
  const GEAR = {
    lane: [['field', 'Field', 0], ['studio', 'Studio', 0]],
    head: [['cap', 'Cap', 0], ['beanie', 'Beanie', 300], ['none', 'No cap', 0]],
    ears: [['none', 'None', 0], ['phones', 'Headphones', 300]],
    tool: [['roll', 'Chart roll', 0], ['tablet', 'Tablet', 500]],
    patch: [['flame', 'Flame patch', 0], ['none', 'No patch', 0]]
  };
  G.CQCrewGear = { GEAR };
})(window);
