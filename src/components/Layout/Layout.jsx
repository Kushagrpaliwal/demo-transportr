import Footer from "../Common/Footer";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return(
    <>
     <div className="min-h-screen bg-white">
      
      <main className="w-full">
        <Outlet />
      </main>
        <Footer />
    </div>
    
    </>
  )}

  export default Layout;
