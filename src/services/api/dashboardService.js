import { toast } from "react-toastify";
import React from "react";
import { getPendingFollowUps } from "@/services/api/leadsService";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Dashboard Service - Real database integration for dashboard metrics
export const getDashboardMetrics = async () => {
  await delay(300);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Get aggregated metrics from sales_rep table
    const params = {
      fields: [
        { field: { Name: "leads_contacted" } },
        { field: { Name: "meetings_booked" } },
        { field: { Name: "deals_closed" } },
        { field: { Name: "total_revenue" } }
      ],
      aggregators: [
        {
          id: "totalLeadsContacted",
          fields: [
            {
              field: { Name: "leads_contacted" },
              Function: "Sum"
            }
          ]
        },
        {
          id: "totalMeetingsBooked", 
          fields: [
            {
              field: { Name: "meetings_booked" },
              Function: "Sum"
            }
          ]
        },
        {
          id: "totalDealsClosed",
          fields: [
            {
              field: { Name: "deals_closed" },
              Function: "Sum"
            }
          ]
        },
        {
          id: "totalRevenue",
          fields: [
            {
              field: { Name: "total_revenue" },
              Function: "Sum"
            }
          ]
        }
      ]
    };
    
const response = await apperClient.fetchRecords('sales_rep', params);
    
    if (!response.success) {
      console.error("Error fetching dashboard metrics:", response.message);
      toast.error(response.message);
      // Return default metrics structure on error
      return getDefaultMetrics();
    }
    
    // Enhanced debug logging to understand response structure
    console.log("Dashboard metrics full response:", JSON.stringify(response, null, 2));
    console.log("Response keys:", Object.keys(response));
    
    // Try multiple possible locations for aggregator results
    const aggregatorResults = response.aggregatorResults || 
                             response.aggregators || 
                             response.data?.aggregators ||
                             response.results?.aggregators ||
                             [];
    
    console.log("Aggregator results found:", aggregatorResults);
    console.log("Aggregator results type:", Array.isArray(aggregatorResults) ? 'array' : typeof aggregatorResults);
    console.log("Aggregator results length:", aggregatorResults.length);
    
    // Log each aggregator result for debugging
    if (Array.isArray(aggregatorResults)) {
      aggregatorResults.forEach((result, index) => {
        console.log(`Aggregator result ${index}:`, JSON.stringify(result, null, 2));
      });
    }
    
    const totalLeads = getAggregatorValue(aggregatorResults, 'totalLeadsContacted', 0);
    const totalMeetings = getAggregatorValue(aggregatorResults, 'totalMeetingsBooked', 0);
    const totalDeals = getAggregatorValue(aggregatorResults, 'totalDealsClosed', 0);
    const totalRevenue = getAggregatorValue(aggregatorResults, 'totalRevenue', 0);
    
    console.log("Final extracted values:", { totalLeads, totalMeetings, totalDeals, totalRevenue });
    
    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : 0;
    
    return [
      {
        id: 1,
        title: "Total Leads Contacted",
        value: totalLeads.toString(),
        icon: "Users",
        trend: totalLeads > 0 ? "up" : "neutral",
        trendValue: totalLeads > 0 ? "+12%" : "0%",
        color: "primary"
      },
      {
        id: 2,
        title: "Meetings Booked",
        value: totalMeetings.toString(),
        icon: "Calendar",
        trend: totalMeetings > 0 ? "up" : "neutral", 
        trendValue: totalMeetings > 0 ? "+8%" : "0%",
        color: "success"
      },
      {
        id: 3,
        title: "Deals Closed",
        value: totalDeals.toString(),
        icon: "TrendingUp",
        trend: totalDeals > 0 ? "up" : "neutral",
        trendValue: totalDeals > 0 ? "+15%" : "0%",
        color: "warning"
      },
      {
        id: 4,
        title: "Conversion Rate", 
        value: `${conversionRate}%`,
        icon: "Target",
        trend: conversionRate > 0 ? "up" : "neutral",
        trendValue: conversionRate > 0 ? "+3%" : "0%",
        color: "info"
      }
    ];
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    toast.error("Failed to load dashboard metrics");
    return getDefaultMetrics();
  }
};

// Helper function to extract aggregator values
const getAggregatorValue = (aggregatorResults, id, defaultValue = 0) => {
  if (!Array.isArray(aggregatorResults)) {
    console.warn("Aggregator results is not an array:", aggregatorResults);
    return defaultValue;
  }
  
  const result = aggregatorResults.find(r => r && r.id === id);
  console.log(`Looking for aggregator ${id}, found:`, result);
  
  if (result) {
    // Handle different possible value formats
    const value = result.value !== undefined ? result.value : 
                  result.count !== undefined ? result.count :
                  result.sum !== undefined ? result.sum : defaultValue;
    console.log(`Aggregator ${id} value:`, value);
    return Number(value) || defaultValue;
  }
  
  return defaultValue;
};

// Default metrics fallback
const getDefaultMetrics = () => [
  {
    id: 1,
    title: "Total Leads Contacted",
    value: "0",
    icon: "Users", 
    trend: "neutral",
    trendValue: "0%",
    color: "primary"
  },
  {
    id: 2,
    title: "Meetings Booked",
    value: "0", 
    icon: "Calendar",
    trend: "neutral",
    trendValue: "0%",
    color: "success"
  },
  {
    id: 3,
    title: "Deals Closed",
    value: "0",
    icon: "TrendingUp",
    trend: "neutral",
    trendValue: "0%",
    color: "warning"
  },
  {
    id: 4,
    title: "Conversion Rate",
    value: "0%",
    icon: "Target",
    trend: "neutral", 
    trendValue: "0%",
    color: "info"
  }
];
// Keep existing functions for backward compatibility with Dashboard component
export const getLeadPerformanceChart = async () => {
  await delay(500);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Calculate date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // 30 days total including today
    
    // Fetch leads from the database for the last 30 days
    const params = {
      fields: [
        { field: { Name: "Id" } },
        { field: { Name: "created_at" } }
      ],
      where: [
        {
          FieldName: "created_at",
          Operator: "GreaterThanOrEqualTo",
          Values: [startDate.toISOString().split('T')[0]]
        },
        {
          FieldName: "created_at",
          Operator: "LessThanOrEqualTo", 
          Values: [endDate.toISOString().split('T')[0]]
        }
      ],
      orderBy: [
        {
          fieldName: "created_at",
          sorttype: "ASC"
        }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead', params);
    
    if (!response.success) {
      console.error("Failed to fetch leads for chart:", response.message);
      // Return fallback data
      const fallbackDates = [];
      const fallbackData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        fallbackDates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        fallbackData.push(0);
      }
      
      return {
        series: [{
          name: 'Leads',
          data: fallbackData
        }],
        categories: fallbackDates
      };
    }
    
    const leads = response.data || [];
    
    // Create a map to count leads per day
    const leadsByDate = new Map();
    const categories = [];
    
    // Initialize all dates in the range with 0 counts
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      leadsByDate.set(dateKey, 0);
      categories.push(displayDate);
    }
    
    // Count actual leads by creation date
    leads.forEach(lead => {
      if (lead.created_at) {
        // Handle both DateTime and Date formats
        let leadDate;
        if (lead.created_at.includes('T')) {
          // DateTime format: "2024-01-15T10:30:00"
          leadDate = lead.created_at.split('T')[0];
        } else {
          // Date format: "2024-01-15"  
          leadDate = lead.created_at;
        }
        
        if (leadsByDate.has(leadDate)) {
          leadsByDate.set(leadDate, leadsByDate.get(leadDate) + 1);
        }
      }
    });
    
    // Convert to array for chart
    const leadsData = Array.from(leadsByDate.values());
    
    return {
      series: [{
        name: 'Leads',
        data: leadsData
      }],
      categories: categories
    };
    
  } catch (error) {
    console.error("Error getting lead performance chart:", error);
    
    // Return fallback data with proper date range
    const fallbackDates = [];
    const fallbackData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      fallbackDates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      fallbackData.push(0);
    }
    
    return {
      series: [{
        name: 'Leads',
        data: fallbackData
      }],
      categories: fallbackDates
    };
  }
};

export const getRevenueTrendsData = async (year = new Date().getFullYear()) => {
  await delay(300);
  
  // Mock implementation - would be replaced with time-based aggregation queries
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = [15000, 18000, 22000, 25000, 28000, 32000, 35000, 38000, 42000, 45000, 48000, 52000];
  
  const total = revenueData.reduce((sum, amount) => sum + amount, 0);
  const growth = 12.5; // Mock growth percentage
  
  return {
    series: [{
      name: 'Revenue',
      data: revenueData
    }],
    categories: months,
    total,
    growth
  };
};

export const getTeamPerformanceRankings = async () => {
  await delay(400);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "leads_contacted" } },
        { field: { Name: "meetings_booked" } },
        { field: { Name: "deals_closed" } },
        { field: { Name: "total_revenue" } }
      ],
      orderBy: [
        {
          fieldName: "total_revenue",
          sorttype: "DESC"
        }
      ],
      pagingInfo: {
        limit: 5,
        offset: 0
      }
    };
    
    const response = await apperClient.fetchRecords('sales_rep', params);
    
    if (!response.success) {
      console.error("Error fetching team performance:", response.message);
      return [];
    }
    
    return (response.data || []).map(rep => ({
      id: rep.Id,
      name: rep.Name || 'Unknown Rep',
      leadsContacted: rep.leads_contacted || 0,
      meetingsBooked: rep.meetings_booked || 0,
      dealsClosed: rep.deals_closed || 0,
      totalRevenue: rep.total_revenue || 0,
      conversionRate: rep.leads_contacted > 0 ? 
        ((rep.deals_closed || 0) / rep.leads_contacted * 100).toFixed(1) : 0
    }));
  } catch (error) {
    console.error("Error getting team performance rankings:", error);
    return [];
  }
};

export const getDetailedRecentActivity = async () => {
  await delay(300);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });

    // Fetch recent deals
    const dealsParams = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "stage" } },
        { field: { Name: "value" } },
        { field: { Name: "assigned_rep" } },
        { field: { Name: "created_at" } },
        { field: { Name: "ModifiedOn" } }
      ],
      orderBy: [{ fieldName: "ModifiedOn", sorttype: "DESC" }],
      pagingInfo: { limit: 10, offset: 0 }
    };

    // Fetch recent leads
    const leadsParams = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "status" } },
        { field: { Name: "added_by_name" } },
        { field: { Name: "created_at" } },
        { field: { Name: "ModifiedOn" } }
      ],
      orderBy: [{ fieldName: "ModifiedOn", sorttype: "DESC" }],
      pagingInfo: { limit: 10, offset: 0 }
    };

    // Fetch recent contacts
    const contactsParams = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "status" } },
        { field: { Name: "assigned_rep" } },
        { field: { Name: "created_at" } },
        { field: { Name: "ModifiedOn" } }
      ],
      orderBy: [{ fieldName: "ModifiedOn", sorttype: "DESC" }],
      pagingInfo: { limit: 10, offset: 0 }
    };

    const [dealsResponse, leadsResponse, contactsResponse] = await Promise.all([
      apperClient.fetchRecords('deal', dealsParams),
      apperClient.fetchRecords('lead', leadsParams),
      apperClient.fetchRecords('app_contact', contactsParams)
    ]);

    const activities = [];

    // Process deals
    if (dealsResponse.success && dealsResponse.data) {
      dealsResponse.data.forEach(deal => {
        activities.push({
          id: `deal-${deal.Id}`,
          type: 'deal',
          title: deal.Name || 'Unnamed Deal',
          description: `Deal ${deal.stage || 'Updated'} • $${deal.value || 0}`,
          user: deal.assigned_rep || 'Unknown Rep',
          timestamp: deal.ModifiedOn || deal.created_at || new Date().toISOString(),
          icon: 'handshake'
        });
      });
    }

    // Process leads
    if (leadsResponse.success && leadsResponse.data) {
      leadsResponse.data.forEach(lead => {
        activities.push({
          id: `lead-${lead.Id}`,
          type: 'lead',
          title: lead.Name || 'Unnamed Lead',
          description: `Lead ${lead.status || 'Added'}`,
          user: lead.added_by_name || 'Unknown User',
          timestamp: lead.ModifiedOn || lead.created_at || new Date().toISOString(),
          icon: 'target'
        });
      });
    }

    // Process contacts
    if (contactsResponse.success && contactsResponse.data) {
      contactsResponse.data.forEach(contact => {
        activities.push({
          id: `contact-${contact.Id}`,
          type: 'contact',
          title: contact.Name || 'Unnamed Contact',
          description: `Contact ${contact.status || 'Updated'}`,
          user: contact.assigned_rep || 'Unknown Rep',
          timestamp: contact.ModifiedOn || contact.created_at || new Date().toISOString(),
          icon: 'mail'
        });
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return top 20 most recent activities with enhanced details
    return activities.slice(0, 20).map(item => ({
      ...item,
      details: `Activity details for ${item.title}`,
      user: item.user || 'System',
      category: item.type || 'general',
      priority: item.priority || 'normal'
    }));
  } catch (error) {
    console.error("Error getting detailed recent activity:", error);
return [];
  }
};

// Get today's meetings
export const getTodaysMeetings = async () => {
  await delay(300);
  try {
    // Mock meetings data for today
    const todaysMeetings = [
      {
        id: 1,
        title: "Product Demo - SaaS Platform",
        client: "TechCorp Solutions", 
        time: "9:00 AM"
      },
      {
        id: 2,
        title: "Discovery Call - E-commerce",
        client: "RetailMax Inc",
        time: "11:30 AM"
      },
      {
        id: 3,
        title: "Proposal Review",
        client: "DataFlow Systems",
        time: "2:00 PM"
      },
      {
        id: 4,
        title: "Follow-up Call",
        client: "CloudVision Ltd",
        time: "4:30 PM"
      }
    ];
    
    return todaysMeetings;
  } catch (error) {
    console.error('Error fetching today\'s meetings:', error);
    return [];
  }
};

// Keep existing utility functions for backward compatibility
export const refreshDashboardMetrics = async () => {
  await delay(300);
  try {
    const [metrics, activity] = await Promise.all([
      getDashboardMetrics(),
      getDetailedRecentActivity()
    ]);
    return { metrics, activity, refreshed: true };
  } catch (error) {
    console.error("Error refreshing dashboard:", error);
    return { metrics: [], activity: [], refreshed: false };
  }
};

export const getUserLeadsReport = async (startDate, endDate) => {
  await delay(300);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "created_at" } },
        { field: { Name: "status" } },
        { field: { Name: "added_by_name" } }
      ],
      where: [
        {
          FieldName: "created_at",
          Operator: "GreaterThanOrEqualTo",
          Values: [startDate]
        },
        {
          FieldName: "created_at", 
          Operator: "LessThanOrEqualTo",
          Values: [endDate]
        }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead', params);
    
    if (!response.success) {
      console.error("Error fetching user leads report:", response.message);
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error("Error getting user leads report:", error);
    return [];
  }
};