import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(__dirname, '../../templates/index.html'), 'utf8');

const dom = new JSDOM(html);
global.document = dom.window.document;

describe('index.html', () => {
  it('should have the correct heading', () => {
    const heading = document.querySelector('h1');
    expect(heading.textContent).toBe('🧠 Sovereign Finance Cockpit');
  });
});
