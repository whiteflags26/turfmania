import { Square } from "@/types/square"

//Navigation Bar
export const NAV_LINKS = [
  { href: "/", key: "home", label: "Home" },
  { href: "/about", key: "about", label: "About" },
  { href: "/venues", key: "Venues", label: "Venues" },
  { href: "/organization-request", key: "organizationRequest", label: "Register Your Organization"},
];

//Hero Section
export const squareData: Square[] = [
  {
    id: 1,
    src: "/images/Hero-id1.avif",
    alt: "Hero Image 1",
    width: 300,
    height: 300,
  },
  {
    id: 2,
    src: "/images/Hero-id2.avif",
    alt: "Hero Image 2",
    width: 300,
    height: 300,
  },
  {
    id: 3,
    src: "/images/Hero-id3.avif",
    alt: "Hero Image 3",
    width: 300,
    height: 300,
  },
  {
    id: 4,
    src: "/images/Hero-id4.avif",
    alt: "Hero Image 4",
    width: 300,
    height: 300,
  },
  {
    id: 5,
    src: "/images/Hero-id5.avif",
    alt: "Hero Image 5",
    width: 300,
    height: 300,
  },
  {
    id: 6,
    src: "/images/Hero-id6.avif",
    alt: "Hero Image 6",
    width: 300,
    height: 300,
  },
  {
    id: 7,
    src: "/images/Hero-id7.avif",
    alt: "Hero Image 7",
    width: 300,
    height: 300,
  },
  {
    id: 8,
    src: "/images/Hero-id8.avif",
    alt: "Hero Image 8",
    width: 300,
    height: 300,
  },
  {
    id: 9,
    src: "/images/Hero-id9.avif",
    alt: "Hero Image 9",
    width: 300,
    height: 300,
  },
  {
    id: 10,
    src: "/images/Hero-id10.avif",
    alt: "Hero Image 10",
    width: 300,
    height: 300,
  },
  {
    id: 11,
    src: "/images/Hero-id11.avif",
    alt: "Hero Image 11",
    width: 300,
    height: 300,
  },
  {
    id: 12,
    src: "/images/Hero-id12.avif",
    alt: "Hero Image 12",
    width: 300,
    height: 300,
  },
  {
    id: 13,
    src: "/images/Hero-id13.avif",
    alt: "Hero Image 13",
    width: 300,
    height: 300,
  },
  {
    id: 14,
    src: "/images/Hero-id14.avif",
    alt: "Hero Image 14",
    width: 300,
    height: 300,
  },
  {
    id: 15,
    src: "/images/Hero-id15.avif",
    alt: "Hero Image 15",
    width: 300,
    height: 300,
  },
  {
    id: 16,
    src: "/images/Hero-id16.avif",
    alt: "Hero Image 16",
    width: 300,
    height: 300,
  },
];


//FeatureSection Contents:
export const featureContents = [
  {
    id: 1,
    imgPath: "/images/Feature-LaceUp.jpg",
    heading: "Lace Up Today.",
    content: {
      title: "Find and Book Turfs Near You",
      description: [
        "Say goodbye to the hassle of finding a place to play. Discover nearby turfs, check availability, and book your slot in just a few clicks. Whether it's a casual game with friends or a serious match, we've got you covered.",
        "TurfMania makes it easier than ever to connect with the best venues, ensuring you spend less time searching and more time playing the game you love.",
      ],
    },
  },
  {
    id: 2,
    imgPath: "/images/Feature-RegisterTurf.jpg",
    heading: "Got a Venue?",
    content: {
      title: "Register Your Turf and Boost Your Earnings",
      description: [
        "Are you a turf owner? Maximize your venue's potential by registering with TurfMania. Reach more players, streamline bookings, and increase your revenue effortlessly.",
        "With our platform, you can manage schedules, attract new customers, and turn your turf into the go-to destination for sports enthusiasts in your area.",
      ],
    },
  },
  {
    id: 3,
    imgPath: "/images/Feature-TimeToShine.jpg", 
    heading: "Your Organization, Online.",
    content: {
      title: "Dedicated Organization Portal",
      description: [
        "Take control of your sports business with TurfMania's dedicated organization portal. Manage your turfs, track bookings, handle payments, and customize your organization's profile all in one place.",
        "Our intuitive dashboard provides everything venue owners need to streamline operations and grow their business, putting the power of digital management at your fingertips.",
      ],
    },
  },
];

// Venues Hero Section Slider Images
export const VENUES_SLIDER_IMAGES = [
  "/images/VenuesHeroSection-id1.avif", 
  "/images/VenuesHeroSection-id2.avif",  
  "/images/VenuesHeroSection-id3.avif"   
];

//Default Profile Avatar Image
export const DEFAULT_AVATAR_IMAGE = "/images/avatar.png";

//layout.tsx conditional render for Navbar:
export const authRoutes=[
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email"
];
