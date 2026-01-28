
import { logout } from '../store/user/user.actions';
import { useNavigate } from 'react-router'
import {showErrorMsg, showSuccessMsg} from '../services/event-bus.service'
import { useSelector } from 'react-redux';




export function AppHeader(){
    const navigate = useNavigate()
    const user = useSelector(storeState => storeState.userModule.user)
    
    async function onLogout(){
        try{
            await logout()
            navigate("/")
            showSuccessMsg(`Bye now`)
        } catch (err) {
            console.log('error logginout', err);
            showErrorMsg('Cannot logout')
        }

    }



    return(
        <header className="app-header">
            <h1>AI Crypto Advisor</h1>
            {user &&
                <button onClick={onLogout}>
                    Logout
                </button>     
            }
        </header>
    )
}