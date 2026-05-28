# Skill: project-context

## Trigger
เรียกใช้ Skill นี้เมื่อผู้ใช้ถามเกี่ยวกับ:
- ภาพรวมระบบ, flow การทำงาน, หรือ business logic
- ความสัมพันธ์ระหว่างตารางในฐานข้อมูล (ER Diagram)
- Sequence ของการส่งต่อคนไข้ (Referral Flow)
- Use case ต่างๆ ของระบบ

## Context

### Core Business Flow
```
1. รพ. ลงทะเบียนคนไข้ (patient table)
   ↓
2. รพ. สร้างใบส่งต่อ → referral status: "pending"
   ↓ (ส่งอีเมล/In-App notification ไปหา รพ.สต.)
3. รพ.สต. ตอบรับ → referral status: "accepted"
   - โอนย้ายสิทธิ์คนไข้: UPDATE patient SET service_unit_id = รพ.สต.
   - สร้าง appointment อัตโนมัติ
   ↓
4. รพ.สต. ลงพื้นที่เยี่ยมบ้าน → บันทึกใน tracking table
   - บันทึกสัญญาณชีพ (ความดัน SYS/DIA, น้ำตาล DTX, น้ำหนัก)
   - อัปโหลดรูปภาพ → Supabase Storage → INSERT URL ลง image table
   - referral + appointment → status: "completed"
```

### Refer Back Flow (กรณีฉุกเฉิน)
```
รพ.สต. ตรวจพบอาการวิกฤต
   ↓
กด "ส่งตัวกลับ (Refer Back)"
   ↓
UPDATE patient SET service_unit_id = รพ. เดิม
สร้าง referral ใหม่ status="pending" priority="urgent"
ส่ง Email + In-App แจ้ง ER โรงพยาบาล
```

### ER Diagram Key Relationships
```
service_unit (1) ──< user (n)
service_unit (1) ──< patient (n)
patient (1) ──< referral (n)
patient (1) ──< appointments (n)
patient (1) ──< tracking (n)
appointments (1) ──| referral (1)     [linked]
appointments (1) ──| tracking (1)     [referenced]
tracking (1) ──< image (n)
user (1) ──< notification_system (n)
```

### Risk Assessment Logic (tracking)
| ค่า | เกณฑ์ | Risk Level |
|-----|-------|-----------|
| ความดัน SYS | ≥ 180 หรือ ≤ 90 | critical |
| ความดัน SYS | 140-179 หรือ 91-99 | warning |
| น้ำตาล DTX | ≥ 250 หรือ ≤ 60 | critical |
| ทั่วไป | ค่าปกติ | normal |

### Authentication Flow
- **Standard:** POST `/api/auth/login` → bcrypt.compare() → JWT Token
- **Google OAuth:** POST `/api/auth/google-login` → ตรวจสอบกับ Google API → ค้นหา email ใน `user_auth_providers` → JWT Token
- **JWT Payload:** `{ id, role, service_unit_id }`
- **Storage:** LocalStorage บน frontend (Nuxt)

## Files ที่เกี่ยวข้อง
- `senior_project_documentation.md` — เอกสารวิเคราะห์ฉบับสมบูรณ์ (Use Case, Sequence Diagram, ER Diagram)
- `backend/controllers/` — Business logic
- `backend/routes/` — API routes
