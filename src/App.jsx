import { Route, Routes } from 'react-router-dom'

import { AppHeader } from './cmps/AppHeader'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { UserMsg } from './cmps/UserMsg'
import { JiraConnectionPage } from './pages/JiraConnectionPage'
import { JiraOAuthSuccess, JiraOAuthError } from './pages/JiraOAuthCallback'

function App() {
  return (
    <>
    <AppHeader/>
    <UserMsg />
    <main>
      <Routes>
        <Route path ="/" element ={<LoginPage/>}/>
        <Route path ="/signup" element ={<SignupPage/>}/>
        <Route path ="/jira" element ={<JiraConnectionPage/>}/>
        <Route path ="/jira/success" element ={<JiraOAuthSuccess/>}/>
        <Route path ="/jira/error" element ={<JiraOAuthError/>}/>
      </Routes>      
    </main>

    </>

  )
}

export default App
