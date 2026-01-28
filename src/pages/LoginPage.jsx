import {  useState } from "react"
import { Link } from "react-router-dom"
import { login } from "../store/user/user.actions"
import { useNavigate } from "react-router-dom"



export function LoginPage(){
    const [credentials, setCredentials] = useState({email: '' ,password: ''})
    const navigate = useNavigate()


    async function onLogin(ev = null) {
        if (ev) ev.preventDefault()
        if (!credentials.email || !credentials.password) return

        try {
            await login(credentials)
            navigate("/jira")
        } catch (err) {
            console.error('Login failed:', err)
        }
    }

    function handleChange(ev) {
        const field = ev.target.name
        const value = ev.target.value
        setCredentials({ ...credentials, [field]: value })
    }



    return(
        <section>
            <form className="login-form" onSubmit={onLogin}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    placeholder="Enter email"
                    id="email"
                    name="email"
                    onChange={handleChange}
                    value={credentials.email}
                    required
                 />
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    placeholder="Password"
                    id="password"
                    name="password"
                    onChange={handleChange}
                    value={credentials.password}
                    required
                />
                <button>Login</button>
                <div>
                    Don't have an account? <Link to="/signup">Signup</Link>
                </div>
            </form>

    </section>
    )
}