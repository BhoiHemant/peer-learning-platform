const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

let doubts = [
  {
    _id: "1",
    title: "How does React useState work?",
    details: "I'm trying to understand the internal mechanism of React's useState hook.",
    category: "Computer Science",
    tags: ["react", "javascript", "hooks"],
    author: { name: "John Doe" },
    views: 234,
    answers: [],
    upvotes: [],
    downvotes: [],
    isAnswered: false,
    createdAt: new Date()
  }
];

let users = [
  {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    avatar: "",
    bio: "",
    reputation: 0
  }
];

// GET all doubts
app.get("/api/doubts", (req, res) => {
  res.json({
    success: true,
    data: doubts
  });
});

// GET single doubt
app.get("/api/doubts/:id", (req, res) => {
  const doubt = doubts.find(d => d._id === req.params.id);
  if (!doubt) {
    return res.status(404).json({ success: false, message: 'Doubt not found' });
  }
  doubt.views += 1;
  res.json({
    success: true,
    data: doubt
  });
});

// POST new doubt
app.post("/api/doubts", (req, res) => {
  const newDoubt = {
    _id: Date.now().toString(),
    title: req.body.title,
    details: req.body.details,
    category: req.body.category,
    tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
    author: { name: "Test User" },
    views: 0,
    answers: [],
    upvotes: [],
    downvotes: [],
    isAnswered: false,
    createdAt: new Date()
  };
  doubts.unshift(newDoubt);
  res.status(201).json({
    success: true,
    data: newDoubt
  });
});

// POST vote on doubt
app.post("/api/doubts/:id/vote", (req, res) => {
  const doubt = doubts.find(d => d._id === req.params.id);
  if (!doubt) {
    return res.status(404).json({ success: false, message: 'Doubt not found' });
  }
  
  const { voteType } = req.body;
  if (voteType === 'upvote') {
    doubt.upvotes.push("user1");
  } else if (voteType === 'downvote') {
    doubt.downvotes.push("user1");
  }
  
  res.json({
    success: true,
    data: doubt
  });
});

// POST answer to doubt
app.post("/api/doubts/:id/answers", (req, res) => {
  const doubt = doubts.find(d => d._id === req.params.id);
  if (!doubt) {
    return res.status(404).json({ success: false, message: 'Doubt not found' });
  }
  
  const answer = {
    content: req.body.content,
    author: { name: "Test User" },
    upvotes: [],
    downvotes: [],
    createdAt: new Date()
  };
  
  doubt.answers.push(answer);
  doubt.isAnswered = true;
  
  res.status(201).json({
    success: true,
    data: doubt
  });
});

// Auth routes
app.post("/api/auth/register", (req, res) => {
  const user = {
    id: Date.now().toString(),
    name: req.body.name || "Test User",
    email: req.body.email,
    avatar: "",
    bio: "",
    reputation: 0
  };
  users.push(user);
  
  res.json({
    success: true,
    token: "test-token-" + user.id,
    user
  });
});

app.post("/api/auth/login", (req, res) => {
  const user = users.find(u => u.email === req.body.email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  res.json({
    success: true,
    token: "test-token-" + user.id,
    user
  });
});

app.get("/api/auth/me", (req, res) => {
  res.json({
    success: true,
    user: users[0]
  });
});

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/doubts - Get all doubts');
  console.log('  GET  /api/doubts/:id - Get single doubt');
  console.log('  POST /api/doubts - Create doubt');
  console.log('  POST /api/doubts/:id/vote - Vote on doubt');
  console.log('  POST /api/doubts/:id/answers - Add answer');
  console.log('  POST /api/auth/register - Register user');
  console.log('  POST /api/auth/login - Login user');
  console.log('  GET  /api/auth/me - Get current user');
});
