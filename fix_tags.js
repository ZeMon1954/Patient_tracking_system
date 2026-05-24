const fs = require('fs');
const path = 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/frontend/app/pages/hospital_staff/index.vue';
let content = fs.readFileSync(path, 'utf8');

// The missing tag is likely after the history modal body ends.
// Let's replace the last part of history modal with a corrected version.
const oldPart = `            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== Modal ส่งตัว (Referral) ===================== -->`;

const newPart = `            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- ===================== Modal ส่งตัว (Referral) ===================== -->`;

if (content.includes(oldPart)) {
    content = content.replace(oldPart, newPart);
    console.log('Missing tag added');
} else {
    console.log('Pattern not found');
}

fs.writeFileSync(path, content);
console.log('Done');
