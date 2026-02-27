# GD Platform (minimal)

Local scaffold to run a small group-discussion (GD) platform with:
- landing page with Practice / Interview portals
- join as manager / recruiter / participant
- WebRTC-based mesh signaling via Socket.io
- manager recording uploaded to server and served as shareable link
- simple analysis page after GD ends

Run locally:

```bash
cd /Users/robiulislam/myappgd
npm install
npm start
```

Open http://localhost:3000

Notes:
- This is a minimal scaffold intended for local testing and prototyping.
- For production, add authentication, storage persistence, HTTPS/TURN servers, and stronger access controls.
