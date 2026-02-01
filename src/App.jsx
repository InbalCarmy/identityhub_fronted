import { Route, Routes } from 'react-router-dom'

import { AppHeader } from './cmps/AppHeader'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { UserMsg } from './cmps/UserMsg'
import { ProtectedRoute } from './cmps/ProtectedRoute'
import { JiraConnectionPage } from './pages/JiraConnectionPage'
import { JiraOAuthSuccess, JiraOAuthError } from './pages/JiraOAuthCallback'
import { CreateTickedPage } from './pages/CreateTicketPage'
import { RecentTickets } from './pages/RecentTickets'
import { ApiKeysPage } from './pages/ApiKeysPage'

function App() {
  return (
    <>
    <AppHeader/>
    <UserMsg />
    <main>
      <Routes>
        {/* Public routes */}
        <Route path ="/" element ={<LoginPage/>}/>
        <Route path ="/signup" element ={<SignupPage/>}/>

        {/* Protected routes */}
        <Route path ="/jira" element ={
          <ProtectedRoute>
            <JiraConnectionPage/>
          </ProtectedRoute>
        }/>
        <Route path ="/jira/success" element ={
          <ProtectedRoute>
            <JiraOAuthSuccess/>
          </ProtectedRoute>
        }/>
        <Route path ="/jira/error" element ={
          <ProtectedRoute>
            <JiraOAuthError/>
          </ProtectedRoute>
        }/>
        <Route path ="/jira/create-ticket" element ={
          <ProtectedRoute>
            <CreateTickedPage/>
          </ProtectedRoute>
        }/>
        <Route path ="/jira/recent-tickets" element ={
          <ProtectedRoute>
            <RecentTickets/>
          </ProtectedRoute>
        }/>
        <Route path ="/api-keys" element ={
          <ProtectedRoute>
            <ApiKeysPage/>
          </ProtectedRoute>
        }/>
      </Routes>
    </main>

    </>

  )
}

export default App
