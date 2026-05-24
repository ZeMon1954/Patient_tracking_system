const fs = require('fs');
const path = 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/frontend/app/pages/hospital_staff/index.vue';
let content = fs.readFileSync(path, 'utf8');

// The last script might have added too many or miscalculated because of multiple matches.
// Let's do a clean re-count and fix at the very end.

const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
const diff = openDivs - closeDivs;

console.log(`Current Divs - Open: ${openDivs}, Close: ${closeDivs}, Diff: ${diff}`);

if (diff < 0) {
    console.log(`Removing ${Math.abs(diff)} extra close tags from the end...`);
    for (let i = 0; i < Math.abs(diff); i++) {
        content = content.replace(/<\/div>\s+<\/NuxtLayout>/, '</NuxtLayout>');
    }
} else if (diff > 0) {
    console.log(`Adding ${diff} missing close tags to the end...`);
    let tags = '';
    for (let i = 0; i < diff; i++) tags += '    </div>\n';
    content = content.replace(/<\/NuxtLayout>/, tags + '  </NuxtLayout>');
}

fs.writeFileSync(path, content);
console.log('Final structure balanced');
