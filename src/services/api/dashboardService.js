import React from "react";
import { getDeals } from "@/services/api/dealsService";
import { getSalesReps } from "@/services/api/salesRepService";
import { getLeads, getPendingFollowUps } from "@/services/api/leadsService";
import dashboardData from "@/services/mockData/dashboard.json";
import Error from "@/components/ui/Error";
// Dashboard Service - Centralized data management for dashboard components

// Standardized API delay for consistent UX
const API_DELAY = 300;

// Helper function to simulate API calls with consistent delay
const simulateAPICall = (delay = API_DELAY) => 
  new Promise(resolve => setTimeout(resolve, delay));

// Helper function to safely access external services
const safeServiceCall = async (serviceCall, fallback = null) => {
  try {
    return await serviceCall();
  } catch (error) {
    console.warn('Service call failed, using fallback:', error.message);
    return fallback;
  }
};

// Helper function to get current date with consistent timezone handling
const getCurrentDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// Helper function to calculate date ranges
const getDateRange = (period) => {
  const today = getCurrentDate();
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      return {
        start: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        end: today
      };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        start: weekStart,
        end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    case 'month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 1)
      };
    default:
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
  }
};

// Helper function to validate and sanitize user input
const validateUserId = (userId) => {
  if (typeof userId === 'string') {
    const parsed = parseInt(userId, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return typeof userId === 'number' ? userId : null;
};

// Core dashboard metrics from static data
export const getDashboardMetrics = async () => {
  await simulateAPICall();
  
  if (!dashboardData?.metrics || !Array.isArray(dashboardData.metrics)) {
    throw new Error('Invalid dashboard metrics data structure');
  }
  
  return dashboardData.metrics.map(metric => ({
    ...metric,
    id: metric.id || Math.random(),
    value: metric.value || '0',
    trend: metric.trend || 'neutral',
    trendValue: metric.trendValue || '0%'
  }));
};

// Recent activity from static data
export const getRecentActivity = async () => {
  await simulateAPICall();
  
  if (!dashboardData?.recentActivity || !Array.isArray(dashboardData.recentActivity)) {
    throw new Error('Invalid recent activity data structure');
  }
  
  return dashboardData.recentActivity.map(activity => ({
    ...activity,
    id: activity.id || Math.random(),
    time: activity.time || 'Unknown time',
    type: activity.type || 'general'
  }));
};

// Today's meetings from static data
export const getTodaysMeetings = async () => {
  await simulateAPICall();
  
  if (!dashboardData?.todaysMeetings || !Array.isArray(dashboardData.todaysMeetings)) {
    return [];
  }
  
  return dashboardData.todaysMeetings.map(meeting => ({
    ...meeting,
    id: meeting.id || Math.random(),
    title: meeting.title || 'Untitled Meeting',
    time: meeting.time || 'TBD',
    client: meeting.client || meeting.title || 'Unknown Client'
  }));
};

// Pending follow-ups from leads service
export const getPendingFollowUps = async () => {
  await simulateAPICall();
  
  const fallback = [];
  return safeServiceCall(async () => {
    const { getPendingFollowUps } = await import("@/services/api/leadsService");
    const followUps = await getPendingFollowUps();
    
    if (!Array.isArray(followUps)) {
      return fallback;
    }
    
    return followUps.map(followUp => ({
      ...followUp,
      Id: followUp.Id || Math.random(),
      websiteUrl: followUp.website_url || followUp.websiteUrl || 'Unknown URL',
      category: followUp.category || 'General',
      followUpDate: followUp.follow_up_date || followUp.followUpDate || new Date().toISOString()
    }));
  }, fallback);
};

// Lead performance chart data
export const getLeadPerformanceChart = async () => {
  await simulateAPICall();
  
  const fallback = {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    series: [{ name: 'Leads', data: [12, 19, 15, 27, 22, 31, 28] }]
  };
  
  return safeServiceCall(async () => {
    const { getLeads } = await import("@/services/api/leadsService");
    const leadsData = await getLeads();
    
    if (!leadsData || !Array.isArray(leadsData)) {
      return fallback;
    }
    
    // Generate daily chart data for the last 14 days
    const now = new Date();
    const chartData = [];
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLeads = leadsData.filter(lead => {
        const leadDate = (lead.created_at || lead.createdAt || '').split('T')[0];
        return leadDate === dateStr;
      });
      
      chartData.push({
        date: dateStr,
        count: dayLeads.length,
        formattedDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return {
      categories: chartData.map(item => item.formattedDate),
      series: [{
        name: 'Leads',
        data: chartData.map(item => item.count)
      }]
    };
  }, fallback);
};

// Team performance rankings
export const getTeamPerformanceRankings = async () => {
  await simulateAPICall();
  
  const fallback = [];
  
  return safeServiceCall(async () => {
    const { getSalesReps } = await import("@/services/api/salesRepService");
    const salesReps = await getSalesReps();
    
    if (!Array.isArray(salesReps)) {
      return fallback;
    }
    
    return salesReps
      .map(rep => ({
        Id: rep.Id || Math.random(),
        name: rep.Name || rep.name || 'Unknown Rep',
        totalLeads: rep.leads_contacted || rep.leadsContacted || 0,
        weekLeads: Math.floor(Math.random() * 20) + 1,
        todayLeads: Math.floor(Math.random() * 5)
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);
  }, fallback);
};

// Revenue trends data
export const getRevenueTrendsData = async (year = new Date().getFullYear()) => {
  await simulateAPICall();
  
  const fallback = {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    series: [{ name: 'Monthly Revenue', data: [45000, 52000, 48000, 61000, 55000, 67000, 72000, 58000, 63000, 69000, 74000, 81000] }]
  };
  
  return safeServiceCall(async () => {
    const { getDeals } = await import("@/services/api/dealsService");
    const deals = await getDeals();
    
    if (!deals || !Array.isArray(deals)) {
      return fallback;
    }
    
    // Filter deals by selected year and group by month
    const yearDeals = deals.filter(deal => {
      if (!deal.created_at && !deal.createdAt) return false;
      const dealYear = new Date(deal.created_at || deal.createdAt).getFullYear();
      return dealYear === year;
    });
    
    // Group deals by month and calculate monthly revenue
    const monthlyData = yearDeals.reduce((acc, deal) => {
      const createdAt = deal.created_at || deal.createdAt;
      if (!createdAt) return acc;
      
      const month = new Date(createdAt).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { count: 0, revenue: 0 };
      }
      acc[month].count += 1;
      acc[month].revenue += deal.value || 0;
      return acc;
    }, {});
    
    // Generate all months for the selected year
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return `${year}-${month}`;
    });
    
    // Create revenue data for each month
    const trendData = allMonths.map(month => {
      return monthlyData[month] ? monthlyData[month].revenue : 0;
    });
    
    return {
      categories: allMonths.map(month => {
        const date = new Date(month);
        return date.toLocaleDateString('en-US', { month: 'short' });
      }),
      series: [{ name: 'Monthly Revenue', data: trendData }]
    };
  }, fallback);
};

// Detailed recent activity
export const getDetailedRecentActivity = async () => {
  await simulateAPICall();
  
  const fallback = dashboardData.recentActivity || [];
  
  return safeServiceCall(async () => {
    const { getLeads } = await import("@/services/api/leadsService");
    const leadsData = await getLeads();
    
    if (!leadsData || !Array.isArray(leadsData)) {
      return fallback;
    }
    
    const recentLeads = leadsData.slice(0, 10);
    
    const detailedActivity = recentLeads.map(lead => ({
      id: lead.Id || Math.random(),
      title: `New lead added: ${((lead.website_url || lead.websiteUrl) || 'Unknown URL').replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
      type: "contact",
      time: (lead.created_at || lead.createdAt) ? new Date(lead.created_at || lead.createdAt).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : 'Unknown time',
      date: (lead.created_at || lead.createdAt) ? new Date(lead.created_at || lead.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
    }));
    
    // Combine with dashboard activity
    const combinedActivity = [...detailedActivity, ...fallback];
    
    return combinedActivity
      .sort((a, b) => {
        const dateA = new Date(a.date || Date.now());
        const dateB = new Date(b.date || Date.now());
        return dateB - dateA;
      })
      .slice(0, 15);
  }, fallback);
};

// User leads report with period filtering
export const getUserLeadsReport = async (userId, period = 'today') => {
  await simulateAPICall();
  
  const validUserId = validateUserId(userId);
  if (!validUserId) {
    console.warn('Invalid user ID provided:', userId);
    return [];
  }
  
  const fallback = [];
  
  return safeServiceCall(async () => {
    const { getLeads } = await import("@/services/api/leadsService");
    const leadsData = await getLeads();
    
    if (!leadsData || !Array.isArray(leadsData)) {
      return fallback;
    }
    
    const allLeads = leadsData;
    
    // Filter leads by user
    const userLeads = allLeads.filter(lead => 
      (lead.added_by || lead.addedBy) === validUserId
    );
    
    // Get date range for filtering
    const { start: startDate, end: endDate } = getDateRange(period);
    
    // Filter leads by date range
    const filteredLeads = userLeads.filter(lead => {
      const createdAt = lead.created_at || lead.createdAt;
      if (!createdAt) return false;
      
      const leadDate = new Date(createdAt);
      return leadDate >= startDate && leadDate < endDate;
    });
    
// Sort by creation date (most recent first) and ensure data integrity
    return filteredLeads
      .map(lead => ({
        ...lead,
        Id: lead.Id || Math.random(),
        websiteUrl: lead.website_url || lead.websiteUrl || 'Unknown URL',
        category: lead.category || 'General',
        createdAt: lead.created_at || lead.createdAt || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, fallback);
};

// Function to refresh dashboard metrics (called when deals are updated)
export const refreshDashboardMetrics = async () => {
  // This function can be called by other components to trigger dashboard refresh
  // Returns the latest metrics to update dashboard state
  return await getDashboardMetrics();
};