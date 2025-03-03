const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'build')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/friendly-place', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  name: { type: String, default: 'Anonymous' },
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  comments: [{ type: String }]
});

const Post = mongoose.model('Post', PostSchema);

app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/posts', async (req, res) => {
  try {
    const { title, content, name } = req.body;
    
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