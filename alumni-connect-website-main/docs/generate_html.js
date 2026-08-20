const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, 'AGILE_SRS_ARCHITECTURE.md');
const htmlPath = path.join(__dirname, 'AGILE_SRS_ARCHITECTURE.html');

const markdownContent = fs.readFileSync(mdPath, 'utf8');

const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Alumnex Connect SRS & Architecture</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 1000px; margin: 40px auto; padding: 0 20px; color: #333; }
        h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-top: 1.5em; }
        pre, code { background: #f6f8fa; border-radius: 6px; padding: 0.2em 0.4em; font-family: Consolas, monospace; }
        pre { padding: 16px; overflow-x: auto; }
        pre code { padding: 0; background: transparent; }
        .mermaid { margin: 30px 0; display: flex; justify-content: center; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #d0d7de; padding: 8px 13px; text-align: left; }
        th { background-color: #f6f8fa; font-weight: 600; }
        blockquote { padding: 0 1em; color: #656d76; border-left: 0.25em solid #d0d7de; margin: 0; }
    </style>
</head>
<body>
    <div id="content"></div>
    
    <!-- We embed the raw markdown inside a hidden script tag to avoid escaping issues -->
    <script type="text/markdown" id="raw-markdown">
${markdownContent.replace(/<\/script>/g, '<\\/script>')}
    </script>

    <script>
        const rawMarkdown = document.getElementById('raw-markdown').textContent;
        let html = marked.parse(rawMarkdown);
        // Transform markdown mermaid codeblocks to mermaid div containers
        html = html.replace(/<pre><code class="language-mermaid">([\\s\\S]*?)<\\/code><\\/pre>/g, '<div class="mermaid">$1</div>');
        document.getElementById('content').innerHTML = html;
    </script>
</body>
</html>`;

fs.writeFileSync(htmlPath, htmlTemplate);
console.log('HTML generated successfully at', htmlPath);
