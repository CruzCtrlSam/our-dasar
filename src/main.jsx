import React from "react";
import { createRoot } from "react-dom/client";
import HomeAffordabilityStudio from "../home-affordability-studio.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HomeAffordabilityStudio />
  </React.StrictMode>,
);
