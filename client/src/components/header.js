import React from 'react';
import './header.css';
import logo from '../ui/logo.svg'; // Ensure you have the logo image in your src directory


function Header() {

  return (
    <header className="header">
        <img src={logo} alt="Logo" className="logo"  />
    </header>
  );
}

export default Header;
