import { useState, useEffect } from 'react'
import { showErrorMsg, showSuccessMsg } from '../services/event-bus.service'
import { httpService } from '../services/http.service'
import '../assets/style/pages/ApiKeysPage.css'

export function ApiKeysPage() {
    const [apiKeys, setApiKeys] = useState([])
    const [newKeyName, setNewKeyName] = useState('')
    const [generatedKey, setGeneratedKey] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)

    useEffect(() => {
        loadApiKeys()
    }, [])

    async function loadApiKeys() {
        try {
            setIsLoading(true)
            const data = await httpService.get('apikeys')
            setApiKeys(data.apiKeys || [])
        } catch (err) {
            console.error('Failed to load API keys:', err)
            showErrorMsg('Failed to load API keys')
        } finally {
            setIsLoading(false)
        }
    }

    async function generateApiKey(e) {
        e.preventDefault()

        if (!newKeyName.trim()) {
            showErrorMsg('Please enter a name for the API key')
            return
        }

        try {
            setIsGenerating(true)
            const data = await httpService.post('apikeys', { name: newKeyName.trim() })
            setGeneratedKey(data)
            setNewKeyName('')
            showSuccessMsg('API key generated successfully')
            loadApiKeys()
        } catch (err) {
            console.error('Failed to generate API key:', err)
            showErrorMsg(err.message || 'Failed to generate API key')
        } finally {
            setIsGenerating(false)
        }
    }

    async function deleteApiKey(keyId, keyName) {
        if (!confirm(`Are you sure you want to delete the API key "${keyName}"?\n\nThis action cannot be undone and any applications using this key will stop working.`)) {
            return
        }

        try {
            await httpService.delete(`apikeys/${keyId}`)
            showSuccessMsg('API key deleted successfully')
            loadApiKeys()
        } catch (err) {
            console.error('Failed to delete API key:', err)
            showErrorMsg(err.message || 'Failed to delete API key')
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => showSuccessMsg('API key copied to clipboard'))
            .catch(() => showErrorMsg('Failed to copy to clipboard'))
    }

    function formatDate(dateString) {
        if (!dateString) return 'Never'
        return new Date(dateString).toLocaleString()
    }

    if (isLoading) {
        return (
            <section className="api-keys-page">
                <h2>API Keys Management</h2>
                <div className="loading">Loading API keys...</div>
            </section>
        )
    }

    return (
        <section className="api-keys-page">
            <h2>API Keys Management</h2>

            <div className="page-intro">
                <p>
                    API keys allow external systems (scanners, CI/CD pipelines, automation tools)
                    to create NHI finding tickets programmatically.
                </p>
            </div>

            {/* Generated API Key Display (shown only once) */}
            {generatedKey && (
                <div className="api-key-modal-overlay" onClick={() => setGeneratedKey(null)}>
                    <div className="api-key-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>⚠️ Save This API Key Now!</h3>
                            <button className="close-btn" onClick={() => setGeneratedKey(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="warning-text">
                                This is the only time you'll be able to see this API key.
                                Please copy it and store it securely.
                            </p>
                            <div className="api-key-display">
                                <code>{generatedKey.apiKey}</code>
                                <button
                                    className="copy-btn"
                                    onClick={() => copyToClipboard(generatedKey.apiKey)}
                                >
                                    📋 Copy
                                </button>
                            </div>
                            <div className="key-info">
                                <p><strong>Name:</strong> {generatedKey.name}</p>
                                <p><strong>Created:</strong> {formatDate(generatedKey.createdAt)}</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-primary" onClick={() => setGeneratedKey(null)}>
                                I've Saved the Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate New API Key Form */}
            <div className="generate-key-section">
                <h3>Generate New API Key</h3>
                <form onSubmit={generateApiKey} className="generate-key-form">
                    <div className="form-group">
                        <label htmlFor="keyName">API Key Name</label>
                        <input
                            type="text"
                            id="keyName"
                            placeholder="e.g., CI/CD Pipeline, Security Scanner, Production Automation"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            disabled={isGenerating}
                            required
                        />
                        <small>Choose a descriptive name to identify where this key will be used</small>
                    </div>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Generate API Key'}
                    </button>
                </form>
            </div>

            {/* API Keys List */}
            <div className="api-keys-list">
                <h3>Your API Keys ({apiKeys.length})</h3>
                {apiKeys.length === 0 ? (
                    <div className="empty-state">
                        <p>No API keys found.</p>
                        <p>Generate your first API key above to get started with programmatic access.</p>
                    </div>
                ) : (
                    <div className="keys-table-container">
                        <table className="keys-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Created</th>
                                    <th>Last Used</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apiKeys.map(key => (
                                    <tr key={key.id}>
                                        <td className="key-name">{key.name}</td>
                                        <td>{formatDate(key.createdAt)}</td>
                                        <td>{formatDate(key.lastUsedAt)}</td>
                                        <td>
                                            <span className={`status-badge ${key.isActive ? 'active' : 'inactive'}`}>
                                                {key.isActive ? '✓ Active' : '✗ Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteApiKey(key.id, key.name)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* API Documentation Link */}
            <div className="api-documentation-section">
                <h3>📚 API Documentation</h3>
                <p>Learn how to use your API keys to create NHI findings programmatically.</p>
                <div className="doc-links">
                    <div className="doc-card">
                        <h4>Quick Start</h4>
                        <p>Basic examples to get started with the API</p>
                        <code className="code-example">
                            curl -X POST http://localhost:3030/api/nhi-findings \<br/>
                            &nbsp;&nbsp;-H "Authorization: Bearer ih_YOUR_KEY" \<br/>
                            &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                            &nbsp;&nbsp;-d '&#123;"projectKey":"PROJ","summary":"Finding"&#125;'
                        </code>
                    </div>
                    <div className="doc-card">
                        <h4>API Endpoints</h4>
                        <ul>
                            <li><code>POST /api/nhi-findings</code> - Create finding</li>
                            <li><code>GET /api/nhi-findings</code> - List findings</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
