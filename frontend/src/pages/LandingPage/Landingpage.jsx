import React from "react";
import Header from "../../component/Landing/Header";
import Hero from "../../component/Landing/Hero";
import Features from "../../component/Landing/Features";
import Testimonials from "../../component/Landing/Testimonials";
import Faqs from "../../component/Landing/Faqs";
import Footer from "../../component/Landing/Footer";

const LandingPage = () => {
  return (
    <div className="bg-[#ffffff] text-gray-600 min-h-screen">
      <Header />
      <main>
        <Hero/>
        <Features/>
        <Testimonials/>
        <Faqs/>
        <Footer/>
      </main>
    </div>
  );
};

export default LandingPage;
