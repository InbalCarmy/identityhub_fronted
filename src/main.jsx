import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './assets/style/main.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import { store } from './store/store'



createRoot(document.getElementById('root')).render(
  	<Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
   </Provider>



)
