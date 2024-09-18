import React, { useState } from 'react';

function PostForm({ addPost }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const postData = {
      title,
      content,
      name: anonymous ? 'Anonymous' : name
    };

    fetch('http://localhost:5000/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((newPost) => {
        addPost(newPost);
        setTitle('');
        setContent('');
        setName('');
        setAnonymous(false);
        setError('');
      })
      .catch((error) => {
        console.error('Error adding post:', error);
        setError('Failed to add post. Please try again.');
      });
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'black',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '36px' }}>Feel Free To Share</h1>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '400px',
      }}>
        {/* שם ואנונימי */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Your Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              flexGrow: 1,
              padding: '10px',
              backgroundColor: 'white',
              color: 'black',
              border: '1px solid white',
              borderRadius: '5px',
              marginRight: '10px'
            }}
          />
          <label style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Post as Anonymous
          </label>
        </div>

        {/* כותרת */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid white',
            borderRadius: '5px'
          }}
        />

        {/* תוכן */}
        <textarea
          placeholder="Share your experience..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            backgroundColor: 'white',
            color: 'black',
            border: '1px solid white',
            borderRadius: '5px'
          }}
        />

        {/* כפתור פרסום */}
        <button type="submit" style={{
          padding: '10px 20px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Post
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}

export default PostForm;
