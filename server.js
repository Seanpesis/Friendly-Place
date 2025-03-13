const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const PORT = process.env.PORT || 5000;

const mongoUser = process.env.MONGODB_USER;
const mongoPass = process.env.MONGODB_PASSWORD;
const mongoCluster = process.env.MONGODB_CLUSTER;
const mongoDB = process.env.MONGODB_DATABASE;

const mongoURI = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoCluster}/${mongoDB}?retryWrites=true&w=majority`;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

let postsInMemory = [
  {
    _id: 'sample1',
    title: 'ברוכים הבאים לאתר',
    content: 'זהו פוסט לדוגמה. הפוסטים נשמרים בזיכרון השרת ולא במסד נתונים.',
    name: 'מערכת',
    date: new Date().toISOString(),
    likes: 5,
    comments: ['מצוין!', 'תודה על האתר היפה']
  }
];

function startServer(port) {
  const server = app.listen(port)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      console.log(`Server running on port ${port}`);
    });
  return server;
}

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  name: { type: String, default: 'Anonymous' },
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  comments: [{ type: String }]
});

function connectToMongoDB() {
  console.log('Attempting MongoDB connection...');
  
  mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 2000,
    retryWrites: true
  })
  .then(() => {
    console.log('MongoDB connected successfully to database:', mongoDB);
    initializeRoutes(true);
    if (!app.listening) startServer(PORT);
  })
  .catch(err => {
    console.error('MongoDB connection error:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    console.log('Running in memory-only mode (no database)');
    initializeRoutes(false);
    if (!app.listening) startServer(PORT);
    
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectToMongoDB, 5000);
  });
}

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected! Attempting to reconnect...');
  setTimeout(connectToMongoDB, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
  mongoose.disconnect();
});

function initializeRoutes(withDatabase) {
  const Post = withDatabase ? mongoose.model('Post', PostSchema) : null;

  app.get('/posts', async (req, res) => {
    try {
      if (withDatabase) {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
      } else {
        res.json(postsInMemory);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.post('/posts', async (req, res) => {
    try {
      const { title, content, name } = req.body;
      
      if (withDatabase) {
        const newPost = new Post({
          title,
          content,
          name: name || 'Anonymous',
          date: new Date(),
          likes: 0,
          comments: []
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
      } else {
        const newPost = {
          _id: Date.now().toString(),
          title,
          content,
          name: name || 'Anonymous',
          date: new Date().toISOString(),
          likes: 0,
          comments: []
        };
        postsInMemory.unshift(newPost);
        res.status(201).json(newPost);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  app.put('/posts/:id/like', async (req, res) => {
    try {
      if (withDatabase) {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        post.likes += 1;
        const updatedPost = await post.save();
        return res.json(updatedPost);
      } else {
        const post = postsInMemory.find(p => p._id === req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        post.likes += 1;
        return res.json(post);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to update likes' });
    }
  });

  app.put('/posts/:id/comment', async (req, res) => {
    try {
      const { comment } = req.body;
      if (!comment) return res.status(400).json({ error: 'Comment cannot be empty' });

      if (withDatabase) {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        post.comments.push(comment);
        const updatedPost = await post.save();
        return res.json(updatedPost);
      } else {
        const post = postsInMemory.find(p => p._id === req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        post.comments.push(comment);
        return res.json(post);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });
}

connectToMongoDB();