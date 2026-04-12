export const clients = [
  {
    id: "1",
    name: "Vanguard Dynamics",
    description:
      "Leading aerospace consultancy specializing in propulsion systems and orbital logistics.",
    target: 124,
    priority: "High Priority",
    email: "contact@vanguard.io",
    phone: "+1 (555) 902-3481",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGBEpnZgRrH5PYUDfunmbjW0IjJGdRM5nivsU5CSKpqi6Qgggwp3ULRX7o-frRawBzwQGxxvY-zW_FUR5Q7jZjPKe7yVt7bx3-QdqdR2Wdv4a_Q-uKTq56AT0QjJcBidxs-fU0bsU-IrQXU6wYop9hc393UkAPl_eUntYG2riu7ern9n57caQzUxLQHGX4K-E7NmrvceRBj1cxk44yX9Fv19wDZ59tGyei7yRWY9MysNYMg1jnm7U2kHl4stj1hF7dDPCAhOh8-xni",
  },
  {
    id: "2",
    name: "Nebula Retail",
    description:
      "E-commerce powerhouse revolutionizing sustainable fashion through decentralized supply chains.",
    target: 86,
    priority: "Standard",
    email: "hello@nebularetail.com",
    phone: "+1 (555) 219-0092",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDy99GDhMnDjCelWNM-0gXN4t-9su9a6EE5LEitg90A5iUi7EwsD3XLDJc6lYZQ0nBjLp0_zW8V_yG7huIKL9RkbeJZAZ7a3UbjOKMpPyxe4ZMRLwHHnqwKIrINBcT2aSR3E0Y0-3Z5LnOZso1dpgswkOvfsSiW2_OaRk6SDEpBUHoXlWtSKbNJluoDgM_vLGnZt_zgWIVdZSjPrwmyjG1J5k5TYf7kDT_WXkaetzyeBM0nxb1zgYFowOsW3coLmqjBoVyGu-akLMO9",
  },
  {
    id: "3",
    name: "Zenith Arches",
    description:
      "Boutique architecture firm crafting high-density urban residential spaces with organic materials.",
    target: 42,
    priority: "Seasonal",
    email: "info@zenitharches.com",
    phone: "+44 20 7946 0122",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC4jitCWrLBVoMR4SEJSwJukw7Fp3QYFeliDMARvnFUN2bd-X0D8eYmApxjNS4HWZZvc3XYXMlYQAkDDtqKAmIifVn_03ihTARSrrnrenlhtj2gRWOwW6jVabpTPH73u1OCVbGRubVTVmhitmlHQb_8A291xumVBk0vgaMwrimdcHPe19XudbB34hOEyK4AQB-lxbJnOszhOc5QNX-a7S9bY6L5qdtzSg1etWruqGnRxnO2xbKRmTg767CFrx3MoN9Y2Ljff28VY--M",
  },
];

export const getClientById = (id) => clients.find((client) => client.id === id);

export const defaultTrend = [
  { week: "Jan 20-26", posts: 18, stories: 30, reels: 4, engagement: "3.8%" },
  { week: "Jan 27-Feb 2", posts: 22, stories: 34, reels: 5, engagement: "4.0%" },
  { week: "Feb 3-9", posts: 28, stories: 40, reels: 7, engagement: "3.9%" },
  { week: "Feb 10-16", posts: 40, stories: 52, reels: 11, engagement: "4.5%" },
  { week: "Feb 17-23", posts: 35, stories: 55, reels: 8, engagement: "4.1%" },
  { week: "Feb 24-Mar 1", posts: 38, stories: 58, reels: 10, engagement: "4.2%" },
  { week: "Mar 2-8", posts: 42, stories: 64, reels: 12, engagement: "4.8%" },
];