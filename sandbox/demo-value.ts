import { normalizeStaticValue } from 'platejs';

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
]);

