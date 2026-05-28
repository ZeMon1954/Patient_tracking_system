# Skill: auto-git-push

## Trigger
เรียกใช้ Skill นี้ทุกครั้งที่:
- แก้ไข code เสร็จสมบูรณ์และทดสอบแล้ว
- ผู้ใช้พูดว่า "เสร็จแล้ว ดันขึ้น git", "push ขึ้น git", "commit เลย", "ดัน git"
- หลังจาก implement feature ใหม่ หรือ fix bug สำเร็จ

## Instructions

หลังแก้ไข code เสร็จ ให้ทำตามขั้นตอนนี้เสมอ:

### Step 1 — ตรวจสอบไฟล์ที่เปลี่ยนแปลง
```bash
git -C "c:\Users\mom20\OneDrive\Desktop\ฝึกงาน\Patient_tracking_system" status
```

### Step 2 — Stage ไฟล์ที่เปลี่ยนแปลงทั้งหมด
```bash
git -C "c:\Users\mom20\OneDrive\Desktop\ฝึกงาน\Patient_tracking_system" add .
```

### Step 3 — Commit พร้อม message ที่สื่อความหมาย
สร้าง commit message ตามรูปแบบนี้:
```
<type>: <คำอธิบายสั้นๆ ภาษาไทยหรืออังกฤษ>
```

**ประเภท (type):**
| type | ใช้เมื่อ |
|------|---------|
| `feat` | เพิ่ม feature ใหม่ |
| `fix` | แก้ bug |
| `refactor` | ปรับโครงสร้าง code โดยไม่เปลี่ยน logic |
| `style` | แก้ UI/CSS เท่านั้น |
| `docs` | แก้ไขเอกสาร/comments |
| `chore` | งานอื่นๆ เช่น แก้ config, .env.example |
| `skill` | เพิ่ม/แก้ไข Claude Skills หรือ CLAUDE.md |

**ตัวอย่าง commit messages:**
```
feat: เพิ่มระบบ Refer Back ส่งตัวผู้ป่วยฉุกเฉิน
fix: แก้ bug JWT token หมดอายุแล้ว redirect loop
refactor: ปรับ trackingController ใช้ Transaction แทน
style: ปรับหน้า Inbox ให้ badge status ถูกต้อง
skill: เพิ่ม auto-git-push skill
```

```bash
git -C "c:\Users\mom20\OneDrive\Desktop\ฝึกงาน\Patient_tracking_system" commit -m "<type>: <message>"
```

### Step 4 — Push ขึ้น Remote
```bash
git -C "c:\Users\mom20\OneDrive\Desktop\ฝึกงาน\Patient_tracking_system" push
```

### Step 5 — แจ้งผลลัพธ์
หลัง push สำเร็จ แจ้งผู้ใช้:
- ไฟล์ที่เปลี่ยนแปลงทั้งหมด
- Commit message ที่ใช้
- Branch ที่ push ขึ้น

---

## ข้อควรระวัง (Caution)

- **ห้าม** add/commit ไฟล์ `.env` (มี .gitignore แล้ว แต่ตรวจสอบอีกครั้งด้วย `git status`)
- **ห้าม** push ถ้ายัง `git status` ไม่ได้รัน — ต้องรู้ก่อนว่าไฟล์ไหนจะ commit
- ถ้ามีไฟล์ที่ไม่ควร commit (เช่น ไฟล์ test ชั่วคราว) ให้ถามผู้ใช้ก่อน

## ตัวอย่างการทำงานจริง

```
✅ แก้ไข backend/controllers/trackingController.js สำเร็จ

กำลัง commit และ push...

📋 ไฟล์ที่เปลี่ยนแปลง:
  M  backend/controllers/trackingController.js

✅ Commit: "fix: แก้ bug transaction rollback ใน trackingController"
✅ Push ขึ้น origin/main สำเร็จ!
```
