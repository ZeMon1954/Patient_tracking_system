const fs = require('fs');
const path = 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/frontend/app/pages/hospital_staff/index.vue';
const content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
let stack = [];
let errorFound = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tags = line.match(/<div[^>]*>|<\/div>/g);
    if (tags) {
        for (const tag of tags) {
            if (tag.startsWith('<div')) {
                stack.push(i + 1);
            } else {
                if (stack.length === 0) {
                    console.log(`Error: Extra closing div at line ${i + 1}`);
                    errorFound = true;
                } else {
                    stack.pop();
                }
            }
        }
    }
}

console.log(`Final stack depth: ${stack.length}`);
if (stack.length > 0) {
    console.log(`Unclosed divs started at lines: ${stack.join(', ')}`);
}
