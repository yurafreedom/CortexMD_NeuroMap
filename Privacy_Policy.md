# Privacy Policy

Last updated: April 11, 2026

## 1. About CortexMD

CortexMD is an educational platform for understanding 
psychiatric pharmacology at the molecular level. CortexMD 
is NOT a medical device, NOT a clinical decision support 
system, and does NOT provide medical advice. All content 
is educational and should be discussed with a licensed 
healthcare professional.

## 2. Data we collect

When you use CortexMD, we collect:
- **Account data**: email address (via Supabase Auth)
- **Profile data** (optional): genetic markers, lab results, 
  symptom scores, treatment history, biometric data
- **Usage data**: drug schemes you build, presets you save
- **AI chat history**: questions you ask and responses you 
  receive

## 3. How we store your data

- All data is stored on Supabase (PostgreSQL) in encrypted 
  form at rest (AES-256)
- Data is transmitted over HTTPS (TLS 1.3)
- Access to your data is restricted via Row-Level Security 
  policies — only you can read your own records
- Sensitive medical fields (lab results, genetic data, 
  symptoms) will be additionally encrypted with end-to-end 
  encryption derived from your password (planned feature)

## 4. AI processing — Anthropic Claude

When you interact with the AI chat feature:

- Your messages are sent to **Anthropic's Claude API** 
  (https://www.anthropic.com) for processing
- Anthropic processes your messages according to their 
  privacy policy: https://www.anthropic.com/legal/privacy
- Anthropic may retain inputs and outputs for up to 30 days 
  for abuse monitoring and safety purposes
- Anthropic does NOT use your data to train their models 
  (per their commercial API terms)
- We do NOT have a Zero Data Retention agreement with 
  Anthropic at this time

**What this means for you**: any information you share in 
the AI chat, including details about your health, medications, 
symptoms, and personal context, may be temporarily stored on 
Anthropic's servers in the United States. If this is a concern 
for you, do NOT share personally identifying information 
(full name, exact birthdate, address, contact details) in 
the AI chat. The AI does not need this information to provide 
educational pharmacological context.

## 5. What we do NOT do

- We do NOT sell your data to third parties
- We do NOT use your data for advertising
- We do NOT share your data with insurance companies, 
  employers, or government agencies (except as required 
  by valid legal process)
- We do NOT use your data to train our own AI models
- We do NOT have access to your encrypted password

## 6. Your rights (GDPR)

You have the right to:
- **Access** your data — request a full export at any time
- **Rectify** incorrect data — edit your profile freely
- **Erase** your account and all associated data — 
  contact support or use the "Delete Account" button in 
  settings
- **Object** to processing — stop using the service at 
  any time
- **Portability** — export your data in machine-readable 
  format (JSON)

Note: Aggregated anonymized data (e.g., statistics like 
"X% of users with diagnosis Y use medication Z") may remain 
in our analytics after account deletion, as it cannot be 
linked back to you.

## 7. Crisis safety

If our AI detects content suggesting risk of self-harm 
or harm to others, the conversation may be flagged in our 
internal audit log for safety review. We do NOT contact 
emergency services automatically. If you are in crisis, 
contact local emergency services or a crisis helpline 
immediately.

## 8. Children

CortexMD is not intended for users under 18. We do not 
knowingly collect data from minors. If we learn that we 
have collected data from a minor, we will delete it.

## 9. International users

CortexMD is operated from Ukraine and uses infrastructure 
in the United States (Supabase, Vercel, Anthropic). By 
using CortexMD, you consent to your data being processed 
in these jurisdictions.

For EU users: CortexMD operates as a non-EU data controller 
under GDPR. We do not currently have an EU representative. 
If you require strict EU-only data processing, this product 
may not be suitable for you.

## 10. Changes to this policy

We may update this Privacy Policy from time to time. 
Material changes will be communicated via email to your 
registered address. Continued use after changes constitutes 
acceptance.

## 11. Contact

For privacy questions, data export requests, or account 
deletion: [your email address]