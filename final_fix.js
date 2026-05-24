const fs = require('fs');
const path = 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/frontend/app/pages/hospital_staff/index.vue';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix Manage column - ensure icons are always visible (done in previous step, but let's be sure)
content = content.replace(
    /class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"/g,
    'class="flex items-center justify-center gap-2 transition-all"'
);

// 2. Fix Add Modal (Missing body close tag)
content = content.replace(
    /(บันทึกข้อมูล\s+<\/button>\s+<\/div>)\s+(<\/div>\s+<\/div>\s+<!-- ===================== Modal แก้ไขผู้ป่วย)/,
    '$1\n        </div>\n      $2'
);

// 3. Fix Edit Modal (Missing body close tag)
content = content.replace(
    /(บันทึกการแก้ไข\s+<\/button>\s+<\/div>)\s+(<\/div>\s+<\/div>\s+<!-- ===================== Modal สร้างการนัดหมาย)/,
    '$1\n        </div>\n      $2'
);

// 4. Fix Appointment Modal (Missing body close tag)
content = content.replace(
    /(บันทึก\s+<\/button>\s+<\/div>)\s+(<\/div>\s+<\/div>\s+<!-- ===================== Modal ประวัติการนัดหมาย)/,
    '$1\n        </div>\n      $2'
);

// 5. Fix History Modal (Missing body close tag)
// The legend was added inside the v-else, so we need to close the body div (line 482)
content = content.replace(
    /(ลบนัดหมาย<\/span>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>)\s+(<\/div>\s+<\/div>\s+<!-- ===================== Modal ส่งตัว)/,
    '$1\n        </div>\n      $2'
);

// 6. Fix Referral Modal (Missing body close tag)
content = content.replace(
    /(ส่งตัว\s+<\/button>\s+<\/div>)\s+(<\/div>\s+<\/div>\s+<\/div>\s+<\/NuxtLayout>)/,
    '$1\n        </div>\n      $2'
);

fs.writeFileSync(path, content);
console.log('Modals structural fix applied');

// 7. Verify legend for main table is there
if (content.includes('คำอธิบายปุ่มจัดการ')) {
    console.log('Legend found in main table');
}

// 8. Re-check tag balance
const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
console.log(`Final Divs - Open: ${openDivs}, Close: ${closeDivs}`);
