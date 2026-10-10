# CodeCollab

A real-time collaborative code editor. Write and run Python or JavaScript in the browser, share a link, and code together with other people in the same file at the same time.

**Live demo:** coming soon

## Features

- Sign up and log in with JWT authentication (passwords are hashed with bcrypt)
- Create, rename, open, and delete projects from a dashboard
- Browser code editor (Monaco, the editor behind VS Code) with Python and JavaScript
- Run code and see the output, errors, and run time
- Real-time collaboration: everyone with the project link sees changes live
- See who is online in the same project
- Auto-save to MongoDB, plus manual save with Ctrl + S
- Share button that copies the project link

## Tech stack

- **Frontend:** React, Vite, React Router, Axios, Monaco Editor
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Real-time:** Socket.IO (WebSockets)
- **Code execution:** Judge0 API
- **Auth:** JSON Web Tokens (JWT), bcrypt

## How it works

1. The React app talks to the Express API for login, projects, and running code.
2. When you click **Run**, the API checks your login and sends the code to Judge0, which runs it in a sandbox and returns the output.
3. When you open a project, the browser joins a Socket.IO room for that project. Every change is sent to the server and passed on to the other people in the room.
4. The server saves the code to MongoDB about 2 seconds after the last change.

## Project structure

```
codecollab/
  client/                React app
    src/pages/           Login, Signup, Dashboard, Editor
    src/api.js           Axios setup with the login token
  server/                Express API and Socket.IO
    models/              User and Project schemas
    routes/              auth, projects, run
    middleware/          JWT check
    index.js             Server and real-time events
```

## Getting started

You need Node.js (LTS) and a free MongoDB Atlas database.

1. Clone the repository

```
git clone https://github.com/Paleti-Pravalika/codecollab.git
cd codecollab
```

2. Set up the server

```
cd server
npm install
```

Create a file named `.env` inside `server` with these values (see `.env.example`):

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_text
```

Start it:

```
npm run dev
```

3. Set up the client (in a second terminal)

```
cd client
npm install
npm run dev
```

4. Open http://localhost:5173

## Known limitations and future improvements

- If two people type at the exact same moment, the last change wins. A CRDT library such as Yjs would merge changes properly and show other people's cursors.
- Anyone with the project link can edit it. An invite list with owner, editor, and viewer roles would be safer.
- Code runs through the free public Judge0 service, so it has rate limits and does not support keyboard input yet.
- The server is a single instance. Scaling it would need Redis to share real-time connections.
- Automated tests are not written yet.

## Author

Paleti Pravalika - [GitHub](https://github.com/Paleti-Pravalika)