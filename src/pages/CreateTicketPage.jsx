import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jiraService } from '../services/jira.service'
import { showErrorMsg } from '../services/event-bus.service'
import { TicketForm } from '../cmps/TicketForm'

export function CreateTickedPage() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [isLoadingProjects, setIsLoadingProjects] = useState(true)
    const [projectMetadata, setProjectMetadata] = useState(null)
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
    const [selectedIssueType, setSelectedIssueType] = useState(null)

    useEffect(() => {
        loadProjects()
    }, [])

    async function loadProjects() {
        try {
            setIsLoadingProjects(true)
            const status = await jiraService.getConnectionStatus()

            if (!status.isConnected) {
                showErrorMsg('Please connect to Jira first')
                navigate('/jira')
                return
            }

            // Fetch projects
            const projectsData = await jiraService.getProjects()
            setProjects(projectsData)

            if (projectsData.length === 0) {
                showErrorMsg('No projects found in your Jira workspace')
            }
        } catch (err) {
            console.error('Failed to load projects:', err)
            showErrorMsg(err.message || 'Failed to load Jira projects')
        } finally {
            setIsLoadingProjects(false)
        }
    }

    async function handleProjectChange(e) {
        const projectKey = e.target.value

        if (!projectKey) {
            setSelectedProject(null)
            setProjectMetadata(null)
            return
        }

        const project = projects.find(p => p.key === projectKey)
        setSelectedProject(project)

        // Load project metadata
        try {
            setIsLoadingMetadata(true)
            const metadata = await jiraService.getProjectMetadata(projectKey)

            console.log('Raw metadata:', metadata)

            // Parse the metadata structure from Jira API
            const projectData = metadata.projects?.[0]

            if (!projectData) {
                throw new Error('No project data found')
            }

            const parsedMetadata = {
                issueTypes: projectData.issuetypes || [],
                priorities: projectData.issuetypes?.[0]?.fields?.priority?.allowedValues || []
            }

            console.log('Parsed metadata:', parsedMetadata)
            setProjectMetadata(parsedMetadata)

            // Reset issue type when changing projects
            setSelectedIssueType(null)
        } catch (err) {
            console.error('Failed to load project metadata:', err)
            showErrorMsg('Failed to load project configuration')
        } finally {
            setIsLoadingMetadata(false)
        }
    }

    function handleIssueTypeChange(e) {
        const issueTypeId = e.target.value

        if (!issueTypeId) {
            setSelectedIssueType(null)
            return
        }

        const issueType = projectMetadata.issueTypes.find(it => it.id === issueTypeId)
        setSelectedIssueType(issueType)
    }

    if (isLoadingProjects) {
        return (
            <section className="create-ticket-page">
                <h2>Create NHI Finding Ticket</h2>
                <div className="loading">Loading projects...</div>
            </section>
        )
    }

    
    
    return (
        <section className="create-ticket-page">
            <h2>Create NHI Finding Ticket</h2>

            {projects.length === 0 ? (
                <div className="no-projects">
                    <p>No projects found in your Jira workspace.</p>
                    <button onClick={() => navigate('/jira')} className="btn-secondary">
                        Go to Jira Settings
                    </button>
                </div>
            ) : (
                <div className="ticket-form">
                    <div className="form-group">
                        <label htmlFor="project">
                            Project <span className="required">*</span>
                        </label>
                        <select
                            id="project"
                            value={selectedProject?.key || ''}
                            onChange={handleProjectChange}
                            required
                            disabled={isLoadingMetadata}
                        >
                            <option value="">Select a project...</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.key}>
                                    {project.name} ({project.key})
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoadingMetadata && (
                        <div className="loading">Loading project configuration...</div>
                    )}

                    {/* Issue Type Selection - show after project is selected and metadata loaded */}
                    {selectedProject && projectMetadata && !isLoadingMetadata && (
                        <div className="form-group">
                            <label htmlFor="issueType">
                                Issue Type <span className="required">*</span>
                            </label>
                            <select
                                id="issueType"
                                value={selectedIssueType?.id || ''}
                                onChange={handleIssueTypeChange}
                                required
                            >
                                <option value="">Select an issue type...</option>
                                {projectMetadata.issueTypes.map(issueType => (
                                    <option key={issueType.id} value={issueType.id}>
                                        {issueType.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Form fields - only show when issue type is selected */}
                    {selectedProject && projectMetadata && !isLoadingMetadata && selectedIssueType && (
                        <TicketForm
                            selectedProject={selectedProject}
                            selectedIssueType={selectedIssueType}
                            onCancel={() => navigate('/jira')}
                            onSuccess={() => {navigate('/jira/recent-tickets') }}
                        />
                    )}
                </div>
            )}
        </section>
    )
}