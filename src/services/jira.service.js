import { httpService } from './http.service'

export const jiraService = {
    initiateOAuth,
    disconnect,
    getConnectionStatus,
    getProjects,
    getProjectMetadata,
    createIssue,
    getRecentIssues
}

/**
 * Initiate OAuth flow - get authorization URL
 * @returns {Promise<{authUrl: string, state: string}>}
 */
async function initiateOAuth() {
    return await httpService.get('jira/auth')
}

/**
 * Disconnect Jira integration
 * @returns {Promise<{message: string}>}
 */
async function disconnect() {
    return await httpService.delete('jira/disconnect')
}

/**
 * Get connection status
 * @returns {Promise<{isConnected: boolean, connectedAt: Date|null}>}
 */
async function getConnectionStatus() {
    return await httpService.get('jira/status')
}

/**
 * Get user's Jira projects
 * @returns {Promise<Array>}
 */
async function getProjects() {
    return await httpService.get('jira/projects')
}

/**
 * Get project metadata (for form rendering)
 * @param {string} projectKey
 * @returns {Promise<object>}
 */
async function getProjectMetadata(projectKey) {
    return await httpService.get(`jira/projects/${projectKey}/metadata`)
}

/**
 * Create a new Jira issue
 * @param {object} issueData - Issue fields data
 * @returns {Promise<object>}
 */
async function createIssue(issueData) {
    return await httpService.post('jira/issues', issueData)
}

/**
 * Get recent issues from a project
 * @param {string} projectKey
 * @param {number} maxResults
 * @returns {Promise<Array>}
 */
async function getRecentIssues(projectKey, maxResults = 10) {
    return await httpService.get(`jira/projects/${projectKey}/issues`, { maxResults })
}
