// /src/FriendlyPlace.js
import React, { useState, useEffect } from 'react';
import PostForm from './PostForm';
import PostList from './PostList';

function FriendlyPlace() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/posts') 
      .then((response) => response.json())
      .then((data) => setPosts(data));
  }, []);

  const addPost = (newPost) => setPosts([newPost, ...posts]);

  const likePost = (postId) => {
    setPosts(posts.map(post =>
      post._id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const addComment = (postId, comment) => {
    setPosts(posts.map(post =>
      post._id === postId ? { ...post, comments: [...post.comments, comment] } : post
    ));
  };

  return (
    <div>
      <PostForm addPost={addPost} />
      <PostList posts={posts} likePost={likePost} addComment={addComment} />
    </div>
  );
}

export default FriendlyPlace;
