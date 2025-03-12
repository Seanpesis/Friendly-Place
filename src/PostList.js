import React, { useState, useEffect } from 'react';

function PostList({ posts, setPosts, offlineMode, likePost, addComment }) {
  const [commentInputs, setCommentInputs] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [showComments, setShowComments] = useState({});
  const [isReallyOffline, setIsReallyOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsReallyOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleLike = async (postId) => {
    setIsLoading(prev => ({ ...prev, [postId + '-like']: true }));
    
    if (offlineMode || isReallyOffline) {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );
      
      const updatedPosts = posts.map(post =>
        post._id === postId ? { ...post, likes: post.likes + 1 } : post
      );
      localStorage.setItem('localPosts', JSON.stringify(updatedPosts));
      
      setIsLoading(prev => ({ ...prev, [postId + '-like']: false }));
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/posts/${postId}/like`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error('Failed to like post');
      }
      
      const updatedPost = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [postId + '-like']: false }));
    }
  };

  const handleComment = async (postId, comment) => {
    if (!comment.trim()) return;
    
    setIsLoading(prev => ({ ...prev, [postId + '-comment']: true }));
    
    if (offlineMode || isReallyOffline) {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? 
            { ...post, comments: [...post.comments, comment] } : 
            post
        )
      );
      
      const updatedPosts = posts.map(post =>
        post._id === postId ? 
          { ...post, comments: [...post.comments, comment] } : 
          post
      );
      localStorage.setItem('localPosts', JSON.stringify(updatedPosts));
      
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setIsLoading(prev => ({ ...prev, [postId + '-comment']: false }));
      return;
    }
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/posts/${postId}/comment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      const updatedPost = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? updatedPost : post
        )
      );
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [postId + '-comment']: false }));
    }
  };

  return (
    <div className="posts-container">
      <h2 className="app-subtitle">
        פוסטים אחרונים
        {isReallyOffline && <span className="offline-badge">אופליין</span>}
      </h2>
      
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post._id} className="card post fade-in">
            <div className="post-header">
              <span className="post-author">
                {post.name || 'אנונימי'}
                {post.pendingSync && 
                  <span className="sync-status pending">ממתין לסנכרון</span>
                }
              </span>
              <span className="post-date" dir="ltr">{new Date(post.date).toLocaleString('he-IL')}</span>
            </div>
            
            <h3 className="post-title">{post.title}</h3>
            <p className="post-content">{post.content}</p>
            
            <div className="post-actions">
              <button 
                onClick={() => handleLike(post._id)} 
                className="btn"
                disabled={isLoading[post._id + '-like']}
              >
                {isLoading[post._id + '-like'] ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div className="loader" style={{ width: '15px', height: '15px', margin: '0' }}></div>
                    טוען...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    👍 אהבתי ({post.likes})
                  </span>
                )}
              </button>
              
              <button 
                onClick={() => setShowComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                className="btn btn-secondary"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  💬 תגובות ({post.comments.length})
                </span>
              </button>
            </div>

            <div style={{ 
              maxHeight: showComments[post._id] ? '500px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.5s ease',
              marginTop: showComments[post._id] ? '20px' : '0'
            }}>
              <form 
                className="comment-form" 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleComment(post._id, commentInputs[post._id] || '');
                }}
              >
                <input 
                  type="text" 
                  placeholder="הוסף תגובה..." 
                  className="comment-input"
                  value={commentInputs[post._id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                />
                <button 
                  type="submit" 
                  className="btn btn-secondary"
                  disabled={isLoading[post._id + '-comment'] || !commentInputs[post._id]?.trim()}
                >
                  {isLoading[post._id + '-comment'] ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div className="loader" style={{ width: '15px', height: '15px', margin: '0' }}></div>
                    </span>
                  ) : 'שלח'}
                </button>
              </form>

              {post.comments.length > 0 && (
                <div className="comments-section">
                  <h4>תגובות:</h4>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {post.comments.map((comment, index) => (
                      <li key={index} className="comment-item">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem', opacity: '0.7', paddingTop: '2px' }}>💬</span>
                          <span>{comment}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📝</div>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>אין פוסטים עדיין!</p>
          <p>היה הראשון לשתף את הסיפור שלך...</p>
        </div>
      )}
      
      <button 
        className="floating-btn" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="חזרה לראש העמוד"
      >
        ↑
      </button>
    </div>
  );
}

export default PostList;
