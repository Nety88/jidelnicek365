import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testDirectory, '..');

function repositoryPath(relativePath) {
  const absolutePath = resolve(repositoryRoot, relativePath);
  assert.ok(
    absolutePath === repositoryRoot || absolutePath.startsWith(`${repositoryRoot}${sep}`),
    `Test path must stay inside the repository: ${relativePath}`,
  );
  return absolutePath;
}

const indexPath = repositoryPath('index.html');
const indexExists = existsSync(indexPath);
const indexHtml = indexExists ? readFileSync(indexPath, 'utf8') : '';
const visibleIndexText = indexHtml
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
  .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const robotsMetaTag = (indexHtml.match(/<meta\b[^>]*>/gi) ?? []).find((tag) =>
  /\bname\s*=\s*["']robots["']/i.test(tag),
);
const robotsMetaContent =
  robotsMetaTag?.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';

const linkedTargets = [...indexHtml.matchAll(/\b(?:href|action)\s*=\s*["']([^"']+)["']/gi)].map(
  (match) => match[1],
);

const robotsPath = repositoryPath('robots.txt');
const robotsExists = existsSync(robotsPath);
const robotsText = robotsExists ? readFileSync(robotsPath, 'utf8') : '';

test('root index.html exists', () => {
  assert.ok(indexExists, 'The public root index.html must exist');
});

test('index.html contains the neutral holding copy', () => {
  assert.ok(
    visibleIndexText.includes('Jídelníček365 připravujeme'),
    'Visible index copy must contain “Jídelníček365 připravujeme”',
  );
});

test('index.html says the service is not publicly available yet', () => {
  assert.match(
    visibleIndexText,
    /služba\s+zatím\s+není\s+veřejně\s+dostupná/iu,
    'Visible index copy must clearly say “Služba zatím není veřejně dostupná”',
  );
});

test('index.html declares a robots meta policy', () => {
  assert.ok(robotsMetaTag, 'index.html must contain <meta name="robots" ...>');
});

test('index.html robots meta contains noindex', () => {
  assert.match(robotsMetaContent, /(?:^|,)\s*noindex\s*(?:,|$)/i);
});

test('index.html robots meta contains nofollow', () => {
  assert.match(robotsMetaContent, /(?:^|,)\s*nofollow\s*(?:,|$)/i);
});

test('index.html robots meta contains noarchive', () => {
  assert.match(robotsMetaContent, /(?:^|,)\s*noarchive\s*(?:,|$)/i);
});

test('index.html contains no artificial-intelligence copy', () => {
  assert.doesNotMatch(
    visibleIndexText,
    /uměl(?:á|é|ou)\s+inteligenc(?:e|i)/iu,
    'Visible index copy must not mention artificial intelligence',
  );
  assert.doesNotMatch(
    visibleIndexText,
    /\bAI\b/iu,
    'Visible index copy must not use AI marketing copy',
  );
});

test('index.html contains no product promises', () => {
  assert.doesNotMatch(
    visibleIndexText,
    /(?:chytr[éeý]\s+jídelníčk\w*|jídelníčk\w*\s+na\s+míru|personalizovan\w*)/iu,
    'The holding page must not promise a personalized or smart-menu product',
  );
});

test('index.html contains no pricing copy', () => {
  assert.doesNotMatch(
    visibleIndexText,
    /(?:\b(?:cena|ceník|předplatné)\b|\b\d+(?:[.,]\d+)?\s*(?:Kč|CZK|EUR)\b|[$€])/iu,
    'The holding page must not contain prices or pricing copy',
  );
});

test('index.html contains no form or checkout copy', () => {
  assert.doesNotMatch(
    visibleIndexText,
    /(?:formul[aá]ř|formular|checkout)/iu,
    'The holding page must not mention a form or checkout',
  );
});

test('index.html does not contain the create-menu CTA', () => {
  assert.doesNotMatch(
    visibleIndexText,
    /Vytvořit\s+můj\s+jídelníček/iu,
    'The public CTA “Vytvořit můj jídelníček” must be absent',
  );
});

test('index.html does not reference /pridan_formular', () => {
  assert.doesNotMatch(
    indexHtml,
    /\/pridan_formular(?:\/|[?#"']|$)/iu,
    'index.html must not reference /pridan_formular',
  );
});

test('index.html does not link to any form or checkout route', () => {
  assert.equal(
    linkedTargets.some((target) =>
      /(?:^|[/_-])(?:pridan[_-]?formular|formular|form|checkout)(?:[/_.?#-]|$)/iu.test(target),
    ),
    false,
    'No href or action may target a form or checkout route',
  );
});

test('index.html contains no form element', () => {
  assert.doesNotMatch(indexHtml, /<form(?:\s|>)/iu, 'index.html must not contain <form>');
});

test('index.html contains no script element', () => {
  assert.doesNotMatch(indexHtml, /<script(?:\s|>)/iu, 'index.html must not contain <script>');
});

test('index.html contains no iframe element', () => {
  assert.doesNotMatch(indexHtml, /<iframe(?:\s|>)/iu, 'index.html must not contain <iframe>');
});

test('index.html contains no external tracker', () => {
  assert.doesNotMatch(
    indexHtml,
    /(?:googletagmanager|google-analytics|gtag\s*\(|fbq\s*\(|connect\.facebook\.net|facebook\.com\/tr|plausible\.io|matomo|hotjar|clarity\.ms|segment\.com|mixpanel|amplitude|tiktok[^\s"']*pixel)/iu,
    'index.html must not contain an external analytics or tracking integration',
  );
  assert.doesNotMatch(
    indexHtml,
    /<(?:img|object|embed)\b[^>]*(?:src|data)\s*=\s*["']https?:\/\//iu,
    'index.html must not contain an external tracking-pixel-capable asset',
  );
});

test('pridan_formular directory does not exist', () => {
  assert.equal(
    existsSync(repositoryPath('pridan_formular')),
    false,
    'The unsafe public pridan_formular directory must be absent',
  );
});

test('root robots.txt exists', () => {
  assert.ok(robotsExists, 'A root robots.txt must exist');
});

test('robots.txt applies to every user agent', () => {
  assert.match(
    robotsText,
    /^\s*User-agent\s*:\s*\*\s*$/im,
    'robots.txt must contain “User-agent: *”',
  );
});

test('robots.txt disallows crawling the whole site', () => {
  assert.match(
    robotsText,
    /^\s*Disallow\s*:\s*\/\s*$/im,
    'robots.txt must contain “Disallow: /”',
  );
});
