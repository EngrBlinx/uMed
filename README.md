<div align="center">

# uMed

### A focused, user-friendly foundation for modern healthcare experiences
</div>

## Overview

uMed is a healthcare-oriented application designed with clarity, accessibility, and maintainability in mind. This app solves the problem of long queues, missed appointments and other issues that can arise from lack of an appointment managing platform.
The repository is intentionally structured to support iterative development: features can be added without compromising the user experience, code quality, or future scalability.

## Why uMed?

- **Human-centered:** simple flows and clear information hierarchy
- **Accessible by default:** readable content, user-friendly, and responsive layouts
- **Maintainable:** organized code and documented development conventions
- **Extensible:** a foundation for adding record history, alerting, reminder, and other healthcare workflows

## Highlights

- Responsive interface for desktop and mobile users
- Reusable UI patterns and components
- Clear separation between presentation and application logic
- Form-ready workflows with validation in mind
- Project documentation suitable for continued team development

## Tech Stack

- **Frontend:** HTML, CSS, React 19, Vite 8
- **Backkend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Security / Infrastructure:** bcryptjs, dotenv, CORS
- **Architecture:** component-based, responsive web application
- **Tooling:** Git/GitHub, ESLint, Prisma, tsx
- **Quality:** semantic markup, responsive design, and maintainable CSS/JavaScript

## Getting Started

### Prerequisites

- Git
- A modern web browser

## Repository Structure

```text
uMed/
├── frontend/                  # React 19 Client Application
│   ├── src/                   # React components, hooks, and services
│   ├── package.json           # Client dependencies & Vite scripts
│   └── vite.config.ts         # Vite bundler configuration
│
├── backend/                   # Node.js / Express REST API
    ├── prisma/
    │   ├── schema.prisma      # PostgreSQL relational database schema
    │   └── seed.ts            # Database seeding script
    ├── src/
    │   ├── config/
    │   │   └── database.ts    # Prisma database client instance
    │   ├── routes/            # Express route modules (auth, slots, appointments)
    │   └── server.ts          # Express application initialization
    └── package.json           # Server dependencies & tsx scripts
```

### Installation

```bash
git clone https://github.com/EngrBlinx/uMed.git
cd uMed
```

### Run locally

Node.js (v18 or higher)
PostgreSQL running locally

## Configure Backend

```bash
cd backend
npm install
npm run dev
```
### Run database migrations and seed default data:
```bash
npx prisma migrate dev --name init
npm run db:seed
```

### Start the API server:
```bash npm run dev
```

## Configure Frontend
In a new terminal, run
```bash
cd frontend
npm install
npm run dev
```

Access the application in your browser at http://localhost:5173.

## Example API Payloads & Responses
### Book an Appointment (POST /appointments)

### Request Payload

```JSON
{
  "patientId": "cm7a456def00013b6g...",
  "availabilitySlotId": "cm7a789ghi00023b6g...",
  "reason": "Routine Annual Checkup"
}
```
### Success Response (201 Created)

```JSON
{
  "id": "cm7b123jkl00033b6g...",
  "patientId": "cm7a456def00013b6g...",
  "doctorId": "cm7a999xyz00003b6g...",
  "availabilitySlotId": "cm7a789ghi00023b6g...",
  "reason": "Routine Annual Checkup",
  "createdAt": "2026-08-21T15:30:00.000Z",
  "doctor": {
    "id": "cm7a999xyz00003b6g...",
    "specialty": "Cardiology"
  },
  "availabilitySlot": {
    "id": "cm7a789ghi00023b6g...",
    "startsAt": "2026-08-25T09:00:00.000Z",
    "endsAt": "2026-08-25T09:30:00.000Z"
  }
}
```

## Contributing

Contributions are welcome. Please create a focused issue or pull request that explains the problem, the proposed change, and how it was tested. Keep changes small, accessible, and free of sensitive health information.

## Privacy and Security

This project is for development and demonstration unless explicitly configured otherwise. Do not commit credentials, API keys, or personally identifiable health information. Before using uMed with real data, conduct an appropriate security, privacy, accessibility, and regulatory review.

## Author

Built by **Nnadozie Anyadike** as a portfolio project demonstrating product thinking, responsive interface development, and maintainable engineering practices.

[Connect on LinkedIn](https://www.linkedin.com/in/nnadoziegospel/) · [View more projects](https://github.com/EngrBlinx)
