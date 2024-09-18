const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.put('/posts/:id/like', (req, res) => {
    console.log(`Liking post with ID: ${req.params.id}`); 
    Post.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true })
      .then((post) => {
        if (!post) {
          return res.status(404).json({ error: 'Post not found' });
        }
        console.log('Updated post after like:', post); 
        res.json(post);
      })
      .catch((err) => {
        console.error('Error liking post:', err);
        res.status(500).json({ error: 'Failed to like post' });
      });
  });
  
  
  app.put('/posts/:id/comment', (req, res) => {
    console.log(`Adding comment to post with ID: ${req.params.id}, Comment: ${req.body.comment}`);
    const comment = req.body.comment;
    Post.findByIdAndUpdate(req.params.id, { $push: { comments: comment } }, { new: true })
      .then((post) => {
        console.log('Updated post after comment:', post); 
        res.json(post);
      })
      .catch((err) => {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Failed to add comment' });
      });
  });