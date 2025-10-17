'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrainingPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const sections = [
    { id: 'overview', name: 'The Blueprint', icon: '💎' },
    { id: 'opening', name: 'Opening the Bag', icon: '🔓' },
    { id: 'drops', name: 'Securing the Stash', icon: '💰' },
    { id: 'closing', name: 'Counting the Take', icon: '💵' },
    { id: 'reconciliation', name: 'Daily Check-In', icon: '📊' },
    { id: 'deposits', name: 'Banking Runs', icon: '🏦' },
    { id: 'tips', name: 'Pro Moves', icon: '⭐' },
  ];

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="border-b border-emerald-500/20 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <img 
                  src="/logo123.png" 
                  alt="Flora Distro" 
                  className="h-14 w-14"
                />
                <div>
                  <h1 className="text-5xl font-bold text-emerald-400 tracking-wide mb-2" 
                      style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
                    FLORA DISTRO
                  </h1>
                  <p className="text-3xl font-bold text-white tracking-wider" 
                     style={{ fontFamily: 'DonGraffiti, sans-serif', letterSpacing: '0.1em' }}>
                    CA$H MANAGEMENT
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-emerald-400 uppercase tracking-widest mb-2 font-semibold" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                how to secure the bag
              </div>
              <a
                href="/"
                className="text-base text-neutral-400 hover:text-emerald-400 transition-colors lowercase font-medium"
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                ← back to dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <div className="sticky top-32">
              <nav className="space-y-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 ${
                      activeSection === section.id
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                        : 'bg-white/[0.02] border-white/5 text-neutral-300 hover:bg-white/[0.04] hover:text-white'
                    } border`}
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{section.icon}</span>
                      <span className="text-base font-medium">{section.name}</span>
                    </div>
                  </button>
                ))}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 p-6 bg-black/40 rounded-xl border border-emerald-500/20">
                <div className="text-sm text-emerald-400 uppercase tracking-wider mb-4 font-semibold" 
                     style={{ fontFamily: 'Tiempos, serif' }}>
                  Quick Stats
                </div>
                <div className="space-y-3 text-base" style={{ fontFamily: 'Tiempos, serif' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300 font-medium">Sections</span>
                    <span className="text-white font-semibold">{sections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300 font-medium">Est. Time</span>
                    <span className="text-white font-semibold">30 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-300 font-medium">Level</span>
                    <span className="text-emerald-400 font-semibold">Beginner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeSection === 'overview' && <OverviewSection />}
                {activeSection === 'opening' && <OpeningDrawerSection toggleStep={toggleStep} expandedStep={expandedStep} />}
                {activeSection === 'drops' && <CashDropsSection toggleStep={toggleStep} expandedStep={expandedStep} />}
                {activeSection === 'closing' && <ClosingDrawerSection toggleStep={toggleStep} expandedStep={expandedStep} />}
                {activeSection === 'reconciliation' && <ReconciliationSection />}
                {activeSection === 'deposits' && <DepositsSection />}
                {activeSection === 'tips' && <BestPracticesSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection() {
  return (
    <div className="space-y-8">
      <div className="mb-12">
        <h2 className="text-6xl font-bold text-emerald-400 mb-6 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          THE BLUEPRINT
        </h2>
        <p className="text-xl text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          Everything you need to know about running your register game tight. Master the cash flow, 
          keep your drawers balanced, and secure that bag properly. Let's get it 💰
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FeatureCard
          icon="🔓"
          title="Opening the Bag"
          description="Start your shift right. Set up your register with the proper float and get that money moving."
        />
        <FeatureCard
          icon="💰"
          title="Securing the Stash"
          description="When your drawer's getting heavy (>$500), drop that cash to the safe. Keep it secure, keep it moving."
        />
        <FeatureCard
          icon="💵"
          title="Counting the Take"
          description="End of shift? Time to count every dollar. Bill by bill method keeps you accurate and your numbers clean."
        />
        <FeatureCard
          icon="📊"
          title="Daily Check-In"
          description="Review your numbers, check your variance, and make sure everything adds up. Stay on point."
        />
      </div>

      <div className="bg-gradient-to-br from-emerald-500/20 to-yellow-500/10 border border-emerald-500/30 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💎</div>
          <div>
            <h3 className="text-2xl font-bold text-emerald-400 mb-2" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
              GAME RULE #1: ACCURACY OVER SPEED
            </h3>
            <p className="text-neutral-200" style={{ fontFamily: 'Tiempos, serif' }}>
              Slow money is better than no money. Take your time counting that cash. Double-check everything. 
              A few extra minutes of being precise saves you hours of headaches later. Fast and sloppy gets you caught up. 
              Slow and accurate keeps you on top. That's how you win the game.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          WHAT YOU'LL MASTER
        </h3>
        <ul className="space-y-3">
          {[
            'Opening your drawer with the right float - set yourself up for success',
            'Knowing when to drop cash to the safe - keep it secure when it gets heavy',
            'Two counting methods: quick total vs. bill-by-bill (the pro way)',
            'Reading variance colors - green means go, red means investigate',
            'Daily check-ins to keep your numbers tight and your game clean',
            'Banking runs and deposit procedures - getting that money to the bank',
            'Security protocols to protect yourself and the business'
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-neutral-200" style={{ fontFamily: 'Tiempos, serif' }}>
              <span className="text-emerald-400 mt-1 text-lg">💎</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Opening Drawer Section
function OpeningDrawerSection({ toggleStep, expandedStep }: { toggleStep: (id: string) => void; expandedStep: string | null }) {
  const steps = [
    {
      id: 'step1',
      title: 'Hit the Ca$h Management Button',
      description: 'Click that money icon in the sidebar',
      details: 'Look for the dollar sign icon on the left side of your screen. This opens the main dashboard where you can see all your cash game - how much you got, where it\'s at, all that.'
    },
    {
      id: 'step2',
      title: 'Pull Up Drawer Controls',
      description: 'Click "Manage Drawer" to access your controls',
      details: 'You\'ll find this in the details section. If you don\'t see it, click "show details" first to expand everything. This is your command center for all drawer operations.'
    },
    {
      id: 'step3',
      title: 'Start Your Session',
      description: 'Hit "Open Drawer" to get started',
      details: 'This option only shows when no drawer is open. If you see "close drawer" instead, someone else got a session running. Close that first, then start yours.'
    },
    {
      id: 'step4',
      title: 'Set Your Float',
      description: 'Enter your register name and opening cash amount',
      details: 'Register Name: Keep it simple - "Register 1", "Front Counter", whatever. Opening Float: Usually $200-$350 depending on your location. Notes: Add anything important like "Morning shift" or "Training day".'
    },
    {
      id: 'step5',
      title: 'Lock It In',
      description: 'Hit that "Open Drawer" button and you\'re live',
      details: 'System creates your session and starts tracking everything. You\'ll see your opening time, float amount, and it\'ll track every dollar that moves. You\'re officially on the clock.'
    }
  ];

  return (
    <div className="space-y-10">
      <div className="mb-12">
        <h2 className="text-6xl font-bold text-emerald-400 mb-6 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          OPENING THE BAG
        </h2>
        <p className="text-xl text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          Start your shift right. Get that drawer open, float counted, and ready to make that money move.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            number={index + 1}
            title={step.title}
            description={step.description}
            details={step.details}
            isExpanded={expandedStep === step.id}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </div>

      <InfoBox
        type="success"
        title="You're Live ✓"
        content="Drawer's active and tracking every dollar. System shows your float, your sales, your expected total - all in real-time. Everything's monitored. Keep it clean."
      />

      <InfoBox
        type="warning"
        title="One Drawer Rule"
        content="Only one drawer per location at a time. Need to switch registers? Close the current session first, then start yours. No overlapping - that's how numbers get messy."
      />
    </div>
  );
}

// Cash Drops Section  
function CashDropsSection({ toggleStep, expandedStep }: { toggleStep: (id: string) => void; expandedStep: string | null }) {
  const steps = [
    {
      id: 'drop1',
      title: 'Check Your Stack',
      description: 'Count that drawer - you sitting on more than $500?',
      details: 'Quick count your drawer. If you got more than $500 cash sitting there, it\'s time to drop some to the safe. Company policy says drop it when it gets heavy - that\'s for security and your protection.'
    },
    {
      id: 'drop2',
      title: 'Pull Up Controls',
      description: 'Hit "Manage Drawer" to access your setup',
      details: 'Click "manage drawer" from the cash management dashboard. This brings up all your controls. Same spot you opened from, now you\'re managing your active session.'
    },
    {
      id: 'drop3',
      title: 'Hit Record Drop',
      description: 'Click that "Record Cash Drop" button',
      details: 'This opens the drop form where you document exactly how much you\'re moving to the safe. System needs to know every dollar that moves - keep the paper trail clean.'
    },
    {
      id: 'drop4',
      title: 'Document the Move',
      description: 'Enter how much and why you\'re dropping it',
      details: 'Amount: Usually $150-$300 depending on how heavy you are. Notes: Be specific - "Lunch rush drop", "Hit $650 limit", whatever. Documentation keeps you covered.'
    },
    {
      id: 'drop5',
      title: 'Secure It',
      description: 'Lock it in the system, then move that cash to the safe',
      details: 'Hit "record drop" in the system first, then physically remove that cash from your drawer and put it in the safe. Follow your location\'s safe drop procedure. System tracks it all - your drawer total updates automatically.'
    }
  ];

  return (
    <div className="space-y-10">
      <div className="mb-12">
        <h2 className="text-6xl font-bold text-emerald-400 mb-6 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          SECURING THE STASH
        </h2>
        <p className="text-xl text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          When that drawer gets heavy, it's time to drop. Keep your money secure and your count clean.
        </p>
      </div>

      <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-2xl p-8">
        <div className="flex items-start gap-6">
          <div className="text-5xl">⚠️</div>
          <div>
            <h3 className="text-2xl font-bold mb-4 text-yellow-400" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
              WHEN TO DROP THAT CA$H
            </h3>
            <ul className="space-y-3 text-neutral-200 text-base font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Drawer sitting on more than $500 (that's a security risk)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>During rushes - lunch, dinner, whenever it's busy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Any time you feel sketchy about how much cash you got</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>Follow your location's rules - they know what's up</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            number={index + 1}
            title={step.title}
            description={step.description}
            details={step.details}
            isExpanded={expandedStep === step.id}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </div>

      <InfoBox
        type="success"
        title="Pro Move: Drop Early"
        content="Don't wait till you hit $500. Drop that cash during rushes when you're getting heavy. Reduces security risk, keeps your drawer clean, and makes counting easier later. Stay ahead of the game."
      />
    </div>
  );
}

// Closing Drawer Section
function ClosingDrawerSection({ toggleStep, expandedStep }: { toggleStep: (id: string) => void; expandedStep: string | null }) {
  return (
    <div className="space-y-10">
      <div className="mb-12">
        <h2 className="text-6xl font-bold text-emerald-400 mb-6 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          COUNTING THE TAKE
        </h2>
        <p className="text-xl text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          End of shift means count time. Bill by bill method keeps your numbers tight and your variance zero. Let's lock it in.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-8">
          <div className="text-5xl mb-6">🔢</div>
          <h3 className="text-2xl font-semibold mb-4 text-white" style={{ fontFamily: 'Tiempos, serif' }}>
            Method 1: Total Amount
          </h3>
          <p className="text-neutral-300 mb-6 text-base font-medium leading-relaxed" style={{ fontFamily: 'Tiempos, serif' }}>
            Quick method - just count all your cash and enter the total.
          </p>
          <div className="space-y-3 text-base text-neutral-300 font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
            <div className="flex items-center gap-3">
              <span className="text-yellow-500 text-xl">⚡</span>
              <span>Faster to complete</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <span>Less accurate</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 text-xl">📝</span>
              <span>No audit trail</span>
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-8">
          <div className="text-5xl mb-6">💵</div>
          <h3 className="text-2xl font-bold mb-4 text-emerald-400" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
            METHOD 2: BILL BY BILL ⭐
          </h3>
          <p className="text-neutral-100 mb-6 text-base font-medium leading-relaxed" style={{ fontFamily: 'Tiempos, serif' }}>
            The pro way - count each denomination stack separately.
          </p>
          <div className="space-y-3 text-base text-neutral-100 font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <span>Way more accurate</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <span>Complete audit trail</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 text-xl">✓</span>
              <span>Spot errors instantly</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          COUNTING EACH STACK
        </h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { denomination: '$100', color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
            { denomination: '$50', color: 'text-pink-400', bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
            { denomination: '$20', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
            { denomination: '$10', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
            { denomination: '$5', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
            { denomination: '$1', color: 'text-neutral-300', bg: 'bg-white/10', border: 'border-white/20' }
          ].map((bill) => (
            <div key={bill.denomination} className={`${bill.bg} ${bill.border} border rounded-xl p-6 text-center`}>
              <div className={`text-4xl font-bold mb-3 ${bill.color}`} style={{ fontFamily: 'Tiempos, serif' }}>
                {bill.denomination}
              </div>
              <div className="text-sm text-neutral-300 font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
                Count how many
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 mt-12">
        <h3 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          VARIANCE COLOR CODE
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-8">
            <div className="text-5xl mb-4">🟢</div>
            <div className="text-2xl font-bold mb-3 text-emerald-400" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
              GREEN: ON POINT
            </div>
            <div className="text-xl text-neutral-200 mb-4 font-semibold" style={{ fontFamily: 'Tiempos, serif' }}>
              $0 - $5 variance
            </div>
            <div className="text-base text-neutral-300 font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
              Perfect! You balanced. No action needed. That's how it's done.
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-8">
            <div className="text-5xl mb-4">🟡</div>
            <div className="text-2xl font-bold mb-3 text-yellow-400" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
              YELLOW: ACCEPTABLE
            </div>
            <div className="text-xl text-neutral-200 mb-4 font-semibold" style={{ fontFamily: 'Tiempos, serif' }}>
              $5 - $10 variance
            </div>
            <div className="text-base text-neutral-300 font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
              Okay but document why. Write that note explaining what happened.
            </div>
          </div>

          <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-8">
            <div className="text-5xl mb-4">🔴</div>
            <div className="text-2xl font-bold mb-3 text-red-400" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
              RED: PROBLEM
            </div>
            <div className="text-xl text-neutral-200 mb-4 font-semibold" style={{ fontFamily: 'Tiempos, serif' }}>
              Over $10 variance
            </div>
            <div className="text-base text-neutral-300 font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
              Stop. Recount everything. Get manager. Investigate now.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reconciliation Section
function ReconciliationSection() {
  return (
    <div className="space-y-10">
      <div className="mb-12">
        <h2 className="text-6xl font-bold text-emerald-400 mb-6 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          DAILY CHECK-IN
        </h2>
        <p className="text-xl text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          End of day review. Check every session, verify all numbers, investigate anything off. Keep your books tight.
        </p>
      </div>

      <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-10">
        <h3 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          WHAT'S THE CHECK-IN?
        </h3>
        <p className="text-neutral-200 mb-8 leading-loose text-lg font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          It's your daily audit. You review every drawer session, check if the numbers match up, investigate anything that looks off, 
          and make sure everything's documented. This keeps you accountable and catches problems quick before they become headaches.
        </p>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-base uppercase tracking-wider text-emerald-400 mb-5 font-bold" style={{ fontFamily: 'Tiempos, serif' }}>
              What to Review
            </h4>
            <ul className="space-y-4 text-neutral-200 text-base font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>All drawer sessions for the day</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>Expected vs actual amounts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>Variance patterns and trends</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>Cash drop documentation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1 text-lg">•</span>
                <span>Notes and explanations</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base uppercase tracking-wider text-yellow-400 mb-5 font-bold" style={{ fontFamily: 'Tiempos, serif' }}>
              When to Investigate
            </h4>
            <ul className="space-y-4 text-neutral-200 text-base font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1 text-lg">•</span>
                <span>Variance over $5 without notes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400 mt-1 text-lg">•</span>
                <span>Same cashier always coming up short</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1 text-lg">•</span>
                <span>Any variance over $10</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1 text-lg">•</span>
                <span>Missing cash drop records</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1 text-lg">•</span>
                <span>Sketchy transaction patterns</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <InfoBox
        type="info"
        title="Timing Is Everything"
        content="Do this right after all drawers close for the day. Details are fresh, everyone's still around if you need to ask questions. Takes 15-30 minutes. Don't sleep on it - handle it same day."
      />
    </div>
  );
}

// Deposits Section
function DepositsSection() {
  return (
    <div className="space-y-10">
      <div className="mb-12">
        <h2 className="text-6xl font-bold text-emerald-400 mb-6 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          BANKING RUNS
        </h2>
        <p className="text-xl text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          Getting that money to the bank. Weekly runs, proper documentation, security protocols. Let's move it safely.
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/40 rounded-2xl p-10">
        <div className="text-6xl mb-6">💰</div>
        <h3 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          THE WEEKLY RUN
        </h3>
        <p className="text-neutral-100 mb-8 text-lg font-medium leading-relaxed" style={{ fontFamily: 'Tiempos, serif' }}>
          Most spots do deposits weekly - usually Monday morning for last week's take. 
          Check with your manager for your location's specific schedule. Stay consistent.
        </p>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-black/60 rounded-xl p-6 border border-white/10">
            <div className="text-sm text-emerald-400 mb-3 font-semibold uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
              Frequency
            </div>
            <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Tiempos, serif' }}>
              Weekly
            </div>
          </div>
          <div className="bg-black/60 rounded-xl p-6 border border-white/10">
            <div className="text-sm text-emerald-400 mb-3 font-semibold uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
              Typical Amount
            </div>
            <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Tiempos, serif' }}>
              $3k-$8k
            </div>
          </div>
          <div className="bg-black/60 rounded-xl p-6 border border-white/10">
            <div className="text-sm text-emerald-400 mb-3 font-semibold uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
              Process Time
            </div>
            <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Tiempos, serif' }}>
              30-45 min
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-8">
        <h3 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          THE DEPOSIT RUNDOWN
        </h3>
        <div className="space-y-4">
          {[
            'Check the week total in the system',
            'Open the safe, pull out all cash',
            'Sort it by denomination, keep it organized',
            'Count it and verify it matches the system',
            'Fill out the deposit slip properly',
            'Seal everything in the deposit bag',
            'Write down that bag serial number',
            'Take it to the bank (2 person rule - never solo)',
            'Get your receipt from the bank',
            'Update system with receipt number',
            'File all documentation for records'
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4 text-neutral-200 text-base font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg font-bold">
                {index + 1}
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <InfoBox
        type="warning"
        title="Security First"
        content="Two person rule ALWAYS when moving money to the bank. Never roll solo. Never go at the same time every week. Switch it up, stay unpredictable, stay safe. This ain't negotiable."
      />
    </div>
  );
}

// Best Practices Section
function BestPracticesSection() {
  return (
    <div className="space-y-10">
      <div className="mb-12">
        <h2 className="text-6xl font-bold text-emerald-400 mb-6 tracking-wide" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          PRO MOVES
        </h2>
        <p className="text-xl text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
          The winning strategies. Do these and you'll stay clean, balanced, and on top of your game. This is how the pros move.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-8">
          <div className="text-5xl mb-6">✅</div>
          <h3 className="text-3xl font-bold mb-6 text-emerald-400" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
            WINNING PLAYS
          </h3>
          <ul className="space-y-4 text-neutral-100 text-base font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 text-xl">•</span>
              <span>Count opening float carefully - set yourself up right</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 text-xl">•</span>
              <span>Record drops immediately - don't sleep on it</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 text-xl">•</span>
              <span>Use bill counting method - the pro way</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 text-xl">•</span>
              <span>Document all variances - cover yourself</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 text-xl">•</span>
              <span>Keep drawer organized - saves time later</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 text-xl">•</span>
              <span>Close drawer at shift end - finish strong</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-400 mt-1 text-xl">•</span>
              <span>Ask questions when unsure - no dumb questions</span>
            </li>
          </ul>
        </div>

        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-8">
          <div className="text-5xl mb-6">❌</div>
          <h3 className="text-3xl font-bold mb-6 text-red-400" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
            LOSING PLAYS
          </h3>
          <ul className="space-y-4 text-neutral-100 text-base font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1 text-xl">•</span>
              <span>Rushing the count - that's how you mess up</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1 text-xl">•</span>
              <span>Skipping drop records - leaves holes in your audit</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1 text-xl">•</span>
              <span>Ignoring big variances - problems don't fix themselves</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1 text-xl">•</span>
              <span>Leaving drawer open unattended - security risk</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1 text-xl">•</span>
              <span>Weak notes - "short" doesn't explain anything</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1 text-xl">•</span>
              <span>No documentation - leaves you exposed</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1 text-xl">•</span>
              <span>Going solo on big issues - get backup</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-10">
        <h3 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
          GAME FROM THE VETS
        </h3>
        <div className="grid grid-cols-1 gap-6">
          {[
            {
              icon: '⏰',
              title: 'Smart Timing',
              tip: 'Count your drawer during slow periods, not at close. Catch issues early when you got time to fix them. Don\'t wait till you\'re trying to bounce - that\'s when mistakes happen.'
            },
            {
              icon: '📝',
              title: 'Document Everything',
              tip: 'Write that note RIGHT when something happens. Wait till closing and you\'ll forget half the details. Fresh memory = accurate notes = you\'re covered.'
            },
            {
              icon: '🔍',
              title: 'Stay Organized',
              tip: 'Sort bills same direction before counting. Simple move that cuts errors way down and speeds up your count. Organization = accuracy = no variance.'
            },
            {
              icon: '🤝',
              title: 'Speak Up',
              tip: 'Unsure about something? Ask your supervisor immediately. Better to ask a "simple" question than make an expensive mistake. Smart players know when to get help.'
            }
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-6 p-6 bg-neutral-900/60 rounded-xl border border-white/10">
              <div className="text-4xl">{item.icon}</div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: 'Tiempos, serif' }}>
                  {item.title}
                </h4>
                <p className="text-neutral-200 text-base leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
                  {item.tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-2xl p-10">
        <div className="flex items-start gap-6">
          <div className="text-6xl">🏆</div>
          <div className="flex-1">
            <h3 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: 'DonGraffiti, sans-serif' }}>
              EXCELLENCE METRICS
            </h3>
            <p className="text-neutral-100 mb-8 text-lg font-medium leading-relaxed" style={{ fontFamily: 'Tiempos, serif' }}>
              You're winning when you consistently hit these numbers. This is pro-level performance:
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-black/60 rounded-xl p-6 border border-emerald-500/30">
                <div className="text-emerald-400 text-4xl mb-3 font-bold">{"<$3"}</div>
                <div className="text-base text-neutral-200 font-semibold" style={{ fontFamily: 'Tiempos, serif' }}>
                  Average variance
                </div>
              </div>
              <div className="bg-black/60 rounded-xl p-6 border border-emerald-500/30">
                <div className="text-emerald-400 text-4xl mb-3 font-bold">{"<10min"}</div>
                <div className="text-base text-neutral-200 font-semibold" style={{ fontFamily: 'Tiempos, serif' }}>
                  Closing time
                </div>
              </div>
              <div className="bg-black/60 rounded-xl p-6 border border-emerald-500/30">
                <div className="text-emerald-400 text-4xl mb-3 font-bold">100%</div>
                <div className="text-base text-neutral-200 font-semibold" style={{ fontFamily: 'Tiempos, serif' }}>
                  Drop compliance
                </div>
              </div>
              <div className="bg-black/60 rounded-xl p-6 border border-emerald-500/30">
                <div className="text-emerald-400 text-4xl mb-3 font-bold">100%</div>
                <div className="text-base text-neutral-200 font-semibold" style={{ fontFamily: 'Tiempos, serif' }}>
                  Documentation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-8 hover:bg-black/60 hover:border-emerald-500/40 transition-all duration-300">
      <div className="text-5xl mb-5">{icon}</div>
      <h3 className="text-2xl font-semibold mb-4 text-white" style={{ fontFamily: 'Tiempos, serif' }}>
        {title}
      </h3>
      <p className="text-neutral-300 text-base leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
        {description}
      </p>
    </div>
  );
}

function StepCard({ 
  number, 
  title, 
  description, 
  details, 
  isExpanded, 
  onToggle 
}: { 
  number: number; 
  title: string; 
  description: string; 
  details: string; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 hover:border-emerald-500/30 transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full p-8 text-left flex items-start gap-6"
      >
        <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-2xl flex-shrink-0"
             style={{ fontFamily: 'Tiempos, serif' }}>
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2 text-white" style={{ fontFamily: 'Tiempos, serif' }}>
            {title}
          </h3>
          <p className="text-base text-neutral-300 font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
            {description}
          </p>
        </div>
        <div className={`text-neutral-400 transition-transform duration-300 text-xl ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 pl-28">
              <div className="bg-neutral-900/80 rounded-xl p-6 border border-emerald-500/10">
                <p className="text-base text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
                  {details}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoBox({ type, title, content }: { type: 'success' | 'warning' | 'info'; title: string; content: string }) {
  const colors = {
    success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/40',
    warning: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/40',
    info: 'from-blue-500/20 to-blue-500/5 border-blue-500/40'
  };

  const icons = {
    success: '✓',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[type]} border rounded-xl p-8`}>
      <div className="flex items-start gap-6">
        <div className="text-4xl">{icons[type]}</div>
        <div>
          <h4 className="text-xl font-semibold mb-3 text-white" style={{ fontFamily: 'Tiempos, serif' }}>
            {title}
          </h4>
          <p className="text-base text-neutral-200 leading-relaxed font-medium" style={{ fontFamily: 'Tiempos, serif' }}>
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

