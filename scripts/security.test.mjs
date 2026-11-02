import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {pages} from '../pages.mjs';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);

test('CSP allows only local scripts and the exact structured-data hashes', async () => {
  const headers = await readFile(new URL('_headers', output), 'utf8');
  const policy = headers.split('Content-Security-Policy: ')[1].split('\n')[0];
  for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "frame-src 'none'"]) {
    assert(policy.includes(directive), `Missing ${directive}`);
  }
  assert(!policy.includes("'unsafe-inline'"));
  assert(!policy.includes("'unsafe-eval'"));
  for (const page of pages) {
    const file = page.path === '/404.html' ? '404.html' : page.path === '/' ? 'index.html' : page.path.slice(1) + 'index.html';
    const html = await readFile(new URL(file, output), 'utf8');
    const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    for (const [,attributes,code] of inline) {
      if (attributes.includes('src=')) {
        assert(/src="\/[a-z-]+\.js"/.test(attributes), `${page.path}: external script`);
      } else {
        assert(attributes.includes('type="application/ld+json"'));
        const hash = createHash('sha256').update(code).digest('base64');
        assert(policy.includes(`'sha256-${hash}'`), `${page.path}: incorrect structured-data hash`);
      }
    }
    assert(!/\son[a-z]+\s*=/i.test(html), `${page.path}: inline event handler`);
    assert(!/(?:href|src)\s*=\s*['"]\s*javascript:/i.test(html));
    assert(!/<iframe\b/i.test(html), `${page.path}: unexpected embedded frame`);
  }
});

test('runtime rendering does not evaluate scripts or inject HTML strings', async () => {
  for (const file of ['app.js', 'motion.js', 'crate.js']) {
    const source = await readFile(new URL(file, root), 'utf8');
    assert(!/\beval\s*\(|new\s+Function\b|document\.write\s*\(/.test(source), file);
    assert(!/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(/.test(source), file);
    assert(!/import\s*\(?\s*['"]https?:/.test(source), file);
  }
});

test('unsafe build configuration is rejected before changing output', async () => {
  const before = await readFile(new URL('index.html', output), 'utf8');
  for (const siteUrl of ['javascript:alert(1)', 'https://user:password@example.com', 'https://example.com/subpath', 'https://example.com/?tracking=1']) {
    const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
      cwd: fileURLToPath(root), encoding: 'utf8',
      env: {...process.env, SITE_URL: siteUrl, CONTACT_EMAIL: '', WEB3FORMS_ACCESS_KEY: ''},
    });
    assert.notEqual(result.status, 0, `Accepted unsafe SITE_URL ${siteUrl}`);
  }
  const badEmail = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: fileURLToPath(root), encoding: 'utf8',
    env: {...process.env, SITE_URL: 'https://example.com', CONTACT_EMAIL: '\"><script>alert(1)</script>', WEB3FORMS_ACCESS_KEY: ''},
  });
  assert.notEqual(badEmail.status, 0);
  assert.equal(await readFile(new URL('index.html', output), 'utf8'), before);
});
