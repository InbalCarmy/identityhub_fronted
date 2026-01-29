import { useState } from 'react'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { jiraService } from '../services/jira.service'

export function TicketForm({ selectedProject, selectedIssueType, onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        priority: selectedIssueType?.fields?.priority?.allowedValues?.[0]?.id || ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    function handleInputChange(e) {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

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

            console.log('Using issue type ID:', selectedIssueType.id)
            console.log('Selected issue type:', selectedIssueType)

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
                    id: selectedIssueType.id
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
            const priorities = selectedIssueType?.fields?.priority?.allowedValues || []
            setFormData({
                summary: '',
                description: '',
                priority: priorities?.[0]?.id || ''
            })

            // Call success callback
            if (onSuccess) {
                onSuccess(createdIssue)
            }

        } catch (err) {
            console.error('Failed to create ticket:', err)
            showErrorMsg(err.message || 'Failed to create ticket')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <div className="form-separator"></div>

            <div className="form-group">
                <label htmlFor="summary">
                    Summary (Title)
                    {selectedIssueType.fields?.summary?.required !== false && (
                        <span className="required">*</span>
                    )}
                </label>
                <input
                    type="text"
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    placeholder="e.g., Stale Service Account: svc-deploy-prod"
                    required={selectedIssueType.fields?.summary?.required !== false}
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">
                    Description
                    {selectedIssueType.fields?.description?.required !== false && (
                        <span className="required">*</span>
                    )}
                </label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide details about the NHI finding..."
                    rows="8"
                    required={selectedIssueType.fields?.description?.required !== false}
                />
            </div>

            {selectedIssueType?.fields?.priority?.allowedValues &&
             selectedIssueType.fields.priority.allowedValues.length > 0 && (
                <div className="form-group">
                    <label htmlFor="priority">
                        Priority
                        {selectedIssueType.fields.priority.required &&
                            <span className="required">*</span>
                        }
                    </label>
                    <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        required={selectedIssueType.fields.priority.required}
                    >
                        {!selectedIssueType.fields.priority.required && (
                            <option value="">None</option>
                        )}
                        {selectedIssueType.fields.priority.allowedValues.map(priority => (
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
                    onClick={handleSubmit}
                >
                    {isSubmitting ? 'Creating Ticket...' : 'Create Ticket'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="btn-secondary"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
            </div>
        </>
    )
}
