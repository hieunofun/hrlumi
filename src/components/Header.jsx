
function Header() {
  return (
    <header className="header">
      <div className="logo">
        <img src="/logo-express-exacting.png" alt="Express & Exacting" />
        <h1>HR Management <span>Admin</span></h1>
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
          color: '#00b14f',
          fontWeight: 'bold'
        }}>
          A
        </div>
      </div>
    </header>
  )
}

export default Header
