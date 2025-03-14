import React, { useState, useEffect, useCallback } from 'react';
import PostForm from './PostForm';
import PostList from './PostList';

const samplePosts = [
  {
    _id: 'sample1',
    title: 'ברוכים הבאים לאתר',
    content: 'זהו פוסט לדוגמה שמוצג במצב אופליין זמני. כשהחיבור לשרת יחזור, התוכן יסונכרן אוטומטית.',
    name: 'מערכת',
    date: new Date().toISOString(),
    likes: 5,
    comments: ['מצוין!', 'תודה על האתר היפה']
  }
];

function FriendlyPlace() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncRequired, setSyncRequired] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [isReallyOffline, setIsReallyOffline] = useState(!navigator.onLine);
  const [statusMessage, setStatusMessage] = useState(null);
  
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/posts`);
      
      if (!response.ok) {
        throw new Error(`שגיאת שרת ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPosts(data);
      setOfflineMode(false);
      setSyncRequired(false);
      setLastSynced(new Date());
      
      localStorage.setItem('localPosts', JSON.stringify(data));
      localStorage.setItem('lastSynced', new Date().toISOString());
      
      syncLocalPosts();
    } catch (err) {
      console.error('Error fetching posts:', err);
      const errorMessage = 'לא ניתן להתחבר לשרת. עובד במצב אופליין זמני.';
      setError(errorMessage);
      setStatusMessage(errorMessage);
      setOfflineMode(true);
      
      loadLocalPosts();
    } finally {
      setLoading(false);
    }
  }, []);
  
  const loadLocalPosts = () => {
    const localPosts = localStorage.getItem('localPosts');
    if (localPosts) {
      setPosts(JSON.parse(localPosts));
      
      const lastSyncTime = localStorage.getItem('lastSynced');
      if (lastSyncTime) {
        setLastSynced(new Date(lastSyncTime));
      }
    } else {
      setPosts(samplePosts);
      localStorage.setItem('localPosts', JSON.stringify(samplePosts));
    }
  };
  
  const syncLocalPosts = async () => {
    const pendingPosts = localStorage.getItem('pendingPosts');
    if (!pendingPosts) return;
    
    const postsToSync = JSON.parse(pendingPosts);
    if (postsToSync.length === 0) {
      localStorage.removeItem('pendingPosts');
      return;
    }
    
    let failed = false;
    
    for (const post of postsToSync) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(post)
        });
        
        if (!response.ok) {
          throw new Error('Failed to sync post');
        }
      } catch (error) {
        console.error('Failed to sync post:', error);
        failed = true;
        break;
      }
    }
    
    if (!failed) {
      localStorage.removeItem('pendingPosts');
      setSyncRequired(false);
      fetchPosts();
    }
  };

  const saveForSync = (postData) => {
    const pendingPosts = localStorage.getItem('pendingPosts');
    let postsToSync = pendingPosts ? JSON.parse(pendingPosts) : [];
    postsToSync.push(postData);
    localStorage.setItem('pendingPosts', JSON.stringify(postsToSync));
    setSyncRequired(true);
  };

  const syncNow = useCallback(() => {
    if (!navigator.onLine) {
      setStatusMessage('אין חיבור לאינטרנט. הסנכרון יתבצע אוטומטית כשהחיבור יחזור.');
      return;
    }
    
    const postsToSync = JSON.parse(localStorage.getItem('postsToSync') || '[]');
    if (postsToSync.length === 0) {
      setSyncRequired(false);
      return;
    }
    
    setLoading(true);
    setStatusMessage('מסנכרן פוסטים...');
    
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postsToSync)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        localStorage.removeItem('postsToSync');
        setSyncRequired(false);
        setLastSynced(new Date());
        setStatusMessage('הסנכרון הושלם בהצלחה');
        setTimeout(() => setStatusMessage(null), 3000);
        
        fetchPosts();
      })
      .catch(err => {
        console.error('Error syncing posts:', err);
        setStatusMessage('שגיאה בסנכרון. ננסה שוב בהמשך.');
        setTimeout(() => setStatusMessage(null), 3000);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchPosts]);

  useEffect(() => {
    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsReallyOffline(!online);
      
      if (online && syncRequired) {
        syncNow();
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [syncRequired, syncNow]);
  
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPost = (newPost) => {
    if (offlineMode || isReallyOffline) {
      saveForSync(newPost);
      
      const tempPost = {
        ...newPost,
        _id: `local_${Date.now()}`,
        date: new Date().toISOString(),
        likes: 0,
        comments: [],
        pendingSync: true
      };
      
      const updatedPosts = [tempPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem('localPosts', JSON.stringify(updatedPosts));
    } else {
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
    }
  };

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
    <div className="container">
      {/* הצגת הודעת סטטוס כללית אם קיימת */}
      {statusMessage && (
        <div className="status-message">
          {statusMessage}
        </div>
      )}
    
      {/* הצגת באנר אופליין רק כשבאמת אין חיבור לאינטרנט */}
      {isReallyOffline && (
        <div className="offline-banner">
          <span style={{ fontSize: '1.2rem', marginLeft: '5px' }}>⚠️</span>
          אין חיבור לאינטרנט. פועל במצב אופליין. התוכן יסונכרן אוטומטית כשהחיבור יחזור.
        </div>
      )}
      
      {/* הצגת באנר סנכרון רק כשיש חיבור לאינטרנט וצריך לסנכרן */}
      {!isReallyOffline && syncRequired && (
        <div className="sync-banner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px'
        }}>
          יש פוסטים ממתינים לסנכרון
          <button 
            onClick={syncNow} 
            className="btn"
            style={{ marginRight: '15px', background: 'white', color: 'var(--primary-color)' }}
          >
            סנכרן עכשיו
          </button>
        </div>
      )}
      
      {!isReallyOffline && lastSynced && (
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          opacity: 0.7,
          marginBottom: '10px'
        }}>
          סונכרן לאחרונה: {new Intl.DateTimeFormat('he-IL', { 
            dateStyle: 'short', 
            timeStyle: 'short' 
          }).format(lastSynced)}
        </div>
      )}
      
      <PostForm addPost={addPost} offlineMode={offlineMode || isReallyOffline} />
      
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p>טוען פוסטים...</p>
          <div className="loader"></div>
        </div>
      ) : (
        <PostList 
          posts={posts} 
          setPosts={setPosts} 
          offlineMode={offlineMode || isReallyOffline}
          syncing={syncRequired}
          likePost={likePost}
          addComment={addComment}
        />
      )}
    </div>
  );
}

export default FriendlyPlace;
