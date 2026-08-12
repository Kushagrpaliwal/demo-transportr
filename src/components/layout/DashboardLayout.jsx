import Cookies from "js-cookie";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logoutService } from "../../api/services/AuthService/auth";
import {
  DashboardIcon,
  FinanceIcon,
  FindShipmentIcon,
  LogoutIcon,
  MessageIcon,
  MyTravelIcon,
  NotificationIcon,
  ProfileIcon,
  RouteAnalysisIcon,
  RouteSuggestionsIcon,
  SearchIcon,
  SendPackageIcon,
  SendRequestIcon,
  SettingIcon,
  ShipmentHistoryIcon,
  SubscriptionIcon,
} from "../../assets/icons";
import { usePopup } from "../../context/PopupContext";
import { useProfile } from "../../context/ProfileContext";
import { getProFeaturesService } from "../../api/services/proFeaturesService/proFeatures";
import { PlanStatusService } from "../../api/services/SubscriptionsService/plans";
import Footer from "../Common/Footer";
import { socket } from "../../api/services/SocketIoService/socket";
import { shipmentsActiveService } from "../../api/services/DashboardService/ActiveShipments";
import { PackagesInTransitService } from "../../api/services/TrackPackageService/TrackPackage";
import { notificationsService } from "../../api/services/NotificationsService/Notifications";
import { subscribeForegroundNotifications } from "../../utils/fcm";

const MenuIcon = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const CloseIcon = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const DashboardLayout = () => {
  const location = useLocation();
  const [canTrack, setCanTrack] = useState(false);
  const [packageIds, setPackageIds] = useState([]);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const sidebarRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const mobileProfileDropdownRef = useRef(null);
  const locationRef = useRef();

  const { showPopup } = usePopup();
  const result = useProfile() || {};
  const profile = result?.profile || {};
  const data = profile?.data || {};
  const myId = data?.id;
  // console.log("myId in dashboard layout", myId);
  const navigate = useNavigate();

  const [proFeaturesData, setProFeaturesData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    const fetchProFeaturesAndSubscription = async () => {
      try {
        const res = await getProFeaturesService();
        const pfData = res?.data?.data || res?.data || res;
        setProFeaturesData(pfData);

        if (pfData?.hide === 1 || pfData?.hide === true) {
          const subRes = await PlanStatusService();
          const subData = subRes?.data?.data || subRes?.data || subRes;
          setSubscriptionStatus(subData);
        }
      } catch (error) {
        console.error(
          "Failed to fetch pro features or subscription status:",
          error,
        );
      }
    };
    fetchProFeaturesAndSubscription();
  }, []);

  const getNotificationMessage = (payload = {}) => {
    const title =
      payload?.notification?.title || payload?.title || "New notification";
    const body =
      payload?.notification?.body ||
      payload?.body ||
      payload?.message ||
      "You have a new notification.";
    return { title, body };
  };

  const hasUnreadNotifications = (items = []) =>
    items.some((item) => item?.read_at == null);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const res = await notificationsService();
      const list = res?.data?.data || [];
      setHasNewNotification(hasUnreadNotifications(list));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }

      const isInsideDesktop =
        profileDropdownRef.current &&
        profileDropdownRef.current.contains(event.target);
      const isInsideMobile =
        mobileProfileDropdownRef.current &&
        mobileProfileDropdownRef.current.contains(event.target);

      if (!isInsideDesktop && !isInsideMobile && isProfileDropdownOpen) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleRouteChange = () => {
      setIsSidebarOpen(false);
      setIsProfileDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [isSidebarOpen, isProfileDropdownOpen]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  useEffect(() => {
    if (location.pathname === "/dashboard/notifications") {
      setHasNewNotification(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleNotificationsUpdated = (event) => {
      const notifications = event?.detail?.notifications || [];
      setHasNewNotification(hasUnreadNotifications(notifications));
    };

    window.addEventListener(
      "notifications-updated",
      handleNotificationsUpdated,
    );
    return () =>
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated,
      );
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSignOut = async () => {
    let res = await logoutService();
    if (res.status == 200) {
      Cookies.remove("token");
      navigate("/login");
      showPopup("Logged Out!", "success", 2000);
    } else {
      // Cookies.remove("token");
      // navigate("/login");
      showPopup("Something went wrong in logout api", "error", 2000);
    }
  };

  const requestLocationPermission = useCallback(async () => {
    if (!navigator?.geolocation) {
      showPopup("Geolocation is not supported by this browser.", "error", 2500);
      return false;
    }

    try {
      if (navigator?.permissions?.query) {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });

        if (permissionStatus.state === "granted") {
          return true;
        }

        if (permissionStatus.state === "denied") {
          showPopup(
            "Location permission is blocked. Please allow it in browser settings.",
            "error",
            3000,
          );
          return false;
        }
      }

      // Triggers the browser location permission prompt when state is "prompt".
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      });

      return true;
    } catch (error) {
      console.error("Location permission request failed:", error);
      showPopup(
        "Please allow location permission to enable live tracking.",
        "error",
        3000,
      );
      return false;
    }
  }, [showPopup]);

  const isLocationPermissionGranted = useCallback(async () => {
    if (!navigator?.geolocation) return false;

    try {
      if (navigator?.permissions?.query) {
        const permissionStatus = await navigator.permissions.query({
          name: "geolocation",
        });
        return permissionStatus.state === "granted";
      }
    } catch (error) {
      console.error("Unable to read location permission state:", error);
    }

    return false;
  }, []);

  const startLiveTracking = useCallback((ids) => {
    if (!ids?.length) return;

    if (socket.connected) {
      socket.emit("join_packages", { packageIds: ids });
      // console.log(`Requested to join rooms for ${ids.length} packages`);
    }

    setCanTrack(true);
    setNeedsLocationPermission(false);
  }, []);

  const handleEnableLiveTracking = useCallback(async () => {
    if (!packageIds?.length) {
      setNeedsLocationPermission(false);
      return;
    }

    setIsRequestingLocation(true);
    const hasLocationPermission = await requestLocationPermission();
    setIsRequestingLocation(false);

    if (!hasLocationPermission) {
      setCanTrack(false);
      return;
    }

    startLiveTracking(packageIds);
  }, [packageIds, requestLocationPermission, startLiveTracking]);

  useEffect(() => {
    if (!canTrack) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        locationRef.current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
      },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [canTrack]);

  useEffect(() => {
    if (!canTrack) return;

    const interval = setInterval(() => {
      if (!locationRef.current) return;

      if (document.visibilityState !== "visible") return; // Battery Drain

      const { lat, lng } = locationRef.current;

      socket.emit("traveler_location", {
        packageIds,
        lat,
        lng,
      });
      // // console.log("Sent location", packageIds, lat, lng);
      // console.log("Sent location");
    }, 5000);

    return () => clearInterval(interval);
  }, [packageIds, canTrack]);

  useEffect(() => {
    if (!myId) return;

    socket.connect();

    const handleConnect = async () => {
      // console.log("Connected:", socket.id);

      // Authenticate the socket connection
      socket.emit("login", {
        userId: myId,
      });

      try {
        const res = await shipmentsActiveService();
        const activeShipments = res?.data?.data || [];

        // If active shipments exist, proceed to fetch the specific package IDs in transit
        if (activeShipments.length > 0) {
          const transitResponse = await PackagesInTransitService();
          const raw = transitResponse?.data?.data || [];
          const ids = raw
            .map((item) =>
              item != null && typeof item === "object"
                ? (item.package_id ?? item.id ?? item.packageId)
                : item,
            )
            .filter((v) => v != null && v !== "");
          // console.log("ids in dashboard layout", ids);

          if (ids.length > 0) {
            setPackageIds(ids);
            const hasLocationPermission = await isLocationPermissionGranted();

            if (hasLocationPermission) {
              startLiveTracking(ids);
            } else {
              setCanTrack(false);
              setNeedsLocationPermission(true);
              showPopup(
                "Click 'Enable live tracking' to share your location.",
                "info",
                2500,
              );
            }
          } else {
            setCanTrack(false);
            setPackageIds([]);
            setNeedsLocationPermission(false);
          }
        }
      } catch (err) {
        console.error("Error joining package rooms on connect:", err);
      }
    };

    socket.on("connect", handleConnect);
    // Socket may already be connected (autoConnect) before this listener is
    // registered; otherwise handleConnect never runs and live tracking breaks.
    if (socket.connected) {
      void handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [myId, isLocationPermissionGranted, showPopup, startLiveTracking]);

  useEffect(() => {
    const handleIncomingNotification = (payload) => {
      const { title, body } = getNotificationMessage(payload || {});
      setHasNewNotification(true);
      showPopup({ title, message: body }, "info", 60000);
    };

    let unsubscribeForeground = () => {};
    subscribeForegroundNotifications((payload) => {
      handleIncomingNotification(payload);
    })
      .then((unsubscribe) => {
        unsubscribeForeground = unsubscribe;
      })
      .catch((error) => {
        console.error("Failed to subscribe foreground notifications:", error);
      });

    return () => {
      unsubscribeForeground?.();
    };
  }, [showPopup]);

  const getSidebarMenu = () => {
    const menu = [
      {
        section: "Overview",
        items: [
          { label: "Dashboard", path: "/dashboard", icon: DashboardIcon },
        ],
      },
      {
        section: "Account",
        items: [
          { label: "Profile", path: "/dashboard/profile", icon: ProfileIcon },
          {
            label: "Subscriptions",
            path: "/dashboard/subscriptions",
            icon: SubscriptionIcon,
          },
        ],
      },
      {
        section: "Packages",
        items: [
          {
            label: "Search Travellers",
            path: "/dashboard/search-travellers",
            icon: SearchIcon,
          },
          {
            label: "Send Package",
            path: "/dashboard/send-package",
            icon: SendPackageIcon,
          },
          {
            label: "My Send Requests",
            path: "/dashboard/send-requests",
            icon: SendRequestIcon,
          },
        ],
      },
      {
        section: "Travels",
        items: [
          {
            label: "My Travels",
            path: "/dashboard/my-travels",
            icon: MyTravelIcon,
          },
          {
            label: "Find Shipments",
            path: "/dashboard/find-shipments",
            icon: FindShipmentIcon,
          },
          {
            label: "Booking Request",
            path: "/dashboard/booking-request",
            icon: ShipmentHistoryIcon,
          },
          {
            label: "Shipment History",
            path: "/dashboard/shipment-history",
            icon: ShipmentHistoryIcon,
          },
        ],
      },
      {
        section: "Disputes",
        items: [
          {
            label: "Resolution Center",
            path: "/dashboard/resolution-center",
            icon: ShipmentHistoryIcon,
          },
        ],
      },
      {
        section: "Communication",
        items: [
          { label: "Messages", path: "/dashboard/messages", icon: MessageIcon },
          {
            label: "Notifications",
            path: "/dashboard/notifications",
            icon: NotificationIcon,
          },
        ],
      },
      {
        section: "Finance",
        items: [
          { label: "Payments", path: "/dashboard/payments", icon: FinanceIcon },
        ],
      },
    ];

    const isHideActive =
      proFeaturesData?.hide === 1 || proFeaturesData?.hide === true;
    let shouldHidePro = isHideActive;

    if (
      isHideActive &&
      subscriptionStatus?.created_at &&
      proFeaturesData?.updated_at
    ) {
      const createdAtDate = new Date(subscriptionStatus.created_at);
      const updatedAtDate = new Date(proFeaturesData.updated_at);
      if (createdAtDate < updatedAtDate) {
        shouldHidePro = false;
      }
    }

    if (!shouldHidePro) {
      menu.push({
        section: "AI Tools",
        items: [
          {
            label: "Route Analysis",
            path: "/dashboard/route-analysis",
            icon: RouteAnalysisIcon,
            badge: "Pro",
          },
          {
            label: "Route Suggestions",
            path: "/dashboard/route-suggestions",
            icon: RouteSuggestionsIcon,
            badge: "Pro",
          },
        ],
      });
    }

    menu.push({
      section: "Account Actions",
      items: [
        { label: "Settings", path: "/dashboard/settings", icon: SettingIcon },
        { label: "Logout", path: "", icon: LogoutIcon },
      ],
    });

    return menu;
  };

  const sidebarMenu = getSidebarMenu();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex flex-1 mb-10">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-transparent z-40 lg:hidden" />
        )}

        <div
          ref={sidebarRef}
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-[280px] bg-[#4681F4] text-white p-6 flex flex-col space-y-6
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            h-screen lg:h-auto overflow-y-auto
          `}
        >
          <div className="flex items-center justify-between lg:justify-start">
            <Link to={"/"} onClick={closeSidebar}>
              <img
                src="/white-transportr.png"
                alt="Logo"
                className="w-full cursor-pointer"
              />
            </Link>

            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-blue-600 transition-colors"
              aria-label="Close menu"
            >
              <CloseIcon className="w-6 h-6 text-white" />
            </button>
          </div>

          {sidebarMenu.map((section, index) => (
            <div key={index}>
              <p className="text-base font-bold mb-2">{section.section}</p>
              <ul className="space-y-2">
                {section.items?.map((item, idx) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={idx} className="ml-[-15px]">
                      <Link
                        to={item.path}
                        onClick={async () => {
                          if (item?.label === "Logout") {
                            await handleSignOut();
                          }
                          closeSidebar();
                        }}
                        className={`flex items-center justify-between px-4 py-2 rounded-full transition-all group ${
                          isActive
                            ? "bg-white text-[black]"
                            : "hover:bg-[white] hover:text-black"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 flex justify-center items-center group-hover:text-black transition-all  ${
                              isActive ? "text-[black]" : "text-white"
                            }`}
                            dangerouslySetInnerHTML={{ __html: item.icon }}
                          />
                          <span className="text-sm font-normal">
                            {item.label}
                          </span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] border-[0.4px] border-[#6B21A8] bg-[#F3E8FF] text-[#6B21A8] px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col py-7.5 px-4 lg:px-10 w-full">
          {needsLocationPermission && (
            <div className="w-full mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-blue-900">
                Location access is needed for live tracking.
              </p>
              <button
                type="button"
                onClick={handleEnableLiveTracking}
                disabled={isRequestingLocation}
                className="inline-flex items-center justify-center rounded-md bg-[#4681F4] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isRequestingLocation
                  ? "Requesting..."
                  : "Enable live tracking"}
              </button>
            </div>
          )}

          <div className="hidden lg:flex w-full justify-end items-center gap-4 bg-white mb-6">
            <Link to="/dashboard/notifications">
              <div className="relative">
                <div
                  className="w-8 h-8 text-[#4681F4] flex justify-center items-center cursor-pointer transition-all hover:text-blue-700"
                  dangerouslySetInnerHTML={{ __html: NotificationIcon }}
                />
                {hasNewNotification && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border border-white" />
                )}
              </div>
            </Link>

            <div ref={profileDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                className="h-[50px] flex items-center rounded-full bg-[#4681F4] p-2 gap-2.5 cursor-pointer hover:bg-blue-600 transition-colors"
                aria-label="Toggle profile menu"
                aria-expanded={isProfileDropdownOpen}
              >
                {profile?.data?.profile_pic ? (
                  <img
                    src={profile.data.profile_pic}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <p className="text-[#4681F4] text-base">
                      {data?.username?.charAt(0).toUpperCase()}
                    </p>
                  </div>
                )}

                <p className="text-white text-base">{data?.username}</p>
                <img
                  src="/white-dropdown.svg"
                  alt="Dropdown"
                  className="w-[13px] h-[9px]"
                />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsProfileDropdownOpen(false);
                      navigate("/dashboard/profile");
                    }}
                    className="w-full cursor-pointer text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsProfileDropdownOpen(false);
                      await handleSignOut();
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden flex items-center justify-between mb-6">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <MenuIcon className="w-6 h-6 text-[#4681F4] hover:text-blue-700" />
            </button>

            <div className="flex items-center gap-4">
              <Link to="/dashboard/notifications" className="relative">
                <div
                  className="w-8 h-8 text-[#4681F4] flex justify-center items-center cursor-pointer transition-all hover:text-blue-700"
                  dangerouslySetInnerHTML={{ __html: NotificationIcon }}
                />
                {hasNewNotification && (
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border border-white" />
                )}
              </Link>
              <div ref={mobileProfileDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center rounded-full bg-[#4681F4] p-2 gap-2.5 cursor-pointer hover:bg-blue-600 transition-colors"
                  aria-label="Toggle profile menu"
                  aria-expanded={isProfileDropdownOpen}
                >
                  {profile?.data?.profile_pic ? (
                    <img
                      src={profile?.data?.profile_pic}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                      <p className="text-[#4681F4] text-xs font-bold">
                        {data?.username?.charAt(0).toUpperCase()}
                      </p>
                    </div>
                  )}
                  <img
                    src="/white-dropdown.svg"
                    alt="Dropdown"
                    className="w-[13px] h-[9px]"
                  />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        navigate("/dashboard/profile");
                      }}
                      className="w-full cursor-pointer text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-gray-50 transition-colors"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsProfileDropdownOpen(false);
                        await handleSignOut();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <main className="">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardLayout;
