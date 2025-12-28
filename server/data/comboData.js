// server/data/comboData.js

export const predefinedCombos = [
  {
    id: "combo_001",
    name: "Triple Delight Feast",
    description: "Pizza + Burger + Wrap combo",
    items: [
      { name: "CHEEZY 7 PIZZA", category: "EXOTIC VEG PIZZAS", price: 229, restaurant: "Peppanizze" },
      { name: "PERI PERI PANEER", category: "VEG BURGERS", price: 209, restaurant: "Shimmers" },
      { name: "PERI PERI PANEER WRAP", category: "VEG WRAPS", price: 209, restaurant: "Urbanwrap" },
      { name: "COLD COFFEE", category: "SHAKES", price: 159, restaurant: "Peppanizze" }
    ],
    originalPrice: 806,
    comboPrice: 649,
    savings: 157,
    tag: "BESTSELLER",
    rating: 4.8,
    description_long: "Experience the ultimate tri-restaurant feast with cheese pizza, spicy paneer burger, and paneer wrap!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_002",
    name: "Spicy Fire Bundle",
    description: "All three restaurants on fire",
    items: [
      { name: "PERI PERI VEG", category: "SPECIALITY VEG", price: 259, restaurant: "Peppanizze" },
      { name: "PERI PERI PANEER", category: "VEG BURGERS", price: 209, restaurant: "Shimmers" },
      { name: "PERI PERI PANEER WRAP", category: "VEG WRAPS", price: 209, restaurant: "Urbanwrap" },
      { name: "PERI PERI FRIES", category: "CRINKLE FRIES", price: 99, restaurant: "Peppanizze" },
      { name: "SPICY MANGO", category: "MOJITOS", price: 119, restaurant: "Peppanizze" }
    ],
    originalPrice: 895,
    comboPrice: 699,
    savings: 196,
    tag: "TRENDING",
    rating: 4.7,
    description_long: "For spice lovers! Every bite is a peri peri explosion across all three restaurants!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_003",
    name: "Chicken Lover Supreme",
    description: "Chicken from Shimmers + Pizza + Wrap",
    items: [
      { name: "PANEER TIKKA BUTTER MASALA", category: "EXOTIC VEG PIZZAS", price: 229, restaurant: "Peppanizze" },
      { name: "AUTHENTIC CHICKEN BURGER", category: "NON-VEG BURGERS", price: 279, restaurant: "Shimmers" },
      { name: "TANDOORI CHICKEN WRAP", category: "NON-VEG WRAPS", price: 219, restaurant: "Urbanwrap" },
      { name: "PEANUT BUTTER", category: "SHAKES", price: 159, restaurant: "Shimmers" }
    ],
    originalPrice: 886,
    comboPrice: 699,
    savings: 187,
    tag: "PREMIUM",
    rating: 4.8,
    description_long: "Chicken aficionado's paradise with premium items from all three restaurants!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_004",
    name: "Cheese Lover's Paradise",
    description: "Extra cheese from all three",
    items: [
      { name: "MAD-OVER CHEESE", category: "SPECIALITY VEG", price: 259, restaurant: "Peppanizze" },
      { name: "CHEESE BURST BURGER", category: "VEG BURGERS", price: 219, restaurant: "Shimmers" },
      { name: "CHEESY CRINKLE FRIES", category: "FRIES", price: 189, restaurant: "Urbanwrap" },
      { name: "BELGIUM CHOCOLATE MILKSHAKE", category: "MILKSHAKES", price: 169, restaurant: "Urbanwrap" }
    ],
    originalPrice: 836,
    comboPrice: 659,
    savings: 177,
    tag: "BESTSELLER",
    rating: 4.9,
    description_long: "Every bite melts with cheese! A cheesy explosion across all three kitchens!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_005",
    name: "Ultimate Party Pack",
    description: "For group of 3-4 people",
    items: [
      { name: "GARDEN SPECIAL", category: "EXOTIC VEG PIZZAS", price: 229, restaurant: "Peppanizze" },
      { name: "PANEER GRILLED BURGER", category: "VEG BURGERS", price: 199, restaurant: "Shimmers" },
      { name: "PANEER TIKKA WRAP", category: "VEG WRAPS", price: 219, restaurant: "Urbanwrap" },
      { name: "PANEER LOADED FRIES", category: "FRIES", price: 199, restaurant: "Urbanwrap" },
      { name: "PANEER TIKKA STUFFED GARLIC BREAD", category: "GARLIC BREAD", price: 179, restaurant: "Urbanwrap" },
      { name: "COLD COFFEE", category: "SHAKES", price: 159, restaurant: "Peppanizze" }
    ],
    originalPrice: 1184,
    comboPrice: 899,
    savings: 285,
    tag: "VALUE PACK",
    rating: 4.8,
    description_long: "The ultimate sharable feast with pizza, burger, wrap, fries, garlic bread, and drink!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_006",
    name: "Burger & Wrap Duo",
    description: "Best of Shimmers + Urbanwrap",
    items: [
      { name: "DOUBLE CHEESE BURST", category: "VEG BURGERS", price: 319, restaurant: "Shimmers" },
      { name: "TANDOORI PANEER WRAP", category: "VEG WRAPS", price: 209, restaurant: "Urbanwrap" },
      { name: "CAJUN CRINKLE FRIES", category: "FRIES", price: 89, restaurant: "Urbanwrap" },
      { name: "OREO MILKSHAKE", category: "MILKSHAKES", price: 159, restaurant: "Urbanwrap" }
    ],
    originalPrice: 776,
    comboPrice: 599,
    savings: 177,
    tag: "NEW",
    rating: 4.7,
    description_long: "Double cheese burger with paneer wrap - a match made in food heaven!",
    restaurants: ["Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_007",
    name: "Quick Lunch Special",
    description: "Fast and filling combo",
    items: [
      { name: "LOVERS CHOICE", category: "CLASSIC VALUE PIZZA", price: 189, restaurant: "Peppanizze" },
      { name: "CRISPY CHICKEN", category: "NON-VEG BURGERS", price: 119, restaurant: "Shimmers" },
      { name: "PERI PERI CRINKLE FRIES", category: "FRIES", price: 89, restaurant: "Urbanwrap" },
      { name: "LIME N MINT", category: "MOJITOS", price: 119, restaurant: "Urbanwrap" }
    ],
    originalPrice: 516,
    comboPrice: 399,
    savings: 117,
    tag: "POPULAR",
    rating: 4.6,
    description_long: "Quick, filling, and delicious - perfect for lunch breaks!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_008",
    name: "Mutton Lover's Delight",
    description: "Premium mutton combo",
    items: [
      { name: "SPRING FLING", category: "CLASSIC VALUE PIZZA", price: 189, restaurant: "Peppanizze" },
      { name: "CLASSIC MUTTON WRAP", category: "NON-VEG WRAPS", price: 229, restaurant: "Urbanwrap" },
      { name: "TANDOORI MUTTON WRAP", category: "NON-VEG WRAPS", price: 239, restaurant: "Urbanwrap" },
      { name: "MANGO MILKSHAKE", category: "MILKSHAKES", price: 159, restaurant: "Urbanwrap" }
    ],
    originalPrice: 816,
    comboPrice: 649,
    savings: 167,
    tag: "PREMIUM",
    rating: 4.7,
    description_long: "For mutton lovers - soft tender mutton wraps with fresh pizza and mango shake!",
    restaurants: ["Peppanizze", "Urbanwrap"]
  },

  {
    id: "combo_009",
    name: "Tandoori Masterpiece",
    description: "All tandoori flavors",
    items: [
      { name: "DESI STYLE", category: "CLASSIC VALUE PIZZA", price: 189, restaurant: "Peppanizze" },
      { name: "TANDOORI PANEER", category: "VEG BURGERS", price: 209, restaurant: "Shimmers" },
      { name: "TANDOORI PANEER WRAP", category: "VEG WRAPS", price: 209, restaurant: "Urbanwrap" },
      { name: "TANDOORI PANEER CHEESE SANDWICH", category: "SANDWICHES", price: 169, restaurant: "Urbanwrap" },
      { name: "COLD COFFEE", category: "SHAKES", price: 159, restaurant: "Peppanizze" }
    ],
    originalPrice: 935,
    comboPrice: 749,
    savings: 186,
    tag: "CHEF'S SPECIAL",
    rating: 4.8,
    description_long: "A tandoori celebration - experience smoky tandoori flavors across pizza, burger, wrap, and sandwich!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_010",
    name: "Chicken Zinger Express",
    description: "All chicken zingers",
    items: [
      { name: "PANEER TIKKA BUTTER MASALA", category: "EXOTIC VEG PIZZAS", price: 229, restaurant: "Peppanizze" },
      { name: "CRISPY DOUBLE CHICKEN BURGER", category: "NON-VEG BURGERS", price: 189, restaurant: "Shimmers" },
      { name: "CLASSIC CHICKEN ZINGER WRAP", category: "NON-VEG WRAPS", price: 209, restaurant: "Urbanwrap" },
      { name: "CHICKEN LOADED FRIES", category: "FRIES", price: 209, restaurant: "Urbanwrap" },
      { name: "CHOCOLATE MILKSHAKE", category: "MILKSHAKES", price: 159, restaurant: "Urbanwrap" }
    ],
    originalPrice: 995,
    comboPrice: 779,
    savings: 216,
    tag: "TRENDING",
    rating: 4.8,
    description_long: "Crispy chicken lovers rejoice! Double chicken burger, zinger wrap, and loaded fries!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_011",
    name: "Gourmet Night Out",
    description: "Premium selection",
    items: [
      { name: "CHEEZY 7 PIZZA", category: "EXOTIC VEG PIZZAS", price: 229, restaurant: "Peppanizze" },
      { name: "AUTHENTIC LAMB BURGER", category: "NON-VEG BURGERS", price: 379, restaurant: "Shimmers" },
      { name: "PANEER TIKKA WRAP", category: "VEG WRAPS", price: 219, restaurant: "Urbanwrap" },
      { name: "BELGIUM CHOCOLATE MILKSHAKE", category: "MILKSHAKES", price: 169, restaurant: "Urbanwrap" }
    ],
    originalPrice: 996,
    comboPrice: 799,
    savings: 197,
    tag: "GOURMET",
    rating: 4.9,
    description_long: "Premium everything - lamb burger, cheese pizza, paneer tikka wrap, and Belgian chocolate!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_012",
    name: "Veg Lover's Bliss",
    description: "Pure vegetarian feast",
    items: [
      { name: "GARDEN PARADISE", category: "CLASSIC VALUE PIZZA", price: 189, restaurant: "Peppanizze" },
      { name: "VEG MAKHANI", category: "VEG BURGERS", price: 99, restaurant: "Shimmers" },
      { name: "MAKHANI WRAP", category: "VEG WRAPS", price: 169, restaurant: "Urbanwrap" },
      { name: "CORN & CHEESE STUFFED GARLIC BREAD", category: "GARLIC BREAD", price: 179, restaurant: "Urbanwrap" },
      { name: "PEANUT BUTTER", category: "SHAKES", price: 159, restaurant: "Shimmers" }
    ],
    originalPrice: 795,
    comboPrice: 629,
    savings: 166,
    tag: "VEGETARIAN",
    rating: 4.7,
    description_long: "Pure vegetarian goodness - creamy makhani flavors across pizza, burger, wrap, and bread!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_013",
    name: "Wings & Fries Feast",
    description: "Crispy wings combo",
    items: [
      { name: "CHEEZY 7 PIZZA", category: "EXOTIC VEG PIZZAS", price: 229, restaurant: "Peppanizze" },
      { name: "PERI PERI WINGS", category: "WINGS", price: 199, restaurant: "Urbanwrap" },
      { name: "CHICKEN LOADED FRIES", category: "FRIES", price: 209, restaurant: "Urbanwrap" },
      { name: "SPICY MANGO", category: "MOJITOS", price: 119, restaurant: "Peppanizze" }
    ],
    originalPrice: 756,
    comboPrice: 599,
    savings: 157,
    tag: "NEW",
    rating: 4.7,
    description_long: "Crispy wings, loaded fries, cheesy pizza, and a spicy mojito - finger-licking good!",
    restaurants: ["Peppanizze", "Urbanwrap"]
  },

  {
    id: "combo_014",
    name: "Pasta & More Combo",
    description: "Pasta + Pizza + Burger",
    items: [
      { name: "MARGHERITTA", category: "CLASSIC VALUE PIZZA", price: 139, restaurant: "Peppanizze" },
      { name: "PERI PERI CHICKEN CHUNKS BURGER", category: "NON-VEG BURGERS", price: 229, restaurant: "Shimmers" },
      { name: "MEXICAN RED SAUCE PASTA NON VEG", category: "NON-VEG PASTA", price: 215, restaurant: "Urbanwrap" },
      { name: "COLD COFFEE", category: "SHAKES", price: 159, restaurant: "Peppanizze" }
    ],
    originalPrice: 742,
    comboPrice: 579,
    savings: 163,
    tag: "ITALIAN FUSION",
    rating: 4.6,
    description_long: "Italian meets Indian with pizza, spicy burger, and Mexican pasta!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  },

  {
    id: "combo_015",
    name: "Sweet Ending Bundle",
    description: "Complete with dessert",
    items: [
      { name: "GARDEN SPECIAL", category: "EXOTIC VEG PIZZAS", price: 229, restaurant: "Peppanizze" },
      { name: "TWIN CLUB", category: "VEG BURGERS", price: 169, restaurant: "Shimmers" },
      { name: "PERI PERI PANEER WRAP", category: "VEG WRAPS", price: 209, restaurant: "Urbanwrap" },
      { name: "CHOCO LAVA", category: "DESSERTS", price: 115, restaurant: "Urbanwrap" },
      { name: "HALLOWEEN MILKSHAKE", category: "MILKSHAKES", price: 189, restaurant: "Urbanwrap" }
    ],
    originalPrice: 911,
    comboPrice: 719,
    savings: 192,
    tag: "COMPLETE MEAL",
    rating: 4.8,
    description_long: "Complete meal experience - pizza, burger, wrap, and sweet chocolate lava dessert!",
    restaurants: ["Peppanizze", "Shimmers", "Urbanwrap"]
  }
];

export const trendingDishes = [
  {
    name: "CHEEZY 7 PIZZA",
    category: "EXOTIC VEG PIZZAS",
    restaurant: "Peppanizze",
    reason: "Yesterday this was the craze among cheese lovers! Super popular demand.",
    trendScore: 9.5,
    lastPopular: "yesterday"
  },
  {
    name: "AUTHENTIC CHICKEN BURGER",
    category: "NON-VEG BURGERS",
    restaurant: "Shimmers",
    reason: "Yesterday the craze for the crispy chicken burger was very good, give it a try!",
    trendScore: 8.8,
    lastPopular: "yesterday"
  },
  {
    name: "CLASSIC CHICKEN ZINGER WRAP",
    category: "NON-VEG WRAPS",
    restaurant: "Urbanwrap",
    reason: "Zinger wraps are flying off the shelves! Everyone's ordering them!",
    trendScore: 9.0,
    lastPopular: "yesterday"
  },
  {
    name: "PERI PERI VEG",
    category: "SPECIALITY VEG",
    restaurant: "Peppanizze",
    reason: "The spicy kick is making waves! Everyone's ordering it.",
    trendScore: 9.0,
    lastPopular: "yesterday"
  },
  {
    name: "PERI PERI PANEER",
    category: "VEG BURGERS",
    restaurant: "Shimmers",
    reason: "Spicy paneer burgers are trending hard! Can't keep up with demand!",
    trendScore: 8.9,
    lastPopular: "yesterday"
  },
  {
    name: "TANDOORI PANEER WRAP",
    category: "VEG WRAPS",
    restaurant: "Urbanwrap",
    reason: "Tandoori wraps are a customer favorite - try the paneer version!",
    trendScore: 8.7,
    lastPopular: "today"
  }
];

export const comboSuggestionRules = {
  multipleRestaurants: {
    threshold: 2,
    message: "You're mixing restaurants! Check out our special combos that blend all three perfectly!"
  },
  spicyItems: {
    items: ["PERI PERI", "JALAPENO", "SPICY", "TANDOORI", "CAJUN"],
    message: "Love spicy food? Try our 'Spicy Fire Bundle' - triple spicy from all three restaurants!"
  },
  cheeseItems: {
    items: ["CHEESE", "CHEEZY", "BURST"],
    message: "Cheese lover detected! Our 'Cheese Lover's Paradise' will blow your mind!"
  },
  paneerItems: {
    items: ["PANEER", "PANEER TIKKA"],
    message: "Paneer fan? Try our 'Tandoori Masterpiece' - paneer in every dish!"
  },
  chickenItems: {
    items: ["CHICKEN", "ZINGER", "CRISPY"],
    message: "Chicken lover? Our 'Chicken Zinger Express' has crispy chicken from all restaurants!"
  },
  premiumItems: {
    items: ["LAMB", "MUTTON", "AUTHENTIC", "GOURMET"],
    message: "Premium taste? Try our 'Gourmet Night Out' - lamb, tikka, and luxury!"
  },
  partyItems: {
    threshold: 4,
    message: "Planning a party? Our 'Ultimate Party Pack' is perfect for groups!"
  }
};