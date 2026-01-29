import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { jiraService } from '../services/jira.service'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import '../assets/style/pages/CreateTicketPage.css'

export function CreateTickedPage() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [isLoadingProjects, setIsLoadingProjects] = useState(true)
    const [projectMetadata, setProjectMetadata] = useState(null)
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        priority: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

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

            // Reset form when changing projects
            setFormData({
                summary: '',
                description: '',
                priority: parsedMetadata.priorities?.[0]?.id || ''
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

            // Get the first available issue type
            const issueTypeId = projectMetadata?.issueTypes?.[0]?.id

            if (!issueTypeId) {
                showErrorMsg('No issue type available for this project')
                return
            }

            console.log('Using issue type ID:', issueTypeId)
            console.log('Available issue types:', projectMetadata?.issueTypes)

            // Prepare issue data in Jira API format
            const issueData = {
                project: {
                    key: selectedProject.key
                },
                summary: formData.summary,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: formData.description
                                }
                            ]
                        }
                    ]
                },
                issuetype: {
                    id: issueTypeId
                }
            }

            // Add priority if selected
            if (formData.priority) {
                issueData.priority = {
                    id: formData.priority
                }
            }

            console.log('Creating issue with data:', issueData)

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