import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Lock,
  Smartphone,
  Users,
  Zap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen w-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" to="#" >
          <Smartphone className="h-6 w-6 text-primary" />
          <span className="ml-2 text-2xl font-bold text-primary">
            UPI-Netbanking
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            to="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            to="#how-it-works"
          >
            How It Works
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            to="#testimonials"
          >
            Testimonials
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                  Seamless UPI & Netbanking Transactions
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                  Experience the future of digital payments with our secure,
                  fast, and user-friendly UPI-Netbanking platform.
                </p>
              </div>
              <div className="space-x-4">
                <Button className="bg-white text-primary hover:bg-gray-100" onClick={()=> {
                  navigate("/dashboard");
                }}>
                  Get Started
                </Button>
                <Button
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-primary"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100"
        >
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="flex flex-col items-center p-6 space-y-4">
                  <Lock className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Secure Transactions</h3>
                  <p className="text-center text-gray-600">
                    Bank-grade security measures to protect your financial data
                    and transactions.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 space-y-4">
                  <Zap className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Instant Transfers</h3>
                  <p className="text-center text-gray-600">
                    Lightning-fast UPI transactions and quick netbanking
                    transfers.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col items-center p-6 space-y-4">
                  <Users className="h-12 w-12 text-primary" />
                  <h3 className="text-xl font-bold">Multi-Bank Support</h3>
                  <p className="text-center text-gray-600">
                    Connect and manage multiple bank accounts in one place.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                  1
                </div>
                <h3 className="text-xl font-bold">Sign Up</h3>
                <p className="text-gray-600">
                  Create your account in minutes with easy verification.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                  2
                </div>
                <h3 className="text-xl font-bold">Link Your Banks</h3>
                <p className="text-gray-600">
                  Securely connect your bank accounts to the platform.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white">
                  3
                </div>
                <h3 className="text-xl font-bold">Start Transacting</h3>
                <p className="text-gray-600">
                  Enjoy seamless UPI payments and netbanking transfers.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          id="testimonials"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-100"
        >
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8">
              What Our Users Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Alex Johnson",
                  role: "Small Business Owner",
                  content:
                    "UPI-Netbanking has revolutionized how I manage my business finances. It's fast, secure, and incredibly user-friendly!",
                },
                {
                  name: "Priya Sharma",
                  role: "Freelance Designer",
                  content:
                    "I love how easy it is to receive payments from clients across different banks. This app has made my financial life so much simpler.",
                },
                {
                  name: "Michael Lee",
                  role: "Student",
                  content:
                    "As a student, I appreciate the zero-fee transfers and the ability to split bills easily with my roommates. It's a game-changer!",
                },
              ].map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-gray-600 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 rounded-full bg-primary" />
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full py-12 md:py-24 lg:py-32 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto max-w-[600px] text-gray-200 md:text-xl">
              Join thousands of satisfied users and experience the future of
              digital banking today.
            </p>
            <Button className="bg-white text-primary hover:bg-gray-100" onClick={() => {
              navigate("/auth/signup");
            }}>
              Sign Up Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
