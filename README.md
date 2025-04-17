# Asha AI - Career Guidance Assistant

Asha AI is a multilingual career guidance assistant built with Next.js for the frontend and Flask for the backend. The application supports 9 Indian languages plus English for both text and voice interactions.

## Features

- Multilingual support for 10 languages (English + 9 Indian languages)
- Speech-to-text and text-to-speech functionality
- Admin dashboard for managing sessions and job listings
- Responsive design for all devices
- RAG-based chatbot for answering career-related queries

## Project Structure

The project consists of two main parts:

- `frontend/`: Next.js application with TypeScript
- `backend/`: Flask application with RAG implementation

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Start the Flask server:
   ```
   python app.py
   ```

The backend server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set the environment variable for the API URL in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```
   npm run dev
   ```

The frontend application will run on http://localhost:3000

## API Endpoints

- `/chat`: Processes chat queries and returns responses
- `/admin/sessions`: Get and update session details
- `/admin/jobs`: Get and update job listings
- `/update`: Update the knowledge base

## Languages Supported

- English (en-US)
- Hindi (hin_Deva)
- Gujarati (guj_Gujr)
- Marathi (mar_Deva)
- Tamil (tam_Taml)
- Telugu (tel_Telu)
- Kannada (kan_Knda)
- Punjabi (pan_Guru)
- Konkani (gom_Deva)

## Admin Access

To access the admin dashboard:
1. Go to `/admin-login`
2. Use the credentials:
   - Username: admin
   - Password: admin123
   
Note: For production, implement proper authentication. 