import React, { useState, useEffect } from 'react';
import FriendlyPlace from './FriendlyPlace';
import './App.css';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
      setShowBackToTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);
  
  return (
    <div className="App">
      <header className={`app-header ${scrolled ? 'fixed-top' : ''}`}>
        <h1 className="app-title">Friendly Place</h1>
        <p className="app-subtitle">מקום לשתף ולהתחבר</p>
      </header>
      <main className="main-content">
        <FriendlyPlace />
      </main>
      <footer className="app-footer">
        <p>© 2025 Friendly Place. כל הזכויות שמורות.</p>
      </footer>
      {showBackToTop && (
        <button 
          className="back-to-top visible" 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          aria-label="חזרה לראש העמוד"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
