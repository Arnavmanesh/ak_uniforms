import React from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { StudentDetailsPage } from './pages/StudentDetailsPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrderReviewPage } from './pages/OrderReviewPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminPage } from './pages/AdminPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { FeedbackPage } from './pages/FeedbackPage';
import type { Page, CustomerDetails } from './types';

const ADMIN_PASSWORD = 'ak@uniforms@61';

function App() {
  const [currentPage, setCurrentPage] = React.useState<Page>('home');
  const [customerDetails, setCustomerDetails] = React.useState<CustomerDetails | null>(null);
  const [cartItems, setCartItems] = React.useState<{ productId: string; quantity: number }[]>([]);
  const [confirmedOrderId, setConfirmedOrderId] = React.useState<string>('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = React.useState(false);
  const [adminLoginError, setAdminLoginError] = React.useState<string | null>(null);


  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'admin') {
      setIsAdminLoggedIn(false);
      setAdminLoginError(null);
    }
    window.scrollTo(0, 0);
  };

  const handleCustomerDetailsNext = (details: CustomerDetails) => {
    setCustomerDetails(details);
    handleNavigate('products');
  };

  const handleOrderConfirm = (orderId: string) => {
    setConfirmedOrderId(orderId);
    setCartItems([]);
    setCustomerDetails(null);
    handleNavigate('order-confirmation');
  };

  const handleAdminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setAdminLoginError(null);
      return true;
    } else {
      setAdminLoginError('Incorrect password. Please try again.');
      return false;
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminLoginError(null);
    handleNavigate('home');
  };

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'student-details':
        return (
          <StudentDetailsPage
            customerDetails={customerDetails}
            onNext={handleCustomerDetailsNext}
            onNavigate={handleNavigate}
          />
        );
      case 'products':
        return (
          <ProductsPage
            cartItems={cartItems}
            onUpdateCart={setCartItems}
            onNavigate={handleNavigate}
          />
        );
      case 'order-review':
        return (
          <OrderReviewPage
            customerDetails={customerDetails}
            cartItems={cartItems}
            onNavigate={handleNavigate}
            onConfirm={handleOrderConfirm}
          />
        );
      case 'order-confirmation':
        return <OrderConfirmationPage orderId={confirmedOrderId} onNavigate={handleNavigate} />;
      case 'admin':
        if (isAdminLoggedIn) {
          return <AdminPage onLogout={handleAdminLogout} />;
        }
        return (
          <AdminLoginPage
            onLogin={handleAdminLogin}
            onNavigate={handleNavigate}
            error={adminLoginError}
          />
        );
      case 'track-order':
        return <TrackOrderPage onNavigate={handleNavigate} />;
      case 'feedback':
        return <FeedbackPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />
      <main className="flex-1 pt-16">{renderPage()}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
