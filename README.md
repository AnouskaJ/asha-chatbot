# Asha Chatbot 🤖🌟

Welcome to **Asha Chatbot**, your AI-powered career assistant dedicated to empowering women to restart their careers! This project is built with a modern React + Tailwind CSS frontend and a Flask backend ("FlashPacket") for handling conversations and admin analytics. 🚀

---

## 💡 Table of Contents

1. [About the Project](#-about-the-project)
2. [Features ✨](#-features-)
3. [Screenshots 📸](#-screenshots-)
4. [Getting Started 🚀](#-getting-started-)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Running the App](#running-the-app)
5. [Usage 🗣️](#-usage-)
6. [Tech Stack 🛠️](#-tech-stack-)
7. [Contributing 🤝](#-contributing-)
8. [License 📝](#-license-)
9. [Acknowledgements ❤️](#-acknowledgements-)

---

## 📖 About the Project

Asha Chatbot is a platform designed to help women restart their careers through skill development programs, mentorship, and verified resources. The AI assistant "Asha" can:

- 🌐 **Discover Career Paths**: Suggest programs and job opportunities.
- 🗓️ **List Events & Sessions**: Show upcoming workshops and meetups.
- 👩‍🏫 **Connect to Mentors**: Facilitate mentorship connections.
- 📊 **Admin Analytics**: Track usage, topics, and response accuracy in real time.

This project was bootstrapped with **Create React App** and uses **Flask** for backend APIs.

---

## ✨ Features ✨

- **Chat Interface**: Interactive chat with Asha, powered by AI.
- **User Dashboard**: Profile management, language selection, and quick actions.
- **Admin Panel**:
  - **Sessions & Events**: CRUD operations for career sessions.
  - **Analytics**: Visualizations of topic distribution, languages, bias detection, and response times.
  - **Feedback**: Review, resolve, and export user feedback.
- **Verified Resources**: List of government and non-profit links for career support.

---

## 📸 Screenshots 📸

### Landing Page
![Screenshot 2025-04-14 213902](https://github.com/user-attachments/assets/935fb91f-b304-441d-8e9b-f14e107c7fbd)

*Empowering women to restart their careers.*

### User Chat Interface
![Screenshot 2025-04-14 235934](https://github.com/user-attachments/assets/ab1d41f8-8651-470b-bd43-76e3f802b097)

*Converse with Asha to find programs and job opportunities.*

### Admin Analytics
![Screenshot 2025-04-15 000324](https://github.com/user-attachments/assets/a4c93f32-848e-4ba3-b873-c014ab0bf093)
![Screenshot 2025-04-15 000348](https://github.com/user-attachments/assets/30d3d514-d171-40a0-a357-f271d71c6702)

*Visualize user engagement and system performance.*

### Admin Feedback
![Screenshot 2025-04-15 000255](https://github.com/user-attachments/assets/0c8eedb9-63ec-4b1e-881e-9310f0fa5795)

*Review and resolve AI response feedback.*

### Admin Sessions Dashboard
![Screenshot 2025-04-15 000232](https://github.com/user-attachments/assets/01b1b393-73d6-4c80-aba1-3c0b07c8f992)

*Manage career-focused sessions and events.*

### User Profile
![Screenshot 2025-04-15 000123](https://github.com/user-attachments/assets/1b2387f4-e79c-4f9f-bb5a-b9b1449655b2)

*Update personal information and preferences.*

---

## 🚀 Getting Started 🚀

Follow these steps to run Asha Chatbot locally.

### Prerequisites

- [Node.js](https://nodejs.org/) >= 16.x
- [Python 3.8+](https://www.python.org/)
- [pipenv](https://pipenv.pypa.io/) (or `virtualenv`)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AnouskaJ/asha-chatbot.git
   cd asha-chatbot
   ```

2. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd ../backend
   pipenv install --dev
   # or using virtualenv:
   # python3 -m venv venv && source venv/bin/activate
   # pip install -r requirements.txt
   ```

### Running the App

1. **Start the Flask backend**

   ```bash
   pipenv run python app.py
   # default: http://localhost:5000
   ```

2. **Start the React frontend**

   ```bash
   cd ../frontend
   npm start
   # default: http://localhost:3000
   ```

3. **Open your browser** at `http://localhost:3000` and start chatting with Asha! 🎉

---

## 🗣️ Usage 🗣️

### Sample Interaction

1. **User**: "Hi Asha! I'm looking to restart my career after a break. What options do I have?"
2. **Asha**: "I can help with that! JobsForHer Foundation offers skill development programs, mentorship opportunities, and job connections specifically for women restarting their careers. Would you like to explore skill programs or job listings?"
3. **User** clicks **Start Chatting** → selects **Skill Development** → sees a list of curated courses.

> The chat interface supports multilingual conversation 🌍 and voice input 🎙️ (microphone icon).

### Quick Actions

- **Find Jobs**
- **Upcoming Events**
- **Connect to Mentors**
- **Skill Development**

---

## 🛠️ Tech Stack 🛠️

| Layer     | Technology                                     |
| --------- | ---------------------------------------------- |
| Frontend  | React, Tailwind CSS, React Router, Axios       |
| Backend   | Flask (FlashPacket), Flask-RESTful, SQLAlchemy |
| Database  | SQLite (development), PostgreSQL (production)  |
| Auth      | Firebase Auth, JWT                             |
| Analytics | Chart.js, Kibana (planned)                     |
| CI/CD     | GitHub Actions, Render.com                     |

---

## 🤝 Contributing 🤝

Contributions are welcome! Please follow these steps:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

Please ensure all linting checks and tests pass before submitting.

---

## 📝 License 📝

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgement

**M**ission and inspiration.

- **Gemini LLM** for powering our AI capabilities.
- **Create React App** and **Flask** communities for their amazing tools.

Thank you for using Asha Chatbot! Let's empower women together. ✨

