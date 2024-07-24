import React from 'react';
import './header.css';
import logo from '../ui/logo.svg'; // Ensure you have the logo image in your src directory
import clientImg from '../ui/thumImg.svg';

function Header() {
  return (
    <header className="header">
        <div className="blank"></div>
        <img src={logo} alt="Logo" className="logo" />
        <img src={clientImg} alt="마이페이지" className="thumImg" />
    </header>
  );
}

export default Header;
