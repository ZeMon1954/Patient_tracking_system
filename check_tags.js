const fs = require('fs');
const path = 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/frontend/app/pages/hospital_staff/index.vue';
let content = fs.readFileSync(path, 'utf8');

// Fix 1: Manage column icons always visible
const oldIcons = '<div class="flex items-center justify-center gap-2 transition-all">';
// No change needed here if it's already fixed, but let's ensure it's correct.

// Fix 2: Legend outside table
// Let's check if the footer is correct.
const footerStart = '<div class="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">';
if (content.includes(footerStart)) {
    console.log('Footer found');
} else {
    console.log('Footer NOT found');
}

// Let's count divs
const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
console.log(`Divs - Open: ${openDivs}, Close: ${closeDivs}`);

const openTemplates = (content.match(/<template/g) || []).length;
const closeTemplates = (content.match(/<\/template>/g) || []).length;
console.log(`Templates - Open: ${openTemplates}, Close: ${closeTemplates}`);

const openLayouts = (content.match(/<NuxtLayout/g) || []).length;
const closeLayouts = (content.match(/<\/NuxtLayout>/g) || []).length;
console.log(`Layouts - Open: ${openLayouts}, Close: ${closeLayouts}`);

// If divs are unbalanced, we need to find where.
// Usually it's around the area of the last edit.
