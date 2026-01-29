import { useState, useEffect } from 'react'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { jiraService } from '../services/jira.service'

export function TicketForm({ selectedProject, selectedIssueType, onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        summary: '',
        description: '',
        priority: selectedIssueType?.fields?.priority?.allowedValues?.[0]?.id || ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [additionalFields, setAdditionalFields] = useState([])

    // Extract additional required fields when issue type changes
    useEffect(() => {
        if (!selectedIssueType?.fields) return

        const fieldsToIgnore = ['summary', 'description', 'priority', 'project', 'issuetype', 'labels']
        const fields = []
        

        Object.entries(selectedIssueType.fields).forEach(([fieldKey, fieldConfig]) => {
            // Only include required fields that we don't already handle
            if (fieldConfig.required && !fieldsToIgnore.includes(fieldKey)) {
                fields.push({
                    key: fieldKey,
                    name: fieldConfig.name,
                    schema: fieldConfig.schema,
                    allowedValues: fieldConfig.allowedValues,
                    required: fieldConfig.required
                })

                // Initialize form data for this field
                if (fieldConfig.allowedValues && fieldConfig.allowedValues.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        [fieldKey]: fieldConfig.allowedValues[0].id
                    }))
                } else {
                    setFormData(prev => ({
                        ...prev,
                        [fieldKey]: ''
                    }))
                }
            }
        })

        setAdditionalFields(fields)
    }, [selectedIssueType])


    console.log("set data:", formData);
    

    function handleInputChange(e) {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

        if (!formData.summary.trim()) {
            showErrorMsg('Summary is required')
            return
        }

        if (!formData.description.trim()) {
            showErrorMsg('Description is required')
            return
        }

        // Validate additional required fields
        for (const field of additionalFields) {
            if (field.required && !formData[field.key]) {
                showErrorMsg(`${field.name} is required`)
                return
            }
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

            // Add IdentityHub label to track tickets created from this platform
            issueData.labels = ['created-from-identityhub']

            // Add additional required fields
            additionalFields.forEach(field => {
                if (formData[field.key]) {
                    if (field.allowedValues && field.allowedValues.length > 0) {
                        // If it's a select field, use the id
                        issueData[field.key] = { id: formData[field.key] }
                    } else if (field.schema?.type === 'array') {
                        // If it's an array field
                        issueData[field.key] = [formData[field.key]]
                    } else {
                        // Otherwise, use the value directly
                        issueData[field.key] = formData[field.key]
                    }
                }
            })

            console.log('Creating issue with data:', issueData)

            // Create the issue
            const createdIssue = await jiraService.createIssue(issueData)

            showSuccessMsg(`Ticket ${createdIssue.key} created successfully! Redirecting...`)

            // Reset form
            const priorities = selectedIssueType?.fields?.priority?.allowedValues || []
            setFormData({
                summary: '',
                description: '',
                priority: priorities?.[0]?.id || ''
            })

            // Wait for Jira to index the ticket before redirecting
            if (onSuccess) {
                await new Promise(resolve => setTimeout(resolve, 3000))
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

            {/* Render additional required fields dynamically */}
            {additionalFields.map(field => (
                <div key={field.key} className="form-group">
                    <label htmlFor={field.key}>
                        {field.name}
                        {field.required && <span className="required">*</span>}
                    </label>

                    {field.allowedValues && field.allowedValues.length > 0 ? (
                        <select
                            id={field.key}
                            name={field.key}
                            value={formData[field.key] || ''}
                            onChange={handleInputChange}
                            required={field.required}
                        >
                            {!field.required && <option value="">None</option>}
                            {field.allowedValues.map(value => (
                                <option key={value.id} value={value.id}>
                                    {value.name || value.value}
                                </option>
                            ))}
                        </select>
                    ) : field.schema?.type === 'string' && field.schema?.system === 'text' ? (
                        <textarea
                            id={field.key}
                            name={field.key}
                            value={formData[field.key] || ''}
                            onChange={handleInputChange}
                            required={field.required}
                            rows="4"
                        />
                    ) : (
                        <input
                            type="text"
                            id={field.key}
                            name={field.key}
                            value={formData[field.key] || ''}
                            onChange={handleInputChange}
                            required={field.required}
                        />
                    )}
                </div>
            ))}

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
