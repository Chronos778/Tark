import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Languages, FileText, PenTool, Loader2, Maximize2, X, Sparkles, History, ChevronRight, Clock } from 'lucide-react';
import Header from "@/components/Header";
import jsPDF from 'jspdf';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";

const exampleScenarios: Record<string, string> = {
    legal_notice: "Sender: Ramesh Kumar, 123 MG Road, Mumbai.\nRecipient: Suresh Patel, 456 Link Road, Mumbai.\nIssue: Non-repair of rented property despite multiple reminders.\nDemand: Repair damages worth Rs. 50,000 within 15 days or face legal action.",
    nda: "Party A: TechSolutions Pvt Ltd, Bangalore.\nParty B: Rahul Verma, Consultant.\nPurpose: Exploring potential software development partnership.\nConfidential Info: Source code, business strategies, client lists.\nDuration: 2 years.",
    rent_agreement: "Landlord: Amit Singh, Delhi.\nTenant: Priya Sharma, Delhi.\nProperty: Flat 301, Green Apartments, Rohini, Delhi.\nRent: Rs. 25,000/month.\nSecurity Deposit: Rs. 50,000.\nDuration: 11 months.\nStart Date: 1st February 2024.",
    affidavit: "Deponent: Vijay Singh, aged 35, residing in Pune.\nStatement: I declare that I have lost my original driving license (DL No. MH123456) on 10th Jan 2024 while travelling from Pune to Mumbai. I have not misused it.",
    employment_contract: "Employer: Innovate AI Ltd, Hyderabad.\nEmployee: Anjali Das.\nDesignation: Senior Data Scientist.\nSalary: Rs. 1,50,000/month.\nNotice Period: 60 days.\nJoining Date: 1st March 2024.",
    posh_complaint: "Complainant: Neha Gupta, Marketing Manager.\nRespondent: Ravi Kumar, Team Lead.\nIncident: Unsolicited inappropriate comments made during lunch break on 15th Jan 2024 at the office cafeteria.\nWitnesses: Priya (HR), Rahul (Sales).",
    rti_application: "Department: Ministry of Road Transport & Highways.\nInformation Sought: 1. Status of road construction project on NH-44 near Nagpur. 2. Total funds allocated and utilized for this project in 2023-24.\n Applicant: Suresh Patil, Nagpur."
};

interface HistoryItem {
    id: string;
    type: string;
    details: string;
    content: string;
    timestamp: number;
    dateStr: string;
}

const DraftingPage = () => {
    const [draftType, setDraftType] = useState<string>("legal_notice");
    const [details, setDetails] = useState<string>("");
    const [language, setLanguage] = useState<string>("en");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState<string>("");
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState("new");

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem("draft_history");
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveToHistory = (draft: string, type: string, dets: string) => {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            type: type,
            details: dets,
            content: draft,
            timestamp: Date.now(),
            dateStr: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updated = [newItem, ...history].slice(0, 50); // Keep last 50
        setHistory(updated);
        localStorage.setItem("draft_history", JSON.stringify(updated));
    };

    const loadDraft = (item: HistoryItem) => {
        setDraftType(item.type);
        setDetails(item.details);
        setGeneratedDraft(item.content);
        setActiveTab("new"); // Switch back to editor view
        toast.success("Draft loaded from history!");
    };

    const handleGenerate = async () => {
        if (!details.trim()) {
            toast.error("Please provide some details for the draft.");
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch(getApiUrl('/draft'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    draft_type: draftType,
                    details: details,
                    language: language
                })
            });

            const data = await response.json();
            if (data.draft) {
                setGeneratedDraft(data.draft);
                saveToHistory(data.draft, draftType, details);
                toast.success("Draft generated and saved to history!");
            } else {
                toast.error("Failed to generate draft. Please try again.");
            }
        } catch (error) {
            console.error("Error generating draft:", error);
            toast.error("Connection error. Is the backend running?");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!generatedDraft) return;

        const doc = new jsPDF();
        
        // Add Title
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("LegalAi Draft", 105, 20, { align: "center" });

        // Add Metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Type: ${draftType.replace(/_/g, " ").toUpperCase()}`, 15, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
        
        // Add Content
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        const splitText = doc.splitTextToSize(generatedDraft, 180);
        
        let y = 50;
        if (splitText.length > 50) {
             doc.text(splitText, 15, y);
        } else {
             doc.text(splitText, 15, y);
        }

        // Add Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Generated by LegalAi - Not a substitute for professional legal advice.", 105, pageHeight - 10, { align: 'center' });

        doc.save(`${draftType}_draft.pdf`);
        toast.success("PDF Downloaded!");
    };

    return (
        <div className="min-h-screen bg-[#09090B] text-white selection:bg-purple-500/30">
            <Header autoHide />
            
            {/* Focus Mode Overlay */}
            {isFocusMode && (
                <div className="fixed inset-0 z-[100] bg-[#09090B] p-6 animate-in fade-in duration-300">
                    <div className="container max-w-5xl mx-auto h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-medium text-white/80">Focus Mode</h2>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleDownloadPDF} 
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    <Download className="w-4 h-4 mr-2" /> PDF
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setIsFocusMode(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                        <Textarea 
                            value={generatedDraft}
                            onChange={(e) => setGeneratedDraft(e.target.value)}
                            className="flex-1 bg-[#18181b] border-white/10 text-white font-serif text-lg leading-loose p-8 resize-none focus:ring-0 focus:border-purple-500/30 rounded-xl"
                            placeholder="Your draft will appear here..."
                        />
                    </div>
                </div>
            )}

            <div className="container max-w-6xl mx-auto pt-24 pb-20 px-4 md:px-6">
                
                {/* Hero Header (Badge Removed) */}
                <div className="flex flex-col items-center justify-center text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-4 tracking-tight">
                        AI Legal Drafter
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                        Generate professional legal documents in seconds. Edit them to perfection before downloading.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Tabs for Config / History */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 bg-[#18181b] border border-white/10 mb-6">
                            <TabsTrigger value="new" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300">New Draft</TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300">History</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="new" className="mt-0 h-full">
                            <Card className="bg-[#18181b] border-white/10 shadow-2xl h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                        Draft Configuration
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Provide the outcome you desire.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    
                                    {/* Type Selection */}
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Document Type</Label>
                                        <Select value={draftType} onValueChange={setDraftType}>
                                            <SelectTrigger className="bg-[#27272a] border-white/10 text-white">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#18181b] border-white/10 text-white">
                                                <SelectItem value="legal_notice">Legal Notice</SelectItem>
                                                <SelectItem value="nda">Non-Disclosure Agreement (NDA)</SelectItem>
                                                <SelectItem value="rent_agreement">Rent Agreement</SelectItem>
                                                <SelectItem value="affidavit">Affidavit</SelectItem>
                                                <SelectItem value="employment_contract">Employment Contract</SelectItem>
                                                <SelectItem value="posh_complaint">POSH Complaint</SelectItem>
                                                <SelectItem value="rti_application">RTI Application</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Situation Input */}
                                    <div className="space-y-2">
                                        <Label className="text-gray-300 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span>Situation / Details</span>
                                                <span className="text-xs text-gray-500 font-normal">Be specific (names, dates, amounts)</span>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => {
                                                    setDetails(exampleScenarios[draftType] || "");
                                                    toast(" ✨ Example details filled!");
                                                }}
                                                className="h-7 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
                                            >
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                Quick Fill
                                            </Button>
                                        </Label>
                                        <Textarea 
                                            placeholder="E.g., I want to send a legal notice to Mr. Sharma for not returning my security deposit of ₹50,000 for Flat 302..."
                                            className="min-h-[220px] bg-[#27272a] border-white/10 text-white resize-none focus:ring-purple-500/50"
                                            value={details}
                                            onChange={(e) => setDetails(e.target.value)}
                                        />
                                    </div>

                                    {/* Language & Action */}
                                    <div className="flex items-center justify-between pt-4">
                                        <div className="flex items-center gap-3 bg-[#27272a] px-4 py-2 rounded-full border border-white/10">
                                            <Languages className="w-4 h-4 text-gray-400" />
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm ${language === 'en' ? 'text-white font-medium' : 'text-gray-500'}`}>EN</span>
                                                <Switch 
                                                    checked={language === 'hi'}
                                                    onCheckedChange={(checked) => setLanguage(checked ? 'hi' : 'en')}
                                                    className="data-[state=checked]:bg-purple-600"
                                                />
                                                <span className={`text-sm ${language === 'hi' ? 'text-white font-medium' : 'text-gray-500'}`}>HI</span>
                                            </div>
                                        </div>

                                        <Button 
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !details}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-full font-medium transition-all shadow-lg hover:shadow-purple-500/25"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Drafting...
                                                </>
                                            ) : (
                                                <>
                                                    Generate Draft
                                                    <PenTool className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 h-full">
                            <Card className="bg-[#18181b] border-white/10 shadow-2xl h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <History className="w-5 h-5 text-purple-400" />
                                        Draft History
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Your recently generated documents.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {history.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">
                                            <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p>No drafts generated yet.</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <div key={item.id} className="group p-4 rounded-xl bg-[#27272a]/50 border border-white/5 hover:border-purple-500/30 hover:bg-[#27272a] transition-all cursor-pointer" onClick={() => loadDraft(item)}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-purple-200 bg-purple-500/10 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                                                            {item.type.replace(/_/g, " ")}
                                                        </span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {item.dateStr}
                                                        </span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 group-hover:text-purple-400">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                                    {item.details}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Preview Section */}
                    <div className="h-full">
                        <Card className="bg-[#18181b] border-white/10 shadow-2xl h-full flex flex-col animate-in fade-in zoom-in-95 duration-300 min-h-[600px]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-white">Draft Editor</CardTitle>
                                    <CardDescription className="text-gray-400 text-xs mt-1">
                                        Edit the content directly below.
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                         variant="ghost" 
                                         size="sm" 
                                         onClick={() => setIsFocusMode(true)}
                                         disabled={!generatedDraft}
                                         className="text-gray-400 hover:text-white"
                                         title="Focus Mode"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleDownloadPDF}
                                        disabled={!generatedDraft}
                                        className="gap-2 border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden relative">
                                {generatedDraft ? (
                                    <Textarea 
                                        value={generatedDraft}
                                        onChange={(e) => setGeneratedDraft(e.target.value)}
                                        className="w-full h-full min-h-[400px] border-0 bg-white text-black font-serif text-sm leading-relaxed p-6 resize-none focus:ring-0 rounded-b-xl"
                                        placeholder="Generated draft will appear here..."
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#18181b]/50">
                                         <div className="p-4 rounded-full bg-white/5 mb-4">
                                            <FileText className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-gray-300 font-medium mb-2">Ready to Draft</h3>
                                        <p className="text-gray-500 text-sm max-w-xs">
                                            Your legal document will appear here, fully editable and ready to export.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DraftingPage;
