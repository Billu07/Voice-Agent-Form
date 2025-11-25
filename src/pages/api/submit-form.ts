import type { VercelRequest, VercelResponse } from "@vercel/node";
import Airtable from "airtable";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const formData = req.body;

    if (
      !formData.agentType ||
      !formData.agentName ||
      !formData.agentGender ||
      !formData.knowledgeBaseType ||
      !formData.knowledgeBaseContent
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;

    if (!airtableApiKey || !airtableBaseId) {
      return res
        .status(500)
        .json({ message: "Airtable configuration missing" });
    }

    const base = new Airtable({
      apiKey: airtableApiKey,
    }).base(airtableBaseId);

    const airtableData = {
      "Agent Type": formData.agentType,
      "Agent Name": formData.agentName,
      "Agent Gender": formData.agentGender,
      "Phone Number": formData.phoneNumber || "",
      "Twilio Account SID": formData.accountSid || "",
      "Knowledge Base Type": formData.knowledgeBaseType,
      "Knowledge Base Content": formData.knowledgeBaseContent,
      Functionalities: formData.functionalities || [],
      "Source CRM": formData.sourceCRM || "",
      "Source CRM Credentials": formData.sourceCRMCredentials || "",
      "Report CRM":
        formData.reportCRM === "Same as above"
          ? formData.sourceCRM
          : formData.reportCRM,
      "Report CRM Credentials":
        formData.reportCRM === "Same as above"
          ? formData.sourceCRMCredentials
          : formData.reportCRMCredentials,
      "Additional Notes": formData.additionalNotes || "",
    };

    const records = await base("Agent Configuration").create([
      { fields: airtableData },
    ]);

    res.status(200).json({
      message: "Form submitted successfully",
      recordId: records[0].getId(),
    });
  } catch (error: any) {
    console.error("Error submitting to Airtable:", error);
    res.status(500).json({
      message: "Error submitting form",
      error: error.message,
    });
  }
}
