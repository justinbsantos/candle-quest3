/* Builds dist/candle-quest.html: the whole game in ONE file (easy to share / preview). */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, f) => `<style>\n${fs.readFileSync(path.join(root, f), 'utf8')}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n${fs.readFileSync(path.join(root, f), 'utf8').replace(/<\/script/g, '<\\/script')}\n</script>`);
html = html.replace('<body>', '<body>\n  <script>window.CQ_SINGLE_FILE = true;</script>');
html = html.replace(/\s*<link rel="manifest"[^>]*>/, '').replace(/\s*<link rel="(apple-touch-)?icon"[^>]*>/g, '');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'candle-quest.html'), html);
// Artifact variant: body content only (the host supplies doctype/head/body).
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1].replace(/\s*<meta[^>]*>/g, '');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
fs.writeFileSync(path.join(root, 'dist', 'candle-quest.artifact.html'), head.trim() + '\n' + body.trim() + '\n');
console.log('Built dist/candle-quest.html (' + Math.round(html.length / 1024) + ' KB)');
