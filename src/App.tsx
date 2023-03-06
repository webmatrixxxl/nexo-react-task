import './App.scss';
import { BrowserRouter } from 'react-router-dom';
import Main from './Components/Main/Main';
import './assets/style/scss/tailwind.scss';

function App() {
  return (
    <div className="App">
      <BrowserRouter basename={'/'}>
        <Main />
      </BrowserRouter>
    </div>
  );
}

export default App;
