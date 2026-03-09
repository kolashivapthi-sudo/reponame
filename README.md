# Notes Management Web Application

## Features
✅ Role-based access (Student, Uploader, Admin)
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

2. Start the server:
```bash
npm start
```

3. Access at: http://localhost:3000

## Login Credentials

**Admin:**
- Email: kolashivapthi@gmail.com
- Password: admin123

**Student Example:**
- Email: 25wh1a0501@bvrithyderabad.edu.in (CSE student)
- No password required

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
