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

        const fieldsToIgnore = ['summary', 'description', 'priority', 'project', 'issuetype']
        const fields = []

        // determine if field type is supported
        const isSupportedField = (fieldConfig) => {
            const schema = fieldConfig.schema

            // Fields with allowed values (dropdown/select)
            if (fieldConfig.allowedValues && fieldConfig.allowedValues.length > 0) {
                return true
            }

            // Check schema type
            if (!schema) return false

            const type = schema.type?.toLowerCase()
            const items = schema.items?.toLowerCase()

            if (type === 'string') return true
            if (type === 'number') return true
            if (type === 'date' || type === 'datetime') return true
            if (type === 'array' && items === 'string') return true
            return false
        }

        Object.entries(selectedIssueType.fields).forEach(([fieldKey, fieldConfig]) => {
            // Only include required fields that we don't already handle
            if (fieldConfig.required && !fieldsToIgnore.includes(fieldKey)) {
                const isSupported = isSupportedField(fieldConfig)

                fields.push({
                    key: fieldKey,
                    name: fieldConfig.name,
                    schema: fieldConfig.schema,
                    allowedValues: fieldConfig.allowedValues,
                    required: fieldConfig.required,
                    isSupported: isSupported
                })

                // Initialize form data for supported fields only
                if (isSupported) {
                    if (fieldConfig.allowedValues && fieldConfig.allowedValues.length > 0) {
                        setFormData(prev => ({
                            ...prev,
                            [fieldKey]: fieldConfig.allowedValues[0].id
                        }))
                    } else if (fieldConfig.schema?.type === 'array') {
                        // Initialize array fields (like labels) as empty array
                        setFormData(prev => ({
                            ...prev,
                            [fieldKey]: []
                        }))
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            [fieldKey]: ''
                        }))
                    }
                }
            }
        })

        setAdditionalFields(fields)
    }, [selectedIssueType])
    

    function handleInputChange(e) {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    async function handleSubmit(e) {
        e.preventDefault()

        // Check if there are any unsupported required fields
        const hasUnsupportedFields = additionalFields.some(field => field.required && !field.isSupported)
        if (hasUnsupportedFields) {
            showErrorMsg('You have unsupported fields, open this ticket from Jira')
            return
        }

        if (!formData.summary.trim()) {
            showErrorMsg('Summary is required')
            return
        }

        if (!formData.description.trim()) {
            showErrorMsg('Description is required')
            return
        }

        // Validate additional required fields (only supported ones)
        for (const field of additionalFields) {
            if (field.required && field.isSupported) {
                const value = formData[field.key]
                if (field.schema?.type === 'array') {
                    if (!Array.isArray(value) || value.length === 0) {
                        showErrorMsg(`${field.name} is required`)
                        return
                    }
                } else if (!value || (typeof value === 'string' && !value.trim())) {
                    showErrorMsg(`${field.name} is required`)
                    return
                }
            }
        }

        try {
            setIsSubmitting(true)
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

            if (formData.priority) {
                issueData.priority = {
                    id: formData.priority
                }
            }

            // Add additional required fields
            additionalFields.forEach(field => {
                if (!field.isSupported) return

                const fieldValue = formData[field.key]

                // Skip if field is empty (unless it's an array which can be empty)
                if (!fieldValue && field.schema?.type !== 'array') return

                if (field.allowedValues && field.allowedValues.length > 0) {
                    issueData[field.key] = { id: fieldValue }
                } else if (field.schema?.type === 'array') {
                    issueData[field.key] = Array.isArray(fieldValue) ? fieldValue : []
                } else if (field.schema?.type === 'number') {
                    // If it's a number field, ensure it's a number
                    issueData[field.key] = Number(fieldValue)
                } else {
                    // Otherwise, use the value directly (string, date, etc.)
                    issueData[field.key] = fieldValue
                }
            })

            //Add for labels the app label
            if (issueData.labels && Array.isArray(issueData.labels)) {
                issueData.labels = [...issueData.labels, 'created-from-identityhub']
            } else {
                issueData.labels = ['created-from-identityhub']
            }
            const createdIssue = await jiraService.createIssue(issueData)

            showSuccessMsg(`Ticket ${createdIssue.key} created successfully! Redirecting...`)

            // Reset form
            const priorities = selectedIssueType?.fields?.priority?.allowedValues || []
            setFormData({
                summary: '',
                description: '',
                priority: priorities?.[0]?.id || ''
            })

            // Redirect to Recent Tickets page
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

            {/* Render additional required fields dynamically */}
            {additionalFields.map(field => {
                // Render unsupported field error
                if (!field.isSupported) {
                    return (
                        <div key={field.key} className="form-group">
                            <label htmlFor={field.key}>
                                {field.name}
                                {field.required && <span className="required">*</span>}
                            </label>
                            <div className="error-message" style={{
                                color: '#d32f2f',
                                padding: '10px',
                                backgroundColor: '#ffebee',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}>
                                This required field is not supported in IdentityHub
                            </div>
                        </div>
                    )
                }

                const schema = field.schema
                const schemaType = schema?.type?.toLowerCase()
                const schemaItems = schema?.items?.toLowerCase()

                // Render based on field type
                return (
                    <div key={field.key} className="form-group">
                        <label htmlFor={field.key}>
                            {field.name}
                            {field.required && <span className="required">*</span>}
                        </label>

                        {/* Select field with allowed values */}
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
                        ) : schemaType === 'array' && schemaItems === 'string' ? (
                            /* Array field for labels/chips */
                            <input
                                type="text"
                                id={field.key}
                                name={field.key}
                                value={Array.isArray(formData[field.key]) ? formData[field.key].join(', ') : formData[field.key] || ''}
                                onChange={(e) => {
                                    const value = e.target.value
                                    const arrayValue = value ? value.split(',').map(v => v.trim()).filter(v => v) : []
                                    setFormData(prev => ({
                                        ...prev,
                                        [field.key]: arrayValue
                                    }))
                                }}
                                placeholder="Enter comma-separated values"
                                required={field.required}
                            />
                        ) : schemaType === 'date' || schemaType === 'datetime' ? (
                            /* Date field */
                            <input
                                type="date"
                                id={field.key}
                                name={field.key}
                                value={formData[field.key] || ''}
                                onChange={handleInputChange}
                                required={field.required}
                            />
                        ) : schemaType === 'number' ? (
                            /* Number field */
                            <input
                                type="number"
                                id={field.key}
                                name={field.key}
                                value={formData[field.key] || ''}
                                onChange={handleInputChange}
                                required={field.required}
                            />
                        ) : schema?.system === 'text' ? (
                            /* Textarea for text fields */
                            <textarea
                                id={field.key}
                                name={field.key}
                                value={formData[field.key] || ''}
                                onChange={handleInputChange}
                                required={field.required}
                                rows="4"
                            />
                        ) : (
                            /* Default string input */
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
                )
            })}

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
