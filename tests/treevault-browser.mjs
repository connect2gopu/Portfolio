// Optional browser acceptance run against the existing local dev server.
// TREEVAULT_PLAYWRIGHT_MODULE can point to an external Playwright installation.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.TREEVAULT_PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TREEVAULT_TEST_URL || 'http://localhost:3015';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('dialog', dialog => dialog.accept());
const snapshot = () => page.evaluate(async () => (await fetch('/api/tools/treevault/workspace')).json());
const waitSaved = async () => { await page.getByRole('button', { name: 'Save revision', exact: true }).click(); await page.getByRole('status').filter({ hasText: /^Revision saved/ }).waitFor(); };
try {
  for (const path of ['/', '/about', '/projects', '/blog', '/tools/shareit', '/tools/treevault']) {
    const response = await page.goto(base + path); assert.equal(response.status(), 200, path);
  }
  await page.getByRole('heading', { name: 'Current workspace' }).waitFor();
  assert.equal((await snapshot()).fixture, true, 'Browser acceptance requires an ephemeral fixture.');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.getByLabel('Paste a nested Markdown outline').fill('- [ ] Location — #1968\n  - [x] approval — got\n  - [ ] Look for app based solution\n    - [ ] Our own app or 3rd party\n- [ ] credit debit — #1969\n  - [ ] started working\n    - [ ] Credit note sync done\n      - [ ] Get reviewed from Vineet\n- Lambda SSM Caching\n  - [ ] Explore [AWS documentation](https://docs.aws.amazon.com/systems-manager/)');
  await page.getByRole('button', { name: 'Import as draft' }).click();
  await waitSaved(); const first = await snapshot();
  const inputs = page.getByRole('textbox', { name: 'Node Markdown', exact: true });
  await inputs.filter({ hasText: 'Get reviewed from Vineet' }).fill('Reviewed by Vineet — 2 changes requested');
  await inputs.filter({ hasText: 'Reviewed by Vineet' }).press('Shift+Tab'); // move one level out
  await inputs.filter({ hasText: 'Reviewed by Vineet' }).press('Enter');
  await page.locator('textarea[data-node-id]').filter({ hasText: /^$/ }).fill('Fix requested change 1');
  await page.getByRole('checkbox', { name: 'Complete Location — #1968', exact: true }).check();
  assert.equal(await page.getByRole('checkbox', { name: 'Complete Look for app based solution', exact: true }).isChecked(), false);
  await waitSaved(); const second = await snapshot();
  await page.reload(); await page.getByRole('heading', { name: 'Current workspace' }).waitFor();
  assert.equal(await page.getByRole('textbox', { name: 'Node Markdown', exact: true }).filter({ hasText: 'Fix requested change 1' }).count(), 1);
  await fs.mkdir('docs/treevault/screenshots', { recursive: true });
  await page.screenshot({ path: 'docs/treevault/screenshots/today.png', fullPage: true });
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.getByRole('combobox', { name: 'Or select an immutable revision' }).selectOption(first.revision);
  await page.getByText('Read-only · Resolved to').waitFor();
  assert.equal(await page.getByRole('textbox', { name: 'Node Markdown', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Checkpoint', exact: true }).count(), 0);
  assert.equal(await page.getByText('Get reviewed from Vineet', { exact: true }).count(), 1);
  assert.equal((await snapshot()).revision, second.revision);
  await page.getByRole('button', { name: 'View date', exact: true }).click();
  await page.getByText('Recorded on the selected day.', { exact: true }).waitFor();
  await page.screenshot({ path: 'docs/treevault/screenshots/history.png', fullPage: true });
  await page.getByRole('button', { name: 'Compare', exact: true }).first().click();
  await page.getByRole('combobox', { name: 'From revision' }).selectOption(first.revision);
  await page.getByRole('combobox', { name: 'To revision' }).selectOption(second.revision);
  await page.getByRole('button', { name: 'Compare', exact: true }).last().click();
  await page.getByText('Moved / reparented', { exact: true }).first().waitFor();
  assert.ok(await page.getByText('Checkbox changed', { exact: true }).count());
  assert.ok(await page.getByText('Text edited', { exact: true }).count());
  await page.screenshot({ path: 'docs/treevault/screenshots/compare.png', fullPage: true });
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  // Two browser pages loaded at the same commit: second writer must retain its draft.
  const other = await context.newPage(); await other.goto(base + '/tools/treevault');
  await other.getByRole('heading', { name: 'Current workspace' }).waitFor();
  await page.getByRole('textbox', { name: 'Node Markdown', exact: true }).first().fill('Location — saved in tab A'); await waitSaved();
  await other.getByRole('textbox', { name: 'Node Markdown', exact: true }).first().fill('Location — unsaved in tab B');
  await other.getByRole('button', { name: 'Save revision', exact: true }).click();
  await other.getByRole('alert').filter({ hasText: 'Another edit' }).waitFor();
  assert.equal(await other.getByRole('textbox', { name: 'Node Markdown', exact: true }).first().inputValue(), 'Location — unsaved in tab B');
  assert.equal(await other.getByRole('button', { name: 'Export draft' }).count(), 1); await other.close();
  // Literal HTML and unsafe protocols never become executable DOM.
  await page.getByRole('textbox', { name: 'Node Markdown', exact: true }).first().fill('<img src=x onerror="window.treevaultXss=1"> [bad](javascript:alert(1))');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  assert.equal(await page.locator('a[href^="javascript:"]').count(), 0);
  assert.equal(await page.evaluate(() => window.treevaultXss), undefined);
  assert.equal(await page.locator('img[src="x"]').count(), 0);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Discard draft and reload latest' }).click();
  await page.getByRole('textbox', { name: 'Node Markdown', exact: true }).first().filter({ hasText: 'Location — saved in tab A' }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/treevault/screenshots/mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('Browser acceptance passed: existing routes, import, deep edit/move/add, independent checkbox, save/reload, full history/date, contextual diff, stale tab conflict, XSS and mobile overflow.');
} finally { await browser.close(); }
