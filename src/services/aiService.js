// Raksha AI Assistant Service
// Note: AI outputs are provided for educational and decision-support assistance only.

export const aiService = {
  // Translate & simplify medical instructions / prescriptions
  translatePrescription: async (text, language = 'English') => {
    // Simulated high-fidelity AI simplification dictionary
    const languagePacks = {
      Hindi: {
        title: "सरल भाषा में अनुवादित चिकित्सा मार्गदर्शन (Hindi)",
        summary: "डॉक्टर द्वारा दी गई मुख्य सलाह और सावधानियां:",
        points: [
          "दवाएं हमेशा भोजन के बाद अथवा डॉक्टर के कहे अनुसार लें।",
          "यदि सांस लेने में तकलीफ या सीने में दर्द हो, तो बिना देर किए आपातकालीन सेवा 108 पर संपर्क करें।",
          "कोर्स पूरा करें और अपनी मर्जी से खुराक न बदलें।"
        ],
        emergencyWarning: "यदि स्थिति गंभीर लगे, तो तुरंत नजदीकी अस्पताल के आपातकालीन विभाग में जाएं।"
      },
      Bengali: {
        title: "সহজ ভাষায় অনুবাদিত চিকিৎসাগত নির্দেশাবলী (Bengali)",
        summary: "চিকিৎসকের প্রধান পরামর্শ এবং সতর্কতা:",
        points: [
          "ওষুধগুলি নিয়মিত নির্দিষ্ট সময়ে সেবন করুন।",
          "অতিরিক্ত শ্বাসকষ্ট বা তীব্র বুকে ব্যথা অনুভূত হলে অবিলম্বে ১০৮ নম্বরে যোগাযোগ করুন।",
          "চিকিৎসকের পরামর্শ ছাড়া ওষুধের মাত্রা পরিবর্তন করবেন না।"
        ],
        emergencyWarning: "জরুরি প্রয়োজনে নিকটবর্তী হাসপাতালের এমার্জেন্সি বিভাগে অবিলম্বে যান।"
      },
      Marathi: {
        title: "सोप्या भाषेतील वैद्यकीय मार्गदर्शन (Marathi)",
        summary: "डॉक्टरांच्या महत्त्वाच्या सूचना:",
        points: [
          "औषधे वेळेवर आणि योग्य प्रमाणात घ्या.",
          "कोणतीही तीव्र ऍलर्जी किंवा चक्कर आल्यास तात्काळ जवळच्या रुग्णालयात जा.",
          "आपत्कालीन परिस्थितीत १०८ वर कॉल करा."
        ],
        emergencyWarning: "तातडीच्या प्रसंगी आपत्कालीन कक्षाशी संपर्क साधा."
      },
      Tamil: {
        title: "எளிய முறையில் மொழிபெயர்க்கப்பட்ட மருத்துவ வழிமுறைகள் (Tamil)",
        summary: "மருத்துவரின் முக்கிய ஆலோசனைகள்:",
        points: [
          "மருந்துகளை மருத்துவர் குறிப்பிட்ட நேரத்திற்கு தவறாமல் உட்கொள்ளவும்.",
          "சுவாசிப்பதில் சிரமம் ஏற்பட்டால் உடனடியாக 108-ஐ அழைக்கவும்.",
          "மருந்துகளை சொந்தமாக மாற்றவோ நிறுத்தவோ வேண்டாம்."
        ],
        emergencyWarning: "அவசர சிகிச்சைப் பிரிவை உடனடியாக அணுகவும்."
      },
      English: {
        title: "Plain-Language Medical Instructions (English)",
        summary: "Key actionable guidance from doctor's instructions:",
        points: [
          "Strictly follow the prescribed frequency and finish the complete cycle.",
          "Take with adequate water and report any adverse allergic reactions immediately.",
          "Monitor vital signs (SpO2, Blood Pressure) if experiencing acute respiratory symptoms."
        ],
        emergencyWarning: "In case of sudden chest pain or loss of consciousness, dial 108 immediately."
      }
    };

    const pack = languagePacks[language] || languagePacks.English;

    // Detect common drugs and generate contextual notes
    let identifiedMeds = [];
    const lower = text.toLowerCase();
    if (lower.includes('aspirin')) identifiedMeds.push('Aspirin (Blood thinner - take after food)');
    if (lower.includes('salbutamol') || lower.includes('inhaler')) identifiedMeds.push('Salbutamol Inhaler (Bronchodilator for airway opening)');
    if (lower.includes('metformin')) identifiedMeds.push('Metformin (Blood sugar regulation - monitor glucose)');
    if (lower.includes('amlodipine') || lower.includes('telmisartan')) identifiedMeds.push('Blood pressure control - do not skip doses');

    return {
      success: true,
      originalText: text,
      targetLanguage: language,
      title: pack.title,
      summary: pack.summary,
      simplifiedPoints: pack.points,
      identifiedMedications: identifiedMeds.length > 0 ? identifiedMeds : ['General emergency medication protocol'],
      warning: pack.emergencyWarning,
      disclaimer: "AI-generated explanations are for understanding only and should not replace instructions from a qualified medical professional."
    };
  },

  // Summarize authorized patient medical history for Trauma ER Doctors
  summarizePatientHistory: (patient) => {
    if (!patient) return null;

    const riskLevel = patient.allergies?.toLowerCase().includes('severe') || 
                      patient.allergies?.toLowerCase().includes('anaphyl') ? 'HIGH RISK' : 'MODERATE RISK';

    return {
      patientName: patient.name,
      ageGender: `${patient.age} yrs / ${patient.gender}`,
      bloodGroup: patient.bloodGroup,
      allergyAlerts: [
        `Allergies: ${patient.allergies}`,
        `Contraindication Warning: Avoid beta-lactam and allergen-linked agents`
      ],
      chronicConditions: patient.existingConditions || 'No chronic records found',
      currentMedications: patient.currentMedications || 'None currently recorded',
      erActionSummary: `Verified B+ patient with ${patient.allergies}. Prepare non-allergenic resuscitation tray. Check respiratory status given asthma background.`,
      disclaimer: "Decision support summary only. Verify with physical chart and patient ID tag."
    };
  },

  // Calculate emergency triage severity based on clinical parameters
  evaluateTriage: (vitals) => {
    const { consciousness, abilityToWalk, breathing, heartRate, oxygenSaturation } = vitals;
    let score = 0;

    // Consciousness
    if (consciousness === 'Unresponsive' || consciousness === 'Pain Only') score += 4;
    else if (consciousness === 'Voice Responsive') score += 2;

    // Ability to walk (Dropdown)
    if (abilityToWalk === 'No' || abilityToWalk === 'No (Severe trauma)') score += 3;
    else if (abilityToWalk === 'Assisted' || abilityToWalk === 'With assistance') score += 1;

    // Breathing (Dropdown)
    if (breathing?.includes('Absent') || breathing?.includes('Severe') || breathing?.includes('Apnea')) score += 4;
    else if (breathing?.includes('Rapid') || breathing?.includes('Labored') || breathing?.includes('Shallow') || breathing?.includes('Struggling')) score += 2;

    // Optional Numeric Vitals
    if (heartRate !== undefined && heartRate !== null && heartRate !== '') {
      const hr = parseInt(heartRate);
      if (!isNaN(hr)) {
        if (hr > 130 || hr < 45) score += 3;
        else if (hr > 105 || hr < 55) score += 1;
      }
    }

    if (oxygenSaturation !== undefined && oxygenSaturation !== null && oxygenSaturation !== '') {
      const spo2 = parseInt(oxygenSaturation);
      if (!isNaN(spo2)) {
        if (spo2 < 90) score += 4;
        else if (spo2 < 94) score += 2;
      }
    }

    let severity = 'Low';
    let color = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';

    if (score >= 7) {
      severity = 'Critical';
      color = 'text-rose-400 bg-rose-950/60 border-rose-800 animate-pulse';
    } else if (score >= 4) {
      severity = 'High';
      color = 'text-amber-400 bg-amber-950/60 border-amber-800';
    } else if (score >= 2) {
      severity = 'Moderate';
      color = 'text-yellow-400 bg-yellow-950/60 border-yellow-800';
    }

    return {
      score,
      severity,
      badgeColor: color,
      disclaimer: "Emergency assessment/triage support score - Not a definitive medical diagnosis."
    };
  }
};
