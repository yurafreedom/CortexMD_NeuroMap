**End-to-End Encryption**:
Sensitive personal data (genetic profile, lab results, symptom scores, 
treatment history, AI chat audit content) is encrypted using AES-256-GCM 
before being transmitted to our servers. Encryption keys are derived 
from your password using PBKDF2 (100,000 iterations, SHA-256) and never 
leave your device in unencrypted form.

This means:
- We cannot read your encrypted data even with full database access
- A compromise of our infrastructure would not expose your medical data
- Lost passwords cannot be recovered by us — you must maintain your 
  recovery seed phrase if enabled

**Recovery**: During account creation, you have the option to generate 
a 24-word recovery phrase (BIP39 standard). If you save this phrase, 
you can restore access to your encrypted data even if you forget your 
password. Without a recovery phrase, forgotten passwords result in 
permanent loss of encrypted data (we cannot recover it).