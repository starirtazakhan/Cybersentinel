# CyberSentinel SOC Platform

CyberSentinel is a dynamic Security Operations Center (SOC) web application designed to monitor security events, detect threats, generate alerts, and support incident investigation through a centralized dashboard.

The project combines a React frontend with a Node.js/Express backend and MongoDB database to provide a practical security monitoring and incident-response workflow.

---

## Features

### Security Dashboard

CyberSentinel provides a centralized SOC dashboard containing:

- Total security events
- Total alerts
- Active alerts
- Total incidents
- Open incidents
- Alert severity distribution
- Risk distribution
- Incident status distribution
- Recent security alerts
- Live attack activity visualization

Dashboard data is retrieved dynamically from the backend and MongoDB.

---

## Threat Detection

CyberSentinel includes a backend detection engine capable of analyzing security events and generating alerts for different types of activity, including:

- Brute-force login activity
- Phishing attempts
- Authentication anomalies
- Port scanning
- Malware detection
- Privilege escalation attempts

The detection engine analyzes incoming security events and creates corresponding alerts based on detection rules and risk levels.

---

## Automated Incident Escalation

Critical security alerts can be automatically escalated into incidents.

This provides an automated workflow:

```text
Security Event
      ↓
Detection Engine
      ↓
Alert
      ↓
Risk / Severity Evaluation
      ↓
Critical Alert
      ↓
Incident
Role-Based Access Control

CyberSentinel implements role-based access control with different user roles:

ADMIN
ANALYST
VIEWER

Different roles have different permissions for interacting with security data and investigation workflows.

Incident Management

The incident management system supports investigation workflows including:

Creating incidents from alerts
Incident status tracking
Investigation notes
Incident resolution
Incident closure
Linking alerts and security events to incidents
Risk assessment
Audit logging

Supported incident states include:

OPEN
INVESTIGATING
CONTAINED
RESOLVED
CLOSED
Audit Logging

Important security actions are recorded through the audit logging system.

This provides visibility into actions performed during security investigations and helps maintain an investigation history.

Threat Simulation

CyberSentinel includes a threat simulator for development and demonstration purposes.

The simulator can generate security events such as:

Failed login attempts
Authentication anomalies
Phishing emails
Port scanning
Malware detections
Privilege escalation attempts

These events are processed by the detection engine and can generate alerts and incidents automatically.

//Technology Stack//
Frontend
React
JavaScript
Tailwind CSS
Recharts
Axios
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
Helmet
CORS
//Development Tools//
Visual Studio Code
MongoDB Compass
Postman
Git
GitHub
//Architecture
                    CyberSentinel
                         │
              ┌──────────┴──────────┐
              │                     │
        React Frontend         Express Backend
              │                     │
              │              ┌──────┴──────┐
              │              │             │
              │        Detection Engine  REST APIs
              │              │             │
              │              └──────┬──────┘
              │                     │
              └──────────────┬──────┘
                             │
                         MongoDB
                             │
                ┌────────────┼────────────┐
                │            │            │
             Events       Alerts      Incidents
Security Workflow

A typical security event follows this workflow:

Event Generated
      ↓
Security Event Stored
      ↓
Detection Engine
      ↓
Threat Detection
      ↓
Alert Generated
      ↓
Risk / Severity Assessment
      ↓
┌───────────────────────────────┐
│ Critical?                     │
└───────────────┬───────────────┘
                │
          Yes   │   No
           ↓    │    ↓
      Auto-Escalate  Analyst Review
           ↓             ↓
       Incident      Investigation
           ↓             ↓
      Response / Resolution

//Installation / Setup Instructions//
### 1. Clone the Repository

```bash
git clone https://github.com/starirtazakhan/Cybersentinel.git
cd CyberSentinel

2. Backend Setup
cd server
npm install

3. Configure Environment Variables

Create a .env file inside the server folder.

Example:

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
4. Start the Backend
npm run dev
5. Frontend Setup

Open another terminal:

cd client
npm install
6. Start the Frontend
npm run dev

The application can then be accessed through the local URL provided by the frontend development server.


---

## 2. Environment Variables

Iska separate section bhi rakho:

```markdown
## Environment Variables

CyberSentinel requires environment variables for database connectivity and authentication.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB database connection string |
| `JWT_SECRET` | Secret used for JWT authentication |
| `PORT` | Port used by the backend server |

Create the `.env` file locally inside the `server` directory.

> **Security:** Never commit your `.env` file, passwords, API keys, JWT secrets, or database credentials to GitHub.

3. Future Improvements
Planned improvements for CyberSentinel include:

- Real-world security log ingestion
- Threat intelligence integration
- Email and notification alerts
- Advanced event correlation
- Expanded MITRE ATT&CK integration
- Automated incident response actions
- Additional security monitoring capabilities
- Production deployment and monitoring
- Enhanced attack visualization

4. Disclaimer
CyberSentinel is an educational and portfolio project developed for cybersecurity learning, development, and demonstration purposes.

The built-in threat simulator generates synthetic security events for testing and demonstration. It is not intended to replace a production Security Information and Event Management (SIEM) or Security Operations Center (SOC) platform.

## Author

**Irtaza Khan**

[GitHub Profile](https://github.com/starirtazakhan)
