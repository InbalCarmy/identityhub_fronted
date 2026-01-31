
import { logout } from '../store/user/user.actions';
import { Link, useNavigate } from 'react-router'
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
            <h1>IdentityHub</h1>
            {user && (
                <nav className="header-nav">
                    <Link to="/jira">Jira</Link>
                    <Link to="/jira/create-ticket">Create Ticket</Link>
                    <Link to="/jira/recent-tickets">Recent Tickets</Link>
                    <Link to="/api-keys">API Keys</Link>
                    <button onClick={onLogout}>
                        Logout
                    </button>
                </nav>
            )}
        </header>
    )
}