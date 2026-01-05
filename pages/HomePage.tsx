import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { LayoutTemplateIcon, ImagePlusIcon, SparklesIcon, CheckIcon, ArrowRightIcon } from '../components/icons/LucideIcons';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display text-white mb-6">
              Create Stunning Visuals
              <br />
              <span className="text-blue-100">with AI Power</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Generate professional thumbnails, product photos, and creative images in seconds. No design skills required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 shadow-xl">
                  Start Free Trial
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="bg-blue-700 border-blue-600 text-white hover:bg-blue-800">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-blue-100 text-sm mt-4">Free plan includes 10 generations per month. No credit card required.</p>
          </motion.div>
        </div>
      </div>

      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 dark:text-white mb-4">
              Powerful Features for Creators
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to create professional-quality images with AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <LayoutTemplateIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI Thumbnails</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create eye-catching thumbnails that boost your click-through rates with AI-powered design
                </p>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
                  <ImagePlusIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Product Photography</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Transform product images into professional photoshoots with custom backgrounds and lighting
                </p>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4">
                  <SparklesIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Creative Reimaginer</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate unique images from text or transform existing images with creative AI editing
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Free</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">$0</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">10 image generations/month</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Basic support</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Standard quality</span>
                </li>
              </ul>
              <Link to="/signup">
                <Button variant="secondary" className="w-full">Get Started</Button>
              </Link>
            </Card>

            <Card className="relative ring-2 ring-primary">
              <div className="absolute top-0 right-6 transform -translate-y-1/2">
                <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold bg-primary text-white">
                  Most Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pro</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">$19</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">500 image generations/month</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Priority support</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">HD quality</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Commercial use</span>
                </li>
              </ul>
              <Link to="/signup">
                <Button className="w-full">Get Started</Button>
              </Link>
            </Card>

            <Card>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Enterprise</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">$99</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">5000 image generations/month</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">24/7 support</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">API access</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Custom models</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-success mt-0.5 mr-3" />
                  <span className="text-gray-600 dark:text-gray-400">Team collaboration</span>
                </li>
              </ul>
              <Link to="/signup">
                <Button variant="secondary" className="w-full">Get Started</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold font-display mb-4">Promofye</h3>
              <p className="text-gray-400">
                AI-powered image generation platform for creators and businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/signup" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/signup" className="hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Promofye. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const DashboardHome: React.FC = () => {
  const { profile, subscription } = useAuth();

  console.log('DashboardHome rendering - Profile:', profile, 'Subscription:', subscription);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display text-gray-900 dark:text-white mb-2">
            Welcome back, {profile?.full_name || 'Creator'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You're on the <span className="font-semibold text-primary">{subscription?.subscription_plans?.name || 'Free'}</span> plan
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link to="/editor">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <LayoutTemplateIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Thumbnail</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Design eye-catching thumbnails for your content
                </p>
              </Card>
            </motion.div>
          </Link>

          <Link to="/product">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
                  <ImagePlusIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Product Photoshoot</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Transform products into professional photos
                </p>
              </Card>
            </motion.div>
          </Link>

          <Link to="/reimaginer">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="h-full cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-4">
                  <SparklesIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reimagine</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Generate or transform images with AI
                </p>
              </Card>
            </motion.div>
          </Link>
        </div>

        {profile?.is_admin && (
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Admin Access</h3>
                <p className="text-blue-100">Manage users, API keys, and subscriptions</p>
              </div>
              <Link to="/admin">
                <Button className="bg-white text-primary hover:bg-gray-100">
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('HomePage - User:', user, 'Loading:', loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardHome /> : <LandingPage />;
};

export default HomePage;
