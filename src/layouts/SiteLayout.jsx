// src/layouts/SiteLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-purple-900">
      {/* La página renderiza aquí */}
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
