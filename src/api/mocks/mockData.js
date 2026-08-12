export const mockUser = {
  _id: "mock_user_123",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane.doe@example.com",
  phoneNumber: "+1234567890",
  isVerified: true,
  profileImage: "https://i.pravatar.cc/300",
  createdAt: new Date().toISOString(),
};

export const mockShipments = [
  {
    _id: "ship_1",
    sender: "mock_user_123",
    recipientName: "John Smith",
    pickupAddress: { address: "123 Main St, New York, NY" },
    deliveryAddress: { address: "456 Market St, San Francisco, CA" },
    status: "pending",
    packageDetails: { weight: "5kg", dimensions: "10x10x10" },
    price: 50,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "ship_2",
    sender: "mock_user_123",
    recipientName: "Alice Wonderland",
    pickupAddress: { address: "789 Broadway, New York, NY" },
    deliveryAddress: { address: "101 1st Ave, Seattle, WA" },
    status: "in_transit",
    packageDetails: { weight: "2kg", dimensions: "5x5x5" },
    price: 30,
    createdAt: new Date().toISOString(),
  }
];

export const mockNotifications = [
  {
    _id: "notif_1",
    message: "Your shipment has been picked up.",
    read: false,
    createdAt: new Date().toISOString()
  }
];
