const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const modelsDir = path.join(rootDir, 'backend', 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

let markdown = `# CHAPTER 5 — DATABASE DESIGN (FORENSIC AUDIT)\n\n`;
markdown += `## 5.1 Models Overview\nThe system implements ${files.length} distinct Mongoose models. Below is the forensic audit of each model based on the exact source code in \`backend/models/\`.\n\n`;

for (const file of files) {
  const content = fs.readFileSync(path.join(modelsDir, file), 'utf-8');
  markdown += `### 5.1.${files.indexOf(file) + 1} Model: ${file.replace('.js', '')}\n`;
  markdown += `- **Source File**: \`backend/models/${file}\`\n`;
  
  // Basic extraction of fields using regex
  const fieldsMatch = content.match(/(\w+):\s*{[^}]*type:\s*([^,}]+)[^}]*}/g);
  if (fieldsMatch) {
    markdown += `- **Key Fields**:\n`;
    fieldsMatch.forEach(match => {
      const fieldName = match.split(':')[0].trim();
      let fieldType = 'Mixed';
      if (match.includes('type:')) {
        fieldType = match.split('type:')[1].split(/[,}]/)[0].trim();
      }
      markdown += `  - \`${fieldName}\` (${fieldType})\n`;
    });
  }

  // Check for timestamps
  if (content.includes('timestamps: true')) {
    markdown += `- **Options**: Includes automated \`createdAt\` and \`updatedAt\` timestamps.\n`;
  }
  
  // Check for methods/virtuals
  if (content.includes('.methods.')) {
    markdown += `- **Instance Methods**: Contains custom instance methods (e.g., password hashing/comparison, token generation).\n`;
  }
  if (content.includes('mongoose.model(')) {
     const modelNameMatch = content.match(/mongoose\.model\(['"]([^'"]+)['"]/);
     if (modelNameMatch) {
        markdown += `- **Mongoose Collection Name**: \`${modelNameMatch[1]}\`\n`;
     }
  }

  markdown += `\n`;
}

fs.writeFileSync(path.join(rootDir, 'docs', 'forensic_report_chapters', '02_Database_Forensics.md'), markdown);
console.log('Chapter 2 generated successfully.');
