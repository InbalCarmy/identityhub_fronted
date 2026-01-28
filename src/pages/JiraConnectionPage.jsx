import { useState, useEffect } from 'react'
import { jiraService } from '../services/jira.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'

export function JiraConnectionPage() {
    const [isConnected, setIsConnected] = useState(false)
    const [connectedAt, setConnectedAt] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkConnectionStatus()
    }, [])

    async function checkConnectionStatus() {
        try {
            setIsLoading(true)
            const status = await jiraService.getConnectionStatus()
            setIsConnected(status.isConnected)
            setConnectedAt(status.connectedAt)
        } catch (err) {
            console.error('Failed to check connection status:', err)
            showErrorMsg('Failed to check Jira connection status')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleConnect() {
        try {
            // Get authorization URL from backend
            const { authUrl } = await jiraService.initiateOAuth()

            // Redirect to Jira for authorization
            window.location.href = authUrl
        } catch (err) {
            console.error('Failed to initiate OAuth:', err)
            showErrorMsg(err.message || 'Failed to connect to Jira')
        }
    }

    async function handleDisconnect() {
        try {
            await jiraService.disconnect()
            setIsConnected(false)
            setConnectedAt(null)
            showSuccessMsg('Jira disconnected successfully')
        } catch (err) {
            console.error('Failed to disconnect:', err)
            showErrorMsg(err.message || 'Failed to disconnect from Jira')
        }
    }

    if (isLoading) {
        return (
            <section className="jira-connection-page">
                <h2>Jira Integration</h2>
                <p>Loading connection status...</p>
            </section>
        )
    }

    return (
        <section className="jira-connection-page">
            <h2>Jira Integration</h2>

            {!isConnected ? (
                <div className="connection-prompt">
                    <p>Connect your Jira workspace to create and manage NHI finding tickets.</p>
                    <h3>What you'll be able to do:</h3>
                    <ul>
                        <li>Create NHI finding tickets directly from IdentityHub</li>
                        <li>View recent tickets from your projects</li>
                        <li>Automatically populate issue fields based on findings</li>
                    </ul>
                    <button onClick={handleConnect} className="connect-btn">
                        Connect to Jira
                    </button>
                    <div className="oauth-info">
                        <small>
                            You'll be redirected to Atlassian to authorize this application.
                            We only request permission to read and write Jira issues.
                        </small>
                    </div>
                </div>
            ) : (
                <div className="connection-status">
                    <div className="status-badge connected">
                        ✓ Connected to Jira
                    </div>
                    {connectedAt && (
                        <p className="connected-at">
                            Connected on: {new Date(connectedAt).toLocaleString()}
                        </p>
                    )}
                    <div className="actions">
                        <button onClick={handleDisconnect} className="disconnect-btn">
                            Disconnect Jira
                        </button>
                    </div>
                    <div className="next-steps">
                        <h3>Next Steps:</h3>
                        <p>Your Jira workspace is connected! You can now:</p>
                        <ul>
                            <li>Go to Dashboard to create NHI finding tickets</li>
                            <li>View recent tickets from your projects</li>
                        </ul>
                    </div>
                </div>
            )}
        </section>
    )
}
