import ActiveShipment from "../components/Dashboard/ActiveShipment";
import CompleteVerficationBanner from "../components/Dashboard/CompleteVerficationBanner";
import DashboardWelcome from "../components/Dashboard/DashboardWelcome";
import ShipmentHistory from "../components/Dashboard/ShipmentHistory";
import UpcomingTravels from "../components/Dashboard/UpcomingTravels";

const Dashboard = () => {
  return (
    <>
      <CompleteVerficationBanner />
      <DashboardWelcome />
      <ActiveShipment />
      <UpcomingTravels />
      <ShipmentHistory />
    </>
  );
};

export default Dashboard;
