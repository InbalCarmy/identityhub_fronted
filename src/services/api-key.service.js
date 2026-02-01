import { httpService } from "./http.service"

export const apiKeyService = {
    loadApiKeys,
    generateApiKey,
    deleteApiKey
}

async function loadApiKeys() {
    return await httpService.get('apikeys')
}

async function generateApiKey(name) {
    return await httpService.post('apikeys', { name })
}

async function deleteApiKey(keyId) {
    return await httpService.delete(`apikeys/${keyId}`)
}