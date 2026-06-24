import GlassDoorReveal from "@/components/hero/GlassDoorReveal";


export default function HeroSection() {
  return (
    <GlassDoorReveal
      id="hero"
      className="relative  z-0"
      src="/temp%20hero4.webm"
      scrollLength={2}
      heading={
        <div className="flex flex-col  items-center">
          <h1 className="mt-8 font-bold max-w-2xl">
            Where AI meets human potential.
          </h1>
        </div>
      }
    />
  );
}
