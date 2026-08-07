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

const demoTable = {
  children: [
    {
      children: [cell('Header A', true), cell('Header B', true), cell('Header C', true)],
      type: 'tr',
    },
    {
      children: [cell('A1'), cell('B1'), cell('C1')],
      type: 'tr',
    },
    {
      children: [cell('A2'), cell('B2'), cell('C2')],
      type: 'tr',
    },
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
