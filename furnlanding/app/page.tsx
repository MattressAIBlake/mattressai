import { Navbar } from "@/components/landing/Navbar";
import { HeroToolGraveyard } from "@/components/landing/HeroToolGraveyard";
import { PlayfulStats } from "@/components/landing/PlayfulStats";
import { ReplacementGrid } from "@/components/landing/ReplacementGrid";
import { Features } from "@/components/landing/Features";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { Pricing } from "@/components/landing/Pricing";
import { FounderNote } from "@/components/landing/FounderNote";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const HomePage = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroToolGraveyard />
      <PlayfulStats />
      <ReplacementGrid />
      <Features />
      <ProductShowcase />
      <Pricing />
      <FounderNote />
      <FinalCTA />
      <Footer />
    </main>
  );
};

export default HomePage;
