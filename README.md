# 🍽️ BlueBliss Foods & Technologies

BlueBliss is a full-stack cloud kitchen management platform with three integrated panels — a customer-facing food ordering interface, a staff admin panel for kitchen operations, and a super admin dashboard for owner-level business analytics. Built with React.js and Node.js, deployed on Vercel.

🔗 **Live Demo:** [bluebliss-dev.vercel.app](https://bluebliss-dev.vercel.app)

---

## 📸 Screenshots
> Add screenshots of customer UI, admin panel, and super admin dashboard here

---

## ✨ Features

### 🧑‍💻 Customer Interface
- 🛒 **Menu Browsing** — Browse food items across multiple categories
- 📦 **Order Placement** — Seamless cart and order flow
- 🤖 **AI Chatbot** — Real-time assistance for order queries and food recommendations
- 🔐 **User Authentication** — Secure login and registration

### 🧑‍🍳 Staff Admin Panel
- ✅ **Order Management** — Accept, update, and track incoming customer orders
- 📦 **Stock Management** — Monitor and update ingredient/item stock levels
- 🍕 **Menu Management** — Add, edit, or remove menu items in real time
- 📋 POC-level operational dashboard for kitchen staff

### 👑 Super Admin Panel
- 📊 **Sales Analytics** — Detailed revenue reports and order trends
- 👥 **Staff Performance Tracking** — Monitor staff activity and order handling metrics
- 🏪 **Business Overview** — Owner-level insights across all operations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, JavaScript, CSS |
| Backend | Node.js, Express.js |
| AI Chatbot | [Add — OpenAI API / Gemini / custom] |
| Database | [Add — MongoDB / Firebase] |
| Authentication | [Add — JWT / Firebase Auth] |
| Deployment | Vercel |

---

## 📁 Project Structure

```
BLUEBLISS/
├── client/                   # React.js frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/
│   │   │   ├── Customer/     # Customer ordering interface
│   │   │   ├── Admin/        # Staff admin panel
│   │   │   └── SuperAdmin/   # Owner analytics dashboard
│   │   └── App.js
├── server/                   # Node.js backend
│   ├── routes/               # Express route handlers
│   ├── controllers/          # Business logic
│   ├── models/               # Database models
│   └── index.js
└── .gitignore
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Akshath2901/BLUEBLISS.git
cd BLUEBLISS

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

### Running the App

```bash
# Start backend
cd server
npm start

# Start frontend (new terminal)
cd client
npm start
```

App runs on `http://localhost:3000`

---

## 🔐 Role-Based Access

| Role | Access |
|---|---|
| Customer | Browse menu, place orders, AI chatbot |
| Staff (Admin) | Accept orders, manage stock, update menu |
| Owner (Super Admin) | Sales reports, staff performance, full business overview |

---

## 🤖 AI Chatbot

The integrated AI chatbot provides:
- Real-time answers to menu and order queries
- Food recommendations based on user preferences
- Order status support and assistance

---

## 🙋‍♂️ Author

**Togari Akshath**
- GitHub: [@Akshath2901](https://github.com/Akshath2901)
- LinkedIn: [akshath-togari](https://www.linkedin.com/in/akshath-togari-64684b317/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
