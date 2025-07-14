import { toast } from 'react-toastify';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getDeals = async (year = null) => {
  await delay(500);
  
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "lead_name" } },
        { field: { Name: "lead_id" } },
        { field: { Name: "value" } },
        { field: { Name: "stage" } },
        { field: { Name: "assigned_rep" } },
        { field: { Name: "edition" } },
        { field: { Name: "start_month" } },
        { field: { Name: "end_month" } },
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
    
    if (year) {
      params.where = [
        {
          FieldName: "created_at",
          Operator: "RelativeMatch",
          Values: [`${year}`]
        }
      ];
    }
    
    const response = await apperClient.fetchRecords('deal', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching deals:", error);
    toast.error("Failed to load deals");
    return [];
  }
};

export const getDealById = async (id) => {
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
        { field: { Name: "lead_name" } },
        { field: { Name: "lead_id" } },
        { field: { Name: "value" } },
        { field: { Name: "stage" } },
        { field: { Name: "assigned_rep" } },
        { field: { Name: "edition" } },
        { field: { Name: "start_month" } },
        { field: { Name: "end_month" } },
        { field: { Name: "created_at" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } }
      ]
    };
    
    const response = await apperClient.getRecordById('deal', id, params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching deal with ID ${id}:`, error);
    toast.error("Failed to load deal");
    return null;
  }
};

export const createDeal = async (dealData) => {
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
          Name: dealData.name || dealData.Name,
          lead_name: dealData.lead_name || dealData.leadName,
          lead_id: dealData.lead_id || dealData.leadId,
          value: dealData.value || 0,
          stage: dealData.stage || "Connected",
          assigned_rep: dealData.assigned_rep || dealData.assignedRep,
          edition: dealData.edition,
          start_month: dealData.start_month || dealData.startMonth,
          end_month: dealData.end_month || dealData.endMonth,
          Tags: dealData.tags || dealData.Tags,
          Owner: dealData.owner || dealData.Owner
        }
      ]
    };
    
    const response = await apperClient.createRecord('deal', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} deals:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulRecords.length > 0) {
        toast.success("Deal created successfully");
        return successfulRecords[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error creating deal:", error);
    toast.error("Failed to create deal");
    return null;
  }
};

export const updateDeal = async (id, updates) => {
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
          lead_name: updates.lead_name || updates.leadName,
          lead_id: updates.lead_id || updates.leadId,
          value: updates.value,
          stage: updates.stage,
          assigned_rep: updates.assigned_rep || updates.assignedRep,
          edition: updates.edition,
          start_month: updates.start_month || updates.startMonth,
          end_month: updates.end_month || updates.endMonth,
          Tags: updates.tags || updates.Tags,
          Owner: updates.owner || updates.Owner
        }
      ]
    };
    
    const response = await apperClient.updateRecord('deal', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} deals:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulUpdates.length > 0) {
        toast.success("Deal updated successfully");
        return successfulUpdates[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error updating deal:", error);
    toast.error("Failed to update deal");
    return null;
  }
};

export const deleteDeal = async (id) => {
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
    
    const response = await apperClient.deleteRecord('deal', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return false;
    }
    
    if (response.results) {
      const successfulDeletions = response.results.filter(result => result.success);
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} deals:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulDeletions.length > 0) {
        toast.success("Deal deleted successfully");
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error deleting deal:", error);
    toast.error("Failed to delete deal");
    return false;
  }
};