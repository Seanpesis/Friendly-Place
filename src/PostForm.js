import React, { useState, useEffect } from 'react';

function PostForm({ addPost, offlineMode }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const postData = {
      title,
      content,
      name: anonymous ? 'Anonymous' : name
    };

    if (offlineMode) {
      try {
        addPost(postData);
        setTitle('');
        setContent('');
        setName('');
        setAnonymous(false);
        setSuccess(true);
        setSuccessMessage('הפוסט נשמר מקומית ויסונכרן אוטומטית כשהחיבור יחזור');
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error('Error adding post locally:', error);
        setError('שגיאה בשמירה מקומית, נסה שנית');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Server request timed out')), 5000)
    );

    Promise.race([
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      }),
      timeoutPromise
    ])
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        addPost(data);
        setTitle('');
        setContent('');
        setName('');
        setAnonymous(false);
        setSuccess(true);
        setSuccessMessage('הפוסט נוסף בהצלחה!');
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch(error => {
        console.error('Error adding post:', error);
        
        try {
          addPost(postData);
          setTitle('');
          setContent('');
          setName('');
          setAnonymous(false);
          setSuccess(true);
          setSuccessMessage('השרת לא זמין. הפוסט נשמר מקומית ויסונכרן בהמשך.');
          setTimeout(() => setSuccess(false), 3000);
        } catch (localError) {
          setError('נכשל בשמירת הפוסט. אנא נסה שוב מאוחר יותר.');
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="form-container card fade-in">
      <h2 className="app-subtitle">שתפו את הסיפור שלכם</h2>
      
      {isReallyOffline && (
        <div style={{ 
          backgroundColor: 'rgba(255, 152, 0, 0.1)', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          color: '#ffc107',
          border: '1px solid rgba(255, 152, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <span>המערכת פועלת במצב אופליין זמני. הפוסטים יישמרו מקומית ויסונכרנו אוטומטית בהמשך.</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>✅</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            marginBottom: '20px',
            gap: '10px'
          }}>
            <input
              type="text"
              placeholder="השם שלך"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={anonymous}
              style={{ marginBottom: '10px' }}
            />
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: '10px 15px',
              background: anonymous ? 'rgba(92, 107, 192, 0.2)' : 'transparent',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255,255,255,0.1)',
              width: 'fit-content',
              marginRight: 'auto'
            }}>
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                style={{ marginLeft: '8px' }}
              />
              <span>פרסום אנונימי</span>
            </label>
          </div>

          <input
            type="text"
            placeholder="כותרת הפוסט"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ marginBottom: '20px' }}
          />

          <textarea
            placeholder="שתפו את הסיפור או החוויה שלכם..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ height: '150px', marginBottom: '25px' }}
          />

          <button 
            type="submit" 
            className="btn" 
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              padding: '12px',
              background: 'var(--primary-color)',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div className="loader" style={{ width: '20px', height: '20px', margin: '0' }}></div>
                שולח...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>📝</span>
                פרסם
              </span>
            )}
          </button>

          {error && (
            <div style={{ 
              color: 'var(--error)', 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: 'rgba(244, 67, 54, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(244, 67, 54, 0.2)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default PostForm;
