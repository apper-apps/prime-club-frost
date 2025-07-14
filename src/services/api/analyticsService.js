const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get date ranges
const getDateRange = (period) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        start: yesterday,
        end: today
      };
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        start: weekStart,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    case 'month':
      const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        start: monthStart,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      };
    default:
      return {
        start: new Date(0),
        end: new Date()
      };
  }
};

export const getLeadsAnalytics = async (period = 'all', userId = 'all') => {
  await delay(300);
  
  try {
    const { getLeads } = await import("@/services/api/leadsService");
    const { getSalesReps } = await import("@/services/api/salesRepService");
    
    const [leadsData, salesReps] = await Promise.all([
      getLeads(),
      getSalesReps()
    ]);
    
    let filteredLeads = leadsData || [];
    
    // Filter by user
    if (userId !== 'all') {
      filteredLeads = filteredLeads.filter(lead => 
        (lead.added_by || lead.addedBy) === parseInt(userId)
      );
    }
    
    // Filter by date range
    if (period !== 'all') {
      const { start, end } = getDateRange(period);
      filteredLeads = filteredLeads.filter(lead => {
        const leadDate = new Date(lead.created_at || lead.createdAt);
        return leadDate >= start && leadDate < end;
      });
    }
    
    // Enhance leads with sales rep names
    const leadsWithRepNames = filteredLeads.map(lead => {
      const salesRep = salesReps.find(rep => rep.Id === (lead.added_by || lead.addedBy));
      return {
        ...lead,
        addedByName: salesRep ? (salesRep.Name || salesRep.name) : 'Unknown'
      };
    });
    
    return {
      leads: leadsWithRepNames,
      totalCount: filteredLeads.length
    };
  } catch (error) {
    console.error("Error fetching leads analytics:", error);
    return {
      leads: [],
      totalCount: 0
    };
  }
};

export const getDailyLeadsChart = async (userId = 'all', days = 30) => {
  await delay(400);
  
  try {
    const { getLeads } = await import("@/services/api/leadsService");
    const leadsData = await getLeads();
    
    const now = new Date();
    const chartData = [];
    
    // Generate data for the last X days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter leads for this specific day and user
      const dayLeads = leadsData.filter(lead => {
        const leadDate = (lead.created_at || lead.createdAt || '').split('T')[0];
        const userMatch = userId === 'all' || (lead.added_by || lead.addedBy) === parseInt(userId);
        return leadDate === dateStr && userMatch;
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
      chartData,
      categories: chartData.map(item => item.formattedDate),
      series: [
        {
          name: 'New Leads',
          data: chartData.map(item => item.count)
        }
      ]
    };
  } catch (error) {
    console.error("Error fetching daily leads chart:", error);
    return {
      chartData: [],
      categories: [],
      series: []
    };
  }
};

export const getLeadsMetrics = async (userId = 'all') => {
  await delay(250);
  
  try {
    const { getLeads } = await import("@/services/api/leadsService");
    const leadsData = await getLeads();
    
    const filterLeadsByPeriod = (period) => {
      const { start, end } = getDateRange(period);
      return leadsData.filter(lead => {
        const leadDate = new Date(lead.created_at || lead.createdAt);
        const userMatch = userId === 'all' || (lead.added_by || lead.addedBy) === parseInt(userId);
        return leadDate >= start && leadDate < end && userMatch;
      });
    };
    
    const today = filterLeadsByPeriod('today');
    const yesterday = filterLeadsByPeriod('yesterday');
    const thisWeek = filterLeadsByPeriod('week');
    const thisMonth = filterLeadsByPeriod('month');
    
    // Calculate trends
    const todayCount = today.length;
    const yesterdayCount = yesterday.length;
    const weekCount = thisWeek.length;
    const monthCount = thisMonth.length;
    
    // Calculate percentage changes
    const todayTrend = yesterdayCount === 0 ? 100 : 
      Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
    
    // Get status distribution for the filtered leads
    const allFilteredLeads = userId === 'all' ? leadsData : 
      leadsData.filter(lead => (lead.added_by || lead.addedBy) === parseInt(userId));
    
    const statusCounts = allFilteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
    
    // Get category distribution
    const categoryCounts = allFilteredLeads.reduce((acc, lead) => {
      acc[lead.category] = (acc[lead.category] || 0) + 1;
      return acc;
    }, {});
    
    return {
      metrics: {
        today: {
          count: todayCount,
          trend: todayTrend,
          label: 'Today'
        },
        yesterday: {
          count: yesterdayCount,
          label: 'Yesterday'
        },
        week: {
          count: weekCount,
          label: 'This Week'
        },
        month: {
          count: monthCount,
          label: 'This Month'
        }
      },
      statusDistribution: statusCounts,
      categoryDistribution: categoryCounts,
      totalLeads: allFilteredLeads.length
    };
  } catch (error) {
    console.error("Error fetching leads metrics:", error);
    return {
      metrics: {
        today: { count: 0, trend: 0, label: 'Today' },
        yesterday: { count: 0, label: 'Yesterday' },
        week: { count: 0, label: 'This Week' },
        month: { count: 0, label: 'This Month' }
      },
      statusDistribution: {},
      categoryDistribution: {},
      totalLeads: 0
    };
  }
};

export const getUserPerformance = async () => {
  await delay(300);
  
  try {
    const { getSalesReps } = await import("@/services/api/salesRepService");
    const { getLeads } = await import("@/services/api/leadsService");
    
    const [salesReps, leadsData] = await Promise.all([
      getSalesReps(),
      getLeads()
    ]);
    
    const userStats = salesReps.map(rep => {
      const userLeads = leadsData.filter(lead => (lead.added_by || lead.addedBy) === rep.Id);
      
      const filterLeadsByPeriod = (period) => {
        const { start, end } = getDateRange(period);
        return userLeads.filter(lead => {
          const leadDate = new Date(lead.created_at || lead.createdAt);
          return leadDate >= start && leadDate < end;
        });
      };
      
      const todayLeads = filterLeadsByPeriod('today');
      const weekLeads = filterLeadsByPeriod('week');
      const monthLeads = filterLeadsByPeriod('month');
      
      return {
        ...rep,
        name: rep.Name || rep.name,
        totalLeads: userLeads.length,
        todayLeads: todayLeads.length,
        weekLeads: weekLeads.length,
        monthLeads: monthLeads.length,
        conversionRate: (rep.meetings_booked || rep.meetingsBooked) > 0 ? 
          Math.round(((rep.deals_closed || rep.dealsClosed) / (rep.meetings_booked || rep.meetingsBooked)) * 100) : 0
      };
    });
    
    return userStats.sort((a, b) => b.totalLeads - a.totalLeads);
  } catch (error) {
    console.error("Error fetching user performance:", error);
    return [];
  }
};