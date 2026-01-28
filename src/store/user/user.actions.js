import { userService } from "../../services/user.service";
import { SET_USERS, SET_USER, REMOVE_USER, UPDATE_USER } from "./user.reducer";
import { store } from '../store'
import { showErrorMsg, showSuccessMsg } from "../../services/event-bus.service";



export async function loadUsers(){
    try{
        const users = await userService.getUsers()
        store.dispatch({type: SET_USERS, users})
    } catch(err) {
        console.log('UserAction: err in loadUsers', err);
        
    }
}

export async function updateUser(user) {
    try {
        
        const savedUser = await userService.update(user)
        store.dispatch({type: UPDATE_USER, savedUser})
        return savedUser
    } catch (err) {
        console.log('Cannot save user', err)
        throw err
    }
}

export async function removeUser(userId){
    try{
        await userService.remove(userId)
        store.dispatch({type: REMOVE_USER, userId})
    } catch(err) {
        console.log('UserAction: err in removeUser', err);
        
    }
}

export async function login(credantials){
    try{

        const user = await userService.login(credantials)
        store.dispatch({type: SET_USER, user})
        showSuccessMsg('Login successfully!')
        return user
    } catch (err){
        showErrorMsg('Can not login')
        console.log('Cannot login', err);
        throw err
    }
}

export async function signup(credentials) {
    try {
        const user = await userService.signup(credentials)
        store.dispatch({
            type: SET_USER,
            user
        })
        showSuccessMsg('Signup seccessfully!')
        return user
    } catch (err) {
        showErrorMsg('Can not signup')
        console.log('Cannot signup', err)
        throw err
    }
}

export async function logout() {
    try {
        // Note: We DON'T clear cached data on logout
        // This allows the user to see their cached content if they log back in on the same day
        // The cache will automatically expire at midnight

        await userService.logout()
        store.dispatch({
            type: SET_USER,
            user: null
        })
        showSuccessMsg('Logout successfully!')
    } catch (err) {
        showErrorMsg('Can not logout')
        console.log('Cannot logout', err)
        throw err
    }
}