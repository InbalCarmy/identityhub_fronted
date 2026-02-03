import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { jiraService } from '../services/jira.service'
import { showErrorMsg } from '../services/event-bus.service'

export function RecentTickets() {
    const navigate = useNavigate()
    const location = useLocation()
    const [tickets, setTickets] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [jiraSiteUrl, setJiraSiteUrl] = useState('')
    const [projects, setProjects] = useState([])
    const [selectedProjectKey, setSelectedProjectKey] = useState('')
    const [isLoadingProjects, setIsLoadingProjects] = useState(false)
    const [isPolling, setIsPolling] = useState(false)
    const hasHandledNavigation = useRef(false) // for polling to happent only on initial mount

    useEffect(() => {
        loadInitialData()
    }, [])

    useEffect(() => {
        if (isConnected) {
            loadTickets()
        }
    }, [selectedProjectKey, isConnected])

    // Poll for new ticket if we just created one (only once on initial mount)
    useEffect(() => {
        const newTicketKey = location.state?.newTicketKey
        const projectKey = location.state?.projectKey

        if (newTicketKey && isConnected && !isLoading && !hasHandledNavigation.current) {
            hasHandledNavigation.current = true
            pollForNewTicket(newTicketKey, projectKey)
        }
    }, [location.state, isConnected, isLoading])

    async function loadInitialData() {
        try {
            setIsLoading(true)

            // Check connection status
            const status = await jiraService.getConnectionStatus()
            setIsConnected(status.isConnected)

            if (!status.isConnected) {
                setIsLoading(false)
                return
            }

            // Store the Jira site URL
            if (status.siteUrl) {
                setJiraSiteUrl(status.siteUrl)
            }

            // Load projects
            setIsLoadingProjects(true)
            const projectsData = await jiraService.getProjects()
            setProjects(projectsData)
            setIsLoadingProjects(false)

            // Check if projectKey was passed from Create Ticket page
            const projectKeyFromState = location.state?.projectKey
            if (projectKeyFromState) {
                setSelectedProjectKey(projectKeyFromState)
            }
        } catch (err) {
            console.error('Failed to load initial data:', err)
            showErrorMsg(err.message || 'Failed to load data')
        } finally {
            setIsLoading(false)
        }
    }

    async function loadTickets() {
        try {
            setIsLoading(true)

            // Fetch tickets created from IdentityHub, filtered by project if selected
            const ticketsData = await jiraService.getIdentityHubTickets(
                10,
                selectedProjectKey || null
            )
            setTickets(ticketsData)

        } catch (err) {
            console.error('Failed to load tickets:', err)
            showErrorMsg(err.message || 'Failed to load tickets')
        } finally {
            setIsLoading(false)
        }
    }

    async function pollForNewTicket(ticketKey, projectKey) {
        setIsPolling(true)
        const maxAttempts = 10 
        const pollInterval = 1000 
        let attempts = 0


        const poll = async () => {
            attempts++

            try {
                const ticketsData = await jiraService.getIdentityHubTickets(
                    10,
                    projectKey || null
                )

                // Check if our new ticket appears in the list
                const ticketFound = ticketsData.some(ticket => ticket.key === ticketKey)

                if (ticketFound) {
                    setTickets(ticketsData)
                    setIsPolling(false)
                    return // Stop polling
                }

                // Continue polling if not found and haven't exceeded max attempts
                if (attempts < maxAttempts) {
                    setTimeout(poll, pollInterval)
                } else {
                    setIsPolling(false)
                    // Load tickets one final time
                    loadTickets()
                }
            } catch (err) {
                console.error('Error during polling:', err)
                setIsPolling(false)
            }
        }

        // Start polling after a short delay to avoid immediate check
        setTimeout(poll, 500)
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

            {/* Project Filter */}
            {projects.length > 0 && (
                <div className="filter-section">
                    <label htmlFor="projectFilter">Filter by Project:</label>
                    <select
                        id="projectFilter"
                        value={selectedProjectKey}
                        onChange={(e) => setSelectedProjectKey(e.target.value)}
                        disabled={isLoadingProjects}
                    >
                        <option value="">All Projects</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.key}>
                                {project.name} ({project.key})
                            </option>
                        ))}
                    </select>
                </div>
            )}

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