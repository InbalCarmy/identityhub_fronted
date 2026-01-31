import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jiraService } from '../services/jira.service'
import { showErrorMsg } from '../services/event-bus.service'
import '../assets/style/pages/RecentTickets.css'

export function RecentTickets() {
    const navigate = useNavigate()
    const [tickets, setTickets] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [jiraSiteUrl, setJiraSiteUrl] = useState('')

    useEffect(() => {
        loadTickets()
    }, [])

    async function loadTickets() {
        try {
            setIsLoading(true)

            // Check connection status
            const status = await jiraService.getConnectionStatus()
            setIsConnected(status.isConnected)

            if (!status.isConnected) {
                return
            }

            // Store the Jira site URL
            if (status.siteUrl) {
                setJiraSiteUrl(status.siteUrl)
            }

            // Fetch tickets created from IdentityHub
            const ticketsData = await jiraService.getIdentityHubTickets(10)
            setTickets(ticketsData)

        } catch (err) {
            console.error('Failed to load tickets:', err)
            showErrorMsg(err.message || 'Failed to load tickets')
        } finally {
            setIsLoading(false)
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function handleTicketClick(ticket) {
        if (jiraSiteUrl) {
            window.open(`${jiraSiteUrl}/browse/${ticket.key}`, '_blank')
        }
    }

    if (isLoading) {
        return (
            <section className="recent-tickets-page">
                <h2>Recent Tickets</h2>
                <div className="loading">Loading tickets...</div>
            </section>
        )
    }

    if (!isConnected) {
        return (
            <section className="recent-tickets-page">
                <h2>Recent Tickets</h2>
                <div className="not-connected">
                    <p>You need to connect to Jira first to view tickets.</p>
                    <button onClick={() => navigate('/jira')} className="btn-primary">
                        Connect to Jira
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section className="recent-tickets-page">
                <h2>Recent Tickets from IdentityHub</h2>
            {tickets.length === 0 ? (
                <div className="no-tickets">
                    <p>No tickets created from IdentityHub yet.</p>
                    <button onClick={() => navigate('/jira/create-ticket')} className="btn-primary">
                        Create Your First Ticket
                    </button>
                </div>
            ) : (
                <div className="tickets-list">
                    {tickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className="ticket-card"
                            onClick={() => handleTicketClick(ticket)}
                        >
                            <div className="ticket-header">
                                <span className="ticket-key">{ticket.key}</span>
                                <span className={`ticket-status status-${ticket.fields.status.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {ticket.fields.status.name}
                                </span>
                            </div>
                            <h3 className="ticket-summary">{ticket.fields.summary}</h3>
                            <div className="ticket-meta">
                                <span className="ticket-project">
                                    {ticket.fields.project.name} ({ticket.fields.project.key})
                                </span>
                                <span className="ticket-date">
                                    Created: {formatDate(ticket.fields.created)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="actions">
                <button onClick={() => navigate('/jira/create-ticket')} className="btn-primary">
                    Create New Ticket
                </button>
                <button onClick={() => navigate('/jira')} className="btn-secondary">
                    Jira Settings
                </button>
            </div>
        </section>
    )
}