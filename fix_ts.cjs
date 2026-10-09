const fs = require('fs'); 
const files = ['src/lib/ask.test.ts', 'src/lib/engine.test.ts', 'src/lib/score.test.ts']; 
for (const file of files) { 
  let content = fs.readFileSync(file, 'utf8'); 
  content = content.replace(/\{ id: /g, "{ maskedText: '', piiItems: [], hasHighRisk: false, id: "); 
  content = content.replace(/deadline: false, decision: false/g, "deadline: false, deadlineDate: null, decision: false"); 
  fs.writeFileSync(file, content); 
}
