export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-gray-300 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <div className="text-center md:text-left">
          <p>Site designed, developed & hosted by Universe of Innovation, Campus Portal</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="#help" className="hover:text-white transition-colors">
            Helpdesk Details
          </a>
          <span>|</span>
          <a href="#policies" className="hover:text-white transition-colors">
            Website Policies
          </a>
          <span>|</span>
          <a href="#password" className="hover:text-white transition-colors">
            Password Policy
          </a>
          <span>|</span>
          <a href="#sitemap" className="hover:text-white transition-colors">
            Sitemap
          </a>
        </div>
        <div className="text-center md:text-right">
          <p>#Visitors: <span className="font-semibold">2,205,095,455</span></p>
          <p>#e-Praaman: <span className="font-semibold">958,512</span></p>
        </div>
      </div>
    </footer>
  );
}
