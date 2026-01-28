import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jiraService } from '../services/jira.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import '../assets/style/pages/CreateTicketPage.css'

export function CreateTickedPage() {
    const navigate = useNavigate()

    // State for projects
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [isLoadingProjects, setIsLoadingProjects] = useState(true)

    // State for project metadata
    const [projectMetadata, setProjectMetadata] = useState(null)
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

    // State for form
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        priority: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Check if Jira is connected and load projects
    useEffect(() => {
        loadProjects()
    }, [])

    async function loadProjects() {
        try {
            setIsLoadingProjects(true)

            // First check if Jira is connected
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
            setProjectMetadata(metadata)

            // Reset form when changing projects
            setFormData({
                summary: '',
                description: '',
                priority: metadata.priorities?.[0]?.id || ''
            })
        } catch (err) {
            console.error('Failed to load project metadata:', err)
            showErrorMsg('Failed to load project configuration')
        } finally {
            setIsLoadingMetadata(false)
        }
    }

    function handleInputChange(e) {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!selectedProject) {
            showErrorMsg('Please select a project')
            return
        }

        // Validation
        if (!formData.summary.trim()) {
            showErrorMsg('Summary is required')
            return
        }

        if (!formData.description.trim()) {
            showErrorMsg('Description is required')
            return
        }

        try {
            setIsSubmitting(true)

            // Prepare issue data
            const issueData = {
                project: selectedProject.key,
                summary: formData.summary,
                description: formData.description,
                issuetype: projectMetadata?.issueTypes?.[0]?.id || '10001',
            }

            // Add priority if selected
            if (formData.priority) {
                issueData.priority = formData.priority
            }

            // Create the issue
            const createdIssue = await jiraService.createIssue(issueData)

            showSuccessMsg(`Ticket ${createdIssue.key} created successfully!`)

            // Reset form
            setFormData({
                summary: '',
                description: '',
                priority: projectMetadata?.priorities?.[0]?.id || ''
            })

        } catch (err) {
            console.error('Failed to create ticket:', err)
            showErrorMsg(err.message || 'Failed to create ticket')
        } finally {
            setIsSubmitting(false)
        }
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
                <form onSubmit={handleSubmit} className="ticket-form">
                    {/* Project Selection */}
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

                    {/* Form fields - only show when project is selected and metadata loaded */}
                    {selectedProject && projectMetadata && !isLoadingMetadata && (
                        <>
                            {/* Summary */}
                            <div className="form-group">
                                <label htmlFor="summary">
                                    Summary (Title) <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="summary"
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Stale Service Account: svc-deploy-prod"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label htmlFor="description">
                                    Description <span className="required">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Provide details about the NHI finding..."
                                    rows="8"
                                    required
                                />
                            </div>

                            {/* Priority - only show if project has priorities */}
                            {projectMetadata.priorities && projectMetadata.priorities.length > 0 && (
                                <div className="form-group">
                                    <label htmlFor="priority">Priority</label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">None</option>
                                        {projectMetadata.priorities.map(priority => (
                                            <option key={priority.id} value={priority.id}>
                                                {priority.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating Ticket...' : 'Create Ticket'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/jira')}
                                    className="btn-secondary"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </form>
            )}
        </section>
    )
}