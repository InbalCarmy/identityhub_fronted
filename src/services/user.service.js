import { httpService } from './http.service'

const STORAGE_KEY_LOGGEDIN_USER = 'loggedinUser'


export const userService = {
    login,
    logout,
    signup,
    getLoggedinUser,    
    getUsers,
    getById,
    remove,
    getEmptyUser,
    update
}


function getUsers() {
	return httpService.get(`user`)
}

async function getById(userId) {
	const user = await httpService.get(`user/${userId}`)
	return user
}

function remove(userId) {
	return httpService.delete(`user/${userId}`)
}


async function login(userCred) {
	const user = await httpService.post('auth/login', userCred)
	if (user) return _saveLocalUser(user)
}

async function update(user) {        
	const updatedUser = await httpService.put(`user/${user._id}`, user)
    const loggedinUser = getLoggedinUser()
    if (loggedinUser._id === updatedUser._id) _saveLocalUser(updatedUser)
	return updatedUser
}

async function signup(userCred) {
    
    const user = await httpService.post('auth/signup', userCred)
	return _saveLocalUser(user)
}

async function logout() {
	sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
	return await httpService.post('auth/logout')
}

function getLoggedinUser() {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER))
}

function getEmptyUser() {
    return {
        name: '', 
        password: '', 
        email: '',
    }
}

function _saveLocalUser(user) {
    const userToSave = { 
        _id: user._id, 
        name: user.name,
        email: user.email,
        isOnboarded: user.isOnboarded,
        preferences: user.preferences
    }
    sessionStorage.setItem(STORAGE_KEY_LOGGEDIN_USER, JSON.stringify(userToSave))
    return userToSave
}