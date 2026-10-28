# AICTE ComplianceFlow 🏛️⚖️
> **Integrated Regulatory Workflow Automation, Continuous Institutional Compliance Monitoring, and Statutory SLA Governance Engine**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python 3.13](https://img.shields.io/badge/Python-3.13-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![SQLAlchemy 2.0](https://img.shields.io/badge/ORM-SQLAlchemy%202.0-D71F00.svg)](https://www.sqlalchemy.org/)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20(Vite)-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Problem Statement

The All India Council for Technical Education (AICTE) oversees approval processes, institutional extensions, and regulatory adherence for thousands of technical colleges, universities, and polytechnics across India. 

The traditional regulatory review and compliance monitoring landscape faces critical operational bottlenecks:
1. **Disjointed Approval Workflows**: Institutional applications (New Institution, Extension of Approval [EoA], Intake Variations) transition across multiple committees—Scrutiny, Expert Visiting Committees (EVC), and Standing Appellate Committees (SAC)—without centralized state-machine enforcement, leading to process ambiguity.
2. **Post-Approval Compliance Blind Spots**: Mandatory statutory obligations (e.g., Land Title continuity, 10-year Corpus Fund FDR rollover liens, AICTE Cadre Ratios, Fire & Life Safety NOC renewals) are often filed once and rarely audited dynamically across their lifecycle.
3. **SLA Breaches & Latency**: Without automated countdowns and proactive escalation triggers, procedural bottlenecks stall applications past statutory Approval Process Handbook (APH) timeframes.
4. **Evidence Integrity Vulnerabilities**: Manual submission of compliance documentation lacks immutable cryptographic audit trails and deterministic verification tracking.

---

## 💡 Solution Overview

**AICTE ComplianceFlow** is an end-to-end regulatory platform bridging application approvals and continuous institutional compliance monitoring. 

Built using **FastAPI**, **SQLAlchemy 2.0**, and a **React-Vite** executive portal, the platform enforces:
* **Declarative APH State Engine**: Formalized stage transitions (`DRAFT` ➔ `SUBMITTED` ➔ `SCRUTINY` ➔ `EVC_SCHEDULED` ➔ `SAC_SHC` ➔ `APPROVED` / `REJECTED`) strictly governed by codified handbook rules.
* **Continuous Covenant Monitoring**: Active obligation tracking with automated status transitions (`AWAITING_SUBMISSION`, `UNDER_VERIFICATION`, `DEFICIENT`, `OVERDUE`).
* **Multi-Tier Escalation Matrix**: Automated chronological triggers escalating unresolved bottlenecks from Regional Offices (RO) to Bureau Officers and Central Authority if statutory SLA thresholds are exceeded.
* **Cryptographic Evidence Registry**: Automated SHA-256 document hashing preventing retrospective tampering of uploaded institutional deeds and certificates.

---

## 🔍 Comparative Analysis: Previous Approaches vs. Innovation

| Dimension | Legacy / Manual Process | Basic Digitized Portals | **AICTE ComplianceFlow (Our Solution)** |
| :--- | :--- | :--- | :--- |
| **Approval Lifecycle** | Physical files, manual movement across regional offices. | Web forms with static file uploads; manual status flags. | **Strict Finite State Machine (FSM)** with rule versioning and dynamic jurisdictional access control. |
| **Compliance Tracking** | Reactive checks performed only during annual renewals. | Unstructured document folders; manual inspection check-lists. | **Active Covenant Subsystem** with SLA tracking, countdowns, and automated deficiency workflows. |
| **Escalations & SLA** | Manual complaint letters; non-deterministic escalations. | Static email reminders before deadlines. | **Automated SLA Engine** triggering level-based escalations (RO ➔ Bureau ➔ Chairman) after statutory hour thresholds (e.g., 72 hrs). |
| **EVC Management** | Ad-hoc committee selection; physical dispatch delays. | Manual calendar entries with offline coordination. | **Integrated EVC Scheduler** enforcing panel composition quotas, digital signature tracking, and deficiency reporting. |
| **Audit & Governance** | Paper register logs vulnerable to record loss. | Simple database update timestamps. | **Append-only Audit Event Trail** logging entity modifications, actor UUIDs, IPs, and severity indices. |

---

## 🚀 Key Innovations

1. **Codified Approval Process Handbook (APH) Rules**: State transitions are not hardcoded business logic; they are backed by declarative `WorkflowRuleVersion` models, allowing zero-downtime policy updates when AICTE publishes revised annual regulations.
2. **Dual-Loop Regulatory Architecture**: Closes the loop between *pre-approval scrutiny* and *post-approval continuous covenants* on a single dashboard.
3. **Cryptographically Verifiable Evidentiary Vault**: Uploaded PDFs and inspection reports generate SHA-256 checksums at ingestion, providing non-repudiation during appellate or legal reviews.
4. **Role-Tailored Executive Cockpit**: Instant visibility for Regional Officers and Central Bureau members into regional throughput, officer caseload, and systemic bottleneck metrics.

---

## 🔄 Solution Workflow

<img width="662" height="972" alt="AICTE drawio" src="https://github.com/user-attachments/assets/3255aacc-2bd6-40d5-8818-9e98b57a7163" />

---

## 🏛️ System Architecture

AICTE ComplianceFlow uses a modular, layered regulatory architecture. It strictly decouples client presentation from the statutory finite state machine, background compliance evaluation, and persistent storage layers.
```
aicte/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── applications.py      # Application lifecycle routes
│   │   │       ├── compliance.py        # Statutory covenant tracking
│   │   │       ├── escalations.py       # SLA breach & alert routing
│   │   │       ├── evc.py               # Panel constitution & report handling
│   │   │       ├── reports.py           # Executive analytics & MIS queries
│   │   │       └── documents.py         # File ingestion & SHA-256 checks
│   │   ├── core/
│   │   │   ├── database.py              # Engine setup & session dependency
│   │   │   └── dependencies.py          # JWT & RequireRole guards
│   │   ├── models/
│   │   │   ├── base.py                  # Registry importing all sub-models
│   │   │   ├── user.py                  # Roles, regions, and permissions
│   │   │   ├── institution.py           # College registry & address data
│   │   │   ├── application.py           # APH application master records
│   │   │   ├── workflow.py              # Declarative transition rules
│   │   │   ├── evc.py                   # EVC panels & schedule records
│   │   │   ├── compliance.py            # Covenants, escalations & notifications
│   │   │   ├── document.py              # Document metadata & hashes
│   │   │   └── audit.py                 # Append-only governance audit log
│   │   ├── services/
│   │   │   └── escalation_service.py    # SLA threshold evaluation engine
│   │   └── main.py                      # FastAPI initialization & router mounting
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Complete multi-screen executive UI
│   │   ├── main.jsx                     # DOM mount point
│   │   └── index.css                    # Tailwind utility injections
│   ├── index.html                       # Base HTML mounting index
│   ├── tailwind.config.js               # Theme configuration
│   ├── vite.config.js                   # Development proxy & server configs
│   └── package.json
└── README.md
```

## 💻 Tech Stack & Technical Specifications

### **Backend Framework & Core Engine**
* **Runtime & Language**: Python 3.13
* **Web API Framework**: FastAPI (Asynchronous endpoint execution, Pydantic v2 data validation, OpenAPI/Swagger generation)
* **ORM & Database Layer**: SQLAlchemy 2.0 (Strictly typed mapped models, foreign-key indexing, relational integrity across 8 core domain models)
* **Database Support**: SQLite 3 (Default local development) / PostgreSQL 15+ (Production container deployment)
* **Process Reloader**: Uvicorn running with WatchFiles

### **Frontend Client Application**
* **Core Framework**: React 18 (Single Page Application)
* **Tooling & Bundler**: Vite 5
* **CSS & Design System**: Tailwind CSS v3 (Enterprise slate & teal regulatory palette)
* **Iconography**: Lucide React
* **Typography**: Inter (via Google Fonts CDN)

### **Key Technical Specifications**
* **Statutory State Machine**: Codified APH Finite State Machine enforcing lifecycle transitions (`SUBMITTED` ➔ `SCRUTINY` ➔ `EVC_SCHEDULED` ➔ `SAC_SHC` ➔ `APPROVED` / `REJECTED`).
* **Continuous Compliance Engine**: Automated calculation of covenant adherence (`VERIFIED`, `DEFICIENT`, `OVERDUE`) mapped against statutory deadlines.
* **Multi-Tier Escalation Matrix**: Chronological background triggers escalating unresolved bottlenecks from Regional Officers (48h) to Central Bureau Officers (72h).
* **Evidentiary Integrity**: Automated SHA-256 cryptographic document checksum calculation on ingestion to prevent retrospective tampering.
* **Immutable Audit Trail**: Append-only event logging capturing actor UUIDs, IPs, and UTC timestamps for regulatory non-repudiation.

---

## ⚡ Quick Start & Local Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Python 3.11+**
* **Node.js 18+** & **npm**
* **Git**

## SCREENSHOTS
<img width="1917" height="911" alt="image" src="https://github.com/user-attachments/assets/5ea22157-f3a4-4406-9e10-695fb6e94cb5" />

<img width="1895" height="913" alt="image" src="https://github.com/user-attachments/assets/16494182-ec04-42f2-8b82-2e90a805d6ed" />

<img width="1915" height="905" alt="image" src="https://github.com/user-attachments/assets/59b09f4e-91cc-4d29-a749-ce491a1b4618" />

<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/81958c7c-316b-4ccd-8d67-3569ec24c8f5" />

<img width="1917" height="911" alt="image" src="https://github.com/user-attachments/assets/58f33748-a58b-42a9-be93-8ae1c7dc4f5a" />

<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/3a47ede4-0668-48d7-8010-115d772c887a" />

<img width="1917" height="901" alt="image" src="https://github.com/user-attachments/assets/5fdf1679-6939-4104-a547-ce879558e6cf" />

<img width="1917" height="907" alt="image" src="https://github.com/user-attachments/assets/2335573d-87b8-4f6b-b6df-79ee40813985" />


### 2. Backend Setup

Open a PowerShell terminal:
### 1. Navigate to the backend directory
```
cd backend
```

### 2. Create and activate a Python virtual environment
```
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install backend dependencies
```
pip install fastapi "uvicorn[standard]" sqlalchemy pydantic python-multipart
```

### 4. Initialize database tables and compile schema relationships
```
python -c "from app.core.database import engine, Base; import app.models.base; Base.metadata.create_all(bind=engine); print('--- Database schema successfully initialized ---')"
```

### 5. Start the backend development server
```
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 6. Backend Service URL
```
http://127.0.0.1:8000/
```

### 7. Interactive Swagger UI 
```
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

Open a **second, separate** PowerShell terminal:

### 1. Navigate to the frontend directory
```
cd frontend
```

### 2. Install Node dependencies
```
npm install
```

### 3. Start the Vite development server
```
npm run dev
```

### Frontend Dashboard: 
```
http://localhost:5173/
```

---

### 4. Verification

Keep both terminal sessions running concurrently. Open your browser and navigate to `http://localhost:5173/` to interact with the executive dashboard, applications list, continuous compliance monitoring, EVC scheduling, and reporting views.
