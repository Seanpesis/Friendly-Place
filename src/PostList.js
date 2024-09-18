import React from 'react';

function PostList({ posts, setPosts }) {

  const handleLike = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}/like`, {
        method: 'PUT',
      });
      const updatedPost = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, comment) => {
    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}/comment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      const updatedPost = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center', backgroundColor: 'black', color: 'white', padding: '20px' }}>
      <h2>Posts</h2>
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post._id} style={{
            margin: '20px 0',
            borderBottom: '1px solid white',
            paddingBottom: '10px',
            backgroundColor: '#D3D3D3',
            color: 'black',
            padding: '15px',
            borderRadius: '10px'
          }}>
            {/* לוגים עבור שם, כותרת ותוכן */}
            <div style={{ marginBottom: '10px' }}>
              <strong>{post.name || 'Anonymous'}</strong>
              {post.name ? '' : ' (Anonymous)'}
              {console.log('Name:', post.name || 'Anonymous')}
            </div>

            <h3>{post.title}</h3>
            {console.log('Title:', post.title)}

            <p>{post.content}</p>
            {console.log('Content:', post.content)}

            <small>Posted on {new Date(post.date).toLocaleString()}</small>

            <div>
              <button onClick={() => handleLike(post._id)} style={{ marginRight: '10px' }}>
                Like ({post.likes})
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const comment = e.target.comment.value;
              handleComment(post._id, comment);
              e.target.comment.value = '';
            }}>
              <input type="text" name="comment" placeholder="Add a comment" style={{ marginTop: '10px', padding: '5px', width: '200px' }} />
              <button type="submit" style={{ marginLeft: '10px' }}>Comment</button>
            </form>

            {post.comments.length > 0 && (
              <div style={{ marginTop: '10px', textAlign: 'left' }}>
                <h4>Comments:</h4>
                <ul>
                  {post.comments.map((comment, index) => (
                    <li key={index}>{comment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No posts yet!</p>
      )}
      <footer style={{ marginTop: '20px', padding: '10px', textAlign: 'center', color: 'white' }}>
        By Sean Pesis
      </footer>
    </div>
  );
}

export default PostList;
