// Convert LaTeX to Markdown using node-pandoc
const nodePandoc = require('node-pandoc');
const { resolve } = require('path');
const fs = require('fs');

// Paths
const src = resolve(__dirname, '../public/resume/main.tex');
const output = resolve(__dirname, '../public/resume/out.md');

// Arguments for pandoc: from latex to markdown
const args = `-f latex -t markdown --wrap=none -o ${output}`;

// Track if we've already shown success message
let successShown = false;

// Callback function
const callback = (err, result) => {
  if (err) {
    // Check if it's just a warning (pandoc often outputs warnings to stderr)
    const errStr = err.toString();
    if (errStr.includes('WARNING') || errStr.includes('Warning')) {
      // Just a warning, don't exit - pandoc may still succeed
      return;
    } else {
      console.error('❌ Error converting LaTeX to Markdown:', err);
      process.exit(1);
    }
  }
  
  // Only show success message once
  if (!successShown) {
    // Check if output file exists
    if (fs.existsSync(output)) {
      const stats = fs.statSync(output);
      console.log('✅ Successfully converted main.tex to markdown!');
      console.log(`📄 Output written to: ${output}`);
      console.log(`📊 File size: ${stats.size} bytes`);
      successShown = true;
    } else {
      console.error('❌ Output file was not created!');
      process.exit(1);
    }
  }
};

// Call pandoc
console.log(`Converting ${src} to markdown...`);
nodePandoc(src, args, callback);
