import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Empty from "@/components/ui/Empty";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import Hotlist from "@/components/pages/Hotlist";
import SearchBar from "@/components/molecules/SearchBar";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import { createDeal, getDeals, updateDeal } from "@/services/api/dealsService";
import { createLead, deleteLead, getLeads, updateLead } from "@/services/api/leadsService";

const Leads = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fundingFilter, setFundingFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [teamSizeFilter, setTeamSizeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("websiteUrl");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [emptyRows, setEmptyRows] = useState([]);
  const [nextTempId, setNextTempId] = useState(-1);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [topScrollbarRef, setTopScrollbarRef] = useState(null);
  const [tableScrollbarRef, setTableScrollbarRef] = useState(null);
  
  // Auto-save system state
  const [editingStates, setEditingStates] = useState({}); // Track which cells are being edited
  const [optimisticData, setOptimisticData] = useState({}); // Store optimistic updates
  const [pendingValidation, setPendingValidation] = useState({}); // Track validation errors
  const [savingStates, setSavingStates] = useState({}); // Track which rows are being saved

  useEffect(() => {
    loadLeads();
  }, []);

  // Synchronize scrolling between top and bottom scrollbars
  useEffect(() => {
    if (!topScrollbarRef || !tableScrollbarRef) return;

    const handleTopScroll = () => {
      tableScrollbarRef.scrollLeft = topScrollbarRef.scrollLeft;
    };

    const handleTableScroll = () => {
      topScrollbarRef.scrollLeft = tableScrollbarRef.scrollLeft;
    };

    topScrollbarRef.addEventListener('scroll', handleTopScroll);
    tableScrollbarRef.addEventListener('scroll', handleTableScroll);

    return () => {
      topScrollbarRef.removeEventListener('scroll', handleTopScroll);
      tableScrollbarRef.removeEventListener('scroll', handleTableScroll);
    };
  }, [topScrollbarRef, tableScrollbarRef]);

const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLeads();
      
      // Service already returns proper array format with database field names
      setData(response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const handleStatusChange = async (leadId, newStatus) => {
    try {
      const updatedLead = await updateLead(leadId, { status: newStatus });
      setData(prevData => 
        prevData.map(lead => 
          lead.Id === leadId ? updatedLead : lead
        )
      );
      
      // Define status-to-stage mapping for common statuses
      const statusToStageMap = {
        "Connected": "Connected",
        "Locked": "Locked", 
        "Meeting Booked": "Meeting Booked",
        "Meeting Done": "Meeting Done",
        "Negotiation": "Negotiation",
        "Closed Lost": "Lost"
      };
      
      // Check if status maps to a pipeline stage
      const targetStage = statusToStageMap[newStatus];
      
      if (targetStage) {
        try {
          // Get current deals to check if one exists for this lead
          const currentDeals = await getDeals();
          const existingDeal = currentDeals.find(deal => deal.leadId === leadId.toString());
          
          if (existingDeal) {
            // Update existing deal to the new stage
            await updateDeal(existingDeal.Id, { stage: targetStage });
            toast.success(`Lead status updated and deal moved to ${targetStage} stage!`);
          } else {
            // Create new deal in the target stage
            const dealData = {
              name: `${updatedLead.website_url} Deal`,
              leadName: updatedLead.website_url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
              leadId: leadId.toString(),
              value: updatedLead.arr || 0,
              stage: targetStage,
              assignedRep: "Unassigned",
              startMonth: new Date().getMonth() + 1,
              endMonth: new Date().getMonth() + 3,
              edition: updatedLead.edition || "Select Edition"
            };
            await createDeal(dealData);
          }
        } catch (dealError) {
          console.error("Failed to handle deal operation:", dealError);
          toast.warning("Lead status updated, but failed to sync with deal pipeline");
        }
      } else {
        toast.success("Lead status updated successfully!");
      }
    } catch (err) {
      toast.error("Failed to update lead status");
    }
  };

const handleDelete = async (leadId) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    
    try {
      await deleteLead(leadId);
      setData(prevData => prevData.filter(lead => lead.Id !== leadId));
      setSelectedLeads(prevSelected => prevSelected.filter(id => id !== leadId));
      toast.success("Lead deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete lead");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const leadId of selectedLeads) {
        try {
          await deleteLead(leadId);
          successCount++;
        } catch (err) {
          failCount++;
        }
      }
      
      // Update the data by removing successfully deleted leads
      setData(prevData => prevData.filter(lead => !selectedLeads.includes(lead.Id)));
      setSelectedLeads([]);
      setShowBulkDeleteDialog(false);
      
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully deleted ${successCount} lead${successCount > 1 ? 's' : ''}`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Deleted ${successCount} lead${successCount > 1 ? 's' : ''}, failed to delete ${failCount}`);
      } else {
        toast.error("Failed to delete selected leads");
      }
    } catch (err) {
      toast.error("Failed to delete leads");
      setShowBulkDeleteDialog(false);
    }
  };

  const handleAddLead = async (leadData) => {
    try {
      const newLead = await createLead(leadData);
      setData(prevData => [newLead, ...prevData]);
      setShowAddForm(false);
      toast.success("Lead added successfully!");
    } catch (err) {
      toast.error("Failed to add lead");
    }
  };

const handleUpdateLead = async (leadId, updates) => {
    try {
      const updatedLead = await updateLead(leadId, updates);
      setData(prevData => 
        prevData.map(lead => 
          lead.Id === leadId ? updatedLead : lead
        )
      );
      setEditingLead(null);
      toast.success("Lead updated successfully!");
    } catch (err) {
      toast.error("Failed to update lead");
    }
  };

  const toggleLeadSelection = (leadId) => {
    setSelectedLeads(prevSelected => {
      if (prevSelected.includes(leadId)) {
        return prevSelected.filter(id => id !== leadId);
      } else {
        return [...prevSelected, leadId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredAndSortedData.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredAndSortedData.map(lead => lead.Id));
    }
  };

  const clearSelection = () => {
    setSelectedLeads([]);
  };

// Validation functions
  const validateField = (field, value, leadData = {}) => {
    const errors = [];
    
    switch (field) {
      case 'Name':
      case 'website_url':
        if (!value || value.toString().trim() === '') {
          errors.push(`${field === 'website_url' ? 'Website URL' : 'Name'} is required`);
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push('Please enter a valid email address');
        }
        break;
      case 'website_url':
        if (value && !value.match(/^https?:\/\/.+\..+/)) {
          errors.push('Please enter a valid website URL');
        }
        break;
    }
    
    return errors;
  };

  const validateRow = (leadData) => {
    const allErrors = {};
    const requiredFields = ['Name', 'website_url'];
    
    requiredFields.forEach(field => {
      const fieldErrors = validateField(field, leadData[field], leadData);
      if (fieldErrors.length > 0) {
        allErrors[field] = fieldErrors;
      }
    });
    
    // Validate optional fields if they have values
    if (leadData.email) {
      const emailErrors = validateField('email', leadData.email, leadData);
      if (emailErrors.length > 0) {
        allErrors.email = emailErrors;
      }
    }
    
    return allErrors;
  };

  // Auto-save system
  const performAutoSave = async (leadId, field, value, skipValidation = false) => {
    try {
      // Get current lead data with optimistic updates
      const currentLead = data.find(lead => lead.Id === leadId);
      if (!currentLead) return;

      const updatedLead = {
        ...currentLead,
        ...optimisticData[leadId],
        [field]: field === 'arr' ? Number(value) * 1000000 : value
      };

      // Validate if not skipping
      if (!skipValidation) {
        const validationErrors = validateRow(updatedLead);
        if (Object.keys(validationErrors).length > 0) {
          setPendingValidation(prev => ({
            ...prev,
            [leadId]: validationErrors
          }));
          
          // Show first error
          const firstError = Object.values(validationErrors)[0][0];
          toast.error(firstError);
          return;
        }
      }

      // Clear validation errors for this row
      setPendingValidation(prev => {
        const newState = { ...prev };
        delete newState[leadId];
        return newState;
      });

      // Set saving state
      setSavingStates(prev => ({ ...prev, [leadId]: true }));

      // Perform the actual save
      let processedValue = value;
      if (field === 'arr') {
        processedValue = Number(value) * 1000000;
      }

      const updates = { [field]: processedValue };
      const savedLead = await updateLead(leadId, updates);

      if (savedLead) {
        // Update actual data with server response
        setData(prevData => 
          prevData.map(lead => 
            lead.Id === leadId ? savedLead : lead
          )
        );

        // Clear optimistic data for this row
        setOptimisticData(prev => {
          const newState = { ...prev };
          delete newState[leadId];
          return newState;
        });

        // Clear editing state
        setEditingStates(prev => {
          const newState = { ...prev };
          if (newState[leadId]) {
            delete newState[leadId][field];
            if (Object.keys(newState[leadId]).length === 0) {
              delete newState[leadId];
            }
          }
          return newState;
        });

        toast.success("Changes saved successfully");
      }
    } catch (err) {
      // Rollback optimistic update on error
      setOptimisticData(prev => {
        const newState = { ...prev };
        if (newState[leadId] && newState[leadId][field]) {
          delete newState[leadId][field];
          if (Object.keys(newState[leadId]).length === 0) {
            delete newState[leadId];
          }
        }
        return newState;
      });

      toast.error("Failed to save changes: " + (err.message || "Unknown error"));
    } finally {
      // Clear saving state
      setSavingStates(prev => {
        const newState = { ...prev };
        delete newState[leadId];
        return newState;
      });
    }
  };

  // Debounced auto-save (500ms as requested)
  const debouncedAutoSave = (leadId, field, value) => {
    const timeoutKey = `${leadId}-${field}`;
    
    // Clear existing timeout
    if (window.autoSaveTimeouts) {
      clearTimeout(window.autoSaveTimeouts[timeoutKey]);
    } else {
      window.autoSaveTimeouts = {};
    }
    
    // Set new timeout for 500ms
    window.autoSaveTimeouts[timeoutKey] = setTimeout(() => {
      performAutoSave(leadId, field, value);
    }, 500);
  };

  // Handle field changes with optimistic updates
  const handleFieldChange = (leadId, field, value) => {
    // Update optimistic data immediately
    setOptimisticData(prev => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        [field]: field === 'arr' ? Number(value) * 1000000 : value
      }
    }));

    // Set editing state
    setEditingStates(prev => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        [field]: true
      }
    }));

    // Trigger debounced auto-save
    debouncedAutoSave(leadId, field, value);
  };

  // Handle immediate save (Tab, Enter, or manual save)
  const handleImmediateSave = async (leadId, field, value) => {
    // Clear any pending debounced save
    const timeoutKey = `${leadId}-${field}`;
    if (window.autoSaveTimeouts && window.autoSaveTimeouts[timeoutKey]) {
      clearTimeout(window.autoSaveTimeouts[timeoutKey]);
      delete window.autoSaveTimeouts[timeoutKey];
    }

    await performAutoSave(leadId, field, value);
  };

  // Handle row save (Ctrl+S)
  const handleRowSave = async (leadId) => {
    const editingFields = editingStates[leadId];
    if (!editingFields) return;

    // Clear all pending timeouts for this row
    Object.keys(editingFields).forEach(field => {
      const timeoutKey = `${leadId}-${field}`;
      if (window.autoSaveTimeouts && window.autoSaveTimeouts[timeoutKey]) {
        clearTimeout(window.autoSaveTimeouts[timeoutKey]);
        delete window.autoSaveTimeouts[timeoutKey];
      }
    });

    // Get current data with optimistic updates
    const currentLead = data.find(lead => lead.Id === leadId);
    const updatedData = {
      ...currentLead,
      ...optimisticData[leadId]
    };

    // Save all changed fields
    for (const field of Object.keys(editingFields)) {
      await performAutoSave(leadId, field, updatedData[field], true);
    }
  };

  // Handle cancel changes (Escape)
  const handleCancelChanges = (leadId) => {
    // Clear all pending timeouts for this row
    if (editingStates[leadId]) {
      Object.keys(editingStates[leadId]).forEach(field => {
        const timeoutKey = `${leadId}-${field}`;
        if (window.autoSaveTimeouts && window.autoSaveTimeouts[timeoutKey]) {
          clearTimeout(window.autoSaveTimeouts[timeoutKey]);
          delete window.autoSaveTimeouts[timeoutKey];
        }
      });
    }

    // Clear editing state
    setEditingStates(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });

    // Clear optimistic data
    setOptimisticData(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });

    // Clear validation errors
    setPendingValidation(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });

    toast.info("Changes cancelled");
  };

  // Get display value with optimistic updates
  const getDisplayValue = (lead, field) => {
    return optimisticData[lead.Id]?.[field] ?? lead[field];
  };

  // Keyboard event handler
  const handleKeyDown = (e, leadId, field, value) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleImmediateSave(leadId, field, value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelChanges(leadId);
    } else if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleRowSave(leadId);
    }
  };

  // Click outside row detection
  const handleRowClick = (leadId) => {
    // Save any other rows that were being edited
    Object.keys(editingStates).forEach(otherLeadId => {
      if (otherLeadId !== leadId.toString()) {
        handleRowSave(parseInt(otherLeadId));
      }
    });
  };

const handleFieldUpdate = async (leadId, field, value) => {
    await handleImmediateSave(leadId, field, value);
  };

  // Legacy debounced version for compatibility
  const handleFieldUpdateDebounced = (leadId, field, value) => {
    handleFieldChange(leadId, field, value);
  };

// Add empty row for new data entry
const addEmptyRow = () => {
    const newEmptyRow = {
      Id: nextTempId,
      website_url: "",
      team_size: "1-3", 
      arr: 0,
      category: "Accounting Software",
      linkedin_url: "",
      status: "Keep an Eye",
      funding_type: "Bootstrapped",
      follow_up_date: "",
      isEmptyRow: true
    };
    setEmptyRows(prev => [...prev, newEmptyRow]);
    setNextTempId(prev => prev - 1);
  };

// Utility function to parse multiple URLs from input
const parseMultipleUrls = (input) => {
  if (!input || !input.trim()) return [];
  
  // Split by newlines first, then by spaces to handle various paste formats
  const lines = input.split(/\r?\n/).filter(line => line.trim());
  const urls = [];
  
  lines.forEach(line => {
    // Split each line by spaces and filter out empty strings
    const wordsInLine = line.split(/\s+/).filter(word => word.trim());
    wordsInLine.forEach(word => {
      const trimmedWord = word.trim();
      if (trimmedWord) {
        // Clean up common URL prefixes and suffixes
        let cleanUrl = trimmedWord.replace(/^https?:\/\//, '').replace(/\/$/, '');
        // Add https:// prefix if not present
        if (!cleanUrl.includes('://')) {
          cleanUrl = 'https://' + cleanUrl;
        }
        urls.push(cleanUrl);
      }
    });
  });
  
  // Remove duplicates and filter out invalid URLs
  const uniqueUrls = [...new Set(urls)].filter(url => {
    try {
      new URL(url);
      return url.includes('.') && url.length > 4; // Basic URL validation
    } catch {
      return false;
    }
  });
  
  return uniqueUrls;
};

// Handle updates to empty rows
const handleEmptyRowUpdate = async (tempId, field, value) => {
  setEmptyRows(prev => 
    prev.map(row => 
      row.Id === tempId ? { ...row, [field]: field === 'arr' ? Number(value) * 1000000 : value } : row
    )
  );

// If website_url is provided, create lead(s)
  if (field === 'website_url' && value.trim()) {
    const emptyRow = emptyRows.find(row => row.Id === tempId);
    if (emptyRow) {
      try {
        // Parse multiple URLs from the input
        const urls = parseMultipleUrls(value);
        
        if (urls.length === 0) {
          toast.error("No valid URLs found in the input");
          return;
        }
        
        if (urls.length === 1) {
          // Single URL - existing behavior
          const leadData = {
            website_url: urls[0],
            team_size: emptyRow.team_size,
            arr: emptyRow.arr,
            category: emptyRow.category,
            linkedin_url: emptyRow.linkedin_url || `https://linkedin.com/company/${urls[0].replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
            status: emptyRow.status,
            funding_type: emptyRow.funding_type
          };
          
          const newLead = await createLead(leadData);
          setData(prevData => [newLead, ...prevData]);
          
          // Remove the empty row that was converted
          setEmptyRows(prev => prev.filter(row => row.Id !== tempId));
          
          toast.success("Lead created successfully!");
        } else {
          // Multiple URLs - create separate leads for each
          const successfulLeads = [];
          const failedUrls = [];
          
          for (const url of urls) {
            try {
              const leadData = {
                website_url: url,
                team_size: emptyRow.team_size,
                arr: emptyRow.arr,
                category: emptyRow.category,
                linkedin_url: emptyRow.linkedin_url || `https://linkedin.com/company/${url.replace(/^https?:\/\//, '').replace(/\/$/, '')}`,
                status: emptyRow.status,
                funding_type: emptyRow.funding_type
              };
              
              const newLead = await createLead(leadData);
              successfulLeads.push(newLead);
            } catch (err) {
              failedUrls.push({ url, error: err.message });
            }
          }
          
          // Update the data with all successful leads
          if (successfulLeads.length > 0) {
            setData(prevData => [...successfulLeads, ...prevData]);
          }
          
          // Remove the empty row that was converted
          setEmptyRows(prev => prev.filter(row => row.Id !== tempId));
          
          // Provide feedback to user
          if (successfulLeads.length > 0 && failedUrls.length === 0) {
            toast.success(`Successfully created ${successfulLeads.length} leads from ${urls.length} URLs!`);
          } else if (successfulLeads.length > 0 && failedUrls.length > 0) {
            toast.success(`Created ${successfulLeads.length} leads successfully`);
            toast.warning(`Failed to create ${failedUrls.length} leads (duplicates or invalid URLs)`);
          } else {
            toast.error("Failed to create any leads - all URLs were duplicates or invalid");
          }
        }
      } catch (err) {
        toast.error("Failed to create lead: " + err.message);
      }
    }
  }
};

// Debounced version for non-submission updates
  const handleEmptyRowUpdateDebounced = (tempId, field, value) => {
    // Update UI immediately for non-website_url fields
    if (field !== 'website_url') {
      setEmptyRows(prev => 
        prev.map(row => 
          row.Id === tempId ? { ...row, [field]: field === 'arr' ? Number(value) * 1000000 : value } : row
        )
      );
    }
  };

const teamSizeOptions = ["1-3", "11-50", "201-500", "500+", "1001+"];
  const [categoryOptions, setCategoryOptions] = useState([
    "3D Design Software",
    "Accounting Software", 
    "Affiliate Management",
    "AI Chatbot Platform",
    "AI Code Assistant",
    "AI Content Generator",
    "AI Image Generator",
    "AI Meeting Assistant",
    "AI Translation Tool",
    "AI Video Generator",
    "AI Voice Assistant",
    "AI Writing Assistant",
    "Analytics Platform",
    "API Management Platform",
    "Appointment Scheduling",
    "Asset Management System",
    "Audio Editing Software",
    "Backup Software",
    "Billing Management",
    "Blockchain Platform",
    "Blog Management System",
    "Brand Management Platform",
    "Browser Extension",
    "Business Intelligence",
    "Calendar Management",
    "Call Center Software",
    "Campaign Management",
    "CAD Software",
    "Chat Widget",
    "Cloud Storage Platform",
    "Code Repository",
    "Collaboration Platform",
    "Content Management System",
    "Contract Management",
    "Course Builder",
    "CRM",
    "Cryptocurrency Exchange",
    "Customer Support Platform",
    "Database Management System",
    "Development Framework",
    "Digital Asset Management",
    "Digital Signature Platform",
    "Document Management",
    "E-commerce Platform",
    "Email Automation Platform",
    "Email Client",
    "Email Marketing",
    "Employee Monitoring",
    "Event Management Platform",
    "Expense Management",
    "File Compression Tool",
    "File Management",
    "Finance Management",
    "Form Builder",
    "Forum Software",
    "Fraud Detection Platform",
    "Game Development Engine",
    "Graphic Design",
    "Help Desk",
    "HR Management System",
    "Identity Management",
    "Image Optimization Tool",
    "Influencer Marketing Platform",
    "Inventory Management",
    "Invoice Management",
    "Knowledge Base Software",
    "Landing Page Builder",
    "Lead Generation Tool",
    "Learning Management System",
    "Link Management Tool",
    "Live Chat",
    "Live Streaming Platform",
    "Marketing Automation",
    "Meeting Assistant",
    "Mind Mapping Software",
    "Mobile App Builder",
    "Music Production Software",
    "Network Monitoring Tool",
    "Note Taking App",
    "Password Manager",
    "Payment Gateway",
    "Payment Processing",
    "PDF Editor",
    "Performance Monitoring",
    "Photo Editing Software",
    "Podcast Hosting Platform",
    "Point of Sale System",
    "Product Information Management",
    "Project Management",
    "Proposal Management",
    "QR Code Generator",
    "Quality Assurance Platform",
    "Quiz Builder",
    "Recruitment Platform",
    "Remote Desktop Software",
    "Sales Analytics Platform",
    "Sales Enablement Platform",
    "Sales Funnel Builder",
    "Screen Recording Software",
    "Search Engine Optimization",
    "Security Testing Platform",
    "Server Management Tool",
    "Social Media Management",
    "Stock Photo Platform",
    "Survey Platform",
    "Task Management",
    "Tax Software",
    "Team Communication",
    "Time Tracking Software",
    "Transcription Software",
    "User Feedback Platform",
    "Vibe Coding Software",
    "Video Conferencing",
    "Video Editing Software",
    "Virtual Event Platform",
    "VPN",
    "Web Analytics Platform",
    "Website Builder",
    "Website Monitoring Tool",
    "Webinar Platform",
    "White Label Platform",
    "WordPress Plugin",
    "Workflow Automation",
    "Other"
  ]);
  const statusOptions = [
    "Launched on AppSumo", "Launched on Prime Club", "Keep an Eye", "Rejected", 
    "Unsubscribed", "Outdated", "Hotlist", "Out of League", "Connected", 
    "Locked", "Meeting Booked", "Meeting Done", "Negotiation", "Closed Lost"
  ];
  const fundingTypeOptions = ["Bootstrapped", "Pre-seed", "Y Combinator", "Angel", "Series A", "Series B", "Series C"];

  const handleCreateCategory = (newCategory) => {
    if (newCategory.trim() && !categoryOptions.includes(newCategory.trim())) {
      setCategoryOptions(prev => [...prev, newCategory.trim()]);
      toast.success(`Category "${newCategory.trim()}" created successfully!`);
      return newCategory.trim();
    }
    return null;
  };
const getStatusColor = (status) => {
    const colors = {
      "Launched on AppSumo": "success",
      "Launched on Prime Club": "primary",
      "Keep an Eye": "info",
      "Rejected": "error",
      "Unsubscribed": "warning",
      "Outdated": "default",
      "Hotlist": "primary",
      "Out of League": "error",
      "Connected": "info",
      "Locked": "warning",
      "Meeting Booked": "primary",
      "Meeting Done": "success",
      "Negotiation": "warning",
      "Closed Lost": "error"
    };
    return colors[status] || "default";
  };

const filteredAndSortedData = data
    .filter(lead => {
      const matchesSearch = !searchTerm || 
        lead.website_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.team_size.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesFunding = fundingFilter === "all" || lead.funding_type === fundingFilter;
      const matchesCategory = categoryFilter === "all" || lead.category === categoryFilter;
      const matchesTeamSize = teamSizeFilter === "all" || lead.team_size === teamSizeFilter;
      
      return matchesSearch && matchesStatus && matchesFunding && matchesCategory && matchesTeamSize;
    })
.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "arr") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (sortBy === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortBy === "website_url") {
        // Sort website_url by creation date (newest first) instead of alphabetical
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
};

// Always maintain one empty row at the top
  useEffect(() => {
    if (!loading && emptyRows.length === 0) {
      addEmptyRow();
    }
  }, [loading, emptyRows.length]);

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={loadLeads} />;

  return (
    <motion.div
    initial={{
        opacity: 0,
        y: 20
    }}
    animate={{
        opacity: 1,
        y: 0
    }}
    transition={{
        duration: 0.3
    }}
    className="space-y-6">
    {/* Header */}
    <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600">Manage your lead pipeline and track opportunities</p>
        </div>
        <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="shrink-0">
            <ApperIcon name="Plus" size={16} className="mr-2" />Add New Lead
                    </Button>
    </div>
    {/* Search and Filters */}
    <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
                <SearchBar
                    placeholder="Search by website, category, or team size..."
                    onSearch={setSearchTerm} />
</div>
            <div className="flex flex-col sm:flex-row gap-2">
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">All Statuses</option>
                    <option value="Launched on AppSumo">Launched on AppSumo</option>
                    <option value="Launched on Prime Club">Launched on Prime Club</option>
                    <option value="Keep an Eye">Keep an Eye</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Unsubscribed">Unsubscribed</option>
                    <option value="Outdated">Outdated</option>
                    <option value="Hotlist">Hotlist</option>
                    <option value="Out of League">Out of League</option>
                    <option value="Connected">Connected</option>
                    <option value="Locked">Locked</option>
                    <option value="Meeting Booked">Meeting Booked</option>
                    <option value="Meeting Done">Meeting Done</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closed Lost">Closed Lost</option>
                </select>
                <select
                    value={fundingFilter}
                    onChange={e => setFundingFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">All Funding Types</option>
                    <option value="Bootstrapped">Bootstrapped</option>
                    <option value="Pre-seed">Pre-seed</option>
                    <option value="Y Combinator">Y Combinator</option>
                    <option value="Angel">Angel</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B">Series B</option>
                    <option value="Series C">Series C</option>
                </select>
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">All Categories</option>
                    {categoryOptions.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <select
                    value={teamSizeFilter}
                    onChange={e => setTeamSizeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">All Team Sizes</option>
                    {teamSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
            </div>
        </div>
    </Card>
{/* Leads Table */}
    <Card className="overflow-hidden">
      {data.length === 0 && emptyRows.length === 0 ? (
        <Empty
          title="No leads found"
          description="Add your first lead to get started with lead management"
          actionText="Add Lead"
          onAction={() => setShowAddForm(true)}
          icon="Building2"
        />
      ) : (
        <div className="relative">
            {/* Top scrollbar for easier horizontal navigation */}
            <div 
              ref={setTopScrollbarRef}
              className="top-scrollbar overflow-x-auto border-b border-gray-200 bg-gray-50 mb-0"
              style={{ height: '17px' }}
            >
              <div className="top-scrollbar-content" style={{ width: '1200px', height: '1px' }}></div>
            </div>
            
            <div 
              ref={setTableScrollbarRef}
              className="overflow-x-auto"
            >
                <table className="w-full min-w-[1200px]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[50px]">
                                <input
                                    type="checkbox"
                                    checked={selectedLeads.length === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
<th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                                <button
                                    onClick={() => handleSort("website_url")}
                                    className="flex items-center gap-1 hover:text-gray-700">Website URL
                                                            <ApperIcon name="ArrowUpDown" size={12} />
                                </button>
                            </th>
<th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                                <button
                                    onClick={() => handleSort("team_size")}
                                    className="flex items-center gap-1 hover:text-gray-700">Team Size
                                                            <ApperIcon name="ArrowUpDown" size={12} />
                                </button>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                                <button
                                    onClick={() => handleSort("arr")}
                                    className="flex items-center gap-1 hover:text-gray-700">ARR (M)
                                                            <ApperIcon name="ArrowUpDown" size={12} />
                                </button>
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Category
                                                    </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">LinkedIn
                                                    </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Status
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Funding Type
                                                    </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">Follow-up Date
                                                    </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Added By
                                                    </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px] sticky right-0 bg-gray-50 border-l border-gray-200">Actions
                                                    </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Empty rows for direct data entry - positioned at top */}
                        {emptyRows.map(
emptyRow => <tr key={`empty-${emptyRow.Id}`} className="hover:bg-gray-50 empty-row">
                                <td className="px-6 py-4 whitespace-nowrap w-[50px]">
                                    <input
                                        type="checkbox"
                                        disabled
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 opacity-50"
                                    />
                                </td>
<td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                                    <Input
                                        type="url"
                                        value={emptyRow.website_url}
                                        detectUrlPrefix={true}
                                        urlPrefix="https://"
                                        onChange={e => setEmptyRows(prev => prev.map(row => row.Id === emptyRow.Id ? {
                                            ...row,
                                            website_url: e.target.value
                                        } : row))}
                                        onBlur={e => handleEmptyRowUpdate(emptyRow.Id, "website_url", e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                handleEmptyRowUpdate(emptyRow.Id, "website_url", e.target.value);
                                            }
                                        }}
                                        placeholder="Enter website URL..."
                                        className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 text-primary-600 font-medium placeholder-gray-400" />
                                </td>
                                <td
className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[150px]">
                                    <select
                                        value={emptyRow.team_size}
                                        onChange={e => handleEmptyRowUpdate(emptyRow.Id, "team_size", e.target.value)}
                                        className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full text-gray-500">
                                        {teamSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </td>
                                <td
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[120px]">
                                    <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={(emptyRow.arr / 1000000).toFixed(1)}
                                        onChange={e => handleEmptyRowUpdateDebounced(emptyRow.Id, "arr", e.target.value)}
                                        onBlur={e => handleEmptyRowUpdate(emptyRow.Id, "arr", e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                handleEmptyRowUpdate(emptyRow.Id, "arr", e.target.value);
                                            }
}}
                                        placeholder="0.0"
                                        className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full placeholder-gray-400" />
                                </td>
                                <td
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[150px]">
                                    <SearchableSelect
                                        value={emptyRow.category}
                                        options={categoryOptions}
                                        placeholder="Select category..."
                                        className="text-gray-500"
                                        onCreateCategory={handleCreateCategory}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap min-w-[100px]">
<Input
                                        type="url"
                                        value={emptyRow.linkedin_url}
                                        onChange={e => handleEmptyRowUpdateDebounced(emptyRow.Id, "linkedin_url", e.target.value)}
                                        onBlur={e => handleEmptyRowUpdate(emptyRow.Id, "linkedin_url", e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                handleEmptyRowUpdate(emptyRow.Id, "linkedin_url", e.target.value);
                                            }
                                        }}
                                        placeholder="LinkedIn URL..."
                                        className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full placeholder-gray-400 text-sm" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                                    <div className="relative">
                                        <Badge
                                            variant={getStatusColor(emptyRow.status)}
                                            className="cursor-pointer hover:shadow-md transition-shadow opacity-60">
                                            {emptyRow.status}
                                        </Badge>
                                        <select
                                            value={emptyRow.status}
                                            onChange={e => handleEmptyRowUpdate(emptyRow.Id, "status", e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full">
                                            {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                                    <div className="relative">
<Badge
                                            variant={emptyRow.funding_type === "Series C" ? "primary" : "default"}
                                            className="cursor-pointer hover:shadow-md transition-shadow opacity-60">
                                            {emptyRow.funding_type}
                                        </Badge>
                                        <select
                                            value={emptyRow.funding_type}
                                            onChange={e => handleEmptyRowUpdate(emptyRow.Id, "funding_type", e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full">
                                            {fundingTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap min-w-[130px]">
<Input
                                        type="date"
                                        value={emptyRow.follow_up_date ? emptyRow.follow_up_date.split('T')[0] : ''}
                                        onChange={e => handleEmptyRowUpdateDebounced(emptyRow.Id, "follow_up_date", e.target.value ? new Date(e.target.value).toISOString() : '')}
                                        onBlur={e => handleEmptyRowUpdate(emptyRow.Id, "follow_up_date", e.target.value ? new Date(e.target.value).toISOString() : '')}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                handleEmptyRowUpdate(emptyRow.Id, "follow_up_date", e.target.value ? new Date(e.target.value).toISOString() : '');
                                            }
                                        }}
                                        className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full placeholder-gray-400 text-sm" />
                                </td>
                                <td
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px]">
                                    <span className="italic">Current User</span>
                                </td>
                                <td
                                    className="px-6 py-4 whitespace-nowrap text-sm font-medium w-[120px] sticky right-0 bg-white border-l border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEmptyRows(prev => prev.filter(row => row.Id !== emptyRow.Id))}
                                            className="text-gray-400 hover:text-red-600 p-1 hover:bg-gray-100 rounded"
                                            title="Remove empty row">
                                            <ApperIcon name="X" size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {/* Existing leads data */}
{filteredAndSortedData.map(lead => <tr key={lead.Id} className="hover:bg-gray-50" onClick={() => handleRowClick(lead.Id)}>
                            <td className="px-6 py-4 whitespace-nowrap w-[50px]">
                                <input
                                    type="checkbox"
                                    checked={selectedLeads.includes(lead.Id)}
                                    onChange={() => toggleLeadSelection(lead.Id)}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </td>
<td className="px-6 py-4 whitespace-nowrap min-w-[200px] relative">
                                <div className="flex items-center gap-2">
                                  <Input
                                      type="url"
                                      value={getDisplayValue(lead, 'website_url')}
                                      detectUrlPrefix={true}
                                      urlPrefix="https://"
                                      onChange={e => handleFieldChange(lead.Id, "website_url", e.target.value)}
                                      onBlur={e => handleImmediateSave(lead.Id, "website_url", e.target.value)}
                                      onKeyDown={e => handleKeyDown(e, lead.Id, "website_url", e.target.value)}
                                      className={`border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 text-primary-600 font-medium ${
                                        pendingValidation[lead.Id]?.website_url ? 'border-red-300 bg-red-50' : ''
                                      }`} />
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.website_url && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                {pendingValidation[lead.Id]?.website_url && (
                                  <div className="absolute top-full left-0 text-xs text-red-600 bg-white border border-red-200 rounded px-2 py-1 shadow-sm z-10">
                                    {pendingValidation[lead.Id].website_url[0]}
                                  </div>
                                )}
                            </td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[150px] relative">
                                <div className="flex items-center gap-2">
                                  <select
                                      value={getDisplayValue(lead, 'team_size')}
                                      onChange={e => handleFieldChange(lead.Id, "team_size", e.target.value)}
                                      onBlur={e => handleImmediateSave(lead.Id, "team_size", e.target.value)}
                                      onKeyDown={e => handleKeyDown(e, lead.Id, "team_size", e.target.value)}
                                      className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full">
                                      {teamSizeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.team_size && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[120px] relative">
                                <div className="flex items-center gap-2">
                                  <Input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      value={(getDisplayValue(lead, 'arr') / 1000000).toFixed(1)}
                                      onChange={e => handleFieldChange(lead.Id, "arr", e.target.value)}
                                      onBlur={e => handleImmediateSave(lead.Id, "arr", e.target.value)}
                                      onKeyDown={e => handleKeyDown(e, lead.Id, "arr", e.target.value)}
                                      className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full" />
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.arr && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
</div>
                                  )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[150px] relative">
                                <div className="flex items-center gap-2">
                                  <SearchableSelect
                                      value={getDisplayValue(lead, 'category')}
                                      onChange={(value) => {
                                        handleFieldChange(lead.Id, "category", value);
                                        handleImmediateSave(lead.Id, "category", value);
                                      }}
                                      options={categoryOptions}
                                      placeholder="Select category..."
                                      onCreateCategory={handleCreateCategory}
                                  />
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.category && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                            </td>
<td className="px-6 py-4 whitespace-nowrap min-w-[100px] relative">
                                <div className="flex items-center gap-2">
                                  <Input
                                      type="url"
                                      value={getDisplayValue(lead, 'linkedin_url')}
                                      onChange={e => handleFieldChange(lead.Id, "linkedin_url", e.target.value)}
                                      onBlur={e => handleImmediateSave(lead.Id, "linkedin_url", e.target.value)}
                                      onKeyDown={e => handleKeyDown(e, lead.Id, "linkedin_url", e.target.value)}
                                      placeholder="LinkedIn URL..."
                                      className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full placeholder-gray-400 text-sm flex-1" />
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.linkedin_url && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                  {getDisplayValue(lead, 'linkedin_url') && (
                                      <a
                                          href={getDisplayValue(lead, 'linkedin_url')}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary-600 hover:text-primary-800 flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                                          title="Visit LinkedIn profile">
                                          <ApperIcon name="Linkedin" size={16} />
                                      </a>
                                  )}
</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap min-w-[150px] relative">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                      <Badge
                                          variant={getStatusColor(getDisplayValue(lead, 'status'))}
                                          className="cursor-pointer hover:shadow-md transition-shadow">
                                          {getDisplayValue(lead, 'status')}
                                      </Badge>
                                      <select
                                          value={getDisplayValue(lead, 'status')}
                                          onChange={e => {
                                            handleFieldChange(lead.Id, "status", e.target.value);
                                            handleStatusChange(lead.Id, e.target.value);
                                          }}
                                          onKeyDown={e => handleKeyDown(e, lead.Id, "status", e.target.value)}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full">
                                          {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                      </select>
                                  </div>
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.status && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                            </td>
<td className="px-6 py-4 whitespace-nowrap min-w-[140px] relative">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                      <Badge
                                          variant={getDisplayValue(lead, 'funding_type') === "Series C" ? "primary" : "default"}
                                          className="cursor-pointer hover:shadow-md transition-shadow">
                                          {getDisplayValue(lead, 'funding_type')}
                                      </Badge>
                                      <select
                                          value={getDisplayValue(lead, 'funding_type')}
                                          onChange={e => {
                                            handleFieldChange(lead.Id, "funding_type", e.target.value);
                                            handleImmediateSave(lead.Id, "funding_type", e.target.value);
                                          }}
                                          onKeyDown={e => handleKeyDown(e, lead.Id, "funding_type", e.target.value)}
                                          className="absolute inset-0 opacity-0 cursor-pointer w-full">
                                          {fundingTypeOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                      </select>
                                  </div>
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.funding_type && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                            </td>
<td className="px-6 py-4 whitespace-nowrap min-w-[130px] relative">
                                <div className="flex items-center gap-2">
                                  <Input
                                      type="date"
                                      value={getDisplayValue(lead, 'follow_up_date') ? getDisplayValue(lead, 'follow_up_date').split('T')[0] : ''}
                                      onChange={e => {
                                          const newDate = e.target.value ? new Date(e.target.value).toISOString() : '';
                                          handleFieldChange(lead.Id, "follow_up_date", newDate);
                                      }}
                                      onBlur={e => {
                                          const newDate = e.target.value ? new Date(e.target.value).toISOString() : '';
                                          handleImmediateSave(lead.Id, "follow_up_date", newDate);
                                      }}
                                      onKeyDown={e => {
                                          const newDate = e.target.value ? new Date(e.target.value).toISOString() : '';
                                          handleKeyDown(e, lead.Id, "follow_up_date", newDate);
                                      }}
                                      className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full text-sm" />
                                  {savingStates[lead.Id] && editingStates[lead.Id]?.follow_up_date && (
                                    <div className="animate-spin">
                                      <ApperIcon name="Loader2" size={14} className="text-gray-400" />
                                    </div>
                                  )}
                                </div>
                            </td>
                            <td
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[120px]">
                                <div className="flex items-center">
<ApperIcon name="User" size={14} className="mr-2 text-gray-400" />
                                    <span>{lead.added_by_name || "Unknown"}</span>
                                </div>
                            </td>
                            <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium w-[120px] sticky right-0 bg-white border-l border-gray-200">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingLead(lead)}
                                        className="text-primary-600 hover:text-primary-800 p-1 hover:bg-gray-100 rounded">
                                        <ApperIcon name="Edit" size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lead.Id)}
                                        className="text-red-600 hover:text-red-800 p-1 hover:bg-gray-100 rounded">
                                        <ApperIcon name="Trash2" size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>)}
                    </tbody>
                </table>
</div>
        </div>
      )}
</Card>
    
    {/* Auto-save status indicator */}
    {Object.keys(editingStates).length > 0 && (
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <ApperIcon name="Edit3" size={14} className="text-blue-600" />
            <span className="text-gray-600">
              {Object.keys(editingStates).length} row{Object.keys(editingStates).length > 1 ? 's' : ''} editing
            </span>
          </div>
          <div className="text-xs text-gray-400 border-l border-gray-200 pl-2">
            <div>Auto-save in 500ms</div>
            <div className="flex items-center gap-1 mt-1">
              <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded">Ctrl+S</kbd>
              <span>Save</span>
              <kbd className="px-1 py-0.5 text-xs bg-gray-100 border border-gray-200 rounded ml-2">Esc</kbd>
              <span>Cancel</span>
            </div>
          </div>
        </div>
      </div>
    )}
    
    {/* Bulk Actions */}
    {selectedLeads.length > 0 && (
      <Card className="p-4 bg-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ApperIcon name="CheckCircle" size={20} className="text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="text-primary-600 border-primary-300 hover:bg-primary-100"
            >
              Clear Selection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <ApperIcon name="Trash2" size={16} className="mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      </Card>
    )}
    
    {/* Add Lead Modal */}
    {showAddForm && <AddLeadModal
      onClose={() => setShowAddForm(false)} 
      onSubmit={handleAddLead}
      categoryOptions={categoryOptions}
      onCreateCategory={handleCreateCategory}
    />}
    {/* Edit Lead Modal */}
    {editingLead && <EditLeadModal
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSubmit={handleUpdateLead}
        categoryOptions={categoryOptions}
        onCreateCategory={handleCreateCategory}
    />}
    {/* Bulk Delete Confirmation Dialog */}
    {showBulkDeleteDialog && (
      <BulkDeleteConfirmationDialog
        selectedCount={selectedLeads.length}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteDialog(false)}
      />
    )}
</motion.div>
  );
};

// Searchable Select Component for Categories
const SearchableSelect = ({ value, onChange, options, placeholder = "Select...", className = "", onCreateCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    const filtered = options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreateCategory = () => {
    if (onCreateCategory && searchTerm.trim()) {
      const newCategory = onCreateCategory(searchTerm.trim());
      if (newCategory) {
        onChange(newCategory);
        setIsOpen(false);
        setSearchTerm("");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (onCreateCategory && searchTerm.trim()) {
        handleCreateCategory();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="border-0 bg-transparent p-1 hover:bg-gray-50 focus:bg-white focus:border-gray-300 w-full cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ApperIcon name={isOpen ? "ChevronUp" : "ChevronDown"} size={14} className="text-gray-400" />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <ApperIcon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search categories..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${
                    value === option ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </div>
              ))
            ) : (
              <>
                {onCreateCategory && searchTerm.trim() ? (
                  <div
                    className="px-3 py-2 cursor-pointer hover:bg-primary-50 text-sm text-primary-600 flex items-center gap-2 border-b border-gray-100"
                    onClick={handleCreateCategory}
                  >
                    <ApperIcon name="Plus" size={14} />
                    <span>Create new category: "{searchTerm.trim()}"</span>
                  </div>
                ) : null}
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  {searchTerm.trim() ? "No matching categories found" : "No categories found"}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {setIsOpen(false); setSearchTerm("");}}
        />
      )}
    </div>
  );
};

const AddLeadModal = ({ onClose, onSubmit, categoryOptions, onCreateCategory }) => {
const [formData, setFormData] = useState({
    website_url: "",
    team_size: "1-3",
    arr: "",
    category: "",
    linkedin_url: "",
    status: "Keep an Eye",
    funding_type: "Bootstrapped",
    edition: "Select Edition"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      arr: Number(formData.arr)
    });
  };

return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold">Add New Lead</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <ApperIcon name="X" size={20} />
          </button>
        </div>
<div className="overflow-y-auto max-h-[70vh] flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
</label>
<Input
              type="url"
              value={formData.website_url}
              detectUrlPrefix={true}
              urlPrefix="https://"
              onChange={(e) => setFormData({...formData, website_url: e.target.value})}
              placeholder="https://example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Size
</label>
<select
              value={formData.team_size}
              onChange={(e) => setFormData({...formData, team_size: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
<option value="1-3">1-3</option>
              <option value="11-50">11-50</option>
              <option value="201-500">201-500</option>
              <option value="500+">500+</option>
              <option value="1001+">1001+</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ARR (USD)
            </label>
            <Input
              type="number"
              value={formData.arr}
              onChange={(e) => setFormData({...formData, arr: e.target.value})}
              placeholder="150000"
              required
            />
          </div>
<div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="relative">
              <SearchableSelect
                value={formData.category}
                onChange={(value) => setFormData({...formData, category: value})}
                options={categoryOptions}
                placeholder="Select category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onCreateCategory={onCreateCategory}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
            </label>
<Input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
              placeholder="https://linkedin.com/company/example"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
>
              <option value="Launched on AppSumo">Launched on AppSumo</option>
              <option value="Launched on Prime Club">Launched on Prime Club</option>
              <option value="Keep an Eye">Keep an Eye</option>
              <option value="Rejected">Rejected</option>
              <option value="Unsubscribed">Unsubscribed</option>
              <option value="Outdated">Outdated</option>
              <option value="Hotlist">Hotlist</option>
              <option value="Out of League">Out of League</option>
              <option value="Connected">Connected</option>
              <option value="Locked">Locked</option>
              <option value="Meeting Booked">Meeting Booked</option>
              <option value="Meeting Done">Meeting Done</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funding Type
            </label>
<select
              value={formData.funding_type}
              onChange={(e) => setFormData({...formData, funding_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Bootstrapped">Bootstrapped</option>
              <option value="Pre-seed">Pre-seed</option>
              <option value="Y Combinator">Y Combinator</option>
              <option value="Angel">Angel</option>
              <option value="Series A">Series A</option>
              <option value="Series B">Series B</option>
              <option value="Series C">Series C</option>
</select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edition
            </label>
            <select
              value={formData.edition}
              onChange={(e) => setFormData({...formData, edition: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Select Edition">Select Edition</option>
              <option value="Black Edition">Black Edition</option>
              <option value="Collector's Edition">Collector's Edition</option>
              <option value="Limited Edition">Limited Edition</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Lead
            </Button>
</div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditLeadModal = ({ lead, onClose, onSubmit, categoryOptions, onCreateCategory }) => {
const [formData, setFormData] = useState({
    website_url: lead.website_url,
    team_size: lead.team_size,
    arr: lead.arr.toString(),
    category: lead.category,
    linkedin_url: lead.linkedin_url,
    status: lead.status,
    funding_type: lead.funding_type,
    edition: lead.edition || "Select Edition"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(lead.Id, {
      ...formData,
      arr: Number(formData.arr)
    });
  };

  return (
    <div
    className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">Edit Lead</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <ApperIcon name="X" size={20} />
            </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL
                                </label>
<Input
                    type="url"
                    value={formData.website_url}
                    detectUrlPrefix={true}
                    urlPrefix="https://"
                    onChange={e => setFormData({
                        ...formData,
                        website_url: e.target.value
                    })}
required />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Size
                </label>
<select
                        value={formData.team_size}
                        onChange={e => setFormData({
                            ...formData,
                            team_size: e.target.value
})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
<option value="1-3">1-3</option>
                    <option value="11-50">11-50</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                    <option value="1001+">1001+</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ARR (USD)
                                    </label>
                    <Input
                        type="number"
                        value={formData.arr}
                        onChange={e => setFormData({
                            ...formData,
                            arr: e.target.value
                        })}
                        required />
</div>
            
            <div>
<label className="block text-sm font-medium text-gray-700 mb-1">Category
                </label>
                <div className="relative">
                    <SearchableSelect
                        value={formData.category}
                        onChange={(value) => setFormData({
                            ...formData,
                                category: value
                            })}
                            options={categoryOptions}
                            placeholder="Select category..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onCreateCategory={onCreateCategory}
                        />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL
                                    </label>
<Input
                        type="url"
                        value={formData.linkedin_url}
                        onChange={e => setFormData({
                            ...formData,
                            linkedin_url: e.target.value
                        })}
required />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status
                                    </label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData({
                            ...formData,
                            status: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="Launched on AppSumo">Launched on AppSumo</option>
                        <option value="Launched on Prime Club">Launched on Prime Club</option>
                        <option value="Keep an Eye">Keep an Eye</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Unsubscribed">Unsubscribed</option>
                        <option value="Outdated">Outdated</option>
                        <option value="Hotlist">Hotlist</option>
                        <option value="Out of League">Out of League</option>
                        <option value="Connected">Connected</option>
                        <option value="Locked">Locked</option>
                        <option value="Meeting Booked">Meeting Booked</option>
                        <option value="Meeting Done">Meeting Done</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Closed Lost">Closed Lost</option>
</select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funding Type
                                    </label>
<select
                        value={formData.funding_type}
                        onChange={e => setFormData({
                            ...formData,
                            funding_type: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="Bootstrapped">Bootstrapped</option>
                        <option value="Pre-seed">Pre-seed</option>
                        <option value="Y Combinator">Y Combinator</option>
                        <option value="Angel">Angel</option>
                        <option value="Series A">Series A</option>
                        <option value="Series B">Series B</option>
<option value="Series C">Series C</option>
                    </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edition
                                    </label>
                    <select
                        value={formData.edition}
                        onChange={e => setFormData({
                            ...formData,
                            edition: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="Select Edition">Select Edition</option>
                        <option value="Black Edition">Black Edition</option>
                        <option value="Collector's Edition">Collector's Edition</option>
                        <option value="Limited Edition">Limited Edition</option>
</select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit">
                    Update Lead
                </Button>
            </div>
</form>
    </div>
</div>
  );
};

const BulkDeleteConfirmationDialog = ({ selectedCount, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <ApperIcon name="AlertTriangle" size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Bulk Delete</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <ApperIcon name="X" size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <span className="font-semibold">{selectedCount}</span> selected lead{selectedCount > 1 ? 's' : ''}?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This will permanently remove the selected leads from your database. This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <ApperIcon name="Trash2" size={16} className="mr-2" />
              Delete {selectedCount} Lead{selectedCount > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leads;