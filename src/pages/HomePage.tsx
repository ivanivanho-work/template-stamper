function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Welcome to Template Stamper
      </h1>
      <p className="text-lg text-gray-300 mb-8 text-center">
        Professional automation tool for creating vertical video advertisements at scale
      </p>

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-3 text-red-500">
            🎬 One-Click Generation
          </h2>
          <p className="text-gray-400">
            Generate 64 videos per month across 4 markets with consistent branding
            and variable content.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-3 text-red-500">
            ⚡ Fast Rendering
          </h2>
          <p className="text-gray-400">
            Powered by Remotion Lambda, each 17-second video renders in just 1-2
            minutes.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-3 text-red-500">
            🎨 Template Library
          </h2>
          <p className="text-gray-400">
            Manage 8 template variations with consistent branding and easy
            customization.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-semibold mb-3 text-red-500">
            🔄 YTM Integration
          </h2>
          <p className="text-gray-400">
            Seamless asset transfer from YTM Creative Generator via MCP bridge.
          </p>
        </div>
      </div>

      <div className="mt-12 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Current Phase: Core Infrastructure</h3>
        <ul className="space-y-2 text-gray-400">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Firebase project initialized
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Frontend setup with React + TypeScript + Vite
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-500">○</span>
            Firebase Functions setup (in progress)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-500">○</span>
            Remotion Lambda configuration (pending)
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-500">○</span>
            MCP bridge implementation (pending)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default HomePage;
