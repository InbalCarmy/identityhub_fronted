
import { userService } from "../../services/user.service"
export const SET_USER = 'SET_USER'
export const REMOVE_USER = 'REMOVE_USER'
export const SET_USERS = 'SET_USERS'
export const UPDATE_USER = 'UPDATE_USER'


const initialState ={
    user: userService.getLoggedinUser(),
    users: []
}


export function userReducer(state = initialState, action){
    var newState = state
    switch (action.type){
        case SET_USER:
            newState = {...state, user: action.user}
            break
        case REMOVE_USER:
            newState ={...state, users: state.users.filter(user => user._id !== action.userId)}
            break
        case SET_USERS:
            newState = {...state, users: action.users}
            break
        case UPDATE_USER:
            {
                const users = state.users.map(user => (user._id === action.savedUser._id) ? action.savedUser : user)
                // Also update the current user if it's the same user being updated
                const updatedCurrentUser = state.user && state.user._id === action.savedUser._id ? action.savedUser : state.user
                newState = { ...state, users, user: updatedCurrentUser }
                break
            }
    }
    return newState
}