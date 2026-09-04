import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import ConsultationForm from './ConsultationForm';

export default function FAQConsultationSection() {
  const faqItems = [
    {
      id: 'item-1',
      question: 'How accurate is the legal information provided?',
      answer: 'LegalAi retrieves information from verified statutes and Supreme Court judgments. All outputs are informational and should be reviewed by a legal professional for case-specific advice.',
    },
    {
      id: 'item-2',
      question: 'Can I compare old IPC sections with new BNS laws?',
      answer: 'Yes! The Compare tool maps IPC sections to BNS equivalents, highlighting key changes and penalties. This is for reference purposes and should be verified for legal proceedings.',
    },
    {
      id: 'item-3',
      question: 'Is this tool a substitute for a lawyer?',
      answer: 'No. LegalAi is a research assistant, not a substitute for professional legal counsel. Always consult a qualified lawyer for case-specific advice and representation.',
    },
    {
      id: 'item-4',
      question: 'Can I use it in Hindi or other languages?',
      answer: 'Yes, the platform supports English and Hindi queries to improve accessibility. Responses are generated from official legal texts in both languages where available.',
    },
    {
      id: 'item-5',
      question: 'Where does the case law data come from?',
      answer: 'We index verified judgments from the Supreme Court and High Courts. The database is regularly updated, but always cross-check citations for legal submissions.',
    },
    {
      id: 'item-6',
      question: 'How do I draft legal documents using LegalAi?',
      answer: 'The Draft tool generates legal document templates based on Indian law. All AI-generated drafts should be reviewed and customized by a legal professional before use.',
    },
    {
      id: 'item-7',
      question: 'Can I summarize long legal documents?',
      answer: 'Yes! The Summarize feature extracts key points from legal documents. Summaries are for quick reference and do not replace thorough document review.',
    },
    {
      id: 'item-8',
      question: 'Is my data secure and confidential?',
      answer: 'Yes. Queries are processed securely and we do not store personal legal information. However, consultation requests are shared with verified partner lawyers.',
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-[#09090B] text-[#f8f8f8]">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl font-serif">
            Help, Answers & Legal Support
          </h2>
          <p className="text-[#f8f8f8]/60 mt-4 text-balance">
            Get answers instantly or connect with verified legal professionals
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: FAQ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
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

            <p className="text-[#f8f8f8]/50 mt-8 text-sm">
              Still have questions? Chat with our{' '}
              <Link
                to="/chat"
                className="text-purple-400 font-medium hover:underline"
              >
                AI Assistant
              </Link>
            </p>
          </motion.div>

          {/* Right Column: Consultation Form */}
          <div>
            <ConsultationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
