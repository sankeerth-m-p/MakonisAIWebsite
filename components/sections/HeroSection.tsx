import GlassDoorReveal from "@/components/hero/GlassDoorReveal";

export default function HeroSection() {
  return (
    <GlassDoorReveal
      id="hero"
      src="/tempbg.png"
      alt="Makonis AI"
      scrollLength={2.5}
      variant="swing"
      heading={
        <div className="flex flex-col items-center">
          <h1 className="mt-8 max-w-2xl">
            Where AI meets human potential.
          </h1>
        </div>
      }
    />
  );
}
