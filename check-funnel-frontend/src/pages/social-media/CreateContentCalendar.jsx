import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients } from '../../services/clientService';
import api from '../../services/api';
import { generateCalendarAI } from '../../api/ai';
import { saveCalendar, getCalendars, deleteCalendar, deletePost, updatePost } from '../../api/calendar';
import CalendarTable from './components/CalendarTable';
import HistoryFilters from './components/HistoryFilters';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';

/* ──────────── SVG Icons for Social Platforms ──────────── */
const FacebookIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${active ? 'fill-[#003870]' : 'fill-slate-400'}`}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${active ? 'fill-[#003870]' : 'fill-slate-400'}`}>
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/>
  </svg>
);

const TikTokIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${active ? 'fill-[#003870]' : 'fill-slate-400'}`}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const CreateContentCalendar = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTimeRangeDropdownOpen, setIsTimeRangeDropdownOpen] = useState(false);
  const [activeCompetitorDropdown, setActiveCompetitorDropdown] = useState(null);
  const [clientPerformanceData, setClientPerformanceData] = useState({ own: {}, competitors: {} });
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [isPromptMaximized, setIsPromptMaximized] = useState(false);
  const [generatedData, setGeneratedData] = useState([]);
  const [toast, setToast] = useState(null);
  const [aiEditModal, setAiEditModal] = useState({ isOpen: false, rowIndex: null, instruction: '', isProcessing: false });
  const [isSaving, setIsSaving] = useState(false);
  const [savedCalendars, setSavedCalendars] = useState([]);
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState({ client: '', date: '' });
  const [refinementOffset, setRefinementOffset] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [calendarToDelete, setCalendarToDelete] = useState(null);
  const [isDeleteRowModalOpen, setIsDeleteRowModalOpen] = useState(false);
  const [rowToDeleteIndex, setRowToDeleteIndex] = useState(null);

  const fetchSavedCalendars = async (clientId) => {
    try {
      const data = await getCalendars(clientId);
      setSavedCalendars(data);
    } catch (err) {
      console.error("Failed to fetch saved calendars", err);
    }
  };

  const fetchAllCalendars = async () => {
    try {
      const data = await getCalendars();
      setSavedCalendars(data);
    } catch (err) {
      console.error("Failed to fetch all calendars", err);
    }
  };

  const [formData, setFormData] = useState({
    clientId: '',
    businessName: '',
    businessWebsite: '',
    businessLocation: '',
    niche: '',
    platforms: [],
    targetAudience: '',
    contentGoal: [],
    brandVoice: '',
    postsPerWeek: 7,
    durationDays: 30,
    startDate: new Date().toISOString().split('T')[0],
    language: 'English',
    preferredFormats: [],
    productsOrServices: '',
    mainOffer: '',
    competitorCsvUploaded: false,
    includeCaptions: true,
    includeHashtags: true,
    includeVideoIdeas: true,
    includeTrackingTemplate: true,
    dataSource: 'apify',
    analysisStartDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    analysisEndDate: new Date().toISOString().split('T')[0],
    platformPostCounts: {},
    competitors: [],
    prompt: ''
  });

  const hardcodedData = [
    { date: '12-Mar', type: 'Static', pillar: 'Motor Insurance', visual: 'Smart drivers plan ahead', caption: 'Secure your journey with Comprehensive Motor Insurance.', status: 'Draft' },
    { date: '14-Mar', type: 'Carousel', pillar: 'Life Insurance', visual: 'Protect your family\'s future', caption: '5 reasons why life insurance is your best investment.', status: 'Approved' },
    { date: '16-Mar', type: 'Video', pillar: 'Health Insurance', visual: 'Health is Wealth', caption: 'Stay covered for any medical emergencies. Learn more.', status: 'Review' },
    { date: '19-Mar', type: 'Static', pillar: 'Travel Insurance', visual: 'Travel with peace of mind', caption: 'Lost luggage? Cancelled flight? We got you.', status: 'Draft' },
    { date: '22-Mar', type: 'Reel', pillar: 'Motor Insurance', visual: 'Quick claims process', caption: 'See how fast you can claim with our app.', status: 'Approved' },
    { date: '25-Mar', type: 'Static', pillar: 'Home Insurance', visual: 'Your home, fully protected', caption: 'Comprehensive cover for fire, theft, and natural disasters.', status: 'Review' },
  ];

  useEffect(() => {
    fetchAllCalendars();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredCompetitorData = React.useMemo(() => {
    const filterByDate = (post) => {
      if (!formData.analysisStartDate && !formData.analysisEndDate) return true;
      const postDate = new Date(post.createdAt);
      if (formData.analysisStartDate && postDate < new Date(formData.analysisStartDate)) return false;
      if (formData.analysisEndDate) {
        const endDate = new Date(formData.analysisEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (postDate > endDate) return false;
      }
      return true;
    };

    const data = {};
    if (clientPerformanceData?.competitors) {
      Object.keys(clientPerformanceData.competitors).forEach(p => {
        let filtered = clientPerformanceData.competitors[p].filter(filterByDate);
        filtered.sort((a, b) => (b.likes + b.commentsCount) - (a.likes + a.commentsCount));
        data[p] = filtered;
      });
    }
    return data;
  }, [clientPerformanceData, formData.analysisStartDate, formData.analysisEndDate]);

  const historyDates = React.useMemo(() => {
    const dates = new Set();
    savedCalendars.forEach(c => {
      if (c.month && c.year) dates.add(`${c.month} ${c.year}`);
    });
    return Array.from(dates);
  }, [savedCalendars]);

  const historyClients = React.useMemo(() => {
    const clientNames = new Set();
    savedCalendars.forEach(c => {
      if (c.name) {
        // Extract client name from calendar name (format: "ClientName - Month Year")
        const clientName = c.name.split(' - ')[0];
        if (clientName) clientNames.add(clientName);
      }
    });
    return Array.from(clientNames);
  }, [savedCalendars]);

  useEffect(() => {
    if (selectedHistoryFilter.date) {
      const [month, year] = selectedHistoryFilter.date.split(' ');
      const calendar = savedCalendars.find(c => {
        const isMonthYearMatch = c.month === month && c.year.toString() === year;
        if (!isMonthYearMatch) return false;

        if (!selectedHistoryFilter.client) return true;

        // Match by client name extracted from calendar name
        const calendarClientName = c.name ? c.name.split(' - ')[0] : '';
        return calendarClientName === selectedHistoryFilter.client;
      });
      
      if (calendar && calendar.posts) {
        setGeneratedData(calendar.posts);
        setIsGenerated(true);
      }
    }
  }, [selectedHistoryFilter, savedCalendars]);

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const toggleBoolean = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep === 3) {
      // ── Build Performance Strategy Summary ──
      const performanceStrategy = formData.platforms.map(p => {
        const count = formData.platformPostCounts?.[p] !== undefined ? formData.platformPostCounts[p] : Math.min(5, filteredCompetitorData[p]?.length || 0);
        return `${p.charAt(0).toUpperCase() + p.slice(1)} Top Engagement (${count} Posts)`;
      }).join(', ');
      
      // ── Build Historical Insights from Competitor Data ──
      let historicalInsights = "";
      const hasCompetitorData = formData.platforms.some(p => filteredCompetitorData[p]?.length > 0);
      if (hasCompetitorData) {
        historicalInsights += "\n--- COMPETITOR TOP ENGAGEMENT ---\n";
        formData.platforms.forEach(p => {
          const selectedCount = formData.platformPostCounts?.[p] !== undefined ? formData.platformPostCounts[p] : 5;
          const topComp = (filteredCompetitorData[p] || []).slice(0, selectedCount);
          if (topComp.length > 0) {
            historicalInsights += `\n[${p.toUpperCase()}]:\n`;
            topComp.forEach((post, i) => {
              const brandName = post.trackedAccount?.displayName || post.trackedAccount?.username || 'Competitor';
              const caption = post.caption || post.rawData?.caption || post.rawData?.Description || post.rawData?.text || post.rawExtensionData?.caption || post.rawExtensionData?.text || "No caption";
              const safeCaption = caption.replace(/\n/g, ' ');
              historicalInsights += `${i+1}. Brand: ${brandName} | Caption: "${safeCaption}" | Engagement: ${post.likes} Likes, ${post.commentsCount} Comments\n`;
            });
          }
        });
      }

      // ── Build Start Date for Calendar ──
      const calendarStartDate = formData.startDate || new Date().toISOString().split('T')[0];

      // ── Build Platform Links Instruction ──
      const platformLinksNote = formData.platforms.map(p => {
        if (p === 'facebook') return '"fbLink"';
        if (p === 'instagram') return '"igLink"';
        if (p === 'tiktok') return '"ttLink"';
        return `"${p}Link"`;
      }).join(', ');

      // ── Build Inclusions Instruction ──
      let inclusionNotes = [];
      if (formData.includeCaptions) inclusionNotes.push('Write full, ready-to-post captions with hooks, emojis, and hashtags in the "caption" field');
      if (formData.includeHashtags) inclusionNotes.push('Include 5-10 relevant hashtags at the end of every caption');
      if (formData.includeVideoIdeas) inclusionNotes.push('For Reel/Video posts, include a brief scene-by-scene description or script outline in the "visualCopy" field');

      const generatedPrompt = `You are an elite Social Media Content Strategist. Generate a deeply strategic ${formData.durationDays}-day Social Media Content Calendar for the brand "${formData.businessName}".

══════════════════════════════════════
SECTION 1: BRAND CONTEXT & STRATEGY
══════════════════════════════════════

[BRAND IDENTITY]
- Business Name: ${formData.businessName} ${formData.businessWebsite ? `(${formData.businessWebsite})` : ''}
- Industry/Niche: ${formData.niche || '(Not specified — infer from competitor data below)'}
- Location: ${formData.businessLocation || '(Not specified)'}
- Brand Voice: ${formData.brandVoice || 'Professional yet approachable'}
- Target Audience: ${formData.targetAudience || '(General audience — infer from niche)'}
- Products/Services: ${formData.productsOrServices || '(Not specified)'}
- Current Offer/Promotion: ${formData.mainOffer || '(None currently)'}

[CAMPAIGN OBJECTIVES]
- Primary Goals: ${formData.contentGoal.join(', ') || 'Engagement & Brand Awareness'}
- Target Platforms: ${formData.platforms.join(', ')}
- Content Language: ${formData.language || 'English'}
- Preferred Formats: ${formData.preferredFormats.length > 0 ? formData.preferredFormats.join(', ') : 'Static, Reel, Carousel (Auto-mix)'}
- Calendar Duration: ${formData.durationDays} days starting from ${calendarStartDate}

══════════════════════════════════════
SECTION 2: COMPETITOR INTELLIGENCE
══════════════════════════════════════

${historicalInsights || "(No historical data available. Use general industry best practices for the niche.)"}

[PERFORMANCE STRATEGY]
- Market Reference: ${performanceStrategy}
- Analysis Period: ${formData.analysisStartDate || 'N/A'} to ${formData.analysisEndDate || 'N/A'}

══════════════════════════════════════
SECTION 3: CONTENT STRATEGY FRAMEWORK
══════════════════════════════════════

Apply the following content strategy methodology:

[CONTENT PILLARS]
Design 4-5 content pillars with a balanced mix:
- Educational/How-To (30%): Establish authority, provide value, solve problems
- Behind-the-Scenes/Personal (20%): Build connection and trust, humanize the brand
- Entertainment/Trending (20%): Reach new audiences, increase shares, ride trends
- Social Proof/Results (15%): Build credibility with testimonials, case studies, wins
- Promotional/CTA (15%): Drive conversions with offers, launches, lead magnets

[HOOK STRATEGY]
Every post MUST start with a powerful hook. Use these patterns:
- Problem-Solution: "Stop [doing X]. Do this instead..."
- Numbered List: "[X] ways to [achieve result]"
- Myth-Busting: "The [topic] advice that's actually ruining your [outcome]"
- POV/Relatable: "POV: You're a [role] who [situation]"
- Transformation: "From [before state] to [after state] in [time]"
- Hot Take: "[Controversial opinion] and here's why..."

[CTA STRATEGY]
Match CTAs to content type:
- Educational → "Save this for later" / "Share with someone who needs this"
- Entertainment → "Tag someone who relates" / "Comment your experience"
- Social Proof → "DM us to get started" / "Link in bio"
- Promotional → "Limited offer - Link in bio" / "Comment [KEYWORD] for details"
- Engagement → "Which one are you? Comment below" / "Agree or disagree?"

══════════════════════════════════════
SECTION 4: OUTPUT FORMAT (CRITICAL)
══════════════════════════════════════

You MUST respond with a valid JSON array. Each object represents one day's post and MUST contain ALL of the following fields:

{
  "date": "YYYY-MM-DD",           // e.g. "2026-05-15"
  "time": "HH:MM AM/PM",          // e.g. "09:30 AM", "03:00 PM"
  "contentType": "Static|Reel|Carousel|Story|Video",
  "pillar": "Content pillar name",
  "visualCopy": "The text/concept that appears ON the visual creative itself (poster/video).",
  "caption": "The full, ready-to-post social media caption including hook, body, CTA, and hashtags.",
  "platforms": "${formData.platforms.join(', ')}",
  "status": "Draft"
}

[FIELD DEFINITIONS]
- "date": Sequential dates starting from ${calendarStartDate}
- "time": A strategic time to post based on audience behavior (e.g. morning for motivation, evening for entertainment)
- "contentType": The format of the post (Static image, Reel/short video, Carousel multi-slide, Story)
- "pillar": The strategic content pillar this post belongs to
- "visualCopy": SHORT text that goes ON the creative visual itself. Headline, bullet points, etc.
- "caption": The FULL social media caption. Include hook, body, CTA, and hashtags.
- "platforms": Which platforms to post on
- "status": Always "Draft"

══════════════════════════════════════
SECTION 5: QUALITY REQUIREMENTS
══════════════════════════════════════

${inclusionNotes.length > 0 ? inclusionNotes.map((n, i) => `${i+1}. ${n}`).join('\n') : ''}
${formData.includeHashtags ? `- Use 5-10 niche-relevant hashtags per caption. Mix popular and niche-specific tags.` : '- Do NOT include hashtags.'}

MANDATORY RULES:
1. Deeply analyze ALL competitor captions and engagement data provided above. Identify winning patterns (tone, length, emoji usage, CTA style, content themes) and replicate what works.
2. Every caption must be FULL and COMPLETE — ready to copy-paste and post. No placeholders like "[Insert CTA]" or "[Brand tagline]".
3. "visualCopy" must be DIFFERENT from "caption". visualCopy = design text ON the image. caption = social media post text.
4. Vary content types across the ${formData.durationDays} days: mix Static, Reel, Carousel, etc.
5. Distribute content pillars evenly using the percentage ratios defined above.
6. Each post must have a strong opening hook in the first line of the caption.
7. Output ONLY a valid JSON object with a single key "posts" containing the array of ${formData.durationDays} post objects. Do not include any markdown, explanations, or code fences.`;
      
      setFormData(prev => ({ ...prev, prompt: generatedPrompt }));
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleCompetitorChange = (index, field, value) => {
    const updatedCompetitors = [...formData.competitors];
    updatedCompetitors[index][field] = value;
    setFormData(prev => ({ ...prev, competitors: updatedCompetitors }));
  };

  const addCompetitor = () => {
    setFormData(prev => ({
      ...prev,
      competitors: [...prev.competitors, { name: `Competitor ${prev.competitors.length + 1}`, percentage: 0 }]
    }));
  };

  const removeCompetitor = (index) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Prevent accidental submission before step 4 (Review & Generate)
    if (currentStep < 4) {
      console.log('Submission blocked: Not on final step.');
      return;
    }

    if (!formData.prompt.trim()) {
      setToast({ message: "Please ensure the prompt is generated before submitting.", type: "error" });
      return;
    }

    setIsGenerating(true);
    try {
      const data = await generateCalendarAI(formData.prompt);
      if (Array.isArray(data)) {
        setGeneratedData(data);
        setIsGenerated(true); // Switch to results view
        setToast({ message: "Content Calendar generated successfully!", type: "success" });
        // Auto-save to database
        handleSaveToDatabase(data);
      } else if (data.raw) {
        // If it's raw text (failed to parse), we might want to handle it or show an error
        setToast({ message: "AI returned raw text instead of a structured calendar. Please refine your prompt.", type: "error" });
      }
    } catch (err) {
      console.error("AI Generation failed", err);
      setToast({ message: err.response?.data?.message || "Failed to generate content calendar.", type: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiEditSubmit = async () => {
    if (!aiEditModal.instruction.trim()) return;
    
    setAiEditModal(prev => ({ ...prev, isProcessing: true }));
    try {
      const currentRow = generatedData[aiEditModal.rowIndex];
      const editPrompt = `
        ### ROLE
        You are an Expert Social Media Strategist and Copywriter specialized in high-conversion content.
        
        ### PRIORITY
        Deeply consider and prioritize the USER INSTRUCTION above all else for the content refinement process.
        
        ### USER INSTRUCTION
        "${aiEditModal.instruction}"
        
        ### TASK
        Your task is to REFINE the specific social media post below based on the USER INSTRUCTION while maintaining strategic brand alignment.
        
        ### ORIGINAL CONTENT TO REFINE
        - Date: ${currentRow.date}
        - Content Type: ${currentRow.contentType}
        - Pillar: ${currentRow.pillar}
        - Visual Copy: ${currentRow.visualCopy}
        - Caption: ${currentRow.caption}
        
        ### SYSTEM FIXED CONSTRAINTS (MANDATORY)
        1. Maintain the original "Date" exactly.
        2. Ensure the "Caption" is engaging, uses appropriate emojis, and follows the user's refinement instruction perfectly.
        3. The "Visual Copy" should be descriptive and strategically aligned with the content type.
        4. Status should remain "DRAFT" or as specified in original.
        
        ### SYSTEM FIXED OUTPUT FORMAT (MANDATORY)
        You MUST return ONLY a valid JSON object. Do not include any conversational text.
        Structure:
        {
          "contentType": "...",
          "pillar": "...",
          "visualCopy": "...",
          "caption": "...",
          "status": "..."
        }
      `;
      
      const result = await generateCalendarAI(editPrompt);
      let updatedRow = result;
      
      // If the result is an array (AI sometimes does that), take the first item
      if (Array.isArray(result)) {
        updatedRow = result[0];
      } else if (result.raw) {
        // Attempt to parse manually if needed, but generateCalendarAI already tries that
        throw new Error("Could not parse AI response as JSON");
      }
      
      const newData = [...generatedData];
      newData[aiEditModal.rowIndex] = { ...currentRow, ...updatedRow, date: currentRow.date }; // Ensure date is preserved
      setGeneratedData(newData);
      setToast({ message: "Post updated with AI successfully!", type: "success" });
      setAiEditModal(prev => ({ ...prev, instruction: '' }));
    } catch (err) {
      console.error("AI Row Edit failed", err);
      setToast({ message: "Failed to refine post with AI.", type: "error" });
    } finally {
      setAiEditModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleSaveToDatabase = async (postsToSave = null) => {
    const dataToUse = postsToSave || generatedData;
    if (!selectedClient || !dataToUse || dataToUse.length === 0) return;

    setIsSaving(true);
    try {
      const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      const calendarData = {
        clientId: selectedClient.id,
        name: `${selectedClient.name} - ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`,
        month: monthNames[startDate.getMonth()],
        year: startDate.getFullYear(),
        competitors: formData.competitors.map(c => ({ id: c.id, name: c.name })),
        promptUsed: formData.prompt,
        posts: dataToUse
      };

      await saveCalendar(calendarData);
      setToast({ message: postsToSave ? "Calendar generated and auto-saved!" : "Content Calendar saved successfully!", type: "success" });
    } catch (err) {
      console.error("Failed to save calendar", err);
      setToast({ message: "Failed to save calendar to database.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCalendar = () => {
    if (!selectedHistoryFilter.date) return;
    
    const [month, year] = selectedHistoryFilter.date.split(' ');
    const calendar = savedCalendars.find(c => {
      const isMonthYearMatch = c.month === month && c.year.toString() === year;
      if (!isMonthYearMatch) return false;
      if (!selectedHistoryFilter.client) return true;
      const calendarClientName = c.name ? c.name.split(' - ')[0] : '';
      return calendarClientName === selectedHistoryFilter.client;
    });

    if (!calendar) return;

    setCalendarToDelete(calendar);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCalendar = async () => {
    if (!calendarToDelete) return;

    try {
      await deleteCalendar(calendarToDelete.id);
      setToast({ message: "Calendar deleted successfully!", type: "success" });
      
      // Reset view
      setIsGenerated(false);
      setGeneratedData([]);
      setSelectedHistoryFilter({ client: '', date: '' });
      
      // Refresh calendar list
      if (selectedClient) {
        fetchSavedCalendars(selectedClient.id);
      } else {
        fetchAllCalendars();
      }
    } catch (err) {
      console.error("Failed to delete calendar", err);
      setToast({ message: "Failed to delete calendar.", type: "error" });
    } finally {
      setIsDeleteModalOpen(false);
      setCalendarToDelete(null);
    }
  };

  const handleDeleteRow = (index) => {
    setRowToDeleteIndex(index);
    setIsDeleteRowModalOpen(true);
  };

  const confirmDeleteRow = async () => {
    if (rowToDeleteIndex === null) return;

    const row = generatedData[rowToDeleteIndex];
    
    try {
      if (row.id) {
        await deletePost(row.id);
      }
      
      const newData = [...generatedData];
      newData.splice(rowToDeleteIndex, 1);
      setGeneratedData(newData);
    } finally {
      setIsDeleteRowModalOpen(false);
      setRowToDeleteIndex(null);
    }
  };

  const handleUpdateRow = async (index, updatedFields) => {
    const row = generatedData[index];
    
    // Optimistic Update
    const newData = [...generatedData];
    newData[index] = { ...row, ...updatedFields };
    setGeneratedData(newData);

    try {
      if (row.id) {
        // Filter only valid database columns to avoid TypeORM errors
        const validFields = {};
        const dbColumns = ['pillar', 'visualCopy', 'caption', 'status', 'date', 'time', 'contentType'];
        
        Object.keys(updatedFields).forEach(key => {
          if (dbColumns.includes(key)) {
            validFields[key] = updatedFields[key];
          }
        });

        if (Object.keys(validFields).length > 0) {
          await updatePost(row.id, validFields);
        }
      }
    } catch (err) {
      console.error("Failed to update post", err);
      setToast({ message: "Failed to auto-update post. Please check your connection.", type: "error" });
    }
  };

  const handleAiEdit = (index, e) => {
    const row = e.currentTarget.closest('tr');
    // Use offsetTop to align perfectly with the row
    setRefinementOffset(row.offsetTop);
    setAiEditModal({ ...aiEditModal, isOpen: true, rowIndex: index });
  };

  const selectClient = async (client) => {
    setSelectedClient(client);
    setFormData({ ...formData, clientId: client.id, businessName: client.name });
    setIsDropdownOpen(false);
    
    // Fetch saved calendars history
    fetchSavedCalendars(client.id);
    
    // Fetch performance data for the selected client
    setIsPerformanceLoading(true);
    try {
      const response = await api.get(`/apify/${client.id}/posts`);
      const posts = response.data;
      const organizedData = { own: {}, competitors: {} };
      
      posts.forEach(post => {
        const type = post.accountType === 'own' ? 'own' : 'competitors';
        const platform = (post.platform || '').toLowerCase();
        if (platform) {
          if (!organizedData[type][platform]) organizedData[type][platform] = [];
          organizedData[type][platform].push(post);
        }
      });
      
      // We no longer slice the array here. 
      // All posts are kept so the date filter can search the entire history.

      
      setClientPerformanceData(organizedData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsPerformanceLoading(false);
    }
  };

  const totalPercentage = formData.competitors.reduce((sum, c) => sum + c.percentage, 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Review': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col pb-24">
      {/* ──── Header ──── */}
      <div className="mb-8 shrink-0 pl-1">
        <h1 className="text-[42px] tracking-[-0.02em] leading-tight text-[#101828]">
          <span className="font-bold">AI Content</span>
          <span className="font-normal ml-2">Generator</span>
        </h1>
        <p className="text-[#475467] text-lg font-normal mt-1">Define your parameters and let AI build your strategy.</p>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0">
        
        {/* ═══════════ TOP SECTION: FORM (SINGLE BOX) ═══════════ */}
        <div className="w-full shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 relative overflow-hidden">

            
            <form onSubmit={handleSubmit} className="flex flex-col min-h-[350px]">
              
              <div className="flex-1">
                {/* ─── STEP 1: Basics & Platforms ─── */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[#003870] text-[20px]">person</span>
                        Client Basics
                      </h3>
                      
                      {/* Client Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-4 py-3 transition-all text-left group"
                        >
                          {selectedClient ? (
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#003870] to-[#0066cc] flex items-center justify-center text-white text-[11px] font-bold shadow-sm shadow-[#003870]/20">
                                {selectedClient.name?.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-700 text-sm">{selectedClient.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium text-sm">Choose a client...</span>
                          )}
                          <span className="material-symbols-outlined text-slate-400 group-hover:text-[#003870] text-[18px]">expand_more</span>
                        </button>

                        {isDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl border border-slate-100 shadow-xl max-h-[200px] overflow-auto">
                              {isLoading ? (
                                <div className="p-3 text-center text-slate-400 text-sm">Loading...</div>
                              ) : clients.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-sm">No clients found</div>
                              ) : (
                                clients.map(client => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => selectClient(client)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                  >
                                    <span className={`font-semibold text-sm ${formData.clientId === client.id ? 'text-[#003870]' : 'text-slate-600'}`}>
                                      {client.name}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Business Website</label>
                        <input type="text" placeholder="e.g. www.absolutebasics.com" value={formData.businessWebsite} onChange={e => handleInputChange('businessWebsite', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Business Location</label>
                        <input type="text" placeholder="e.g. Colombo, Sri Lanka" value={formData.businessLocation} onChange={e => handleInputChange('businessLocation', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Niche</label>
                        <input type="text" placeholder="e.g. Women fashion store" value={formData.niche} onChange={e => handleInputChange('niche', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[#003870] text-[20px]">target</span>
                        Audience & Platforms
                      </h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Target Audience</label>
                        <textarea placeholder="e.g. Women aged 18-35 in Sri Lanka who are interested in sustainable fashion..." value={formData.targetAudience} onChange={e => handleInputChange('targetAudience', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm min-h-[80px] resize-none" />
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-4">Select Platforms</p>
                        <div className="flex flex-wrap gap-5">
                          {[
                            { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
                            { id: 'instagram', label: 'Instagram', Icon: InstagramIcon },
                            { id: 'tiktok', label: 'TikTok', Icon: TikTokIcon }
                          ].map(platform => {
                            const isActive = formData.platforms.includes(platform.id);
                            return (
                              <label key={platform.id} className="flex items-center gap-2.5 cursor-pointer group">
                                <div className="relative flex items-center">
                                  <input type="checkbox" className="sr-only" checked={isActive} onChange={() => togglePlatform(platform.id)} />
                                  <div className={`h-5 w-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${isActive ? 'bg-[#003870] border-[#003870] shadow-sm shadow-[#003870]/20' : 'bg-white border-slate-200 group-hover:border-[#003870]/30'}`}>
                                    {isActive && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <platform.Icon active={isActive} />
                                  <span className={`text-sm font-bold transition-colors ${isActive ? 'text-[#003870]' : 'text-slate-500 group-hover:text-slate-700'}`}>{platform.label}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 2: Content Strategy ─── */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[#003870] text-[20px]">strategy</span>
                        Content Strategy
                      </h3>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-3">Content Goals</p>
                        <div className="flex flex-wrap gap-2">
                          {['Grow followers', 'Increase sales', 'Build brand awareness', 'Engagement'].map(goal => (
                            <button type="button" key={goal} onClick={() => toggleArrayItem('contentGoal', goal)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.contentGoal.includes(goal) ? 'bg-[#003870] text-white border-[#003870]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#003870]/50'}`}>
                              {goal}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Brand Voice</label>
                        <input type="text" placeholder="e.g. Casual, friendly" value={formData.brandVoice} onChange={e => handleInputChange('brandVoice', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Language</label>
                        <input type="text" placeholder="e.g. English / Sinhala" value={formData.language} onChange={e => handleInputChange('language', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[#003870] text-[20px]">calendar_month</span>
                        Schedule & Formats
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Posts Per Week</label>
                            <input type="number" placeholder="e.g. 7" value={formData.postsPerWeek} onChange={e => handleInputChange('postsPerWeek', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Duration (Days)</label>
                            <input type="number" placeholder="e.g. 30" value={formData.durationDays} onChange={e => handleInputChange('durationDays', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Start Date</label>
                            <input type="date" value={formData.startDate} onChange={e => handleInputChange('startDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">End Date (Auto)</label>
                            <input 
                              type="text" 
                              readOnly 
                              value={formData.startDate && formData.durationDays ? new Date(new Date(formData.startDate).getTime() + (parseInt(formData.durationDays) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 'Calculating...'} 
                              className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 outline-none text-slate-400 text-sm cursor-not-allowed" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-3">Preferred Formats</p>
                        <div className="flex flex-wrap gap-2">
                          {['Reels', 'Carousels', 'Static Posts', 'Stories'].map(format => (
                            <button type="button" key={format} onClick={() => toggleArrayItem('preferredFormats', format)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.preferredFormats.includes(format) ? 'bg-[#003870] text-white border-[#003870]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#003870]/50'}`}>
                              {format}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 3: Products, Offers & Competitors ─── */}
                {currentStep === 3 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[#003870] text-[20px]">shopping_bag</span>
                        Products & Offers
                      </h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Products or Services</label>
                        <textarea placeholder="List your products or services..." value={formData.productsOrServices} onChange={e => handleInputChange('productsOrServices', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm min-h-[80px] resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Main Offer / Discount</label>
                        <input type="text" placeholder="e.g. 20% off for new arrivals" value={formData.mainOffer} onChange={e => handleInputChange('mainOffer', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                      
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-3 mt-2">Inclusions</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'includeCaptions', label: 'Include Captions' },
                            { id: 'includeHashtags', label: 'Include Hashtags' },
                            { id: 'includeVideoIdeas', label: 'Include Video Ideas' },
                            { id: 'includeTrackingTemplate', label: 'Tracking Template' }
                          ].map(toggle => (
                            <label key={toggle.id} className="flex items-center gap-2.5 cursor-pointer">
                              <div className={`w-8 h-4.5 flex items-center bg-slate-200 rounded-full p-0.5 cursor-pointer transition-colors ${formData[toggle.id] ? 'bg-[#003870]' : ''}`} onClick={() => toggleBoolean(toggle.id)}>
                                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${formData[toggle.id] ? 'translate-x-3.5' : ''}`}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600">{toggle.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#003870] text-[20px]">analytics</span>
                          Engagement Strategy (Competitor Data)
                        </h3>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Analysis Period</label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1 shadow-sm hover:border-[#003870]/30 transition-colors">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase">From</span>
                              <input 
                                type="date" 
                                value={formData.analysisStartDate} 
                                onChange={e => handleInputChange('analysisStartDate', e.target.value)} 
                                className="bg-transparent text-[13px] font-bold text-[#003870] outline-none w-full cursor-pointer"
                              />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1 shadow-sm hover:border-[#003870]/30 transition-colors">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase">To</span>
                              <input 
                                type="date" 
                                value={formData.analysisEndDate} 
                                onChange={e => handleInputChange('analysisEndDate', e.target.value)} 
                                className="bg-transparent text-[13px] font-bold text-[#003870] outline-none w-full cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Reference Priority</label>
                      </div>

                      <div className="max-h-[250px] overflow-y-auto pr-1 no-scrollbar space-y-3">
                        {/* Automated Platform Sources */}
                        {formData.platforms.length > 0 ? (
                          formData.platforms.map((platform) => {
                            const availablePosts = filteredCompetitorData[platform]?.length || 0;
                            const currentCount = formData.platformPostCounts?.[platform] !== undefined ? formData.platformPostCounts[platform] : Math.min(5, availablePosts);
                            
                            return (
                            <div key={platform} className="bg-white p-3 px-4 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:border-[#003870]/30 group">
                              <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-[#003870]/20 transition-colors shrink-0">
                                  {platform === 'instagram' && <InstagramIcon active={true} />}
                                  {platform === 'facebook' && <FacebookIcon active={true} />}
                                  {platform === 'tiktok' && <TikTokIcon active={true} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-slate-800 truncate">{platform.charAt(0).toUpperCase() + platform.slice(1)} Top Engagement</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Based on Competitor Data ({availablePosts} Posts Found)</p>
                                </div>
                                <div className="flex items-center gap-4 w-48 shrink-0">
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max={availablePosts} 
                                    value={currentCount}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        platformPostCounts: {
                                          ...prev.platformPostCounts,
                                          [platform]: parseInt(e.target.value)
                                        }
                                      }));
                                    }}
                                    className="flex-1 accent-[#003870] h-1.5 bg-slate-100 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                    disabled={availablePosts === 0}
                                  />
                                  <span className="font-extrabold text-[#003870] text-[11px] w-12 text-right">{currentCount} Posts</span>
                                </div>
                              </div>
                            </div>
                          )})
                        ) : (
                          <div className="p-6 border border-dashed border-slate-100 rounded-2xl text-center">
                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">No Platforms Selected</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 4: Review & Generate ─── */}
                {currentStep === 4 && (
                  <div className={`animate-in fade-in duration-300 transition-all ${
                    isPromptMaximized 
                      ? 'fixed inset-0 z-[100] bg-white p-10 flex flex-col' 
                      : 'relative'
                  }`}>
                    {isPromptMaximized && (
                      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm -z-10" onClick={() => setIsPromptMaximized(false)} />
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#003870] text-[20px]">smart_toy</span>
                        AI Prompt Focus
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {formData.prompt.trim() ? formData.prompt.trim().split(/\s+/).length : 0} Words
                        </span>
                        <button 
                          type="button"
                          onClick={() => setIsPromptMaximized(!isPromptMaximized)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#003870] transition-colors flex items-center justify-center"
                          title={isPromptMaximized ? "Minimize" : "Maximize"}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isPromptMaximized ? 'close_fullscreen' : 'open_in_full'}
                          </span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">We've compiled your configuration into the prompt below. You can edit it before generating.</p>
                    <textarea
                      required
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm resize-none transition-all leading-relaxed ${
                        isPromptMaximized ? 'flex-1 text-base' : 'min-h-[160px]'
                      }`}
                    />
                    {isPromptMaximized && (
                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsPromptMaximized(false)}
                          className="px-6 py-2.5 rounded-xl bg-[#003870] text-white font-bold text-sm hover:bg-[#002d5a] transition-all shadow-lg"
                        >
                          Done Editing
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── Footer: Navigation Buttons ─── */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                      Back
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Step Indicators */}
                  <div className="flex gap-1.5 hidden md:flex">
                    {[1, 2, 3, 4].map(step => (
                      <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === step ? 'w-6 bg-[#003870]' : currentStep > step ? 'w-1.5 bg-[#003870]/40' : 'w-1.5 bg-slate-200'}`} />
                    ))}
                  </div>

                  {currentStep < 4 ? (
                    <button
                      key="next-button"
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#003870] to-[#0055a5] shadow-lg shadow-[#003870]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      Next
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                  ) : (
                    <button
                      key="submit-button"
                      type="submit"
                      disabled={!formData.clientId || formData.platforms.length === 0 || !formData.prompt || isGenerating}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#003870] to-[#0055a5] shadow-lg shadow-[#003870]/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isGenerating ? (
                        <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Generating...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[18px]">auto_awesome</span> Generate Calendar</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* ═══════════ BOTTOM SECTION: RESULTS TABLE ═══════════ */}
        <div className="flex-1 flex gap-6 min-h-0">
          <div className={`flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${aiEditModal.isOpen ? 'basis-[70%]' : 'basis-full'}`}>
            <HistoryFilters 
              isGenerated={isGenerated}
              selectedFilter={selectedHistoryFilter}
              onFilterChange={setSelectedHistoryFilter}
              clients={historyClients}
              dates={historyDates}
              isSaving={isSaving}
              onSave={() => handleSaveToDatabase()}
              onDelete={handleDeleteCalendar}
              onExport={() => {/* Export Logic */}}
            />

            <div className="flex-1 overflow-auto relative p-1">
              <div className="flex gap-8 items-start min-w-fit">
                <div className="flex-1 min-w-[1000px]">
                  {isGenerated ? (
                    <CalendarTable 
                      data={generatedData} 
                      onAiEdit={handleAiEdit}
                      onDeleteRow={handleDeleteRow}
                      onUpdateRow={handleUpdateRow}
                      getStatusColor={getStatusColor}
                      editingIndex={aiEditModal.rowIndex}
                    />
                  ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                      <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-[#003870]/10 to-[#0066cc]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-5xl text-[#003870]/40">table_chart</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">No Content Generated Yet</h3>
                      <p className="text-slate-500 max-w-sm mx-auto text-sm">
                        Fill out the configuration form on the left and click "Generate Calendar" to see AI-driven content suggestions here.
                      </p>
                    </div>
                  )}
                </div>

                {/* ═══════════ AI REFINEMENT SIDE PANEL (COMMENT BOX STYLE) ═══════════ */}
                {aiEditModal.isOpen && (
                  <div 
                    style={{ transform: `translateY(${refinementOffset}px)` }}
                    className="w-[380px] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300 overflow-hidden h-fit transition-all sticky top-2 z-50 mr-4"
                  >
                    <div className="px-6 py-5 bg-[#003870] flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-white text-[20px]">auto_fix_high</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Refine Post</h3>
                      </div>
                      <button 
                        onClick={() => setAiEditModal({ ...aiEditModal, isOpen: false, rowIndex: null })}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>

                    <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                      {aiEditModal.rowIndex !== null && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Editing Row {aiEditModal.rowIndex + 1}</p>
                          <p className="text-xs text-slate-600 font-bold truncate">"{generatedData[aiEditModal.rowIndex]?.visualCopy || generatedData[aiEditModal.rowIndex]?.visual}"</p>
                        </div>
                      )}

                      <div className="relative group">
                        <p className="text-xs font-bold text-slate-500 mb-2 pl-1">Instruction for AI</p>
                        <div className="relative flex flex-col">
                          <textarea
                            value={aiEditModal.instruction}
                            onChange={(e) => setAiEditModal({ ...aiEditModal, instruction: e.target.value })}
                            placeholder="e.g., 'Make it punchier', 'Add more emojis', 'Change the tone'..."
                            className="w-full h-40 px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-[#003870] outline-none transition-all text-sm text-slate-700 font-medium resize-none shadow-inner"
                            disabled={aiEditModal.isProcessing}
                          ></textarea>
                          
                          <button
                            onClick={handleAiEditSubmit}
                            disabled={aiEditModal.isProcessing || !aiEditModal.instruction.trim()}
                            className="absolute bottom-3 right-3 w-12 h-12 rounded-xl bg-[#003870] text-white shadow-lg shadow-[#003870]/30 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center"
                          >
                            {aiEditModal.isProcessing ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <span className="material-symbols-outlined">send</span>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 mt-2">
                        <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">AI Tips</p>
                        <div className="grid grid-cols-2 gap-2">
                          {['Make longer', 'Add hashtags', 'Change tone', 'Fix grammar'].map(tip => (
                            <button 
                              key={tip}
                              onClick={() => setAiEditModal(prev => ({ ...prev, instruction: tip }))}
                              className="px-3 py-2 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-[#003870] hover:border-[#003870]/20 transition-all text-left truncate"
                            >
                              {tip}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100">
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                         Type your changes above. AI will rewrite the post content while keeping the date and pillar intact.
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-10 right-10 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border-l-4 ${toast.type === "success" ? "border-[#003870]" : "border-[#93000a]"} shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-300`}>
           <div className={toast.type === "success" ? "text-[#003870]" : "text-[#93000a]"}>
             {toast.type === "success" ? (
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
             ) : (
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
               </svg>
             )}
           </div>
           <p className="text-base font-bold text-[#191c1d] tracking-tight">{toast.message}</p>
           <button onClick={() => setToast(null)} className="ml-4 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined text-[18px]">close</span>
           </button>
        </div>
      )}

      <DeleteConfirmationModal 
        open={isDeleteRowModalOpen}
        onClose={() => setIsDeleteRowModalOpen(false)}
        onConfirm={confirmDeleteRow}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This will remove it from the calendar permanently."
      />

      <DeleteConfirmationModal 
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteCalendar}
        title="Delete Content Calendar?"
        message={`Are you sure you want to permanently delete the calendar "${calendarToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default CreateContentCalendar;

