const fs = require('fs');
const path = require('path');

const chaptersDir = path.join(__dirname, '..', 'docs', 'forensic_report_chapters');
const outputFile = path.join(__dirname, '..', 'Alumnex_Connect_Forensic_Report.md');

const files = fs.readdirSync(chaptersDir).sort();

let finalMarkdown = '';

for (const file of files) {
  const content = fs.readFileSync(path.join(chaptersDir, file), 'utf-8');
  finalMarkdown += content + '\n\n';
}

fs.writeFileSync(outputFile, finalMarkdown);
console.log('Concatenated all chapters into Alumnex_Connect_Forensic_Report.md');
