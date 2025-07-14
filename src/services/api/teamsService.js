import { toast } from 'react-toastify';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getTeamMembers = async () => {
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
        { field: { Name: "email" } },
        { field: { Name: "role" } },
        { field: { Name: "permissions" } },
        { field: { Name: "status" } },
        { field: { Name: "created_at" } },
        { field: { Name: "updated_at" } },
        { field: { Name: "last_login" } },
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
    
    const response = await apperClient.fetchRecords('team', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching team members:", error);
    toast.error("Failed to load team members");
    return [];
  }
};

export const getTeamMemberById = async (id) => {
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
        { field: { Name: "email" } },
        { field: { Name: "role" } },
        { field: { Name: "permissions" } },
        { field: { Name: "status" } },
        { field: { Name: "created_at" } },
        { field: { Name: "updated_at" } },
        { field: { Name: "last_login" } },
        { field: { Name: "Tags" } },
        { field: { Name: "Owner" } }
      ]
    };
    
    const response = await apperClient.getRecordById('team', id, params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching team member with ID ${id}:`, error);
    toast.error("Failed to load team member");
    return null;
  }
};

export const inviteTeamMember = async (memberData) => {
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
          Name: memberData.name || memberData.Name,
          email: memberData.email,
          role: memberData.role || "viewer",
          permissions: typeof memberData.permissions === 'object' ? 
            JSON.stringify(memberData.permissions) : memberData.permissions,
          status: memberData.status || "pending",
          Tags: memberData.tags || memberData.Tags,
          Owner: memberData.owner || memberData.Owner
        }
      ]
    };
    
    const response = await apperClient.createRecord('team', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulRecords = response.results.filter(result => result.success);
      const failedRecords = response.results.filter(result => !result.success);
      
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} team members:${JSON.stringify(failedRecords)}`);
        
        failedRecords.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulRecords.length > 0) {
        toast.success("Team member invited successfully");
        return successfulRecords[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error creating team member:", error);
    toast.error("Failed to invite team member");
    return null;
  }
};

export const updateTeamMember = async (id, updates) => {
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
          email: updates.email,
          role: updates.role,
          permissions: typeof updates.permissions === 'object' ? 
            JSON.stringify(updates.permissions) : updates.permissions,
          status: updates.status,
          Tags: updates.tags || updates.Tags,
          Owner: updates.owner || updates.Owner
        }
      ]
    };
    
    const response = await apperClient.updateRecord('team', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return null;
    }
    
    if (response.results) {
      const successfulUpdates = response.results.filter(result => result.success);
      const failedUpdates = response.results.filter(result => !result.success);
      
      if (failedUpdates.length > 0) {
        console.error(`Failed to update ${failedUpdates.length} team members:${JSON.stringify(failedUpdates)}`);
        
        failedUpdates.forEach(record => {
          record.errors?.forEach(error => {
            toast.error(`${error.fieldLabel}: ${error.message}`);
          });
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulUpdates.length > 0) {
        toast.success("Team member updated successfully");
        return successfulUpdates[0].data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error updating team member:", error);
    toast.error("Failed to update team member");
    return null;
  }
};

export const removeTeamMember = async (id) => {
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
    
    const response = await apperClient.deleteRecord('team', params);
    
    if (!response.success) {
      console.error(response.message);
      toast.error(response.message);
      return false;
    }
    
    if (response.results) {
      const successfulDeletions = response.results.filter(result => result.success);
      const failedDeletions = response.results.filter(result => !result.success);
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete ${failedDeletions.length} team members:${JSON.stringify(failedDeletions)}`);
        
        failedDeletions.forEach(record => {
          if (record.message) toast.error(record.message);
        });
      }
      
      if (successfulDeletions.length > 0) {
        toast.success("Team member removed successfully");
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error removing team member:", error);
    toast.error("Failed to remove team member");
    return false;
  }
};

export const getTeamMemberPerformance = async (id) => {
  await delay(250);
  
  // Mock performance data for team members since this isn't stored in database
  const mockPerformance = {
    totalLeads: Math.floor(Math.random() * 50) + 20,
    totalDeals: Math.floor(Math.random() * 10) + 5,
    totalRevenue: Math.floor(Math.random() * 50000) + 10000,
    totalMeetings: Math.floor(Math.random() * 20) + 10,
    conversionRate: Math.floor(Math.random() * 15) + 5,
    avgDealSize: 0
  };
  
  mockPerformance.avgDealSize = mockPerformance.totalDeals > 0 ? 
    Math.round(mockPerformance.totalRevenue / mockPerformance.totalDeals) : 0;
  
  return mockPerformance;
};

export const activateTeamMember = async (id) => {
  return await updateTeamMember(id, { status: "active" });
};

export const deactivateTeamMember = async (id) => {
  return await updateTeamMember(id, { status: "inactive" });
};