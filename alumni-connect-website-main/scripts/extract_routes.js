const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const routesDir = path.join(rootDir, 'backend', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

let markdown = `# CHAPTER 8 — MODULE-WISE IMPLEMENTATION (ROUTES FORENSIC AUDIT)\n\n`;
markdown += `The backend comprises ${files.length} dedicated Express route modules.\n\n`;

for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
  markdown += `### Route Module: \`${file}\`\n`;
  markdown += `- **Source File**: \`backend/routes/${file}\`\n`;
  
  const endpoints = content.match(/router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g);
  if (endpoints) {
    markdown += `- **Endpoints Documented**:\n`;
    endpoints.forEach(match => {
       const parts = match.split('(');
       const method = parts[0].replace('router.', '').toUpperCase();
       const url = parts[1].replace(/['"]/g, '');
       markdown += `  - \`${method} ${url}\`\n`;
    });
  } else {
    markdown += `- **Endpoints Documented**: (Wrapped in controllers or exported functions)\n`;
  }
  
  if (content.includes('protect')) {
    markdown += `- **Security Control**: Enforces \`protect\` authentication middleware on specific endpoints.\n`;
  }
  if (content.includes('authorize')) {
    markdown += `- **Security Control**: Enforces \`authorize()\` RBAC middleware.\n`;
  }
  
  markdown += `\n`;
}

fs.writeFileSync(path.join(rootDir, 'docs', 'forensic_report_chapters', '04_Routes_and_Modules.md'), markdown);
console.log('Chapter 4 generated successfully.');
