const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";


/* =========================================================
   LEADS
========================================================= */

export type Lead = {
  name: string;

  email: string;

  phone?: string;

  company?: string;

  business_name?: string;

  website?: string;

  category?: string;

  address?: string;

  description?: string;

  source_data?: Record<string, unknown>;
};


/* =========================================================
   AI
========================================================= */

export type LeadAnalysis = {
  person_name:
    | string
    | null;

  business_name:
    | string
    | null;

  business_type: string;

  industry: string;

  contact_role: string;

  greeting: string;

  business_summary: string;

  personalization_angle:
    string;

  confidence: number;
};


export type AIGeneratedEmail = {
  index: number;

  name: string;

  email: string;

  phone?: string;

  company?: string;

  website?: string;

  analysis: LeadAnalysis;

  subject: string;

  body: string;

  status: string;
};


/* =========================================================
   EMAIL ACCOUNTS
========================================================= */

export type EmailProvider =
  | "gmail"
  | "outlook"
  | "zoho"
  | "smtp";


export type EmailAccount = {
  id: string;

  provider:
    EmailProvider;

  email: string;

  display_name: string;

  status: string;
};


/* =========================================================
   SMTP
========================================================= */

export type SMTPAccountInput = {
  email: string;

  display_name: string;

  host: string;

  port: number;

  username: string;

  password: string;

  security:
    | "ssl"
    | "starttls";
};


/* =========================================================
   UPLOAD
========================================================= */

export async function uploadLeads(
  file: File,
  campaignId: string
) {

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );
  formData.append("campaign_id", campaignId);


  const response =
    await fetch(
      `${API_URL}/api/upload`,
      {
        method:
          "POST",

        credentials: "include",

        body:
          formData,
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Upload failed."
    );

  }


  return data;
}


/* =========================================================
   AI GENERATION
========================================================= */

export async function generatePersonalizedEmails(
  leads: Lead[],
  campaignGoal: string,
  baseSubject: string,
  baseMessage: string,
  tone: string
) {

  const response =
    await fetch(
      `${API_URL}/api/ai/generate`,
      {
        method:
          "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            leads,

            campaign_goal:
              campaignGoal,

            base_subject:
              baseSubject,

            base_message:
              baseMessage,

            tone,
          }),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {
    let message = "AI personalization failed.";
    const detail = data?.detail;

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((item: any) => {
          const location = Array.isArray(item?.loc) ? item.loc.join(".") : "request";
          return `${location}: ${item?.msg || "Invalid value"}`;
        })
        .join("; ");
    }

    throw new Error(message);
  }


  return data as {
    success: boolean;

    requested: number;

    generated: number;

    failed: number;

    results:
      AIGeneratedEmail[];
  };
}


/* =========================================================
   EMAIL ACCOUNTS
========================================================= */

export async function getEmailAccounts() {

  const response =
    await fetch(
      `${API_URL}/api/accounts`,
      {
        method:
          "GET",

        credentials: "include",

        cache:
          "no-store",
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Could not load email accounts."
    );

  }


  return data as {
    success: boolean;

    accounts:
      EmailAccount[];
  };
}


/* =========================================================
   DISCONNECT
========================================================= */

export async function disconnectEmailAccount(
  accountId: string
) {

  const response =
    await fetch(
      `${API_URL}/api/accounts/${encodeURIComponent(
        accountId
      )}`,
      {
        method:
          "DELETE",

        credentials: "include",
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Could not disconnect email account."
    );

  }


  return data;
}


/* =========================================================
   CONNECT URL
========================================================= */

export function getConnectUrl(
  provider:
    | "gmail"
    | "outlook"
    | "zoho"
) {

  if (
    provider ===
    "gmail"
  ) {

    /*
     * Existing Gmail OAuth endpoint.
     */

    return (
      `${API_URL}/api/gmail/connect`
    );
  }


  if (provider === "zoho") {
    return `${API_URL}/api/accounts/connect/zoho`;
  }

  return `${API_URL}/api/accounts/connect/outlook`;
}


/* =========================================================
   TEST SMTP
========================================================= */

export async function testSMTPAccount(
  data: SMTPAccountInput
) {

  const response =
    await fetch(
      `${API_URL}/api/accounts/smtp/test`,
      {
        method:
          "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            email:
              data.email,

            host:
              data.host,

            port:
              data.port,

            username:
              data.username,

            password:
              data.password,

            security:
              data.security,
          }),
      }
    );


  const result =
    await response.json();


  if (!response.ok) {

    throw new Error(
      result.detail ||
      "SMTP connection failed."
    );

  }


  return result as {
    success: boolean;

    message?: string;
  };
}


/* =========================================================
   CREATE SMTP ACCOUNT
========================================================= */

export async function createSMTPAccount(
  data: SMTPAccountInput
) {

  const response =
    await fetch(
      `${API_URL}/api/accounts/smtp`,
      {
        method:
          "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            email:
              data.email,

            display_name:
              data.display_name,

            host:
              data.host,

            port:
              data.port,

            username:
              data.username,

            password:
              data.password,

            security:
              data.security,
          }),
      }
    );


  const result =
    await response.json();


  if (!response.ok) {

    throw new Error(
      result.detail ||
      "Could not connect SMTP account."
    );

  }


  return result as {
    success: boolean;

    account:
      EmailAccount;
  };
}


/* =========================================================
   STANDARD SEND
========================================================= */

export async function sendStandardEmail(
  accountId: string,
  subject: string,
  body: string,
  recipients: Array<{
    name: string;
    email: string;
  }>
) {

  const response =
    await fetch(
      `${API_URL}/api/send`,
      {
        method:
          "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            account_id:
              accountId,

            subject,

            body,

            recipients,
          }),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Sending failed."
    );

  }


  return data;
}


/* =========================================================
   AI SEND
========================================================= */

export async function sendAIPersonalizedEmails(
  accountId: string,
  personalizedEmails: Array<{
    name: string;
    email: string;
    subject: string;
    body: string;
  }>
) {

  const response =
    await fetch(
      `${API_URL}/api/send`,
      {
        method:
          "POST",

        credentials: "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            account_id:
              accountId,

            campaign_id: sessionStorage.getItem("ritnavCampaignId"),

            personalized_emails:
              personalizedEmails,
          }),
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "AI campaign sending failed."
    );

  }


  return data;
}
/* =========================================================
   CAMPAIGNS
========================================================= */

export type CampaignLead = Lead & {
  id: string;
  campaign_id: string;
  status: string;
  error: string;
  sent_at?: number | null;
  sent_subject?: string;
  sent_body?: string;
  message_id?: string;
  sent_from?: string;
};

export type Campaign = {
  id: string;
  user_id: string;
  account_id: string | null;
  name: string;
  subject: string;
  body: string;
  ai_enabled: number;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: number;
  started_at?: number | null;
  completed_at?: number | null;
};

export async function createCampaign(name: string, accountId?: string) {
  return apiJson<{ success: boolean; campaign: Campaign }>(`${API_URL}/api/campaigns`, {
    method: "POST",
    body: JSON.stringify({ name, account_id: accountId || null }),
  });
}

export async function updateCampaign(id: string, data: Partial<Pick<Campaign, "name" | "account_id" | "subject" | "body">> & { ai_enabled?: boolean }) {
  return apiJson<{ success: boolean; campaign: Campaign }>(`${API_URL}/api/campaigns/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function listCampaigns() {
  return apiJson<{ success: boolean; campaigns: Campaign[] }>(`${API_URL}/api/campaigns`);
}

export async function getCampaign(id: string) {
  return apiJson<{ success: boolean; campaign: Campaign & { leads: CampaignLead[] } }>(`${API_URL}/api/campaigns/${encodeURIComponent(id)}`);
}

/* =========================================================
   AUTHENTICATION
========================================================= */

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

async function apiJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Request failed.");
  return data as T;
}

export async function signup(name: string, email: string, password: string) {
  return apiJson<{ success: boolean; user: AuthUser }>(`${API_URL}/api/auth/signup`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email: string, password: string) {
  return apiJson<{ success: boolean; user: AuthUser }>(`${API_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiJson<{ success: boolean }>(`${API_URL}/api/auth/logout`, { method: "POST" });
}

export async function getCurrentUser() {
  return apiJson<{ success: boolean; user: AuthUser }>(`${API_URL}/api/auth/me`);
}

/* =========================================================
   AI CONFIGURATION
========================================================= */

export type AIConfig = {
  id: string;
  provider: "openrouter" | "openai_compatible";
  model: string;
  base_url: string;
  configured: boolean;
};

export async function getAIConfig() {
  return apiJson<{ success: boolean; config: AIConfig | null }>(`${API_URL}/api/ai/config`);
}

export async function saveAIConfig(data: {
  provider: "openrouter" | "openai_compatible";
  model: string;
  api_key: string;
  base_url?: string;
}) {
  return apiJson<{ success: boolean; config: AIConfig }>(`${API_URL}/api/ai/config`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAIConfig() {
  return apiJson<{ success: boolean; deleted: boolean }>(`${API_URL}/api/ai/config`, {
    method: "DELETE",
  });
}
