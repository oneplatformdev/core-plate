import { normalizeStaticValue } from 'platejs';

const filler = (n: number) =>
  Array.from({ length: n }, (_, index) => ({
    children: [
      {
        text: `Filler paragraph ${index + 1} — scroll past this to check that the table floating toolbar stays anchored to the table.`,
      },
    ],
    type: 'p',
  }));

const cell = (text: string, isHeader = false) => ({
  children: [{ children: [{ text }], type: 'p' }],
  type: isHeader ? 'th' : 'td',
});

// Deliberately taller than the viewport and wider than the editor column: the
// height is what makes the floating toolbar's anchoring visible (it has to
// track the caret, not sit at the table's far edge), and the width is what
// makes the "expand" affordance appear so the fullscreen modal is reachable.
const COLUMN_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const demoTable = {
  children: [
    {
      children: COLUMN_LABELS.map((label) => cell(`Header ${label}`, true)),
      type: 'tr',
    },
    ...Array.from({ length: 24 }, (_, rowIndex) => ({
      children: COLUMN_LABELS.map((label) => cell(`${label}${rowIndex + 1}`)),
      type: 'tr',
    })),
  ],
  type: 'table',
};

export const demoValue = normalizeStaticValue([
  {
    children: [{ text: 'Core Plate v2 sandbox' }],
    type: 'h1',
  },
  {
    children: [{ text: 'Select this text and check the floating toolbar.' }],
    type: 'p',
  },
  {
    children: [{ text: 'Type here to verify input latency in the exported package.' }],
    type: 'p',
  },
  ...filler(10),
  demoTable,
  ...filler(20),
]);
