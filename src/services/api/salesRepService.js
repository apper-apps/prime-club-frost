import { toast } from 'react-toastify';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getSalesReps = async () => {
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
        { field: { Name: "leads_contacted" } },
        { field: { Name: "meetings_booked" } },
        { field: { Name: "deals_closed" } },
        { field: { Name: "total_revenue" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } }
      ],
      orderBy: [
        {
          fieldName: "total_revenue",
          sorttype: "DESC"
        }
      ]
    };
    
    const response = await apperClient.fetchRecords('sales_rep', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching sales reps:", error);
    toast.error("Failed to load sales reps");
    return [];
  }
};

export const getSalesRepById = async (id) => {
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
        { field: { Name: "leads_contacted" } },
        { field: { Name: "meetings_booked" } },
        { field: { Name: "deals_closed" } },
        { field: { Name: "total_revenue" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } }
      ]
    };
    
    const response = await apperClient.getRecordById('sales_rep', id, params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching sales rep with ID ${id}:`, error);
    toast.error("Failed to load sales rep");
    return null;
  }
};

export const createSalesRep = async (repData) => {
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
          Name: repData.name || repData.Name,
          leads_contacted: repData.leads_contacted || repData.leadsContacted || 0,
          meetings_booked: repData.meetings_booked || repData.meetingsBooked || 0,
          deals_closed: repData.deals_closed || repData.dealsClosed || 0,
          total_revenue: repData.total_revenue || repData.totalRevenue || 0,
          Tags: repData.tags || repData.Tags,
          Owner: repData.owner || repData.Owner
        }
      ]
    };
    
    const response = await apperClient.createRecord('sales_rep', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} sales reps:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulRecords.length > 0) {
        toast.success("Sales rep created successfully");
        return successfulRecords[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error creating sales rep:", error);
    toast.error("Failed to create sales rep");
    return null;
  }
};

export const updateSalesRep = async (id, updates) => {
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
          leads_contacted: updates.leads_contacted || updates.leadsContacted,
          meetings_booked: updates.meetings_booked || updates.meetingsBooked,
          deals_closed: updates.deals_closed || updates.dealsClosed,
          total_revenue: updates.total_revenue || updates.totalRevenue,
          Tags: updates.tags || updates.Tags,
          Owner: updates.owner || updates.Owner
        }
      ]
    };
    
    const response = await apperClient.updateRecord('sales_rep', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} sales reps:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulUpdates.length > 0) {
        toast.success("Sales rep updated successfully");
        return successfulUpdates[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error updating sales rep:", error);
    toast.error("Failed to update sales rep");
    return null;
  }
};

export const deleteSalesRep = async (id) => {
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
    
    const response = await apperClient.deleteRecord('sales_rep', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return false;
    }
    
    if (response.results) {
      const successfulDeletions = response.results.filter(result => result.success);
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} sales reps:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulDeletions.length > 0) {
        toast.success("Sales rep deleted successfully");
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error deleting sales rep:", error);
    toast.error("Failed to delete sales rep");
    return false;
  }
};