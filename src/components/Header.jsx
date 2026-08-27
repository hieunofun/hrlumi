
function Header() {
  return (
    <header className="header">
      <div className="logo">
        <img src="/speego-logo.png" alt="SpeeGo Logistics" />
        <h1>SpeeGo <span>HR</span></h1>
      </div>
      <div className="user-info">
        <span>Admin</span>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0b3b75',
          fontWeight: 'bold'
        }}>
          A
        </div>
      </div>
    </header>
  )
}

export default Header
