import React, { useEffect, useState, useContext, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { CartContext } from "../context/CartContext";
import { resolveMenuImages } from "./resolveMenuImages";
import "./SwiggyStyleMenu.css";

function SwiggyStyleMenu() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [openCategories, setOpenCategories] = useState({});
  const [showCategoryNav, setShowCategoryNav] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [itemQty, setItemQty] = useState(1);

  // Filter states
  const [filterType, setFilterType] = useState("all");
  const [filteredMenuData, setFilteredMenuData] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // State for order history
  const [previousOrders, setPreviousOrders] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  // Sort states
  const [sortType, setSortType] = useState("");
  const [topPicks, setTopPicks] = useState([]);

  // Discount & Recommendations
  const [discountedItems, setDiscountedItems] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [categoryBanners, setCategoryBanners] = useState([]);
  const [pairingSuggestions, setPairingSuggestions] = useState([]);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [expandedBanner, setExpandedBanner] = useState(null);

  const categoryRefs = useRef({});
  const searchBarRef = useRef(null);

  const { addToCart, increaseQty, decreaseQty, getItemQty, cart } =
    useContext(CartContext);

  // CUSTOM CATEGORY ORDER
  const categoryOrder = [
    "VEG BURGERS",
    "NON-VEG BURGERS",
    "SANDWICH",
    "WRAPS",
    "FRIES",
    "SHAKES",
    "MOJITOS"
  ];

  const sortCategories = (categories) => {
    return [...categories].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category.toUpperCase());
      const indexB = categoryOrder.indexOf(b.category.toUpperCase());
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  // ENHANCED CUSTOMIZATION GROUPS
  const customizationGroups = [
    {
      id: "meal",
      title: "Make It A Meal",
      subtitle: "Select upto 1",
      maxSelection: 1,
      required: false,
      options: [
        { id: "meal-1", name: "Meal (fries + Lime N Mint)", price: 129, type: "veg" }
      ]
    },
    {
      id: "patty",
      title: "Add Fried Patty To Your Burger",
      subtitle: "Select upto 2",
      maxSelection: 2,
      required: false,
      options: [
        { id: "patty-1", name: "Potato Patty", price: 29, type: "veg" },
        { id: "patty-2", name: "Mix Veg Patty", price: 49, type: "veg" },
        { id: "patty-3", name: "Paneer Patty", price: 69, type: "veg" },
        { id: "patty-4", name: "Cheese Patty", price: 89, type: "veg" }
      ]
    },
    {
      id: "cheese",
      title: "Cheese Please!",
      subtitle: "Select upto 1",
      maxSelection: 1,
      required: false,
      options: [
        { id: "cheese-1", name: "Double Cheese Slice", price: 38, type: "veg" },
        { id: "cheese-2", name: "Cheese Slice", price: 20, type: "veg" }
      ]
    },
    {
      id: "sides",
      title: "Sides & Dips",
      subtitle: "Select upto 3",
      maxSelection: 3,
      required: false,
      options: [
        { id: "side-1", name: "Cajun Fries (m)", price: 129, type: "veg" },
        { id: "side-2", name: "Peri Peri Fries (m)", price: 129, type: "veg" },
        { id: "side-3", name: "Salted Fries (m)", price: 119, type: "veg" },
        { id: "side-4", name: "Mayo Dip", price: 25, type: "veg" },
        { id: "side-5", name: "Tandoori Dip", price: 25, type: "veg" }
      ]
    }
  ];

  // Render veg/non-veg indicator
  const renderFoodTypeIndicator = (item) => {
    const isVeg = item.type === "veg" || item.isVeg === true;
    return (
      <span
        style={{
          display: "inline-block",
          width: "16px",
          height: "16px",
          border: `2px solid ${isVeg ? "#48c479" : "#e74c3c"}`,
          borderRadius: "2px",
          position: "relative",
          marginRight: "8px",
          flexShrink: 0
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: isVeg ? "#48c479" : "#e74c3c"
          }}
        />
      </span>
    );
  };

  // FETCH MENU DATA
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await getDocs(collection(db, "menu"));
        const categories = [];
        snapshot.forEach((doc) => categories.push(doc.data()));

        const categoriesWithImages = await resolveMenuImages(categories);
        const sortedCategories = sortCategories(categoriesWithImages);

        const initialOpen = {};
        sortedCategories.forEach((cat) => {
          initialOpen[cat.category] = true;
        });

        setOpenCategories(initialOpen);
        setMenuData(sortedCategories);
        setFilteredMenuData(sortedCategories);

        // EXTRACT TOP PICKS
        const allItems = [];
        sortedCategories.forEach(category => {
          category.items.forEach(item => {
            allItems.push({
              ...item,
              category: category.category,
              itemId: item.id || `${category.category}-${item.name}`.replace(/\s+/g, '_').toLowerCase()
            });
          });
        });

        const bestsellers = allItems
          .filter(item => parseFloat(item.rating) >= 4.5)
          .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
          .slice(0, 6);
        setTopPicks(bestsellers);

        const itemsWithDiscount = allItems
          .filter(item => item.discount && item.discount > 0)
          .sort((a, b) => b.discount - a.discount)
          .slice(0, 6);
        setDiscountedItems(itemsWithDiscount);

        const recommended = allItems
          .filter(item => parseFloat(item.rating) >= 4.3)
          .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
          .slice(0, 6);
        setRecommendedItems(recommended);

        const banners = sortedCategories.map(category => {
          const minPrice = Math.min(...category.items.map(item => item.price));
          return {
            category: category.category,
            startingPrice: minPrice,
            itemCount: category.items.length
          };
        }).slice(0, 3);
        setCategoryBanners(banners);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // FETCH OFFERS
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offersSnapshot = await getDocs(collection(db, "offers"));
        const offersData = [];
        offersSnapshot.forEach((doc) => {
          if (doc.data().isActive) {
            offersData.push({
              id: doc.id,
              ...doc.data()
            });
          }
        });
        setOffers(offersData);
      } catch (e) {
        console.log("Offers fetch error:", e);
      }
    };

    fetchOffers();
  }, []);

  useEffect(() => {
    if (!offers.length) return;
    const interval = setInterval(() => {
      setActiveDealIndex((prev) =>
        prev === offers.length - 1 ? 0 : prev + 1
      );
    }, 1500);
    return () => clearInterval(interval);
  }, [offers]);

  // FETCH ORDER HISTORY
  useEffect(() => {
    const fetchRecentOrders = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });

        orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const itemMap = new Map();
        orders.slice(0, 5).forEach(order => {
          if (order.cart) {
            order.cart.forEach(item => {
              if (!itemMap.has(item.id)) {
                itemMap.set(item.id, item);
              }
            });
          }
        });

        setRecentItems(Array.from(itemMap.values()).slice(0, 4));
      } catch (e) {
        console.log("Error fetching order history:", e);
      }
    };

    fetchRecentOrders();
  }, []);

  // APPLY FILTER AND SORT
  useEffect(() => {
    let filtered = menuData;

    // Apply search filter
    if (searchQuery.trim()) {
      setIsSearching(true);
      filtered = menuData.map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.items.length > 0);
    } else {
      setIsSearching(false);
    }

    // Apply veg/non-veg filter
    if (filterType !== "all") {
      filtered = filtered.map(category => ({
        ...category,
        items: category.items.filter(item => {
          if (filterType === "veg") {
            return item.type === "veg" || item.isVeg === true;
          } else if (filterType === "nonveg") {
            return item.type === "nonveg" || item.type === "non-veg" || item.isVeg === false;
          }
          return true;
        })
      })).filter(category => category.items.length > 0);
    }

    // Apply sorting
    if (sortType === "rating") {
      filtered = filtered.map(category => ({
        ...category,
        items: category.items.filter(item => parseFloat(item.rating) >= 4.0)
      })).filter(category => category.items.length > 0);
    } else if (sortType === "bestseller") {
      const allItems = [];
      filtered.forEach(category => {
        category.items.forEach(item => {
          allItems.push({
            ...item,
            category: category.category,
            categoryName: category.category
          });
        });
      });

      let bestsellerItems = allItems.filter(item => parseFloat(item.rating) >= 4.5);

      const priority = bestsellerItems.filter(item =>
        item.categoryName.includes('BURGER') ||
        item.categoryName.includes('SANDWICH')
      );
      const others = bestsellerItems.filter(item =>
        !item.categoryName.includes('BURGER') &&
        !item.categoryName.includes('SANDWICH')
      );

      bestsellerItems = [...priority, ...others].slice(0, 11);

      const categoryMap = new Map();
      bestsellerItems.forEach(item => {
        if (!categoryMap.has(item.categoryName)) {
          categoryMap.set(item.categoryName, {
            category: item.categoryName,
            items: []
          });
        }
        categoryMap.get(item.categoryName).items.push(item);
      });

      filtered = Array.from(categoryMap.values());
    }

    setFilteredMenuData(sortCategories(filtered));
  }, [filterType, sortType, menuData, searchQuery]);

  // AUTO SCROLL TO MATCHING CATEGORY ON SEARCH
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const matchedCategory = filteredMenuData.find(category =>
      category.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.items.some(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    if (matchedCategory) {
      const el = categoryRefs.current[matchedCategory.category];
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [searchQuery, filteredMenuData]);

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleCategorySelect = (category) => {
    const updated = {};
    Object.keys(openCategories).forEach((key) => {
      updated[key] = false;
    });
    updated[category] = true;

    setOpenCategories(updated);
    setShowCategoryNav(false);

    setTimeout(() => {
      categoryRefs.current[category]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  const handleItemClick = (item, category, itemId) => {
    setSelectedItem({ ...item, category, itemId });
    setShowItemModal(true);
    setItemQty(1);
    setSelectedAddons({});
  };

  const handleAddToCart = () => {
    const itemId = selectedItem.itemId;

    const addonsList = [];
    let addonPrice = 0;

    customizationGroups.forEach(group => {
      group.options.forEach(option => {
        if (selectedAddons[option.id]) {
          addonsList.push(option);
          addonPrice += option.price;
        }
      });
    });

    addToCart({
      id: itemId,
      name: selectedItem.name,
      price: selectedItem.price + addonPrice,
      img: selectedItem.img,
      qty: itemQty,
      addons: addonsList,
      basePrice: selectedItem.price,
      brand: "Shrimmers"
    });

    setShowItemModal(false);
    generatePairingSuggestions(selectedItem);
    setShowPairingModal(true);
  };

  // GENERATE SMART PAIRING SUGGESTIONS
  const generatePairingSuggestions = (addedItem) => {
    const allItems = [];
    menuData.forEach(category => {
      category.items.forEach(item => {
        allItems.push({
          ...item,
          category: category.category,
          itemId: item.id || `${category.category}-${item.name}`.replace(/\s+/g, '_').toLowerCase()
        });
      });
    });

    let pairings = [];

    if (addedItem.category.includes('BURGER')) {
      pairings = allItems.filter(item =>
        item.category.includes('FRIES') ||
        item.category.includes('SHAKE') ||
        item.category.includes('MOJITO')
      ).slice(0, 3);
    } else if (addedItem.category.includes('FRIES')) {
      pairings = allItems.filter(item =>
        item.category.includes('BURGER') ||
        item.name.toLowerCase().includes('dip')
      ).slice(0, 3);
    } else {
      pairings = allItems
        .filter(item => item.category !== addedItem.category && parseFloat(item.rating) >= 4.3)
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 3);
    }

    setPairingSuggestions(pairings);
  };

  const toggleAddon = (addonId, groupId) => {
    const group = customizationGroups.find(g => g.id === groupId);
    if (!group) return;

    setSelectedAddons((prev) => {
      const updated = { ...prev };
      const selectedInGroup = group.options.filter(opt => updated[opt.id]).length;

      if (updated[addonId]) {
        delete updated[addonId];
      } else {
        if (selectedInGroup < group.maxSelection) {
          updated[addonId] = true;
        } else {
          alert(`You can only select up to ${group.maxSelection} items from ${group.title}`);
        }
      }
      return updated;
    });
  };

  // FILTER CLICK HANDLER
  const handleFilterClick = (type) => {
    if (filterType === type) {
      setFilterType("all");
    } else {
      setFilterType(type);
      setSortType("");
      setTimeout(() => {
        document.querySelector(".menu-title-divider")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  };

  const addonTotal = customizationGroups.reduce((sum, group) => {
    return sum + group.options.reduce((groupSum, option) => {
      return groupSum + (selectedAddons[option.id] ? option.price : 0);
    }, 0);
  }, 0);

  const itemTotal = selectedItem
    ? (selectedItem.price + addonTotal) * itemQty
    : 0;

  const totalItems = menuData.reduce((sum, cat) => sum + cat.items.length, 0);
  const vegItems = menuData.reduce((sum, cat) =>
    sum + cat.items.filter(item => item.type === "veg" || item.isVeg === true).length, 0
  );
  const nonVegItems = menuData.reduce((sum, cat) =>
    sum + cat.items.filter(item => item.type === "nonveg" || item.type === "non-veg" || item.isVeg === false).length, 0
  );

  return (
    <div className="menu-wrapper">
      {/* FIXED SEARCH BAR AT TOP */}
      <div className="top-search-bar" ref={searchBarRef}>
        <div className="top-search-wrapper">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search for dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
              }}>✕</button>
            )}
          </div>

          <button
            className={`veg-only-toggle ${filterType === "veg" ? "active" : ""}`}
            onClick={() => handleFilterClick("veg")}
          >
            <span className="veg-icon">
              <span className="veg-dot"></span>
            </span>
            <span className="veg-text">Veg Only</span>
          </button>
        </div>
      </div>

      {/* Search results banner */}
      {isSearching && (
        <div className="search-results-banner">
          <p>
            {filteredMenuData.reduce((sum, cat) => sum + cat.items.length, 0)} results for "{searchQuery}"
          </p>
          <button className="clear-search-btn" onClick={() => {
            setSearchQuery("");
            setIsSearching(false);
          }}>Clear search</button>
        </div>
      )}

      {/* HEADER */}
      <div className="restaurant-header">
        <div className="header-top">
          <div className="header-info">
            <h1 className="rest-name">Shrimmers</h1>
            <p className="rest-rating">⭐ 4.2 rating on Zomato & Swiggy</p>
            <p className="rest-category">Burgers, Fast Food</p>
            <p className="rest-location">📍 Padmarao Nagar • 55-65 mins</p>
          </div>
        </div>
      </div>

      {/* LIVE DEALS SECTION */}
      {offers.length > 0 && (
        <div className="live-deals-section">
          <h3 className="deals-title">🎉 Deals for you</h3>
          <div className="deal-strip">
            <div key={offers[activeDealIndex].id} className="deal-strip-content">
              <div className="deal-left">
                <span className="deal-icon">
                  {offers[activeDealIndex].icon || "🎁"}
                </span>
                <div className="deal-text-wrap">
                  <p className="deal-main-text">
                    {offers[activeDealIndex].title}
                  </p>
                  <p className="deal-sub-text">
                    USE <strong>{offers[activeDealIndex].code}</strong>
                  </p>
                </div>
              </div>
              <div className="deal-counter">
                {activeDealIndex + 1}/{offers.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VEG/NON-VEG FILTER & SORT BUTTONS */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === "all" && sortType === "" ? "active" : ""}`}
            onClick={() => { setFilterType("all"); setSortType(""); }}
          >
            <span className="filter-text">All</span>
            <span className="filter-count">{totalItems}</span>
          </button>

          <button
            className={`filter-btn veg-filter ${filterType === "veg" ? "active" : ""}`}
            onClick={() => handleFilterClick("veg")}
          >
            <span className="veg-indicator"><span className="veg-dot"></span></span>
            <span className="filter-text">Veg</span>
            <span className="filter-count">{vegItems}</span>
          </button>

          <button
            className={`filter-btn nonveg-filter ${filterType === "nonveg" ? "active" : ""}`}
            onClick={() => handleFilterClick("nonveg")}
          >
            <span className="nonveg-indicator"><span className="nonveg-dot"></span></span>
            <span className="filter-text">Non-Veg</span>
            <span className="filter-count">{nonVegItems}</span>
          </button>

          <button
            className={`filter-btn sort-btn ${sortType === "rating" ? "active" : ""}`}
            onClick={() => setSortType(sortType === "rating" ? "" : "rating")}
          >
            <span className="filter-text">⭐ 4.0+</span>
          </button>

          <button
            className={`filter-btn sort-btn ${sortType === "bestseller" ? "active" : ""}`}
            onClick={() => setSortType(sortType === "bestseller" ? "" : "bestseller")}
          >
            <span className="filter-text">🔥 Best</span>
          </button>
        </div>

        {filterType !== "all" && (
          <p className="filter-info">
            Showing {filterType === "veg" ? vegItems : nonVegItems} {filterType} items
          </p>
        )}
      </div>

      {/* ORDER AGAIN SECTION */}
      {recentItems.length > 0 && (
        <div className="order-again-section">
          <h3 className="order-again-title">🔄 Order Again</h3>
          <div className="order-again-carousel">
            {recentItems.map((item) => {
              const qty = getItemQty(item.id);
              return (
                <div key={item.id} className="order-again-card">
                  <img src={item.img} alt={item.name} className="order-again-img" />
                  <div className="order-again-info">
                    <p className="order-again-name">{item.name}</p>
                    <p className="order-again-price">₹{item.price}</p>
                  </div>
                  {qty === 0 ? (
                    <button
                      className="discount-add-btn"
                      onClick={() => handleItemClick(item, item.category, item.itemId)}
                    >
                      ADD +
                    </button>
                  ) : (
                    <div className="discount-qty-box">
                      <button onClick={() => decreaseQty(item.itemId)}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => increaseQty(item.itemId)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CATEGORY PRICE BANNERS WITH DROPDOWN */}
      {categoryBanners.length > 0 && (
        <div className="category-banners">
          {categoryBanners.map((banner, idx) => {
            const category = menuData.find(cat => cat.category === banner.category);
            const isExpanded = expandedBanner === idx;

            return (
              <div key={idx} className="category-banner-wrapper">
                <div
                  className="category-banner-card"
                  onClick={() => setExpandedBanner(isExpanded ? null : idx)}
                >
                  <h4>{banner.category.replace('_', ' ')}: Starts @₹{banner.startingPrice}</h4>
                  <span className="banner-arrow">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && category && (
                  <div className="banner-items-dropdown">
                    {category.items.slice(0, 4).map((item, itemIdx) => {
                      const itemId = item.id || `${category.category}-${item.name}`.replace(/\s+/g, '_').toLowerCase();
                      const qty = getItemQty(itemId);

                      return (
                        <div key={itemIdx} className="banner-dropdown-item">
                          <div className="banner-item-info">
                            {renderFoodTypeIndicator(item)}
                            <div className="banner-item-details">
                              <p className="banner-item-name">{item.name}</p>
                              <p className="banner-item-price">₹{item.price}</p>
                            </div>
                          </div>
                          {qty === 0 ? (
                            <button
                              className="banner-item-add"
                              onClick={() => handleItemClick(item, category.category, itemId)}
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="banner-item-qty">
                              <button onClick={() => decreaseQty(itemId)}>−</button>
                              <span>{qty}</span>
                              <button onClick={() => increaseQty(itemId)}>+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {category.items.length > 4 && (
                      <p className="view-all-text">
                        + {category.items.length - 4} more items
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RECOMMENDED FOR YOU SECTION */}
      {recommendedItems.length > 0 && (
        <div className="recommended-section">
          <h3 className="recommended-title">🎯 Recommended for you</h3>
          <div className="recommended-grid">
            {recommendedItems.map((item) => {
              const qty = getItemQty(item.itemId);
              return (
                <div key={item.itemId} className="recommended-card">
                  <img src={item.img} alt={item.name} className="recommended-img" />
                  <div className="recommended-content">
                    <div className="recommended-header">
                      {renderFoodTypeIndicator(item)}
                      <h4 className="recommended-name">{item.name}</h4>
                    </div>
                    <div className="recommended-info">
                      <span className="recommended-rating">⭐ {item.rating}</span>
                      <span className="recommended-price">₹{item.price}</span>
                    </div>
                    {qty === 0 ? (
                      <button
                        className="recommended-add-btn"
                        onClick={() => handleItemClick(item, item.category, item.itemId)}
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="recommended-qty-box">
                        <button onClick={() => decreaseQty(item.itemId)}>-</button>
                        <span>{qty}</span>
                        <button onClick={() => increaseQty(item.itemId)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="menu-title-divider">MENU</div>

      {loading ? (
        <div className="loading">Loading menu...</div>
      ) : filteredMenuData.length === 0 ? (
        <div className="empty-filter">
          <div className="empty-icon">🍽️</div>
          <h3>No items found</h3>
          <p>Try changing the filter to see more items</p>
          <button
            className="reset-filter-btn"
            onClick={() => {
              setFilterType("all");
              setSearchQuery("");
            }}
          >
            Show All Items
          </button>
        </div>
      ) : (
        <>
          {filteredMenuData.map((section, idx) => {
            const isOpen = openCategories[section.category];

            return (
              <div
                key={idx}
                className="menu-section"
                ref={(el) => (categoryRefs.current[section.category] = el)}
              >
                <div
                  className="category-title"
                  onClick={() => toggleCategory(section.category)}
                >
                  {section.category}
                  <span style={{ float: "right" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>

                {isOpen && (
                  <div className="item-list">
                    {section.items.map((item, index) => {
                      const itemId = item.id || `${section.category}-${item.name}`.replace(/\s+/g, '_').toLowerCase();
                      const qty = getItemQty(itemId);

                      return (
                        <div key={index} className="menu-item-card">
                          <div className="item-info">
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                              {renderFoodTypeIndicator(item)}
                              <h3 className="item-name" style={{ margin: 0 }}>{item.name}</h3>
                            </div>
                            <p className="item-price">₹{item.price}</p>
                            <p className="item-rating">⭐ {item.rating}</p>
                            <p className="item-desc">{item.desc}</p>

                            <button
                              className="more-details-btn"
                              onClick={() => handleItemClick(item, section.category, itemId)}
                            >
                              More Details →
                            </button>
                          </div>

                          <div className="item-img-wrapper">
                            <img
                              src={item.img}
                              className="item-img"
                              alt={item.name}
                            />

                            {qty === 0 ? (
                              <button
                                className="add-btn"
                                onClick={() => handleItemClick(item, section.category, itemId)}
                              >
                                ADD
                              </button>
                            ) : (
                              <div className="qty-box">
                                <button onClick={() => decreaseQty(itemId)}>-</button>
                                <span>{qty}</span>
                                <button onClick={() => increaseQty(itemId)}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* FLOATING MENU BUTTON */}
      <button
        className="floating-menu-btn"
        onClick={() => setShowCategoryNav(true)}
      >
        MENU
      </button>

      {/* BOTTOM CATEGORY NAV */}
      {showCategoryNav && (
        <div
          className="category-nav-overlay"
          onClick={() => setShowCategoryNav(false)}
        >
          <div
            className="category-nav-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="category-nav-header">
              <span>Shrimmers</span>
              <button onClick={() => setShowCategoryNav(false)}>✕</button>
            </div>

            {menuData.map((section, idx) => (
              <div
                key={idx}
                className="category-nav-item"
                onClick={() => handleCategorySelect(section.category)}
              >
                <span>{section.category}</span>
                <span className="category-count">{section.items.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ITEM DETAILS MODAL */}
      {showItemModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setShowItemModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {renderFoodTypeIndicator(selectedItem)}
                <h2 style={{ margin: 0 }}>{selectedItem.name}</h2>
              </div>
              <button
                className="close-modal"
                onClick={() => setShowItemModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <img src={selectedItem.img} alt={selectedItem.name} className="modal-img" />

              <div className="modal-info">
                <p className="modal-price">₹{selectedItem.price}</p>
                <p className="modal-rating">⭐ {selectedItem.rating}</p>
                <p className="modal-desc">{selectedItem.desc}</p>
              </div>

              {/* CUSTOMIZATION GROUPS */}
              <div className="addons-section">
                {customizationGroups.map((group) => (
                  <div key={group.id} className="customization-group">
                    <h3>{group.title}</h3>
                    <p className="addons-subtitle">{group.subtitle}</p>

                    {group.options.map((option) => (
                      <div key={option.id} className="addon-item">
                        <label className="addon-label">
                          <div className="addon-left">
                            {renderFoodTypeIndicator({ type: option.type })}
                            <span className="addon-name">{option.name}</span>
                          </div>
                          <div className="addon-right">
                            <span className="addon-price">+₹{option.price}</span>
                            <input
                              type="checkbox"
                              checked={!!selectedAddons[option.id]}
                              onChange={() => toggleAddon(option.id, group.id)}
                            />
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* QUANTITY SELECTOR */}
              <div className="qty-selector">
                <label>Quantity:</label>
                <div className="qty-controls">
                  <button onClick={() => setItemQty(Math.max(1, itemQty - 1))}>-</button>
                  <span>{itemQty}</span>
                  <button onClick={() => setItemQty(itemQty + 1)}>+</button>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="price-breakdown">
                <div className="breakdown-row">
                  <span>Item Price</span>
                  <span>₹{selectedItem.price}</span>
                </div>
                {addonTotal > 0 && (
                  <div className="breakdown-row">
                    <span>Addons</span>
                    <span>+₹{addonTotal}</span>
                  </div>
                )}
                {itemQty > 1 && (
                  <div className="breakdown-row">
                    <span>Quantity</span>
                    <span>x{itemQty}</span>
                  </div>
                )}
                <div className="breakdown-row total">
                  <span>Total</span>
                  <span>₹{itemTotal}</span>
                </div>
              </div>
            </div>

            {/* ADD TO CART BUTTON */}
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              Add to Cart • ₹{itemTotal}
            </button>
          </div>
        </div>
      )}

      {/* CART BAR */}
      {cart.length > 0 && (
        <div className="bottom-cart-bar">
          <span>{cart.length} item added</span>
          <a href="/cart" className="view-cart-btn">
            VIEW CART
          </a>
        </div>
      )}

      {/* PAIRING SUGGESTIONS MODAL */}
      {showPairingModal && pairingSuggestions.length > 0 && (
        <div className="pairing-modal-overlay" onClick={() => setShowPairingModal(false)}>
          <div className="pairing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pairing-header">
              <h3>✨ You will love pairing it with</h3>
              <button className="close-pairing" onClick={() => setShowPairingModal(false)}>✕</button>
            </div>
            <div className="pairing-items">
              {pairingSuggestions.map((item) => {
                const qty = getItemQty(item.itemId);
                return (
                  <div key={item.itemId} className="pairing-card">
                    {renderFoodTypeIndicator(item)}
                    <img src={item.img} alt={item.name} className="pairing-img" />
                    <div className="pairing-details">
                      <h4 className="pairing-name">{item.name}</h4>
                      <div className="pairing-meta">
                        <span className="pairing-price">₹{item.price}</span>
                        <span className="pairing-rating">⭐ {item.rating}</span>
                      </div>
                      {qty === 0 ? (
                        <button
                          className="pairing-add-btn"
                          onClick={() => {
                            addToCart({
                              id: item.itemId,
                              name: item.name,
                              price: item.price,
                              img: item.img,
                              qty: 1,
                              basePrice: item.price,
                              brand: "Shrimmers"
                            });
                          }}
                        >
                          ADD +
                        </button>
                      ) : (
                        <div className="pairing-qty-box">
                          <button onClick={() => decreaseQty(item.itemId)}>−</button>
                          <span>{qty}</span>
                          <button onClick={() => increaseQty(item.itemId)}>+</button>
                        </div>
                      )}
                      <p className="customizable-text">customisable</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="continue-btn" onClick={() => setShowPairingModal(false)}>
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SwiggyStyleMenu;