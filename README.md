# Collaborative To-Do Backend

A Node.js/Express REST API with real-time sync and custom business logic for a collaborative to-do board application.

### 🔧 Tech Stack

- **Node.js** & **Express** (v5)  
- **MongoDB** (Atlas) with **Mongoose** ODM  
- **Socket.IO** for WebSocket-based real-time updates  
- **JWT** authentication (`jsonwebtoken`)  
- **bcryptjs** for password hashing  
- **dotenv** for environment variables  
- **cors** for Cross-Origin Resource Sharing  

### 🚀 Features

- **User Registration & Login** with hashed passwords and JWT tokens  
- **CRUD Tasks**: create, read, update, delete  
- **Kanban API**: tasks have `title`, `description`, `assignedUser`, `status` (`Todo`|`In Progress`|`Done`), `priority`  
- **Real-Time Sync**: all clients receive task changes & activity logs instantly via Socket.IO  
- **Action Logging**: every add/edit/delete/assign/drag-drop is logged; last 20 actions available via `/api/actions`  
- **Smart Assign**: “assign to user with fewest active tasks” endpoint  
- **Conflict Handling**: detects stale updates (HTTP 409) and returns both server/client versions for manual merge  

### 📦 Installation & Local Setup

1. **Clone** the repo:
   ```bash
   git clone https://github.com/Envyiwnl/collaborative-todo-backend.git
   cd collaborative-todo-backend

Install dependencies:
npm install

Create a .env file in the project root with:

MONGO_URI=<your MongoDB Atlas URI>
JWT_SECRET=<your JWT secret>
PORT=5000

npm run dev ### for devlopment
npm start ### for build

📑 API Endpoints
Method	Route	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Authenticate & get JWT
GET	/api/tasks	List all tasks (requires JWT)
POST	/api/tasks	Create a new task
PUT	/api/tasks/:id	Update a task (supports conflict 409)
DELETE	/api/tasks/:id	Delete a task
POST	/api/tasks/:id/smart-assign	Smart-assign logic
GET	/api/actions	Fetch last 20 activity logs

x-auth-token: <your_jwt_here>
