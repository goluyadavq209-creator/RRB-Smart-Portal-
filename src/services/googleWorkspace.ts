import { getAccessToken, getIdTokenAsync } from '../lib/firebase';

// Helper for authenticated Google API requests
async function googleApiFetch(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to access Google Workspace features.');
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `Google API Error (${response.status}): ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

// Log export to Cloud SQL
async function logExportToDb(type: 'form' | 'sheet', payload: any) {
  try {
    const idToken = await getIdTokenAsync();
    if (!idToken) return;
    await fetch(`/api/db/export-${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Failed to log export to Cloud SQL:', err);
  }
}

// ==========================================
// GOOGLE FORMS API SERVICES
// ==========================================

export interface GoogleFormSummary {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export interface GoogleFormQuestion {
  title: string;
  type: 'TEXT' | 'PARAGRAPH_TEXT' | 'RADIO' | 'CHECKBOX' | 'SCALE';
  options?: string[];
  required?: boolean;
}

/**
 * List Google Forms in user's Google Drive
 */
export async function listUserForms(): Promise<GoogleFormSummary[]> {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.form' and trashed = false");
  const data = await googleApiFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&pageSize=20&orderBy=modifiedTime desc`
  );
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink || `https://docs.google.com/forms/d/${f.id}/edit`,
    modifiedTime: f.modifiedTime,
  }));
}

/**
 * Fetch Google Form structure and items
 */
export async function getFormDetails(formId: string) {
  return await googleApiFetch(`https://forms.googleapis.com/v1/forms/${formId}`);
}

/**
 * Fetch Google Form Responses
 */
export async function getFormResponses(formId: string) {
  return await googleApiFetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`);
}

/**
 * Create a new custom RRB Google Form with questions
 */
export async function createRRBForm(title: string, description: string, questions: GoogleFormQuestion[]) {
  // 1. Create empty form
  const createRes = await googleApiFetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
      },
    }),
  });

  const formId = createRes.formId;
  const formUrl = createRes.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;
  const editUrl = `https://docs.google.com/forms/d/${formId}/edit`;

  // 2. Batch update to add description and questions
  const requests: any[] = [
    {
      updateFormInfo: {
        info: {
          description,
        },
        updateMask: 'description',
      },
    },
  ];

  questions.forEach((q, index) => {
    let questionItem: any = {
      title: q.title,
      question: {
        required: q.required ?? true,
      },
    };

    if (q.type === 'TEXT') {
      questionItem.question.textQuestion = { paragraph: false };
    } else if (q.type === 'PARAGRAPH_TEXT') {
      questionItem.question.textQuestion = { paragraph: true };
    } else if (q.type === 'RADIO' && q.options) {
      questionItem.question.choiceQuestion = {
        type: 'RADIO',
        options: q.options.map((opt) => ({ value: opt })),
      };
    } else if (q.type === 'CHECKBOX' && q.options) {
      questionItem.question.choiceQuestion = {
        type: 'CHECKBOX',
        options: q.options.map((opt) => ({ value: opt })),
      };
    } else if (q.type === 'SCALE') {
      questionItem.question.scaleQuestion = {
        low: 1,
        high: 5,
        lowLabel: 'Poor / Difficult',
        highLabel: 'Excellent / Smooth',
      };
    } else {
      questionItem.question.textQuestion = { paragraph: false };
    }

    requests.push({
      createItem: {
        item: {
          title: q.title,
          questionItem,
        },
        location: {
          index,
        },
      },
    });
  });

  await googleApiFetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });

  // Log to Cloud SQL
  await logExportToDb('form', {
    formId,
    formTitle: title,
    formUrl: editUrl,
    formType: 'RRB Candidate Survey',
  });

  return {
    formId,
    formTitle: title,
    editUrl,
    responderUri: formUrl,
  };
}

// ==========================================
// GOOGLE SHEETS API SERVICES
// ==========================================

export interface GoogleSheetSummary {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

/**
 * List Google Sheets in user's Google Drive
 */
export async function listUserSheets(): Promise<GoogleSheetSummary[]> {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const data = await googleApiFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,modifiedTime)&pageSize=20&orderBy=modifiedTime desc`
  );
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    webViewLink: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
    modifiedTime: f.modifiedTime,
  }));
}

/**
 * Read data from a Google Sheet
 */
export async function readSheetData(spreadsheetId: string, range: string = 'Sheet1!A1:Z100') {
  return await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`
  );
}

/**
 * Create a new Google Spreadsheet and populate it with RRB Cut-Off data
 */
export async function createRRBCutOffSpreadsheet(
  title: string,
  cutOffRows: Array<{
    examName: string;
    postName: string;
    zone: string;
    year: string;
    ur: string;
    obc: string;
    sc: string;
    st: string;
    ews: string;
  }>
) {
  // 1. Create Spreadsheet
  const createRes = await googleApiFetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  const spreadsheetId = createRes.spreadsheetId;
  const sheetUrl = createRes.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare header & data values
  const headers = [
    'RRB Exam Name',
    'Post / Designation',
    'RRB Zone / Board',
    'Year / CEN',
    'UR Cut-Off',
    'OBC Cut-Off',
    'SC Cut-Off',
    'ST Cut-Off',
    'EWS Cut-Off',
  ];

  const rows = cutOffRows.map((item) => [
    item.examName,
    item.postName,
    item.zone,
    item.year,
    item.ur,
    item.obc,
    item.sc,
    item.st,
    item.ews,
  ]);

  const allValues = [headers, ...rows];

  // 3. Append values
  await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:I${allValues.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `Sheet1!A1:I${allValues.length}`,
        majorDimension: 'ROWS',
        values: allValues,
      }),
    }
  );

  // Log to Cloud SQL
  await logExportToDb('sheet', {
    sheetId: spreadsheetId,
    sheetTitle: title,
    sheetUrl,
    rowCount: rows.length,
    exportType: 'RRB Cut-Off Explorer Export',
  });

  return {
    spreadsheetId,
    sheetUrl,
    title,
    rowCount: rows.length,
  };
}

/**
 * Append candidate / inquiry row to existing Google Sheet
 */
export async function appendRowToSheet(spreadsheetId: string, range: string, rowValues: any[]) {
  return await googleApiFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );
}
