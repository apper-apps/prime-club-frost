import { toast } from 'react-toastify';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getLeads = async () => {
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
        { field: { Name: "website_url" } },
        { field: { Name: "team_size" } },
        { field: { Name: "arr" } },
        { field: { Name: "category" } },
        { field: { Name: "linkedin_url" } },
        { field: { Name: "status" } },
        { field: { Name: "funding_type" } },
        { field: { Name: "edition" } },
        { field: { Name: "follow_up_date" } },
        { field: { Name: "added_by" } },
        { field: { Name: "added_by_name" } },
        { field: { Name: "created_at" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } }
      ],
      orderBy: [
        {
          fieldName: "created_at",
          sorttype: "DESC"
        }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching leads:", error);
    toast.error("Failed to load leads");
    return [];
  }
};

export const getLeadById = async (id) => {
  await delay(200);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url" } },
        { field: { Name: "team_size" } },
        { field: { Name: "arr" } },
        { field: { Name: "category" } },
        { field: { Name: "linkedin_url" } },
        { field: { Name: "status" } },
        { field: { Name: "funding_type" } },
        { field: { Name: "edition" } },
        { field: { Name: "follow_up_date" } },
        { field: { Name: "added_by" } },
        { field: { Name: "added_by_name" } },
        { field: { Name: "created_at" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } }
      ]
    };
    
    const response = await apperClient.getRecordById('lead', id, params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching lead with ID ${id}:`, error);
    toast.error("Failed to load lead");
    return null;
  }
};

export const createLead = async (leadData) => {
  await delay(300);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      records: [
        {
          Name: leadData.name || leadData.Name,
          website_url: leadData.website_url || leadData.websiteUrl,
          team_size: leadData.team_size || leadData.teamSize || "1-3",
          arr: leadData.arr || 0,
          category: leadData.category || "Other",
          linkedin_url: leadData.linkedin_url || leadData.linkedinUrl,
          status: leadData.status || "Keep an Eye",
          funding_type: leadData.funding_type || leadData.fundingType || "Bootstrapped",
          edition: leadData.edition || "Select Edition",
          follow_up_date: leadData.follow_up_date || leadData.followUpDate,
          added_by: leadData.added_by || leadData.addedBy,
          added_by_name: leadData.added_by_name || leadData.addedByName,
          Tags: leadData.tags || leadData.Tags,
          Owner: leadData.owner || leadData.Owner
        }
      ]
    };
    
    const response = await apperClient.createRecord('lead', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} leads:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulRecords.length > 0) {
        toast.success("Lead created successfully");
        return successfulRecords[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error creating lead:", error);
    toast.error("Failed to create lead");
    return null;
  }
};

export const updateLead = async (id, updates) => {
  await delay(300);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      records: [
        {
          Id: id,
          Name: updates.name || updates.Name,
          website_url: updates.website_url || updates.websiteUrl,
          team_size: updates.team_size || updates.teamSize,
          arr: updates.arr,
          category: updates.category,
          linkedin_url: updates.linkedin_url || updates.linkedinUrl,
          status: updates.status,
          funding_type: updates.funding_type || updates.fundingType,
          edition: updates.edition,
          follow_up_date: updates.follow_up_date || updates.followUpDate,
          added_by: updates.added_by || updates.addedBy,
          added_by_name: updates.added_by_name || updates.addedByName,
          Tags: updates.tags || updates.Tags,
          Owner: updates.owner || updates.Owner
        }
      ]
    };
    
    const response = await apperClient.updateRecord('lead', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} leads:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulUpdates.length > 0) {
        toast.success("Lead updated successfully");
        return successfulUpdates[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error updating lead:", error);
    toast.error("Failed to update lead");
    return null;
  }
};

export const deleteLead = async (id) => {
  await delay(300);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      RecordIds: [id]
    };
    
    const response = await apperClient.deleteRecord('lead', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return false;
    }
    
    if (response.results) {
      const successfulDeletions = response.results.filter(result => result.success);
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} leads:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulDeletions.length > 0) {
        toast.success("Lead deleted successfully");
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error deleting lead:", error);
    toast.error("Failed to delete lead");
    return false;
  }
};

export const getDailyLeadsReport = async () => {
  await delay(300);
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url" } },
        { field: { Name: "added_by" } },
        { field: { Name: "added_by_name" } },
        { field: { Name: "created_at" } }
      ],
      where: [
        {
          FieldName: "created_at",
          Operator: "EqualTo",
          Values: [today]
        }
      ],
      orderBy: [
        {
          fieldName: "added_by",
          sorttype: "ASC"
        }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }
    
    const todaysLeads = response.data || [];
    
    // Group by sales rep
    const reportData = {};
    
    todaysLeads.forEach(lead => {
      const repName = lead.added_by_name || 'Unknown';
      
      if (!reportData[repName]) {
        reportData[repName] = {
          salesRep: repName,
          salesRepId: lead.added_by,
          leads: [],
          leadCount: 0,
          lowPerformance: false
        };
      }
      
      reportData[repName].leads.push(lead);
    });
    
    // Calculate lead counts and identify low performers
    Object.values(reportData).forEach(repData => {
      repData.leadCount = repData.leads.length;
      repData.lowPerformance = repData.leadCount < 5;
    });
    
    return Object.values(reportData).sort((a, b) => b.leads.length - a.leads.length);
  } catch (error) {
    console.error("Error fetching daily leads report:", error);
    toast.error("Failed to load daily leads report");
    return [];
  }
};

export const getPendingFollowUps = async () => {
  await delay(300);
  
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "website_url" } },
        { field: { Name: "follow_up_date" } },
        { field: { Name: "category" } },
        { field: { Name: "added_by_name" } }
      ],
      where: [
        {
          FieldName: "follow_up_date",
          Operator: "GreaterThanOrEqualTo",
          Values: [now.toISOString().split('T')[0]]
        },
        {
          FieldName: "follow_up_date",
          Operator: "LessThanOrEqualTo",
          Values: [sevenDaysFromNow.toISOString().split('T')[0]]
        }
      ],
      orderBy: [
        {
          fieldName: "follow_up_date",
          sorttype: "ASC"
        }
      ]
    };
    
    const response = await apperClient.fetchRecords('lead', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching pending follow-ups:", error);
    toast.error("Failed to load pending follow-ups");
    return [];
  }
};

export const getFreshLeadsOnly = async (leadsArray) => {
  await delay(100);
  
  const today = new Date().toDateString();
  
  return leadsArray.filter(lead => {
    const leadDate = new Date(lead.created_at || lead.createdAt);
    return leadDate.toDateString() === today;
  });
};