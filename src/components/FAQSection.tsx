
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Link } from 'react-router-dom'

export default function FAQSection() {
    const faqItems = [
        {
            id: 'item-1',
            question: 'How accurate is the legal information provided?',
            answer: 'LegalAi achieves 98% accuracy by retrieving answers strictly from the official Bharatiya Nyaya Sanhita (BNS), IPC, and Supreme Court judgments. Our RAG engine prevents hallucinations by citing verified sources for every claim.',
        },
        {
            id: 'item-2',
            question: 'Can I compare old IPC sections with new BNS laws?',
            answer: 'Yes! Our "Compare" feature allows you to instantly map sections from the Indian Penal Code (IPC) to the new Bharatiya Nyaya Sanhita (BNS), highlighting key changes, penalties, and illustrations side-by-side.',
        },
        {
            id: 'item-3',
            question: 'Is this tool a substitute for a lawyer?',
            answer: 'No. LegalAi is an assistive research tool designed to help lawyers, students, and citizens understand the law faster. It does not provide legal advice or representation in court.',
        },
        {
            id: 'item-4',
            question: 'Can I use it in Hindi or other languages?',
            answer: 'Yes, the platform supports bilingual queries (English & Hindi) to make legal knowledge accessible to a wider audience across India.',
        },
        {
            id: 'item-5',
            question: 'Where does the case law data come from?',
            answer: 'Our database indexes over 10,000 verified judgments from the Supreme Court of India and High Courts, updated regularly to ensure you cite the most relevant precedents.',
        },
    ]

    return (
        <section className="py-24 md:py-32 bg-[#09090B] text-[#f8f8f8]">
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl font-serif whitespace-nowrap">Frequently Asked Questions</h2>
                    <p className="text-[#f8f8f8]/60 mt-4 text-balance">
                        Clear answers about our AI, the new criminal laws, and how we ensure accuracy.
                    </p>
                </div>

                <div className="mx-auto mt-12 max-w-xl">
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                    >
                        {faqItems.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="border-b border-[#f8f8f8]/10"
                            >
                                <AccordionTrigger className="cursor-pointer text-base md:text-lg hover:no-underline hover:text-purple-400 transition-colors text-left">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-sm md:text-base text-[#f8f8f8]/70 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <p className="text-[#f8f8f8]/50 mt-10 text-center text-sm">
                        Still have questions? Chat with our{' '}
                        <Link
                            to="/assistant"
                            className="text-purple-400 font-medium hover:underline">
                            AI Assistant
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    )
}
