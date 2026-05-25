# คู่มือวิเคราะห์และออกแบบระบบ (Senior Project System Analysis & Design Guide)
> [!NOTE]
> เอกสารฉบับนี้จัดทำขึ้นเพื่อสำหรับนำไปใช้ประกอบรายงานความก้าวหน้าโครงการฝึกงาน หรือเล่มวิจัยจบการศึกษา (Senior Project) ปีที่ 4 โดยอิงตามระบบจริงของ **Patient Tracking System (ระบบติดตามและส่งต่อคนไข้)** ที่ได้รับการพัฒนาในองค์กร

---

## 1. Use Case Diagram (แผนภาพการใช้งานระบบ)
แผนภาพ Use Case แสดงผู้ใช้งานหลัก (**Actors**) และความสามารถของระบบ (**Use Cases**) ที่ออกแบบตามฟังก์ชันการทำงานจริง

```mermaid
graph TD
    subgraph Actors [ผู้ใช้งานระบบ]
        H[Hospital Staff<br/>เจ้าหน้าที่ รพ. / แพทย์]
        P[PCU Staff<br/>เจ้าหน้าที่ อนามัย / รพ.สต.]
        PA[Patient<br/>คนไข้ / ผู้ป่วย]
    end

    subgraph System [ระบบติดตามและส่งต่อคนไข้]
        UC1([1. เข้าสู่ระบบด้วย username/password หรือ Google Auth])
        UC2([2. ลงทะเบียน / แก้ไขข้อมูลคนไข้])
        UC3([3. ส่งต่อคนไข้จาก รพ. ไปยัง PCU])
        UC4([4. ตรวจสอบข้อมูลใน Inbox และตอบรับ/ปฏิเสธเคสส่งต่อ])
        UC5([5. นัดหมายคนไข้สำหรับเยี่ยมบ้าน])
        UC6([6. บันทึกประวัติการติดตามเยี่ยมบ้านและอัปโหลดรูปภาพ])
        UC7([7. รับการแจ้งเตือนแบบเรียลไทม์ผ่านอีเมล SendGrid HTTP])
        UC8([8. ดูสถิติสรุปบน Dashboard])
    end

    %% Relationships
    H --> UC1
    H --> UC2
    H --> UC3
    H --> UC5
    H --> UC8

    P --> UC1
    P --> UC4
    P --> UC5
    P --> UC6
    P --> UC8

    PA --> UC7

    %% Extend/Include styles (Implicit)
    UC3 -.->|Sends| UC7
    UC5 -.->|Sends| UC7
    UC6 -.->|Updates| UC5
```

---

## 2. Use Case Scenario / Specification (ตารางอธิบายรายละเอียด)
คำอธิบายขั้นตอนการทำงานอย่างเป็นระบบ (Scenario) ของ 3 ระบบหลักตามขอบเขตงาน

### UC-01: ระบบลงทะเบียนคนไข้ใหม่ (Patient Registration System)
| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **รหัส Use Case** | UC-01 |
| **ชื่อ Use Case** | การลงทะเบียนข้อมูลคนไข้ใหม่ (Patient Registration) |
| **Actor หลัก** | Hospital Staff (เจ้าหน้าที่ รพ.) / PCU Staff (เจ้าหน้าที่ รพ.สต.) |
| **คำอธิบาย** | เจ้าหน้าที่กรอกข้อมูลส่วนตัวของคนไข้เข้าระบบ โดยต้องระบุข้อมูลสำคัญให้ครบถ้วนจึงจะบันทึกสำเร็จ |
| **เงื่อนไขก่อนหน้า (Pre-conditions)** | 1. เจ้าหน้าที่ล็อกอินเข้าสู่ระบบเรียบร้อยแล้ว<br/>2. เจ้าหน้าที่มีสิทธิ์ในการสร้าง/แก้ไขประวัติผู้ป่วย |
| **เงื่อนไขหลังจบ (Post-conditions)** | 1. ระบบบันทึกข้อมูลผู้ป่วยใหม่ลงตาราง `patient`<br/>2. ข้อมูลกลุ่มโรคประจำตัวจับคู่ลงตาราง `patient_disease_groups` เพื่อใช้คัดกรองความเสี่ยง |
| **ขั้นตอนการทำงานหลัก (Main Flow)** | 1. เจ้าหน้าที่เลือกเมนู "ลงทะเบียนคนไข้ใหม่" บนระบบหน้าบ้าน<br/>2. เจ้าหน้าที่ต้องระบุข้อมูลทุกฟิลด์ให้ครบถ้วน ได้แก่:<br/>&nbsp;&nbsp;&nbsp;&nbsp;- เลขบัตรประชาชน (CID) 13 หลัก<br/>&nbsp;&nbsp;&nbsp;&nbsp;- ชื่อจริง และ นามสกุล<br/>&nbsp;&nbsp;&nbsp;&nbsp;- วัน/เดือน/ปีเกิด<br/>&nbsp;&nbsp;&nbsp;&nbsp;- เพศ<br/>&nbsp;&nbsp;&nbsp;&nbsp;- เบอร์โทรศัพท์<br/>&nbsp;&nbsp;&nbsp;&nbsp;- อีเมลแจ้งเตือน (รูปแบบถูกต้อง)<br/>&nbsp;&nbsp;&nbsp;&nbsp;- ที่อยู่โดยละเอียดสำหรับการเยี่ยมบ้าน<br/>&nbsp;&nbsp;&nbsp;&nbsp;- กลุ่มโรคประจำตัวอย่างน้อย 1 กลุ่มโรค<br/>3. เจ้าหน้าที่ตรวจสอบความถูกต้องและกดปุ่ม "บันทึกข้อมูล"<br/>4. ระบบหน้าบ้านและระบบหลังบ้านทำการตรวจสอบ (Validate) ทุกช่องข้อมูลตามเงื่อนไขที่กำหนด<br/>5. ระบบตรวจสอบว่าเลขบัตรประชาชน (CID) หรือเลข HN ซ้ำกับคนไข้รายอื่นในระบบหรือไม่<br/>6. ระบบรัน Database Transaction เพื่อบันทึกข้อมูลตาราง `patient` และตาราง `patient_disease_groups`<br/>7. หน้าจอแจ้งเตือนข้อความสำเร็จ "ลงทะเบียนผู้ป่วยสำเร็จ" และแสดงเลข HN ที่สร้างขึ้นใหม่ |
| **ขั้นตอนสลับ (Alternative Flow)** | **[กรณีข้อมูลสำคัญไม่ครบถ้วนหรือรูปแบบไม่ถูกต้อง]**<br/>4a. หากตรวจพบว่าฟิลด์ใดฟิลด์หนึ่งว่างเปล่า หรือรูปแบบอีเมลไม่ถูกต้อง ระบบหลังบ้านจะปฏิเสธการบันทึก (Return HTTP 400 Bad Request) และแสดงแจ้งเตือนฟิลด์ที่ต้องการแก้ไข<br/>**[กรณีเลขบัตรประชาชน (CID) ซ้ำซ้อน]**<br/>5a. หากตรวจพบว่ามี CID นี้ในฐานข้อมูลแล้ว ระบบจะยกเลิก Transaction (Return HTTP 409 Conflict) และแจ้งเตือนข้อผิดพลาดบัตรประชาชนซ้ำ |

---

### UC-02: ระบบนัดหมายเยี่ยมบ้าน (Appointment Scheduling System)
| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **รหัส Use Case** | UC-02 |
| **ชื่อ Use Case** | การนัดหมายเพื่อเยี่ยมบ้านและติดตามอาการ (Appointment Scheduling) |
| **Actor หลัก** | Hospital Staff (เจ้าหน้าที่ รพ.) / PCU Staff (เจ้าหน้าที่ รพ.สต.) |
| **คำอธิบาย** | เจ้าหน้าที่นัดหมายวัน เวลา และกำหนดเหตุผลในการลงพื้นที่ตรวจสุขภาพหรือเยี่ยมบ้านคนไข้ |
| **เงื่อนไขก่อนหน้า (Pre-conditions)** | 1. คนไข้ได้รับการลงทะเบียนเข้าระบบเป็นที่เรียบร้อยแล้ว |
| **เงื่อนไขหลังจบ (Post-conditions)** | 1. ระบบบันทึกข้อมูลงตาราง `appointments` ในสถานะรอนัดหมาย (`pending`) <br/>2. ระบบส่งอีเมลแจ้งเตือนนัดหมายไปยังผู้ป่วยและเจ้าหน้าที่ผู้ดูแลโดยอัตโนมัติ |
| **ขั้นตอนการทำงานหลัก (Main Flow)** | 1. เจ้าหน้าที่เปิดหน้าข้อมูลคนไข้ที่ต้องการนัดหมาย<br/>2. เจ้าหน้าที่เลือกเมนู "สร้างนัดหมาย"<br/>3. เจ้าหน้าที่กรอกข้อมูล: วันและเวลานัดหมาย, แพทย์/เจ้าหน้าที่ผู้รับผิดชอบนัดหมาย, และรายละเอียดวัตถุประสงค์ในการเข้าเยี่ยม<br/>4. เจ้าหน้าที่กดปุ่ม "บันทึกนัดหมาย"<br/>5. ระบบตรวจสอบข้อมูลและทำการเขียนบันทึกลงตาราง `appointments` ในรูปแบบสถานะ `pending`<br/>6. หลังการบันทึกสำเร็จ ระบบดึงข้อมูลอีเมลผู้เกี่ยวข้องและยิง HTTP Request ไปยัง SendGrid API เพื่อส่งอีเมลนัดหมายอัตโนมัติ<br/>7. หน้าจอปรากฏหน้าต่างแจ้งเตือนสำเร็จ |
| **ขั้นตอนสลับ (Alternative Flow)** | **[กรณีเลือกวันนัดหมายย้อนหลัง]**<br/>3a. ระบบตรวจสอบพบว่าวันนัดหมายมีค่าน้อยกว่าวันเวลาปัจจุบัน จะแสดงหน้าจอแจ้งเตือนความผิดพลาด และไม่อนุญาตให้ผ่านขั้นตอนบันทึก |

---

### UC-03: ระบบส่งต่อและติดตาม (Referral and Tracking System)
| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **รหัส Use Case** | UC-03 |
| **ชื่อ Use Case** | การส่งต่อผู้ป่วยและติดตามประเมินผลเยี่ยมบ้าน (Patient Referral & Tracking) |
| **Actor หลัก** | Hospital Staff (เจ้าหน้าที่ รพ. ผู้ส่งต่อ) / PCU Staff (เจ้าหน้าที่ รพ.สต. ผู้รับและติดตาม) |
| **คำอธิบาย** | กระบวนการส่งต่อผู้ป่วยพ้นระยะวิกฤตจาก รพ. ไปให้ รพ.สต.ดูแลต่อ โดย รพ.สต.จะรับเคสและบันทึกประวัติสัญญาณชีพที่ได้จากการลงเยี่ยมบ้าน |
| **เงื่อนไขก่อนหน้า (Pre-conditions)** | 1. ผู้ป่วยได้รับการจดทะเบียนในระบบ<br/>2. ได้รับการวินิจฉัยและมีคำสั่งส่งต่อการดูแลสุขภาพ |
| **เงื่อนไขหลังจบ (Post-conditions)** | 1. สถานะใบส่งต่อ (`referral`) และนัดหมาย (`appointments`) ได้รับการปรับเป็น `completed`<br/>2. บันทึกผลวัดสุขภาพลงตาราง `tracking` และรูปถ่ายแนบลงตาราง `image` เรียบร้อย |
| **ขั้นตอนการทำงานหลัก (Main Flow)** | 1. **[รพ. ส่งตัว]**: เจ้าหน้าที่ รพ. สร้างเคสส่งตัวผู้ป่วย ➡️ เลือก รพ.สต. ปลายทางระบุความเร่งด่วน ➡️ บันทึกข้อมูลและส่งอีเมลแจ้งอนามัยปลายทางอัตโนมัติ<br/>2. **[รพ.สต. ตอบรับ]**: เจ้าหน้าที่ รพ.สต. ตรวจสอบรายละเอียดใน Inbox และกดยอมรับ (Accept) ➡️ ระบบสร้างประวัตินัดหมายอ้างอิงอัตโนมัติ<br/>3. **[รพ.สต. บันทึกติดตาม]**: เมื่อเจ้าหน้าที่เดินทางไปตรวจคนไข้จริงเสร็จ จะมาเปิดหน้าต่าง "บันทึกผลการติดตาม" ➡️ ระบุสัญญาณชีพ (ความดันโลหิต SYS/DIA, ค่าน้ำตาล DTX, น้ำหนักตัว, อาการ และปัญหาสภาพแวดล้อมพร้อมแนบภาพถ่าย)<br/>4. เจ้าหน้าที่กดบันทึกผลการเยี่ยมบ้าน<br/>5. ระบบใช้ Transaction ทำการบันทึกตาราง `tracking` และ `image` พร้อมเปลี่ยนสถานะนัดหมายและใบส่งต่อเดิมให้กลายเป็น `completed` ทันที<br/>6. หน้าจอปรากฏแจ้งเตือนบันทึกผลสำเร็จ |
| **ขั้นตอนสลับ (Alternative Flow)** | **[กรณีปฏิเสธเคสส่งต่อ]**<br/>2a. หากตรวจสอบพบว่าผู้ป่วยไม่ได้อยู่ในเขตรับผิดชอบของอนามัยนั้น เจ้าหน้าที่ รพ.สต. กด "ปฏิเสธ" (Reject) พร้อมบันทึกเหตุผล ➡️ ระบบส่งอีเมลแจ้งกลับไปที่ รพ. เพื่อหาแนวทางส่งตัวต่อที่อื่น<br/>**[กรณีพบสัญญาณชีพเสี่ยงอันตราย]**<br/>5a. หากข้อมูลความดันโลหิตหรือน้ำตาลอยู่ในเกณฑ์วิกฤต (Critical) ระบบจะขึ้นป๊อปอัปแจ้งเตือนให้เจ้าหน้าที่ประสานงานเพื่อส่งตัวผู้ป่วยกลับโรงพยาบาลใหญ่อย่างเร่งด่วน |

---

## 3. Flow Chart (แผนผังลำดับขั้นตอนการทำงาน / Workflow)
แผนภูมิแสดง Flow การทำงานเชิงธุรกิจของกระบวนการส่งต่อและการติดตามเยี่ยมนัดหมายตั้งแต่ต้นจนจบกระบวนการ

```mermaid
flowchart TD
    Start([เริ่มต้น]) --> Step1[รพ. ลงทะเบียนคนไข้]
    Step1 --> Step2[รพ. ส่งตัวคนไข้ ไปยัง รพ.สต./PCU]
    Step2 --> Step3{ระบบส่งเมลแจ้งเตือนสำเร็จ?}
    Step3 -- ใช่ --> Step4[แจ้งเตือนคนไข้ & รพ.สต.]
    Step3 -- ไม่สำเร็จ --> Step5[บันทึกประวัติข้อผิดพลาดใน Log]
    
    Step4 --> Step6[รพ.สต. เปิดดู Inbox]
    Step5 --> Step6
    Step6 --> Step7{รพ.สต. กดรับเคส?}
    
    Step7 -- ปฏิเสธ --> Step8[ส่งเคสกลับ รพ. พร้อมเหตุผล] --> End1([จบขั้นตอนการปฏิเสธ])
    
    Step7 -- ตอบรับ --> Step9[ระบบเปิดสถานะ Accepted & สถาปนานัดหมาย]
    Step9 --> Step10[เจ้าหน้าที่ลงพื้นที่เยี่ยมบ้านคนไข้จริง]
    Step10 --> Step11[กรอกผลสัญญาณชีพ & อัปโหลดรูปแวดล้อมลงระบบ]
    Step11 --> Step12[ระบบตรวจสอบข้อมูลความปลอดภัย]
    
    Step12 --> Step13[บันทึกลงฐานข้อมูล & ปรับสถานะนัดหมายเป็น Completed]
    Step13 --> End2([จบการติดตาม/เยี่ยมบ้านเสร็จสิ้น])
```

---

## 4. Sequence Diagram (แผนภาพลำดับขั้นการทำงาน)
แสดงการแลกเปลี่ยนข้อมูลระหว่างส่วนประกอบต่างๆ ในระบบจริง เช่น การสร้างนัดหมายและการทำงานร่วมกับบริการภายนอก (SendGrid) ผ่าน HTTP Request

```mermaid
sequenceDiagram
    autonumber
    actor Staff as เจ้าหน้าที่ (รพ. / PCU)
    participant FE as หน้าบ้าน (Nuxt.js Web App)
    participant BE as หลังบ้าน (Node.js/Express API)
    participant DB as ฐานข้อมูล (MySQL Cloud)
    participant SG as SendGrid HTTP API
    actor Patient as กล่องเมลคนไข้/เจ้าหน้าที่

    Staff ->> FE: กรอกข้อมูลและกดปุ่ม "บันทึกนัดหมาย"
    FE ->> BE: HTTP POST /api/patients/appointments (ข้อมูลนัด + JWT token)
    activate BE
    BE ->> BE: ตรวจสอบความถูกต้องของ Token & สิทธิ์
    
    BE ->> DB: INSERT INTO appointments (ข้อมูลนัดหมาย, status='pending')
    activate DB
    DB -->> BE: ส่งข้อมูลผลลัพธ์สำเร็จ และ appointment_id กลับมา
    deactivate DB
    
    BE ->> DB: ค้นหาข้อมูลอีเมลของ (คนไข้ และ เจ้าหน้าที่ผู้สร้าง)
    activate DB
    DB -->> BE: ส่งคืนค่าอีเมลผู้เกี่ยวข้อง
    deactivate DB

    Note over BE, SG: ทำการส่งอีเมลแบบ Asynchronous เพื่อไม่ให้หน้าเว็บค้าง
    BE ->> SG: HTTP POST https://api.sendgrid.com/v3/mail/send (Authorization: Bearer SG_KEY)
    activate SG
    SG -->> BE: HTTP 202 Accepted (ส่งคำขอเข้าระบบส่งเมลแล้ว)
    deactivate SG
    
    SG -->> Patient: นำส่งอีเมลนัดหมายจริงเข้าสู่ Gmail Inbox 📬
    
    BE -->> FE: HTTP 201 Created (แจ้งข้อมูลบันทึกสำเร็จพร้อมรายละเอียด)
    deactivate BE
    FE -->> Staff: แสดงหน้าต่างแจ้งเตือนสำเร็จ (SweetAlert2)
```

---

## 5. ER Diagram (Entity-Relationship Diagram)
โครงสร้างความสัมพันธ์ระหว่างข้อมูลในฐานข้อมูล MySQL จริงของระบบ โดยระบุ Primary Key (PK) และ Foreign Key (FK) ตามที่ใช้จริงในสถาปัตยกรรมระบบ

```mermaid
erDiagram
    SERVICE_UNIT ||--o{ USER : "has_staff"
    SERVICE_UNIT ||--o{ PATIENT : "registers"
    USER ||--o{ USER_AUTH_PROVIDERS : "authenticates"
    PATIENT ||--o{ PATIENT_DISEASE_GROUPS : "has"
    UNDERLYING_DISEASE ||--o{ PATIENT_DISEASE_GROUPS : "is_associated"
    PATIENT ||--o{ APPOINTMENTS : "has_appointments"
    USER ||--o{ APPOINTMENTS : "assigns"
    
    PATIENT ||--o{ REFERRAL : "referred"
    SERVICE_UNIT ||--o{ REFERRAL : "originates_from"
    SERVICE_UNIT ||--o{ REFERRAL : "destined_to"
    USER ||--o{ REFERRAL : "referred_by_officer"
    USER ||--o{ REFERRAL : "received_by_officer"
    APPOINTMENTS ||--o| REFERRAL : "linked"
    
    PATIENT ||--o{ TRACKING : "monitored"
    APPOINTMENTS ||--o| TRACKING : "referenced"
    USER ||--o{ TRACKING : "visited_by_officer"
    TRACKING ||--o{ IMAGE : "has_attachment"
    
    USER ||--o{ NOTIFICATION_SYSTEM : "notified"

    SERVICE_UNIT {
        int id PK
        string unit_code UK
        string name
        string type
        string address
        string province
        string district
        string sub_district
        string phone
        string status
    }

    USER {
        int id PK
        string username UK
        string password_hash
        string first_name
        string last_name
        string role
        int service_unit_id FK
        string email
    }

    PATIENT {
        int id PK
        int service_unit_id FK
        string hn_number UK
        string cid UK
        string first_name
        string last_name
        date date_of_birth
        string gender
        string phone
        string email
        text address
    }

    APPOINTMENTS {
        int id PK
        int patient_id FK
        int doctor_id FK
        datetime appointment_date
        text reason
        string status
    }

    REFERRAL {
        int id PK
        int patient_id FK
        int appointment_id FK
        int from_service_unit_id FK
        int to_service_unit_id FK
        int referred_by_user_id FK
        int receiver_user_id FK
        datetime referral_date
        datetime received_at
        text reason
        string urgency_level
        string status
        text reject_reason
    }

    TRACKING {
        int id PK
        int patient_id FK
        int appointment_id FK
        int tracked_by_user_id FK
        datetime tracking_date
        text symptoms_detail
        string health_status
        int bp_sys
        int bp_dia
        int sugar
        decimal weight
        text problems
        text advice
        string location
        datetime next_appointment_date
    }

    IMAGE {
        int id PK
        string reference_type
        int reference_id
        string file_name
        string file_path
        string file_type
        int uploaded_by FK
        datetime uploaded_at
    }
```

---

## 6. Data Dictionary (พจนานุกรมข้อมูล)
โครงสร้างฟิลด์ข้อมูลอย่างละเอียดของตารางที่สำคัญ เพื่อสำหรับใส่ในเอกสารบทที่ 3 ของเล่มรายงาน

### ตารางที่ 1: `patient` (ข้อมูลคนไข้)
เก็บรายละเอียดประวัติข้อมูลส่วนตัวของคนไข้ที่รับการส่งตัวหรือนัดหมาย

| ชื่อคอลัมน์ (Column Name) | ประเภทข้อมูล (Data Type) | คีย์หลัก/นอก (Key) | ค่าว่างได้ไหม (Null) | คำอธิบาย (Description) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | INT AUTO_INCREMENT | PK | NO | ไอดีอ้างอิงลำดับของข้อมูลผู้ป่วย |
| `service_unit_id` | INT | FK | NO | อ้างอิงหน่วยบริการที่จดทะเบียนแรกรับ (`service_unit.id`) |
| `hn_number` | VARCHAR(50) | UK | NO | หมายเลขประจำตัวผู้ป่วยของโรงพยาบาล (HN Number) |
| `cid` | VARCHAR(13) | UK | NO | เลขประจำตัวประชาชน 13 หลักของผู้ป่วย |
| `first_name` | VARCHAR(100) | - | NO | ชื่อจริงของผู้ป่วย (ภาษาไทย) |
| `last_name` | VARCHAR(100) | - | NO | นามสกุลของผู้ป่วย (ภาษาไทย) |
| `date_of_birth` | DATE | - | NO | วัน/เดือน/ปี เกิดของผู้ป่วย |
| `gender` | VARCHAR(10) | - | NO | เพศของผู้ป่วย (ชาย, หญิง, อื่นๆ) |
| `phone` | VARCHAR(20) | - | YES | เบอร์โทรศัพท์ติดต่อของผู้ป่วยหรือญาติ |
| `email` | VARCHAR(255) | - | YES | อีเมลสำหรับใช้ในการส่งแจ้งเตือนนัดหมายและส่งตัว |
| `address` | TEXT | - | YES | ที่อยู่ปัจจุบันสำหรับการลงพื้นที่เยี่ยมบ้าน |

---

### ตารางที่ 2: `referral` (ประวัติการส่งต่อผู้ป่วย)
ใช้สำหรับบริหารจัดเก็บข้อมูลการส่งเคสจากโรงพยาบาลใหญ่ไปยัง รพ.สต./อนามัย

| ชื่อคอลัมน์ (Column Name) | ประเภทข้อมูล (Data Type) | คีย์หลัก/นอก (Key) | ค่าว่างได้ไหม (Null) | คำอธิบาย (Description) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | INT AUTO_INCREMENT | PK | NO | ไอดีอ้างอิงลำดับของข้อมูลส่งตัว |
| `patient_id` | INT | FK | NO | ผู้ป่วยที่ต้องการส่งตัว (`patient.id`) |
| `appointment_id` | INT | FK | YES | ลิงก์เชื่อมการนัดหมายที่สร้างขึ้นเพื่อรับงานส่งต่อ |
| `from_service_unit_id`| INT | FK | NO | หน่วยงานผู้ส่งต้นทาง (`service_unit.id`) |
| `to_service_unit_id` | INT | FK | NO | หน่วยงานผู้รับปลายทาง (`service_unit.id`) |
| `referred_by_user_id`| INT | FK | NO | แพทย์หรือเจ้าหน้าที่ผู้กดส่งเคส (`user.id`) |
| `receiver_user_id` | INT | FK | YES | เจ้าหน้าที่ อนามัยที่กดรับเคสที่ส่งมา (`user.id`) |
| `referral_date` | DATETIME | - | NO | วันและเวลาที่ลงบันทึกส่งเคสออก |
| `received_at` | DATETIME | - | YES | วันและเวลาที่เจ้าหน้าที่ปลายทางกดตอบรับเคส |
| `reason` | TEXT | - | YES | เหตุผลทางการแพทย์หรืออาการทางคลินิกของการส่งตัว |
| `urgency_level` | VARCHAR(20) | - | NO | ระดับความเร่งด่วน (`low`, `medium`, `high`, `critical`) |
| `status` | VARCHAR(20) | - | NO | สถานะการส่งตัว (`pending`, `accepted`, `rejected`, `completed`) |
| `reject_reason` | TEXT | - | YES | เหตุผลในกรณีที่ปลายทางปฏิเสธเคส |

---

### ตารางที่ 3: `tracking` (ประวัติการเยี่ยมบ้าน/ติดตามคนไข้)
เก็บข้อมูลผลการตรวจประเมินระดับสัญญาณชีพและประวัติทางสุขภาพเมื่อไปติดตามคนไข้

| ชื่อคอลัมน์ (Column Name) | ประเภทข้อมูล (Data Type) | คีย์หลัก/นอก (Key) | ค่าว่างได้ไหม (Null) | คำอธิบาย (Description) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | INT AUTO_INCREMENT | PK | NO | ไอดีอ้างอิงของใบประเมินการเยี่ยมบ้าน |
| `patient_id` | INT | FK | NO | รหัสคนไข้ที่ได้รับการติดตามประเมินผล (`patient.id`) |
| `appointment_id` | INT | FK | YES | อ้างอิงรอบการนัดหมายเยี่ยมบ้าน (`appointments.id`) |
| `tracked_by_user_id` | INT | FK | NO | เจ้าหน้าที่ผู้เดินทางไปเยี่ยมบ้านและตรวจวัด (`user.id`) |
| `tracking_date` | DATETIME | - | NO | วันและเวลาที่ลงพื้นที่เยี่ยมบ้านจริง |
| `symptoms_detail` | TEXT | - | YES | รายละเอียดอาการแสดงและสุขภาพทางคลินิกทั่วไป |
| `health_status` | VARCHAR(20) | - | NO | การจำแนกความเสี่ยงของคนไข้ (`normal`, `warning`, `critical`) |
| `bp_sys` | INT | - | YES | ค่าความดันตัวบน (Systolic Blood Pressure) มิลลิเมตรปรอท |
| `bp_dia` | INT | - | YES | ค่าความดันตัวล่าง (Diastolic Blood Pressure) มิลลิเมตรปรอท |
| `sugar` | INT | - | YES | ค่าน้ำตาลในเลือดจากปลายนิ้ว (DTX/Sugar) มิลลิกรัม/เดซิลิตร |
| `weight` | DECIMAL(5,2) | - | YES | น้ำหนักตัวปัจจุบันของผู้ป่วย (กิโลกรัม) |
| `problems` | TEXT | - | YES | ปัญหาและอุปสรรคที่พบเจอ เช่น สภาพจิตใจ สภาพแวดล้อม |
| `advice` | TEXT | - | YES | คำแนะนำทางการพยาบาลหรือการกินยาที่มอบให้คนไข้ |
| `location` | VARCHAR(255) | - | YES | พิกัดหรือตำแหน่งที่อยู่อ้างอิงในการเยี่ยม |
| `next_appointment_date`| DATETIME | - | YES | กำหนดวันนัดหมายเพื่อเดินทางมาเยี่ยมในรอบถัดไป |

---

### ตารางที่ 4: `appointments` (การนัดหมายของคนไข้)
เก็บข้อมูลปฏิทินนัดหมายในการเยี่ยมหรือรับบริการ

| ชื่อคอลัมน์ (Column Name) | ประเภทข้อมูล (Data Type) | คีย์หลัก/นอก (Key) | ค่าว่างได้ไหม (Null) | คำอธิบาย (Description) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | INT AUTO_INCREMENT | PK | NO | ไอดีรหัสการนัดหมาย |
| `patient_id` | INT | FK | NO | ลิงก์ไปยังข้อมูลผู้ป่วยที่มีการนัดหมาย (`patient.id`) |
| `doctor_id` | INT | FK | NO | เจ้าหน้าที่ที่ได้รับมอบหมายให้ออกตรวจตามนัด (`user.id`) |
| `appointment_date` | DATETIME | - | NO | วันที่และเวลาที่นัดหมายทำการตรวจ |
| `reason` | TEXT | - | YES | วัตถุประสงค์หรือประเด็นที่นัดเพื่อตรวจประเมิน |
| `status` | VARCHAR(20) | - | NO | สถานะการนัดหมาย (`pending`, `completed`, `missed`, `cancelled`) |

---

### ตารางที่ 5: `user` (ผู้ใช้ระบบ/เจ้าหน้าที่ปฏิบัติงาน)
จัดเก็บรายละเอียดโปรไฟล์และสิทธิ์การทำงานของบุคลากรทางการแพทย์ในระบบ

| ชื่อคอลัมน์ (Column Name) | ประเภทข้อมูล (Data Type) | คีย์หลัก/นอก (Key) | ค่าว่างได้ไหม (Null) | คำอธิบาย (Description) |
| :--- | :--- | :---: | :---: | :--- |
| `id` | INT AUTO_INCREMENT | PK | NO | ไอดีสำหรับอ้างอิงตัวบุคคลของเจ้าหน้าที่ |
| `username` | VARCHAR(100) | UK | NO | บัญชีผู้ใช้งานระบบ (Unique Username) |
| `password_hash` | VARCHAR(255) | - | NO | รหัสผ่านที่ได้รับการเข้ารหัสความปลอดภัยด้วย bcrypt |
| `first_name` | VARCHAR(100) | - | NO | ชื่อจริงของเจ้าหน้าที่สาธารณสุข |
| `last_name` | VARCHAR(100) | - | NO | นามสกุลของเจ้าหน้าที่สาธารณสุข |
| `role` | VARCHAR(50) | - | NO | ระดับสิทธิ์ทำงาน (`admin`, `manager`, `hospital_staff`, `pcu_staff`) |
| `service_unit_id` | INT | FK | YES | หน่วยบริการทางการแพทย์ที่สังกัดทำงานอยู่ (`service_unit.id`) |
| `email` | VARCHAR(255) | - | YES | อีเมลติดต่อสำหรับการรับแจ้งเตือนระบบงานส่งตัวนัดหมาย |
