
import { Link, useNavigate } from "react-router-dom"
import { signup } from "../store/user/user.actions"
import { useState } from "react"

export function SignupPage(){
    const [credentials, setCredentials] = useState({name: '', email:'', password: ''})
    const navigate = useNavigate()

    function handleChange(ev) {
        const field = ev.target.name
        const value = ev.target.value
        setCredentials({ ...credentials, [field]: value })
    }

    async function onSignup(ev = null) {
        if (ev) ev.preventDefault()
        if (!credentials.name || !credentials.password || !credentials.email) return
        
        try {
            await signup(credentials)
            navigate('/jira')
        } catch (err) {
            console.error('Signup failed:', err)
        }
    }



    return(
        <section className="signup-page">
            <form className="signup-form" onSubmit={onSignup}>
                <label htmlFor="name">Name:</label>
                <input 
                    type="text"
                    placeholder="Enter name"
                    id="name"
                    name="name"
                    onChange={handleChange}
                    value={credentials.name}
                    required/>
                        
                <label htmlFor="email">Email:</label>
                <input 
                    type="email"
                    placeholder="Enter email"
                    id="email"
                    name="email"
                    onChange={handleChange}
                    value={credentials.email}
                 />
                
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    placeholder="Password"
                    id="password"
                    name="password"
                    onChange={handleChange}
                    value={credentials.password}
                    required/>

                <button>Signup</button>
                <div>
                    Already have an account? <Link to="/">Login</Link> 
                </div>
            </form>



        </section>


        
        
    )
}