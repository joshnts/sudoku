// Bundles index.html + css + js into a single self-contained HTML file (dist/sudoku.html)
// and an Artifact-ready fragment (dist/sudoku-artifact.html, no doctype/html/head/body).
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let html = read('index.html');
const css = read('css/style.css');
const js = ['js/sudoku.js', 'js/db.js', 'js/app.js'].map(read).join('\n;\n')
  .replace("navigator.serviceWorker.register('sw.js')", 'Promise.resolve()'); // single file: no service worker
const iconSvg = read('icons/icon.svg');
const iconData = 'data:image/svg+xml;base64,' + Buffer.from(iconSvg).toString('base64');

html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>');
html = html.replace(/<script src="js\/[^"]+"><\/script>\s*/g, '');
html = html.replace('</body>', '<script>\n' + js.replace(/<\/script>/g, '<\/script>') + '\n</script>\n</body>');
html = html.replace('<link rel="manifest" href="manifest.webmanifest">\n', '');
html = html.replace('href="icons/icon.svg"', 'href="' + iconData + '"');
html = html.replace('<link rel="apple-touch-icon" href="icons/icon-192.png">\n', '');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/sudoku.html'), html);

// Artifact fragment: strip the document skeleton, keep <title>, <style>, body content and scripts.
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
const head = headMatch[1].replace(/<meta[^>]*>\s*/g, '').replace(/<link[^>]*>\s*/g, '').trim();
const fragment = head + '\n' + bodyMatch[1].trim() + '\n';
fs.writeFileSync(path.join(root, 'dist/sudoku-artifact.html'), fragment);
console.log('dist/sudoku.html', (html.length / 1024).toFixed(1), 'KB; fragment', (fragment.length / 1024).toFixed(1), 'KB');
