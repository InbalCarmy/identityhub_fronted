import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function JiraOAuthSuccess() {
    const navigate = useNavigate()

    useEffect(() => {
        showSuccessMsg('Jira connected successfully!')
        // Redirect to Jira connection page after 2 seconds
        setTimeout(() => {
            navigate('/jira')
        }, 2000)
    }, [navigate])

    return (
        <section className="oauth-callback">
            <div className="success-message">
                <h2>✓ Success!</h2>
                <p>Your Jira workspace has been connected successfully.</p>
                <p>Redirecting...</p>
            </div>
        </section>
    )
}

export function JiraOAuthError() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const errorMessage = searchParams.get('message') || 'Failed to connect to Jira'

    useEffect(() => {
        showErrorMsg(errorMessage)
    }, [errorMessage])

    function handleRetry() {
        navigate('/jira')
    }

    return (
        <section className="oauth-callback">
            <div className="error-message">
                <h2>✗ Connection Failed</h2>
                <p>{errorMessage}</p>
                <button onClick={handleRetry}>Try Again</button>
            </div>
        </section>
    )
}
