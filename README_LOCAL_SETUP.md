RebelTrack local setup

1. Unzip the project.
2. Open a terminal in the project folder.
3. Copy .env.example to .env.local.
4. Replace the Supabase values in .env.local with your real project values.
5. Run: npm install
6. Run: npm run dev
7. Open: http://localhost:3000

Notes:
- RESEND_API_KEY can stay as re_test_key for local testing.
- Email sending is skipped when RESEND_API_KEY is missing.
- Middleware was removed to avoid the login redirect loop. Protected pages still check for a logged-in user on the server.
