import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { OpenRental } from './pages/OpenRental';
import { RentalList } from './pages/RentalList';
import { RentalDetail } from './pages/RentalDetail';
import { HowItWorks } from './pages/HowItWorks';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<OpenRental />} />
          <Route path="/rentals" element={<RentalList />} />
          <Route path="/rentals/:id" element={<RentalDetail />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
