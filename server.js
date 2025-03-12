const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('MongoDB URI:', process.env.MONGODB_URI ? 'MongoDB Atlas URI configured' : 'No MongoDB URI found');

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

mongoose.connect(process.env.MONGODB_URI || 'atlas-sql-67d19fd2aa91de0e9da04fbb-bj2o4.a.query.mongodb.net/myVirtualDatabase?ssl=true&authSource=admin')
.then(() => {
  console.log('MongoDB connected successfully');
  initializeRoutes(true); 
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Running in memory-only mode (no database)');
  initializeRoutes(false);
});

function initializeRoutes(withDatabase) {
  let Post;
  
  if (withDatabase) {
    const PostSchema = new mongoose.Schema({
      title: { type: String, required: true },
      content: { type: String, required: true },
      name: { type: String, default: 'Anonymous' },
      date: { type: Date, default: Date.now },
      likes: { type: Number, default: 0 },
      comments: [{ type: String }]
    });

    Post = mongoose.model('Post', PostSchema);
  }

  // נתיב לקבלת כל הפוסטים
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

  // נתיב ליצירת פוסט חדש
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
        // שמירה בזיכרון
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
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      
      post.likes += 1;
      const updatedPost = await post.save();
      res.json(updatedPost);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update likes' });
    }
  });

  app.put('/posts/:id/comment', async (req, res) => {
    try {
      const { comment } = req.body;
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      
      post.comments.push(comment);
      const updatedPost = await post.save();
      res.json(updatedPost);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  app.post('/sync', async (req, res) => {
    try {
      const postsToSync = req.body;
      if (!Array.isArray(postsToSync) || postsToSync.length === 0) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      const results = [];
      for (const postData of postsToSync) {
        const newPost = new Post(postData);
        const savedPost = await newPost.save();
        results.push(savedPost);
      }

      res.status(201).json(results);
    } catch (err) {
      console.error('Error syncing posts:', err);
      res.status(500).json({ error: 'Failed to sync posts' });
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

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}