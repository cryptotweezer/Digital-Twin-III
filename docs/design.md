# Technical Design Document
## Digital Twin III – SecOps & Active Defense Platform

## 1. Architecture Overview
Digital Twin III is a cloud-native SecOps platform built on a serverless architecture. The system operates as a self-defending learning environment that detects, blocks, analyzes, and explains malicious behavior in real time.

The architecture follows a layered defense model:
Client → Edge Security (Arcjet) → Application Logic (Next.js) → Data Layer (Neon + Drizzle) → AI Intelligence (Vercel AI SDK)

## 2. High-Level System Components

### 2.1 Frontend (Next.js App Router)
- Public-facing UI for Apprentices and Adversaries
- Dashboards for telemetry visualization
- Ethical attack lab interfaces
- Hall of Fame leaderboard

### 2.2 Edge Security Layer (Arcjet)
- Web Application Firewall (WAF)
- Bot Detection
- Rate Limiting
- Tarpitting for high-risk sessions
All inbound requests pass through Arcjet before reaching application logic.

### 2.3 Backend Logic
- Session fingerprinting without authentication
- Risk scoring engine (0–100 scale)
- Attack classification (SQLi, XSS, Prompt Injection, IDOR)
- Request routing to AI explanation engine

### 2.4 Data Layer (Neon + Drizzle ORM)
- Immutable security event logs
- Session metadata storage
- Risk score history
- Leaderboard records (AI-generated aliases)

Logs are append-only to prevent tampering and support forensic analysis.

### 2.5 AI Intelligence Layer (Vercel AI SDK)
- Translates raw security logs into human-readable explanations
- Explains blocked attacks for Apprentices
- Generates forensic narratives for analysts
- Enforces Zero-Trust AI policies to prevent data leakage

---

## 3. Module Design

### 3.1 The Watchtower (Telemetry Dashboard)
- Live feed of blocked and allowed requests
- Global threat level indicator
- Geographic heatmap of attack origins
- Data sourced from Arcjet logs and internal risk engine

### 3.2 Session Intel
- Stateless user fingerprinting
- Per-session risk scoring
- Timeline of detected behaviors
- AI-generated forensic summaries

### 3.3 Ethical Attack Lab
- Controlled SQL injection simulation
- Prompt injection challenge for AI chatbot
- IDOR and access control simulations
- All attacks are sandboxed and logged

### 3.4 Hall of Fame
- Research points awarded for discoveries
- Leaderboard with anonymized aliases
- Anti-abuse rules to prevent farming

---

## 4. Data Flow

1. User request reaches Arcjet edge protection
2. Arcjet evaluates request and blocks or forwards
3. Request metadata logged immutably
4. Risk score updated
5. AI engine generates explanation or narrative
6. Frontend displays outcome in real time

---

## 5. Security & Non-Functional Requirements

- No storage of PII
- Immutable audit logs
- AI output filtering (Zero-Trust AI)
- Rate limiting and abuse prevention
- Scalable serverless deployment
- $0-cost friendly architecture using Vercel free tiers

---

## 6. Deployment Architecture
- Hosted on Vercel
- Environment variables managed securely
- HTTPS enforced with SSL
- CI/CD via GitHub → Vercel integration

---

## 7. Design Validation
This design supports:
- Learning-first security education
- Real-time active defense
- Safe adversarial experimentation
- AI-assisted security analysis

The system is ready for implementation in Weeks 3–6.
