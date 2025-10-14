'use client';

import React, { useState } from 'react';
import { EnrichedCustomer } from '../../types/customer';
import { EnhancedCustomerOrderHistory } from './rewards/EnhancedCustomerOrderHistory';
import { SimpleRewardsView } from './rewards/SimpleRewardsView';

interface CustomerDetailPanelProps {
  customer: EnrichedCustomer | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'orders' | 'rewards' | 'refunds';

export const CustomerDetailPanel: React.FC<CustomerDetailPanelProps> = ({
  customer,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!customer) return null;

  const segmentColor = customer.health.segment === 'vip' ? 'text-white' :
                       customer.health.segment === 'regular' ? 'text-neutral-400' :
                       customer.health.segment === 'at-risk' ? 'text-neutral-500' :
                       'text-neutral-600';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
          style={{
            animation: 'fadeIn 0.3s ease'
          }}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[800px] bg-neutral-950 border-l border-white/10 z-50 overflow-hidden flex flex-col transition-transform duration-400 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-white/10">
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-300 transition-colors"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back to Customers</span>
            </button>
            
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Customer Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-neutral-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-10 h-10 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-light ${segmentColor} uppercase tracking-wider`}
                      style={{ fontFamily: 'Tiempos, serif' }}>
                  {customer.health.segment}
                </span>
                <div className="text-[10px] text-neutral-600 uppercase tracking-wider" style={{ fontFamily: 'Tiempos, serif' }}>
                  Health {customer.health.healthScore}
                </div>
              </div>
              
              <h2 className="text-2xl font-light text-white mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                {customer.display_name}
              </h2>
              
              <div className="flex items-center gap-4 text-sm text-neutral-500" style={{ fontFamily: 'Tiempos, serif' }}>
                <a href={`mailto:${customer.email}`} className="hover:text-neutral-300 transition-colors">
                  {customer.email}
                </a>
                {customer.billing?.phone && (
                  <>
                    <span>•</span>
                    <a href={`tel:${customer.billing.phone}`} className="hover:text-neutral-300 transition-colors">
                      {customer.billing.phone}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-white/5">
            {(['overview', 'orders', 'rewards'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-3 text-sm font-light transition-all duration-200 ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-white -mb-[1px]'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
                style={{ fontFamily: 'Tiempos, serif' }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-neutral-600 font-light mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    Lifetime Value
                  </div>
                  <div className="text-4xl font-extralight text-white tracking-tight" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    ${(customer.lifetimeValue / 1000).toFixed(1)}k
                  </div>
                </div>

                <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-neutral-600 font-light mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    Total Orders
                  </div>
                  <div className="text-4xl font-extralight text-white tracking-tight" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    {customer.totalOrders}
                  </div>
                </div>

                <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-neutral-600 font-light mb-2" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    Points Balance
                  </div>
                  <div className="text-4xl font-extralight text-white tracking-tight" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    {customer.totalPoints}
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 mb-8">
              <div className="text-xs text-neutral-600 font-light mb-4 uppercase tracking-wider" 
                   style={{ fontFamily: 'Tiempos, serif' }}>
                Activity
              </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                      Average Order Value
                    </span>
                    <span className="text-lg text-white font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      ${customer.averageOrderValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                      Orders Per Month
                    </span>
                    <span className="text-lg text-white font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      {customer.health.ordersPerMonth.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                      Last Order
                    </span>
                    <span className="text-lg text-white font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      {customer.health.daysSinceLastOrder < 1 ? 'Today' :
                       customer.health.daysSinceLastOrder === 1 ? 'Yesterday' :
                       `${customer.health.daysSinceLastOrder} days ago`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600" style={{ fontFamily: 'Tiempos, serif' }}>
                      Customer Since
                    </span>
                    <span className="text-lg text-white font-light" style={{ fontFamily: 'Tiempos, serif' }}>
                      {customer.date_created 
                        ? new Date(customer.date_created).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Address Information */}
              <div className="grid grid-cols-2 gap-6">
                {/* Billing Address */}
                {customer.billing && (
                  <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                    <div className="text-xs text-neutral-600 font-light mb-4 uppercase tracking-wider" 
                         style={{ fontFamily: 'Tiempos, serif' }}>
                      Billing
                    </div>
                    <div className="text-sm text-neutral-400 space-y-1" style={{ fontFamily: 'Tiempos, serif' }}>
                      {customer.billing.first_name && customer.billing.last_name && (
                        <div>{customer.billing.first_name} {customer.billing.last_name}</div>
                      )}
                      {customer.billing.address_1 && <div>{customer.billing.address_1}</div>}
                      {customer.billing.address_2 && <div>{customer.billing.address_2}</div>}
                      {(customer.billing.city || customer.billing.state || customer.billing.postcode) && (
                        <div>
                          {customer.billing.city}
                          {customer.billing.city && customer.billing.state && ', '}
                          {customer.billing.state} {customer.billing.postcode}
                        </div>
                      )}
                      {customer.billing.country && <div>{customer.billing.country}</div>}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-neutral-600 font-light mb-4 uppercase tracking-wider" 
                       style={{ fontFamily: 'Tiempos, serif' }}>
                    Contact
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-neutral-600 mb-1" style={{ fontFamily: 'Tiempos, serif' }}>
                        Email
                      </div>
                      <a 
                        href={`mailto:${customer.email}`}
                        className="text-sm text-white hover:text-neutral-300 transition-colors"
                        style={{ fontFamily: 'Tiempos, serif' }}
                      >
                        {customer.email}
                      </a>
                    </div>
                    {customer.billing?.phone && (
                      <div>
                        <div className="text-xs text-neutral-600 mb-1" style={{ fontFamily: 'Tiempos, serif' }}>
                          Phone
                        </div>
                        <a 
                          href={`tel:${customer.billing.phone}`}
                          className="text-sm text-white hover:text-neutral-300 transition-colors"
                          style={{ fontFamily: 'Tiempos, serif' }}
                        >
                          {customer.billing.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="p-8">
              <EnhancedCustomerOrderHistory userId={customer.id} initialPerPage={15} />
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="p-8">
              <SimpleRewardsView
                userId={customer.id}
                userName={customer.display_name}
                isAdmin={true}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-8 py-6 border-t border-white/10 bg-neutral-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              className="flex-1 px-6 py-3 bg-transparent border border-white/10 rounded-xl text-sm font-light text-white hover:bg-white/5 transition-all duration-200"
              style={{ fontFamily: 'Tiempos, serif' }}
              onClick={() => setActiveTab('orders')}
            >
              View Orders
            </button>
            <button
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-light text-white transition-all duration-200"
              style={{ fontFamily: 'Tiempos, serif' }}
              onClick={() => {
                // TODO: Implement start new order
                console.log('Start new order for customer:', customer.id);
              }}
            >
              New Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

