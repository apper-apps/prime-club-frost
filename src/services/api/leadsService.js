import { toast } from "react-toastify";
import Error from "@/components/ui/Error";

// Initialize ApperClient with Project ID and Public Key
const { ApperClient } = window.ApperSDK;
const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

// Table name from the provided Tables & Fields JSON
const TABLE_NAME = 'lead';

// Get all leads
export const getAllLeads = async () => {
  try {
    // Define fields based on the provided Tables & Fields JSON for "lead" table
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } },
        { field: { Name: "CreatedOn" } },
        { field: { Name: "CreatedBy" } },
        { field: { Name: "ModifiedOn" } },
        { field: { Name: "ModifiedBy" } },
        { field: { Name: "website_url" } },
        { field: { Name: "team_size" } },
        { field: { Name: "arr" } },
        { field: { Name: "category" } },
        { field: { Name: "linkedin_url" } },
        { field: { Name: "status" } },
        { field: { Name: "funding_type" } },
        { field: { Name: "edition" } },
        { field: { Name: "added_by_name" } },
        { field: { Name: "created_at" } },
        { field: { Name: "follow_up_date" } },
        { field: { Name: "added_by" } },
        { field: { Name: "product_name" } }
      ]
    };
    
    const response = await apperClient.fetchRecords(TABLE_NAME, params);
    
    if (!response || !response.data || response.data.length === 0) {
      return [];
    }
    
    return response.data;
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error fetching leads:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return [];
  }
};

// Get lead by ID
export const getLeadById = async (recordId) => {
  try {
    // Extract field names from the Tables & Fields JSON for the "lead" table
    const tableFields = [
      { field: { Name: "Name" } },
      { field: { Name: "Tags" } },
      { field: { Name: "Owner" } },
      { field: { Name: "CreatedOn" } },
      { field: { Name: "CreatedBy" } },
      { field: { Name: "ModifiedOn" } },
      { field: { Name: "ModifiedBy" } },
      { field: { Name: "website_url" } },
      { field: { Name: "team_size" } },
      { field: { Name: "arr" } },
      { field: { Name: "category" } },
      { field: { Name: "linkedin_url" } },
      { field: { Name: "status" } },
      { field: { Name: "funding_type" } },
      { field: { Name: "edition" } },
      { field: { Name: "added_by_name" } },
      { field: { Name: "created_at" } },
      { field: { Name: "follow_up_date" } },
      { field: { Name: "added_by" } },
      { field: { Name: "product_name" } }
    ];
    
    const params = {
      fields: tableFields
    };
    
    const response = await apperClient.getRecordById(TABLE_NAME, recordId, params);
    
    if (!response || !response.data) {
      return null;
    }
    
    return response.data;
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error(`Error fetching record with ID ${recordId}:`, error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return null;
  }
};

// Create new lead
export const createLead = async (leadData) => {
  try {
    // Only include fields with visibility: "Updateable" based on Tables & Fields JSON
    const updateableData = {
      Name: leadData.Name,
      Tags: leadData.Tags,
      Owner: leadData.Owner ? parseInt(leadData.Owner?.Id || leadData.Owner) : undefined,
      website_url: leadData.website_url,
      team_size: leadData.team_size,
      arr: leadData.arr ? parseFloat(leadData.arr) : undefined,
      category: leadData.category,
      linkedin_url: leadData.linkedin_url,
      status: leadData.status,
      funding_type: leadData.funding_type,
      edition: leadData.edition,
      added_by_name: leadData.added_by_name,
      created_at: leadData.created_at,
      follow_up_date: leadData.follow_up_date,
      added_by: leadData.added_by ? parseInt(leadData.added_by?.Id || leadData.added_by) : undefined,
      product_name: leadData.product_name
    };
    
    // Remove undefined fields
    Object.keys(updateableData).forEach(key => {
      if (updateableData[key] === undefined) {
        delete updateableData[key];
      }
    });
    
    const params = {
      records: [updateableData]
    };
    
    const response = await apperClient.createRecord(TABLE_NAME, params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create leads ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      return successfulRecords.length > 0 ? successfulRecords[0].data : null;
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error creating records in Lead service:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return null;
  }
};

// Update lead
export const updateLead = async (id, leadData) => {
  try {
    // Only include fields with visibility: "Updateable" based on Tables & Fields JSON
    const updateableData = {
      Id: parseInt(id),
      Name: leadData.Name,
      Tags: leadData.Tags,
      Owner: leadData.Owner ? parseInt(leadData.Owner?.Id || leadData.Owner) : undefined,
      website_url: leadData.website_url,
      team_size: leadData.team_size,
      arr: leadData.arr ? parseFloat(leadData.arr) : undefined,
      category: leadData.category,
      linkedin_url: leadData.linkedin_url,
      status: leadData.status,
      funding_type: leadData.funding_type,
      edition: leadData.edition,
      added_by_name: leadData.added_by_name,
      created_at: leadData.created_at,
      follow_up_date: leadData.follow_up_date,
      added_by: leadData.added_by ? parseInt(leadData.added_by?.Id || leadData.added_by) : undefined,
      product_name: leadData.product_name
    };
    
    // Remove undefined fields (except Id)
    Object.keys(updateableData).forEach(key => {
      if (key !== 'Id' && updateableData[key] === undefined) {
        delete updateableData[key];
      }
    });
    
    const params = {
      records: [updateableData]
    };
    
    const response = await apperClient.updateRecord(TABLE_NAME, params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update leads ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      return successfulUpdates.length > 0 ? successfulUpdates[0].data : null;
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error updating records in Lead service:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return null;
  }
};

// Delete lead
export const deleteLead = async (recordIds) => {
  try {
    const params = {
      RecordIds: Array.isArray(recordIds) ? recordIds : [recordIds]
    };
    
    const response = await apperClient.deleteRecord(TABLE_NAME, params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return false;
    }
    
    if (response.results) {
      const successfulDeletions = response.results.filter(result => result.success);
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete Leads ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
      }
      
      return successfulDeletions.length === params.RecordIds.length;
    }
  } catch (error) {
    if (error?.response?.data?.message) {
      console.error("Error deleting records:", error?.response?.data?.message);
    } else {
      console.error(error.message);
    }
    return false;
  }
};

// Utility function for adding delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get lead by ID (simplified duplicate removal)
export const getLeadByIdSimple = async (id) => {
  try {
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
        { field: { Name: "Owner" } },
        { field: { Name: "product_name" } }
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

// Enhanced create lead function (replacing duplicate)
export const createLeadEnhanced = async (leadData) => {
  await delay(300);
  
  try {
    // Valid team size values from database schema
    const validTeamSizes = ["1-3", "11-50", "201-500", "500+", "1001+"];
    const providedTeamSize = leadData.team_size || leadData.teamSize || "1-3";
    
    // Validate team_size against database picklist values
    let validatedTeamSize = "1-3"; // default fallback
    if (validTeamSizes.includes(providedTeamSize)) {
      validatedTeamSize = providedTeamSize;
    } else {
      console.warn(`Invalid team_size value provided: "${providedTeamSize}". Using default "1-3". Valid values are:`, validTeamSizes);
    }
    
    const params = {
      records: [
        {
          Name: leadData.name || leadData.Name,
          email: leadData.email,
          website_url: leadData.website_url || leadData.websiteUrl,
          team_size: validatedTeamSize,
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
          Owner: leadData.owner || leadData.Owner,
          product_name: leadData.product_name || ""
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

// Enhanced update lead function (replacing duplicate)
export const updateLeadEnhanced = async (id, updates) => {
  await delay(300);
  
  try {
    // Validate ID is a valid integer
    const numericId = parseInt(id);
    if (!numericId || numericId <= 0) {
      throw new Error(`Invalid lead ID: ${id}. Must be a positive integer.`);
    }

    // Valid team size values from database schema
    const validTeamSizes = ["1-3", "11-50", "201-500", "500+", "1001+"];
    
    // Create record payload with only defined values
    const recordData = { Id: numericId };
    
    // Only include fields that have actual values (not undefined/null)
    if (updates.name !== undefined || updates.Name !== undefined) {
      recordData.Name = updates.name || updates.Name;
    }
    if (updates.email !== undefined) {
      recordData.email = updates.email;
    }
    if (updates.website_url !== undefined || updates.websiteUrl !== undefined) {
      recordData.website_url = updates.website_url || updates.websiteUrl;
    }
    if (updates.team_size !== undefined || updates.teamSize !== undefined) {
      const providedTeamSize = updates.team_size || updates.teamSize;
      // Validate team_size against database picklist values
      if (validTeamSizes.includes(providedTeamSize)) {
        recordData.team_size = providedTeamSize;
      } else {
        console.warn(`Invalid team_size value provided for update: "${providedTeamSize}". Valid values are:`, validTeamSizes);
        recordData.team_size = "1-3"; // Use default fallback
      }
    }
    if (updates.arr !== undefined) {
      recordData.arr = updates.arr;
    }
    if (updates.category !== undefined) {
      recordData.category = updates.category;
    }
    if (updates.linkedin_url !== undefined || updates.linkedinUrl !== undefined) {
      recordData.linkedin_url = updates.linkedin_url || updates.linkedinUrl;
    }
    if (updates.status !== undefined) {
      recordData.status = updates.status;
    }
    if (updates.funding_type !== undefined || updates.fundingType !== undefined) {
      recordData.funding_type = updates.funding_type || updates.fundingType;
    }
    if (updates.edition !== undefined) {
      recordData.edition = updates.edition;
    }
    if (updates.follow_up_date !== undefined || updates.followUpDate !== undefined) {
      recordData.follow_up_date = updates.follow_up_date || updates.followUpDate;
    }
    if (updates.added_by !== undefined || updates.addedBy !== undefined) {
      recordData.added_by = updates.added_by || updates.addedBy;
    }
    if (updates.added_by_name !== undefined || updates.addedByName !== undefined) {
      recordData.added_by_name = updates.added_by_name || updates.addedByName;
    }
    if (updates.tags !== undefined || updates.Tags !== undefined) {
      recordData.Tags = updates.tags || updates.Tags;
    }
    if (updates.owner !== undefined || updates.Owner !== undefined) {
      recordData.Owner = updates.owner || updates.Owner;
    }
    if (updates.product_name !== undefined) {
      recordData.product_name = updates.product_name;
    }
    
    const params = {
      records: [recordData]
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

// Enhanced delete lead function (replacing duplicate)
export const deleteLeadEnhanced = async (id) => {
  await delay(300);
  
  try {
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