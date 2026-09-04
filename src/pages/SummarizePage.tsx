import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CheckCircle, Sparkles, AlertCircle, Loader2, Download, History, Trash2, X, ChevronRight, Clock, Maximize2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { getApiUrl } from "@/lib/api";

interface SummaryHistory {
    id: string;
    fileName: string;
    summary: string;
    timestamp: number;
    dateStr: string;
}

const SummarizePage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [history, setHistory] = useState<SummaryHistory[]>([]);
    const [activeTab, setActiveTab] = useState("new");
    const [dragActive, setDragActive] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);

    // Load history from local storage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem("summaryHistory");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveToHistory = (fileName: string, summaryText: string) => {
        const newEntry: SummaryHistory = {
            id: Date.now().toString(),
            fileName,
            summary: summaryText,
            timestamp: Date.now(),
            dateStr: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedHistory = [newEntry, ...history].slice(0, 50); // Keep last 50
        setHistory(updatedHistory);
        localStorage.setItem("summaryHistory", JSON.stringify(updatedHistory));
    };

    const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedHistory = history.filter(item => item.id !== id);
        setHistory(updatedHistory);
        localStorage.setItem("summaryHistory", JSON.stringify(updatedHistory));
        toast.success("Removed from history");
    };

    const loadHistoryItem = (item: SummaryHistory) => {
        setSummary(item.summary);
        setFile({ name: item.fileName, size: 0 } as File); // Mock file object for display
        setActiveTab("new");
        toast.success("Summary loaded!");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setSummary(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(getApiUrl('/summarize'), {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            const summaryText = data.summary || "No summary generated.";
            setSummary(summaryText);
            saveToHistory(file.name, summaryText);
            toast.success("Summary generated!");
        } catch (error) {
            console.error("Upload Error:", error);
            setSummary("Error uploading file. Please ensure the backend is running.");
            toast.error("Generation failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        if (!summary) return;
        
        const doc = new jsPDF();
        
        // Add Title
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Legal Compass Summary", 105, 20, { align: "center" });

        // Add Metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Source: ${file?.name || 'Unknown'}`, 15, 30);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
        
        // Robust Text Cleaning
        let cleanText = summary
            // Replace fancy bullets/headers markers with standard text
            .replace(/Ø=ÜÌ/g, "•") // Specific artifact seen
            .replace(/Ø=ÜÑ/g, "• Sect") // Specific artifact seen
            .replace(/&–þ/g, "•") // Specific artifact seen
            .replace(/Ø=ÜÚ/g, "•") // Specific artifact seen
            .replace(/Ø=Ý\./g, "•") // Specific artifact seen
            .replace(/\*\*/g, "") // Bold
            .replace(/\*/g, "")   // Italic
            .replace(/#{1,6}\s/g, "") // Headers
            .replace(/`/g, "")    // Code
            .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
            // Remove other non-standard characters but keep Hindi (\u0900-\u097F) and basic punctuation
            .replace(/[^\x20-\x7E\n\r\t\u0900-\u097F•]/g, "");

        // Ensure single newlines where double might exist from replacement
        cleanText = cleanText.replace(/\n\n+/g, "\n\n");

        // Add Content
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        const splitText = doc.splitTextToSize(cleanText, 180);
        
        let y = 50;
        const pageHeight = doc.internal.pageSize.height;
        const lineHeight = 7;
        
        splitText.forEach((line: string) => {
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 15, y);
            y += lineHeight;
        });

        // Add Footer
        const totalPages = doc.getNumberOfPages();
        for(let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Generated by Legal Compass AI - Not legal advice.", 105, pageHeight - 10, { align: 'center' });
        }
        
        doc.save(`Summary_${file?.name || 'doc'}.pdf`);
        toast.success("PDF Downloaded");
    };

    const handleReset = () => {
        setFile(null);
        setSummary(null);
    };

    return (
        <div className="min-h-screen bg-[#09090B] text-white selection:bg-purple-500/30">
            <Header />

            {/* Focus Mode Overlay */}
            {isFocusMode && summary && (
                <div className="fixed inset-0 z-[100] bg-[#09090B] p-6 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
                    <div className="container max-w-5xl mx-auto min-h-full flex flex-col">
                        <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#09090B]/95 backdrop-blur py-4 z-10 border-b border-white/10">
                            <h2 className="text-xl font-medium text-white/80 flex items-center gap-2">
                                <Maximize2 className="w-5 h-5 text-purple-400" />
                                Full Screen View
                            </h2>
                            <div className="flex gap-3">
                                <Button 
                                    onClick={handleDownload} 
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
                        <div className="flex-1 bg-[#18181b] border border-white/10 rounded-xl p-8 shadow-2xl">
                             <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed">
                                <ReactMarkdown>{summary}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container max-w-6xl mx-auto pt-24 pb-20 px-4 md:px-6">
                
                {/* Hero Header */}
                <div className="flex flex-col items-center justify-center text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-4 tracking-tight">
                        Legal Summarizer
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                        Upload complex judgments or contracts to get concise, actionable summaries instantly.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Left Column: Input / History */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 bg-[#18181b] border border-white/10 mb-6">
                            <TabsTrigger value="new" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300">New Summary</TabsTrigger>
                            <TabsTrigger value="history" className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300">History</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="new" className="mt-0 h-full">
                            <Card className="bg-[#18181b] border-white/10 shadow-2xl h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Upload className="w-5 h-5 text-purple-400" />
                                        Upload Document
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Support for PDF, DOCX, and TXT files.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div 
                                        className={cn(
                                            "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all cursor-pointer",
                                            dragActive ? "border-purple-500 bg-purple-500/10" : "border-white/10 bg-[#27272a]/50 hover:bg-[#27272a]"
                                        )}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={handleFileChange}
                                            accept=".pdf,.docx,.txt"
                                        />
                                        
                                        {!file ? (
                                            <div className="text-center p-6">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Upload className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-500">Maximum file size 10MB</p>
                                            </div>
                                        ) : (
                                            <div className="text-center p-6 animate-in fade-in zoom-in-95">
                                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <p className="text-sm font-medium text-white mb-1 break-all max-w-[200px] mx-auto">{file.name}</p>
                                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                <button 
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFile(null); setSummary(null); }}
                                                    className="mt-3 text-xs text-red-400 hover:text-red-300 z-20 relative"
                                                >
                                                    Remove File
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleUpload}
                                        disabled={isUploading || !file}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-md font-medium shadow-lg hover:shadow-purple-500/25"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Analyzing & Summarizing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                Generate Summary
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 h-full">
                             <Card className="bg-[#18181b] border-white/10 shadow-2xl h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <History className="w-5 h-5 text-purple-400" />
                                        Summary History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {history.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500">
                                            <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p>No processed documents.</p>
                                        </div>
                                    ) : (
                                        history.map((item) => (
                                            <div key={item.id} className="group p-4 rounded-xl bg-[#27272a]/50 border border-white/5 hover:border-purple-500/30 hover:bg-[#27272a] transition-all cursor-pointer relative" onClick={() => loadHistoryItem(item)}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-purple-400" />
                                                        <span className="text-sm font-medium text-gray-200 truncate max-w-[150px]">
                                                            {item.fileName}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {item.dateStr}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={(e) => deleteHistoryItem(item.id, e)}
                                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400 transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Right Column: Output */}
                    <div className="h-full">
                        <Card className="bg-[#18181b] border-white/10 shadow-2xl h-full flex flex-col animate-in fade-in zoom-in-95 duration-300 min-h-[600px]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
                                <div>
                                    <CardTitle className="text-white">AI Analysis</CardTitle>
                                    <CardDescription className="text-gray-400 text-xs mt-1">
                                        Generated summary and key insights.
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setIsFocusMode(true)}
                                        disabled={!summary}
                                        className="text-gray-400 hover:text-white"
                                        title="Full Screen"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleDownload}
                                        disabled={!summary}
                                        className="gap-2 border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden relative">
                                {summary ? (
                                    <div className="w-full h-full min-h-[400px] border-0 bg-[#18181b] text-gray-300 font-sans text-sm leading-relaxed p-8 overflow-y-auto custom-scrollbar">
                                         <div className="prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{summary}</ReactMarkdown>
                                         </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#18181b]/50">
                                         <div className="p-4 rounded-full bg-white/5 mb-4">
                                            <Sparkles className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-gray-300 font-medium mb-2">Ready to Analyze</h3>
                                        <p className="text-gray-500 text-sm max-w-xs">
                                            Upload a document to view its legislative summary, case laws, and key points here.
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
export default SummarizePage;
