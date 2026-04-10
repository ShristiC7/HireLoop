import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Briefcase, TrendingUp } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-md bg-white/10 border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Hire<span className="text-purple-400">Loop</span>
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Connect Students with
              <span className="gradient-text block mt-2">Dream Companies</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              HireLoop is a modern campus recruitment platform that bridges the gap between students and companies. Fair, transparent, and designed for success.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all hover:gap-3 group"
            >
              Start Your Journey <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-4xl font-bold text-white text-center mb-16">Why Choose HireLoop?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users size={32} />,
                title: 'For Students',
                desc: 'Discovery, Resume building, Mock interviews, and Application tracking all in one place'
              },
              {
                icon: <Briefcase size={32} />,
                title: 'For Recruiters',
                desc: 'Post jobs, manage applicants, and find the best talent efficiently'
              },
              {
                icon: <TrendingUp size={32} />,
                title: 'For Admins',
                desc: 'Manage companies, announcements, and oversee the entire recruitment process'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400/50 hover:bg-white/15 transition-all"
              >
                <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stat: '500+', label: 'Students Registered' },
              { stat: '50+', label: 'Companies Recruiting' },
              { stat: '1000+', label: 'Jobs Available' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-5xl font-bold gradient-text mb-2">{item.stat}</p>
                <p className="text-gray-300 text-lg">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h3>
            <p className="text-white/90 mb-8 text-lg">Join thousands of students and companies already using HireLoop</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Login Now
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 HireLoop. Connecting talent with opportunity.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
