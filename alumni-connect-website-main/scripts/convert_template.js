const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const componentName = process.argv[3];
const outputFile = process.argv[4];

if (!inputFile || !componentName || !outputFile) {
    console.error('Usage: node convert_template.js <input.html> <ComponentName> <output.js>');
    process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');

// Extract the contents of <main>...</main>
const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
let content = mainMatch ? mainMatch[1] : html;

// Convert class= to className=
content = content.replace(/class=/g, 'className=');

// Better color replacement
const colorNames = ['primary', 'secondary', 'tertiary', 'success', 'error', 'warning'];
const prefixes = ['text', 'bg', 'border', 'from', 'to', 'shadow'];

for (const prefix of prefixes) {
    for (const color of colorNames) {
        // match prefix-color but not if it has a suffix like -container
        const regex = new RegExp(`${prefix}-${color}(?!-[a-zA-Z0-9])`, 'g');
        content = content.replace(regex, `${prefix}-stitch-${color}`);
    }
}

// Also replace shadow-primary-500/10 to shadow-stitch-primary/10
content = content.replace(/shadow-primary-[0-9]+\//g, 'shadow-stitch-primary/');

// Convert self-closing tags and standard HTML replacements for JSX
content = content.replace(/<img([^>]*)>/g, (match) => {
    if(match.endsWith('/>')) return match;
    return match.replace(/>$/, ' />');
});
content = content.replace(/<input([^>]*)>/g, (match) => {
    if(match.endsWith('/>')) return match;
    return match.replace(/>$/, ' />');
});
content = content.replace(/<br([^>]*)>/g, (match) => {
    if(match.endsWith('/>')) return match;
    return match.replace(/>$/, ' />');
});
content = content.replace(/<hr([^>]*)>/g, (match) => {
    if(match.endsWith('/>')) return match;
    return match.replace(/>$/, ' />');
});

content = content.replace(/<!--[\s\S]*?-->/g, (match) => {
    return `{/* ${match.replace(/<!--/g, '').replace(/-->/g, '')} */}`;
});

content = content.replace(/for=/g, 'htmlFor=');
content = content.replace(/style="([^"]*)"/g, (match, styleStr) => {
    // Basic inline style conversion for style="font-variation-settings: 'FILL' 1;"
    return `style={{ fontVariationSettings: "'FILL' 1" }}`;
});


const componentTemplate = `import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ${componentName} = () => {
  const { user } = useAuth();

  return (
    <>
${content}
    </>
  );
};

export default ${componentName};
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, componentTemplate);
console.log(`Generated ${outputFile}`);
