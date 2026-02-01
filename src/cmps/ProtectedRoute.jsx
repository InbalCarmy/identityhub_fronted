import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import '../assets/style/cmps/ProtectedRoute.css'

export function ProtectedRoute({ children }) {
    const navigate = useNavigate()
    const user = useSelector(storeState => storeState.userModule.user)

    if (!user) {
        return (
            <section className="protected-route-guard">
                <div className="auth-required-message">
                    <div className="lock-icon">🔒</div>
                    <h2>Authentication Required</h2>
                    <p>You need to be logged in to access this page.</p>
                    <div className="auth-actions">
                        <button
                            onClick={() => navigate('/')}
                            className="btn-primary"
                        >
                            Go to Login
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="btn-secondary"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            </section>
        )
    }

    return children
}
