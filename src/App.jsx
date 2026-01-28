import { Route, Routes } from 'react-router-dom'
// import { HomePage } from './pages/HomePage'

import { AppHeader } from './cmps/AppHeader'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { UserMsg } from './cmps/UserMsg'

function App() {
  return (
    <>
    <AppHeader/>
    <UserMsg />
    <main>
      <Routes>
        {/* <Route path ="/" element ={<HomePage/>}/> */}
        <Route path ="/" element ={<LoginPage/>}/>
        <Route path ="/signup" element ={<SignupPage/>}/>
        {/* <Route path ="/dashboard" element ={<Dashboard/>}/>
        <Route path ="/onboarding" element ={<OnboardingPage/>}/> */}
      </Routes>      
    </main>

    </>

  )
}

export default App
