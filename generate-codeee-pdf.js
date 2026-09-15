const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { marked } = require('marked');

async function generateCodeeePdf() {
  console.log('Reading Codeee.md to compile Codeee.pdf...');
  const mdPath = path.join(__dirname, 'Codeee.md');
  if (!fs.existsSync(mdPath)) {
    throw new Error('Codeee.md not found at ' + mdPath);
  }
  const markdownText = fs.readFileSync(mdPath, 'utf8');

  // Custom renderer for marked
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

  // Custom heading renderer to assign specific classes for page breaks
  renderer.heading = function(token) {
    const text = typeof token === 'object' ? token.text : token;
    const level = typeof token === 'object' ? token.depth : arguments[1];
    
    // Check if this is a major numbered heading (e.g. "## 1.", "## 2.", ... "## 10.")
    if (level === 2 && /^\d+\./.test(text.trim())) {
      return `<h2 class="major-chapter" id="${encodeURIComponent(text.trim())}">${text}</h2>`;
    }

    return `<h${level}>${text}</h${level}>`;
  };

  marked.setOptions({
    renderer: renderer,
    gfm: true,
    breaks: true
  });

  const contentHtml = marked.parse(markdownText);

  const fullHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>คู่มืออธิบายสถาปัตยกรรมโค้ดและการทำงานทั้งระบบ (Codeee.pdf)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* ── Header Banner ── */
    .doc-header-main {
      border-bottom: 2.5px solid #4f46e5;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .doc-title-main {
      font-family: 'Prompt', sans-serif;
      font-size: 15pt;
      font-weight: 700;
      color: #1e1b4b;
      line-height: 1.3;
    }

    .doc-subtitle-main {
      font-family: 'Prompt', sans-serif;
      font-size: 10.5pt;
      color: #4f46e5;
      font-weight: 600;
      margin-top: 4px;
    }

    .meta-badge {
      font-family: 'Prompt', sans-serif;
      font-size: 9pt;
      background: #ede9fe;
      color: #4338ca;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 600;
      border: 1px solid #c7d2fe;
    }

    /* ── Headings & Page Break Rules (ป้องกันหัวข้อตกไปอยู่ท้ายกระดาษ) ── */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Prompt', sans-serif;
      color: #0f172a;
      margin-top: 20px;
      margin-bottom: 8px;
      line-height: 1.35;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    h1 {
      font-size: 17pt;
      color: #1e1b4b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 0;
    }

    /* หัวข้อหลักบทที่ 1 - 10 บังคับขึ้นหน้าใหม่เสมอ */
    h2.major-chapter {
      font-size: 14pt;
      color: #312e81;
      border-left: 5px solid #4f46e5;
      padding-left: 10px;
      background: #f8fafc;
      padding-top: 6px;
      padding-bottom: 6px;
      border-radius: 0 6px 6px 0;
      margin-top: 26px;
      page-break-before: always !important;
      break-before: page !important;
    }

    h2 {
      font-size: 13.5pt;
      color: #1e293b;
    }

    h3 {
      font-size: 12pt;
      color: #334155;
      margin-top: 16px;
    }

    h4 {
      font-size: 11pt;
      color: #475569;
      margin-top: 12px;
    }

    p, li {
      orphans: 3;
      widows: 3;
    }

    blockquote {
      margin: 10px 0;
      padding: 8px 12px;
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      border-radius: 0 6px 6px 0;
      color: #334155;
      font-size: 10.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9.2pt;
      page-break-inside: auto;
      break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th {
      background: #ede9fe;
      color: #1e1b4b;
      font-family: 'Prompt', sans-serif;
      font-weight: 600;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }

    td {
      padding: 5px 7px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* ── Code & ASCII Trees ── */
    code {
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      color: #4338ca;
      padding: 1.5px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 8.2pt;
      line-height: 1.45;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 10px 0;
      border: 1px solid #334155;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: 8.2pt;
    }

    /* ── Mermaid Diagrams ── */
    .mermaid-container {
      margin: 14px auto;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .mermaid {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .mermaid svg {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      font-family: 'Prompt', 'Sarabun', sans-serif !important;
    }

    hr {
      border: none;
      height: 1px;
      background: #e2e8f0;
      margin: 16px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    a {
      color: #4f46e5;
      text-decoration: none;
    }

    ul, ol {
      margin: 6px 0 10px 0;
      padding-left: 20px;
    }

    li {
      margin-bottom: 3px;
    }
  </style>
</head>
<body>

  <div class="doc-header-main">
    <div>
      <div class="doc-title-main">มหาวิทยาลัยราชภัฏบุรีรัมย์ — BRU Strategic Tracking System</div>
      <div class="doc-subtitle-main">คู่มืออธิบายสถาปัตยกรรมโค้ดและการทำงานทั้งระบบฉบับสมบูรณ์ (Codeee.pdf)</div>
    </div>
    <div style="text-align: right;">
      <span class="meta-badge">Full-Stack Architecture</span>
      <div style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">ฉบับละเอียด & สมบูรณ์</div>
    </div>
  </div>

  <div class="content-body">
    ${contentHtml}
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Prompt, Sarabun, sans-serif',
          fontSize: 12,
          themeVariables: {
            primaryColor: '#ede9fe',
            primaryTextColor: '#1e1b4b',
            primaryBorderColor: '#6366f1',
            lineColor: '#4f46e5',
            secondaryColor: '#f1f5f9',
            tertiaryColor: '#faf5ff',
            fontSize: '12px'
          },
          sequence: {
            useMaxWidth: false,
            diagramMarginX: 10,
            diagramMarginY: 10,
            actorFontSize: 11,
            actorFontFamily: 'Prompt, sans-serif',
            noteFontSize: 10,
            noteFontFamily: 'Sarabun, sans-serif',
            messageFontSize: 10.5,
            messageFontFamily: 'Sarabun, sans-serif'
          }
        });

        await mermaid.run();

        document.querySelectorAll('.mermaid svg').forEach(svg => {
          svg.removeAttribute('height');
          svg.style.width = '100%';
          svg.style.maxWidth = '100%';
          svg.style.height = 'auto';
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

  const htmlPath = path.join(__dirname, 'codeee_temp.html');
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');

  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  let executablePath = '';
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    throw new Error('No Chrome or Edge browser found on this system');
  }

  console.log('Launching browser from:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--font-render-hinting=max',
      '--enable-font-antialiasing'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1800, deviceScaleFactor: 2 });

  console.log('Loading temporary HTML in headless browser...');
  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  console.log('Waiting for Mermaid diagrams & Google Fonts to load...');
  await page.waitForFunction(() => window.__MERMAID_DONE__ === true, { timeout: 30000 });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000));

  const pdfPath = path.join(__dirname, 'Codeee.pdf');
  console.log('Printing to PDF:', pdfPath);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '14mm',
      bottom: '16mm',
      left: '14mm',
      right: '14mm'
    },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-family: 'Prompt', 'Sarabun', sans-serif; font-size: 8px; width: 100%; text-align: right; padding-right: 14mm; color: #64748b;">
      มหาวิทยาลัยราชภัฏบุรีรัมย์ | BRU Strategic Tracking — คู่มือสถาปัตยกรรมโค้ดและการทำงานทั้งระบบ (Codeee.pdf)
    </div>`,
    footerTemplate: `<div style="font-family: 'Prompt', 'Sarabun', sans-serif; font-size: 8.5px; width: 100%; display: flex; justify-content: space-between; padding: 0 14mm; color: #64748b;">
      <span>คู่มืออธิบายโค้ดและการทำงานทั้งระบบ (Full-Stack Architecture Guide)</span>
      <span>หน้า <span class="pageNumber"></span> จาก <span class="totalPages"></span></span>
    </div>`
  });

  await browser.close();

  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  console.log('Successfully generated Codeee.pdf at:', pdfPath);
}

generateCodeeePdf().catch(err => {
  console.error('Failed to generate Codeee.pdf:', err);
  process.exit(1);
});
