# EcoDrive

This server-side layer is built completely using the cloud-native **MERN Stack** (MongoDB Atlas, Express.js, Node.js). It functions as a fully modular, stateless REST API Gateway that handles business logic, security middleware, and analytical event tracking.

---

## 🏗️ Project Directory Structure

To maintain a strict separation of concerns following MVC and Data Access Object (DAO) patterns, the project is structured as follows:

```text
ecoDrive/
└── backend/
    ├── config/             # Cloud Database connection engine (Mongoose configuration)
    ├── controllers/        # Business logic & operational controller sub-actions
    ├── middleware/         # Security firewalls (JWT) & administrative traffic logging
    ├── models/             # Mongoose Schemas / Data Access Objects (DAO Tier)
    ├── public/             # Deliverable 2: Elementary UI files (Pure HTML/JS, no CSS)
    ├── routes/             # REST Endpoints mapping standard HTTP actions to resources
    ├── .env                # App configuration parameters & API keys (Ignored by Git)
    ├── .gitignore          # Prevents tracking node_modules and local environment keys
    ├── package.json        # Dependencies, package lock versions, and scripts
    └── server.js           # Express Application Gateway & Entry point

Please keep adding your parts in this file format

1. Clone the repository
2. cd backend
3. npm install
4. create a new .env file
5. Add all the environment variables I have provided over text


START THE SERVER

npm run dev

The database is already deployed and running on mongoDB atlas

If your setup is sucessfull, you will see these 2 lines on your terminal

EcoDrive Server is running
MongoDB is Connected



Once your server terminal confirms a successful launch, you can instantly verify that the REST layout is alive and operational by targeting the system health-check route.

URL Path: http://localhost:5000/api/status

Expected JSON Payload Response:

{
  "status": "Success",
  "message": "🚗 EcoDrive REST API Gateway is running securely!",
  "timestamp": "2026-07-07T22:46:23.000Z"
}

