const fs = require('fs');
const path = 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/frontend/app/pages/hospital_staff/index.vue';
const content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
let stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Remove comments to avoid false matches
    const cleanLine = line.replace(/<!--.*?-->/g, '');
    const tags = cleanLine.match(/<div[^>]*>|<\/div>/g);
    if (tags) {
        for (const tag of tags) {
            if (tag.startsWith('<div')) {
                stack.push({line: i + 1, tag});
            } else {
                if (stack.length === 0) {
                    console.log(`Error: Extra closing div at line ${i + 1}`);
                } else {
                    stack.pop();
                }
            }
        }
    }
}

console.log(`Final stack depth: ${stack.length}`);
stack.forEach(s => console.log(`Unclosed: Line ${s.line} -> ${s.tag}`));
