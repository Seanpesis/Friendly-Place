const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());


mongoose.connect('mongodb://localhost:27017/friendly-place', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  name: String,
  date: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  comments: [String],
});

const Post = mongoose.model('Post', postSchema);

const cors = require('cors');
app.use(cors());

app.get('/posts', (req, res) => {
  Post.find()
    .then((posts) => res.json(posts))
    .catch((err) => res.status(500).json({ error: 'Failed to fetch posts' }));
});

app.post('/posts', (req, res) => {
  const newPost = new Post(req.body);
  newPost.save()
    .then((post) => res.status(201).json(post))
    .catch((err) => res.status(500).json({ error: 'Failed to add post' }));
});

app.put('/posts/:id/like', (req, res) => {
  Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true })
    .then((post) => {
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to like post' });
    });
});

app.put('/posts/:id/comment', (req, res) => {
  const comment = req.body.comment;
  Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment } }, { new: true })
    .then((post) => {
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to add comment' });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

