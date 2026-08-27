import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { login, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/'

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const profile = await login(email.trim(), password)
            if (!['admin', 'hr', 'manager'].includes(profile?.role)) {
                await logout()
                setError('Tài khoản này không có quyền truy cập trang quản trị')
                return
            }
            navigate(from === '/' ? '/dashboard' : from, { replace: true })
        } catch (err) {
            console.error('Login error:', err)
            setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden'
        }}>
            {/* LEFT SIDE: Login Form */}
            <div style={{
                flex: '1',
                maxWidth: '500px',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px'
            }}>
                <div style={{ marginBottom: '40px' }}>
                    <img
                        src="/speego-logo.png"
                        alt="SpeeGo Logistics"
                        style={{
                            width: '180px',
                            height: '128px',
                            objectFit: 'contain',
                            borderRadius: '16px',
                            marginBottom: '20px'
                        }}
                    />
                    <h2 style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '10px', fontWeight: '800' }}>WELCOME BACK</h2>
                    <p className="text-muted" style={{ fontSize: '1.1rem' }}>Đăng nhập hệ thống quản lý nhân sự</p>
                </div>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: '25px', padding: '15px', background: '#ffebee', color: '#c62828', borderRadius: '4px', borderLeft: '4px solid #c62828' }}>
                        <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-envelope" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nhanvien@speego.vn"
                                required
                                style={{ width: '100%', padding: '12px 12px 12px 45px', fontSize: '1rem', background: '#f8f9fa', border: '1px solid #e0e0e0' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>Mật khẩu</label>
                        <div style={{ position: 'relative' }}>
                            <i className="fas fa-lock" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{ width: '100%', padding: '12px 12px 12px 45px', fontSize: '1rem', background: '#f8f9fa', border: '1px solid #e0e0e0' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px', fontSize: '1.1rem', fontWeight: '600', boxShadow: '0 4px 6px rgba(0,51,102, 0.2)' }}
                        disabled={loading}
                    >
                        {loading ? (
                            <span><i className="fas fa-spinner fa-spin"></i> Đang kết nối...</span>
                        ) : (
                            <span>Đăng nhập <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i></span>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: 'auto', paddingTop: '40px', color: '#999', fontSize: '0.9rem' }}>
                    &copy; 2026 SpeeGo Logistics HR Management System
                </div>
            </div>

            {/* RIGHT SIDE: Airport Visual */}
            <div style={{
                flex: '1',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Abstract Pattern */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    border: '80px solid rgba(255,255,255,0.03)'
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '-10%',
                    left: '-10%',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)'
                }}></div>

                <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                    <img
                        src="/speego-logo.png"
                        alt="SpeeGo Logistics"
                        style={{
                            width: '360px',
                            height: '280px',
                            objectFit: 'contain',
                            marginBottom: '30px',
                        }}
                    />
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '10px', letterSpacing: '2px' }}>SPEEGO LOGISTICS</h1>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: '400', opacity: 0.85, letterSpacing: '4px' }}>NHANH CHÓNG · CHÍNH XÁC</h3>

                    <div style={{
                        width: '100px',
                        height: '4px',
                        background: 'var(--accent)',
                        margin: '30px auto'
                    }}></div>

                    <p style={{ maxWidth: '500px', fontSize: '1.1rem', opacity: 0.8, lineHeight: '1.6' }}>
                        Hệ thống quản lý nhân sự tập trung, chuyên nghiệp và hiệu quả.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
