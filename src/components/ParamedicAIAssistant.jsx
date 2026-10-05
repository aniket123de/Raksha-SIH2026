import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Heart,
  Brain,
  ShieldAlert,
  Zap,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
  Info,
  Stethoscope,
  Radio,
  FileText
} from 'lucide-react';

// Comprehensive Pre-Hospital Stabilization Protocols
const STABILIZATION_PROTOCOLS = [
  {
    id: 'hemorrhage',
    title: 'Catastrophic Hemorrhage & Blast Trauma',
    category: 'Trauma & Bleeding',
    severity: 'Life Threatening',
    icon: ShieldAlert,
    badgeColor: 'bg-red-950 text-red-400 border-red-800',
    summary: 'Immediate arterial bleeding control, Combat Application Tourniquet (CAT), hemostatic wound packing, and TXA protocol.',
    targetVitals: 'SBP 90-100 mmHg (Permissive Hypotension), SpO2 > 94%, Core Temp > 36°C',
    steps: [
      {
        step: 1,
        title: 'Direct Digital Pressure & Hemostatic Packing',
        instruction: 'Apply immediate direct pressure with gloved hands. Pack deep junctional or groin wounds with Kaolin or Celox hemostatic gauze, packing tightly against bone, then hold continuous pressure for 3 minutes.',
        warning: 'Do not remove saturated dressings; pack additional gauze over existing layers.'
      },
      {
        step: 2,
        title: 'Combat Application Tourniquet (CAT) Placement',
        instruction: 'Place tourniquet 2 to 3 inches proximal to limb bleeding site (never over a joint). If exact site unclear, place "High and Tight" over the extremity. Tighten band until circumferential slack is gone.',
        warning: 'A loose tourniquet increases venous bleeding. Ensure no slack before twisting windlass.'
      },
      {
        step: 3,
        title: 'Windlass Twist & Arterial Hemostasis',
        instruction: 'Turn windlass rod until bright red arterial pulsing ceases and distal pulse is completely absent. Lock windlass into retaining clip and secure Velcro strap over windlass.',
        warning: 'If bleeding persists, apply a SECOND tourniquet immediately proximal (above) the first.'
      },
      {
        step: 4,
        title: 'Mark Tourniquet Time Stamp',
        instruction: 'Write exact time of application in permanent marker on tourniquet "TIME" label AND on patient forehead (e.g., "TK 14:35"). Notify receiving trauma bay.',
        warning: 'NEVER loosen or remove a field tourniquet once locked without direct trauma surgeon order.'
      },
      {
        step: 5,
        title: 'Administer Tranexamic Acid (TXA)',
        instruction: 'Infuse Tranexamic Acid 1g IV diluted in 100 mL Normal Saline over 10 minutes. Must be initiated within 3 hours of trauma injury for severe hemorrhagic shock.',
        warning: 'Do not rapid push TXA IV; rapid infusion can cause severe hypotension.'
      },
      {
        step: 6,
        title: 'Hypothermia Prevention & Pelvic Binding',
        instruction: 'Cover patient in thermal foil blanket. If pelvic ring fracture or open book pelvis is suspected, apply commercial pelvic binder at greater trochanters.',
        warning: 'Hypothermia induces lethal trauma coagulopathy and triples mortality.'
      }
    ]
  },
  {
    id: 'cpr_acls',
    title: 'Cardiac Arrest & ACLS Resuscitation',
    category: 'Cardiovascular',
    severity: 'Code Blue',
    icon: Heart,
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    summary: 'High-quality chest compressions, early biphasic defibrillation, Epinephrine & Amiodarone pharmacology, and continuous waveform capnography.',
    targetVitals: 'EtCO2 > 10-20 mmHg (effective CPR), ROSC EtCO2 spike > 40 mmHg',
    steps: [
      {
        step: 1,
        title: 'Initiate High-Quality Chest Compressions',
        instruction: 'Compress chest center at rate of 100 to 120 compressions per minute. Depth of 2 to 2.4 inches (5 to 6 cm) in adults with complete chest recoil between compressions. Ratio 30:2 or continuous with advanced airway.',
        warning: 'Minimize interruptions to compressions to less than 5 seconds at all times.'
      },
      {
        step: 2,
        title: 'Attach Defibrillator & Rhythm Check',
        instruction: 'Place defibrillation pads (anterolateral or anteroposterior). Pause compressions for rhythm analysis (< 5 seconds). Identify Shockable (VF / Pulseless VT) vs Non-Shockable (Asystole / PEA).',
        warning: 'Clear all responders before delivering electrical shock.'
      },
      {
        step: 3,
        title: 'Deliver Biphasic Shock if VF/pVT',
        instruction: 'Charge biphasic defibrillator to 150 to 200 Joules. Shout "ALL CLEAR", visually sweep patient, and deliver shock. Resume chest compressions IMMEDIATELY for 2 full minutes without pulse check.',
        warning: 'Do not check pulse immediately post-shock; continue CPR for 2 full minutes.'
      },
      {
        step: 4,
        title: 'Vascular Access & Epinephrine Administration',
        instruction: 'Establish 16G IV or Proximal Tibia Intraosseous (IO) access. Administer Epinephrine 1 mg (1:10,000) IV/IO push followed by 20 mL Normal Saline flush. Repeat every 3 to 5 minutes.',
        warning: 'Confirm 1:10,000 concentration for IV push. (1:1,000 is strictly for IM anaphylaxis).'
      },
      {
        step: 5,
        title: 'Refractory VF/pVT: Amiodarone Infusion',
        instruction: 'If VF or pulseless VT persists after 2nd shock, administer Amiodarone 300 mg IV/IO bolus. Second dose of 150 mg IV/IO can be given if VF persists after 3rd shock.',
        warning: 'Alternative is Lidocaine 1 to 1.5 mg/kg IV initial dose if Amiodarone unavailable.'
      },
      {
        step: 6,
        title: 'Waveform Capnography & Reversible Causes (H\'s & T\'s)',
        instruction: 'Maintain continuous EtCO2 capnography. Evaluate 5 H\'s and 5 T\'s: Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo/Hyperkalemia, Hypothermia; Tension pneumothorax, Tamponade, Toxins, Thrombosis (coronary/pulmonary).',
        warning: 'Sudden sustained jump of EtCO2 > 35-40 mmHg indicates Return of Spontaneous Circulation (ROSC).'
      }
    ]
  },
  {
    id: 'pneumothorax',
    title: 'Tension Pneumothorax Chest Decompression',
    category: 'Respiratory & Trauma',
    severity: 'Critical Airway/Breathing',
    icon: Activity,
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    summary: 'Rapid needle thoracostomy / chest decompression for tension pneumothorax with vented chest seal application.',
    targetVitals: 'Immediate return of bilateral breath sounds, SBP normalization, SpO2 rise',
    steps: [
      {
        step: 1,
        title: 'Recognize Tension Pneumothorax Indicators',
        instruction: 'Identify clinical triad: Severe progressive respiratory distress, unilaterally absent/diminished breath sounds, hypotension (SBP < 90), jugular venous distention (JVD), and late tracheal deviation away from affected side.',
        warning: 'Do not wait for chest X-ray in pre-hospital setting. Tension pneumothorax is a clinical diagnosis.'
      },
      {
        step: 2,
        title: 'Identify Needle Decompression Anatomical Landmark',
        instruction: 'Preferred primary site: 2nd Intercostal Space in Midclavicular Line on affected side (just superior to 3rd rib to avoid intercostal artery). Alternative site: 5th Intercostal Space Anterior Axillary Line.',
        warning: 'Do not insert medial to midclavicular line (risk of cardiac or great vessel puncture).'
      },
      {
        step: 3,
        title: 'Insert 14G / 10G Decompression Needle Catheter',
        instruction: 'Use a 14-gauge or 10-gauge 3.25-inch needle-catheter with 10 mL syringe partially filled with saline. Insert at 90-degree angle right above rib border until sudden loss of resistance and rush of air or bubbling.',
        warning: 'Standard 1.5-inch IV catheters frequently fail to penetrate adult chest wall; use 3.25-inch needle.'
      },
      {
        step: 4,
        title: 'Withdraw Needle & Secure Plastic Catheter',
        instruction: 'Advance plastic catheter fully to skin hub. Carefully withdraw needle stylet into sharps container, leaving the plastic cannula patent. Tape hub securely to chest wall.',
        warning: 'Do not bend or kink plastic catheter; ensure hub remains open or attach flutter valve.'
      },
      {
        step: 5,
        title: 'Apply Vented Chest Seal if Sucking Chest Wound',
        instruction: 'If open chest wound exists, wipe blood/sweat around wound and apply commercial 3-vented chest seal. If tension reaccumulates, "burp" the seal momentarily to release trapped air.',
        warning: 'A non-vented dressing can transform an open pneumothorax into a fatal tension pneumothorax.'
      },
      {
        step: 6,
        title: 'Re-evaluate Respiration & Hemodynamics',
        instruction: 'Auscultate bilateral breath sounds immediately. Re-check blood pressure, SpO2, and respiratory rate. Administer high-flow O2 at 15 L/min via non-rebreather mask.',
        warning: 'Catheters can occlude with blood or kink during transit; re-assess every 3 minutes.'
      }
    ]
  },
  {
    id: 'anaphylaxis',
    title: 'Severe Anaphylactic Shock & Airway Edema',
    category: 'Medical Emergency',
    severity: 'Urgent Resuscitation',
    icon: Zap,
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    summary: 'Immediate intramuscular Epinephrine injection, rapid crystalloid volume resuscitation, and airway preservation.',
    targetVitals: 'SBP > 100 mmHg, Resolution of stridor/wheezing, SpO2 > 95%',
    steps: [
      {
        step: 1,
        title: 'Immediate Intramuscular Epinephrine Injection',
        instruction: 'Administer Epinephrine 1:1,000 (1 mg/mL) immediately: Adult dose 0.3 mg to 0.5 mg IM injected into the anterolateral mid-thigh (Vastus Lateralis). Pediatric: 0.01 mg/kg (max 0.3 mg).',
        warning: 'Intramuscular injection into thigh produces far faster peak plasma levels than deltoid or SQ.'
      },
      {
        step: 2,
        title: 'Repeat Epinephrine if No Clinical Improvement',
        instruction: 'If severe wheezing, stridor, or profound hypotension persists after 5 minutes, administer a second identical dose of IM Epinephrine into opposite thigh.',
        warning: 'There is no absolute contraindication to Epinephrine in severe life-threatening anaphylaxis.'
      },
      {
        step: 3,
        title: 'High-Flow Oxygen & Early Airway Inspection',
        instruction: 'Apply 15 L/min High-Flow O2 via non-rebreather mask. Inspect uvula, tongue, and pharynx for rapid angioedema. Prepare supraglottic airway or ETT if inspiratory stridor is present.',
        warning: 'Airway edema can close vocal cords rapidly. Intubate early before anatomical distortion.'
      },
      {
        step: 4,
        title: 'Aggressive Crystalloid IV Fluid Bolus',
        instruction: 'Establish two 16G or 18G peripheral IVs. Infuse 1 to 2 Litres of warm Normal Saline or Ringer\'s Lactate wide open under pressure to counter massive vasodilatory shock.',
        warning: 'Massive third-spacing can drop effective circulating intravascular volume by 35% in minutes.'
      },
      {
        step: 5,
        title: 'Secondary Resuscitation Pharmacology',
        instruction: 'Administer Diphenhydramine (H1 blocker) 50 mg IV/IM, Ranitidine (H2 blocker) 50 mg IV, and Methylprednisolone 125 mg IV or Hydrocortisone 200 mg IV to prevent biphasic reaction.',
        warning: 'Antihistamines and steroids are SECONDARY adjuncts; they NEVER replace immediate Epinephrine.'
      },
      {
        step: 6,
        title: 'Nebulized Bronchodilator for Severe Bronchospasm',
        instruction: 'Administer Albuterol (Salbutamol) 5 mg nebulized with 0.5 mg Ipratropium Bromide driven by 6-8 L/min O2 for refractory expiratory wheezing.',
        warning: 'Monitor cardiac rhythm for sinus tachycardia / ectopy from combined beta-agonists.'
      }
    ]
  },
  {
    id: 'airway_intubation',
    title: 'Rapid Airway & Endotracheal / i-gel Placement',
    category: 'Critical Airway',
    severity: 'Airway Compromise',
    icon: Stethoscope,
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    summary: 'In-line C-spine stabilization, pre-oxygenation, supraglottic airway (i-gel) or endotracheal intubation with 5-point auscultation.',
    targetVitals: 'EtCO2 35-45 mmHg, SpO2 > 95%, Equal bilateral breath sounds',
    steps: [
      {
        step: 1,
        title: 'Manual In-Line C-Spine Stabilization',
        instruction: 'If trauma mechanism exists, hold manual in-line head and neck stabilization. Do not hyperextend neck. Use modified jaw-thrust maneuver to open airway without head tilt.',
        warning: 'Avoid collar placement during active intubation; open front of cervical collar while holding manual inline.'
      },
      {
        step: 2,
        title: 'Pre-Oxygenation & High-Vacuum Suction',
        instruction: 'Pre-oxygenate with 100% FiO2 via non-rebreather or BVM with PEEP valve for at least 3 minutes. Have rigid Yankauer suction catheter connected and tested at negative pressure > 300 mmHg.',
        warning: 'De-saturation below 90% SpO2 requires immediate return to BVM ventilation before repeat attempts.'
      },
      {
        step: 3,
        title: 'Sizing & Insertion of Supraglottic Airway (i-gel)',
        instruction: 'Select i-gel based on patient body weight: Size 3 (Small Adult 30-60 kg, yellow), Size 4 (Medium Adult 50-90 kg, green), Size 5 (>90 kg, orange). Lubricate back of cuff and insert smoothly until teeth align with black line.',
        warning: 'No cuff inflation required for i-gel. Verify seal with gentle test ventilation.'
      },
      {
        step: 4,
        title: 'Endotracheal Tube (ETT) Intubation (ALS Only)',
        instruction: 'Under direct or video laryngoscopy, visualize vocal cords. Pass cuffed ETT (7.5 mm female, 8.0 mm male) through cords until cuff is 2 to 3 cm past cords. Inflate pilot balloon with 6-8 mL air.',
        warning: 'Limit any laryngoscopy attempt to maximum 30 seconds. Stop if SpO2 drops.'
      },
      {
        step: 5,
        title: 'Mandatory 5-Point Auscultation & Waveform Capnography',
        instruction: 'Auscultate epigastrium first (ensure complete absence of gurgling sound), then left/right pulmonary apices, followed by left/right axillary bases. Attach continuous waveform capnography sensor.',
        warning: 'Continuous waveform capnography is the golden standard to rule out unrecognized esophageal intubation.'
      },
      {
        step: 6,
        title: 'Secure Tube & Note Mark at Teeth',
        instruction: 'Note exact centimeter marking at front teeth/incisors (typically 21-23 cm in adult). Secure with commercial ETT holder or twill tape. Re-assess tube placement after ANY patient transfer.',
        warning: 'Always re-confirm lung sounds and capnography waveform immediately after moving patient onto stretcher.'
      }
    ]
  },
  {
    id: 'stroke_fast',
    title: 'Acute Stroke & FAST Neuro-Resuscitation',
    category: 'Neurological',
    severity: 'Time-Critical',
    icon: Brain,
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    summary: 'Cincinnati Stroke Scale, blood glucose verification, Last Known Normal (LKN) time logging, and stroke center pre-notification.',
    targetVitals: 'Blood Glucose > 60 mg/dL, SpO2 ≥ 94%, Permissive SBP < 220 mmHg (or < 185 if tPA eligible)',
    steps: [
      {
        step: 1,
        title: 'Check Fingerstick Capillary Glucose Immediately',
        instruction: 'Obtain immediate blood glucose check to rule out hypoglycemia mimic. If glucose is < 60 mg/dL, treat immediately with 25g Dextrose 50% IV (50 mL of D50W) and re-assess mental status.',
        warning: 'Hypoglycemia is the most frequent stroke mimic and can produce unilateral focal neurological deficits.'
      },
      {
        step: 2,
        title: 'Perform Cincinnati Prehospital Stroke Scale (CPSS)',
        instruction: '1) Facial Droop: Have patient smile or show teeth. 2) Arm Drift: Patient closes eyes and holds both arms forward for 10 seconds. 3) Abnormal Speech: Patient repeats "You can\'t teach an old dog new tricks".',
        warning: 'Any 1 positive finding carries 72% probability of acute stroke. 3 positive carries >85%.'
      },
      {
        step: 3,
        title: 'Establish Precise "Last Known Normal" (LKN) Time',
        instruction: 'Interview family, bystanders, or EMS caller to confirm the EXACT time the patient was last seen neurologically normal. Obtain witness name and phone number for the hospital stroke team.',
        warning: 'LKN determines eligibility for IV thrombolysis (tPA < 4.5 hrs) and mechanical thrombectomy (< 24 hrs).'
      },
      {
        step: 4,
        title: 'Airway, Head Elevation & Oxygen Titration',
        instruction: 'Elevate head of stretcher 15 to 30 degrees to reduce intracranial pressure and prevent aspiration. Administer supplemental O2 ONLY if SpO2 drops below 94%. Maintain NPO (nothing by mouth).',
        warning: 'Do not administer supplemental O2 if SpO2 is normal; hyperoxia induces cerebral vasoconstriction.'
      },
      {
        step: 5,
        title: 'Establish 18G IV Access in Antecubital Fossa',
        instruction: 'Place large-bore 18-gauge IV in right or left antecubital vein for rapid non-contrast CT and CT Angiogram contrast power injector upon ER trauma arrival.',
        warning: 'Avoid multiple venipunctures or arterial sticks if patient may receive IV thrombolytics.'
      },
      {
        step: 6,
        title: 'Pre-Notify Receiving Stroke & CT Team',
        instruction: 'Radio hospital stroke trauma desk: transmit patient age, CPSS findings, exact LKN time, blood glucose reading, and ambulance ETA. Request immediate CT scanner clearance.',
        warning: 'Door-to-needle thrombolysis time benchmark is under 45 minutes from arrival.'
      }
    ]
  },
  {
    id: 'status_epilepticus',
    title: 'Status Epilepticus & Prolonged Seizures',
    category: 'Neurological',
    severity: 'Critical Convulsive',
    icon: Flame,
    badgeColor: 'bg-red-950 text-red-300 border-red-800',
    summary: 'Airway protection, Midazolam/Lorazepam benzodiazepine administration, glucose correction, and post-ictal positioning.',
    targetVitals: 'Seizure cessation within 5 minutes, SpO2 > 94%, Normal capillary glucose',
    steps: [
      {
        step: 1,
        title: 'Protect Patient & Clear Immediate Hazards',
        instruction: 'Guide patient gently away from sharp objects. Protect head with soft jacket or pillow. Do NOT forcibly restrain active convulsions. Do NOT insert anything into the patient\'s mouth.',
        warning: 'Forcing bite blocks or fingers into a seizing patient\'s mouth causes dental fractures and airway obstruction.'
      },
      {
        step: 2,
        title: 'Administer First-Line Benzodiazepine (Midazolam)',
        instruction: 'For continuous seizure activity > 5 minutes (or 2+ seizures without regaining consciousness): Midazolam 10 mg IM (if weight > 40 kg; 5 mg IM if 13-40 kg). If IV established: Midazolam 5 mg IV slow push.',
        warning: 'Alternative is Lorazepam 4 mg IV slow push over 2 minutes or Diazepam 10 mg IV.'
      },
      {
        step: 3,
        title: 'Oxygenation & Airway Suction',
        instruction: 'Apply high-flow O2 via non-rebreather mask at 15 L/min. Have suction catheter ready for copious oral secretions and saliva once motor tonic phase subsides.',
        warning: 'Hypoxia worsens secondary brain injury during continuous seizure activity.'
      },
      {
        step: 4,
        title: 'Check Blood Glucose & Treat Hypoglycemia',
        instruction: 'Obtain instant capillary fingerstick glucose. If glucose is < 60 mg/dL, infuse 50 mL of Dextrose 50% (D50W) IV or 1 mg Glucagon IM if no venous access.',
        warning: 'Hypoglycemia is a rapidly reversible metabolic etiology of status epilepticus.'
      },
      {
        step: 5,
        title: 'Repeat Benzodiazepine Dose if Seizure Persists',
        instruction: 'If active tonic-clonic convulsions continue after 5 to 10 minutes following initial dose, administer a second dose of Midazolam 5 mg IV/IM. Prepare for assisted BVM ventilation.',
        warning: 'Repeated benzodiazepine doses induce respiratory depression; maintain BVM on high alert.'
      },
      {
        step: 6,
        title: 'Post-Ictal Lateral Recovery Position',
        instruction: 'Once convulsions cease, place patient into lateral recovery position (left side down) to allow saliva and secretions to drain freely. Monitor GCS recovery and pulse oximetry.',
        warning: 'Check for trauma caused by fall (c-spine, head hematoma, tongue lacerations).'
      }
    ]
  },
  {
    id: 'opioid_overdose',
    title: 'Opioid / Narcotic Overdose & Hypoventilation',
    category: 'Toxicology & Airway',
    severity: 'Respiratory Arrest Risk',
    icon: ShieldAlert,
    badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    summary: 'Airway opening, bag-valve-mask ventilatory support, and titrated Naloxone (Narcan) administration.',
    targetVitals: 'Spontaneous respiratory rate 12-18 bpm, SpO2 > 95%, Adequate tidal volume',
    steps: [
      {
        step: 1,
        title: 'Assess Respiratory Rate & Pinpoint Pupils',
        instruction: 'Identify opioid toxidrome: severe respiratory depression (< 8 breaths/min or apnea), pinpoint pupils (miosis), and depressed level of consciousness with track marks or paraphernalia.',
        warning: 'Hypoxia kills, not the opioid. Ventilate the patient BEFORE administering Naloxone.'
      },
      {
        step: 2,
        title: 'Bag-Valve-Mask (BVM) Ventilatory Support First',
        instruction: 'Insert Nasopharyngeal Airway (NPA). Ventilate with BVM connected to 100% O2 at 1 breath every 5 to 6 seconds with gentle chest rise for 2 minutes before giving reversal.',
        warning: 'Administering Naloxone to a severely hypoxic patient triggers acute cardiac arrest and pulmonary edema.'
      },
      {
        step: 3,
        title: 'Administer Titrated Naloxone (Narcan)',
        instruction: 'Intranasal (IN): 4 mg single spray into one nostril. IV / IM: 0.4 mg to 2.0 mg. Titrate doses to restore ADEQUATE spontaneous respirations, NOT to full abrupt awakening.',
        warning: 'Sudden high doses induce violent acute withdrawal, severe agitation, projectile vomiting, and combativeness.'
      },
      {
        step: 4,
        title: 'Re-assess Breathing Response within 2-3 Minutes',
        instruction: 'Observe for spontaneous respiratory effort within 2 to 3 minutes. If no response and synthetic fentanyl or carfentanil is suspected, administer second dose of Naloxone 2 to 4 mg.',
        warning: 'Potent synthetic fentanyl analogues may require up to 8-10 mg total Naloxone.'
      },
      {
        step: 5,
        title: 'Continuous Observation for Re-Sedation',
        instruction: 'Naloxone duration of action is 30 to 90 minutes, whereas long-acting opioids (methadone, oxycodone ER) last 6 to 24 hours. The patient WILL re-sedate as Naloxone metabolizes.',
        warning: 'Do not allow patient to refuse transport; life-threatening recurrence of apnea is common.'
      }
    ]
  }
];

export const ParamedicAIAssistant = ({
  currentEmergency,
  patient,
  onSendDirectiveToDoctor,
  className = ''
}) => {
  // Active Protocol selection
  const [selectedProtocolId, setSelectedProtocolId] = useState('hemorrhage');
  const activeProtocol = STABILIZATION_PROTOCOLS.find(p => p.id === selectedProtocolId) || STABILIZATION_PROTOCOLS[0];

  // Checklist completion state for steps
  const [completedSteps, setCompletedSteps] = useState({});

  // Metronome for CPR (110 bpm)
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const metronomeIntervalRef = useRef(null);
  const [metronomeBeat, setMetronomeBeat] = useState(false);

  // Search and AI chat state
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Raksha Trauma AI Assistant active. Voice-to-Text and Text-to-Voice initialized. Select a stabilization protocol or speak directly into your mic to receive immediate clinical guidance, drug dosages, and hands-free step execution.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Speech Recognition (Voice to Text) State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Speech Synthesis (Text to Voice) State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [activeSpokenText, setActiveSpokenText] = useState(null);

  // Status message for summary dispatch
  const [dispatchStatus, setDispatchStatus] = useState(null);

  // Setup Web Speech API on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setQuery(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Metronome audio / visual beat at 110 bpm
  useEffect(() => {
    if (isMetronomeActive) {
      // 110 bpm = ~545 ms per beat
      metronomeIntervalRef.current = setInterval(() => {
        setMetronomeBeat(prev => !prev);
        // Play short click tone using Web Audio API if available
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 880; // High beep
            gain.gain.value = 0.08;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
          }
        } catch {}
      }, 545);
    } else {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
      setMetronomeBeat(false);
    }

    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isMetronomeActive]);

  // Voice to Text Toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or type your query in the prompt box.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Stop any active speech synthesis so it doesn't feed back into mic
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
        }
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Text to Voice (Speak function)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any active speech

    if (!text || text.trim() === '') return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05; // Slightly clear and brisk emergency pace
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setActiveSpokenText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpokenText(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpokenText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveSpokenText(null);
    }
  };

  // Toggle step completion checkbox
  const handleToggleStep = (stepNumber) => {
    const key = `${activeProtocol.id}_step_${stepNumber}`;
    setCompletedSteps(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // AI Knowledge-Engine Query Processor
  const handleProcessQuery = (queryText) => {
    const cleanQuery = (queryText || query).trim();
    if (!cleanQuery) return;

    // Add user message
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: cleanQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Find closest protocol or provide clinical guidance
    const lower = cleanQuery.toLowerCase();
    let matchedProto = null;
    let answerText = '';

    if (lower.includes('bleed') || lower.includes('tourniquet') || lower.includes('hemorrhage') || lower.includes('txa') || lower.includes('blood')) {
      matchedProto = 'hemorrhage';
      answerText = 'For severe hemorrhage: 1) Apply direct pressure with hemostatic gauze. 2) Place Combat Application Tourniquet (CAT) 2-3 inches proximal to wound. Twist windlass until arterial pulse stops and lock in clip. 3) Write time on tourniquet. 4) Infuse 1g Tranexamic Acid (TXA) IV in 100 mL NS over 10 min. 5) Wrap patient in warm blankets to prevent lethal coagulopathy.';
    } else if (lower.includes('cpr') || lower.includes('arrest') || lower.includes('defib') || lower.includes('shock') || lower.includes('pulse')) {
      matchedProto = 'cpr_acls';
      answerText = 'For Cardiac Arrest: 1) Immediate chest compressions 100-120 bpm, depth 5-6 cm. Ratio 30:2 or continuous. 2) Attach AED/defibrillator. If VF/pVT, deliver 150-200J biphasic shock. Resume CPR immediately for 2 min. 3) Administer Epinephrine 1 mg 1:10,000 IV/IO every 3-5 min. 4) If refractory VF, administer Amiodarone 300 mg IV push. 5) Monitor EtCO2 capnography.';
    } else if (lower.includes('pneumothorax') || lower.includes('chest') || lower.includes('needle') || lower.includes('decompression') || lower.includes('breath')) {
      matchedProto = 'pneumothorax';
      answerText = 'For Tension Pneumothorax: Clinical signs are severe dyspnea, unilaterally absent breath sounds, hypotension, and JVD. Decompress immediately using a 14G or 10G 3.25-inch needle catheter in the 2nd intercostal space at the midclavicular line (just over 3rd rib). Advance until air rush, remove needle, leave plastic cannula, apply vented seal, and administer high-flow O2.';
    } else if (lower.includes('anaphylaxis') || lower.includes('allergic') || lower.includes('allergy') || lower.includes('epinephrine') || lower.includes('epi') || lower.includes('stridor')) {
      matchedProto = 'anaphylaxis';
      answerText = 'For Anaphylaxis: 1) Give Epinephrine 1:1,000 (1 mg/mL) 0.3 to 0.5 mg IM into the anterolateral mid-thigh IMMEDIATELY. 2) High-flow O2 15 L/min. 3) Infuse 1-2 Litres warm Normal Saline wide open for shock. 4) Repeat Epinephrine in 5-15 min if poor response. 5) Secondary adjuncts: Diphenhydramine 50 mg IV, Hydrocortisone 200 mg IV, Albuterol nebulizer 5 mg for bronchospasm.';
    } else if (lower.includes('airway') || lower.includes('intubat') || lower.includes('tube') || lower.includes('i-gel') || lower.includes('bvm') || lower.includes('chok')) {
      matchedProto = 'airway_intubation';
      answerText = 'For Airway Management: 1) Maintain manual in-line C-spine stabilization. 2) Pre-oxygenate with 100% O2 for 3 min. 3) Place i-gel supraglottic airway (Size 4 for 50-90 kg adult, Size 3 for 30-60 kg). Or perform ETT intubation with direct laryngoscopy. 4) Verify with 5-point auscultation (rule out epigastric gurgle first, then bilateral breath sounds). 5) Confirm continuous waveform capnography and secure at teeth.';
    } else if (lower.includes('stroke') || lower.includes('fast') || lower.includes('droop') || lower.includes('slur') || lower.includes('speech') || lower.includes('tpa')) {
      matchedProto = 'stroke_fast';
      answerText = 'For Acute Stroke: 1) Check capillary blood glucose immediately to rule out hypoglycemia. 2) Perform Cincinnati Stroke Scale (Face, Arm, Speech). 3) Establish exact Last Known Normal (LKN) time. 4) Target SpO2 > 94%, elevate head of bed 15-30°. 5) Insert 18G IV in antecubital fossa for CT angiogram. 6) Do not treat BP unless SBP > 220 mmHg. Pre-notify receiving stroke team.';
    } else if (lower.includes('seizure') || lower.includes('epilep') || lower.includes('convuls') || lower.includes('midazolam')) {
      matchedProto = 'status_epilepticus';
      answerText = 'For Status Epilepticus: 1) Protect patient head and clear hazards; do NOT put anything in mouth. 2) High-flow O2. 3) Administer Midazolam 10 mg IM (or 5 mg IV slow push) if seizure > 5 mins. Repeat once at 5-10 min if seizing continues. 4) Check fingerstick glucose; if < 60 mg/dL give 50 mL D50W IV. 5) Place in recovery position post-ictally.';
    } else if (lower.includes('overdose') || lower.includes('opioid') || lower.includes('heroin') || lower.includes('fentanyl') || lower.includes('narcan') || lower.includes('naloxone')) {
      matchedProto = 'opioid_overdose';
      answerText = 'For Opioid Overdose: 1) Ventilate with Bag-Valve-Mask and 100% O2 FIRST before administering reversal. 2) Administer Naloxone (Narcan) 4 mg Intranasal or 0.4 - 2.0 mg IV/IM. 3) Titrate to restore adequate spontaneous breathing, not full combativeness. 4) Monitor closely for re-sedation as Naloxone metabolizes in 30-90 minutes.';
    } else {
      answerText = `Paramedic Trauma Protocol Analysis: For this scenario, evaluate C-ABCDE primary survey: 1) Catastrophic hemorrhage control (CAT tourniquet). 2) Airway with C-spine control. 3) Breathing and 100% O2 ventilation. 4) Circulation, warm crystalloid IV, and permissive hypotension. 5) Disability GCS & pupil assessment. 6) Exposure and hypothermia prevention. Target SpO2 ≥ 94%, SBP 90-100 mmHg.`;
    }

    if (matchedProto) {
      setSelectedProtocolId(matchedProto);
    }

    const aiMsg = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg, aiMsg]);
    setQuery('');

    // Trigger Text to Voice if auto-speak is enabled
    if (autoSpeak) {
      speakText(answerText);
    }
  };

  // Dispatch executed stabilization summary to Trauma Doctor
  const handleSendSummaryToDoctor = () => {
    const completedStepTitles = activeProtocol.steps
      .filter(s => completedSteps[`${activeProtocol.id}_step_${s.step}`])
      .map(s => `Step ${s.step}: ${s.title}`);

    const directiveSummary = `[PARAMEDIC AI STABILIZATION PROTOCOL: ${activeProtocol.title.toUpperCase()}]
Patient: ${patient?.name || currentEmergency?.patientName || 'Trauma Casualty'}
Protocol Category: ${activeProtocol.category} (${activeProtocol.severity})
Target Vitals: ${activeProtocol.targetVitals}
Executed Interventions: ${
      completedStepTitles.length > 0
        ? completedStepTitles.join(' | ')
        : 'All steps initiated according to Raksha AI Pre-hospital Algorithm'
    }
Time of Transmission: ${new Date().toLocaleTimeString()}
Status: Field Stabilization Active En Route to ER Bay 1`;

    if (onSendDirectiveToDoctor) {
      onSendDirectiveToDoctor(directiveSummary);
    }

    setDispatchStatus('Protocol report transmitted to Trauma Doctor & Hospital ER desk!');
    setTimeout(() => setDispatchStatus(null), 4000);

    if (autoSpeak) {
      speakText(`Stabilization summary for ${activeProtocol.title} successfully dispatched to the trauma doctor.`);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* HEADER: AI STABILIZATION COPILOT WITH VOICE HUD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 flex items-center justify-center text-white shadow-xl shadow-indigo-950/50 shrink-0 border border-indigo-400/30">
              <Bot className="w-7 h-7 animate-pulse text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>AI Stabilization Assistant</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-600 font-mono font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    VOICE ENABLED (STT + TTS)
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Hands-free voice-to-text input and spoken text-to-voice guidance for field medical emergencies, rapid resuscitation, and clinical algorithmic procedures.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono flex-wrap">
                <span className="text-indigo-300 font-bold">● System: Raksha Trauma AI v4.2</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">Microphone: {isListening ? '🎤 Listening Live...' : 'Ready'}</span>
                <span>•</span>
                <span className="text-purple-300">Speech Engine: {isSpeaking ? '🔊 Speaking...' : 'Standby'}</span>
              </div>
            </div>
          </div>

          {/* Voice Controls & Metronome Widget */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* CPR Metronome Button */}
            <button
              onClick={() => setIsMetronomeActive(!isMetronomeActive)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isMetronomeActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="110 BPM Chest Compression Metronome"
            >
              <Heart className={`w-4 h-4 ${metronomeBeat ? 'scale-125 text-white' : 'text-rose-400'} transition-transform`} />
              <span>{isMetronomeActive ? 'CPR Metronome (110 BPM) ON' : 'CPR Metronome (110 BPM)'}</span>
            </button>

            {/* Auto-Voice Speak Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                autoSpeak
                  ? 'bg-purple-950 text-purple-200 border border-purple-600/60'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
              title="Toggle automatic spoken voice guide"
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>{autoSpeak ? 'Auto Voice: ON' : 'Auto Voice: OFF'}</span>
            </button>

            {/* Stop Speaking Button if actively talking */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-3 py-2 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all animate-pulse"
              >
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Silence Voice</span>
              </button>
            )}
          </div>
        </div>

        {/* VOICE INPUT & CHAT COMMAND BAR */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessQuery();
            }}
            className="flex items-center gap-3 bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-2 shadow-inner focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all"
          >
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              }`}
              title={isListening ? 'Click to stop listening' : 'Click to speak hands-free (Voice to Text)'}
            >
              {isListening ? <MicOff className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? "Listening... Speak now (e.g. 'Tourniquet steps', 'Pneumothorax decompression', 'Child seizure')" : "Ask AI stabilization assistant or tap microphone to speak..."}
              className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none px-2"
            />

            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>

          {/* Quick Voice Command Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-[11px] text-slate-400">
            <span className="font-mono text-indigo-400 font-bold shrink-0">Quick Voice Queries:</span>
            {[
              'Tourniquet application steps',
              'Adult CPR ACLS algorithm',
              'Needle decompression landmark',
              'Anaphylaxis Epinephrine dosage',
              'Stroke Cincinnati FAST protocol',
              'Seizure Midazolam dose'
            ].map((qChip) => (
              <button
                key={qChip}
                type="button"
                onClick={() => {
                  setQuery(qChip);
                  handleProcessQuery(qChip);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white shrink-0 transition-all cursor-pointer font-medium"
              >
                "{qChip}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PROTOCOL SELECTOR STRIP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Standard Stabilization Clinical Protocols (Select to View & Execute)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {STABILIZATION_PROTOCOLS.length} Protocols Loaded
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {STABILIZATION_PROTOCOLS.map((proto) => {
            const isSelected = proto.id === selectedProtocolId;
            const Icon = proto.icon;
            return (
              <button
                key={proto.id}
                onClick={() => {
                  setSelectedProtocolId(proto.id);
                  if (autoSpeak) {
                    speakText(`${proto.title}. Target vitals: ${proto.targetVitals}. Step 1: ${proto.steps[0].title}. ${proto.steps[0].instruction}`);
                  }
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/40 text-white'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
                </div>
                <div>
                  <h4 className="font-bold text-xs line-clamp-1 text-white">{proto.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{proto.category}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT = ACTIVE PROTOCOL STEP CHECKLIST; RIGHT = AI VOICE DIALOGUE & TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE STEP-BY-STEP STABILIZATION WORKFLOW (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeProtocol.badgeColor}`}>
                  {activeProtocol.severity}
                </span>
                <span className="text-xs text-slate-400 font-mono">Category: {activeProtocol.category}</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
                <span>{activeProtocol.title}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">{activeProtocol.summary}</p>
            </div>

            <button
              onClick={() => speakText(`${activeProtocol.title}. Overview: ${activeProtocol.summary}. Target vitals: ${activeProtocol.targetVitals}. Step 1: ${activeProtocol.steps[0].instruction}`)}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/50 text-indigo-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center shrink-0"
              title="Listen to full protocol audio instructions"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Listen Full Guide</span>
            </button>
          </div>

          {/* Target Vitals Banner */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-slate-300">Resuscitation Vitals Target:</span>
            </div>
            <span className="font-mono font-bold text-emerald-400 text-right">{activeProtocol.targetVitals}</span>
          </div>

          {/* Sequential Step Cards with Audio & Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Execute Steps Sequentially (Mark Completed):</span>
              <span className="text-emerald-400 font-mono">
                {activeProtocol.steps.filter(s => completedSteps[`${activeProtocol.id}_step_${s.step}`]).length} / {activeProtocol.steps.length} Steps Done
              </span>
            </div>

            {activeProtocol.steps.map((s) => {
              const isDone = completedSteps[`${activeProtocol.id}_step_${s.step}`];
              return (
                <div
                  key={s.step}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-300'
                      : 'bg-slate-950 border-slate-800 text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleStep(s.step)}
                        className={`mt-0.5 p-1 rounded-lg transition-all cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                            isDone ? 'bg-emerald-950 text-emerald-400' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`}>
                            STEP {s.step}
                          </span>
                          <h5 className={`font-bold text-sm ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                            {s.title}
                          </h5>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {s.instruction}
                        </p>
                        {s.warning && (
                          <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] flex items-start gap-2 mt-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>CAUTION:</strong> {s.warning}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step Listen Button */}
                    <button
                      type="button"
                      onClick={() => speakText(`Step ${s.step}: ${s.title}. ${s.instruction}. Caution: ${s.warning || 'Proceed carefully.'}`)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white transition-all cursor-pointer shrink-0"
                      title="Read step aloud"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action: Send Summary to Doctor & Hospital */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">
                Log completed steps and notify Trauma Doctor at ER desk in real-time.
              </p>
              {dispatchStatus && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-1 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  {dispatchStatus}
                </span>
              )}
            </div>

            <button
              onClick={handleSendSummaryToDoctor}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Send Stabilization Summary to Doctor</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: AI VOICE CONVERSATION STREAM & CLINICAL CALCULATOR (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* AI Clinical Stream Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-white text-sm">Trauma Assistant Live Dialogue</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                ONLINE
              </span>
            </div>

            {/* Chat Transcript */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl leading-relaxed space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 ml-6'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className={msg.sender === 'user' ? 'text-indigo-400 font-bold' : 'text-purple-400 font-bold'}>
                      {msg.sender === 'user' ? 'PARAMEDIC' : 'RAKSHA AI'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p>{msg.text}</p>

                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="mt-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Re-read Voice</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Audio Wave Visualizer when speaking */}
            {isSpeaking && (
              <div className="p-3 bg-purple-950/60 border border-purple-700/50 rounded-2xl flex items-center justify-between text-purple-200 text-xs shrink-0 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-1 h-4">
                    <span className="w-1 bg-purple-400 h-2 animate-bounce"></span>
                    <span className="w-1 bg-purple-400 h-4 animate-bounce delay-75"></span>
                    <span className="w-1 bg-purple-400 h-3 animate-bounce delay-150"></span>
                    <span className="w-1 bg-purple-400 h-4 animate-bounce delay-100"></span>
                  </div>
                  <span className="font-semibold text-[11px]">Speaking Clinical Guidance...</span>
                </div>
                <button
                  onClick={stopSpeaking}
                  className="px-2 py-1 bg-purple-900 hover:bg-purple-800 rounded-lg text-[10px] font-bold text-white cursor-pointer"
                >
                  Pause
                </button>
              </div>
            )}
          </div>

          {/* Quick Pre-Hospital Dosage & Calculator Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Pre-Hospital Critical Pharmacology Quick-Ref
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Epinephrine 1:1,000 (IM)</span>
                  <span className="text-[10px] text-slate-400">Anaphylaxis / Severe Bronchospasm</span>
                </div>
                <span className="font-mono font-bold text-amber-300">0.3 - 0.5 mg IM (Thigh)</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Epinephrine 1:10,000 (IV/IO)</span>
                  <span className="text-[10px] text-slate-400">Cardiac Arrest ACLS</span>
                </div>
                <span className="font-mono font-bold text-rose-400">1 mg IV q3-5min</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Tranexamic Acid (TXA)</span>
                  <span className="text-[10px] text-slate-400">Severe Trauma Bleeding &lt; 3h</span>
                </div>
                <span className="font-mono font-bold text-cyan-300">1g in 100mL NS (10 min)</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Naloxone (Narcan)</span>
                  <span className="text-[10px] text-slate-400">Opioid Apnea Reversal</span>
                </div>
                <span className="font-mono font-bold text-indigo-300">4 mg IN or 0.4-2mg IV</span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Midazolam (Versed)</span>
                  <span className="text-[10px] text-slate-400">Status Epilepticus Seizure</span>
                </div>
                <span className="font-mono font-bold text-purple-300">10 mg IM / 5 mg IV</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
