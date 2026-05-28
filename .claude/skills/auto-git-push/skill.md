# Skill: auto-git-push

## Trigger
เรียกใช้ Skill นี้ทุกครั้งที่:
- แก้ไข code เสร็จสมบูรณ์และทดสอบแล้ว
- ผู้ใช้พูดว่า "เสร็จแล้ว ดันขึ้น git", "push ขึ้น git", "commit เลย", "ดัน git","git"
- หลังจาก implement feature ใหม่ หรือ fix bug สำเร็จ

## Instructions

> ⚡ **AUTO-EXECUTE**: เมื่อ Trigger นี้ถูกเรียก ให้รัน **ทุก Step (1-5) ทันทีโดยไม่ถามผู้ใช้ก่อน** — ไม่ต้อง confirm, ไม่ต้อง pause, รันต่อเนื่องจนครบ

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

- **ห้าม** add/commit ไฟล์ `.env` — .gitignore จัดการแล้ว ไม่ต้องถาม
- รัน `git status` ก่อน add เสมอ (Step 1 บังคับ)
- ไฟล์ test ชั่วคราว (เช่น `*.test.tmp`, `debug_*.js`) ให้ **ข้ามโดยอัตโนมัติ** อย่าถามผู้ใช้ — ใช้ `git add .` ตามปกติ เพราะ `.gitignore` จัดการอยู่แล้ว

## ตัวอย่างการทำงานจริง

```
✅ แก้ไข backend/controllers/trackingController.js สำเร็จ

กำลัง commit และ push...

📋 ไฟล์ที่เปลี่ยนแปลง:
  M  backend/controllers/trackingController.js

✅ Commit: "fix: แก้ bug transaction rollback ใน trackingController"
✅ Push ขึ้น origin/main สำเร็จ!
```
