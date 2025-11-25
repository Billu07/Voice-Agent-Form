// src/components/form.tsx
import React, { useState } from "react";
import { Phone, Bot, Database, Settings, Zap, FileText } from "lucide-react";

interface FormData {
  agentName: string;
  agentGender: string;
  phoneNumber: string;
  twilioSID: string;
  twilioToken: string;
  knowledgeType: string;
  knowledgeContent: string;
  additionalNotes: string;
}

export default function AutoliniumForm() {
  const [agentType, setAgentType] = useState("");
  const [selectedCRM, setSelectedCRM] = useState("");
  const [selectedReportCRM, setSelectedReportCRM] = useState("");
  const [functionalities, setFunctionalities] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    agentName: "",
    agentGender: "",
    phoneNumber: "",
    twilioSID: "",
    twilioToken: "",
    knowledgeType: "",
    knowledgeContent: "",
    additionalNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const functionalityOptions = [
    "Book Appointment",
    "Create Ticket",
    "SMS Follow-up",
    "Collect Information",
    "Qualify Lead",
  ];

  const crmOptions = [
    "Google Sheets",
    "Podio",
    "HubSpot",
    "GoHighLevel (GHL)",
    "Turnkey",
    "Salesforce",
    "Other",
  ];

  const toggleFunctionality = (func: string) => {
    setFunctionalities((prev) =>
      prev.includes(func) ? prev.filter((f) => f !== func) : [...prev, func]
    );
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCRMChange = (value: string) => {
    setSelectedCRM(value);
  };

  const handleReportCRMChange = (value: string) => {
    setSelectedReportCRM(value);
  };

  const handleSubmit = async () => {
    if (
      !agentType ||
      !formData.agentName ||
      !formData.agentGender ||
      !formData.knowledgeType ||
      !formData.knowledgeContent
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (functionalities.length === 0) {
      alert("Please select at least one functionality.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for Airtable - matching your Airtable field names
      const submissionData = {
        agentType: agentType.charAt(0).toUpperCase() + agentType.slice(1), // Capitalize
        agentName: formData.agentName,
        agentGender:
          formData.agentGender.charAt(0).toUpperCase() +
          formData.agentGender.slice(1), // Capitalize
        phoneNumber: formData.phoneNumber,
        accountSid: formData.twilioSID,
        knowledgeBaseType:
          formData.knowledgeType.charAt(0).toUpperCase() +
          formData.knowledgeType.slice(1), // Capitalize
        knowledgeBaseContent: formData.knowledgeContent,
        functionalities: functionalities,
        sourceCRM: selectedCRM,
        sourceCRMCredentials: JSON.stringify({
          twilioSID: formData.twilioSID,
          twilioToken: formData.twilioToken,
        }),
        reportCRM:
          selectedReportCRM === "Same as above"
            ? selectedCRM
            : selectedReportCRM,
        reportCRMCredentials:
          selectedReportCRM === "Same as above"
            ? "Same as source CRM"
            : JSON.stringify({
                twilioSID: formData.twilioSID,
                twilioToken: formData.twilioToken,
              }),
        additionalNotes: formData.additionalNotes,
      };

      const apiUrl = "/api/submit-form";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      // Check if response is OK before trying to parse as JSON
      if (!response.ok) {
        // If response is not OK, get the text first to see what we're dealing with
        const responseText = await response.text();
        console.error("Server response:", responseText);
        
        // Try to parse as JSON, but if it fails, use the raw text
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } catch (parseError) {
          // If it's not JSON, it's probably an HTML error page
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }
      }

      // If we get here, response is OK and we can parse as JSON
      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          alert("Cannot connect to server. Please check your internet connection and try again.");
        } else if (error.message.includes("404")) {
          alert("Server endpoint not found. The form submission service is currently unavailable.");
        } else if (error.message.includes("500")) {
          alert("Server error. Please try again later or contact support.");
        } else {
          alert(`Error submitting form: ${error.message}`);
        }
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success message
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-slate-300 mb-4">
            Your voice agent request has been submitted successfully.
          </p>
          <p className="text-slate-400 text-sm mb-6">
            Our team will review your information and contact you shortly to
            begin building your agent.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setAgentType("");
              setSelectedCRM("");
              setSelectedReportCRM("");
              setFunctionalities([]);
              setFormData({
                agentName: "",
                agentGender: "",
                phoneNumber: "",
                twilioSID: "",
                twilioToken: "",
                knowledgeType: "",
                knowledgeContent: "",
                additionalNotes: "",
              });
            }}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Create Another Agent
          </button>
        </div>
      </div>
    );
  }

  const renderCRMFields = (crm: string, prefix: string = "") => {
    if (!crm) return null;

    const fieldId = prefix ? `${prefix}-` : "";

    switch (crm) {
      case "Google Sheets":
        return (
          <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={
                  formData[`${fieldId}spreadsheet-id` as keyof FormData] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}spreadsheet-id` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter spreadsheet ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Service Account JSON
              </label>
              <textarea
                value={
                  formData[`${fieldId}service-account` as keyof FormData] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}service-account` as keyof FormData,
                    e.target.value
                  )
                }
                rows={4}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='{"type": "service_account", ...}'
              />
            </div>
          </div>
        );
      case "Podio":
        return (
          <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={formData[`${fieldId}client-id` as keyof FormData] || ""}
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}client-id` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Client Secret
              </label>
              <input
                type="password"
                value={
                  formData[`${fieldId}client-secret` as keyof FormData] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}client-secret` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case "HubSpot":
        return (
          <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={formData[`${fieldId}api-key` as keyof FormData] || ""}
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}api-key` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case "GoHighLevel (GHL)":
        return (
          <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={formData[`${fieldId}api-key` as keyof FormData] || ""}
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}api-key` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case "Salesforce":
        return (
          <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Instance URL
              </label>
              <input
                type="text"
                value={
                  formData[`${fieldId}instance-url` as keyof FormData] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}instance-url` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourinstance.salesforce.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={
                  formData[`${fieldId}access-token` as keyof FormData] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}access-token` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case "Turnkey":
        return (
          <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Endpoint
              </label>
              <input
                type="text"
                value={
                  formData[`${fieldId}api-endpoint` as keyof FormData] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}api-endpoint` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={formData[`${fieldId}api-key` as keyof FormData] || ""}
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}api-key` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case "Other":
        return (
          <div className="space-y-4 mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CRM Name
              </label>
              <input
                type="text"
                value={formData[`${fieldId}crm-name` as keyof FormData] || ""}
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}crm-name` as keyof FormData,
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Authentication Details
              </label>
              <textarea
                value={
                  formData[`${fieldId}auth-details` as keyof FormData] || ""
                }
                onChange={(e) =>
                  handleInputChange(
                    `${fieldId}auth-details` as keyof FormData,
                    e.target.value
                  )
                }
                rows={4}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="API keys, tokens, or other credentials"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Bot className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Autolinium
            </h1>
          </div>
          <p className="text-xl text-slate-300 mt-2">
            Voice Agent Configuration Portal
          </p>
          <div className="mt-4 h-1 w-32 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
          {/* Agent Type */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-slate-200 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-blue-400" />
              Agent Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAgentType("inbound")}
                className={`py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                  agentType === "inbound"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Inbound
              </button>
              <button
                type="button"
                onClick={() => setAgentType("outbound")}
                className={`py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                  agentType === "outbound"
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/50"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Outbound
              </button>
            </div>
          </div>

          {/* Agent Details */}
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-200 flex items-center border-b border-slate-700 pb-3">
              <Bot className="w-5 h-5 mr-2 text-blue-400" />
              Agent Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={formData.agentName}
                onChange={(e) => handleInputChange("agentName", e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="e.g., Sarah - Customer Support"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Agent Gender *
              </label>
              <select
                value={formData.agentGender}
                onChange={(e) =>
                  handleInputChange("agentGender", e.target.value)
                }
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Agent Phone Number (Twilio)
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="+1234567890"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Twilio Account SID
                </label>
                <input
                  type="text"
                  value={formData.twilioSID}
                  onChange={(e) =>
                    handleInputChange("twilioSID", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Twilio Auth Token
                </label>
                <input
                  type="password"
                  value={formData.twilioToken}
                  onChange={(e) =>
                    handleInputChange("twilioToken", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-200 flex items-center border-b border-slate-700 pb-3">
              <FileText className="w-5 h-5 mr-2 text-blue-400" />
              Knowledge Base *
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Knowledge Base Type *
              </label>
              <select
                value={formData.knowledgeType}
                onChange={(e) =>
                  handleInputChange("knowledgeType", e.target.value)
                }
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select type</option>
                <option value="text">Text</option>
                <option value="url">URL</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Knowledge Base Content *
              </label>
              <textarea
                value={formData.knowledgeContent}
                onChange={(e) =>
                  handleInputChange("knowledgeContent", e.target.value)
                }
                rows={6}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter text content or URLs (one per line)"
              />
            </div>
          </div>

          {/* Functionalities */}
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-semibold text-slate-200 flex items-center border-b border-slate-700 pb-3">
              <Zap className="w-5 h-5 mr-2 text-blue-400" />
              Agent Functionalities *
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {functionalityOptions.map((func) => (
                <button
                  key={func}
                  type="button"
                  onClick={() => toggleFunctionality(func)}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    functionalities.includes(func)
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {func}
                </button>
              ))}
            </div>
          </div>

          {/* Outbound Specific */}
          {agentType === "outbound" && (
            <div className="space-y-8 p-6 bg-cyan-900/20 rounded-xl border border-cyan-700/50">
              <h2 className="text-xl font-semibold text-cyan-300 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Outbound Configuration
              </h2>

              {/* Source CRM */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">
                  Data Source CRM
                </h3>
                <p className="text-sm text-slate-400">
                  Select the CRM to pull contact data from
                </p>
                <select
                  value={selectedCRM}
                  onChange={(e) => handleCRMChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                >
                  <option value="">Select CRM</option>
                  {crmOptions.map((crm) => (
                    <option key={crm} value={crm}>
                      {crm}
                    </option>
                  ))}
                </select>
                {renderCRMFields(selectedCRM, "source")}
              </div>

              {/* Report Storage CRM */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">
                  End-of-Call Report Storage
                </h3>
                <p className="text-sm text-slate-400">
                  Select where to store call reports and analytics
                </p>
                <select
                  value={selectedReportCRM}
                  onChange={(e) => handleReportCRMChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                >
                  <option value="">Select CRM</option>
                  <option value="Same as above">Same as above</option>
                  {crmOptions.map((crm) => (
                    <option key={crm} value={crm}>
                      {crm}
                    </option>
                  ))}
                </select>
                {selectedReportCRM &&
                  selectedReportCRM !== "Same as above" &&
                  renderCRMFields(selectedReportCRM, "report")}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-4 mt-8">
            <label className="block text-sm font-medium text-slate-300">
              Additional Notes or Special Requirements
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) =>
                handleInputChange("additionalNotes", e.target.value)
              }
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Any specific instructions, custom workflows, or integration requirements..."
            />
          </div>

          {/* Submit Button */}
          <div className="mt-10">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white font-bold text-lg rounded-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Settings className="w-5 h-5 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Configuration"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-400 text-sm">
          <p>© 2024 Autolinium. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}