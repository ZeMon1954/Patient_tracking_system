# 🏥 Patient Tracking System — Project Memory

> **หมายเหตุสำหรับ Claude:** อ่านไฟล์นี้ก่อนทำงานทุกครั้ง เพื่อทำความเข้าใจบริบทโปรเจกต์ สถาปัตยกรรม และกฎเกณฑ์ที่ใช้

---

## 📌 ภาพรวมโปรเจกต์ (Project Overview)

**ชื่อระบบ:** ระบบติดตามและส่งต่อคนไข้ (Patient Tracking System)
**ประเภท:** Senior Project ฝึกงาน ปีที่ 4
**วัตถุประสงค์:** ระบบสำหรับส่งต่อผู้ป่วยจากโรงพยาบาลแม่ข่าย (รพ.) ไปยังอนามัย/รพ.สต. (PCU) เพื่อติดตามเยี่ยมบ้านหลังพ้นระยะวิกฤต

---

## 🏗️ Tech Stack

### Backend (Node.js/Express)
- **Runtime:** Node.js + Express v5
- **Database:** MySQL 2 (`mysql2`)
- **Auth:** JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **File Upload:** Multer (multipart/form-data)
- **Storage:** Supabase Storage (`@supabase/supabase-js`)
- **Email:** Nodemailer + SendGrid HTTP API
- **Scheduler:** node-cron
- **Dev:** Nodemon

### Frontend (Nuxt.js)
- **Framework:** Nuxt.js 3 (Vue 3)
- **Styling:** Tailwind CSS
- **TypeScript:** ใช้ tsconfig.json
- **Alerts/Popups:** SweetAlert2

### Database
- **DBMS:** MySQL
- **Storage:** Supabase Storage สำหรับรูปภาพ

---

## 📁 โครงสร้างไฟล์โปรเจกต์ (Project Structure)

```
Patient_tracking_system/
├── CLAUDE.md                    ← ไฟล์นี้ (Project Memory)
├── backend/
│   ├── index.js                 ← Entry point, Express app setup
│   ├── db.js                    ← MySQL connection pool
│   ├── .env                     ← Environment variables (ไม่ commit)
│   ├── controllers/             ← Business logic handlers
│   ├── routes/                  ← API route definitions
│   ├── middleware/              ← Auth middleware (JWT verify)
│   ├── services/                ← External services (email, storage)
│   ├── utils/                   ← Helper functions
│   ├── scripts/                 ← One-off scripts
│   └── uploads/                 ← Temp upload directory
├── frontend/
│   ├── app/                     ← Nuxt app directory (pages, components, etc.)
│   ├── nuxt.config.ts           ← Nuxt configuration
│   ├── tailwind.config.js       ← Tailwind CSS config
│   └── .env                     ← Frontend env vars (API base URL)
└── senior_project_documentation.md ← เอกสารวิเคราะห์ระบบฉบับเต็ม
```

---

## 👥 ผู้ใช้งานระบบ (User Roles)

| Role | ภาษาไทย | สิทธิ์หลัก |
|------|----------|------------|
| `hospital_staff` | เจ้าหน้าที่โรงพยาบาล | ลงทะเบียนคนไข้, สร้าง Referral, สร้าง Appointment, ดู Dashboard |
| `pcu_staff` | เจ้าหน้าที่อนามัย/รพ.สต. | รับ/ปฏิเสธ Referral, บันทึก Home Visit Tracking, จัดการ Appointment |
| `admin` / `manager` | ผู้ดูแลระบบ | จัดการ Users & Roles, จัดการ Service Units, ดู System Analytics |
| `patient` | ผู้ป่วย | รับอีเมลแจ้งเตือนเท่านั้น (ไม่มี UI login) |

---

## 🗄️ ตารางฐานข้อมูลหลัก (Core Database Tables)

| ตาราง | คำอธิบาย | FK สำคัญ |
|-------|----------|----------|
| `service_unit` | ข้อมูลโรงพยาบาล/รพ.สต. | — |
| `user` | บัญชีเจ้าหน้าที่ทุกประเภท | `service_unit_id` |
| `user_auth_providers` | OAuth providers (Google) | `user_id` |
| `patient` | ข้อมูลผู้ป่วย | `service_unit_id` |
| `patient_disease_groups` | โรคประจำตัวคนไข้ | `patient_id`, `disease_id` |
| `underlying_disease` | รายการกลุ่มโรค | — |
| `referral` | ใบส่งต่อคนไข้ | `patient_id`, `from_unit`, `to_unit`, `referred_by`, `received_by`, `appointment_id` |
| `appointments` | ปฏิทินนัดหมายเยี่ยมบ้าน | `patient_id`, `assigned_to`, `referral_id` |
| `tracking` | บันทึกผลสัญญาณชีพ | `patient_id`, `appointment_id`, `officer_id` |
| `image` | รูปภาพแนบการเยี่ยมบ้าน | `tracking_id` |
| `notification_system` | การแจ้งเตือน In-App | `user_id` |

### Status Values
- **Referral status:** `pending` → `accepted` / `rejected` → `completed`
- **Appointment status:** `pending` → `completed`
- **Risk level (tracking):** `normal` / `warning` / `critical`

---

## 🔌 API Endpoints หลัก (Key API Endpoints)

| Method | Path | คำอธิบาย |
|--------|------|----------|
| POST | `/api/auth/login` | Login ปกติ (username/password) |
| POST | `/api/auth/google-login` | Login ผ่าน Google OAuth |
| GET/POST | `/api/patients` | ดึง/สร้างข้อมูลคนไข้ |
| PUT | `/api/patients/:id` | แก้ไขข้อมูลคนไข้ |
| POST | `/api/referrals` | สร้างใบส่งต่อ |
| PUT | `/api/referrals/:id/status` | อัปเดตสถานะใบส่งต่อ (accept/reject) |
| POST | `/api/appointments` | สร้างนัดหมาย |
| POST | `/api/tracking` | บันทึกผลเยี่ยมบ้าน (multipart/form-data) |

---

## ⚙️ กฎเกณฑ์การพัฒนา (Development Rules)

### ✅ ควรทำ
- ใช้ `mysql2` pool จาก `db.js` ทุกครั้ง ห้ามสร้าง connection ใหม่
- ใช้ **Database Transaction** เมื่อมีการ INSERT/UPDATE หลายตารางพร้อมกัน
- Validate ข้อมูลทั้ง frontend (Nuxt) และ backend (Express) เสมอ
- Return HTTP status codes ที่ถูกต้อง: 200, 201, 400, 401, 403, 404, 409, 500
- ใช้ JWT Bearer Token ใน Authorization header ทุก request ที่ต้องการ auth
- เก็บรูปภาพใน **Supabase Storage** แล้ว INSERT เฉพาะ Public URL ลง table `image`
- ใช้ SweetAlert2 แสดงผล success/error บน frontend

### ❌ ห้ามทำ
- ห้าม hardcode credentials ใน source code — ใช้ `.env` เสมอ
- ห้าม commit `.env` ไฟล์ (มี gitignore แล้ว)
- ห้ามลบหรือแก้ไข `senior_project_documentation.md` โดยไม่ได้รับอนุญาต
- ห้ามสร้าง MySQL connection ใหม่นอกจาก `db.js`

---

## 🔐 Environment Variables ที่ต้องรู้

### Backend (`backend/.env`)
```
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME   # MySQL connection
JWT_SECRET                               # JWT signing secret
SUPABASE_URL, SUPABASE_KEY               # Supabase storage
SENDGRID_API_KEY                         # Email service
PORT                                     # Express server port
```

### Frontend (`frontend/.env`)
```
NUXT_PUBLIC_API_BASE                     # Backend API base URL
```

---

## 📋 Skills ที่ใช้งานได้

เรียกใช้ Skills เมื่อต้องการความช่วยเหลือเฉพาะด้าน:

- **`project-context`** — บริบทโปรเจกต์เชิงลึก, flow การทำงาน, ER Diagram
- **`backend-patterns`** — Pattern การเขียน Controller, Route, Middleware, Transaction
- **`frontend-patterns`** — Pattern การเขียน Nuxt page, composable, API call
- **`auto-git-push`** — Commit และ Push ขึ้น Git อัตโนมัติหลังแก้ไข code สำเร็จ

---

*อัปเดตล่าสุด: 2026-05-28*
