import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

export function JiraOAuthSuccess() {
    useEffect(() => {
        // Check if we're in a popup window
        if (window.opener) {
            // Notify parent window and close popup
            window.opener.postMessage({ type: 'JIRA_OAUTH_SUCCESS' }, window.location.origin)
            setTimeout(() => {
                window.close()
            }, 1000)
        } else {
            // If not in popup, show message and redirect
            showSuccessMsg('Jira connected successfully!')
        }
    }, [])

    return (
        <section className="oauth-callback">
            <div className="success-message">
                <h2>✓ Success!</h2>
                <p>Your Jira workspace has been connected successfully.</p>
                <p>This window will close automatically...</p>
            </div>
        </section>
    )
}

export function JiraOAuthError() {
    const [searchParams] = useSearchParams()
    const errorMessage = searchParams.get('message') || 'Failed to connect to Jira'

    useEffect(() => {
        // Check if we're in a popup window
        if (window.opener) {
            // Notify parent window and close popup
            window.opener.postMessage({
                type: 'JIRA_OAUTH_ERROR',
                error: errorMessage
            }, window.location.origin)
            setTimeout(() => {
                window.close()
            }, 2000)
        } else {
            // If not in popup, show error message
            showErrorMsg(errorMessage)
        }
    }, [errorMessage])

    return (
        <section className="oauth-callback">
            <div className="error-message">
                <h2>✗ Connection Failed</h2>
                <p>{errorMessage}</p>
                <p>This window will close automatically...</p>
            </div>
        </section>
    )
}
