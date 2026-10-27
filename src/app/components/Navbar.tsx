import { LayoutDashboard, Shield } from "lucide-react";
import { Link } from "../nav";

function KalaLogoMark({ size = 36 }: { size?: number }) {
  const s = size;
  return (
    <svg width={s} height={Math.round(s * 1.15)} viewBox="0 0 50 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Vertical bar of K */}
      <line x1="11" y1="6" x2="11" y2="52" stroke="#C9960A" strokeWidth="4.5" strokeLinecap="round" />
      {/* Upper arm */}
      <path d="M11 29 Q28 18 38 7" stroke="#C9960A" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Lower arm */}
      <path d="M11 29 Q28 40 38 51" stroke="#C9960A" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Oval loop (A form) */}
      <ellipse cx="33" cy="29" rx="15" ry="21" stroke="#C9960A" strokeWidth="2.5" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <nav className="bg-[#0D1B3E] shadow-lg border-b border-[#C9960A]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <KalaLogoMark size={34} />
            <span className="text-[#C9960A] font-bold text-xl tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
              KALA
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-[#EDE8D5] hover:text-[#C9960A] transition px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Agent Portal</span>
            </Link>
            <Link
              to="/admin"
              className="flex items-center gap-2 bg-[#C9960A] text-[#0D1B3E] px-4 py-2 rounded-lg hover:bg-[#E8B84B] transition font-semibold text-sm"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
