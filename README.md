# 🍽️ BlueBliss Foods & Technologies

BlueBliss is a full-stack cloud kitchen web application that enables users to browse menus, place food orders, and get real-time assistance through an AI-powered chatbot. Built with a React.js frontend and Node.js backend, deployed on Vercel.

🔗 **Live Demo:** [bluebliss-dev.vercel.app](https://bluebliss-dev.vercel.app)

---

## 📸 Screenshots
> Add screenshots of your homepage, menu, cart, and chatbot UI here

---

## ✨ Features

- 🛒 **Menu Browsing** — Browse items across multiple food categories
- 📦 **Order Management** — Place and manage food orders seamlessly
- 🤖 **AI Chatbot** — Real-time customer support for order queries and food recommendations
- 🔐 **User Authentication** — Secure login and registration
- 📡 **RESTful API** — Structured Node.js + Express.js server-side routing
- 📱 **Responsive Design** — Fully responsive across desktop and mobile
- 🚀 **Production Deployed** — Hosted on Vercel with 10+ deployments

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
├── client/               # React.js frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route-level pages
│   │   └── App.js
├── server/               # Node.js backend
│   ├── routes/           # Express route handlers
│   ├── controllers/      # Business logic
│   ├── models/           # Database models
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

## 🤖 AI Chatbot

The integrated AI chatbot provides:
- Real-time answers to menu and order queries
- Food recommendations based on user preferences
- Order support and assistance

---

## 🙋‍♂️ Author

**Togari Akshath**
- GitHub: [@Akshath2901](https://github.com/Akshath2901)
- LinkedIn: [akshath-togari](https://www.linkedin.com/in/akshath-togari-64684b317/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
