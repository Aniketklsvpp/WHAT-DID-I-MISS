const fs = require('fs');
const path = require('path');

const datePrefix = "12/03/2026, ";

const collegeMessages = Array.from({ length: 80 }).map((_, i) => {
    let text = `Hey, did anyone check the notice board? #${i}`;
    let time = `10:${String(i%60).padStart(2, '0')} am`;
    let sender = ['Alice', 'Bob', 'Charlie', 'Dave'][i % 4];
    if (i === 10) text = "@Bob when is the deadline for the DB assignment?";
    if (i === 11) text = "It's due next Friday, guys! This is urgent.";
    if (i === 12) text = "decided: we will use Postgres for the backend.";
    if (i === 40) text = "Hey @Dave can you check the new PR? Need action on this.";
    if (i === 60) text = "I think we should meet at the library.\nDoes 5 PM work for everyone?";
    return `${datePrefix}${time} - ${sender}: ${text}`;
}).join('\n');

const projectMessages = Array.from({ length: 80 }).map((_, i) => {
    let time = `11:${String(i%60).padStart(2, '0')} am`;
    let sender = ['Eve', 'Frank', 'Grace', 'Heidi'][i % 4];
    let text = `Project update status ${i}`;
    if (i === 15) text = "The deadline for phase 1 is tomorrow 5 PM!";
    if (i === 30) text = "@Grace did you submit the report? ? \nYes, multi-line \ncontinuation.";
    if (i === 55) text = "Action: everyone please update your timesheets. Urgent!";
    if (i === 70) text = "decision: moving standup to 10 AM.";
    return `[12/03/26, ${time}:00] ${sender}: ${text}`;
}).join('\n');

const hinglishMessages = Array.from({ length: 80 }).map((_, i) => {
    let time = `01:${String(i%60).padStart(2, '0')} pm`;
    let sender = ['Rahul', 'Sneha', 'Vikram', 'Pooja'][i % 4];
    let text = `Kya chal raha hai ${i}`;
    if (i === 10) text = "@Sneha kal tak bhej do report!";
    if (i === 15) text = "Jaldi karo bhai, time nahi hai.";
    if (i === 30) text = "Kab tak hoga ye task? Parso submit karna hai.";
    if (i === 50) text = "Sab log presentation review kar lo. Urgent hai.";
    if (i === 75) text = "Decision final hai: we are going with React.\nAwesome.";
    return `${datePrefix}${time} - ${sender}: ${text}`;
}).join('\n');

const dataDir = path.join(__dirname, 'src', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(path.join(dataDir, 'sample-college-group.txt'), collegeMessages);
fs.writeFileSync(path.join(dataDir, 'sample-project-team.txt'), projectMessages);
fs.writeFileSync(path.join(dataDir, 'sample-hinglish.txt'), hinglishMessages);

console.log('Sample files generated successfully.');
