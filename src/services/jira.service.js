import { httpService } from './http.service'

export const jiraService = {
    initiateOAuth,
    disconnect,
    getConnectionStatus,
    getProjects,
    getProjectMetadata,
    createIssue,
    getRecentIssues,
    getIdentityHubTickets
}


async function initiateOAuth() {
    return await httpService.get('jira/auth')
}


async function disconnect() {
    return await httpService.delete('jira/disconnect')
}


async function getConnectionStatus() {
    return await httpService.get('jira/status')
}


async function getProjects() {
    return await httpService.get('jira/projects')
}


async function getProjectMetadata(projectKey) {
    return await httpService.get(`jira/projects/${projectKey}/metadata`)
}


async function createIssue(issueData) {
    return await httpService.post('jira/issues', issueData)
}

async function getRecentIssues(projectKey, maxResults = 10) {
    return await httpService.get(`jira/projects/${projectKey}/issues`, { maxResults })
}

async function getIdentityHubTickets(maxResults = 10) {
    return await httpService.get('jira/identityhub-tickets', { maxResults })
}
