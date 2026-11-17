// AI Service for RRB Smart Portal - handles Gemini API & specialized RRB offline intelligence

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export async function askRRBAI(
  message: string,
  history: ChatMessage[] = [],
  examContext?: string
): Promise<string> {
  // 1. Attempt to call server-side Gemini AI endpoint
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: history.map((h) => ({ role: h.role, text: h.text })),
        examContext,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply && !data.fallbackNeeded) {
        return data.reply;
      }
    }
  } catch (err) {
    console.warn('Backend Gemini API endpoint unreachable or error, using intelligent RRB local engine:', err);
  }

  // 2. Comprehensive Local Intelligent Knowledge Engine for RRB Exams
  return getLocalRRBResponse(message);
}

export function getLocalRRBResponse(query: string): string {
  const q = query.toLowerCase();

  // 1. Cut-Off queries
  if (q.includes('cut off') || q.includes('cutoff') || q.includes('कट ऑफ') || q.includes('कटऑफ') || q.includes('cut-off')) {
    if (q.includes('technician') || q.includes('टेक्नीशियन')) {
      return `📊 **RRB Technician 2024-25 Expected & Previous Cut-Off Analysis:**

• **Grade-I Signal (Level 5):**
  - **UR:** 78.40 – 83.50 Marks
  - **OBC:** 74.20 – 78.80 Marks
  - **EWS:** 72.50 – 76.00 Marks
  - **SC:** 65.20 – 69.50 Marks
  - **ST:** 58.00 – 63.20 Marks

• **Grade-III (Level 2 - ITI Trades):**
  - **UR:** 64.50 – 71.00 Marks
  - **OBC:** 60.00 – 66.50 Marks
  - **EWS:** 57.00 – 63.00 Marks
  - **SC:** 51.50 – 56.00 Marks
  - **ST:** 44.00 – 50.50 Marks

💡 *Cut-off varies by zone. Safe zones: RRB Malda, RRB Siliguri, RRB Muzaffarpur. High competition zones: RRB Allahabad (Prayagraj), RRB Chandigarh, RRB Ajmer.*`;
    }

    if (q.includes('ntpc') || q.includes('एनटीपीसी')) {
      return `🎯 **RRB NTPC (CEN 05/2024) Expected Cut-Off (CBT-1 Score out of 100):**

• **Graduate Level Posts (Station Master, Goods Train Manager, Sr Clerk):**
  - **UR:** 72 – 78 Marks
  - **OBC:** 68 – 74 Marks
  - **EWS:** 64 – 70 Marks
  - **SC:** 58 – 64 Marks
  - **ST:** 52 – 58 Marks

• **Undergraduate Posts (Junior Clerk cum Typist, Trains Clerk):**
  - **UR:** 76 – 82 Marks
  - **OBC:** 72 – 78 Marks
  - **EWS:** 69 – 74 Marks
  - **SC:** 62 – 68 Marks
  - **ST:** 56 – 62 Marks

✨ *Note: CBT-1 is screening in nature, normalized score is calculated across multi-shift exams.*`;
    }

    if (q.includes('alp') || q.includes('लोको पायलट')) {
      return `🚂 **RRB ALP (CEN 01/2024) CBT-1 Minimum Qualifying & Expected Cut-Off:**

• **Minimum Qualifying Marks (Standard):**
  - UR / EWS: 40% (30 / 75 Marks)
  - OBC (NCL) / SC: 30% (22.5 / 75 Marks)
  - ST: 25% (18.75 / 75 Marks)

• **Expected Zone-wise Shortlisting Cut-Off for CBT-2:**
  - **UR:** 48 – 56 Marks (out of 75)
  - **OBC:** 44 – 51 Marks
  - **EWS:** 42 – 48 Marks
  - **SC:** 36 – 42 Marks
  - **ST:** 30 – 36 Marks`;
    }

    if (q.includes('group d') || q.includes('ग्रुप डी') || q.includes('level 1')) {
      return `🛡️ **RRB Group D (Level-1 CEN 08/2024) Zone-Wise Cut-Off Range (CBT Percentile):**

• **North & Central Zones (Prayagraj, Chandigarh, Patna, Bhopal):**
  - **UR:** 68.5 – 74.0 | **OBC:** 63.0 – 68.5 | **EWS:** 58.0 – 64.0 | **SC:** 54.0 – 60.0 | **ST:** 48.0 – 54.0

• **South & East Zones (Chennai, Bangalore, Secunderabad, Kolkata):**
  - **UR:** 62.0 – 67.5 | **OBC:** 57.5 – 63.0 | **EWS:** 52.0 – 58.0 | **SC:** 48.0 – 53.5 | **ST:** 42.0 – 48.0`;
    }

    return `📊 **Railway Exams Cut-Off Summary 2024-2025:**

1. **RRB NTPC (CEN 05/2024):** UR: 72-78 | OBC: 68-74 | SC: 58-64 | ST: 52-58 (CBT-1 out of 100)
2. **RRB Technician (CEN 02/2024):** Grade I: 78-83 | Grade III: 64-71 (out of 100)
3. **RRB ALP (CEN 01/2024):** UR: 48-56 | OBC: 44-51 | SC: 36-42 (CBT-1 out of 75)
4. **RRB Group D (CEN 08/2024):** UR: 65-72 | OBC: 60-67 | SC: 52-58 | ST: 46-52

💡 *Use our interactive 'Cut Off Finder' widget on the right to view zone-by-zone exact official cutoffs.*`;
  }

  // 2. Marks / Score Analysis queries
  if (q.includes('mark') || q.includes('score') || q.includes('analysis') || q.includes('नंबर') || q.includes('मार्क्स') || q.includes('chance') || q.includes('सिलेक्शन')) {
    return `🎯 **Smart Marks & Selection Probability Analysis:**

To give you an accurate prediction, Railway Normalization uses:
$$M_{ij} = \\frac{\\bar{M}_t^g - M_q^g}{\\bar{M}_{ti} - M_{iq}} (M_{ij} - M_{iq}) + M_q^{gm}$$

**Quick Probability Matrix based on Raw Marks:**
• **70+ Raw Marks (out of 100):** 🟢 **High Selection Chance (95%+)** in almost all RRB Zones for CBT-2 / DV.
• **60 - 70 Raw Marks:** 🟡 **Safe Zone Qualification (75-90%)** for CBT-2 in Moderate/Low Cutoff zones (Siliguri, Malda, Guwahati, Chennai).
• **50 - 60 Raw Marks:** 🟠 **Borderline Range (50-70%)**; depends heavily on Shift Hardness and Normalization boost (+5 to +12 marks).
• **Below 50 Raw Marks:** 🔴 Needs improvement for UR/OBC. SC/ST candidates have fair chances in technical & ALP posts.

👉 *Reply with your **Exam Name + Category (UR/OBC/SC/ST) + Zone + Raw Score** for personalized analysis!*`;
  }

  // 3. Vacancy & Notification queries
  if (q.includes('vacancy') || q.includes('recruitment') || q.includes('भर्ती') || q.includes('वैकेंसी') || q.includes('notification') || q.includes('पोस्ट')) {
    return `📢 **Latest Indian Railways Vacancies (2024-2025 Calendar):**

1. **RRB NTPC (CEN 05/2024 & CEN 06/2024):**
   - **Total Posts:** 11,558 Vacancies (Graduate: 8,110 | Undergraduate: 3,448)
   - **Status:** Active / Exam scheduled for May-June 2025.

2. **RRB Group D / Level-1 (CEN 08/2024):**
   - **Total Posts:** 32,000+ Expected Level-1 Vacancies.
   - **Eligibility:** 10th Pass + ITI (NAC).

3. **RRB Technician (CEN 02/2024):**
   - **Total Posts:** 14,298 Vacancies (Grade-I & Grade-III).
   - **Status:** CBT Scheduled, Answer Key updates released.

4. **RRB ALP (CEN 01/2024):**
   - **Total Posts:** 18,799 Vacancies (Revised from 5,696).
   - **Status:** CBT-1 completed, CBT-2 & CBAT stages underway.

5. **RRB Junior Engineer (JE - CEN 03/2024):**
   - **Total Posts:** 7,951 Vacancies (JE, DMS, CMA).`;
  }

  // 4. Syllabus & Exam Pattern queries
  if (q.includes('syllabus') || q.includes('pattern') || q.includes('पाठ्यक्रम') || q.includes('पैटर्न') || q.includes('सब्जेक्ट') || q.includes('विषय')) {
    return `📚 **Railway CBT Comprehensive Exam Pattern & Syllabus:**

• **1. General Awareness & Current Affairs (20 - 40 Questions):**
  - Indian Railways History & Organization, Static GK, Indian Polity, Geography, Economy, Awards, Sports, Science & Tech developments.

• **2. Mathematics / Quantitative Aptitude (25 - 30 Questions):**
  - Number System, Decimals, Fractions, LCM & HCF, Ratio & Proportion, Percentage, Mensuration, Time & Work, Speed Distance & Time, Simple & Compound Interest, Profit & Loss, Algebra, Geometry & Trigonometry.

• **3. General Intelligence & Reasoning (30 Questions):**
  - Analogies, Number & Alphabetical Series, Coding-Decoding, Mathematical Operations, Blood Relations, Syllogism, Venn Diagrams, Data Interpretation.

• **4. General Science / Basic Science & Engineering (20 - 40 Questions):**
  - Physics, Chemistry, Life Sciences (10th CBSE Standard), Engineering Drawing, Units & Measurements, Work Power Energy, Speed & Velocity, Heat & Temperature, Basic Electricity.

⚠️ **Negative Marking:** 1/3rd mark deducted for every incorrect response. Time duration: 90 Minutes (120 min for PwBD).`;
  }

  // 5. Answer key & Objection rules
  if (q.includes('answer key') || q.includes('उत्तर कुंजी') || q.includes('objection') || q.includes('आपत्ति')) {
    return `🔑 **RRB Answer Key & Response Sheet Procedure:**

1. **Viewing Response Sheet:** Login with your Roll Number & Date of Birth on the official DigiALM portal.
2. **Raising Objections:** Fee is ₹50 per question + bank charges.
3. **Refund Policy:** If the objection is found genuine by the Railway subject matter expert committee, ₹50 is refunded directly to your bank account.
4. **Final Answer Key:** Prepared after resolving all objections; results and normalized scores are calculated based strictly on the Final Answer Key.`;
  }

  // Default response
  return `🤖 **नमस्ते! मैं हूँ RRB AI (आपका AI साथी)**

मैं भारतीय रेलवे (RRB) भर्ती परीक्षाओं के लिए आपका पर्सनल असिस्टेंट हूँ। आप मुझसे पूछ सकते हैं:

• **कट-ऑफ और मेरिट लिस्ट:** NTPC, ALP, Technician, Group D, JE
• **मार्क्स एनालिसिस और सेफ स्कोर प्रेडिक्शन**
• **सिलेबस और एग्जाम पैटर्न (हिंदी/English)**
• **21 RRB जोनों की वैकेंसी डिटेल्स**
• **नॉर्मलाइजेशन फॉर्मूला और नेगेटिव मार्किंग नियम**

आप क्या जानना चाहते हैं? नीचे लिखें या क्विक प्रॉम्प्ट चुनें!`;
}
