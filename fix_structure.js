const fs = require('fs');
const path = 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/frontend/app/pages/hospital_staff/index.vue';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix History Modal (Line 486 background unclosed)
const oldHistoryEnd = `            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== Modal ส่งตัว (Referral) ===================== -->`;

const newHistoryEnd = `            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- ===================== Modal ส่งตัว (Referral) ===================== -->`;

if (content.includes(oldHistoryEnd)) {
    content = content.replace(oldHistoryEnd, newHistoryEnd);
    console.log('History Modal balanced');
}

// 2. Fix p-8 div (Line 3 unclosed)
content = content.replace(/<\/NuxtLayout>/, '    </div>\n  </NuxtLayout>');
console.log('Main content div balanced');

fs.writeFileSync(path, content);
console.log('Structural fixes applied');
