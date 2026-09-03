import { Link, NavLink, Outlet } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import './Layout.css';

export function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="brand">
            <img src="/favicon.svg" width="26" height="26" alt="" />
            <span>ReturnRecord</span>
          </Link>
          <nav className="site-nav">
            <NavLink to="/rentals" className={({ isActive }) => (isActive ? 'active' : '')}>
              Rentals
            </NavLink>
            <NavLink to="/new" className={({ isActive }) => (isActive ? 'active' : '')}>
              Open a rental
            </NavLink>
            <NavLink to="/how-it-works" className={({ isActive }) => (isActive ? 'active' : '')}>
              How it works
            </NavLink>
          </nav>
          <WalletButton />
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container site-footer-inner">
          <span>Built on GenLayer · StudioNet</span>
          <a
            href="https://explorer-studio.genlayer.com/address/0x1B2C516eD354EfA26EF6ad2A0258755E926a740F"
            target="_blank"
            rel="noreferrer"
          >
            View contract
          </a>
        </div>
      </footer>
    </>
  );
}
