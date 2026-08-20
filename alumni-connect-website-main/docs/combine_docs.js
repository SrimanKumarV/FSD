const fs = require('fs');
const path = require('path');

const files = [
  'README.md',
  'ARCHITECTURE.md',
  'PROJECT_EVALUATION.md',
  'CHANGELOG.md',
  'render-deployment.md',
  'ideathon_phase_1.md'
];

let combinedContent = '# Alumnex Connect Full Documentation\n\n';

for (const file of files) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf-8');
  combinedContent += `\n\n<div style="page-break-after: always;"></div>\n\n`; // Add page break
  combinedContent += content;
}

fs.writeFileSync(path.join(__dirname, 'FULL_DOCUMENTATION.md'), combinedContent);
console.log('Combined into FULL_DOCUMENTATION.md');
