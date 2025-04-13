export default function TurfHeroSection() {
  return (
    <div className="relative w-full h-[60vh] md:h-[75vh] flex items-center justify-center overflow-hidden mb-12 rounded-2xl mx-auto max-w-7xl">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        src="/videos/TurfHeroSection.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 rounded-2xl"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          Find Your Perfect Turf
        </h1>
        <p className="text-slate-200 max-w-2xl mx-auto text-base sm:text-lg">
          Discover and book the best sports turfs in your area. Filter by sport,
          price, and location to find the perfect match for your game.
        </p>
      </div>
    </div>
  );
}
