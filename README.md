# Notes Management Web Application

## Features
✅ Role-based access (Student, Uploader, Admin)
✅ **Google OAuth Authentication**
✅ Email-based authentication with branch detection
✅ File upload/download with metadata
✅ Search functionality
✅ Responsive design (desktop + mobile)
✅ Branch-specific access control

## Setup

1. Install dependencies:
```bash
npm install
```

2. **Configure Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Copy Client ID and Client Secret

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your Google OAuth credentials to `.env`:
```
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
CALLBACK_URL=http://localhost:3000/auth/google/callback
```

5. Start the server:
```bash
npm start
```

6. Access at: http://localhost:3000

## Login

**Google OAuth:**
- Click "Sign in with Google"
- Use institutional email (@bvrithyderabad.edu.in) for students
- Use admin email (kolashivapthi@gmail.com) for admin access

**Branch Codes:**
- 05 → CSE
- 04 → ECE
- 02 → EEE
- 66 → AIML

## Admin Features
- Upload/delete notes for all branches
- Assign uploader privileges to students

## Uploader Features
- All student features
- Upload notes for their branch

## Student Features
- View and download branch-specific notes
- Search notes by keywords
