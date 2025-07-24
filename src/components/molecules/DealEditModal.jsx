import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ApperIcon from "@/components/ApperIcon";
import { getLeads } from "@/services/api/leadsService";
const DealEditModal = ({ isOpen, onClose, deal, onSave, isCreateMode = false }) => {
  const [formData, setFormData] = useState({
    name: "",
    leadName: "",
    value: "",
    stage: "",
    edition: "",
    assignedRep: "",
    startMonth: "",
    endMonth: ""
});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
const stages = [
    "Connected",
    "Locked", 
    "Meeting Booked",
    "Meeting Done",
    "Negotiation",
    "Closed",
    "Lost"
  ];

  const editions = [
    "Select Edition",
    "Limited Edition",
    "Collector's Edition", 
    "Black Edition"
  ];

  const salesReps = [
    "Sarah Johnson",
    "Mike Davis",
    "Tom Wilson"
  ];

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

// Clean deal name by removing URL protocols and "Deal" suffix
  const cleanDealName = (name) => {
    if (!name) return "";
    
    let cleaned = name;
    
    // Remove URL protocols
    cleaned = cleaned.replace(/^https?:\/\//, "");
    
    // Remove "Deal" suffix (case insensitive, with optional preceding space)
    cleaned = cleaned.replace(/\s*deal\s*$/i, "");
    
    return cleaned.trim();
  };

  useEffect(() => {
    const loadLeads = async () => {
      if (isCreateMode && isOpen) {
        setLoadingLeads(true);
        try {
          const leadsData = await getLeads();
          setLeads(leadsData);
        } catch (error) {
          console.error("Error loading leads:", error);
          toast.error("Failed to load leads");
        } finally {
          setLoadingLeads(false);
        }
      }
    };

    if (isOpen) {
      loadLeads();
      
      if (isCreateMode) {
        // Clear form for create mode
        setFormData({
          name: "",
          leadName: "",
          value: "",
          stage: "",
          edition: "",
          assignedRep: "",
          startMonth: "",
          endMonth: ""
        });
      } else if (deal) {
        // Populate form for edit mode with cleaned deal name
        const cleanedName = cleanDealName(deal.name || deal.Name || "");
        setFormData({
          name: cleanedName,
          leadName: deal.leadName || deal.lead_name || "",
          value: deal.value?.toString() || "",
          stage: deal.stage || "",
          edition: deal.edition || "",
          assignedRep: deal.assignedRep || deal.assigned_rep || "",
          startMonth: deal.startMonth?.toString() || deal.start_month?.toString() || "",
          endMonth: deal.endMonth?.toString() || deal.end_month?.toString() || ""
        });
      }
      setErrors({});
    }
  }, [deal, isOpen, isCreateMode]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Deal name is required";
    }
    
    if (!formData.leadName.trim()) {
      newErrors.leadName = "Lead name is required";
    }
    
    if (!formData.value || isNaN(formData.value) || Number(formData.value) <= 0) {
      newErrors.value = "Please enter a valid deal value";
    }
    
    if (!formData.stage) {
      newErrors.stage = "Stage is required";
    }
    
    if (!formData.assignedRep) {
      newErrors.assignedRep = "Assigned rep is required";
    }

    if (formData.startMonth && formData.endMonth) {
      if (Number(formData.startMonth) > Number(formData.endMonth)) {
        newErrors.endMonth = "End month must be after start month";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Clean the deal name before submission
      const cleanedDealName = cleanDealName(formData.name);
      
      const dealData = {
        name: cleanedDealName,
        leadName: formData.leadName,
        value: Number(formData.value),
        stage: formData.stage,
        edition: formData.edition,
        assignedRep: formData.assignedRep,
        startMonth: formData.startMonth ? Number(formData.startMonth) : null,
        endMonth: formData.endMonth ? Number(formData.endMonth) : null
      };
      
      if (isCreateMode) {
        await onSave(dealData);
        toast.success("Deal created successfully");
      } else {
        await onSave(deal.Id, dealData);
        toast.success("Deal updated successfully");
      }
      onClose();
    } catch (error) {
      toast.error(isCreateMode ? "Failed to create deal" : "Failed to update deal");
    } finally {
      setIsSubmitting(false);
    }
  };

const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

const handleLeadChange = (leadId) => {
    const selectedLead = leads.find(lead => lead.Id.toString() === leadId);
    if (selectedLead) {
      setFormData(prev => ({
        ...prev,
        leadName: selectedLead.Name,
        leadId: selectedLead.Id.toString(),
        name: cleanDealName(selectedLead.Name)
      }));
      // Clear any errors for leadName field
      if (errors.leadName) {
        setErrors(prev => ({ ...prev, leadName: "" }));
      }
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
<Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreateMode ? "Create Deal" : "Edit Deal"}
                </h2>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <ApperIcon name="X" size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deal Name *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter deal name"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

<div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Name *
                    </label>
                    {isCreateMode ? (
                      <div>
                        <select
                          value={formData.leadName ? leads.find(lead => lead.Name === formData.leadName)?.Id || "" : ""}
                          onChange={(e) => handleLeadChange(e.target.value)}
                          className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                            errors.leadName ? "border-red-500" : ""
                          }`}
                          disabled={loadingLeads}
                        >
                          <option value="">
                            {loadingLeads ? "Loading leads..." : "Select a lead"}
                          </option>
                          {leads.map(lead => (
                            <option key={lead.Id} value={lead.Id}>
                              {lead.Name}
                            </option>
                          ))}
                        </select>
                        {formData.leadName && (
                          <Input
                            value={formData.leadName}
                            onChange={(e) => handleInputChange("leadName", e.target.value)}
                            placeholder="Lead name will auto-populate"
                            className="mt-2"
                            readOnly
                          />
                        )}
                      </div>
                    ) : (
                      <Input
                        value={formData.leadName}
                        onChange={(e) => handleInputChange("leadName", e.target.value)}
                        placeholder="Enter lead name"
                        className={errors.leadName ? "border-red-500" : ""}
                      />
                    )}
                    {errors.leadName && (
                      <p className="text-red-500 text-sm mt-1">{errors.leadName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deal Value * ($)
                    </label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => handleInputChange("value", e.target.value)}
                      placeholder="Enter deal value"
                      min="0"
                      step="1000"
                      className={errors.value ? "border-red-500" : ""}
                    />
                    {errors.value && (
                      <p className="text-red-500 text-sm mt-1">{errors.value}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stage *
                    </label>
                    <select
                      value={formData.stage}
                      onChange={(e) => handleInputChange("stage", e.target.value)}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        errors.stage ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select stage</option>
                      {stages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                    {errors.stage && (
                      <p className="text-red-500 text-sm mt-1">{errors.stage}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edition
                    </label>
                    <select
                      value={formData.edition}
                      onChange={(e) => handleInputChange("edition", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {editions.map(edition => (
                        <option key={edition} value={edition}>{edition}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Rep *
                    </label>
                    <select
                      value={formData.assignedRep}
                      onChange={(e) => handleInputChange("assignedRep", e.target.value)}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        errors.assignedRep ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select rep</option>
                      {salesReps.map(rep => (
                        <option key={rep} value={rep}>{rep}</option>
                      ))}
                    </select>
                    {errors.assignedRep && (
                      <p className="text-red-500 text-sm mt-1">{errors.assignedRep}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Month
                    </label>
                    <select
                      value={formData.startMonth}
                      onChange={(e) => handleInputChange("startMonth", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select month</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Month
                    </label>
                    <select
                      value={formData.endMonth}
                      onChange={(e) => handleInputChange("endMonth", e.target.value)}
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        errors.endMonth ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select month</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                    {errors.endMonth && (
                      <p className="text-red-500 text-sm mt-1">{errors.endMonth}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DealEditModal;