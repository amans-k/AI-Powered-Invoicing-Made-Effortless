import { Link } from "react-router-dom";
import Hero_image from "../../assets/hero-img.png";
import { useAuth } from "../../context/AuthContext";

const Hero = () => {
  const {isAuthenticated} = useAuth();

  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      {/* Add top padding to clear navbar */}
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        
        <div className="text-center">
          <h1 className=" text-lgtext-3xl md:text-5xl lg:text-6xl font-bold text-blue-950 mb-6">
            AI-Powered Invoicing, Made Effortless
          </h1>
          
          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-3xl mx-auto">
            Let our AI create invoices from simple text, generate payment reminders, and provide smart insights to help you manage your finances.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-blue-950 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-900 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/signup"
                className="bg-blue-950 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-900 transition"
              >
                Get Started for free
              </Link>
            )}

            <button className="border-2 border-black text-black px-8 py-3 rounded-lg font-bold hover:bg-black hover:text-white transition">
              Learn More
            </button>
          </div>

          <div className="mt-8">
            <img
              src={Hero_image}
              alt="Invoice App Screenshot"
              className="rounded-xl shadow-lg mx-auto max-w-4xl w-full"
            />
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Hero;