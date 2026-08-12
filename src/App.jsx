import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Layout from "./components/Layout/Layout";
import { ProfileProvider } from "./context/ProfileContext";
import AIAnalyzerSuggester from "./DashboardPages/AIAnalyzerSuggester";
import AIRouteSuggestion from "./DashboardPages/AIRouteSuggestion";
import Dashboard from "./DashboardPages/Dashboard";
import FindShipments from "./DashboardPages/FindShipments";
import Messages from "./DashboardPages/Messages";
import MessageThread from "./DashboardPages/MessageThread";
import MySendRequestPage from "./DashboardPages/MySendRequestPage";
import MyTravel from "./DashboardPages/MyTravel";
import NewTravellerPage from "./DashboardPages/NewTravellerPage";
import Notification from "./DashboardPages/Notification";
import Payment from "./DashboardPages/Payment";
import ProfilePage from "./DashboardPages/ProfilePage";
import SearchTraveller from "./DashboardPages/SearchTraveller";
import SendPackage from "./DashboardPages/SendPackage";
import Setting from "./DashboardPages/Setting";
import SubscriptionPage from "./DashboardPages/SubscriptionPage";
import TrackPage from "./DashboardPages/TrackPage";
import TravelDetailPage from "./DashboardPages/TravelDetailPage";
import ShipmentHistoryPage from "./DashboardPages/ShipmentHistoryPage";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import CreateAccount from "./pages/CreateAccount";
import Homepage from "./pages/HomePage";
import Login from "./pages/Login";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AddressProof from "./pages/ProfileVerficationPages/AddressProof";
import IdentityScan from "./pages/ProfileVerficationPages/IdentityScan";
import PersonalDetails from "./pages/ProfileVerficationPages/PersonalDetails";
import SignUp from "./pages/SignUp";
import TermCondition from "./pages/TermCondition";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import BookingRequest from "./DashboardPages/BookingRequest";
import AddPaymentMethod from "./DashboardPages/AddPaymentMethod";
import Review from "./pages/ProfileVerficationPages/Review";
import TravellerProfilePage from "./DashboardPages/TravellerProfilePage";
import ResolutionCenter from "./components/Disputes/ResolutionCenter";
import ResolutionCenterDetails from "./components/Disputes/ResolutionCenterDetails";
import ShipmentDetails from "./DashboardPages/ShipmentDetails";
import ShipmentTravelDetail from "./DashboardPages/ShipmentTravelDetail";
import PackageDetailPage from "./DashboardPages/PackageDetailPage";
import CookieConsentBanner from "./components/common/CookieConsentBanner";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

function App() {
  const router = createBrowserRouter([
    {
      path: "/create-account",
      element: <CreateAccount />,
    },

    {
      path: "/login",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },
    {
      path: "/sign-up",
      element: (
        <PublicRoute>
          <SignUp />
        </PublicRoute>
      ),
    },
    {
      path: "/",
      element: (
        <>
          <ScrollToTop />
          <Layout />
        </>
      ),
      children: [
        { path: "/home", element: <Homepage /> },
        { path: "/", element: <Homepage /> },
        { path: "/about-us", element: <AboutUs /> },
        { path: "/contact-us", element: <ContactUs /> },
        { path: "/terms-condition", element: <TermCondition /> },
        { path: "/privacy-policy", element: <PrivacyPolicy /> },
      ],
    },
    {
      path: "/dashboard",
      element: (
        <>
          <ProtectedRoute>
            <ProfileProvider>
              <ScrollToTop />
              <DashboardLayout />
            </ProfileProvider>
          </ProtectedRoute>
        </>
      ),
      children: [
        { path: "", element: <Dashboard /> },
        { path: "profile", element: <ProfilePage /> },
        {
          path: "verification/personal-details",
          element: <PersonalDetails />,
        },
        { path: "verification/identity-scan", element: <IdentityScan /> },
        { path: "verification/address-proof", element: <AddressProof /> },
        { path: "verification/review", element: <Review /> },
        { path: "subscriptions", element: <SubscriptionPage /> },
        { path: "package-track/:id", element: <TrackPage /> },
        { path: "package-detail/:id", element: <PackageDetailPage /> },
        { path: "travel-detail", element: <TravelDetailPage /> },
        { path: "search-travellers", element: <SearchTraveller /> },
        { path: "user-profile", element: <TravellerProfilePage /> },
        { path: "send-package", element: <SendPackage /> },
        { path: "send-requests", element: <MySendRequestPage /> },
        { path: "my-travels", element: <MyTravel /> },
        { path: "booking-request", element: <BookingRequest /> },
        { path: "new-travels", element: <NewTravellerPage /> },
        { path: "find-shipments", element: <FindShipments /> },
        { path: "resolution-center", element: <ResolutionCenter /> },
        { path: "dispute-detail", element: <ResolutionCenterDetails /> },
        { path: "messages", element: <Messages /> },
        { path: "messages/:id", element: <MessageThread /> },
        { path: "notifications", element: <Notification /> },
        { path: "payments", element: <Payment /> },
        { path: "payment-methods", element: <AddPaymentMethod /> },
        { path: "route-analysis", element: <AIAnalyzerSuggester /> },
        { path: "route-suggestions", element: <AIRouteSuggestion /> },
        { path: "settings", element: <Setting /> },
        { path: "shipment-history", element: <ShipmentHistoryPage /> },
        { path: "shipment-details", element: <ShipmentDetails /> },
        { path: "shipment-travel-detail", element: <ShipmentTravelDetail /> },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <CookieConsentBanner />
    </>
  );
}

export default App;
