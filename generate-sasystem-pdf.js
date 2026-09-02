const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { marked } = require('marked');

async function generateSaSystemPdf() {
  console.log('Reading sasystem.md to compile sasystem.pdf (Author: Teeraphon, clean page breaks)...');
  const mdPath = path.join(__dirname, 'sasystem.md');
  const markdownText = fs.readFileSync(mdPath, 'utf8');

  // Custom renderer for marked
  const renderer = new marked.Renderer();
  const origCode = renderer.code.bind(renderer);

  renderer.code = function(token) {
    const code = typeof token === 'object' ? token.text : token;
    const lang = typeof token === 'object' ? token.lang : arguments[1];

    if (lang === 'mermaid') {
      if (code.includes('erDiagram')) {
        return `
        <div class="landscape-section">
          <div class="doc-header-clean" style="border-bottom: 2px solid #312e81; padding-bottom: 4px; margin-bottom: 8px;">
            <div style="font-family: 'Prompt', sans-serif; font-size: 15px; font-weight: 700; color: #1e1b4b;">5.2 แผนภาพความสัมพันธ์ฐานข้อมูล (Mermaid ERD Diagram 13 ตาราง — แนวนอน)</div>
            <div style="font-size: 10.5px; color: #475569;">ฐานข้อมูล: bru_strategic_tracking | ผู้จัดทำ: Teeraphon</div>
          </div>
          <div class="erd-landscape-box">
            <div class="mermaid">${code}</div>
          </div>
        </div>`;
      }
      return `<div class="mermaid-container"><div class="mermaid">${code}</div></div>`;
    }
    return origCode(token);
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
  <title>เอกสารวิเคราะห์และออกแบบระบบ มรภ.บุรีรัมย์ — ผู้จัดทำ: Teeraphon (sasystem.pdf)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }

    @page landscape-page {
      size: A4 landscape;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Sarabun', 'Segoe UI', Tahoma, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .doc-header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #312e81;
      padding-bottom: 8px;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .doc-title-main {
      font-family: 'Prompt', sans-serif;
      font-size: 17px;
      font-weight: 700;
      color: #1e1b4b;
      line-height: 1.25;
    }

    .doc-subtitle-main {
      font-size: 11.5px;
      color: #475569;
      margin-top: 3px;
    }

    .meta-badge {
      display: inline-block;
      background: #ede9fe;
      color: #4338ca;
      font-family: 'Prompt', sans-serif;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
      border: 1px solid #c4b5fd;
    }

    /* Headings: 16px standard, H1 18px */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Prompt', 'Sarabun', sans-serif;
      color: #1e1b4b;
      page-break-after: avoid;
      break-after: avoid;
      orphans: 4;
      widows: 4;
    }

    /* บังคับขึ้นหน้าใหม่สำหรับหัวข้อหมวดหมู่หลัก (H1) */
    h1 {
      font-size: 18px;
      font-weight: 700;
      color: #2e1065;
      border-bottom: 2.5px solid #6366f1;
      padding-bottom: 6px;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
      page-break-before: always;
      break-before: page;
    }

    /* ยกเว้น H1 ตัวแรกของเอกสารไม่ต้องขึ้นหน้าใหม่ */
    .content-body > h1:first-of-type,
    .doc-header-main + h1,
    .content-body > h1:nth-child(1) {
      page-break-before: avoid !important;
      break-before: avoid !important;
      margin-top: 0;
    }

    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #1e1b4b;
      background: #f1f5f9;
      border-left: 5px solid #4f46e5;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 12px;
      margin-top: 1.3em;
      margin-bottom: 0.5em;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: #3730a3;
      margin-top: 1.1em;
      margin-bottom: 0.4em;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 3px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #4338ca;
      margin-top: 0.9em;
      margin-bottom: 0.3em;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Paragraphs: ย่อหน้า 1 นิ้ว (1in) */
    p {
      font-size: 14px;
      line-height: 1.5;
      text-indent: 1in;
      margin-top: 0.35em;
      margin-bottom: 0.5em;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }

    ul, ol {
      font-size: 14px;
      line-height: 1.5;
      padding-left: 28px;
      margin-top: 0.35em;
      margin-bottom: 0.5em;
      page-break-inside: auto;
      break-inside: auto;
    }

    li {
      margin-bottom: 0.25em;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote, .callout-box {
      background: #eef2ff;
      border-left: 4.5px solid #4f46e5;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 12px 0;
      font-size: 13.5px;
      line-height: 1.5;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote p {
      text-indent: 0;
      margin: 0;
    }

    /* ตารางป้องกันการตัดขาดครึ่งแถว และทำ header ซ้ำ */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 12.5px;
      line-height: 1.45;
      page-break-inside: auto;
      break-inside: auto;
      border: 1px solid #94a3b8;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th {
      background-color: #312e81;
      color: #ffffff;
      font-family: 'Prompt', sans-serif;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #1e1b4b;
      font-size: 12.5px;
    }

    td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      vertical-align: middle;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    code {
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 11.5px;
      background-color: #f1f5f9;
      color: #4338ca;
      padding: 2px 5px;
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
      font-size: 10.5px;
      line-height: 1.4;
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 10px 0;
      border: 1px solid #334155;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: 10.5px;
    }

    /* ป้องกัน Mermaid Diagram ถูกตัดขาดครึ่ง */
    .mermaid-container {
      margin: 12px auto 16px auto;
      padding: 10px 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
      max-width: 95%;
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
      max-height: 320px !important;
      height: auto !important;
      font-family: 'Prompt', 'Sarabun', sans-serif !important;
    }

    /* Landscape Section สำหรับ ERD Diagram */
    .landscape-section {
      page: landscape-page;
      page-break-before: always;
      break-before: page;
      page-break-after: always;
      break-after: page;
      width: 100%;
      min-height: 180mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .erd-landscape-box {
      margin: 4px 0 0 0;
      padding: 8px 10px;
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      width: 100%;
      height: 158mm;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }

    .erd-landscape-box .mermaid {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .erd-landscape-box .mermaid svg {
      width: 100% !important;
      max-width: 100% !important;
      height: 150mm !important;
      max-height: 150mm !important;
    }

    hr {
      border: none;
      height: 1px;
      background: #cbd5e1;
      margin: 18px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    a {
      color: #4f46e5;
      text-decoration: none;
    }
  </style>
</head>
<body>

  <div class="doc-header-main">
    <div>
      <div class="doc-title-main">มหาวิทยาลัยราชภัฏบุรีรัมย์ — Strategic Performance Tracking System</div>
      <div class="doc-subtitle-main">เอกสารวิเคราะห์และออกแบบระบบ (System Analyst Specification Manual — sasystem.pdf)</div>
    </div>
    <div style="text-align: right;">
      <span class="meta-badge">ผู้จัดทำ: Teeraphon</span>
      <div style="font-size: 10px; color: #64748b; margin-top: 3px;">รอบปีงบประมาณ 2569</div>
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
          fontSize: 13,
          themeVariables: {
            primaryColor: '#ede9fe',
            primaryTextColor: '#1e1b4b',
            primaryBorderColor: '#6366f1',
            lineColor: '#4f46e5',
            secondaryColor: '#f1f5f9',
            tertiaryColor: '#faf5ff',
            fontSize: '13px'
          },
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 30,
            rankSpacing: 30,
            padding: 8
          },
          sequence: {
            useMaxWidth: false,
            diagramMarginX: 10,
            diagramMarginY: 10,
            actorFontSize: 12,
            actorFontFamily: 'Prompt, sans-serif',
            noteFontSize: 11,
            noteFontFamily: 'Sarabun, sans-serif',
            messageFontSize: 11,
            messageFontFamily: 'Sarabun, sans-serif'
          },
          er: {
            useMaxWidth: false,
            fontSize: 12.5,
            entityPadding: 14
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

  const htmlPath = path.join(__dirname, 'sasystem_temp.html');
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

  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  console.log('Waiting for Mermaid diagrams & web fonts to render...');
  await page.waitForFunction(() => window.__MERMAID_DONE__ === true, { timeout: 30000 });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 2000));

  const pdfPath = path.join(__dirname, 'sasystem.pdf');
  console.log('Printing to PDF (Author: Teeraphon with clean pagination):', pdfPath);

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
      มหาวิทยาลัยราชภัฏบุรีรัมย์ | Strategic Performance Tracking System (sasystem.pdf) — ผู้จัดทำ: Teeraphon
    </div>`,
    footerTemplate: `<div style="font-family: 'Prompt', 'Sarabun', sans-serif; font-size: 8.5px; width: 100%; display: flex; justify-content: space-between; padding: 0 14mm; color: #64748b;">
      <span>เอกสารวิเคราะห์และออกแบบระบบ — ผู้จัดทำ: Teeraphon</span>
      <span>หน้า <span class="pageNumber"></span> จาก <span class="totalPages"></span></span>
    </div>`
  });

  await browser.close();

  // Also sync to other pdf aliases
  fs.copyFileSync(pdfPath, path.join(__dirname, 'stbru.pdf'));
  fs.copyFileSync(pdfPath, path.join(__dirname, 'systemStbru.pdf'));
  fs.copyFileSync(pdfPath, path.join(__dirname, 'system.pdf'));
  console.log('Synced to stbru.pdf, systemStbru.pdf, system.pdf');

  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  console.log('sasystem.pdf generated successfully with Author: Teeraphon!');
}

generateSaSystemPdf().catch(err => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
