import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./jsx/home";
import SearchResults from "./jsx/SearchResults";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </Router>
  );
}

export default App;