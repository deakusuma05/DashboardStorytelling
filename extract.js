const fs = require('fs');
const readline = require('readline');
const path = 'C:\\Users\\MyBook Hype AMD\\.gemini\\antigravity-ide\\brain\\616244d4-4763-4046-b8ea-7287308324a9\\.system_generated\\logs\\transcript.jsonl';

async function run() {
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let files = {
    'index.html': null,
    'style.css': null,
    'script.js': null
  };
  
  for await (const line of rl) {
    if (!line) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'MODEL_RESPONSE') {
        const calls = entry.tool_calls || [];
        for (const call of calls) {
          if (call.name === 'default_api:write_to_file' || call.name === 'write_to_file' || call.name === 'default_api:replace_file_content' || call.name === 'replace_file_content') {
            const args = call.arguments || {};
            const target = args.TargetFile;
            if (target && target.includes('index.html')) files['index.html'] = args.CodeContent || files['index.html']; // replace doesn't have CodeContent but we will just grab the last write_to_file
            if (target && target.includes('style.css')) files['style.css'] = args.CodeContent || files['style.css'];
            if (target && target.includes('script.js')) files['script.js'] = args.CodeContent || files['script.js'];
          }
        }
      }
      
      // Stop tracking if we see the user message from 14:08 (2:08 PM)
      if (entry.type === 'USER_INPUT' && entry.content && entry.content.includes('Tolong perbaiki dashboard')) {
        console.log('Found cut-off point: user message at 2:08 PM');
        break; 
      }
    } catch (e) { }
  }

  // Write these extracted files to the current directory
  if (files['index.html']) fs.writeFileSync('index.html.bak', files['index.html']);
  if (files['style.css']) fs.writeFileSync('style.css.bak', files['style.css']);
  if (files['script.js']) fs.writeFileSync('script.js.bak', files['script.js']);
  
  console.log('Saved .bak files for index.html, style.css, script.js based on state before 2:08 PM');
}
run();
