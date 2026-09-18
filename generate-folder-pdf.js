const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { marked } = require('marked');

async function generatePdf(mdSourcePath, pdfOutputPath, docTitle, docSubtitle, badgeText) {
  console.log(`Reading ${path.basename(mdSourcePath)}...`);
  if (!fs.existsSync(mdSourcePath)) {
    throw new Error('Source .md not found at ' + mdSourcePath);
  }
  const markdownText = fs.readFileSync(mdSourcePath, 'utf8');

  const renderer = new marked.Renderer();
  const origCode = renderer.code.bind(renderer);

  renderer.code = function(token) {
    const code = typeof token === 'object' ? token.text : token;
    const lang = typeof token === 'object' ? token.lang : arguments[1];
    if (lang === 'mermaid') {
      return `<div class="mermaid-container"><div class="mermaid">${code}</div></div>`;
    }
    return origCode(token);
  };

  renderer.heading = function(token) {
    const text = typeof token === 'object' ? token.text : token;
    const level = typeof token === 'object' ? token.depth : arguments[1];
    if (level === 2 && /^[🟢⚛️🗄️🧪📁]/.test(text.trim())) {
      return `<h2 class="major-chapter" id="${encodeURIComponent(text.trim())}">${text}</h2>`;
    }
    return `<h${level}>${text}</h${level}>`;
  };

  marked.setOptions({ renderer, gfm: true, breaks: true });
  const contentHtml = marked.parse(markdownText);

  const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @page { size: A4 portrait; margin: 14mm 14mm 16mm 14mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10.5pt; line-height: 1.6; color: #1e293b; background: #ffffff; margin: 0; padding: 0;
    }

    .doc-header-main {
      border-bottom: 2.5px solid #0ea5e9;
      padding-bottom: 12px; margin-bottom: 20px;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .doc-title-main {
      font-family: 'Prompt', sans-serif; font-size: 14pt; font-weight: 700;
      color: #0c4a6e; line-height: 1.3;
    }
    .doc-subtitle-main {
      font-family: 'Prompt', sans-serif; font-size: 10pt;
      color: #0ea5e9; font-weight: 600; margin-top: 4px;
    }
    .meta-badge {
      font-family: 'Prompt', sans-serif; font-size: 8.5pt;
      background: #e0f2fe; color: #0369a1;
      padding: 3px 10px; border-radius: 9999px; font-weight: 600; border: 1px solid #bae6fd;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Prompt', sans-serif; color: #0f172a;
      margin-top: 18px; margin-bottom: 7px; line-height: 1.35;
      page-break-after: avoid !important; break-after: avoid !important;
    }
    h1 {
      font-size: 15pt; color: #0c4a6e;
      border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0;
    }
    h2.major-chapter {
      font-size: 13pt; color: #075985;
      border-left: 5px solid #0ea5e9; padding-left: 10px;
      background: #f0f9ff; padding-top: 5px; padding-bottom: 5px;
      border-radius: 0 6px 6px 0; margin-top: 24px;
      page-break-before: always !important; break-before: page !important;
    }
    h2 { font-size: 13pt; color: #1e293b; }
    h3 { font-size: 11.5pt; color: #334155; margin-top: 14px; }
    h4 { font-size: 10.5pt; color: #475569; margin-top: 10px; }

    blockquote {
      margin: 8px 0; padding: 7px 12px;
      background: #f0f9ff; border-left: 4px solid #0ea5e9;
      border-radius: 0 6px 6px 0; color: #334155; font-size: 10pt;
      page-break-inside: avoid; break-inside: avoid;
    }

    table {
      width: 100%; border-collapse: collapse;
      margin: 10px 0; font-size: 9pt;
      page-break-inside: auto; break-inside: auto;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th {
      background: #e0f2fe; color: #0c4a6e;
      font-family: 'Prompt', sans-serif; font-weight: 600;
      padding: 5px 8px; border: 1px solid #bae6fd; text-align: left;
    }
    td { padding: 4px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background-color: #f8fafc; }

    code {
      font-family: 'Fira Code', Consolas, monospace; font-size: 8pt;
      background-color: #f1f5f9; color: #0369a1;
      padding: 1.5px 4px; border-radius: 3px; border: 1px solid #e2e8f0;
    }
    pre {
      background: #0f172a; color: #f8fafc;
      padding: 9px 12px; border-radius: 6px; overflow-x: auto;
      font-family: 'Fira Code', Consolas, monospace; font-size: 8pt;
      line-height: 1.45; page-break-inside: avoid; break-inside: avoid;
      margin: 8px 0; border: 1px solid #334155; white-space: pre-wrap; word-break: break-word;
    }
    pre code { background: transparent; color: inherit; padding: 0; border: none; font-size: 8pt; }

    .mermaid-container {
      margin: 12px auto; padding: 10px;
      background: #f8fafc; border: 1px solid #cbd5e1;
      border-radius: 8px; text-align: center;
      page-break-inside: avoid; break-inside: avoid;
    }
    .mermaid { display: flex; justify-content: center; align-items: center; width: 100%; }
    .mermaid svg { width: 100% !important; max-width: 100% !important; height: auto !important; }

    hr { border: none; height: 1px; background: #e2e8f0; margin: 14px 0; }
    ul, ol { margin: 5px 0 8px 0; padding-left: 18px; }
    li { margin-bottom: 2px; }
    a { color: #0369a1; text-decoration: none; }
    p, li { orphans: 3; widows: 3; }
  </style>
</head>
<body>
  <div class="doc-header-main">
    <div>
      <div class="doc-title-main">มหาวิทยาลัยราชภัฏบุรีรัมย์ — BRU Strategic Tracking System</div>
      <div class="doc-subtitle-main">${docSubtitle}</div>
    </div>
    <div style="text-align: right;">
      <span class="meta-badge">${badgeText}</span>
      <div style="font-size: 8pt; color: #64748b; margin-top: 4px;">ฉบับสมบูรณ์</div>
    </div>
  </div>

  <div class="content-body">
    ${contentHtml}
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', async () => {
      try {
        mermaid.initialize({
          startOnLoad: false, theme: 'default', securityLevel: 'loose',
          fontFamily: 'Prompt, Sarabun, sans-serif', fontSize: 11,
          themeVariables: {
            primaryColor: '#e0f2fe', primaryTextColor: '#0c4a6e',
            primaryBorderColor: '#0ea5e9', lineColor: '#0369a1',
            secondaryColor: '#f1f5f9', tertiaryColor: '#f0f9ff', fontSize: '11px'
          },
          graph: { useMaxWidth: true }
        });
        await mermaid.run();
        document.querySelectorAll('.mermaid svg').forEach(svg => {
          svg.removeAttribute('height');
          svg.style.width = '100%'; svg.style.maxWidth = '100%'; svg.style.height = 'auto';
        });
      } catch (err) {
        console.error('Mermaid render error:', err);
      } finally {
        window.__MERMAID_DONE__ = true;
      }
    });
  </script>
</body>
</html>`;

  const tempHtmlPath = mdSourcePath.replace(/\.md$/, '_temp.html');
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  let executablePath = '';
  for (const p of chromePaths) {
    if (fs.existsSync(p)) { executablePath = p; break; }
  }
  if (!executablePath) throw new Error('No Chrome or Edge browser found.');

  console.log('Launching browser:', executablePath);
  const browser = await puppeteer.launch({
    executablePath, headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--font-render-hinting=max']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1800, deviceScaleFactor: 2 });

  console.log('Loading HTML...');
  await page.goto('file://' + tempHtmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0', timeout: 60000
  });

  console.log('Waiting for Mermaid & Fonts...');
  await page.waitForFunction(() => window.__MERMAID_DONE__ === true, { timeout: 30000 });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Printing to PDF:', pdfOutputPath);
  await page.pdf({
    path: pdfOutputPath, format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '16mm', left: '14mm', right: '14mm' },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-family:'Prompt','Sarabun',sans-serif;font-size:8px;width:100%;text-align:right;padding-right:14mm;color:#64748b;">
      มหาวิทยาลัยราชภัฏบุรีรัมย์ | BRU Strategic Tracking System
    </div>`,
    footerTemplate: `<div style="font-family:'Prompt','Sarabun',sans-serif;font-size:8px;width:100%;display:flex;justify-content:space-between;padding:0 14mm;color:#64748b;">
      <span>${docSubtitle}</span>
      <span>หน้า <span class="pageNumber"></span> จาก <span class="totalPages"></span></span>
    </div>`
  });

  await browser.close();
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
  console.log('✅ PDF saved:', pdfOutputPath);
}

async function main() {
  const root = __dirname;

  // ─── 1. Folder Structure PDF ──────────────────────────────────────────────
  const folderMd = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\09b61a25-f3e1-4cc6-9fa3-7a97a517aef2\\folder_structure.md';
  const folderPdf = path.join(root, 'folder_structure.pdf');
  await generatePdf(
    folderMd,
    folderPdf,
    'คู่มือโครงสร้างโฟลเดอร์และการทำงานของระบบ',
    'อธิบายโฟลเดอร์ทั้งหมด พร้อมหน้าตาการทำงาน (Folder Structure & How It Works)',
    'โครงสร้างระบบ'
  );

  // ─── 2. Code Presentation PDF ────────────────────────────────────────────
  const codeMd = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\09b61a25-f3e1-4cc6-9fa3-7a97a517aef2\\presentation_code_explained.md';
  const codePdf = path.join(root, 'presentation_code_explained.pdf');
  await generatePdf(
    codeMd,
    codePdf,
    'ชุดข้อมูลนำเสนอโค้ดระบบ',
    'ชุดข้อมูลนำเสนอการทำงานโค้ด (Code Walkthrough Presentation Guide)',
    'นำเสนอโค้ด'
  );

  console.log('\n🎉 All PDFs generated successfully!');
  console.log('   📄', folderPdf);
  console.log('   📄', codePdf);
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
