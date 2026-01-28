import { legacy_createStore as createStore, combineReducers } from 'redux'

import { userReducer } from './user/user.reducer'


const rootReducer = combineReducers({
    userModule: userReducer
})


const middleware = (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__)? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__() : undefined
export const store = createStore(rootReducer, middleware)
