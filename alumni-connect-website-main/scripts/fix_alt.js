const fs = require('fs');
const path = require('path');
const dir = 'frontend/src/pages/stitch';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
files.forEach(file => {
    let p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    // Replace <img ...> with <img alt="" ...> only if there is no alt="..."
    content = content.replace(/<img(?![^>]*\balt=)[^>]*>/g, (match) => {
        return match.replace(/<img\s/, '<img alt="" ');
    });
    fs.writeFileSync(p, content);
});
console.log('Fixed missing alt tags.');
